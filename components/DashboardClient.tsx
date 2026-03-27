'use client'
import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import CourtGrid from './CourtGrid'
import CourtDetail from './CourtDetail'
import WeatherWidget from './WeatherWidget'
import Link from 'next/link'
import clsx from 'clsx'

interface Props { coachId: string }

export default function DashboardClient({ coachId }: Props) {
  const { setCoachId, loadActiveMatches, loadWeather, activeCourt, weather, courtCount, setCourtCount } = useStore()
  const [loading, setLoading] = useState(true)
  const [weatherAttempted, setWeatherAttempted] = useState(false)

  useEffect(() => {
    setCoachId(coachId)
    loadActiveMatches().then(() => setLoading(false))
    loadWeather().then(() => setWeatherAttempted(true))
  }, [coachId])

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50 backdrop-blur">
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
          <Link
            href="/history"
            className="text-xs text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-gray-800"
          >
            History
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Court Grid */}
        <div className="lg:w-auto lg:min-w-[520px] p-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
              {Array.from({ length: courtCount }, (_, i) => (
                <div key={i} className="h-24 rounded-xl bg-gray-800/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <CourtGrid />
          )}
        </div>

        {/* Detail Panel */}
        <div className="flex-1 border-t lg:border-t-0 lg:border-l border-gray-800 overflow-hidden">
          {activeCourt ? (
            <CourtDetail courtNumber={activeCourt} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              Select a court to view details
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
