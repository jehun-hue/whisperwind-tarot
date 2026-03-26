const fs = require('fs');
const saju = fs.readFileSync('supabase/functions/ai-reading-v4/lib/interpretations/sajuInterpretation.ts', 'utf8');
const pb = fs.readFileSync('supabase/functions/ai-reading-v4/lib/promptBuilder.ts', 'utf8');

console.log('=== sajuInterpretation.ts ===');
console.log('TENGO_DEEP:', saju.includes('TENGO_DEEP'));
console.log('GYEOKGUK_DEEP:', saju.includes('GYEOKGUK_DEEP'));
const exportsMatches = saju.match(/export const \w+/g);
console.log('Exports:', exportsMatches);

console.log('\n=== promptBuilder.ts ===');
console.log('Lines:', pb.split('\n').length);
console.log('Has TENGO:', pb.includes('TENGO'));
console.log('Has GYEOKGUK:', pb.includes('GYEOKGUK'));
console.log('Has buildReadingPrompt:', pb.includes('buildReadingPrompt'));
