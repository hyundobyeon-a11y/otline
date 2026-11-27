// 옷라인 앱 데이터. 화면, 그림, 3D 가 모두 이 id 를 씀 (DESIGN.md 참고)
// 가격은 "옷라인 표준가" 예시. 바지 기장 12,000원만 2023년 서울 수선집 기사 근거, 안감 교체 50,000원은 수선업 기사(5만~8만원) 하단

export const CATEGORIES = [
  { id: 'pants',  name: '바지',     subs: ['청바지', '슬랙스', '면바지', '반바지', '트레이닝'], fit3d: true },
  { id: 'skirt',  name: '치마',     subs: ['플리츠', 'H라인', 'A라인', '롱스커트'] },
  { id: 'tee',    name: '티셔츠',   subs: ['반팔', '긴팔', '맨투맨', '후드'] },
  { id: 'shirt',  name: '셔츠',     subs: ['드레스 셔츠', '캐주얼 셔츠', '블라우스'] },
  { id: 'dress',  name: '원피스',   subs: ['셔츠 원피스', '슬립 원피스', '니트 원피스'] },
  { id: 'jacket', name: '재킷/코트', subs: ['블레이저', '코트', '점퍼', '가죽 재킷'] },
];

// 실측 칸. 단면 = 옷을 펼쳐 잰 한쪽 폭(둘레의 절반). 단위 cm
export const FIELDS = {
  len:     { label: '총장',       hint: '허리(어깨) 끝에서 밑단까지' },
  waistH:  { label: '허리단면',   hint: '허리 밴드를 펼쳐 잰 폭' },
  hipH:    { label: '엉덩이단면', hint: '밑위 끝 높이의 가로 폭' },
  thighH:  { label: '허벅지단면', hint: '가랑이 바로 아래 한쪽 다리 폭' },
  rise:    { label: '밑위',       hint: '허리 위에서 가랑이 이음새까지' },
  hemH:    { label: '밑단단면',   hint: '밑단 끝 한쪽 폭' },
  shoulder:{ label: '어깨너비',   hint: '어깨 솔기 끝에서 끝까지' },
  chestH:  { label: '가슴단면',   hint: '겨드랑이 아래 1cm 가로 폭' },
  sleeve:  { label: '소매길이',   hint: '어깨 솔기에서 소매 끝까지' },
};
export const CAT_FIELDS = {
  pants:  ['len', 'waistH', 'hipH', 'thighH', 'rise', 'hemH'],
  skirt:  ['len', 'waistH', 'hipH', 'hemH'],
  tee:    ['len', 'shoulder', 'chestH', 'sleeve'],
  shirt:  ['len', 'shoulder', 'chestH', 'sleeve'],
  dress:  ['len', 'shoulder', 'chestH', 'waistH'],
  jacket: ['len', 'shoulder', 'chestH', 'sleeve'],
};
// 성별별 예시 실측 (입력칸 기본값)
export const SAMPLE_MEASURE = {
  M: { pants: { len: 115, waistH: 42, hipH: 50, thighH: 30, rise: 33, hemH: 21 },
       skirt: { len: 60, waistH: 38, hipH: 48, hemH: 52 },
       tee: { len: 72, shoulder: 50, chestH: 56, sleeve: 22 },
       shirt: { len: 78, shoulder: 47, chestH: 56, sleeve: 66 },
       dress: { len: 110, shoulder: 40, chestH: 48, waistH: 42 },
       jacket: { len: 76, shoulder: 47, chestH: 56, sleeve: 65 } },
  F: { pants: { len: 108, waistH: 36, hipH: 46, thighH: 26, rise: 30, hemH: 17 },
       skirt: { len: 72, waistH: 34, hipH: 46, hemH: 54 },
       tee: { len: 62, shoulder: 42, chestH: 48, sleeve: 19 },
       shirt: { len: 68, shoulder: 39, chestH: 48, sleeve: 59 },
       dress: { len: 112, shoulder: 37, chestH: 44, waistH: 36 },
       jacket: { len: 70, shoulder: 40, chestH: 50, sleeve: 59 } },
};

