'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import type { NoteTag } from '@/types'
import clsx from 'clsx'

interface Props {
  courtNumber: number
  livePlayer: number | null
  liveOpponent: number | null
  side: 'serving' | 'returning' | null
}

interface QuickEntry {
  label: string
  content: string
  tags: NoteTag[]
}

interface Section {
  title: string
  emoji: string
  border: string
  activeBg: string
  activeText: string
  flashBg: string
  entries: QuickEntry[]
}

const SECTIONS: Section[] = [
  {
    title: 'Doing Well',
    emoji: '✅',
    border: 'border-green-800/50',
    activeBg: 'bg-green-900/40',
    activeText: 'text-green-200',
    flashBg: 'bg-green-500',
    entries: [
      { label: 'Ace',          content: 'Ace',                 tags: ['ace', 'serve'] },
      { label: 'FH Winner',    content: 'FH Winner',           tags: ['winner', 'forehand'] },
      { label: 'BH Solid',     content: 'BH Solid',            tags: ['winner', 'backhand'] },
      { label: '1st Serve In', content: '1st Serve In',        tags: ['serve'] },
      { label: 'Aggressive',   content: 'Aggressive Play',     tags: ['tactical'] },
      { label: 'Net Play',     content: 'Good Net Play',       tags: ['net-play'] },
      { label: 'Moving Well',  content: 'Moving Well',         tags: ['movement'] },
      { label: 'Return Deep',  content: 'Return Deep',         tags: ['tactical'] },
      { label: 'Attack Short', content: 'Attacking Short Ball',tags: ['tactical', 'winner'] },
      { label: 'Consistent',   content: 'Consistent Rally',    tags: ['tactical'] },
    ],
  },
  {
    title: 'Needs Work',
    emoji: '⚠️',
    border: 'border-red-800/50',
    activeBg: 'bg-red-900/40',
    activeText: 'text-red-200',
    flashBg: 'bg-red-500',
    entries: [
      { label: 'FH Error',      content: 'FH Error',            tags: ['unforced-error', 'forehand'] },
      { label: 'BH Error',      content: 'BH Error',            tags: ['unforced-error', 'backhand'] },
      { label: 'Dbl Fault',     content: 'Double Fault',        tags: ['double-fault'] },
      { label: 'Passive',       content: 'Passive Play',        tags: ['tactical'] },
      { label: 'Poor Select',   content: 'Poor Shot Selection', tags: ['mental-lapse'] },
      { label: 'Late Feet',     content: 'Late Footwork',       tags: ['movement'] },
      { label: 'Short Ball',    content: 'Short Ball Given',    tags: ['tactical'] },
      { label: 'Missed Return', content: 'Missed Return',       tags: ['unforced-error'] },
      { label: 'Poor Position', content: 'Poor Court Position', tags: ['movement'] },
    ],
  },
  {
    title: 'Mental',
    emoji: '🧠',
    border: 'border-yellow-800/50',
    activeBg: 'bg-yellow-900/40',
    activeText: 'text-yellow-200',
    flashBg: 'bg-yellow-500',
    entries: [
      { label: 'Good Focus',   content: 'Good Focus',          tags: ['great-decision'] },
      { label: 'Bad Body Lang',content: 'Bad Body Language',   tags: ['mental-lapse'] },
      { label: 'Fighting',     content: 'Competing Hard',      tags: ['momentum'] },
      { label: 'Gives Up',     content: 'Gives Up Early',      tags: ['mental-lapse'] },
      { label: 'Good BP',      content: 'Good Between Points', tags: ['highlight'] },
      { label: 'Poor BP',      content: 'Poor Between Points', tags: ['mental-lapse'] },
      { label: 'Positive',     content: 'Positive Energy',     tags: ['momentum'] },
      { label: 'Neg Self-Talk',content: 'Negative Self-Talk',  tags: ['mental-lapse'] },
      { label: 'Slow BP',      content: 'Slow Between Points', tags: ['mental-lapse'] },
    ],
  },
]

export default function QuickLogPanel({ courtNumber, livePlayer, liveOpponent, side }: Props) {
  const { addNote } = useStore()
  const [tapped, setTapped] = useState<string | null>(null)

  async function handleTap(entry: QuickEntry) {
    setTapped(entry.label)
    const contextParts: string[] = []
    if (livePlayer !== null && liveOpponent !== null) contextParts.push(`${livePlayer}–${liveOpponent}`)
    if (side) contextParts.push(side === 'serving' ? 'Serving' : 'Returning')
    const content = contextParts.length ? `[${contextParts.join(' · ')}] ${entry.content}` : entry.content
    await addNote(courtNumber, content, entry.tags)
    setTimeout(() => setTapped(null), 700)
  }

  return (
    <div className="space-y-3">
      {SECTIONS.map(section => (
        <div key={section.title} className={clsx('rounded-xl border p-3', section.border, section.activeBg)}>
          <p className={clsx('text-xs font-bold uppercase tracking-wider mb-2', section.activeText)}>
            {section.emoji} {section.title}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {section.entries.map(entry => {
              const isTapped = tapped === entry.label
              return (
                <button
                  key={entry.label}
                  type="button"
                  onClick={() => handleTap(entry)}
                  disabled={!!tapped}
                  className={clsx(
                    'py-3 px-1 rounded-xl text-xs font-semibold transition text-center leading-tight',
                    isTapped
                      ? `${section.flashBg} text-white scale-95`
                      : `bg-gray-900/60 ${section.activeText} hover:bg-gray-800 active:scale-95`
                  )}
                >
                  {isTapped ? '✓' : entry.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
