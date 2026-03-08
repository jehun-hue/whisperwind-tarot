import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AIReadingResult {
  conclusion: string;
  tarotAnalysis: string;
  sajuAnalysis: string;
  crossValidation: string;
  risk: string;
  advice: string;
  scores: {
    tarot: number;
    saju: number;
    overall: number;
  };
}

interface ReadingResultProps {
  reading: AIReadingResult | null;
  isLoading: boolean;
  onReset: () => void;
  hasSaju: boolean;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.3 }}
          className="h-full rounded-full bg-gradient-to-r from-primary to-gold"
        />
      </div>
    </div>
  );
}

export default function ReadingResult({ reading, isLoading, onReset, hasSaju }: ReadingResultProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <Card className="mx-auto max-w-lg border-border/50 bg-card/80 backdrop-blur-xl animate-pulse-glow">
          <CardContent className="py-16 px-8">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-gold" />
            <h2 className="font-display text-xl font-semibold text-foreground">
              AI가 분석 중입니다...
            </h2>
      <p className="mt-3 text-sm text-muted-foreground">
              타로{hasSaju ? " + 사주 + 점성술 + 자미두수" : ""} 교차 검증 리딩을 생성하고 있습니다
            </p>
            <div className="mx-auto mt-6 h-px w-32 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!reading) return null;

  const sections = [
    { title: "✦ 최종 결론", content: reading.conclusion, accent: true },
    { title: "🃏 타로 분석", content: reading.tarotAnalysis },
    ...(hasSaju
      ? [
          { title: "🔮 사주 분석", content: reading.sajuAnalysis },
          { title: "⭐ 점성술 분석", content: reading.astrologyAnalysis },
          { title: "🏯 자미두수 분석", content: reading.ziweiAnalysis },
          { title: "⚖️ 교차 검증", content: reading.crossValidation },
        ]
      : []),
    { title: "⚠️ 리스크", content: reading.risk },
    { title: "💡 현실 조언", content: reading.advice },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-2xl space-y-4"
    >
      {/* Scores */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl glow-gold">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-sm italic tracking-widest text-gold">
              analysis scores
            </span>
            <Badge variant="outline" className="border-gold/30 text-gold text-xs">
              신뢰도 {reading.scores.overall}%
            </Badge>
          </div>
          <div className="space-y-3">
            <ScoreBar label="타로 분석" score={reading.scores.tarot} />
            {hasSaju && <ScoreBar label="사주 분석" score={reading.scores.saju} />}
            <ScoreBar label="종합 신뢰도" score={reading.scores.overall} />
          </div>
        </CardContent>
      </Card>

      {/* Reading sections */}
      {sections.map((section, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <Card
            className={`border-border/50 bg-card/80 backdrop-blur-xl ${
              section.accent ? "glow-gold-strong" : ""
            }`}
          >
            <CardContent className="p-5">
              <h3 className="mb-2 font-display text-base font-semibold text-foreground">
                {section.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {section.content}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Reset */}
      <div className="pt-4 text-center">
        <Button
          variant="secondary"
          className="rounded-full border border-border/50 bg-secondary/50 backdrop-blur"
          onClick={onReset}
        >
          새 상담 시작하기
        </Button>
      </div>
    </motion.div>
  );
}
