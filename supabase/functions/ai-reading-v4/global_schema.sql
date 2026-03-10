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
