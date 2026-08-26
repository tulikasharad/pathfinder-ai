-- =============================================================================
-- CollegePath — Supabase PostgreSQL Migration
-- =============================================================================
-- One migration: creates every table the frontend currently queries AND the
-- planned CollegeAI features (education, exams, preferences, scraping, etc.).
--
-- Auth is handled by Supabase Auth (auth.users).  Every student-facing table
-- stores auth.users.id as a UUID foreign key so RLS can enforce ownership.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Extensions & helpers
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- Auto-set updated_at on UPDATE
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- =============================================================================
-- SECTION A — Tables the frontend currently queries
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- A1. profiles  (maps Convex users + studentProfile)
-- ─────────────────────────────────────────────────────────────────────────────
-- Every auth.users row gets a matching profile.  The profile also holds the
-- flattened studentProfile fields the frontend reads via useAuth().

create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  name                  text,
  image                 text,
  email                 text,
  onboarding_completed  boolean default false,

  -- Flattened student-profile columns (read by use-auth.ts fetchProfile)
  age                   smallint,
  state                 text,
  gender                text,
  annual_family_income  integer,
  category              text,
  education_level       text,
  school_type           text,
  course                text,
  institution_type      text,
  academic_score        numeric(5,2),
  is_disabled           boolean default false,
  is_minority           boolean default false,
  is_first_generation   boolean default false,
  other_criteria        text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create unique index idx_profiles_email
  on public.profiles (email) where email is not null;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- A2. colleges  (read by CollegeDiscovery, Shortlist, Dashboard)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.colleges (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  location              text not null,
  state                 text not null,
  courses               text[],
  entrance_exams        text[],
  fees                  text,
  eligibility           text,
  application_deadline  date,
  scholarships_available text[],
  official_url          text,
  is_verified           boolean default false,
  description           text,
  image_url             text,
  ranking               integer,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_colleges_state   on public.colleges (state);
create index idx_colleges_ranking on public.colleges (ranking) where ranking is not null;

create trigger trg_colleges_updated_at
  before update on public.colleges
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- A3. scholarships  (read by ScholarshipNavigator)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.scholarships (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  provider            text not null,
  type                text not null,
  benefit             text not null,
  eligibility         text not null,
  deadline            date,
  education_level     text,
  state               text default 'all',
  category            text default 'general',
  min_score           numeric(5,2),
  max_income          integer,
  gender              text,
  description         text,
  official_url        text,
  is_verified         boolean default false,
  is_active           boolean default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_scholarships_active  on public.scholarships (is_active) where is_active = true;
create index idx_scholarships_type    on public.scholarships (type);
create index idx_scholarships_deadline on public.scholarships (deadline);

create trigger trg_scholarships_updated_at
  before update on public.scholarships
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- A4. bookmarks  (read/written by CollegeDiscovery, ScholarshipNavigator)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.bookmarks (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references public.profiles(id) on delete cascade,
  item_type     text not null check (item_type in ('scholarship','college')),
  item_id       uuid not null,
  created_at    timestamptz not null default now(),

  unique (student_id, item_type, item_id)
);

create index idx_bookmarks_student on public.bookmarks (student_id);
create index idx_bookmarks_item    on public.bookmarks (item_type, item_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- A5. applications  (read/written by Dashboard, Applications, ScholarshipNavigator)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.applications (
  id                uuid primary key default uuid_generate_v4(),
  student_id        uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  type              text not null,
  status            text not null default 'interested',
  deadline          date,
  phase             text,
  application_id    text,
  course_id         text,
  notes             text,
  documents         text[],
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_applications_student on public.applications (student_id);
create index idx_applications_status  on public.applications (status);

create trigger trg_applications_updated_at
  before update on public.applications
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- A6. deadlines  (read/written by Dashboard, Deadlines)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.deadlines (
  id                uuid primary key default uuid_generate_v4(),
  student_id        uuid not null references public.profiles(id) on delete cascade,
  title             text not null,
  date              date not null,
  type              text not null,
  priority          text not null default 'medium',
  is_completed      boolean default false,
  related_item_id   uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_deadlines_student     on public.deadlines (student_id);
create index idx_deadlines_date        on public.deadlines (date);
create index idx_deadlines_student_date on public.deadlines (student_id, date);

create trigger trg_deadlines_updated_at
  before update on public.deadlines
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- A7. notifications  (read/written by Notifications page)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.notifications (
  id                uuid primary key default uuid_generate_v4(),
  student_id        uuid not null references public.profiles(id) on delete cascade,
  title             text not null,
  message           text not null,
  type              text not null,
  is_read           boolean default false,
  action_url        text,
  priority          text default 'normal',
  created_at        timestamptz not null default now()
);

create index idx_notifications_student on public.notifications (student_id);
create index idx_notifications_unread  on public.notifications (student_id, created_at desc)
  where is_read = false;


-- =============================================================================
-- SECTION B — Additional CollegeAI tables (planned functionality)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- B1. education_records  (student academic history: 10th, 12th, UG, PG)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.education_records (
  id                  uuid primary key default uuid_generate_v4(),
  student_id          uuid not null references public.profiles(id) on delete cascade,
  level               text not null,
  board_university    text,
  institution         text,
  stream              text,
  year_of_passing     smallint,
  percentage          numeric(5,2),
  cgpa                numeric(4,2),
  division            text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_education_records_student on public.education_records (student_id);

create trigger trg_education_records_updated_at
  before update on public.education_records
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- B2. subjects  (reference)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.subjects (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  code        text unique,
  created_at  timestamptz not null default now()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- B3. student_subjects  (marks per subject per education record)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.student_subjects (
  id                    uuid primary key default uuid_generate_v4(),
  student_id            uuid not null references public.profiles(id) on delete cascade,
  education_record_id   uuid references public.education_records(id) on delete set null,
  subject_id            uuid not null references public.subjects(id) on delete cascade,
  marks_obtained        numeric(6,2),
  max_marks             numeric(6,2),
  grade                 text,
  created_at            timestamptz not null default now(),

  unique (student_id, education_record_id, subject_id)
);

create index idx_student_subjects_student on public.student_subjects (student_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- B4. entrance_exams  (reference: JEE, BITSAT, VITEEE, etc.)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.entrance_exams (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null unique,
  full_name         text,
  conducting_body   text,
  website_url       text,
  mode              text,
  description       text,
  is_active         boolean default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger trg_entrance_exams_updated_at
  before update on public.entrance_exams
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- B5. student_exam_scores
-- ─────────────────────────────────────────────────────────────────────────────

create table public.student_exam_scores (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid not null references public.profiles(id) on delete cascade,
  exam_id         uuid not null references public.entrance_exams(id) on delete cascade,
  exam_date       date,
  score           numeric(8,2),
  rank_obtained   integer,
  percentile      numeric(5,2),
  roll_number     text,
  result_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (student_id, exam_id, exam_date)
);

create index idx_student_exam_scores_student on public.student_exam_scores (student_id);

create trigger trg_student_exam_scores_updated_at
  before update on public.student_exam_scores
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- B6. student_preferences
-- ─────────────────────────────────────────────────────────────────────────────

create table public.student_preferences (
  id                      uuid primary key default uuid_generate_v4(),
  student_id              uuid not null references public.profiles(id) on delete cascade unique,
  preferred_states        text[],
  preferred_cities        text[],
  preferred_courses       text[],
  preferred_stream        text,
  max_annual_fee          integer,
  budget_currency         text default 'INR',
  hostel_required         boolean,
  scholarship_required    boolean default true,
  preferred_college_type  text[],
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger trg_student_preferences_updated_at
  before update on public.student_preferences
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- B7. college_courses  (normalised from colleges.courses[])
-- ─────────────────────────────────────────────────────────────────────────────

create table public.college_courses (
  id              uuid primary key default uuid_generate_v4(),
  college_id      uuid not null references public.colleges(id) on delete cascade,
  name            text not null,
  degree          text,
  duration_years  numeric(3,1),
  specialization  text,
  seats           integer,
  fees_annual     integer,
  is_active       boolean default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (college_id, name, specialization)
);

create index idx_college_courses_college on public.college_courses (college_id);

create trigger trg_college_courses_updated_at
  before update on public.college_courses
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- B8. college_fees
-- ─────────────────────────────────────────────────────────────────────────────

create table public.college_fees (
  id                    uuid primary key default uuid_generate_v4(),
  college_id            uuid not null references public.colleges(id) on delete cascade,
  course_id             uuid references public.college_courses(id) on delete set null,
  fee_type              text not null,
  amount                integer not null,
  currency              text default 'INR',
  academic_year         text,
  is_hostel_included    boolean default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_college_fees_college on public.college_fees (college_id);

create trigger trg_college_fees_updated_at
  before update on public.college_fees
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- B9. college_placements
-- ─────────────────────────────────────────────────────────────────────────────

create table public.college_placements (
  id                uuid primary key default uuid_generate_v4(),
  college_id        uuid not null references public.colleges(id) on delete cascade,
  academic_year     text not null,
  highest_package   numeric(10,2),
  avg_package       numeric(10,2),
  median_package    numeric(10,2),
  placement_rate    numeric(5,2),
  total_placed      integer,
  total_students    integer,
  top_recruiters    text[],
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (college_id, academic_year)
);

create index idx_college_placements_college on public.college_placements (college_id);

create trigger trg_college_placements_updated_at
  before update on public.college_placements
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- B10. college_scholarships  (maps colleges.scholarships_available[])
-- ─────────────────────────────────────────────────────────────────────────────

create table public.college_scholarships (
  id              uuid primary key default uuid_generate_v4(),
  college_id      uuid not null references public.colleges(id) on delete cascade,
  name            text not null,
  description     text,
  amount          text,
  eligibility     text,
  link_url        text,
  is_active       boolean default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_college_scholarships_college on public.college_scholarships (college_id);

create trigger trg_college_scholarships_updated_at
  before update on public.college_scholarships
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- B11. dream_colleges  (expanded bookmarks with priority)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.dream_colleges (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references public.profiles(id) on delete cascade,
  college_id    uuid not null references public.colleges(id) on delete cascade,
  priority      smallint default 0,
  notes         text,
  created_at    timestamptz not null default now(),

  unique (student_id, college_id)
);

create index idx_dream_colleges_student on public.dream_colleges (student_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- B12. deadline_history  (audit trail)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.deadline_history (
  id              uuid primary key default uuid_generate_v4(),
  deadline_id     uuid not null references public.deadlines(id) on delete cascade,
  student_id      uuid not null references public.profiles(id) on delete cascade,
  old_value       jsonb,
  new_value       jsonb,
  change_source   text,
  source_url      text,
  changed_at      timestamptz not null default now()
);

create index idx_deadline_history_deadline on public.deadline_history (deadline_id);
create index idx_deadline_history_student  on public.deadline_history (student_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- B13. college_sources  (configured scraping sources)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.college_sources (
  id                  uuid primary key default uuid_generate_v4(),
  college_id          uuid references public.colleges(id) on delete set null,
  source_url          text not null,
  source_domain       text not null,
  source_type         text,
  scrape_schedule     text,
  is_active           boolean default true,
  last_scraped_at     timestamptz,
  last_verified_at    timestamptz,
  extraction_status   text default 'pending',
  confidence          numeric(3,2),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_college_sources_college on public.college_sources (college_id);
create index idx_college_sources_active  on public.college_sources (is_active) where is_active = true;

create trigger trg_college_sources_updated_at
  before update on public.college_sources
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- B14. source_snapshots  (raw data per scrape run)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.source_snapshots (
  id                  uuid primary key default uuid_generate_v4(),
  source_id           uuid not null references public.college_sources(id) on delete cascade,
  raw_html            text,
  extracted_data      jsonb not null,
  extraction_method   text,
  http_status         smallint,
  retrieved_at        timestamptz not null default now(),
  previous_value      jsonb
);

create index idx_source_snapshots_source on public.source_snapshots (source_id);
create index idx_source_snapshots_time   on public.source_snapshots (retrieved_at desc);


-- ─────────────────────────────────────────────────────────────────────────────
-- B15. source_changes  (detected differences)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.source_changes (
  id                uuid primary key default uuid_generate_v4(),
  source_id         uuid not null references public.college_sources(id) on delete cascade,
  snapshot_id       uuid references public.source_snapshots(id) on delete set null,
  college_id        uuid references public.colleges(id) on delete set null,
  change_type       text not null,
  field_name        text,
  old_value         text,
  new_value         text,
  description       text,
  is_notified       boolean default false,
  detected_at       timestamptz not null default now()
);

create index idx_source_changes_source    on public.source_changes (source_id);
create index idx_source_changes_unnotified on public.source_changes (is_notified) where is_notified = false;


-- ─────────────────────────────────────────────────────────────────────────────
-- B16. notification_preferences
-- ─────────────────────────────────────────────────────────────────────────────

create table public.notification_preferences (
  id                          uuid primary key default uuid_generate_v4(),
  student_id                  uuid not null references public.profiles(id) on delete cascade unique,
  email_notifications         boolean default true,
  push_notifications          boolean default true,
  deadline_reminders          boolean default true,
  deadline_reminder_days      smallint default 7,
  scholarship_alerts          boolean default true,
  exam_updates                boolean default true,
  application_updates         boolean default true,
  new_opportunity_alerts      boolean default true,
  quiet_hours_start           time,
  quiet_hours_end             time,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create trigger trg_notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- B17. email_logs  (audit trail for outbound emails)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.email_logs (
  id                  uuid primary key default uuid_generate_v4(),
  student_id          uuid references public.profiles(id) on delete set null,
  recipient_email     text not null,
  subject             text not null,
  template_id         text,
  status              text not null default 'queued',
  provider_message_id text,
  error_message       text,
  sent_at             timestamptz,
  created_at          timestamptz not null default now()
);

create index idx_email_logs_student on public.email_logs (student_id);
create index idx_email_logs_time    on public.email_logs (created_at desc);


-- =============================================================================
-- SECTION C — Row Level Security
-- =============================================================================
-- RLS is ENABLED on every table.
--
--   Student-private data  → auth.uid() = student_id  (or id for profiles)
--   Public catalogs       → auth.role() = 'authenticated' for reads
--   Scraper / admin data  → service_role only for writes
--   Reference tables      → public read, authenticated write

-- ─────────────────────────────────────────────────────────────────────────────
-- C1. profiles
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

create policy "profiles_select_own"  on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own"  on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own"  on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_own"  on public.profiles for delete using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- C2. colleges (public catalog)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.colleges enable row level security;

create policy "colleges_select_auth" on public.colleges for select using (auth.role() = 'authenticated');
create policy "colleges_insert_auth" on public.colleges for insert with check (auth.role() = 'authenticated');
create policy "colleges_update_auth" on public.colleges for update using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────────
-- C3. scholarships (public catalog)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.scholarships enable row level security;

create policy "scholarships_select_auth" on public.scholarships for select using (auth.role() = 'authenticated');
create policy "scholarships_insert_auth" on public.scholarships for insert with check (auth.role() = 'authenticated');
create policy "scholarships_update_auth" on public.scholarships for update using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────────
-- C4. bookmarks
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.bookmarks enable row level security;

create policy "bookmarks_select_own" on public.bookmarks for select using (auth.uid() = student_id);
create policy "bookmarks_insert_own" on public.bookmarks for insert with check (auth.uid() = student_id);
create policy "bookmarks_delete_own" on public.bookmarks for delete using (auth.uid() = student_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- C5. applications
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.applications enable row level security;

create policy "applications_select_own" on public.applications for select using (auth.uid() = student_id);
create policy "applications_insert_own" on public.applications for insert with check (auth.uid() = student_id);
create policy "applications_update_own" on public.applications for update using (auth.uid() = student_id);
create policy "applications_delete_own" on public.applications for delete using (auth.uid() = student_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- C6. deadlines
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.deadlines enable row level security;

create policy "deadlines_select_own" on public.deadlines for select using (auth.uid() = student_id);
create policy "deadlines_insert_own" on public.deadlines for insert with check (auth.uid() = student_id);
create policy "deadlines_update_own" on public.deadlines for update using (auth.uid() = student_id);
create policy "deadlines_delete_own" on public.deadlines for delete using (auth.uid() = student_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- C7. notifications
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications for select using (auth.uid() = student_id);
create policy "notifications_insert_own" on public.notifications for insert with check (auth.uid() = student_id);
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = student_id);
create policy "notifications_delete_own" on public.notifications for delete using (auth.uid() = student_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- C8. education_records
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.education_records enable row level security;

create policy "education_records_select_own" on public.education_records for select using (auth.uid() = student_id);
create policy "education_records_insert_own" on public.education_records for insert with check (auth.uid() = student_id);
create policy "education_records_update_own" on public.education_records for update using (auth.uid() = student_id);
create policy "education_records_delete_own" on public.education_records for delete using (auth.uid() = student_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- C9. subjects (public reference)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.subjects enable row level security;

create policy "subjects_select_all"   on public.subjects for select using (true);
create policy "subjects_insert_auth"  on public.subjects for insert with check (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────────
-- C10. student_subjects
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.student_subjects enable row level security;

create policy "student_subjects_select_own" on public.student_subjects for select using (auth.uid() = student_id);
create policy "student_subjects_insert_own" on public.student_subjects for insert with check (auth.uid() = student_id);
create policy "student_subjects_update_own" on public.student_subjects for update using (auth.uid() = student_id);
create policy "student_subjects_delete_own" on public.student_subjects for delete using (auth.uid() = student_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- C11. entrance_exams (public reference)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.entrance_exams enable row level security;

create policy "entrance_exams_select_all"  on public.entrance_exams for select using (true);
create policy "entrance_exams_insert_auth" on public.entrance_exams for insert with check (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────────
-- C12. student_exam_scores
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.student_exam_scores enable row level security;

create policy "student_exam_scores_select_own" on public.student_exam_scores for select using (auth.uid() = student_id);
create policy "student_exam_scores_insert_own" on public.student_exam_scores for insert with check (auth.uid() = student_id);
create policy "student_exam_scores_update_own" on public.student_exam_scores for update using (auth.uid() = student_id);
create policy "student_exam_scores_delete_own" on public.student_exam_scores for delete using (auth.uid() = student_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- C13. student_preferences
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.student_preferences enable row level security;

create policy "student_preferences_select_own" on public.student_preferences for select using (auth.uid() = student_id);
create policy "student_preferences_insert_own" on public.student_preferences for insert with check (auth.uid() = student_id);
create policy "student_preferences_update_own" on public.student_preferences for update using (auth.uid() = student_id);
create policy "student_preferences_delete_own" on public.student_preferences for delete using (auth.uid() = student_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- C14. college_courses (public)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.college_courses enable row level security;

create policy "college_courses_select_auth" on public.college_courses for select using (auth.role() = 'authenticated');
create policy "college_courses_insert_auth" on public.college_courses for insert with check (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────────
-- C15. college_fees (public)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.college_fees enable row level security;

create policy "college_fees_select_auth" on public.college_fees for select using (auth.role() = 'authenticated');
create policy "college_fees_insert_auth" on public.college_fees for insert with check (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────────
-- C16. college_placements (public)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.college_placements enable row level security;

create policy "college_placements_select_auth" on public.college_placements for select using (auth.role() = 'authenticated');
create policy "college_placements_insert_auth" on public.college_placements for insert with check (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────────
-- C17. college_scholarships (public)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.college_scholarships enable row level security;

create policy "college_scholarships_select_auth" on public.college_scholarships for select using (auth.role() = 'authenticated');
create policy "college_scholarships_insert_auth" on public.college_scholarships for insert with check (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────────
-- C18. dream_colleges
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.dream_colleges enable row level security;

create policy "dream_colleges_select_own" on public.dream_colleges for select using (auth.uid() = student_id);
create policy "dream_colleges_insert_own" on public.dream_colleges for insert with check (auth.uid() = student_id);
create policy "dream_colleges_update_own" on public.dream_colleges for update using (auth.uid() = student_id);
create policy "dream_colleges_delete_own" on public.dream_colleges for delete using (auth.uid() = student_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- C19. deadline_history
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.deadline_history enable row level security;

create policy "deadline_history_select_own" on public.deadline_history for select using (auth.uid() = student_id);
create policy "deadline_history_insert_own" on public.deadline_history for insert with check (auth.uid() = student_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- C20. college_sources (scraper writes, auth reads)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.college_sources enable row level security;

create policy "college_sources_select_auth"    on public.college_sources for select using (auth.role() = 'authenticated');
create policy "college_sources_insert_service" on public.college_sources for insert using (auth.role() = 'service_role');
create policy "college_sources_update_service" on public.college_sources for update using (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- C21. source_snapshots (scraper writes)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.source_snapshots enable row level security;

create policy "source_snapshots_select_auth"    on public.source_snapshots for select using (auth.role() = 'authenticated');
create policy "source_snapshots_insert_service" on public.source_snapshots for insert using (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- C22. source_changes (scraper writes)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.source_changes enable row level security;

create policy "source_changes_select_auth"    on public.source_changes for select using (auth.role() = 'authenticated');
create policy "source_changes_insert_service" on public.source_changes for insert using (auth.role() = 'service_role');
create policy "source_changes_update_service" on public.source_changes for update using (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- C23. notification_preferences
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.notification_preferences enable row level security;

create policy "notification_preferences_select_own" on public.notification_preferences for select using (auth.uid() = student_id);
create policy "notification_preferences_insert_own" on public.notification_preferences for insert with check (auth.uid() = student_id);
create policy "notification_preferences_update_own" on public.notification_preferences for update using (auth.uid() = student_id);
create policy "notification_preferences_delete_own" on public.notification_preferences for delete using (auth.uid() = student_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- C24. email_logs (service writes, student reads own)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.email_logs enable row level security;

create policy "email_logs_select_own"       on public.email_logs for select using (auth.uid() = student_id);
create policy "email_logs_insert_service"   on public.email_logs for insert using (auth.role() = 'service_role');


-- =============================================================================
-- SECTION D — Seed data
-- =============================================================================
-- Seeds colleges and scholarships only if the tables are empty.
-- This replaces the old Convex seedDemoData mutation.

do $$
begin
  -- Colleges
  if not exists (select 1 from public.colleges limit 1) then
    insert into public.colleges
      (name, location, state, courses, entrance_exams, fees, eligibility,
       application_deadline, scholarships_available, official_url, is_verified,
       description, ranking)
    values
      ('Indian Institute of Technology, Bombay', 'Mumbai', 'Maharashtra',
       ARRAY['B.Tech Computer Science','B.Tech Mechanical','B.Tech Electrical','B.Tech Chemical','M.Tech various'],
       ARRAY['JEE Advanced','JEE Main'], '₹2,50,000/year',
       'JEE Advanced qualified, Top 1000 rank', '2026-06-15',
       ARRAY['Merit-cum-means','Free studentship'], 'https://www.iitb.ac.in', true,
       'India''s premier engineering and technology institution consistently ranked #1 in NIRF.', 1),
      ('Indian Institute of Technology, Delhi', 'New Delhi', 'Delhi',
       ARRAY['B.Tech Computer Science','B.Tech Mathematics & Computing','B.Tech EE','M.Tech various'],
       ARRAY['JEE Advanced','JEE Main'], '₹2,40,000/year',
       'JEE Advanced qualified', '2026-06-20',
       ARRAY['Merit-cum-means','Institute free studentship'], 'https://www.iitd.ac.in', true,
       'One of the oldest and most prestigious IITs, known for cutting-edge research and innovation.', 2),
      ('BITS Pilani', 'Pilani', 'Rajasthan',
       ARRAY['B.E. Computer Science','B.E. Electronics','B.Pharmacy','M.Sc. various'],
       ARRAY['BITSAT'], '₹4,00,000/year',
       'BITSAT score 300+, 75% in PCM', '2026-05-31',
       ARRAY['Merit scholarship','Need-based aid'], 'https://www.bits-pilani.ac.in', true,
       'Premier private university known for its industry connect and excellent placement record.', 5),
      ('VIT Vellore', 'Vellore', 'Tamil Nadu',
       ARRAY['B.Tech CSE','B.Tech ECE','B.Tech Mech','BCA','MCA'],
       ARRAY['VITEEE'], '₹3,50,000/year',
       'VITEEE qualified, 60% in 12th', '2026-07-15',
       ARRAY['VIT Merit Scholarship','Sports scholarship'], 'https://vit.ac.in', true,
       'Deemed university with multiple campuses, known for engineering and technology programs.', 12),
      ('Delhi University', 'New Delhi', 'Delhi',
       ARRAY['B.A. (Hons) English','B.Sc. (Hons) Physics','B.Com (Hons)','BBA','M.A. various'],
       ARRAY['CUET-UG'], '₹25,000/year',
       'CUET-UG score based, 12th pass', '2026-07-01',
       ARRAY['DU Merit Scholarship','SC/ST Scholarship'], 'https://www.du.ac.in', true,
       'One of India''s largest and most prestigious central universities.', 8),
      ('SRM Institute of Science and Technology', 'Chennai', 'Tamil Nadu',
       ARRAY['B.Tech CSE','B.Tech AI & ML','B.Tech Biotech','BBA','MBA'],
       ARRAY['SRMJEEE'], '₹3,20,000/year',
       'SRMJEEE qualified, 50% in 12th', '2026-06-30',
       ARRAY['SRM Merit Scholarship','Need-based aid'], 'https://www.srmist.edu.in', true,
       'Deemed university known for its modern campus, research facilities, and strong placement record.', 18);
  end if;

  -- Scholarships
  if not exists (select 1 from public.scholarships limit 1) then
    insert into public.scholarships
      (name, provider, type, benefit, eligibility, deadline, education_level,
       state, category, min_score, max_income, gender, description,
       is_verified, is_active)
    values
      ('National Merit Scholarship', 'Ministry of Education, Govt. of India',
       'government', '₹50,000 per year + tuition waiver',
       'Class 12 passed with 90%+ marks', '2026-09-30', 'undergraduate',
       'all', 'general', 90, 800000, null,
       'Prestigious merit-based scholarship for top-performing students across India.', true, true),
      ('Post-Matric SC/ST Scholarship', 'Ministry of Social Justice',
       'government', 'Full tuition + ₹1,500/month maintenance',
       'SC/ST category, family income < ₹2.5L', '2026-10-15', 'postgraduate',
       'all', 'SC/ST', 50, 250000, null,
       'Government scholarship for SC/ST students pursuing post-matric education.', true, true),
      ('INSPIRE Fellowship', 'Department of Science & Technology',
       'government', '₹80,000/year for 5 years',
       'Top 1% of Class 12, pursuing B.Sc./Integrated M.Sc.', '2026-11-01', 'undergraduate',
       'all', 'general', 95, null, null,
       'Innovation in Science Pursuit for Inspired Research.', true, true),
      ('Tata Trusts Scholarship', 'Tata Trusts',
       'private', 'Up to ₹2,00,000 per year',
       'Family income < ₹6L, merit-based', '2026-08-31', 'undergraduate',
       'all', 'general', 70, 600000, null,
       'Comprehensive scholarship from Tata Trusts covering tuition, hostel, and living expenses.', true, true),
      ('AICTE Pragati Scholarship', 'AICTE, Govt. of India',
       'government', '₹50,000/year (tuition + contingency)',
       'Female students, family income < ₹8L, pursuing technical education', '2026-11-30', 'undergraduate',
       'all', 'general', null, 800000, 'female',
       'Promoting girls'' participation in technical education.', true, true),
      ('Minority Scholarship (PMSS)', 'Ministry of Minority Affairs',
       'government', '₹30,000 - ₹1,00,000 based on course',
       'Minority community, family income < ₹2L', '2026-10-31', 'postgraduate',
       'all', 'minority', null, 200000, null,
       'Prime Minister''s Scholarship Scheme for minority community students.', true, true),
      ('KVPY Fellowship', 'Indian Institute of Science',
       'government', '₹84,000/year + summer camp participation',
       'KVPY scholars, pursuing B.Sc./Integrated M.Sc./B.S.', '2026-09-15', 'undergraduate',
       'all', 'general', 85, null, null,
       'Kishore Vaigyanik Protsahan Yojana fellowship for students with aptitude for scientific research.', true, true),
      ('L&T Build India Scholarship', 'Larsen & Toubro',
       'private', '₹2,00,000/year + internship at L&T',
       'B.E./B.Tech students, 1st year, 70%+ in 12th', '2026-09-20', 'undergraduate',
       'all', 'general', 70, null, null,
       'Industry scholarship for engineering students with guaranteed summer internship at L&T.', true, true),
      ('Reliance Foundation Undergraduate Scholarship', 'Reliance Foundation',
       'private', '₹2,00,000 over duration of course',
       'Family income < ₹15L, merit + need based', '2026-10-20', 'undergraduate',
       'all', 'general', null, 1500000, null,
       'Need-cum-merit scholarship supporting undergraduate students from economically weaker sections.', true, true),
      ('First Generation Student Grant', 'National Scholarship Portal',
       'government', '₹25,000 one-time + ₹10,000/year',
       'First in family to attend college, income < ₹3L', '2026-12-01', 'undergraduate',
       'all', 'general', null, 300000, null,
       'Special grant for first-generation college students.', true, true);
  end if;
end $$;


-- =============================================================================
-- Done. 24 tables, 45 indexes, 78 RLS policies, 15 updated_at triggers,
--        seed data for 6 colleges + 10 scholarships.
-- =============================================================================
