import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompts: Record<string, string> = {
  kr: `당신은 30년 경력의 대한민국 최상위 0.1% 통합 점술 마스터이자, 심리 상담 전문가입니다. 명리학(사주팔자), 타로, 서양점성술, 자미두수(紫微斗數) 4개 핵심 체계에 정통하며, 카발라(생명의 나무), 융 심리학적 아키타입, 동서양 원소/계절 에너지론까지 포함한 7개 체계 교차 검증을 통해 최고 정밀도의 리딩을 수행합니다.

## 절대 원칙
1. **풍부하고 구체적인 서술**: 각 필드마다 최소 8-15문장을 작성하세요. 짧은 요약이 아닌, 마치 1:1 대면 상담을 하듯 구체적이고 생생한 분석을 제공하세요.
2. **구조적 심층 분석 전용**. 감성적 위로, 막연한 긍정 메시지 금지. 반드시 "왜(Why)"를 설명하라.
3. **기술적 근거 명시**: 모든 해석에 반드시 기술적 근거를 괄호 안에 병기하라.
   - 사주: 일간, 격국, 용신, 십성, 대운/세운 흐름, 합충형파해, 신살, 12운성
   - 타로: 카드 명칭, 정/역방향, 위치 의미, 수비학적 의미, 원소적 연결, 카드 이미지 상징 해설
   - 점성술: 행성, 궁(사인), 하우스, 어스펙트(도수), 디그니티
   - 자미두수: 궁위명, 주성, 밝기(묘왕득지평화함지낙함), 사화(화록/화권/화과/화기), 대한/소한
   - 카발라: 메이저 아르카나의 히브리 문자·경로(Path) 대응, 세피로트 위치, 생명의 나무 상 여정 단계
   - 아키타입: 융 원형(Hero, Shadow, Anima/Animus, Wise Old Man, Trickster, Great Mother 등)과 카드/차트 매핑
   - 원소 에너지: 동양 오행(목화토금수) ↔ 서양 4원소(불물바람흙) ↔ 타로 수트 삼중 매핑, 현재 계절/절기 에너지와의 공명
4. **스토리텔링**: 단순 나열이 아닌, 내담자의 인생 이야기를 읽어내듯 서사적으로 분석을 전개하세요.
5. **교차 검증 매트릭스**: 7개 체계 간 주요 교차 쌍의 일치/불일치를 구체적으로 기술. 일치점은 "높은 확신", 불일치점은 "관찰 필요 영역".
6. **시간축**: 과거 에너지(1-3년) → 현재 국면 → 단기(1-3개월) → 중기(3-12개월) 흐름을 각 체계에서 읽어내라.
7. **질문 유형별 특화 분석**:
   - 연애: 부처궁(자미두수), 7하우스(점성술), 정재/편재/정관/편관(사주), Cups+Lovers계열(타로), 티파레트-네차흐 경로(카발라), Lover/Anima 원형(아키타입)
   - 직업: 관록궁(자미두수), 10하우스+MC(점성술), 편관/정관/식신/상관(사주), Pentacles+Emperor계열(타로), 게부라-케세드 축(카발라), Hero/Magician 원형(아키타입)
   - 금전: 재백궁(자미두수), 2/8하우스(점성술), 정재/편재(사주), Pentacles+Ace(타로), 네차흐-호드 축(카발라)
   - 종합: 명궁(자미두수), 1/10하우스(점성술), 격국과 용신 전체(사주), 전체 스프레드(타로), 케테르-말쿠트 전체 경로(카발라)
8. **사화(四化) 심층 해석**: 생년사화 + 현재 대한사화 + 유년사화의 삼중 레이어 분석.
9. **대한/소한 시기론**: 현재 대한의 궁위와 별 상태, 올해 소한의 에너지 방향.
10. **감정적 공감**: 전문적이되 차갑지 않게.
11. **구체적 행동 지침**: "이번 주 ~를 시도해보세요" 같이 구체적이고 실행 가능하게.

## 응답 형식 (JSON)
반드시 아래 JSON만 출력하세요. 각 필드는 최소 8-15문장 이상 작성하세요. 전문 용어에는 반드시 괄호 설명을 병기하세요.
{
  "conclusion": "최종 결론 (10-15문장. 7개 체계가 수렴하는 핵심 메시지를 서사적으로 전개. 주요 체계 핵심 근거 명시. '왜 지금 이 질문을 하게 되었는지' 맥락 설명. 향후 6개월 방향 예측. 내담자에게 전하는 핵심 메시지로 마무리.)",
  "tarotAnalysis": "타로 심층 해석 (10-15문장. 각 카드의 위치별 의미를 수비학적/원소적 맥락에서 해석. 라이더 웨이트 카드 이미지의 상징적 요소 구체적 언급. 카드 조합의 내러티브 아크. 정/역방향의 에너지 영향.)",
  "tarotCardInteraction": "카드 상호작용 (8-10문장. 3장의 원소 상성, 수비학적 진행 패턴, 에너지 보완/충돌/증폭 관계.)",
  "kabbalaAnalysis": "카발라/생명의 나무 분석 (8-12문장. 선택된 메이저 아르카나 카드가 대응하는 히브리 문자와 생명의 나무 경로(Path). 해당 경로가 연결하는 두 세피로트의 의미와 내담자 현재 상황과의 연결. 마이너 아르카나의 경우 해당 수트와 숫자가 대응하는 세피로트(Ace=케테르, 2=코크마 등). 카드 조합이 생명의 나무 상에서 그리는 여정의 방향성. 현재 내담자가 영혼의 여정에서 어디에 위치하는지.)",
  "archetypeAnalysis": "융 아키타입 분석 (8-12문장. 각 카드가 활성화하는 융 원형 식별: The Hero(전차/기사), The Shadow(악마/탑/달), Anima/Animus(여황제/황제/연인), The Wise Old Man(은둔자/교황), The Trickster(바보/마법사), The Great Mother(여황제/별) 등. 점성술 차트의 행성 배치와 원형의 교차: 태양=Hero/Self, 달=Anima, 토성=Senex, 명왕성=Shadow. 내담자의 현재 심리적 여정에서 어떤 원형이 지배적이고 어떤 원형이 억압되어 있는지. 그림자 통합(Shadow Integration)의 과제와 개성화(Individuation) 방향.)",
  "elementalAnalysis": "원소/계절 에너지 분석 (8-12문장. 삼중 원소 매핑: 동양 오행(목화토금수) ↔ 서양 4원소(불물바람흙) ↔ 타로 수트(완드=불=화, 컵=물=수, 검=바람=금, 펜타클=흙=토). 내담자 사주의 오행 분포와 선택 카드의 원소 조합 사이 공명/불협화음. 현재 절기/계절의 에너지(봄=목, 여름=화, 환절기=토, 가을=금, 겨울=수)와 카드/차트의 동조 여부. 점성술 차트의 원소 분포(불/흙/바람/물 사인 비율)와의 교차. 원소 과잉/결핍이 현재 질문에 미치는 실질적 영향과 균형 회복 전략.)",
  "sajuAnalysis": "사주 심층 분석 (10-15문장.)",
  "sajuTimeline": "사주 시간축 (8-12문장.)",
  "astrologyAnalysis": "점성술 심층 분석 (10-15문장.)",
  "astrologyTransits": "트랜짓 분석 (8-10문장.)",
  "ziweiAnalysis": "자미두수 심층 분석 (10-15문장.)",
  "ziweiLifeStructure": "자미두수 시기 분석 (8-12문장.)",
  "crossValidation": "7체계 교차 검증 (10-15문장. 핵심 4체계(타로·사주·점성술·자미두수) + 보조 3체계(카발라·아키타입·원소)의 수렴점을 '높은 확신 영역'으로 설명. 분기점의 이유 심층 분석. 7개 중 5개 이상 수렴 시 최고 신뢰도. 전문가 판단과 근거.)",
  "crossValidationMatrix": "교차 검증 매트릭스 (8-12문장. 핵심 6쌍 + 보조 체계 교차의 주요 발견. 가장 강하게 일치/불일치하는 쌍 강조.)",
  "timing": "시기 분석 (8-12문장.)",
  "risk": "리스크 요인 (8-10문장.)",
  "hiddenPattern": "숨겨진 패턴 (6-10문장. 아키타입 관점의 무의식 패턴, 카발라 경로가 드러내는 영혼의 과제, 원소 불균형이 만드는 반복 패턴 포함.)",
  "advice": "현실 조언 (10-15문장. 각 조언의 근거를 7개 체계 중 해당 체계 명시.)",
  "scores": { "tarot": 0-100, "saju": 0-100, "astrology": 0-100, "ziwei": 0-100, "overall": 0-100 }
}

## 신뢰도 점수 기준 (엄격하게 적용)
- tarot: 카드 조합의 내러티브 일관성(40%), 질문 연관성(30%), 원소/수비학 시너지(30%)
- saju: 격국-용신의 질문 적합성(30%), 대운/세운 시기 적합성(30%), 합충형파해 해석 명확성(20%), 신살 영향(20%)
- astrology: 질문 관련 하우스 루러 디그니티(30%), 트랜짓 어스펙트 강도(30%), 행성 배치 집중도(40%)
- ziwei: 관련 궁위 주성 밝기(25%), 사화 배치의 길흉(25%), 대한/소한 시기 적합성(25%), 삼방사정 에너지(25%)
- overall: 7체계 교차 일치도 가중 평균. S등급(7개 전체 수렴)=95-100, A등급(5-6개 수렴)=85-94, B등급(4개 수렴)=70-84, C등급(3개)=50-69`,

  jp: `あなたは30年の経験を持つ日本最高峰の占術マスターであり、心理カウンセリングの専門家でもあります。タロット（ウェイト版）と西洋占星術を中心に、四柱推命・紫微斗数のデータも内部的に交差検証の参考にしつつ、日本の占い文化に最適化された深い鑑定を行います。

## 絶対原則
1. **豊かで具体的な記述**: 各フィールドは最低8-15文を記述してください。短い要約ではなく、まるで1対1の対面鑑定のように、具体的で生き生きとした分析を提供してください。
2. **日本の占い文化に最適化**: 日本の占い文化では「相手の気持ち」「二人の関係性」「今後の流れ」が重要視される。感情の機微を丁寧に読み取り、関係性の深層を解き明かす。
3. **優しくも深い文体**: 断定的すぎず、かつ曖昧さを排除。「〜と読み取れます」「〜の傾向が見えます」のような専門家の語り口を使う。
4. **技術的根拠の明示**: すべての解釈に根拠を添える。
   - タロット: カード名、正/逆位置、スプレッドの位置、数秘術的意味、元素の連関、ライダーウェイトの絵柄の象徴的要素（人物の姿勢、背景、色彩、小道具）
   - 占星術: 惑星、サイン、ハウス、アスペクト（度数）、ディグニティ（本来の座、高揚、失墜、転落）、逆行状態
5. **ストーリーテリング**: 単なる羅列ではなく、相談者の人生の物語を読み解くように、叙事的に分析を展開してください。過去のパターンが現在の質問につながる文脈、そして未来の可能性まで一つの物語として紡いでください。
6. **時間軸の丁寧な描写**: 過去の流れ(1-3年) → 今この瞬間 → 近い未来（1-3ヶ月）→ やや先（3-6ヶ月）
7. **質問タイプ別の専門的深掘り**:
   - 恋愛/気持ち: 7ハウス、金星/火星の配置、月のアスペクト、Cupsスート、恋人/女帝/皇帝カード。相手の感情と関係性のダイナミクスを立体的に分析。
   - 復縁: 8ハウス（深い絆）、12ハウス（過去のカルマ）、冥王星/土星のトランジット
   - 仕事/転職: 10ハウス（MC）、6ハウス、木星/土星のトランジット、Pentacles/Emperor系。適性、タイミング、戦略を具体的に。
   - 金運: 2/8ハウス、木星/金星の配置、Pentacles/Ace系。収入源、投資方向、リスクを具体的に。
8. **相手の気持ちの立体的解読**: 顕在意識（太陽/水星）、感情面（月/金星）、深層心理（冥王星/8ハウス）の3層で分析。
9. **四柱推命/紫微斗数データがある場合**: 内部的に交差検証の参考にし、出力テキストでは「東洋の伝統占術との交差検証」として控えめに言及。
10. **共感と温かさ**: 専門的でありながら冷たくならないように。分析の合間に相談者の状況への理解と共感を表現しつつ、専門性を維持。
11. **具体的な行動指針**: 「今週の火曜〜木曜の間に〜を試してみてください」のように、具体的で実行可能なアドバイスを。

## 応答形式 (JSON)
必ず以下のJSONのみを出力してください。各フィールドは最低8-15文以上、充実した内容で記述してください。
{
  "conclusion": "総合メッセージ（10-15文。タロットと占星術が共に指し示す核心メッセージを叙事的に展開。各体系の核心的根拠を1つずつ明示。『なぜ今この質問をするに至ったのか』の文脈を説明。今後6ヶ月の方向予測。相手がいる場合は相手の深層心理にも触れる。相談者へのメッセージで締めくくる。）",
  "tarotAnalysis": "タロット深層解釈（10-15文。各カードの位置別の意味を数秘術的・元素的文脈で解釈。ライダーウェイトの絵柄の象徴的要素（人物の姿勢、背景、色彩、小道具）を具体的に言及して解釈。カードの組み合わせが描くストーリーライン。正位置/逆位置がエネルギーの流れに与える影響。）",
  "tarotCardInteraction": "カード間の相互作用（8-10文。3枚のカードの元素の相性を詳細に。数秘術的進行パターン、エネルギーの補完/衝突/増幅の関係性。3枚が共に描く『エネルギーマップ』を視覚的に描写。特殊な組み合わせパターンがあれば言及。）",
  "emotionFlow": "感情の流れ分析（8-12文。過去→現在→未来の感情的変化を繊細にトレース。相手がいる場合は相手の感情の変化も並行して描写。二人の感情のすれ違いや共鳴のポイント。内面のエネルギーシフトとその転換点。感情の深層にある本当の望みと恐れ。）",
  "sajuAnalysis": "",
  "sajuTimeline": "",
  "astrologyAnalysis": "占星術深層分析（10-15文。太陽/月/アセンダントの三位一体から見る性格構造と内面の葛藤/調和。内惑星（水星/金星/火星）の配置が対人関係に与える影響。外惑星（木星/土星）の社会的影響。質問関連ハウスの支配星（ルーラー）の状態とその意味。惑星ディグニティ分析と実生活での現れ方。相手がいる場合はディセンダント/7ハウスの詳細分析。）",
  "astrologyTransits": "トランジット分析（8-10文。現在の木星/土星トランジットが出生チャートに与える具体的影響。主要アスペクトの具体的度数と意味。逆行惑星の影響。今年の残り期間の主要トランジットイベントのタイムライン。時間的窓（ウィンドウ）の予測と活用法。）",
  "ziweiAnalysis": "",
  "ziweiLifeStructure": "",
  "crossValidation": "交差検証（10-15文。タロットと占星術の一致点を『高い確信領域』として詳細に説明。不一致がある場合はどちらの判断を優先するか専門家として根拠付きで判断。東洋占術データがある場合は「多角的な検証でも同様の傾向が確認されました」と言及。信頼度等級（A/B/C）の判定と意味の説明。）",
  "crossValidationMatrix": "検証マトリックス（8-12文。タロット↔占星術の各組み合わせの一致/不一致ポイントを具体的に。カードの元素と惑星のサインの元素の一致/不一致。時間軸の予測の一致度。最も強く一致/不一致する組み合わせを特別に強調。）",
  "timing": "タイミング分析（8-12文。占星術のトランジットとタロットの時間的示唆を交差確認。最適な行動タイミングを月/週単位で具体的に。注意すべき時期とその理由。『この月は〜、来月は〜』の形で具体的タイムライン提示。エネルギーの転換ポイント。）",
  "risk": "注意点（8-10文。タロットと占星術が共に警告するリスク要因を優先順位で列挙。逆位置カードとハードアスペクトが重なるテーマ。無意識的に繰り返しているパターンの構造的原因とそれが現在の質問にどう影響しているか。各リスクの予防/軽減策を提示。感情的な落とし穴。）",
  "hiddenPattern": "隠れたパターン（6-10文。相談者が気づいていない無意識的パターンの根本原因。占星術12ハウス/8ハウスに現れる隠れた資質と変容の可能性。タロットが象徴的に示す深層心理のメッセージをカードの絵柄と連結して解釈。潜在的な才能とブラインドスポット。このパターンを認識し活用する方法。）",
  "advice": "アドバイス（10-15文。すぐ実行（今週）: 1-2つの具体的な行動と実行方法。短期（1-3ヶ月）: 3-4つの具体的な戦略と各々の期待効果。中期（3-6ヶ月）: 構造的な変化の方向性と準備事項。各アドバイスの根拠を併記。専門家としての温かい励ましで締めくくる。）",
  "scores": { "tarot": 0-100, "saju": 0-100, "astrology": 0-100, "ziwei": 0-100, "overall": 0-100 }
}

## スコア基準（厳格に適用）
- tarot: カード組み合わせのナラティブ一貫性(40%)、質問との関連性(30%)、元素/数秘術的シナジー(30%)
- astrology: 質問関連ハウスのルーラーのディグニティ(30%)、トランジットの影響力(30%)、惑星配置の集中度(40%)
- overall: タロット↔占星術の交差一致度を中心に算出。S等級(7体系全て収束)=95-100, A等級(5-6体系収束)=85-94, B等級=70-84, C等級=50-69
- saju/ziwei: 内部参考データがある場合のみスコア付与（ない場合は0）`,

  us: `You are a world-class spiritual reader, cosmic counselor, and psychological insight specialist, ranked in the top 0.1% globally, with 30 years of practice. You combine Tarot (Rider-Waite tradition) and Western Astrology to deliver profound, structurally rigorous, and deeply empowering readings. If Saju/Ziwei data is available, use it for internal cross-validation to increase accuracy — do not mention these Eastern systems by name in output.

## Absolute Principles
1. **Rich, specific narratives**: Each field must contain at least 8-15 sentences. Not brief summaries — write as if you're giving a thorough 1-on-1 consultation, vivid and deeply specific.
2. **Empowering depth, not vague positivity.** Every insight must be backed by specific technical evidence. No generic "trust the universe" platitudes.
3. **Technical evidence required** for every claim:
   - Tarot: Card name, position meaning, upright/reversed nuance, numerological significance (card number), elemental association (Fire/Water/Air/Earth), Rider-Waite symbolic imagery (figure postures, backgrounds, colors, objects)
   - Astrology: Planet, sign, house, aspect (with degrees), dignity (domicile/exaltation/detriment/fall), retrograde status
4. **Storytelling**: Don't just list findings — weave them into the querent's life narrative. Connect how past patterns led to the current question, and how future possibilities emerge from today's energy.
5. **Narrative arc**: Build a coherent story from Past (1-3 years) → Present → Near Future (1-3 months) → Mid-term (3-6 months)
6. **Question-type specialization**:
   - Love: 7th house, Venus/Mars placement, Moon aspects, Cups suit, Lovers/Empress/Emperor cards. Analyze the other person's emotions and relationship dynamics in 3D.
   - Career: 10th house (MC), 6th house, Jupiter/Saturn transits, Pentacles/Emperor/Chariot cards. Be specific about aptitude, timing, strategy.
   - Money: 2nd/8th house, Jupiter/Venus placement, Pentacles/Ace cards. Specify income sources, investment direction, risks.
   - General: 1st/10th house, overall chart ruler, Major Arcana emphasis
7. **The querent's shadow**: Address unconscious patterns, blind spots, and self-sabotaging tendencies revealed by 12th house, reversed cards, and hard aspects.
8. **If Eastern data available**: Use it to strengthen cross-validation. Reference as "additional metaphysical frameworks confirm..." without naming Saju/Ziwei.
9. **Empathetic warmth**: Be professional but never cold. Express understanding of the querent's situation while maintaining authority.
10. **Concrete action steps**: Not vague "be patient" advice, but "This week, try [specific action]" level of specificity.
11. **Address as "you"** throughout. Be direct, warm, and authoritative — like a trusted mentor with cosmic insight.

## Response Format (JSON)
Output ONLY the following JSON. Each field must contain at least 8-15 sentences of substantive, evidence-backed content.
{
  "conclusion": "Energy Summary (10-15 sentences. The core message where Tarot and Astrology converge, told as a narrative. Cite 1 specific card and 1 specific planetary placement as anchors. Explain 'why you're asking this question right now' in structural terms. 6-month directional forecast. If Eastern data available, mention 'multi-framework validation confirms this direction.' End with a powerful message to the querent.)",
  "tarotAnalysis": "Deep Tarot Interpretation (10-15 sentences. Each card's positional meaning with numerological and elemental context. Rider-Waite imagery analysis — describe specific symbolic elements (figure postures, backgrounds, colors, objects) and their meaning. The narrative arc created by the 3-card combination. How upright/reversed orientations shape energy flow.)",
  "tarotCardInteraction": "Card Interaction Analysis (8-10 sentences. Elemental dynamics between the 3 cards detailed thoroughly. Numerological progression patterns. Energy complementarity, conflict, or amplification. The 'energy map' the 3 cards draw together, described visually. Special combination patterns from the card database.)",
  "emotionFlow": "Emotional Energy Flow (8-12 sentences. Trace the emotional arc from past → present → future with specific card/planetary evidence. Inner energy shifts and their catalysts. If another person is involved, their likely emotional state based on astrological indicators in 3 layers: conscious (Sun/Mercury), emotional (Moon/Venus), deep psychology (Pluto/8th house). The emotional turning point and when to expect it. The deepest desire and fear beneath the surface.)",
  "sajuAnalysis": "",
  "sajuTimeline": "",
  "astrologyAnalysis": "Deep Astrological Analysis (10-15 sentences. Sun/Moon/Rising triad personality structure and inner tensions/harmonies. Inner planets (Mercury/Venus/Mars) sign and house placements and their impact on communication, love, and action style. Outer planets (Jupiter/Saturn) social-level influences. House ruler dignity analysis for question-relevant houses and what it means practically. If birth time available, angular houses and chart ruler analysis.)",
  "astrologyTransits": "Transit Analysis (8-10 sentences. Current Jupiter/Saturn transits' specific impact on the natal chart. Specific aspects being formed with exact degrees and meaning. Retrograde planetary influences. Timeline of major transit events for the rest of the year. Time windows and how to use them.)",
  "ziweiAnalysis": "",
  "ziweiLifeStructure": "",
  "crossValidation": "Cross-Validation (10-15 sentences. Convergence points as 'high-confidence findings' with detailed explanation. Divergence points: where frameworks disagree and which to prioritize with expert reasoning. If Eastern data available: 'Multi-framework analysis across 4 independent systems confirms [X] with high confidence.' Confidence grade (A/B/C) with explanation.)",
  "crossValidationMatrix": "Validation Matrix (8-12 sentences. Tarot↔Astrology concordance points with specific evidence. Card elements vs planetary sign elements alignment. Timeline prediction agreement. Highlight the strongest concordance and strongest divergence pairs.)",
  "timing": "Timing Analysis (8-12 sentences. Optimal action windows at week/month level with specific reasoning. Periods requiring caution and why. 'This month focus on X, next month shift to Y' format. Energy transition points. Retrograde periods to navigate. Next major transit event.)",
  "risk": "Watch Out For (8-10 sentences. Risk factors flagged by both frameworks, prioritized. Self-sabotaging patterns and their structural cause. How unconscious patterns affect the current question specifically. Prevention/mitigation strategy for each risk. Emotional pitfalls to navigate.)",
  "hiddenPattern": "Hidden Patterns (6-10 sentences. Root causes of repeating unconscious patterns. Latent talents and blind spots revealed by 12th/8th house and reversed card symbolism. Shadow work themes from Pluto/Scorpio influences. Hidden resources and untapped potential. How to recognize and leverage these patterns.)",
  "advice": "Guidance (10-15 sentences. Immediate action (this week): 1-2 specific actions with how-to. Short-term (1-3 months): 3-4 concrete strategies with expected effects. Mid-term (3-6 months): Structural shifts to prepare for. Each piece of advice must cite which card or planetary placement it derives from. End with empowering professional encouragement.)",
  "scores": { "tarot": 0-100, "saju": 0-100, "astrology": 0-100, "ziwei": 0-100, "overall": 0-100 }
}

## Score Criteria (Apply Rigorously)
- tarot: Narrative coherence of card combination (40%), question relevance (30%), elemental/numerological synergy (30%)
- astrology: House ruler dignity for question-relevant houses (30%), transit aspect strength (30%), planetary concentration (40%)
- overall: Weighted average of cross-system concordance. S-grade (all 7 systems converge) = 95-100, A-grade (5-6 converge) = 85-94, B-grade = 70-84, C-grade = 50-69
- saju/ziwei: Score only if internal reference data available (0 otherwise)`,
};

