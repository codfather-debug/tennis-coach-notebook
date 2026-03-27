'use client'
import { useStore } from '@/lib/store'
import clsx from 'clsx'
import type { MatchStatus, SetScore } from '@/types'

interface Props { courtNumber: number }

const statusDot: Record<MatchStatus, string> = {
  empty:    'bg-gray-600',
  active:   'bg-green-400 animate-pulse',
  finished: 'bg-blue-400',
}

function getActiveCardClass(sets: SetScore[]): string {
  if (!sets.length) return 'bg-green-950/40 border-green-800/50 hover:border-green-600'
  const wins = sets.filter(s => s.player > s.opponent).length
  const losses = sets.filter(s => s.opponent > s.player).length
  const margin = wins - losses
  if (margin >= 1)  return 'bg-green-900/60 border-green-500/60 hover:border-green-400'
  if (margin === 0) return 'bg-yellow-950/50 border-yellow-600/50 hover:border-yellow-500'
  if (margin === -1) return 'bg-orange-950/50 border-orange-600/60 hover:border-orange-500'
  return 'bg-red-950/50 border-red-700/60 hover:border-red-500'
}

function getScoreTextClass(sets: SetScore[]): string {
  if (!sets.length) return 'text-green-300'
  const wins = sets.filter(s => s.player > s.opponent).length
  const losses = sets.filter(s => s.opponent > s.player).length
  const margin = wins - losses
  if (margin >= 1)  return 'text-green-300'
  if (margin === 0) return 'text-yellow-300'
  if (margin === -1) return 'text-orange-300'
  return 'text-red-300'
}

export default function CourtCard({ courtNumber }: Props) {
  const { courts, activeCourt, setActiveCourt } = useStore()
  const court = courts[courtNumber - 1]
  const isActive = activeCourt === courtNumber

  const cardBg = court.status === 'active'
    ? getActiveCardClass(court.sets)
    : court.status === 'finished'
      ? 'bg-blue-950/30 border-blue-800/40 hover:border-blue-600'
      : 'bg-gray-900 border-gray-800 hover:border-gray-700'

  function formatSets(sets: typeof court.sets) {
    if (!sets.length) return null
    return sets.map(s => `${s.player}–${s.opponent}`).join('  ')
  }

  return (
    <button
      onClick={() => setActiveCourt(courtNumber)}
      className={clsx(
        'relative text-left rounded-xl border p-3 transition-all w-full',
        cardBg,
        isActive && 'ring-2 ring-white/20 ring-offset-1 ring-offset-gray-950'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Court {courtNumber}
        </span>
        <div className="flex items-center gap-1.5">
          {court.status === 'active' && court.matchType === 'doubles' && (
            <span className="text-xs text-yellow-500/70 font-medium">2v2</span>
          )}
          <span className={clsx('w-2 h-2 rounded-full', statusDot[court.status])} />
        </div>
      </div>

      {court.status === 'empty' ? (
        <span className="text-gray-600 text-xs">Tap to set up</span>
      ) : (
        <>
          <p className="text-white font-semibold text-sm truncate">
            {court.matchType === 'doubles' && court.playerName2
              ? `${court.playerName} / ${court.playerName2}`
              : court.playerName}
          </p>
          <p className="text-gray-400 text-xs truncate">
            vs {court.matchType === 'doubles' && court.opponentName2
              ? `${court.opponentName} / ${court.opponentName2}`
              : court.opponentName}
          </p>
          {formatSets(court.sets) && (
            <p className={clsx('text-xs font-mono mt-2 tracking-wider', getScoreTextClass(court.sets))}>
              {formatSets(court.sets)}
            </p>
          )}
          {court.notes.length > 0 && (
            <p className="text-gray-500 text-xs mt-1">
              {court.notes.length} note{court.notes.length !== 1 ? 's' : ''}
            </p>
          )}
        </>
      )}
    </button>
  )
}
