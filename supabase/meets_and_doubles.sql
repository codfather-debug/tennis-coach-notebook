-- Run this in Supabase SQL Editor

-- 1. Meets table
create table if not exists meets (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references coaches(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

alter table meets enable row level security;

drop policy if exists "coaches manage own meets" on meets;
create policy "coaches manage own meets" on meets
  for all using (coach_id = auth.uid());

-- 2. Add new columns to matches
alter table matches add column if not exists meet_id uuid references meets(id) on delete set null;
alter table matches add column if not exists match_type text default 'singles' check (match_type in ('singles', 'doubles'));
alter table matches add column if not exists player_name_2 text;
alter table matches add column if not exists opponent_name_2 text;
