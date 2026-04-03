'use client'
import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
import clsx from 'clsx'
import type { NoteTag } from '@/types'

type Side = 'serving' | 'returning' | null

interface Props {
  courtNumber: number
  livePlayer: number | null
  liveOpponent: number | null
  side: Side
}

const QUICK_TAGS: { value: NoteTag; label: string; color: string }[] = [
  { value: 'winner',        label: 'Winner',         color: 'bg-green-600/30 text-green-300 border-green-500/50 hover:bg-green-600/50' },
  { value: 'unforced-error',label: 'Unforced Error', color: 'bg-red-600/30 text-red-300 border-red-500/50 hover:bg-red-600/50' },
  { value: 'highlight',     label: 'Highlight',      color: 'bg-yellow-600/30 text-yellow-300 border-yellow-500/50 hover:bg-yellow-600/50' },
  { value: 'mental-lapse',  label: 'Mental',         color: 'bg-yellow-800/30 text-yellow-400 border-yellow-700/50 hover:bg-yellow-800/50' },
  { value: 'net-play',      label: 'Net Play',       color: 'bg-cyan-600/30 text-cyan-300 border-cyan-500/50 hover:bg-cyan-600/50' },
]

const WINNER_SUBS = ['Cross Court', 'Down the Line', 'Overhead Smash', 'Volley', 'Other']
const UE_SUBS     = ['In the Net', 'Long', 'Wide', 'Shank']

export default function NoteInput({ courtNumber, livePlayer, liveOpponent, side }: Props) {
  const { addNote, courts, updateSet, addSet } = useStore()
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<NoteTag[]>([])
  const [subExpanded, setSubExpanded] = useState<'winner' | 'unforced-error' | null>(null)
  const [otherInput, setOtherInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [listening, setListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const otherRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  const hasLiveScore = livePlayer !== null && liveOpponent !== null

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
        const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join(' ')
        setContent(prev => (prev ? prev + ' ' + transcript : transcript).trim())
      }
      recognition.onend = () => setListening(false)
      recognitionRef.current = recognition
    }
  }, [])

  function toggleMic() {
    if (!recognitionRef.current) return
    if (listening) { recognitionRef.current.stop(); setListening(false) }
    else { recognitionRef.current.start(); setListening(true) }
  }

  function toggleTag(tag: NoteTag) {
    const isSelecting = !selectedTags.includes(tag)
    setSelectedTags(prev => isSelecting ? [...prev, tag] : prev.filter(t => t !== tag))

    if (tag === 'winner' || tag === 'unforced-error') {
      if (isSelecting) {
        setSubExpanded(tag)
        setOtherInput('')
      } else {
        setSubExpanded(null)
      }
    }
  }

  function handleSubSelect(sub: string) {
    if (sub === 'Other') {
      setTimeout(() => otherRef.current?.focus(), 50)
      return
    }
    const label = subExpanded === 'winner' ? `Winner — ${sub}` : `Unforced Error — ${sub}`
    setContent(prev => prev.trim() ? prev.trim() + ' ' + label : label)
    setSubExpanded(null)
    textareaRef.current?.focus()
  }

  function handleOtherConfirm() {
    if (!otherInput.trim()) return
    const label = subExpanded === 'winner'
      ? `Winner — ${otherInput.trim()}`
      : `Unforced Error — ${otherInput.trim()}`
    setContent(prev => prev.trim() ? prev.trim() + ' ' + label : label)
    setOtherInput('')
    setSubExpanded(null)
    textareaRef.current?.focus()
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    if (listening) { recognitionRef.current?.stop(); setListening(false) }

    const contextParts: string[] = []
    if (hasLiveScore) contextParts.push(`${livePlayer}–${liveOpponent}`)
    if (side) contextParts.push(side === 'serving' ? 'Serving' : 'Returning')
    const finalContent = contextParts.length ? `[${contextParts.join(' · ')}] ${trimmed}` : trimmed

    setSaving(true)
    await addNote(courtNumber, finalContent, selectedTags)
    setContent('')
    setSelectedTags([])
    setSubExpanded(null)
    setOtherInput('')
    setSaving(false)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit()
  }

  const subs = subExpanded === 'winner' ? WINNER_SUBS : subExpanded === 'unforced-error' ? UE_SUBS : []
  const subColor = subExpanded === 'winner'
    ? { pill: 'bg-green-900/50 text-green-200 border-green-700/60 hover:bg-green-800/60', other: 'border-green-700 focus:ring-green-500' }
    : { pill: 'bg-red-900/50 text-red-200 border-red-700/60 hover:bg-red-800/60', other: 'border-red-700 focus:ring-red-500' }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Tag pills */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_TAGS.map(tag => (
          <button
            key={tag.value}
            type="button"
            onClick={() => toggleTag(tag.value)}
            className={clsx(
              'text-xs px-2.5 py-1 rounded-full border transition font-medium',
              selectedTags.includes(tag.value)
                ? tag.color + ' ring-1 ring-white/20'
                : 'bg-gray-800/60 text-gray-500 border-gray-700 hover:text-gray-300 hover:border-gray-600'
            )}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Sub-options for Winner or Unforced Error */}
      {subExpanded && (
        <div className={clsx('rounded-xl border p-3 space-y-2', subColor.other.split(' ')[0])}>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
            {subExpanded === 'winner' ? 'Winner type' : 'Error type'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {subs.map(sub => (
              sub === 'Other' ? (
                <div key="other" className="flex gap-1 mt-1 w-full">
                  <input
                    ref={otherRef}
                    value={otherInput}
                    onChange={e => setOtherInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleOtherConfirm())}
                    placeholder="Describe..."
                    className={clsx(
                      'flex-1 bg-gray-900 border rounded-lg px-3 py-1.5 text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-1 transition',
                      subColor.other
                    )}
                  />
                  <button
                    type="button"
                    onClick={handleOtherConfirm}
                    disabled={!otherInput.trim()}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-lg transition"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleSubSelect(sub)}
                  className={clsx('text-xs px-3 py-1.5 rounded-full border transition font-medium', subColor.pill)}
                >
                  {sub}
                </button>
              )
            ))}
          </div>
        </div>
      )}

      {/* Text input */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
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
                listening ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
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
