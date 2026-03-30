/**
 * saju.ts — v2: 서버 API 래퍼 (절기 정밀 계산은 서버에서 처리)
 * 
 * 기존 로컬 계산 로직은 절기 미반영으로 인해 부정확하므로, 
 * 모든 사주 계산은 고성능 서버 엔진(VSOP87 기반)을 통해 수행합니다.
 */

export interface SajuInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute?: number;
  gender: 'male' | 'female' | 'M' | 'F';
  longitude?: number;
  isLunar?: boolean;
  calendar?: 'solar' | 'lunar';
  hasTime?: boolean;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
}

export interface SajuResult {
  pillars: string[][];       // [[yearStem, yearBranch], ...]
  dayMaster: string;
  strength: '신강' | '중화' | '신약';
  elements: Record<string, number>;
  fiveElementDist?: Record<string, number>;
  yongshin?: string;
  yongShin?: string;
  tenGods?: any;
  daewoon?: any;
  interactions?: any;
  jijiInteractions?: any[];
  sinsal?: any[];
  twelveStages?: Record<string, string>;
  description?: string;
  [key: string]: any;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://gbmiciumkbsyamdbaddr.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

/**
 * 서버 사주 엔진 호출 래퍼
 * - 절기·DST·시간보정 모두 서버에서 처리
 */
export async function calculateSaju(input: SajuInput): Promise<SajuResult> {
  const endpoint = `${SUPABASE_URL}/functions/v1/ai-reading-v4`;

  // 입력 필드 유연성 확보 (year vs birthYear 등)
  const yr = input.year || input.birthYear;
  const mo = input.month || input.birthMonth;
  const dy = input.day || input.birthDay;
  const hr = input.hour;
  const mn = input.minute ?? 0;
  
  const genderMap: Record<string, string> = { 'M': 'male', 'F': 'female', 'male': 'male', 'female': 'female' };
  const normalizedGender = genderMap[input.gender] || 'male';
  
  const isLunar = input.isLunar || input.calendar === 'lunar';

  console.log(`[saju.ts] 서버 사주 요청: ${yr}-${mo}-${dy} ${hr}:${mn} (${isLunar ? '음력' : '양력'})`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      mode: 'saju-only',
      year: yr,
      month: mo,
      day: dy,
      hour: hr,
      minute: mn,
      gender: normalizedGender,
      longitude: input.longitude ?? 126.9780,
      isLunar: isLunar,
      hasTime: input.hasTime ?? true,
    }),
  });

  if (!response.ok) {
    throw new Error(`[saju.ts] 서버 사주 계산 실패: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status === 'error') {
    throw new Error(`[saju.ts] 엔진 에러: ${data.message}`);
  }

  // 서버 응답에서 사주 결과 추출 (sajuResult 또는 saju 등 다양한 키 대응)
  const sajuResult: SajuResult = data.sajuResult || data.saju || data;

  if (!sajuResult.year || !sajuResult.dayMaster) {
    console.error("[saju.ts] 부적절한 서버 응답:", data);
    throw new Error('[saju.ts] 서버 응답에 필수 데이터(year/dayMaster) 누락');
  }

  // ─── 하위 호환성 매핑 (P1-1: 클라이언트 UI용 필드 보정) ───
  const mapPillar = (p: any) => {
    if (!p) return { cheongan: "", jiji: "", hanja: "", full: "" };
    const full = `${p.stem}${p.branch}`;
    return {
      cheongan: p.stem || "",
      jiji: p.branch || "",
      hanja: full, // 서버는 이미 한자 문자열을 제공함
      full: full
    };
  };

  sajuResult.yearPillar = mapPillar(sajuResult.year);
  sajuResult.monthPillar = mapPillar(sajuResult.month);
  sajuResult.dayPillar = mapPillar(sajuResult.day);
  sajuResult.hourPillar = mapPillar(sajuResult.hour);

  if (!sajuResult.ilgan) sajuResult.ilgan = sajuResult.dayMaster;
  if (!sajuResult.yongsin) sajuResult.yongsin = sajuResult.yongShin;
  if (!sajuResult.fiveElementDist) sajuResult.fiveElementDist = sajuResult.elements;

  // originalInput 보정
  if (!sajuResult.originalInput && data.originalInput) {
    sajuResult.originalInput = data.originalInput;
  }

  return sajuResult;
}

/**
 * @deprecated 서버 API를 사용하세요. 이 함수는 절기를 반영하지 않습니다.
 */
export function calculateSajuLocal(_input: any): never {
  throw new Error(
    '[DEPRECATED] calculateSajuLocal은 절기 미반영으로 폐기되었습니다. async calculateSaju()를 사용하세요.'
  );
}

/**
 * 질문 유형별 사주 핵심 분석 (서버 데이터 기반 래퍼)
 */
export function getSajuForQuestion(saju: SajuResult, _type: string): string {
  return saju.description || "사주 분석 결과입니다.";
}

/**
 * 사주와 타로 교차 해석 키워드 (서버 데이터 기반 래퍼)
 */
export function getSajuTarotCrossKeywords(_saju: SajuResult, _suits: string[]): string[] {
  return ["서버에서 통합 분석을 수행합니다."];
}
