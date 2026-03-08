export interface TarotCardBase {
  id: number;
  name: string;
  korean: string;
  suit: string;
  keywords: string[];
  upright: string;
  reversedMeaning: string;
  love: string;
  career: string;
  money: string;
  short: string;
}

export interface DeckCard extends TarotCardBase {
  isPicked: boolean;
  revealed: boolean;
  isReversed: boolean;
}

export function makeDeckCard(card: TarotCardBase, isPicked: boolean, revealed: boolean, isReversed: boolean): DeckCard {
  return { ...card, isPicked, revealed, isReversed };
}

const majorArcana: Omit<TarotCardBase, "short">[] = [
  { id: 0, name: "The Fool", korean: "바보", suit: "Major Arcana", keywords: ["새로운 시작", "충동", "순수함", "도전"], upright: "새 출발의 흐름입니다. 아직 모든 조건이 완벽하지 않아도 움직일 때 길이 열리는 카드입니다.", reversedMeaning: "충동적 선택, 준비 부족, 현실 감각의 약화를 경고합니다.", love: "연애에서는 새로운 인연 또는 관계의 리셋 가능성이 큽니다.", career: "일에서는 새로운 제안, 이직, 사이드 프로젝트의 시작에 유리합니다.", money: "돈 흐름은 새는 구간과 새 기회를 동시에 보여줍니다." },
  { id: 1, name: "The Magician", korean: "마법사", suit: "Major Arcana", keywords: ["실행력", "의지", "설득", "창조"], upright: "원하는 방향으로 현실을 밀어붙일 수 있는 힘이 있습니다.", reversedMeaning: "능력은 있지만 방향이 비틀리기 쉽습니다.", love: "연애에서는 적극적 접근이 통할 수 있습니다.", career: "기획, 협상, 브랜딩, 자기 PR에 매우 강한 흐름입니다.", money: "수익 구조를 직접 설계할 때 강합니다." },
  { id: 2, name: "The High Priestess", korean: "여사제", suit: "Major Arcana", keywords: ["직감", "보류", "내면", "비밀"], upright: "겉으로 보이는 것보다 숨은 정보가 더 중요합니다.", reversedMeaning: "오해, 숨김, 감정 억눌림이 커질 수 있습니다.", love: "연애에서는 상대의 속마음이 쉽게 드러나지 않습니다.", career: "일에서는 내부 정보, 분위기, 타이밍 파악이 핵심입니다.", money: "투자·금전에서는 불투명한 제안에 주의가 필요합니다." },
  { id: 3, name: "The Empress", korean: "여황제", suit: "Major Arcana", keywords: ["풍요", "매력", "관계", "확장"], upright: "자연스럽게 끌어당기는 힘이 강해지는 카드입니다.", reversedMeaning: "과소비, 감정 의존, 편안함에 머무는 흐름을 주의해야 합니다.", love: "연애에서는 호감, 애정 표현, 관계 회복의 흐름이 좋습니다.", career: "브랜드, 미용, 감성 콘텐츠, 사람 상대 일에 강합니다.", money: "돈은 들어오지만 같이 나가기도 쉽습니다." },
  { id: 4, name: "The Emperor", korean: "황제", suit: "Major Arcana", keywords: ["통제", "책임", "구조", "안정"], upright: "흔들리는 상황을 정리하고 기준을 세워야 할 때입니다.", reversedMeaning: "고집, 통제 과잉, 관계 경직이 문제가 될 수 있습니다.", love: "연애에서는 안정 욕구가 강해지지만 표현이 딱딱해질 수 있습니다.", career: "관리, 운영, 리더 역할, 사업 구조 정비에 좋습니다.", money: "장기적으로 안정화할 수 있는 흐름입니다." },
  { id: 5, name: "The Hierophant", korean: "교황", suit: "Major Arcana", keywords: ["전통", "조언", "제도", "신뢰"], upright: "기존 질서 안에서 답을 찾는 카드입니다.", reversedMeaning: "고정관념, 답답한 규칙, 형식만 남은 관계를 의미할 수 있습니다.", love: "연애에서는 진지한 관계, 소개, 결혼 논의와 연결되기 쉽습니다.", career: "공공기관, 교육, 조직생활, 자격 기반 일에 유리합니다.", money: "안정적 관리에는 좋지만 큰 한방과는 거리가 있습니다." },
  { id: 6, name: "The Lovers", korean: "연인", suit: "Major Arcana", keywords: ["선택", "관계", "끌림", "합의"], upright: "마음과 현실 사이의 선택이 중요해지는 카드입니다.", reversedMeaning: "엇갈림, 유혹, 가치관 충돌이 생기기 쉽습니다.", love: "연애 그 자체를 강하게 보여주는 카드입니다.", career: "파트너십, 협업, 공동 프로젝트에 유리합니다.", money: "금전은 사람과의 관계에 영향을 받습니다." },
  { id: 7, name: "The Chariot", korean: "전차", suit: "Major Arcana", keywords: ["돌파", "속도", "의지", "이동"], upright: "밀어붙이면 길이 열리는 카드입니다.", reversedMeaning: "과속, 조급함, 방향 상실을 뜻합니다.", love: "연애에서는 빠른 진전이 가능하지만 감정 속도 차이가 문제될 수 있습니다.", career: "이직, 이동, 프로젝트 추진, 경쟁 상황에서 강합니다.", money: "단기적으로 움직임이 크지만 안정성은 약할 수 있습니다." },
  { id: 8, name: "Strength", korean: "힘", suit: "Major Arcana", keywords: ["인내", "절제", "내면의 힘", "회복"], upright: "강하게 누르기보다 부드럽게 다뤄야 성과가 납니다.", reversedMeaning: "자신감 저하, 피로, 버티는 힘의 약화를 보여줍니다.", love: "연애에서는 참아주는 힘, 관계 회복, 감정 조율이 중요합니다.", career: "일에서는 꾸준함과 평정심이 이깁니다.", money: "수익보다 지출 통제와 회복이 핵심입니다." },
  { id: 9, name: "The Hermit", korean: "은둔자", suit: "Major Arcana", keywords: ["거리", "탐색", "고독", "정리"], upright: "혼자 생각을 정리해야 보이는 것이 있습니다.", reversedMeaning: "지나친 고립, 우울, 판단 지연으로 흐름이 막힐 수 있습니다.", love: "연애에서는 거리감, 잠시 멈춤, 혼자만의 판단이 강해질 수 있습니다.", career: "연구, 분석, 전략 수정에는 좋습니다.", money: "지출 축소, 위험 회피, 혼자 점검하는 시간이 유리합니다." },
  { id: 10, name: "Wheel of Fortune", korean: "운명의 수레바퀴", suit: "Major Arcana", keywords: ["변화", "전환", "기회", "타이밍"], upright: "판이 바뀌는 흐름입니다.", reversedMeaning: "엇박자, 반복 실수, 타이밍 미스를 조심해야 합니다.", love: "연애에서는 재회, 우연한 연결, 갑작스러운 변화 가능성이 큽니다.", career: "기회가 열리지만 준비된 사람만 잡습니다.", money: "수입 변동이 생기기 쉽습니다." },
  { id: 11, name: "Justice", korean: "정의", suit: "Major Arcana", keywords: ["균형", "판단", "계약", "책임"], upright: "감정보다 사실이 중요합니다.", reversedMeaning: "불균형, 억울함, 애매한 관계가 계속될 수 있습니다.", love: "연애에서는 말보다 행동, 감정보다 태도가 중요합니다.", career: "계약, 문서, 협상, 평가에 중요합니다.", money: "금전 문제는 정확한 계산이 필요합니다." },
  { id: 12, name: "The Hanged Man", korean: "매달린 남자", suit: "Major Arcana", keywords: ["정체", "보류", "관점 전환", "희생"], upright: "지금은 억지로 결과를 만들기보다 관점을 바꾸어야 할 때입니다.", reversedMeaning: "무의미한 버팀, 답 없는 기다림, 희생의 반복이 될 수 있습니다.", love: "연애에서는 한쪽만 버티는 관계가 될 수 있습니다.", career: "일은 잠시 묶일 수 있지만, 방향 수정에는 도움이 됩니다.", money: "금전에서는 당장 키우기보다 묶이는 흐름입니다." },
  { id: 13, name: "Death", korean: "죽음", suit: "Major Arcana", keywords: ["종결", "전환", "정리", "재시작"], upright: "끝나야 할 것이 끝나야 다음 흐름이 시작됩니다.", reversedMeaning: "끝내야 할 것을 붙잡아 반복 피로가 생길 수 있습니다.", love: "연애에서는 관계의 형태가 크게 바뀔 수 있습니다.", career: "일에서는 퇴사, 부서 변경, 구조 개편과 관련됩니다.", money: "돈 흐름도 구간이 끊기고 다시 시작됩니다." },
  { id: 14, name: "Temperance", korean: "절제", suit: "Major Arcana", keywords: ["균형", "회복", "조율", "완화"], upright: "극단으로 가지 말고 조정해야 할 때입니다.", reversedMeaning: "과함, 불균형, 생활 리듬 붕괴를 주의해야 합니다.", love: "연애에서는 회복과 조율의 가능성이 있습니다.", career: "협업, 중재, 안정적 운영에 유리합니다.", money: "급등보다 안정 회복형입니다." },
  { id: 15, name: "The Devil", korean: "악마", suit: "Major Arcana", keywords: ["집착", "유혹", "중독", "반복"], upright: "끊기 어려운 패턴, 강한 끌림, 불편하지만 익숙한 구조를 보여줍니다.", reversedMeaning: "묶인 상태에서 벗어나려는 흐름입니다.", love: "연애에서는 집착, 반복 관계, 끌리지만 소모적인 연결을 의미할 수 있습니다.", career: "일에서는 돈은 되지만 지치는 구조를 암시합니다.", money: "지출 습관, 빚, 욕망 소비를 강하게 경고합니다." },
  { id: 16, name: "The Tower", korean: "탑", suit: "Major Arcana", keywords: ["충격", "붕괴", "진실", "해체"], upright: "갑작스러운 깨달음 또는 붕괴를 통해 진실이 드러나는 카드입니다.", reversedMeaning: "이미 흔들리는 구조를 억지로 붙잡는 모습일 수 있습니다.", love: "연애에서는 갑작스러운 다툼, 진실 폭로, 관계 재정립이 올 수 있습니다.", career: "일에서는 예상 밖의 변화, 구조조정 가능성이 있습니다.", money: "큰 지출이나 예기치 못한 변수에 주의가 필요합니다." },
  { id: 17, name: "The Star", korean: "별", suit: "Major Arcana", keywords: ["희망", "회복", "명확성", "치유"], upright: "힘들었던 흐름 이후 다시 숨이 트이는 카드입니다.", reversedMeaning: "희망은 있으나 아직 확신이 부족합니다.", love: "연애에서는 상처 회복, 순한 연결, 관계 개선 가능성이 있습니다.", career: "일에서는 이미지 개선, 장기 비전에 유리합니다.", money: "대박보다는 회복과 안정화 흐름입니다." },
  { id: 18, name: "The Moon", korean: "달", suit: "Major Arcana", keywords: ["불안", "착각", "감정", "미확인"], upright: "보이지 않는 것이 많습니다. 불안과 직감이 동시에 커지는 시기입니다.", reversedMeaning: "혼란이 조금씩 걷히는 흐름입니다.", love: "연애에서는 상대 마음을 단정하기 어렵습니다.", career: "일에서는 정보가 불명확합니다.", money: "금전 흐름이 불안정하거나 숨은 비용이 있을 수 있습니다." },
  { id: 19, name: "The Sun", korean: "태양", suit: "Major Arcana", keywords: ["성공", "명확성", "활력", "호감"], upright: "가장 직관적으로 좋은 카드 중 하나입니다.", reversedMeaning: "좋은 기운은 있으나 기대만큼 빠르게 체감되지 않을 수 있습니다.", love: "연애에서는 호감, 공개, 관계 진전, 밝은 흐름을 의미합니다.", career: "일에서는 성과, 인정, 주목, 홍보 효과가 좋습니다.", money: "돈 흐름도 비교적 좋습니다." },
  { id: 20, name: "Judgement", korean: "심판", suit: "Major Arcana", keywords: ["재평가", "각성", "재기회", "결론"], upright: "과거를 다시 돌아보고 결론을 내려야 할 때입니다.", reversedMeaning: "과거 미해결 문제가 발목을 잡을 수 있습니다.", love: "연애에서는 재회, 재연락, 다시 판단하는 흐름과 관련이 깊습니다.", career: "일에서는 예전 기회의 재등장, 방향 수정이 가능합니다.", money: "과거의 소비나 계약 정산이 필요합니다." },
  { id: 21, name: "The World", korean: "세계", suit: "Major Arcana", keywords: ["완성", "마무리", "확장", "성취"], upright: "한 사이클이 완성되는 카드입니다.", reversedMeaning: "마무리 지연, 애매한 종료를 보여줄 수 있습니다.", love: "연애에서는 관계의 완성, 공식화가 연결될 수 있습니다.", career: "프로젝트 마무리, 론칭, 결과 발표에 유리합니다.", money: "돈은 누적 결과가 드러나는 흐름입니다." },
];

