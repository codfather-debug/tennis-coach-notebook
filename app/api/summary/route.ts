import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { playerName, opponentName, sets, notes } = await request.json()

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
  }

  const setScores = sets.length
    ? sets.map((s: any, i: number) => `Set ${i + 1}: ${s.player}–${s.opponent}`).join(', ')
    : 'No score recorded'

  const notesList = notes.length
    ? notes.map((n: any) => `[${new Date(n.timestamp).toLocaleTimeString()}]${n.tags.length ? ` (${n.tags.join(', ')})` : ''} ${n.content}`).join('\n')
    : 'No notes recorded'

  const prompt = `You are a tennis coach assistant. Write a concise post-match summary for a coach.

Player: ${playerName}
Opponent: ${opponentName}
Score: ${setScores}

Coach notes taken during the match:
${notesList}

Write a 3-5 sentence summary covering: overall match result, key patterns observed (from the tags and notes), one strength and one area to work on. Be direct and specific. Address the coach, not the player.`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const data = await response.json()
  const summary = data.choices?.[0]?.message?.content ?? 'No summary generated'

  return NextResponse.json({ summary })
}
