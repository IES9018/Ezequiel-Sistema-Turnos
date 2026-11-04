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

| Métrica | Valor medido | Fecha | Estado |
|---|---|---|---|
| Peso inicial JS (gzip) | **61.1 KB** | 2026-11-03 | ✅ dentro de presupuesto (200 KB) |
| LCP móvil | *pendiente de Lighthouse en deploy/TP6* | — | ⏳ |
| INP | *pendiente de Lighthouse en deploy/TP6* | — | ⏳ |
| Scroll horizontal @360 px | 0 px (revisión responsive) | 2026-11-03 | ✅ |

El bundle está muy por debajo del límite (≈30 % del presupuesto), lo que deja margen para las pantallas móviles sin renegociar el RNF-03.

## Criterio de aceptación de rendimiento

Un cambio se considera **regresión** si:

- el peso JS gzip supera **200 KB** (el script `budget` falla y bloquea el merge), o
- LCP móvil supera **2.5 s** o INP supera **200 ms** en el reporte de Lighthouse CI (TP6), o
- aparece scroll horizontal a **360 px**.

En cualquiera de esos casos se revierte o se optimiza antes de mergear; no se "acepta" el número peor.
