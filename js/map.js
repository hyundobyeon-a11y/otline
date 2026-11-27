// 안암동(성북구 고려대 일대) 동네 지도 (실제 지도 아님, 길과 역 위치를 단순하게 그린 그림). 좌표는 0~1000, 100 = 약 250m
// 11/27 신촌에서 바꿈: 초기 타깃이 성북구 대학가라서(중간발표 5장)
import { ic } from './ui.js';

let BG = null;
function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// 길: 두께, 경로. 큰길은 이름 표시
const ROADS = [
  { w: 28, name: '보문로', d: 'M -40 900 C 140 830, 330 710, 520 600', lx: 175, ly: 812 },
  { w: 28, name: '고려대로', d: 'M 520 600 C 660 540, 820 500, 1040 470', lx: 815, ly: 488 },
  { w: 26, name: '안암로', d: 'M 505 1040 C 510 880, 515 720, 520 600 C 522 520, 515 430, 500 330', lx: 534, ly: 830, vert: true },
  { w: 22, name: '인촌로', d: 'M 440 -40 C 450 100, 470 220, 500 330', lx: 478, ly: 150, vert: true },
  { w: 16, name: '개운사길', d: 'M 120 190 C 250 255, 380 310, 500 330', lx: 300, ly: 262 },
  { w: 14, name: '참살이길', d: 'M 520 600 C 568 556, 606 502, 640 440', lx: 628, ly: 548 },
  { w: 12, name: '', d: 'M 280 470 C 370 500, 450 540, 520 600' },
  { w: 12, name: '', d: 'M 520 770 C 620 772, 720 782, 860 806' },
  { w: 12, name: '', d: 'M 330 640 C 380 700, 420 780, 440 1040' },
  { w: 10, name: '', d: 'M 660 560 C 680 650, 690 760, 700 1040' },
  { w: 10, name: '', d: 'M 180 420 C 230 440, 260 455, 280 470' },
  { w: 10, name: '', d: 'M 780 520 C 786 600, 790 700, 800 800' },
  { w: 10, name: '', d: 'M 120 560 C 200 590, 260 620, 330 640' },
];
// 6호선(보문, 안암, 고려대) 황토색, 4호선(성신여대입구) 하늘색
const LINE6 = 'M -40 900 C 140 830, 330 710, 520 600 C 660 540, 820 500, 1040 470';
const STATIONS = [
  { x: 190, y: 818, n: '보문역', c: 'var(--map-line6)' }, { x: 520, y: 600, n: '안암역', c: 'var(--map-line6)' },
  { x: 905, y: 488, n: '고려대역', c: 'var(--map-line6)' }, { x: 330, y: 150, n: '성신여대입구역', c: 'var(--map-line4)' },
];
const CAMPUS = [
  { n: '고려대학교', d: 'M 560 432 C 562 330, 575 200, 600 70 L 965 55 L 985 405 C 860 440, 700 450, 560 432 Z', lx: 770, ly: 398 },
  { n: '성신여대', d: 'M 30 30 L 250 20 L 262 120 C 190 142, 100 146, 40 134 Z', lx: 145, ly: 86 },
];
const PARKS = [
  { n: '개운사', d: 'M 225 300 C 275 278, 340 296, 352 348 C 356 398, 285 412, 242 392 C 208 372, 205 322, 225 300 Z', lx: 288, ly: 352 },
  { n: '', d: 'M 600 840 C 650 818, 712 826, 718 874 C 720 914, 646 922, 614 898 C 590 880, 584 852, 600 840 Z' },
];
const WATER = 'M 1060 600 C 940 650, 860 760, 830 1060';
const EXPWY = 'M 1060 640 C 952 690, 884 792, 862 1060';
const DONG = [
  { n: '안암동', x: 640, y: 700 }, { n: '보문동', x: 210, y: 960 }, { n: '동선동', x: 120, y: 300 }, { n: '제기동', x: 930, y: 960 },
];

