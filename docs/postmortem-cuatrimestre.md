# Postmortem del cuatrimestre — Sistema de Turnos

> Cierre de ADI (TP6). No es un resumen de features: es el registro de los errores reales que cometió la IA bajo mi dirección, cómo los detecté y qué capa del proceso (SPEC · ADR · arnés · pipeline) los evita a futuro. Cada fila enlaza evidencia verificable.

## 1. Incidentes

| Incidente (evidencia) | Qué generó mal la IA | Cómo se detectó | Qué capa lo previene a futuro |
|---|---|---|---|
| **`req.params` deja de tipar al agregar middlewares** — [PR #15](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/15) | Al proteger rutas con `authRequired`/`adminRequired`, agregó el middleware como argumento extra en `router.get(":id", mw, handler)` y el compilador perdió la inferencia de `req.params` (TS2412). | **Build en CI/local** (`npm run build`, `tsc` estricto): el error de tipos bloqueó el PR antes del merge. | **Pipeline** (typecheck obligatorio) + helper `rutaParam` en `server/utils/http.ts`, que elimina el patrón frágil. |
| **`clienteId` residual tras alinear el contrato** — [PR #16](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/16) | El contrato v1.1.0 quitó `clienteId` de `TurnoRequest` (la identidad sale del JWT), pero la IA dejó el campo en los tipos y en `ReservaForm`; el frontend seguía enviando un dato que ya no correspondía. | **Typecheck + tests de client** al compilar: el tipo `Reserva` y el formulario quedaron inconsistentes con `api.ts`. | **ADR/contrato como fuente de verdad** (API-First) + **pipeline** que compila el client y corre tests. |
| **`set-state-in-effect` en la agenda** — [PR #16](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/16) | Implementó la carga de turnos dentro de un `useEffect` que además hacía `setState`, generando un render en cascada y un warning de lint. | **Lint del client en CI** (`oxlint`): el warning quedó visible y se corrigió con un manejador explícito `cambiarFecha`. | **Pipeline** (lint bloqueante) + **arnés** (estándares de hooks y estado). |
| **Medición de INP/LCP sesgada** — [PR #18](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/18) | La IA reportó INP con Lighthouse de navegación (que no expone INP) y midió pantallas autenticadas con una página-puente que redirigía, inflando el LCP. Los números parecían válidos pero no eran comparables. | **Revisión humana de la metodología**: se contrastó con Event Timing vía CDP y se separó el costo de la redirección. | **Evidencia reproducible** (`docs/deploy/evidencia/`) + documentación de método en `docs/arquitectura/presupuestos-rendimiento.md`; el arnés exige presupuestos medidos, no declarados. |
| **Falso positivo de LCP en la agenda admin** — [PR #18](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/18) | La IA reportó **2.59 s** de LCP (fuera de RNF-01) medido con una página-puente que redirigía; el número era un artefacto de la navegación extra, no del bundle. | **Re-medición en TP6**: sesión inyectada con Puppeteer y navegación directa a `/` → **1.61 s** (mediana de 3). El code-splitting se probó y se descartó (no mejoraba el LCP y sumaba 2.4 KB gzip). | **Evidencia reproducible + método declarado** (`docs/deploy/evidencia/README.md`): el arnés exige medir con la herramienta, el perfil y el punto de entrada definidos. |
| **Entorno Docker no disponible para verificar** — [PR #18](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/18) | La IA asumió que podría levantar `docker compose` para validar el despliegue, pero Docker no estaba instalado en el entorno. El artefacto existía sin prueba de ejecución end-to-end. | **Verificación humana del entorno** al intentar correr compose; se detectó antes de reportar el despliegue como validado. | **Documentación honesta de la brecha** en `docs/deploy/deploy.md` + verificación del camino local equivalente (Express + PostgreSQL + smoke tests). |

## 2. Señales de proceso

- **6 incidentes reales** detectados: 3 por el **pipeline** (typecheck, lint, build), 1 por **tests**, 2 por **revisión humana** de metodología/entorno.
- Ningún incidente llegó a `main`: todos se corrigieron dentro de la rama `feature/*` antes del self-merge.
- La IA fue más confiable cuando el contrato y los tipos ya existían, y más riesgosa cuando tuvo que **inferir metodología** (medición) o **suponer el entorno** (Docker).
- Los presupuestos de rendimiento funcionaron como detector, pero también mostraron que **un número sin método declarado es tan peligroso como no medir**: el falso positivo de LCP solo se resolvió al documentar el punto de entrada.

## 3. Cierre reflexivo — ¿qué haría distinto arrancando de cero?

1. Escribiría el contrato OpenAPI y los tipos compartidos **antes** de cualquier pantalla, para que la IA nunca tenga que inventar la forma de los datos.
2. Automatizaría el pipeline en la primera semana, no en el Sprint 3: typecheck, lint y tests desde el día uno habrían atrapado la mitad de estos incidentes sin intervención humana.
3. Mediría con una metodología fijada de antemano (herramienta + throttling + pantalla) y guardaría la evidencia cruda desde el inicio, en lugar de reconstruirla al final.
4. Trataría el entorno de despliegue como parte del diseño: si Docker no está disponible, lo declararía como restricción y elegiría el camino verificable desde el principio.
5. Y sobre todo, seguiría separando **dirigir** de **teclear**: las decisiones (ADR, contrato, presupuestos) son mías; la IA ejecuta, y el pipeline es quien tiene la última palabra.
