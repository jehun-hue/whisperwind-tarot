/**
 * jsonUtils.ts
 * Gemini 응답에서 JSON을 안전하게 파싱하는 유틸 전용 파일.
 */

export function safeParseGeminiJSON(rawText: string, fallback: any = {}): any {
  if (!rawText || typeof rawText !== 'string') return fallback;

  // Step 0: If response is already clean JSON (from responseMimeType: application/json)
  try {
    const direct = JSON.parse(rawText.trim());
    if (direct && typeof direct === 'object') return direct;
  } catch {}

  // Step 1: Extract JSON candidate
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

  // Step 2: Try standard parse
  try {
    return JSON.parse(jsonString);
  } catch (e1) {
    console.warn('[safeParseGeminiJSON] Standard parse failed, attempting repair...');
  }

  // Step 3: Clean control characters and escape special characters in strings
  try {
    const cleaned = jsonString
      .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
      .replace(/"(?:[^"\\]|\\.)*"/gs, (match) => 
        match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
      );
    return JSON.parse(cleaned);
  } catch (e2) {
    console.warn('[safeParseGeminiJSON] Step 3 cleaning failed');
  }

  // Step 4: Repair common JSON syntax errors
  try {
    let repaired = jsonString.replace(/[\x00-\x1F\x7F]/g, ' ');
    
    // Fix missing commas between properties/elements
    repaired = repaired.replace(/}\s*"/g, '}, "');
    repaired = repaired.replace(/]\s*"/g, '], "');
    repaired = repaired.replace(/"\s+"/g, '", "');
    repaired = repaired.replace(/(true|false|null|\d+)\s+"/g, '$1, "');
    
    // Fix trailing commas
    repaired = repaired.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    
    // Ensure properly closed braces
    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/]/g) || []).length;
    
    if (openBrackets > closeBrackets) repaired += ']'.repeat(openBrackets - closeBrackets);
    if (openBraces > closeBraces) repaired += '}'.repeat(openBraces - closeBraces);
    
    return JSON.parse(repaired);
  } catch (e3) {
    console.error('[safeParseGeminiJSON] ALL repair attempts failed');
    console.error('Raw preview:', rawText.substring(0, 300));
    return fallback;
  }
}
