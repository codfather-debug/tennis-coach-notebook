'use client'
import { useStore } from '@/lib/store'
import clsx from 'clsx'
import type { MatchStatus } from '@/types'

interface Props { courtNumber: number }

const statusDot: Record<MatchStatus, string> = {
  empty:    'bg-gray-600',
  active:   'bg-green-400 animate-pulse',
  finished: 'bg-blue-400',
}

const cardBg: Record<MatchStatus, string> = {
  empty:    'bg-gray-900 border-gray-800 hover:border-gray-700',
  active:   'bg-green-950/40 border-green-800/50 hover:border-green-600',
  finished: 'bg-blue-950/30 border-blue-800/40 hover:border-blue-600',
}

export default function CourtCard({ courtNumber }: Props) {
  const { courts, activeCourt, setActiveCourt } = useStore()
  const court = courts[courtNumber - 1]
  const isActive = activeCourt === courtNumber

  function formatSets(sets: typeof court.sets) {
    if (!sets.length) return null
    return sets.map(s => `${s.player}–${s.opponent}`).join('  ')
  }

  return (
    <button
      onClick={() => setActiveCourt(courtNumber)}
      className={clsx(
        'relative text-left rounded-xl border p-3 transition-all w-full',
        cardBg[court.status],
        isActive && 'ring-2 ring-white/20 ring-offset-1 ring-offset-gray-950'
      )}
    >
      {/* Court number + status dot */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Court {courtNumber}
        </span>
        <span className={clsx('w-2 h-2 rounded-full', statusDot[court.status])} />
      </div>

      {court.status === 'empty' ? (
        <span className="text-gray-600 text-xs">Tap to set up</span>
      ) : (
        <>
          <p className="text-white font-semibold text-sm truncate">{court.playerName}</p>
          <p className="text-gray-400 text-xs truncate">vs {court.opponentName}</p>
          {formatSets(court.sets) && (
            <p className="text-green-300 text-xs font-mono mt-2 tracking-wider">
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
