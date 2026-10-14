# Reporte de Pruebas — Sprint 2 (T5 / DES-S2-03)

**TM5 · 2026-09-22 · Entrega TP3 ADI + núcleo funcional (PP3)**

## Resumen

| Métrica | Valor | Umbral del arnés |
|---|---|---|
| Tests server (reglas de negocio puras + utils) | **15** (11 + 4) | — |
| Tests client (servicio api + componentes React) | **11** (5 + 6) | — |
| **Total tests** | **26** | ≥ 10 ✅ |
| Estado | **todos verdes (0 fallos)** | ✅ |
| Statements (reglas de negocio server) | **100% (14/14)** | ≥ 70% ✅ |
| Framework | Vitest 5 (root) + Vitest 5/jsdom/RTL (client) | ADR-004 |

> Cumple el criterio de la Fase 2 (Testing y calidad): suite ≥ 10 unit tests verdes y
> cobertura de statements ≥ 70% sobre las reglas de negocio puras, según ADR-003
> (las reglas se extrajeron a módulos sin I/O justamente para poder testearlas sin DB).

---

## 1. Server — reglas de negocio puras

Se extrajeron a `server/utils/turnos-rules.ts` e `server/utils/responses.ts` (sin Prisma/HTTP),
lo que permite unit testing determinista sin base de datos (ADR-003: "las reglas de negocio se
testean desacopladas de la infraestructura").

**Archivo de tests:** `tests/server/turnos-rules.test.ts` + `tests/server/responses.test.ts`

### Cobertura (v8)

| Archivo | % Stmts |
|---|---|
| `server/utils/turnos-rules.ts` | 100% |
| `server/utils/responses.ts` | 100% |
| **Total** | **100% (14/14)** |

### Reglas verificadas

- **`calcularHoraFin(horaInicio, duracionMinutos)`** — RFC equivalentes a `server/routes/turnos.ts`:
  - suma dentro de la misma hora (`18:00 + 30 → 18:30`)
  - desplaza la hora al superar 60 min (`18:30 + 45 → 19:15`)
  - **cruza medianoche correctamente** (`23:30 + 60 → 00:30`, `23:45 + 30 → 00:15`)
  - duración 0 devuelve la misma franja
  - lanza error para formatos inválidos (`25:99`, `18hs`) — guard del negocio
- **`seSuperponen(a, b)`** — Rs. AC-02 / CA-02 (no superposición):
  - franjas que se cruzan parcialmente → `true`
  - turno contenido dentro de otro → `true`
  - mismo inicio de franja → `true`
  - **bordes exactos contiguos (end==start) → `false`** (no se bloquea el turno de las 18:30 si el anterior terminó a las 18:30)
  - franjas separadas por hueco → `false`

> La rotura del día 18:30↔19:15 y el cruce de medianoche son exactamente los bugs que
> corrigió el S1 (hallazgo H-S1-01). Ambos quedan fijados como regresión en el test `calcularHoraFin`.

### Envelope de respuestas (`responses.ts`)

- `ok()` → `{ success:true, data }` con status 200 / status explícito (201)
- `fail()` → `{ success:false, error }` con status 400 default / status configurable (404)

### `server/package.json`
```json
"test": "vitest run",
"test:coverage": "vitest run --coverage"
```

---

## 2. Client — servicio api + componentes React

**Test framework:** Vitest + Testing Library + jsdom (ADR-004: stack UI = componentes propios Tailwind + RTL)
**Script** `client/package.json` → `"test": "vitest run"`.

### `client/tests/`

| Archivo | Qué prueba | Tests |
|---|---|---|
| `api.test.ts` | servicio `api.*` (login hace POST a /api/auth/login, headers Authorization cuando hay token, register arma el cuerpo, envelope `{success:false,error}` → reject, error HTTP) | 5 |
| `components.test.tsx` | `ReservaForm` y `TurnosList`: reserva válida→`reservar`, fecha pasada→rechaza sin llamar API, mensaje de éxito, traduce error de superposición, filtra turnos por cliente, cancelar pide confirmación y llama `cancelarTurno` | 6 |
| `utils.ts` | helper compartido (no es suite de tests) | — |
| `setup.ts` | `@testing-library/jest-dom/vitest` | — |

### Accesibilidad verificada (RF-11 / CA-08, del TP3)

Esta suite documenta que los fixes de accesibilidad del TP3 (auditoría heurística) no rompieron
el comportamiento: los tests de `ReservaForm` aún pasan tras agregar `aria-live`, `aria-busy`,
`min={hoy}` y validación client-side de fecha pasada.

---

## 3. Regresión y conflictos

- La refactor de `server/routes/turnos.ts` movió `calcularHoraFin` a `server/utils/turnos-rules.ts`
  y delegó la detección de superposición a `seSuperponen()`. El endpoint `POST /api/turnos` conserva
  exactamente la misma regla (franja libre por profesional + fecha, sin solape con PENDIENTE/CONFIRMADO).
- El patrón de import `.js` → fuente `.ts` del proyecto se mantuvo en los tests (nódulo sencillo,
  consistente con el resto del codebase).

## 4. Cómo correr

```bash
# server (reglas de negocio + envelope)
npm test
npm run test:coverage

# client (api + componentes)
npm --prefix client run test
```

## Trazabilidad
- Cobertura arnés Fase 2 "Testing y calidad": ≥10 unit tests verdes ✅ · statements ≥70% ✅
- ADRs: ADR-003 (persistencia → reglas desacopladas de DB), ADR-004 (stack UI → testing-library/jsdom)
- Controles del TP3: la refactor de accesibilidad pasa la suite de componentes.