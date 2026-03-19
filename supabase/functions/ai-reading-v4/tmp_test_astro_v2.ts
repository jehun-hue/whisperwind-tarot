
import { calculateServerAstrology } from "./lib/astrologyEngine.ts";

console.log("--- Natal 1987-07-17 ---");
const result = calculateServerAstrology(1987, 7, 17, 15, 30);
console.log("Mercury:", result.planets.find(p => p.planet === "수성")?.sign, result.planets.find(p => p.planet === "수성")?.degree);
console.log("Venus:", result.planets.find(p => p.planet === "금성")?.sign, result.planets.find(p => p.planet === "금성")?.degree);
console.log("Mars:", result.planets.find(p => p.planet === "화성")?.sign, result.planets.find(p => p.planet === "화성")?.degree);

console.log("\n--- Today ---");
const now = new Date();
const todayRes = calculateServerAstrology(now.getFullYear(), now.getMonth() + 1, now.getDate(), 12, 0);
console.log("Mercury:", todayRes.planets.find(p => p.planet === "수성")?.sign, todayRes.planets.find(p => p.planet === "수성")?.degree);
console.log("Venus:", todayRes.planets.find(p => p.planet === "금성")?.sign, todayRes.planets.find(p => p.planet === "금성")?.degree);
console.log("Mars:", todayRes.planets.find(p => p.planet === "화성")?.sign, todayRes.planets.find(p => p.planet === "화성")?.degree);
