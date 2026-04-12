'use client'
import clsx from 'clsx'

export interface DoublesState {
  servingTeam: 1 | 2
  team1ServerIdx: 0 | 1
  team2ServerIdx: 0 | 1
  team2DeuceIdx: 0 | 1 | null
  team1DeuceIdx: 0 | 1 | null
  gameInSet: number
  step: 'server-team' | 'server-player' | 'server-player-2' | 'recv-g1' | 'recv-g2' | 'ready'
}

interface Props {
  player1: string
  player2: string
  opp1: string
  opp2: string
  state: DoublesState
  onStateChange: (s: DoublesState) => void
  onNewGame: () => void
  onNewSet: () => void
}

export default function DoublesServingPanel({
  player1, player2, opp1, opp2, state, onStateChange, onNewGame, onNewSet
}: Props) {
  const { step, servingTeam, team1ServerIdx, team2ServerIdx, team2DeuceIdx, team1DeuceIdx, gameInSet } = state
  const t1 = [player1, player2]
  const t2 = [opp1 || 'Opp 1', opp2 || 'Opp 2']

  const stepLabel = {
    'server-team': '1 / 5',
    'server-player': '2 / 5',
    'server-player-2': '3 / 5',
    'recv-g1': '4 / 5',
    'recv-g2': '5 / 5',
    'ready': '',
  }[step]

  if (step === 'server-team') {
    return (
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Who serves first?</p>
          <span className="text-xs text-gray-600">{stepLabel}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onStateChange({ ...state, servingTeam: 1, step: 'server-player' })}
            className="py-3 px-3 rounded-xl bg-green-950/50 border border-green-700/60 text-green-200 text-sm font-semibold hover:bg-green-900/60 transition text-left"
          >
            <p className="font-bold truncate">{player1}</p>
            <p className="text-xs opacity-60 truncate">/ {player2}</p>
          </button>
          <button
            onClick={() => onStateChange({ ...state, servingTeam: 2, step: 'server-player' })}
            className="py-3 px-3 rounded-xl bg-red-950/50 border border-red-700/60 text-red-200 text-sm font-semibold hover:bg-red-900/60 transition text-left"
          >
            <p className="font-bold truncate">{opp1 || 'Opp 1'}</p>
            <p className="text-xs opacity-60 truncate">/ {opp2 || 'Opp 2'}</p>
          </button>
        </div>
      </div>
    )
  }

  if (step === 'server-player') {
    const names = servingTeam === 1 ? t1 : t2
    const isTeam1 = servingTeam === 1
    return (
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
            Game 1 — {isTeam1 ? 'Your team' : 'Opponents'} serve. Who serves?
          </p>
          <span className="text-xs text-gray-600">{stepLabel}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {names.map((name, idx) => (
            <button
              key={idx}
              onClick={() => {
                const s = { ...state, step: 'server-player-2' as const }
                if (isTeam1) s.team1ServerIdx = idx as 0 | 1
                else s.team2ServerIdx = idx as 0 | 1
                onStateChange(s)
              }}
              className={clsx(
                'py-3 px-3 rounded-xl text-sm font-semibold transition',
                isTeam1
                  ? 'bg-green-950/50 border border-green-700/60 text-green-200 hover:bg-green-900/60'
                  : 'bg-red-950/50 border border-red-700/60 text-red-200 hover:bg-red-900/60'
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'server-player-2') {
    const otherTeam = servingTeam === 1 ? 2 : 1
    const names = otherTeam === 1 ? t1 : t2
    const isTeam1 = otherTeam === 1
    return (
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
            Game 2 — {isTeam1 ? 'Your team' : 'Opponents'} serve. Who serves?
          </p>
          <span className="text-xs text-gray-600">{stepLabel}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {names.map((name, idx) => (
            <button
              key={idx}
              onClick={() => {
                const s = { ...state, step: 'recv-g1' as const }
                if (isTeam1) s.team1ServerIdx = idx as 0 | 1
                else s.team2ServerIdx = idx as 0 | 1
                onStateChange(s)
              }}
              className={clsx(
                'py-3 px-3 rounded-xl text-sm font-semibold transition',
                isTeam1
                  ? 'bg-green-950/50 border border-green-700/60 text-green-200 hover:bg-green-900/60'
                  : 'bg-red-950/50 border border-red-700/60 text-red-200 hover:bg-red-900/60'
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'recv-g1') {
    // Receiving team in game 1 = non-serving team
    const recvTeam = servingTeam === 1 ? 2 : 1
    const names = recvTeam === 1 ? t1 : t2
    const isTeam1 = recvTeam === 1
    return (
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
            Game 1 — {isTeam1 ? 'Your team' : 'Opponents'} receive
          </p>
          <span className="text-xs text-gray-600">{stepLabel}</span>
        </div>
        <p className="text-xs text-gray-500">Who's on the deuce side (right)?</p>
        <div className="grid grid-cols-2 gap-2">
          {names.map((name, idx) => (
            <button
              key={idx}
              onClick={() => {
                const s = { ...state, step: 'recv-g2' as const }
                if (recvTeam === 1) s.team1DeuceIdx = idx as 0 | 1
                else s.team2DeuceIdx = idx as 0 | 1
                onStateChange(s)
              }}
              className={clsx(
                'py-3 px-3 rounded-xl text-sm font-semibold transition',
                isTeam1
                  ? 'bg-green-950/50 border border-green-700/60 text-green-200 hover:bg-green-900/60'
                  : 'bg-red-950/50 border border-red-700/60 text-red-200 hover:bg-red-900/60'
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'recv-g2') {
    // Receiving team in game 2 = the original serving team
    const recvTeam = servingTeam
    const names = recvTeam === 1 ? t1 : t2
    const isTeam1 = recvTeam === 1
    return (
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
            Game 2 — {isTeam1 ? 'Your team' : 'Opponents'} receive
          </p>
          <span className="text-xs text-gray-600">{stepLabel}</span>
        </div>
        <p className="text-xs text-gray-500">Who's on the deuce side (right)?</p>
        <div className="grid grid-cols-2 gap-2">
          {names.map((name, idx) => (
            <button
              key={idx}
              onClick={() => {
                const s = { ...state, step: 'ready' as const }
                if (recvTeam === 1) s.team1DeuceIdx = idx as 0 | 1
                else s.team2DeuceIdx = idx as 0 | 1
                onStateChange(s)
              }}
              className={clsx(
                'py-3 px-3 rounded-xl text-sm font-semibold transition',
                isTeam1
                  ? 'bg-green-950/50 border border-green-700/60 text-green-200 hover:bg-green-900/60'
                  : 'bg-red-950/50 border border-red-700/60 text-red-200 hover:bg-red-900/60'
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Ready state
  const currentServer = servingTeam === 1 ? t1[team1ServerIdx] : t2[team2ServerIdx]
  const recvTeamNow = servingTeam === 1 ? 2 : 1
  const recvNames = recvTeamNow === 1 ? t1 : t2
  const deuceIdx = recvTeamNow === 1 ? team1DeuceIdx : team2DeuceIdx
  const adIdx = deuceIdx !== null ? ((1 - deuceIdx) as 0 | 1) : null
  const deuceReceiver = deuceIdx !== null ? recvNames[deuceIdx] : null
  const adReceiver = adIdx !== null ? recvNames[adIdx] : null

  const isTeam1Serving = servingTeam === 1
  const borderColor = isTeam1Serving ? 'border-green-800/50' : 'border-red-800/50'
  const bgColor = isTeam1Serving ? 'bg-green-950/30' : 'bg-red-950/30'
  const textColor = isTeam1Serving ? 'text-green-300' : 'text-red-300'

  return (
    <div className={clsx('border rounded-xl p-3', borderColor, bgColor)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium">Game {gameInSet}</p>
          <p className={clsx('text-sm font-bold', textColor)}>
            🎾 {currentServer} serving
          </p>
          {deuceReceiver && adReceiver && (
            <p className="text-xs text-gray-500 mt-0.5">
              ← {adReceiver} · {deuceReceiver} →
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
          <button
            onClick={onNewGame}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition font-semibold whitespace-nowrap"
          >
            Next Game
          </button>
          <button
            onClick={onNewSet}
            className="text-xs text-gray-500 hover:text-white px-1 transition whitespace-nowrap"
          >
            New Set
          </button>
        </div>
      </div>
    </div>
  )
}
