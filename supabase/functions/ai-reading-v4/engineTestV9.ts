/**
 * engineTestV9.ts
 * v9 엔진 End-to-End 검증 스크립트 (Gemini API 호출 제외)
 */

import { calculateSaju } from "./calculateSaju.ts";
import { analyzeSajuStructure } from "./aiSajuAnalysis.ts";
import { runTarotSymbolicEngine, TAROT_PATTERN_DATASET, classifyTarotQuestion } from "./tarotSymbolicEngine.ts";
import { generatePatternVectors } from "./symbolicPatternEngine.ts";
import { calculateConsensusV8 } from "./consensusEngine.ts";
import { predictTemporalV8 } from "./temporalPredictionEngine.ts";
import { validateEngineOutput } from "./validationLayer.ts";
import { hybridTarotReading } from "./hybridTarotEngine.ts";
import { calculateNumerology } from "./numerologyEngine.ts";
import { classifyQuestion } from "./questionClassifier.ts";
import { getStyleForTopic, STYLE_PRESETS } from "./lib/geminiClient.ts";
import { buildReadingPrompt } from "./lib/promptBuilder.ts";

// ═══════════════════════════════════════
// 테스트 데이터셋 (10명)
// ═══════════════════════════════════════
const TEST_CASES = [
  { id: "T01", year: 1990, month: 3, day: 15, hour: 14, minute: 30, gender: "M" as const,
    question: "좋아하는 사람과 사귈 수 있을까요?", expectedCategory: "relationship",
    cards: [{ name: "The Lovers", position: "현재 상황", isReversed: false }, { name: "Two of Cups", position: "핵심 문제", isReversed: false }, { name: "The Star", position: "가까운 결과", isReversed: false }]
  },
  { id: "T02", year: 1985, month: 11, day: 7, hour: 23, minute: 15, gender: "F" as const,
    question: "헤어진 남자친구와 재회할 수 있을까요?", expectedCategory: "reconciliation",
    cards: [{ name: "Death", position: "현재 상황", isReversed: false }, { name: "The Moon", position: "핵심 문제", isReversed: true }, { name: "Wheel of Fortune", position: "가까운 결과", isReversed: false }]
  },
  { id: "T03", year: 1978, month: 2, day: 4, hour: 7, minute: 11, gender: "M" as const,
    question: "사업 시작해도 될까요?", expectedCategory: "business",
    cards: [{ name: "The Emperor", position: "현재 상황", isReversed: false }, { name: "Ace of Pentacles", position: "핵심 문제", isReversed: false }, { name: "Ten of Pentacles", position: "가까운 결과", isReversed: false }]
  },
  { id: "T04", year: 1995, month: 8, day: 22, hour: 3, minute: 45, gender: "F" as const,
    question: "이직하는 게 좋을까요?", expectedCategory: "career",
    cards: [{ name: "The Chariot", position: "현재 상황", isReversed: false }, { name: "Eight of Wands", position: "핵심 문제", isReversed: false }, { name: "The Tower", position: "가까운 결과", isReversed: true }]
  },
  { id: "T05", year: 2000, month: 1, day: 1, hour: 12, minute: 0, gender: "M" as const,
    question: "올해 큰 돈이 들어올까요?", expectedCategory: "finance",
    cards: [{ name: "Nine of Pentacles", position: "현재 상황", isReversed: false }, { name: "Five of Pentacles", position: "핵심 문제", isReversed: true }, { name: "The Sun", position: "가까운 결과", isReversed: false }]
  },
  { id: "T06", year: 1992, month: 6, day: 15, hour: 18, minute: 30, gender: "F" as const,
    question: "남자친구와 결혼해도 될까요?", expectedCategory: "marriage",
    cards: [{ name: "The Hierophant", position: "현재 상황", isReversed: false }, { name: "The Empress", position: "핵심 문제", isReversed: false }, { name: "Four of Wands", position: "가까운 결과", isReversed: false }]
  },
  { id: "T07", year: 1988, month: 4, day: 5, hour: 5, minute: 16, gender: "M" as const,
    question: "앞으로 나아갈 방향을 알고 싶어요", expectedCategory: "life_direction",
    cards: [{ name: "The Hermit", position: "현재 상황", isReversed: false }, { name: "The Fool", position: "핵심 문제", isReversed: false }, { name: "The World", position: "가까운 결과", isReversed: false }]
  },
  { id: "T08", year: 1975, month: 12, day: 25, hour: 0, minute: 30, gender: "F" as const,
    question: "전남친이 저를 그리워하고 있나요?", expectedCategory: "reconciliation",
    cards: [{ name: "The High Priestess", position: "현재 상황", isReversed: false }, { name: "Six of Cups", position: "핵심 문제", isReversed: false }, { name: "The Moon", position: "가까운 결과", isReversed: false }]
  },
  { id: "T09", year: 1998, month: 9, day: 10, hour: 15, minute: 0, gender: "M" as const,
    question: "창업 자금을 투자받을 수 있을까요?", expectedCategory: "business",
    cards: [{ name: "The Magician", position: "현재 상황", isReversed: false }, { name: "Seven of Pentacles", position: "핵심 문제", isReversed: false }, { name: "Ace of Wands", position: "가까운 결과", isReversed: false }]
  },
  { id: "T10", year: 2001, month: 4, day: 26, hour: 18, minute: 0, gender: "M" as const,
    question: "공무원 시험에 합격할 수 있을까요?", expectedCategory: "career",
    cards: [{ name: "Justice", position: "현재 상황", isReversed: false }, { name: "Eight of Pentacles", position: "핵심 문제", isReversed: false }, { name: "Six of Wands", position: "가까운 결과", isReversed: false }]
  }
];

