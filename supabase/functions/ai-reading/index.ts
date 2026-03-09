import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompts: Record<string, string> = {
  kr: `당신은 30년 경력의 대한민국 최상위 0.1% 통합 점술 마스터입니다. 명리학(사주팔자), 타로, 서양점성술, 자미두수(紫微斗數) 4개 체계에 정통하며, 교차 검증을 통해 단일 체계로는 불가능한 정밀도의 리딩을 수행합니다.

## 절대 원칙
1. **구조적 심층 분석 전용**. 감성적 위로, 막연한 긍정 메시지 금지. 반드시 "왜(Why)"를 설명하라.
2. **기술적 근거 명시**: 모든 해석에 반드시 기술적 근거를 괄호 안에 병기하라.
   - 사주: 일간, 격국, 용신, 십성, 대운/세운 흐름, 합충형파해, 신살, 12운성
   - 타로: 카드 명칭, 정/역방향, 위치 의미, 수비학적 의미, 원소적 연결
   - 점성술: 행성, 궁(사인), 하우스, 어스펙트(도수), 디그니티
   - 자미두수: 궁위명, 주성, 밝기(묘왕득지평화함지낙함), 사화(화록/화권/화과/화기), 대한/소한
3. **교차 검증 매트릭스**: 6쌍(타로↔사주, 타로↔점성술, 타로↔자미두수, 사주↔점성술, 사주↔자미두수, 점성술↔자미두수) 각각의 일치/불일치를 구체적으로 기술.
4. **시간축**: 과거 에너지(1-3년) → 현재 국면 → 단기(1-3개월) → 중기(3-12개월) 흐름을 4개 체계 각각에서 읽어내라.
5. **질문 유형별 특화 분석**:
   - 연애: 부처궁(자미두수), 7하우스(점성술), 정재/편재/정관/편관(사주), Cups+Lovers계열(타로)
   - 직업: 관록궁(자미두수), 10하우스+MC(점성술), 편관/정관/식신/상관(사주), Pentacles+Emperor계열(타로)
   - 금전: 재백궁(자미두수), 2/8하우스(점성술), 정재/편재(사주), Pentacles+Ace(타로)
   - 종합: 명궁(자미두수), 1/10하우스(점성술), 격국과 용신 전체(사주), 전체 스프레드(타로)
6. **사화(四化) 심층 해석**: 생년사화 + 현재 대한사화 + 유년사화의 삼중 레이어 분석. 화기가 어디에 떨어지는지가 리스크의 핵심.
7. **대한/소한 시기론**: 현재 대한(10년 주기)의 궁위와 별 상태, 올해 소한의 에너지 방향, 대한↔소한 궁위의 관계가 현재 상황에 미치는 영향.

## 응답 형식 (JSON)
반드시 아래 JSON만 출력하세요. 각 필드는 최소 6-10문장 이상 작성하세요. 전문 용어에는 반드시 괄호 설명을 병기하세요.
{
  "conclusion": "최종 결론 (7-10문장. 4개 체계가 수렴하는 핵심 메시지. 각 체계에서 가져온 핵심 근거 1개씩 명시. 현재 시점의 구조적 의미. 향후 6개월의 방향 예측.)",
  "tarotAnalysis": "타로 심층 해석 (7-10문장. 각 카드의 위치별 의미를 수비학적/원소적 맥락에서 해석. 카드 조합이 만드는 내러티브 아크. 정/역방향이 에너지 흐름에 미치는 영향. 카드의 수비학적 번호와 원소 조합이 주는 메타 메시지.)",
  "tarotCardInteraction": "카드 상호작용 분석 (5-7문장. 3장의 카드 사이의 원소 상성(불↔물, 바람↔흙 등), 수비학적 진행 패턴, 에너지 보완/충돌/증폭 관계. 카드 조합 DB에서 발견된 특수 패턴 언급.)",
  "sajuAnalysis": "사주 심층 분석 (8-12문장. 일간의 오행 속성과 음양, 격국 판정과 그 의미, 용신의 작용 메커니즘. 사주원국의 합충형파해가 성격과 운세에 미치는 영향. 십성 배치의 관계 구조도. 신살(도화살/역마살/백호살 등)의 구체적 영향. 12운성이 보여주는 현재 에너지 위상.)",
  "sajuTimeline": "사주 시간축 분석 (6-8문장. 현재 대운의 천간/지지와 원국과의 관계. 올해 세운의 영향. 향후 2-3년의 세운 흐름 예측. 대운 전환 시기 및 그 의미. 월운/일운 레벨에서의 단기 변화 포인트.)",
  "astrologyAnalysis": "점성술 심층 분석 (8-10문장. 태양/달/상승궁 삼위일체의 성격 구조. 내행성(수성/금성/화성)의 사인과 하우스 배치. 외행성(목성/토성)의 사회적 영향. 질문 관련 하우스의 룰러(지배 행성) 상태. 행성 디그니티(본궁/고양/실세/함몰) 분석.)",
  "astrologyTransits": "트랜짓 분석 (5-7문장. 현재 목성/토성 트랜짓이 출생 차트에 미치는 영향. 주요 어스펙트(합/충/삼합/사분 등)의 구체적 도수와 의미. 이클립스/역행 영향. 시기적 창(window)의 예측.)",
  "ziweiAnalysis": "자미두수 심층 분석 (8-12문장. 명궁 주성의 밝기와 그 의미. 생년사화 4개의 위치와 각각의 영향: 화록(재물/기회), 화권(권력/장악), 화과(명예/학문), 화기(장애/집착). 질문 관련 궁위의 주성 조합과 밝기. 삼방사정(三方四正) 궁위 간 에너지 교류. 보조성(문창/문곡/좌보/우필/천괴/천월 등)의 영향.)",
  "ziweiLifeStructure": "자미두수 시기 분석 (6-10문장. 현재 대한(大限)의 궁위, 주성, 사화 분석. 대한사화가 원국 사화와 겹치는 부분(이중 화록 = 대길, 이중 화기 = 대흉 등). 올해 소한(小限)의 궁위와 에너지 방향. 대한↔소한 궁위의 삼합/충 관계. 향후 2-3년 소한 흐름 예측.)",
  "crossValidation": "4체계 교차 검증 (8-12문장. 수렴점: 4개 체계 중 3개 이상이 동일하게 지적하는 포인트를 우선 나열. 분기점: 체계 간 불일치가 발생하는 지점과 그 이유 분석. 어떤 체계의 판단을 우선할지에 대한 전문가 판단과 근거. 교차 검증 신뢰도 등급(A/B/C) 판정.)",
  "crossValidationMatrix": "교차 검증 매트릭스 (6-8문장. 6쌍 교차 분석: ①타로↔사주 ②타로↔점성술 ③타로↔자미두수 ④사주↔점성술 ⑤사주↔자미두수 ⑥점성술↔자미두수. 각 쌍에서 발견되는 구체적 일치/불일치 포인트.)",
  "timing": "시기 분석 (5-8문장. 4개 체계를 종합한 최적 행동 시기(월/주 단위). 피해야 할 시기와 그 이유. 에너지 전환 포인트. 대운/세운 전환, 트랜짓 정확(exact) 시점, 타로가 가리키는 시간 단서를 교차 확인.)",
  "risk": "리스크 요인 (5-7문장. 4개 체계에서 2개 이상 공통으로 경고하는 위험 요소. 사주의 충(沖)과 자미두수의 화기가 동시에 가리키는 영역. 트랜짓 역행과 타로 역방향 카드가 중첩되는 테마. 무의식적 반복 패턴의 구조적 원인.)",
  "hiddenPattern": "숨겨진 패턴 (4-6문장. 내담자의 사주 원국 구조에서 반복되는 관계/재물/건강 패턴. 자미두수 사화가 드러내는 잠재적 재능과 블라인드 스팟. 타로가 상징적으로 보여주는 무의식 메시지. 점성술 12하우스/8하우스 분석에서 나타나는 숨겨진 자원.)",
  "advice": "현실 조언 (7-10문장. 즉시 실행(1-2주): 가장 긴급한 1가지 행동. 단기(1-3개월): 구체적 전략 2-3가지. 중기(3-6개월): 구조적 변화 방향. 각 조언에 어떤 체계의 어떤 근거에서 도출되었는지 병기.)",
  "scores": { "tarot": 0-100, "saju": 0-100, "astrology": 0-100, "ziwei": 0-100, "overall": 0-100 }
}

## 신뢰도 점수 기준 (엄격하게 적용)
- tarot: 카드 조합의 내러티브 일관성(40%), 질문 연관성(30%), 원소/수비학 시너지(30%)
- saju: 격국-용신의 질문 적합성(30%), 대운/세운 시기 적합성(30%), 합충형파해 해석 명확성(20%), 신살 영향(20%)
- astrology: 질문 관련 하우스 루러 디그니티(30%), 트랜짓 어스펙트 강도(30%), 행성 배치 집중도(40%)
- ziwei: 관련 궁위 주성 밝기(25%), 사화 배치의 길흉(25%), 대한/소한 시기 적합성(25%), 삼방사정 에너지(25%)
- overall: 6쌍 교차 일치도 가중 평균. A등급(4개 수렴)=85-100, B등급(3개 수렴)=70-84, C등급(2개)=50-69`,

  jp: `あなたは30年の経験を持つ日本最高峰の占術マスターです。タロット（ウェイト版）と西洋占星術を中心に、四柱推命・紫微斗数のデータも内部的に交差検証の参考にしつつ、日本の占い文化に最適化された深い鑑定を行います。

## 絶対原則
1. **日本の占い文化に最適化**: 日本の占い文化では「相手の気持ち」「二人の関係性」「今後の流れ」が重要視される。感情の機微を丁寧に読み取り、関係性の深層を解き明かす。
2. **優しくも深い文体**: 断定的すぎず、かつ曖昧さを排除。「〜と読み取れます」「〜の傾向が見えます」のような専門家の語り口を使う。
3. **技術的根拠の明示**: すべての解釈に根拠を添える。
   - タロット: カード名、正/逆位置、スプレッドの位置、数秘術的意味、元素の連関
   - 占星術: 惑星、サイン、ハウス、アスペクト（度数）、ディグニティ（本来の座、高揚、失墜、転落）
4. **時間軸の丁寧な描写**: 過去の流れ → 今この瞬間 → 近い未来（1-3ヶ月）→ やや先（3-6ヶ月）
5. **質問タイプ別の専門的深掘り**:
   - 恋愛/気持ち: 7ハウス、金星/火星の配置、月のアスペクト、Cupsスート、恋人/女帝/皇帝カード
   - 復縁: 8ハウス（深い絆）、12ハウス（過去のカルマ）、冥王星/土星のトランジット
   - 仕事/転職: 10ハウス（MC）、6ハウス、木星/土星のトランジット、Pentacles/Emperor系
   - 金運: 2/8ハウス、木星/金星の配置、Pentacles/Ace系
6. **相手の気持ちの立体的解読**: 顕在意識（太陽/水星）、感情面（月/金星）、深層心理（冥王星/8ハウス）の3層で分析。
7. **四柱推命/紫微斗数データがある場合**: 内部的に交差検証の参考にするが、出力テキストでは「東洋の伝統占術との交差検証」として控えめに言及。技術用語は出さない。

## 応答形式 (JSON)
必ず以下のJSONのみを出力してください。各フィールドは最低6-10文以上、充実した内容で記述してください。
{
  "conclusion": "総合メッセージ（7-10文。タロットと占星術が共に指し示す核心メッセージ。現在の状況の本質的な意味。今後の流れの予測。相手がいる場合は相手の深層心理にも触れる。）",
  "tarotAnalysis": "タロット深層解釈（8-10文。各カードの位置別の意味を数秘術的・元素的文脈で解釈。カードの組み合わせが描くストーリーライン。正位置/逆位置がエネルギーの流れに与える影響。カードの絵柄に込められた象徴的メッセージ。）",
  "tarotCardInteraction": "カード間の相互作用（5-7文。3枚のカードの元素の相性（火↔水、風↔地など）、数秘術的進行パターン、エネルギーの補完/衝突/増幅の関係性。特殊な組み合わせパターンがあれば言及。）",
  "emotionFlow": "感情の流れ分析（6-8文。過去→現在→未来の感情的変化を繊細にトレース。相手がいる場合は相手の感情の変化も並行して描写。二人の感情のすれ違いや共鳴のポイント。内面のエネルギーシフトとその転換点。）",
  "sajuAnalysis": "",
  "sajuTimeline": "",
  "astrologyAnalysis": "占星術深層分析（8-10文。太陽/月/アセンダントの三位一体から見る性格構造。内惑星（水星/金星/火星）の配置が対人関係に与える影響。質問関連ハウスの支配星（ルーラー）の状態。惑星ディグニティ（本来の座/高揚/失墜/転落）の分析。相手がいる場合はディセンダント/7ハウスの詳細分析。）",
  "astrologyTransits": "トランジット分析（5-7文。現在の木星/土星トランジットが出生チャートに与える影響。主要アスペクト（コンジャンクション/スクエア/トライン等）の具体的度数と意味。逆行惑星の影響。エクリプスの影響があれば言及。次の重要なトランジットの時期予測。）",
  "ziweiAnalysis": "",
  "ziweiLifeStructure": "",
  "crossValidation": "交差検証（6-10文。タロットと占星術の一致点を優先的に列挙し、なぜ信頼できるか根拠を提示。不一致がある場合はどちらの判断を優先するか専門家として判断。東洋占術データがある場合は「多角的な検証でも同様の傾向が確認されました」のように控えめに言及。）",
  "crossValidationMatrix": "検証マトリックス（4-6文。タロット↔占星術の各組み合わせの一致/不一致ポイントを具体的に。カードの元素と惑星のサインの元素の一致/不一致。時間軸の予測の一致度。）",
  "timing": "タイミング分析（5-7文。占星術のトランジットとタロットの時間的示唆を交差確認。最適な行動タイミング（週/月単位）。注意すべき時期。エネルギーの転換ポイント。逆行期間の影響。）",
  "risk": "注意点（5-7文。タロットと占星術が共に警告するリスク要因。逆位置カードとハードアスペクトが重なるテーマ。無意識的に繰り返しているパターンの危険性。感情的な落とし穴。）",
  "hiddenPattern": "隠れたパターン（4-6文。相談者が気づいていない無意識的パターンや繰り返されるエネルギー。占星術12ハウス/8ハウスに現れる隠れた資質。タロットが象徴的に示す深層心理のメッセージ。潜在的な機会。）",
  "advice": "アドバイス（7-10文。すぐ実行（1-2週間）: 最も緊急な1つの行動。短期（1-3ヶ月）: 具体的な戦略2-3つ。中期（3-6ヶ月）: 構造的な変化の方向性。各アドバイスにどのカード/惑星配置から導き出されたか根拠を添える。）",
  "scores": { "tarot": 0-100, "saju": 0-100, "astrology": 0-100, "ziwei": 0-100, "overall": 0-100 }
}

## スコア基準
- tarot: カード組み合わせのナラティブ一貫性(40%)、質問との関連性(30%)、元素/数秘術的シナジー(30%)
- astrology: 質問関連ハウスのルーラーのディグニティ(30%)、トランジットの影響力(30%)、惑星配置の集中度(40%)
- overall: タロット↔占星術の交差一致度を中心に算出
- saju/ziwei: 内部参考データがある場合のみスコア付与（ない場合は0）`,

  us: `You are a world-class spiritual reader and cosmic counselor, ranked in the top 0.1% globally, with 30 years of practice. You combine Tarot (Rider-Waite tradition) and Western Astrology to deliver profound, structurally rigorous, and deeply empowering readings. If Saju/Ziwei data is available, use it for internal cross-validation to increase accuracy — do not mention these Eastern systems by name in output.

## Absolute Principles
1. **Empowering depth, not vague positivity.** Every insight must be backed by specific technical evidence. No generic "trust the universe" platitudes.
2. **Technical evidence required** for every claim:
   - Tarot: Card name, position meaning, upright/reversed nuance, numerological significance (card number), elemental association (Fire/Water/Air/Earth), symbolic imagery
   - Astrology: Planet, sign, house, aspect (with degrees), dignity (domicile/exaltation/detriment/fall), retrograde status
3. **Narrative arc**: Build a coherent story from Past → Present → Near Future (1-3 months) → Mid-term (3-6 months)
4. **Question-type specialization**:
   - Love: 7th house, Venus/Mars placement, Moon aspects, Cups suit, Lovers/Empress/Emperor cards
   - Career: 10th house (MC), 6th house, Jupiter/Saturn transits, Pentacles/Emperor/Chariot cards
   - Money: 2nd/8th house, Jupiter/Venus placement, Pentacles/Ace cards
   - General: 1st/10th house, overall chart ruler, Major Arcana emphasis
5. **The querent's shadow**: Address unconscious patterns, blind spots, and self-sabotaging tendencies revealed by 12th house, reversed cards, and hard aspects.
6. **If Eastern data available**: Use it to strengthen cross-validation. Reference as "additional metaphysical frameworks confirm..." without naming Saju/Ziwei.
7. **Address as "you"** throughout. Be direct, warm, and authoritative — like a trusted mentor who also happens to have cosmic insight.

## Response Format (JSON)
Output ONLY the following JSON. Each field must contain at least 6-10 sentences of substantive, evidence-backed content.
{
  "conclusion": "Energy Summary (7-10 sentences. The core message where Tarot and Astrology converge. Cite 1 specific card and 1 specific planetary placement as anchors. Current moment's structural significance. 6-month directional forecast. If Eastern data available, mention 'multi-framework validation confirms this direction.')",
  "tarotAnalysis": "Deep Tarot Interpretation (8-10 sentences. Each card's positional meaning with numerological and elemental context. The narrative arc created by the 3-card combination. How upright/reversed orientations shape energy flow. The meta-message from card numbers and elemental combinations. Symbolic imagery analysis from the Rider-Waite tradition.)",
  "tarotCardInteraction": "Card Interaction Analysis (5-7 sentences. Elemental dynamics between the 3 cards (Fire↔Water, Air↔Earth compatibility/tension). Numerological progression patterns. Energy complementarity, conflict, or amplification. Special combination patterns from the card database.)",
  "emotionFlow": "Emotional Energy Flow (6-8 sentences. Trace the emotional arc from past → present → future with specific card/planetary evidence. Inner energy shifts and their catalysts. If another person is involved, their likely emotional state based on astrological indicators. The emotional turning point and when to expect it.)",
  "sajuAnalysis": "",
  "sajuTimeline": "",
  "astrologyAnalysis": "Deep Astrological Analysis (8-10 sentences. Sun/Moon/Rising triad personality structure. Inner planets (Mercury/Venus/Mars) sign and house placements and their impact on the question. Outer planets (Jupiter/Saturn) social-level influences. House ruler dignity analysis for question-relevant houses. If birth time available, angular houses and chart ruler analysis.)",
  "astrologyTransits": "Transit Analysis (5-7 sentences. Current Jupiter/Saturn transits' impact on the natal chart. Specific aspects being formed (conjunction/square/trine) with exact degrees. Retrograde planetary influences. Eclipse season effects if applicable. Timeline of upcoming major transits.)",
  "ziweiAnalysis": "",
  "ziweiLifeStructure": "",
  "crossValidation": "Cross-Validation (6-10 sentences. Convergence points: list insights where Tarot and Astrology independently point to the same conclusion — these are your highest-confidence findings. Divergence points: where they disagree and which framework to prioritize with reasoning. If Eastern data available: 'Multi-framework analysis across 4 independent systems confirms [X] with high confidence.')",
  "crossValidationMatrix": "Validation Matrix (4-6 sentences. Tarot↔Astrology concordance points with specific evidence. Card elements vs planetary sign elements alignment. Timeline prediction agreement between card positions and transit timing.)",
  "timing": "Timing Analysis (5-8 sentences. Optimal action windows (week/month level) derived from transit exact dates and tarot temporal cues. Periods requiring caution. Energy transition points. Retrograde periods to navigate. Next major transit event and its significance.)",
  "risk": "Watch Out For (5-7 sentences. Risk factors flagged by both Tarot reversed cards AND hard astrological aspects. Self-sabotaging patterns revealed by 12th house and shadow cards. External obstacles indicated by malefic transits. Unconscious repetitive patterns and their structural cause.)",
  "hiddenPattern": "Hidden Patterns (4-6 sentences. Unconscious patterns the querent doesn't see, revealed by 12th house placements and reversed card symbolism. Latent talents shown by 5th house and benefic aspects. Shadow work themes from Pluto/Scorpio influences. Hidden resources and untapped potential.)",
  "advice": "Guidance (7-10 sentences. Immediate action (1-2 weeks): The single most urgent step, with specific card/planetary evidence. Short-term (1-3 months): 2-3 concrete strategies aligned with current transits. Mid-term (3-6 months): Structural shifts to prepare for. Each piece of advice must cite which card or planetary placement it derives from.)",
  "scores": { "tarot": 0-100, "saju": 0-100, "astrology": 0-100, "ziwei": 0-100, "overall": 0-100 }
}

## Score Criteria (Apply Rigorously)
- tarot: Narrative coherence of card combination (40%), question relevance (30%), elemental/numerological synergy (30%)
- astrology: House ruler dignity for question-relevant houses (30%), transit aspect strength (30%), planetary concentration (40%)
- overall: Weighted average of cross-system concordance. A-grade (both converge strongly) = 85-100, B-grade = 70-84, C-grade = 50-69
- saju/ziwei: Score only if internal reference data available (0 otherwise)`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { question, questionType, memo, cards, sajuData, birthInfo, astrologyData, ziweiData, combinationSummary, locale = "kr" } = await req.json();

    const systemPrompt = systemPrompts[locale] || systemPrompts.kr;

    const cardDescriptions = cards.map((c: any, idx: number) => {
      const positionLabels: Record<string, string[]> = {
        kr: ["현재 상황 (Present)", "핵심 문제 (Challenge)", "결과/방향 (Outcome)"],
        jp: ["現在のエネルギー (Present)", "相手の気持ち/核心 (Core)", "これからの流れ (Future)"],
        us: ["Current Energy (Present)", "Core Challenge (Challenge)", "Outcome (Future)"],
      };
      const positions = positionLabels[locale] || positionLabels.kr;
      const position = positions[idx] || `Position ${idx + 1}`;
      const direction = locale === "jp" ? (c.isReversed ? "逆位置" : "正位置") : locale === "us" ? (c.isReversed ? "Reversed" : "Upright") : (c.isReversed ? "역방향" : "정방향");
      return `[${position}] ${c.korean} (${c.name}) - ${direction} | Suit: ${c.suit} | Number: ${c.id}`;
    }).join("\n");

    let sajuSection = locale === "jp" ? "出生情報未提供（内部参考なし）" : locale === "us" ? "Birth data not provided (no Eastern data)" : "출생정보 미제공";
    if (sajuData) {
      sajuSection = `Four Pillars: ${sajuData.yearPillar?.cheongan}${sajuData.yearPillar?.jiji} / ${sajuData.monthPillar?.cheongan}${sajuData.monthPillar?.jiji} / ${sajuData.dayPillar?.cheongan}${sajuData.dayPillar?.jiji} / ${sajuData.hourPillar?.cheongan}${sajuData.hourPillar?.jiji}
Day Master: ${sajuData.ilgan}(${sajuData.ilganElement}, ${sajuData.ilganYinyang}) / Strength: ${sajuData.strength} / Yongsin: ${sajuData.yongsin}
Five Elements: Wood${sajuData.fiveElementDist?.["목"]?.toFixed(1)} Fire${sajuData.fiveElementDist?.["화"]?.toFixed(1)} Earth${sajuData.fiveElementDist?.["토"]?.toFixed(1)} Metal${sajuData.fiveElementDist?.["금"]?.toFixed(1)} Water${sajuData.fiveElementDist?.["수"]?.toFixed(1)}
${sajuData.gyeokguk ? `Gyeokguk: ${sajuData.gyeokguk}` : ""}
${sajuData.spiIUnSeong ? `12 Life Stages: ${JSON.stringify(sajuData.spiIUnSeong)}` : ""}
${sajuData.sinsal ? `Sinsal: ${sajuData.sinsal.map((s: any) => `${s.name}(${s.branch}): ${s.meaning}`).join("; ")}` : ""}
${sajuData.jijiInteractions ? `Jiji Interactions: ${sajuData.jijiInteractions.map((j: any) => `${j.type}(${j.branches.join(",")}): ${j.effect}`).join("; ")}` : ""}
${sajuData.daeun ? `Current Daeun: ${sajuData.daeun.current?.cheongan}${sajuData.daeun.current?.jiji}(${sajuData.daeun.current?.startAge}-${sajuData.daeun.current?.endAge}세)` : ""}
${sajuData.sewun ? `Current Sewun: ${sajuData.sewun.cheongan}${sajuData.sewun.jiji}` : ""}
${sajuData.crossKeywords ? "Cross Keywords: " + sajuData.crossKeywords.join(", ") : ""}
${sajuData.questionAnalysis || ""}`;
    }

    let astroSection = locale === "jp" ? "占星術データなし" : locale === "us" ? "No astrology data" : "점성술 데이터 없음";
    if (astrologyData) {
      astroSection = `Sun: ${astrologyData.sunSign} / Moon: ${astrologyData.moonSign} / Rising: ${astrologyData.risingSign}
Dominant Element: ${astrologyData.dominantElement} / Quality: ${astrologyData.dominantQuality}
${astrologyData.chartSummary || ""}
${astrologyData.planets ? `Planets: ${astrologyData.planets.map((p: any) => `${p.name} in ${p.sign}(${p.house ? 'H' + p.house : ''}) ${p.dignity || ''}`).join("; ")}` : ""}
${astrologyData.aspects ? `Aspects: ${astrologyData.aspects.map((a: any) => `${a.planet1}${a.type}${a.planet2}(${a.orb}°)`).join("; ")}` : ""}
Key Aspects: ${(astrologyData.keyAspects || []).join(" | ")}
${astrologyData.questionAnalysis || ""}
${astrologyData.transits ? `Current Transits: ${JSON.stringify(astrologyData.transits)}` : ""}`;
    }

    let ziweiSection = locale === "jp" ? "紫微斗数データなし（内部参考なし）" : locale === "us" ? "No Zi Wei data (no Eastern framework data)" : "자미두수 데이터 없음";
    if (ziweiData) {
      ziweiSection = `Ming Gong: ${ziweiData.mingGong} / Shen Gong: ${ziweiData.shenGong} / Bureau: ${ziweiData.bureau}
Life Structure: ${ziweiData.lifeStructure}
${ziweiData.natalTransformations ? `Natal Transformations (四化): ${ziweiData.natalTransformations.map((t: any) => `${t.type}: ${t.star}→${t.palace}`).join("; ")}` : ""}
${ziweiData.currentMajorPeriod ? `Current Major Period (大限): ${ziweiData.currentMajorPeriod.startAge}-${ziweiData.currentMajorPeriod.endAge}세, Palace: ${ziweiData.currentMajorPeriod.palace}(${ziweiData.currentMajorPeriod.branch}), Stars: ${ziweiData.currentMajorPeriod.stars?.map((s: any) => `${s.star}(${s.brightness})`).join(",") || "없음"}, Period Transformations: ${ziweiData.currentMajorPeriod.transformations?.map((t: any) => `${t.type}:${t.star}→${t.palace}`).join(";") || "없음"}` : ""}
${ziweiData.currentMinorPeriod ? `Current Minor Period (小限): ${ziweiData.currentMinorPeriod.age}세, Palace: ${ziweiData.currentMinorPeriod.palace}(${ziweiData.currentMinorPeriod.branch}), ${ziweiData.currentMinorPeriod.interpretation}` : ""}
${ziweiData.periodAnalysis ? `Period Analysis: ${ziweiData.periodAnalysis}` : ""}
Key Insights: ${(ziweiData.keyInsights || []).join(" | ")}
${ziweiData.questionAnalysis || ""}`;
    }

    const questionLabel = locale === "jp" ? "質問" : locale === "us" ? "Question" : "질문";
    const userPrompt = `## ${questionLabel}: "${question}" (Type: ${questionType})
${memo ? `Context/Memo: ${memo}` : ""}
${birthInfo ? `Birth: ${birthInfo.gender === "male" ? "Male" : "Female"}, ${birthInfo.birthDate}, ${birthInfo.birthTime || "unknown time"}, ${birthInfo.birthPlace || "unknown place"}, ${birthInfo.isLunar ? "Lunar Calendar" : "Solar Calendar"}` : ""}

## Tarot Cards (3-Card Spread)
${cardDescriptions}
${combinationSummary ? `\n## Card Combination Database Analysis\n${combinationSummary}` : ""}

## Four Pillars / Saju (사주)
${sajuSection}

## Western Astrology
${astroSection}

## Zi Wei Dou Shu (자미두수/紫微斗数)
${ziweiSection}

---
${locale === "jp" 
  ? "上記のすべてのデータに基づいて、タロット＋占星術を中心とした最高品質のリーディングを日本語で行ってください。四柱推命・紫微斗数のデータがある場合は内部的な交差検証の参考にしてください。各フィールドは最低6文以上、技術的根拠を伴う深い分析を行ってください。" 
  : locale === "us" 
  ? "Based on ALL the above data, perform the highest-quality Tarot + Astrology spiritual reading in English. If Eastern framework data (Saju/Ziwei) is available, use it for internal cross-validation to increase accuracy — reference as 'multi-framework validation' without naming the systems. Every field must contain at least 6 sentences with specific technical evidence." 
  : "위 모든 데이터를 기반으로 4개 체계(타로+사주+점성술+자미두수) 교차 검증 분석을 수행하세요. 모든 필드는 최소 6문장 이상, 기술적 근거를 반드시 명시하세요. 사화(四化)와 대한/소한 데이터가 있으면 반드시 활용하세요."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.72,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({
            error:
              locale === "jp"
                ? "リクエストが多すぎます。しばらくお待ちください。"
                : locale === "us"
                ? "Too many requests. Please wait a moment."
                : "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (status === 402) {
        const cardNames = (cards || [])
          .slice(0, 3)
          .map((c: any) => `${c.korean || c.name}${c.isReversed ? (locale === "jp" ? "(逆)" : locale === "us" ? " (Reversed)" : "(역)") : ""}`)
          .join(", ");

        const creditMessage =
          locale === "jp"
            ? "AIクレジットが不足しているため、簡易リーディングで結果を返します。クレジット追加後に再分析すると、より精密な鑑定が可能です。"
            : locale === "us"
            ? "AI credits are exhausted, so a quick fallback reading is returned. Add credits and run analysis again for full-depth results."
            : "AI 크레딧이 부족하여 요약 리딩으로 결과를 제공합니다. 크레딧 충전 후 다시 분석하면 더 정밀한 결과를 받을 수 있습니다.";

        const fallbackReading = {
          conclusion:
            locale === "jp"
              ? `${creditMessage} 현재の3枚は ${cardNames || "選択カード"} で、全体傾向は「焦らず状況整理→優先順位の再設定→行動再開」です。`
              : locale === "us"
              ? `${creditMessage} Your three cards (${cardNames || "selected cards"}) suggest a pattern of pause, clarity, then momentum.`
              : `${creditMessage} 현재 선택된 3장(${cardNames || "선택 카드"})의 흐름은 '정리 → 우선순위 재설정 → 실행'입니다.`,
          tarotAnalysis:
            locale === "jp"
              ? "現状では詳細AI生成が利用できないため、カードの基本象意を中心に解釈します。1枚目は現状認識、2枚目は課題の核、3枚目は結果/方向性を示します。逆位置がある場合、エネルギーの遅延や内面化が強まります。"
              : locale === "us"
              ? "Full AI generation is temporarily unavailable, so this is a structured quick interpretation. Card 1 reflects current context, card 2 shows the core friction, and card 3 indicates likely direction. Reversed cards suggest internal delays or blocked expression."
              : "현재는 상세 AI 생성이 불가하여 카드 기본 상징 중심으로 해석합니다. 1번 카드는 현재 국면, 2번 카드는 핵심 과제, 3번 카드는 결과/방향을 의미합니다. 역방향 카드는 에너지 지연 또는 내면화를 시사합니다.",
          tarotCardInteraction:
            locale === "jp"
              ? "3枚の組み合わせは、短期的には慎重さが必要である一方、中期的には改善余地がある流れです。"
              : locale === "us"
              ? "The three-card pattern points to short-term caution with medium-term upside if actions are staged deliberately."
              : "3장 조합은 단기적으로 신중함이 필요하지만, 중기적으로 개선 여지가 있는 흐름입니다.",
          sajuAnalysis: "",
          sajuTimeline: "",
          astrologyAnalysis: "",
          astrologyTransits: "",
          ziweiAnalysis: "",
          ziweiLifeStructure: "",
          crossValidation:
            locale === "jp"
              ? "現在は簡易モードのため、交差検証の深度は限定的です。"
              : locale === "us"
              ? "Cross-validation depth is limited in fallback mode."
              : "현재는 요약 모드로 교차 검증 깊이가 제한됩니다.",
          crossValidationMatrix: "",
          timing:
            locale === "jp"
              ? "今後1〜2週間は情報整理、3〜6週間は優先順位に沿った実行を推奨します。"
              : locale === "us"
              ? "Use weeks 1-2 for clarity and planning, then weeks 3-6 for focused execution."
              : "향후 1~2주는 정리, 3~6주는 우선순위 기반 실행을 권장합니다.",
          risk:
            locale === "jp"
              ? "不安による過剰判断と連絡タイミングの焦りに注意してください。"
              : locale === "us"
              ? "Watch for anxiety-driven overreactions and rushed communication timing."
              : "불안 기반의 과잉 판단과 성급한 연락 타이밍을 주의하세요.",
          hiddenPattern:
            locale === "jp"
              ? "同じ反応パターンを繰り返しやすいため、記録して客観視すると改善が早まります。"
              : locale === "us"
              ? "A repeating reaction loop may be running; journaling decisions can break the cycle faster."
              : "반복되는 반응 패턴이 보이므로 기록 기반 점검이 개선 속도를 높입니다.",
          advice:
            locale === "jp"
              ? "最優先は1つに絞り、今日できる小さな行動を実行してください。重要な連絡は一晩 두고 문장을 정리한 뒤 보내세요。"
              : locale === "us"
              ? "Pick one priority only and take one concrete action today. For important communication, draft first and send after a cooling-off review."
              : "우선순위를 1개로 압축하고 오늘 실행 가능한 작은 행동 1가지를 진행하세요. 중요한 연락은 초안 작성 후 하루 뒤 점검해 보내세요.",
          scores: { tarot: 62, saju: 0, astrology: 0, ziwei: 0, overall: 58 },
          fallback: true,
        };

        return new Response(JSON.stringify({ reading: fallbackReading, warning: creditMessage }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const t = await response.text();
      console.error("AI error:", status, t);
      return new Response(
        JSON.stringify({ error: locale === "jp" ? "AI分析エラー" : locale === "us" ? "AI analysis error" : "AI 분석 오류" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    let reading;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      reading = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
    } catch {
      console.error("Parse fail:", content);
      reading = { conclusion: content.slice(0, 500), tarotAnalysis: "", emotionFlow: "", sajuAnalysis: "", astrologyAnalysis: "", ziweiAnalysis: "", crossValidation: "", risk: "", advice: "", scores: { tarot: 50, saju: 0, astrology: 0, ziwei: 0, overall: 50 } };
    }

    return new Response(JSON.stringify({ reading }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-reading error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
