# Modelo de Amenazas Lite — Sistema de Turnos

**TP4 · 2026-10-14 · Metodología: STRIDE (simplificada)**

Alcance: los **5 endpoints críticos** de `docs/arquitectura/api-contracts.yaml`. Cada amenaza tiene una **mitigación ubicable** (endpoint, capa del código o regla del arnés), no genérica.

> **Estado de aplicación (actualizado Sprint 3).** Aplicadas en código: validación de borde y envelope, bcrypt y mensaje uniforme (T-01/T-05), **autorización por rol en middleware** (T-02/T-07), **rate-limit** por IP en login/registro/reserva y **body-limit** (T-01/T-06), **audit log** en cambios de estado (T-04). Verificables en `server/middlewares/auth.ts`, `server/middlewares/rate-limit.ts`, `server/routes/turnos.ts`, `server/services/audit.ts` y `server/index.ts`. Esta tabla es la fuente que alimenta el área **Seguridad (15%)** de la evaluación.

## Endpoints en alcance

| # | Endpoint | Superficie |
|---|---|---|
| 1 | `POST /auth/login` | Público (sin token) |
| 2 | `GET /servicios` | Lectura catálogo |
| 3 | `GET /profesionales/{id}/disponibilidad` | Lectura por ID |
| 4 | `POST /turnos` | Escritura (reserva) |
| 5 | `PATCH /turnos/{id}/estado` | Escritura por ID |

## Tabla STRIDE

| ID | Categoría | Amenaza concreta | Endpoint | Mitigación | Dónde se aplica |
|---|---|---|---|---|---|
| **T-01** | **S**poofing | Fuerza bruta / credential stuffing contra `login` para adivinar la contraseña de un cliente. | 1 | Contraseña hasheada con bcrypt (no reversible) + **rate-limit por IP** en el login (p. ej. 5 intentos/min) y respuesta uniforme "Credenciales inválidas" sin distinguir si el email existe. | `server/routes/auth.ts` (bcrypt ✓, mensaje uniforme ✓) · rate-limit: `server/middlewares/rate-limit.ts` (5/min) ✓ |
| **T-02** | **T**ampering | **IDOR**: un cliente autenticado reserva a nombre de otro manipulando `clienteId` en el body de `POST /turnos`. | 4 | Ignorar `clienteId` del body y tomar el `sub` del **JWT** como identidad; validar que el cliente solo cree turnos propios. | `server/routes/turnos.ts` + `authRequired` inyecta `req.userId` desde el JWT ✓. Regla de arnés v3: "validar y sanear toda entrada externa en el borde". |
| **T-03** | **T**ampering | Manipular `servicioId`/`profesionalId` para alterar precio/duración o saltar la disponibilidad, enviando el turno a una franja no habilitada. | 4 | El backend recalcula `horaFin` desde el servicio real y valida superposición contra los turnos del día (regla pura `seSuperponen`), sin confiar en datos derivados del cliente. | `server/routes/turnos.ts` (`calcularHoraFin`/`seSuperponen` ✓) — regla en `server/utils/turnos-rules.ts` |
| **T-04** | **R**epudiation | Un usuario niega haber cancelado/modificado un turno; no queda trazabilidad del cambio de estado. | 5 | Registrar **audit log** (timestamp, usuario del JWT, turno, estado anterior→nuevo) al actualizar estado. | `server/routes/turnos.ts` → tabla `AuditLog` + `server/services/audit.ts` ✓ |
| **T-05** | **I**nfo disclosure | Fuga de datos sensibles: el hash de password de `Usuario` podría viajar en respuestas que incluyen relaciones (p. ej. `cliente` embebido en turnos). | 2, 3, 4, 5 | Usar `select` explícito en Prisma para exponer solo `id/nombre/email` del cliente; nunca serializar `password`. | `server/routes/turnos.ts` (`include: { cliente: { select: {...} } }` ✓) · regla de arnés: PROHIBIDO hardcodear/exponer credenciales |
| **T-06** | **D**oS | Sin límite de peticiones, un atacante satura `POST /turnos` (creación masiva) o `login`, degradando el servicio. | 1, 4 | **Rate-limit** por IP + `express.json({ limit })` para acotar el tamaño del body; validación temprana de campos obligatorios que corta peticiones basura. | `server/index.ts` (body limit 100kb ✓) · `server/middlewares/rate-limit.ts` ✓ · validación de campos ✓ en cada ruta |
| **T-07** | **E**levation of privilege | Un usuario `CLIENTE` invoca endpoints administrativos (p. ej. `PUT /profesionales/{id}/disponibilidad`, alta/baja de servicios) y escala privilegios. | 3 y rutas admin | Middleware de **autorización por rol**: exigir `rol === "ADMIN"` en rutas de administración; el rol viaja firmado en el JWT. | `server/middlewares/auth.ts` (`adminRequired`/`requireRole("ADMIN")` ✓). Regla de arnés v3: contrato antes de implementar. |
| **T-08** | **I**nfo disclosure (XSS) | Robo del JWT guardado en `localStorage` mediante XSS inyectado por datos reflejados. | Cliente SPA | Escapar todo dato renderizado (React lo hace por defecto), evitar `dangerouslySetInnerHTML`, y **CSP** restrictiva en el deploy. | `client/src/` (sin `dangerouslySetInnerHTML` ✓) · CSP: headers en el deploy (Sprint 3, ver ADR-005) |

Cobertura STRIDE: **S**poofing (T-01), **T**ampering (T-02, T-03), **R**epudiation (T-04), **I**nfo disclosure (T-05, T-08), **D**oS (T-06), **E**levation (T-07) → **8 amenazas** sobre los 5 endpoints (≥ 5 exigidas).

## Top-3 (resueltas en Sprint 3)

1. **T-02 / T-07 — Autorización: ✅ aplicada.** `authRequired` + `adminRequired`/`requireRole` en `server/middlewares/auth.ts`; identidad desde el JWT y mutaciones de servicios/profesionales/turnos reservadas a ADMIN.
2. **T-01 / T-06 — Rate-limit: ✅ aplicado.** `createRateLimiter` en `server/middlewares/rate-limit.ts` (login 5/min, registro 10/min, reserva 20/min) + `express.json({ limit: "100kb" })` en `server/index.ts`.
3. **T-04 — Audit log: ✅ aplicado.** `AuditLog` (Prisma) + `registrarAuditoria` en `server/services/audit.ts`, invocado en `PATCH /turnos/{id}/estado`.

Pendiente para el deploy (Sprint 3, Fase 4): **CSP** restrictiva (T-08).

## Relación con el arnés v3

Las reglas operativas añadidas a `.opencoderules` dan soporte transversal a estas mitigaciones: prohibición de secrets hardcodeados (T-05), validación/saneo de entrada en el borde (T-02/T-03/T-06) y contrato-antes-de-código (todas).