// --- Minor Arcana: Wands (완드) ---
const wands: Omit<TarotCardBase, "short">[] = [
  { id: 22, name: "Ace of Wands", korean: "완드 에이스", suit: "Wands", keywords: ["영감", "시작", "열정", "잠재력"], upright: "새로운 열정과 창조적 에너지가 점화되는 시점입니다. 아이디어를 실행에 옮길 때입니다.", reversedMeaning: "시작의 에너지가 막히거나 방향을 못 잡고 있습니다.", love: "새로운 만남이나 관계에 불꽃이 튈 수 있습니다.", career: "새 프로젝트, 창업, 영감 넘치는 기회가 열립니다.", money: "새로운 수입원의 가능성이 보입니다." },
  { id: 23, name: "Two of Wands", korean: "완드 2", suit: "Wands", keywords: ["계획", "결정", "확장", "비전"], upright: "다음 단계를 계획하고 더 넓은 세계로 나아갈 준비를 합니다.", reversedMeaning: "계획이 불확실하거나 결정을 미루고 있습니다.", love: "관계의 미래를 함께 그려볼 시기입니다.", career: "장기 전략을 세우기에 좋은 때입니다.", money: "투자나 확장에 대한 판단이 필요합니다." },
  { id: 24, name: "Three of Wands", korean: "완드 3", suit: "Wands", keywords: ["진전", "확장", "기다림", "성장"], upright: "씨를 뿌린 결과가 서서히 나타나기 시작합니다. 더 큰 기회가 다가옵니다.", reversedMeaning: "기대한 결과가 늦어지거나 방향 수정이 필요합니다.", love: "관계가 성장하며 더 깊어질 수 있습니다.", career: "확장, 해외 기회, 새 시장 진입에 유리합니다.", money: "투자 수익이 서서히 나타나기 시작합니다." },
  { id: 25, name: "Four of Wands", korean: "완드 4", suit: "Wands", keywords: ["축하", "안정", "기반", "화합"], upright: "축하할 일이 생기거나 안정적인 기반이 만들어지는 카드입니다.", reversedMeaning: "불안정함, 소속감 부족, 미완성된 기반을 나타냅니다.", love: "결혼, 동거, 관계의 공식화가 가능한 흐름입니다.", career: "프로젝트 성공, 팀워크, 성과 인정의 시기입니다.", money: "재정적 안정 기반이 잡히기 시작합니다." },
  { id: 26, name: "Five of Wands", korean: "완드 5", suit: "Wands", keywords: ["경쟁", "갈등", "충돌", "도전"], upright: "경쟁과 갈등이 있지만 성장을 위한 과정일 수 있습니다.", reversedMeaning: "불필요한 다툼을 피하거나, 내면의 갈등을 해소해야 합니다.", love: "의견 충돌, 경쟁자, 관계 내 긴장이 생길 수 있습니다.", career: "경쟁 상황이지만 실력으로 돌파할 수 있습니다.", money: "지출 경쟁이나 예상치 못한 비용이 발생할 수 있습니다." },
  { id: 27, name: "Six of Wands", korean: "완드 6", suit: "Wands", keywords: ["승리", "인정", "자신감", "성취"], upright: "노력의 결과가 인정받고 주목받는 시기입니다.", reversedMeaning: "인정받지 못하거나 자만심이 문제가 될 수 있습니다.", love: "관계에서 자신감이 높아지며 매력이 빛납니다.", career: "승진, 수상, 대외적 성과 인정이 기대됩니다.", money: "보너스, 성과급 등 금전적 보상이 따릅니다." },
  { id: 28, name: "Seven of Wands", korean: "완드 7", suit: "Wands", keywords: ["방어", "입장 고수", "도전", "경쟁"], upright: "자신의 입장을 지켜야 할 때입니다. 포기하지 않으면 이깁니다.", reversedMeaning: "압박감에 지치거나 방어가 무너질 수 있습니다.", love: "관계를 지키기 위한 노력이 필요한 시기입니다.", career: "경쟁자를 물리치고 포지션을 지켜야 합니다.", money: "지출 방어, 수입 보호가 중요합니다." },
  { id: 29, name: "Eight of Wands", korean: "완드 8", suit: "Wands", keywords: ["속도", "진행", "소식", "이동"], upright: "일이 빠르게 진행됩니다. 기다리던 소식이 올 수 있습니다.", reversedMeaning: "지연, 오해, 계획의 차질이 생길 수 있습니다.", love: "빠른 진전, 연락, 만남의 가속이 예상됩니다.", career: "프로젝트가 빠르게 진행되며 결과가 곧 나옵니다.", money: "자금 흐름이 빨라집니다." },
  { id: 30, name: "Nine of Wands", korean: "완드 9", suit: "Wands", keywords: ["인내", "경계", "끈기", "방어"], upright: "지치지만 거의 다 왔습니다. 마지막까지 버텨야 합니다.", reversedMeaning: "방어적 태도가 과해 기회를 놓칠 수 있습니다.", love: "상처받을까 두려워 벽을 쌓고 있을 수 있습니다.", career: "마지막 고비입니다. 포기하지 마세요.", money: "재정적 압박이 있지만 곧 나아집니다." },
  { id: 31, name: "Ten of Wands", korean: "완드 10", suit: "Wands", keywords: ["과부하", "책임", "부담", "완수"], upright: "너무 많은 짐을 지고 있습니다. 위임하거나 정리가 필요합니다.", reversedMeaning: "짐을 내려놓거나 부담이 줄어드는 흐름입니다.", love: "관계가 부담스럽거나 혼자 모든 걸 감당하고 있습니다.", career: "업무 과부하입니다. 효율적으로 분배해야 합니다.", money: "재정적 부담이 크지만 정리하면 나아집니다." },
  { id: 32, name: "Page of Wands", korean: "완드 시종", suit: "Wands", keywords: ["탐험", "열정", "호기심", "소식"], upright: "새로운 모험에 대한 열정이 타오릅니다. 좋은 소식이 올 수 있습니다.", reversedMeaning: "방향 없는 열정, 계획 없는 충동을 경계해야 합니다.", love: "설레는 새 만남이나 관계의 신선한 에너지가 느껴집니다.", career: "새로운 기회나 학습에 대한 열의가 높습니다.", money: "소규모 투자나 새 수입원 탐색에 적합합니다." },
  { id: 33, name: "Knight of Wands", korean: "완드 기사", suit: "Wands", keywords: ["행동", "모험", "대담함", "변화"], upright: "과감하게 행동으로 옮길 때입니다. 에너지가 넘칩니다.", reversedMeaning: "성급함, 무모한 행동, 방향 없는 질주를 주의해야 합니다.", love: "열정적이고 스릴 있는 연애가 가능하지만 지속성이 과제입니다.", career: "빠른 실행력이 빛나지만 마무리까지 신경 써야 합니다.", money: "공격적 투자는 리스크가 따릅니다." },
  { id: 34, name: "Queen of Wands", korean: "완드 여왕", suit: "Wands", keywords: ["자신감", "매력", "독립", "따뜻함"], upright: "자신감과 매력이 넘치며 주변을 이끄는 힘이 있습니다.", reversedMeaning: "질투, 자존심 문제, 지나친 통제욕을 주의해야 합니다.", love: "매력적이고 당당한 에너지가 관계를 이끕니다.", career: "리더십, 자기 브랜딩, 사람 관리에 탁월합니다.", money: "자신의 능력으로 수익을 만들어내는 흐름입니다." },
  { id: 35, name: "King of Wands", korean: "완드 왕", suit: "Wands", keywords: ["리더십", "비전", "대담함", "카리스마"], upright: "비전을 가지고 대담하게 이끌어가는 카드입니다.", reversedMeaning: "독선, 과도한 통제, 비현실적 목표를 경계해야 합니다.", love: "관계에서 주도적 역할을 하며 열정적입니다.", career: "사업가, 리더, 기획자로서 강한 흐름입니다.", money: "큰 그림을 그리며 투자할 때 유리합니다." },
];