// 수선 항목. group: fit(핏, 사이즈 수선) / repair(기타 수선, 손상 복원)
// changes: 이 항목이 바꾸는 실측 칸. preview: AI 핏 단계에서 쓰는 미리보기 종류
export const ITEMS = {
  pants: [
    { id: 'hem',      group: 'fit', name: '기장 줄임',       price: 12000, changes: ['len'],    preview: '3d' },
    { id: 'hemW',     group: 'fit', name: '밑단 통 줄임',     price: 10000, changes: ['hemH'],   preview: '3d' },
    { id: 'taper',    group: 'fit', name: '통 줄임 (허벅지부터)', price: 15000, changes: ['thighH', 'hemH'], preview: '3d' },
    { id: 'waistIn',  group: 'fit', name: '허리 줄임',       price: 15000, changes: ['waistH'], preview: '3d' },
    { id: 'waistOut', group: 'fit', name: '허리 늘림',       price: 18000, changes: ['waistH'], preview: '3d' },
    { id: 'zipper',   group: 'repair', name: '지퍼 교체',     price: 12000 },
    { id: 'button',   group: 'repair', name: '단추 달기',     price: 3000 },
    { id: 'hole',     group: 'repair', name: '찢어짐/구멍 수선', price: 8000 },
    { id: 'hemFix',   group: 'repair', name: '밑단 뜯어짐',   price: 5000 },
    { id: 'pocket',   group: 'repair', name: '주머니 수선',   price: 8000 },
  ],
  skirt: [
    { id: 'hem',     group: 'fit', name: '기장 줄임', price: 12000, changes: ['len'],    preview: '2d' },
    { id: 'waistIn', group: 'fit', name: '허리 줄임', price: 15000, changes: ['waistH'], preview: '2d' },
    { id: 'sideIn',  group: 'fit', name: '옆선 줄임', price: 12000, changes: ['hipH', 'hemH'], preview: '2d' },
    { id: 'zipper',  group: 'repair', name: '지퍼 교체',   price: 12000 },
    { id: 'hook',    group: 'repair', name: '후크/단추',   price: 3000 },
    { id: 'lining',  group: 'repair', name: '안감 수선',   price: 15000 },
    { id: 'hole',    group: 'repair', name: '찢어짐/구멍 수선', price: 8000 },
  ],
  tee: [
    { id: 'hem',     group: 'fit', name: '총장 줄임',     price: 10000, changes: ['len'],    preview: '2d' },
    { id: 'sleeve',  group: 'fit', name: '소매 기장 줄임', price: 10000, changes: ['sleeve'], preview: '2d' },
    { id: 'chestIn', group: 'fit', name: '품 줄임 (옆선)', price: 15000, changes: ['chestH'], preview: '2d' },
    { id: 'hole',    group: 'repair', name: '찢어짐/구멍 수선', price: 8000 },
    { id: 'neck',    group: 'repair', name: '목 늘어남 복원', price: 10000 },
    { id: 'seam',    group: 'repair', name: '박음질 터짐',   price: 5000 },
  ],
  shirt: [
    { id: 'sleeve',   group: 'fit', name: '소매 기장 줄임', price: 15000, changes: ['sleeve'],   preview: '2d' },
    { id: 'hem',      group: 'fit', name: '총장 줄임',     price: 12000, changes: ['len'],      preview: '2d' },
    { id: 'chestIn',  group: 'fit', name: '품 줄임',       price: 15000, changes: ['chestH'],   preview: '2d' },
    { id: 'shoulder', group: 'fit', name: '어깨 줄임',     price: 25000, changes: ['shoulder'], preview: '2d' },
    { id: 'button',   group: 'repair', name: '단추 달기',   price: 3000 },
    { id: 'collar',   group: 'repair', name: '칼라 교체',   price: 20000 },
    { id: 'hole',     group: 'repair', name: '찢어짐/구멍 수선', price: 8000 },
  ],
  dress: [
    { id: 'hem',     group: 'fit', name: '기장 줄임',     price: 15000, changes: ['len'],    preview: '2d' },
    { id: 'waistIn', group: 'fit', name: '허리/품 줄임',   price: 18000, changes: ['waistH', 'chestH'], preview: '2d' },
    { id: 'strap',   group: 'fit', name: '어깨끈 길이',   price: 8000,  changes: ['shoulder'], preview: '2d' },
    { id: 'zipper',  group: 'repair', name: '지퍼 교체',   price: 15000 },
    { id: 'lining',  group: 'repair', name: '안감 수선',   price: 15000 },
    { id: 'hole',    group: 'repair', name: '찢어짐/구멍 수선', price: 8000 },
  ],
  jacket: [
    { id: 'sleeve',    group: 'fit', name: '소매 기장 줄임', price: 20000, changes: ['sleeve'],   preview: '2d' },
    { id: 'hem',       group: 'fit', name: '총장 줄임',     price: 25000, changes: ['len'],      preview: '2d' },
    { id: 'chestIn',   group: 'fit', name: '품 줄임',       price: 25000, changes: ['chestH'],   preview: '2d' },
    { id: 'shoulder',  group: 'fit', name: '어깨 줄임',     price: 35000, changes: ['shoulder'], preview: '2d' },
    { id: 'liningNew', group: 'repair', name: '안감 교체',   price: 50000 },
    { id: 'button',    group: 'repair', name: '단추 교체',   price: 5000 },
    { id: 'zipper',    group: 'repair', name: '지퍼 교체',   price: 18000 },
    { id: 'hole',      group: 'repair', name: '찢어짐/구멍 수선', price: 15000 },
  ],
};

