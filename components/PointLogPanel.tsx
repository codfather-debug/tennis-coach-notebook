'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import type { NoteTag } from '@/types'
import clsx from 'clsx'

interface Props {
  courtNumber: number
  player1: string
  player2: string   // '' for singles
  opp1: string
  opp2: string      // '' for singles
  isDoubles: boolean
  livePlayer: number | null
  liveOpponent: number | null
}

type Step = 'winner' | 'last-shot' | 'rally-length' | 'where'

const STEPS: Step[] = ['winner', 'last-shot', 'rally-length', 'where']

const LAST_SHOT_OPTIONS = [
  { label: 'FH Winner',   content: 'FH Winner',        tags: ['winner', 'forehand'] as NoteTag[] },
  { label: 'BH Winner',   content: 'BH Winner',         tags: ['winner', 'backhand'] as NoteTag[] },
  { label: 'Volley',      content: 'Volley Winner',     tags: ['winner', 'net-play'] as NoteTag[] },
  { label: 'Overhead',    content: 'Overhead Smash',    tags: ['winner'] as NoteTag[] },
  { label: 'Ace',         content: 'Ace',               tags: ['ace', 'serve'] as NoteTag[] },
  { label: 'Serve+1',     content: 'Serve + 1',         tags: ['winner', 'serve'] as NoteTag[] },
  { label: 'FH Error',    content: 'FH Unforced Error', tags: ['unforced-error', 'forehand'] as NoteTag[] },
  { label: 'BH Error',    content: 'BH Unforced Error', tags: ['unforced-error', 'backhand'] as NoteTag[] },
  { label: 'Dbl Fault',   content: 'Double Fault',      tags: ['double-fault'] as NoteTag[] },
  { label: 'Net Error',   content: 'Net Error',         tags: ['unforced-error'] as NoteTag[] },
  { label: 'Long Error',  content: 'Long Error',        tags: ['unforced-error'] as NoteTag[] },
  { label: 'Forced Err',  content: 'Forced Error',      tags: ['forced-error'] as NoteTag[] },
]

const RALLY_OPTIONS = ['1–3 shots', '4–6 shots', '7–9 shots', '10+ shots', 'Serve winner']

const WHERE_OPTIONS = [
  'Cross Court',
  'Down the Line',
  'Middle',
  'Short Angle',
  'Body',
  'Net',
  'Lob',
]