// --- Minor Arcana: Cups (컵) ---
const cups: Omit<TarotCardBase, "short">[] = [
  { id: 36, name: "Ace of Cups", korean: "컵 에이스", suit: "Cups", keywords: ["사랑", "감정", "새 관계", "직감"], upright: "새로운 감정적 시작, 사랑의 가능성이 열립니다.", reversedMeaning: "감정이 막히거나 사랑을 받아들이기 어려운 상태입니다.", love: "새로운 사랑, 고백, 감정의 시작이 옵니다.", career: "창의적 영감, 감성적 프로젝트에 유리합니다.", money: "감정에 따른 소비를 조절해야 합니다." },
  { id: 37, name: "Two of Cups", korean: "컵 2", suit: "Cups", keywords: ["교감", "파트너십", "연결", "상호 존중"], upright: "깊은 감정적 교감과 균형 잡힌 관계를 나타냅니다.", reversedMeaning: "불균형, 소통 단절, 관계의 갈등이 생길 수 있습니다.", love: "서로 맞아가는 좋은 관계, 커플의 조화가 돋보입니다.", career: "파트너십, 협업이 성과를 만듭니다.", money: "공동 투자나 합의가 유리합니다." },
  { id: 38, name: "Three of Cups", korean: "컵 3", suit: "Cups", keywords: ["축하", "우정", "기쁨", "교류"], upright: "기쁨을 나누고 축하할 일이 생깁니다. 사회적 교류가 활발합니다.", reversedMeaning: "과음, 방탕, 표면적인 관계에 주의해야 합니다.", love: "즐거운 연애, 그룹 내 인연, 축하받는 관계입니다.", career: "팀워크, 네트워킹, 협업 성과가 좋습니다.", money: "유흥비 지출에 주의하되 인맥이 기회를 가져옵니다." },
  { id: 39, name: "Four of Cups", korean: "컵 4", suit: "Cups", keywords: ["무관심", "권태", "불만", "내면 탐색"], upright: "현재 상황에 불만이 있거나 주어진 기회를 못 보고 있습니다.", reversedMeaning: "새로운 시각으로 기회를 발견하기 시작합니다.", love: "권태기, 감정적 무관심이 관계를 위협합니다.", career: "동기 부족, 새로운 자극이 필요한 시기입니다.", money: "주어진 기회를 무심코 놓칠 수 있습니다." },
  { id: 40, name: "Five of Cups", korean: "컵 5", suit: "Cups", keywords: ["상실", "후회", "슬픔", "회복"], upright: "잃어버린 것에 집중하느라 남아있는 것을 못 봅니다.", reversedMeaning: "슬픔에서 벗어나 앞으로 나아가기 시작합니다.", love: "이별의 슬픔, 후회가 크지만 회복의 여지가 있습니다.", career: "실패에서 교훈을 얻고 다시 시작해야 합니다.", money: "손실이 있지만 남은 자산을 지켜야 합니다." },
  { id: 41, name: "Six of Cups", korean: "컵 6", suit: "Cups", keywords: ["추억", "순수", "재회", "향수"], upright: "과거의 좋은 기억, 재회, 순수한 감정이 떠오릅니다.", reversedMeaning: "과거에 얽매여 현재를 놓칠 수 있습니다.", love: "옛 인연과의 재회, 첫사랑 같은 감정이 살아납니다.", career: "과거 경험이 현재 일에 도움이 됩니다.", money: "과거 투자의 결실을 볼 수 있습니다." },
  { id: 42, name: "Seven of Cups", korean: "컵 7", suit: "Cups", keywords: ["환상", "선택", "유혹", "혼란"], upright: "선택지가 많지만 현실적인 판단이 필요합니다. 환상에 빠지기 쉽습니다.", reversedMeaning: "현실 직시, 선택의 명확화가 이루어집니다.", love: "이상적인 연애를 꿈꾸지만 현실과 다를 수 있습니다.", career: "여러 기회 중 하나에 집중해야 합니다.", money: "비현실적인 수익 기대를 조심해야 합니다." },
  { id: 43, name: "Eight of Cups", korean: "컵 8", suit: "Cups", keywords: ["떠남", "탐색", "실망", "전환"], upright: "현재에 만족하지 못해 더 깊은 의미를 찾아 떠납니다.", reversedMeaning: "떠나야 할 때를 못 떠나거나 무의미하게 돌아옵니다.", love: "관계에서 벗어나 자신을 찾는 여정이 시작될 수 있습니다.", career: "현 직장에 회의를 느끼고 새 방향을 모색합니다.", money: "물질보다 의미를 추구하는 시기입니다." },
  { id: 44, name: "Nine of Cups", korean: "컵 9", suit: "Cups", keywords: ["만족", "성취", "소원 성취", "풍요"], upright: "소원이 이루어지는 카드입니다. 감정적 물질적 만족이 옵니다.", reversedMeaning: "겉으로만 만족하거나 과한 욕심이 화를 부를 수 있습니다.", love: "원하던 관계가 이루어지거나 행복감이 큽니다.", career: "목표 달성, 성취감이 높은 시기입니다.", money: "재정적으로 풍요로운 흐름입니다." },
  { id: 45, name: "Ten of Cups", korean: "컵 10", suit: "Cups", keywords: ["행복", "가정", "조화", "완성"], upright: "가정의 행복, 정서적 완성, 이상적인 관계를 나타냅니다.", reversedMeaning: "가족 갈등, 이상과 현실의 괴리가 있을 수 있습니다.", love: "이상적인 관계, 가정의 화목, 행복한 결합입니다.", career: "직장 내 화목한 분위기, 만족스러운 환경입니다.", money: "가족 단위 재정이 안정됩니다." },
  { id: 46, name: "Page of Cups", korean: "컵 시종", suit: "Cups", keywords: ["감성", "직감", "메시지", "순수"], upright: "감성적인 메시지나 직감적 영감이 찾아옵니다.", reversedMeaning: "감정적 미성숙, 비현실적인 꿈에 빠질 수 있습니다.", love: "로맨틱한 고백이나 순수한 감정 표현이 있습니다.", career: "창의적 아이디어, 예술적 영감이 좋습니다.", money: "작지만 기분 좋은 수입이 있을 수 있습니다." },
  { id: 47, name: "Knight of Cups", korean: "컵 기사", suit: "Cups", keywords: ["로맨스", "제안", "매력", "이상주의"], upright: "로맨틱한 제안이나 감성적인 기회가 다가옵니다.", reversedMeaning: "비현실적 기대, 감정적 조종, 변덕스러움을 주의해야 합니다.", love: "로맨틱한 접근, 감정적 프로포즈가 올 수 있습니다.", career: "창의적 제안, 감성 마케팅에 유리합니다.", money: "감정에 의한 충동 소비를 조심해야 합니다." },
  { id: 48, name: "Queen of Cups", korean: "컵 여왕", suit: "Cups", keywords: ["공감", "직감", "돌봄", "감성 지능"], upright: "깊은 공감 능력과 감성적 지혜가 빛나는 시기입니다.", reversedMeaning: "감정에 휘둘리거나 타인에게 과도하게 의존합니다.", love: "깊이 있는 사랑, 상대를 이해하는 힘이 강합니다.", career: "상담, 돌봄, 감성 관련 분야에서 빛납니다.", money: "직감적인 판단이 재정에 도움이 됩니다." },
  { id: 49, name: "King of Cups", korean: "컵 왕", suit: "Cups", keywords: ["감정 통제", "지혜", "균형", "관대함"], upright: "감정을 잘 다스리며 현명하게 상황을 이끕니다.", reversedMeaning: "감정 억압, 냉담함, 감정 폭발의 위험이 있습니다.", love: "성숙하고 안정적인 관계를 이끌 수 있습니다.", career: "감정 지능이 리더십의 핵심이 됩니다.", money: "감정에 흔들리지 않는 투자 판단이 유리합니다." },
];

