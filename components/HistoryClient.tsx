'use client'
import { useState, useMemo, useEffect } from 'react'
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
  player_name_2: string | null
  opponent_name: string
  opponent_name_2: string | null
  match_type: string | null
  meet_id: string | null
  sets: SetScore[]
  notes: Note[]
  weather_snapshot: WeatherSnapshot | null
  started_at: string
  ended_at: string
  ai_summary: string | null
}

interface MeetRow {
  id: string
  name: string
  created_at: string
}

interface Props {
  matches: MatchRow[]
  meets: MeetRow[]
}

function computeResult(sets: SetScore[]): 'win' | 'loss' | 'unknown' {
  if (!sets.length) return 'unknown'
  const wins = sets.filter(s => s.player > s.opponent).length
  const losses = sets.filter(s => s.opponent > s.player).length
  if (wins > losses) return 'win'
  if (losses > wins) return 'loss'
  return 'unknown'
}

export default function HistoryClient({ matches: initialMatches, meets: initialMeets }: Props) {
  const [matches, setMatches] = useState(initialMatches)
  const [meetList, setMeetList] = useState(initialMeets)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [expandedMeets, setExpandedMeets] = useState<Set<string>>(new Set())
  const [confirmDeleteMeetId, setConfirmDeleteMeetId] = useState<string | null>(null)
  const selected = matches.find(m => m.id === selectedId)
  const showDetail = !!selectedId

  async function handleDelete(id: string) {
    const supabase = (await import('@/lib/supabase')).createClient()
    await supabase.from('matches').delete().eq('id', id)
    const remaining = matches.filter(m => m.id !== id)
    setMatches(remaining)
    if (selectedId === id) setSelectedId(null)
  }

  async function handleDeleteMeet(id: string, deleteMatches: boolean) {
    await fetch('/api/meets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, deleteMatches }),
    })
    setMeetList(prev => prev.filter(m => m.id !== id))
    if (deleteMatches) {
      setMatches(prev => prev.filter(m => m.meet_id !== id))
    } else {
      setMatches(prev => prev.map(m => m.meet_id === id ? { ...m, meet_id: null } : m))
    }
    setConfirmDeleteMeetId(null)
  }

  function toggleMeet(meetId: string) {
    setExpandedMeets(prev => {
      const next = new Set(prev)
      if (next.has(meetId)) next.delete(meetId)
      else next.add(meetId)
      return next
    })
  }

  const filtered = useMemo(() => {
    let result = matches
    const q = search.toLowerCase().trim()
    if (q) {
      result = result.filter(m =>
        m.player_name.toLowerCase().includes(q) ||
        m.opponent_name.toLowerCase().includes(q) ||
        (m.player_name_2 ?? '').toLowerCase().includes(q) ||
        (m.opponent_name_2 ?? '').toLowerCase().includes(q)
      )
    }
    if (tagFilter) {
      result = result.filter(m => m.notes.some(n => n.tags.includes(tagFilter as any)))
    }
    return result
  }, [matches, search, tagFilter])

  // Matches grouped by meet
  const meetMatches = useMemo(() => {
    const result: { meet: MeetRow; matches: MatchRow[] }[] = []
    for (const meet of meetList) {
      const ms = filtered.filter(m => m.meet_id === meet.id)
      if (ms.length) result.push({ meet, matches: ms })
    }
    return result
  }, [filtered, meetList])

  // Standalone matches (no meet)
  const standaloneMatches = useMemo(() => filtered.filter(m => !m.meet_id), [filtered])

  // Group standalone by date
  const groupedStandalone = useMemo(() => {
    const groups: { date: string; matches: MatchRow[] }[] = []
    for (const m of standaloneMatches) {
      const date = m.ended_at ? format(new Date(m.ended_at), 'yyyy-MM-dd') : 'Unknown'
      const existing = groups.find(g => g.date === date)
      if (existing) existing.matches.push(m)
      else groups.push({ date, matches: [m] })
    }
    return groups
  }, [standaloneMatches])

  function MatchItem({ m }: { m: MatchRow }) {
    const result = computeResult(m.sets)
    const isDoubles = m.match_type === 'doubles'
    return (
      <div
        className={clsx(
          'relative border-b border-gray-800/50 group',
          selectedId === m.id && 'bg-gray-900 border-l-2 border-l-green-500'
        )}
      >
        <button
          onClick={() => setSelectedId(m.id)}
          className="w-full text-left px-4 py-3 hover:bg-gray-900/50 transition"
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs text-gray-500">
              Court {m.court_number}{isDoubles ? ' · Doubles' : ''}
            </span>
            <span className={clsx(
              'text-xs font-bold',
              result === 'win' ? 'text-green-400' : result === 'loss' ? 'text-red-400' : 'text-gray-500'
            )}>
              {result === 'win' ? 'W' : result === 'loss' ? 'L' : '—'}
            </span>
          </div>
          <p className="text-white text-sm font-medium truncate">
            {isDoubles && m.player_name_2 ? `${m.player_name} / ${m.player_name_2}` : m.player_name}
          </p>
          <p className="text-gray-500 text-xs truncate">
            vs {isDoubles && m.opponent_name_2 ? `${m.opponent_name} / ${m.opponent_name_2}` : m.opponent_name}
          </p>
          <p className="text-gray-500 text-xs mt-1 font-mono">
            {m.sets.map(s => `${s.player}–${s.opponent}${s.tiebreak ? ` (${s.tiebreak.player}–${s.tiebreak.opponent})` : ''}`).join('  ')}
          </p>
        </button>
        <button
          onClick={() => handleDelete(m.id)}
          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition p-1 rounded"
          title="Delete match"
        >
          🗑
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900/50 backdrop-blur flex-shrink-0">
        {showDetail ? (
          <button
            onClick={() => setSelectedId(null)}
            className="text-gray-400 hover:text-white transition text-sm lg:hidden"
          >
            ← Back
          </button>
        ) : (
          <Link href="/dashboard" className="text-gray-300 hover:text-white transition text-sm font-medium bg-gray-800/50 hover:bg-gray-700 px-4 py-2.5 rounded-xl">← Dashboard</Link>
        )}
        <h1 className="text-white font-bold">
          {showDetail && selected ? selected.player_name : 'Match History'}
        </h1>
        {!showDetail && (
          <Link href="/dashboard" className="ml-auto text-gray-300 hover:text-white transition text-sm font-medium bg-gray-800/50 hover:bg-gray-700 px-4 py-2.5 rounded-xl hidden lg:block">← Dashboard</Link>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* List */}
        <div className={clsx(
          'border-r border-gray-800 overflow-y-auto flex-shrink-0 flex flex-col',
          'w-full lg:w-72',
          showDetail ? 'hidden lg:flex' : 'flex'
        )}>
          <div className="p-3 border-b border-gray-800 flex-shrink-0 space-y-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search player..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
            />
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: 'winner',        label: 'Winner',   color: 'bg-green-600/30 text-green-300 border-green-500/50' },
                { value: 'unforced-error',label: 'UE',       color: 'bg-red-600/30 text-red-300 border-red-500/50' },
                { value: 'ace',           label: 'Ace',      color: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50' },
                { value: 'highlight',     label: 'Highlight',color: 'bg-yellow-600/30 text-yellow-300 border-yellow-500/50' },
                { value: 'mental-lapse',  label: 'Mental',   color: 'bg-yellow-800/30 text-yellow-400 border-yellow-700/50' },
                { value: 'net-play',      label: 'Net Play', color: 'bg-cyan-600/30 text-cyan-300 border-cyan-500/50' },
              ].map(tag => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => setTagFilter(prev => prev === tag.value ? null : tag.value)}
                  className={clsx(
                    'text-xs px-2.5 py-1 rounded-full border transition font-medium',
                    tagFilter === tag.value
                      ? tag.color + ' ring-1 ring-white/20'
                      : 'bg-gray-800/60 text-gray-600 border-gray-700 hover:text-gray-300'
                  )}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 && (
            <p className="text-gray-600 text-sm text-center p-8">
              {search ? 'No matches found' : 'No finished matches yet'}
            </p>
          )}

          {/* Meets section */}
          {meetMatches.map(({ meet, matches: meetMs }) => {
            const isExpanded = expandedMeets.has(meet.id)
            const meetDate = format(new Date(meet.created_at), 'MMM d, yyyy')
            return (
              <div key={meet.id}>
                <div className="flex items-center bg-yellow-950/30 border-b border-yellow-800/30">
                  <button
                    onClick={() => toggleMeet(meet.id)}
                    className="flex-1 flex items-center justify-between px-4 py-2.5 hover:bg-yellow-950/50 transition"
                  >
                    <div className="text-left">
                      <p className="text-yellow-300 text-xs font-bold">📋 {meet.name}</p>
                      <p className="text-yellow-600 text-xs">{meetDate} · {meetMs.length} court{meetMs.length !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-yellow-600 text-xs mr-2">{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  {confirmDeleteMeetId === meet.id ? (
                    <div className="flex flex-col gap-1 pr-2 py-1 items-end">
                      <button
                        onClick={() => handleDeleteMeet(meet.id, true)}
                        className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1.5 rounded transition whitespace-nowrap"
                      >
                        Delete meet + all records
                      </button>
                      <button
                        onClick={() => handleDeleteMeet(meet.id, false)}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1.5 rounded transition whitespace-nowrap"
                      >
                        Delete meet only
                      </button>
                      <button
                        onClick={() => setConfirmDeleteMeetId(null)}
                        className="text-xs text-gray-500 hover:text-white px-1 py-0.5 rounded transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteMeetId(meet.id)}
                      className="text-gray-600 hover:text-red-400 transition pr-3 text-sm"
                      title="Delete meet"
                    >
                      🗑
                    </button>
                  )}
                </div>
                {isExpanded && meetMs.map(m => <MatchItem key={m.id} m={m} />)}
              </div>
            )
          })}

          {/* Standalone matches */}
          {groupedStandalone.map(group => (
            <div key={group.date}>
              <div className="px-4 py-2 bg-gray-900/80 text-xs text-gray-500 font-semibold uppercase tracking-wider sticky top-0 z-10">
                {group.date !== 'Unknown' ? format(new Date(group.date), 'MMM d, yyyy') : 'Unknown date'}
              </div>
              {group.matches.map(m => <MatchItem key={m.id} m={m} />)}
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className={clsx(
          'flex-1 overflow-y-auto p-3 sm:p-6 min-w-0',
          showDetail ? 'block' : 'hidden lg:block'
        )}>
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
  const [summary, setSummary] = useState<string | null>(match.ai_summary ?? null)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [copied, setCopied] = useState(false)
  const [playerEmail, setPlayerEmail] = useState<string | null>(null)
  const isDoubles = match.match_type === 'doubles'

  const playerDisplay = isDoubles && match.player_name_2
    ? `${match.player_name} / ${match.player_name_2}`
    : match.player_name
  const opponentDisplay = isDoubles && match.opponent_name_2
    ? `${match.opponent_name} / ${match.opponent_name_2}`
    : match.opponent_name

  useEffect(() => {
    fetch('/api/players')
      .then(r => r.json())
      .then((players: { name: string; email: string | null }[]) => {
        const found = players.find(p => p.name.toLowerCase() === match.player_name.toLowerCase())
        if (found?.email) setPlayerEmail(found.email)
        else setPlayerEmail(null)
      })
      .catch(() => {})
  }, [match.player_name])

  async function handleGenerateSummary() {
    setGeneratingSummary(true)
    setSummary(null)
    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: playerDisplay,
        opponentName: opponentDisplay,
        sets: match.sets,
        notes: match.notes,
      }),
    })
    const data = await res.json()
    setSummary(data.summary ?? data.error ?? 'Failed to generate summary')
    setGeneratingSummary(false)
  }

  function exportText(): string {
    const lines: string[] = []
    lines.push(`MATCH REPORT`)
    lines.push(`${playerDisplay} vs ${opponentDisplay}`)
    lines.push(`Court ${match.court_number} · ${format(new Date(match.started_at), 'PPp')}`)
    lines.push(``)
    lines.push(`SCORE`)
    if (match.sets.length) {
      lines.push(match.sets.map((s, i) => {
        const tb = s.tiebreak ? ` (${s.tiebreak.player}–${s.tiebreak.opponent})` : ''
        return `Set ${i + 1}: ${s.player}–${s.opponent}${tb}`
      }).join('  '))
    } else {
      lines.push('No score recorded')
    }
    lines.push(``)
    lines.push(`NOTES (${match.notes.length})`)
    const sorted = [...match.notes].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    for (const n of sorted) {
      const tags = n.tags.length ? ` [${n.tags.join(', ')}]` : ''
      lines.push(`${format(new Date(n.timestamp), 'h:mm a')}${tags}: ${n.content}`)
    }
    if (summary) {
      lines.push(``)
      lines.push(`AI SUMMARY`)
      lines.push(summary)
    }
    return lines.join('\n')
  }

  async function handleExport() {
    await navigator.clipboard.writeText(exportText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-6 w-full min-w-0">
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h2 className="text-white font-bold text-xl truncate">{playerDisplay}</h2>
          <span className={clsx(
            'text-sm font-bold px-2 py-0.5 rounded flex-shrink-0',
            result === 'win' ? 'bg-green-900/50 text-green-400' :
            result === 'loss' ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-400'
          )}>
            {result === 'win' ? 'WIN' : result === 'loss' ? 'LOSS' : '—'}
          </span>
          <button
            onClick={handleExport}
            className="ml-auto text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition flex-shrink-0"
          >
            {copied ? '✓ Copied' : '↗ Export'}
          </button>
        </div>
        <p className="text-gray-400">vs {opponentDisplay} · Court {match.court_number}</p>
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
          <div className="flex gap-4 flex-wrap">
            {match.sets.map((set, i) => (
              <div key={i} className="text-center">
                <p className="text-gray-500 text-xs mb-1">Set {i + 1}</p>
                <p className="text-white font-bold text-xl tabular-nums">
                  {set.player}–{set.opponent}
                </p>
                {set.tiebreak && (
                  <p className="text-yellow-500 text-xs mt-0.5">
                    ({set.tiebreak.player}–{set.tiebreak.opponent})
                  </p>
                )}
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
            {[...match.notes]
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
      <div className="pt-2 space-y-3">
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
        {playerEmail && (
          <a
            href={`mailto:${playerEmail}?subject=${encodeURIComponent(`Match Report: ${playerDisplay} vs ${opponentDisplay}`)}&body=${encodeURIComponent(exportText())}`}
            className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition"
          >
            📧 Send to {playerEmail}
          </a>
        )}
      </div>
    </div>
  )
}
