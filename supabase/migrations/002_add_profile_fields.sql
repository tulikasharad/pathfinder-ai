-- Add missing profile columns needed by the Profile edit form.
-- These columns are used by the frontend but were not in the initial migration.

alter table public.profiles
  add column if not exists city                  text,
  add column if not exists specialization       text,
  add column if not exists hostel_required      boolean,
  add column if not exists scholarship_required boolean default true;
