import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../services/api'
import type { Profesional, Servicio } from '../types'

interface Props {
  clienteId: string
  onReservado: () => void
}

interface Mensaje {
  tipo: 'ok' | 'err'
  texto: string
}

export default function ReservaForm({ clienteId, onReservado }: Props) {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [servicioId, setServicioId] = useState('')
  const [profesionalId, setProfesionalId] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)
  const [cargando, setCargando] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(true)
  const hoy = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    let activo = true
    Promise.all([api.servicios(), api.profesionales()])
      .then(([serviciosCargados, profesionalesCargados]) => {
        if (!activo) return
        setServicios(serviciosCargados)
        setProfesionales(profesionalesCargados)
      })
      .catch((err: unknown) => {
        if (!activo) return
        setMensaje({
          tipo: 'err',
          texto: err instanceof Error ? err.message : 'No se pudieron cargar los datos',
        })
      })
      .finally(() => {
        if (activo) setCargandoDatos(false)
      })
    return () => {
      activo = false
    }
  }, [])

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setMensaje(null)

    if (fecha < hoy) {
      setMensaje({ tipo: 'err', texto: 'La fecha no puede ser anterior a hoy.' })
      return
    }
    if (!servicioId || !profesionalId) {
      setMensaje({ tipo: 'err', texto: 'Elegí un servicio y un profesional.' })
      return
    }

    setCargando(true)
    try {
      const turno = await api.reservar({
        clienteId,
        profesionalId,
        servicioId,
        fecha,
        horaInicio: hora,
      })
      const servicio = servicios.find((s) => s.id === servicioId)
      setMensaje({
        tipo: 'ok',
        texto: `Turno reservado para el ${turno.fecha.slice(0, 10)} a las ${turno.horaInicio} hs${
          servicio ? ` (${servicio.nombre})` : ''
        }`,
      })
      setFecha('')
      setHora('')
      setServicioId('')
      setProfesionalId('')
      onReservado()
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'No se pudo reservar el turno'
      const mensajeClaro = /superpos/i.test(raw)
        ? 'Ya existe un turno en esa franja. Probá otra hora.'
        : raw
      setMensaje({ tipo: 'err', texto: mensajeClaro })
    } finally {
      setCargando(false)
    }
  }

  return (
    <section className="rounded-lg bg-white p-6 shadow" aria-busy={cargandoDatos}>
      <h2 className="text-lg font-semibold">Reservar turno</h2>

      {cargandoDatos ? (
        <p className="mt-2 text-sm text-gray-500">Cargando servicios y profesionales…</p>
      ) : (
        <>
          <form onSubmit={enviar} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium" htmlFor="servicio">
                Servicio
              </label>
              <select
                id="servicio"
                value={servicioId}
                onChange={(e) => setServicioId(e.target.value)}
                required
                className="mt-1 w-full rounded border px-3 py-2 focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                <option value="">Seleccioná un servicio</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.duracionMinutos} min — ${s.precio})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium" htmlFor="profesional">
                Profesional
              </label>
              <select
                id="profesional"
                value={profesionalId}
                onChange={(e) => setProfesionalId(e.target.value)}
                required
                className="mt-1 w-full rounded border px-3 py-2 focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                <option value="">Seleccioná un profesional</option>
                {profesionales.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.especialidad})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium" htmlFor="fecha">
                Fecha
              </label>
              <input
                id="fecha"
                type="date"
                min={hoy}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="mt-1 w-full rounded border px-3 py-2 focus-visible:outline-2 focus-visible:outline-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium" htmlFor="hora">
                Hora
              </label>
              <input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
                className="mt-1 w-full rounded border px-3 py-2 focus-visible:outline-2 focus-visible:outline-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <p aria-live="polite" className="mb-3 min-h-5 text-sm">
                {mensaje && (
                  <span
                    className={
                      mensaje.tipo === 'ok' ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {mensaje.texto}
                  </span>
                )}
              </p>
              <button
                type="submit"
                disabled={cargando || cargandoDatos}
                className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                {cargando ? 'Reservando…' : 'Confirmar reserva'}
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  )
}