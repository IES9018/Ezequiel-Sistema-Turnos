# Auditoría Crítica — Sprint 2

**Estudiante:** Ezequiel (Ezem700)
**Proyecto:** Sistema de Turnos — Peluquería/Barbería
**Fecha:** 2026-10-15
**Sprint:** 2 (21 sep – 16 oct) — Núcleo Funcional y Calidad Local

---

## 1. Resumen del Sprint 2

- **Arquitectura viva (TP2, DEL-S2-02):** `SPEC.md` a **v2** con sección de Restricciones arquitectónicas citando ADRs + changelog; diagramas **C4** (contexto y contenedores) en `docs/arquitectura/`. Cada elemento trazado a un RF/NG de la SPEC. (PR [#7](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/7))
- **Núcleo funcional (DEL-S2-01):** frontend con **login, registro y reserva de turnos** consumiendo la API REST. (PR [#9](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/9))
- **Interfaz crítica (consume TP3):** personas, journeys y wireframes; persona/journey del rol profesional; implementación de la reserva respetando accesibilidad básica. (PRs [#10](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/10), [#11](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/11))
- **Calidad local (DEL-S2-03):** suite unitaria **26 tests verdes** (server 15, client 11) corriendo local y en CI, con reporte en `docs/pruebas/reporte-sprint2.md`. (PR [#12](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/12))
- **TP4 adelantado:** contrato OpenAPI de 5 endpoints + ADR-005 + threat model + arnés v3 + SPEC v4. (PR [#13](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/13))

---

## 2. Auditoría de código asistido por IA

Todas las piezas fueron generadas con **OpenCode (modelo big-pickle)** a partir de prompts de la consigna y **auditadas línea por línea** antes de cada commit. Se listan los errores reales hallados y su corrección.

### 2.1 Suite de pruebas de componentes (T5 / DEL-S2-03)

- **Prompt:** "Escribí los tests de componentes de React (AuthForm, ReservaForm, TurnosList) para llegar a ≥10 tests verdes".
- **Errores detectados:**
  1. **Test de fecha (ReservaForm):** el test generado hacía click en "Reservar" sin completar los campos. En jsdom el `required` nativo del `<input type="date">` bloquea el submit, así que `onReservado` nunca se disparaba y el test fallaba.
     - **Corrección:** completar los campos antes del submit y disparar `fireEvent.submit(form)` en lugar de depender del click + validación nativa.
  2. **Test de traducción de superposición:** el mock de error usaba un mensaje que **no contenía** la palabra "superpos", por lo que la condición de traducción del componente no se activaba y el assert no tenía sentido (pasaba por la razón equivocada).
     - **Corrección:** el mock ahora devuelve un mensaje con "superpos" para ejercitar realmente la rama de traducción.
- **Evidencia:** commit `test: suite de pruebas Sprint 2 ...` en la rama `feature/s2-t5-tests` (PR [#12](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/12)).
- **Calidad del código generado:** los tests usan Testing Library con queries accesibles (`getByRole`/`getByLabelText`), sin `any`, y quedaron verdes (client 11/11).

### 2.2 Archivo muerto `client/tests/utils.ts`

- **Error detectado:** la IA generó un helper `client/tests/utils.ts` que contenía **JSX en una extensión `.ts`** y referencias sin importar. No lo usaba ningún test y hacía fallar `oxlint`.
- **Corrección:** se **eliminó** el archivo (dead code) y se dejó cada test autocontenido.
- **Evidencia:** PR [#12](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/12).

### 2.3 Regla de superposición de turnos — refactor de funciones puras

- **Error/fragilidad detectada:** la validación de superposición vivía inline en `server/routes/turnos.ts` (query Prisma con `OR` de rangos) y no contemplaba el cruce de medianoche; era imposible testearla sin base de datos.
- **Corrección:** se extrajeron `calcularHoraFin` y `seSuperponen` a `server/utils/turnos-rules.ts` (funciones puras) y `turnos.ts` ahora las consume. Se agregaron tests unitarios que cubren el caso de medianoche y adyacencia (18:30↔19:15 no se superponen).
- **Evidencia:** PR [#12](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/12); tests en `tests/server/turnos-rules.test.ts`.

### 2.4 Documento de personas — sección duplicada

- **Error detectado:** al agregar la Persona 3 (rol profesional) con IA, `docs/diseno/usuarios.md` quedó con una **sección duplicada** (la Persona 3 aparecía dos veces por un merge/edición solapada).
- **Corrección:** se reescribió el archivo dejando una única Persona 3 y su Journey 3, coherentes con las Personas 1 y 2.
- **Evidencia:** commit `docs(diseno): persona y journey del rol profesional (TP3)` en la rama `feature/tp3-persona-profesional` (PR [#11](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/11)).

### 2.5 Reporte de pruebas — métricas infladas

- **Error detectado:** `docs/pruebas/reporte-sprint2.md` declaraba inicialmente **15 tests de client y 30 en total**, un número copiado de una versión previa de la suite que no coincidía con los tests reales.
- **Corrección:** se recalculó contra la salida real de `vitest`: **server 15 (11+4), client 11 (5+6), total 26**; y se actualizó el texto de cobertura a lo efectivamente medido (server 100% statements v8).
- **Evidencia:** PR [#12](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/12).

### 2.6 Núcleo funcional frontend (login/registro/reserva)

- **Prompt:** "Implementá el núcleo funcional del frontend: login, registro y reserva de turnos contra la API `/api`".
- **Errores detectados:** no se detectaron errores bloqueantes; se auditó que el token y el usuario se persistan en `localStorage`, que el cierre de sesión limpie ambos, y que el `clienteId` enviado en la reserva salga de la sesión (no hardcodeado).
- **Evidencia:** PR [#9](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/9).

---

## 3. Seguridad (estado al cierre del Sprint 2)

- **Secrets:** no se expuso ningún secret ni clave en el repo. La auditoría de TP4 reforzó la regla en `.opencoderules` (arnés v3): prohibido hardcodear secrets/tokens/credenciales.
- **Entradas:** el backend valida campos obligatorios (400) y la superposición de turnos; los estados del PATCH se validan contra whitelist. La **validación por esquemas** (zod) y la **autorización por rol en middleware** quedan como mitigaciones planificadas para Sprint 3 (ver `docs/seguridad/threat-model-lite.md`, T-02/T-03).
- **Contrato:** se adoptó enfoque **API-First** — `docs/arquitectura/api-contracts.yaml` es la fuente de verdad y todo endpoint nuevo debe definirse ahí **antes** de implementarse (regla del arnés v3).

---

## 4. Calidad automatizada

- **Tests:** suite única con Vitest — server **15/15** verdes, client **11/11** verdes (**26**), corriendo local y en CI (pasos de test server+client en el workflow).
- **Linter/Formatter:** ESLint + Prettier + typescript-eslint (server), oxlint (client). Pasan sin errores.
- **TypeScript estricto:** `tsc --noEmit` pasa sin errores; prohibido `any`.
- **Cobertura:** server **100% statements** (v8) sobre las funciones puras y respuestas.
- **Checklists de PR:** plantilla oficial aplicada en todos los PRs del sprint.

---

## 5. Conclusiones

El Sprint 2 cierra con el **núcleo funcional operativo en local** (login, registro y reserva), arquitectura viva (C4 + SPEC v2→v4) y **calidad local medible** (26 tests verdes + cobertura). Los cuatro entregables formales quedan cubiertos: DEL-S2-01 (núcleo), DEL-S2-02 (C4), DEL-S2-03 (suite + reporte) y DEL-S2-04 (este informe). La auditoría de código IA encontró y corrigió errores concretos con evidencia (PRs #9, #11, #12), lo que sostiene la trazabilidad exigida por la cátedra. La seguridad avanza de "validación puntual" a un **modelo de amenazas** con mitigaciones priorizadas para el Sprint 3.

---

## 6. Evidencia

- Repo: https://github.com/IES9018/Ezequiel-Sistema-Turnos
- PRs del Sprint 2: [#7](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/7) (arquitectura/C4), [#9](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/9) (núcleo frontend), [#10](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/10) (HCI), [#11](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/11) (persona profesional), [#12](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/12) (tests), [#13](https://github.com/IES9018/Ezequiel-Sistema-Turnos/pull/13) (TP4).
- Reporte de pruebas: `docs/pruebas/reporte-sprint2.md`
- Modelo de amenazas: `docs/seguridad/threat-model-lite.md`
- Pipeline CI: https://github.com/IES9018/Ezequiel-Sistema-Turnos/actions
