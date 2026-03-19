import { calculateServerAstrology } from './lib/astrologyEngine.ts';

async function verify() {
  const result = await calculateServerAstrology(1987, 7, 17, 15, 30, 37.5665, 126.9780);

  console.log("=== DST 보정 후 행성 도수 검증 (1987-07-17 15:30 서울) ===\n");

  const targets: Record<string, { deg: number; sign: string }> = {
    Sun:     { deg: 24.13, sign: "Cancer" },
    Moon:    { deg: 16.62, sign: "Aries" },
    Mercury: { deg: 7.56,  sign: "Cancer" },
    Venus:   { deg: 13.96, sign: "Cancer" },
    Mars:    { deg: 6.72,  sign: "Leo" },
    Jupiter: { deg: 27.94, sign: "Aries" },
    Saturn:  { deg: 15.38, sign: "Sagittarius" },
    Uranus:  { deg: 23.55, sign: "Sagittarius" },
    Neptune: { deg: 6.14,  sign: "Capricorn" },
    Pluto:   { deg: 7.96,  sign: "Scorpio" },
  };

  const planetMap: Record<string, string> = {
    "태양": "Sun",
    "달": "Moon",
    "수성": "Mercury",
    "금성": "Venus",
    "화성": "Mars",
    "목성": "Jupiter",
    "토성": "Saturn",
    "천왕성": "Uranus",
    "해왕성": "Neptune",
    "명왕성": "Pluto"
  };

  if (result.planet_positions) {
    for (const p of result.planet_positions) {
      const engName = planetMap[p.planet] || p.planet;
      const t = targets[engName];
      if (t) {
        const diff = Math.abs((p.degree || 0) - t.deg);
        const signMatch = (p.signEnglish === t.sign || p.sign === t.sign) ? "✅" : "❌";
        const degMatch = diff <= 1.0 ? "✅" : "❌";
        console.log(`${engName}: ${p.degree?.toFixed(2)}° ${p.signEnglish || p.sign} | 목표: ${t.deg}° ${t.sign} | 별자리${signMatch} 도수오차${diff.toFixed(2)}°${degMatch}`);
      }
    }
  }

  // Handle core_identity too
  const core = (result as any).core_identity;
  if (core) {
      console.log(`\nASC: ${core.ascendant.degree.toFixed(2)}° ${core.ascendant.sign}`);
  }
}

verify().catch(console.error);
