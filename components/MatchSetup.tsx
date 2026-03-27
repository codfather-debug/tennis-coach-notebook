'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'

interface Props { courtNumber: number }

export default function MatchSetup({ courtNumber }: Props) {
  const { setupCourt } = useStore()
  const [playerName, setPlayerName] = useState('')
  const [opponentName, setOpponentName] = useState('')
  const [loading, setLoading] = useState(false)

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
        <form onSubmit={handleStart} className="space-y-3">
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Your player"
            required
            autoFocus
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition text-sm"
          />
          <input
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
            placeholder="Opponent"
            required
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition text-sm"
          />
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
