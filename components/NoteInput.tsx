'use client'
import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { NOTE_TAGS, type NoteTag } from '@/types'
import clsx from 'clsx'

interface Props { courtNumber: number }

type Side = 'serving' | 'returning' | null

export default function NoteInput({ courtNumber }: Props) {
  const { addNote, courts, updateSet, addSet } = useStore()
  const court = courts[courtNumber - 1]
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<NoteTag[]>([])
  const [saving, setSaving] = useState(false)
  const [listening, setListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [side, setSide] = useState<Side>(null)
  const [livePlayer, setLivePlayer] = useState<number | null>(null)
  const [liveOpponent, setLiveOpponent] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

  const hasLiveScore = livePlayer !== null && liveOpponent !== null

  // Sync live score to the score card (current set)
  useEffect(() => {
    if (livePlayer === null || liveOpponent === null) return
    const sets = courts[courtNumber - 1].sets
    if (sets.length === 0) {
      addSet(courtNumber)
      // addSet is synchronous in state; index 0 will exist after this
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

  function toggleTag(tag: NoteTag) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = content.trim()
    if (!trimmed && !selectedTags.length) return
    if (listening) { recognitionRef.current?.stop(); setListening(false) }

    const contextParts: string[] = []
    if (hasLiveScore) contextParts.push(`${livePlayer}–${liveOpponent}`)
    if (side) contextParts.push(side === 'serving' ? 'Serving' : 'Returning')
    const finalContent = contextParts.length
      ? trimmed ? `[${contextParts.join(' · ')}] ${trimmed}` : `[${contextParts.join(' · ')}]`
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

      {/* Live score quick-entry */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Current Score</span>
          {hasLiveScore && (
            <button
              type="button"
              onClick={() => { setLivePlayer(null); setLiveOpponent(null) }}
              className="text-xs text-gray-600 hover:text-gray-400 transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Player score */}
        <div className="space-y-1">
          <p className="text-xs text-gray-600 truncate">{court.playerName}</p>
          <div className="flex gap-1.5 flex-wrap">
            {[0,1,2,3,4,5,6].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setLivePlayer(prev => prev === n ? null : n)}
                className={clsx(
                  'w-8 h-8 rounded-lg text-sm font-bold transition',
                  livePlayer === n
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Opponent score */}
        <div className="space-y-1">
          <p className="text-xs text-gray-600 truncate">{court.opponentName}</p>
          <div className="flex gap-1.5 flex-wrap">
            {[0,1,2,3,4,5,6].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setLiveOpponent(prev => prev === n ? null : n)}
                className={clsx(
                  'w-8 h-8 rounded-lg text-sm font-bold transition',
                  liveOpponent === n
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Preview + serving toggle */}
        <div className="flex items-center justify-between pt-1">
          <span className={clsx(
            'text-sm font-mono font-bold',
            hasLiveScore ? 'text-white' : 'text-gray-700'
          )}>
            {hasLiveScore ? `${livePlayer}–${liveOpponent}` : '–'}
          </span>
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
            disabled={(!content.trim() && !selectedTags.length) || saving}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            {saving ? '...' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  )
}
