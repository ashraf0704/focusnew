create or replace function public.seed_focus_buddy_badges()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_badges (user_id, badge_key, title, description, icon_name, criteria, unlocked, unlocked_at) values
    (new.id, 'badge-1', 'First Step Clear', 'Complete one Focus session or standard task.', 'Compass', 'sessions:1', false, null),
    (new.id, 'badge-2', 'Streak Starter', 'Keep study consistency for at least 2 days.', 'Flame', 'streak:2', false, null),
    (new.id, 'badge-3', 'Focus Pioneer', 'Accumulate 50 minutes of deep study focus.', 'Zap', 'minutes:50', false, null),
    (new.id, 'badge-4', 'Deck Scholar', 'Perfect score on any active flashcard deck quiz.', 'CheckCircle2', 'quiz:perfect', false, null),
    (new.id, 'badge-5', 'Breathing Artisan', 'Open and follow a full visual breathing guide loop.', 'Wind', 'breathing:1', false, null)
  on conflict (user_id, badge_key) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_focus_buddy_badges on auth.users;
create trigger on_auth_user_created_focus_buddy_badges
after insert on auth.users
for each row execute function public.seed_focus_buddy_badges();