// 손상 부위 (기타 수선 화면에서 옷 그림 위를 누름). garments.js 의 damageMap 이 같은 id 로 그림
export const DAMAGE_ZONES = {
  pants:  [{ id: 'waist', label: '허리 밴드' }, { id: 'fly', label: '앞 지퍼' }, { id: 'pocket', label: '주머니' }, { id: 'thigh', label: '허벅지' }, { id: 'knee', label: '무릎' }, { id: 'hem', label: '밑단' }],
  skirt:  [{ id: 'waist', label: '허리 밴드' }, { id: 'zip', label: '옆/뒤 지퍼' }, { id: 'side', label: '옆선' }, { id: 'hem', label: '밑단' }],
  tee:    [{ id: 'neck', label: '목둘레' }, { id: 'chest', label: '앞판' }, { id: 'sleeve', label: '소매' }, { id: 'side', label: '옆선' }, { id: 'hem', label: '밑단' }],
  shirt:  [{ id: 'collar', label: '칼라' }, { id: 'placket', label: '단추 여밈' }, { id: 'cuff', label: '소매 끝' }, { id: 'chest', label: '앞판' }, { id: 'elbow', label: '팔꿈치' }],
  dress:  [{ id: 'neck', label: '목둘레' }, { id: 'zip', label: '뒤 지퍼' }, { id: 'waist', label: '허리' }, { id: 'side', label: '옆선' }, { id: 'hem', label: '밑단' }],
  jacket: [{ id: 'collar', label: '칼라' }, { id: 'button', label: '단추' }, { id: 'pocket', label: '주머니' }, { id: 'elbow', label: '팔꿈치' }, { id: 'cuff', label: '소매 끝' }, { id: 'lining', label: '안감' }],
};
export const DAMAGE_TYPES = {
  zipper: ['지퍼가 안 잠겨요', '지퍼 손잡이가 빠졌어요', '지퍼 이가 벌어져요', '지퍼 전체를 바꾸고 싶어요'],
  button: ['단추가 떨어졌어요', '단추가 헐거워요', '단추를 다른 걸로 바꾸고 싶어요'],
  hole:   ['찢어졌어요', '구멍이 났어요', '올이 풀렸어요', '해졌어요'],
  default:['뜯어졌어요', '늘어났어요', '얼룩/변색이 있어요', '기타'],
};

// 핏 미리보기 프리셋. 바지 기장은 "밑단이 바닥에서 몇 cm" 로 정하고, 총장 = 밑위 + (다리 안쪽 길이 − 바닥 높이)
// 이름은 한국 수선집에 실제로 주문하는 말(바닥, 발뒤꿈치, 복숭아뼈 기준)로 씀. 원브레이크 같은 말은 주문에 안 씀 (11/27 멘디, 에펨, 어미새, 뽐뿌 확인)
// 복숭아뼈 높이는 키의 4% (키 175cm 면 약 7cm, garments.js Lm.ankle)
export const PANTS_PRESETS = [
  { id: 'floor', name: '바닥에 닿게',   floor: 1,  desc: '밑단이 신발 위에 살짝 접힘' },
  { id: 'heel',  name: '발뒤꿈치까지', floor: 3,  desc: '정장 바지 기본' },
  { id: 'mid',   name: '복숭아뼈 중간', floor: 7,  desc: '캐주얼 기본' },
  { id: 'above', name: '복숭아뼈 위',  floor: 10, desc: '복숭아뼈가 다 보임' },
];
// 바지 종류별 추천 기장 (AI 추천 문장과 기본값)
export const SUB_PRESET = { '슬랙스': 'heel', '청바지': 'mid', '면바지': 'mid', '트레이닝': 'floor', '반바지': 'mid', '기타': 'mid' };
export const pantsLenAtFloor = (body, m, floor) => Math.round((m.rise + (body.inseam - floor)) * 2) / 2;

