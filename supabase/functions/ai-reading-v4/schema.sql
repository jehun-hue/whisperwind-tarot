--
-- Database Schema for AI Fortune-telling System (FULL SYSTEM)
--

-- AI Reading Sentences DB (5000+ variations via templates or direct entries)
CREATE TABLE IF NOT EXISTS reading_sentences (
    id BIGSERIAL PRIMARY KEY,
    category TEXT NOT NULL, -- personality, love, career, money, risk, timing
    topic TEXT NOT NULL,    -- 재다신약, 신강, 관성강, 식상강, 인성강, etc.
    tone TEXT DEFAULT 'formal', -- formal, cozy, sharp
    sentence TEXT NOT NULL,
    weight INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tarot Card DB
CREATE TABLE IF NOT EXISTS tarot_cards (
    id SERIAL PRIMARY KEY,
    card_name TEXT NOT NULL UNIQUE,
    arcana TEXT NOT NULL, -- Major, Minor
    suit TEXT, -- Wands, Cups, Swords, Pentacles
    number INTEGER,
    upright_meaning TEXT,
    reversed_meaning TEXT,
    keywords TEXT[],
    element TEXT,
    description TEXT
);

-- Tarot Combination DB (300+ combinations)
CREATE TABLE IF NOT EXISTS tarot_combinations (
    id SERIAL PRIMARY KEY,
    card1 TEXT NOT NULL,
    card2 TEXT NOT NULL,
    card3 TEXT, -- Optional 3rd card
    meaning TEXT NOT NULL,
    love TEXT,
    career TEXT,
    money TEXT,
    advice TEXT,
    UNIQUE(card1, card2, card3)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_sentences_category_topic ON reading_sentences(category, topic);
CREATE INDEX IF NOT EXISTS idx_tarot_combinations_cards ON tarot_combinations(card1, card2);
