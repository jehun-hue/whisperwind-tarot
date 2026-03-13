
import { getFullSaju } from './supabase/functions/ai-reading-v4/sajuEngine.ts';

// Use 17:30 to ensure Shen (申) branch in hour pillar
const result = getFullSaju(1987, 7, 17, 17, 30, 'M');
console.log('--- Saju Elements Count Test ---');
console.log('Pillars:', JSON.stringify(result.pillars));
console.log('Elements:', JSON.stringify(result.elements));

// Check specifically if '申' is in pillars and if count reflects it
let shenCount = 0;
const pillars = [result.pillars.year, result.pillars.month, result.pillars.day, result.pillars.hour];
pillars.forEach(p => {
    if (p.stem === '申') shenCount++;
    if (p.branch === '申') shenCount++;
});
console.log('Number of 申 characters:', shenCount);
console.log('Metal (금) count:', result.elements['금']);
