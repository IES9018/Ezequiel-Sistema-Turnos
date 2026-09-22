# ADR-004 — Stack de UI (capa de interfaz)

- **Estado:** Aceptado · **Fecha:** 2026-09-11 · **Ámbito:** capa de interfaz (frontend)
- **Referencias:** [ADR-001](ADR-001-stack-tecnologico.md), [ADR-002](ADR-002-estilo-arquitectonico.md), consultas previas y registradas en el arnés del proyecto.

## Contexto

El frontend ya corre con React + Vite + TypeScript + Tailwind (ADR-001, elegido en el TP1). Para la **capa de presentación de UI** (componentes y estilos) hay que decidir si adoptamos una librería de componentes / design system externo o mantenemos componentes propios sobre Tailwind. El criterio exigido por el TP3: curva de aprendizaje, ecosistema, accesibilidad out-of-the-box y compatibilidad con el monolito modular (ADR-002).

## Decisión

**Componentes propios en React + Tailwind CSS v4, con accesibilidad implementada a mano según WCAG AA en las 2 pantallas críticas (navegación por teclado + contraste AA).** Sin librería de componentes externa ni design system comercial.

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|---|---|
| **Material UI (MUI)** | Componentes con diseño impuesto que choca con la estética mínima del dominio; bundle pesado (≈100 kb gzip); su accesibilidad no exonera de auditoría, y agrega contexto/cultura "de fábrica" innecesaria para 2 pantallas. |
| **Chakra UI** | Buena accesibilidad out-of-the-box, pero añade runtime y abstracciones de theming; para una app de 2 pantallas críticas no reditúa frente a `input` nativos + `aria`. |
| **shadcn/ui** | No es una dependencia sino copia de código en el repo (contradice el arnés: nada generado sin auditoría) y asume Radix + Tailwind config v3; empuja dependencias transitivas que el ADR-001 no fijó. |
| **Bootstrap** | Accesibilidad imperfecta por defecto (falta nuestro `aria-live` específico) y diseño genérico; ya estamos sobre Tailwind (ADR-001). |

## Consecuencias

**Positivas**
- Cero dependencias nuevas sobre el stack ya fijado (ADRs 001/003): superficie de ataque y auditoría mínimas.
- `input` nativos (`date`, `time`) dan accesibilidad de calendario/teclado gratis y consistente entre navegadores.
- Alineado con ADR-002: la UI queda como módulo desacoplado que solo consume `/api` (contrato estable), sin ficha de framework en el servidor.

**Negativas / a monitorear**
- La accesibilidad se logra a mano: hay que sostenerla con auditoría (nuestro `auditoria-heuristica.md`). Riesgo aceptado y cubierto por el checklist del PR.
- Sin design system externo, la consistencia visual la garantiza Tailwind (utilities) + patrones del componente.

## Regla para dependencias futuras (actualiza arnés)

Toda dependencia nueva de UI deberá justificarse contra este ADR; si no aporta accesibilidad o tamaño crítico, se implementa a mano.