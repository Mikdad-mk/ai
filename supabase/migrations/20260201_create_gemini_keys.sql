-- Create table for storing Gemini API keys
create table if not exists gemini_api_keys (
  id uuid default gen_random_uuid() primary key,
  key_value text not null unique,
  label text,
  is_active boolean default true,
  is_primary boolean default false,
  error_count int default 0,
  last_used_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
alter table gemini_api_keys enable row level security;

-- Policy: Admin read/write
create policy "Admins can view keys" on gemini_api_keys
  for select
  using (
    auth.uid() in (select id from user_profiles where role = 'admin')
  );

create policy "Admins can insert keys" on gemini_api_keys
  for insert
  with check (
    auth.uid() in (select id from user_profiles where role = 'admin')
  );

create policy "Admins can update keys" on gemini_api_keys
  for update
  using (
    auth.uid() in (select id from user_profiles where role = 'admin')
  );

create policy "Admins can delete keys" on gemini_api_keys
  for delete
  using (
    auth.uid() in (select id from user_profiles where role = 'admin')
  );

-- Policy for Service Role (Backend API) to read keys
-- Note: Service role bypasses RLS, but if logic uses anon client, we might need a public read policy if we wanted to expose it (which we DON'T). 
-- Secure backend code (route handlers) use service role key usually, which bypasses RLS.
