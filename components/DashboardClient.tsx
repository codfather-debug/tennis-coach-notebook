'use client'
import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import CourtGrid from './CourtGrid'
import CourtCard from './CourtCard'
import CourtDetail from './CourtDetail'
import WeatherWidget from './WeatherWidget'
import Link from 'next/link'
import clsx from 'clsx'

interface Props { coachId: string }

export default function DashboardClient({ coachId }: Props) {
  const {
    setCoachId, loadActiveMatches, loadWeather,
    activeCourt, weather, courtCount, setCourtCount,
    activeMeetId, activeMeetName, createMeet, endMeet,
  } = useStore()
  const [loading, setLoading] = useState(true)
  const [weatherAttempted, setWeatherAttempted] = useState(false)
  const [showMeetModal, setShowMeetModal] = useState(false)
  const [meetNameInput, setMeetNameInput] = useState('')

  useEffect(() => {
    setCoachId(coachId)
    loadActiveMatches().then(() => setLoading(false))
    loadWeather().then(() => setWeatherAttempted(true))
  }, [coachId])

  async function handleCreateMeet(e: React.FormEvent) {
    e.preventDefault()
    if (!meetNameInput.trim()) return
    await createMeet(meetNameInput.trim())
    setMeetNameInput('')
    setShowMeetModal(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur flex-shrink-0">
        {/* Row 1: logo + weather + courts */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎾</span>
            <span className="font-bold text-white text-sm tracking-wide">Coach Notebook</span>
          </div>
          <div className="flex items-center gap-3">
            {weather ? (
              <WeatherWidget weather={weather} compact />
            ) : weatherAttempted ? (
              <span className="text-xs text-gray-600">📍 Location unavailable</span>
            ) : null}
            <div className="flex items-center gap-1.5 bg-gray-800/50 rounded-lg px-2 py-1.5">
              <span className="text-xs text-gray-500 whitespace-nowrap">Courts</span>
              <select
                value={courtCount}
                onChange={e => setCourtCount(Number(e.target.value))}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 14 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n} className="bg-gray-900">{n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Players + History */}
        <div className="flex gap-2 px-4 pb-2">
          <Link
            href="/players"
            className="flex-1 text-center text-xs text-gray-400 hover:text-white transition py-1.5 rounded-lg hover:bg-gray-800 bg-gray-800/40"
          >
            Players
          </Link>
          <Link
            href="/history"
            className="flex-1 text-center text-xs text-gray-400 hover:text-white transition py-1.5 rounded-lg hover:bg-gray-800 bg-gray-800/40"
          >
            History
          </Link>
        </div>

        {/* Row 3: Meet bar */}
        <div className="flex items-center gap-2 px-4 pb-3 border-t border-gray-800/50 pt-2">
          {activeMeetId ? (
            <>
              <span className="text-xs text-yellow-400">📋</span>
              <span className="text-xs font-semibold text-yellow-300 truncate">{activeMeetName}</span>
              <button
                onClick={endMeet}
                className="ml-auto text-xs text-gray-500 hover:text-white transition px-2 py-1 rounded hover:bg-gray-800"
              >
                End Meet
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowMeetModal(true)}
              className="text-xs text-gray-500 hover:text-green-400 transition font-medium"
            >
              + Start Meet
            </button>
          )}
        </div>
      </header>

      {/* Meet name modal */}
      {showMeetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateMeet}
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm space-y-4"
          >
            <h2 className="text-white font-bold text-lg">Name This Meet</h2>
            <p className="text-gray-500 text-sm">All courts set up after this will be grouped together in history.</p>
            <input
              autoFocus
              value={meetNameInput}
              onChange={e => setMeetNameInput(e.target.value)}
              placeholder="e.g. JV vs Eastside, Tuesday Practice"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!meetNameInput.trim()}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl py-2.5 transition"
              >
                Start Meet
              </button>
              <button
                type="button"
                onClick={() => { setShowMeetModal(false); setMeetNameInput('') }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl py-2.5 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Desktop: court grid sidebar */}
        <div className="hidden lg:block lg:w-auto lg:min-w-[520px] p-4 overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {Array.from({ length: courtCount }, (_, i) => (
                <div key={i} className="h-24 rounded-xl bg-gray-800/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <CourtGrid />
          )}
        </div>

        {/* Court detail — takes full height on mobile */}
        <div className="flex-1 lg:border-l border-gray-800 overflow-hidden min-h-0">
          {activeCourt ? (
            <CourtDetail courtNumber={activeCourt} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              Tap a court below to get started
            </div>
          )}
        </div>

        {/* Mobile: court cards strip at bottom */}
        <div className="lg:hidden flex-shrink-0 border-t border-gray-800 bg-gray-900/50 p-2 overflow-x-auto">
          <div className="flex gap-2" style={{ width: 'max-content' }}>
            {Array.from({ length: courtCount }, (_, i) => (
              <CourtCard key={i + 1} courtNumber={i + 1} mini />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
