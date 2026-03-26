import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ZiWeiResult } from "@/lib/ziwei";

interface Props {
  ziwei: ZiWeiResult;
}

export function ZiWeiSummaryCard({ ziwei }: Props) {
  const gradeColor: Record<string, string> = {
    S: "bg-yellow-500 text-black",
    A: "bg-green-500 text-white",
    B: "bg-blue-500 text-white",
    C: "bg-orange-500 text-white",
    D: "bg-red-500 text-white",
  };

  const severityColor: Record<string, string> = {
    길: "text-green-400",
    평: "text-gray-400",
    흉: "text-orange-400",
    대흉: "text-red-500 font-bold",
  };

  return (
    <div className="space-y-4">
      {/* 종합 점수 */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            🏯 자미두수 종합
            <Badge className={gradeColor[ziwei.overallScore.grade] || "bg-gray-500"}>
              {ziwei.overallScore.grade}등급 · {ziwei.overallScore.total}점
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-300 mb-3">{ziwei.overallScore.oneLineSummary}</p>
          <div className="grid grid-cols-5 gap-2">
            {ziwei.overallScore.categories.map((cat) => (
              <div key={cat.name} className="text-center">
                <div className="text-xs text-gray-500">{cat.name}</div>
                <div className="text-lg font-bold">{cat.score}</div>
                <div className="text-xs text-gray-400">{cat.summary}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 격국 */}
      {ziwei.geokGuk.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">📜 격국(格局)</CardTitle>
          </CardHeader>
          <CardContent>
            {ziwei.geokGuk.map((g, i) => (
              <div key={i} className="mb-2">
                <Badge variant="outline" className="mr-2">{g.grade}</Badge>
                <span className="font-semibold">{g.name}</span>
                <p className="text-sm text-gray-400 mt-1">{g.description}</p>
                {g.breakConditions.length > 0 && (
                  <p className="text-xs text-red-400">⚠ 파격 조건: {g.breakConditions.join(", ")}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 소한 삼중 교차 */}
      {ziwei.currentMinorPeriod && ziwei.currentMinorPeriod.tripleOverlap && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">⏳ 소한(小限) 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <span>{ziwei.currentMinorPeriod.age}세</span>
              <span>· {ziwei.currentMinorPeriod.palace}({ziwei.currentMinorPeriod.branch})</span>
              <span className={severityColor[ziwei.currentMinorPeriod.tripleOverlap.severity] || ""}>
                [{ziwei.currentMinorPeriod.tripleOverlap.severity}]
              </span>
            </div>
            <p className="text-sm text-gray-300">{ziwei.currentMinorPeriod.tripleOverlap.summary}</p>
            {ziwei.currentMinorPeriod.transformations.length > 0 && (
              <div className="mt-2 text-xs text-gray-400">
                {ziwei.currentMinorPeriod.transformations.map((t, i) => (
                  <span key={i} className="mr-2">{t.type}({t.star}→{t.palace})</span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 신살 요약 */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">🌟 궁별 핵심 신살</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {ziwei.palaces
              .filter(p => p.shenSha && p.shenSha.length > 0)
              .slice(0, 6)
              .map((p, i) => (
                <div key={i} className="border border-gray-700 rounded p-2">
                  <div className="font-semibold text-gray-300">{p.name}</div>
                  <div className="text-gray-500">{p.shenSha.slice(0, 3).join(", ")}</div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* 유년 분석 */}
      {ziwei.currentYearAnalysis && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">📅 {ziwei.currentYearAnalysis.year}년 유년 운세</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300">{ziwei.currentYearAnalysis.interpretation}</p>
            {ziwei.currentYearAnalysis.dahanOverlap.length > 0 && (
              <p className="text-xs text-orange-400 mt-1">
                ⚡ 대한 교차: {ziwei.currentYearAnalysis.dahanOverlap.join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
