import { calculateSaju, lunarToSolar } from '@fullstackfamily/manseryeok';

// 천간/지지 오행 매핑
const STEM_ELEMENTS: Record<string, string> = {
  '갑': '목', '을': '목', '甲': '목', '乙': '목',
  '병': '화', '정': '화', '丙': '화', '丁': '화',
  '무': '토', '기': '토', '戊': '토', '己': '토',
  '경': '금', '신': '금', '庚': '금', '辛': '금',
  '임': '수', '계': '수', '壬': '수', '癸': '수'
};

const BRANCH_ELEMENTS: Record<string, string> = {
  '인': '목', '묘': '목', '寅': '목', '卯': '목',
  '사': '화', '오': '화', '巳': '화', '午': '화',
  '진': '토', '술': '토', '축': '토', '미': '토', '辰': '토', '戌': '토', '丑': '토', '未': '토',
  '신': '금', '유': '금', '申': '금', '酉': '금',
  '해': '수', '자': '수', '亥': '수', '子': '수'
};

export interface PillarData {
  천간: string;
  지지: string;
  한자: string;
  오행: string;
}

export interface ManseryeokResult {
  연주?: PillarData;
  월주?: PillarData;
  일주: PillarData;
  시주?: PillarData;
  일간: string;
  오행비율: Record<string, number>;
  용신: string;
}

// 1987-09-13 ~ 1988-10-09 서머타임 확인 함수
function isDaylightSavingTime(year: number, month: number, day: number): boolean {
  if (year === 1987) {
    if (month > 9) return true;
    if (month === 9 && day >= 13) return true;
  }
  if (year === 1988) {
    if (month < 10) return true;
    if (month === 10 && day <= 9) return true;
  }
  return false;
}

function parsePillar(pillarKor: string | null, pillarHanja: string | null): PillarData | undefined {
  if (!pillarKor || !pillarHanja || pillarKor.length < 2 || pillarHanja.length < 2) return undefined;

  const stemG = pillarKor[0];
  const branchG = pillarKor[1];

  const stemE = STEM_ELEMENTS[stemG] || 'Unknown';
  const branchE = BRANCH_ELEMENTS[branchG] || 'Unknown';

  return {
    천간: stemG,
    지지: branchG,
    한자: pillarHanja,
    오행: `${stemE}/${branchE}`
  };
}

export function getManseryeok(
  year: number,
  month: number,
  day: number,
  hour?: number,
  minute?: number,
  isLunar: boolean = false,
  gender: 'male' | 'female' = 'male'
): ManseryeokResult | null {
  try {
    // 음력이면 양력으로 변환
    let solarY = year;
    let solarM = month;
    let solarD = day;

    if (isLunar) {
      const res = lunarToSolar(year, month, day, false);
      if (res) {
        solarY = res.solar.year;
        solarM = res.solar.month;
        solarD = res.solar.day;
      }
    }

    // 서머타임 보정 (-60분)
    let calcHour = hour;
    let calcMinute = minute;
    if (calcHour !== undefined && calcMinute !== undefined) {
      if (isDaylightSavingTime(solarY, solarM, solarD)) {
        calcHour -= 1;
        if (calcHour < 0) {
          calcHour += 24;
        }
      }
    }

    // default longitude (서울)
    let finalHour = calcHour !== undefined ? calcHour : 0;
    let finalMinute = calcMinute !== undefined ? calcMinute : 0;

    const result = calculateSaju(solarY, solarM, solarD, finalHour, finalMinute, {
      longitude: 126.98
    });

    const yearPillar = parsePillar(result.yearPillar, result.yearPillarHanja);
    const monthPillar = parsePillar(result.monthPillar, result.monthPillarHanja);
    const dayPillar = parsePillar(result.dayPillar, result.dayPillarHanja) || { 천간: '', 지지: '', 한자: '', 오행: '' };

    // 시주는 입력값이 없을 경우 제외
    const hourPillar = (hour !== undefined) && result.hourPillar ? parsePillar(result.hourPillar, result.hourPillarHanja) : undefined;

    // 오행비율 계산
    const elements = { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 };
    let totalChars = 0;

    const addPillarElements = (p?: PillarData) => {
      if (!p) return;
      const [se, be] = p.오행.split('/');
      if (elements[se as keyof typeof elements] !== undefined) { elements[se as keyof typeof elements]++; totalChars++; }
      if (elements[be as keyof typeof elements] !== undefined) { elements[be as keyof typeof elements]++; totalChars++; }
    };

    addPillarElements(yearPillar);
    addPillarElements(monthPillar);
    addPillarElements(dayPillar);
    addPillarElements(hourPillar);

    const elementsRatio: Record<string, number> = {};
    if (totalChars > 0) {
      for (const [key, val] of Object.entries(elements)) {
        elementsRatio[key] = Math.round((val / totalChars) * 100);
      }
    }

    return {
      연주: yearPillar,
      월주: monthPillar,
      일주: dayPillar,
      시주: hourPillar,
      일간: dayPillar.천간,
      오행비율: elementsRatio,
      용신: 'AI 분석 단계에서 도출됨' // AI 프롬프트가 이 데이터를 바탕으로 용신을 잡습니다.
    };
  } catch (error) {
    console.error("Manseryeok calculation failed:", error);
    return null;
  }
}
