'use client'
import { useState, useEffect } from 'react'
import type { CourtState } from '@/types'
import clsx from 'clsx'

interface Props {
  courts: CourtState[]
  meetName: string
  onClose: () => void
}

interface PlayerEntry {
  courtNumber: number
  playerName: string
  opponentName: string
  email: string | null
  selected: boolean
  report: string
  subject: string
}

function buildReport(court: CourtState, meetName: string): { subject: string; report: string } {
  const subject = `Match Report: ${court.playerName} vs ${court.opponentName || 'Unknown'}${meetName ? ` — ${meetName}` : ''}`
  const lines: string[] = [
    `MATCH REPORT`,
    `${court.playerName} vs ${court.opponentName || 'Unknown'}`,
    meetName ? `Meet: ${meetName}` : '',
    court.startedAt ? `Date: ${new Date(court.startedAt).toLocaleDateString()}` : '',
    ``,
    `SCORE`,
    court.sets.length
      ? court.sets.map((s, i) => {
          const tb = s.tiebreak ? ` (TB: ${s.tiebreak.player}–${s.tiebreak.opponent})` : ''
          return `Set ${i + 1}: ${s.player}–${s.opponent}${tb}`
        }).join('  ')
      : 'No score recorded',
    ``,
    `NOTES (${court.notes.length})`,
    ...[...court.notes]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(n => `${new Date(n.timestamp).toLocaleTimeString()}${n.tags.length ? ` [${n.tags.join(', ')}]` : ''}: ${n.content}`),
  ].filter(l => l !== '')
  if (court.aiSummary) {
    lines.push('', 'AI SUMMARY', court.aiSummary)
  }
  return { subject, report: lines.join('\n') }
}

