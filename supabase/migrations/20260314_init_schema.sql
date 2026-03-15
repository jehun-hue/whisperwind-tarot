-- ── readings 테이블 ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS readings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question            TEXT,
  topic               TEXT,
  subtopic            TEXT,
  result_json         JSONB,
  prediction_strength NUMERIC(4,3),
  consensus_score     NUMERIC(4,3),
  birth_time_provided BOOLEAN DEFAULT FALSE,
  birth_place_provided BOOLEAN DEFAULT FALSE,
  active_systems      TEXT[],
  engine_version      TEXT DEFAULT 'v4',
  status              TEXT DEFAULT 'completed',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── reading_tarot_cards 테이블 ────────────────────────────────────
CREATE TABLE IF NOT EXISTS reading_tarot_cards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_id  UUID REFERENCES readings(id) ON DELETE CASCADE,
  position    INTEGER,
  role        TEXT,
  card_name   TEXT,
  orientation TEXT,
  element_ko  TEXT,
  element_en  TEXT,
  vector      JSONB,
  weight      NUMERIC(4,3),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── reading_system_vectors 테이블 ─────────────────────────────────
CREATE TABLE IF NOT EXISTS reading_system_vectors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_id  UUID REFERENCES readings(id) ON DELETE CASCADE,
  system      TEXT,
  vectors     JSONB,
  confidence  NUMERIC(4,3),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── reading_feedback 테이블 ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS reading_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_id      UUID REFERENCES readings(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
  accuracy        BOOLEAN,
  tarot_accurate  BOOLEAN,
  saju_accurate   BOOLEAN,
  ziwei_accurate  BOOLEAN,
  astrology_accurate BOOLEAN,
  outcome_matched BOOLEAN,
  comment         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── system_accuracy 테이블 (#100) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS system_accuracy (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_name       TEXT NOT NULL,
  topic             TEXT NOT NULL DEFAULT 'general',
  base_weight       NUMERIC(5,4) NOT NULL,
  current_weight    NUMERIC(5,4) NOT NULL,
  total_count       INTEGER DEFAULT 0,
  correct_count     INTEGER DEFAULT 0,
  avg_rating        NUMERIC(4,3) DEFAULT 0,
  last_updated      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(system_name, topic)
);

-- ── 인덱스 ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_readings_user    ON readings(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_topic   ON readings(topic);
CREATE INDEX IF NOT EXISTS idx_readings_created ON readings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_reading ON reading_feedback(reading_id);
CREATE INDEX IF NOT EXISTS idx_vectors_reading  ON reading_system_vectors(reading_id);

-- ── RLS 활성화 ────────────────────────────────────────────────────
ALTER TABLE readings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_tarot_cards    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_system_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_feedback       ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_accuracy        ENABLE ROW LEVEL SECURITY;

-- ── RLS 정책 ──────────────────────────────────────────────────────
CREATE POLICY "users_own_readings" ON readings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_tarot_cards" ON reading_tarot_cards
  FOR ALL USING (
    reading_id IN (SELECT id FROM readings WHERE user_id = auth.uid())
  );

CREATE POLICY "users_own_vectors" ON reading_system_vectors
  FOR ALL USING (
    reading_id IN (SELECT id FROM readings WHERE user_id = auth.uid())
  );

CREATE POLICY "users_own_feedback" ON reading_feedback
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "public_read_accuracy" ON system_accuracy
  FOR SELECT USING (true);

-- ── system_accuracy 초기 데이터 ───────────────────────────────────
INSERT INTO system_accuracy (system_name, topic, base_weight, current_weight) VALUES
  ('tarot',      'general',      0.35, 0.35),
  ('saju',       'general',      0.25, 0.25),
  ('ziwei',      'general',      0.20, 0.20),
  ('astrology',  'general',      0.15, 0.15),
  ('numerology', 'general',      0.05, 0.05),
  ('tarot',      'career',       0.30, 0.30),
  ('saju',       'career',       0.30, 0.30),
  ('ziwei',      'career',       0.20, 0.20),
  ('astrology',  'career',       0.15, 0.15),
  ('numerology', 'career',       0.05, 0.05),
  ('tarot',      'relationship', 0.35, 0.35),
  ('saju',       'relationship', 0.20, 0.20),
  ('ziwei',      'relationship', 0.20, 0.20),
  ('astrology',  'relationship', 0.20, 0.20),
  ('numerology', 'relationship', 0.05, 0.05),
  ('tarot',      'money',        0.30, 0.30),
  ('saju',       'money',        0.30, 0.30),
  ('ziwei',      'money',        0.20, 0.20),
  ('astrology',  'money',        0.15, 0.15),
  ('numerology', 'money',        0.05, 0.05)
ON CONFLICT (system_name, topic) DO NOTHING;
