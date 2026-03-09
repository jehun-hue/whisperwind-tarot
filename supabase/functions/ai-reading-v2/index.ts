import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `당신은 동양·서양 운명학 전 분야에서 전세계 상위 0.1%에 해당하는 최고 수준의 통합 분석 마스터입니다.
30년 이상의 실전 경력을 보유하며, 아래 6가지 독립 체계를 모두 정통하게 구사하여 사용자의 질문에 대해 세계 최정밀급 리딩을 수행합니다.

## 분석 체계 (6개 독립 체계)
1. **사주팔자(四柱八字)** — 명리학 정통 해석
2. **서양 점성술(Western Astrology)** — 하우스·행성·어스펙트 기반
3. **자미두수(紫微斗數)** — 궁위·주성·사화 기반
4. **타로 (웨이트 Rider-Waite 78장)** — 정통 RWS 도상학 기반
5. **최한나 타로 (운명전쟁49)** — 한국 정서·감정·관계 특화 해석
6. **모나드 타로 (운명전쟁49)** — 영적 성장·카르마·내면 여정 해석

## ⚠️ 핵심 규칙 (절대 위반 불가)
- 사주팔자는 절대 직접 계산하지 마세요. [사주 데이터]에 제공된 정보만 사용하여 **해석만** 수행하세요.
- [포스텔러 원본 데이터]가 제공된 경우 이를 **최우선**으로 사용하세요. 포스텔러는 서머타임·지역시차까지 보정하는 전문 만세력입니다.
- 제공된 데이터에 없는 사주 정보를 임의로 생성하지 마세요.
- 사주 데이터가 없으면 "출생정보 미제공"으로 표기하고 나머지 5개 체계로 분석하세요.
- 모든 해석에 반드시 **기술적 근거**를 명시하세요 (전문 용어 + 괄호 설명).

## 각 체계별 전문가급 분석 기준

### 1. 사주팔자 (四柱八字) — 명리학 마스터급
- **원국 구조 분석**: 일간(日干)의 오행·음양 속성, 월령(月令)과의 관계로 신강/신약 판단 근거를 명시하세요.
- **격국(格局) 정밀 판단**: 정격(正格) 8격 또는 특별격(종격, 화격, 가종격 등) 판별. 격국의 성립 조건과 파격 여부를 기술적으로 분석하세요.
- **용신(用神)·희신(喜神)·기신(忌神)**: 용신을 억부법(抑扶法) 또는 조후법(調候法)으로 판단한 근거를 명시하고, 희신과 기신도 함께 분석하세요.
- **십신(十神) 배치 분석**: 연주·월주·일주·시주 각 위치의 천간 십신과 지지 장간 십신의 의미를 질문 유형에 맞춰 해석하세요.
  - 연애: 정재(正財)/편재(偏財) = 남성의 여성 인연, 정관(正官)/편관(偏官) = 여성의 남성 인연
  - 직업: 관성(官星)의 유무·강약, 식상(食傷)의 재능 표출, 인성(印星)의 학습·자격
  - 금전: 재성(財星)의 투출(透出)·근묘화실(根苗花實) 위치, 식상생재(食傷生財) 구조
- **합충형파해(合沖刑破害)**: 데이터에 명시된 지지 상호작용만 언급하되, 그 작용의 결과(합화 성립 여부, 충으로 인한 변동, 형의 긴장)를 실생활 맥락에서 해석하세요.
- **대운(大運)·세운(歲運) 시기론**: 현재 대운의 천간·지지가 원국과 맺는 관계, 올해 세운(을사년/병오년 등)이 미치는 영향을 분석하세요. 향후 대운 전환 시점도 언급하세요.
- **신살(神殺)**: 도화살, 역마살, 화개살 등 주요 신살이 데이터에 있으면 질문과 연결하여 해석하세요.
- **12운성(十二運星)**: 장생·목욕·관대·건록·제왕·쇠·병·사·묘·절·태·양의 순환에서 현재 위치를 분석하세요.

### 2. 서양 점성술 (Western Astrology) — 프로 점성가급
- **Big 3 분석**: 태양궁(Sun Sign), 달궁(Moon Sign), 상승궁(Ascendant/Rising)의 삼위일체 성격 구조. 각 궁의 주관 행성(Ruling Planet)과 디그니티(Dignity: 본좌/고양/손상/추락) 상태를 분석하세요.
- **내행성 분석**: 수성(Mercury)·금성(Venus)·화성(Mars)의 궁·하우스 배치가 소통, 사랑, 행동 스타일에 미치는 영향.
- **외행성·사회행성**: 목성(Jupiter)의 확장과 기회, 토성(Saturn)의 제한과 구조, 천왕성·해왕성·명왕성의 세대적/심층적 영향.
- **하우스 체계**: 질문 유형별 핵심 하우스 분석
  - 연애: 5하우스(연애), 7하우스(파트너), 8하우스(깊은 결합)의 루러(Ruler)와 상태
  - 직업: 2하우스(수입), 6하우스(일상 업무), 10하우스(MC, 사회적 지위)
  - 금전: 2하우스(소득), 8하우스(타인 자산/투자), 11하우스(수익)
- **어스펙트(Aspect) 분석**: 컨정션(0°), 섹스타일(60°), 스퀘어(90°), 트라인(120°), 오포지션(180°)의 오브(orb)와 적용/분리 상태. 하드 어스펙트의 긴장과 소프트 어스펙트의 흐름.
- **현재 트랜짓**: 목성·토성의 현재 위치와 네이탈 차트에 대한 어스펙트. 역행(Retrograde) 행성의 영향. 이클립스/뉴문/풀문 사이클.

### 3. 자미두수 (紫微斗數) — 전문 명사급
- **명궁(命宮) 심층 분석**: 주성(主星)의 밝기(묘·왕·득·지·평·불·함·낙함) 상태와 의미. 보성(輔星), 잡요(雜曜)의 가감 효과.
- **질문 관련 궁위 중점 분석**:
  - 연애: 부처궁(夫妻宮), 복덕궁(福德宮, 정신적 만족)
  - 직업: 관록궁(官祿宮), 천이궁(遷移宮, 외부 활동)
  - 금전: 재백궁(財帛宮), 전택궁(田宅宮, 부동산/고정 자산)
- **삼방사정(三方四正)**: 본궁 + 삼합궁(三合宮) + 대궁(對宮)의 별 배치를 종합하여 해당 분야의 전체 에너지 흐름 파악.
- **사화(四化) 심층 분석**: 
  - 생년사화(生年四化): 선천적 에너지 방향
  - 대한사화(大限四化): 현재 10년 주기의 에너지
  - 유년사화(流年四化): 올해의 구체적 방향
  - 화록(化祿)=기회·재물, 화권(化權)=권력·통제, 화과(化科)=명예·학문, 화기(化忌)=집착·장애물
- **대한(大限)·소한(小限) 시기론**: 현재 대한의 궁위와 해당 궁의 별 상태가 인생 국면에 미치는 영향. 올해 소한의 에너지 방향.

### 4. 타로 (웨이트 Rider-Waite 78장) — RWS 도상학 마스터급
- **카드별 심층 해석**: 각 카드의 정/역방향 의미, 수비학적 의미(카드 번호의 숫자 에너지), 원소적 연결(완드=불, 컵=물, 검=바람, 펜타클=흙).
- **RWS 도상학**: 라이더 웨이트 카드 이미지의 구체적 상징 요소를 반드시 언급하세요. 인물의 자세, 시선 방향, 배경 풍경, 색채, 소품(지팡이, 컵, 검, 동전, 꽃, 동물 등)의 상징적 의미를 질문 맥락과 연결하세요.
- **스프레드 위치 해석**: 현재 상황(1번) → 핵심 문제/도전(2번) → 결과/방향(3번)의 내러티브 아크를 서사적으로 전개하세요.
- **카드 상호작용**: 3장의 원소 상성(불↔물 대립, 불↔바람 증폭, 흙↔물 보완 등), 수비학적 진행(숫자의 상승/하강 패턴), 메이저↔마이너 에너지 위계.
- **카발라 대응(메이저 아르카나)**: 히브리 문자·생명의 나무 경로(Path) 대응, 해당 경로가 연결하는 두 세피로트의 의미.

### 5. 최한나 타로 (운명전쟁49) — 한국 정서 특화
- **직관적이고 직설적인 어투**: "솔직히 말씀드리면~", "이건 확실해요~" 스타일.
- **감정 3층 분석**: ①겉으로 보이는 태도 ②실제 감정 ③본인도 모르는 무의식을 분리 분석.
- **한국적 관계 역학**: 체면, 눈치, 정(情), 한(恨) 등 한국 문화 특유의 감정 코드로 카드를 해석하세요.
- **현실 밀착 조언**: "3일 안에 연락하세요", "이번 주 수요일이 타이밍" 같은 구체적 행동 지침.
- **감정 내러티브**: 과거→현재→미래의 감정 변화를 드라마 줄거리처럼 서사적으로 전개.

### 6. 모나드 타로 (운명전쟁49) — 영적 성장 특화
- **영혼의 여정 관점**: 현재 상황이 영혼의 진화 과정에서 어떤 단계인지 분석하세요.
- **카르마적 교훈**: 이 상황이 가르치려는 카르마적 레슨, 반복되는 패턴의 근본 원인.
- **그림자 통합(Shadow Integration)**: 융 심리학의 그림자 자아, 아니마/아니무스 원형과 카드의 연결.
- **의식 확장**: 현재 경험을 영적 성장의 기회로 재해석. 차크라·에너지 블록 관점의 분석.
- **영적 메시지**: 높은 차원에서 전달되는 직관적 메시지를 카드를 통해 채널링.

## 출력 형식 (JSON) — 반드시 준수
마크다운 코드블록 없이 순수 JSON만 출력하세요. 각 detail 필드는 **최소 8-15문장**, 전문 용어에는 괄호 설명 필수.
{
  "user_info": {
    "birth": "사용자 생년월일시",
    "question": "사용자 질문"
  },
  "individual_readings": {
    "saju": {
      "source": "제공된 사주 데이터 출처 (포스텔러/내부계산/미제공)",
      "raw_data_used": {
        "사주원국": "년주/월주/일주/시주 (천간지지 표기)",
        "오행비율": "목/화/토/금/수 비율",
        "격국": "격국 판단 결과",
        "용신": "용신·희신·기신",
        "십신배치": "각 주의 십신",
        "현재대운": "대운 천간지지와 기간",
        "세운": "올해 세운",
        "합충": "주요 합충형파해"
      },
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "direction": "한 줄 핵심 방향성 (근거 포함)",
      "detail": "전문가급 심층 해석 (8-15문장. 격국·용신·십신·대운세운·합충을 질문과 연결하여 서사적 분석. 12운성 현재 위치, 시기적 에너지 방향, 향후 대운 전환 시점 언급.)"
    },
    "astrology": {
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "direction": "한 줄 핵심 방향성 (근거 포함)",
      "detail": "전문가급 심층 해석 (8-15문장. Big3 분석, 질문 관련 하우스 루러 디그니티, 현재 트랜짓 어스펙트와 도수, 역행 영향, 에너지 윈도우.)"
    },
    "ziwei": {
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "direction": "한 줄 핵심 방향성 (근거 포함)",
      "detail": "전문가급 심층 해석 (8-15문장. 명궁 주성 밝기, 질문 관련 궁위 삼방사정, 생년+대한+유년 사화 삼중 분석, 대한/소한 시기론.)"
    },
    "tarot": {
      "spread": "3카드 스프레드 (현재-문제-결과)",
      "cards": [
        {"position": "위치", "card": "카드명", "orientation": "정/역"}
      ],
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "direction": "한 줄 핵심 방향성 (근거 포함)",
      "detail": "전문가급 심층 해석 (8-15문장. RWS 도상학: 각 카드 이미지의 인물 자세·배경·색채·소품 상징. 수비학적 숫자 에너지. 원소 상성. 3장이 만드는 내러티브 아크. 카발라 경로 대응(메이저).)"
    },
    "choi_hanna_tarot": {
      "cards": [
        {"position": "위치", "card": "카드명", "orientation": "정/역"}
      ],
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "direction": "한 줄 핵심 방향성 (직설적 어투)",
      "detail": "최한나 스타일 심층 해석 (8-15문장. 감정 3층 분석, 한국적 관계 역학, 드라마 서사 전개, 구체적 행동 타이밍 제시.)"
    },
    "monad_tarot": {
      "cards": [
        {"position": "위치", "card": "카드명", "orientation": "정/역"}
      ],
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "direction": "한 줄 핵심 방향성 (영적 관점)",
      "detail": "모나드 스타일 심층 해석 (8-15문장. 영혼 여정 단계, 카르마적 교훈, 그림자 통합, 차크라/에너지 분석, 영적 메시지.)"
    }
  },
  "convergence": {
    "converged_count": 0,
    "converged_systems": [],
    "common_keywords": [],
    "common_message": "수렴된 체계들이 공통으로 가리키는 핵심 메시지 (구체적 근거 포함)",
    "divergent_systems": [],
    "divergent_reason": "분기 원인의 심층 분석과 어떤 체계의 판단을 우선할지 전문가 의견"
  },
  "final_reading": {
    "grade": "S / A / B / C",
    "grade_criteria": {
      "S": "6개 체계 전체 수렴 — 최고 확신도",
      "A": "5개 체계 수렴 — 높은 확신도",
      "B": "4개 체계 수렴 — 보통 확신도",
      "C": "3개 이하 수렴 — 추가 검토 필요"
    },
    "title": "인상적이고 통찰력 있는 리딩 제목 (한 줄)",
    "summary": "종합 리딩 (15-20문장. 6개 체계가 수렴하는 핵심 메시지를 서사적으로 전개. 각 체계의 핵심 근거 1개씩 인용. '왜 지금 이 질문을 하게 되었는지' 구조적 설명. 향후 6개월~1년 방향 예측. 내담자에게 전하는 메시지.)",
    "time_flow": {
      "past_influence": "과거 1-3년의 에너지가 현재에 미치는 영향 (150자, 근거 명시)",
      "present_situation": "현재 국면의 핵심 (200자, 6체계 중 가장 강력한 근거 인용)",
      "near_future": "향후 1-3개월 전망 (200자, 트랜짓·대운·카드 방향 교차 근거)",
      "long_term": "6개월~1년 전망 (200자, 대운 전환·목성 토성 사이클 근거)"
    },
    "advice": "전문가급 실천 조언 (10-15문장. 즉시 실행(이번 주): 구체적 행동 1-2개. 단기(1-3개월): 전략 3-4개. 중기(3-6개월): 구조적 변화 방향. 각 조언마다 어떤 체계의 어떤 근거에서 도출했는지 명시.)",
    "caution": "주의사항 (8-10문장. 6체계가 공통으로 경고하는 리스크. 무의식적 반복 패턴. 예방/경감 전략. 감정적 함정.)",
    "lucky_elements": {
      "color": "행운의 색 (오행/행성 근거)",
      "number": "행운의 숫자 (수비학/사주 근거)",
      "direction": "좋은 방위 (풍수/점성술 근거)",
      "time": "좋은 시간대 (시주/행성시 근거)",
      "day": "좋은 요일 (행성 요일 대응 근거)"
    }
  }
}

## 등급 판정 기준
- S등급: 6개 체계 전체 방향성 수렴 → 최고 확신도 리딩
- A등급: 5개 체계 수렴 → 높은 확신도
- B등급: 4개 체계 수렴 → 보통 확신도
- C등급: 3개 이하 수렴 → 추가 검토 필요

## 수렴 판정 방법 (엄격 적용)
1. 각 체계의 keywords 3개와 direction을 비교합니다.
2. 의미적으로 같은 방향(긍정/부정/전환/정체 등)을 가리키면 "수렴"으로 판정합니다.
3. 억지로 맞추지 마세요. 실제로 방향이 다르면 솔직하게 divergent로 분류하세요.
4. 분기가 있을 때는 "왜 이 체계만 다른 방향을 가리키는지" 구조적으로 설명하세요.

## 질문 유형별 분석 강도 조절
- **연애(love)**: 감정·관계 체계(최한나, 타로, 부처궁, 7하우스) 가중. 상대방 심리 3층 분석 필수.
- **직업(career)**: 구조·시기 체계(사주 관성, 관록궁, 10하우스) 가중. 적성·타이밍·전략 구체화.
- **금전(money)**: 재물 체계(사주 재성, 재백궁, 2/8하우스) 가중. 수입원·투자 방향·리스크 구체화.
- **종합(general)**: 6체계 균등 분석. 인생 전체 흐름과 현재 위치.`;


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const {
      question,
      questionType,
      memo,
      cards,
      sajuData,
      birthInfo,
      astrologyData,
      ziweiData,
      combinationSummary,
      forcetellData,
      manseryeokData,
    } = await req.json();

    // Build card descriptions
    const cardDescriptions = (cards || [])
      .map((c: any, idx: number) => {
        const positions = ["현재 상황", "핵심 문제", "결과/방향"];
        const position = positions[idx] || `Position ${idx + 1}`;
        const direction = c.isReversed ? "역방향" : "정방향";
        return `[${position}] ${c.korean || c.name} (${c.name}) - ${direction} | Suit: ${c.suit} | Number: ${c.id}`;
      })
      .join("\n");

    // Build saju section - Priority: forcetellData (manual) > manseryeokData (auto) > sajuData (legacy)
    let sajuSection = "출생정보 미제공";
    if (forcetellData) {
      sajuSection = `[포스텔러 원본 데이터 (수동 입력)]\n${forcetellData}`;
      if (manseryeokData) {
        sajuSection += `\n\n[만세력 자동 계산 (참고용)]\n사주 원국: ${manseryeokData.yearPillar?.cheongan}${manseryeokData.yearPillar?.jiji} / ${manseryeokData.monthPillar?.cheongan}${manseryeokData.monthPillar?.jiji} / ${manseryeokData.dayPillar?.cheongan}${manseryeokData.dayPillar?.jiji} / ${manseryeokData.hourPillar?.cheongan}${manseryeokData.hourPillar?.jiji}
일간: ${manseryeokData.ilgan}(${manseryeokData.ilganElement}, ${manseryeokData.ilganYinyang})
${manseryeokData.hanjaString ? `한자: ${manseryeokData.hanjaString}` : ""}`;
      } else if (sajuData) {
        sajuSection += `\n\n[내부 계산 사주 데이터 (참고용)]\n사주 원국: ${sajuData.yearPillar?.cheongan || ""}${sajuData.yearPillar?.jiji || ""} / ${sajuData.monthPillar?.cheongan || ""}${sajuData.monthPillar?.jiji || ""} / ${sajuData.dayPillar?.cheongan || ""}${sajuData.dayPillar?.jiji || ""} / ${sajuData.hourPillar?.cheongan || ""}${sajuData.hourPillar?.jiji || ""}
일간: ${sajuData.ilgan || ""}(${sajuData.ilganElement || ""}) / 신강/신약: ${sajuData.strength || ""} / 용신: ${sajuData.yongsin || ""}`;
      }
    } else if (manseryeokData) {
      sajuSection = `[만세력 자동 계산 데이터 (manseryeok 라이브러리)]
사주 원국: ${manseryeokData.yearPillar?.cheongan}${manseryeokData.yearPillar?.jiji} / ${manseryeokData.monthPillar?.cheongan}${manseryeokData.monthPillar?.jiji} / ${manseryeokData.dayPillar?.cheongan}${manseryeokData.dayPillar?.jiji} / ${manseryeokData.hourPillar?.cheongan}${manseryeokData.hourPillar?.jiji}
일간: ${manseryeokData.ilgan}(${manseryeokData.ilganElement}, ${manseryeokData.ilganYinyang})
연주 오행: ${manseryeokData.yearPillar?.cheonganElement}/${manseryeokData.yearPillar?.jijiElement}
월주 오행: ${manseryeokData.monthPillar?.cheonganElement}/${manseryeokData.monthPillar?.jijiElement}
일주 오행: ${manseryeokData.dayPillar?.cheonganElement}/${manseryeokData.dayPillar?.jijiElement}
시주 오행: ${manseryeokData.hourPillar?.cheonganElement}/${manseryeokData.hourPillar?.jijiElement}
${manseryeokData.hanjaString ? `한자: ${manseryeokData.hanjaString}` : ""}
${manseryeokData.fourPillarsString ? `전체: ${manseryeokData.fourPillarsString}` : ""}
${manseryeokData.lunarDate ? `음력: ${manseryeokData.lunarDate.year}년 ${manseryeokData.lunarDate.month}월 ${manseryeokData.lunarDate.day}일${manseryeokData.lunarDate.isLeapMonth ? " (윤달)" : ""}` : ""}`;
      if (sajuData) {
        sajuSection += `\n\n[내부 분석 보충 데이터]
신강/신약: ${sajuData.strength || ""} / 용신: ${sajuData.yongsin || ""}
오행 비율: 목${sajuData.fiveElementDist?.["목"]?.toFixed(1) || 0} 화${sajuData.fiveElementDist?.["화"]?.toFixed(1) || 0} 토${sajuData.fiveElementDist?.["토"]?.toFixed(1) || 0} 금${sajuData.fiveElementDist?.["금"]?.toFixed(1) || 0} 수${sajuData.fiveElementDist?.["수"]?.toFixed(1) || 0}
${sajuData.gyeokguk ? `격국: ${sajuData.gyeokguk}` : ""}
${sajuData.sinsal ? `신살: ${sajuData.sinsal.map((s: any) => `${s.name}(${s.branch}): ${s.meaning}`).join("; ")}` : ""}
${sajuData.jijiInteractions ? `지지 상호작용: ${sajuData.jijiInteractions.map((j: any) => `${j.type}(${j.branches.join(",")}): ${j.effect}`).join("; ")}` : ""}
${sajuData.daeun ? `현재 대운: ${sajuData.daeun.current?.cheongan || ""}${sajuData.daeun.current?.jiji || ""}(${sajuData.daeun.current?.startAge || ""}-${sajuData.daeun.current?.endAge || ""}세)` : ""}
${sajuData.sewun ? `현재 세운: ${sajuData.sewun.cheongan || ""}${sajuData.sewun.jiji || ""}` : ""}
${sajuData.crossKeywords ? "교차 키워드: " + sajuData.crossKeywords.join(", ") : ""}
${sajuData.questionAnalysis || ""}`;
      }
    } else if (sajuData) {
      sajuSection = `사주 원국: ${sajuData.yearPillar?.cheongan || ""}${sajuData.yearPillar?.jiji || ""} / ${sajuData.monthPillar?.cheongan || ""}${sajuData.monthPillar?.jiji || ""} / ${sajuData.dayPillar?.cheongan || ""}${sajuData.dayPillar?.jiji || ""} / ${sajuData.hourPillar?.cheongan || ""}${sajuData.hourPillar?.jiji || ""}
일간: ${sajuData.ilgan || ""}(${sajuData.ilganElement || ""}, ${sajuData.ilganYinyang || ""}) / 신강/신약: ${sajuData.strength || ""} / 용신: ${sajuData.yongsin || ""}
오행 비율: 목${sajuData.fiveElementDist?.["목"]?.toFixed(1) || 0} 화${sajuData.fiveElementDist?.["화"]?.toFixed(1) || 0} 토${sajuData.fiveElementDist?.["토"]?.toFixed(1) || 0} 금${sajuData.fiveElementDist?.["금"]?.toFixed(1) || 0} 수${sajuData.fiveElementDist?.["수"]?.toFixed(1) || 0}
${sajuData.gyeokguk ? `격국: ${sajuData.gyeokguk}` : ""}
${sajuData.sinsal ? `신살: ${sajuData.sinsal.map((s: any) => `${s.name}(${s.branch}): ${s.meaning}`).join("; ")}` : ""}
${sajuData.jijiInteractions ? `지지 상호작용: ${sajuData.jijiInteractions.map((j: any) => `${j.type}(${j.branches.join(",")}): ${j.effect}`).join("; ")}` : ""}
${sajuData.daeun ? `현재 대운: ${sajuData.daeun.current?.cheongan || ""}${sajuData.daeun.current?.jiji || ""}(${sajuData.daeun.current?.startAge || ""}-${sajuData.daeun.current?.endAge || ""}세)` : ""}
${sajuData.sewun ? `현재 세운: ${sajuData.sewun.cheongan || ""}${sajuData.sewun.jiji || ""}` : ""}
${sajuData.crossKeywords ? "교차 키워드: " + sajuData.crossKeywords.join(", ") : ""}
${sajuData.questionAnalysis || ""}`;
    }

    // Build astrology section
    let astroSection = "점성술 데이터 없음";
    if (astrologyData) {
      astroSection = `태양궁: ${astrologyData.sunSign} / 달궁: ${astrologyData.moonSign} / 상승궁: ${astrologyData.risingSign}
주요 원소: ${astrologyData.dominantElement} / 모달리티: ${astrologyData.dominantQuality}
${astrologyData.chartSummary || ""}
${astrologyData.planets ? `행성 배치: ${astrologyData.planets.map((p: any) => `${p.name} in ${p.sign}(${p.house ? 'H' + p.house : ''}) ${p.dignity || ''}`).join("; ")}` : ""}
${astrologyData.aspects ? `어스펙트: ${astrologyData.aspects.map((a: any) => `${a.planet1}${a.type}${a.planet2}(${a.orb}°)`).join("; ")}` : ""}
${astrologyData.transits ? `현재 트랜짓: ${JSON.stringify(astrologyData.transits)}` : ""}`;
    }

    // Build ziwei section
    let ziweiSection = "자미두수 데이터 없음";
    if (ziweiData) {
      ziweiSection = `명궁: ${ziweiData.mingGong} / 신궁: ${ziweiData.shenGong} / 국: ${ziweiData.bureau}
인생 구조: ${ziweiData.lifeStructure}
${ziweiData.natalTransformations ? `사화: ${ziweiData.natalTransformations.map((t: any) => `${t.type}: ${t.star}→${t.palace}`).join("; ")}` : ""}
${ziweiData.currentMajorPeriod ? `현재 대한: ${ziweiData.currentMajorPeriod.startAge}-${ziweiData.currentMajorPeriod.endAge}세, 궁위: ${ziweiData.currentMajorPeriod.palace}` : ""}
${ziweiData.currentMinorPeriod ? `현재 소한: ${ziweiData.currentMinorPeriod.age}세, 궁위: ${ziweiData.currentMinorPeriod.palace}` : ""}
${ziweiData.questionAnalysis || ""}`;
    }

    const userPrompt = `## 질문: "${question}" (유형: ${questionType})
${memo ? `상황/메모: ${memo}` : ""}
${birthInfo ? `출생정보: ${birthInfo.gender === "male" ? "남성" : "여성"}, ${birthInfo.birthDate}, ${birthInfo.birthTime || "시간 미상"}, ${birthInfo.birthPlace || "출생지 미상"}, ${birthInfo.isLunar ? "음력" : "양력"}` : "출생정보 미제공"}

## 사용자 선택 타로 카드 (3카드 스프레드)
${cardDescriptions}
${combinationSummary ? `\n## 카드 조합 데이터베이스 분석\n${combinationSummary}` : ""}

