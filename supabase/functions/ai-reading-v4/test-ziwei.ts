import { calculateZiwei } from './lib/ziweiEngine.ts';

// Ground Truth: 1987-07-17 15:30 남자 서울
// sajuplus.net 확인 (서머타임 적용 → 未時)
// 정묘(丁卯)년, 음력 6월 22일, 미(未)시, 남성, 2026년 기준
const result = calculateZiwei('丁', '卯', 6, 22, '未', 'male', 2026);

console.log('=== 자미두수 엔진 검증 (Fix) ===');
console.log('');

// 1. 명궁
console.log('1. 명궁:', result.mingGong);
console.log('   정답: 子  →', result.mingGong === '子' ? '✅' : '❌ 오류: ' + result.mingGong);

// 2. 신궁 (생략 가능하면 스킵, 현재 palaces에서 찾아서 표시)
// @ts-ignore
const shenGong = (result as any).shenGong || "N/A";
console.log('2. 신궁:', shenGong);
console.log('   정답: 戌  →', shenGong === '戌' ? '✅' : '❌ 오류: ' + shenGong);

// 3. 오행국
console.log('3. 오행국:', result.wuxingJu);
console.log('   정답: 木三局 →', result.wuxingJu?.name === '木三局' || result.wuxingJu?.number === 3 ? '✅' : '❌ 오류');

// 4. 자미성 위치
// 모든 궁을 순회하며 자미성을 찾음
const allStars: { name: string, branch: string }[] = [];
for (const [branch, palace] of Object.entries(result.palaces)) {
  palace.mainStars.forEach((s: any) => {
    allStars.push({ name: s.name, branch });
  });
}

const ziwei = allStars.find(s => s.name === '자미' || s.name === '紫微');
console.log('4. 자미성:', ziwei?.branch);
console.log('   정답: 亥  →', ziwei?.branch === '亥' ? '✅' : '❌ 오류: ' + ziwei?.branch);

// 5. 14주성 전체 검증
const groundTruth: Record<string, string> = {
  '자미': '亥', '천기': '戌', '태양': '申', '무곡': '未',
  '천동': '午', '염정': '卯', '천부': '巳', '태음': '午',
  '탐랑': '未', '거문': '申', '천상': '酉', '천량': '戌',
  '칠살': '亥', '파군': '卯'
};

console.log('');
console.log('5. 14주성 배치 검증:');
let correct = 0;
let total = 0;
for (const [name, expected] of Object.entries(groundTruth)) {
  const star = allStars.find(s => s.name === name);
  const actual = star?.branch || '없음';
  const match = actual === expected;
  if (match) correct++;
  total++;
  console.log(`   ${name}: ${actual} (정답: ${expected}) → ${match ? '✅' : '❌'}`);
}
console.log(`   결과: ${correct}/${total} 일치`);

// 6. 사화 검증
const sihua = result.birthSihua;
console.log('');
console.log('6. 사화 (丁간):');
if (sihua) {
  console.log('   화록:', sihua.화록, '→', sihua.화록 === '태음' ? '✅' : '❌');
  console.log('   화권:', sihua.화권, '→', sihua.화권 === '천동' ? '✅' : '❌');
  console.log('   화과:', sihua.화과, '→', sihua.화과 === '천기' ? '✅' : '❌');
  console.log('   화기:', sihua.화기, '→', sihua.화기 === '거문' ? '✅' : '❌');
} else {
  console.log('   사화 데이터 없음 ❌');
}

// 7. 12궁 배치 검증
const palaceGT: Record<string, string> = {
  '子': '명궁', '丑': '부모궁', '寅': '복덕궁', '卯': '전택궁',
  '辰': '관록궁', '巳': '노복궁', '午': '천이궁', '未': '질액궁',
  '申': '재백궁', '酉': '자녀궁', '戌': '부처궁', '亥': '형제궁'
};

console.log('');
console.log('7. 12궁 배치:');
let palaceCorrect = 0;
for (const [branch, expected] of Object.entries(palaceGT)) {
  const palace = result.palaces[branch];
  const actual = palace?.name || '없음';
  const match = actual === expected;
  if (match) palaceCorrect++;
  console.log(`   ${branch}: ${actual} (정답: ${expected}) → ${match ? '✅' : '❌'}`);
}
console.log(`   결과: ${palaceCorrect}/12 일치`);

console.log('');
console.log('=== 전체 요약 ===');
console.log(`14주성: ${correct}/14`);
console.log(`12궁: ${palaceCorrect}/12`);
console.log(`명궁: ${result.mingGong === '子' ? '✅' : '❌'}`);
console.log(`오행국: ${result.wuxingJu?.number === 3 ? '✅' : '❌'}`);