// 2D 미리보기 프리셋 (치마, 상의 기장, 소매). value = 기준점에서의 길이(cm) 를 계산하는 함수
export const FIT2D_PRESETS = {
  skirt_hem:  [{ id: 'mini', name: '무릎 위 10cm' }, { id: 'knee', name: '무릎' }, { id: 'midi', name: '미디 (종아리 중간)' }, { id: 'long', name: '롱 (발목 위)' }],
  dress_hem:  [{ id: 'knee', name: '무릎' }, { id: 'midi', name: '미디' }, { id: 'long', name: '롱' }],
  top_hem:    [{ id: 'crop', name: '크롭 (허리선)' }, { id: 'hip', name: '골반' }, { id: 'mid', name: '엉덩이 중간' }],
  sleeve:     [{ id: 'wristbone', name: '손목뼈' }, { id: 'below', name: '손목 아래 1cm' }, { id: 'hand', name: '손등 덮음' }],
  short_sleeve:[{ id: 'upper', name: '팔 윗부분' }, { id: 'mid', name: '팔꿈치 위 5cm' }, { id: 'elbow', name: '팔꿈치' }],
  width:      [{ id: 'slim', name: '슬림' }, { id: 'regular', name: '레귤러' }, { id: 'loose', name: '루즈' }],
};

// 세부 요청에서 묻는 추가 질문 (SOJO 처럼). when: 이 수선 항목이 있으면 물음. 값 → 추가금
export const OPTIONS = [
  { id: 'hemFinish', when: ['hem'], cats: ['pants'], q: '밑단 마감은 어떻게 할까요?',
    choices: [{ v: 'basic', t: '기본 밑단', add: 0 }, { v: 'original', t: '원래 밑단 살리기', sub: '청바지 워싱 밑단 그대로', add: 5000 }, { v: 'cuff', t: '접어 올림 (카브라)', add: 3000 }, { v: 'hand', t: '손바느질 마감', sub: '겉에 바늘땀이 안 보여요', add: 3000 }] },
  { id: 'lining', when: ['hem', 'waistIn', 'sideIn', 'chestIn', 'sleeve', 'shoulder'], cats: ['pants', 'skirt', 'dress', 'jacket'], q: '옷에 안감이 있나요?',
    choices: [{ v: 'no', t: '없어요', add: 0 }, { v: 'yes', t: '있어요', sub: '안감도 같이 수선해요', add: 5000 }] },
  { id: 'detail', when: ['hem', 'sleeve'], cats: ['skirt', 'dress', 'shirt', 'jacket', 'pants'], q: '밑단이나 소매 끝에 장식이 있나요?',
    choices: [{ v: 'no', t: '없어요', add: 0 }, { v: 'yes', t: '있어요', sub: '트임, 지퍼, 레이스, 단추 등', add: 5000 }] },
];

export const METHODS = [
  { id: 'self',  icon: 'ruler',     t: '치수를 직접 입력할게요',       d: '입력한 실측 치수를 그대로 수선사에게 전달해요' },
  { id: 'ref',   icon: 'shirt',     t: '잘 맞는 옷을 같이 보낼게요',    d: '수선사가 그 옷 치수에 맞춰 수선해요' },
  { id: 'pin',   icon: 'pin',       t: '옷핀으로 표시해서 보낼게요',    d: '원하는 위치에 핀이나 초크로 표시해 주세요' },
];

// 지역. 지도는 map.js 가 x,y(0~1000) 로 그림
export const AREAS = [
  { id: 'anam',     name: '안암동', full: '서울 성북구 안암동', me: { x: 590, y: 560 } },
  { id: 'bomun',    name: '보문동', full: '서울 성북구 보문동', me: { x: 250, y: 860 } },
  { id: 'dongseon', name: '동선동', full: '서울 성북구 동선동', me: { x: 220, y: 230 } },
];

