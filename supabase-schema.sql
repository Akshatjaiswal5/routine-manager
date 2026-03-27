-- Care Pal Schema
-- Run this in your Supabase SQL editor

create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '✨',
  color text not null default '#4ade80',
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules(id) on delete cascade,
  name text not null,
  task_type text not null check (task_type in ('daily', 'scheduled')),
  slot text check (slot in ('morning', 'night', 'both')),         -- for daily tasks
  interval_days int,                                               -- for scheduled tasks
  next_due_date date,                                              -- for scheduled tasks
  is_reschedulable boolean not null default false,
  deadline_time time,                                              -- optional notification deadline
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create table if not exists task_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  date date not null,
  status text not null check (status in ('done', 'skipped', 'postponed')),
  note text,
  created_at timestamptz default now(),
  unique(task_id, date)
);

-- Disable RLS (open access, personal app)
alter table modules disable row level security;
alter table tasks disable row level security;
alter table task_logs disable row level security;