// --- Minor Arcana: Swords (검) ---
const swords: Omit<TarotCardBase, "short">[] = [
  { id: 50, name: "Ace of Swords", korean: "검 에이스", suit: "Swords", keywords: ["진실", "명확성", "돌파", "새 관점"], upright: "진실이 밝혀지고 새로운 관점으로 돌파구가 열립니다.", reversedMeaning: "혼란, 잘못된 판단, 불명확한 사고를 주의해야 합니다.", love: "솔직한 대화가 관계를 풀어줍니다.", career: "명쾌한 아이디어, 논리적 해결책이 나옵니다.", money: "계약서나 조건을 꼼꼼히 확인해야 합니다." },
  { id: 51, name: "Two of Swords", korean: "검 2", suit: "Swords", keywords: ["교착", "결정 장애", "균형", "회피"], upright: "결정을 내리지 못하고 교착 상태에 빠져 있습니다.", reversedMeaning: "정보가 드러나며 결정을 내릴 수 있게 됩니다.", love: "감정과 이성 사이에서 결정을 미루고 있습니다.", career: "두 선택지 사이에서 고민 중입니다.", money: "투자 결정을 보류하고 있는 상태입니다." },
  { id: 52, name: "Three of Swords", korean: "검 3", suit: "Swords", keywords: ["상처", "이별", "슬픔", "배신"], upright: "감정적 상처, 이별, 배신의 고통을 겪고 있습니다.", reversedMeaning: "상처에서 회복하기 시작하며 치유가 진행됩니다.", love: "이별, 삼각관계, 마음의 상처가 클 수 있습니다.", career: "직장 내 배신이나 기대 외 결과에 실망합니다.", money: "감정적 소비로 손실이 생길 수 있습니다." },
  { id: 53, name: "Four of Swords", korean: "검 4", suit: "Swords", keywords: ["휴식", "회복", "명상", "재충전"], upright: "멈추고 쉬어야 할 때입니다. 회복이 최우선입니다.", reversedMeaning: "충분히 쉬지 못해 번아웃 직전이거나, 다시 움직일 준비가 됩니다.", love: "관계에 잠시 거리를 두고 돌아볼 시간이 필요합니다.", career: "휴가, 재충전, 전략적 후퇴가 필요합니다.", money: "지출을 줄이고 에너지를 보존해야 합니다." },
  { id: 54, name: "Five of Swords", korean: "검 5", suit: "Swords", keywords: ["패배", "갈등", "비열함", "승리의 대가"], upright: "이겨도 잃는 것이 있는 싸움입니다. 갈등의 대가를 치릅니다.", reversedMeaning: "갈등을 끝내고 화해를 모색하기 시작합니다.", love: "다툼이 관계를 해칩니다. 이기려 하면 지게 됩니다.", career: "직장 내 정치, 불공정한 경쟁을 주의해야 합니다.", money: "사기, 불공정 거래에 주의가 필요합니다." },
  { id: 55, name: "Six of Swords", korean: "검 6", suit: "Swords", keywords: ["이동", "전환", "회복", "탈출"], upright: "어려운 상황에서 벗어나 더 나은 곳으로 이동합니다.", reversedMeaning: "벗어나지 못하거나, 문제를 미해결 상태로 옮깁니다.", love: "관계의 위기를 지나 안정을 찾아갑니다.", career: "이직, 부서 이동, 환경 변화가 도움이 됩니다.", money: "재정적 어려움에서 서서히 벗어납니다." },
  { id: 56, name: "Seven of Swords", korean: "검 7", suit: "Swords", keywords: ["속임", "전략", "은밀", "도피"], upright: "숨기거나 속이는 에너지가 있습니다. 전략적 접근이 필요합니다.", reversedMeaning: "비밀이 드러나거나 양심의 가책을 느낍니다.", love: "거짓말, 비밀, 불신이 관계를 흔들 수 있습니다.", career: "정보를 선별적으로 공유하되 정직함을 잃지 마세요.", money: "숨은 비용이나 사기에 주의가 필요합니다." },
  { id: 57, name: "Eight of Swords", korean: "검 8", suit: "Swords", keywords: ["속박", "제한", "무력감", "자기 제한"], upright: "스스로 만든 틀에 갇혀 있습니다. 실제보다 상황이 나쁘지 않습니다.", reversedMeaning: "제한에서 벗어나 자유를 찾기 시작합니다.", love: "관계에서 갇힌 느낌이 들지만 출구는 있습니다.", career: "직장에서 막힌 느낌이지만 시각을 바꾸면 해결됩니다.", money: "재정적 제한이 심리적일 수 있습니다." },
  { id: 58, name: "Nine of Swords", korean: "검 9", suit: "Swords", keywords: ["불안", "악몽", "걱정", "스트레스"], upright: "걱정과 불안이 극심합니다. 대부분 실제보다 과장된 두려움입니다.", reversedMeaning: "불안에서 벗어나기 시작하며, 도움을 구할 수 있습니다.", love: "관계에 대한 불안, 의심이 잠을 설치게 합니다.", career: "업무 스트레스, 실패 공포가 심합니다.", money: "재정 걱정이 크지만 객관적으로 볼 필요가 있습니다." },
  { id: 59, name: "Ten of Swords", korean: "검 10", suit: "Swords", keywords: ["종말", "바닥", "끝", "재시작"], upright: "가장 나쁜 상황이지만 이제 바닥입니다. 오를 일만 남았습니다.", reversedMeaning: "최악은 지나갔으며 회복이 시작됩니다.", love: "관계의 끝이지만 새 시작의 가능성이 열립니다.", career: "프로젝트 실패나 해고지만 새 기회가 옵니다.", money: "큰 손실 이후 재건이 시작됩니다." },
  { id: 60, name: "Page of Swords", korean: "검 시종", suit: "Swords", keywords: ["호기심", "경계", "소식", "관찰"], upright: "예리한 관찰력으로 정보를 수집합니다. 새 소식이 올 수 있습니다.", reversedMeaning: "험담, 스파이 행위, 미성숙한 논쟁을 주의해야 합니다.", love: "호기심 많은 접근이지만 너무 분석적일 수 있습니다.", career: "조사, 연구, 정보 수집에 유리합니다.", money: "금융 정보를 꼼꼼히 확인해야 합니다." },
  { id: 61, name: "Knight of Swords", korean: "검 기사", suit: "Swords", keywords: ["돌진", "직설", "결단", "논쟁"], upright: "빠르고 결단력 있게 행동하지만 주변을 살피지 못할 수 있습니다.", reversedMeaning: "무모한 돌진, 논쟁, 말실수를 조심해야 합니다.", love: "직설적 표현이 관계를 건설적으로 또는 파괴적으로 만듭니다.", career: "빠른 결정과 실행이 필요하지만 신중함도 필요합니다.", money: "충동적 투자 결정을 경계해야 합니다." },
  { id: 62, name: "Queen of Swords", korean: "검 여왕", suit: "Swords", keywords: ["명확함", "독립", "직관", "경계"], upright: "감정에 흔들리지 않는 명확한 판단력을 가집니다.", reversedMeaning: "냉소적이거나 감정을 너무 차단하고 있습니다.", love: "감정보다 논리로 관계를 판단합니다. 솔직함이 중요합니다.", career: "분석, 전략, 비평에서 뛰어난 성과를 냅니다.", money: "냉철한 분석으로 손실을 막을 수 있습니다." },
  { id: 63, name: "King of Swords", korean: "검 왕", suit: "Swords", keywords: ["권위", "논리", "공정", "지적 리더십"], upright: "논리와 공정함으로 상황을 이끌어가는 리더십입니다.", reversedMeaning: "독재적, 냉혹한 판단, 감정 무시를 경계해야 합니다.", love: "공정하고 솔직한 관계가 중요합니다.", career: "법, 규정, 분석 분야에서 강합니다.", money: "법적 문제나 계약 분쟁에 주의해야 합니다." },
];

