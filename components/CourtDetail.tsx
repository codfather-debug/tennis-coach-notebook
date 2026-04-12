'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useStore } from '@/lib/store'
import ScoreInput from './ScoreInput'
import NoteInput from './NoteInput'
import NoteList from './NoteList'
import MatchSetup from './MatchSetup'
import WeatherWidget from './WeatherWidget'
import QuickLogPanel from './QuickLogPanel'
import DoublesServingPanel, { DoublesState } from './DoublesServingPanel'
import clsx from 'clsx'

const COURT_COLORS = [
  { bg: 'bg-blue-500',    text: 'text-blue-500' },
  { bg: 'bg-emerald-500', text: 'text-emerald-500' },
  { bg: 'bg-purple-500',  text: 'text-purple-500' },
  { bg: 'bg-orange-500',  text: 'text-orange-500' },
  { bg: 'bg-pink-500',    text: 'text-pink-500' },
  { bg: 'bg-cyan-500',    text: 'text-cyan-500' },
  { bg: 'bg-yellow-500',  text: 'text-yellow-500' },
  { bg: 'bg-red-500',     text: 'text-red-500' },
  { bg: 'bg-indigo-500',  text: 'text-indigo-500' },
  { bg: 'bg-teal-500',    text: 'text-teal-500' },
  { bg: 'bg-lime-500',    text: 'text-lime-500' },
  { bg: 'bg-rose-500',    text: 'text-rose-500' },
  { bg: 'bg-violet-500',  text: 'text-violet-500' },
  { bg: 'bg-amber-500',   text: 'text-amber-500' },
]

const POSITIVE_TAGS = ['winner', 'ace', 'serve', 'net-play', 'highlight', 'great-decision', 'momentum']
const NEGATIVE_TAGS = ['unforced-error', 'double-fault', 'forced-error', 'mental-lapse']

interface Props { courtNumber: number }

