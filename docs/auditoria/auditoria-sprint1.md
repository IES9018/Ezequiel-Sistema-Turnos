# Auditoría Crítica — Sprint 1

**Estudiante:** Ezequiel (Ezem700)
**Proyecto:** Sistema de Turnos — Peluquería/Barbería
**Fecha:** 2026-08-25
**Sprint:** 1 (24 ago – 18 sep)

---

## 1. Resumen de lo realizado en el Sprint 1

- Creación del repositorio `Ezequiel-Sistema-Turnos` en la organización `IES9018`.
- Especificación del proyecto en `SPEC.md` con 10 requerimientos funcionales, 5 Non-Goals y 7 criterios de aceptación.
- Decisión arquitectónica `ADR-001-stack-tecnologico.md` documentando la elección del stack (React + Node.js/Express + PostgreSQL) con 3 alternativas descartadas.
- Arnés `.opencoderules` configurado para OpenCode con reglas de alcance, estándares técnicos y prácticas prohibidas.

---

## 2. Auditoría de código asistido por IA

### 2.1 Generación del SPEC.md

- **Herramienta utilizada:** OpenCode (modelo big-pickle)
- **Prompt utilizado:** Se solicitó generar la especificación completa del proyecto de turnos para peluquería/barbería, incluyendo contexto, requerimientos funcionales, Non-Goals, stack tecnológico, contratos de datos y criterios de aceptación.
- **Errores detectados:**
  - El modelo generó una interfaz `DisponibilidadSemana` con arreglos de `FranjaHoraria` por día, pero no definió la interfaz `FranjaHoraria` en el mismo bloque de código.
  - **Corrección:** Se agregó la definición de `FranjaHoraria` con los campos `inicio` y `fin` de tipo `string` (formato HH:mm).
- **Calidad del código generado:** El SPEC.md es claro, estructurado y cumple con la plantilla oficial. Los Non-Goals están bien delimitados.

### 2.2 Generación del ADR-001

- **Herramienta utilizada:** OpenCode (modelo big-pickle)
- **Prompt utilizado:** Se solicitó documentar la decisión del stack tecnológico con al menos dos alternativas descartadas y justificación.
- **Errores detectados:**
  - No se detectaron errores significativos. Las alternativas descartadas (Next.js, MongoDB, PHP/Laravel) están bien justificadas con criterios objetivos.
- **Calidad del código generado:** Cumple con la plantilla MADR. Las consecuencias positivas y negativas están balanceadas.

### 2.3 Generación del .opencoderules

- **Herramienta utilizada:** OpenCode (modelo big-pickle)
- **Prompt utilizado:** Se solicitó generar un arnés para OpenCode con reglas de alcance, estándares técnicos y prácticas prohibidas.
- **Errores detectados:**
  - No se detectaron errores. El arnés es coherente con el stack elegido y las prácticas prohibidas son relevantes para el proyecto.
- **Calidad del código generado:** El arnés define claramente las carpetas permitidas, los estándares de tipado y las prácticas a evitar.

---

### 2.4 Generación del README.md

- **Herramienta utilizada:** OpenCode (modelo big-pickle)
- **Prompt utilizado:** Se solicitó generar documentación del repositorio con estructura, requisitos de instalación y scripts.
- **Errores detectados:**
  - El frontend (React) se listó como "próximamente" ya que aún no está inicializado, lo que da una vista honesta del estado del proyecto.
- **Calidad del código generado:** El README documenta correctamente el stack, la estructura y los pasos de instalación.

### 2.5 Generación del código backend (Express + TypeScript + Prisma)

- **Herramienta utilizada:** OpenCode (modelo big-pickle)
- **Prompt utilizado:** Se solicitó implementar la API REST con endpoints CRUD de turnos, incluyendo validación de superposición de horarios para un mismo profesional.
- **Errores detectados:**
  - La función auxiliar `calcularHoraFin()` (en `server/routes/turnos.ts`) no contemplaba el cruce de medianoche: para un turno que termina después de las 00:00 generaba una hora inválida con formato `24:30`, que no es un `HH:mm` válido y rompería la comparación de rangos y la consistencia de la base de datos.
  - **Corrección:** se aplicó módulo 24 sobre el total de minutos (`Math.floor(totalMin / 60) % 24`), garantizando que `horaFin` siempre caiga en el rango 00:00–23:59.
  - **Evidencia:** commit `fix: manejar cruce de medianoche en calculo de hora fin` en la rama `feature/s1-close` (PR #6).
  - En el mismo pase se auditaron manualmente las validaciones de superposición (`OR` de rangos en `POST /api/turnos`) y los states permitidos en `PATCH /api/turnos/:id/estado`; se probaron contra PostgreSQL real: creación válida, rechazo de superposición (10:15 vs 10:00) y control de acceso en auth.
- **Calidad del código generado:** El código quedó tipado con TypeScript estricto, sin `any`, y con manejo de códigos HTTP (200/201/400/404/500) consistente con los criterios de aceptación CA-05 y CA-06 de la SPEC.

## 3. Seguridad

- **Secrets:** No se expuso ningún secret o clave sensible en el repositorio.
- **.gitignore:** Configurado con exclusiones para `node_modules/`, `.env`, build artifacts y archivos del IDE.
- **Entradas validadas:** El backend valida campos obligatorios (400) y la superposición de turnos en `POST /api/turnos`; los estados se validan contra una whitelist en el PATCH de estado. La sanitización sistemática con biblioteca dedicada (validación de esquemas) queda planificada para el Sprint 2.

---

## 4. Calidad automatizada

- **Linter/Formatter:** Configurado (ESLint + Prettier + typescript-eslint en el server; oxlint en el client). Pasa sin errores.
- **TypeScript estricto:** Configurado. `npx tsc --noEmit` pasa sin errores. Prohibido el uso de `any`.
- **Checklists de PR:** Plantilla oficial agregada en `.github/PULL_REQUEST_TEMPLATE.md` (DEL-S1-02) y aplicada desde el PR #5 en adelante.

---

## 5. Conclusiones

El Sprint 1 se completó en su fase de setup y especificación, incluyendo el setup del proyecto backend (Express + TypeScript + Prisma + PostgreSQL), el frontend base (React + Vite + Tailwind) y la configuración de calidad automatizada (ESLint, Prettier, oxlint, TypeScript estricto). Los entregables (SPEC.md, ADR-001, .opencoderules, informe de auditoría, .gitignore) están presentes y cumplen con la rúbrica. La entrega formal quedó registrada: PR #3 (setup + especificación + API) mergeado a `main`, tablero Kanban vinculado en el README, pipeline CI en verde (PR #4) y plantilla oficial de PR aplicada (PR #5).

---

## 6. Evidencia

- Repo: https://github.com/IES9018/Ezequiel-Sistema-Turnos
- Commit principal: `feat: especificacion inicial, ADR-001 y arnes de IA` (`31a6f42`)
- PR de entrega del Sprint 1: [#3](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/3)
- Pipeline CI: https://github.com/IES9018/Ezequiel-Sistema-Turnos/actions
- Tablero Kanban: https://github.com/orgs/IES9018/projects/2
