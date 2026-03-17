
import { calculateTenGodBranch, calculateTenGod } from "./lib/tenGods.ts";

const dm = "乙";
const branch = "申";

console.log(`Day Master: ${dm}`);
console.log(`Branch: ${branch}`);
console.log(`Old way results: ${calculateTenGod(dm, branch)}`);
console.log(`New way results: ${calculateTenGodBranch(dm, branch)}`);