// 가상 수선집 (이름, 별점, 후기 모두 가상). markup = 표준가에 붙는 가게별 추가금(항목당)
// photo = 표지 사진(img/, Unsplash 무료 사진, 실제 그 가게 사진 아님). 없으면 shopHero 가 그림을 그림
// selfDelivery = 수선이 끝난 옷을 가게가 직접 배달함 (옷라인 배송과 따로). fee 배달비 예시, km 배달 거리. 11/27 팀 회의 결정, 표시만
export const SHOPS = [
  { id: 's1', name: '한땀 수선실', x: 640, y: 500, photo: 'img/shop-s1.jpg', years: 22, rating: 4.9, reviews: 128, lead: 1,
    spec: ['pants'], tags: ['경력 22년', '바지 수선 전문', '픽업 가능'], markup: { fit: 1500, repair: 0 },
    hours: [10, 19], closed: [0], pickup: true, today: true, hue: 222, selfDelivery: { fee: 2000, km: 2 },
    intro: '바지 기장, 허리, 통만 20년 넘게 했어요. 원래 밑단 살리기는 하루면 돼요.',
    addr: '성북구 참살이길 (가상)', phone: '0507-1***-2201' },
  { id: 's2', name: '보문 재봉소', x: 360, y: 720, photo: 'img/shop-s2.jpg', years: 15, rating: 4.8, reviews: 94, lead: 2,
    spec: ['shirt', 'jacket'], tags: ['경력 15년', '셔츠/정장', '픽업 가능'], markup: { fit: 1000, repair: 500 },
    hours: [10, 20], closed: [0], pickup: true, today: true, hue: 160,
    intro: '셔츠 소매, 정장 재킷 어깨처럼 손이 많이 가는 수선을 주로 해요.',
    addr: '성북구 보문로 (가상)', phone: '0507-1***-4410' },
  { id: 's3', name: '골무 리폼하우스', x: 770, y: 560, photo: 'img/shop-s3.jpg', years: 9, rating: 4.7, reviews: 56, lead: 3,
    spec: ['dress', 'skirt'], tags: ['리폼', '원피스/니트', '사진 상담'], markup: { fit: 3000, repair: 1000 },
    hours: [11, 20], closed: [0, 1], pickup: false, today: false, hue: 330,
    intro: '원피스 기장, 니트 수선, 리폼까지. 사진 보내주시면 먼저 상담해 드려요.',
    addr: '성북구 고려대로 (가상)', phone: '0507-1***-7713' },
  { id: 's4', name: '종암 가죽공방', x: 900, y: 560, photo: 'img/shop-s4.jpg', years: 30, rating: 4.6, reviews: 41, lead: 4,
    spec: ['jacket'], tags: ['경력 30년', '가죽/코트', '안감 교체'], markup: { fit: 5000, repair: 3000 },
    hours: [9, 18], closed: [0], pickup: true, today: false, hue: 28,
    intro: '가죽 재킷, 코트 안감 교체, 명품 수선을 해요. 견적은 옷 보고 확정돼요.',
    addr: '성북구 종암로 (가상)', phone: '0507-1***-3090' },
  { id: 's5', name: '실타래 수선', x: 450, y: 470, photo: 'img/shop-s5.jpg', years: 12, rating: 4.5, reviews: 203, lead: 2,
    spec: ['pants', 'tee'], tags: ['가성비', '청바지', '당일 가능'], markup: { fit: -1000, repair: -500 },
    hours: [10, 21], closed: [], pickup: true, today: true, hue: 200,
    intro: '청바지 기장, 티셔츠 줄임 같은 기본 수선을 빠르고 싸게 해요.',
    addr: '성북구 인촌로 (가상)', phone: '0507-1***-5528' },
  { id: 's6', name: '안암 세탁수선', x: 640, y: 780, photo: 'img/shop-s6.jpg', years: 18, rating: 4.3, reviews: 77, lead: 3,
    spec: ['shirt', 'tee'], tags: ['세탁 같이', '셔츠', '픽업 가능'], markup: { fit: 0, repair: 0 },
    hours: [8, 20], closed: [0], pickup: true, today: false, hue: 190, selfDelivery: { fee: 0, km: 1.5 },
    intro: '세탁소와 같이 해요. 셔츠는 세탁, 다림질까지 한 번에 맡기실 수 있어요.',
    addr: '성북구 안암로 (가상)', phone: '0507-1***-8862' },
  { id: 's7', name: '바늘귀 수선실', x: 540, y: 690, photo: 'img/shop-s7.jpg', years: 6, rating: 4.8, reviews: 3, lead: 1, isNew: true,
    spec: ['pants', 'skirt'], tags: ['이번 주 입점', '첫 주문 10% 할인', '픽업 가능'], markup: { fit: 0, repair: 0 },
    hours: [10, 19], closed: [0], pickup: true, today: true, hue: 265, newDiscount: 0.1,
    intro: '디자이너 브랜드 샘플실에서 6년 일하다 문을 열었어요.',
    addr: '성북구 개운사길 (가상)', phone: '0507-1***-1047' },
];

