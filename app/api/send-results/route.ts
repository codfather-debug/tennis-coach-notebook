import { NextResponse } from 'next/server'
import { Resend } from 'resend'

interface MatchPayload {
  playerName: string
  email: string
  subject: string
  report: string
}

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const { matches, fromEmail } = await req.json() as {
    matches: MatchPayload[]
    fromEmail?: string
  }

  if (!matches?.length) {
    return NextResponse.json({ error: 'No matches provided' }, { status: 400 })
  }

  const resend = new Resend(apiKey)
  const from = fromEmail || 'Coach Notebook <onboarding@resend.dev>'
  const results: { email: string; ok: boolean; error?: string }[] = []

  for (const match of matches) {
    const { error } = await resend.emails.send({
      from,
      to: match.email,
      subject: match.subject,
      text: match.report,
    })
    results.push({ email: match.email, ok: !error, error: error?.message })
  }

  const failed = results.filter(r => !r.ok)
  return NextResponse.json({ results, failed: failed.length })
}
