'use client'
import { useStore } from '@/lib/store'
import CourtCard from './CourtCard'

export default function CourtGrid() {
  const { courtCount, activeCourt, setActiveCourt } = useStore()

  function goNext() {
    if (!activeCourt) return
    const next = activeCourt < courtCount ? activeCourt + 1 : 1
    setActiveCourt(next)
  }

  function goPrev() {
    if (!activeCourt) return
    const prev = activeCourt > 1 ? activeCourt - 1 : courtCount
    setActiveCourt(prev)
  }

  return (
    <div className="space-y-3">
      <div className="overflow-y-auto max-h-[calc(100vh-120px)] lg:max-h-none">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
          {Array.from({ length: courtCount }, (_, i) => (
            <CourtCard key={i + 1} courtNumber={i + 1} />
          ))}
        </div>
      </div>

      {activeCourt && courtCount > 1 && (
        <div className="flex items-center justify-between px-1">
          <button
            onClick={goPrev}
            className="text-xs text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-gray-800"
          >
            ← Prev
          </button>
          <span className="text-xs text-gray-600">
            Court {activeCourt} of {courtCount}
          </span>
          <button
            onClick={goNext}
            className="text-xs text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-gray-800"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
