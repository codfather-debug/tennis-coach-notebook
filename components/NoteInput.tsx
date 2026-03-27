'use client'
import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { NOTE_TAGS, type NoteTag } from '@/types'
import clsx from 'clsx'

interface Props { courtNumber: number }

type Side = 'serving' | 'returning' | null

export default function NoteInput({ courtNumber }: Props) {
  const { addNote, courts } = useStore()
  const court = courts[courtNumber - 1]
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<NoteTag[]>([])
  const [saving, setSaving] = useState(false)
  const [listening, setListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [side, setSide] = useState<Side>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

  // Current set score display
  const currentSet = court.sets.length > 0 ? court.sets[court.sets.length - 1] : null
  const currentSetNum = court.sets.length
  const setLabel = currentSet
    ? `S${currentSetNum} ${currentSet.player}–${currentSet.opponent}`
    : null

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SR) {
      setSpeechSupported(true)
      const recognition = new SR()
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognition.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((r: any) => r[0].transcript)
          .join(' ')
        setContent(prev => (prev ? prev + ' ' + transcript : transcript).trim())
      }
      recognition.onend = () => setListening(false)
      recognitionRef.current = recognition
    }
  }, [])

  function toggleMic() {
    if (!recognitionRef.current) return
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      recognitionRef.current.start()
      setListening(true)
    }
  }

  function toggleTag(tag: NoteTag) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    if (listening) { recognitionRef.current?.stop(); setListening(false) }

    // Build context prefix from set score + serving/returning
    const contextParts = []
    if (setLabel) contextParts.push(setLabel)
    if (side) contextParts.push(side === 'serving' ? 'Serving' : 'Returning')
    const finalContent = contextParts.length
      ? `[${contextParts.join(' · ')}] ${trimmed}`
      : trimmed

    setSaving(true)
    await addNote(courtNumber, finalContent, selectedTags)
    setContent('')
    setSelectedTags([])
    setSaving(false)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Context row: set score + serving/returning */}
      <div className="flex items-center gap-2 flex-wrap">
        {setLabel && (
          <span className="text-xs font-mono bg-gray-800 text-green-300 px-2.5 py-1 rounded-lg border border-gray-700">
            {setLabel}
          </span>
        )}
        <div className="flex gap-1">
          {(['serving', 'returning'] as Side[]).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(prev => prev === s ? null : s)}
              className={clsx(
                'text-xs px-2.5 py-1 rounded-lg border transition font-medium capitalize',
                side === s
                  ? 'bg-yellow-600/30 text-yellow-300 border-yellow-600/50'
                  : 'bg-transparent border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

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

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={listening ? 'Listening...' : 'Quick note... (⌘↵ to save)'}
          rows={2}
          className={clsx(
            'w-full bg-gray-900 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition text-sm resize-none pr-24',
            listening
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-700 focus:border-green-500 focus:ring-green-500'
          )}
        />
        <div className="absolute right-2 bottom-2 flex gap-1">
          {speechSupported && (
            <button
              type="button"
              onClick={toggleMic}
              className={clsx(
                'text-xs font-semibold px-2.5 py-1.5 rounded-lg transition',
                listening
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              )}
              title={listening ? 'Stop recording' : 'Start voice note'}
            >
              🎙️
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim() || saving}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            {saving ? '...' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  )
}
