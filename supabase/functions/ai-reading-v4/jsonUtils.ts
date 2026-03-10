/**
 * jsonUtils.ts
 * Gemini 응답에서 JSON을 안전하게 파싱하는 유틸 전용 파일.
 */

export function safeParseGeminiJSON(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') return {};

  // Step 1: 코드블록 추출
  let jsonString = '';
  const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1].trim();
  } else {
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      jsonString = rawText.substring(start, end + 1);
    } else {
      jsonString = rawText.trim();
    }
  }

  // Step 2: 첫 시도 — 그대로 파싱
  try {
    return JSON.parse(jsonString);
  } catch (e1) {
    console.warn('[safeParseGeminiJSON] Step 2 failed:', (e1 as Error).message);
  }

  // Step 3: 문자열 내부 줄바꿈/탭 이스케이프
  try {
    const escaped = jsonString.replace(
      /"(?:[^"\\]|\\.)*"/gs,
      (match) => match
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
    );
    return JSON.parse(escaped);
  } catch (e2) {
    console.warn('[safeParseGeminiJSON] Step 3 failed');
  }

  // Step 4: 제어 문자 전체 제거
  try {
    const cleaned = jsonString.replace(/[\x00-\x1F\x7F]/g, ' ');
    return JSON.parse(cleaned);
  } catch (e3) {
    console.warn('[safeParseGeminiJSON] Step 4 failed');
  }

  // Step 5: jsonrepair 패턴 — 콤마 누락, 따옴표 깨짐 수정
  try {
    let repaired = jsonString;
    // 콤마 누락 수정: }" 또는 ]" 패턴 → }," 또는 ],"
    repaired = repaired.replace(/}\s*"/g, '}, "');
    repaired = repaired.replace(/]\s*"/g, '], "');
    // 값 뒤 콤마 누락: "value" "key" → "value", "key"
    repaired = repaired.replace(/"\s+"/g, '", "');
    // 숫자/bool 뒤 콤마 누락
    repaired = repaired.replace(/(true|false|null|\d+\.?\d*)\s*\n\s*"/g, '$1,\n"');
    // 문자열 값 끝 뒤 콤마 누락
    repaired = repaired.replace(/"\s*\n\s*"/g, '",\n"');
    // 제어 문자 제거
    repaired = repaired.replace(/[\x00-\x1F\x7F]/g, ' ');
    return JSON.parse(repaired);
  } catch (e4) {
    console.warn('[safeParseGeminiJSON] Step 5 repair failed');
  }

  // Step 6: 잘린 JSON 복구 — 닫는 괄호 부족 시 추가
  try {
    let truncFixed = jsonString.replace(/[\x00-\x1F\x7F]/g, ' ');
    const openBraces = (truncFixed.match(/{/g) || []).length;
    const closeBraces = (truncFixed.match(/}/g) || []).length;
    const openBrackets = (truncFixed.match(/\[/g) || []).length;
    const closeBrackets = (truncFixed.match(/]/g) || []).length;
    for (let i = 0; i < openBrackets - closeBrackets; i++) truncFixed += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) truncFixed += '}';
    return JSON.parse(truncFixed);
  } catch (e5) {
    console.error('[safeParseGeminiJSON] ALL attempts failed');
    console.error('Raw (first 500):', rawText.substring(0, 500));
    throw new Error('JSON 파싱 완전 실패: ' + rawText.substring(0, 200));
  }
}
