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
  // Outcomes
  | 'winner'
  | 'unforced-error'
  | 'forced-error'
  | 'ace'
  | 'double-fault'
  // Shots
  | 'forehand'
  | 'backhand'
  | 'serve'
  | 'volley'
  | 'overhead'
  | 'drop-shot'
  | 'approach'
  // Patterns
  | 'net-play'
  | 'cross-court'
  | 'down-the-line'
  | 'serve-plus-one'
  // Mental / Tactical
  | 'mental-lapse'
  | 'great-decision'
  | 'tactical'
  | 'momentum'
  // Physical
  | 'movement'
  | 'fatigue'
  // Match
  | 'break-point'
  | 'highlight'

export const NOTE_TAGS: { value: NoteTag; label: string; color: string }[] = [
  // Outcomes
  { value: 'winner',        label: 'Winner',        color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  { value: 'unforced-error',label: 'UE',            color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { value: 'forced-error',  label: 'Forced Err',    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { value: 'ace',           label: 'Ace',           color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { value: 'double-fault',  label: 'Dbl Fault',     color: 'bg-red-700/20 text-red-400 border-red-700/30' },
  // Shots
  { value: 'forehand',      label: 'Forehand',      color: 'bg-orange-400/20 text-orange-300 border-orange-400/30' },
  { value: 'backhand',      label: 'Backhand',      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { value: 'serve',         label: 'Serve',         color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { value: 'volley',        label: 'Volley',        color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { value: 'overhead',      label: 'Overhead',      color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  { value: 'drop-shot',     label: 'Drop Shot',     color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { value: 'approach',      label: 'Approach',      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  // Patterns
  { value: 'net-play',      label: 'Net Play',      color: 'bg-cyan-600/20 text-cyan-300 border-cyan-600/30' },
  { value: 'cross-court',   label: 'Cross Court',   color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { value: 'down-the-line', label: 'DTL',           color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { value: 'serve-plus-one',label: 'Serve +1',      color: 'bg-blue-600/20 text-blue-300 border-blue-600/30' },
  // Mental / Tactical
  { value: 'mental-lapse',  label: 'Mental Lapse',  color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  { value: 'great-decision',label: 'Great IQ',      color: 'bg-lime-500/20 text-lime-300 border-lime-500/30' },
  { value: 'tactical',      label: 'Tactical',      color: 'bg-purple-600/20 text-purple-300 border-purple-600/30' },
  { value: 'momentum',      label: 'Momentum',      color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  // Physical
  { value: 'movement',      label: 'Movement',      color: 'bg-teal-600/20 text-teal-300 border-teal-600/30' },
  { value: 'fatigue',       label: 'Fatigue',       color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
  // Match
  { value: 'break-point',   label: 'Break Pt',      color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { value: 'highlight',     label: 'Highlight',     color: 'bg-yellow-400/20 text-yellow-200 border-yellow-400/30' },
]

export interface Note {
  id: string
  matchId: string
  content: string
  tags: NoteTag[]
  timestamp: string  // ISO
}

export type MatchStatus = 'empty' | 'active' | 'finished'
export type MatchType = 'singles' | 'doubles'

export interface CourtState {
  courtNumber: number
  matchId: string | null
  matchType: MatchType
  playerName: string
  playerName2: string
  opponentName: string
  opponentName2: string
  meetId: string | null
  status: MatchStatus
  sets: SetScore[]
  notes: Note[]
  weatherSnapshot: WeatherSnapshot | null
  startedAt: string | null
  isSaving: boolean
  aiSummary: string | null
}

export interface Meet {
  id: string
  name: string
  createdAt: string
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
