import type { ZiWeiResult } from "@/lib/ziwei";

interface Props {
  ziwei: ZiWeiResult;
}

/**
 * 자미두수 12궁 명반 차트 — 전통 사각형 배치
 *
 * 배치도 (4×4 그리드, 가운데 2×2는 중앙 정보):
 *
 *   [사(巳)]  [오(午)]  [미(未)]  [신(申)]
 *   [진(辰)]  [중앙          ]  [유(酉)]
 *   [묘(卯)]  [              ]  [술(戌)]
 *   [인(寅)]  [축(丑)]  [자(子)]  [해(亥)]
 *
 * 지지 인덱스: 자=0,축=1,인=2,묘=3,진=4,사=5,오=6,미=7,신=8,유=9,술=10,해=11
 */

const BRANCHES = ["자","축","인","묘","진","사","오","미","신","유","술","해"];

export function ZiWeiChart({ ziwei }: Props) {
  // 명궁 지지 인덱스
  const mingBranchIdx = BRANCHES.indexOf(ziwei.mingGong);

  // 각 지지 인덱스 → 궁 정보 매핑
  const branchToPalace = new Map<number, (typeof ziwei.palaces)[0]>();
  for (const palace of ziwei.palaces) {
    const bIdx = BRANCHES.indexOf(palace.branch);
    if (bIdx >= 0) branchToPalace.set(bIdx, palace);
  }

  const renderCell = (branchIdx: number) => {
    const palace = branchToPalace.get(branchIdx);
    const isMing = branchIdx === mingBranchIdx;
    const isShen = palace?.branch === ziwei.shenGong;

    // 주성 (최대 3개 표시)
    const majorStars = (palace?.stars || [])
      .filter(s => ["자미","천기","태양","무곡","천동","염정","천부","태음","탐랑","거문","천상","천량","칠살","파군"].includes(s.star))
      .slice(0, 3);

    // 보조성 (최대 2개)
    const auxStars = (palace?.stars || [])
      .filter(s => !majorStars.find(m => m.star === s.star))
      .slice(0, 2);

    // 사화
    const trans = palace?.transformations || [];

    // 밝기 색상
    const brightnessColor = (b: string) => {
      if (b === "묘" || b === "왕") return "text-yellow-300";
      if (b === "득지") return "text-green-300";
      if (b === "함지" || b === "낙함") return "text-red-400";
      return "text-gray-300";
    };

    // 사화 색상
    const transColor = (type: string) => {
      if (type === "화록") return "text-green-400";
      if (type === "화권") return "text-orange-300";
      if (type === "화과") return "text-blue-300";
      if (type === "화기") return "text-red-500";
      return "text-gray-400";
    };

    return (
      <div
        key={branchIdx}
        className={`
          border border-gray-600 p-1.5 text-xs leading-tight min-h-[100px] relative
          ${isMing ? "bg-yellow-900/30 border-yellow-500" : "bg-gray-900/50"}
          ${isShen ? "ring-1 ring-purple-500" : ""}
        `}
      >
        {/* 궁 이름 + 지지 */}
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-gray-200">
            {palace?.name || ""}
            {isMing && <span className="text-yellow-400 ml-1">★</span>}
            {isShen && <span className="text-purple-400 ml-1">◆</span>}
          </span>
          <span className="text-gray-500">{BRANCHES[branchIdx]}</span>
        </div>

        {/* 주성 */}
        <div className="space-y-0.5">
          {majorStars.map((s, i) => (
            <div key={i} className={`${brightnessColor(s.brightness)} font-semibold`}>
              {s.star}
              <span className="text-[10px] ml-0.5 opacity-70">{s.brightness}</span>
            </div>
          ))}
        </div>

        {/* 보조성 */}
        {auxStars.length > 0 && (
          <div className="text-gray-500 mt-0.5">
            {auxStars.map(s => s.star).join(" ")}
          </div>
        )}

        {/* 사화 */}
        {trans.length > 0 && (
          <div className="mt-0.5">
            {trans.map((t, i) => (
              <span key={i} className={`${transColor(t.type)} mr-1`}>
                {t.type.charAt(1)}
              </span>
            ))}
          </div>
        )}

        {/* 신살 (축약) */}
        {palace?.shenSha && palace.shenSha.length > 0 && (
          <div className="text-[9px] text-gray-600 mt-0.5 truncate">
            {palace.shenSha.slice(0, 2).join(" ")}
          </div>
        )}
      </div>
    );
  };

  // 4x4 그리드 렌더링
  const grid: (number | "center")[][] = [
    [5, 6, 7, 8],
    [4, "center", "center", 9],
    [3, "center", "center", 10],
    [2, 1, 0, 11],
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-4 gap-0 border border-gray-600 rounded-lg overflow-hidden">
        {grid.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            if (cell === "center") {
              // 중앙 영역 — 첫 번째 셀(1,1)에만 렌더
              if (rowIdx === 1 && colIdx === 1) {
                return (
                  <div
                    key={`center`}
                    className="col-span-2 row-span-2 bg-gray-800/80 border border-gray-600 p-3 flex flex-col justify-center items-center text-center"
                    style={{ gridColumn: "2 / 4", gridRow: "2 / 4" }}
                  >
                    <div className="text-lg font-bold text-yellow-400 mb-1">
                      자미두수 명반
                    </div>
                    <div className="text-sm text-gray-300">
                      명궁: {ziwei.mingGong} | 신궁: {ziwei.shenGong}
                    </div>
                    <div className="text-sm text-gray-300">
                      오행국: {ziwei.bureau}
                    </div>
                    <div className="text-xl font-bold mt-2">
                      <span className={`
                        ${ziwei.overallScore.grade === "S" ? "text-yellow-400" : ""}
                        ${ziwei.overallScore.grade === "A" ? "text-green-400" : ""}
                        ${ziwei.overallScore.grade === "B" ? "text-blue-400" : ""}
                        ${ziwei.overallScore.grade === "C" ? "text-orange-400" : ""}
                        ${ziwei.overallScore.grade === "D" ? "text-red-400" : ""}
                      `}>
                        {ziwei.overallScore.grade}등급 {ziwei.overallScore.total}점
                      </span>
                    </div>
                  </div>
                );
              }
              return null; // 나머지 center 셀은 colspan으로 커버
            }
            return renderCell(cell);
          })
        )}
      </div>

      {/* 범례 */}
      <div className="flex gap-4 mt-2 text-xs text-gray-500 justify-center">
        <span><span className="text-yellow-400">★</span> 명궁</span>
        <span><span className="text-purple-400">◆</span> 신궁</span>
        <span><span className="text-green-400">록</span> 화록</span>
        <span><span className="text-orange-300">권</span> 화권</span>
        <span><span className="text-blue-300">과</span> 화과</span>
        <span><span className="text-red-500">기</span> 화기</span>
      </div>
    </div>
  );
}
