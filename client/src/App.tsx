function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Barbería</h1>
          <nav>
            <a href="#reservar" className="text-blue-600 hover:underline">
              Reservar turno
            </a>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-lg">Bienvenido al sistema de turnos.</p>
      </main>
    </div>
  )
}

export default App
