// tests/test-gemini.ts — geminiClient 로컬 테스트
// 실행: npx ts-node tests/test-gemini.ts

import * as fs from 'fs';
import * as path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env.local에서 API 키 로드
const envPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apiKey = envContent.match(/GOOGLE_GEMINI_API_KEY=(.+)/)?.[1]?.trim();

if (!apiKey) {
  console.error('❌ API 키를 찾을 수 없습니다. .env.local 파일을 확인하세요.');
  process.exit(1);
}

console.log(`✅ API 키 로드 성공: ${apiKey.slice(0, 10)}...`);

// ── fetch 기반 Gemini 호출 (geminiClient.ts 로직 복제) ──
async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  timeoutMs: number
): Promise<{ success: boolean; text: string; error?: string; elapsedMs: number }> {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const combinedText = userPrompt.trim()
    ? `[STYLE INSTRUCTION]\n${userPrompt.trim()}\n\n[READING DATA & INSTRUCTIONS]\n${systemPrompt}`
    : systemPrompt;

  const body = JSON.stringify({
    contents: [{ parts: [{ text: combinedText }] }],
    generationConfig: { maxOutputTokens: 4096, temperature }
  });

  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { success: false, text: '', error: `HTTP ${res.status}: ${errText.slice(0, 200)}`, elapsedMs: Date.now() - start };
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { success: !!text, text, elapsedMs: Date.now() - start };
  } catch (err: any) {
    clearTimeout(timer);
    return { success: false, text: '', error: err.name === 'AbortError' ? `Timeout (${timeoutMs}ms)` : err.message, elapsedMs: Date.now() - start };
  }
}

// ── 테스트 케이스 ──
async function runTests() {
  console.log('\n========== 테스트 시작 ==========\n');
  let passed = 0;
  let failed = 0;

  // TEST 1: 기본 호출
  console.log('📋 TEST 1: 기본 Gemini 호출');
  const t1 = await callGemini('안녕하세요. 짧게 인사해주세요.', '', 0.2, 15000);
  if (t1.success && t1.text.length > 0) {
    console.log(`  ✅ 성공 (${t1.elapsedMs}ms) — "${t1.text.slice(0, 50)}..."`);
    passed++;
  } else {
    console.log(`  ❌ 실패: ${t1.error}`);
    failed++;
  }

  // TEST 2: 최한나 스타일 적용
  console.log('\n📋 TEST 2: 최한나 스타일 적용');
  const choihannaStyle = `당신은 "최한나" 스타일입니다. 따뜻한 언니가 카페에서 상담하는 톤. "~하실 수 있어요", "~해보시는 건 어떨까요?" 사용. 마크다운 금지.`;
  const t2 = await callGemini('2026년 운세를 3문장으로 알려주세요. 사주 일간: 丁, 용신: 水', choihannaStyle, 0.35, 20000);
  const hasWarmTone = t2.text.includes('어요') || t2.text.includes('할까요') || t2.text.includes('네요') || t2.text.includes('거예요');
  if (t2.success && hasWarmTone) {
    console.log(`  ✅ 성공 — 따뜻한 톤 확인 (${t2.elapsedMs}ms)`);
    console.log(`  📝 "${t2.text.slice(0, 100)}..."`);
    passed++;
  } else if (t2.success) {
    console.log(`  ⚠️ 호출 성공했지만 톤이 안 맞음 (${t2.elapsedMs}ms)`);
    console.log(`  📝 "${t2.text.slice(0, 100)}..."`);
    failed++;
  } else {
    console.log(`  ❌ 실패: ${t2.error}`);
    failed++;
  }

  // TEST 3: 모나드 스타일 적용
  console.log('\n📋 TEST 3: 모나드 스타일 적용');
  const monadStyle = `당신은 "모나드" 스타일입니다. 10년차 데이터 분석가 톤. 결론 먼저. "~입니다", "~됩니다" 단정형. 감정적 위로 금지. 마크다운 금지.`;
  const t3 = await callGemini('2026년 운세를 3문장으로 알려주세요. 사주 일간: 丁, 용신: 水', monadStyle, 0.1, 20000);
  const hasColdTone = t3.text.includes('입니다') || t3.text.includes('됩니다') || t3.text.includes('필요합니다');
  if (t3.success && hasColdTone) {
    console.log(`  ✅ 성공 — 분석 톤 확인 (${t3.elapsedMs}ms)`);
    console.log(`  📝 "${t3.text.slice(0, 100)}..."`);
    passed++;
  } else if (t3.success) {
    console.log(`  ⚠️ 호출 성공했지만 톤이 안 맞음 (${t3.elapsedMs}ms)`);
    console.log(`  📝 "${t3.text.slice(0, 100)}..."`);
    failed++;
  } else {
    console.log(`  ❌ 실패: ${t3.error}`);
    failed++;
  }

  // TEST 4: 스타일 차이 검증
  console.log('\n📋 TEST 4: 최한나 vs 모나드 텍스트 차이');
  if (t2.success && t3.success && t2.text !== t3.text) {
    console.log(`  ✅ 성공 — 두 스타일의 텍스트가 다름`);
    passed++;
  } else if (t2.success && t3.success) {
    console.log(`  ❌ 실패 — 두 스타일의 텍스트가 동일함!`);
    failed++;
  } else {
    console.log(`  ⏭️ 스킵 — 이전 테스트 실패로 비교 불가`);
  }

  // TEST 5: 타임아웃 테스트
  console.log('\n📋 TEST 5: 타임아웃 처리 (1ms)');
  const t5 = await callGemini('아무 텍스트', '', 0.2, 1);
  if (!t5.success && t5.error?.includes('Timeout')) {
    console.log(`  ✅ 성공 — 타임아웃 정상 감지 (${t5.elapsedMs}ms)`);
    passed++;
  } else {
    console.log(`  ❌ 실패 — 타임아웃이 작동하지 않음`);
    failed++;
  }

  // TEST 6: 마크다운 포함 여부
  console.log('\n📋 TEST 6: 마크다운 미포함 확인');
  const hasMarkdown = t2.text.includes('**') || t2.text.includes('##') || t2.text.includes('```');
  if (!hasMarkdown) {
    console.log(`  ✅ 성공 — 마크다운 없음`);
    passed++;
  } else {
    console.log(`  ⚠️ 마크다운 감지됨 — 후처리 필요`);
    failed++;
  }

  // 결과 요약
  console.log('\n========== 테스트 결과 ==========');
  console.log(`✅ 성공: ${passed}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`총: ${passed + failed}개`);
  
  if (failed === 0) {
    console.log('\n🎉 모든 테스트 통과! 배포해도 안전합니다.');
  } else {
    console.log('\n⚠️ 실패한 테스트가 있습니다. 배포 전 확인하세요.');
  }
}

runTests().catch(console.error);
