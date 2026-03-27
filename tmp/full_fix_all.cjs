// tmp/full_fix_all.cjs — 4건 통합 수정 스크립트
// 작업1: promptBuilder.ts fortune 경로 수정
// 작업2: gyeokguk.ts 종격 중복 제거
// 작업3: astrologyInterpretation.ts Venus~Pluto + HOUSE/ASPECT 데이터 채우기
// 작업4: 미사용 파일 제거

const fs = require('fs');
const path = require('path');

const BASE = 'supabase/functions/ai-reading-v4';
const results = [];

// ════════════════════════════════════════
// 작업 1: promptBuilder.ts fortune 경로 수정
// ════════════════════════════════════════
console.log('\n=== 작업 1: promptBuilder.ts fortune 경로 수정 ===');
const pbFile = path.join(BASE, 'lib/promptBuilder.ts');
if (fs.existsSync(pbFile)) {
  let pb = fs.readFileSync(pbFile, 'utf8');
  const pbOrigLines = pb.split('\n').length;

  // 1a: Phase 2 — seunTengo 경로 수정
  // 기존: s?.fortune?.tenGodStem
  // 수정: s?.fortune?.seun?.tenGodStem || s?.daewoon?.current_seun?.tenGodStem
  pb = pb.replace(
    "const seunTengo = s?.fortune?.tenGodStem || '';",
    "const seunTengo = s?.fortune?.seun?.tenGodStem || s?.daewoon?.current_seun?.tenGodStem || '';"
  );

  // 1b: Phase 2 — twelveStage 경로 수정
  // 기존: s?.fortune?.twelveStage (존재하지 않는 필드)
  // 수정: seun 12운성 사용
  pb = pb.replace(
    "const stageName = s?.twelve_stages?.seun?.stage || s?.fortune?.twelveStage || '';",
    "const stageName = s?.twelve_stages?.seun?.stage || s?.fortune?.seun?.twelveStage || '';"
  );

  // 1c: SECTION 1 — fortune rating/interpretation/score 경로 수정
  pb = pb.replace(
    "s.fortune?.rating || '평'",
    "s.fortune?.seun?.rating || '평'"
  );
  pb = pb.replace(
    "s.fortune?.interpretation || ''",
    "s.fortune?.seun?.summary || s.fortune?.yearOverview || ''"
  );
  pb = pb.replace(
    "s.fortune?.score || 0",
    "s.fortune?.seun?.score || 0"
  );

  // 1d: currentMonthFortune interpretation 수정
  pb = pb.replace(
    "s.fortune?.currentMonthFortune?.interpretation || ''",
    "s.fortune?.currentMonthFortune?.summary || ''"
  );

  fs.writeFileSync(pbFile, pb, 'utf8');
  const pbNewLines = pb.split('\n').length;

  // 검증
  const checks1 = [
    ['seun?.tenGodStem', pb.includes('fortune?.seun?.tenGodStem')],
    ['seun?.rating', pb.includes('fortune?.seun?.rating')],
    ['seun?.summary', pb.includes('fortune?.seun?.summary')],
    ['seun?.score', pb.includes('fortune?.seun?.score')],
    ['currentMonthFortune?.summary', pb.includes('currentMonthFortune?.summary')],
    ['NO old tenGodStem', !pb.includes("s?.fortune?.tenGodStem || ''")],
    ['NO old rating direct', !pb.match(/s\.fortune\?\.rating\s/)],
  ];
  checks1.forEach(([label, ok]) => console.log(`  ${ok ? '✅' : '❌'} ${label}`));
  results.push(`작업1: promptBuilder.ts ${pbOrigLines}→${pbNewLines}줄, fortune 경로 ${checks1.filter(c=>c[1]).length}/${checks1.length} 수정 완료`);
} else {
  console.log('  ❌ promptBuilder.ts NOT FOUND');
  results.push('작업1: 실패 — 파일 없음');
}

