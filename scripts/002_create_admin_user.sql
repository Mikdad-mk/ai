-- This script creates an admin user with email: admin@example.com and password: admin123
-- Run this script only once after setting up the database

-- Note: You'll need to sign up with admin@example.com / admin123 through the UI
-- The trigger will automatically create the profile with admin role if metadata is set

-- To set the admin role for an existing user, you can update the profiles table:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