// 가게별 후기 (가상). cat: 의류, tags: 좋았던 점
export const REVIEWS = {
  s1: [
    { who: '민*', star: 5, date: '2026-11-18', cat: 'pants', tags: ['요청한 치수로 정확히', '깔끔한 마감'], text: '슬랙스 발뒤꿈치까지 오게 부탁드렸는데 딱 원하던 길이예요. 다음 날 바로 받았어요.', photo: true },
    { who: '서*', star: 5, date: '2026-11-12', cat: 'pants', tags: ['빠른 수선'], text: '청바지 원래 밑단 살리기 했는데 티가 하나도 안 나요.', photo: true },
    { who: '정*', star: 4, date: '2026-11-03', cat: 'pants', tags: ['친절한 응대'], text: '허리 2cm 줄였어요. 픽업 시간이 조금 늦었지만 결과는 만족해요.' },
  ],
  s2: [
    { who: '하*', star: 5, date: '2026-11-15', cat: 'shirt', tags: ['요청한 치수로 정확히'], text: '셔츠 소매 2cm, 커프스 그대로 살려주셨어요.', photo: true },
    { who: '윤*', star: 5, date: '2026-11-02', cat: 'jacket', tags: ['깔끔한 마감'], text: '블레이저 품 줄였는데 라인이 예쁘게 나왔어요.' },
  ],
  s3: [{ who: '김*', star: 5, date: '2026-11-10', cat: 'dress', tags: ['친절한 응대'], text: '사진으로 먼저 상담해 주셔서 좋았어요. 미디 길이로 줄였어요.', photo: true }],
  s4: [{ who: '이*', star: 5, date: '2026-10-28', cat: 'jacket', tags: ['깔끔한 마감'], text: '코트 안감 교체, 새 옷 같아요. 가격은 좀 있어요.' }],
  s5: [
    { who: '박*', star: 4, date: '2026-11-19', cat: 'pants', tags: ['합리적인 가격', '빠른 수선'], text: '청바지 기장 당일에 해주셨어요.' },
    { who: '최*', star: 5, date: '2026-11-08', cat: 'tee', tags: ['합리적인 가격'], text: '맨투맨 총장 줄임. 싸고 빨라요.' },
  ],
  s6: [{ who: '조*', star: 4, date: '2026-11-11', cat: 'shirt', tags: ['친절한 응대'], text: '세탁이랑 같이 맡겨서 편했어요.' }],
  s7: [
    { who: '강*', star: 5, date: '2026-11-21', cat: 'pants', tags: ['요청한 치수로 정확히', '깔끔한 마감'], text: '새로 생긴 곳인데 마감이 정말 깔끔해요.', photo: true },
    { who: '임*', star: 5, date: '2026-11-20', cat: 'skirt', tags: ['친절한 응대'], text: '치마 허리 줄였어요. 설명을 자세히 해주셨어요.' },
  ],
};

export const REVIEW_TAGS = ['요청한 치수로 정확히', '깔끔한 마감', '친절한 응대', '빠른 수선', '합리적인 가격', '꼼꼼한 상담'];

export const ORDER_STEPS = [
  { id: 'requested', t: '예약 요청',  d: '수선사가 요청서를 확인하고 있어요' },
  { id: 'confirmed', t: '예약 확정',  d: '수선사가 예약을 받았어요' },
  { id: 'collected', t: '수거 완료',  d: '옷이 수선집에 도착했어요' },
  { id: 'working',   t: '수선 중',    d: '수선사가 작업하고 있어요' },
  { id: 'done',      t: '수선 완료',  d: '수선이 끝났어요' },
  { id: 'shipping',  t: '배송 중',    d: '옷이 돌아가고 있어요' },
  { id: 'received',  t: '수령 완료',  d: '옷을 받았어요' },
];

