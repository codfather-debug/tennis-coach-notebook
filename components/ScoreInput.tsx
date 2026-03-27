'use client'
import { useStore } from '@/lib/store'
import clsx from 'clsx'

interface Props { courtNumber: number }

export default function ScoreInput({ courtNumber }: Props) {
  const { courts, updateSet, addSet, removeSet } = useStore()
  const court = courts[courtNumber - 1]
  const isFinished = court.status === 'finished'

  return (
    <div className="px-5 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Set Scores</h3>
        {!isFinished && court.sets.length < 5 && (
          <button
            onClick={() => addSet(courtNumber)}
            className="text-xs text-green-400 hover:text-green-300 transition font-medium"
          >
            + Add Set
          </button>
        )}
      </div>

      {court.sets.length === 0 && (
        <div className="text-center py-6">
          <p className="text-gray-600 text-sm">No sets recorded yet</p>
          {!isFinished && (
            <button
              onClick={() => addSet(courtNumber)}
              className="mt-3 bg-green-700 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Record First Set
            </button>
          )}
        </div>
      )}

      {/* Column headers */}
      {court.sets.length > 0 && (
        <div className="grid grid-cols-[40px_1fr_24px_1fr_32px] gap-2 items-center mb-1">
          <span />
          <span className="text-xs text-gray-500 text-center font-medium truncate">{court.playerName}</span>
          <span />
          <span className="text-xs text-gray-500 text-center font-medium truncate">{court.opponentName}</span>
          <span />
        </div>
      )}

      {court.sets.map((set, i) => (
        <div key={i} className="grid grid-cols-[40px_1fr_24px_1fr_32px] gap-2 items-center">
          <span className="text-xs text-gray-500 font-mono text-center">S{i + 1}</span>

          {/* Player score */}
          <ScoreStepper
            value={set.player}
            onChange={(v) => updateSet(courtNumber, i, 'player', v)}
            disabled={isFinished}
            highlight={set.player > set.opponent}
          />

          <span className="text-gray-600 text-center text-sm">–</span>

          {/* Opponent score */}
          <ScoreStepper
            value={set.opponent}
            onChange={(v) => updateSet(courtNumber, i, 'opponent', v)}
            disabled={isFinished}
            highlight={set.opponent > set.player}
          />

          {/* Remove */}
          {!isFinished ? (
            <button
              onClick={() => removeSet(courtNumber, i)}
              className="text-gray-700 hover:text-red-400 transition text-lg leading-none"
              aria-label="Remove set"
            >
              ×
            </button>
          ) : <span />}
        </div>
      ))}
    </div>
  )
}

interface StepperProps {
  value: number
  onChange: (v: number) => void
  disabled: boolean
  highlight: boolean
}

function ScoreStepper({ value, onChange, disabled, highlight }: StepperProps) {
  return (
    <div className="flex items-center bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value === 0}
        className="px-3 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition text-lg leading-none font-light"
      >
        −
      </button>
      <span className={clsx(
        'flex-1 text-center text-lg font-bold tabular-nums min-w-[2.5rem]',
        highlight ? 'text-green-300' : 'text-gray-300'
      )}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(7, value + 1))}
        disabled={disabled || value === 7}
        className="px-3 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition text-lg leading-none font-light"
      >
        +
      </button>
    </div>
  )
}
