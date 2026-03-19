import { calculateServerAstrology } from './lib/astrologyEngine.node.ts';

async function verify() {
  const result = await calculateServerAstrology(
    1987, 7, 17, 15, 30,
    37.5665,  // 서울 위도
    126.9780  // 서울 경도
  );
  
  console.log("=== 임제헌 점성술 데이터 (1987-07-17 15:30 서울) ===");
  console.log("\n[ 행성 위치 ]");
  if (result.planets) {
    for (const p of result.planets) {
      console.log(`${p.planet}: ${p.degree?.toFixed(2)}° ${p.sign}`);
    }
  }
  console.log("\n[ 하우스/ASC ]");
  console.log("ASC:", result.ascendant);
  if (result.houses) {
    // Note: If houses is an object with cusps, we might need adjustments
    // But we follow the user's request exactly.
    for (const h of (result.houses as any)) {
      console.log(`House ${h.house}: ${h.sign} ${h.degree?.toFixed(2)}°`);
    }
  }
  console.log("\n[ 어스펙트 ]");
  if (result.aspects) {
    for (const a of result.aspects) {
      console.log(`${a.planet1} ${a.aspect} ${a.planet2} (orb: ${a.orb?.toFixed(2)}°)`);
    }
  }
  console.log("\n[ 전체 JSON ]");
  console.log(JSON.stringify(result, null, 2));
}

verify().catch(console.error);
