import type { WeatherSnapshot } from '@/types'

interface OpenMeteoResponse {
  current: {
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    wind_speed_10m: number
    wind_gusts_10m: number
    weather_code: number
  }
}

function weatherCodeToCondition(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear', icon: '☀️' }
  if (code <= 2) return { condition: 'Partly Cloudy', icon: '⛅' }
  if (code === 3) return { condition: 'Overcast', icon: '☁️' }
  if (code <= 49) return { condition: 'Foggy', icon: '🌫️' }
  if (code <= 59) return { condition: 'Drizzle', icon: '🌦️' }
  if (code <= 69) return { condition: 'Rain', icon: '🌧️' }
  if (code <= 79) return { condition: 'Snow', icon: '❄️' }
  if (code <= 82) return { condition: 'Rain Showers', icon: '🌦️' }
  if (code <= 99) return { condition: 'Thunderstorm', icon: '⛈️' }
  return { condition: 'Unknown', icon: '🌡️' }
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherSnapshot> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', lat.toString())
  url.searchParams.set('longitude', lon.toString())
  url.searchParams.set('current', [
    'temperature_2m',
    'apparent_temperature',
    'relative_humidity_2m',
    'wind_speed_10m',
    'wind_gusts_10m',
    'weather_code',
  ].join(','))
  url.searchParams.set('wind_speed_unit', 'kmh')

  const res = await fetch(url.toString(), { next: { revalidate: 300 } })
  if (!res.ok) throw new Error('Weather fetch failed')
  const data: OpenMeteoResponse = await res.json()
  const c = data.current
  const { condition, icon } = weatherCodeToCondition(c.weather_code)

  return {
    temp: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature),
    humidity: c.relative_humidity_2m,
    windSpeed: Math.round(c.wind_speed_10m),
    windGusts: Math.round(c.wind_gusts_10m),
    condition,
    icon,
    capturedAt: new Date().toISOString(),
  }
}

export async function getLocationAndWeather(): Promise<WeatherSnapshot | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const snap = await fetchWeather(pos.coords.latitude, pos.coords.longitude)
          resolve(snap)
        } catch { resolve(null) }
      },
      () => resolve(null),
      { timeout: 5000 }
    )
  })
}
