import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { CourtState, SetScore, Note, NoteTag, WeatherSnapshot, MatchStatus } from '@/types'
import { createClient } from '@/lib/supabase'
import { getLocationAndWeather } from '@/lib/weather'

function emptyCourtState(courtNumber: number): CourtState {
  return {
    courtNumber,
    matchId: null,
    playerName: '',
    opponentName: '',
    status: 'empty',
    sets: [],
    notes: [],
    weatherSnapshot: null,
    startedAt: null,
    isSaving: false,
  }
}

interface AppStore {
  courts: CourtState[]
  activeCourt: number | null        // 1-indexed
  courtCount: number
  weather: WeatherSnapshot | null
  coachId: string | null

  // Actions
  setCoachId: (id: string) => void
  setActiveCourt: (court: number) => void
  setCourtCount: (n: number) => void
  setWeather: (w: WeatherSnapshot) => void
  loadWeather: () => Promise<void>

  setupCourt: (courtNumber: number, playerName: string, opponentName: string) => Promise<void>
  updateSet: (courtNumber: number, setIndex: number, side: 'player' | 'opponent', value: number) => void
  addSet: (courtNumber: number) => void
  removeSet: (courtNumber: number, setIndex: number) => void
  addNote: (courtNumber: number, content: string, tags: NoteTag[]) => Promise<void>
  endMatch: (courtNumber: number) => Promise<void>
  clearCourt: (courtNumber: number) => void
  loadActiveMatches: () => Promise<void>
}

export const useStore = create<AppStore>()(
  immer((set, get) => ({
    courts: Array.from({ length: 14 }, (_, i) => emptyCourtState(i + 1)),
    activeCourt: null,
    courtCount: 4,
    weather: null,
    coachId: null,

    setCoachId: (id) => set((s) => { s.coachId = id }),

    setActiveCourt: (court) => set((s) => { s.activeCourt = court }),

    setCourtCount: (n) => set((s) => { s.courtCount = n }),

    setWeather: (w) => set((s) => { s.weather = w }),

    loadWeather: async () => {
      const snap = await getLocationAndWeather()
      if (snap) set((s) => { s.weather = snap })
    },

    setupCourt: async (courtNumber, playerName, opponentName) => {
      const supabase = createClient()
      const { coachId, weather } = get()
      if (!coachId) return

      const { data, error } = await supabase
        .from('matches')
        .insert({
          coach_id: coachId,
          court_number: courtNumber,
          player_name: playerName,
          opponent_name: opponentName,
          status: 'active',
          sets: [],
          weather_snapshot: weather ?? null,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (error || !data) { console.error(error); return }

      set((s) => {
        const court = s.courts[courtNumber - 1]
        court.matchId = data.id
        court.playerName = playerName
        court.opponentName = opponentName
        court.status = 'active'
        court.sets = []
        court.notes = []
        court.weatherSnapshot = get().weather
        court.startedAt = new Date().toISOString()
      })
    },

    updateSet: (courtNumber, setIndex, side, value) => {
      set((s) => {
        const court = s.courts[courtNumber - 1]
        if (court.sets[setIndex]) {
          court.sets[setIndex][side] = value
        }
      })
      // Debounce DB write — fire-and-forget
      const court = get().courts[courtNumber - 1]
      if (!court.matchId) return
      const supabase = createClient()
      supabase.from('matches').update({ sets: court.sets }).eq('id', court.matchId)
    },

    addSet: (courtNumber) => {
      set((s) => {
        const court = s.courts[courtNumber - 1]
        if (court.sets.length < 5) court.sets.push({ player: 0, opponent: 0 })
      })
    },

    removeSet: (courtNumber, setIndex) => {
      set((s) => {
        const court = s.courts[courtNumber - 1]
        court.sets.splice(setIndex, 1)
      })
    },

    addNote: async (courtNumber, content, tags) => {
      const court = get().courts[courtNumber - 1]
      if (!court.matchId) return
      const supabase = createClient()
      const { coachId } = get()

      const note: Note = {
        id: crypto.randomUUID(),
        matchId: court.matchId,
        content,
        tags,
        timestamp: new Date().toISOString(),
      }

      // Optimistic update
      set((s) => { s.courts[courtNumber - 1].notes.unshift(note) })

      // Persist
      await supabase.from('notes').insert({
        id: note.id,
        match_id: note.matchId,
        coach_id: coachId,
        content: note.content,
        tags: note.tags,
        note_timestamp: note.timestamp,
      })
    },

    endMatch: async (courtNumber) => {
      const court = get().courts[courtNumber - 1]
      if (!court.matchId) return
      const supabase = createClient()

      set((s) => { s.courts[courtNumber - 1].isSaving = true })

      await supabase.from('matches').update({
        status: 'finished',
        sets: court.sets,
        ended_at: new Date().toISOString(),
        weather_snapshot: court.weatherSnapshot,
      }).eq('id', court.matchId)

      set((s) => {
        s.courts[courtNumber - 1].status = 'finished'
        s.courts[courtNumber - 1].isSaving = false
      })
    },

    clearCourt: (courtNumber) => {
      set((s) => { s.courts[courtNumber - 1] = emptyCourtState(courtNumber) })
    },

    loadActiveMatches: async () => {
      const supabase = createClient()
      const { coachId } = get()
      if (!coachId) return

      const { data: matches } = await supabase
        .from('matches')
        .select('*, notes(*)')
        .eq('coach_id', coachId)
        .eq('status', 'active')

      if (!matches) return

      set((s) => {
        for (const m of matches) {
          const idx = m.court_number - 1
          s.courts[idx] = {
            courtNumber: m.court_number,
            matchId: m.id,
            playerName: m.player_name,
            opponentName: m.opponent_name,
            status: 'active',
            sets: m.sets ?? [],
            notes: (m.notes ?? []).map((n: any) => ({
              id: n.id,
              matchId: n.match_id,
              content: n.content,
              tags: n.tags,
              timestamp: n.note_timestamp,
            })).sort((a: Note, b: Note) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            ),
            weatherSnapshot: m.weather_snapshot,
            startedAt: m.started_at,
            isSaving: false,
          }
        }
      })
    },
  }))
)
