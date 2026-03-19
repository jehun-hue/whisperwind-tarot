
import { calculateServerAstrology } from "./lib/astrologyEngine.ts";

const result = calculateServerAstrology(1987, 7, 17, 15, 30);
console.log("Mercury:", result.planets.find(p => p.planet === "수성"));
console.log("Venus:", result.planets.find(p => p.planet === "금성"));
console.log("Mars:", result.planets.find(p => p.planet === "화성"));
