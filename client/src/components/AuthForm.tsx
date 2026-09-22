import { useState, type FormEvent } from 'react'
import { api } from '../services/api'
import type { AuthMode, Usuario } from '../types'

interface Props {
  onAutenticado: (token: string, usuario: Usuario) => void
}

export default function AuthForm({ onAutenticado }: Props) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const res =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register(nombre, email, password)
      localStorage.setItem('token', res.token)
      onAutenticado(res.token, res.usuario)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="mx-auto max-w-md space-y-4 rounded-lg bg-white p-6 shadow">
      <h2 className="text-lg font-semibold">
        {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
      </h2>

      {mode === 'register' && (
        <div>
          <label className="block text-sm font-medium" htmlFor="nombre">
            Nombre
          </label>
          <input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={cargando}
        className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {cargando ? 'Procesando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login')
          setError('')
        }}
        className="w-full text-sm text-blue-600 hover:underline"
      >
        {mode === 'login' ? '¿No tenés cuenta? Registrate' : 'Ya tengo cuenta'}
      </button>
    </form>
  )
}