function background() {
  if (BG) return BG;
  const r = rnd(11);
  let blocks = '';
  // 블록: 격자 칸마다 둥근 사각형 몇 개. 길, 캠퍼스, 공원, 하천 위는 마스크로 지움
  for (let gx = 0; gx < 1000; gx += 62) for (let gy = 0; gy < 1000; gy += 58) {
    const n = 1 + Math.floor(r() * 2);
    for (let k = 0; k < n; k++) {
      const w = 22 + r() * 26, h = 20 + r() * 24, x = gx + 6 + r() * (56 - w), y = gy + 6 + r() * (52 - h);
      blocks += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" rx="4"/>`;
    }
  }
  const roadsEdge = ROADS.map(o => `<path d="${o.d}" stroke-width="${o.w + 5}"/>`).join('');
  const roads = ROADS.map(o => `<path d="${o.d}" stroke-width="${o.w}"/>`).join('');
  const roadMask = ROADS.map(o => `<path d="${o.d}" stroke-width="${o.w + 16}"/>`).join('');
  const labels = ROADS.filter(o => o.name).map(o => `<text x="${o.lx}" y="${o.ly}" ${o.vert ? `transform="rotate(-88 ${o.lx} ${o.ly})"` : ''}>${o.name}</text>`).join('');
  BG = `
  <defs>
    <mask id="roadmask"><rect width="1000" height="1000" fill="#fff"/><g stroke="#000" fill="none" stroke-linecap="round">${roadMask}
      ${CAMPUS.map(c => `<path d="${c.d}" fill="#000" stroke="none"/>`).join('')}${PARKS.map(p => `<path d="${p.d}" fill="#000" stroke="none"/>`).join('')}
      <path d="${WATER}" stroke-width="60"/><path d="${EXPWY}" stroke-width="30"/></g></mask>
  </defs>
  <rect x="-500" y="-500" width="2000" height="2000" fill="var(--map-land)"/>
  <path d="${WATER}" fill="none" stroke="var(--map-water)" stroke-width="30" stroke-linecap="round"/>
  <text x="898" y="790" class="ml water" transform="rotate(-62 898 790)">정릉천</text>
  ${CAMPUS.map(c => `<path d="${c.d}" fill="var(--map-park)"/>`).join('')}
  ${PARKS.map(p => `<path d="${p.d}" fill="var(--map-park)"/>`).join('')}
  <g fill="var(--map-block)" mask="url(#roadmask)">${blocks}</g>
  <path d="${EXPWY}" fill="none" stroke="var(--map-rail)" stroke-width="8" stroke-dasharray="18 8" opacity=".7"/>
  <text x="975" y="742" class="ml road" style="font-size:11px" transform="rotate(-58 975 742)">내부순환로</text>
  <g fill="none" stroke="var(--map-road-edge)" stroke-linecap="round">${roadsEdge}</g>
  <g fill="none" stroke="var(--map-road)" stroke-linecap="round">${roads}</g>
  <path d="${LINE6}" fill="none" stroke="var(--map-line6)" stroke-width="4" opacity=".55"/>
  <g class="ml road">${labels}</g>
  ${CAMPUS.map(c => `<text x="${c.lx}" y="${c.ly}" class="ml campus" text-anchor="middle">${c.n}</text>`).join('')}
  ${PARKS.filter(p => p.n).map(p => `<text x="${p.lx}" y="${p.ly}" class="ml campus" text-anchor="middle" style="font-size:12px">${p.n}</text>`).join('')}
  ${DONG.map(d => `<text x="${d.x}" y="${d.y}" class="ml dong" text-anchor="middle">${d.n}</text>`).join('')}
  ${STATIONS.map(s => `<g transform="translate(${s.x} ${s.y})"><circle r="13" fill="${s.c}"/><circle r="8.5" fill="var(--surface)"/><text y="-22" class="ml stn" text-anchor="middle">${s.n}</text></g>`).join('')}`;
  return BG;
}

const scissors = () => ic('scissors').replace('<svg ', '<svg x="-9" y="-37" width="18" height="18" ').replace('stroke="currentColor"', 'stroke="#fff"').replace('stroke-width="1.75"', 'stroke-width="2.2"');

