import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lock, Eye, EyeOff, Trash2, RefreshCw } from "lucide-react";
import { tarotCards, type TarotCardBase } from "@/data/tarotCards";

const READER_PIN = "1234"; // 상담사 비밀번호 (원하시면 변경)

type QuestionType = "love" | "career" | "money" | "general";

interface SessionCard {
  id: number;
  name: string;
  korean: string;
  suit: string;
  isReversed: boolean;
}

interface TarotSession {
  id: string;
  question: string;
  memo: string;
  cards: SessionCard[];
  timestamp: string;
}

const suitLabels: Record<string, string> = {
  "Major Arcana": "메이저",
  Wands: "완드",
  Cups: "컵",
  Swords: "검",
  Pentacles: "펜타클",
};

function classifyQuestion(question: string): QuestionType {
  const q = question.toLowerCase();
  if (/(연애|재회|썸|남자|여자|상대|연락|결혼)/.test(q)) return "love";
  if (/(이직|직장|사업|취업|회사|일|브랜드|커리어)/.test(q)) return "career";
  if (/(돈|금전|재물|수익|매출|사업운|투자)/.test(q)) return "money";
  return "general";
}

const questionTypeLabels: Record<QuestionType, string> = {
  love: "💕 연애",
  career: "💼 직업/사업",
  money: "💰 금전",
  general: "🔮 종합",
};

function getFullCard(id: number): TarotCardBase | undefined {
  return tarotCards.find((c) => c.id === id);
}

function interpretCard(card: TarotCardBase, isReversed: boolean, type: QuestionType) {
  const summary = isReversed ? card.reversedMeaning : card.upright;
  const domain = type === "love" ? card.love : type === "career" ? card.career : type === "money" ? card.money : card.upright;
  return { summary, domain };
}

function buildOverallReading(cards: { card: TarotCardBase; isReversed: boolean }[], questionType: QuestionType) {
  const reversedCount = cards.filter((c) => c.isReversed).length;
  const strongCards = cards.filter((c) => [1, 4, 7, 10, 19, 21].includes(c.card.id)).length;
  const unstableCards = cards.filter((c) => [12, 15, 16, 18].includes(c.card.id)).length;

  let tone = "전체적으로는 흐름이 아예 막힌 상태는 아니며, 선택과 태도에 따라 결과 차이가 크게 나는 리딩입니다.";
  if (reversedCount >= 2) tone = "지금은 에너지가 뒤집히거나 엇갈리는 부분이 많아, 성급하게 밀어붙일수록 결과가 비틀릴 가능성이 큽니다.";
  if (strongCards >= 2) tone = "판을 움직일 힘은 충분히 들어와 있습니다. 다만 감정이 아니라 구조와 타이밍으로 승부해야 합니다.";
  if (unstableCards >= 2) tone = "지금 리딩의 핵심은 불안정성입니다. 기대와 현실 사이의 간격을 줄이지 않으면 실망이 커질 수 있습니다.";

  const actionMap: Record<QuestionType, string> = {
    love: "연애 질문이라면 상대 반응 하나에 과몰입하기보다, 관계의 균형과 실제 행동을 기준으로 판단하는 것이 맞습니다.",
    career: "일 질문이라면 당장 결과보다 방향 정리와 실행 구조를 먼저 잡아야 성과가 납니다.",
    money: "금전 질문이라면 확장보다 관리가 우선입니다. 새 기회는 테스트 후 확대하는 방식이 안전합니다.",
    general: "지금은 감정으로 결론 내리기보다, 반복되는 패턴이 무엇인지 먼저 읽어내는 것이 중요합니다.",
  };

  const suitCounts: Record<string, number> = {};
  cards.forEach((c) => {
    suitCounts[c.card.suit] = (suitCounts[c.card.suit] || 0) + 1;
  });

  let suitInsight = "";
  if (suitCounts["Wands"] >= 2) suitInsight = "완드 카드가 다수 등장 → 열정, 행동, 창조적 에너지가 핵심.";
  else if (suitCounts["Cups"] >= 2) suitInsight = "컵 카드가 다수 등장 → 감정, 관계, 직감이 핵심.";
  else if (suitCounts["Swords"] >= 2) suitInsight = "검 카드가 다수 등장 → 사고, 결정, 진실이 핵심.";
  else if (suitCounts["Pentacles"] >= 2) suitInsight = "펜타클 카드가 다수 등장 → 물질, 안정, 실용이 핵심.";

  const finalLine = reversedCount >= 2
    ? "정리하면, 지금은 되는지 안 되는지를 급히 묻는 시기보다 무엇이 흐름을 막는지 정확히 보는 시기입니다."
    : "정리하면, 지금 흐름은 가능성이 있으며 그 가능성을 현실로 바꾸는 건 질문자님의 선택 방식과 실행력입니다.";

  return { tone, action: actionMap[questionType], suitInsight, finalLine };
}

