-- Disable email confirmation requirement for development
-- This allows users to sign in immediately after registration without email verification

-- Update auth settings to disable email confirmation
UPDATE auth.config 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'),
  '{email_confirm}',
  'false'
)
WHERE true;

-- Alternatively, if the above doesn't work, we can confirm existing unconfirmed users
-- This will allow any users who signed up to immediately sign in
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;