'use client'
import type { Note } from '@/types'
import { NOTE_TAGS } from '@/types'
import { formatDistanceToNow, format } from 'date-fns'
import clsx from 'clsx'

interface Props { notes: Note[] }

function tagStyle(value: string) {
  return NOTE_TAGS.find(t => t.value === value)?.color ?? 'bg-gray-700 text-gray-300 border-gray-600'
}

export default function NoteList({ notes }: Props) {
  if (!notes.length) {
    return (
      <p className="text-gray-600 text-sm text-center py-8">
        No notes yet — start adding observations above
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {notes.map(note => (
        <div key={note.id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-3">
          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {note.tags.map(tag => (
                <span
                  key={tag}
                  className={clsx('text-xs px-2 py-0.5 rounded-full border', tagStyle(tag))}
                >
                  {NOTE_TAGS.find(t => t.value === tag)?.label ?? tag}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <p className="text-gray-200 text-sm leading-relaxed">{note.content}</p>

          {/* Timestamp */}
          <p
            className="text-gray-600 text-xs mt-2"
            title={format(new Date(note.timestamp), 'PPpp')}
          >
            {formatDistanceToNow(new Date(note.timestamp), { addSuffix: true })}
          </p>
        </div>
      ))}
    </div>
  )
}
