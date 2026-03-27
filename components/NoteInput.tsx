'use client'
import { useState, useRef } from 'react'
import { useStore } from '@/lib/store'
import { NOTE_TAGS, type NoteTag } from '@/types'
import clsx from 'clsx'

interface Props { courtNumber: number }

export default function NoteInput({ courtNumber }: Props) {
  const { addNote } = useStore()
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<NoteTag[]>([])
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function toggleTag(tag: NoteTag) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    setSaving(true)
    await addNote(courtNumber, trimmed, selectedTags)
    setContent('')
    setSelectedTags([])
    setSaving(false)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Cmd/Ctrl+Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {NOTE_TAGS.map(tag => (
          <button
            key={tag.value}
            type="button"
            onClick={() => toggleTag(tag.value)}
            className={clsx(
              'text-xs px-2.5 py-1 rounded-full border transition font-medium',
              selectedTags.includes(tag.value)
                ? tag.color + ' border-current'
                : 'bg-transparent border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500'
            )}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Text input */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Quick note... (⌘↵ to save)"
          rows={2}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition text-sm resize-none pr-20"
        />
        <button
          type="submit"
          disabled={!content.trim() || saving}
          className="absolute right-2 bottom-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
        >
          {saving ? '...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
