
import { calculateServerAstrology } from "./supabase/functions/ai-reading-v4/astrologyEngine.ts";

const result = calculateServerAstrology(1987, 7, 17, 15, 30);

console.log("=== Node Calculation ===");
const northNode = result.planets.find(p => p.planet === "North Node");
const southNode = result.planets.find(p => p.planet === "South Node");
console.log("North Node:", northNode?.sign, northNode?.degree, "Retrograde:", northNode?.is_retrograde);
console.log("South Node:", southNode?.sign, southNode?.degree, "Retrograde:", southNode?.is_retrograde);

console.log("\n=== Minor Aspects & Orbs ===");
result.aspects.forEach(a => {
    // Only show minor aspects or aspects including nodes for verification
    const minor = ["semi-sextile", "semi-square", "sesquiquadrate", "퀸컨스(quincunx)"].includes(a.type);
    const hasNode = a.planet1.includes("Node") || a.planet2.includes("Node");
    if (minor || hasNode) {
        console.log(`[${a.type}] ${a.planet1} -> ${a.planet2} | Orb: ${a.orb}`);
    }
});

console.log("\n=== Luminaries Orb Check (Sun/Moon) ===");
const sunAspects = result.aspects.filter(a => a.planet1 === "태양" || a.planet2 === "태양");
sunAspects.slice(0, 3).forEach(a => {
    console.log(`[${a.type}] ${a.planet1} -> ${a.planet2} | Orb: ${a.orb}`);
});