// el: .mapbox. shops: [{id, x, y, name, label?, isNew}]
export function createMap(el, { shops = [], me, selected = null, onPin, view = 560, showCount = true } = {}) {
  let W = view, H = view * 0.62, cx = me ? me.x : 520, cy = me ? me.y : 520, sel = selected;
  el.innerHTML = `<svg class="map" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="주변 수선집 지도">
      <g class="bg">${background()}</g><g class="me"></g><g class="pins"></g></svg>
    ${showCount ? `<div class="map-count"><i></i><span>옷라인 입점 <span class="cnt">${shops.length}</span>곳</span></div>` : ''}
    <div class="map-ctrl"><button type="button" data-z="in" aria-label="확대">${ic('plus')}</button><button type="button" data-z="out" aria-label="축소">${ic('minus')}</button><button type="button" data-z="me" aria-label="내 위치로">${ic('locate-fixed')}</button></div>`;
  const svg = el.querySelector('svg.map'), gPins = svg.querySelector('.pins'), gMe = svg.querySelector('.me');
  const k = () => W / Math.max(1, el.clientWidth || 350); // 화면 1px 당 지도 단위
  function vb() {
    const ar = (el.clientHeight || 236) / Math.max(1, el.clientWidth || 350); H = W * ar;
    svg.setAttribute('viewBox', `${(cx - W / 2).toFixed(1)} ${(cy - H / 2).toFixed(1)} ${W.toFixed(1)} ${H.toFixed(1)}`);
    const s = k();
    gPins.querySelectorAll('.pin').forEach(p => p.setAttribute('transform', `translate(${p.dataset.x} ${p.dataset.y}) scale(${s})`));
    gMe.querySelectorAll('.medot').forEach(p => p.setAttribute('transform', `translate(${p.dataset.x} ${p.dataset.y}) scale(${s})`));
  }
  function drawPins() {
    gPins.innerHTML = shops.map(s => {
      const on = s.id === sel;
      const label = s.label ? `<g transform="translate(0 -58)"><rect x="${-(s.label.length * 3.9 + 10)}" y="-11" width="${s.label.length * 7.8 + 20}" height="22" rx="11" fill="${on ? 'var(--ink)' : 'var(--surface)'}" stroke="var(--line-strong)" stroke-width="${on ? 0 : 1}"/><text y="4.5" text-anchor="middle" class="ml price" fill="${on ? 'var(--surface)' : 'var(--ink)'}">${s.label}</text></g>` : '';
      const nm = on && !s.label ? `<g transform="translate(0 -56)"><rect x="${-(s.name.length * 6.6 + 12)}" y="-12" width="${s.name.length * 13.2 + 24}" height="24" rx="12" fill="var(--ink)"/><text y="5" text-anchor="middle" class="ml pinname">${s.name}</text></g>` : '';
      return `<g class="pin${on ? ' on' : ''}" data-id="${s.id}" data-x="${s.x}" data-y="${s.y}" tabindex="0" role="button" aria-label="${s.name}">
        <ellipse cx="0" cy="0" rx="9" ry="3.2" fill="rgba(0,0,0,.18)"/>
        <g class="pin-body"><path d="M0 0 C -4 -8, -16 -16, -16 -28 A 16 16 0 1 1 16 -28 C 16 -16, 4 -8, 0 0 Z" fill="${s.isNew ? 'var(--tape)' : 'var(--primary)'}" stroke="var(--surface)" stroke-width="2.5"/>
        ${on ? '<circle cy="-28" r="21" fill="none" stroke="var(--tape)" stroke-width="3"/>' : ''}
        ${scissors()}</g>${label}${nm}</g>`;
    }).join('');
    if (me) gMe.innerHTML = `<g class="medot" data-x="${me.x}" data-y="${me.y}"><circle r="22" fill="var(--indigo)" opacity=".16"><animate attributeName="r" values="12;26;12" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".28;0;.28" dur="2.4s" repeatCount="indefinite"/></circle><circle r="9" fill="var(--surface)"/><circle r="6.5" fill="#3a74f0"/></g>`;
    // 선택한 핀을 맨 위로
    const p = gPins.querySelector('.pin.on'); if (p) gPins.appendChild(p);
    vb();
  }
  // 끌어서 움직이기 + 핀 누르기
  let drag = null;
  svg.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, cx, cy, moved: false }; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    if (drag.moved) { cx = Math.max(0, Math.min(1000, drag.cx - dx * k())); cy = Math.max(0, Math.min(1000, drag.cy - dy * k())); vb(); }
  });
  svg.addEventListener('pointerup', e => {
    const d = drag; drag = null;
    if (d && !d.moved) {
      const t = document.elementFromPoint(e.clientX, e.clientY);
      const pin = t && t.closest && t.closest('.pin');
      if (pin) { select(pin.dataset.id); onPin && onPin(pin.dataset.id); }
      else if (sel) { select(null); onPin && onPin(null); }
    }
  });
  svg.addEventListener('keydown', e => { const pin = e.target.closest('.pin'); if (pin && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(pin.dataset.id); onPin && onPin(pin.dataset.id); } });
  svg.addEventListener('wheel', e => { e.preventDefault(); W = Math.max(260, Math.min(1100, W * (e.deltaY > 0 ? 1.12 : 0.89))); vb(); }, { passive: false });
  el.querySelector('.map-ctrl').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.z === 'in') W = Math.max(260, W * 0.8);
    if (b.dataset.z === 'out') W = Math.min(1100, W * 1.25);
    if (b.dataset.z === 'me' && me) { cx = me.x; cy = me.y; W = view; }
    vb();
  });
  const ro = new ResizeObserver(() => vb()); ro.observe(el);
  function select(id) { sel = id; drawPins(); }
  drawPins();
  return {
    select, setShops(list) { shops = list; const c = el.querySelector('.cnt'); if (c) c.textContent = list.length; drawPins(); },
    center(x, y) { cx = x; cy = y; vb(); }, destroy() { ro.disconnect(); },
  };
}
