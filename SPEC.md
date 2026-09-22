# SPEC-000: Sistema de Turnos — Peluquería/Barbería

## 1. Contexto y Propósito

Una peluquería/barbería necesita digitalizar la gestión de turnos para reducir la pérdida de clientes por demoras, llamados telefónicos y sobrecupos. El sistema permite a los clientes reservar turnos online seleccionando servicio, profesional y franja horaria, y al administrador gestionar la agenda, los profesionales y los servicios ofrecidos.

## 2. Requerimientos Funcionales

- [ ] **RF-01:** Alta, baja y modificación de servicios (nombre, duración, precio).
- [ ] **RF-02:** Alta, baja y modificación de profesionales (nombre, especialidad, disponibilidad semanal).
- [ ] **RF-03:** Visualización de disponibilidad en calendario por día y profesional.
- [ ] **RF-04:** Reserva de turno por parte del cliente (seleccionando servicio, profesional y fecha/hora disponible).
- [ ] **RF-05:** Confirmación automática del turno por email o notificación.
- [ ] **RF-06:** Listado de turnos del día para el administrador (vista diaria/semanal).
- [ ] **RF-07:** Cancelación de turno por parte del cliente con antelación mínima configurable.
- [ ] **RF-08:** Dashboard administrativo con métricas básicas (turnos por día, ocupación, servicios más solicitados).
- [ ] **RF-09:** Registro y login de usuarios (cliente y administrador) con roles diferenciados.
- [ ] **RF-10:** Horarios especiales (feriados, días no laborables) configurables por el administrador.
- [ ] **RF-11:** Accesibilidad básica (WCAG AA) en las 2 pantallas críticas (reserva de turno y mis turnos): navegación completa por teclado y contraste de color AA (4.5:1 texto normal, 3:1 elementos gráficos).

## 3. Non-Goals (Límites del Alcance)

*Lo que explícitamente NO se construirá en esta etapa:*

- **NG-01:** No se implementará pasarela de pagos (los turnos son solo reserva, no cobro online).
- **NG-02:** No se implementará app móvil nativa (solo web responsive).
- **NG-03:** No se integrará con agendas de Google Calendar o similares.
- **NG-04:** No se implementará sistema de reseñas o valoraciones de profesionales.
- **NG-05:** No se implementará multi-sucursal (el sistema es para una única sucursal).

## 4. Stack Tecnológico y Restricciones

- **Frontend:** React 18+ con Vite, TypeScript, TailwindCSS.
- **Backend:** Node.js 20+ con Express, TypeScript.
- **Base de datos:** PostgreSQL 16+ con Prisma ORM.
- **Autenticación:** JWT (JSON Web Tokens) con bcrypt para hashes de contraseñas.
- **API REST:** Convenciones RESTful con respuestas JSON estandarizadas.
- **Despliegue:** Docker para desarrollo local; deploy en plataforma cloud a definir.

### Restricciones Arquitectónicas

*Decididas en los ADR de la organización; todo cambio estructural requiere un ADR nuevo (ver arnés v2).*

- **R-01:** El sistema adopta un **monolito modular** ([ADR-002](docs/adr/ADR-002-estilo-arquitectonico.md)): la API y las reglas de negocio viven en un único proceso desplegable, con módulos internos separados por dominio (auth, servicios, profesionales, turnos). No se introducen microservicios ni serverless.
- **R-02:** La persistencia es **relacional (PostgreSQL 16+)** y se accede **únicamente vía Prisma ORM** ([ADR-003](docs/adr/ADR-003-persistencia.md)). No se permite SQL directo fuera de Prisma.
- **R-03:** La **API es REST y sin estado**: el frontend es una SPA que consume HTTP/JSON; no se comparte estado entre server y client ([ADR-001](docs/adr/ADR-001-stack-tecnologico.md)).
- **R-04:** El framework de frontend está restringido a **React + Vite + TailwindCSS**. No se incorporan frameworks, bases de datos ni servicios externos que no estén declarados en un ADR aprobado.
- **R-05:** La autenticación es **JWT con bcrypt** y las reglas de negocio se validan siempre en backend (sostiene CA-02 y CA-05).

## 5. Contratos de Datos / Tipos

