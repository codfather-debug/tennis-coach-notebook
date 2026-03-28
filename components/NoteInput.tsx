'use client'
import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
import clsx from 'clsx'

type Side = 'serving' | 'returning' | null

interface Props {
  courtNumber: number
  livePlayer: number | null
  liveOpponent: number | null
  side: Side
}

export default function NoteInput({ courtNumber, livePlayer, liveOpponent, side }: Props) {
  const { addNote, courts, updateSet, addSet } = useStore()
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [listening, setListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

  const hasLiveScore = livePlayer !== null && liveOpponent !== null

  // Sync live score to the score card (current set)
  useEffect(() => {
    if (livePlayer === null || liveOpponent === null) return
    const sets = courts[courtNumber - 1].sets
    if (sets.length === 0) {
      addSet(courtNumber)
      updateSet(courtNumber, 0, 'player', livePlayer)
      updateSet(courtNumber, 0, 'opponent', liveOpponent)
    } else {
      const idx = sets.length - 1
      updateSet(courtNumber, idx, 'player', livePlayer)
      updateSet(courtNumber, idx, 'opponent', liveOpponent)
    }
  }, [livePlayer, liveOpponent])

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

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    if (listening) { recognitionRef.current?.stop(); setListening(false) }

    const contextParts: string[] = []
    if (hasLiveScore) contextParts.push(`${livePlayer}–${liveOpponent}`)
    if (side) contextParts.push(side === 'serving' ? 'Serving' : 'Returning')
    const finalContent = contextParts.length
      ? `[${contextParts.join(' · ')}] ${trimmed}`
      : trimmed

    setSaving(true)
    await addNote(courtNumber, finalContent, [])
    setContent('')
    setSaving(false)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
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
