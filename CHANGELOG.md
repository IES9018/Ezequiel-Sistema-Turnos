# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado adopta [SemVer](https://semver.org/lang/es/).

## [0.1.0] - 2026-11-03

Primera release del Sistema de Turnos para peluquería/barbería: reserva online, agenda administrativa, seguridad aplicada y despliegue reproducible.

### Added

- Autenticación con JWT + bcrypt y registro/login de usuarios con roles `ADMIN`/`CLIENTE` (RF-09).
- Reserva de turnos seleccionando servicio, profesional, fecha y franja horaria disponible (RF-03, RF-04).
- Listado de turnos del cliente autenticado.
- Agenda diaria del administrador ordenada por hora, con etiqueta legible e ícono por estado (RF-06, CA-03).
- Endpoint de salud `GET /api/health`.
- Seed idempotente con usuarios, servicios y disponibilidad de demo (`npm run db:seed`).
- Script `npm run budget` que verifica el peso JS inicial (< 200 KB gzip) sobre el build real.
- Configuración de Lighthouse CI (`lighthouserc.json`) con presupuestos de LCP, CLS y accesibilidad.
- Pipeline de GitHub Actions con lint de OpenAPI, typecheck/build, tests de server y client, presupuesto JS y Lighthouse.
- Despliegue reproducible con `Dockerfile` multi-stage, `docker-compose.yml` (app + PostgreSQL 16) y `.dockerignore`.
- Guía de despliegue con smoke tests y evidencia de medición en `docs/deploy/`.

### Changed

- Contrato OpenAPI **v1.1.0**: `GET /turnos` acepta `?fecha=YYYY-MM-DD` con alcance por rol; `TurnoRequest` deja de aceptar `clienteId`.
- La SPA compilada se sirve desde Express en producción con compresión gzip y caché de assets.
- La SPEC queda **congelada para la defensa** con trazabilidad SPEC ↔ ADR ↔ restricciones y presupuestos RNF.

### Fixed

- Helper `rutaParam` para conservar la inferencia de `req.params` al agregar middlewares en Express 5.
- Actualización de fecha de la agenda sin `set-state-in-effect` (manejador explícito).
- Formulario de reserva con estructura estable desde el primer render (skeleton) para no penalizar el LCP.

### Security

- Autorización por rol en middleware, identidad tomada siempre del JWT y mitigación de IDOR/BOLA.
- Rate-limit por IP en login y creación de turnos, y límite de body de 100 KB.
- Traza de auditoría en cambios de estado de turnos (`AuditLog`).
- El hash de contraseña nunca se serializa en respuestas.
- Cabeceras de seguridad y CSP estricta (`server/middlewares/security-headers.ts`).
- Modelo de amenazas STRIDE T-01…T-08 con mitigaciones aplicadas en código.

### Documentation

- ADR-001…ADR-006 (stack, estilo arquitectónico, persistencia, autenticación, contratos y estrategia mobile).
- Contratos API-First, diagramas C4, presupuestos de rendimiento y Non-Goal de offline.
- Wireframes móviles de reserva y mis turnos.
- Informes de auditoría por sprint y postmortem del cuatrimestre.
