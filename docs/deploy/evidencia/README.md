# Evidencia de rendimiento — metodología

Esta carpeta guarda la evidencia cruda de los presupuestos RNF-01…RNF-04. Cada archivo declara cómo se midió para que los números sean comparables.

| Archivo | Qué mide | Método |
|---|---|---|
| `lighthouse-login.txt` | LCP de la pantalla de entrada | `@lhci/cli` sobre `client/dist` estático (sin sesión) |
| `lighthouse-reserva.txt` | LCP de la reserva (cliente autenticado) | Lighthouse 12.8 + Puppeteer con `localStorage` inyectado, navegación directa |
| `lighthouse-agenda-admin.txt` | LCP de la agenda (admin autenticado) | Lighthouse 12.8 + Puppeteer con `localStorage` inyectado, navegación directa |
| `cdp-reserva.txt` / `cdp-agenda-admin.txt` | INP por *Event Timing* (click primario) | Chrome DevTools Protocol, CPU 4× y red emulada; el LCP de estos archivos **no** es la medida de RNF-01 |
| `budget-js.txt` | Peso inicial JS (gzip) | `npm --prefix client run budget` sobre el build real |

## Corrección metodológica (TP6)

La primera medición de las pantallas autenticadas usó una **página-puente** que escribía `localStorage` y redirigía a `/`. Esa navegación adicional se contabilizaba en el LCP y lo inflaba (la agenda admin reportó 2.59 s).

La medición corregida inyecta la sesión con `page.evaluateOnNewDocument(...)` y navega **directamente** a `/`, con `disableStorageReset: true` para que Lighthouse no borre el `localStorage`. Resultado: agenda admin **1.61 s** (mediana de 3) y reserva **1.91 s** (mediana de 3), ambas dentro de RNF-01.

> Regla: un presupuesto de rendimiento solo es válido si la herramienta, el perfil (mobile, 4G, CPU 4×) y el punto de entrada (sin navegaciones extra) están declarados.
