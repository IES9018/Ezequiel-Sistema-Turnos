# Offline-first / Sincronización — Non-Goal Declarado

**Sprint 3 / TP5** · Decisión: **el sistema NO es offline-first en esta etapa.**

## Non-Goal (NG-06)

> **NG-06:** El Sistema de Turnos no implementa funcionamiento offline ni una cola de sincronización diferida. Requiere conectividad para reservar, cancelar y consultar turnos.

## Motivo

El dominio es la **reserva de turnos de una única peluquería/barbería** (NG-05), un negocio con local físico y conectividad (Wi-Fi/red móvil) tanto para la clienta como para el/la administrador/a. La operación ocurre **estando el local abierto**, no en contexto de campo, depósito, transporte o zonas sin señal.

Un offline-first real introduce: service worker, política de caché, cola de operaciones pendientes, resolución de conflictos (dos reservas de la misma franja creadas sin red) y versionado de esquema local. Es exactamente el tipo de complejidad que un equipo de **1 persona** con el **cierre de PP3 el 13/11** no puede sostener, y resolvería un problema que hoy **no existe**.

La decisión además es coherente con:

- **ADR-006** (responsive web, no PWA): el offline es justamente lo que descartamos al no adoptar PWA.
- **R-02/R-03:** la fuente de verdad de la disponibilidad es el backend (PostgreSQL); una reserva offline diferida podría crear conflictos que CA-02 prohíbe.

## Comportamiento actual ante falta de red

No se silencia el problema: la SPA muestra el error de red en la pantalla con `aria-live` (mensaje "No se pudo conectar…" proveniente de la capa `api`), y la persona **reintenta** cuando recupera señal. No hay pérdida de datos porque no se encola nada: la reserva simplemente no se confirma hasta que el backend responde.

## Condición futura que reabriría la decisión

Se reconsiderará este Non-Goal (vía ADR que supersede a ADR-006) si se cumple **al menos una**:

1. Aparece un requisito real de **operación sin conectividad** (p. ej. el/la profesional gestiona la agenda en un local sin buena señal).
2. Se requiere **notificación push** al cliente (RF-05 ampliado), lo que empuja naturalmente hacia PWA.
3. El negocio se expande a **múltiples sucursales / trabajo de campo** (hoy NG-05).

## Estrategia si se reabriera (boceto, no implementado)

La evolución de menor costo sería **promover la SPA a PWA** con caché de lectura y cola de escritura optimista, resolviendo conflictos contra la disponibilidad del backend:

```mermaid
sequenceDiagram
    participant U as Usuario (offline)
    participant SW as Service Worker
    participant Q as Cola local (IndexedDB)
    participant API as Backend /api
    U->>SW: Reservar turno (sin red)
    SW->>Q: Encola operación (estado "pendiente")
    SW-->>U: Muestra "Reserva pendiente de sincronizar"
    Note over U,Q: Al recuperar conexión (evento online)
    Q->>API: POST /turnos (reintento idempotente)
    alt Franja disponible
        API-->>Q: 201 creado
        Q-->>U: "Reserva confirmada"
    else Franja tomada (CA-02)
        API-->>Q: 409 conflicto
        Q-->>U: "Esa franja ya no está disponible; elegí otra"
    end
```

> Este diagrama documenta la intención, **no** un feature del alcance actual. Sirve como punto de partida si la condición de reapertura se cumple.
