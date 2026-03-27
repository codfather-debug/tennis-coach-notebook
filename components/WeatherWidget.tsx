'use client'
import type { WeatherSnapshot } from '@/types'

interface Props {
  weather: WeatherSnapshot
  compact?: boolean
}

export default function WeatherWidget({ weather, compact }: Props) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-800/50 px-2.5 py-1.5 rounded-lg">
        <span>{weather.icon}</span>
        <span className="font-medium text-gray-300">{weather.temp}°</span>
        <span>{weather.windSpeed}km/h</span>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{weather.icon}</span>
        <div>
          <p className="text-white font-semibold">{weather.temp}°C</p>
          <p className="text-gray-500 text-xs">{weather.condition}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <Stat label="Feels Like" value={`${weather.feelsLike}°`} />
        <Stat label="Humidity" value={`${weather.humidity}%`} />
        <Stat label="Wind" value={`${weather.windSpeed} km/h`} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-2 text-center">
      <p className="text-gray-500 text-[10px] uppercase tracking-wide">{label}</p>
      <p className="text-gray-200 font-medium mt-0.5">{value}</p>
    </div>
  )
}
