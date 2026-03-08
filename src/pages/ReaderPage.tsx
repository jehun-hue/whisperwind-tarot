import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lock, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const READER_PIN = "1234";

type QuestionType = "love" | "career" | "money" | "general";

const questionTypeLabels: Record<QuestionType, string> = {
  love: "💕 연애",
  career: "💼 직업/사업",
  money: "💰 금전",
  general: "🔮 종합",
};

interface ReadingSession {
  id: string;
  question: string;
  question_type: string;
  memo: string | null;
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
            <SessionDetail session={selectedSession} />
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

function SessionDetail({ session }: { session: ReadingSession }) {
  const qType = session.question_type as QuestionType;
  const reading = session.ai_reading;
  const saju = session.saju_data;

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
          <CardContent className="space-y-3">
            {[
              { label: "최종 결론", content: reading.conclusion },
              { label: "타로 분석", content: reading.tarotAnalysis },
              ...(saju ? [
                { label: "사주 분석", content: reading.sajuAnalysis },
                { label: "교차 검증", content: reading.crossValidation },
              ] : []),
              { label: "리스크", content: reading.risk },
              { label: "현실 조언", content: reading.advice },
            ].map((section, i) => (
              <div key={i} className="rounded-lg border border-border bg-secondary p-4">
                <div className="mb-1 text-xs text-muted-foreground">{section.label}</div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                  {section.content}
                </p>
              </div>
            ))}
            {reading.scores && (
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-[10px]">타로: {reading.scores.tarot}%</Badge>
                {saju && <Badge variant="secondary" className="text-[10px]">사주: {reading.scores.saju}%</Badge>}
                <Badge variant="outline" className="border-gold/30 text-gold text-[10px]">종합: {reading.scores.overall}%</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!reading && session.status === "analyzing" && (
        <Card className="border-border bg-card">
          <CardContent className="py-10 text-center">
            <div className="animate-spin mx-auto mb-3 h-6 w-6 border-2 border-gold border-t-transparent rounded-full" />
            <p className="text-sm text-muted-foreground">AI 분석 진행 중...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
