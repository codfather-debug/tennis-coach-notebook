'use client'
import { useState } from 'react'
import type { Note } from '@/types'
import { NOTE_TAGS } from '@/types'
import { formatDistanceToNow, format } from 'date-fns'
import clsx from 'clsx'

interface Props {
  notes: Note[]
  onDelete?: (noteId: string) => void
}

function tagStyle(value: string) {
  return NOTE_TAGS.find(t => t.value === value)?.color ?? 'bg-gray-700 text-gray-300 border-gray-600'
}

export default function NoteList({ notes, onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  if (!notes.length) {
    return (
      <p className="text-gray-600 text-sm text-center py-8">
        No notes yet — start adding observations above
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {notes.map(note => (
        <div key={note.id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 flex gap-2 items-start">
          <div className="flex-1 min-w-0">
            {/* Tags */}
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5">
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
            <p className="text-gray-200 text-sm leading-relaxed">{note.content}</p>
            <p
              className="text-gray-600 text-xs mt-1.5"
              title={format(new Date(note.timestamp), 'PPpp')}
            >
              {formatDistanceToNow(new Date(note.timestamp), { addSuffix: true })}
            </p>
          </div>

          {/* Delete */}
          {onDelete && (
            confirmId === note.id ? (
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button
                  onClick={() => { onDelete(note.id); setConfirmId(null) }}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white px-2.5 py-1.5 rounded-lg transition font-semibold"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-xs text-gray-500 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmId(note.id)}
                className="flex-shrink-0 text-gray-700 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-gray-800 text-base leading-none"
                title="Delete note"
              >
                🗑
              </button>
            )
          )}
        </div>
      ))}
    </div>
  )
}
