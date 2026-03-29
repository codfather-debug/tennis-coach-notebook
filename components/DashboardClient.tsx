'use client'
import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { createClient } from '@/lib/supabase'
import { format } from 'date-fns'
import CourtGrid from './CourtGrid'
import CourtCard from './CourtCard'
import CourtDetail from './CourtDetail'
import WeatherWidget from './WeatherWidget'
import SendResultsModal from './SendResultsModal'
import Link from 'next/link'
import clsx from 'clsx'
import type { CourtState } from '@/types'

interface Props { coachId: string }

function HomeScreen() {
  const { createMeet, setCourtCount, setActiveCourt, activeMeetId, activeMeetName, courtCount, setCourtTemplates } = useStore()
  const [meetName, setMeetName] = useState('')
  const [localCourtCount, setLocalCourtCount] = useState(4)
  const [loading, setLoading] = useState(false)
  const [allMeets, setAllMeets] = useState<{ id: string; name: string; court_count?: number; created_at: string }[]>([])
  const [meetSearch, setMeetSearch] = useState('')
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [selectedMeetId, setSelectedMeetId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/meets')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAllMeets(data.filter((m: any) => m.court_count > 0)) })
      .catch(() => {})
  }, [])

  const filteredMeets = meetSearch.trim()
    ? allMeets.filter(m => m.name.toLowerCase().includes(meetSearch.toLowerCase()))
    : allMeets.slice(0, 2)

  async function handleSelectMeet(m: typeof allMeets[0]) {
    setMeetName(m.name)
    if (m.court_count) setLocalCourtCount(m.court_count)
    setSelectedMeetId(m.id)
    setLoadingTemplate(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('matches')
      .select('court_number, player_name, player_name_2, opponent_name, opponent_name_2, match_type')
      .eq('meet_id', m.id)
      .order('court_number')
    if (data) {
      const templates: Record<number, any> = {}
      for (const row of data) {
        templates[row.court_number] = {
          playerName: row.player_name ?? '',
          playerName2: row.player_name_2 ?? '',
          opponentName: row.opponent_name ?? '',
          opponentName2: row.opponent_name_2 ?? '',
          matchType: row.match_type ?? 'singles',
        }
      }
      setCourtTemplates(templates)
    }
    setLoadingTemplate(false)
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!meetName.trim()) return
    setLoading(true)
    setCourtCount(localCourtCount)
    await createMeet(meetName.trim())
    setActiveCourt(1)
    setLoading(false)
  }

  // Mid-meet home: show court selector
  if (activeMeetId) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 bg-gray-950">
        <div className="w-full max-w-sm text-center space-y-4">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest">📋 {activeMeetName}</p>
          <h2 className="text-white font-black text-2xl">Select a Court</h2>
          <div className="grid grid-cols-4 gap-3 mt-4">
            {Array.from({ length: courtCount }, (_, i) => i + 1).map(n => (
              <CourtCard key={n} courtNumber={n} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 bg-gray-950 overflow-y-auto">
      <div className="w-full max-w-sm py-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎾</div>
          <h1 className="text-white font-black text-3xl mb-1">Coach Notebook</h1>
          <p className="text-gray-500 text-sm">Ready to track your courts</p>
        </div>

        {allMeets.length > 0 && (
          <div className="space-y-2 mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Repeat a recent meet</p>
            {allMeets.length > 2 && (
              <input
                value={meetSearch}
                onChange={e => setMeetSearch(e.target.value)}
                placeholder="Search meets..."
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
              />
            )}
            <div className="flex flex-col gap-2">
              {filteredMeets.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectMeet(m)}
                  className={clsx(
                    'w-full text-left border rounded-xl px-4 py-3 transition',
                    selectedMeetId === m.id
                      ? 'bg-green-900/30 border-green-600/60'
                      : 'bg-gray-800/60 hover:bg-gray-800 border-gray-700 hover:border-gray-600'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm font-semibold">📋 {m.name}</p>
                    {selectedMeetId === m.id && (
                      <span className="text-green-400 text-xs font-bold">{loadingTemplate ? '...' : '✓'}</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {format(new Date(m.created_at), 'MMM d, yyyy')}
                    {m.court_count ? ` · ${m.court_count} court${m.court_count !== 1 ? 's' : ''}` : ''}
                  </p>
                </button>
              ))}
              {filteredMeets.length === 0 && meetSearch && (
                <p className="text-gray-600 text-sm text-center py-2">No meets found</p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Name this meet</label>
            <input
              autoFocus
              value={meetName}
              onChange={e => setMeetName(e.target.value)}
              placeholder="e.g. JV vs Eastside, Tuesday Practice"
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">How many courts?</label>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 14 }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLocalCourtCount(n)}
                  className={clsx(
                    'h-10 rounded-xl text-sm font-bold transition',
                    localCourtCount === n
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!meetName.trim() || loading}
            className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl px-4 py-6 transition text-xl shadow-lg shadow-green-900/40"
          >
            {loading ? 'Starting...' : '▶ Start Meet'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function DashboardClient({ coachId }: Props) {
  const {
    setCoachId, loadActiveMatches, loadWeather,
    activeCourt, setActiveCourt, weather, courtCount, setCourtCount,
    activeMeetId, activeMeetName, createMeet, endMeet, deleteMeet,
  } = useStore()
  const [loading, setLoading] = useState(true)
  const [weatherAttempted, setWeatherAttempted] = useState(false)
  const [confirmDeleteMeet, setConfirmDeleteMeet] = useState(false)
  const [meetEnded, setMeetEnded] = useState(false)
  const [sendModal, setSendModal] = useState<{ courts: CourtState[]; meetName: string } | null>(null)
  const [lastMeetSnapshot, setLastMeetSnapshot] = useState<{ courts: CourtState[]; meetName: string } | null>(null)

  useEffect(() => {
    setCoachId(coachId)
    loadActiveMatches().then(() => {
      setLoading(false)
      // Only auto-select if returning to active courts
      const { courts } = useStore.getState()
      if (courts.some(c => c.status === 'active')) setActiveCourt(1)
    })
    loadWeather().then(() => setWeatherAttempted(true))
  }, [coachId])

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur flex-shrink-0">
        {/* Row 1: logo + weather + courts */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCourt(null)}
              className="flex items-center gap-1.5 text-sm font-bold text-white hover:text-green-400 transition"
              title="Home"
            >
              🎾 <span>Home</span>
            </button>
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

        {/* Row 2: Players + History + Create Meet */}
        <div className="flex gap-2 px-4 pb-3">
          <Link
            href="/players"
            className="flex-1 text-center text-sm text-gray-300 hover:text-white transition py-3 rounded-xl hover:bg-gray-800 bg-gray-800/40 font-medium"
          >
            Players
          </Link>
          <Link
            href="/history"
            className="flex-1 text-center text-sm text-gray-300 hover:text-white transition py-3 rounded-xl hover:bg-gray-800 bg-gray-800/40 font-medium"
          >
            History
          </Link>
          <button
            onClick={() => setActiveCourt(null)}
            className="flex-1 text-center text-sm text-green-400 hover:text-green-300 transition py-3 rounded-xl hover:bg-green-900/30 bg-green-900/20 font-semibold"
          >
            + Meet
          </button>
        </div>

        {/* Row 3: Active meet bar — only shown when meet is running */}
        {activeMeetId && (
          <div className="flex items-center gap-2 px-4 pb-3 border-t border-gray-800/50 pt-2">
            <span className="text-xs text-yellow-400">📋</span>
            <span className="text-xs font-semibold text-yellow-300 truncate">{activeMeetName}</span>
            {confirmDeleteMeet ? (
              <div className="ml-auto flex flex-col gap-1 items-end">
                <button
                  onClick={() => { deleteMeet(activeMeetId, true); setConfirmDeleteMeet(false) }}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1.5 rounded transition whitespace-nowrap"
                >
                  Delete meet + all records
                </button>
                <button
                  onClick={() => { deleteMeet(activeMeetId, false); setConfirmDeleteMeet(false) }}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1.5 rounded transition whitespace-nowrap"
                >
                  Delete meet only
                </button>
                <button
                  onClick={() => setConfirmDeleteMeet(false)}
                  className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="ml-auto flex gap-1">
                <button
                  onClick={() => {
                    const snapshot = useStore.getState().courts
                      .filter(c => c.status !== 'empty' && c.matchId !== null)
                      .map(c => ({ ...c }))
                    const name = activeMeetName ?? ''
                    endMeet()
                    setActiveCourt(null)
                    const payload = { courts: snapshot, meetName: name }
                    setLastMeetSnapshot(payload)
                    if (snapshot.length > 0) {
                      setSendModal(payload)
                    } else {
                      setMeetEnded(true)
                    }
                  }}
                  className="text-xs text-gray-500 hover:text-white transition px-2 py-1 rounded hover:bg-gray-800"
                >
                  End Meet
                </button>
                <button
                  onClick={() => setConfirmDeleteMeet(true)}
                  className="text-xs text-gray-600 hover:text-red-400 transition px-2 py-1 rounded hover:bg-gray-800"
                  title="Delete meet"
                >
                  🗑
                </button>
              </div>
            )}
          </div>
        )}
      </header>


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

        {/* Court detail — takes full height on mobile, padded so content clears the fixed strip */}
        <div className="flex-1 lg:border-l border-gray-800 overflow-hidden min-h-0 lg:pb-0" style={{ paddingBottom: 'max(60px, calc(60px + env(safe-area-inset-bottom)))' } as any}>
          {activeCourt ? (
            <CourtDetail courtNumber={activeCourt} />
          ) : (
            <HomeScreen />
          )}
        </div>

      </main>

      {/* Send Results Modal */}
      {sendModal && (
        <SendResultsModal
          courts={sendModal.courts}
          meetName={sendModal.meetName}
          onClose={() => { setSendModal(null); setMeetEnded(true) }}
        />
      )}

      {/* Post-meet screen — full screen overlay */}
      {meetEnded && (
        <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-sm space-y-4 text-center">
            <div className="text-5xl mb-2">✅</div>
            <h2 className="text-white font-black text-2xl">Meet Complete</h2>
            <p className="text-gray-500 text-sm mb-6">What would you like to do next?</p>
            <div className="flex flex-col gap-3">
              {lastMeetSnapshot && (
                <button
                  onClick={() => { setMeetEnded(false); setSendModal(lastMeetSnapshot) }}
                  className="w-full bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-black rounded-2xl px-4 py-6 transition text-xl shadow-lg shadow-blue-900/40"
                >
                  📧 Send Results
                </button>
              )}
              <button
                onClick={() => setMeetEnded(false)}
                className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-black rounded-2xl px-4 py-6 transition text-xl shadow-lg shadow-green-900/40"
              >
                ▶ Start New Meet
              </button>
              <Link
                href="/history"
                className="w-full block bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl px-4 py-6 transition text-xl text-center"
              >
                📋 History
              </Link>
              <Link
                href="/players"
                className="w-full block bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl px-4 py-6 transition text-xl text-center"
              >
                👤 Players
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Fixed court strip — always visible at bottom on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-gray-950 overflow-x-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex" style={{ width: 'max-content', minWidth: '100%' }}>
          {Array.from({ length: courtCount }, (_, i) => (
            <CourtCard key={i + 1} courtNumber={i + 1} mini />
          ))}
        </div>
      </div>
    </div>
  )
}
