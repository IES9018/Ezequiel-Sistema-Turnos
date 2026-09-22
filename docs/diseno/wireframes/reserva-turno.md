# Wireframe — Pantalla: Reserva de turno

**Pantalla crítica 1/2** · vientre del negocio (RF-04). Autores: Martina (persona 1) reservando desde el celular.

- **Objetivo de la pantalla:** completar una reserva en ≤3 pasos con datos verificables (servicio, profesional, fecha, hora).
- **Entrada principal:** listas desplegables (servicio, profesional) + campos `date`/`time` nativos.
- **Error más probable del usuario:** elegir una fecha pasada o una franja ya ocupada → la pantalla lo previene mostrando disponibilidad y validando antes de cargar (prevención de errores, H5).
- **Fallback de estado:** mensaje de éxito/error visible y anunciado a lectores de pantalla (`aria-live`).

```mermaid
graph TD
    A["CABECERA\nBarberia · usuario + Salir"] --> B["RESERVA DE TURNO"]
    B --> C["Servicio\n[v select: Corte - 30min - $15 ]"]
    B --> D["Profesional\n[v select: Carlos - Barbero ]"]
    B --> E["Fecha\n[ input date | min=hoy ]"]
    B --> F["Hora\n[ input time ]"]
    B --> G["[ Reservar ]"]
    G -->|"ok"| H["Mensaje verde:\nTurno reservado para YYYY-MM-DD HH:mm\n(se agrega a Mis turnos)"]
    G -->|"conflicto CA-02"| I["Mensaje rojo:\nYa existe un turno en esa franja.\nProbá otra hora."]
```

### Notas de baja fidelidad
- Sin colores funcionales: verde/rojo solo de apoyo; la estructura y el flujo es lo que se evalúa.
- El formulario no tiene más campos que los 4 obligatorios para no alargar el journey-1 (punto de abandono).
- El error de superposición llega desde el backend (CA-02); la pantalla lo presenta sin tecnicismos.