```typescript
interface Servicio {
  id: string;
  nombre: string;
  duracionMinutos: number;
  precio: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Profesional {
  id: string;
  nombre: string;
  email: string;
  especialidad: string;
  disponibilidad: DisponibilidadSemana;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Turno {
  id: string;
  clienteId: string;
  profesionalId: string;
  servicioId: string;
  fecha: Date;
  horaInicio: string;  // HH:mm
  horaFin: string;     // HH:mm
  estado: "pendiente" | "confirmado" | "cancelado" | "completado";
  createdAt: Date;
  updatedAt: Date;
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password: string;
  rol: "admin" | "cliente";
  createdAt: Date;
  updatedAt: Date;
}

interface DisponibilidadSemana {
  lunes: FranjaHoraria[];
  martes: FranjaHoraria[];
  miercoles: FranjaHoraria[];
  jueves: FranjaHoraria[];
  viernes: FranjaHoraria[];
  sabado: FranjaHoraria[];
  domingo: FranjaHoraria[];
}

interface FranjaHoraria {
  inicio: string;  // HH:mm
  fin: string;     // HH:mm
}
```

## 6. Criterios de Aceptación

- [ ] **CA-01:** El cliente puede reservar un turno seleccionando servicio, profesional y horario disponible sin recargar la página.
- [ ] **CA-02:** El sistema valida que no se superpongan turnos para un mismo profesional.
- [ ] **CA-03:** El administrador puede ver todos los turnos del día en una vista de calendario.
- [ ] **CA-04:** Los horarios especiales (feriados) impiden la reserva de turnos en esos días.
- [ ] **CA-05:** La contraseña de los usuarios está hasheada con bcrypt (nunca se almacena en texto plano).
- [ ] **CA-06:** La API retorna códigos HTTP correctos (200, 201, 400, 401, 404, 500) según la operación.
- [ ] **CA-07:** El frontend es responsive y funciona en desktop y mobile.

### 6.1 Criterios de Interfaz — formato Gherkin (v3)

Los criterios de aceptación que involucran las pantallas críticas se expresan en Gherkin (Given/When/Then):

**CA-01 — Reserva de turno sin recarga:**

```gherkin
Dado que el cliente inició sesión y existen servicios y profesionales cargados
Cuando selecciona un servicio, un profesional, una fecha posterior a hoy y una hora
Y presiona "Confirmar reserva"
Entonces el sistema valida la franja (CA-02) en el backend
Y muestra un mensaje de confirmación con fecha y hora
Y el turno aparece en "Mis turnos" sin recargar la página
```

**CA-03 — Vista diaria del administrador:**

```gherkin
Dado que el administrador inició sesión con rol ADMIN
Cuando accede a la agenda del día
Entonces ve la lista de turnos del día ordenados por hora
Y cada turno muestra su estado con etiqueta legible + marca visual no dependiente del color
```

**CA-07 — Responsive:**

```gherkin
Dado el usuario con sesión iniciada en cualquier dispositivo
Cuando abre la aplicación en una pantalla de 360px o mayor
Entonces el formulario de reserva y la lista de turnos se adaptan sin scroll horizontal
```

**CA-08 — Accesibilidad básica (RF-11):**

```gherkin
Dado un usuario navegando solo con el teclado en la pantalla de reserva o mis turnos
Cuando recorre los controles con la tecla Tab
Entonces alcanza todos los campos, botones y acciones en orden lógico
Y ve un indicador de foco visible en el elemento activo

Dado un usuario con sesión iniciada visualizando cualquier pantalla crítica
Cuando se comparan los pares de colores de textos y fondos
Entonces cumplen relación de contraste AA (4.5:1 texto, 3:1 gráficos)
Y el significado de un estado nunca depende solo del color
```

Nota: la corrección de los hallazgos H-01…H-04 (auditoría) y su trazabilidad están en `docs/diseno/auditoria-heuristica.md`.

## 7. Changelog

| Versión | Fecha | Motivo |
|---|---|---|
| v1 | 2026-08-25 | Versión inicial (TP1): alcance, requerimientos funcionales, Non-Goals y contratos de datos. |
| v2 | 2026-09-11 | TP2/Sprint 2: se agregan las Restricciones Arquitectónicas (R-01…R-05) que citan ADR-001/002/003, y se traza cada restricción a los criterios de aceptación. No hay altas/bajas de requerimientos: el alcance (RF y Non-Goals) se mantiene. |
| v3 | 2026-09-11 | TP3/Sprint 2 (T4): nuevo requisito RF-11 (accesibilidad WCAG AA en las 2 pantallas críticas) y se agrega la sección 6.1 con los criterios de interfaz en formato Gherkin (CA-01, CA-03, CA-07) + nuevo CA-08. Se incorpora la referencia a la auditoría heurística. |
