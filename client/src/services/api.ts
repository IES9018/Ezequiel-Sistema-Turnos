import type { AuthResponse, Profesional, Servicio, Turno, TurnoDetalle } from '../types'

const BASE = '/api'

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    let mensaje = `Error ${res.status}`
    try {
      const body = (await res.json()) as ApiEnvelope<unknown>
      if (body.error) mensaje = body.error
    } catch {
      mensaje = `Error ${res.status}`
    }
    throw new Error(mensaje)
  }

  const body = (await res.json()) as ApiEnvelope<T>
  if (!body.success) throw new Error(body.error ?? 'Respuesta inválida')
  return body.data as T
}

interface Reserva {
  clienteId: string
  profesionalId: string
  servicioId: string
  fecha: string
  horaInicio: string
}

export const api = {
  register(nombre: string, email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre, email, password }),
    })
  },

  login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  servicios(): Promise<Servicio[]> {
    return request<Servicio[]>('/servicios')
  },

  profesionales(): Promise<Profesional[]> {
    return request<Profesional[]>('/profesionales')
  },

  reservar(datos: Reserva): Promise<Turno> {
    return request<Turno>('/turnos', {
      method: 'POST',
      body: JSON.stringify(datos),
    })
  },

  turnos(): Promise<TurnoDetalle[]> {
    return request<TurnoDetalle[]>('/turnos')
  },

  cancelarTurno(id: string): Promise<Turno> {
    return request<Turno>(`/turnos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'CANCELADO' }),
    })
  },
}