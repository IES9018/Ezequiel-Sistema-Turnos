# ADR-001: Stack Tecnológico del Sistema de Turnos

**Fecha:** 2026-08-25
**Estado:** Aceptado

## Contexto

Se necesita definir el stack tecnológico para el Sistema de Turnos de Peluquería/Barbería. El proyecto requiere una aplicación web responsive con backend API, autenticación de usuarios y persistencia de datos. Las restricciones incluyen: ser un proyecto académico de 3° año, contar con conocimientos previos de JavaScript/TypeScript, y necesidad de desplegar de forma sencilla.

## Decisión

Se utilizará el siguiente stack:

- **Frontend:** React 18+ con Vite, TypeScript y TailwindCSS.
- **Backend:** Node.js 20+ con Express y TypeScript.
- **Base de datos:** PostgreSQL 16+ con Prisma ORM.
- **Autenticación:** JWT con bcrypt.

### Justificación

- **React + Vite:** Ecosistema más grande del mercado, gran cantidad de librerías de componentes (shadcn/ui, etc.), rendimiento superior con Vite vs Create React App, y compatibilidad con TypeScript nativa.
- **Node.js + Express:** Permite usar el mismo lenguaje (TypeScript) en todo el stack, reduciendo la curva de aprendizaje. Express es minimalista y maduro.
- **PostgreSQL:** Base de datos relacional robusta, ideal para datos estructurados como turnos y disponibilidad. Prisma ORM simplify las migraciones y el acceso a datos con tipado fuerte.
- **TailwindCSS:** CSS utility-first que acelera el desarrollo de interfaces responsive sin escribir CSS custom extenso.

## Alternativas Descartadas

- **Opción A: Next.js (fullstack)**
  Se descartó porque el proyecto requiere una API REST que pueda consumirse desde otros clientes en el futuro (app móvil). Next.js está optimizado para SSR/SSG y su API routes no es la ideal para una API REST pura. Además, la separación frontend/backend facilita el despliegue independiente.

- **Opción B: MongoDB + Mongoose**
  Se descartó porque la estructura de datos del sistema es relacional (turnos, profesionales, servicios, disponibilidad semanal). Las relaciones entre entidades y las consultas de disponibilidad por rango de fechas son más naturales y eficientes en SQL. Prisma con PostgreSQL ofrece mejor tipado y migraciones.

- **Opción C: PHP + Laravel**
  Se descartó porque el conocimiento previo del grupo es en JavaScript/TypeScript. Laravel es un framework excelente pero introduciría una nueva tecnología sin beneficio claro para este proyecto académico.

## Consecuencias

- **Positivas:**
  - Stack unificado en TypeScript reduce la curva de aprendizaje.
  - Ecosistema React permite encontrar soluciones y librerías para casi cualquier problema.
  - Prisma simplifica las migraciones de base de datos y el tipado de queries.
  - TailwindCSS acelera el desarrollo de UI responsive.
  - Comunidad enorme = facilidad para encontrar documentación y ejemplos.

- **Negativas / Riesgos:**
  - Prisma puede tener overhead de rendimiento en consultas complejas (mitigable con indexes).
  - TailwindCSS puede generar clases largas en el HTML (mitigable con buenas practicas de composición).
  - El trio React+Express+PostgreSQL es muy comun, lo que puede generar dependencia de ecosistemas de tercero para mantenimiento a largo plazo.
