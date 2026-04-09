-- Creator notification preferences
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_pref text NOT NULL DEFAULT 'every'
    CHECK (notification_pref IN ('every', 'daily', 'weekly', 'threshold', 'off')),
  ADD COLUMN IF NOT EXISTS notification_threshold numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notification_email text;
