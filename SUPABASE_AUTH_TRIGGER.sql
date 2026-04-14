-- Trigger to automatically create public.users record when auth.users are created
-- This ensures every auth user has a corresponding public user record

CREATE OR REPLACE FUNCTION create_user_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    username,
    role,
    status,
    is_banned,
    first_joined,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    'active',
    false,
    NOW(),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_on_signup();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_user_on_signup() TO authenticated, service_role;
