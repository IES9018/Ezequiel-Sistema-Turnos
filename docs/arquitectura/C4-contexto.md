# C4 — Nivel 1: Diagrama de Contexto

Vista de nivel 1 del modelo C4 para el **Sistema de Turnos — Peluquería/Barbería**. El sistema se muestra como caja negra; aquí solo aparecen actores y sistemas externos que la SPEC o los ADR declaran (regla de trazabilidad del TP2).

## Contexto

```mermaid
flowchart LR
    C[Cliente] -->|RF-04 RF-07: reserva y cancela turnos, RF-09: registro/login| ST
    A[Administrador] -->|RF-01 RF-02: gestiona servicios y profesionales, RF-06 RF-08: agenda y dashboard, RF-09: login, RF-10: horarios especiales| ST
    P[Profesional] -->|RF-03: consulta su disponibilidad| ST
    ST[Sistema de Turnos - Peluqueria/Barberia\nmonolito modular (ADR-002)] -->|RF-05: envia confirmacion de turno| EMAIL
    EMAIL[Servicio de Email exit para notificaciones]
```

## Trazabilidad (ningún elemento sin fuente)

| Elemento | Fuente en SPEC / ADR |
|---|---|
| Sistema de Turnos (caja negra) | SPEC-000 · ADR-002 (monolito modular) |
| Cliente | RF-04, RF-07, RF-09 |
| Administrador | RF-01, RF-02, RF-06, RF-08, RF-09, RF-10 |
| Profesional | RF-03 |
| Servicio de Email | RF-05 (confirmación automática de turno) — solo correo saliente, sin integraciones (NG-03) |
| Ausencia de pagos | NG-01 — no se modela sistema de pagos externo |
| Ausencia de app móvil | NG-02 — el acceso es web responsive |

> **Nota de trazabilidad:** no aparecen sistemas que la SPEC descarta (pagos NG-01, móvil NG-02, Google Calendar NG-03, reseñas NG-04, multi-sucursal NG-05), porque el diagrama documenta decisiones tomadas, no deseos.