# ADR-005: Estrategia Web del Sistema de Turnos

**Fecha:** 2026-10-14
**Estado:** Aceptado
**Supersede:** Ninguno (formaliza la capa web esbozada en ADR-001 y la R-03 de la SPEC)

## Contexto

ADR-001 fijó el stack (React + Vite + TailwindCSS, Express, PostgreSQL) y descartó Next.js, pero dejó implícita **cómo se sirve el frontend**. Antes de implementar los contratos de datos del TP4 (OpenAPI) hay que decidir la **estrategia web**: ¿el HTML se renderiza en el servidor (SSR), se entrega una SPA que consume la API, o se sirven páginas tradicionales (MPA)?

Restricciones que condicionan la decisión:

- **R-03 (SPEC):** la API es REST y sin estado; el frontend es una SPA que consume HTTP/JSON.
- **R-01 (SPEC):** monolito modular, un único proceso desplegable del backend.
- **NG-02:** solo web responsive, no app móvil nativa.
- **NG-05:** única sucursal (no SEO multi-tenant ni catálogos indexables).
- **Hosting objetivo de PP3 / Sprint 3:** despliegue reproducible simple (contenedor/URL pública).
- **Tamaño del equipo:** 1 desarrollador (proyecto académico).

El dominio es una aplicación **autenticada de gestión** (agenda interna + reserva de clientes registrados). El contenido crítico está detrás de login, no es contenido público indexable.

## Decisión

Se adopta una **SPA (Single Page Application)** con **React + Vite**, que consume la **API REST** en `/api` (mismo origen), servida como assets estáticos por Express (o un CDN/host estático en el deploy).

- El cliente se hidrata una vez y navega del lado del navegador.
- La API permanece **sin estado** (R-03), autenticada por JWT en `Authorization`.
- No hay render en servidor ni páginas HTML independientes por ruta.

### Matriz de decisión

| Criterio (peso) | SPA + API REST | SSR (Next.js) | MPA (páginas clásicas) | Solo-API + front existente |
|---|---|---|---|---|
| SEO necesario (bajo) | ✅ no requerido | ✅ | ✅ | n/a |
| Complejidad de estado (medio) | ✅ cliente maneja sesión/reserva | ⚠️ doble estado server/cliente | ✅ bajo | n/a |
| Hosting objetivo PP3 (alto) | ✅ estático + API (1 contenedor) | ⚠️ runtime Node con SSR | ✅ | ⚠️ depende de front ajeno |
| Tamaño del equipo (alto) | ✅ 1 dev, un solo idioma | ⚠️ curva de aprendizaje | ✅ | ⚠️ costo de integración |
| Consistencia con ADR-001/R-03 (alto) | ✅ ya decidido | ❌ contradice R-03 | ⚠️ rompe el flujo sin recarga (CA-01) | ❌ no hay front existente |
| Flujo "sin recargar la página" (CA-01) (alto) | ✅ nativo | ⚠️ requiere RSC/routing | ❌ recarga por navegación | ❌ depende |

La SPA gana en los criterios de mayor peso (hosting, equipo, consistencia y CA-01) y no penaliza en SEO porque el contenido es privado.

## Alternativas Descartadas

- **Opción A — SSR con Next.js:** descartada. Aporta su valor en SEO/tiempo-a-primer-pintado de contenido público, que acá no aplica (contenido tras login, NG-05, sin marketing indexable). Además introduce un runtime Node con render en servidor, más difícil de desplegar de forma reproducible (hosting objetivo de PP3) y contradice R-03 (front y API separados, API sin estado). Ya había sido descartada en ADR-001 y este ADR confirma la decisión a nivel de estrategia web.
- **Opción B — MPA (páginas tradicionales, render server-side por ruta):** descartada. Cada navegación recargaría la página, incumpliendo CA-01 ("reserva sin recargar la página") y degradando la experiencia móvil de la clienta (journey 1 del TP3). La agenda viva del admin/profesional también pierde fluidez.
- **Opción C — Solo-API + frontend existente:** descartada. No existe un front previo que reutilizar; el proyecto incluye la construcción del cliente. Mantener solo la API y "que otro haga el front" traslada el costo de integración sin beneficio y rompe la trazabilidad de los criterios de interfaz (CA-07, CA-08, RF-11) que ya están implementados y auditados.

## Consecuencias

### Positivas

- Un único artefacto de front (bundle estático) + una API: despliegue simple y reproducible (Sprint 3).
- Consistencia total con ADR-001 y R-03; el contrato OpenAPI describe exactamente lo que consume la SPA.
- Navegación fluida y "sin recarga" que sostiene CA-01 y los journeys del TP3.

### Negativas / riesgos

- SEO nulo: aceptable, no es un requisito (contenido autenticado).
- El primer render depende del bundle JS (mitigado con presupuestos de rendimiento en TP5: LCP/INP/peso JS).
- La sesión se gestiona en cliente (localStorage del token): se mitiga en el threat model lite (riesgo XSS sobre el token, ver `docs/seguridad/threat-model-lite.md`).
