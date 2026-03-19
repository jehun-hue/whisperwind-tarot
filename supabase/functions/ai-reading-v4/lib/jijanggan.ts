/**
 * jijanggan.ts
 * 지지(地支)의 지장간(藏干) 정보를 제공하고 십신(十神)을 계산하는 모듈
 */

import { calculateTenGod } from "./tenGods.ts";

interface JijangganInfo {
  gan: string;
  tenGod: string;
  days: number;
}

interface BranchJijanggan {
  yeogi: JijangganInfo | null;
  junggi: JijangganInfo | null;
  bongi: JijangganInfo;
}

const JIJANGGAN_TABLE: Record<string, { yeogi: [string, number], junggi: [string, number] | null, bongi: [string, number] }> = {
  "子": { yeogi: ["壬", 10], junggi: null, bongi: ["癸", 20] },
  "丑": { yeogi: ["癸", 9], junggi: ["辛", 3], bongi: ["己", 18] },
  "寅": { yeogi: ["戊", 7], junggi: ["丙", 7], bongi: ["甲", 16] },
  "卯": { yeogi: ["甲", 10], junggi: null, bongi: ["乙", 20] },
  "辰": { yeogi: ["乙", 9], junggi: ["癸", 3], bongi: ["戊", 18] },
  "巳": { yeogi: ["戊", 7], junggi: ["庚", 7], bongi: ["丙", 16] },
  "午": { yeogi: ["丙", 10], junggi: ["己", 9], bongi: ["丁", 11] },
  "未": { yeogi: ["丁", 9], junggi: ["乙", 3], bongi: ["己", 18] },
  "申": { yeogi: ["戊", 7], junggi: ["壬", 7], bongi: ["庚", 16] },
  "酉": { yeogi: ["庚", 10], junggi: null, bongi: ["辛", 20] },
  "戌": { yeogi: ["辛", 9], junggi: ["丁", 3], bongi: ["戊", 18] },
  "亥": { yeogi: ["戊", 7], junggi: ["甲", 7], bongi: ["壬", 16] },
};

/**
 * 지지를 받아 여기·중기·본기 천간을 리턴
 */
export function getJijanggan(branch: string) {
  const data = JIJANGGAN_TABLE[branch];
  if (!data) return { yeogi: null, junggi: null, bongi: "" };

  return {
    yeogi: data.yeogi[0],
    junggi: data.junggi ? data.junggi[0] : null,
    bongi: data.bongi[0]
  };
}

/**
 * 지지와 일간을 받아 각 장간의 십신까지 계산해서 리턴
 */
export function getJijangganWithTenGod(branch: string, dayStem: string): BranchJijanggan | null {
  const data = JIJANGGAN_TABLE[branch];
  if (!data) return null;

  const result: BranchJijanggan = {
    yeogi: null,
    junggi: null,
    bongi: {
      gan: data.bongi[0],
      tenGod: calculateTenGod(dayStem, data.bongi[0]),
      days: data.bongi[1]
    }
  };

  if (data.yeogi) {
    result.yeogi = {
      gan: data.yeogi[0],
      tenGod: calculateTenGod(dayStem, data.yeogi[0]),
      days: data.yeogi[1]
    };
  }

  if (data.junggi) {
    result.junggi = {
      gan: data.junggi[0],
      tenGod: calculateTenGod(dayStem, data.junggi[0]),
      days: data.junggi[1]
    };
  }

  return result;
}

/**
 * 사주 4주 전체의 지장간+십신을 한번에 리턴
 */
export function getAllPillarJijanggan(
  dayStem: string, 
  pillars: { year: string; month: string; day: string; hour: string }
) {
  return {
    year: getJijangganWithTenGod(pillars.year, dayStem),
    month: getJijangganWithTenGod(pillars.month, dayStem),
    day: getJijangganWithTenGod(pillars.day, dayStem),
    hour: getJijangganWithTenGod(pillars.hour, dayStem)
  };
}
