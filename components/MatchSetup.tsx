'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { createClient } from '@/lib/supabase'
import clsx from 'clsx'
import type { MatchType } from '@/types'

interface Props { courtNumber: number }

interface Player {
  id: string
  name: string
  email: string | null
}

interface RecentMatch {
  opponent_name: string
  sets: { player: number; opponent: number }[]
  pos: number
  neg: number
  total: number
}

export default function MatchSetup({ courtNumber }: Props) {
  const { setupCourt, courtTemplates, clearCourtTemplate } = useStore()
  const template = courtTemplates?.[courtNumber] ?? null
  const [matchType, setMatchType] = useState<MatchType>(template?.matchType ?? 'singles')
  const [playerName, setPlayerName] = useState(template?.playerName ?? '')
  const [playerName2, setPlayerName2] = useState(template?.playerName2 ?? '')
  const [opponentName, setOpponentName] = useState(template?.opponentName ?? '')
  const [opponentName2, setOpponentName2] = useState(template?.opponentName2 ?? '')
  const [loading, setLoading] = useState(false)
  const [roster, setRoster] = useState<Player[]>([])
  const [recentMatch, setRecentMatch] = useState<RecentMatch | null>(null)

  const POSITIVE_TAGS = ['winner', 'ace', 'serve', 'net-play', 'highlight', 'great-decision', 'momentum']
  const NEGATIVE_TAGS = ['unforced-error', 'double-fault', 'forced-error', 'mental-lapse']

  useEffect(() => {
    fetch('/api/players')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRoster(data) })
      .catch(() => {})
    // Load history for pre-filled player
    if (template?.playerName) loadPlayerHistory(template.playerName)
  }, [])

  async function loadPlayerHistory(name: string) {
    if (!name.trim()) { setRecentMatch(null); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('matches')
      .select('opponent_name, sets, notes(tags)')
      .eq('player_name', name)
      .eq('status', 'finished')
      .order('ended_at', { ascending: false })
      .limit(1)
    if (!data?.length) { setRecentMatch(null); return }
    const m = data[0]
    const notes: { tags: string[] }[] = (m.notes as any[]) ?? []
    const pos = notes.filter(n => n.tags?.some((t: string) => POSITIVE_TAGS.includes(t))).length
    const neg = notes.filter(n => n.tags?.some((t: string) => NEGATIVE_TAGS.includes(t))).length
    setRecentMatch({ opponent_name: m.opponent_name, sets: m.sets ?? [], pos, neg, total: notes.length })
  }

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
    clearCourtTemplate(courtNumber)
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
            onClick={() => { onSelect(p.name); loadPlayerHistory(p.name) }}
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
      {/* Template banner */}
      {template && (
        <div className="mx-6 mt-4 bg-yellow-950/40 border border-yellow-700/40 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-yellow-400 text-xs">📋</span>
          <p className="text-yellow-300 text-xs font-medium">Pre-filled from last meet — edit as needed</p>
        </div>
      )}
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
        <div className={clsx(
          'space-y-2',
          matchType === 'doubles' && 'bg-green-950/30 border border-green-800/40 rounded-xl p-3'
        )}>
          <label className={clsx(
            'text-xs uppercase tracking-wider font-semibold',
            matchType === 'doubles' ? 'text-green-400' : 'text-gray-500'
          )}>
            {matchType === 'doubles' ? 'Your Team' : 'Your Player'}
          </label>
          <RosterChips onSelect={setPlayerName} selected={playerName} />
          <input
            value={playerName}
            onChange={e => { setPlayerName(e.target.value); loadPlayerHistory(e.target.value) }}
            placeholder={matchType === 'doubles' ? 'Player 1' : 'Player name'}
            required
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
          />
          {recentMatch && (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 space-y-1">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Last match</p>
              <p className="text-sm text-gray-300">
                vs {recentMatch.opponent_name || 'Unknown'}{recentMatch.sets.length ? ' · ' + recentMatch.sets.map(s => `${s.player}–${s.opponent}`).join(' ') : ''}
              </p>
              {recentMatch.total > 0 && (
                <div className="flex gap-3 pt-0.5">
                  <span className="text-xs text-green-400 font-semibold">✅ {recentMatch.pos} positive</span>
                  <span className="text-xs text-red-400 font-semibold">⚠️ {recentMatch.neg} errors</span>
                  <span className="text-xs text-gray-500">{recentMatch.total} notes</span>
                </div>
              )}
            </div>
          )}
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
        <div className={clsx(
          'space-y-2',
          matchType === 'doubles' && 'bg-red-950/30 border border-red-800/40 rounded-xl p-3'
        )}>
          <label className={clsx(
            'text-xs uppercase tracking-wider font-semibold',
            matchType === 'doubles' ? 'text-red-400' : 'text-gray-500'
          )}>
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
