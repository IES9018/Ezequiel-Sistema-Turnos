# Auditoría Crítica — Sprint 3

**Estudiante:** Ezequiel (Ezem700)
**Proyecto:** Sistema de Turnos — Peluquería/Barbería
**Fecha:** 2026-11-03
**Sprint:** 3 (19 oct – 13 nov) — Seguridad, Despliegue y Evidencia Medible

---

## 1. Resumen del Sprint 3

- **Contratos antes que código (DEL-S3-01):** contrato OpenAPI a **v1.1.0** (auth por rol, `403`, `429`, `GET /turnos` con alcance por rol, `clienteId` fuera de `TurnoRequest`), linter Redocly sin errores. (PR [#15](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/15))
- **Seguridad aplicada (DEL-S3-02):** mitigaciones del threat model **en código** — `authRequired`/`adminRequired`, rate-limit por IP, body-limit, audit log `AuditLog`, identidad desde el JWT. (PR [#15](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/15))
- **Interfaz crítica:** agenda diaria del administrador (RF-06/CA-03) con estado legible + marca no dependiente del color. (PR [#16](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/16))
- **Mobile medible (consume TP5):** ADR-006, presupuestos de rendimiento, Non-Goal de offline, wireframes móviles y SPEC v6. (PR [#17](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/17))
- **Despliegue (DEL-S3-04):** artefacto reproducible (Dockerfile/compose), servido de SPA en producción con CSP (T-08), seed y guía `docs/deploy/deploy.md`. (PR [#18](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/18))
- **Presupuestos medidos (DEL-S3-03):** evidencia en `docs/deploy/evidencia/` (Lighthouse + Event Timing + budget JS).

---

## 2. Auditoría de código asistido por IA

Piezas generadas con **OpenCode (big-pickle)** y **auditadas línea por línea** antes de cada commit. Se listan los incidentes reales y su corrección.

### 2.1 Express 5 rompe la inferencia de `req.params` al agregar middleware

- **Prompt:** "Protegé `GET/PATCH/DELETE /turnos/:id` con `authRequired`/`adminRequired` y ownership".
- **Error detectado (lo atrapó `tsc`):** al pasar de `router.get(":id", handler)` a `router.get(":id", mw, handler)`, Express 5 infiere `req.params.id` como `string | string[] | undefined` y el build falla (TS2412) al usarlo.
- **Corrección:** helper `rutaParam(req, "id")` en `server/utils/http.ts`, que normaliza el parámetro a `string`. Se agregó test unitario (`tests/server/http.test.ts`).
- **Evidencia:** PR [#15](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/15).

### 2.2 `set-state-in-effect` en la agenda admin (oxlint)

- **Prompt:** "Creá `AdminAgenda` que cargue los turnos del día elegido".
- **Error detectado:** la versión inicial hacía `setCargando(true)`/`setError('')` **sincrónicamente dentro del `useEffect`**; `oxlint` lo marcó (`react(set-state-in-effect)`), riesgo de renders en cascada.
- **Corrección:** el estado de carga/error se actualiza en el **manejador del cambio de fecha** (`cambiarFecha`) y solo en los callbacks async; el efecto quedó limpio. Lint sin warnings.
- **Evidencia:** PR [#16](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/16).

### 2.3 `clienteId` remanente en `ReservaForm` tras alinear el contrato

- **Error detectado:** al quitar `clienteId` de `TurnoRequest` (mitigación IDOR T-02), la IA eliminó el prop de `ReservaForm` pero **dejó la referencia en el objeto de `api.reservar(...)`**. Lo detectó el build (`tsc`: TS18004/TS2353) y, en runtime de tests, un `ReferenceError`.
- **Corrección:** se eliminó la referencia y se actualizaron `App.tsx` y los tests que pasaban el prop. El backend toma la identidad del JWT.
- **Evidencia:** PRs [#15](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/15) y [#16](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/16).

### 2.4 Medición de rendimiento: interacción equivocada y redirección que inflaba el LCP

- **Error detectado (metodológico):** la primera medición de INP con CDP hacía click en el **primer botón**, que resultó ser **"Salir"** (logout → re-render completo), dando 392 ms y una conclusión falsa. Además, medir las pantallas autenticadas vía página-puente con redirección sumaba una navegación extra al LCP.
- **Corrección:** se midió la **interacción primaria** (botón "Confirmar reserva" / selector de fecha) y se separó la medición: Lighthouse para LCP y Event Timing vía CDP para INP. INP resultante: **160 ms** (reserva) y **32 ms** (agenda), dentro de presupuesto.
- **Evidencia:** `docs/deploy/evidencia/cdp-*.txt`; PR [#18](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/18).

### 2.5 LCP de la agenda admin por encima del objetivo (brecha declarada)

- **Hallazgo:** con Lighthouse mobile, la agenda admin mide **2.59 s** de LCP contra un objetivo de **2.5 s** (+88 ms, +3.5 %), con TBT ≈ 732 ms. La causa es el costo de ejecución del bundle en CPU 4× (el LCP es el primer render de React tras el JS).
- **Decisión:** no se maquilló el número. Se registró como **deuda medida** en `docs/arquitectura/presupuestos-rendimiento.md` con plan de remediación para el TP6 (code-splitting con `React.lazy` de la vista admin, precarga de chunk, shell estático). La reserva de turno (camino principal) cumple: **2.49 s**.
- **Evidencia:** PR [#18](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/18).

### 2.6 Despliegue sin Docker en el entorno de desarrollo

- **Restricción detectada:** la máquina no tiene Docker, así que no se pudo ejecutar el `docker compose` end-to-end.
- **Corrección/registro:** se entregó el **artefacto reproducible** (Dockerfile multi-stage + compose) y se **verificó el equivalente local** (build server/cliente + `node dist/index.js` en `NODE_ENV=production`), con smoke tests de salud, login, CSP y compresión. La limitación y el `db push` (vs. migraciones) quedan explícitos en la retroalimentación de `docs/deploy/deploy.md`.
- **Evidencia:** PR [#18](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/18).

---

## 3. Estado de seguridad (al cierre del Sprint 3)

El threat model (`docs/seguridad/threat-model-lite.md`) tiene **8 amenazas STRIDE (T-01…T-08), todas con mitigación aplicada en el código**:

| Amenaza | Mitigación aplicada | Ubicación |
|---|---|---|
| T-01 Spoofing | JWT con `getJwtSecret()` obligatorio; bcrypt | `server/config/env.ts`, `server/routes/auth.ts` |
| T-02/T-03 Tampering (IDOR, franja) | Identidad desde JWT; `horaFin` recalculado; `seSuperponen` | `server/routes/turnos.ts`, `server/utils/turnos-rules.ts` |
| T-04 Repudiation | `AuditLog` + `registrarAuditoria` en cambios de estado | `server/services/audit.ts` |
| T-05 Info disclosure | `select` explícito; nunca se serializa `password` | `server/routes/turnos.ts` |
| T-06 DoS | Rate-limit por IP + body-limit 100 KB | `server/middlewares/rate-limit.ts`, `server/index.ts` |
| T-07 Elevation | `adminRequired`/`requireRole("ADMIN")` | `server/middlewares/auth.ts` |
| T-08 XSS | React escapa; sin `dangerouslySetInnerHTML`; **CSP restrictiva** | `server/middlewares/security-headers.ts` |

**Contrato:** API-First — `docs/arquitectura/api-contracts.yaml` v1.1.0 es la fuente de verdad (linter Redocly limpio).

---

## 4. Calidad automatizada y evidencia medible

- **Tests:** server **36/36** (6 archivos) y client **14/14** (2 archivos), local y en CI.
- **Build/TypeScript estricto:** `npm run build` (server) y `tsc -b` (client) sin errores; `noUncheckedIndexedAccess`/`exactOptionalPropertyTypes`.
- **Lint:** oxlint sin warnings; Redocly sin errores.
- **Presupuestos (medidos):** LCP login **1.72 s** ✅, reserva **2.49 s** ✅, agenda admin **2.59 s** ⚠️ (+88 ms); INP click **160 ms** / **32 ms** ✅; JS **61.1 KB gzip** ✅ (<200); scroll horizontal @360 px **0** ✅.
- **Checklists de PR:** plantilla + Quality/Security Gate en PRs #15–#18, con CI verde y self-merge.

---

## 5. Conclusiones

El Sprint 3 cierra con los cinco entregables formales cubiertos: **DEL-S3-01** (API según contrato), **DEL-S3-02** (threat model aplicado), **DEL-S3-03** (presupuestos medidos con evidencia), **DEL-S3-04** (despliegue reproducible) y **DEL-S3-05** (este informe). El sistema pasa de "funcional en local" a **seguro, desplegado y medible**, con una brecha de rendimiento declarada y priorizada en vez de ocultada. La auditoría de la IA encontró errores concretos (inferencia de Express 5, `set-state-in-effect`, prop remanente, medición sesgada) y cada uno quedó corregido con evidencia trazable a PRs.

---

## 6. Evidencia

- Repo: https://github.com/IES9018/Ezequiel-Sistema-Turnos
- PRs del Sprint 3: [#15](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/15) (seguridad), [#16](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/16) (agenda admin), [#17](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/17) (TP5 mobile), [#18](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/18) (deploy/CSP/medición).
- Contrato: `docs/arquitectura/api-contracts.yaml` · Threat model: `docs/seguridad/threat-model-lite.md`
- Despliegue: `docs/deploy/deploy.md` · Evidencia: `docs/deploy/evidencia/`
- Presupuestos: `docs/arquitectura/presupuestos-rendimiento.md` · ADR mobile: `docs/adr/ADR-006-estrategia-mobile.md`
- Pipeline CI: https://github.com/IES9018/Ezequiel-Sistema-Turnos/actions
