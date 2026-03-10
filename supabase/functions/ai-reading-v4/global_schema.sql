--
-- Global AI Divination Engine - Supreme Architecture Schema
--

-- 1. Tarot Card Meanings (78 Cards)
CREATE TABLE IF NOT EXISTS tarot_card_meanings (
    id SERIAL PRIMARY KEY,
    card_name TEXT NOT NULL UNIQUE,
    arcana_type TEXT NOT NULL, -- Major, Minor
    upright_meaning TEXT,
    reversed_meaning TEXT,
    love TEXT,
    career TEXT,
    money TEXT,
    advice TEXT,
    element TEXT,
    planet TEXT,
    zodiac TEXT
);

-- 2. Tarot Position Meanings
CREATE TABLE IF NOT EXISTS tarot_position_meanings (
    id SERIAL PRIMARY KEY,
    position_name TEXT NOT NULL UNIQUE, -- past, present, future, challenge, advice, result
    interpretation TEXT NOT NULL,
    time_context TEXT -- past, present, future
);

-- 3. Tarot Narrative Patterns (Choi Hanna Style - 40 Patterns)
CREATE TABLE IF NOT EXISTS tarot_narrative_patterns (
    id SERIAL PRIMARY KEY,
    card_name TEXT NOT NULL,
    symbol TEXT,
    interpretation TEXT NOT NULL,
    emotion TEXT,
    pattern_type TEXT -- Choi Hanna Style
);

-- 4. Tarot Emotion Patterns
CREATE TABLE IF NOT EXISTS tarot_emotion_patterns (
    id SERIAL PRIMARY KEY,
    card_name TEXT NOT NULL,
    emotion_type TEXT, -- shock, release, transformation, etc.
    psychological_state TEXT,
    behavior_signal TEXT
);

-- 5. AI Tarot Reading Sentences (5000+ Sentences)
CREATE TABLE IF NOT EXISTS ai_tarot_reading_sentences (
    id SERIAL PRIMARY KEY,
    card_name TEXT NOT NULL,
    context TEXT, -- love, career, general
    pattern TEXT,
    interpretation TEXT NOT NULL,
    emotion TEXT,
    advice TEXT,
    language TEXT DEFAULT 'kr' -- kr, jp, us
);

-- 6. Saju Reading Sentences (2000+ Sentences)
CREATE TABLE IF NOT EXISTS saju_reading_sentences (
    id SERIAL PRIMARY KEY,
    element_balance TEXT, -- wood_strong, fire_weak, etc.
    pattern TEXT, -- 재다신약, 관인상생, etc.
    category TEXT, -- personality, career, money, relationship
    interpretation TEXT NOT NULL,
    advice TEXT,
    language TEXT DEFAULT 'kr'
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_tarot_sentences_card ON ai_tarot_reading_sentences(card_name, context);
CREATE INDEX IF NOT EXISTS idx_saju_sentences_pattern ON saju_reading_sentences(pattern, category);

-- 7. Engine Monitoring & Analysis
-- Gemini 응답 품질 모니터링 테이블
CREATE TABLE IF NOT EXISTS engine_monitoring_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    engine_version TEXT NOT NULL,              -- "v9_symbolic_prediction_engine"
    gemini_model TEXT NOT NULL,                -- "gemini-1.5-pro"
    
    -- 응답 품질
    response_type TEXT NOT NULL,               -- "valid_json" | "fallback_text" | "parse_error" | "schema_mismatch" | "timeout"
    parse_success BOOLEAN NOT NULL,
    schema_validation_passed BOOLEAN NOT NULL,
    missing_fields TEXT[],                     -- ["love_analysis", "action_guide.lucky"]
    extra_fields TEXT[],                       -- 스키마에 없는 필드
    
    -- 성능
    gemini_latency_ms INTEGER,
    total_pipeline_ms INTEGER,
    prompt_tokens_estimate INTEGER,
    
    -- 엔진 컨텍스트
    question_type TEXT,
    consensus_score REAL,
    grade TEXT,                                -- S/A/B/C
    card_count INTEGER,
    has_birth_info BOOLEAN,
    
    -- 오류 상세
    error_message TEXT,
    raw_response_preview TEXT                  -- 첫 500자
);

