'use client'
import { useStore } from '@/lib/store'
import CourtCard from './CourtCard'

export default function CourtGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
      {Array.from({ length: 8 }, (_, i) => (
        <CourtCard key={i + 1} courtNumber={i + 1} />
      ))}
    </div>
  )
}
