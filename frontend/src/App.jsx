import { useEffect, useState } from 'react'
import { getExamples } from './services/api'
import './App.css'

function App() {
  const [examples, setExamples] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    getExamples()
      .then((data) => {
        setExamples(data)
        setStatus('success')
      })
      .catch((requestError) => {
        setError(requestError.message)
        setStatus('error')
      })
  }, [])

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Plataforma modular</p>
          <h1>Panel de soluciones</h1>
          <p className="subtitle">
            Frontend central para conectar los distintos módulos con la API.
          </p>
        </div>
        <span className="status-badge">Frontend activo</span>
      </header>

      <section className="module-card">
        <div>
          <p className="eyebrow">Módulo de ejemplo</p>
          <h2>Conexión con la API</h2>
          {status === 'loading' && <p>Consultando ejemplos...</p>}
          {status === 'error' && (
            <p className="error-message">
              No se pudo conectar con la API: {error}
            </p>
          )}
          {status === 'success' && (
            <p>
              La API respondió correctamente con {examples.length} ejemplo(s).
            </p>
          )}
        </div>
        {status === 'success' && examples.length > 0 && (
          <ul className="example-list">
            {examples.map((example) => (
              <li key={example.id}>{example.name}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="module-grid" aria-label="Módulos disponibles">
        <article className="module-placeholder">
          <span>01</span>
          <h2>Próxima solución</h2>
          <p>Agreguen cada solución como un módulo independiente.</p>
        </article>
        <article className="module-placeholder">
          <span>02</span>
          <h2>Otro módulo</h2>
          <p>Compartan autenticación, servicios y componentes comunes.</p>
        </article>
      </section>
    </main>
  )
}

export default App
