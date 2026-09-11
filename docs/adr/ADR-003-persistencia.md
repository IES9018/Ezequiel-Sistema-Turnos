# ADR-003: Persistencia del Sistema de Turnos

**Fecha:** 2026-09-11
**Estado:** Aceptado
**Supersede:** Ninguno (detalla la capa de datos decidida en ADR-001)

## Contexto

La SPEC define un modelo de datos con entidades relacionadas: `Usuario`, `Servicio`, `Profesional`, `Turno` y `Disponibilidad` (con `@@unique` sobre profesional/día y sobre profesional/fecha/hora). Los criterios de aceptación exigen integridad:

- **CA-02:** el sistema valida que no se superpongan turnos para un mismo profesional (consultas por rango de horas y por fecha).
- **CA-05:** contraseñas hasheadas (bcrypt), nunca en texto plano.
- **CA-06:** la API refleja estados de negocio sobre estas entidades.

La pregunta es qué motor de persistencia sostiene mejor este modelo real, no cuál es el más de moda.

## Decisión

Se persiste en **PostgreSQL 16+**, accedido **exclusivamente a través de Prisma ORM** (tipado fuerte, migraciones versionadas, cliente generado). Esto confirma a nivel de datos la elección de ADR-001 y queda restringido por la R-02 de la SPEC.

### Justificación

- El modelo es **relacional por naturaleza**: turno → cliente/profesional/servicio son relaciones con integridad referencial exigida por la regla de negocio de no-superposición.
- Prisma aporta el `@@unique([profesionalId, fecha, horaInicio])` a nivel de base de datos, respaldo físico (no solo lógico) de CA-02.
- PostgreSQL soporta consultas por rangos y fechas del calendario semanal (Disponibilidad) con un costo de desarrollo bajo.

## Alternativas Descartadas

- **Opción A: MongoDB (NoSQL documental)**
  Se descartó porque las consultas críticas (superposición de turnos por profesional y rango horario, agenda diaria/semanal) y las claves foráneas son relacionales. En un modelo documental la integridad referencial es manual y la validación de solapamientos se vuelve frágil y menos auditable, justo donde CA-02 pone el foco.

- **Opción B: SQLite (embedded)**
  Se descartó como base productiva porque el sistema es multiusuario con agenda compartida: las escrituras concurrentes de SQLite son limitadas y no representan el ambiente de un deploy real (Sprint 3 requiere evidencia de rendimiento). Queda disponible solo como opción de pruebas futuras, no como persistencia del sistema.

## Consecuencias

**Positivas:**
- Esquema tipado y migraciones versionadas con Prisma (diferenciable y auditable en el historial de PRs).
- Integridad de CA-02 respaldada a nivel de base de datos.
- Set de pruebas de Sprint 2: la suite unitaria **mockea `PrismaClient`**, por lo que los tests corren sin requerir una PostgreSQL viva (determinismo local sin infraestructura).

**Negativas / riesgos:**
- Requiere un servidor PostgreSQL en desarrollo. **Mitigación:** setup documentado en el README y soportado por Docker (SPEC, sección Stack).
- Complejidad de schema migrations durante cambios de modelo. **Mitigación:** proceso de migraciones de Prisma versionado en cada feature, revisado en PR.