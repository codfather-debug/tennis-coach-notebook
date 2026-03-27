export interface SetScore {
  player: number
  opponent: number
  tiebreak?: { player: number; opponent: number }
}

export interface WeatherSnapshot {
  temp: number        // Celsius
  feelsLike: number
  humidity: number
  windSpeed: number   // km/h
  windGusts: number
  condition: string
  icon: string
  capturedAt: string  // ISO timestamp
}

export type NoteTag =
  | 'unforced-error'
  | 'winner'
  | 'serve'
  | 'mental-lapse'
  | 'tactical'
  | 'movement'
  | 'highlight'
  | 'net-play'
  | 'backhand'
  | 'forehand'
  | 'break-point'
  | 'pressure'
  | 'first-serve'

export const NOTE_TAGS: { value: NoteTag; label: string; color: string }[] = [
  { value: 'unforced-error', label: 'Unforced Error', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { value: 'winner',         label: 'Winner',         color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  { value: 'highlight',      label: 'Highlight',      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { value: 'serve',          label: 'Serve',          color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { value: 'first-serve',    label: 'First Serve %',  color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  { value: 'forehand',       label: 'Forehand',       color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { value: 'backhand',       label: 'Backhand',       color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { value: 'net-play',       label: 'Net Play',       color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { value: 'movement',       label: 'Movement',       color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { value: 'mental-lapse',   label: 'Mental Lapse',   color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  { value: 'pressure',       label: 'Pressure',       color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { value: 'break-point',    label: 'Break Point',    color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { value: 'tactical',       label: 'Tactical',       color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
]

export interface Note {
  id: string
  matchId: string
  content: string
  tags: NoteTag[]
  timestamp: string  // ISO
}

export type MatchStatus = 'empty' | 'active' | 'finished'

export interface CourtState {
  courtNumber: number
  matchId: string | null
  playerName: string
  opponentName: string
  status: MatchStatus
  sets: SetScore[]
  notes: Note[]
  weatherSnapshot: WeatherSnapshot | null
  startedAt: string | null
  // UI state
  isSaving: boolean
}

export interface Player {
  id: string
  name: string
}

export interface MatchRecord {
  id: string
  courtNumber: number
  playerName: string
  opponentName: string
  sets: SetScore[]
  notes: Note[]
  weatherSnapshot: WeatherSnapshot | null
  startedAt: string
  endedAt: string
  result: 'win' | 'loss' | 'unknown'
}
