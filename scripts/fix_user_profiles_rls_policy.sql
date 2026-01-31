-- Fix RLS policies for user_profiles table
-- This adds the missing INSERT policy so users can create their own profiles

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON user_profiles;

-- Allow users to INSERT their own profile (THIS WAS MISSING)
CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to SELECT their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow authenticated users to view all profiles (needed for chat, admin features)
CREATE POLICY "Authenticated users can view all profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow users to UPDATE their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to DELETE their own profile (optional, for account deletion)
CREATE POLICY "Users can delete own profile"
ON user_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);
