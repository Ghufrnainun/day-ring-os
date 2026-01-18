-- Add public profile columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS public_profile_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Auto-generate usernames for existing users (from email prefix + random suffix)
UPDATE profiles
SET username = LOWER(REGEXP_REPLACE(email, '@.*', '', 'g')) || '-' || SUBSTR(MD5(email::text), 1, 4)
WHERE username IS NULL AND email IS NOT NULL;

-- Ensure all new users get a username (via trigger or app logic)
-- Note: This will be handled in the app's onboarding flow