export default function ReaderPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [sessions, setSessions] = useState<TarotSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TarotSession | null>(null);

  const loadSessions = useCallback(() => {
    const data = JSON.parse(localStorage.getItem("tarot_sessions") || "[]");
    setSessions(data);
  }, []);

  useEffect(() => {
    if (authed) loadSessions();
  }, [authed, loadSessions]);

  const handleLogin = () => {
    if (pin === READER_PIN) {
      setAuthed(true);
    }
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    localStorage.setItem("tarot_sessions", JSON.stringify(updated));
    setSessions(updated);
    if (selectedSession?.id === id) setSelectedSession(null);
  };

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm border-border bg-card">
          <CardContent className="py-8">
            <div className="mb-6 text-center">
              <Lock className="mx-auto mb-3 h-8 w-8 text-gold" />
              <h2 className="font-display text-xl font-semibold text-foreground">
                상담사 전용
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                비밀번호를 입력해 주세요
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-3"
            >
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="rounded-xl border-border bg-secondary text-center text-lg tracking-widest"
                placeholder="••••"
              />
              <Button className="w-full rounded-xl bg-primary text-primary-foreground" type="submit">
                확인
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <span className="font-display text-sm italic tracking-widest text-gold">reader dashboard</span>
            <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
              상담사 리딩 화면
            </h1>
          </div>
          <Button variant="secondary" className="rounded-full" onClick={loadSessions}>
            <RefreshCw className="mr-2 h-4 w-4" /> 새로고침
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Sessions list */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base text-foreground">
                상담 요청 목록 ({sessions.length})
              </CardTitle>
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
                      <div className="truncate text-sm font-medium text-foreground">
                        {s.question || "질문 없음"}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(s.timestamp).toLocaleString("ko-KR")}
                      </div>
                      <div className="mt-1 flex gap-1">
                        {s.cards.map((c) => (
                          <span key={c.id} className="text-[10px] text-muted-foreground">
                            {c.korean}{c.isReversed ? "(역)" : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(s.id);
                      }}
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
            <SessionReading session={selectedSession} />
          ) : (
            <Card className="flex items-center justify-center border-border bg-card">
              <CardContent className="py-20 text-center">
                <div className="font-display text-4xl text-muted-foreground/30">✦</div>
                <p className="mt-3 text-muted-foreground">
                  왼쪽 목록에서 상담 요청을 선택하세요
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionReading({ session }: { session: TarotSession }) {
  const questionType = useMemo(() => classifyQuestion(session.question), [session.question]);

  const fullCards = useMemo(
    () =>
      session.cards
        .map((c) => {
          const full = getFullCard(c.id);
          return full ? { card: full, isReversed: c.isReversed } : null;
        })
        .filter(Boolean) as { card: TarotCardBase; isReversed: boolean }[],
    [session.cards]
  );

  const overall = useMemo(() => {
    if (fullCards.length !== 3) return null;
    return buildOverallReading(fullCards, questionType);
  }, [fullCards, questionType]);

  return (
    <div className="space-y-6">
      {/* Question info */}
      <Card className="border-border bg-card">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-gold/30 text-gold">
              {questionTypeLabels[questionType]}
            </Badge>
            <span className="text-[11px] text-muted-foreground">
              {new Date(session.timestamp).toLocaleString("ko-KR")}
            </span>
          </div>
          <div className="mt-3 text-lg font-medium text-foreground">{session.question}</div>
          {session.memo && (
            <div className="mt-2 rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
              {session.memo}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards detail */}
      <div className="grid gap-4 md:grid-cols-3">
        {fullCards.map(({ card, isReversed }, idx) => {
          const info = interpretCard(card, isReversed, questionType);
          return (
            <Card key={card.id} className="border-border bg-card">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">card {idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-full text-[10px]">
                      {suitLabels[card.suit]}
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-gold/30 text-gold text-[10px]">
                      {isReversed ? "역방향" : "정방향"}
                    </Badge>
                  </div>
                </div>
                <div className="text-base font-semibold text-foreground">
                  {card.korean}
                  <span className="ml-1 font-display text-sm text-muted-foreground">{card.name}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {card.keywords.map((k) => (
                    <Badge key={k} variant="secondary" className="rounded-full text-[10px]">
                      {k}
                    </Badge>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{info.summary}</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{info.domain}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overall reading */}
      {overall && (
        <Card className="border-border bg-card glow-gold">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">자동 분석 결과</CardTitle>
            <p className="text-xs text-muted-foreground">
              아래 내용은 참고용 자동 분석입니다. 고객에게는 보이지 않습니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-secondary p-4">
              <div className="mb-1 text-xs text-muted-foreground">전체 흐름</div>
              <p className="text-sm leading-relaxed text-foreground">{overall.tone}</p>
            </div>

            {overall.suitInsight && (
              <div className="rounded-lg border border-border bg-secondary p-4">
                <div className="mb-1 text-xs text-muted-foreground">슈트 분석</div>
                <p className="text-sm leading-relaxed text-foreground">{overall.suitInsight}</p>
              </div>
            )}

            <div className="rounded-lg border border-border bg-secondary p-4">
              <div className="mb-1 text-xs text-muted-foreground">분야별 해석</div>
              <p className="text-sm leading-relaxed text-foreground">{overall.action}</p>
            </div>

            <div className="rounded-lg border border-border bg-secondary p-4">
              <div className="mb-1 text-xs text-muted-foreground">정리</div>
              <p className="text-sm leading-relaxed text-foreground">{overall.finalLine}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
