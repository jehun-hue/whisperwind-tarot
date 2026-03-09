import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface SajuManualOverrideProps {
  onManualDataChange: (data: string) => void;
  manualData: string;
}

export default function SajuManualOverride({ onManualDataChange, manualData }: SajuManualOverrideProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4 text-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors underline underline-offset-2 decoration-dashed"
      >
        사주 결과가 다르게 느껴지시나요?
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {isOpen && (
        <div className="mt-3 mx-auto max-w-lg space-y-3 text-left">
          <p className="text-[11px] text-muted-foreground">
            포스텔러 만세력에서 확인한 결과를 붙여넣어 주세요.
            수동 입력값이 있으면 자동 계산 대신 이 데이터를 AI 분석에 사용합니다.
          </p>
          <a
            href="https://pro.forceteller.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-secondary/50 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            포스텔러 바로가기
          </a>
          <Textarea
            value={manualData}
            onChange={(e) => onManualDataChange(e.target.value.slice(0, 3000))}
            className="min-h-[100px] rounded-xl border-border/50 bg-background/50 backdrop-blur text-xs font-mono text-foreground placeholder:text-muted-foreground/50"
            placeholder={`예시:\n연주: 갑자(甲子) / 월주: 정묘(丁卯) / 일주: 임오(壬午) / 시주: 경술(庚戌)\n일간: 임수(壬水), 신약\n오행: 목2 화3 토1 금1 수1\n용신: 금(金)`}
          />
          <p className="text-[10px] text-muted-foreground text-right">{manualData.length}/3000자</p>
        </div>
      )}
    </div>
  );
}