export const FEES = { pickup: 3000, ship: { normal: 3000, fast: 5000 }, bundleRate: 0.05 }; // 가게 직접 배달비는 SHOPS.selfDelivery.fee

// ───────── 의류 정보 추가 (11/27 팀원 시안: 사진, 쇼핑몰 상품 링크, 의류 특성) ─────────
// 의류 특성 칩. by = 의류마다 다른 보기, all = 모든 의류 같음
export const GARMENT_TRAITS = [
  { id: 'fit', label: '기존 핏', by: { pants: ['슬림', '스트레이트', '와이드'], skirt: ['H라인', 'A라인', '플레어'], tee: ['슬림', '레귤러', '오버핏'], shirt: ['슬림', '레귤러', '오버핏'], dress: ['슬림', '레귤러', '루즈'], jacket: ['슬림', '레귤러', '오버핏'] } },
  { id: 'mat', label: '소재', by: { pants: ['데님', '면', '폴리 혼방', '기타'], skirt: ['면', '울', '폴리 혼방', '기타'], tee: ['면', '폴리 혼방', '기타'], shirt: ['면', '린넨', '폴리 혼방', '기타'], dress: ['면', '니트', '폴리 혼방', '기타'], jacket: ['울', '가죽', '폴리 혼방', '기타'] } },
  { id: 'stretch', label: '신축성', all: ['없음', '약간', '높음', '모름'] },
  { id: 'thick', label: '두께', all: ['얇음', '보통', '두꺼움', '모름'] },
];
export const traitChoices = (t, cat) => t.all || t.by[cat] || t.by.pants;
// 상품 링크 흉내: 실제로 쇼핑몰을 읽지 않음. 불러오기를 누르면 의류 종류에 맞는 가상 상품과 사이즈별 실측표가 뜸
export const SAMPLE_PRODUCTS = {
  pants:  { name: '세미 와이드 슬랙스',     traits: { fit: '와이드', mat: '폴리 혼방', stretch: '약간', thick: '보통' } },
  denim:  { name: '와이드 데님 팬츠',       traits: { fit: '와이드', mat: '데님', stretch: '없음', thick: '두꺼움' } },
  skirt:  { name: 'A라인 미디 스커트',      traits: { fit: 'A라인', mat: '면', stretch: '없음', thick: '보통' } },
  tee:    { name: '오버핏 코튼 반팔 티셔츠', traits: { fit: '오버핏', mat: '면', stretch: '약간', thick: '보통' } },
  shirt:  { name: '옥스퍼드 레귤러 셔츠',   traits: { fit: '레귤러', mat: '면', stretch: '없음', thick: '보통' } },
  dress:  { name: '셔츠 롱 원피스',         traits: { fit: '레귤러', mat: '면', stretch: '없음', thick: '얇음' } },
  jacket: { name: '울 싱글 블레이저',       traits: { fit: '레귤러', mat: '울', stretch: '없음', thick: '두꺼움' } },
};
// 사이즈별 실측표: M = SAMPLE_MEASURE, 한 사이즈마다 이만큼 커짐
const SIZE_STEP = { len: 1.5, waistH: 2, hipH: 2, thighH: 1, rise: 0.5, hemH: 0.5, shoulder: 1.5, chestH: 2.5, sleeve: 1 };
export function sizeChart(cat, sex) {
  const base = SAMPLE_MEASURE[sex][cat];
  return ['S', 'M', 'L', 'XL'].map((sz, i) => ({ sz, m: Object.fromEntries(Object.entries(base).map(([f, v]) => [f, Math.round((v + (i - 1) * (SIZE_STEP[f] || 1)) * 2) / 2])) }));
}

export const won = n => (n < 0 ? '−' : '') + Math.abs(Math.round(n)).toLocaleString('ko-KR') + '원';
export const cm = n => (Math.round(n * 2) / 2).toString().replace(/\.0$/, '') + 'cm';
export const catOf = id => CATEGORIES.find(c => c.id === id);
export const shopOf = id => SHOPS.find(s => s.id === id);
export const itemOf = (cat, id) => (ITEMS[cat] || []).find(i => i.id === id);