export default function PointLogPanel({ courtNumber, player1, player2, opp1, opp2, isDoubles, livePlayer, liveOpponent }: Props) {
  const { addNote } = useStore()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('winner')
  const [winnerName, setWinnerName] = useState<string | null>(null)
  const [winnerTeam, setWinnerTeam] = useState<1 | 2 | null>(null)
  const [lastShot, setLastShot] = useState<{ content: string; tags: NoteTag[] } | null>(null)
  const [rallyLength, setRallyLength] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const team1 = isDoubles ? [player1, player2].filter(Boolean) : [player1]
  const team2 = isDoubles ? [opp1, opp2].filter(Boolean) : [opp1]

  function reset() {
    setStep('winner')
    setWinnerName(null)
    setWinnerTeam(null)
    setLastShot(null)
    setRallyLength(null)
  }

  function handleOpen() {
    reset()
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    reset()
  }

  function stepIndex(s: Step) { return STEPS.indexOf(s) }
  function nextStep() {
    const idx = stepIndex(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
    else handleSave(null)
  }

  async function handleSave(where: string | null) {
    setSaving(true)
    const parts: string[] = []
    const scoreCtx = livePlayer !== null && liveOpponent !== null ? `${livePlayer}–${liveOpponent}` : null
    if (scoreCtx) parts.push(scoreCtx)
    if (winnerName) parts.push(`Won: ${winnerName}`)
    if (lastShot) parts.push(lastShot.content)
    if (rallyLength) parts.push(`Rally: ${rallyLength}`)
    if (where) parts.push(where)

    const content = parts.join(' · ')
    const tags: NoteTag[] = []
    if (winnerTeam === 1) tags.push('winner')
    if (lastShot) lastShot.tags.forEach(t => { if (!tags.includes(t)) tags.push(t) })

    await addNote(courtNumber, content, tags)
    setSaving(false)
    setOpen(false)
    reset()
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="w-full py-3 rounded-xl bg-blue-900/40 border border-blue-700/50 text-blue-200 text-sm font-semibold hover:bg-blue-900/60 transition"
      >
        + Log Point
      </button>
    )
  }

  const stepTitle: Record<Step, string> = {
    'winner': 'Who won the point?',
    'last-shot': 'Last shot',
    'rally-length': 'Rally length',
    'where': 'Where did it go?',
  }

  const isFirstStep = step === 'winner'
  const isLastStep = step === 'where'

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-white uppercase tracking-wider">{stepTitle[step]}</p>
          <span className="text-xs text-gray-600">
            {stepIndex(step) + 1}/{STEPS.length}
          </span>
        </div>
        <button
          onClick={handleClose}
          className="text-xs text-gray-600 hover:text-white transition"
        >
          ✕
        </button>
      </div>

      {/* Skip button — not shown on first step */}
      {!isFirstStep && (
        <div className="px-3 pt-2">
          <button
            onClick={() => isLastStep ? handleSave(null) : nextStep()}
            className="text-xs text-gray-500 hover:text-white transition font-medium"
          >
            Skip →
          </button>
        </div>
      )}

      {/* Step content */}
      <div className="p-3">
        {step === 'winner' && (
          <div className="grid grid-cols-2 gap-2">
            {/* Team 1 — green */}
            <div className="bg-green-950/50 border border-green-800/40 rounded-xl p-2 space-y-1.5">
              <p className="text-xs text-green-400 font-semibold uppercase tracking-wider text-center">Your Team</p>
              {team1.map((name, idx) => (
                <button
                  key={idx}
                  onClick={() => { setWinnerName(name); setWinnerTeam(1); setStep('last-shot') }}
                  className="w-full py-2.5 px-2 rounded-lg bg-green-900/60 border border-green-700/50 text-green-100 text-sm font-semibold hover:bg-green-800/70 transition truncate"
                >
                  {name || `Player ${idx + 1}`}
                </button>
              ))}
            </div>
            {/* Team 2 — red */}
            <div className="bg-red-950/50 border border-red-800/40 rounded-xl p-2 space-y-1.5">
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wider text-center">Opponents</p>
              {team2.map((name, idx) => (
                <button
                  key={idx}
                  onClick={() => { setWinnerName(name || `Opp ${idx + 1}`); setWinnerTeam(2); setStep('last-shot') }}
                  className="w-full py-2.5 px-2 rounded-lg bg-red-900/60 border border-red-700/50 text-red-100 text-sm font-semibold hover:bg-red-800/70 transition truncate"
                >
                  {name || `Opp ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'last-shot' && (
          <div className="grid grid-cols-3 gap-1.5">
            {LAST_SHOT_OPTIONS.map(opt => (
              <button
                key={opt.label}
                onClick={() => { setLastShot({ content: opt.content, tags: opt.tags }); setStep('rally-length') }}
                className="py-2.5 px-1 rounded-xl text-xs font-semibold text-center leading-tight bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {step === 'rally-length' && (
          <div className="grid grid-cols-2 gap-2">
            {RALLY_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => { setRallyLength(opt); setStep('where') }}
                className="py-3 px-3 rounded-xl text-sm font-semibold bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white transition text-center"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {step === 'where' && (
          <div className="grid grid-cols-2 gap-2">
            {WHERE_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => handleSave(opt)}
                disabled={saving}
                className="py-3 px-3 rounded-xl text-sm font-semibold bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white transition text-center disabled:opacity-50"
              >
                {saving ? '...' : opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
