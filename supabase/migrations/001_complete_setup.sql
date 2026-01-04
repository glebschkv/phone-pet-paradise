-- ============================================
-- COMPLETE SUPABASE SETUP MIGRATION
-- Run this in the Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE MISSING TABLES
-- ============================================

-- user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system',
  sound_enabled BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,
  auto_save_enabled BOOLEAN DEFAULT true,
  timer_sound TEXT DEFAULT 'bell',
  background_music TEXT DEFAULT 'ambient',
  animation_speed TEXT DEFAULT 'normal',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- user_subscriptions table (for IAP)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  original_transaction_id TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('premium', 'premium_plus')),
  period TEXT NOT NULL CHECK (period IN ('monthly', 'yearly', 'lifetime')),
  purchase_date TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  environment TEXT DEFAULT 'production' CHECK (environment IN ('sandbox', 'production')),
  receipt_data TEXT,
  signed_transaction TEXT,
  validated_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- (Run these - they'll skip if column exists)
-- ============================================

-- Ensure focus_sessions has all required columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'focus_sessions' AND column_name = 'session_type') THEN
    ALTER TABLE focus_sessions ADD COLUMN session_type TEXT DEFAULT 'focus';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'focus_sessions' AND column_name = 'completed_at') THEN
    ALTER TABLE focus_sessions ADD COLUMN completed_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Ensure user_progress has all required columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'streak_freeze_count') THEN
    ALTER TABLE user_progress ADD COLUMN streak_freeze_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'updated_at') THEN
    ALTER TABLE user_progress ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Ensure pets has all required columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pets' AND column_name = 'is_favorite') THEN
    ALTER TABLE pets ADD COLUMN is_favorite BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pets' AND column_name = 'mood') THEN
    ALTER TABLE pets ADD COLUMN mood INTEGER DEFAULT 50;
  END IF;
END $$;

-- Ensure achievements has reward_xp column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'reward_xp') THEN
    ALTER TABLE achievements ADD COLUMN reward_xp INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_transaction_id ON user_subscriptions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_active ON user_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_user_id ON quests(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE RLS POLICIES
-- ============================================

-- Drop existing policies first (to avoid conflicts)
DO $$
BEGIN
  -- profiles
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

  -- user_progress
  DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
  DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
  DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;

  -- pets
  DROP POLICY IF EXISTS "Users can view own pets" ON pets;
  DROP POLICY IF EXISTS "Users can update own pets" ON pets;
  DROP POLICY IF EXISTS "Users can insert own pets" ON pets;

  -- focus_sessions
  DROP POLICY IF EXISTS "Users can view own sessions" ON focus_sessions;
  DROP POLICY IF EXISTS "Users can insert own sessions" ON focus_sessions;

  -- quests
  DROP POLICY IF EXISTS "Users can view own quests" ON quests;
  DROP POLICY IF EXISTS "Users can update own quests" ON quests;
  DROP POLICY IF EXISTS "Users can insert own quests" ON quests;

  -- achievements
  DROP POLICY IF EXISTS "Users can view own achievements" ON achievements;
  DROP POLICY IF EXISTS "Users can insert own achievements" ON achievements;

  -- user_settings
  DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
  DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
  DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
  DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;

  -- user_subscriptions
  DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
  DROP POLICY IF EXISTS "Service role can manage subscriptions" ON user_subscriptions;
END $$;

-- profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_progress policies
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- pets policies
CREATE POLICY "Users can view own pets" ON pets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own pets" ON pets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pets" ON pets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- focus_sessions policies
CREATE POLICY "Users can view own sessions" ON focus_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON focus_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- quests policies
CREATE POLICY "Users can view own quests" ON quests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own quests" ON quests
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quests" ON quests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- achievements policies
CREATE POLICY "Users can view own achievements" ON achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_settings policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- user_subscriptions policies (special - service role for writes)
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
-- Service role bypasses RLS, so no explicit policy needed for writes

-- ============================================
-- 6. CREATE TRIGGER FUNCTIONS
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create user_progress
  INSERT INTO user_progress (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create user_settings
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(p_user_id UUID)
RETURNS TABLE (tier TEXT, expires_at TIMESTAMPTZ, is_lifetime BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.tier,
    us.expires_at,
    (us.period = 'lifetime') as is_lifetime
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id
    AND us.is_active = true
    AND us.revoked_at IS NULL
    AND (us.expires_at IS NULL OR us.expires_at > now())
  ORDER BY
    CASE us.tier WHEN 'premium_plus' THEN 1 ELSE 2 END,
    us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deactivate expired subscriptions (call via cron)
CREATE OR REPLACE FUNCTION deactivate_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE user_subscriptions
  SET is_active = false, updated_at = now()
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < now();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. CREATE TRIGGERS
-- ============================================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE ON pets TO authenticated;
GRANT SELECT, INSERT ON focus_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON quests TO authenticated;
GRANT SELECT, INSERT ON achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_settings TO authenticated;
GRANT SELECT ON user_subscriptions TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION get_user_subscription_tier(UUID) TO authenticated;

-- ============================================
-- DONE!
-- ============================================
-- After running this, you need to:
-- 1. Deploy Edge Functions (calculate-xp, validate-receipt, process-achievements, delete-account)
-- 2. Set up environment variables in Supabase Dashboard:
--    - SUPABASE_URL (auto-set)
--    - SUPABASE_ANON_KEY (auto-set)
--    - SUPABASE_SERVICE_ROLE_KEY (auto-set)
--    - ALLOWED_ORIGINS (your production URLs)
--    - ENVIRONMENT (set to 'production' for prod)
-- ============================================
