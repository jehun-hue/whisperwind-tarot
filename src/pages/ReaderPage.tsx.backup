import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lock, Trash2, RefreshCw, Sparkles, Loader2, Download, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateSaju, getSajuTarotCrossKeywords, getSajuForQuestion } from "@/lib/saju";
import { calculateNatalChart, getAstrologyForQuestion, getCurrentTransits } from "@/lib/astrology";
import { calculateZiWei, getZiWeiForQuestion } from "@/lib/ziwei";
import { getCombinationSummary } from "@/data/tarotCombinations";
import { calculateManseryeokSaju } from "@/lib/manseryeokCalc";

const READER_PIN = "1234";

type QuestionType = "love" | "career" | "money" | "general";

const questionTypeLabels: Record<string, string> = {
  love: "💕 연애",
  career: "💼 직업/사업",
  money: "💰 금전",
  general: "🔮 종합",
  feelings: "💭 기持ち",
  reunion: "🔄 復縁",
  relationship: "💫 관계",
  contact: "📱 연락",
  life: "🌟 인생",
  spiritual: "✨ 영적",
  jobchange: "🔀 전직",
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
  status: string;
  created_at: string;
  user_name: string | null;
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
    if (!error && data) setSessions(data as ReadingSession[]);
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
                  className={`group cursor-pointer rounded-lg border p-3 transition-all ${
                    selectedSession?.id === s.id
                      ? "border-gold/40 bg-gold/5"
                      : "border-border bg-secondary hover:bg-muted"
                  }`}
                  onClick={() => setSelectedSession(s)}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                       <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-medium text-foreground">
                          {s.user_name ? `[${s.user_name}] ` : ""}{s.question || "질문 없음"}
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
            <SessionDetail session={selectedSession} onUpdate={updateSession} />
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
  const [analyzing, setAnalyzing] = useState(false);
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
    setAnalysisError(null);
    setAnalyzing(true);
    try {
      // Update status to analyzing
      await supabase.from("reading_sessions").update({ status: "analyzing" }).eq("id", session.id);

      const cards = session.cards as any[];
      const birthInfo = session.birth_date ? {
        gender: session.gender,
        birthDate: session.birth_date,
        birthTime: session.birth_time || "",
        birthPlace: session.birth_place || "",
        isLunar: session.is_lunar || false,
      } : null;

      // Calculate astrology & ziwei data from birth info
      let astroDataForAI = null;
      let ziweiDataForAI = null;
      let sajuDataForAI = saju;
      let manseryeokDataForAI = null;

      if (birthInfo && birthInfo.birthDate) {
        try {
          const [y, m, d] = birthInfo.birthDate.split("-").map(Number);
          const hour = birthInfo.birthTime ? parseInt(birthInfo.birthTime.split(":")[0]) : 12;
          const minute = birthInfo.birthTime ? parseInt(birthInfo.birthTime.split(":")[1]) : 0;

          // Manseryeok auto-calculation
          try {
            manseryeokDataForAI = calculateManseryeokSaju(y, m, d, hour, minute, birthInfo.isLunar as boolean);
          } catch (e) {
            console.error("Manseryeok calc error:", e);
          }

          if (!sajuDataForAI) {
            const sajuResult = calculateSaju(y, m, d, hour);
            sajuDataForAI = {
              ...sajuResult,
              crossKeywords: getSajuTarotCrossKeywords(sajuResult, cards.map((c: any) => c.suit)),
              questionAnalysis: getSajuForQuestion(sajuResult, qType as any),
            };
          }

          const astro = calculateNatalChart(y, m, d, hour);
          astroDataForAI = {
            ...astro,
            questionAnalysis: getAstrologyForQuestion(astro, qType as any),
            transits: getCurrentTransits(astro),
          };

          const ziwei = calculateZiWei(y, m, d, hour, (birthInfo.gender as "male" | "female") || "female");
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
          manseryeokData: manseryeokDataForAI,
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
      setAnalyzing(false);
    }
  };

  const runAIAnalysisV2 = async () => {
    setAnalyzing(true);
    try {
      await supabase.from("reading_sessions").update({ status: "analyzing" }).eq("id", session.id);

      const cards = session.cards as any[];
      const birthInfo = session.birth_date ? {
        gender: session.gender,
        birthDate: session.birth_date,
        birthTime: session.birth_time || "",
        birthPlace: session.birth_place || "",
        isLunar: session.is_lunar || false,
      } : null;

      let astroDataForAI = null;
      let ziweiDataForAI = null;
      let sajuDataForAI = saju;
      let manseryeokDataForAI = null;

      if (birthInfo && birthInfo.birthDate) {
        try {
          const [y, m, d] = birthInfo.birthDate.split("-").map(Number);
          const hour = birthInfo.birthTime ? parseInt(birthInfo.birthTime.split(":")[0]) : 12;
          const minute = birthInfo.birthTime ? parseInt(birthInfo.birthTime.split(":")[1]) : 0;

          // Manseryeok auto-calculation
          try {
            manseryeokDataForAI = calculateManseryeokSaju(y, m, d, hour, minute, birthInfo.isLunar as boolean);
          } catch (e) {
            console.error("Manseryeok V2 calc error:", e);
          }

          if (!sajuDataForAI) {
            const sajuResult = calculateSaju(y, m, d, hour);
            sajuDataForAI = {
              ...sajuResult,
              crossKeywords: getSajuTarotCrossKeywords(sajuResult, cards.map((c: any) => c.suit)),
              questionAnalysis: getSajuForQuestion(sajuResult, qType as any),
            };
          }

          const astro = calculateNatalChart(y, m, d, hour);
          astroDataForAI = {
            ...astro,
            questionAnalysis: getAstrologyForQuestion(astro, qType as any),
            transits: getCurrentTransits(astro),
          };

          const ziwei = calculateZiWei(y, m, d, hour, (birthInfo.gender as "male" | "female") || "female");
          ziweiDataForAI = {
            ...ziwei,
            questionAnalysis: getZiWeiForQuestion(ziwei, qType as any),
          };
        } catch (e) {
          console.error("V2 analysis calc error:", e);
        }
      }

      const combinationSummary = getCombinationSummary(cards.map((c: any) => c.id), qType as any);

      const { data: aiData, error: fnError } = await supabase.functions.invoke("ai-reading-v4", {
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
          forcetellData: forcetellData.trim() || null,
          manseryeokData: manseryeokDataForAI,
        },
      });

      if (fnError) throw fnError;

      const result = aiData?.reading;
      if (result) {
        // Store v2 result in ai_reading field (JSON)
        const grade = result.final_reading?.grade || "C";
        const overallScore = grade === "S" ? 97 : grade === "A" ? 89 : grade === "B" ? 77 : 55;
        
        await supabase.from("reading_sessions").update({
          ai_reading: result as any,
          saju_data: sajuDataForAI as any,
          final_confidence: overallScore,
          status: "completed",
        }).eq("id", session.id);

        onUpdate({
          ...session,
          ai_reading: result,
          saju_data: sajuDataForAI,
          final_confidence: overallScore,
          status: "completed",
        });
      }
    } catch (err) {
      console.error("AI V2 analysis error:", err);
      await supabase.from("reading_sessions").update({ status: "error" }).eq("id", session.id);
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadPDF = () => {
    if (!reading) return;
    const cards = session.cards as any[];
    const qLabel = questionTypeLabels[qType] || "🔮 종합";

    const sections: { title: string; content: string }[] = [
      { title: "✦ 최종 결론", content: reading.conclusion },
      { title: "🃏 타로 카드 해석", content: reading.tarotAnalysis },
      { title: "🃏 카드 간 상호작용", content: reading.tarotCardInteraction },
      ...(saju ? [
        { title: "🔮 사주 구조 분석", content: reading.sajuAnalysis },
        { title: "🔮 사주 시간축 분석", content: reading.sajuTimeline },
        { title: "⭐ 점성술 분석", content: reading.astrologyAnalysis },
        { title: "⭐ 행성 트랜짓", content: reading.astrologyTransits },
        { title: "🏯 자미두수 궁위 분석", content: reading.ziweiAnalysis },
        { title: "🏯 자미두수 인생 구조", content: reading.ziweiLifeStructure },
        { title: "⚖️ 4체계 교차 검증", content: reading.crossValidation },
        { title: "⚖️ 교차 검증 매트릭스", content: reading.crossValidationMatrix },
      ] : []),
      { title: "⏰ 시기 분석", content: reading.timing },
      { title: "⚠️ 리스크 요인", content: reading.risk },
      { title: "🔍 숨겨진 패턴", content: reading.hiddenPattern },
      { title: "💡 현실 조언", content: reading.advice },
    ].filter(s => s.content);

    const sajuHtml = saju ? `
      <div class="info-grid">
        <div class="pillar"><div class="pillar-label">연주</div><div class="pillar-value">${saju.yearPillar?.cheongan}${saju.yearPillar?.jiji}</div><div class="pillar-element">${saju.yearPillar?.cheonganElement}/${saju.yearPillar?.jijiElement}</div></div>
        <div class="pillar"><div class="pillar-label">월주</div><div class="pillar-value">${saju.monthPillar?.cheongan}${saju.monthPillar?.jiji}</div><div class="pillar-element">${saju.monthPillar?.cheonganElement}/${saju.monthPillar?.jijiElement}</div></div>
        <div class="pillar"><div class="pillar-label">일주</div><div class="pillar-value">${saju.dayPillar?.cheongan}${saju.dayPillar?.jiji}</div><div class="pillar-element">${saju.dayPillar?.cheonganElement}/${saju.dayPillar?.jijiElement}</div></div>
        <div class="pillar"><div class="pillar-label">시주</div><div class="pillar-value">${saju.hourPillar?.cheongan}${saju.hourPillar?.jiji}</div><div class="pillar-element">${saju.hourPillar?.cheonganElement}/${saju.hourPillar?.jijiElement}</div></div>
      </div>
      <p style="margin-top:8px;font-size:12px;color:#666;">일간: ${saju.ilgan}(${saju.ilganElement}) | ${saju.strength} | 용신: ${saju.yongsin}</p>
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
    ${cards.map((c: any, i: number) => `<div class="card-item"><div class="pos">${i === 0 ? "현재" : i === 1 ? "문제" : "결과"}</div><div class="name">${c.korean}</div><div class="dir">${c.isReversed ? "역방향" : "정방향"}</div></div>`).join("")}
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
            <Badge variant="outline" className={`text-[10px] ${
              session.status === "pending" ? "border-yellow-500/30 text-yellow-400" :
              session.status === "analyzing" ? "border-blue-500/30 text-blue-400" :
              session.status === "completed" ? "border-green-500/30 text-green-400" :
              "border-red-500/30 text-red-400"
            }`}>
              {session.status === "pending" ? "대기중" : session.status === "analyzing" ? "분석중" : session.status === "completed" ? "완료" : session.status}
            </Badge>
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

      {session.birth_date && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-foreground">🔮 사주 데이터</CardTitle>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
                자동 계산 적용
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              출생 정보를 기반으로 만세력 라이브러리가 사주를 자동 계산합니다.
            </p>
            <div className="mt-2">
              <button
                onClick={() => setShowForcetellInput(!showForcetellInput)}
                className="text-xs text-muted-foreground/70 hover:text-muted-foreground underline underline-offset-2 decoration-dashed transition-colors"
              >
                사주 결과가 다르게 느껴지시나요? {showForcetellInput ? "▲" : "▼"}
              </button>
            </div>
            {showForcetellInput && (
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
      )}

      {/* AI Analysis Buttons */}
      {!reading && (
        <div className="space-y-2">
          <Button
            className="w-full rounded-xl bg-gradient-to-r from-primary to-gold text-primary-foreground font-medium shadow-lg"
            onClick={runAIAnalysis}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI 분석 진행 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                AI 교차 검증 분석 실행 (v1)
              </>
            )}
          </Button>
          <Button
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 text-white font-medium shadow-lg"
            onClick={runAIAnalysisV2}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                6체계 통합 분석 진행 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                ✦ 6체계 통합 분석 실행 (v2)
                {forcetellData.trim() && <Badge variant="outline" className="ml-2 text-[10px] border-gold/30 text-gold">포스텔러</Badge>}
              </>
            )}
          </Button>
        </div>
      )}

      {analysisError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3">
            <p className="text-xs text-destructive">{analysisError}</p>
          </CardContent>
        </Card>
      )}

      {/* Saju Analysis */}
      {saju && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">🔮 사주 분석</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "연주", p: saju.yearPillar },
                { label: "월주", p: saju.monthPillar },
                { label: "일주", p: saju.dayPillar },
                { label: "시주", p: saju.hourPillar },
              ].map(({ label, p }) => (
                <div key={label} className="rounded-lg border border-border bg-secondary p-2 text-center">
                  <div className="text-[10px] text-muted-foreground">{label}</div>
                  <div className="mt-1 text-lg font-semibold text-foreground">
                    {p.cheongan}{p.jiji}
                  </div>
                  <div className="text-[10px] text-gold">
                    {p.cheonganElement}/{p.jijiElement}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-[10px]">일간: {saju.ilgan}({saju.ilganElement})</Badge>
              <Badge variant="secondary" className="text-[10px]">{saju.strength}</Badge>
              <Badge variant="secondary" className="text-[10px]">용신: {saju.yongsin}</Badge>
            </div>
            {saju.fiveElementDist && (
              <div className="flex gap-1">
                {Object.entries(saju.fiveElementDist as Record<string, number>).map(([el, count]) => (
                  <div key={el} className="flex-1 rounded bg-secondary p-1.5 text-center">
                    <div className="text-[10px] text-muted-foreground">{el}</div>
                    <div className="text-xs font-medium text-foreground">{(count as number).toFixed(1)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* AI Reading - V2 format (6-system) */}
      {reading && reading.individual_readings && (
        <Card className="border-border bg-card glow-gold">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-foreground">✦ 6체계 통합 분석 (v2)</CardTitle>
              {reading.final_reading?.grade && (
                <Badge className={`text-sm font-bold px-3 py-1 ${
                  reading.final_reading.grade === "S" ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black" :
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
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{reading.final_reading.summary}</p>
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
                  <p className="text-sm text-foreground">{reading.convergence.common_message}</p>
                )}
                {reading.convergence.divergent_reason && (
                  <p className="text-xs text-orange-400/80 italic">{reading.convergence.divergent_reason}</p>
                )}
              </div>
            )}

            {/* Individual Systems */}
            {[
              { key: "tarot", icon: "🃏", label: "웨이트 타로" },
              { key: "choi_hanna_tarot", icon: "💫", label: "최한나 타로" },
              { key: "monad_tarot", icon: "🔷", label: "모나드 타로" },
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
                    {sys.direction && <span className="text-[10px] text-gold italic">{sys.direction}</span>}
                  </div>
                  {sys.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {sys.keywords.map((kw: string, i: number) => (
                        <Badge key={i} variant="outline" className="border-gold/30 text-gold text-[10px]">{kw}</Badge>
                      ))}
                    </div>
                  )}
                  {sys.cards?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {sys.cards.map((c: any, i: number) => (
                        <div key={i} className="rounded bg-secondary/50 px-2 py-1 text-[11px]">
                          <span className="text-muted-foreground">{c.position} </span>
                          <span className="font-medium text-foreground">{c.card}</span>
                          <span className={c.orientation === "역" ? "text-red-400" : "text-emerald-400"}> ({c.orientation})</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="rounded-lg border border-border bg-secondary p-4">
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{sys.detail}</p>
                  </div>
                </div>
              );
            })}

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
                      <p className="mt-1 text-xs text-foreground leading-relaxed">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advice */}
            {reading.final_reading?.advice && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-5">
                <div className="mb-2 text-xs font-semibold text-green-400">💡 실천 조언</div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{reading.final_reading.advice}</p>
              </div>
            )}

            {/* Caution */}
            {reading.final_reading?.caution && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="mb-1 text-[11px] text-destructive">⚠️ 주의사항</div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{reading.final_reading.caution}</p>
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

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-full border-border/50 text-xs"
                onClick={() => { onUpdate({ ...session, ai_reading: null, status: "pending" }); }}>
                <RefreshCw className="mr-1.5 h-3 w-3" />재분석
              </Button>
              <Button variant="outline" size="sm" className="rounded-full border-gold/30 text-gold text-xs" onClick={downloadPDF}>
                <Download className="mr-1.5 h-3 w-3" />PDF 다운로드
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Reading - V1 format (legacy) */}
      {reading && !reading.individual_readings && reading.conclusion && (
        <Card className="border-border bg-card glow-gold">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">AI 교차 검증 분석 (v1)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reading.conclusion && (
              <div className="rounded-lg border border-gold/20 bg-gold/5 p-5">
                <div className="mb-2 text-xs font-semibold text-gold">✦ 최종 결론</div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{reading.conclusion}</p>
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
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{section.content}</p>
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-full border-border/50 text-xs"
                onClick={() => { onUpdate({ ...session, ai_reading: null, status: "pending" }); }}>
                <RefreshCw className="mr-1.5 h-3 w-3" />재분석
              </Button>
              <Button variant="outline" size="sm" className="rounded-full border-gold/30 text-gold text-xs" onClick={downloadPDF}>
                <Download className="mr-1.5 h-3 w-3" />PDF 다운로드
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {analyzing && (
        <Card className="border-border bg-card">
          <CardContent className="py-10 text-center">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-gold" />
            <p className="text-sm text-muted-foreground">AI 분석 진행 중...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
