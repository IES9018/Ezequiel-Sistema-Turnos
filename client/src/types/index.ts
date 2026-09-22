export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: 'ADMIN' | 'CLIENTE'
}

export interface AuthResponse {
  token: string
  usuario: Usuario
}

export interface Servicio {
  id: string
  nombre: string
  duracionMinutos: number
  precio: number
  activo: boolean
}

export interface Profesional {
  id: string
  nombre: string
  email: string
  especialidad: string
  activo: boolean
}

export interface Turno {
  id: string
  clienteId: string
  profesionalId: string
  servicioId: string
  fecha: string
  horaInicio: string
  horaFin: string
  estado: string
}

export interface TurnoDetalle extends Turno {
  cliente?: { id: string; nombre: string; email: string }
  profesional?: { id: string; nombre: string }
  servicio?: { id: string; nombre: string; precio: number }
}

export type AuthMode = 'login' | 'register'
export type TurnoEstado = 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'COMPLETADO'