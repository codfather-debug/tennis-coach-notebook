'use client'
import { useState } from 'react'
import type { SetScore, Note, WeatherSnapshot } from '@/types'
import { NOTE_TAGS } from '@/types'
import { format } from 'date-fns'
import Link from 'next/link'
import clsx from 'clsx'
import WeatherWidget from './WeatherWidget'

interface MatchRow {
  id: string
  court_number: number
  player_name: string
  opponent_name: string
  sets: SetScore[]
  notes: Note[]
  weather_snapshot: WeatherSnapshot | null
  started_at: string
  ended_at: string
}

interface Props { matches: MatchRow[] }

function computeResult(sets: SetScore[]): 'win' | 'loss' | 'unknown' {
  if (!sets.length) return 'unknown'
  const wins = sets.filter(s => s.player > s.opponent).length
  const losses = sets.filter(s => s.opponent > s.player).length
  if (wins > losses) return 'win'
  if (losses > wins) return 'loss'
  return 'unknown'
}

export default function HistoryClient({ matches }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    matches[0]?.id ?? null
  )
  const selected = matches.find(m => m.id === selectedId)

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <Link href="/dashboard" className="text-gray-400 hover:text-white transition text-sm">← Dashboard</Link>
        <h1 className="text-white font-bold">Match History</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Match list */}
        <div className="w-72 border-r border-gray-800 overflow-y-auto flex-shrink-0">
          {matches.length === 0 && (
            <p className="text-gray-600 text-sm text-center p-8">No finished matches yet</p>
          )}
          {matches.map(m => {
            const result = computeResult(m.sets)
            return (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={clsx(
                  'w-full text-left px-4 py-3 border-b border-gray-800/50 hover:bg-gray-900/50 transition',
                  selectedId === m.id && 'bg-gray-900 border-l-2 border-l-green-500'
                )}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-gray-500">Court {m.court_number}</span>
                  <span className={clsx(
                    'text-xs font-bold',
                    result === 'win' ? 'text-green-400' : result === 'loss' ? 'text-red-400' : 'text-gray-500'
                  )}>
                    {result === 'win' ? 'W' : result === 'loss' ? 'L' : '—'}
                  </span>
                </div>
                <p className="text-white text-sm font-medium truncate">{m.player_name}</p>
                <p className="text-gray-500 text-xs truncate">vs {m.opponent_name}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {m.sets.map(s => `${s.player}–${s.opponent}`).join('  ')}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  {format(new Date(m.ended_at), 'MMM d, yyyy')}
                </p>
              </button>
            )
          })}
        </div>

        {/* Match detail */}
        <div className="flex-1 overflow-y-auto p-6">
          {selected ? (
            <MatchDetail match={selected} />
          ) : (
            <p className="text-gray-600 text-sm text-center mt-16">Select a match</p>
          )}
        </div>
      </div>
    </div>
  )
}

function MatchDetail({ match }: { match: MatchRow }) {
  const result = computeResult(match.sets)
  const [summary, setSummary] = useState<string | null>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)

  async function handleGenerateSummary() {
    setGeneratingSummary(true)
    setSummary(null)
    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: match.player_name,
        opponentName: match.opponent_name,
        sets: match.sets,
        notes: match.notes,
      }),
    })
    const data = await res.json()
    setSummary(data.summary ?? data.error ?? 'Failed to generate summary')
    setGeneratingSummary(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-white font-bold text-xl">{match.player_name}</h2>
          <span className={clsx(
            'text-sm font-bold px-2 py-0.5 rounded',
            result === 'win' ? 'bg-green-900/50 text-green-400' :
            result === 'loss' ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-400'
          )}>
            {result === 'win' ? 'WIN' : result === 'loss' ? 'LOSS' : '—'}
          </span>
        </div>
        <p className="text-gray-400">vs {match.opponent_name} · Court {match.court_number}</p>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(match.started_at), 'PPp')}
          {match.ended_at && ` → ${format(new Date(match.ended_at), 'p')}`}
        </p>
      </div>

      {/* Score */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Score</h3>
        {match.sets.length === 0 ? (
          <p className="text-gray-600 text-sm">No score recorded</p>
        ) : (
          <div className="flex gap-4">
            {match.sets.map((set, i) => (
              <div key={i} className="text-center">
                <p className="text-gray-500 text-xs mb-1">Set {i + 1}</p>
                <p className="text-white font-bold text-xl tabular-nums">
                  {set.player}–{set.opponent}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weather */}
      {match.weather_snapshot && (
        <div>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Weather at Match</h3>
          <WeatherWidget weather={match.weather_snapshot} />
        </div>
      )}

      {/* Notes */}
      <div>
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
          Notes ({match.notes.length})
        </h3>
        {match.notes.length === 0 ? (
          <p className="text-gray-600 text-sm">No notes for this match</p>
        ) : (
          <div className="space-y-3">
            {match.notes
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              .map(note => (
                <div key={note.id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-3">
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {note.tags.map(tag => (
                        <span
                          key={tag}
                          className={clsx(
                            'text-xs px-2 py-0.5 rounded-full border',
                            NOTE_TAGS.find(t => t.value === tag)?.color ?? 'bg-gray-700 text-gray-300 border-gray-600'
                          )}
                        >
                          {NOTE_TAGS.find(t => t.value === tag)?.label ?? tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-gray-200 text-sm">{note.content}</p>
                  <p className="text-gray-600 text-xs mt-2">
                    {format(new Date(note.timestamp), 'h:mm a')}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* AI Summary */}
      <div className="pt-2">
        <button
          onClick={handleGenerateSummary}
          disabled={generatingSummary}
          className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition"
        >
          {generatingSummary ? 'Generating summary...' : '✦ Generate AI Summary'}
        </button>
        {summary && (
          <div className="mt-3 bg-purple-950/30 border border-purple-800/40 rounded-xl p-4">
            <p className="text-purple-200 text-sm leading-relaxed">{summary}</p>
          </div>
        )}
      </div>
    </div>
  )
}
