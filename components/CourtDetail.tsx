'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import ScoreInput from './ScoreInput'
import NoteInput from './NoteInput'
import NoteList from './NoteList'
import MatchSetup from './MatchSetup'
import WeatherWidget from './WeatherWidget'
import clsx from 'clsx'

interface Props { courtNumber: number }

export default function CourtDetail({ courtNumber }: Props) {
  const { courts, endMatch, clearCourt } = useStore()
  const court = courts[courtNumber - 1]
  const [tab, setTab] = useState<'notes' | 'score'>('notes')
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)

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

  if (court.status === 'empty') return <MatchSetup courtNumber={courtNumber} />

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-56px)]">
      {/* Match header */}
      <div className="px-5 py-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">{court.playerName}</h2>
            <p className="text-gray-400 text-sm">vs {court.opponentName}</p>
          </div>
          <div className="flex items-center gap-2">
            {court.weatherSnapshot && (
              <WeatherWidget weather={court.weatherSnapshot} compact />
            )}
            {court.status === 'active' && (
              !confirmEnd ? (
                <button
                  onClick={() => setConfirmEnd(true)}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition"
                >
                  End Match
                </button>
              ) : (
                <div className="flex gap-1">
                  <button
                    onClick={async () => { await endMatch(courtNumber); setConfirmEnd(false) }}
                    className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmEnd(false)}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              )
            )}
            {court.status === 'finished' && (
              <button
                onClick={() => clearCourt(courtNumber)}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition"
              >
                Clear Court
              </button>
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
        <div className="px-5 py-4 border-t border-gray-800 flex-shrink-0">
          <button
            onClick={handleGenerateSummary}
            disabled={generatingSummary}
            className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition"
          >
            {generatingSummary ? 'Generating summary...' : '✦ Generate AI Summary'}
          </button>
          {summary && (
            <div className="mt-3 bg-purple-950/30 border border-purple-800/40 rounded-xl p-4">
              <p className="text-purple-200 text-sm leading-relaxed">{summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
