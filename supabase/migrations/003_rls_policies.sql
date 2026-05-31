alter table public.user_profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.tasks enable row level security;
alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;
alter table public.study_session_logs enable row level security;
alter table public.user_badges enable row level security;
alter table public.vault_folders enable row level security;
alter table public.vault_files enable row level security;

drop policy if exists "Users own their profile" on public.user_profiles;
create policy "Users own their profile" on public.user_profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Users own their data" on public.subjects;
create policy "Users own their data" on public.subjects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users own their data" on public.tasks;
create policy "Users own their data" on public.tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users own their data" on public.flashcard_decks;
create policy "Users own their data" on public.flashcard_decks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users own their data" on public.flashcards;
create policy "Users own their data" on public.flashcards
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users own their data" on public.study_session_logs;
create policy "Users own their data" on public.study_session_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users own their data" on public.user_badges;
create policy "Users own their data" on public.user_badges
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users own their data" on public.vault_folders;
create policy "Users own their data" on public.vault_folders
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users own their data" on public.vault_files;
create policy "Users own their data" on public.vault_files
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Vault file owners can read" on storage.objects;
create policy "Vault file owners can read" on storage.objects
  for select using (bucket_id = 'vault-files' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "Vault file owners can write" on storage.objects;
create policy "Vault file owners can write" on storage.objects
  for insert with check (bucket_id = 'vault-files' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "Vault file owners can delete" on storage.objects;
create policy "Vault file owners can delete" on storage.objects
  for delete using (bucket_id = 'vault-files' and split_part(name, '/', 1) = auth.uid()::text);
