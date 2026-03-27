'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import clsx from 'clsx'

interface Props { courtNumber: number }

interface Player {
  id: string
  name: string
  email: string | null
}

export default function MatchSetup({ courtNumber }: Props) {
  const { setupCourt } = useStore()
  const [playerName, setPlayerName] = useState('')
  const [opponentName, setOpponentName] = useState('')
  const [loading, setLoading] = useState(false)
  const [roster, setRoster] = useState<Player[]>([])

  useEffect(() => {
    fetch('/api/players')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRoster(data) })
      .catch(() => {})
  }, [])

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!playerName.trim() || !opponentName.trim()) return
    setLoading(true)
    await setupCourt(courtNumber, playerName.trim(), opponentName.trim())
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center h-full px-6">
      <div className="w-full max-w-sm">
        <h3 className="text-white font-bold text-lg mb-1">Set Up Court {courtNumber}</h3>
        <p className="text-gray-500 text-sm mb-5">Enter player names to start tracking</p>
        <form onSubmit={handleStart} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Your Player</label>
            {roster.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {roster.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlayerName(p.name)}
                    className={clsx(
                      'text-xs px-3 py-1.5 rounded-full border transition font-medium',
                      playerName === p.name
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            <input
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Or type a name..."
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Opponent</label>
            <input
              value={opponentName}
              onChange={e => setOpponentName(e.target.value)}
              placeholder="Opponent name"
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-3 transition text-sm"
          >
            {loading ? 'Starting...' : 'Start Match'}
          </button>
        </form>
      </div>
    </div>
  )
}
