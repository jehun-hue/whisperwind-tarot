import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check, Loader2 } from "lucide-react";

const READER_PIN = "1234";

export default function ReadingResultPage() {
  const { id } = useParams<{ id: string }>();
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authenticated && id) {
      setLoading(true);
      supabase
        .from("reading_sessions")
        .select("*")
        .eq("id", id)
        .single()
        .then(({ data }) => {
          setSession(data);
          setLoading(false);
        });
    }
  }, [authenticated, id]);

  const handleCopy = async () => {
    if (!session?.ai_reading) return;
    const text = JSON.stringify(session.ai_reading, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatReadingText = (reading: any): string => {
    if (!reading) return "";
    const lines: string[] = [];

    if (reading.final_message?.title) {
      lines.push(`【 ${reading.final_message.title} 】\n`);
    }

    if (reading.tarot_reading?.waite) {
      lines.push("━━━ 웨이트 타로 ━━━");
      lines.push(reading.tarot_reading.waite.story || "");
      if (reading.tarot_reading.waite.key_message) lines.push(`\n💎 핵심: ${reading.tarot_reading.waite.key_message}`);
      lines.push("");
    }
    if (reading.tarot_reading?.choihanna) {
      lines.push("━━━ 최한나 타로 ━━━");
      lines.push(reading.tarot_reading.choihanna.story || "");
      if (reading.tarot_reading.choihanna.key_message) lines.push(`\n💎 핵심: ${reading.tarot_reading.choihanna.key_message}`);
      lines.push("");
    }
    if (reading.tarot_reading?.monad) {
      lines.push("━━━ 모나드 타로 ━━━");
      lines.push(reading.tarot_reading.monad.story || "");
      if (reading.tarot_reading.monad.key_message) lines.push(`\n💎 핵심: ${reading.tarot_reading.monad.key_message}`);
      lines.push("");
    }

    if (reading.convergence) {
      lines.push(`━━━ 수렴도: ${reading.convergence.grade}등급 (${reading.convergence.converged_count}/6) ━━━`);
      if (reading.convergence.common_message) lines.push(reading.convergence.common_message);
      lines.push("");
    }

    if (reading.action_guide) {
      lines.push("━━━ 실천 가이드 ━━━");
      if (reading.action_guide.do_list) {
        lines.push("✅ 해야 할 것:");
        reading.action_guide.do_list.forEach((item: string) => lines.push(`  • ${item}`));
      }
      if (reading.action_guide.dont_list) {
        lines.push("❌ 하지 말아야 할 것:");
        reading.action_guide.dont_list.forEach((item: string) => lines.push(`  • ${item}`));
      }
      if (reading.action_guide.lucky) {
        const l = reading.action_guide.lucky;
        lines.push(`🍀 행운: ${l.color || ""} / ${l.number || ""} / ${l.direction || ""} / ${l.day || ""} / ${l.item || ""}`);
      }
      lines.push("");
    }

    if (reading.final_message?.summary) {
      lines.push("━━━ 종합 관점 제언 ━━━");
      lines.push(reading.final_message.summary);
    }

    return lines.join("\n");
  };

  const handleCopyFormatted = async () => {
    if (!session?.ai_reading) return;
    const text = formatReadingText(session.ai_reading);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-6 space-y-4 text-center">
            <h2 className="font-display text-xl font-semibold text-foreground">관리자 인증</h2>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pin === READER_PIN && setAuthenticated(true)}
              placeholder="PIN 입력"
              className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-center text-foreground text-lg tracking-widest"
            />
            <Button
              className="w-full rounded-xl bg-gradient-to-r from-accent to-gold text-primary-foreground"
              onClick={() => pin === READER_PIN && setAuthenticated(true)}
            >
              확인
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">세션을 찾을 수 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reading = session.ai_reading;
  const cards = session.cards || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            📋 리딩 결과 (관리자)
          </h1>
          <p className="text-xs text-muted-foreground">세션 ID: {session.id?.slice(0, 8)}...</p>
        </div>

        {/* Session Info */}
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">📌 상담 정보</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">이름:</span> <span className="text-foreground">{session.user_name || "없음"}</span></div>
              <div><span className="text-muted-foreground">질문:</span> <span className="text-foreground">{session.question}</span></div>
              <div><span className="text-muted-foreground">유형:</span> <Badge variant="outline" className="text-[10px]">{session.question_type}</Badge></div>
              <div><span className="text-muted-foreground">성별:</span> <span className="text-foreground">{session.gender === "male" ? "남" : "여"}</span></div>
              <div><span className="text-muted-foreground">생년월일:</span> <span className="text-foreground">{session.birth_date}</span></div>
              <div><span className="text-muted-foreground">출생시간:</span> <span className="text-foreground">{session.birth_time || "모름"}</span></div>
              <div><span className="text-muted-foreground">상태:</span> <Badge className={session.status === "completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-gold/20 text-gold"}>{session.status}</Badge></div>
            </div>
            <div className="text-xs text-muted-foreground">
              카드: {cards.map((c: any) => `${c.korean}(${c.isReversed ? "역" : "정"})`).join(", ")}
            </div>
          </CardContent>
        </Card>

        {/* Copy Buttons */}
        {reading && (
          <div className="flex gap-3">
            <Button
              className="flex-1 rounded-xl bg-gradient-to-r from-accent to-gold text-primary-foreground font-semibold shadow-lg"
              onClick={handleCopyFormatted}
            >
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "복사 완료!" : "결과 텍스트 복사하기"}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-border/50"
              onClick={handleCopy}
            >
              JSON 복사
            </Button>
          </div>
        )}

        {/* Formatted Reading */}
        {reading && (
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-5 space-y-4">
              {reading.final_message?.title && (
                <h2 className="font-display text-xl font-semibold text-gold text-center">
                  {reading.final_message.title}
                </h2>
              )}

              {reading.tarot_reading?.waite && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-accent">━━ 웨이트 타로 ━━</h3>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{reading.tarot_reading.waite.story}</p>
                  {reading.tarot_reading.waite.key_message && (
                    <p className="text-xs text-gold italic">💎 {reading.tarot_reading.waite.key_message}</p>
                  )}
                </div>
              )}

              {reading.tarot_reading?.choihanna && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-accent">━━ 최한나 타로 ━━</h3>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{reading.tarot_reading.choihanna.story}</p>
                  {reading.tarot_reading.choihanna.key_message && (
                    <p className="text-xs text-gold italic">💎 {reading.tarot_reading.choihanna.key_message}</p>
                  )}
                </div>
              )}

              {reading.tarot_reading?.monad && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-accent">━━ 모나드 타로 ━━</h3>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{reading.tarot_reading.monad.story}</p>
                  {reading.tarot_reading.monad.key_message && (
                    <p className="text-xs text-gold italic">💎 {reading.tarot_reading.monad.key_message}</p>
                  )}
                </div>
              )}

              {reading.convergence && (
                <div className="space-y-2 border-t border-border/30 pt-4">
                  <h3 className="text-sm font-semibold text-accent">
                    수렴도: {reading.convergence.grade}등급 ({reading.convergence.converged_count}/6)
                  </h3>
                  <p className="text-sm text-foreground/80">{reading.convergence.common_message}</p>
                </div>
              )}

              {reading.action_guide && (
                <div className="space-y-2 border-t border-border/30 pt-4">
                  <h3 className="text-sm font-semibold text-accent">━━ 실천 가이드 ━━</h3>
                  {reading.action_guide.do_list && (
                    <div>
                      <p className="text-xs font-medium text-emerald-400">✅ 해야 할 것</p>
                      {reading.action_guide.do_list.map((item: string, i: number) => (
                        <p key={i} className="text-xs text-foreground/80 ml-3">• {item}</p>
                      ))}
                    </div>
                  )}
                  {reading.action_guide.dont_list && (
                    <div>
                      <p className="text-xs font-medium text-red-400">❌ 하지 말아야 할 것</p>
                      {reading.action_guide.dont_list.map((item: string, i: number) => (
                        <p key={i} className="text-xs text-foreground/80 ml-3">• {item}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {reading.final_message?.summary && (
                <div className="space-y-2 border-t border-border/30 pt-4">
                  <h3 className="text-sm font-semibold text-accent">━━ 종합 관점 제언 ━━</h3>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{reading.final_message.summary}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!reading && (
          <Card className="border-gold/20 bg-card/80">
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">아직 AI 분석 결과가 없습니다.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">분석이 완료되면 여기에 표시됩니다.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