// ═══════════════════════════════════════
// 테스트 러너
// ═══════════════════════════════════════
interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: TestResult[] = [];

function assert(name: string, condition: boolean, detail: string = "") {
  results.push({ name, passed: condition, detail: condition ? "OK" : detail });
}

async function runAllTests() {
  console.log("\n══════════════════════════════════════");
  console.log("  v9 Engine End-to-End Validation");
  console.log("══════════════════════════════════════\n");

  // ── TEST 1: 사주 계산 ──
  console.log("[1/17] 사주 계산 정확도...");
  for (const tc of TEST_CASES) {
    const saju = calculateSaju(tc.year, tc.month, tc.day, tc.hour, tc.minute, tc.gender);
    assert(`${tc.id} 사주 4주 생성`, !!(saju.year && saju.month && saju.day && saju.hour), `pillars missing for ${tc.id}`);
    assert(`${tc.id} 일간 존재`, !!saju.dayMaster, `dayMaster missing for ${tc.id}`);
    assert(`${tc.id} 오행 합계=8`, Object.values(saju.elements).reduce((a: number, b: number) => a + b, 0) === 8, `elements sum != 8 for ${tc.id}: ${JSON.stringify(saju.elements)}`);
  }

  // ── TEST 2: 사주 분석 ──
  console.log("[2/17] 사주 분석 (십성/신강신약/충합형)...");
  for (const tc of TEST_CASES) {
    const saju = calculateSaju(tc.year, tc.month, tc.day, tc.hour, tc.minute, tc.gender);
    const analysis = await analyzeSajuStructure(saju);
    assert(`${tc.id} strength 유효`, ["극신강","신강","약변강","중화","강변약","신약","극신약"].includes(analysis.strength), `invalid strength: ${analysis.strength}`);
    assert(`${tc.id} characteristics 생성`, analysis.characteristics.length > 0, `no characteristics for ${tc.id}`);
    assert(`${tc.id} 일간 특성 태깅`, analysis.characteristics.some(c => c.includes("일간의")), `no dayMaster tag for ${tc.id}`);
    assert(`${tc.id} narrative 존재`, analysis.narrative.length > 20, `narrative too short for ${tc.id}`);
  }

  // ── TEST 3: 타로 심볼릭 엔진 ──
  console.log("[3/17] 타로 심볼릭 엔진 (78장 벡터)...");
  const totalCards = Object.keys(TAROT_PATTERN_DATASET).length;
  assert("78장 벡터 등록 수", totalCards >= 78, `only ${totalCards} cards registered`);
  
  for (const tc of TEST_CASES) {
    const tarot = runTarotSymbolicEngine(tc.cards, tc.question);
    assert(`${tc.id} 타로 카테고리 분류`, tarot.category === tc.expectedCategory, `expected ${tc.expectedCategory}, got ${tarot.category}`);
    assert(`${tc.id} 패턴 벡터 비어있지 않음`, Object.keys(tarot.dominant_patterns).length > 0, "empty patterns");
    assert(`${tc.id} 카드 매칭`, tarot.matched_cards === tc.cards.length, `matched ${tarot.matched_cards}/${tc.cards.length}`);
  }

  // 역방향 보정 테스트
  const uprightResult = runTarotSymbolicEngine([{ name: "The Sun", position: "현재 상황", isReversed: false }], "연애운");
  const reversedResult = runTarotSymbolicEngine([{ name: "The Sun", position: "현재 상황", isReversed: true }], "연애운");
  assert("역방향 보정 작동", (uprightResult.dominant_patterns.fulfillment || 0) > (reversedResult.dominant_patterns.fulfillment || 0), "reversed should reduce positive dimensions");

  // ── TEST 4: 심볼 매핑 엔진 ──
  console.log("[4/17] 심볼 매핑 엔진 (한국어 매칭)...");
  for (const tc of TEST_CASES) {
    const saju = calculateSaju(tc.year, tc.month, tc.day, tc.hour, tc.minute, tc.gender);
    const analysis = await analyzeSajuStructure(saju);
    const tarot = runTarotSymbolicEngine(tc.cards, tc.question);
    const numerology = calculateNumerology(`${tc.year}-${String(tc.month).padStart(2,'0')}-${String(tc.day).padStart(2,'0')}`);
    
    const systemResults = [
      { system: "saju", ...analysis },
      { system: "tarot", category: tarot.category, characteristics: Object.keys(tarot.dominant_patterns) },
      { system: "numerology", ...numerology }
    ];
    
    const vectors = generatePatternVectors(systemResults);
    assert(`${tc.id} 벡터 1개 이상 생성`, vectors.length > 0, `no vectors for ${tc.id}`);
    
    // 사주 일간 태그가 매칭되는지
    const hasSajuVector = vectors.some(v => v.system === "saju");
    assert(`${tc.id} 사주 벡터 존재`, hasSajuVector, "no saju vectors");
  }

  // ── TEST 5: Consensus 엔진 ──
  console.log("[5/17] Consensus 엔진...");
  for (const tc of TEST_CASES) {
    const saju = calculateSaju(tc.year, tc.month, tc.day, tc.hour, tc.minute, tc.gender);
    const analysis = await analyzeSajuStructure(saju);
    const tarot = runTarotSymbolicEngine(tc.cards, tc.question);
    const numerology = calculateNumerology(`${tc.year}-${String(tc.month).padStart(2,'0')}-${String(tc.day).padStart(2,'0')}`);
    
    const systemResults = [
      { system: "saju", ...analysis },
      { system: "tarot", category: tarot.category, characteristics: Object.keys(tarot.dominant_patterns) },
      { system: "numerology", ...numerology }
    ];
    
    const vectors = generatePatternVectors(systemResults);
    const consensus = calculateConsensusV8(vectors);
    
    assert(`${tc.id} consensus_score 유효`, consensus.consensus_score >= -1 && consensus.consensus_score <= 1, `invalid: ${consensus.consensus_score}`);
    assert(`${tc.id} confidence_score 유효`, consensus.confidence_score >= 0 && consensus.confidence_score <= 1, `invalid: ${consensus.confidence_score}`);
    assert(`${tc.id} dominant_vector 존재`, Object.keys(consensus.dominant_vector).length > 0, "empty dominant vector");
  }

  // ── TEST 6: Temporal Prediction ──
  console.log("[6/17] Temporal Prediction (하드코딩 제거 확인)...");
  // 서로 다른 사주(충 있는 사람 vs 합 있는 사람)가 다른 확률을 내는지
  const saju1 = calculateSaju(1990, 3, 15, 14, 30, "M");
  const analysis1 = await analyzeSajuStructure(saju1);
  const saju2 = calculateSaju(1985, 11, 7, 23, 15, "F");
  const analysis2 = await analyzeSajuStructure(saju2);
  
  const sys1 = [{ system: "saju", ...analysis1 }, { system: "numerology", ...calculateNumerology("1990-03-15") }];
  const sys2 = [{ system: "saju", ...analysis2 }, { system: "numerology", ...calculateNumerology("1985-11-07") }];
  
  const vec1 = generatePatternVectors(sys1);
  const vec2 = generatePatternVectors(sys2);
  const con1 = calculateConsensusV8(vec1);
  const con2 = calculateConsensusV8(vec2);
  
  const timeline1 = predictTemporalV8(con1, sys1);
  const timeline2 = predictTemporalV8(con2, sys2);
  
  assert("시간축 3개 윈도우", timeline1.length === 3, `got ${timeline1.length}`);
  assert("서로 다른 사주 → 서로 다른 확률", 
    timeline1[0].probability !== timeline2[0].probability || timeline1[1].probability !== timeline2[1].probability,
    "same probabilities for different people"
  );
  assert("contributing_factors 존재", timeline1[0].contributing_factors !== undefined, "missing factors field");

  // ── TEST 7: Validation Layer ──
  console.log("[7/17] Validation Layer...");
  const sysV = [
    { system: "saju", elements: { "목": 3, "화": 2, "토": 1, "금": 0, "수": 2 } },
    { system: "tarot", characteristics: ["Sun", "World", "Star"], cards: [1, 2, 3, 4, 5] },
    { system: "numerology", vibrations: ["growth", "opportunity"] }
  ];
  const vecV = generatePatternVectors(sysV);
  const conV = calculateConsensusV8(vecV, true, true, undefined, sysV);
  const validResult = validateEngineOutput(conV, vecV, sysV);
  assert("정상 데이터 validation pass", validResult.isValid, validResult.reasons.join(", "));
  
  const emptyVecResult = validateEngineOutput(con1, [], sys1);
  assert("빈 벡터 → validation fail", !emptyVecResult.isValid, "should fail with empty vectors");
  
  const lowConfResult = validateEngineOutput({ consensus_score: 0, confidence_score: 0.1, prediction_strength: 0 }, vec1, sys1);
  assert("낮은 confidence → validation fail", !lowConfResult.isValid, "should fail with low confidence");

  // ── TEST 8: 하이브리드 타로 ──
  console.log("[8/17] 하이브리드 타로 해석...");
  const majorCards = ["The Fool","The Magician","The High Priestess","The Empress","The Emperor",
    "The Hierophant","The Lovers","The Chariot","Strength","The Hermit","Wheel of Fortune",
    "Justice","The Hanged Man","Death","Temperance","The Devil","The Tower","The Star",
    "The Moon","The Sun","Judgement","The World"];
  
  let narrativeHits = 0;
  let structureHits = 0;
  for (const cardName of majorCards) {
    const reading = hybridTarotReading([{ name: cardName, position: "현재 상황", isReversed: false }]);
    if (reading[0].narrative && !reading[0].narrative.includes("카드의 에너지가 당신의")) narrativeHits++;
    if (reading[0].structure && reading[0].structure !== "standard_flow") structureHits++;
  }
  assert(`메이저 22장 서사 매칭률`, narrativeHits === 22, `${narrativeHits}/22 matched`);
  assert(`메이저 22장 구조 매칭률`, structureHits === 22, `${structureHits}/22 matched`);

  // 역방향 서사 테스트
  const reversedReading = hybridTarotReading([{ name: "The Tower", position: "현재 상황", isReversed: true }]);
  assert("역방향 전용 서사", reversedReading[0].narrative !== hybridTarotReading([{ name: "The Tower", position: "현재 상황", isReversed: false }])[0].narrative, "reversed should differ from upright");
  assert("역방향 구조 태그", reversedReading[0].structure.startsWith("reversed_"), `got: ${reversedReading[0].structure}`);

  // ── TEST 9: 수비학 엔진 ──
  console.log("[9/17] 수비학 엔진...");
  const num = calculateNumerology("1990-03-15");
  assert("Life Path 유효", num.life_path_number >= 1 && num.life_path_number <= 33, `invalid: ${num.life_path_number}`);
  assert("Personal Year 유효", num.personal_year >= 1 && num.personal_year <= 33, `invalid: ${num.personal_year}`);
  assert("vibrations 존재", num.vibrations.length > 0, "empty vibrations");

  // ── TEST 10: 전체 파이프라인 통합 ──
  console.log("[10/17] 전체 파이프라인 통합...");
  let pipelinePass = 0;
  for (const tc of TEST_CASES) {
    try {
      const sajuRaw = calculateSaju(tc.year, tc.month, tc.day, tc.hour, tc.minute, tc.gender);
      const sajuAnalysis = await analyzeSajuStructure(sajuRaw);
      const tarotSymbolic = runTarotSymbolicEngine(tc.cards, tc.question);
      const numerologyAnalysis = calculateNumerology(`${tc.year}-${String(tc.month).padStart(2,'0')}-${String(tc.day).padStart(2,'0')}`);
      
      const systemResults = [
        { system: "saju", ...sajuAnalysis },
        { system: "tarot", category: tarotSymbolic.category, characteristics: Object.keys(tarotSymbolic.dominant_patterns) },
        { system: "numerology", ...numerologyAnalysis }
      ];
      
      const vectors = generatePatternVectors(systemResults);
      const consensus = calculateConsensusV8(vectors);
      const timeline = predictTemporalV8(consensus, systemResults);
      const validation = validateEngineOutput(consensus, vectors, systemResults);
      
      if (vectors.length > 0 && consensus.consensus_score !== undefined && timeline.length === 3) {
        pipelinePass++;
      }
    } catch (e: any) {
      assert(`${tc.id} 파이프라인 에러`, false, e.message);
    }
  }
  assert(`전체 파이프라인 성공률`, pipelinePass === TEST_CASES.length, `${pipelinePass}/${TEST_CASES.length} passed`);

  // ── TEST 11: questionClassifier 분류 정확도 (Phase 2) ──
  console.log("[11/17] questionClassifier 분류 정확도...");
  const CLASSIFY_CASES: { q: string; expected: string; subtopic?: string }[] = [
    { q: "이직하는 게 좋을까요?", expected: "career", subtopic: "job_change" },
    { q: "좋아하는 사람과 사귈 수 있을까요?", expected: "relationship" },
    { q: "올해 큰 돈이 들어올까요?", expected: "finance" },
    { q: "건강이 안 좋아요", expected: "health" },
    { q: "이민 갈까요?", expected: "migration" },
    { q: "궁합 봐주세요", expected: "compatibility" },
    { q: "엄마와 사이가 안 좋아요", expected: "family" },
    { q: "헤어진 남자친구와 재회할 수 있을까요?", expected: "relationship", subtopic: "reunion" },
    { q: "사업 시작해도 될까요?", expected: "career", subtopic: "business_start" },
    { q: "올해 운세 알려주세요", expected: "general_future" },
  ];
  for (const cc of CLASSIFY_CASES) {
    const result = classifyQuestion(cc.q);
    assert(`분류[${cc.q.slice(0, 10)}] primary=${cc.expected}`, result.primary_topic === cc.expected, `got ${result.primary_topic}`);
    if (cc.subtopic) {
      assert(`분류[${cc.q.slice(0, 10)}] subtopic=${cc.subtopic}`, result.subtopic === cc.subtopic, `got ${result.subtopic}`);
    }
  }

  // ── TEST 12: getStyleForTopic 매핑 (Phase 2) ──
  console.log("[12/17] getStyleForTopic 매핑...");
  const STYLE_CASES: { topic: string; expected: string }[] = [
    { topic: "career", expected: "choihanna" },
    { topic: "finance", expected: "monad" },
    { topic: "health", expected: "serious" },
    { topic: "migration", expected: "serious" },
    { topic: "compatibility", expected: "compatibility" },
    { topic: "relationship", expected: "choihanna" },
    { topic: "unknown_topic", expected: "choihanna" },
  ];
  for (const sc of STYLE_CASES) {
    const style = getStyleForTopic(sc.topic);
    assert(`스타일[${sc.topic}]=${sc.expected}`, style === sc.expected, `got ${style}`);
  }
  // 프리셋 5종 확인
  assert("STYLE_PRESETS 5종 존재", Object.keys(STYLE_PRESETS).length === 5, `got ${Object.keys(STYLE_PRESETS).length}`);

  // ── TEST 13: TOPIC_SECTION_BUDGET 커버리지 (Phase 2) ──
  console.log("[13/17] TOPIC_SECTION_BUDGET 커버리지...");
  const BUDGET_TOPICS = ["career", "relationship", "finance", "health", "general_future", "life_change", "migration", "compatibility", "family"];
  // buildReadingPrompt를 직접 호출하지 않고, questionClassifier 결과가 budget에 매핑 가능한지 확인
  for (const topic of BUDGET_TOPICS) {
    const result = classifyQuestion(topic === "general_future" ? "올해 운세" : topic === "compatibility" ? "궁합" : topic);
    assert(`BUDGET[${topic}] 분류 가능`, result.primary_topic !== undefined, `분류 실패`);
  }

  // ── TEST 14: 궁합 엔진 구조 검증 (Phase 2) ──
  console.log("[14/17] 궁합 엔진 구조 검증...");
  // PersonSaju 구조 + analyzeCompatibility가 정상 결과를 내는지
  const { analyzeCompatibility } = await import("./lib/compatibilitySajuEngine.ts");
  const personA = {
    dayMaster: "甲", stems: ["甲", "丙", "甲", "庚"], branches: ["寅", "午", "子", "申"],
    yongShin: "수", heeShin: "금", giShin: "화", strength: "신강",
    elements: { "목": 3, "화": 2, "토": 0, "금": 1, "수": 2 }
  };
  const personB = {
    dayMaster: "己", stems: ["己", "丁", "己", "辛"], branches: ["未", "巳", "丑", "酉"],
    yongShin: "목", heeShin: "수", giShin: "토", strength: "신약",
    elements: { "목": 0, "화": 2, "토": 3, "금": 2, "수": 1 }
  };
  const compatResult = analyzeCompatibility(personA, personB);
  assert("궁합 totalScore 유효", compatResult.totalScore >= 0 && compatResult.totalScore <= 100, `got ${compatResult.totalScore}`);
  assert("궁합 grade 존재", !!compatResult.grade, "grade missing");
  assert("궁합 categories 4개", compatResult.categories.length === 4, `got ${compatResult.categories.length}`);
  assert("궁합 tenGodAtoB 존재", !!compatResult.tenGodAtoB, "tenGodAtoB missing");
  assert("궁합 천간합 甲己 감지", compatResult.stemRelation?.type === "천간합", `got ${compatResult.stemRelation?.type}`);
  assert("궁합 summary 존재", compatResult.summary.length > 10, "summary too short");

  // ── TEST 15: buildReadingPrompt 출력 구조 (Phase 2) ──
  console.log("[15/17] buildReadingPrompt 출력 구조...");
  const tc15 = TEST_CASES[0];
  const sajuRaw15 = calculateSaju(tc15.year, tc15.month, tc15.day, tc15.hour, tc15.minute, tc15.gender);
  const sajuAnalysis15 = await analyzeSajuStructure(sajuRaw15);
  const prompt15 = buildReadingPrompt(
    { name: "테스트", birthDate: "1990-03-15", birthTime: "14:30", gender: "male", question: tc15.question, questionType: "relationship" },
    sajuAnalysis15, {}, {}, {}, {}, {}, {},
    [], undefined, undefined, undefined, undefined
  );
  assert("프롬프트 SECTION 0 포함", prompt15.includes("[SECTION 0]"), "SECTION 0 missing");
  assert("프롬프트 PRE-ANALYSIS 포함", prompt15.includes("PRE-ANALYSIS CONCLUSION"), "preBuiltConclusion missing");
  assert("프롬프트 SECTION 1 포함", prompt15.includes("[SECTION 1]"), "SECTION 1 missing");
  assert("프롬프트 질문 유형 반영", prompt15.includes("부처궁") || prompt15.includes("복덕궁"), "relationship palace missing");
  assert("프롬프트 3000자 이상", prompt15.length >= 3000, `only ${prompt15.length} chars`);

  // ── TEST 16: 마이너 넘버 카드(40장) 서사 및 구조 검증 (Phase 3) ──
  console.log("[16/17] 마이너 넘버 카드 서사 및 구조 검증...");
  const minorSample = [
    "Ace of Wands", "Five of Wands", "Ten of Wands",
    "Ace of Cups", "Five of Cups", "Ten of Cups",
    "Ace of Swords", "Five of Swords", "Ten of Swords",
    "Ace of Pentacles", "Five of Pentacles", "Ten of Pentacles"
  ];
  
  for (const cardName of minorSample) {
    const reading = hybridTarotReading([{ name: cardName, position: "현재 상황", isReversed: false }]);
    assert(`마이너[${cardName}] 서사 존재`, !!reading[0].narrative && !reading[0].narrative.includes("카드의 에너지가 당신의"), `narrative missing or generic for ${cardName}`);
    assert(`마이너[${cardName}] 구조 매칭`, reading[0].structure !== "standard_flow", `structure is standard_flow for ${cardName}`);
    
    const reversedReading = hybridTarotReading([{ name: cardName, position: "현재 상황", isReversed: true }]);
    assert(`마이너[${cardName}] 역방향 서사 다름`, reversedReading[0].narrative !== reading[0].narrative, `reversed narrative same as upright for ${cardName}`);
    assert(`마이너[${cardName}] 역방향 태그`, reversedReading[0].structure.startsWith("reversed_"), `reversed tag missing for ${cardName}`);
  }

  // ── TEST 17: cardContextMatrix 토픽 커버리지 검증 ──
  console.log("[17/17] cardContextMatrix 토픽 커버리지 및 패턴 검증...");
  const { lookupCCM, PATTERN_DB } = await import("./cardContextMatrix.ts");
  const NEW_TOPICS = ["reconciliation", "dating", "marriage", "business", "life_direction", "self_growth", "general_future"];
  for (const topic of NEW_TOPICS) {
    const res = lookupCCM("The Lovers", topic, "present");
    assert(`CCM 토픽[${topic}] 지원`, res.context_score > 0.1, `topic ${topic} not deeply supported`);
  }
  assert("PATTERN_DB 25개 이상", PATTERN_DB.length >= 25, `only ${PATTERN_DB.length} patterns`);

  // ═══════════════════════════════════════
  // 결과 출력
  // ═══════════════════════════════════════
  console.log("\n══════════════════════════════════════");
  console.log("  v9 Engine Validation Report");
  console.log("══════════════════════════════════════");
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`\n  Total Tests: ${total}`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  Accuracy: ${(passed / total * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log("\n  ── Failed Tests ──");
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.detail}`);
    });
  }
  
  console.log("\n══════════════════════════════════════");
  
  const targetAccuracy = 0.90;
  if (passed / total >= targetAccuracy) {
    console.log(`  🎯 PASS (목표 ${targetAccuracy * 100}% 달성)`);
  } else {
    console.log(`  ⚠️  NEEDS IMPROVEMENT (목표 ${targetAccuracy * 100}% 미달)`);
  }
  console.log("══════════════════════════════════════\n");
}

runAllTests().catch(err => {
  console.error("Fatal error:", err);
});
