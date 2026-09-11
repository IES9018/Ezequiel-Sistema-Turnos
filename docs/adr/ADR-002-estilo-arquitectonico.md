# ADR-002: Estilo Arquitectónico del Sistema de Turnos

**Fecha:** 2026-09-11
**Estado:** Aceptado
**Supersede:** Ninguno (complementa ADR-001)

## Contexto

El Sistema de Turnos de Peluquería/Barbería debe elegir un estilo arquitectónico que soporte su ciclo de vida completo en PP3. Las restricciones reales son:

- **Equipo de 1 desarrollador** (el alumno), con entregas quincenales auditadas.
- Una única sucursal (NG-05), alcance web responsive (NG-02), sin pagos (NG-01).
- Necesidad de **entorno local determinista y testeable** (Sprint 2 exige ≥10 tests unitarios locales).
- Despliegue simple y trazable, con evidencia medible en el cierre (Sprint 3).

## Decisión

Se adopta un **monolito modular**: una sola aplicación backend Node.js/Express desplegable, con módulos internos separados por dominio de negocio (auth, servicios, profesionales, turnos) y un frontend SPA React que consume la API REST como cliente externo.

La modularización interna se sostiene por convención y por el arnés (.opencoderules): cada dominio tiene su propio módulo en `server/` y las dependencias entre dominios se revisan en cada PR.

### Justificación

- El problema (una sucursal, un equipo, deadlines quincenales) no presenta fronteras que justifiquen un estilo distribuido.
- Un proceso único simplifica el debug, el testing integral (levantar API + tests en un entorno) y el despliegue auditado por el docente.
- Mantiene la separación que sí importa: frontend ≠ backend (R-03 de la SPEC), apoyado en ADR-001.

## Alternativas Descartadas

- **Opción A: Microservicios**
  Se descartó porque el costo operativo (orquestación, red, trazabilidad distribuida, manejo de fallos parciales) es injustificable para 1 persona y una única sucursal. Los deadlines quincenales de PP3 no permiten sostener N procesos versionados. Los beneficios de escalado horizontal no se necesitan en este dominio.

- **Opción B: Serverless / FaaS**
  Se descartó porque acopla la lógica al vendor, dificulta el entorno local determinista (cold starts, permisos, emuladores) y complica la evidencia local que exige la rúbrica de testing del Sprint 2. El proyecto necesita correr y probarse igual en cualquier máquina.

## Consecuencias

**Positivas:**
- Deploy único y simple; el docente audita un solo artefacto.
- Testing integral simple: la suite unitaria puede correr contra la API sin infraestructura distribuida.
- Se alinea con el modelo de referencia de la cátedra y con el despliegue en contenedor del cierre.

**Negativas / riesgos:**
- Riesgo de acoplamiento entre dominios si la modularidad no se respeta. **Mitigación:** regla del arnés (prohibido acoplar dominios sin justificación + revisión en PR).
- Escalado horizontal limitado a un proceso. **Mitigación:** aceptado explícitamente por NG-05 (una sola sucursal).