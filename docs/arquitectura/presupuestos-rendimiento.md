# Presupuestos de Rendimiento — Pantallas Críticas

**Sprint 3 / TP5** · Operacionaliza el ADR-006 (responsive web) y da números verificables a los RNF-01…RNF-03 de la SPEC.

Pantallas cubiertas (las 2 críticas del TP3):

1. **Reserva de turno** (`/` autenticado como CLIENTE — el "vientre del negocio", RF-04).
2. **Mis turnos** (listado propio del cliente, RF-07; equivalente móvil de la agenda del admin).

Perfil de medición: **mobile**, red **4G** simulada, CPU **4× ralentizada**, viewport **360×800**. Un presupuesto solo vale si se mide con el perfil declarado.

## Tabla de presupuestos

| ID | Métrica | Presupuesto | Cómo se mide (herramienta concreta) | Pantalla |
|---|---|---|---|---|
| **RNF-01** | **LCP móvil** (Largest Contentful Paint) | **< 2.5 s** (4G) | **Lighthouse CI** (`@lhci/cli`), preset mobile + throttling 4G; mediana de 3 corridas | Reserva de turno |
| **RNF-02** | **INP** (Interaction to Next Paint) | **< 200 ms** | **Event Timing vía CDP** (click primario, CPU 4× y red emulada); Lighthouse de navegación no expone INP | Reserva de turno / Mis turnos |
| **RNF-03** | **Peso inicial JS** | **< 200 KB gzip** | `source-map-explorer` para el desglose + **script `npm run budget`** (gzip real de `dist/assets/*.js`) | Ambas (bundle compartido) |
| **RNF-04** | **Sin scroll horizontal** en 360 px | **0 px** de desborde | Revisión con DevTools responsive (360×800); verificado también por CA-07 | Ambas |

> El presupuesto de **peso JS** y el **LCP/CLS de la pantalla de entrada** corren en CI de forma automática (TP6); las pantallas autenticadas se miden localmente porque requieren API + base de datos, con el método documentado en `docs/deploy/evidencia/README.md`.

## Herramientas y comandos

### Peso inicial JS (corre en CI hoy)

```bash
cd client
npm run build          # genera dist/
npm run budget         # gzip de dist/assets/*.js y falla si supera 200 KB
```

El script `client/scripts/check-budget.mjs` (sin dependencias, Node `zlib`) imprime el peso por archivo y el total. **Es el chequeo que se cablea al CI en el TP6.** Aporte de `source-map-explorer` (opcional, para investigar):

```bash
npx source-map-explorer dist/assets/*.js
```

### LCP (Lighthouse CI, activo en el pipeline)

`lighthouserc.json` fija las *assertions* de la pantalla de entrada y se ejecuta en cada PR a `main`:

```bash
npx -y @lhci/cli@0.15.1 autorun
```

Assertions: `largest-contentful-paint <= 2500`, `cumulative-layout-shift <= 0.1`, `categories:accessibility >= 0.9`.

### LCP de pantallas autenticadas (medición directa)

Las pantallas con sesión necesitan API + base de datos, así que no se sirven con `staticDistDir`. Se miden con Lighthouse 12 + Puppeteer, inyectando `localStorage` **antes** de navegar (sin página-puente) y con `disableStorageReset: true` para que Lighthouse no borre la sesión. El método y los archivos de evidencia están en `docs/deploy/evidencia/README.md`.

### INP (Event Timing, CDP)

Lighthouse de navegación no expone INP; por eso se mide aparte con el protocolo de DevTools (`Event Timing`, click primario, CPU 4× y red emulada). Se reporta el evento de mayor duración como proxy de INP.

## Medición actual (baseline)

Medido el 2026-11-03 sobre el build de producción servido por Express (gzip + caché). Evidencia cruda en `docs/deploy/evidencia/`.

| Métrica | Pantalla | Valor medido | Presupuesto | Estado |
|---|---|---|---|---|
| LCP móvil (Lighthouse 12, medición directa) | Login (entrada) | **1.72 s** | < 2.5 s | ✅ |
| LCP móvil (Lighthouse 12.8, medición directa) | Reserva de turno | **1.91 s** (mediana; máx 2.46 s) | < 2.5 s | ✅ |
| LCP móvil (Lighthouse 12.8, medición directa) | Agenda admin | **1.61 s** (mediana; máx 1.75 s) | < 2.5 s | ✅ |
| INP (Event Timing, click primario, CDP 4× CPU) | Reserva de turno | **160 ms** | < 200 ms | ✅ |
| INP (Event Timing, click primario, CDP 4× CPU) | Agenda admin | **32 ms** | < 200 ms | ✅ |
| Peso inicial JS (gzip) | Ambas | **61.1 KB** | < 200 KB | ✅ |
| Scroll horizontal @360 px | Ambas | **0 px** | 0 px | ✅ |

Evidencia: `docs/deploy/evidencia/lighthouse-*.txt`, `cdp-*.txt`, `budget-js.txt` (y `docs/deploy/deploy.md`).

**Corrección metodológica (TP6):** una medición previa de las pantallas autenticadas usaba una página-puente que redirigía, sumando una navegación al LCP; así se reportó la agenda admin en 2.59 s. Al inyectar la sesión y navegar directo a `/`, el valor real es **1.61 s** (mediana de 3). El gap era de medición, no de código: no se ocultó, se re-midió y se documentó el método en `docs/deploy/evidencia/README.md`.

**Code-splitting evaluado y descartado:** se probó separar `AdminAgenda`, `ReservaForm` y `TurnosList` con `React.lazy`. El LCP no mejoró (1.63→1.77 s, dentro del ruido) y el JS total subió de **61.1 a 63.5 KB gzip** porque React DOM domina el bundle y los *chunks* agregan overhead. Se revirtió: no se justifica complejidad ni bytes extra para una métrica que ya cumple.

El bundle está muy por debajo del límite (≈30 % del presupuesto), lo que deja margen para las pantallas móviles sin renegociar el RNF-03.

## Criterio de aceptación de rendimiento

Un cambio se considera **regresión** si:

- el peso JS gzip supera **200 KB** (el script `budget` falla y bloquea el merge), o
- LCP móvil supera **2.5 s** o INP supera **200 ms** en el reporte de Lighthouse CI (TP6), o
- aparece scroll horizontal a **360 px**.

En cualquiera de esos casos se revierte o se optimiza antes de mergear; no se "acepta" el número peor.
