const ROSTER_KEY = 'tcn_player_roster'

export function getRoster(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(ROSTER_KEY) ?? '[]')
  } catch { return [] }
}

export function addToRoster(name: string) {
  if (typeof window === 'undefined') return
  const roster = getRoster()
  const trimmed = name.trim()
  if (!trimmed || roster.includes(trimmed)) return
  localStorage.setItem(ROSTER_KEY, JSON.stringify([trimmed, ...roster].slice(0, 50)))
}
