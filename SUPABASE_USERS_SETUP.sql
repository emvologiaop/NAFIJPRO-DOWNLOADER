-- Complete Users Table Schema for DownAria Admin
-- Run this in Supabase SQL Editor

-- 1. Create public.users table if it doesn't exist (linking to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT DEFAULT 'active',
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  referral_code TEXT UNIQUE,
  invited_by UUID REFERENCES public.users(id),
  total_referrals INTEGER DEFAULT 0,
  last_seen TIMESTAMP WITH TIME ZONE,
  first_joined TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Set up RLS policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON public.users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Admins can update any user
CREATE POLICY "Admins can update users" ON public.users
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- 5. Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 6. Verify setup
SELECT 'Users table is ready!' as status;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public';
