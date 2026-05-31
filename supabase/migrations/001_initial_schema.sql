create extension if not exists "pgcrypto";

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  streak integer default 0,
  total_focus_minutes integer default 0,
  sessions_count integer default 0,
  daily_goal_minutes integer default 25,
  buddy_points integer default 250,
  buddy_species text default 'fox',
  alarm_tone text default 'singing-bowl',
  sound_volume integer default 75,
  notifications_enabled boolean default true,
  subscription_plan text default 'free' check (subscription_plan in ('free', 'pro', 'guru')),
  subscription_expires_at timestamptz,
  push_subscription jsonb,
  created_at timestamptz default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  accent_color text not null,
  icon_name text not null,
  created_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  title text not null,
  completed boolean default false,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  created_at timestamptz default now()
);

create table if not exists public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  question text not null,
  answer text not null,
  difficulty_rating text check (difficulty_rating in ('easy', 'medium', 'hard')),
  created_at timestamptz default now()
);

create table if not exists public.study_session_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  duration_minutes integer not null,
  mode text not null,
  completed boolean default false,
  focus_score integer default 100,
  timestamp timestamptz default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null,
  title text not null,
  description text not null,
  icon_name text not null,
  criteria text not null,
  unlocked boolean default false,
  unlocked_at timestamptz,
  unique(user_id, badge_key)
);

create table if not exists public.vault_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz default now()
);

create table if not exists public.vault_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.vault_folders(id) on delete cascade,
  name text not null,
  type text not null check (type in ('pdf', 'doc', 'image', 'code', 'zip')),
  size text not null,
  storage_path text,
  url text,
  text_content text,
  created_at timestamptz default now()
);

insert into storage.buckets (id, name, public)
values ('vault-files', 'vault-files', true)
on conflict (id) do nothing;

create or replace function public.seed_focus_buddy_defaults()
returns trigger
language plpgsql
security definer
as $$
declare
  s_math uuid;
  s_cs uuid;
  s_design uuid;
  s_writing uuid;
  s_general uuid;
begin
  insert into public.user_profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;

  insert into public.subjects (user_id, name, color, accent_color, icon_name) values
    (new.id, 'Advanced Calculus', 'bg-[#E9EDC9] border-[#5A5A40]/10 text-[#5A5A40]', '#5A5A40', 'Percent')
    returning id into s_math;
  insert into public.subjects (user_id, name, color, accent_color, icon_name) values
    (new.id, 'Computer Architecture', 'bg-[#CCD5AE]/20 border-[#CCD5AE]/50 text-[#4A4A3A]', '#4A4A3A', 'Cpu')
    returning id into s_cs;
  insert into public.subjects (user_id, name, color, accent_color, icon_name) values
    (new.id, 'Interface Design & UX', 'bg-[#F2E9E1] border-[#D4A373]/30 text-[#B87D4B]', '#D4A373', 'LayoutGrid')
    returning id into s_design;
  insert into public.subjects (user_id, name, color, accent_color, icon_name) values
    (new.id, 'Academic Writing & Literature', 'bg-[#FEFAE0] border-[#E9EDC9] text-[#7E7E63]', '#7E7E63', 'PenTool')
    returning id into s_writing;
  insert into public.subjects (user_id, name, color, accent_color, icon_name) values
    (new.id, 'Autonomous Study', 'bg-[#FDFCFB] border-brand-soft-border/80 text-brand-muted', '#5A5A40', 'Bookmark')
    returning id into s_general;

  insert into public.tasks (user_id, subject_id, title, completed, priority, due_date) values
    (new.id, s_math, 'Solve double integration exercise set 4B', false, 'high', current_date + interval '1 day'),
    (new.id, s_cs, 'Implement bitwise operations module in Rust/C', true, 'medium', current_date),
    (new.id, s_design, 'Prototype wireframes for Focus Mode dashboard layout', false, 'high', current_date + interval '2 day'),
    (new.id, s_general, 'Read section 2.3 on Spaced Repetition benefits', false, 'low', current_date + interval '3 day'),
    (new.id, s_writing, 'Draft thesis outline and review bibliography guidelines', false, 'medium', current_date + interval '4 day');

  insert into public.vault_folders (user_id, name, color) values
    (new.id, 'Mid-Term Projects', 'indigo'),
    (new.id, 'Study Notes & Revision Sheets', 'emerald'),
    (new.id, 'CSE-201 Coding Labs', 'amber');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_focus_buddy on auth.users;
create trigger on_auth_user_created_focus_buddy
after insert on auth.users
for each row execute function public.seed_focus_buddy_defaults();
