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
- Arnés `.opencoderules` configurado para VS Code + Copilot con reglas de alcance, estándares técnicos y prácticas prohibidas.

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
- **Prompt utilizado:** Se solicitó generar un arnés adaptado para VS Code + Copilot con reglas de alcance, estándares técnicos y prácticas prohibidas.
- **Errores detectados:**
  - No se detectaron errores. El arnés es coherente con el stack elegido y las prácticas prohibidas son relevantes para el proyecto.
- **Calidad del código generado:** El arnés define claramente las carpetas permitidas, los estándares de tipado y las prácticas a evitar.

---

## 3. Seguridad

- **Secrets:** No se expuso ningún secret o clave sensible en el repositorio.
- **.gitignore:** Pendiente de agregar un `.gitignore` adecuado para el proyecto (Node.js, TypeScript, .env).
- **Entradas sanitizadas:** Pendiente de implementar en la fase de desarrollo del backend.

---

## 4. Calidad automatizada

- **Linter/Formatter:** Pendiente de configurar (ESLint + Prettier) en la fase de setup del proyecto.
- **Checklists de PR:** Pendiente de completar en la creación formal del PR.

---

## 5. Conclusiones

El Sprint 1 se completó en su fase de setup y especificación. Los entregables principales (SPEC.md, ADR-001, .opencoderules) están presentes y cumplen con los criterios de la rúbrica. Las mejoras pendientes (`.gitignore`, linter, PR formal) se abordarán en las siguientes iteraciones del proyecto.

---

## 6. Evidencia

- Repo: https://github.com/IES9018/Ezequiel-Sistema-Turnos
- Commit principal: `feat: especificacion inicial, ADR-001 y arnes de IA`
