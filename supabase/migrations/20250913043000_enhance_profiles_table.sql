-- Add new fields to profiles table for enhanced user profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';

-- Update RLS policies to ensure users can update their own profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update own profile extended fields') THEN
    CREATE POLICY "Users can update own profile extended fields" ON profiles
    FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_data ON profiles USING gin(data);
CREATE INDEX IF NOT EXISTS idx_profiles_social_links ON profiles USING gin(social_links);
CREATE INDEX IF NOT EXISTS idx_profiles_preferences ON profiles USING gin(preferences);

-- Add comments for documentation
COMMENT ON COLUMN profiles.bio IS 'User biography or about text';
COMMENT ON COLUMN profiles.location IS 'User location';
COMMENT ON COLUMN profiles.website IS 'User website URL';
COMMENT ON COLUMN profiles.social_links IS 'JSON object containing social media links';
COMMENT ON COLUMN profiles.preferences IS 'JSON object containing user preferences';
COMMENT ON COLUMN profiles.banner_url IS 'Profile banner/header image URL';
COMMENT ON COLUMN profiles.data IS 'Additional custom profile data as JSONB';