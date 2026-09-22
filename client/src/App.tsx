import { useState } from 'react'
import type { Usuario } from './types'
import AuthForm from './components/AuthForm'
import ReservaForm from './components/ReservaForm'
import TurnosList from './components/TurnosList'

function leerUsuario(): Usuario | null {
  const raw = localStorage.getItem('usuario')
  if (!raw) return null
  try {
    return JSON.parse(raw) as Usuario
  } catch {
    return null
  }
}

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(leerUsuario)
  const [refreshTurnos, setRefreshTurnos] = useState(0)

  function guardarSesion(_token: string, u: Usuario) {
    localStorage.setItem('usuario', JSON.stringify(u))
    setUsuario(u)
  }

  function cerrarSesion() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">Barbería</h1>
          {usuario && (
            <div className="flex items-center gap-4">
              <span className="text-sm">Hola, {usuario.nombre}</span>
              <button onClick={cerrarSesion} className="text-sm text-blue-600 hover:underline">
                Salir
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        {usuario ? (
          <>
            <ReservaForm clienteId={usuario.id} onReservado={() => setRefreshTurnos((r) => r + 1)} />
            <TurnosList key={refreshTurnos} clienteId={usuario.id} />
          </>
        ) : (
          <AuthForm onAutenticado={guardarSesion} />
        )}
      </main>
    </div>
  )
}