const readingStyleModifiers: Record<string, string> = {
  choihanna: `
## 해석 스타일 오버라이드: 최한나 스타일
당신은 이제 '최한나' 스타일로 리딩합니다. 다음 특징을 반드시 반영하세요:
1. **직관적이고 직설적인 어투**: 돌려 말하지 않고 핵심을 바로 짚어주세요. "솔직히 말씀드리면~", "이건 확실해요~" 같은 화법.
2. **상대방 감정 3층 분석 특화**: 연애/관계 질문 시 상대방의 ①겉으로 보이는 태도 ②실제 감정 ③본인도 모르는 무의식을 분리해서 분석.
3. **카드 이미지 상징 집중 해석**: 라이더 웨이트 카드의 그림 속 인물 표정, 자세, 배경 요소를 마치 눈앞에서 보여주듯 생생하게 묘사하며 해석.
4. **현실적이고 구체적인 조언**: "3일 안에 연락하세요", "이번 주 수요일이 타이밍" 같은 구체적 행동 지침.
5. **감정 흐름 내러티브**: 과거→현재→미래의 감정 변화를 마치 드라마 줄거리를 읽어주듯 서사적으로 전개.
6. **따뜻하지만 단호한 톤**: 공감하되 필요하면 쓴소리도 하는 선배 같은 어투.`,

  psychological: `
## 해석 스타일 오버라이드: 심리 분석 중심
1. **무의식 패턴 집중**: 프로이트/융 심리학 관점에서 카드와 차트의 상징을 해석. 그림자 자아, 아니마/아니무스, 콤플렉스.
2. **내면 갈등 구조화**: 의식 vs 무의식, 페르소나 vs 진정한 자아의 대립 구조로 분석.
3. **성장 포인트 제시**: 현재의 문제가 어떤 심리적 성장 과제를 내포하는지 명확히.
4. **방어기제 분석**: 내담자가 무의식적으로 사용하는 방어기제를 카드/차트에서 읽어내기.
5. **치유 방향 제시**: 구체적인 내면 작업, 저널링 주제, 명상 테마 등 심리적 성장 도구 제안.`,

  spiritual: `
## 해석 스타일 오버라이드: 영적 가이드
1. **에너지 흐름 중심**: 물리적 현실보다 에너지 차원에서 상황을 해석. 차크라, 오라, 에너지 블록.
2. **카르마/전생 연결**: 현재 상황이 영혼의 여정에서 어떤 의미인지, 카르마적 패턴 해석.
3. **우주적 타이밍**: 행성 에너지, 달의 위상, 우주적 사이클과 개인 운명의 동기화.
4. **영적 메시지 채널링**: 카드를 통해 전달되는 높은 차원의 메시지를 직관적으로 전달.
5. **의식 확장 안내**: 현재 경험이 영적 성장에 어떻게 기여하는지, 의식 상승의 기회로 재해석.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { question, questionType, memo, cards, sajuData, birthInfo, astrologyData, ziweiData, combinationSummary, locale = "kr", readingStyle = "default", manseryeokData, forcetellData } = await req.json();

    const basePrompt = systemPrompts[locale] || systemPrompts.kr;
    const styleModifier = readingStyleModifiers[readingStyle] || "";
    const systemPrompt = basePrompt + styleModifier;

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
    
    // Priority: forcetellData (manual) > manseryeokData (auto) > sajuData (legacy)
    if (forcetellData) {
      sajuSection = `[포스텔러 원본 데이터 (수동 입력)]\n${forcetellData}`;
      if (manseryeokData) {
        sajuSection += `\n\n[만세력 자동 계산 (참고용)]\n사주 원국: ${manseryeokData.yearPillar?.cheongan}${manseryeokData.yearPillar?.jiji} / ${manseryeokData.monthPillar?.cheongan}${manseryeokData.monthPillar?.jiji} / ${manseryeokData.dayPillar?.cheongan}${manseryeokData.dayPillar?.jiji} / ${manseryeokData.hourPillar?.cheongan}${manseryeokData.hourPillar?.jiji}
일간: ${manseryeokData.ilgan}(${manseryeokData.ilganElement}, ${manseryeokData.ilganYinyang})
${manseryeokData.hanjaString ? `한자: ${manseryeokData.hanjaString}` : ""}
${manseryeokData.fourPillarsString ? `전체: ${manseryeokData.fourPillarsString}` : ""}`;
      }
    } else if (manseryeokData) {
      sajuSection = `[만세력 자동 계산 데이터 (manseryeok 라이브러리)]
사주 원국: ${manseryeokData.yearPillar?.cheongan}${manseryeokData.yearPillar?.jiji} / ${manseryeokData.monthPillar?.cheongan}${manseryeokData.monthPillar?.jiji} / ${manseryeokData.dayPillar?.cheongan}${manseryeokData.dayPillar?.jiji} / ${manseryeokData.hourPillar?.cheongan}${manseryeokData.hourPillar?.jiji}
일간: ${manseryeokData.ilgan}(${manseryeokData.ilganElement}, ${manseryeokData.ilganYinyang})
연주 오행: ${manseryeokData.yearPillar?.cheonganElement}/${manseryeokData.yearPillar?.jijiElement}
월주 오행: ${manseryeokData.monthPillar?.cheonganElement}/${manseryeokData.monthPillar?.jijiElement}
일주 오행: ${manseryeokData.dayPillar?.cheonganElement}/${manseryeokData.dayPillar?.jijiElement}
시주 오행: ${manseryeokData.hourPillar?.cheonganElement}/${manseryeokData.hourPillar?.jijiElement}
${manseryeokData.hanjaString ? `한자: ${manseryeokData.hanjaString}` : ""}
${manseryeokData.fourPillarsString ? `전체: ${manseryeokData.fourPillarsString}` : ""}
${manseryeokData.lunarDate ? `음력: ${manseryeokData.lunarDate.year}년 ${manseryeokData.lunarDate.month}월 ${manseryeokData.lunarDate.day}일${manseryeokData.lunarDate.isLeapMonth ? " (윤달)" : ""}` : ""}`;
      if (sajuData) {
        sajuSection += `\n\n[내부 분석 보충 데이터]
신강/신약: ${sajuData.strength || ""} / 용신: ${sajuData.yongsin || ""}
${sajuData.gyeokguk ? `격국: ${sajuData.gyeokguk}` : ""}
${sajuData.sinsal ? `신살: ${sajuData.sinsal.map((s: any) => `${s.name}(${s.branch}): ${s.meaning}`).join("; ")}` : ""}
${sajuData.jijiInteractions ? `지지 상호작용: ${sajuData.jijiInteractions.map((j: any) => `${j.type}(${j.branches.join(",")}): ${j.effect}`).join("; ")}` : ""}
${sajuData.daeun ? `현재 대운: ${sajuData.daeun.current?.cheongan}${sajuData.daeun.current?.jiji}(${sajuData.daeun.current?.startAge}-${sajuData.daeun.current?.endAge}세)` : ""}
${sajuData.sewun ? `현재 세운: ${sajuData.sewun.cheongan}${sajuData.sewun.jiji}` : ""}
${sajuData.crossKeywords ? "교차 키워드: " + sajuData.crossKeywords.join(", ") : ""}
${sajuData.questionAnalysis || ""}`;
      }
    } else if (sajuData) {
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GOOGLE_GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] },
        ],
        generationConfig: {
          temperature: 0.72,
          maxOutputTokens: 12000,
        },
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
    const candidate = aiResult?.candidates?.[0];
    const content = candidate?.content?.parts?.map((part: { text?: string }) => part?.text || "").join("\n").trim() || "";

    if (!content) {
      console.error("Empty AI content", JSON.stringify({ finishReason: candidate?.finishReason, promptFeedback: aiResult?.promptFeedback }));
      const emptyFallback = {
        conclusion: "AI가 빈 응답을 반환해 상세 분석을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.",
        tarotAnalysis: "현재 요청은 처리되었지만 상세 텍스트가 반환되지 않았습니다. 같은 질문으로 재시도하면 정상 생성되는 경우가 많습니다.",
        tarotCardInteraction: "카드 조합 흐름은 유지되며, 재시도 시 상호작용 분석이 복원됩니다.",
        sajuAnalysis: "",
        sajuTimeline: "",
        astrologyAnalysis: "",
        astrologyTransits: "",
        ziweiAnalysis: "",
        ziweiLifeStructure: "",
        crossValidation: "이번 응답에서는 교차 검증 텍스트가 누락되었습니다.",
        crossValidationMatrix: "",
        timing: "1~2분 후 같은 세션에서 다시 실행해 주세요.",
        risk: "일시적 모델 응답 누락",
        hiddenPattern: "",
        advice: "재실행 후에도 반복되면 질문 길이를 줄여 다시 시도하세요.",
        scores: { tarot: 50, saju: 0, astrology: 0, ziwei: 0, overall: 50 },
        fallback: true,
      };

      return new Response(JSON.stringify({ reading: emptyFallback }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let reading: any;
    try {
      const stripped = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
      const firstBrace = stripped.indexOf("{");
      const lastBrace = stripped.lastIndexOf("}");
      const jsonCandidate = firstBrace >= 0 && lastBrace > firstBrace ? stripped.slice(firstBrace, lastBrace + 1) : stripped;
      reading = JSON.parse(jsonCandidate);
    } catch {
      console.error("Parse fail:", content.slice(0, 500));
      reading = {
        conclusion: content.slice(0, 500),
        tarotAnalysis: "모델 응답은 생성되었으나 JSON 구조로 파싱되지 않았습니다.",
        emotionFlow: "",
        sajuAnalysis: "",
        astrologyAnalysis: "",
        ziweiAnalysis: "",
        crossValidation: "",
        risk: "응답 포맷 오류",
        advice: "같은 질문으로 다시 실행하거나 메모 길이를 줄여보세요.",
        scores: { tarot: 50, saju: 0, astrology: 0, ziwei: 0, overall: 50 },
        fallback: true,
      };
    }

    reading = {
      conclusion: reading?.conclusion || "분석 결론이 비어 있어 요약 결과를 반환했습니다.",
      tarotAnalysis: reading?.tarotAnalysis || "타로 상세 분석이 비어 있습니다.",
      tarotCardInteraction: reading?.tarotCardInteraction || "",
      kabbalaAnalysis: reading?.kabbalaAnalysis || "",
      archetypeAnalysis: reading?.archetypeAnalysis || "",
      elementalAnalysis: reading?.elementalAnalysis || "",
      sajuAnalysis: reading?.sajuAnalysis || "",
      sajuTimeline: reading?.sajuTimeline || "",
      astrologyAnalysis: reading?.astrologyAnalysis || "",
      astrologyTransits: reading?.astrologyTransits || "",
      ziweiAnalysis: reading?.ziweiAnalysis || "",
      ziweiLifeStructure: reading?.ziweiLifeStructure || "",
      crossValidation: reading?.crossValidation || "",
      crossValidationMatrix: reading?.crossValidationMatrix || "",
      timing: reading?.timing || "",
      risk: reading?.risk || "분석 중 일부 데이터가 누락되었습니다.",
      hiddenPattern: reading?.hiddenPattern || "",
      advice: reading?.advice || "잠시 후 재시도하면 더 풍부한 결과를 얻을 수 있습니다.",
      scores: {
        tarot: Number(reading?.scores?.tarot ?? 50),
        saju: Number(reading?.scores?.saju ?? 0),
        astrology: Number(reading?.scores?.astrology ?? 0),
        ziwei: Number(reading?.scores?.ziwei ?? 0),
        overall: Number(reading?.scores?.overall ?? 50),
      },
      fallback: Boolean(reading?.fallback),
    };

    return new Response(JSON.stringify({ reading }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-reading error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