export default function SendResultsModal({ courts, meetName, onClose }: Props) {
  const [players, setPlayers] = useState<PlayerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [mailtoIndex, setMailtoIndex] = useState<number | null>(null)
  const [sent, setSent] = useState<{ ok: number; failed: number } | null>(null)
  const [resendAvailable, setResendAvailable] = useState(true)

  useEffect(() => {
    fetch('/api/players')
      .then(r => r.json())
      .then((roster: { name: string; email: string | null }[]) => {
        const emailMap = Object.fromEntries(
          roster.map(p => [p.name.toLowerCase(), p.email])
        )
        const entries: PlayerEntry[] = courts
          .filter(c => c.playerName)
          .map(c => {
            const email = emailMap[c.playerName.toLowerCase()] ?? null
            const { subject, report } = buildReport(c, meetName)
            return {
              courtNumber: c.courtNumber,
              playerName: c.playerName,
              opponentName: c.opponentName || 'Unknown',
              email,
              selected: !!email,
              subject,
              report,
            }
          })
        setPlayers(entries)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const selected = players.filter(p => p.selected && p.email)
  const allSelected = selected.length === players.filter(p => p.email).length
  const someSelected = selected.length > 0

  function togglePlayer(idx: number) {
    setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, selected: !p.selected } : p))
  }

  function toggleAll() {
    const val = !allSelected
    setPlayers(prev => prev.map(p => p.email ? { ...p, selected: val } : p))
  }

  // Option A: mailto — open one at a time
  function openNextMailto(index: number) {
    const withEmail = selected
    if (index >= withEmail.length) {
      setMailtoIndex(null)
      return
    }
    const p = withEmail[index]
    const href = `mailto:${p.email}?subject=${encodeURIComponent(p.subject)}&body=${encodeURIComponent(p.report)}`
    window.location.href = href
    setMailtoIndex(index + 1)
  }

  function handleMailto() {
    if (!selected.length) return
    openNextMailto(0)
  }

  // Option B: Resend — send all at once
  async function handleSendAll() {
    if (!selected.length) return
    setSending(true)
    const res = await fetch('/api/send-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matches: selected.map(p => ({
          playerName: p.playerName,
          email: p.email,
          subject: p.subject,
          report: p.report,
        })),
      }),
    })
    const data = await res.json()
    if (data.error === 'RESEND_API_KEY not configured') {
      setResendAvailable(false)
    } else {
      setSent({ ok: selected.length - (data.failed ?? 0), failed: data.failed ?? 0 })
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] bg-gray-950/95 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading player emails...</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] bg-gray-950/95 flex flex-col overflow-y-auto">
      <div className="w-full max-w-sm mx-auto px-6 py-8 flex flex-col gap-5">

        {/* Header */}
        <div>
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">📋 {meetName}</p>
          <h2 className="text-white font-black text-2xl">Send Match Results</h2>
          <p className="text-gray-500 text-sm mt-1">Select players to email their match report.</p>
        </div>

        {/* Sent confirmation */}
        {sent && (
          <div className={clsx(
            'rounded-xl p-4 border',
            sent.failed === 0
              ? 'bg-green-950/40 border-green-700/40'
              : 'bg-yellow-950/40 border-yellow-700/40'
          )}>
            <p className={clsx('font-bold text-sm', sent.failed === 0 ? 'text-green-300' : 'text-yellow-300')}>
              {sent.failed === 0
                ? `✅ All ${sent.ok} email${sent.ok !== 1 ? 's' : ''} sent!`
                : `⚠️ ${sent.ok} sent, ${sent.failed} failed`}
            </p>
          </div>
        )}

        {!resendAvailable && (
          <div className="bg-yellow-950/40 border border-yellow-700/40 rounded-xl p-4">
            <p className="text-yellow-300 text-sm font-semibold">RESEND_API_KEY not set</p>
            <p className="text-yellow-600 text-xs mt-1">Add it to your .env.local to enable one-tap sending. Use "Open in Mail" in the meantime.</p>
          </div>
        )}

        {/* Select all toggle */}
        {players.some(p => p.email) && !sent && (
          <button
            onClick={toggleAll}
            className="text-xs text-gray-400 hover:text-white transition text-left"
          >
            {allSelected ? '☑ Deselect all' : '☐ Select all'}
          </button>
        )}

        {/* Player list */}
        <div className="space-y-2">
          {players.map((p, i) => (
            <div
              key={i}
              className={clsx(
                'rounded-xl border p-3 flex items-center gap-3 transition',
                p.email
                  ? p.selected
                    ? 'bg-gray-800 border-gray-600'
                    : 'bg-gray-900/60 border-gray-800'
                  : 'bg-gray-900/30 border-gray-800/50 opacity-50'
              )}
            >
              {p.email ? (
                <button
                  onClick={() => togglePlayer(i)}
                  className={clsx(
                    'w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition',
                    p.selected
                      ? 'bg-green-600 border-green-600'
                      : 'bg-transparent border-gray-600'
                  )}
                >
                  {p.selected && <span className="text-white text-xs font-black">✓</span>}
                </button>
              ) : (
                <div className="w-5 h-5 rounded flex-shrink-0 border-2 border-gray-700 bg-transparent" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{p.playerName}</p>
                <p className="text-gray-500 text-xs truncate">vs {p.opponentName} · Court {p.courtNumber}</p>
                {p.email ? (
                  <p className="text-gray-500 text-xs truncate">{p.email}</p>
                ) : (
                  <p className="text-gray-700 text-xs">No email on file</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {players.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-4">No players found for this meet.</p>
        )}

        {/* Mailto queue UI */}
        {mailtoIndex !== null && mailtoIndex < selected.length && (
          <div className="bg-blue-950/40 border border-blue-700/40 rounded-xl p-4 space-y-2">
            <p className="text-blue-300 text-sm font-semibold">
              Opening {mailtoIndex} of {selected.length}...
            </p>
            <p className="text-blue-400 text-xs">Tap below to open the next email.</p>
            <button
              onClick={() => openNextMailto(mailtoIndex)}
              className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl px-4 py-3 transition text-sm"
            >
              Open next: {selected[mailtoIndex]?.playerName} →
            </button>
          </div>
        )}

        {/* Actions */}
        {!sent && mailtoIndex === null && (
          <div className="space-y-2">
            <button
              onClick={handleMailto}
              disabled={!someSelected}
              className="w-full bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl px-4 py-4 transition text-base"
            >
              📬 Open in Mail ({selected.length})
            </button>
            <button
              onClick={handleSendAll}
              disabled={!someSelected || sending}
              className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl px-4 py-4 transition text-base"
            >
              {sending ? 'Sending...' : `✦ Send All via Email (${selected.length})`}
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full text-gray-500 hover:text-white transition py-3 text-sm"
        >
          {sent ? 'Done' : 'Skip for now'}
        </button>
      </div>
    </div>
  )
}
