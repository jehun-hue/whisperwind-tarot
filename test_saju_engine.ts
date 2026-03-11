
import { getFullSaju } from "./supabase/functions/ai-reading-v4/sajuEngine.ts";

const testData = [
  { year: 1987, month: 7, day: 17, hour: 15, minute: 30, gender: 'M' },
  { year: 1999, month: 1, day: 23, hour: 10, minute: 17, gender: 'F' }
];

testData.forEach(d => {
  const s = getFullSaju(d.year, d.month, d.day, d.hour, d.minute, d.gender);
  console.log(`\nInput: ${d.year}-${d.month}-${d.day} ${d.hour}:${d.minute}`);
  console.log(`Pillars: ${s.pillars.year.stem}${s.pillars.year.branch} ${s.pillars.month.stem}${s.pillars.month.branch} ${s.pillars.day.stem}${s.pillars.day.branch} ${s.pillars.hour.stem}${s.pillars.hour.branch}`);
  console.log(`Elements: ${JSON.stringify(s.elements)}`);
});
