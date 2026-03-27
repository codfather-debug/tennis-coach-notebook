'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Player {
  id: string
  name: string
  email: string | null
  created_at: string
}

interface Props { initialPlayers: Player[] }

export default function PlayersClient({ initialPlayers }: Props) {
  const [players, setPlayers] = useState(initialPlayers)
  const [addingNew, setAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, email: newEmail }),
    })
    const player = await res.json()
    setPlayers(prev => [...prev, player].sort((a, b) => a.name.localeCompare(b.name)))
    setNewName('')
    setNewEmail('')
    setAddingNew(false)
  }

  async function handleUpdate(player: Player, name: string, email: string) {
    const res = await fetch('/api/players', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: player.id, name, email }),
    })
    const updated = await res.json()
    setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p).sort((a, b) => a.name.localeCompare(b.name)))
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    await fetch('/api/players', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setPlayers(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition text-sm">← Dashboard</Link>
          <h1 className="text-white font-bold">Player Roster</h1>
        </div>
        <button
          onClick={() => setAddingNew(true)}
          className="text-xs bg-green-600 hover:bg-green-500 text-white font-semibold px-3 py-1.5 rounded-lg transition"
        >
          + Add Player
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full">
        {/* Add new player form */}
        {addingNew && (
          <form onSubmit={handleAdd} className="bg-gray-900 border border-green-700/50 rounded-xl p-4 mb-4 space-y-3">
            <p className="text-sm font-semibold text-white">New Player</p>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Player name"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
            />
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg px-4 py-2 transition">
                Save
              </button>
              <button type="button" onClick={() => setAddingNew(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg px-4 py-2 transition">
                Cancel
              </button>
            </div>
          </form>
        )}

        {players.length === 0 && !addingNew && (
          <div className="text-center py-16">
            <p className="text-gray-600 text-sm">No players yet</p>
            <button
              onClick={() => setAddingNew(true)}
              className="mt-4 text-green-400 hover:text-green-300 text-sm transition"
            >
              Add your first player →
            </button>
          </div>
        )}

        <div className="space-y-2">
          {players.map(player => (
            <PlayerRow
              key={player.id}
              player={player}
              editing={editingId === player.id}
              onEdit={() => setEditingId(player.id)}
              onSave={(name, email) => handleUpdate(player, name, email)}
              onCancel={() => setEditingId(null)}
              onDelete={() => handleDelete(player.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface RowProps {
  player: { id: string; name: string; email: string | null }
  editing: boolean
  onEdit: () => void
  onSave: (name: string, email: string) => void
  onCancel: () => void
  onDelete: () => void
}

function PlayerRow({ player, editing, onEdit, onSave, onCancel, onDelete }: RowProps) {
  const [name, setName] = useState(player.name)
  const [email, setEmail] = useState(player.email ?? '')

  if (editing) {
    return (
      <div className="bg-gray-900 border border-green-700/50 rounded-xl p-4 space-y-3">
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email (optional)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
        />
        <div className="flex gap-2">
          <button onClick={() => onSave(name, email)} className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg px-4 py-2 transition">
            Save
          </button>
          <button onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg px-4 py-2 transition">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-white font-medium text-sm">{player.name}</p>
        {player.email ? (
          <p className="text-gray-500 text-xs mt-0.5">{player.email}</p>
        ) : (
          <p className="text-gray-700 text-xs mt-0.5 italic">No email</p>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="text-xs text-gray-500 hover:text-white transition px-2 py-1 rounded hover:bg-gray-800">
          Edit
        </button>
        <button onClick={onDelete} className="text-xs text-gray-600 hover:text-red-400 transition px-2 py-1 rounded hover:bg-gray-800">
          🗑
        </button>
      </div>
    </div>
  )
}
