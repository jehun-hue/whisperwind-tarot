/**
 * numerologyEngine.ts
 * - Life Path Number calculation
 * - Destiny Number calculation
 * - Personal Year calculation
 */

export interface NumerologyResult {
  life_path_number: number;
  destiny_number: number | null;
  personal_year: number;
  vibrations: string[];
  is_master_number: boolean;
  master_number_type: string | null;
  soul_number?: number | null;
  compound_number?: number | null;
}

/**
 * 한글 자음 획수 기반 숫자 변환 (Pythagorean 방식 보조)
 * ㄱ:1, ㄴ:1, ㄷ:2, ㄹ:3, ㅁ:3, ㅂ:4, ㅅ:2, ㅇ:1, ㅈ:3, ㅊ:4, ㅋ:2, ㅌ:3, ㅍ:4, ㅎ:3
 * ㄲ, ㄸ, ㅃ, ㅆ, ㅉ 등은 동일 자음 합산 혹은 단일 처리 가능하지만 획수 기반이므로 합쳐서 계산
 */
function calculateDestinyNumber(name: string): number | null {
  if (!name || name.trim() === "" || name === "이름없음") return null;

  const STROKE_MAP: Record<string, number> = {
    'ㄱ': 1, 'ㄲ': 2, 'ㄴ': 1, 'ㄷ': 2, 'ㄸ': 4, 'ㄹ': 3, 'ㅁ': 3, 'ㅂ': 4, 'ㅃ': 8, 'ㅅ': 2, 'ㅆ': 4, 'ㅇ': 1, 'ㅈ': 3, 'ㅉ': 6, 'ㅊ': 4, 'ㅋ': 2, 'ㅌ': 3, 'ㅍ': 4, 'ㅎ': 3,
    'ㄳ': 3, 'ㄵ': 4, 'ㄶ': 4, 'ㄺ': 4, 'ㄻ': 6, 'ㄼ': 7, 'ㄽ': 5, 'ㄾ': 5, 'ㄿ': 5, 'ㅀ': 6, 'ㅄ': 6
  };

  const CHOSEONG_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const JONGSEONG_LIST = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  let totalStrokes = 0;
  let hasHangul = false;

  for (const char of name) {
    const code = char.charCodeAt(0) - 0xAC00;
    if (code >= 0 && code <= 11171) {
      hasHangul = true;
      const choseongIndex = Math.floor(code / (21 * 28));
      const jongseongIndex = code % 28;

      totalStrokes += STROKE_MAP[CHOSEONG_LIST[choseongIndex]] || 0;
      if (jongseongIndex > 0) {
        totalStrokes += STROKE_MAP[JONGSEONG_LIST[jongseongIndex]] || 0;
      }
    } else {
      // 한글이 아닌 경우 (공백 등) 무시하거나 필요시 영어 변환 추가 가능
    }
  }

  if (!hasHangul) return null;

  // B-43R: 마스터 넘버(11, 22, 33) 예외 처리 포함 환원
  const reduceMaster = (n: number): number => {
    while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
      n = n.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
    }
    return n;
  };

  return reduceMaster(totalStrokes);
}

