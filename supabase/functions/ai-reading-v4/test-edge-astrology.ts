/**
 * test-edge-astrology.ts
 * 점성술 엔진 엣지케이스 테스트 스크립트
 */

import { calculateServerAstrology } from "./lib/astrologyEngine.ts";

const TEST_CASES = [
  // 1) 기본 검증
  { name: "기본", date: "1987-07-17", time: "15:30", lat: 37.5665, lon: 126.978, desc: "서울 기본" },
  
  // 2) 적도 부근 출생
  { name: "적도", date: "1995-03-21", time: "12:00", lat: 0.0, lon: 0.0, desc: "적도 본초자오선" },
  
  // 3) 극지방 출생 (하우스 시스템 극단)
  { name: "북극권", date: "2000-06-21", time: "00:00", lat: 66.5, lon: 25.0, desc: "하지+북극권" },
  
  // 4) 남반구
  { name: "남반구", date: "1990-12-25", time: "08:00", lat: -33.87, lon: 151.21, desc: "시드니" },
  
  // 5) 별자리 경계 (태양 0° 근처)
  { name: "별자리경계", date: "2000-03-20", time: "12:00", lat: 37.5665, lon: 126.978, desc: "춘분점 태양 Pisces→Aries" },
  
  // 6) 트랜짓 계산 — 미래 날짜
  { name: "미래트랜짓", date: "1987-07-17", time: "15:30", lat: 37.5665, lon: 126.978, transitDate: "2026-03-19", desc: "현재 트랜짓" },
  
  // 7) 프로그레션 — 고령자
  { name: "고령프로그레션", date: "1940-01-01", time: "06:00", lat: 37.5665, lon: 126.978, transitDate: "2026-03-19", desc: "86세 프로그레션" },
  
  // 8) 디그니티 — 모든 행성 peregrine 가능성
  { name: "디그니티체크", date: "1993-08-15", time: "14:00", lat: 37.5665, lon: 126.978, desc: "디그니티 분포" },
];

async function runTests() {
  let passCount = 0;
  console.log("=== ASTROLOGY EDGE CASE TEST START ===\n");

  for (const tc of TEST_CASES) {
    console.log(`[TEST: ${tc.name}] (${tc.desc})`);
    console.log(`Input: ${tc.date} ${tc.time} (Lat: ${tc.lat}, Lon: ${tc.lon})`);

    try {
      const [year, month, day] = tc.date.split("-").map(Number);
      const [hour, minute] = tc.time.split(":").map(Number);
      const targetDate = tc.transitDate ? new Date(tc.transitDate) : undefined;

      // 1. 점성술 계산
      const result = calculateServerAstrology(
        year, month, day, hour, minute,
        tc.lat, tc.lon,
        true,
        targetDate
      );

      // 2. 행성 위치 출력
      const sun = result.planets.find(p => p.planet === "태양");
      const moon = result.planets.find(p => p.planet === "달");
      console.log(`  Sun: ${sun?.sign} ${sun?.degree.toFixed(2)}° / Moon: ${moon?.sign} ${moon?.degree.toFixed(2)}°`);
      
      if (result.house_positions) {
        console.log(`  ASC: ${result.house_positions.ASC} / MC: ${result.house_positions.MC}`);
      }

      // 3. 어스펙트 감지
      console.log(`  Aspects found: ${result.aspects.length}`);

      // 4. 디그니티
      const dignities = result.planets.filter(p => p.dignity !== "없음").map(p => `${p.planet}:${p.dignity}`);
      console.log(`  Dignities: ${dignities.join(", ") || "None"}`);

      // 5. 트랜짓/프로그레션 (미래 날짜 있는 경우)
      if (tc.name.includes("트랜짓") || tc.name.includes("프로그레션")) {
        console.log(`  Target Date: ${targetDate?.toISOString().split('T')[0]}`);
        if (result.transits && result.transits.length > 0) {
            console.log(`  Transits: ${result.transits.slice(0, 2).join(" | ")}...`);
        }
        if (result.progression) {
            console.log(`  Progression Moon: ${result.progression.moon.sign} ${result.progression.moon.degree}`);
        }
      }

      console.log("  ✅ PASS\n");
      passCount++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${err.message}\n`);
    }
  }

  console.log(`SUMMARY: ${passCount}/${TEST_CASES.length} PASS`);
}

runTests();
