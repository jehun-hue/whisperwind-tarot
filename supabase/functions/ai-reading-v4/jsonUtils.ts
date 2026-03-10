/**
 * jsonUtils.ts
 * Gemini 응답에서 JSON을 안전하게 파싱하는 유틸 전용 파일.
 */

/**
 * Gemini 응답에서 JSON을 안전하게 파싱하는 유틸.
 * LLM이 반환한 문자열에 raw 제어 문자(\n, \t, \r 등)가
 * JSON 문자열 리터럴 내부에 포함되어 JSON.parse가 실패하는 문제를 방지.
 */
export function safeParseGeminiJSON(rawText: string): any {
  // 1단계: 코드블록(```json ... ```) 추출
  let jsonString = '';
  const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1].trim();
  } else {
    // 코드블록이 없으면 첫 번째 { ~ 마지막 } 범위 추출
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      jsonString = rawText.substring(start, end + 1);
    } else {
      jsonString = rawText;
    }
  }

  // 2단계: JSON 문자열 값 내부의 실제 줄바꿈/탭을 이스케이프 처리
  // (JSON 스펙에서 문자열 내 raw \n \r \t는 허용되지 않음)
  jsonString = jsonString.replace(
    /"(?:[^"\\]|\\.)*"/g,
    (match) => match
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
  );

  // 3단계: 나머지 제어 문자 제거 (NULL, BEL 등)
  jsonString = jsonString.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 4단계: 파싱 시도
  try {
    return JSON.parse(jsonString);
  } catch (firstError) {
    // 최후 수단: 모든 제어 문자를 공백으로 치환 후 재시도
    console.warn('[safeParseGeminiJSON] First parse failed, attempting aggressive cleanup...');
    const aggressive = jsonString.replace(/[\x00-\x1F\x7F]/g, ' ');
    try {
      return JSON.parse(aggressive);
    } catch (secondError) {
      console.error('[safeParseGeminiJSON] All parse attempts failed.');
      console.error('Raw text (first 500 chars):', rawText.substring(0, 500));
      throw new Error(`JSON 파싱 실패: ${(firstError as Error).message}`);
    }
  }
}
