-- ==========================================================
-- Scan history, dump reports and report photos for साफ़
-- Run this once in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- Safe to re-run: it only creates what is missing.
-- ==========================================================

-- ----------------------------------------------------------
-- 1. Scan history: private, each user sees only their own
-- ----------------------------------------------------------
create table if not exists public.scan_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  category text,
  model_class text,
  super_category text,
  points integer not null default 0,
  weight_kg numeric(6, 2) not null default 0,
  bin_color text,
  status text,
  emoji text,
  confidence real,
  created_at timestamptz not null default now()
);

create index if not exists scan_history_user_created_idx
  on public.scan_history (user_id, created_at desc);

alter table public.scan_history enable row level security;

drop policy if exists "Users can view their own scans" on public.scan_history;
create policy "Users can view their own scans"
  on public.scan_history for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own scans" on public.scan_history;
create policy "Users can add their own scans"
  on public.scan_history for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own scans" on public.scan_history;
create policy "Users can delete their own scans"
  on public.scan_history for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ----------------------------------------------------------
-- 2. Dump reports: everyone can see them (community map),
--    only the reporter can add, edit or delete their own
-- ----------------------------------------------------------
create table if not exists public.dump_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  waste_type text,
  severity text,
  severity_level text not null default 'critical'
    check (severity_level in ('critical', 'moderate', 'minor')),
  address text,
  latitude double precision not null,
  longitude double precision not null,
  status text not null default 'Pending Municipal Review',
  notes text,
  additional_message text,
  photo_url text,
  authority text,
  created_at timestamptz not null default now()
);

create index if not exists dump_reports_created_idx
  on public.dump_reports (created_at desc);

alter table public.dump_reports enable row level security;

drop policy if exists "Anyone can view dump reports" on public.dump_reports;
create policy "Anyone can view dump reports"
  on public.dump_reports for select to anon, authenticated
  using (true);

drop policy if exists "Users can add their own reports" on public.dump_reports;
create policy "Users can add their own reports"
  on public.dump_reports for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can edit their own reports" on public.dump_reports;
create policy "Users can edit their own reports"
  on public.dump_reports for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own reports" on public.dump_reports;
create policy "Users can delete their own reports"
  on public.dump_reports for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ----------------------------------------------------------
-- 3. Report photos: public bucket (so the map can show them),
--    users can only upload into their own folder: <user id>/<file>
-- ----------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists "Users can upload report photos to their folder" on storage.objects;
create policy "Users can upload report photos to their folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete their own report photos" on storage.objects;
create policy "Users can delete their own report photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
