-- Create user profiles table linked to Supabase auth
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  initials text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policies for profiles table
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, initials, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'initials', upper(substring(new.email, 1, 2))),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger to create profile automatically on user signup
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
