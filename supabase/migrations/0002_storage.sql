-- Storage bucket for uploaded course materials (PDFs). Pasted-text materials
-- have no file and leave storage_path null.
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do nothing;

-- Objects are stored under `${user_id}/${material_id}/${filename}` so a
-- simple path-prefix check enforces per-user isolation.
create policy "materials_storage_select_own" on storage.objects
  for select using (
    bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "materials_storage_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "materials_storage_delete_own" on storage.objects
  for delete using (
    bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text
  );
