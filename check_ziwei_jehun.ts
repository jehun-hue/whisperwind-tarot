
import { calculateZiWei } from "./src/lib/ziwei.ts";

const y = 1987, m = 7, d = 17, h = 15, min = 30;
const gender = "male";

const ziwei = calculateZiWei(y, m, d, h, min, gender);

console.log("MingGong:", ziwei.mingGong);
console.log("Bureau:", ziwei.bureau);
console.log("Palaces with stars:");
ziwei.palaces.forEach(p => {
  if (p.stars.length > 0) {
    console.log(`- ${p.name}(${p.branch}): ${p.stars.map(s => s.star).join(", ")}`);
  }
});
console.log("Transformations:", JSON.stringify(ziwei.natalTransformations, null, 2));
console.log("Current Major Period:", ziwei.currentMajorPeriod?.interpretation);
