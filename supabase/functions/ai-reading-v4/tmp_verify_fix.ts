import { calculateGwimunWonjin } from "./lib/interactions.ts";

const test1 = calculateGwimunWonjin(["辰", "亥", "子", "酉"]);
console.log("Test 1 (辰-亥, 子-酉):", test1);

const test2 = calculateGwimunWonjin(["卯", "寅"], "申", "酉");
console.log("Test 2 (卯 vs 申 daewoon, 寅 vs 酉 seun):", test2);
