-- This script creates the admin user: admin@example.com / admin9745
-- Note: You need to create this user via the signup page first
-- This script is just documentation of the admin credentials

-- The admin user is automatically created when someone signs up with admin@example.com
-- The trigger in 001_create_user_profiles.sql automatically assigns admin role
-- Password: admin9745

-- To verify admin user exists, run:
-- SELECT * FROM auth.users WHERE email = 'admin@example.com';
-- SELECT * FROM public.user_profiles WHERE email = 'admin@example.com';

-- Manual creation (if needed) would require using Supabase Auth API
-- as direct insertion into auth.users requires proper password hashing
