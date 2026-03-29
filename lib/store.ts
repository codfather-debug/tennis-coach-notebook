import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { CourtState, SetScore, Note, NoteTag, WeatherSnapshot, MatchStatus, MatchType } from '@/types'
import { createClient } from '@/lib/supabase'
import { getLocationAndWeather } from '@/lib/weather'

function emptyCourtState(courtNumber: number): CourtState {
  return {
    courtNumber,
    matchId: null,
    matchType: 'singles',
    playerName: '',
    playerName2: '',
    opponentName: '',
    opponentName2: '',
    meetId: null,
    status: 'empty',
    sets: [],
    notes: [],
    weatherSnapshot: null,
    startedAt: null,
    isSaving: false,
  }
}

interface SetupOpts {
  playerName: string
  opponentName: string
  matchType: MatchType
  playerName2?: string
  opponentName2?: string
}

interface AppStore {
  courts: CourtState[]
  activeCourt: number | null
  courtCount: number
  weather: WeatherSnapshot | null
  coachId: string | null
  activeMeetId: string | null
  activeMeetName: string | null

  setCoachId: (id: string) => void
  setActiveCourt: (court: number | null) => void
  setCourtCount: (n: number) => void
  setWeather: (w: WeatherSnapshot) => void
  loadWeather: () => Promise<void>

  createMeet: (name: string) => Promise<void>
  endMeet: () => Promise<void>
  deleteMeet: (id: string, deleteMatches?: boolean) => Promise<void>

  setupCourt: (courtNumber: number, opts: SetupOpts) => Promise<void>
  updateSet: (courtNumber: number, setIndex: number, side: 'player' | 'opponent', value: number) => void
  updateTiebreak: (courtNumber: number, setIndex: number, side: 'player' | 'opponent', value: number) => void
  addSet: (courtNumber: number) => void
  removeSet: (courtNumber: number, setIndex: number) => void
  addNote: (courtNumber: number, content: string, tags: NoteTag[]) => Promise<void>
  deleteNote: (courtNumber: number, noteId: string) => Promise<void>
  endMatch: (courtNumber: number) => Promise<void>
  deleteMatch: (courtNumber: number) => Promise<void>
  clearCourt: (courtNumber: number) => void
  loadActiveMatches: () => Promise<void>
  renamePlayer: (courtNumber: number, name: string) => void
}

export const useStore = create<AppStore>()(
  immer((set, get) => ({
    courts: Array.from({ length: 14 }, (_, i) => emptyCourtState(i + 1)),
    activeCourt: null,
    courtCount: 4,
    weather: null,
    coachId: null,
    activeMeetId: null,
    activeMeetName: null,

    setCoachId: (id) => set((s) => { s.coachId = id }),

    setActiveCourt: (court) => set((s) => { s.activeCourt = court as number | null }),

    setCourtCount: (n) => set((s) => { s.courtCount = n }),

    setWeather: (w) => set((s) => { s.weather = w }),

    loadWeather: async () => {
      const snap = await getLocationAndWeather()
      if (snap) set((s) => { s.weather = snap })
    },

    createMeet: async (name) => {
      const supabase = createClient()
      const { coachId } = get()
      if (!coachId) return
      const { data } = await supabase
        .from('meets')
        .insert({ coach_id: coachId, name })
        .select('id, name')
        .single()
      if (data) {
        set((s) => {
          s.activeMeetId = data.id
          s.activeMeetName = data.name
        })
      }
    },

    endMeet: async () => {
      const { courts } = get()
      const toEnd = courts.filter(c => c.status === 'active')
      for (const court of toEnd) {
        await get().endMatch(court.courtNumber)
      }
      set((s) => {
        s.activeMeetId = null
        s.activeMeetName = null
      })
    },

    deleteMeet: async (id, deleteMatches = false) => {
      await fetch('/api/meets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, deleteMatches }),
      })
      const { activeMeetId } = get()
      if (activeMeetId === id) {
        set((s) => {
          s.activeMeetId = null
          s.activeMeetName = null
        })
      }
    },

    setupCourt: async (courtNumber, opts) => {
      const supabase = createClient()
      const { coachId, weather, activeMeetId } = get()
      if (!coachId) return

      const { data, error } = await supabase
        .from('matches')
        .insert({
          coach_id: coachId,
          court_number: courtNumber,
          player_name: opts.playerName,
          opponent_name: opts.opponentName,
          match_type: opts.matchType,
          player_name_2: opts.playerName2 ?? null,
          opponent_name_2: opts.opponentName2 ?? null,
          meet_id: activeMeetId ?? null,
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
        court.matchType = opts.matchType
        court.playerName = opts.playerName
        court.playerName2 = opts.playerName2 ?? ''
        court.opponentName = opts.opponentName
        court.opponentName2 = opts.opponentName2 ?? ''
        court.meetId = activeMeetId
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
      const court = get().courts[courtNumber - 1]
      if (!court.matchId) return
      const supabase = createClient()
      supabase.from('matches').update({ sets: court.sets }).eq('id', court.matchId)
    },

    updateTiebreak: (courtNumber, setIndex, side, value) => {
      set((s) => {
        const court = s.courts[courtNumber - 1]
        if (court.sets[setIndex]) {
          if (!court.sets[setIndex].tiebreak) {
            court.sets[setIndex].tiebreak = { player: 0, opponent: 0 }
          }
          court.sets[setIndex].tiebreak![side] = value
        }
      })
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

    deleteNote: async (courtNumber, noteId) => {
      set((s) => {
        s.courts[courtNumber - 1].notes = s.courts[courtNumber - 1].notes.filter(n => n.id !== noteId)
      })
      const supabase = createClient()
      await supabase.from('notes').delete().eq('id', noteId)
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

      set((s) => { s.courts[courtNumber - 1].notes.unshift(note) })

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

      // Save complete — clear court so it's ready for next match
      set((s) => { s.courts[courtNumber - 1] = emptyCourtState(courtNumber) })
    },

    deleteMatch: async (courtNumber) => {
      const court = get().courts[courtNumber - 1]
      if (!court.matchId) return
      const supabase = createClient()
      await supabase.from('matches').delete().eq('id', court.matchId)
      set((s) => { s.courts[courtNumber - 1] = emptyCourtState(courtNumber) })
    },

    clearCourt: (courtNumber) => {
      set((s) => { s.courts[courtNumber - 1] = emptyCourtState(courtNumber) })
    },

    renamePlayer: (courtNumber, name) => {
      const trimmed = name.trim()
      if (!trimmed) return
      set((s) => { s.courts[courtNumber - 1].playerName = trimmed })
      const court = get().courts[courtNumber - 1]
      if (!court.matchId) return
      const supabase = createClient()
      supabase.from('matches').update({ player_name: trimmed }).eq('id', court.matchId)
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
            matchType: m.match_type ?? 'singles',
            playerName: m.player_name,
            playerName2: m.player_name_2 ?? '',
            opponentName: m.opponent_name,
            opponentName2: m.opponent_name_2 ?? '',
            meetId: m.meet_id ?? null,
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
