import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lock, Trash2, RefreshCw, Sparkles, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateSaju, getSajuTarotCrossKeywords, getSajuForQuestion } from "@/lib/saju";
import { calculateNatalChart, getAstrologyForQuestion, getCurrentTransits } from "@/lib/astrology";
import { calculateZiWei, getZiWeiForQuestion } from "@/lib/ziwei";
import { getCombinationSummary } from "@/data/tarotCombinations";

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
}

export default function ReaderPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ReadingSession | null>(null);

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

  const pendingCount = sessions.filter(s => s.status === "pending").length;

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
            <CardHeader>
              <CardTitle className="text-base text-foreground">상담 요청 목록 ({sessions.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sessions.length === 0 && (
                <p className="text-sm text-muted-foreground">아직 상담 요청이 없습니다.</p>
              )}
              {sessions.map((s) => (
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
                          {s.question || "질문 없음"}
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
  const qType = session.question_type;
  const reading = session.ai_reading;
  const saju = session.saju_data;

  const runAIAnalysis = async () => {
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

      if (birthInfo && birthInfo.birthDate) {
        try {
          const [y, m, d] = birthInfo.birthDate.split("-").map(Number);
          const hour = birthInfo.birthTime ? parseInt(birthInfo.birthTime.split(":")[0]) : 12;

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
        },
      });

      if (fnError) throw fnError;

      const result = aiData?.reading;
      if (result) {
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
      }
    } catch (err) {
      console.error("AI analysis error:", err);
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
    <h1>AI 통합 점술 상담 분석 결과</h1>
    <div class="meta">${new Date(session.created_at).toLocaleString("ko-KR")}</div>
    <div>
      <span class="badge">${qLabel}</span>
      ${session.final_confidence ? `<span class="badge">신뢰도 ${session.final_confidence}%</span>` : ""}
    </div>
  </div>

  <h2 style="font-size:16px;margin-bottom:8px;">📋 질문: ${session.question}</h2>
  ${session.memo ? `<p style="font-size:12px;color:#666;margin-bottom:12px;">메모: ${session.memo}</p>` : ""}
  ${session.birth_date ? `<p style="font-size:12px;color:#666;">${session.gender === "male" ? "남" : "여"} • ${session.birth_date} • ${session.birth_time || "시간 미상"} • ${session.birth_place || ""} • ${session.is_lunar ? "음력" : "양력"}</p>` : ""}

  <div class="cards">
    ${cards.map((c: any, i: number) => `<div class="card-item"><div class="pos">${i === 0 ? "현재" : i === 1 ? "문제" : "결과"}</div><div class="name">${c.korean}</div><div class="dir">${c.isReversed ? "역방향" : "정방향"}</div></div>`).join("")}
  </div>

  ${sajuHtml}

  ${sections.map(s => `<div class="section"><div class="section-title">${s.title}</div><div class="section-content">${s.content}</div></div>`).join("")}

  ${scoresHtml}

  <div class="footer">AI 통합 점술 상담 시스템 • ${new Date().toLocaleDateString("ko-KR")}</div>
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

      {/* AI Analysis Button */}
      {!reading && (
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
              AI 교차 검증 분석 실행
            </>
          )}
        </Button>
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

      {/* AI Reading */}
      {reading && (
        <Card className="border-border bg-card glow-gold">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">AI 교차 검증 분석</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Conclusion - highlighted */}
            {reading.conclusion && (
              <div className="rounded-lg border border-gold/20 bg-gold/5 p-5">
                <div className="mb-2 text-xs font-semibold text-gold">✦ 최종 결론</div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                  {reading.conclusion}
                </p>
              </div>
            )}

            {/* Tarot Section */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">🃏 타로 분석</div>
              {[
                { label: "카드 해석", content: reading.tarotAnalysis },
                { label: "카드 간 상호작용", content: reading.tarotCardInteraction },
              ].filter(s => s.content).map((section, i) => (
                <div key={i} className="rounded-lg border border-border bg-secondary p-4">
                  <div className="mb-1 text-[11px] text-muted-foreground">{section.label}</div>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{section.content}</p>
                </div>
              ))}
            </div>

            {/* Saju Section */}
            {saju && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">🔮 사주 (명리학)</div>
                {[
                  { label: "사주 구조 분석", content: reading.sajuAnalysis },
                  { label: "시간축 / 운세 흐름", content: reading.sajuTimeline },
                ].filter(s => s.content).map((section, i) => (
                  <div key={i} className="rounded-lg border border-border bg-secondary p-4">
                    <div className="mb-1 text-[11px] text-muted-foreground">{section.label}</div>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{section.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Astrology Section */}
            {saju && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">⭐ 점성술</div>
                {[
                  { label: "출생차트 분석", content: reading.astrologyAnalysis },
                  { label: "행성 트랜짓", content: reading.astrologyTransits },
                ].filter(s => s.content).map((section, i) => (
                  <div key={i} className="rounded-lg border border-border bg-secondary p-4">
                    <div className="mb-1 text-[11px] text-muted-foreground">{section.label}</div>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{section.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Ziwei Section */}
            {saju && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">🏯 자미두수</div>
                {[
                  { label: "궁위 분석", content: reading.ziweiAnalysis },
                  { label: "인생 구조", content: reading.ziweiLifeStructure },
                ].filter(s => s.content).map((section, i) => (
                  <div key={i} className="rounded-lg border border-border bg-secondary p-4">
                    <div className="mb-1 text-[11px] text-muted-foreground">{section.label}</div>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{section.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Cross Validation Section - highlighted */}
            {(reading.crossValidation || reading.crossValidationMatrix) && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">⚖️ 교차 검증</div>
                {[
                  { label: "4체계 일치/불일치 분석", content: reading.crossValidation },
                  { label: "교차 검증 매트릭스", content: reading.crossValidationMatrix },
                ].filter(s => s.content).map((section, i) => (
                  <div key={i} className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="mb-1 text-[11px] text-primary">{section.label}</div>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{section.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Timing */}
            {reading.timing && (
              <div className="rounded-lg border border-border bg-secondary p-4">
                <div className="mb-1 text-[11px] text-muted-foreground">⏰ 시기 분석</div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{reading.timing}</p>
              </div>
            )}

            {/* Risk & Hidden Pattern */}
            <div className="grid gap-2 md:grid-cols-2">
              {reading.risk && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <div className="mb-1 text-[11px] text-destructive">⚠️ 리스크 요인</div>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{reading.risk}</p>
                </div>
              )}
              {reading.hiddenPattern && (
                <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
                  <div className="mb-1 text-[11px] text-gold">🔍 숨겨진 패턴</div>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{reading.hiddenPattern}</p>
                </div>
              )}
            </div>

            {/* Advice - highlighted */}
            {reading.advice && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-5">
                <div className="mb-2 text-xs font-semibold text-green-400">💡 현실 조언</div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{reading.advice}</p>
              </div>
            )}

            {/* Scores */}
            {reading.scores && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-[10px]">타로: {reading.scores.tarot}%</Badge>
                {saju && <Badge variant="secondary" className="text-[10px]">사주: {reading.scores.saju}%</Badge>}
                {reading.scores.astrology != null && <Badge variant="secondary" className="text-[10px]">점성술: {reading.scores.astrology}%</Badge>}
                {reading.scores.ziwei != null && <Badge variant="secondary" className="text-[10px]">자미두수: {reading.scores.ziwei}%</Badge>}
                <Badge variant="outline" className="border-gold/30 text-gold text-[10px]">종합: {reading.scores.overall}%</Badge>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-border/50 text-xs"
                onClick={() => {
                  onUpdate({ ...session, ai_reading: null, status: "pending" });
                }}
              >
                <RefreshCw className="mr-1.5 h-3 w-3" />
                재분석
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-gold/30 text-gold text-xs"
                onClick={downloadPDF}
              >
                <Download className="mr-1.5 h-3 w-3" />
                PDF 다운로드
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