// ════════════════════════════════════════
// 작업 2: gyeokguk.ts 종격 중복 제거
// ════════════════════════════════════════
console.log('\n=== 작업 2: gyeokguk.ts 종격 중복 로직 → jonggyeokEngine.ts 위임 ===');
const gyFile = path.join(BASE, 'lib/gyeokguk.ts');
if (fs.existsSync(gyFile)) {
  let gy = fs.readFileSync(gyFile, 'utf8');
  const gyOrigLines = gy.split('\n').length;

  const jongStart = gy.indexOf('function checkJongGyeok(');
  if (jongStart > -1) {
    let braceDepth = 0;
    let jongEnd = -1;
    for (let i = jongStart; i < gy.length; i++) {
      if (gy[i] === '{') braceDepth++;
      if (gy[i] === '}') {
        braceDepth--;
        if (braceDepth === 0) {
          jongEnd = i + 1;
          break;
        }
      }
    }
    
    if (jongEnd > -1) {
      const oldFunc = gy.slice(jongStart, jongEnd);
      const newFunc = `function checkJongGyeok(
  pillars: { year: string[]; month: string[]; day: string[]; hour: string[] },
  dayMaster: string,
  tenGods: Record<string, number>,
  balance: number
): GyeokgukResult | null {
  // 종격 판별은 jonggyeokEngine.ts → aiSajuAnalysis.ts에서 일원화 처리
  // gyeokguk.ts에서는 항상 null 반환하여 내격(naegyeok) 판정으로 진행
  return null;
}`;
      gy = gy.slice(0, jongStart) + newFunc + gy.slice(jongEnd);
      fs.writeFileSync(gyFile, gy, 'utf8');
      console.log(`  ✅ checkJongGyeok 함수를 return null로 대체 (${oldFunc.split('\n').length}줄 → ${newFunc.split('\n').length}줄)`);
      results.push(`작업2: gyeokguk.ts checkJongGyeok 비활성화, 종격은 jonggyeokEngine.ts로 일원화`);
    } else {
      console.log('  ❌ checkJongGyeok 함수 종료 지점을 찾지 못함');
      results.push('작업2: 실패 — 수동 확인 필요');
    }
  } else {
    console.log('  ⚠️ checkJongGyeok 함수를 찾지 못함 (이미 제거?)');
    results.push('작업2: checkJongGyeok 없음 — 스킵');
  }
} else {
  console.log('  ❌ gyeokguk.ts NOT FOUND');
  results.push('작업2: 실패 — 파일 없음');
}