export default function CourtDetail({ courtNumber }: Props) {
  const { courts, endMatch, clearCourt, deleteMatch, renamePlayer, setActiveCourt, courtCount, deleteNote, saveAISummary } = useStore()
  const court = courts[courtNumber - 1]
  const [tab, setTab] = useState<'notes' | 'score'>('notes')
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [summary, setSummary] = useState<string | null>(court.aiSummary ?? null)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [copied, setCopied] = useState(false)
  const [playerEmail, setPlayerEmail] = useState<string | null>(null)
  const [livePlayer, setLivePlayer] = useState<number | null>(null)
  const [liveOpponent, setLiveOpponent] = useState<number | null>(null)
  const [side, setSide] = useState<'serving' | 'returning' | null>(null)
  const [doublesState, setDoublesState] = useState<DoublesState | null>(null)
  const doublesStateRef = useRef<DoublesState | null>(null)
  doublesStateRef.current = doublesState
  const doublesStateCache = useRef<Map<number, DoublesState | null>>(new Map())
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchStartTime = useRef<number>(0)

  // Refs so cleanup always reads the latest values without stale closure
  const livePlayerRef = useRef(livePlayer)
  const liveOpponentRef = useRef(liveOpponent)
  const sideRef = useRef(side)
  livePlayerRef.current = livePlayer
  liveOpponentRef.current = liveOpponent
  sideRef.current = side

  // Per-court live score cache: save on leave, restore or init from set score on arrive
  const liveScoreCache = useRef<Map<number, { livePlayer: number | null; liveOpponent: number | null; side: 'serving' | 'returning' | null }>>(new Map())

  const hasLiveScore = livePlayer !== null && liveOpponent !== null

  const tally = useMemo(() => {
    const pos = court.notes.filter(n => n.tags.some(t => POSITIVE_TAGS.includes(t))).length
    const neg = court.notes.filter(n => n.tags.some(t => NEGATIVE_TAGS.includes(t))).length
    return { pos, neg, total: court.notes.length }
  }, [court.notes])

  useEffect(() => {
    const cached = liveScoreCache.current.get(courtNumber)
    if (cached) {
      setLivePlayer(cached.livePlayer)
      setLiveOpponent(cached.liveOpponent)
      setSide(cached.side)
    } else {
      // Init from the current set score
      const sets = courts[courtNumber - 1]?.sets ?? []
      const lastSet = sets[sets.length - 1]
      setLivePlayer(lastSet?.player ?? null)
      setLiveOpponent(lastSet?.opponent ?? null)
      setSide(null)
    }
    // Doubles state: restore from cache or init fresh
    const court = courts[courtNumber - 1]
    if (court.matchType === 'doubles' && court.status === 'active') {
      const cachedDoubles = doublesStateCache.current.get(courtNumber)
      if (cachedDoubles !== undefined) {
        setDoublesState(cachedDoubles)
      } else {
        setDoublesState({
          servingTeam: 1,
          team1ServerIdx: 0,
          team2ServerIdx: 0,
          team2DeuceIdx: null,
          team1DeuceIdx: null,
          gameInSet: 1,
          step: 'server-team',
        })
      }
    } else {
      setDoublesState(null)
    }
    return () => {
      liveScoreCache.current.set(courtNumber, {
        livePlayer: livePlayerRef.current,
        liveOpponent: liveOpponentRef.current,
        side: sideRef.current,
      })
      doublesStateCache.current.set(courtNumber, doublesStateRef.current)
    }
  }, [courtNumber])

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
    touchStartTime.current = Date.now()
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dy) > Math.abs(dx)) return  // vertical scroll, not a swipe
    if (Math.abs(dx) < 60) return
    const elapsed = Date.now() - touchStartTime.current
    const velocity = Math.abs(dx) / elapsed  // px/ms
    if (velocity < 0.3) return  // too slow — accidental drag
    if (dx < 0) goNext()
    else goPrev()
  }

  function handleNewGame() {
    setDoublesState(prev => {
      if (!prev) return prev
      const newTeam1ServerIdx: 0 | 1 = prev.servingTeam === 1
        ? (((prev.team1ServerIdx + 1) % 2) as 0 | 1)
        : prev.team1ServerIdx
      const newTeam2ServerIdx: 0 | 1 = prev.servingTeam === 2
        ? (((prev.team2ServerIdx + 1) % 2) as 0 | 1)
        : prev.team2ServerIdx
      const newServingTeam: 1 | 2 = prev.servingTeam === 1 ? 2 : 1
      return { ...prev, servingTeam: newServingTeam, team1ServerIdx: newTeam1ServerIdx, team2ServerIdx: newTeam2ServerIdx, gameInSet: prev.gameInSet + 1 }
    })
  }

  function handleNewSet() {
    setDoublesState({
      servingTeam: 1,
      team1ServerIdx: 0,
      team2ServerIdx: 0,
      team2DeuceIdx: null,
      team1DeuceIdx: null,
      gameInSet: 1,
      step: 'server-team',
    })
  }

  // For doubles, derive serving side from doublesState; for singles use manual toggle
  const effectiveSide: 'serving' | 'returning' | null =
    court.matchType === 'doubles' && doublesState?.step === 'ready'
      ? (doublesState.servingTeam === 1 ? 'serving' : 'returning')
      : court.matchType === 'singles' ? side : null

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
    const text = data.summary ?? data.error ?? 'Failed to generate summary'
    setSummary(text)
    if (data.summary) saveAISummary(courtNumber, text)
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
      <div className="border-b border-gray-800 flex-shrink-0 relative overflow-hidden">
        {/* Color accent bar */}
        <div className={clsx('h-1 w-full', COURT_COLORS[(courtNumber - 1) % COURT_COLORS.length].bg)} />
        <div className="px-5 py-4">
        {/* Watermark */}
        <div className={clsx('absolute right-3 top-1/2 -translate-y-1/2 text-[80px] font-black leading-none select-none pointer-events-none opacity-[0.06]', COURT_COLORS[(courtNumber - 1) % COURT_COLORS.length].text)}>
          {courtNumber}
        </div>
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
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'score' ? (
          <ScoreInput courtNumber={courtNumber} />
        ) : (
          <div className="flex flex-col h-full">
            {court.status === 'active' && (
              <div className="px-5 pt-4 flex-shrink-0 space-y-3">
                {/* Live score widget */}
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Current Score</span>
                    {hasLiveScore && (
                      <button
                        type="button"
                        onClick={() => { setLivePlayer(null); setLiveOpponent(null) }}
                        className="text-xs text-gray-600 hover:text-gray-400 transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 truncate">{court.playerName}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {[0,1,2,3,4,5,6].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setLivePlayer(prev => prev === n ? null : n)}
                          className={clsx(
                            'w-8 h-8 rounded-lg text-sm font-bold transition',
                            livePlayer === n
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 truncate">{court.opponentName}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {[0,1,2,3,4,5,6].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setLiveOpponent(prev => prev === n ? null : n)}
                          className={clsx(
                            'w-8 h-8 rounded-lg text-sm font-bold transition',
                            liveOpponent === n
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className={clsx(
                      'text-sm font-mono font-bold',
                      hasLiveScore ? 'text-white' : 'text-gray-700'
                    )}>
                      {hasLiveScore ? `${livePlayer}–${liveOpponent}` : '–'}
                    </span>
                    {court.matchType === 'singles' && (
                      <div className="flex gap-2">
                        {(['serving', 'returning'] as const).map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSide(prev => prev === s ? null : s)}
                            className={clsx(
                              'flex-1 text-sm px-4 py-2.5 rounded-xl border transition font-semibold capitalize',
                              side === s
                                ? 'bg-yellow-600/40 text-yellow-200 border-yellow-500/60'
                                : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500'
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    {court.matchType === 'doubles' && doublesState?.step === 'ready' && (
                      <span className={clsx(
                        'text-xs font-semibold px-2 py-1 rounded-lg',
                        doublesState.servingTeam === 1
                          ? 'bg-green-900/40 text-green-300'
                          : 'bg-red-900/40 text-red-300'
                      )}>
                        {doublesState.servingTeam === 1 ? 'Serving' : 'Returning'}
                      </span>
                    )}
                  </div>
                </div>

                {court.matchType === 'doubles' && doublesState && (
                  <DoublesServingPanel
                    player1={court.playerName}
                    player2={court.playerName2}
                    opp1={court.opponentName}
                    opp2={court.opponentName2}
                    state={doublesState}
                    onStateChange={setDoublesState}
                    onNewGame={handleNewGame}
                    onNewSet={handleNewSet}
                  />
                )}
                <NoteInput
                  courtNumber={courtNumber}
                  livePlayer={livePlayer}
                  liveOpponent={liveOpponent}
                  side={effectiveSide}
                />
                <QuickLogPanel courtNumber={courtNumber} livePlayer={livePlayer} liveOpponent={liveOpponent} side={effectiveSide} />
              </div>
            )}
            {court.status === 'finished' && (
              <div className="px-5 pt-4 flex-shrink-0 space-y-3">
                {/* Compact score display */}
                {court.sets.length > 0 && (
                  <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex-shrink-0">Final</span>
                    <span className="text-sm font-mono font-bold text-white">
                      {court.sets.map(s => `${s.player}–${s.opponent}`).join('  ')}
                    </span>
                  </div>
                )}
                <NoteInput
                  courtNumber={courtNumber}
                  livePlayer={null}
                  liveOpponent={null}
                  side={null}
                />
                <QuickLogPanel courtNumber={courtNumber} livePlayer={null} liveOpponent={null} side={null} />
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {court.notes.length > 0 && (
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-800">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{tally.total} notes</span>
                  <span className="text-xs font-bold text-green-400">✅ {tally.pos}</span>
                  <span className="text-xs font-bold text-red-400">⚠️ {tally.neg}</span>
                </div>
              )}
              <NoteList notes={court.notes} onDelete={(id) => deleteNote(courtNumber, id)} />
            </div>
          </div>
        )}
      </div>

      {court.status === 'finished' && (
        <div className="px-5 py-4 border-t border-gray-800 flex-shrink-0 space-y-2">
          {/* Quick stats */}
          {court.notes.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-1">
              <div className="bg-gray-900 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-white">{tally.total}</p>
                <p className="text-xs text-gray-500 mt-0.5">Notes</p>
              </div>
              <div className="bg-green-950/40 border border-green-800/40 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-green-400">{tally.pos}</p>
                <p className="text-xs text-green-600 mt-0.5">Positive</p>
              </div>
              <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-red-400">{tally.neg}</p>
                <p className="text-xs text-red-600 mt-0.5">Errors</p>
              </div>
            </div>
          )}
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
