-- SAT Platform Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Users ────────────────────────────────────────────────────────
create table if not exists users (
  id          uuid primary key default uuid_generate_v4(),
  auth_id     uuid unique not null,
  email       text unique not null,
  full_name   text not null,
  role        text not null check (role in ('admin', 'student')),
  status      text not null default 'active' check (status in ('active', 'inactive')),
  tier        int  check (tier between 1 and 4),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Courses ──────────────────────────────────────────────────────
create table if not exists courses (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  created_at  timestamptz default now()
);

-- ── Enrollments ──────────────────────────────────────────────────
create table if not exists enrollments (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references users(id) on delete cascade,
  course_id   uuid references courses(id) on delete cascade,
  expires_at  timestamptz,
  created_at  timestamptz default now(),
  unique(user_id, course_id)
);

-- ── Questions ────────────────────────────────────────────────────
create table if not exists questions (
  id             uuid primary key default uuid_generate_v4(),
  domain         text not null check (domain in ('Math', 'Reading & Writing')),
  skill          text not null,
  difficulty     text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  source         text,
  content        text not null,
  option_a       text not null,
  option_b       text not null,
  option_c       text not null,
  option_d       text not null,
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D')),
  explanation    text,
  image_url      text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ── Assignments ──────────────────────────────────────────────────
create table if not exists assignments (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  course_id   uuid references courses(id) on delete set null,
  due_date    timestamptz,
  created_at  timestamptz default now()
);

-- ── Assignment Questions ──────────────────────────────────────────
create table if not exists assignment_questions (
  id            uuid primary key default uuid_generate_v4(),
  assignment_id uuid references assignments(id) on delete cascade,
  question_id   uuid references questions(id) on delete cascade,
  position      int not null default 0,
  unique(assignment_id, question_id)
);

-- ── Sessions (student attempt) ───────────────────────────────────
create table if not exists sessions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references users(id) on delete cascade,
  assignment_id   uuid references assignments(id) on delete cascade,
  started_at      timestamptz default now(),
  finished_at     timestamptz,
  score           numeric,
  total_questions int default 0,
  correct_count   int default 0
);

-- ── Answers ──────────────────────────────────────────────────────
create table if not exists answers (
  id            uuid primary key default uuid_generate_v4(),
  session_id    uuid references sessions(id) on delete cascade,
  question_id   uuid references questions(id) on delete cascade,
  chosen_answer text check (chosen_answer in ('A', 'B', 'C', 'D')),
  is_correct    boolean,
  time_spent_s  int,
  created_at    timestamptz default now()
);

-- ── Diagnostic Results ───────────────────────────────────────────
create table if not exists diagnostic_results (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references users(id) on delete cascade,
  tier       int check (tier between 1 and 4),
  math_score numeric,
  rw_score   numeric,
  created_at timestamptz default now()
);

-- ── Error Logs ───────────────────────────────────────────────────
create table if not exists error_logs (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references users(id) on delete set null,
  message    text,
  context    jsonb,
  created_at timestamptz default now()
);

-- ── Attendances ──────────────────────────────────────────────────
create table if not exists attendances (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references users(id) on delete cascade,
  checked_in_at timestamptz default now()
);

-- ── Helper functions ──────────────────────────────────────────────
create or replace function get_my_role()
returns text language sql stable security definer as $$
  select role from users where auth_id = auth.uid()
$$;

create or replace function get_my_user_id()
returns uuid language sql stable security definer as $$
  select id from users where auth_id = auth.uid()
$$;

-- ── RLS Policies ──────────────────────────────────────────────────
alter table users            enable row level security;
alter table courses          enable row level security;
alter table enrollments      enable row level security;
alter table questions        enable row level security;
alter table assignments      enable row level security;
alter table assignment_questions enable row level security;
alter table sessions         enable row level security;
alter table answers          enable row level security;
alter table diagnostic_results enable row level security;
alter table error_logs       enable row level security;
alter table attendances      enable row level security;

-- Users: admin sees all, student sees own
create policy "admin_all_users"    on users for all using (get_my_role() = 'admin');
create policy "student_own_user"   on users for select using (auth_id = auth.uid());

-- Courses: everyone can read
create policy "all_read_courses"   on courses for select using (true);
create policy "admin_write_courses" on courses for all using (get_my_role() = 'admin');

-- Enrollments: admin all, student own
create policy "admin_all_enrollments"   on enrollments for all using (get_my_role() = 'admin');
create policy "student_own_enrollments" on enrollments for select using (user_id = get_my_user_id());

-- Questions: admin all, student can read
create policy "admin_all_questions"   on questions for all using (get_my_role() = 'admin');
create policy "student_read_questions" on questions for select using (get_my_role() = 'student');

-- Assignments: admin all, student read
create policy "admin_all_assignments"   on assignments for all using (get_my_role() = 'admin');
create policy "student_read_assignments" on assignments for select using (get_my_role() = 'student');

-- Assignment questions: admin all, student read
create policy "admin_all_aq"   on assignment_questions for all using (get_my_role() = 'admin');
create policy "student_read_aq" on assignment_questions for select using (get_my_role() = 'student');

-- Sessions: admin all, student own
create policy "admin_all_sessions"   on sessions for all using (get_my_role() = 'admin');
create policy "student_own_sessions" on sessions for all using (user_id = get_my_user_id());

-- Answers: admin all, student own
create policy "admin_all_answers"   on answers for all using (get_my_role() = 'admin');
create policy "student_own_answers" on answers for all using (
  session_id in (select id from sessions where user_id = get_my_user_id())
);

-- Diagnostic results: admin all, student own
create policy "admin_all_diag"   on diagnostic_results for all using (get_my_role() = 'admin');
create policy "student_own_diag" on diagnostic_results for select using (user_id = get_my_user_id());

-- Default course (optional starter data)
insert into courses (name, description)
values ('SAT 2025', 'Khóa luyện thi SAT 2025')
on conflict do nothing;
