
import { calculateSaju } from './src/lib/saju';

// 1980 is Geng-Shen (경신) year
const result = calculateSaju(1980, 1, 1, 12, 0);
console.log('--- Frontend Saju Elements Count Test ---');
console.log('Pillars:', JSON.stringify({
    year: result.yearPillar,
    month: result.monthPillar,
    day: result.dayPillar,
    hour: result.hourPillar
}));
console.log('Elements:', JSON.stringify(result.fiveElementDist));

// Check specifically for Shen (신)
let shenCount = 0;
const pillars = [result.yearPillar, result.monthPillar, result.dayPillar, result.hourPillar];
pillars.forEach(p => {
    if (p.cheongan === '신') shenCount++; // This is Stem Xin
    if (p.jiji === '신') shenCount++;    // This is Branch Shen
});
console.log('Number of "신" characters:', shenCount);
console.log('Metal (금) count:', result.fiveElementDist['금']);
