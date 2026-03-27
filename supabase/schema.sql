-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Allowed coaches (invite-only)
create table allowed_coaches (
  email text primary key
);

-- Coaches (populated on first magic link login)
create table coaches (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  created_at timestamptz default now()
);

-- Players
create table players (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references coaches(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

-- Matches
create table matches (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references coaches(id) on delete cascade not null,
  court_number int not null check (court_number between 1 and 8),
  player_id uuid references players(id) on delete set null,
  player_name text not null,
  opponent_name text not null,
  status text not null default 'active' check (status in ('active', 'finished')),
  sets jsonb not null default '[]'::jsonb,
  weather_snapshot jsonb,
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz default now()
);

-- Notes
create table notes (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references matches(id) on delete cascade not null,
  coach_id uuid references coaches(id) on delete cascade not null,
  content text not null,
  tags text[] not null default '{}',
  note_timestamp timestamptz default now(),
  created_at timestamptz default now()
);

-- Indexes
create index idx_matches_coach_id on matches(coach_id);
create index idx_matches_status on matches(status);
create index idx_notes_match_id on notes(match_id);
create index idx_players_coach_id on players(coach_id);

-- RLS
alter table coaches enable row level security;
alter table players enable row level security;
alter table matches enable row level security;
alter table notes enable row level security;

-- Coaches: can only see/edit themselves
create policy "coaches_self" on coaches
  for all using (auth.uid() = id);

-- Players: coach sees their own players
create policy "players_own" on players
  for all using (auth.uid() = coach_id);

-- Matches: coach sees their own matches
create policy "matches_own" on matches
  for all using (auth.uid() = coach_id);

-- Notes: coach sees their own notes
create policy "notes_own" on notes
  for all using (auth.uid() = coach_id);

-- Function: auto-create coach row on first login
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into coaches (id, email)
  values (new.id, new.email)
  on conflict (email) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
