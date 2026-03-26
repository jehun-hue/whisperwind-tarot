// tmp/verify.cjs
const fs = require('fs');
const f = fs.readFileSync('supabase/functions/ai-reading-v4/lib/interpretations/astrologyInterpretation.ts', 'utf8');
const lines = f.split('\n');
console.log('Lines:', lines.length);

let d = 0;
for (const c of f) { if (c === '{') d++; if (c === '}') d--; }
console.log('Brace depth:', d);

const planets = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
for (const p of planets) {
  console.log(p + ':', f.includes('"' + p + '"') ? 'OK' : 'MISSING');
}

console.log('Libra:', f.includes('Libra') ? 'OK' : 'MISSING');
console.log('Scorpio:', f.includes('Scorpio') ? 'OK' : 'MISSING');
console.log('Pisces:', f.includes('Pisces') ? 'OK' : 'MISSING');
