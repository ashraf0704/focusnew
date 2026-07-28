-- Add role column to user_profiles table
alter table public.user_profiles 
  add column if not exists role text default 'user' check (role in ('admin', 'user'));

-- Default any designated admin email or first account to admin if needed
update public.user_profiles 
  set role = 'admin' 
  where lower(email) = lower(coalesce(current_setting('app.admin_email', true), 'admin@focusbuddy.local'));
