import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { TurnoDetalle } from '../types'

const ESTADOS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  COMPLETADO: 'Completado',
}

const ICONO_ESTADO: Record<string, string> = {
  PENDIENTE: '◷',
  CONFIRMADO: '✔',
  CANCELADO: '✕',
  COMPLETADO: '●',
}

const COLOR_ESTADO: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  CONFIRMADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
  COMPLETADO: 'bg-gray-100 text-gray-700',
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function AdminAgenda() {
  const [fecha, setFecha] = useState(hoyISO)
  const [turnos, setTurnos] = useState<TurnoDetalle[]>([])
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  function cambiarFecha(nueva: string) {
    setFecha(nueva)
    setCargando(true)
    setError('')
  }

  useEffect(() => {
    let activo = true
    api
      .turnos(fecha)
      .then((delDia) => {
        if (activo) setTurnos([...delDia].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)))
      })
      .catch((err: unknown) => {
        if (activo) setError(err instanceof Error ? err.message : 'No se pudo cargar la agenda')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [fecha])

  return (
    <section className="rounded-lg bg-white p-6 shadow" aria-busy={cargando}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Agenda del día</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="fecha-agenda" className="text-sm font-medium">
            Fecha
          </label>
          <input
            id="fecha-agenda"
            type="date"
            value={fecha}
            onChange={(e) => cambiarFecha(e.target.value)}
            className="rounded border px-3 py-2 focus-visible:outline-2 focus-visible:outline-blue-500"
          />
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600" aria-live="polite">
          {error}
        </p>
      )}
      {cargando && <p className="mt-2 text-sm text-gray-500">Cargando…</p>}
      {!cargando && turnos.length === 0 && (
        <p className="mt-2 text-sm text-gray-500">No hay turnos para esta fecha.</p>
      )}

      <ol className="mt-4 space-y-3">
        {turnos.map((t) => {
          const color = COLOR_ESTADO[t.estado] ?? 'bg-gray-100 text-gray-700'
          const icono = ICONO_ESTADO[t.estado] ?? '•'
          return (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold" aria-hidden="true">
                  {t.horaInicio}
                </span>
                <div>
                  <p className="font-medium">
                    {t.cliente?.nombre ?? 'Cliente'} · {t.servicio?.nombre ?? 'Servicio'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t.profesional?.nombre ?? 'Profesional'} — {t.horaInicio} a {t.horaFin} hs
                  </p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${color}`}>
                <span aria-hidden="true" className="mr-1.5">
                  {icono}
                </span>
                {ESTADOS[t.estado] ?? t.estado}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
