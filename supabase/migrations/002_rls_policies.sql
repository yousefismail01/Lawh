-- 002_rls_policies.sql
-- STEP 1: Enable RLS on all user-facing tables (deny-all default)
-- CRITICAL: RLS must be enabled BEFORE any policies are created

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hifz_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE recitation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recitation_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tajweed_violation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- STEP 2: Public read-only for reference tables
CREATE POLICY "surahs_public_read" ON surahs FOR SELECT USING (true);
CREATE POLICY "ayahs_public_read" ON ayahs FOR SELECT USING (true);
CREATE POLICY "achievements_public_read" ON achievements FOR SELECT USING (true);

-- STEP 3: User-scoped CRUD for all user tables
CREATE POLICY "profiles_own_data" ON profiles
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hifz_progress_own_data" ON hifz_progress
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recitation_sessions_own_data" ON recitation_sessions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recitation_attempts_own_data" ON recitation_attempts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tajweed_violation_log_own_data" ON tajweed_violation_log
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "review_schedule_own_data" ON review_schedule
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_own_data" ON goals
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_achievements_own_data" ON user_achievements
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
