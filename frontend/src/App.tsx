import { useState, useEffect, FormEvent } from 'react'
import './App.css'

const API_URL = 'http://127.0.0.1:8000'

interface SearchResult {
  id: number
  title: string
  abstract: string
  category: string
  year: number
  score: number
}

const SAMPLE_QUERIES = [
  'reducing memory usage when training large models',
  'protecting against malicious prompts',
  'self-driving car perception in bad weather',
  'detecting AI-generated text',
]

function ScoreMeter({ score }: { score: number }) {
  // score is a cosine similarity in roughly [0, 1]
  const filled = Math.max(1, Math.round(score * 8))
  return (
    <div className="meter" aria-label={`Match strength ${Math.round(score * 100)} percent`}>
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={i} className={i < filled ? 'meter-tick meter-tick--on' : 'meter-tick'} />
      ))}
      <span className="meter-value">{score.toFixed(2)}</span>
    </div>
  )
}

function PaperModal({ paper, onClose }: { paper: SearchResult; onClose: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="card-top">
          <span className="card-id">No. {String(paper.id).padStart(3, '0')}</span>
          <span className="card-category">{paper.category}</span>
        </div>
        <h2 id="modal-title" className="modal-title">
          {paper.title}
        </h2>
        <p className="modal-year">Indexed entry · {paper.year}</p>
        <p className="modal-abstract">{paper.abstract}</p>
        <div className="modal-footer">
          <ScoreMeter score={paper.score} />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchedFor, setSearchedFor] = useState<string | null>(null)
  const [selected, setSelected] = useState<SearchResult | null>(null)

  async function runSearch(q: string) {
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, top_k: 5 }),
      })
      if (!res.ok) throw new Error(`Server responded with ${res.status}`)
      const data = await res.json()
      setResults(data.results)
      setSearchedFor(q)
    } catch (err) {
      setError(
        'Could not reach the search API. Make sure the FastAPI server is running on port 8000.'
      )
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    runSearch(query)
  }

  return (
    <div className="page">
      <header className="masthead">
        <p className="eyebrow">Vol. I — An index of abstracts</p>
        <h1>Cardex</h1>
        <p className="subhead">
          Search by meaning, not by keyword. The catalog below is indexed by embedding, so a
          query and a match don't need to share a single word.
        </p>
      </header>

      <form className="search-slip" onSubmit={handleSubmit}>
        <label htmlFor="query" className="search-label">
          Query
        </label>
        <div className="search-row">
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. shrinking a model to run on a phone"
            autoComplete="off"
          />
          <button type="submit" disabled={loading || !query.trim()}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
        <div className="samples">
          <span>Try:</span>
          {SAMPLE_QUERIES.map((s) => (
            <button
              type="button"
              key={s}
              className="sample-chip"
              onClick={() => {
                setQuery(s)
                runSearch(s)
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      <main className="results">
        {error && <p className="error">{error}</p>}

        {!error && results === null && !loading && (
          <p className="empty">Enter a query above to search the index.</p>
        )}

        {!error && results !== null && results.length === 0 && (
          <p className="empty">No matches found for "{searchedFor}".</p>
        )}

        {results && results.length > 0 && (
          <>
            <p className="results-meta">
              {results.length} result{results.length !== 1 ? 's' : ''} for
              <span className="results-meta-query"> "{searchedFor}"</span>
            </p>
            <ol className="card-list">
              {results.map((r) => (
                <li
                  className="card card--clickable"
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(r)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelected(r)
                    }
                  }}
                >
                  <div className="card-top">
                    <span className="card-id">No. {String(r.id).padStart(3, '0')}</span>
                    <span className="card-category">{r.category}</span>
                  </div>
                  <h2 className="card-title">{r.title}</h2>
                  <p className="card-abstract">{r.abstract}</p>
                  <ScoreMeter score={r.score} />
                </li>
              ))}
            </ol>
          </>
        )}
      </main>

      {selected && <PaperModal paper={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
