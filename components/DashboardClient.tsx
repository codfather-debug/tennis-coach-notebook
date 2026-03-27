'use client'
import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import CourtGrid from './CourtGrid'
import CourtDetail from './CourtDetail'
import WeatherWidget from './WeatherWidget'
import Link from 'next/link'

interface Props { coachId: string }

export default function DashboardClient({ coachId }: Props) {
  const { setCoachId, loadActiveMatches, loadWeather, activeCourt, weather } = useStore()

  useEffect(() => {
    setCoachId(coachId)
    loadActiveMatches()
    loadWeather()
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
          {weather && <WeatherWidget weather={weather} compact />}
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
          <CourtGrid />
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
