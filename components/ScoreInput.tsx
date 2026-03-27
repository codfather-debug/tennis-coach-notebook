'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import clsx from 'clsx'

interface Props { courtNumber: number }

export default function ScoreInput({ courtNumber }: Props) {
  const { courts, updateSet, updateTiebreak, addSet, removeSet } = useStore()
  const court = courts[courtNumber - 1]
  const isFinished = court.status === 'finished'
  const [editing, setEditing] = useState(false)

  const locked = isFinished && !editing

  return (
    <div className="px-5 py-4 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Final Set Scores</h3>
        <div className="flex items-center gap-2">
          {isFinished && (
            <button
              onClick={() => setEditing(e => !e)}
              className={clsx(
                'text-xs px-3 py-1 rounded-lg transition font-medium',
                editing
                  ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-600/50'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              )}
            >
              {editing ? 'Done' : 'Edit'}
            </button>
          )}
          {!locked && court.sets.length < 5 && (
            <button
              onClick={() => addSet(courtNumber)}
              className="text-xs text-green-400 hover:text-green-300 transition font-medium"
            >
              + Add Set
            </button>
          )}
        </div>
      </div>

      {court.sets.length === 0 && (
        <div className="text-center py-6">
          <p className="text-gray-600 text-sm">No sets recorded yet</p>
          {!locked && (
            <button
              onClick={() => addSet(courtNumber)}
              className="mt-3 bg-green-700 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Record First Set
            </button>
          )}
        </div>
      )}

      {court.sets.map((set, i) => {
        const isTied = set.player === 6 && set.opponent === 6
        return (
          <div key={i} className="space-y-3 pb-4 border-b border-gray-800/50 last:border-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Set {i + 1}</span>
              {!locked && (
                <button
                  onClick={() => removeSet(courtNumber, i)}
                  className="text-gray-700 hover:text-red-400 transition text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Player row */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500 truncate">{court.playerName}</p>
              <NumberLine
                value={set.player}
                onChange={v => updateSet(courtNumber, i, 'player', v)}
                disabled={locked}
                highlight={set.player > set.opponent && !isTied}
                max={7}
              />
            </div>

            {/* Opponent row */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500 truncate">{court.opponentName}</p>
              <NumberLine
                value={set.opponent}
                onChange={v => updateSet(courtNumber, i, 'opponent', v)}
                disabled={locked}
                highlight={set.opponent > set.player && !isTied}
                max={7}
              />
            </div>

            {/* Tiebreak — shown when 6-6 */}
            {isTied && (
              <div className="bg-yellow-950/20 border border-yellow-800/30 rounded-xl p-3 space-y-2">
                <p className="text-xs text-yellow-500 font-semibold uppercase tracking-wider">Tiebreak</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1 truncate">{court.playerName}</p>
                    <input
                      type="number"
                      min={0}
                      value={set.tiebreak?.player ?? ''}
                      onChange={e => updateTiebreak(courtNumber, i, 'player', Number(e.target.value))}
                      disabled={locked}
                      placeholder="0"
                      className="w-full bg-gray-900 border border-yellow-700/50 rounded-lg px-3 py-2 text-white text-lg font-bold text-center focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-50"
                    />
                  </div>
                  <span className="text-gray-600 text-xl font-bold mt-4">–</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1 truncate">{court.opponentName}</p>
                    <input
                      type="number"
                      min={0}
                      value={set.tiebreak?.opponent ?? ''}
                      onChange={e => updateTiebreak(courtNumber, i, 'opponent', Number(e.target.value))}
                      disabled={locked}
                      placeholder="0"
                      className="w-full bg-gray-900 border border-yellow-700/50 rounded-lg px-3 py-2 text-white text-lg font-bold text-center focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface NumberLineProps {
  value: number
  onChange: (v: number) => void
  disabled: boolean
  highlight: boolean
  max: number
}

function NumberLine({ value, onChange, disabled, highlight, max }: NumberLineProps) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {Array.from({ length: max + 1 }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          disabled={disabled}
          className={clsx(
            'w-9 h-9 rounded-lg text-sm font-bold transition',
            value === i
              ? highlight
                ? 'bg-green-600 text-white shadow-lg shadow-green-900/50'
                : 'bg-gray-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          {i}
        </button>
      ))}
    </div>
  )
}
