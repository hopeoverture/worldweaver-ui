-- Confirm existing users who haven't been confirmed yet
-- This allows them to sign in immediately

UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL;