import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lock, Trash2, RefreshCw, Sparkles, Loader2, Download, Search, ChevronRight, ArrowLeft, Settings, ClipboardCopy, Code, FileJson } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateNatalChart, getAstrologyForQuestion, getCurrentTransits } from "@/lib/astrology";
import { calculateZiWei, getZiWeiForQuestion } from "@/lib/ziwei";
import { getCombinationSummary } from "@/data/tarotCombinations";

// ============================================================
// ⚠️  사주 재계산 최엄 금지 (SAJU RECALCULATION GUARD)
// 사주 계산은 ClientPage.tsx getManseryeok()에서만 수행됩니다.
// 이 파일에서 getManseryeok()을 추가하는 것은 엄격히 금지됩니다.
// 모든 사주 데이터는 session.saju_data를 통해서만 전달합니다.
// ============================================================

const READER_PIN = "1234";

type QuestionType = "연애" | "재회" | "사업" | "직업" | "금전" | "종합";

const questionTypeLabels: Record<string, string> = {
  "연애": "💕 연애",
  "재회": "💔 재회",
  "직업": "💼 직업",
  "사업": "🏢 사업",
  "금전": "💰 금전",
  "종합": "🔮 종합",
};

interface ReadingSession {
  id: string;
  question: string;
  question_type: string;
  memo: string | null;
  counselor_comment: string | null;
  gender: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
  is_lunar: boolean | null;
  cards: any;
  saju_data: any;
  ai_reading: any;
  tarot_score: number | null;
  saju_score: number | null;
  astrology_score: number | null;
  ziwei_score: number | null;
  final_confidence: number | null;
  intent: string | null;

  confidence: number | null;
  analysis_mode: string | null;
  status: string;
  created_at: string;
  user_name: string | null;
  locale: string | null;
  purchased_grade: string | null;
}

