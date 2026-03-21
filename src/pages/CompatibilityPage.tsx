import { useState } from "react";
import BirthInfoForm, { BirthInfo } from "@/components/BirthInfoForm";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AnalysisState = "idle" | "loading" | "done" | "error";

interface CompatibilityResult {
  personA: any;
  personB: any;
  summary?: string;
}

export default function CompatibilityPage() {
  const [personA, setPersonA] = useState<BirthInfo | null>(null);
  const [personB, setPersonB] = useState<BirthInfo | null>(null);
  const [state, setState] = useState<AnalysisState>("idle");
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [error, setError] = useState("");

  const canAnalyze = personA && personB && state !== "loading";

  const runCompatibility = async () => {
    if (!personA || !personB) return;
    setState("loading");
    setError("");

    try {
      // MVP: 두 사람 각각 분석 후 궁합 비교
      const question = `${personA.name}님과 ${personB.name}님의 궁합을 분석해주세요.`;

      const [resA, resB] = await Promise.all([
        supabase.functions.invoke("ai-reading-v4", {
          body: {
            birthInfo: {
              birthDate: personA.birthDate,
              birthTime: personA.birthTime,
              gender: personA.gender,
              isLunar: personA.isLunar,
              userName: personA.name,
            },
            partnerInfo: {
              birthDate: personB.birthDate,
              birthTime: personB.birthTime,
              gender: personB.gender,
              isLunar: personB.isLunar,
              userName: personB.name,
            },
            question,
            mode: "compatibility",
            cards: [],
          },
        }),
        supabase.functions.invoke("ai-reading-v4", {
          body: {
            birthInfo: {
              birthDate: personB.birthDate,
              birthTime: personB.birthTime,
              gender: personB.gender,
              isLunar: personB.isLunar,
              userName: personB.name,
            },
            partnerInfo: {
              birthDate: personA.birthDate,
              birthTime: personA.birthTime,
              gender: personA.gender,
              isLunar: personA.isLunar,
              userName: personA.name,
            },
            question,
            mode: "compatibility",
            cards: [],
          },
        }),
      ]);

      if (resA.error || resB.error) {
        throw new Error(resA.error?.message || resB.error?.message || "분석 실패");
      }

      setResult({
        personA: resA.data,
        personB: resB.data,
      });
      setState("done");
    } catch (e: any) {
      setError(e.message || "알 수 없는 오류");
      setState("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
          궁합 분석
        </h1>
        <p className="text-center text-gray-400 mb-8">
          사주 · 점성술 · 수비학 · 자미두수 4엔진 통합 궁합
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-pink-500/20">
            <h3 className="text-pink-400 font-bold text-lg mb-3">💗 나의 정보</h3>
            <BirthInfoForm
              onSubmit={(info) => setPersonA(info)}
              onSkip={() => {}}
            />
            {personA && (
              <div className="mt-2 text-sm text-green-400">
                ✓ {personA.name} ({personA.birthDate})
              </div>
            )}
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 border border-purple-500/20">
            <h3 className="text-purple-400 font-bold text-lg mb-3">💜 상대방 정보</h3>
            <BirthInfoForm
              onSubmit={(info) => setPersonB(info)}
              onSkip={() => {}}
            />
            {personB && (
              <div className="mt-2 text-sm text-green-400">
                ✓ {personB.name} ({personB.birthDate})
              </div>
            )}
          </div>
        </div>

        <div className="text-center mb-8">
          <Button
            onClick={runCompatibility}
            disabled={!canAnalyze}
            className={`px-8 py-3 rounded-full text-lg font-bold transition-all ${
              canAnalyze
                ? "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            {state === "loading" ? "분석 중..." : "궁합 분석 시작"}
          </Button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300 text-center mb-8">
            {error}
          </div>
        )}

        {state === "done" && result && (
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gold/20">
            <h2 className="text-2xl font-bold text-center mb-4 text-yellow-400">
              궁합 결과
            </h2>
            <div className="space-y-4 text-gray-200 leading-relaxed whitespace-pre-wrap">
              {result.personA?.integrated_summary || result.personA?.final_message?.summary || "분석 결과를 불러오는 중..."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
