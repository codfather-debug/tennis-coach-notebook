-- ============================================================
-- Security fix: tighten RLS policies
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Lock down allowed_coaches
--    Only the service role (backend) should touch this table.
--    No authenticated user should be able to read or write it.
alter table allowed_coaches enable row level security;

drop policy if exists "allowed_coaches_read" on allowed_coaches;
-- No policies = no access for anon/authenticated roles.
-- The trigger (handle_new_user) runs as security definer so it still works.


-- 2. Fix notes policy: verify match belongs to the inserting coach
drop policy if exists "notes_own" on notes;

create policy "notes_select" on notes
  for select using (auth.uid() = coach_id);

create policy "notes_insert" on notes
  for insert with check (
    auth.uid() = coach_id
    and exists (
      select 1 from matches
      where matches.id = match_id
        and matches.coach_id = auth.uid()
    )
  );

create policy "notes_update" on notes
  for update using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

create policy "notes_delete" on notes
  for delete using (auth.uid() = coach_id);


-- 3. Fix matches policy: explicit WITH CHECK so inserts
--    cannot spoof a different coach_id
drop policy if exists "matches_own" on matches;

create policy "matches_select" on matches
  for select using (auth.uid() = coach_id);

create policy "matches_insert" on matches
  for insert with check (auth.uid() = coach_id);

create policy "matches_update" on matches
  for update using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

create policy "matches_delete" on matches
  for delete using (auth.uid() = coach_id);


-- 4. Same explicit split for players (good practice)
drop policy if exists "players_own" on players;

create policy "players_select" on players
  for select using (auth.uid() = coach_id);

create policy "players_insert" on players
  for insert with check (auth.uid() = coach_id);

create policy "players_update" on players
  for update using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

create policy "players_delete" on players
  for delete using (auth.uid() = coach_id);


-- 5. Same for meets
drop policy if exists "coaches manage own meets" on meets;

create policy "meets_select" on meets
  for select using (auth.uid() = coach_id);

create policy "meets_insert" on meets
  for insert with check (auth.uid() = coach_id);

create policy "meets_update" on meets
  for update using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

create policy "meets_delete" on meets
  for delete using (auth.uid() = coach_id);
