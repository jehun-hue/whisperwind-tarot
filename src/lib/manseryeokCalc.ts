import {
  calculateFourPillars,
  fourPillarsToString,
  solarToLunar,
  getHeavenlyStemElement,
  getHeavenlyStemYinYang,
  getEarthlyBranchElement,
} from "manseryeok";

export interface ManseryeokResult {
  // Raw four pillars
  yearPillar: { cheongan: string; jiji: string; cheonganElement: string; jijiElement: string };
  monthPillar: { cheongan: string; jiji: string; cheonganElement: string; jijiElement: string };
  dayPillar: { cheongan: string; jiji: string; cheonganElement: string; jijiElement: string };
  hourPillar: { cheongan: string; jiji: string; cheonganElement: string; jijiElement: string };
  // Day master info
  ilgan: string;
  ilganElement: string;
  ilganYinyang: string;
  // Full string representation
  fourPillarsString: string;
  // Lunar date
  lunarDate?: { year: number; month: number; day: number; isLeapMonth: boolean };
  // Hanja representation
  hanjaString?: string;
}

function pillarInfo(stem: string, branch: string) {
  return {
    cheongan: stem,
    jiji: branch,
    cheonganElement: getHeavenlyStemElement(stem as any) || "",
    jijiElement: getEarthlyBranchElement(branch as any) || "",
  };
}

export function calculateManseryeokSaju(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number = 0,
  isLunar: boolean = false
): ManseryeokResult {
  const fourPillars = calculateFourPillars({
    year,
    month,
    day,
    hour,
    minute,
    isLunar,
  });

  const dayHStem = fourPillars.day.heavenlyStem;

  // Get lunar date (only for solar input)
  let lunarDate: ManseryeokResult["lunarDate"] = undefined;
  if (!isLunar) {
    try {
      const lunar = solarToLunar(year, month, day);
      lunarDate = {
        year: lunar.year,
        month: lunar.month,
        day: lunar.day,
        isLeapMonth: lunar.isLeapMonth || false,
      };
    } catch {
      // lunar conversion may fail for edge dates
    }
  }

  let hanjaString = "";
  try {
    const hanjaObj = fourPillars.toHanjaObject();
    hanjaString = `${hanjaObj.year.hanja} / ${hanjaObj.month.hanja} / ${hanjaObj.day.hanja} / ${hanjaObj.hour.hanja}`;
  } catch {
    // hanja may not be available
  }

  return {
    yearPillar: pillarInfo(fourPillars.year.heavenlyStem, fourPillars.year.earthlyBranch),
    monthPillar: pillarInfo(fourPillars.month.heavenlyStem, fourPillars.month.earthlyBranch),
    dayPillar: pillarInfo(fourPillars.day.heavenlyStem, fourPillars.day.earthlyBranch),
    hourPillar: pillarInfo(fourPillars.hour.heavenlyStem, fourPillars.hour.earthlyBranch),
    ilgan: dayHStem,
    ilganElement: getHeavenlyStemElement(dayHStem as any) || "",
    ilganYinyang: getHeavenlyStemYinYang(dayHStem as any) || "",
    fourPillarsString: fourPillarsToString(fourPillars),
    lunarDate,
    hanjaString,
  };
}
