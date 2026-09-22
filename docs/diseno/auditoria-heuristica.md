# Auditoría Heurística — 10 Heurísticas de Nielsen

**TP3 ADI · Sprint 2 (T4) · 2026-09-11**

Aplicada sobre las **2 pantallas críticas** (Reserva de turno, Mis turnos) tal como estaban implementadas al momento de la T3 (núcleo funcional). Correcciones aplicadas en esta iteración y reflejadas en los wireframes.

## Tabla: heurística | ¿cumple? | evidencia | corrección

| # | Heurística (Nielsen) | ¿Cumple? | Evidencia | Corrección aplicada |
|---|---|---|---|---|
| 1 | Visibilidad del estado del sistema | Parcial | La carga de servicios/profesionales solo decía "Cargando…" si ambas listas estaban vacías; sin `aria-busy`. | Indicador de carga siempre visible durante fetch (`.SR`/`aria-busy`) y mensajes con `aria-live="polite"` (WR-01). |
| 2 | Coincidencia sistema-mundo real | Sí | Lenguaje de dominio (turno, profesional, servicio) sin jerga técnica. | — |
| 3 | Control y libertad del usuario | Sí | La reserva es reversible: estado CANCELADO con confirmación. | — |
| 4 | Consistencia y estándares | Parcial | Estados de turno solo como texto; sin marca visual común entre pantallas. | Punto de color + etiqueta en todas las filas (WR-02). |
| 5 | Prevención de errores | No | Se podían elegir fechas pasadas; el rechazo solo llegaba desde el backend. | `min={hoy}` en el input date + guard `fecha >= hoy` en el cliente (WR-03). |
| 6 | Reconocer antes que recordar | Sí | Formulario con selects, sin campos de memoria. | — |
| 7 | Flexibilidad y eficiencia | No aplica | 2 pantallas, sin atajos aún. | Anotado como exponible. |
| 8 | Diseño estético y minimalista | Sí | 4 campos obligatorios, sin ruido. | — |
| 9 | Ayuda a reconocer, diagnosticar y recuperarse de errores | Parcial | El error de superposición del backend se mostraba crudo. | Mensaje reescrito en claro: "Ya existe un turno en esa franja. Probá otra hora." (WR-04). |
| 10 | Ayuda y documentación | No aplica | Público técnico mínimo; label + placeholder alcanza. | — |

## Hallazgos reales detectados (≥3, con corrección)

### H-01 — Sin estado claro durante la carga (H1)
**Hallazgo:** la pantalla de reserva solo mostraba "Cargando…" cuando las dos listas estaban vacías; con una lista cargada y la otra no, el usuario creía que el formulario estaba listo.
**Corrección (aplicada):** indicador de carga incondicional durante el `fetch`, cursores `disabled` en el botón y `aria-busy="true"` en el contenedor.

### H-02 — Estados solo textuales, sin señal no dependiente del color (H4)
**Hallazgo:** "Pendiente", "Confirmado", etc. aparecían únicamente como texto en gris/verde; a daltónicos y en pantallas pequeñas la distinción no era evidente.
**Corrección (aplicada):** cada estado suma un punto de color + etiqueta y la etiqueta no depende del color (contraste AA).

### H-03 — Fechas pasadas aceptadas por el formulario (H5)
**Hallazgo:** el `input date` aceptaba fechas pasadas; el error de "fecha inválida" recién aparecía tras el POST en el servidor.
**Corrección (aplicada):** `min={hoy}` en el `input` y guard client-side `fecha >= hoy` antes de llamar a la API (WR-03).

### H-04 — Mensaje de error crudo desde el backend (H9)
**Hallazgo:** si el backend rechazaba la reserva por superposición (CA-02), se mostraba el mensaje del servidor tal cual, sin guía de recuperación.
**Corrección (aplicada):** mensaje orientado a la acción: "Ya existe un turno en esa franja. Probá otra hora." (WR-04).

## Trazabilidad con el código

| Hallazgo | Archivo | Cambio |
|---|---|---|
| H-01 | `client/src/components/ReservaForm.tsx` | `aria-busy`, indicador de carga siempre visible |
| H-02 | `client/src/components/TurnosList.tsx` | punto de color + etiqueta por estado |
| H-03 | `client/src/components/ReservaForm.tsx` | `min={hoy}` + guard client-side |
| H-04 | `client/src/components/ReservaForm.tsx` | mensaje de recuperación en claro (fallback si el server no da contexto) |