-- 004_indexes.sql
-- Performance indexes for common query patterns

CREATE INDEX idx_ayahs_surah_riwayah ON ayahs (surah_id, riwayah);
CREATE INDEX idx_hifz_progress_user_status ON hifz_progress (user_id, status);
CREATE INDEX idx_hifz_progress_user_strength ON hifz_progress (user_id, strength_score);
CREATE INDEX idx_review_schedule_user_due ON review_schedule (user_id, due_date);
CREATE INDEX idx_recitation_sessions_user ON recitation_sessions (user_id, started_at DESC);
CREATE INDEX idx_recitation_attempts_session ON recitation_attempts (session_id);
CREATE INDEX idx_goals_user_date ON goals (user_id, goal_date DESC);
