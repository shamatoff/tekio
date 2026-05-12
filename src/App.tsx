import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <div className="min-h-screen bg-bg font-sans">
      <header className="bg-surface border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold text-primary">Tekiō</h1>
      </header>
      <main className="px-4 py-6">
        <Routes>
          <Route
            path="/"
            element={<p className="text-sm text-muted">Ready for component migration.</p>}
          />
        </Routes>
      </main>
    </div>
  )
}
