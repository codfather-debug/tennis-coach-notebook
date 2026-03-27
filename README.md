# Tennis Coach Notebook

Real-time match tracking for tennis coaches. Track up to 8 courts simultaneously.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a Supabase project at [supabase.com](https://supabase.com)

3. Run the schema in your Supabase SQL editor:
   ```
   supabase/schema.sql
   ```

4. Add allowed coach emails in the `allowed_coaches` table via Supabase dashboard

5. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000)

## Features

- 8-court dashboard with live status indicators
- Timestamped notes with 8 tag types
- Set score tracking (stepper UI, no keyboard needed)
- Weather snapshot captured at match start
- Magic link auth (invite-only)
- Match history with full note review
- Syncs on save — works on phone, tablet, and desktop
