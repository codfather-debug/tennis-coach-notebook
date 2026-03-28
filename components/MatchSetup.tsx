'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import clsx from 'clsx'
import type { MatchType } from '@/types'

interface Props { courtNumber: number }

interface Player {
  id: string
  name: string
  email: string | null
}

export default function MatchSetup({ courtNumber }: Props) {
  const { setupCourt } = useStore()
  const [matchType, setMatchType] = useState<MatchType>('singles')
  const [playerName, setPlayerName] = useState('')
  const [playerName2, setPlayerName2] = useState('')
  const [opponentName, setOpponentName] = useState('')
  const [opponentName2, setOpponentName2] = useState('')
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
    if (!playerName.trim()) return
    if (matchType === 'doubles' && !playerName2.trim()) return
    setLoading(true)
    await setupCourt(courtNumber, {
      playerName: playerName.trim(),
      opponentName: opponentName.trim(),
      matchType,
      playerName2: matchType === 'doubles' ? playerName2.trim() : undefined,
      opponentName2: matchType === 'doubles' ? opponentName2.trim() : undefined,
    })
    setLoading(false)
  }

  function RosterChips({ onSelect, selected }: { onSelect: (name: string) => void; selected: string }) {
    if (!roster.length) return null
    return (
      <div className="flex flex-wrap gap-2 mb-2">
        {roster.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.name)}
            className={clsx(
              'text-sm px-4 py-2 rounded-full border transition font-medium',
              selected === p.name
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
            )}
          >
            {p.name}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-950">
      {/* Singles / Doubles toggle */}
      <div className="flex-shrink-0 flex gap-1 mx-6 mt-6 mb-6 bg-gray-900 p-1 rounded-xl">
        {(['singles', 'doubles'] as MatchType[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setMatchType(t)}
            className={clsx(
              'flex-1 py-2.5 rounded-lg text-sm font-semibold transition capitalize',
              matchType === t ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleStart} className="flex flex-col flex-1 px-6 gap-5">
        {/* Your side */}
        <div className="space-y-2">
          <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            {matchType === 'doubles' ? 'Your Team' : 'Your Player'}
          </label>
          <RosterChips onSelect={setPlayerName} selected={playerName} />
          <input
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder={matchType === 'doubles' ? 'Player 1' : 'Player name'}
            required
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
          />
          {matchType === 'doubles' && (
            <>
              <RosterChips onSelect={setPlayerName2} selected={playerName2} />
              <input
                value={playerName2}
                onChange={e => setPlayerName2(e.target.value)}
                placeholder="Player 2"
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
              />
            </>
          )}
        </div>

        {/* Opponent side */}
        <div className="space-y-2">
          <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            {matchType === 'doubles' ? 'Opponents' : 'Opponent'}
          </label>
          <input
            value={opponentName}
            onChange={e => setOpponentName(e.target.value)}
            placeholder={matchType === 'doubles' ? 'Opponent 1 (optional)' : 'Opponent name (optional)'}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
          />
          {matchType === 'doubles' && (
            <input
              value={opponentName2}
              onChange={e => setOpponentName2(e.target.value)}
              placeholder="Opponent 2 (optional)"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
            />
          )}
        </div>

        {/* Big start button */}
        <div className="mt-auto pb-6 pt-4">
          <button
            type="submit"
            disabled={!playerName.trim() || loading}
            className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl px-4 py-6 transition text-xl shadow-lg shadow-green-900/40"
          >
            {loading ? 'Starting...' : '▶ Start Match'}
          </button>
        </div>
      </form>
    </div>
  )
}
