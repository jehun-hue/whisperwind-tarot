/**
 * napeum.ts
 * 납음오행(納音五行) 60갑자 매핑 모듈
 * 60갑자 각각에 대응하는 상징적 오행 명칭을 제공합니다.
 */

const NAPEUM_MAP: Record<string, { name: string, element: string }> = {
  // 1-10
  "甲子": { name: "해중금(海中金)", element: "金" },
  "乙丑": { name: "해중금(海中金)", element: "金" },
  "丙寅": { name: "노중화(爐中火)", element: "火" },
  "丁卯": { name: "노중화(爐中火)", element: "火" },
  "戊辰": { name: "대림목(大林木)", element: "木" },
  "己巳": { name: "대림목(大林木)", element: "木" },
  "庚午": { name: "노방토(路傍土)", element: "土" },
  "辛未": { name: "노방토(路傍土)", element: "土" },
  "壬申": { name: "검봉금(劍鋒金)", element: "金" },
  "癸酉": { name: "검봉금(劍鋒金)", element: "金" },
  // 11-20
  "甲戌": { name: "산두화(山頭火)", element: "火" },
  "乙亥": { name: "산두화(山頭火)", element: "火" },
  "丙子": { name: "간하수(澗下水)", element: "水" },
  "丁丑": { name: "간하수(澗下水)", element: "水" },
  "戊寅": { name: "성두토(城頭土)", element: "土" },
  "己卯": { name: "성두토(城頭土)", element: "土" },
  "庚辰": { name: "백랍금(白蠟金)", element: "金" },
  "辛巳": { name: "백랍금(白蠟金)", element: "金" },
  "壬午": { name: "양류목(楊柳木)", element: "木" },
  "癸미": { name: "양류목(楊柳木)", element: "木" },
  "癸未": { name: "양류목(楊柳木)", element: "木" },
  // 21-30
  "甲申": { name: "천중수(泉中水)", element: "水" },
  "乙酉": { name: "천중수(泉中水)", element: "水" },
  "丙戌": { name: "옥상토(屋上土)", element: "土" },
  "丁亥": { name: "옥상토(屋上土)", element: "土" },
  "戊子": { name: "벽력화(霹靂火)", element: "火" },
  "己丑": { name: "벽력화(霹靂火)", element: "火" },
  "庚寅": { name: "송백목(松柏木)", element: "木" },
  "辛卯": { name: "송백목(松柏木)", element: "木" },
  "壬辰": { name: "장류수(長流水)", element: "水" },
  "癸巳": { name: "장류수(長流水)", element: "水" },
  // 31-40
  "甲午": { name: "사중금(砂中金)", element: "金" },
  "乙未": { name: "사중금(砂中金)", element: "金" },
  "丙申": { name: "산하화(山下火)", element: "火" },
  "丁酉": { name: "산하화(山下火)", element: "火" },
  "戊戌": { name: "평지목(平地木)", element: "木" },
  "己亥": { name: "평지목(平지木)", element: "木" },
  "己亥_": { name: "평지목(平지木)", element: "木" },
  "庚子": { name: "벽상토(壁上土)", element: "土" },
  "辛丑": { name: "벽상토(壁上土)", element: "土" },
  "壬寅": { name: "금박금(金箔金)", element: "金" },
  "癸卯": { name: "금박금(金箔金)", element: "金" },
  // 41-50
  "甲辰": { name: "복등화(覆燈火)", element: "火" },
  "乙巳": { name: "복등화(覆燈火)", element: "火" },
  "丙午": { name: "천하수(天河水)", element: "水" },
  "丁未": { name: "천하수(天河水)", element: "水" },
  "戊申": { name: "대역토(大驛土)", element: "土" },
  "己酉": { name: "대역토(大驛土)", element: "土" },
  "庚戌": { name: "차천금(釵釧金)", element: "金" },
  "辛亥": { name: "차천금(釵釧金)", element: "金" },
  "壬子": { name: "상자목(桑柘木)", element: "木" },
  "癸丑": { name: "상자목(桑柘木)", element: "木" },
  // 51-60
  "甲寅": { name: "대계수(大溪水)", element: "水" },
  "乙卯": { name: "대계수(大溪水)", element: "水" },
  "丙辰": { name: "사중토(砂中土)", element: "土" },
  "丁巳": { name: "사중토(砂中土)", element: "土" },
  "戊午": { name: "천상화(天上火)", element: "火" },
  "己未": { name: "천상화(天上火)", element: "火" },
  "庚申": { name: "석류목(石榴木)", element: "木" },
  "辛酉": { name: "석류목(石榴木)", element: "木" },
  "壬戌": { name: "대해수(大海水)", element: "水" },
  "癸亥": { name: "대해수(大海水)", element: "水" },
};

/**
 * 개별 간지에 대한 납음오행 리턴
 */
export function getNapeum(stem: string, branch: string): { name: string, element: string } {
  const key = `${stem}${branch}`;
  return NAPEUM_MAP[key] || { name: "알 수 없음", element: "알 수 없음" };
}

/**
 * 4주 전체의 납음오행 리턴
 */
export function getAllPillarNapeum(pillars: { 
  year: { stem: string, branch: string },
  month: { stem: string, branch: string },
  day: { stem: string, branch: string },
  hour: { stem: string, branch: string }
}) {
  return {
    year: getNapeum(pillars.year.stem, pillars.year.branch),
    month: getNapeum(pillars.month.stem, pillars.month.branch),
    day: getNapeum(pillars.day.stem, pillars.day.branch),
    hour: getNapeum(pillars.hour.stem, pillars.hour.branch),
  };
}