// ════════════════════════════════════════
// 작업 3: astrologyInterpretation.ts 데이터 보완
// ════════════════════════════════════════
console.log('\n=== 작업 3: astrologyInterpretation.ts 데이터 보완 ===');
const astroFile = path.join(BASE, 'lib/interpretations/astrologyInterpretation.ts');
if (fs.existsSync(astroFile)) {
  let astro = fs.readFileSync(astroFile, 'utf8');
  const astroOrigLines = astro.split('\n').length;

  const VENUS_TO_PLUTO = `
  "Venus": {
    "Aries": { personality: "열정적이고 직선적인 사랑, 정복하는 연애를 즐김", keywords: "충동적 애정, 빠른 열정, 독립적 연인" },
    "Taurus": { personality: "오감이 발달하고 안정적인 사랑을 추구, 소유욕 강함", keywords: "감각적 사랑, 충실한 파트너, 물질적 안정" },
    "Gemini": { personality: "지적인 교류를 중시하고 다양한 관계를 즐김", keywords: "가벼운 연애, 대화 중시, 호기심 많은 애정" },
    "Cancer": { personality: "깊은 정서적 유대를 추구하고 헌신적인 사랑", keywords: "모성적 사랑, 감정적 안정, 가정적 연인" },
    "Leo": { personality: "화려하고 낭만적인 사랑, 관심과 칭찬을 원함", keywords: "드라마틱 연애, 관대한 애정, 자기표현" },
    "Virgo": { personality: "실용적이고 섬세한 사랑, 헌신으로 표현", keywords: "봉사하는 사랑, 완벽주의적 연인, 실질적 표현" },
    "Libra": { personality: "조화롭고 균형 잡힌 관계를 추구, 미적 감각 뛰어남", keywords: "공정한 파트너십, 예술적 감성, 우아한 사랑" },
    "Scorpio": { personality: "깊고 강렬한 사랑, 전부 아니면 전무의 태도", keywords: "집착적 애정, 변환적 관계, 깊은 유대" },
    "Sagittarius": { personality: "자유롭고 모험적인 연애, 철학적 교류 중시", keywords: "자유로운 사랑, 성장하는 관계, 낙관적 연인" },
    "Capricorn": { personality: "신중하고 책임감 있는 사랑, 장기적 관계 선호", keywords: "현실적 사랑, 성숙한 파트너십, 사회적 안정" },
    "Aquarius": { personality: "독립적이고 비전통적인 연애관, 우정 같은 사랑", keywords: "독특한 관계, 지적 교류, 자유로운 유대" },
    "Pisces": { personality: "헌신적이고 낭만적인 사랑, 경계 없는 감정 교류", keywords: "희생적 사랑, 영적 연결, 이상주의적 연인" }
  },
  "Mars": {
    "Aries": { personality: "강력한 추진력과 행동력, 선두에 서는 전사 기질", keywords: "공격적 에너지, 즉각적 행동, 독립적 투지" },
    "Taurus": { personality: "꾸준하고 끈기 있는 행동력, 느리지만 확실함", keywords: "지구력, 물질적 동기, 감각적 욕구" },
    "Gemini": { personality: "다재다능한 행동력, 말과 글로 싸움", keywords: "지적 공격성, 다방면 활동, 재치 있는 전략" },
    "Cancer": { personality: "감정에 기반한 행동력, 보호 본능이 강함", keywords: "방어적 행동, 감정적 동기, 가족 보호" },
    "Leo": { personality: "과시적이고 당당한 행동력, 자기표현 욕구 강함", keywords: "리더십, 창조적 행동, 명예 추구" },
    "Virgo": { personality: "세밀하고 계획적인 행동력, 완벽을 추구", keywords: "정밀한 실행, 분석적 행동, 봉사 정신" },
    "Libra": { personality: "균형과 공정함을 위한 행동, 우유부단할 수 있음", keywords: "외교적 행동, 파트너십 동기, 미적 추구" },
    "Scorpio": { personality: "극도로 집중적이고 전략적인 행동력", keywords: "전략적 공격, 변혁적 에너지, 은밀한 추진" },
    "Sagittarius": { personality: "모험적이고 철학적인 행동, 자유를 위해 싸움", keywords: "모험적 행동, 이상 추구, 확장적 에너지" },
    "Capricorn": { personality: "체계적이고 인내심 있는 행동, 목표 지향적", keywords: "야심찬 실행, 장기 전략, 구조적 추진" },
    "Aquarius": { personality: "개혁적이고 독창적인 행동, 집단을 위해 행동", keywords: "혁신적 행동, 인도주의적 동기, 반항적 에너지" },
    "Pisces": { personality: "직관적이고 유동적인 행동, 영감에 의한 움직임", keywords: "영적 행동, 희생적 에너지, 직관적 판단" }
  },
  "Jupiter": {
    "Aries": { personality: "대담한 확장, 선구자적 비전", keywords: "리더십 확장, 모험적 성장, 독립적 철학" },
    "Taurus": { personality: "물질적 풍요와 감각적 즐거움의 확장", keywords: "재물 복, 안정적 성장, 감각적 풍요" },
    "Gemini": { personality: "지식과 커뮤니케이션의 확장", keywords: "학습 행운, 다재다능, 소통의 복" },
    "Cancer": { personality: "가정과 정서적 안정의 축복", keywords: "가족 복, 정서적 풍요, 보호받는 성장" },
    "Leo": { personality: "창조적 표현과 인정의 확장", keywords: "명예 복, 창의적 성공, 관대한 복" },
    "Virgo": { personality: "실용적 지혜와 봉사를 통한 성장", keywords: "건강 복, 세밀한 성장, 실용적 행운" },
    "Libra": { personality: "관계와 예술을 통한 확장", keywords: "파트너십 행운, 외교적 성공, 미적 발전" },
    "Scorpio": { personality: "심층적 변환과 재생을 통한 성장", keywords: "변혁적 행운, 투자 복, 심층적 통찰" },
    "Sagittarius": { personality: "철학과 여행을 통한 거대한 확장", keywords: "해외 복, 학문적 성공, 정신적 성장" },
    "Capricorn": { personality: "사회적 지위와 구조를 통한 성장", keywords: "사회적 성공, 조직 내 행운, 인내의 보상" },
    "Aquarius": { personality: "혁신과 인도주의를 통한 확장", keywords: "기술적 행운, 집단적 성공, 혁신적 비전" },
    "Pisces": { personality: "영적 성장과 자비를 통한 확장", keywords: "영적 행운, 직관적 성장, 자비로운 복" }
  },
  "Saturn": {
    "Aries": { personality: "독립과 리더십에서의 시련과 성숙", keywords: "자아 통제, 인내심 훈련, 리더십 시험" },
    "Taurus": { personality: "재정과 안정에 대한 제한과 교훈", keywords: "재물 시련, 절제 학습, 가치관 재정립" },
    "Gemini": { personality: "소통과 학습에서의 체계적 훈련", keywords: "집중력 훈련, 소통 제한, 깊은 학습" },
    "Cancer": { personality: "감정과 가정에서의 책임과 성숙", keywords: "감정 통제, 가족 책임, 내면 성장" },
    "Leo": { personality: "자기표현과 인정에서의 시련", keywords: "겸손 학습, 창의성 시험, 명예 시련" },
    "Virgo": { personality: "완벽주의와 건강에서의 제한", keywords: "건강 관리, 업무 규율, 실용적 성숙" },
    "Libra": { personality: "관계와 공정함에서의 시련", keywords: "관계 시험, 책임있는 파트너십, 균형 학습" },
    "Scorpio": { personality: "권력과 변환에서의 깊은 시련", keywords: "심리적 성숙, 통제력 시험, 변혁의 고통" },
    "Sagittarius": { personality: "신념과 자유에서의 제한과 교훈", keywords: "신념 시험, 책임있는 자유, 지혜 성숙" },
    "Capricorn": { personality: "사회적 지위에서의 극도의 책임과 성취", keywords: "최고의 성취, 무거운 책임, 구조적 완성" },
    "Aquarius": { personality: "혁신과 집단에서의 구조적 시련", keywords: "사회적 책임, 혁신의 제한, 체계적 개혁" },
    "Pisces": { personality: "영적 성장과 자비에서의 시련", keywords: "경계 설정, 영적 시험, 현실과 이상의 갈등" }
  },
  "Uranus": {
    "Aries": { personality: "혁명적 변화와 급진적 독립", keywords: "급격한 변화, 혁신적 리더십, 자유 투쟁" },
    "Taurus": { personality: "가치관과 재정의 근본적 변혁", keywords: "재정 혁신, 가치 전복, 안정의 붕괴와 재건" },
    "Gemini": { personality: "사고방식과 소통의 혁명", keywords: "기술 혁신, 새로운 학습, 파격적 소통" },
    "Cancer": { personality: "가정과 전통의 변혁", keywords: "가족 구조 변화, 정서적 해방, 뿌리의 변혁" },
    "Leo": { personality: "창조성과 자기표현의 혁명", keywords: "파격적 창조, 독특한 표현, 인정의 변혁" },
    "Virgo": { personality: "일상과 건강에서의 혁신", keywords: "업무 혁신, 건강 기술, 분석의 변혁" },
    "Libra": { personality: "관계와 사회적 규범의 변혁", keywords: "관계 혁명, 파격적 파트너십, 사회 개혁" },
    "Scorpio": { personality: "심층 심리와 권력 구조의 변혁", keywords: "심리적 해방, 권력 전복, 재생의 혁명" },
    "Sagittarius": { personality: "신념과 교육의 혁명", keywords: "철학 혁신, 여행 변화, 진리 탐구 변혁" },
    "Capricorn": { personality: "사회 구조와 권위의 근본적 변혁", keywords: "체제 변혁, 권위 해체, 구조적 혁신" },
    "Aquarius": { personality: "인류와 기술의 가장 급진적인 혁신", keywords: "기술 혁명, 사회 혁신, 미래 비전" },
    "Pisces": { personality: "영적 의식과 집단 무의식의 변혁", keywords: "영적 각성, 직관 혁명, 경계 해체" }
  },
  "Neptune": {
    "Aries": { personality: "이상주의적 행동과 영적 전사", keywords: "영적 리더십, 이상적 투쟁, 혼란스러운 행동" },
    "Taurus": { personality: "물질과 영성의 융합, 예술적 가치", keywords: "예술적 재물, 감각적 영성, 가치의 환상" },
    "Gemini": { personality: "직관적 소통과 영감적 사고", keywords: "영감적 소통, 직관적 학습, 환상적 아이디어" },
    "Cancer": { personality: "깊은 감정적 직관과 영적 가정", keywords: "감정적 직관, 영적 가족, 조상의 기억" },
    "Leo": { personality: "창조적 영감과 환상적 자기표현", keywords: "예술적 창조, 카리스마적 환상, 영적 표현" },
    "Virgo": { personality: "영적 봉사와 치유의 소명", keywords: "치유 능력, 봉사의 영성, 완벽의 환상" },
    "Libra": { personality: "이상적 관계와 예술적 조화", keywords: "이상적 사랑, 예술적 아름다움, 관계의 환상" },
    "Scorpio": { personality: "심층 의식의 신비와 변환", keywords: "심리적 신비, 오컬트적 통찰, 깊은 직관" },
    "Sagittarius": { personality: "신비로운 진리와 영적 모험", keywords: "영적 여행, 신비주의, 확장된 의식" },
    "Capricorn": { personality: "구조와 이상의 충돌, 현실적 영성", keywords: "이상과 현실, 체제의 환멸, 영적 구조화" },
    "Aquarius": { personality: "집단 의식과 인류애의 영적 확장", keywords: "집단 영성, 기술과 영성, 유토피아 비전" },
    "Pisces": { personality: "가장 강렬한 영적 감수성과 직관", keywords: "최고의 직관, 영적 합일, 경계 없는 자비" }
  },
  "Pluto": {
    "Aries": { personality: "권력과 자아의 근본적 변환", keywords: "권력 변혁, 자아 재탄생, 파괴적 리더십" },
    "Taurus": { personality: "물질과 가치의 근본적 변환", keywords: "재정 변혁, 가치 파괴와 재건, 소유의 변환" },
    "Gemini": { personality: "사고와 소통의 근본적 변환", keywords: "사고 변혁, 정보의 권력, 소통의 파괴와 재건" },
    "Cancer": { personality: "가정과 감정의 근본적 변환", keywords: "가족 변혁, 감정의 정화, 뿌리의 재건" },
    "Leo": { personality: "창조성과 권위의 근본적 변환", keywords: "창조적 파괴, 권위 변혁, 자기표현의 재탄생" },
    "Virgo": { personality: "일상과 건강의 근본적 변환", keywords: "건강 변혁, 업무 재구성, 분석의 심화" },
    "Libra": { personality: "관계와 정의의 근본적 변환", keywords: "관계 변혁, 사회 정의, 파트너십 재건" },
    "Scorpio": { personality: "가장 강력한 변환과 재생의 힘", keywords: "극적 변혁, 죽음과 재탄생, 궁극의 재생" },
    "Sagittarius": { personality: "신념과 진리의 근본적 변환", keywords: "신념 파괴, 진리 탐구 변혁, 종교적 변환" },
    "Capricorn": { personality: "사회 구조와 권력의 근본적 변환", keywords: "체제 붕괴, 구조적 재건, 권력 교체" },
    "Aquarius": { personality: "사회와 기술의 근본적 변환", keywords: "사회 변혁, 기술적 파괴와 혁신, 집단 변환" },
    "Pisces": { personality: "영적 의식과 집단 무의식의 근본적 변환", keywords: "영적 변혁, 의식 확장, 시대의 종결과 시작" }
  },`;

  const HOUSE_DATA = `export const HOUSE_MEANINGS: Record<string, { meaning: string; life_area: string; advice: string }> = {
  "1": { meaning: "자아와 외적 이미지, 타인에게 보여지는 첫인상", life_area: "자기정체성, 외모, 체질", advice: "자기 자신을 솔직하게 표현하되, 타인의 시선도 의식하세요" },
  "2": { meaning: "재물과 가치관, 소유와 자원 관리 능력", life_area: "수입, 재산, 자존감", advice: "안정적인 수입원을 확보하고 자기 가치를 인식하세요" },
  "3": { meaning: "소통과 학습, 형제자매와 근거리 이동", life_area: "커뮤니케이션, 초기 교육, 이웃", advice: "다양한 정보를 흡수하고 표현력을 키우세요" },
  "4": { meaning: "가정과 뿌리, 내면의 안식처와 조상", life_area: "가족, 부동산, 심리적 기반", advice: "내면의 안정을 찾고 가족과의 유대를 강화하세요" },
  "5": { meaning: "창조성과 즐거움, 연애와 자녀", life_area: "연애, 취미, 자녀, 투기", advice: "자기표현을 즐기되 과도한 쾌락에 빠지지 않도록 주의하세요" },
  "6": { meaning: "일상 업무와 건강, 봉사와 루틴", life_area: "직장 환경, 건강 관리, 반려동물", advice: "규칙적인 생활 습관을 유지하고 건강을 챙기세요" },
  "7": { meaning: "파트너십과 결혼, 공개적 관계와 계약", life_area: "배우자, 사업 파트너, 소송", advice: "상대방의 입장을 이해하고 균형 잡힌 관계를 만드세요" },
  "8": { meaning: "공유 자원과 변환, 깊은 심리와 재생", life_area: "상속, 투자, 성, 죽음과 재탄생", advice: "두려움에 직면하고 내면의 변화를 수용하세요" },
  "9": { meaning: "철학과 장거리 여행, 고등 교육과 신념", life_area: "해외, 종교, 법률, 대학 교육", advice: "시야를 넓히고 새로운 문화와 사상을 탐구하세요" },
  "10": { meaning: "사회적 지위와 경력, 공적 이미지와 성취", life_area: "직업, 명예, 사회적 역할", advice: "장기적인 목표를 세우고 꾸준히 노력하세요" },
  "11": { meaning: "친구와 네트워크, 희망과 집단 활동", life_area: "친구, 동호회, 미래 비전", advice: "뜻이 맞는 사람들과 교류하고 이상을 공유하세요" },
  "12": { meaning: "무의식과 은둔, 영적 세계와 자기 희생", life_area: "비밀, 격리, 영성, 카르마", advice: "명상이나 내면 작업을 통해 무의식을 탐구하세요" }
};`;

  const ASPECT_DATA = `export const ASPECT_MEANINGS: Record<string, { meaning: string; psychology: string; advice: string }> = {
  "conjunction": { meaning: "두 행성 에너지의 강력한 융합, 집중된 힘", psychology: "해당 영역에서 강렬한 집중과 몰입이 일어남", advice: "이 에너지를 의식적으로 활용하되 과잉에 주의" },
  "opposition": { meaning: "두 행성의 대립과 긴장, 균형의 필요성", psychology: "내면의 갈등과 양극화, 타인에게 투사될 수 있음", advice: "양쪽 에너지를 모두 인정하고 통합하는 노력 필요" },
  "trine": { meaning: "자연스러운 조화와 흐름, 타고난 재능", psychology: "해당 영역에서 편안함과 자연스러운 능력 발휘", advice: "이 재능을 당연시하지 말고 적극적으로 활용하세요" },
  "square": { meaning: "내적 긴장과 도전, 성장의 원동력", psychology: "해당 영역에서 좌절과 도전을 통한 강제적 성장", advice: "이 긴장을 행동의 원동력으로 전환하세요" },
  "sextile": { meaning: "기회와 잠재력, 약간의 노력으로 발현", psychology: "해당 영역에서 기회를 포착할 수 있는 감각", advice: "기회가 올 때 적극적으로 행동에 옮기세요" },
  "quincunx": { meaning: "조정이 필요한 불편한 에너지, 적응의 과제", psychology: "해당 영역에서 끊임없는 미세 조정이 요구됨", advice: "완벽을 추구하기보다 유연하게 적응하세요" }
};`;

  const MODE_DATA = `export const MODE_BALANCE: Record<string, { meaning: string; psychology: string }> = {
  "cardinal_dominant": { meaning: "활동궁(양/쌍어/천칭/염소) 우세: 시작과 추진의 에너지", psychology: "새로운 일을 시작하는 것을 좋아하지만 마무리가 약할 수 있음" },
  "fixed_dominant": { meaning: "고정궁(황소/사자/전갈/물병) 우세: 지속과 안정의 에너지", psychology: "한번 시작하면 끝까지 밀어붙이지만 변화에 저항할 수 있음" },
  "mutable_dominant": { meaning: "변통궁(쌍둥이/처녀/궁수/물고기) 우세: 적응과 변화의 에너지", psychology: "유연하고 적응력이 뛰어나지만 방향이 자주 바뀔 수 있음" },
  "balanced": { meaning: "활동/고정/변통이 균형: 다양한 상황에 대응 가능", psychology: "상황에 따라 유연하게 에너지를 전환할 수 있는 구조" }
};`;

  const ELEMENT_DATA = `export const ELEMENT_BALANCE: Record<string, { meaning: string; psychology: string }> = {
  "fire_dominant": { meaning: "불 원소 우세: 열정, 행동력, 창의성이 넘침", psychology: "에너지가 넘치고 추진력이 강하지만 인내심이 부족할 수 있음" },
  "earth_dominant": { meaning: "땅 원소 우세: 현실감각, 안정성, 실용성이 강함", psychology: "현실적이고 안정적이지만 변화에 대한 두려움이 있을 수 있음" },
  "air_dominant": { meaning: "바람 원소 우세: 지적 능력, 소통, 객관성이 뛰어남", psychology: "분석적이고 소통에 능하지만 감정적 깊이가 부족할 수 있음" },
  "water_dominant": { meaning: "물 원소 우세: 감수성, 직관, 공감 능력이 뛰어남", psychology: "감정이 풍부하고 직관적이지만 감정에 휩쓸릴 수 있음" },
  "balanced": { meaning: "4원소가 균형: 다양한 차원에서 조화로운 인식", psychology: "감정/사고/행동/현실이 균형 잡힌 통합적 인식" }
};`;

  const mercuryEndPattern = '"Mercury": {';
  const mercuryIdx = astro.indexOf(mercuryEndPattern);
  if (mercuryIdx > -1) {
    let depth = 0;
    let mercuryBlockEnd = -1;
    let started = false;
    for (let i = mercuryIdx; i < astro.length; i++) {
      if (astro[i] === '{') { depth++; started = true; }
      if (astro[i] === '}') { depth--; }
      if (started && depth === 0) {
        mercuryBlockEnd = i + 1;
        break;
      }
    }
    
    if (mercuryBlockEnd > -1) {
      let insertAt = mercuryBlockEnd;
      if (astro[insertAt] === ',') insertAt++;
      astro = astro.slice(0, insertAt) + VENUS_TO_PLUTO + astro.slice(insertAt);
      console.log('  ✅ Venus~Pluto 데이터 삽입 완료');
    } else {
      console.log('  ❌ Mercury 블록 끝을 찾지 못함');
    }
  } else {
    console.log('  ❌ Mercury 키를 찾지 못함');
  }

  astro = astro.replace(
    /export const HOUSE_MEANINGS:\s*Record<string,\s*any>\s*=\s*\{\s*\};?/,
    HOUSE_DATA
  );
  astro = astro.replace(
    /export const ASPECT_MEANINGS:\s*Record<string,\s*any>\s*=\s*\{\s*\};?/,
    ASPECT_DATA
  );
  astro = astro.replace(
    /export const MODE_BALANCE:\s*Record<string,\s*any>\s*=\s*\{\s*\};?/,
    MODE_DATA
  );
  astro = astro.replace(
    /export const ELEMENT_BALANCE:\s*Record<string,\s*any>\s*=\s*\{\s*\};?/,
    ELEMENT_DATA
  );

  fs.writeFileSync(astroFile, astro, 'utf8');
  const astroNewLines = astro.split('\n').length;
  results.push(`작업3: astrologyInterpretation.ts ${astroOrigLines}→${astroNewLines}줄 데이터 보완 완료`);
} else {
  console.log('  ❌ astrologyInterpretation.ts NOT FOUND');
  results.push('작업3: 실패 — 파일 없음');
}

