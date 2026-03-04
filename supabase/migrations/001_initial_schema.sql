-- 001_initial_schema.sql
-- Creates all 10 tables in dependency order (reference tables first, then user tables)

-- Reference tables (no auth dependency)
CREATE TABLE surahs (
  id                   INTEGER PRIMARY KEY,
  name_arabic          TEXT NOT NULL,
  name_transliteration TEXT NOT NULL,
  name_english         TEXT NOT NULL,
  ayah_count           INTEGER NOT NULL,
  juz_start            INTEGER NOT NULL,
  revelation_type      TEXT NOT NULL CHECK (revelation_type IN ('Meccan', 'Medinan')),
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ayahs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  surah_id        INTEGER NOT NULL REFERENCES surahs(id),
  ayah_number     INTEGER NOT NULL,
  riwayah         TEXT NOT NULL DEFAULT 'hafs' CHECK (riwayah IN ('hafs', 'warsh', 'qalun', 'ad_duri')),
  text_uthmani    TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  juz             INTEGER NOT NULL,
  hizb            INTEGER NOT NULL,
  rub             INTEGER NOT NULL,
  page            INTEGER NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (surah_id, ayah_number, riwayah)
);

CREATE TABLE achievements (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key         TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- User tables
CREATE TABLE profiles (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name        TEXT,
  target_riwayah      TEXT NOT NULL DEFAULT 'hafs' CHECK (target_riwayah IN ('hafs', 'warsh', 'qalun', 'ad_duri')),
  daily_goal_minutes  INTEGER NOT NULL DEFAULT 15,
  daily_goal_ayahs    INTEGER NOT NULL DEFAULT 5,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hifz_progress (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_id       INTEGER NOT NULL REFERENCES surahs(id),
  ayah_number    INTEGER NOT NULL,
  riwayah        TEXT NOT NULL DEFAULT 'hafs' CHECK (riwayah IN ('hafs', 'warsh', 'qalun', 'ad_duri')),
  status         TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'memorized', 'needs_review')),
  strength_score NUMERIC(4,3) NOT NULL DEFAULT 0.0 CHECK (strength_score BETWEEN 0.0 AND 1.0),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, surah_id, ayah_number, riwayah)
);

CREATE TABLE recitation_sessions (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  riwayah        TEXT NOT NULL DEFAULT 'hafs' CHECK (riwayah IN ('hafs', 'warsh', 'qalun', 'ad_duri')),
  session_type   TEXT NOT NULL CHECK (session_type IN ('new_memorization', 'review', 'free')),
  started_at     TIMESTAMPTZ DEFAULT now(),
  ended_at       TIMESTAMPTZ,
  accuracy_score NUMERIC(4,3),
  ayahs_covered  INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE recitation_attempts (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id       UUID NOT NULL REFERENCES recitation_sessions(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_id         INTEGER NOT NULL REFERENCES surahs(id),
  ayah_number      INTEGER NOT NULL,
  riwayah          TEXT NOT NULL DEFAULT 'hafs' CHECK (riwayah IN ('hafs', 'warsh', 'qalun', 'ad_duri')),
  audio_url        TEXT,
  word_results     JSONB,
  accuracy_score   NUMERIC(4,3),
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tajweed_violation_log (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id   UUID NOT NULL REFERENCES recitation_attempts(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_id     INTEGER NOT NULL REFERENCES surahs(id),
  ayah_number  INTEGER NOT NULL,
  riwayah      TEXT NOT NULL DEFAULT 'hafs',
  rule_key     TEXT NOT NULL,
  rule_name_en TEXT NOT NULL,
  rule_name_ar TEXT NOT NULL,
  severity     TEXT NOT NULL CHECK (severity IN ('minor', 'major')),
  word_index   INTEGER,
  confidence   NUMERIC(4,3),
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE review_schedule (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_id      INTEGER NOT NULL REFERENCES surahs(id),
  ayah_number   INTEGER NOT NULL,
  riwayah       TEXT NOT NULL DEFAULT 'hafs' CHECK (riwayah IN ('hafs', 'warsh', 'qalun', 'ad_duri')),
  due_date      DATE NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 1,
  ease_factor   NUMERIC(4,2) NOT NULL DEFAULT 2.5,
  repetitions   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, surah_id, ayah_number, riwayah)
);

CREATE TABLE goals (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_date           DATE NOT NULL,
  target_minutes      INTEGER NOT NULL DEFAULT 15,
  target_ayahs        INTEGER NOT NULL DEFAULT 5,
  completed_minutes   INTEGER NOT NULL DEFAULT 0,
  completed_ayahs     INTEGER NOT NULL DEFAULT 0,
  streak_day          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, goal_date)
);

CREATE TABLE user_achievements (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  unlocked_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);