export default function ReaderPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ReadingSession | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from("reading_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && data) setSessions(data as unknown as ReadingSession[]);
  }, []);

  useEffect(() => {
    if (authed) loadSessions();
  }, [authed, loadSessions]);

  const handleLogin = () => {
    if (pin === READER_PIN) setAuthed(true);
  };

  const deleteSession = async (id: string) => {
    await supabase.from("reading_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (selectedSession?.id === id) setSelectedSession(null);
  };

  const updateSession = (updated: ReadingSession) => {
    setSessions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
    setSelectedSession(updated);
  };

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.trim().toLowerCase();
    return sessions.filter(s =>
      (s.user_name && s.user_name.toLowerCase().includes(q)) ||
      (s.question && s.question.toLowerCase().includes(q))
    );
  }, [sessions, searchQuery]);

  const pendingCount = sessions.filter(s => s.status === "pending").length;

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm border-border bg-card">
          <CardContent className="py-8">
            <div className="mb-6 text-center">
              <Lock className="mx-auto mb-3 h-8 w-8 text-gold" />
              <h2 className="font-display text-xl font-semibold text-foreground">상담사 전용</h2>
              <p className="mt-1 text-sm text-muted-foreground">비밀번호를 입력해 주세요</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-3">
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="rounded-xl border-border bg-secondary text-center text-lg tracking-widest"
                placeholder="••••"
              />
              <Button className="w-full rounded-xl bg-primary text-primary-foreground" type="submit">확인</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <span className="font-display text-sm italic tracking-widest text-gold">reader dashboard</span>
            <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">상담사 리딩 화면</h1>
            {pendingCount > 0 && (
              <p className="mt-1 text-sm text-gold">새 상담 요청 {pendingCount}건</p>
            )}
          </div>
          <Button variant="secondary" className="rounded-full" onClick={loadSessions}>
            <RefreshCw className="mr-2 h-4 w-4" /> 새로고침
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Sessions list */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">상담 요청 목록 ({filteredSessions.length})</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름 또는 질문 검색..."
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredSessions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "검색 결과가 없습니다." : "아직 상담 요청이 없습니다."}
                </p>
              )}
              {filteredSessions.map((s) => (
                <div
                  key={s.id}
                  className={`group cursor-pointer rounded-lg border p-3 transition-all ${selectedSession?.id === s.id
                    ? "border-gold/40 bg-gold/5"
                    : "border-border bg-secondary hover:bg-muted"
                    }`}
                  onClick={() => setSelectedSession(s)}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-medium text-foreground">
                          {s.user_name || s.question || "질문 없음"}
                        </div>
                        {s.status === "pending" && (
                          <Badge variant="outline" className="text-[9px] border-yellow-500/30 text-yellow-400 shrink-0">
                            대기
                          </Badge>
                        )}
                        {s.status === "analyzing" && (
                          <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-400 shrink-0">
                            분석중
                          </Badge>
                        )}
                        {s.status === "completed" && (
                          <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-400 shrink-0">
                            완료
                          </Badge>
                        )}
                        {s.status === "error" && (
                          <Badge variant="outline" className="text-[9px] border-red-500/30 text-red-400 shrink-0">
                            에러
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(s.created_at).toLocaleString("ko-KR")}
                      </div>
                      <div className="mt-1 flex gap-1 flex-wrap">
                        {(s.cards as any[])?.map((c: any) => (
                          <span key={c.id} className="text-[10px] text-muted-foreground">
                            {c.korean}{c.isReversed ? "(역)" : ""}
                          </span>
                        ))}
                      </div>
                      {s.saju_data && (
                        <div className="mt-1 text-[10px] text-gold/60">사주 포함</div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                      className="ml-2 shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reading detail */}
          {selectedSession ? (
            <SessionDetail key={selectedSession.id} session={selectedSession} onUpdate={updateSession} />
          ) : (
            <Card className="flex items-center justify-center border-border bg-card">
              <CardContent className="py-20 text-center">
                <div className="font-display text-4xl text-muted-foreground/30">✦</div>
                <p className="mt-3 text-muted-foreground">왼쪽 목록에서 상담 요청을 선택하세요</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionDetail({ session, onUpdate }: { session: ReadingSession; onUpdate: (s: ReadingSession) => void }) {
  const [analyzingStyle, setAnalyzingStyle] = useState<'hanna' | 'monad' | 'v1' | null>(null);
  const analyzing = !!analyzingStyle;
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [counselorComment, setCounselorComment] = useState(session.counselor_comment || "");
  const [savingComment, setSavingComment] = useState(false);
  const [userName, setUserName] = useState(session.user_name || "");
  const [savingName, setSavingName] = useState(false);
  const [forcetellData, setForcetellData] = useState("");
  const [showForcetellInput, setShowForcetellInput] = useState(false);
  const qType = session.question_type;
  const reading = session.ai_reading;
  const saju = session.saju_data;

  const renderSafe = (val: any): string => {
    if (val === null || val === undefined) return "";
    let str = "";
    if (typeof val === "string") {
      str = val;
    } else if (typeof val === "number") {
      str = String(val);
    } else if (typeof val === "object") {
      str = val.description || val.star || val.palace || JSON.stringify(val);
    } else {
      str = String(val);
    }
    // Handle literal \n or \\n from JSON/LLM output
    return str.replace(/\\n/g, "\n");
  };

  useEffect(() => {
    setCounselorComment(session.counselor_comment || "");
    setUserName(session.user_name || "");
    setAnalysisError(null);
  }, [session.id, session.counselor_comment, session.user_name]);

  const saveUserName = async () => {
    setSavingName(true);
    const value = userName.trim() || null;
    const { error } = await supabase
      .from("reading_sessions")
      .update({ user_name: value })
      .eq("id", session.id);
    if (!error) onUpdate({ ...session, user_name: value });
    setSavingName(false);
  };

  const saveCounselorComment = async () => {
    setSavingComment(true);
    const value = counselorComment.trim() || null;
    const { error } = await supabase
      .from("reading_sessions")
      .update({ counselor_comment: value })
      .eq("id", session.id);

    if (!error) {
      onUpdate({ ...session, counselor_comment: value });
    }

    setSavingComment(false);
  };
  const runAIAnalysis = async () => {
    const ok = window.confirm(
      "⚠️ API 비용이 발생합니다!\n\n" +
      "고객: " + (session.user_name || "이름없음") + "\n" +
      "질문: " + session.question + "\n\n" +
      "v1 교차 검증 분석을 실행하시겠습니까?"
    );
    if (!ok) return;

    setAnalysisError(null);
    setAnalyzingStyle('v1');
    try {
      // 상태 DB만 업데이트 (onUpdate 호출 생략 - 중간 re-render로 인한 cascade 방지)
      await supabase.from("reading_sessions").update({ status: "analyzing" }).eq("id", session.id);

      const cards = session.cards as any[];
      const birthInfo = session.birth_date ? {
        gender: session.gender === "male" ? "M" : "F",
        birthDate: session.birth_date,
        birthTime: session.birth_time || "",
        birthPlace: session.birth_place || "",
        isLunar: session.is_lunar || false,
        isLeapMonth: (session.saju_data as any)?.originalInput?.isLeapMonth || false,
        year: parseInt(session.birth_date.split("-")[0] || "1990"),
        month: parseInt(session.birth_date.split("-")[1] || "1"),
        day: parseInt(session.birth_date.split("-")[2] || "1"),
        hour: parseInt((session.birth_time || "12:00").split(":")[0] || "12"),
        minute: parseInt((session.birth_time || "12:00").split(":")[1] || "0"),
      } : null;

      // [C] 타입 안정성: session.saju_data 직접 참조
      type SajuData = typeof session.saju_data;
      const sajuDataForAI: SajuData = session.saju_data;

      // [B] 개발 모드 전용 동일 객체 자동 검증
      if (process.env.NODE_ENV !== "production") {
        console.log("[saju-flow v1] DB saju_data:", session.saju_data);
        console.log("[saju-flow v1] AI input sajuData:", sajuDataForAI);
        if (!Object.is(session.saju_data, sajuDataForAI)) {
          console.warn("[saju-flow v1] ⚠️ WARNING: sajuData 객체 불일치 데이터 흐름 버그 가능성");
        }
      }

      let astroDataForAI = null;
      let ziweiDataForAI = null;

      if (birthInfo && birthInfo.birthDate) {
        try {
          const [y, m, d] = birthInfo.birthDate.split("-").map(Number);
          const [hour, minute] = birthInfo.birthTime
            ? birthInfo.birthTime.split(":").map(Number)
            : [12, 0];

          const astro = calculateNatalChart(y, m, d, hour, minute);
          astroDataForAI = {
            ...astro,
            questionAnalysis: getAstrologyForQuestion(astro, qType as any),
            transits: getCurrentTransits(astro),
          };

          const ziwei = calculateZiWei(y, m, d, hour, minute, (birthInfo.gender as "male" | "female") || "female");
          ziweiDataForAI = {
            ...ziwei,
            questionAnalysis: getZiWeiForQuestion(ziwei, qType as any),
          };
        } catch (e) {
          console.error("Analysis calc error:", e);
        }
      }

      const combinationSummary = getCombinationSummary(cards.map((c: any) => c.id), qType as any);

      const { data: aiData, error: fnError } = await supabase.functions.invoke("ai-reading", {
        body: {
          question: session.question,
          questionType: qType,
          memo: session.memo,
          cards,
          sajuData: sajuDataForAI,
          birthInfo,
          astrologyData: astroDataForAI,
          ziweiData: ziweiDataForAI,
          combinationSummary,
          locale: "kr",
          manseryeokData: sajuDataForAI,
          forcetellData: forcetellData.trim() || null,
        },
      });

      if (fnError) throw fnError;

      const result = aiData?.reading;
      if (!result) {
        throw new Error("AI 응답이 비어 있습니다. 잠시 후 다시 시도해주세요.");
      }

      await supabase.from("reading_sessions").update({
        ai_reading: result as any,
        saju_data: sajuDataForAI as any,
        tarot_score: result.scores?.tarot || null,
        saju_score: result.scores?.saju || null,
        astrology_score: result.scores?.astrology || null,
        ziwei_score: result.scores?.ziwei || null,
        final_confidence: result.scores?.overall || null,
        status: "completed",
      }).eq("id", session.id);

      onUpdate({
        ...session,
        ai_reading: result,
        saju_data: sajuDataForAI,
        tarot_score: result.scores?.tarot,
        saju_score: result.scores?.saju,
        astrology_score: result.scores?.astrology,
        ziwei_score: result.scores?.ziwei,
        final_confidence: result.scores?.overall,
        status: "completed",
      });
    } catch (err) {
      console.error("AI analysis error:", err);
      setAnalysisError(err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.");
      await supabase.from("reading_sessions").update({ status: "error" }).eq("id", session.id);
    } finally {
      setAnalyzingStyle(null);
    }
  };

  const runAIAnalysisV2 = async (style: 'hanna' | 'monad' = 'hanna', isAutoRun = false) => {
    // 가드 로직: 해당 해석이 이미 존재하면 재생성 방지
    if (style === 'hanna' && session.ai_reading?.tarot_reading?.choihanna) {
      if (!isAutoRun) alert("최한나 해석이 이미 생성되어 있습니다.");
      return;
    }
    if (style === 'monad' && session.ai_reading?.tarot_reading?.monad) {
      if (!isAutoRun) alert("모나드 해석이 이미 생성되어 있습니다.");
      return;
    }

    if (!isAutoRun) {
      const ok = window.confirm(
        "⚠️ API 비용이 발생합니다!\n\n" +
        "고객: " + (session.user_name || "이름없음") + "\n" +
        "질문: " + session.question + "\n" +
        `해석 스타일: ${style === 'monad' ? '모나드' : '최한나'}\n\n` +
        "v8 Symbolic Prediction Engine 분석을 실행하시겠습니까?"
      );
      if (!ok) return;
    }

    setAnalysisError(null);
    setAnalyzingStyle(style);
    try {
      await supabase.from("reading_sessions").update({ status: "analyzing" }).eq("id", session.id);

      const cardsInput = (session.cards as any[]) || [];
      const birthInfo = session.birth_date ? {
        gender: session.gender,
        birthDate: session.birth_date,
        birthTime: session.birth_time || "",
        birthPlace: session.birth_place || "",
        isLunar: session.is_lunar || false,
        isLeapMonth: (session.saju_data as any)?.originalInput?.isLeapMonth || false,
      } : null;

      const sajuDataForAI = session.saju_data;
      let astroDataForAI = null;
      let ziweiDataForAI = null;

      if (birthInfo && birthInfo.birthDate) {
        try {
          const [y, m, d] = birthInfo.birthDate.split("-").map(Number);
          const [hour, minute] = birthInfo.birthTime ? birthInfo.birthTime.split(":").map(Number) : [12, 0];

          const astro = calculateNatalChart(y, m, d, hour, minute);
          astroDataForAI = {
            ...astro,
            questionAnalysis: getAstrologyForQuestion(astro, qType as any),
            transits: getCurrentTransits(astro),
          };

          const ziwei = calculateZiWei(y, m, d, hour, minute, (birthInfo.gender as "male" | "female") || "female");
          ziweiDataForAI = {
            ...ziwei,
            questionAnalysis: getZiWeiForQuestion(ziwei, qType as any),
          };
        } catch (e) {
          console.error("Analysis data prep error:", e);
        }
      }

      const combinationSummary = getCombinationSummary(cardsInput.map((c: any) => c.id), qType as any);

      const fnBody = {
        question: session.question,
        questionType: qType,
        memo: session.memo,
        cards: cardsInput,
        sajuData: sajuDataForAI,
        birthInfo,
        astrologyData: astroDataForAI,
        ziweiData: ziweiDataForAI,
        combinationSummary,
        forcetellData: forcetellData.trim() || null,
        manseryeokData: sajuDataForAI,
        locale: session.locale || "kr",
        style,
      };

      const { data: aiData, error: fnError } = await supabase.functions.invoke("ai-reading-v4", {
        body: fnBody,
      });

      if (fnError) {
        throw new Error(`Edge function error: ${fnError.message}`);
      }

      const result = aiData?.reading;
      if (!result) {
        throw new Error("AI 응답이 비어 있습니다. 잠시 후 다시 시도해주세요.");
      }

      // management_tracks 누락 방지: reading 객체 내에 병합 후 저장
      if (aiData.management_tracks) {
        result.management_tracks = aiData.management_tracks;
      }

      // 기존 데이터와 병합 (다른 스타일 리딩 덮어쓰기 방지)
      const existingReading = session.ai_reading || {};
      const mergedReading = {
        ...existingReading,
        ...result,
        tarot_reading: {
          ...(existingReading.tarot_reading || {}),
          ...(result.tarot_reading || {}),
        }
      };

      await supabase.from("reading_sessions").update({
        ai_reading: mergedReading as any,
        saju_data: sajuDataForAI as any,
        status: "completed",
      }).eq("id", session.id);

      onUpdate({
        ...session,
        ai_reading: mergedReading,
        saju_data: sajuDataForAI,
        status: "completed",
      });
    } catch (err) {
      console.error("AI V4 analysis error:", err);
      setAnalysisError(err instanceof Error ? err.message : "V4 분석 중 오류가 발생했습니다.");
      await supabase.from("reading_sessions").update({ status: "error" }).eq("id", session.id);
      onUpdate({ ...session, status: "error" });
    } finally {
      setAnalyzingStyle(null);
    }
  };

  const downloadPDF = () => {
    if (!reading) return;
    const cards = session.cards as any[];
    const qLabel = questionTypeLabels[qType] || "🔮 종합";

    const sections: { title: string; content: string }[] = [];

    if (reading.merged_reading) {
      // 신규 v4 형식
      sections.push({ title: "✦ 통합 분석 요약", content: reading.merged_reading.coreReading });

      if (reading.tarot_reading?.choihanna) {
        sections.push({
          title: "💫 최한나 타로 해석",
          content: reading.tarot_reading.choihanna.story + (reading.tarot_reading.choihanna.key_message ? `\n\n💎 핵심: ${reading.tarot_reading.choihanna.key_message}` : "")
        });
      }
      if (reading.tarot_reading?.monad) {
        sections.push({
          title: "🔷 모나드 타로 해석",
          content: reading.tarot_reading.monad.story + (reading.tarot_reading.monad.key_message ? `\n\n💎 핵심: ${reading.tarot_reading.monad.key_message}` : "")
        });
      }

      sections.push({ title: "🔮 사주 통찰", content: reading.merged_reading.structureInsight });
      sections.push({ title: "🃏 타로 상황", content: reading.merged_reading.currentSituation });
      sections.push({ title: "⭐ 점성술 타이밍", content: reading.merged_reading.timingInsight });
      sections.push({ title: "🏯 자미두수 흐름", content: reading.merged_reading.longTermFlow });
      sections.push({ title: "💡 최종 전략 제언", content: reading.merged_reading.finalAdvice });
    } else {
      // 레거시 v1/v2 형식
      if (reading.conclusion) sections.push({ title: "✦ 최종 결론", content: reading.conclusion });
      if (reading.tarotAnalysis) sections.push({ title: "🃏 타로 카드 해석", content: reading.tarotAnalysis });
      if (reading.tarotCardInteraction) sections.push({ title: "🃏 카드 간 상호작용", content: reading.tarotCardInteraction });
      if (saju) {
        if (reading.sajuAnalysis) sections.push({ title: "🔮 사주 구조 분석", content: reading.sajuAnalysis });
        if (reading.sajuTimeline) sections.push({ title: "🔮 사주 시간축 분석", content: reading.sajuTimeline });
        if (reading.astrologyAnalysis) sections.push({ title: "⭐ 점성술 분석", content: reading.astrologyAnalysis });
        if (reading.astrologyTransits) sections.push({ title: "⭐ 행성 트랜짓", content: reading.astrologyTransits });
        if (reading.ziweiAnalysis) sections.push({ title: "🏯 자미두수 궁위 분석", content: reading.ziweiAnalysis });
        if (reading.ziweiLifeStructure) sections.push({ title: "🏯 자미두수 인생 구조", content: reading.ziweiLifeStructure });
        if (reading.crossValidation) sections.push({ title: "⚖️ 4체계 교차 검증", content: reading.crossValidation });
      }
      if (reading.timing) sections.push({ title: "⏰ 시기 분석", content: reading.timing });
      if (reading.risk) sections.push({ title: "⚠️ 리스크 요인", content: reading.risk });
      if (reading.hiddenPattern) sections.push({ title: "🔍 숨겨진 패턴", content: reading.hiddenPattern });
      if (reading.advice) sections.push({ title: "💡 현실 조언", content: reading.advice });
    }

    const pillarsHtml = saju ? [
      { label: "연주", p: saju.yearPillar || saju.연주 },
      { label: "월주", p: saju.monthPillar || saju.월주 },
      { label: "일주", p: saju.dayPillar || saju.일주 },
      { label: "시주", p: saju.hourPillar || saju.시주 }
    ].map(({ label, p }) => `
      <div class="pillar">
        <div class="pillar-label">${label}</div>
        <div class="pillar-value">${p ? (p.full || `${p.cheongan || p.천간 || ""}${p.jiji || p.지지 || ""}`) : "?"}</div>
        <div class="pillar-element">${p ? (p.hanja || p.한자 || "-") : "-"}</div>
      </div>
    `).join('') : "";

    const pdfIlgan = saju?.dayPillar?.cheongan || saju?.일간 || saju?.ilgan || "미상";
    const sajuHtml = saju ? `
      <div class="info-grid">
        ${pillarsHtml}
      </div>
      <p style="margin-top:8px;font-size:12px;color:#666;">일간: ${pdfIlgan} | ${saju.strength || ""} | 용신: ${saju.yongsin || saju.용신 || ""}</p>
    ` : "";

    const scoresHtml = reading.scores ? `
      <div class="scores">
        <span>타로: ${reading.scores.tarot}%</span>
        ${saju ? `<span>사주: ${reading.scores.saju}%</span>` : ""}
        ${reading.scores.astrology != null ? `<span>점성술: ${reading.scores.astrology}%</span>` : ""}
        ${reading.scores.ziwei != null ? `<span>자미두수: ${reading.scores.ziwei}%</span>` : ""}
        <span class="overall">종합: ${reading.scores.overall}%</span>
      </div>
    ` : "";

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>상담 분석 결과</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif; color:#222; padding:40px; line-height:1.7; }
  .header { text-align:center; border-bottom:2px solid #c8a864; padding-bottom:20px; margin-bottom:30px; }
  .header h1 { font-size:22px; color:#333; margin-bottom:6px; }
  .header .meta { font-size:12px; color:#888; }
  .header .badge { display:inline-block; background:#c8a864; color:#fff; padding:2px 12px; border-radius:12px; font-size:11px; margin:6px 4px; }
  .cards { display:flex; gap:12px; margin:20px 0; }
  .card-item { flex:1; border:1px solid #ddd; border-radius:8px; padding:12px; text-align:center; }
  .card-item .pos { font-size:10px; color:#888; }
  .card-item .name { font-size:14px; font-weight:600; margin:4px 0; }
  .card-item .dir { font-size:11px; color:#c8a864; }
  .info-grid { display:flex; gap:8px; margin:12px 0; }
  .pillar { flex:1; border:1px solid #ddd; border-radius:6px; padding:8px; text-align:center; }
  .pillar-label { font-size:10px; color:#888; }
  .pillar-value { font-size:18px; font-weight:700; margin:4px 0; }
  .pillar-element { font-size:10px; color:#c8a864; }
  .section { margin:20px 0; page-break-inside:avoid; }
  .section-title { font-size:13px; font-weight:700; color:#c8a864; margin-bottom:8px; border-left:3px solid #c8a864; padding-left:10px; }
  .section-content { font-size:13px; line-height:1.8; color:#333; background:#f9f8f5; border-radius:8px; padding:14px; }
  .scores { display:flex; gap:10px; flex-wrap:wrap; margin:20px 0; padding:12px; background:#f0ede4; border-radius:8px; }
  .scores span { font-size:12px; color:#555; }
  .scores .overall { font-weight:700; color:#c8a864; }
  .footer { text-align:center; margin-top:30px; padding-top:16px; border-top:1px solid #eee; font-size:10px; color:#aaa; }
  @media print { body { padding:20px; } }
</style></head><body>
  <div class="header">
    <h1>통합 점술 상담 분석 결과</h1>
    <div class="meta">${new Date(session.created_at).toLocaleString("ko-KR")}</div>
    <div>
      <span class="badge">${qLabel}</span>
      ${session.final_confidence ? `<span class="badge">신뢰도 ${session.final_confidence}%</span>` : ""}
    </div>
  </div>

  <h2 style="font-size:16px;margin-bottom:8px;">📋 질문: ${session.question}</h2>
  ${session.memo ? `<p style="font-size:12px;color:#666;margin-bottom:8px;">고객 메모: ${session.memo}</p>` : ""}
  ${session.counselor_comment ? `<p style="font-size:12px;color:#666;margin-bottom:12px;">상담사 코멘트: ${session.counselor_comment}</p>` : ""}
  ${session.birth_date ? `<p style="font-size:12px;color:#666;">${session.gender === "male" ? "남" : "여"} • ${session.birth_date} • ${session.birth_time || "시간 미상"} • ${session.birth_place || ""} • ${session.is_lunar ? "음력" : "양력"}</p>` : ""}

  <div class="cards">
    ${cards.map((c: any, i: number) => {
      const spread = ["현재 상황", "핵심 문제", "숨겨진 원인", "조언", "가까운 결과"];
      const label = spread[i] || "추가 분석";
      return `<div class="card-item"><div class="pos">${label}</div><div class="name">${c.korean}</div><div class="dir">${c.isReversed ? "역방향" : "정방향"}</div></div>`;
    }).join("")}
  </div>

  ${sajuHtml}

  ${sections.map(s => `<div class="section"><div class="section-title">${s.title}</div><div class="section-content">${s.content}</div></div>`).join("")}

  ${scoresHtml}

  <div class="footer">통합 점술 상담 시스템 • ${new Date().toLocaleDateString("ko-KR")}</div>
</body></html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const downloadJSON = () => {
    try {
      // 1. 기본 세션 데이터 추출
      const {
        id, user_name, gender, birth_date, birth_time, birth_place, is_lunar,
        question, question_type, memo, counselor_comment, intent,
        cards, saju_data, ai_reading, status, created_at
      } = session;

      // 2. 점성술 및 자미두수 실시간 계산 (트랜짓 포함 실시간 컨텍스트 생성)
      let calculated_context: any = {};
      if (birth_date) {
        try {
          const [y, m, d] = birth_date.split("-").map(Number);
          const [hour, minute] = birth_time ? birth_time.split(":").map(Number) : [12, 0];
          
          const natal = calculateNatalChart(y, m, d, hour, minute);
          const transits = getCurrentTransits(natal);
          const ziwei = calculateZiWei(y, m, d, hour, minute, (gender as "male" | "female") || "female");

          calculated_context = {
            astrology: {
              natal_chart: natal,
              transits: transits,
              summary: natal.chartSummary,
            },
            ziwei: {
              chart: ziwei,
              key_palaces: ziwei.palaces?.slice(0, 3) || [],
            }
          };
        } catch (e) {
          console.error("Context calculation error for JSON export:", e);
        }
      }

      // 3. 표준 포맷 구조화 (V4 Dataset Standard)
      const standardFormat = {
        version: "v4.0-dataset-standard",
        export_metadata: {
          exported_at: new Date().toISOString(),
          source: "WhisperWind-Admin",
          session_id: id
        },
        user_profile: {
          name: user_name || "Anonymous",
          gender: gender || "unknown",
          birth: {
            date: birth_date,
            time: birth_time,
            place: birth_place,
            is_lunar: is_lunar
          }
        },
        input_data: {
          question: {
            text: question,
            type: question_type,
            intent: intent,
            memo: memo
          },
          tarot_cards: Array.isArray(cards) ? cards.map((c: any) => ({
            id: c.id,
            name: c.name,
            korean: c.korean,
            isReversed: c.isReversed
          })) : [],
          saju_data: saju_data // DB에 저장된 사주 데이터
        },
        calculated_context: calculated_context, // 실시간 계산된 점성술/자미두수 (트랜짓 포함)
        ai_analysis_result: ai_reading, // AI 응답 원본
        counselor_feedback: {
          comment: counselor_comment,
          final_scores: {
            tarot: session.tarot_score,
            saju: session.saju_score,
            astrology: session.astrology_score,
            ziwei: session.ziwei_score,
            overall: session.final_confidence
          }
        },
        status: status,
        created_at: created_at
      };

      const filename = `whisperwind_std_${user_name || "reading"}_${new Date(created_at).toISOString().split("T")[0]}.json`;
      const blob = new Blob([JSON.stringify(standardFormat, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("JSON export error:", err);
      alert("JSON 내보내기 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Customer Name */}
      <Card className="border-border bg-card">
        <CardContent className="p-5">
          <div className="text-sm font-medium text-muted-foreground mb-2">고객 이름</div>
          <div className="flex gap-2">
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="고객 이름을 입력하세요"
              className="flex-1"
            />
            <Button size="sm" onClick={saveUserName} disabled={savingName}>
              {savingName ? "저장중..." : "저장"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Question & Birth info */}
      <Card className="border-border bg-card">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="border-gold/30 text-gold">
              {questionTypeLabels[qType] || "🔮 종합"}
            </Badge>
            <span className="text-[11px] text-muted-foreground">
              {new Date(session.created_at).toLocaleString("ko-KR")}
            </span>
            {session.final_confidence && (
              <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
                신뢰도 {session.final_confidence}%
              </Badge>
            )}
            <Badge variant="outline" className={`text-[10px] ${session.status === "pending" ? "border-yellow-500/30 text-yellow-400" :
              session.status === "analyzing" ? "border-blue-500/30 text-blue-400" :
                session.status === "completed" ? "border-green-500/30 text-green-400" :
                  "border-red-500/30 text-red-400"
              }`}>
              {session.status === "pending" ? "대기중" : session.status === "analyzing" ? "분석중" : session.status === "completed" ? "완료" : session.status}
            </Badge>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/30 p-4 sm:grid-cols-4">
            <div>
              <div className="text-[10px] text-muted-foreground">질문 의도</div>
              <div className="mt-1 text-[13px] font-medium text-accent">{session.intent || "분석 전"}</div>
            </div>

            <div>
              <div className="text-[10px] text-muted-foreground">정체성</div>
              <div className="mt-1 text-[13px] font-medium text-gold">{session.analysis_mode === "tarot_focus" ? "타로 중심" : "종합 분석"}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">신뢰도</div>
              <div className="mt-1 text-[13px] font-medium text-foreground">{session.confidence ? (session.confidence * 100).toFixed(0) + "%" : "0%"}</div>
            </div>
          </div>

          <div className="mt-3 text-lg font-medium text-foreground">{session.question}</div>
          {session.memo && (
            <div className="mt-2 rounded-lg bg-secondary p-3 text-sm text-muted-foreground">{session.memo}</div>
          )}
          {session.birth_date && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{session.gender === "male" ? "남" : "여"}</span>
              <span>•</span>
              <span>{session.birth_date}</span>
              {session.birth_time && <><span>•</span><span>{session.birth_time}</span></>}
              {session.birth_place && <><span>•</span><span>{session.birth_place}</span></>}
              <span>•</span>
              <span>{session.is_lunar ? "음력" : "양력"}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Counselor comment */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground">📝 상담사 코멘트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={counselorComment}
            onChange={(e) => setCounselorComment(e.target.value)}
            className="min-h-[110px] border-border bg-secondary"
            placeholder="분석 결과에 대한 상담사 메모/코멘트를 입력하세요"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">저장 후 목록을 바꿔도 코멘트가 유지됩니다.</p>
            <Button
              size="sm"
              className="rounded-full"
              onClick={saveCounselorComment}
              disabled={savingComment || (counselorComment.trim() || "") === (session.counselor_comment || "")}
            >
              {savingComment ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              코멘트 저장
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result page link */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 rounded-lg border-gold/30 text-gold hover:bg-gold/10"
          onClick={() => window.open(`/reader/result/${session.id}`, "_blank")}
        >
          📋 결과 페이지 열기
        </Button>
      </div>

      {session.birth_date && (() => {
        const sd = session.saju_data as any;
        // 새 포맷: yearPillar.cheongan 존재 여부로 판단
        const hasNewFormat = !!(sd?.yearPillar?.cheongan || sd?.yearPillar?.full);
        const pillars = [
          { label: "연주", p: hasNewFormat ? sd.yearPillar : (sd?.연주) },
          { label: "월주", p: hasNewFormat ? sd.monthPillar : (sd?.월주) },
          { label: "일주", p: hasNewFormat ? sd.dayPillar : (sd?.일주) },
          { label: "시주", p: hasNewFormat ? sd.hourPillar : (sd?.시주) },
        ];
        // 일간: 새 포맷은 dayPillar.cheongan, 구 포맷은 일간/ilgan 필드
        const ilgan = sd?.dayPillar?.cheongan || sd?.일간 || sd?.ilgan || null;
        return (
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-foreground">🔮 사주 데이터</CardTitle>
                {hasNewFormat ? (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">✓ 자동 계산 완료</Badge>
                ) : (
                  <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-[10px]">수동 입력 필요</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* ── 사주 4주 카드 ── */}
              <div className="grid grid-cols-4 gap-2">
                {pillars.map(({ label, p }) => (
                  <div key={label} className="rounded-lg border border-border bg-secondary p-2 text-center">
                    <div className="text-[10px] text-muted-foreground">{label}</div>
                    {/* 한글 전체 이름 (예: 임술, 계축) */}
                    <div className="mt-1 text-base font-bold text-foreground">
                      {p ? (p.full || `${p.cheongan || p.천간 || ""}${p.jiji || p.지지 || ""}`) : "?"}
                    </div>
                    {/* 한자 (예: 壬戌, 癸丑) — hanja 필드 우선 */}
                    <div className="text-[10px] text-gold">
                      {p ? (p.hanja || p.한자 || "") : ""}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── 음력→양력 변환 정보 ── */}
              {sd?.originalInput?.isLunar && sd?.solarDate && (
                <p className="text-xs text-muted-foreground">
                  🗓 음력 {sd.originalInput.year}-{sd.originalInput.month}-{sd.originalInput.day} → 양력 {sd.solarDate.year}-{sd.solarDate.month}-{sd.solarDate.day}
                </p>
              )}

              {/* ── 포스텔러 수동입력 토글 ── */}
              {hasNewFormat && (
                <div>
                  <button
                    onClick={() => setShowForcetellInput(!showForcetellInput)}
                    className="text-xs text-muted-foreground/70 hover:text-muted-foreground underline underline-offset-2 decoration-dashed transition-colors"
                  >
                    사주 결과가 다르게 느껴지시나요? {showForcetellInput ? "▲" : "▼"}
                  </button>
                </div>
              )}

              {/* ── 수동 입력 영역 ── */}
              {(!hasNewFormat || showForcetellInput) && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-muted-foreground">
                    포스텔러 만세력에서 확인한 결과를 붙여넣어 주세요. 수동 입력값이 있으면 자동 계산 대신 이 데이터를 사용합니다.
                  </p>
                  <a
                    href="https://pro.forceteller.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    🔗 포스텔러 바로가기
                  </a>
                  <Textarea
                    value={forcetellData}
                    onChange={(e) => setForcetellData(e.target.value.slice(0, 3000))}
                    className="min-h-[120px] border-border bg-secondary text-xs font-mono"
                    placeholder={`예시:\n연주: 갑자(甲子) / 월주: 정묘(丁卯) / 일주: 임오(壬午) / 시주: 경술(庚戌)\n일간: 임수(壬水), 신약\n오행: 목2 화3 토1 금1 수1\n용신: 금(金)\n합충: 자오충, 묘술합`}
                  />
                  <p className="text-[10px] text-muted-foreground">{forcetellData.length}/3000자</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })()}

      {/* AI Analysis Buttons - 수동 분석 (항상 표시) */}
      <Card className="border-border bg-card">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">🔮 AI 분석 실행 (v8)</div>
            {session.status === "completed" && (
              <Badge variant="outline" className="border-green-500/30 text-green-400 text-[10px]">
                분석 완료됨
              </Badge>
            )}
          </div>

          {session.status === "completed" && (
            <p className="text-xs text-yellow-400/80">
              ⚠️ 이미 분석이 완료되었습니다. 다시 실행하면 기존 결과를 덮어씁니다.
            </p>
          )}

          {/* 메인 버튼: AI 분석 (v2) */}
          <div className="flex gap-2 w-full">
            <Button
              className="w-1/2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 text-white font-medium shadow-lg"
              onClick={() => runAIAnalysisV2('hanna')}
              disabled={analyzing}
            >
              {analyzingStyle === 'hanna' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  진행 중...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {session.status === "completed" && session.ai_reading?.tarot_reading?.choihanna ? "최한나 완료" : "최한나 분석 실행"}
                </>
              )}
            </Button>

            <Button
              className="w-1/2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow-lg"
              onClick={() => runAIAnalysisV2('monad')}
              disabled={analyzing}
            >
              {analyzingStyle === 'monad' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  진행 중...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {session.status === "completed" && session.ai_reading?.tarot_reading?.monad ? "모나드 완료" : "모나드 분석 실행"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {
        analysisError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-3">
              <p className="text-xs text-destructive">{analysisError}</p>
            </CardContent>
          </Card>
        )
      }




      {/* Cards */}
      <div className="grid gap-3 md:grid-cols-3">
        {(session.cards as any[])?.map((card: any, idx: number) => (
          <Card key={card.id} className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {idx === 0 ? "현재" : idx === 1 ? "문제" : "결과"}
                </span>
                <Badge variant="outline" className="rounded-full border-gold/30 text-gold text-[10px]">
                  {card.isReversed ? "역방향" : "정방향"}
                </Badge>
              </div>
              <div className="text-base font-semibold text-foreground">
                {card.korean}
                <span className="ml-1 font-display text-sm text-muted-foreground">{card.name}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Reading - V4 format (4-system stable pipeline) */}
      {
        reading && reading.merged_reading && (
          <Card className="border-border bg-card glow-gold">
            <CardHeader className="border-b border-border/10 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                  <Sparkles className="h-5 w-5 text-gold" />
                  ✦ 통합 운명학 분석 (Professional v4)
                </CardTitle>
                <Badge variant="outline" className="border-gold/30 text-gold text-[10px]">Stable Pipeline</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* 1. Integrated Summary */}
              <div className="p-6 bg-gold/5 border-b border-border/10">
                <div className="mb-3 text-xs font-bold text-gold tracking-widest uppercase">✨ 통합 분석 요약 (Integrated Summary)</div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-medium">{renderSafe(reading.merged_reading.coreReading)}</p>
              </div>

              {/* 6. Practical Advice - Moved up to be below Summary */}
              <div className="p-6 bg-accent/5 border-b border-border/10">
                <div className="mb-3 text-sm font-bold text-accent">💡 종합 관점 제언</div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap italic">"{renderSafe(reading.merged_reading.finalAdvice)}"</p>
              </div>

              {/* 1-1. Choi Hanna Tarot (v4 Detail) */}
              {reading.tarot_reading?.choihanna && (
                <div className="p-6 border-b border-border/10">
                  <div className="mb-3 text-xs font-bold text-purple-400 tracking-widest uppercase">💫 카드별 1줄 해석</div>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap mb-3">{renderSafe(reading.tarot_reading.choihanna.story)}</p>
                  {reading.tarot_reading.choihanna.key_message && (
                    <p className="text-xs text-gold font-medium italic">💎 {renderSafe(reading.tarot_reading.choihanna.key_message)}</p>
                  )}
                </div>
              )}

              {/* 1-2. Monad Tarot (v4 Detail) */}
              {reading.tarot_reading?.monad && (
                <div className="p-6 border-b border-border/10 bg-secondary/5">
                  <div className="mb-3 text-xs font-bold text-blue-400 tracking-widest uppercase">🔷 카드별 1줄 해석</div>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap mb-3">{renderSafe(reading.tarot_reading.monad.story)}</p>
                  {reading.tarot_reading.monad.key_message && (
                    <p className="text-xs text-gold font-medium italic">💎 {renderSafe(reading.tarot_reading.monad.key_message)}</p>
                  )}
                </div>
              )}


              {/* 3. Cross-System Consensus */}
              {reading.engine && (
                <div className="p-6 border-b border-border/10 bg-secondary/10">
                  <div className="mb-4 text-xs font-bold text-muted-foreground tracking-widest uppercase">⚖️ 다중 시스템 합의 검증 (Cross-System Consensus)</div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <div className="mb-2 text-[10px] font-semibold text-muted-foreground">System Weights</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(reading.engine.system_weights || {}).map(([sys, weight]) => (
                          <div key={sys} className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background px-2 py-0.5">
                            <span className="text-[9px] font-medium text-muted-foreground uppercase">{sys}</span>
                            <span className="text-[10px] font-bold text-foreground">{(weight as number * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 text-[10px] font-semibold text-muted-foreground">Alignment Analysis</div>
                      <div className="space-y-1">
                        {reading.engine.consensus?.alignment_matrix?.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">{item.pair}</span>
                            <span className={item.similarity > 0.5 ? "text-emerald-400 font-bold" : "text-amber-400"}>{(item.similarity * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Temporal Prediction */}
              {reading.engine?.timeline && (
                <div className="p-6 border-b border-border/10">
                  <div className="mb-4 text-xs font-bold text-emerald-400 tracking-widest uppercase">⏰ 시간 흐름 예측 (Temporal Prediction)</div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {reading.engine.timeline.map((node: any, i: number) => (
                      <div key={i} className="rounded-xl border border-border bg-background p-3 shadow-sm">
                        <div className="mb-1 text-[10px] font-bold text-emerald-400">{node.window || node.period}</div>
                        <div className="mb-2 text-lg font-bold text-foreground">
                          {(node.probability * 100).toFixed(0)}% 
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">({node.label || "변화 가능성"})</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-muted-foreground">{renderSafe(node.description || node.eventDescriptor)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. System Interpretations (Detailed Logs) */}
              <div className="border-b border-border/10">
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between p-6 text-xs font-bold text-muted-foreground hover:bg-secondary/50 transition-colors uppercase tracking-widest">
                    <span>🔍 개별 시스템 계산 로그 (System Calculations)</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="p-6 space-y-8 bg-secondary/20">
                    {/* Engine Calculation Data */}
                    {reading.engine && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-px flex-1 bg-border/50" />
                          <span className="text-[10px] font-bold text-accent uppercase">Engine Calculation</span>
                          <div className="h-px flex-1 bg-border/50" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-3">
                            <div>
                              <div className="mb-1 text-[10px] text-muted-foreground uppercase">Pattern Vector</div>
                              <div className="flex flex-wrap gap-1">
                                {reading.engine.vectors?.flatMap((v: any) => v.patterns || []).slice(0, 5).map((p: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-[10px] bg-accent/10 text-accent border-accent/20">{p}</Badge>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="rounded bg-secondary/30 p-2 border border-border/20">
                                <div className="text-[9px] text-muted-foreground">Consensus Score</div>
                                <div className="text-sm font-bold text-foreground">{reading.engine.consensus?.consensus_score?.toFixed(2) || "0.00"}</div>
                              </div>
                              <div className="rounded bg-secondary/30 p-2 border border-border/20">
                                <div className="text-[9px] text-muted-foreground">Confidence Score</div>
                                <div className="text-sm font-bold text-gold">{reading.engine.consensus?.confidence_score?.toFixed(2) || "0.00"}</div>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-lg bg-background p-3 border border-border/50">
                            <div className="mb-2 text-[10px] font-semibold text-muted-foreground uppercase">Semantic Dimensions</div>
                            <div className="space-y-1.5">
                              {Object.entries(reading.engine.consensus?.dominant_vector || {}).slice(0, 5).map(([dim, val]) => (
                                <div key={dim} className="flex items-center justify-between">
                                  <span className="text-[10px] text-muted-foreground">{dim}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="h-1 w-20 rounded-full bg-secondary">
                                      <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (val as number) * 100)}%` }} />
                                    </div>
                                    <span className="text-[10px] font-mono">{(val as number).toFixed(2)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Bazi Detail */}
                    {reading.saju_analysis && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-px flex-1 bg-border/50" />
                          <span className="text-[10px] font-bold text-accent uppercase">Bazi Extraction</span>
                          <div className="h-px flex-1 bg-border/50" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-lg bg-background p-4 border border-border/50">
                            <div className="mb-2 text-[10px] font-semibold text-muted-foreground uppercase">Calculation Summary</div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">일간(Day Master)</span><span className="font-bold">{renderSafe(reading.saju_analysis.dayMaster)}</span></div>
                              <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">강약(Strength)</span><span className="text-primary font-bold">{renderSafe(reading.saju_analysis.strength)}</span></div>
                              <div className="pt-2">
                                <div className="mb-1 text-[9px] text-muted-foreground italic">오행 분포 (Elements)</div>
                                <div className="flex gap-1">
                                  {Object.entries(reading.saju_analysis.elements || {}).map(([el, count]) => (
                                    <div key={el} className="flex-1 text-center bg-secondary/50 rounded py-1">
                                      <div className="text-[9px]">{el}</div>
                                      <div className="text-[10px] font-bold">{count as number}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase">Narrative Logic</div>
                            <p className="text-[11px] leading-relaxed text-foreground/80 bg-background p-3 rounded-lg border border-border/50">{renderSafe(reading.saju_analysis.narrative)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Astrology Detail */}
                    {reading.astrology_data && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2"><div className="h-px flex-1 bg-border/50" /><span className="text-[10px] font-bold text-emerald-400 uppercase">Astrology Logic</span><div className="h-px flex-1 bg-border/50" /></div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-lg bg-background p-3 border border-border/50 col-span-2">
                            <div className="mb-2 text-[10px] font-semibold text-muted-foreground uppercase">Planet Positions</div>
                            <div className="grid grid-cols-3 gap-2">
                              {reading.astrology_data.planet_positions?.map((p: any, i: number) => (
                                <div key={i} className="text-[11px]"><span className="text-muted-foreground">{renderSafe(p.planet)}:</span> <span className="font-medium">{renderSafe(p.sign)} {p.degree}°</span></div>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-lg bg-background p-3 border border-border/50">
                            <div className="mb-2 text-[10px] font-semibold text-muted-foreground uppercase">House Systems</div>
                            {Object.entries(reading.astrology_data.house_positions || {}).map(([h, s]) => (
                              <div key={h} className="text-[11px] flex justify-between"><span className="text-muted-foreground">{h}:</span> <span>{renderSafe(s)}</span></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ziwei Detail */}
                    {reading.ziwei_data && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2"><div className="h-px flex-1 bg-border/50" /><span className="text-[10px] font-bold text-purple-400 uppercase">Ziwei Palaces</span><div className="h-px flex-1 bg-border/50" /></div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-background p-3 border border-border/50">
                            <div className="mb-2 text-[10px] font-semibold text-muted-foreground uppercase">Key Palaces</div>
                            <div className="space-y-1">
                              {reading.ziwei_data.palaces?.map((p: any, i: number) => (
                                <div key={i} className="text-[11px] flex justify-between"><span className="text-muted-foreground">{renderSafe(p.name)} ({renderSafe(p.location)}):</span> <span className="font-bold">{Array.isArray(p.main_stars) ? p.main_stars.map((s: any) => renderSafe(s)).join(', ') : renderSafe(p.main_stars)}</span></div>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-lg bg-background p-3 border border-border/50">
                            <div className="mb-2 text-[10px] font-semibold text-muted-foreground uppercase">Four Transformations (사화)</div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              {Object.entries(reading.ziwei_data.four_transformations || {}).map(([k, v]) => (
                                <div key={k} className="text-[11px] flex justify-between"><span className="text-muted-foreground">{k === 'rok' ? '화록' : k === 'gwon' ? '화권' : k === 'gwa' ? '화과' : '화기'}:</span> <span>{renderSafe(v)}</span></div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Numerology Detail */}
                    {reading.numerology_data && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2"><div className="h-px flex-1 bg-border/50" /><span className="text-[10px] font-bold text-blue-400 uppercase">Numerology Analytics</span><div className="h-px flex-1 bg-border/50" /></div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-lg bg-background p-3 border border-border/50 shadow-sm">
                            <div className="text-[9px] text-muted-foreground uppercase font-semibold">Life Path</div>
                            <div className="text-2xl font-black text-blue-400">{reading.numerology_data.life_path_number}</div>
                            <div className="text-[10px] text-muted-foreground mt-1 text-xs">삶의 근본적 목적과 방향</div>
                          </div>
                          <div className="rounded-lg bg-background p-3 border border-border/50 shadow-sm">
                            <div className="text-[9px] text-muted-foreground uppercase font-semibold">Personal Year</div>
                            <div className="text-2xl font-black text-emerald-400">{reading.numerology_data.personal_year}</div>
                            <div className="text-[10px] text-muted-foreground mt-1 text-xs">현재 년도의 지배적 진동</div>
                          </div>
                          <div className="rounded-lg bg-background p-3 border border-border/50 shadow-sm">
                            <div className="text-[9px] text-muted-foreground uppercase font-semibold">Destiny Number</div>
                            <div className="text-2xl font-black text-purple-400">{reading.numerology_data.destiny_number}</div>
                            <div className="text-[10px] text-muted-foreground mt-1 text-xs">잠재적 능력과 성취 방향</div>
                          </div>
                        </div>
                        {reading.numerology_data.vibrations && (
                          <div className="rounded-lg bg-background p-4 border border-border/50">
                            <div className="mb-2 text-[10px] font-semibold text-muted-foreground uppercase">Energy Vibrations (에너지 흐름)</div>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(reading.numerology_data.vibrations).map(([k, v]) => (
                                <div key={k} className="rounded bg-blue-500/5 px-2 py-1.5 border border-blue-500/10">
                                  <div className="text-[9px] text-blue-400 font-bold uppercase">{k}</div>
                                  <div className="text-[11px] text-foreground font-medium">{renderSafe(v)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Tarot Detail */}
                    {reading.tarot_symbolic && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2"><div className="h-px flex-1 bg-border/50" /><span className="text-[10px] font-bold text-amber-400 uppercase">Tarot Symbolic Analytics</span><div className="h-px flex-1 bg-border/50" /></div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-background p-3 border border-border/50">
                            <div className="mb-2 text-[10px] font-semibold text-muted-foreground uppercase">Question Classification</div>
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[11px]">{reading.tarot_symbolic.category}</Badge>
                          </div>
                          <div className="rounded-lg bg-background p-3 border border-border/50">
                            <div className="mb-2 text-[10px] font-semibold text-muted-foreground uppercase">Dominant Patterns</div>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(reading.tarot_symbolic.dominant_patterns || {})
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .slice(0, 5)
                                .map(([p, v]) => (
                                  <div key={p} className="text-[9px] bg-secondary px-1.5 py-0.5 rounded border border-border/50">
                                    {p} ({(v as number).toFixed(2)})
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              </div>



              {/* 7. Validation Score */}
              {reading.engine?.validation && (
                <div className="p-4 bg-background border-t border-border/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${reading.engine.validation.isValid ? "bg-emerald-500" : "bg-amber-500"}`} />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Validation Layer : {reading.engine.validation.message}</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-[9px]"><span className="text-muted-foreground">Pattern Consistency:</span> <span className="text-foreground font-mono">{(reading.engine.validation.pattern_consistency || 0.75).toFixed(2)}</span></div>
                    <div className="text-[9px]"><span className="text-muted-foreground">Cross-System Alignment:</span> <span className="text-foreground font-mono">{(reading.engine.consensus?.consensus_score || 0).toFixed(2)}</span></div>
                  </div>
                </div>
              )}

              {/* System Interpretations (Detailed Logs) */}
            </CardContent>
          </Card>
        )
      }

      {/* AI Reading - V2 format (6-system legacy) */}
      {
        reading && reading.individual_readings && !reading.merged_reading && (
          <Card className="border-border bg-card glow-gold">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-foreground">✦ 6체계 통합 분석 (v2)</CardTitle>
                {reading.final_reading?.grade && (
                  <Badge className={`text-sm font-bold px-3 py-1 ${reading.final_reading.grade === "S" ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black" :
                    reading.final_reading.grade === "A" ? "bg-gradient-to-r from-purple-600 to-violet-500 text-white" :
                      reading.final_reading.grade === "B" ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white" :
                        "bg-secondary text-muted-foreground"
                    }`}>
                    {reading.final_reading.grade}등급
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title & Summary */}
              {reading.final_reading?.title && (
                <div className="rounded-lg border border-gold/20 bg-gold/5 p-5">
                  <h3 className="mb-2 text-base font-bold text-gold">{reading.final_reading.title}</h3>
                  {reading.final_reading.summary && (
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{renderSafe(reading.final_reading.summary)}</p>
                  )}
                </div>
              )}

              {/* Convergence */}
              {reading.convergence && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-primary">⚖️ 수렴 분석</div>
                    <Badge variant="outline" className="border-gold/30 text-gold text-[10px]">
                      {reading.convergence.converged_count || 0}/6 수렴
                    </Badge>
                  </div>
                  {reading.convergence.converged_systems?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {reading.convergence.converged_systems.map((s: string, i: number) => (
                        <Badge key={i} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">✓ {s}</Badge>
                      ))}
                    </div>
                  )}
                  {reading.convergence.divergent_systems?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {reading.convergence.divergent_systems.map((s: string, i: number) => (
                        <Badge key={i} variant="outline" className="border-orange-500/30 text-orange-400 text-[10px]">✗ {s}</Badge>
                      ))}
                    </div>
                  )}
                  {reading.convergence.common_message && (
                    <p className="text-sm text-foreground">{renderSafe(reading.convergence.common_message)}</p>
                  )}
                  {reading.convergence.divergent_reason && (
                    <p className="text-xs text-orange-400/80 italic">{reading.convergence.divergent_reason}</p>
                  )}
                </div>
              )}

              {/* Individual Systems */}
              {[
                { key: "tarot", icon: "🃏", label: "웨이트 타로" },
                { key: "choi_hanna_tarot", icon: "💫", label: "카드별 1줄 해석" },
                { key: "monad_tarot", icon: "🔷", label: "카드별 1줄 해석" },
                { key: "saju", icon: "🔮", label: "사주팔자" },
                { key: "astrology", icon: "⭐", label: "서양 점성술" },
                { key: "ziwei", icon: "🏯", label: "자미두수" },
              ].map(({ key, icon, label }) => {
                const sys = reading.individual_readings?.[key];
                if (!sys?.detail) return null;
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{icon} {label}</div>
                      {sys.direction && <span className="text-[10px] text-gold italic">{renderSafe(sys.direction)}</span>}
                    </div>
                    {sys.keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {sys.keywords.map((kw: string, i: number) => (
                          <Badge key={i} variant="outline" className="border-gold/30 text-gold text-[10px]">{renderSafe(kw)}</Badge>
                        ))}
                      </div>
                    )}
                    {sys.cards?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {sys.cards.map((c: any, i: number) => (
                          <div key={i} className="rounded bg-secondary/50 px-2 py-1 text-[11px]">
                            <span className="text-muted-foreground">{renderSafe(c.position)} </span>
                            <span className="font-medium text-foreground">{renderSafe(c.card)}</span>
                            <span className={c.orientation === "역" ? "text-red-400" : "text-emerald-400"}> ({renderSafe(c.orientation)})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="rounded-lg border border-border bg-secondary p-4 text-foreground">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderSafe(sys.detail)}</p>
                    </div>
                  </div>
                );
              })}

              {/* Tarot Deep Details (Hanna/Monad) in Legacy UI */}
              {reading.tarot_reading?.choihanna && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-purple-400 tracking-wider uppercase">💫 카드별 1줄 해석</div>
                  <div className="rounded-lg border border-border bg-purple-500/5 p-4 text-foreground">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderSafe(reading.tarot_reading.choihanna.story)}</p>
                    {reading.tarot_reading.choihanna.key_message && (
                      <p className="mt-3 text-xs text-gold font-medium italic">💎 {renderSafe(reading.tarot_reading.choihanna.key_message)}</p>
                    )}
                  </div>
                </div>
              )}

              {reading.tarot_reading?.monad && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-blue-400 tracking-wider uppercase">🔷 카드별 1줄 해석</div>
                  <div className="rounded-lg border border-border bg-blue-500/5 p-4 text-foreground">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderSafe(reading.tarot_reading.monad.story)}</p>
                    {reading.tarot_reading.monad.key_message && (
                      <p className="mt-3 text-xs text-gold font-medium italic">💎 {renderSafe(reading.tarot_reading.monad.key_message)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Time Flow */}
              {reading.final_reading?.time_flow && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">⏰ 시간 흐름</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { label: "과거 영향", value: reading.final_reading.time_flow.past_influence, color: "text-slate-400" },
                      { label: "현재 상황", value: reading.final_reading.time_flow.present_situation, color: "text-gold" },
                      { label: "3개월 전망", value: reading.final_reading.time_flow.near_future, color: "text-emerald-400" },
                      { label: "6개월~1년", value: reading.final_reading.time_flow.long_term, color: "text-purple-400" },
                    ].filter(item => item.value).map((item, i) => (
                      <div key={i} className="rounded-lg bg-secondary/30 p-3">
                        <div className={`text-[10px] font-medium ${item.color}`}>{item.label}</div>
                        <p className="mt-1 text-xs text-foreground leading-relaxed">{renderSafe(item.value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advice */}
              {reading.final_reading?.advice && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-5">
                  <div className="mb-2 text-xs font-semibold text-green-400">💡 실천 조언</div>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{renderSafe(reading.final_reading.advice)}</p>
                </div>
              )}

              {/* Caution */}
              {reading.final_reading?.caution && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <div className="mb-1 text-[11px] text-destructive">⚠️ 주의사항</div>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{renderSafe(reading.final_reading.caution)}</p>
                </div>
              )}

              {/* Lucky Elements */}
              {reading.final_reading?.lucky_elements && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">🍀 행운 요소</div>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {[
                      { label: "색상", value: reading.final_reading.lucky_elements.color, emoji: "🎨" },
                      { label: "숫자", value: reading.final_reading.lucky_elements.number, emoji: "🔢" },
                      { label: "방위", value: reading.final_reading.lucky_elements.direction, emoji: "🧭" },
                      { label: "시간", value: reading.final_reading.lucky_elements.time, emoji: "⏰" },
                      { label: "요일", value: reading.final_reading.lucky_elements.day, emoji: "📅" },
                    ].filter(item => item.value).map((item, i) => (
                      <div key={i} className="rounded-lg bg-secondary/30 p-2">
                        <div className="text-lg">{item.emoji}</div>
                        <div className="text-[9px] text-muted-foreground">{item.label}</div>
                        <div className="text-xs font-medium text-gold">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        )
      }

      {/* AI Reading - V1 format (legacy) */}
      {
        reading && !reading.individual_readings && reading.conclusion && (
          <Card className="border-border bg-card glow-gold">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">AI 교차 검증 분석 (v1)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reading.conclusion && (
                <div className="rounded-lg border border-gold/20 bg-gold/5 p-5">
                  <div className="mb-2 text-xs font-semibold text-gold">✦ 최종 결론</div>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{renderSafe(reading.conclusion)}</p>
                </div>
              )}
              {[
                { label: "🃏 카드 해석", content: reading.tarotAnalysis },
                { label: "🃏 카드 상호작용", content: reading.tarotCardInteraction },
                ...(saju ? [
                  { label: "🔮 사주 분석", content: reading.sajuAnalysis },
                  { label: "🔮 사주 시간축", content: reading.sajuTimeline },
                  { label: "⭐ 점성술", content: reading.astrologyAnalysis },
                  { label: "⭐ 트랜짓", content: reading.astrologyTransits },
                  { label: "🏯 자미두수", content: reading.ziweiAnalysis },
                  { label: "🏯 인생 구조", content: reading.ziweiLifeStructure },
                  { label: "⚖️ 교차 검증", content: reading.crossValidation },
                  { label: "⚖️ 매트릭스", content: reading.crossValidationMatrix },
                ] : []),
                { label: "⏰ 시기", content: reading.timing },
                { label: "⚠️ 리스크", content: reading.risk },
                { label: "🔍 숨겨진 패턴", content: reading.hiddenPattern },
                { label: "💡 조언", content: reading.advice },
              ].filter(s => s.content).map((section, i) => (
                <div key={i} className="rounded-lg border border-border bg-secondary p-4">
                  <div className="mb-1 text-[11px] text-muted-foreground">{section.label}</div>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{renderSafe(section.content)}</p>
                </div>
              ))}
              {reading.scores && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-[10px]">타로: {reading.scores.tarot}%</Badge>
                  {saju && <Badge variant="secondary" className="text-[10px]">사주: {reading.scores.saju}%</Badge>}
                  {reading.scores.astrology != null && <Badge variant="secondary" className="text-[10px]">점성술: {reading.scores.astrology}%</Badge>}
                  {reading.scores.ziwei != null && <Badge variant="secondary" className="text-[10px]">자미두수: {reading.scores.ziwei}%</Badge>}
                  <Badge variant="outline" className="border-gold/30 text-gold text-[10px]">종합: {reading.scores.overall}%</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )
      }

      {/* Global Reading Actions - (FORCED ADMIN TOOLS) */}
      {session.status === "completed" && (
        <Card className="border-border bg-card glow-gold">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-full border-border/50 text-xs"
                  onClick={() => { onUpdate({ ...session, ai_reading: null, status: "pending" }); }}>
                  <RefreshCw className="mr-1.5 h-3 w-3" />재분석
                </Button>
                <Button variant="outline" size="sm" className="rounded-full border-gold/30 text-gold text-xs" onClick={downloadPDF}>
                  <Download className="mr-1.5 h-3 w-3" />리포트 저장 (PDF)
                </Button>
                <Button variant="outline" size="sm" className="rounded-full border-blue-500/30 text-blue-400 text-xs bg-blue-500/5 hover:bg-blue-500/10" onClick={downloadJSON}>
                  <FileJson className="mr-1.5 h-3 w-3" />JSON 내보내기
                </Button>
              </div>

              <div className="flex gap-2 ml-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full border-emerald-500/30 text-emerald-400 text-xs bg-emerald-500/5 hover:bg-emerald-500/10"
                  onClick={() => {
                    const text = reading.management_tracks?.consultation_copy || reading.integrated_summary;
                    navigator.clipboard.writeText(text);
                    alert("상담사용 문구가 클립보드에 복사되었습니다.");
                  }}
                >
                  <ClipboardCopy className="mr-1.5 h-3 w-3" />상담문구 복사
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full border-slate-500/30 text-slate-400 text-xs bg-slate-500/5 hover:bg-slate-500/10"
                  onClick={() => {
                    const json = reading.management_tracks?.llm_origin_json || reading;
                    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
                    alert("LLM 원본 JSON이 클립보드에 복사되었습니다.");
                  }}
                >
                  <Code className="mr-1.5 h-3 w-3" />원본 JSON 복사
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {
        analyzing && (
          <Card className="border-border bg-card">
            <CardContent className="py-10 text-center">
              <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-gold" />
              <p className="text-sm text-muted-foreground">AI 분석 진행 중...</p>
            </CardContent>
          </Card>
        )
      }
    </div >
  );

}