CREATE INDEX IF NOT EXISTS idx_monitoring_timestamp ON engine_monitoring_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_response_type ON engine_monitoring_logs(response_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_version ON engine_monitoring_logs(engine_version);

-- 일별 집계 뷰
CREATE OR REPLACE VIEW monitoring_daily_summary AS
SELECT 
    DATE(timestamp) as date,
    engine_version,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE parse_success = true) as successful_parses,
    COUNT(*) FILTER (WHERE schema_validation_passed = true) as valid_schemas,
    COUNT(*) FILTER (WHERE response_type = 'fallback_text') as fallback_count,
    COUNT(*) FILTER (WHERE response_type = 'parse_error') as parse_errors,
    COUNT(*) FILTER (WHERE response_type = 'timeout') as timeouts,
    ROUND(AVG(gemini_latency_ms)) as avg_latency_ms,
    ROUND(AVG(total_pipeline_ms)) as avg_pipeline_ms,
    ROUND(100.0 * COUNT(*) FILTER (WHERE schema_validation_passed = true) / NULLIF(COUNT(*), 0), 1) as schema_accuracy_pct
FROM engine_monitoring_logs
GROUP BY DATE(timestamp), engine_version
ORDER BY date DESC;

-- 8. Payment & Subscription
-- 상품 정의
CREATE TABLE IF NOT EXISTS reading_products (
    id TEXT PRIMARY KEY,                       -- "grade_b", "grade_a", "grade_s"
    name TEXT NOT NULL,
    description TEXT,
    price_krw INTEGER NOT NULL,                -- 원화 가격
    price_usd REAL,                            -- USD (선택)
    price_jpy INTEGER,                         -- JPY (선택)
    grade TEXT NOT NULL,                        -- B, A, S
    credits_required INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO reading_products (id, name, description, price_krw, price_usd, price_jpy, grade, credits_required) VALUES
('grade_c', '기본 리딩', '웨이트 타로 1종 + 핵심 메시지', 0, 0, 0, 'C', 0),
('grade_b', '상세 리딩', '타로 2종 + 연애분석 + DO 가이드 + 럭키', 1000, 1, 100, 'B', 1),
('grade_a', '프리미엄 리딩', '타로 3종 + 교차검증 + 연애DNA + 타임라인 + DO/DONT', 3000, 3, 300, 'A', 3),
('grade_s', '마스터 리딩', '6체계 교차검증 + 인연프로필 + 6개월 타임라인 + 대운 분석', 5000, 5, 500, 'S', 5)
ON CONFLICT (id) DO NOTHING;

-- 구매 기록
CREATE TABLE IF NOT EXISTS reading_purchases (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    session_id TEXT,                            -- reading_sessions.id 연결
    product_id TEXT REFERENCES reading_products(id),
    grade TEXT NOT NULL,
    credits_used INTEGER NOT NULL,
    payment_method TEXT,                        -- "credit" | "stripe" | "toss" | "free"
    payment_status TEXT DEFAULT 'completed',    -- "pending" | "completed" | "refunded"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON reading_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_session ON reading_purchases(session_id);

-- 9. Schema Evolution
-- reading_sessions 테이블 확장 (다국어 및 결제 연동)
ALTER TABLE public.reading_sessions ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'kr';
ALTER TABLE public.reading_sessions ADD COLUMN IF NOT EXISTS purchased_grade TEXT DEFAULT 'C'; -- C, B, A, S
ALTER TABLE public.reading_sessions ADD COLUMN IF NOT EXISTS user_name TEXT;