// ════════════════════════════════════════
// 작업 4: 미사용 파일 제거
// ════════════════════════════════════════
console.log('\n=== 작업 4: 미사용 파일 제거 ===');
const unusedFiles = [
  'crossValidationEngine.ts',
  'metaIntelligenceLayer.ts',
  'benchmarkDataset.ts',
  'lib/jami.ts',
  'test-edge-analysis.ts',
  'test-edge-astrology.ts',
  'test-edge-consistency.ts',
  'test-edge-decision.ts',
  'test-edge-integration.ts',
  'test-edge-numerology.ts',
  'test-edge-saju.ts',
  'test-edge-signal.ts',
  'test-edge-tarot.ts',
  'test-edge-timeline.ts',
  'test-edge-ziwei.ts',
];

let removed = 0;
const backupDir = path.join(BASE, '_unused_backup');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

for (const file of unusedFiles) {
  const fullPath = path.join(BASE, file);
  if (fs.existsSync(fullPath)) {
    const backupPath = path.join(backupDir, path.basename(file));
    fs.copyFileSync(fullPath, backupPath);
    fs.unlinkSync(fullPath);
    console.log(`  🗑️ ${file} → _unused_backup/`);
    removed++;
  }
}
results.push(`작업4: ${removed}개 미사용 파일 제거 완료`);

console.log('\n=== 전체 수정 완료 ===');
results.forEach(r => console.log(r));
