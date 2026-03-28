'use client'
import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
import ScoreInput from './ScoreInput'
import NoteInput from './NoteInput'
import NoteList from './NoteList'
import MatchSetup from './MatchSetup'
import WeatherWidget from './WeatherWidget'
import clsx from 'clsx'

interface Props { courtNumber: number }

export default function CourtDetail({ courtNumber }: Props) {
  const { courts, endMatch, clearCourt, deleteMatch, renamePlayer, setActiveCourt, courtCount } = useStore()
  const court = courts[courtNumber - 1]
  const [tab, setTab] = useState<'notes' | 'score'>('notes')
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [copied, setCopied] = useState(false)
  const [playerEmail, setPlayerEmail] = useState<string | null>(null)
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)

  useEffect(() => {
    fetch('/api/players')
      .then(r => r.json())
      .then((players: { name: string; email: string | null }[]) => {
        const found = players.find(p => p.name.toLowerCase() === court.playerName.toLowerCase())
        if (found?.email) setPlayerEmail(found.email)
        else setPlayerEmail(null)
      })
      .catch(() => {})
  }, [court.playerName])

  function goNext() {
    const next = courtNumber < courtCount ? courtNumber + 1 : 1
    setActiveCourt(next)
  }
  function goPrev() {
    const prev = courtNumber > 1 ? courtNumber - 1 : courtCount
    setActiveCourt(prev)
  }
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dy) > Math.abs(dx)) return  // vertical scroll, not a swipe
    if (Math.abs(dx) < 60) return
    if (dx < 0) goNext()
    else goPrev()
  }

  async function handleGenerateSummary() {
    setGeneratingSummary(true)
    setSummary(null)
    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: court.playerName,
        opponentName: court.opponentName,
        sets: court.sets,
        notes: court.notes,
      }),
    })
    const data = await res.json()
    setSummary(data.summary ?? data.error ?? 'Failed to generate summary')
    setGeneratingSummary(false)
  }

  async function handleExport() {
    const lines: string[] = []
    lines.push(`MATCH REPORT`)
    lines.push(`${court.playerName} vs ${court.opponentName}`)
    if (court.startedAt) lines.push(`Started: ${new Date(court.startedAt).toLocaleString()}`)
    lines.push(``)
    lines.push(`SCORE`)
    if (court.sets.length) {
      lines.push(court.sets.map((s, i) => {
        const tb = s.tiebreak ? ` (${s.tiebreak.player}–${s.tiebreak.opponent})` : ''
        return `Set ${i + 1}: ${s.player}–${s.opponent}${tb}`
      }).join('  '))
    } else {
      lines.push('No score recorded')
    }
    lines.push(``)
    lines.push(`NOTES (${court.notes.length})`)
    const sorted = [...court.notes].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    for (const n of sorted) {
      const tags = n.tags.length ? ` [${n.tags.join(', ')}]` : ''
      lines.push(`${new Date(n.timestamp).toLocaleTimeString()}${tags}: ${n.content}`)
    }
    if (summary) {
      lines.push(``)
      lines.push(`AI SUMMARY`)
      lines.push(summary)
    }
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (court.status === 'empty') return <MatchSetup courtNumber={courtNumber} />

  return (
    <div
      className="flex flex-col h-full max-h-[calc(100vh-56px)]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Match header */}
      <div className="px-5 py-4 border-b border-gray-800 flex-shrink-0">
        <p className="text-xs text-gray-600 font-semibold uppercase tracking-widest mb-1">Court {courtNumber}</p>
        <div className="flex items-start justify-between">
          <div>
            {editingName ? (
              <input
                autoFocus
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={() => { renamePlayer(courtNumber, nameValue); setEditingName(false) }}
                onKeyDown={e => { if (e.key === 'Enter') { renamePlayer(courtNumber, nameValue); setEditingName(false) } if (e.key === 'Escape') setEditingName(false) }}
                className="bg-gray-800 text-white font-bold text-lg rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-green-500 w-48"
              />
            ) : (
              <div className="flex items-center gap-1">
                <h2 className="text-white font-bold text-lg leading-tight">
                  {court.matchType === 'doubles' && court.playerName2
                    ? `${court.playerName} / ${court.playerName2}`
                    : court.playerName}
                </h2>
                {court.status === 'active' && (
                  <button
                    onClick={() => { setNameValue(court.playerName); setEditingName(true) }}
                    className="text-gray-600 hover:text-gray-400 transition text-sm"
                    title="Rename player"
                  >
                    ✏️
                  </button>
                )}
              </div>
            )}
            <p className="text-gray-400 text-sm">
              vs {court.matchType === 'doubles' && court.opponentName2
                ? `${court.opponentName} / ${court.opponentName2}`
                : court.opponentName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {court.weatherSnapshot && (
              <WeatherWidget weather={court.weatherSnapshot} compact />
            )}
            {court.status === 'active' && !confirmEnd && !confirmDelete && (
              <div className="flex gap-1">
                <button
                  onClick={() => setConfirmEnd(true)}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition"
                >
                  End Match
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-gray-600 hover:text-red-400 hover:bg-gray-800 px-2 py-1.5 rounded-lg transition"
                  title="Delete match"
                >
                  🗑
                </button>
              </div>
            )}
            {court.status === 'active' && confirmEnd && (
              <div className="flex gap-1">
                <button
                  onClick={async () => { await endMatch(courtNumber); setConfirmEnd(false) }}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition"
                >
                  Confirm End
                </button>
                <button
                  onClick={() => setConfirmEnd(false)}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            )}
            {confirmDelete && (
              <div className="flex gap-1">
                <button
                  onClick={async () => { await deleteMatch(courtNumber); setConfirmDelete(false) }}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition"
                >
                  Delete?
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            )}
            {court.status === 'finished' && !confirmDelete && (
              <div className="flex gap-1">
                <button
                  onClick={() => clearCourt(courtNumber)}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition"
                >
                  Clear
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-gray-600 hover:text-red-400 hover:bg-gray-800 px-2 py-1.5 rounded-lg transition"
                  title="Delete match"
                >
                  🗑
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {(['notes', 'score'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition capitalize',
                tab === t
                  ? 'bg-green-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'score' ? (
          <ScoreInput courtNumber={courtNumber} />
        ) : (
          <div className="flex flex-col h-full">
            {court.status === 'active' && (
              <div className="px-5 pt-4 flex-shrink-0">
                <NoteInput courtNumber={courtNumber} />
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <NoteList notes={court.notes} />
            </div>
          </div>
        )}
      </div>

      {court.status === 'finished' && (
        <div className="px-5 py-4 border-t border-gray-800 flex-shrink-0 space-y-2">
          <button
            onClick={handleGenerateSummary}
            disabled={generatingSummary}
            className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition"
          >
            {generatingSummary ? 'Generating summary...' : '✦ Generate AI Summary'}
          </button>
          {summary && (
            <div className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-4">
              <p className="text-purple-200 text-sm leading-relaxed">{summary}</p>
            </div>
          )}
          <button
            onClick={handleExport}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold rounded-xl px-4 py-2.5 transition"
          >
            {copied ? '✓ Copied to clipboard' : '↗ Export Notes'}
          </button>
          {playerEmail && (
            <a
              href={`mailto:${playerEmail}?subject=${encodeURIComponent(`Match Report: ${court.playerName} vs ${court.opponentName}`)}&body=${encodeURIComponent(
                [
                  `MATCH REPORT`,
                  `${court.playerName} vs ${court.opponentName}`,
                  court.startedAt ? `Started: ${new Date(court.startedAt).toLocaleString()}` : '',
                  ``,
                  `SCORE`,
                  court.sets.length
                    ? court.sets.map((s, i) => `Set ${i + 1}: ${s.player}–${s.opponent}${s.tiebreak ? ` (${s.tiebreak.player}–${s.tiebreak.opponent})` : ''}`).join('  ')
                    : 'No score recorded',
                  ``,
                  `NOTES (${court.notes.length})`,
                  ...[...court.notes].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map(n => `${new Date(n.timestamp).toLocaleTimeString()}${n.tags.length ? ` [${n.tags.join(', ')}]` : ''}: ${n.content}`),
                  ...(summary ? [``, `AI SUMMARY`, summary] : []),
                ].filter(l => l !== undefined).join('\n')
              )}`}
              className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition"
            >
              📧 Send to {playerEmail}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
