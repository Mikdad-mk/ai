-- Create support requests table for Help & Support feature
CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own support requests
CREATE POLICY "Users can view own support requests"
  ON public.support_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own support requests
CREATE POLICY "Users can create own support requests"
  ON public.support_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all support requests
CREATE POLICY "Admins can view all support requests"
  ON public.support_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all support requests
CREATE POLICY "Admins can update all support requests"
  ON public.support_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_support_requests_user_id ON public.support_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON public.support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_created_at ON public.support_requests(created_at DESC);
