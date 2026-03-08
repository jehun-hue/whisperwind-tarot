
-- 상담 세션 테이블
CREATE TABLE public.reading_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'general',
  memo TEXT,
  
  -- 출생정보
  gender TEXT,
  birth_date DATE,
  birth_time TEXT,
  birth_place TEXT,
  is_lunar BOOLEAN DEFAULT false,
  
  -- 타로 카드
  cards JSONB NOT NULL DEFAULT '[]',
  
  -- 사주 분석 결과
  saju_data JSONB,
  
  -- AI 리딩 결과
  ai_reading JSONB,
  
  -- 점수
  tarot_score NUMERIC,
  saju_score NUMERIC,
  astrology_score NUMERIC,
  ziwei_score NUMERIC,
  final_confidence NUMERIC,
  
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화 (공개 접근 - 인증 없이 사용)
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert sessions"
  ON public.reading_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read sessions"
  ON public.reading_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update sessions"
  ON public.reading_sessions FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete sessions"
  ON public.reading_sessions FOR DELETE
  USING (true);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_reading_sessions_updated_at
  BEFORE UPDATE ON public.reading_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
