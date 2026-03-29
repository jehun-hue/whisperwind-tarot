const fs = require('fs');
const path = require('path');

const base = 'supabase/functions/ai-reading-v4';

// 1. 전체 파일 목록
console.log('=== FILE LIST ===');
function listFiles(dir, prefix = '') {
  try {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        listFiles(full, prefix + item + '/');
      } else {
        console.log(prefix + item + ' (' + Math.round(stat.size / 1024) + 'KB)');
      }
    });
  } catch(e) {}
}
listFiles(base);

// 2. 각 파일 export 분석
console.log('\n=== EXPORTS PER FILE ===');
const tsFiles = [];
function findTs(dir) {
  try {
    fs.readdirSync(dir).forEach(item => {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) findTs(full);
      else if (item.endsWith('.ts')) tsFiles.push(full);
    });
  } catch(e) {}
}
findTs(base);

tsFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const exports = content.match(/export (const|function|interface|type|class) \w+/g);
  if (exports) {
    console.log('\n--- ' + f.replace(base + path.sep, '') + ' (' + content.split('\n').length + ' lines) ---');
    exports.forEach(e => console.log('  ' + e));
  }
});

// 3. 사주 호출 체인 (integratedReadingEngine)
console.log('\n=== ENGINE CALL CHAIN ===');
try {
  const engine = fs.readFileSync(base + '/integratedReadingEngine.ts', 'utf8');
  const calls = ['calculateSaju', 'aiSajuAnalysis', 'buildReadingPrompt', 'buildEnginePrompts',
    'jonggyeok', 'gyeokguk', 'daewoon', 'extractSignals', 'crossValidat', 'tarotSymbolic',
    'calculateZiwei', 'calculateNumerology'];
  calls.forEach(p => {
    const count = (engine.match(new RegExp(p, 'gi')) || []).length;
    if (count > 0) console.log('  ' + p + ': ' + count + ' refs');
  });
} catch(e) { console.log('integratedReadingEngine.ts NOT FOUND'); }

// 4. jonggyeokEngine 연결 상태
console.log('\n=== JONGGYEOK CONNECTION ===');
try {
  const jg = fs.readFileSync(base + '/jonggyeokEngine.ts', 'utf8');
  console.log('Lines:', jg.split('\n').length);
  const jgExports = jg.match(/export (const|function) \w+/g);
  if (jgExports) jgExports.forEach(e => console.log('  ' + e));
  // 어디서 import되는지
  let referenced = false;
  tsFiles.forEach(f => {
    const c = fs.readFileSync(f, 'utf8');
    if ((c.includes('jonggyeok') || c.includes('Jonggyeok')) && !f.includes('jonggyeokEngine')) {
      console.log('  Referenced in: ' + f.replace(base + path.sep, ''));
      referenced = true;
    }
  });
  if (!referenced) console.log('  WARNING: Not imported anywhere!');
} catch(e) { console.log('jonggyeokEngine.ts NOT FOUND'); }

// 5. promptBuilder 주입 블록 현황
console.log('\n=== PROMPTBUILDER INJECTION STATUS ===');
try {
  const pb = fs.readFileSync(base + '/lib/promptBuilder.ts', 'utf8');
  const blocks = ['iljuBlock', 'gyeokBlock', 'tengoBlock', 'stageBlock', 'yongBlock',
    'deepShinsalBlock', 'dwDeepBlock', 'interactionBlock', 'finalDeepSajuProfile'];
  blocks.forEach(b => console.log('  ' + b + ': ' + (pb.includes(b) ? 'OK' : 'MISSING')));
} catch(e) { console.log('lib/promptBuilder.ts NOT FOUND'); }

// 6. 미사용 파일 탐지
console.log('\n=== UNUSED FILE CHECK ===');
tsFiles.forEach(f => {
  const name = path.basename(f, '.ts');
  if (name === 'index') return;
  let used = false;
  tsFiles.forEach(other => {
    if (other === f) return;
    const c = fs.readFileSync(other, 'utf8');
    if (c.includes(name)) used = true;
  });
  if (!used) console.log('  UNUSED: ' + f.replace(base + path.sep, ''));
});
