# Presupuestos de Rendimiento — Pantallas Críticas

**Sprint 3 / TP5** · Operacionaliza el ADR-006 (responsive web) y da números verificables a los RNF-01…RNF-03 de la SPEC.

Pantallas cubiertas (las 2 críticas del TP3):

1. **Reserva de turno** (`/` autenticado como CLIENTE — el "vientre del negocio", RF-04).
2. **Mis turnos** (listado propio del cliente, RF-07; equivalente móvil de la agenda del admin).

Perfil de medición: **mobile**, red **4G** simulada, CPU **4× ralentizada**, viewport **360×800**. Un presupuesto solo vale si se mide con el perfil declarado.

## Tabla de presupuestos

| ID | Métrica | Presupuesto | Cómo se mide (herramienta concreta) | Pantalla |
|---|---|---|---|---|
| **RNF-01** | **LCP móvil** (Largest Contentful Paint) | **< 2.5 s** (4G) | **Lighthouse CI** (`@lhci/cli`), preset mobile + throttling 4G; p95 de 3 corridas | Reserva de turno |
| **RNF-02** | **INP** (Interaction to Next Paint) | **< 200 ms** | **Lighthouse CI** (tiempos de interacción del reporte) + Chrome DevTools performance con CPU 4× | Reserva de turno / Mis turnos |
| **RNF-03** | **Peso inicial JS** | **< 200 KB gzip** | `source-map-explorer` para el desglose + **script `npm run budget`** (gzip real de `dist/assets/*.js`) | Ambas (bundle compartido) |
| **RNF-04** | **Sin scroll horizontal** en 360 px | **0 px** de desborde | Revisión con DevTools responsive (360×800); verificado también por CA-07 | Ambas |

> El presupuesto de **peso JS** es el que se corre hoy en CI de forma automática (ver abajo); LCP/INP se activan en el pipeline del **TP6** con Lighthouse CI. Los tres quedan preparados para ese paso.

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

### LCP / INP (Lighthouse CI — TP6)

```bash
# contra el preview de producción
cd client && npm run build && npm run preview -- --port 4173 &
npx -y @lhci/cli@latest autorun \
  --collect.url=http://localhost:4173/ \
  --collect.settings.preset=desktop=false \
  --collect.settings.throttlingMethod=simulate
```

Se fija como *assertion* en `lighthouserc.json` (TP6): `largest-contentful-paint <= 2500`, `interaction-to-next-paint <= 200` (o `total-blocking-time` como proxy si la versión de Lighthouse aún no expone INP).

## Medición actual (baseline)

Medido el 2026-11-03 sobre el build de producción servido por Express (gzip + caché). Evidencia cruda en `docs/deploy/evidencia/`.

| Métrica | Pantalla | Valor medido | Presupuesto | Estado |
|---|---|---|---|---|
| LCP móvil (Lighthouse 12) | Login (entrada) | **1.72 s** | < 2.5 s | ✅ |
| LCP móvil (Lighthouse 12) | Reserva de turno | **2.49 s** | < 2.5 s | ✅ (al límite) |
| LCP móvil (Lighthouse 12) | Agenda admin | **2.59 s** | < 2.5 s | ⚠️ +88 ms |
| INP (Event Timing, click primario, CDP 4× CPU) | Reserva de turno | **160 ms** | < 200 ms | ✅ |
| INP (Event Timing, click primario, CDP 4× CPU) | Agenda admin | **32 ms** | < 200 ms | ✅ |
| Peso inicial JS (gzip) | Ambas | **61.1 KB** | < 200 KB | ✅ |
| Scroll horizontal @360 px | Ambas | **0 px** | 0 px | ✅ |

Evidencia: `docs/deploy/evidencia/lighthouse-*.txt`, `cdp-*.txt`, `budget-js.txt` (y `docs/deploy/deploy.md`).

**Brecha declarada (RNF-01, agenda admin):** 2.59 s vs 2.5 s (+3.5 %), atribuible al costo de ejecución del bundle en CPU 4× (TBT ≈ 732 ms). No se oculta: plan de remediación para el TP6 con *code-splitting* (`React.lazy` de la vista admin), precarga del chunk y shell estático. La pantalla de reserva (camino principal del negocio) sí cumple.

El bundle está muy por debajo del límite (≈30 % del presupuesto), lo que deja margen para las pantallas móviles sin renegociar el RNF-03.

## Criterio de aceptación de rendimiento

Un cambio se considera **regresión** si:

- el peso JS gzip supera **200 KB** (el script `budget` falla y bloquea el merge), o
- LCP móvil supera **2.5 s** o INP supera **200 ms** en el reporte de Lighthouse CI (TP6), o
- aparece scroll horizontal a **360 px**.

En cualquiera de esos casos se revierte o se optimiza antes de mergear; no se "acepta" el número peor.
