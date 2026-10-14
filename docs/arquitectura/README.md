# Arquitectura — Contratos y Diagramas

Fuente viva de la arquitectura del Sistema de Turnos.

## Contenido

| Archivo | Qué es |
|---|---|
| `C4-contexto.md` | Diagrama C4 nivel 1 (sistema como caja negra, actores, sistemas externos) — TP2 |
| `C4-contenedores.md` | Diagrama C4 nivel 2 (contenedores: SPA, API, base de datos) — TP2 |
| `api-contracts.yaml` | **Contrato OpenAPI 3.1** de los 5 endpoints críticos — TP4 |
| `presupuestos-rendimiento.md` | Presupuestos de rendimiento medibles (LCP/INP/peso JS) — TP5 (pendiente) |

## Contrato API-First (`api-contracts.yaml`)

Define los **6 endpoints críticos** que sostienen los flujos de los journeys del TP3:

| # | Endpoint | Flujo / requisito |
|---|---|---|
| 1 | `POST /auth/login` | Sesión con JWT (RF-09, CA-05) |
| 2 | `GET /servicios` | Catálogo para reservar (RF-01) |
| 3 | `GET /profesionales/{id}/disponibilidad` | Franjas disponibles (RF-03) |
| 4 | `GET /turnos` | Listado por rol: agenda del admin (RF-06/CA-03) o "mis turnos" (v1.1.0) |
| 5 | `POST /turnos` | Reserva + no-superposición (RF-04, CA-01, CA-02) |
| 6 | `PATCH /turnos/{id}/estado` | Cancelación / ciclo de vida (RF-07) |

> **v1.1.0 (Sprint 3):** se agregó `GET /turnos` (alcance según rol), se formalizó la autorización por rol (`bearerAuth` + `403`), el `429` del rate-limit y se quitó `clienteId` de `TurnoRequest` (se toma del JWT, mitiga IDOR T-02).

**Regla del arnés v3:** todo endpoint nuevo debe estar en `api-contracts.yaml` **antes** de implementarse. Los cambios de contrato empiezan en el YAML, no en las rutas Express.

### Validación (linter)

El contrato debe pasar el linter de Redocly sin errores ni warnings:

```bash
npx @redocly/cli@latest lint docs/arquitectura/api-contracts.yaml
```

Resultado esperado:

```
Woohoo! Your API description is valid. 🎉
```

### Envelope de respuesta

Todas las respuestas usan el envelope común definido en `server/utils/responses.ts`:

- Éxito: `{ "success": true, "data": <T> }`
- Error: `{ "success": false, "error": "<mensaje>" }`

Códigos: `200`/`201` éxito, `400` entrada inválida, `401` no autenticado, `404` no encontrado, `409` conflicto de superposición, `500` error interno (CA-06).
