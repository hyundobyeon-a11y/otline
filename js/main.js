import { start, jump, current, stackNames } from './router.js';
import { state, save, startDraft, initAfter, resetAll } from './store.js';
import { esc, ic } from './ui.js';
import { logo } from './garments.js';
import './screens/home.js';
import './screens/request.js';
import './screens/shops.js';
import './screens/orders.js';
import './screens/my.js';

try { const t = localStorage.getItem('otline-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}

// 아이폰 틀(428x900)을 창 높이에 맞춰 비율 그대로 키우고 줄임. 820px 아래(진짜 폰)는 CSS 가 틀을 없앰
function fitDevice() {
  const sideW = innerWidth > 1180 ? 260 + 320 + 96 + 32 : innerWidth > 820 ? 300 + 48 + 32 : 0;
  const z = Math.min(1.25, (innerHeight - 40) / 900, sideW ? (innerWidth - sideW) / 428 : 9);
  document.documentElement.style.setProperty('--z', Math.max(0.5, z).toFixed(4));
}
fitDevice();
addEventListener('resize', fitDevice);

// iOS 슬라이더: 손잡이 왼쪽만 색을 채움(--p)
const fillRange = r => { const lo = +r.min || 0, hi = +r.max || 100; r.style.setProperty('--p', ((r.value - lo) / (hi - lo || 1)) * 100 + '%'); };
document.addEventListener('input', e => { if (e.target.matches && e.target.matches('input[type=range]')) fillRange(e.target); }, true);
new MutationObserver(() => document.querySelectorAll('#app input[type=range]').forEach(fillRange))
  .observe(document.getElementById('app'), { childList: true, subtree: true });

// 데모용 준비: 화면 목록에서 중간 화면으로 바로 갈 때 필요한 요청서, 예약을 채움
function demoDraft() {
  const ok = state.draft && state.draft.garments.length && state.draft.garments[0].cat && state.draft.garments[0].items.length;
  if (ok) return;
  const g = startDraft({ cat: 'pants', items: ['hem', 'hemW'] });
  g.sub = '슬랙스'; g.name = '회색 울 슬랙스'; initAfter(g); g.options = { hemFinish: 'hand', lining: 'no' }; g.note = '기존 밑단 마감과 실루엣은 그대로 유지해 주세요';
  save();
}
function demoBooking() { demoDraft(); if (!state.booking) { state.booking = { shopId: 's1', dropoff: 'pickup', date: null, slot: null, address: '서울 성북구 개운사길 50 (가상)', memo: '', receive: 'delivery', ship: 'normal', pay: 'card', agree: false }; save(); } }
const activeId = () => (state.orders.find(o => o.status < 6 && !o.canceled) || state.orders[0]).id;
const doneId = () => (state.orders.find(o => o.status >= 6) || state.orders[0]).id;
const REQ = ['home', 'req-cat', 'req-items', 'req-measure', 'req-fit', 'req-detail', 'req-sheet'];

const NAV = [
  { h: '둘러보기', items: [
    { id: 'home', t: '홈 (지도, 주변 수선집)' }, { id: 'search', t: '검색' }, { id: 'alerts', t: '알림' }, { id: 'prices', t: '수선 가격표' }] },
  { h: '수선 맡기기', items: [
    { id: 'req-cat', n: '1', t: '의류 선택', prep: demoDraft, parents: REQ.slice(0, 1) },
    { id: 'req-items', n: '1', t: '수선 항목', prep: demoDraft, parents: REQ.slice(0, 2) },
    { id: 'req-measure', n: '2', t: '실측 사이즈', prep: demoDraft, parents: REQ.slice(0, 3) },
    { id: 'req-info', n: '2', t: '의류 정보 추가', prep: demoDraft, parents: REQ.slice(0, 4) },
    { id: 'req-fit', n: '3', t: 'AI Fit Assistant', prep: demoDraft, parents: REQ.slice(0, 4) },
    { id: 'req-detail', n: '4', t: '세부 요청사항', prep: demoDraft, parents: REQ.slice(0, 5) },
    { id: 'req-sheet', n: '5', t: '수선 요청서', prep: demoDraft, parents: REQ.slice(0, 6) }] },
  { h: '수선집 고르기', items: [
    { id: 'compare', t: '수선집 비교', prep: demoDraft, parents: REQ },
    { id: 'shop', p: 's1', t: '수선집 상세', prep: demoDraft, parents: [...REQ, 'compare'] },
    { id: 'book', t: '예약, 수령 방법', prep: demoBooking, parents: [...REQ, 'compare', { name: 'shop', param: 's1' }] }] },
  { h: '맡긴 뒤', items: [
    { id: 'orders', t: '요청 내역' },
    { id: 'order', p: activeId, t: '수선 진행 상황', parents: ['orders'] },
    { id: 'chat', p: activeId, t: '수선사 채팅', parents: ['orders'] },
    { id: 'review', p: doneId, t: '리뷰 쓰기', parents: ['orders'] },
    { id: 'claim', p: doneId, t: '재수선, 환불 요청', parents: ['orders'] }] },
  { h: '내 정보', items: [
    { id: 'likes', t: '좋아요' }, { id: 'my', t: 'MY 옷라인' }, { id: 'closet', t: '내 옷장', parents: ['my'] }] },
];

const EX = {
  home: ['탭 1', '홈: 지도와 주변 수선집', '거주 위치 기준으로 지도에 입점 수선집을 보여줌. 위의 큰 버튼으로 수선 맡기기를 시작함.',
    ['수선집 이름과 주소는 카카오맵에 있는 실제 가게(11/27). 사진은 카카오맵에 올라온 그 가게 사진(간판으로 확인, 미미옷수선만 그림). 별점, 후기, 가격, 소개는 예시라 홈, 검색, 비교, 상세에 안내 문구를 붙임', '지도 핀을 누르면 가게 카드가 뜸, 끌어서 움직이고 확대 가능', '거리순, 별점순, 리뷰 많은 순 정렬과 픽업, 오늘 접수 필터', '진행 중인 수선이 있으면 홈 위쪽에 진행 막대로 보임'],
    ['발견 탭', '발견 탭은 빼고, 쏠림을 줄이는 역할은 홈의 "이번 주 새로 들어온 수선집" 칸으로 옮김']],
  search: ['홈', '검색', '수선집 이름과 수선 항목을 같이 찾음. 항목을 누르면 그 항목이 골라진 채로 요청서가 시작됨.', []],
  prices: ['홈, MY, 수선 항목', '수선 가격표', '의류별 옷라인 표준가. 사례 B 모두의수선 공식 가격표(modo.io.kr, 11/27 확인)를 그대로 가져옴. 항목을 누르면 그 항목으로 요청서가 시작됨.',
    ['바지와 청바지 값이 다름(기장 8,000 / 13,000), 코트 총장은 40,000', '그 표에 없는 항목(허리 늘림, 안감, 목 늘어남, 칼라, 어깨끈, 재킷 어깨)은 "옷라인 예시 가격"으로 표시', '추가 옵션(원래 밑단 살리기, 카브라)도 같은 표에서 차이를 계산함'],
    ['사례 B: 모두의수선', '수선 항목, 치수 입력, 사진 접수, 방문 수거, 결제, 배송 현황은 옷라인에 이미 있음. 공개 가격표만 없어서 이번에 넣음']],
  alerts: ['홈', '알림', '예약 확정, 수선 시작, 진행 사진, 리뷰 요청이 쌓임. 누르면 해당 화면으로 감.', []],
  'req-cat': ['수선 맡기기 STEP 1', '의류 선택', '의류 6종과 세부 종류를 고름. 내 옷장에 있는 옷을 고르면 지난번 치수가 그대로 들어감.',
    ['진행 막대는 줄자 눈금 모양', '요청서에서 의류를 추가하면 이 화면으로 다시 와서 두 번째 옷을 만듦'],
    ['의류 범위', '고르는 건 6종(바지, 치마, 티셔츠, 셔츠, 원피스, 재킷/코트), 3D 미리보기는 바지만. 나머지는 실측 입력과 2D 그림으로 처리']],
  'req-items': ['수선 맡기기 STEP 1', '수선 항목', '핏 수선과 기타 수선 두 묶음으로 나눔. 기타 수선만 고르면 실측과 AI 핏을 건너뛰고 손상 부위 화면으로 바로 감.',
    ['아래 막대에 표준가 합계가 바로 바뀜'],
    ['Repaired / Altered', 'SOJO의 두 갈래를 "핏, 사이즈 수선"과 "기타 수선, 손상 복원"으로 옮김. 기타 수선은 AI assistant 없이 바로 요청 사항으로 감(팀원 제안 그대로)']],
  'req-measure': ['수선 맡기기 STEP 2', '실측 사이즈', '내 신체 정보는 한 번 저장하면 계속 씀. 칸을 누르면 옷 그림에서 그 치수선이 노랗게 표시됨.',
    ['수선할 칸은 미리 노랗게 표시', '"재는 법"을 누르면 칸마다 재는 위치 설명', '옷 그림 위 "의류 정보 추가하기"에서 사진, 상품 링크, 옷 특성을 넣음. 넣고 나면 "의류 정보 적용됨"으로 바뀜'], null],
  'req-info': ['수선 맡기기 STEP 2', '의류 정보 추가', 'AI Fit Assistant가 실제 옷에 가깝게 보여주도록 옷 사진 3장(정면, 후면, 착용), 쇼핑몰 상품 링크, 옷 특성(핏, 소재, 신축성, 두께)을 받음. 적용하면 AI 핏 화면과 요청서에 같이 나옴.',
    ['상품 링크는 흉내만 냄: "상품 정보 불러오기"를 누르면 예시 상품과 사이즈별 실측표가 뜨고, 산 사이즈를 고르고 적용하면 실측 칸이 그 숫자로 바뀜', '옷 특성은 상품 정보로 미리 골라짐. 3D 바지 모양은 아직 안 바뀜', '"예시 사진으로 채우기", "예시 링크 넣기"는 발표용 데모 버튼'],
    ['링크로 실측 자동 입력', '쇼핑몰마다 상세 페이지 모양이 달라 실제로 읽어오기는 어려움. 팀에서 더 정할 부분이라 프로토타입은 흐름만 보여줌(11/27 팀원 시안)']],
  'req-fit': ['수선 맡기기 STEP 3', 'AI Fit Assistant', '바지는 3D Before/After(MakeHuman 사람, 바지 메시), 나머지 의류는 2D 그림. 프리셋과 줄자 슬라이더로 정하면 요청서 숫자가 같이 바뀜.',
    ['바지: 바닥에 닿게, 발뒤꿈치까지, 복숭아뼈 중간, 복숭아뼈 위', '키와 다리 안쪽 길이로 추천 핏과 총장을 계산', '정면, 옆, 뒤, 밑단 확대, 드래그로 돌려보기'],
    ['의류마다 항목이 달라지는 문제', '수선 항목을 고르면 그 항목에 맞는 프리셋과 슬라이더만 자동으로 나옴. 화면을 의류별로 따로 만들 필요가 없음']],
  'req-detail': ['수선 맡기기 STEP 4', '세부 요청사항', '측정 방법 3가지, 밑단 마감과 안감 같은 추가 질문(추가금 표시), 사진 3장, 요청사항.',
    ['측정 방법은 iSeam, SOJO 마지막 단계를 참고', '추가 질문은 SOJO의 "unique hem", "lining" 질문을 참고'],
    ['사진 첨부 필수 여부', '기타 수선은 필수(사진 없으면 견적 불가), 핏 수선은 선택. 데모용 예시 사진 버튼 있음']],
  'req-sheet': ['수선 맡기기 STEP 5', '수선 요청서', '옷 안쪽 케어 라벨 모양의 요청서. 부위별 기존, 수선 후, 변경량과 측정 방법, 옵션, 사진 수를 정리함.',
    ['의류를 추가하면 2벌부터 5% 묶음 할인', '책갈피 버튼으로 저장하면 좋아요 탭에서 이어서 만듦'],
    ['기본가 설정', '옷라인 표준가 + 수선집별 추가금 구조. 표준가는 모두의수선 공식 가격표(11/27)를 그대로 씀. 바지와 청바지 값이 다르고, 기장과 밑단 통을 같이 하면 묶음 값']],
  compare: ['수선집 고르기', '수선집 비교', '요청서 요약을 위에 두고, 지도 핀에 수선집별 최종 금액을 띄움. 추천순은 별점, 거리, 가격, 전문 분야 점수로 정함.',
    ['추천 이유를 태그로 보여줌(바지 수선 전문, 가장 가까움, 가장 저렴 등)', '단골 수선집은 이름 검색으로 찾음'],
    ['추천 3곳 + 검색', '팀원 제안 그대로. 수선집 비교 화면에도 지도를 넣음']],
  shop: ['수선집 고르기', '수선집 상세', '수선사 경력, 가격표(표준가 대비 가게 추가금), 작업 사례, 리뷰. 전화번호는 안심번호로만 보여줌.',
    ['탭을 누르면 해당 칸으로 스크롤, 스크롤하면 탭이 따라 바뀜', '리뷰는 사진 리뷰, 의류별로 거름', '수선사가 직접 배달하는 곳(래미안옷수선, 옥화네옷수선. 예시)은 "가게 직접 배달" 태그와 받는 방법 줄에 배달 거리, 배달비를 보여줌'], ['상세 페이지 버튼', '뒤로가기, 수선 맡기기 두 개(팀원 제안 그대로)']],
  book: ['수선집 고르기', '예약, 수령 방법', '맡기는 방법(방문, 픽업)과 받는 방법(매장, 배송)을 고름. 휴무일과 마감된 시간은 못 고르고, 예상 일정이 바로 계산됨.',
    ['안심결제: 옷라인이 돈을 보관했다가 수령 확인 뒤 정산', '2벌 이상이면 픽업비 무료', '배송받기를 고르면 옷라인 배송(일반, 당일)과 가게 직접 배달을 나눠 보여줌. 가게 직접 배달은 그걸 하는 수선집에서만 뜸'],
    ['배송비, 수령 방법', '배송 옵션 4개를 옷라인 일반, 당일 2개로 줄이고, 가게 직접 배달은 표시만 넣음(11/27 팀 회의). 옷라인 배송보다 나은 점이 크지 않으면 뺄 수 있음']],
  'book-done': ['수선집 고르기', '예약 완료', '예약 번호와 일정을 정리함. 맡긴 옷 치수는 내 옷장에 자동 저장돼서 다음에 원클릭 재주문이 됨.', []],
  orders: ['탭 3', '요청 내역', '진행 중, 완료, 취소로 나눠 봄. 완료된 건 리뷰 쓰기, 재수선/환불, 같은 요청서로 다시 맡기기.', []],
  order: ['맡긴 뒤', '수선 진행 상황', '예약 요청부터 수령 완료까지 7단계. 수선 중에는 진행 사진 요청, 채팅, 안심번호를 씀.',
    ['노란 "다음 단계" 버튼으로 수선사 쪽 진행을 넘겨볼 수 있음(데모)', '단계가 넘어갈 때마다 알림과 채팅 메시지가 생김'],
    ['진행 단계', '팀원 6단계 앞에 "예약 요청(수선사 확인 전)"을 하나 더함']],
  chat: ['맡긴 뒤', '수선사 채팅', '수선사와 대화. 연락처를 보내면 가려지고 경고가 뜸.', ['빠른 답장 버튼, 진행 사진 요청하면 사진이 옴'], ['Anti-bypass', '앱 밖 거래를 막는 장치: 채팅 연락처 가림, 안심번호, 안심결제']],
  review: ['맡긴 뒤', '리뷰 쓰기', '별점, 좋았던 점 태그, 요청한 치수대로 됐는지, 전후 사진.', ['"조금 달라요"를 누르면 리뷰 대신 재수선 요청으로 안내'], ['리뷰 페이지', '한 화면으로만 만듦. 리뷰를 쓰면 다음 수선 1,000원 할인(예시)']],
  claim: ['맡긴 뒤', '재수선, 환불 요청', '옷라인이 먼저 받아서 수선집에 전달하는 구조. 요청했던 치수와 받은 치수를 같이 적게 함.', [], ['환불, 재수선', '팀원 제안 그대로 "옷라인을 거쳐" 전달']],
  likes: ['탭 2', '좋아요', '찜한 수선집과 저장한 요청서. 만들다 멈춘 요청서를 이어서 만들 수 있음.', []],
  my: ['탭 4', 'MY 옷라인', '원클릭 재주문(지난 요청서 그대로), 내 옷장, 리뷰, 문의 내역, 테마, 데모 초기화.', [],
    ['Anti-bypass 구현 여부', '묶음 주문 할인, 원클릭 재주문, 안심결제, 안심번호, 채팅 연락처 가림까지 5가지로 넣음']],
  closet: ['MY 옷라인', '내 옷장', '맡긴 옷 치수가 쌓임. 누르면 그 치수로 바로 요청서를 시작함.', []],
};

function renderNav(active) {
  const el = document.getElementById('screenNav'); if (!el) return;
  el.innerHTML = NAV.map(g => `<div class="nav-group"><h4>${g.h}</h4>${g.items.map(it => `<button data-nav="${it.id}" class="${it.id === active ? 'on' : ''}"><span class="n">${it.n || ''}</span>${esc(it.t)}</button>`).join('')}</div>`).join('');
}
function renderExplain(name) {
  const e = EX[name]; const el = document.getElementById('explain'); if (!el || !e) return;
  const [eyebrow, title, desc, bullets, qa] = e;
  el.innerHTML = `<span class="eyebrow">${esc(eyebrow)}</span><h3>${esc(title)}</h3><p>${esc(desc)}</p>
    ${bullets && bullets.length ? `<ul>${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
    ${qa ? `<div class="qa"><b>Question: ${esc(qa[0])}</b>${esc(qa[1])}</div>` : ''}`;
}

document.getElementById('brandLogo').innerHTML = logo(34);
document.getElementById('screenNav').addEventListener('click', e => {
  const b = e.target.closest('[data-nav]'); if (!b) return;
  const it = NAV.flatMap(g => g.items).find(x => x.id === b.dataset.nav);
  it.prep && it.prep();
  const p = typeof it.p === 'function' ? it.p() : it.p;
  const parents = (it.parents || []).map(x => typeof x === 'string' ? x : x);
  jump(it.id, p, parents.length ? parents : []);
});
document.getElementById('resetDemo').addEventListener('click', () => { resetAll(); location.hash = ''; location.reload(); });

start(document.getElementById('app'), entry => { renderNav(entry.name); renderExplain(entry.name); }, p => {
  // 새로고침했을 때 요청서가 필요한 화면이면 데모 요청서를 채움
  const it = NAV.flatMap(g => g.items).find(x => x.id === p.name);
  if (it && it.prep) it.prep();
  if (it && it.parents) return { stack: [...it.parents.map(x => typeof x === 'string' ? { name: x } : x), { name: p.name, param: p.param || (typeof it.p === 'function' ? it.p() : it.p) }] };
  return null;
});