// --- Minor Arcana: Pentacles (펜타클) ---
const pentacles: Omit<TarotCardBase, "short">[] = [
  { id: 64, name: "Ace of Pentacles", korean: "펜타클 에이스", suit: "Pentacles", keywords: ["기회", "번영", "새 시작", "물질"], upright: "물질적 풍요와 새로운 기회의 씨앗이 뿌려집니다.", reversedMeaning: "기회를 놓치거나 재정적 시작이 불안정합니다.", love: "안정적인 관계의 시작, 실질적인 행동이 따릅니다.", career: "새로운 직장, 사업 기회가 열립니다.", money: "새로운 수입원, 투자 기회가 옵니다." },
  { id: 65, name: "Two of Pentacles", korean: "펜타클 2", suit: "Pentacles", keywords: ["균형", "적응", "유연성", "멀티태스킹"], upright: "여러 가지를 동시에 다루며 균형을 잡고 있습니다.", reversedMeaning: "균형이 무너지거나 한꺼번에 너무 많은 일을 감당합니다.", love: "바쁜 일상 속 관계 균형이 과제입니다.", career: "멀티태스킹이 필요하지만 우선순위를 정해야 합니다.", money: "수입과 지출의 균형 관리가 핵심입니다." },
  { id: 66, name: "Three of Pentacles", korean: "펜타클 3", suit: "Pentacles", keywords: ["협업", "기술", "팀워크", "인정"], upright: "전문 기술이 인정받고 협업이 성과를 만듭니다.", reversedMeaning: "팀워크 부족, 기술 미숙, 인정받지 못하는 느낌입니다.", love: "함께 무언가를 만들어가는 과정이 관계를 강화합니다.", career: "전문성 발휘, 팀 프로젝트에서 빛납니다.", money: "기술과 노력에 대한 정당한 보상이 옵니다." },
  { id: 67, name: "Four of Pentacles", korean: "펜타클 4", suit: "Pentacles", keywords: ["안정", "집착", "보수", "통제"], upright: "재정적 안정을 지키려 하지만 지나치면 인색해집니다.", reversedMeaning: "돈에 대한 집착을 내려놓거나 과소비가 시작됩니다.", love: "감정적으로 닫혀 있거나 관계를 통제하려 합니다.", career: "안정을 추구하지만 변화를 두려워합니다.", money: "저축과 관리에는 좋지만 너무 움켜쥐면 기회를 놓칩니다." },
  { id: 68, name: "Five of Pentacles", korean: "펜타클 5", suit: "Pentacles", keywords: ["곤궁", "고립", "어려움", "도움"], upright: "재정적 어려움이나 외로움을 겪고 있습니다. 도움을 구하세요.", reversedMeaning: "어려움에서 벗어나기 시작하며 회복의 빛이 보입니다.", love: "관계에서 소외감, 외로움을 느끼고 있습니다.", career: "실직, 수입 감소, 경제적 어려움이 있습니다.", money: "재정적 위기지만 도움을 받을 수 있습니다." },
  { id: 69, name: "Six of Pentacles", korean: "펜타클 6", suit: "Pentacles", keywords: ["나눔", "관대", "균형", "보답"], upright: "베풀거나 베풂을 받는 흐름입니다. 균형 잡힌 교환이 중요합니다.", reversedMeaning: "일방적인 관계, 조건부 도움, 불균형한 교환을 주의해야 합니다.", love: "주고받음의 균형이 관계를 건강하게 합니다.", career: "멘토링, 지원, 협력 관계가 도움이 됩니다.", money: "적절한 나눔이 더 큰 풍요를 가져옵니다." },
  { id: 70, name: "Seven of Pentacles", korean: "펜타클 7", suit: "Pentacles", keywords: ["평가", "인내", "장기 투자", "기다림"], upright: "씨를 뿌리고 결과를 기다리는 시기입니다. 인내가 필요합니다.", reversedMeaning: "노력 대비 결과가 부족하거나 방향 수정이 필요합니다.", love: "관계의 성장을 위해 시간과 노력을 투자해야 합니다.", career: "장기 프로젝트의 중간 점검이 필요합니다.", money: "장기 투자의 결과를 기다리는 시기입니다." },
  { id: 71, name: "Eight of Pentacles", korean: "펜타클 8", suit: "Pentacles", keywords: ["장인정신", "숙련", "노력", "학습"], upright: "꾸준한 노력과 학습이 전문성을 만듭니다.", reversedMeaning: "단조로움, 완벽주의, 동기 상실을 경계해야 합니다.", love: "관계에 정성을 들이면 결과가 따릅니다.", career: "기술 향상, 자격증, 전문성 개발에 좋은 시기입니다.", money: "노력한 만큼 정직하게 수입이 따릅니다." },
  { id: 72, name: "Nine of Pentacles", korean: "펜타클 9", suit: "Pentacles", keywords: ["풍요", "독립", "성취", "여유"], upright: "자신의 노력으로 풍요와 독립을 이룬 상태입니다.", reversedMeaning: "물질에 의존하거나 혼자만의 풍요가 외로울 수 있습니다.", love: "독립적이고 자기 충족적인 관계가 가능합니다.", career: "전문가로서 독립적 성과를 이루고 있습니다.", money: "재정적 자유와 여유가 생깁니다." },
  { id: 73, name: "Ten of Pentacles", korean: "펜타클 10", suit: "Pentacles", keywords: ["유산", "영속", "가족", "부"], upright: "세대를 잇는 풍요, 가족의 안정, 장기적 부를 나타냅니다.", reversedMeaning: "상속 분쟁, 가족 갈등, 재정적 불안정이 있을 수 있습니다.", love: "가족 중심의 안정적 관계, 결혼이 연결됩니다.", career: "회사의 장기적 안정, 가업 승계가 관련됩니다.", money: "대규모 자산, 부동산, 장기적 부가 형성됩니다." },
  { id: 74, name: "Page of Pentacles", korean: "펜타클 시종", suit: "Pentacles", keywords: ["학습", "기회", "성실", "계획"], upright: "새로운 학습이나 재정적 기회에 성실하게 접근합니다.", reversedMeaning: "게으름, 기회 놓침, 비현실적인 계획을 주의해야 합니다.", love: "천천히 진지하게 다가오는 관계입니다.", career: "인턴, 수습, 새로운 기술 학습에 적합합니다.", money: "작은 투자부터 차근차근 시작하면 좋습니다." },
  { id: 75, name: "Knight of Pentacles", korean: "펜타클 기사", suit: "Pentacles", keywords: ["꾸준함", "책임", "인내", "실용"], upright: "꾸준하고 책임감 있게 목표를 향해 나아갑니다.", reversedMeaning: "지루함, 고집, 변화에 대한 저항을 주의해야 합니다.", love: "안정적이지만 때로 지루할 수 있는 관계입니다.", career: "꾸준한 실행이 신뢰와 성과를 만듭니다.", money: "보수적이지만 확실한 재테크가 유리합니다." },
  { id: 76, name: "Queen of Pentacles", korean: "펜타클 여왕", suit: "Pentacles", keywords: ["풍요", "실용", "돌봄", "안정"], upright: "실용적 지혜와 따뜻한 돌봄으로 풍요를 만듭니다.", reversedMeaning: "일-가정 불균형, 물질적 집착을 주의해야 합니다.", love: "따뜻하고 안정적인 사랑을 제공합니다.", career: "실무 능력, 관리 역량이 인정받습니다.", money: "현명한 가계 관리로 풍요가 유지됩니다." },
  { id: 77, name: "King of Pentacles", korean: "펜타클 왕", suit: "Pentacles", keywords: ["부", "사업", "안정", "성공"], upright: "물질적 성공과 안정을 이룬 상태입니다. 경영 능력이 뛰어납니다.", reversedMeaning: "탐욕, 물질 만능주의, 비윤리적 사업을 경계해야 합니다.", love: "물질적 안정을 기반으로 한 관계를 추구합니다.", career: "사업 성공, 재정적 리더십이 빛납니다.", money: "큰 자산을 관리하고 불리는 능력이 있습니다." },
];

export const tarotCards: TarotCardBase[] = [
  ...majorArcana,
  ...wands,
  ...cups,
  ...swords,
  ...pentacles,
].map((card, idx) => ({
  ...card,
  short: idx < 10 ? `0${idx}` : `${idx}`,
}));
