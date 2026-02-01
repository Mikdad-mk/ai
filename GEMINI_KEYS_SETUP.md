# Gemini API Keys Setup Guide

To enable the multi-key management feature for the Gemini AI integration, you must run the following SQL commands in your Supabase project.

## Instructions

1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project.
3.  Navigate to the **SQL Editor** (formatted as a terminal icon on the left sidebar).
4.  Click **New Query**.
5.  Paste the SQL code below into the editor.
6.  Click **Run**.

## SQL Commands

```sql
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

-- Enable Row Level Security (RLS)
alter table gemini_api_keys enable row level security;

-- Policy: Admins can view keys
create policy "Admins can view keys" on gemini_api_keys
  for select
  using (
    auth.uid() in (select id from user_profiles where role = 'admin')
  );

-- Policy: Admins can insert keys
create policy "Admins can insert keys" on gemini_api_keys
  for insert
  with check (
    auth.uid() in (select id from user_profiles where role = 'admin')
  );

-- Policy: Admins can update keys
create policy "Admins can update keys" on gemini_api_keys
  for update
  using (
    auth.uid() in (select id from user_profiles where role = 'admin')
  );

-- Policy: Admins can delete keys
create policy "Admins can delete keys" on gemini_api_keys
  for delete
  using (
    auth.uid() in (select id from user_profiles where role = 'admin')
  );
```

### Verification

After running the commands, you can verify the setup:

1.  Log in to your application as an Admin.
2.  Navigate to `/admin`.
3.  Go to **System Settings** -> **Integrations** (or directly to `/admin/settings/gemini`).
4.  You should see the API Keys management interface.