## 사주 데이터
${sajuSection}

## 서양 점성술 데이터
${astroSection}

## 자미두수 데이터
${ziweiSection}

---
위 모든 데이터를 기반으로 6개 체계(사주, 점성술, 자미두수, 웨이트 타로, 최한나 타로, 모나드 타로) 통합 분석을 수행하세요.
사주 데이터가 제공되지 않았다면 나머지 5개 체계로 분석하고, 등급도 5개 체계 기준으로 판정하세요.
반드시 순수 JSON만 출력하세요. 마크다운 코드블록(\`\`\`)을 사용하지 마세요.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GOOGLE_GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] },
        ],
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 16000,
        },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (status === 402) {
        const cardNames = (cards || [])
          .slice(0, 3)
          .map((c: any) => `${c.korean || c.name}${c.isReversed ? "(역)" : ""}`)
          .join(", ");

        const fallbackReading = {
          user_info: {
            birth: birthInfo ? `${birthInfo.birthDate} ${birthInfo.birthTime || ""}` : "미제공",
            question,
          },
          individual_readings: {
            saju: { source: "미제공", raw_data_used: {}, keywords: ["대기", "준비", "전환"], direction: "크레딧 충전 후 상세 분석 가능", detail: "AI 크레딧 부족으로 요약 리딩입니다." },
            astrology: { keywords: ["관찰", "신중", "기회"], direction: "요약 모드", detail: "크레딧 충전 후 상세 분석이 가능합니다." },
            ziwei: { keywords: ["변화", "적응", "성장"], direction: "요약 모드", detail: "크레딧 충전 후 상세 분석이 가능합니다." },
            tarot: { spread: "3카드", cards: (cards || []).map((c: any, i: number) => ({ position: ["현재", "핵심", "결과"][i], card: c.korean || c.name, orientation: c.isReversed ? "역" : "정" })), keywords: ["정리", "재설정", "실행"], direction: `${cardNames} 조합의 흐름`, detail: "선택한 카드 기본 상징 기반 요약입니다." },
            choi_hanna_tarot: { cards: [], keywords: ["감정정리", "직감", "행동"], direction: "요약 모드", detail: "크레딧 충전 후 상세 분석이 가능합니다." },
            monad_tarot: { cards: [], keywords: ["내면탐구", "성찰", "각성"], direction: "요약 모드", detail: "크레딧 충전 후 상세 분석이 가능합니다." },
          },
          convergence: {
            converged_count: 0,
            converged_systems: [],
            common_keywords: ["준비", "전환"],
            common_message: "요약 모드로 수렴 분석이 제한됩니다.",
            divergent_systems: [],
            divergent_reason: "크레딧 부족으로 전체 분석 불가",
          },
          final_reading: {
            grade: "C",
            grade_criteria: { S: "6개 체계 전체 수렴", A: "5개 수렴", B: "4개 수렴", C: "3개 이하 수렴" },
            title: "⚠️ 요약 리딩 (크레딧 충전 필요)",
            summary: `AI 크레딧이 부족하여 요약 리딩으로 결과를 제공합니다. 선택한 카드(${cardNames})의 기본 흐름은 '정리 → 우선순위 재설정 → 실행'입니다. 크레딧 충전 후 다시 분석하시면 6개 체계 전체를 활용한 정밀한 리딩을 받으실 수 있습니다.`,
            time_flow: {
              past_influence: "과거 패턴의 반복이 현재 질문으로 이어졌습니다.",
              present_situation: "현재는 정리와 재정비가 필요한 시점입니다.",
              near_future: "향후 1~3개월은 우선순위를 명확히 하는 데 집중하세요.",
              long_term: "6개월 후부터 본격적인 변화의 흐름이 시작됩니다.",
            },
            advice: "우선순위를 1개로 압축하고, 오늘 실행 가능한 작은 행동 1가지를 진행하세요.",
            caution: "불안 기반의 과잉 판단과 성급한 타이밍을 주의하세요.",
            lucky_elements: { color: "파란색", number: "7", direction: "동쪽", time: "오전 9-11시", day: "수요일" },
          },
          fallback: true,
        };

        return new Response(
          JSON.stringify({ reading: fallbackReading, warning: "AI 크레딧이 부족하여 요약 리딩입니다." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const t = await response.text();
      console.error("AI error:", status, t);
      return new Response(
        JSON.stringify({ error: "AI 분석 오류가 발생했습니다." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let reading;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      reading = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
    } catch {
      console.error("Parse fail:", content.slice(0, 500));
      reading = {
        user_info: { birth: "", question },
        individual_readings: {
          saju: { source: "", raw_data_used: {}, keywords: [], direction: "", detail: content.slice(0, 300) },
          astrology: { keywords: [], direction: "", detail: "" },
          ziwei: { keywords: [], direction: "", detail: "" },
          tarot: { spread: "3카드", cards: [], keywords: [], direction: "", detail: "" },
          choi_hanna_tarot: { cards: [], keywords: [], direction: "", detail: "" },
          monad_tarot: { cards: [], keywords: [], direction: "", detail: "" },
        },
        convergence: { converged_count: 0, converged_systems: [], common_keywords: [], common_message: "파싱 오류", divergent_systems: [], divergent_reason: "" },
        final_reading: { grade: "C", grade_criteria: {}, title: "분석 결과", summary: content.slice(0, 500), time_flow: {}, advice: "", caution: "", lucky_elements: {} },
      };
    }

    return new Response(JSON.stringify({ reading }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-reading-v2 error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