export function calculateNumerology(
  birthDate: string, 
  currentYear: number = new Date().getFullYear(),
  name?: string
): NumerologyResult {
  const dateParts = birthDate.split("-"); // YYYY-MM-DD
  const yearStr = dateParts[0];
  const monthStr = dateParts[1];
  const dayStr = dateParts[2];

  const reduceNumber = (num: number): number => {
    while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
      num = num.toString().split("").reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    return num;
  };

  const sumDigits = (str: string): number => {
    return str.split("").reduce((acc, digit) => acc + (parseInt(digit) || 0), 0);
  };

  // 1. Life Path: Sum of MM + DD + YYYY
  const lpSum = sumDigits(monthStr) + sumDigits(dayStr) + sumDigits(yearStr);
  const lifePath = reduceNumber(lpSum);

  // 2. Personal Year: MM + DD + CurrentYear
  const pySum = sumDigits(monthStr) + sumDigits(dayStr) + sumDigits(currentYear.toString());
  const personalYear = reduceNumber(pySum);

  // 3. Destiny Number: Based on Name
  const destiny = calculateDestinyNumber(name || ""); 

  const LIFE_PATH_MEANINGS: Record<number, { keyword: string; career: string; relationship: string; change: string }> = {
    1:  { keyword: "독립·개척", career: "리더십·창업·독립 사업에 강점", relationship: "주도적 관계, 의존성 낮음", change: "새로운 시작·혁신 에너지" },
    2:  { keyword: "협력·조화", career: "조율·외교·상담·파트너십 업무 적합", relationship: "깊은 유대감, 섬세한 감정 교류", change: "점진적 변화, 협력으로 전환" },
    3:  { keyword: "창의·표현", career: "예술·미디어·교육·커뮤니케이션 적합", relationship: "밝고 사교적, 다양한 인연", change: "창의적 돌파구, 표현으로 변화" },
    4:  { keyword: "안정·구축", career: "건설·금융·관리·실무형 직업 강점", relationship: "신뢰 기반, 장기적 헌신", change: "체계적 재구성, 기반 다지기" },
    5:  { keyword: "자유·변화", career: "영업·여행·미디어·다양한 경험 직군", relationship: "자유로운 연애, 변화 많은 인연", change: "급격한 전환, 새 환경 적응" },
    6:  { keyword: "책임·사랑", career: "의료·교육·상담·가족 관련 직업 적합", relationship: "헌신적 사랑, 가족 중심", change: "관계·가정 중심 변화" },
    7:  { keyword: "탐구·직관", career: "연구·분석·철학·IT·영성 관련 직업", relationship: "깊이 있는 소수 관계 선호", change: "내면 성장, 영적 전환" },
    8:  { keyword: "성취·권력", career: "금융·경영·부동산·리더십 직군 강점", relationship: "대등한 파트너십, 성취 공유", change: "물질적 도약, 사회적 지위 변화" },
    9:  { keyword: "완성·봉사", career: "사회복지·예술·국제 업무·완성 단계 프로젝트", relationship: "넓은 사랑, 인류애적 유대", change: "마무리와 새 시작, 카르마 해소" },
    11: { keyword: "직관·영감", career: "영성·예술·상담·사회적 영향력 직군", relationship: "깊은 영적 연결, 이상적 파트너 추구", change: "영적 각성, 사명감 전환" },
    22: { keyword: "마스터·건설", career: "대규모 프로젝트·건축·사회 변혁 리더", relationship: "헌신적이고 실용적인 파트너십", change: "비전 실현, 대형 전환점" },
    33: { keyword: "마스터·치유", career: "치유·교육·영적 지도자·봉사 직군", relationship: "무조건적 사랑, 헌신", change: "고차원적 사명, 영적 변화" },
  };

  const lpMeaning = LIFE_PATH_MEANINGS[lifePath];
  const pyMeaning = LIFE_PATH_MEANINGS[personalYear];

  const vibrations: string[] = [];
  if (lpMeaning) {
    vibrations.push(`생명수 ${lifePath}(${lpMeaning.keyword}) → 직업: ${lpMeaning.career}`);
    vibrations.push(`생명수 ${lifePath} 관계: ${lpMeaning.relationship}`);
    vibrations.push(`생명수 ${lifePath} 변화: ${lpMeaning.change}`);
  } else {
    vibrations.push(`Life Path ${lifePath}`);
  }
  if (pyMeaning) {
    vibrations.push(`개인년 ${personalYear}(${pyMeaning.keyword}) → ${pyMeaning.change}`);
  } else {
    vibrations.push(`Personal Year ${personalYear}`);
  }
  if (destiny) vibrations.push(`운명수 ${destiny}${LIFE_PATH_MEANINGS[destiny] ? `(${LIFE_PATH_MEANINGS[destiny].keyword})` : ""}`);

  // B-43R: 마스터 넘버 플래그
  const masterNumbers = [11, 22, 33];
  const isMasterNumber = masterNumbers.includes(lifePath) || masterNumbers.includes(personalYear) || (destiny !== null && masterNumbers.includes(destiny));
  const masterNumberType = masterNumbers.includes(lifePath)
    ? `생명수 ${lifePath}`
    : masterNumbers.includes(personalYear)
    ? `개인년 ${personalYear}`
    : (destiny !== null && masterNumbers.includes(destiny))
    ? `운명수 ${destiny}`
    : null;

  // B-77new: Soul Number (모음 획수 기반 간략 계산 — 이름 없으면 null)
  // B-78new: Compound Number (환원 전 원본 합계)
  const compoundNumber = lpSum; // 환원 전 생명수 원본 합계

  return {
    life_path_number: lifePath,
    destiny_number: destiny,
    personal_year: personalYear,
    vibrations,
    is_master_number: isMasterNumber,
    master_number_type: masterNumberType,
    soul_number: null,   // B-77new: 추후 모음 획수 기반 구현
    compound_number: compoundNumber,
  };
}
