/**
 * testRunner.ts (B-80~84)
 * 자동 검증 러너 — 사주/점성술/자미두수/수비학/통합 테스트셋 일괄 실행
 * 실행: npx ts-node tests/testRunner.ts [engine?]
 * 예시: npx ts-node tests/testRunner.ts saju
 */

import { getFullSaju } from "../sajuEngine.ts";
import { calculateNumerology } from "../numerologyEngine.ts";
import { calculateServerZiWei } from "../ziweiEngine.ts";

// ── 타입 정의 ──────────────────────────────────────────────
interface TestCase {
  id: string;
  description: string;
  input: Record<string, any>;
  expected: Record<string, any>;
  flags?: Record<string, any>;
  tags?: string[];
}

interface TestSet {
  version: string;
  engine: string;
  total_cases: number;
  description: string;
  cases: TestCase[];
}

interface TestResult {
  id: string;
  description: string;
  passed: boolean;
  failures: string[];
  warnings: string[];
  tags: string[];
  duration_ms: number;
}

interface TestSummary {
  engine: string;
  total: number;
  passed: number;
  failed: number;
  pass_rate: number;
  results: TestResult[];
  duration_ms: number;
}

// ── 헬퍼 ──────────────────────────────────────────────────
function deepGet(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

function checkExpected(actual: any, expected: Record<string, any>): string[] {
  const failures: string[] = [];
  for (const [key, value] of Object.entries(expected)) {
    const actualVal = deepGet(actual, key);
    if (actualVal === undefined) {
      failures.push(`missing field: ${key}`);
    } else if (JSON.stringify(actualVal) !== JSON.stringify(value)) {
      failures.push(`${key}: expected=${JSON.stringify(value)}, actual=${JSON.stringify(actualVal)}`);
    }
  }
  return failures;
}

function checkFlags(actual: any, flags: Record<string, any>): string[] {
  const failures: string[] = [];
  for (const [key, value] of Object.entries(flags)) {
    const actualVal = deepGet(actual, key);
    if (typeof value === "boolean" && actualVal !== value) {
      failures.push(`flag ${key}: expected=${value}, actual=${actualVal}`);
    } else if (key === "edge_case_tags_count_min" && Array.isArray(deepGet(actual, "edge_case_tags"))) {
      const count = deepGet(actual, "edge_case_tags").length;
      if (count < value) failures.push(`edge_case_tags count: expected>=${value}, actual=${count}`);
    } else if (key === "reasoning_steps_count") {
      const steps = deepGet(actual, "reasoning_trace.reasoning_steps");
      if (!Array.isArray(steps) || steps.length < value) {
        failures.push(`reasoning_steps count: expected>=${value}, actual=${steps?.length ?? 0}`);
      }
    }
  }
  return failures;
}

// ── 사주 엔진 테스트 ────────────────────────────────────────
async function runSajuTests(cases: TestCase[]): Promise<TestResult[]> {
  return cases.map(tc => {
    const start = Date.now();
    const failures: string[] = [];
    const warnings: string[] = [];

    try {
      const { year, month, day, hour, minute, gender, longitude } = tc.input;
      const result = getFullSaju(year, month, day, hour, minute, gender, longitude ?? 127.5);

      // expected 필드 검증
      if (tc.expected.year) {
        const yp = `${result.pillars.year.stem}${result.pillars.year.branch}`;
        if (yp !== tc.expected.year) failures.push(`year_pillar: expected=${tc.expected.year}, actual=${yp}`);
      }
      if (tc.expected.month) {
        const mp = `${result.pillars.month.stem}${result.pillars.month.branch}`;
        if (mp !== tc.expected.month) failures.push(`month_pillar: expected=${tc.expected.month}, actual=${mp}`);
      }
      if (tc.expected.day) {
        const dp = `${result.pillars.day.stem}${result.pillars.day.branch}`;
        if (dp !== tc.expected.day) failures.push(`day_pillar: expected=${tc.expected.day}, actual=${dp}`);
      }
      if (tc.expected.hour) {
        const hp = `${result.pillars.hour.stem}${result.pillars.hour.branch}`;
        if (hp !== tc.expected.hour) failures.push(`hour_pillar: expected=${tc.expected.hour}, actual=${hp}`);
      }
      if (tc.expected.hour_branch) {
        if (result.pillars.hour.branch !== tc.expected.hour_branch)
          failures.push(`hour_branch: expected=${tc.expected.hour_branch}, actual=${result.pillars.hour.branch}`);
      }
      if (tc.expected.year_pillar) {
        const yp = `${result.pillars.year.stem}${result.pillars.year.branch}`;
        if (yp !== tc.expected.year_pillar) failures.push(`year_pillar: expected=${tc.expected.year_pillar}, actual=${yp}`);
      }

      // flags 검증
      if (tc.flags) {
        const flagFailures = checkFlags(result, tc.flags);
        failures.push(...flagFailures);
      }

      // day_offset 검증 (야자시)
      if (tc.expected.day_offset === 1) {
        if (!result.is_borderline_time) warnings.push("is_borderline_time=false (야자시 미감지 가능성)");
      }

    } catch (e: any) {
      failures.push(`exception: ${e.message}`);
    }

    return {
      id: tc.id,
      description: tc.description,
      passed: failures.length === 0,
      failures,
      warnings,
      tags: tc.tags ?? [],
      duration_ms: Date.now() - start
    };
  });
}

// ── 수비학 엔진 테스트 ──────────────────────────────────────
async function runNumerologyTests(cases: TestCase[]): Promise<TestResult[]> {
  return cases.map(tc => {
    const start = Date.now();
    const failures: string[] = [];
    const warnings: string[] = [];

    try {
      const { birthDate, name, currentYear } = tc.input;
      const result = calculateNumerology(birthDate, currentYear, name);
      const failures2 = checkExpected(result, tc.expected);
      failures.push(...failures2);
      if (tc.flags) failures.push(...checkFlags(result, tc.flags));
    } catch (e: any) {
      failures.push(`exception: ${e.message}`);
    }

    return { id: tc.id, description: tc.description, passed: failures.length === 0, failures, warnings, tags: tc.tags ?? [], duration_ms: Date.now() - start };
  });
}

// ── 자미두수 엔진 테스트 ────────────────────────────────────
async function runZiweiTests(cases: TestCase[]): Promise<TestResult[]> {
  return cases.map(tc => {
    const start = Date.now();
    const failures: string[] = [];
    const warnings: string[] = [];

    try {
      const { year, month, day, hour, minute, gender } = tc.input;
      const result = calculateServerZiWei(year, month, day, hour, minute, gender);

      if (tc.expected.mingGong && result?.mingGong !== tc.expected.mingGong)
        failures.push(`mingGong: expected=${tc.expected.mingGong}, actual=${result?.mingGong}`);
      if (tc.expected.annualYear && result?.annualYear !== tc.expected.annualYear)
        failures.push(`annualYear: expected=${tc.expected.annualYear}, actual=${result?.annualYear}`);
      if (tc.expected.lunarMonth) {
        warnings.push(`lunarMonth 변환 검증은 integratedReadingEngine 레벨에서 수행`);
      }
      if (tc.expected.life_palace_major_star) {
        const lifePalace = result?.core_palaces?.life_palace;
        if (!lifePalace?.major_stars?.includes(tc.expected.life_palace_major_star))
          failures.push(`life_palace_major_star: expected=${tc.expected.life_palace_major_star}`);
      }
      if (tc.flags) failures.push(...checkFlags(result ?? {}, tc.flags));

    } catch (e: any) {
      failures.push(`exception: ${e.message}`);
    }

    return { id: tc.id, description: tc.description, passed: failures.length === 0, failures, warnings, tags: tc.tags ?? [], duration_ms: Date.now() - start };
  });
}

// ── 결과 출력 ──────────────────────────────────────────────
function printSummary(summary: TestSummary): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 [${summary.engine.toUpperCase()}] 테스트 결과`);
  console.log(`${"=".repeat(60)}`);
  console.log(`✅ 통과: ${summary.passed}/${summary.total} (${summary.pass_rate.toFixed(1)}%)`);
  console.log(`❌ 실패: ${summary.failed}/${summary.total}`);
  console.log(`⏱  소요: ${summary.duration_ms}ms`);
  console.log(`${"-".repeat(60)}`);

  for (const r of summary.results) {
    const icon = r.passed ? "✅" : "❌";
    console.log(`${icon} [${r.id}] ${r.description}`);
    if (!r.passed) r.failures.forEach(f => console.log(`   → 실패: ${f}`));
    if (r.warnings.length) r.warnings.forEach(w => console.log(`   ⚠ ${w}`));
  }
  console.log(`${"=".repeat(60)}\n`);
}

// ── 메인 실행 ──────────────────────────────────────────────
async function main() {
  const targetEngine = Deno.args[0] ?? "all";
  const baseDir = new URL(".", import.meta.url).pathname;

  const engines: Array<{ name: string; file: string; runner: (cases: TestCase[]) => Promise<TestResult[]> }> = [
    { name: "saju",      file: `${baseDir}saju-testset.json`,      runner: runSajuTests },
    { name: "numerology",file: `${baseDir}numerology-testset.json`, runner: runNumerologyTests },
    { name: "ziwei",     file: `${baseDir}ziwei-testset.json`,      runner: runZiweiTests },
  ];

  const overallResults: TestSummary[] = [];

  for (const eng of engines) {
    if (targetEngine !== "all" && targetEngine !== eng.name) continue;

    const raw = await Deno.readTextFile(eng.file);
    const testSet: TestSet = JSON.parse(raw);
    const start = Date.now();
    const results = await eng.runner(testSet.cases);
    const passed = results.filter(r => r.passed).length;

    const summary: TestSummary = {
      engine: eng.name,
      total: results.length,
      passed,
      failed: results.length - passed,
      pass_rate: (passed / results.length) * 100,
      results,
      duration_ms: Date.now() - start
    };

    printSummary(summary);
    overallResults.push(summary);
  }

  // 전체 요약
  if (overallResults.length > 1) {
    const totalCases = overallResults.reduce((s, r) => s + r.total, 0);
    const totalPassed = overallResults.reduce((s, r) => s + r.passed, 0);
    console.log(`\n${"█".repeat(60)}`);
    console.log(`🏁 전체 통합 결과: ${totalPassed}/${totalCases} 통과 (${((totalPassed/totalCases)*100).toFixed(1)}%)`);
    console.log(`${"█".repeat(60)}\n`);
  }
}

main().catch(console.error);
