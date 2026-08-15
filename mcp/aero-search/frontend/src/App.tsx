import { useState } from 'react'
import { Button } from '@/components/ui/button'

const API_URL = import.meta.env.VITE_API_URL ?? ''

const AIRPORTS = [
  { code: 'FLN', name: 'Florianópolis' },
  { code: 'CGH', name: 'São Paulo (Congonhas)' },
  { code: 'GRU', name: 'São Paulo (Guarulhos)' },
]

interface Flight {
  id: number
  flight_number: string
  origin: string
  destination: string
  departure_time: string
  arrival_time: string
  price: number
  airline_name: string
  airline_code: string
  aircraft_model: string
}

interface SearchResult {
  outbound: Flight[]
  return: Flight[]
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(price: number) {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function FlightCard({ flight }: { flight: Flight }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-foreground">{flight.flight_number}</p>
          <p className="text-sm text-muted-foreground">
            {flight.airline_name} ({flight.airline_code})
          </p>
        </div>
        <p className="text-lg font-bold text-primary">{formatPrice(flight.price)}</p>
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm">
        <span className="font-medium">{flight.origin}</span>
        <span className="text-muted-foreground">→</span>
        <span className="font-medium">{flight.destination}</span>
        <span className="ml-auto text-muted-foreground">
          {formatTime(flight.departure_time)} – {formatTime(flight.arrival_time)}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{flight.aircraft_model}</p>
    </div>
  )
}

function FlightList({ title, flights }: { title: string; flights: Flight[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">
        {title} <span className="text-muted-foreground font-normal">({flights.length})</span>
      </h2>
      {flights.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum voo encontrado.</p>
      ) : (
        <div className="grid gap-3">
          {flights.map((flight) => (
            <FlightCard key={flight.id} flight={flight} />
          ))}
        </div>
      )}
    </section>
  )
}

function App() {
  const [origin, setOrigin] = useState('FLN')
  const [destination, setDestination] = useState('CGH')
  const [date, setDate] = useState('2026-06-05')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const params = new URLSearchParams({ origin, destination, date })
      const response = await fetch(`${API_URL}/api/flights/search?${params}`)

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? `Erro ao buscar voos (${response.status})`)
      }

      const data: SearchResult = await response.json()
      setResults(data)
    } catch (err) {
      if (err instanceof TypeError) {
        setError('Não foi possível conectar à API. Verifique se o backend está rodando.')
      } else {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Aero Search</h1>
          <p className="mt-1 text-muted-foreground">
            Busca de voos FLN ↔ CGH / GRU
          </p>
        </header>

        <form
          onSubmit={handleSearch}
          className="rounded-xl border bg-card p-6 shadow-sm space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="text-sm font-medium text-foreground">Origem</span>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {AIRPORTS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} – {a.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-foreground">Destino</span>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {AIRPORTS.filter((a) => a.code !== origin).map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} – {a.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-foreground">Data</span>
              <input
                type="date"
                value={date}
                min="2026-06-01"
                max="2026-06-12"
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Buscando...' : 'Buscar voos'}
          </Button>
        </form>

        {error && (
          <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {results && (
          <div className="mt-8 space-y-8">
            <FlightList title="Voos de ida" flights={results.outbound} />
            <FlightList title="Voos de volta" flights={results.return} />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
