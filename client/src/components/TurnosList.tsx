import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { TurnoDetalle } from '../types'

const ESTADOS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  COMPLETADO: 'Completado',
}

const COLOR_ESTADO: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  CONFIRMADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
  COMPLETADO: 'bg-gray-100 text-gray-700',
}

const PUNTO_ESTADO: Record<string, string> = {
  PENDIENTE: 'bg-yellow-500',
  CONFIRMADO: 'bg-green-600',
  CANCELADO: 'bg-red-600',
  COMPLETADO: 'bg-gray-400',
}

interface Props {
  clienteId: string
}

export default function TurnosList({ clienteId }: Props) {
  const [turnos, setTurnos] = useState<TurnoDetalle[]>([])
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  function cargar() {
    setCargando(true)
    setError('')
    api
      .turnos()
      .then((todos) => {
        setTurnos(
          todos
            .filter((t) => t.clienteId === clienteId)
            .sort((a, b) => (a.fecha > b.fecha ? 1 : -1)),
        )
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los turnos')
      })
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId])

  async function cancelar(id: string) {
    if (!window.confirm('¿Cancelar este turno?')) return
    try {
      await api.cancelarTurno(id)
      cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar el turno')
    }
  }

  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-lg font-semibold">Mis turnos</h2>

      {error && <p className="mt-2 text-sm text-red-600" aria-live="polite">{error}</p>}
      {cargando && <p className="mt-2 text-sm text-gray-500">Cargando…</p>}

      {!cargando && turnos.length === 0 && (
        <p className="mt-2 text-sm text-gray-500">Todavía no tenés turnos reservados.</p>
      )}

      <ul className="mt-4 space-y-3">
        {turnos.map((t) => {
          const color = COLOR_ESTADO[t.estado] ?? 'bg-gray-100 text-gray-700'
          const punto = PUNTO_ESTADO[t.estado] ?? 'bg-gray-400'
          const esCancelable = t.estado !== 'CANCELADO' && t.estado !== 'COMPLETADO'
          return (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3">
              <div>
                <p className="font-medium">
                  {t.servicio?.nombre ?? 'Servicio'} · {t.profesional?.nombre ?? 'Profesional'}
                </p>
                <p className="text-sm text-gray-500">
                  {t.fecha.slice(0, 10)} a las {t.horaInicio} hs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${color}`}>
                  <span aria-hidden="true" className={`mr-1.5 inline-block size-2 rounded-full ${punto}`} />
                  {ESTADOS[t.estado] ?? t.estado}
                </span>
                {esCancelable && (
                  <button
                    onClick={() => cancelar(t.id)}
                    className="text-sm text-red-600 hover:underline focus-visible:outline-2 focus-visible:outline-blue-500"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}