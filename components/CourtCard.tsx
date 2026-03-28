'use client'
import { useStore } from '@/lib/store'
import clsx from 'clsx'
import type { MatchStatus, SetScore } from '@/types'

interface Props { courtNumber: number; mini?: boolean }

const statusDot: Record<MatchStatus, string> = {
  empty:    'bg-gray-600',
  active:   'bg-green-400 animate-pulse',
  finished: 'bg-blue-400',
}

// Per-court colors for mini strip — bg at full opacity for active, muted for inactive
const MINI_COLORS = [
  { active: 'bg-blue-700',    inactive: 'bg-blue-950/60' },
  { active: 'bg-emerald-700', inactive: 'bg-emerald-950/60' },
  { active: 'bg-purple-700',  inactive: 'bg-purple-950/60' },
  { active: 'bg-orange-700',  inactive: 'bg-orange-950/60' },
  { active: 'bg-pink-700',    inactive: 'bg-pink-950/60' },
  { active: 'bg-cyan-700',    inactive: 'bg-cyan-950/60' },
  { active: 'bg-yellow-700',  inactive: 'bg-yellow-950/60' },
  { active: 'bg-red-700',     inactive: 'bg-red-950/60' },
  { active: 'bg-indigo-700',  inactive: 'bg-indigo-950/60' },
  { active: 'bg-teal-700',    inactive: 'bg-teal-950/60' },
  { active: 'bg-lime-700',    inactive: 'bg-lime-950/60' },
  { active: 'bg-rose-700',    inactive: 'bg-rose-950/60' },
  { active: 'bg-violet-700',  inactive: 'bg-violet-950/60' },
  { active: 'bg-amber-700',   inactive: 'bg-amber-950/60' },
]

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

export default function CourtCard({ courtNumber, mini }: Props) {
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
    return sets.map(s => `${s.player}–${s.opponent}`).join(' ')
  }

  if (mini) {
    const color = MINI_COLORS[(courtNumber - 1) % MINI_COLORS.length]
    return (
      <button
        onClick={() => setActiveCourt(courtNumber)}
        className={clsx(
          'relative flex-shrink-0 text-left border-r border-black/20 p-2 transition-all overflow-hidden',
          isActive ? `${color.active} w-24` : `${color.inactive} w-20 opacity-60 hover:opacity-90`
        )}
      >
        {/* Watermark on active court */}
        {isActive && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[42px] font-black text-white/10 leading-none select-none pointer-events-none">
            {courtNumber}
          </div>
        )}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-white/80">{courtNumber}</span>
          <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', statusDot[court.status])} />
        </div>
        {court.status === 'empty' ? (
          <p className="text-white/30 text-xs">—</p>
        ) : (
          <>
            <p className="text-xs font-medium truncate text-white/90">{court.playerName}</p>
            {formatSets(court.sets) ? (
              <p className="text-xs font-mono truncate text-white/70">{formatSets(court.sets)}</p>
            ) : (
              <p className="text-white/30 text-xs">Active</p>
            )}
          </>
        )}
      </button>
    )
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
