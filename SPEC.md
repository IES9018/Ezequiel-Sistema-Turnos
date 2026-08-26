# SPEC-000: Sistema de Turnos — Peluquería/Barbería

## 1. Contexto y Propósito

Una peluquería/barbería necesita digitalizar la gestión de turnos para reducir la pérdida de clientes por demoras, llamados telefónicos y sobrecupos. El sistema permite a los clientes reservar turnos online seleccionando servicio, profesional y franja horaria, y al administrador gestionar la agenda, los profesionales y los servicios offered.

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
