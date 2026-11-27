// 옷라인 그림 모음. 전부 SVG 문자열을 돌려줌 (DOM 안 만짐, 바깥 자료 안 씀)
// 색은 app.css 토큰만 씀. 가게 그림(shopHero)만 가게 hue 로 직접 색을 만듦
import { CAT_FIELDS, FIELDS, DAMAGE_ZONES } from './data.js';

let _uid = 0;
const uid = p => `g${p}${++_uid}`;
const f = n => +(+n).toFixed(1);
const fmtCm = v => (Math.round(v * 2) / 2).toString().replace(/\.0$/, '') + 'cm';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const svg = (vb, inner, extra = '', overflow = 'visible') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${extra} style="font-family:inherit;overflow:${overflow}">${inner}</svg>`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const half = n => Math.round(n * 2) / 2;

// 글자 폭 어림 (한글 1em, 숫자 0.6em)
function tw(s, fs) {
  let w = 0;
  for (const ch of String(s)) {
    const c = ch.codePointAt(0);
    if (c >= 0x1100) w += fs * 0.98;
    else if (ch === ' ') w += fs * 0.3;
    else if (/[0-9]/.test(ch)) w += fs * 0.6;
    else if (/[A-Z]/.test(ch)) w += fs * 0.66;
    else w += fs * 0.56;
  }
  return w;
}

// Catmull-Rom → 베지어. 현재 점이 pts[0] 이라고 보고 C 명령만 돌려줌
function crSeg(pts, t = 1) {
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * t, p1[1] + (p2[1] - p0[1]) / 6 * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * t, p2[1] - (p3[1] - p1[1]) / 6 * t];
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}
const M = p => `M${f(p[0])},${f(p[1])}`;
const L = p => ` L${f(p[0])},${f(p[1])}`;
const P = pts => pts.map(p => `${f(p[0])},${f(p[1])}`).join(' ');

// ───────────────────────── 1. 카테고리 아이콘 (48x48) ─────────────────────────
const ICONS = {
  pants: `<path d="M15 6h18l2.2 36h-8.4L24 19l-2.8 23h-8.4z" fill="var(--fabric)" fill-opacity=".35"/>
    <path d="M15 6h18l2.2 36h-8.4L24 19l-2.8 23h-8.4z"/><path d="M14.6 11h18.8"/><path d="M24 11v8"/>
    <path d="M19 11c.4 3-1 5-4.5 5.6M29 11c-.4 3 1 5 4.5 5.6"/>`,
  skirt: `<path d="M17 8h14l1.2 5 6.8 26c-4.6 2.2-10 3-15 3s-10.4-.8-15-3l6.8-26z" fill="var(--fabric)" fill-opacity=".35"/>
    <path d="M17 8h14l1.2 5 6.8 26c-4.6 2.2-10 3-15 3s-10.4-.8-15-3l6.8-26z"/><path d="M15.8 13h16.4"/><path d="M21 13l-2.4 25M27 13l2.4 25" stroke-dasharray="2 2.6"/>`,
  tee: `<path d="M18 7c1.4 2.6 3.4 3.8 6 3.8S28.6 9.6 30 7l9 4.2 3.6 8.4-6.2 2.6-2.6-3.6V41H14.2V18.6l-2.6 3.6-6.2-2.6L9 11.2z" fill="var(--fabric)" fill-opacity=".35"/>
    <path d="M18 7c1.4 2.6 3.4 3.8 6 3.8S28.6 9.6 30 7l9 4.2 3.6 8.4-6.2 2.6-2.6-3.6V41H14.2V18.6l-2.6 3.6-6.2-2.6L9 11.2z"/>
    <path d="M14.2 36.6h19.6" stroke-dasharray="2 2.4"/>`,
  shirt: `<path d="M19 6l-8 3.4-4.4 30 4.6 1.4 3.4-20.4V42h18.8V20.4l3.4 20.4 4.6-1.4-4.4-30L29 6z" fill="var(--fabric)" fill-opacity=".35"/>
    <path d="M19 6l-8 3.4-4.4 30 4.6 1.4 3.4-20.4V42h18.8V20.4l3.4 20.4 4.6-1.4-4.4-30L29 6"/>
    <path d="M19 6l5 6.4L29 6M19 6l-1.6 5.8 4.6 2.6 2-2M29 6l1.6 5.8-4.6 2.6-2-2"/><path d="M24 12.6V42"/>
    <circle cx="24" cy="20" r=".9" fill="currentColor"/><circle cx="24" cy="27" r=".9" fill="currentColor"/><circle cx="24" cy="34" r=".9" fill="currentColor"/>`,
  dress: `<path d="M18.4 5.6v5.2c-1.6 2.6-2 6-1.4 9.6L11 41.4c4.2 1.6 8.4 2.2 13 2.2s8.8-.6 13-2.2l-6-21c.6-3.6.2-7-1.4-9.6V5.6" fill="var(--fabric)" fill-opacity=".35"/>
    <path d="M18.4 5.6v5.2c-1.6 2.6-2 6-1.4 9.6L11 41.4c4.2 1.6 8.4 2.2 13 2.2s8.8-.6 13-2.2l-6-21c.6-3.6.2-7-1.4-9.6V5.6"/>
    <path d="M18.4 10.8c1.8 2.4 3.6 3.4 5.6 3.4s3.8-1 5.6-3.4"/><path d="M17 20.4c2.4.8 4.8 1.2 7 1.2s4.6-.4 7-1.2"/>`,
  jacket: `<path d="M18.6 5.6L10 9.4 6.4 40l4.6 1.2 3.2-19.6V42h19.6V21.6l3.2 19.6 4.6-1.2L38 9.4l-8.6-3.8z" fill="var(--fabric)" fill-opacity=".35"/>
    <path d="M18.6 5.6L10 9.4 6.4 40l4.6 1.2 3.2-19.6V42h19.6V21.6l3.2 19.6 4.6-1.2L38 9.4l-8.6-3.8"/>
    <path d="M18.6 5.6L24 28l5.4-22.4"/><path d="M18.6 5.6l-1.8 5 2.6 2.4-2 2.2L24 28M29.4 5.6l1.8 5-2.6 2.4 2 2.2L24 28"/>
    <circle cx="24" cy="31.6" r="1" fill="currentColor"/><circle cx="24" cy="37" r="1" fill="currentColor"/><path d="M15.8 33.4h4.6M27.6 33.4h4.6"/>`,
};
export function catIcon(cat) {
  return svg('0 0 48 48', ICONS[cat] || ICONS.tee,
    'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="48" height="48" aria-hidden="true"');
}

// ───────────────────────── 2. 평면도 (앞면) ─────────────────────────
// 옷 영역 x 34~206, 오른쪽 214~316 은 라벨 칸, 왼쪽 x 18 은 총장 선
const OUT = 'stroke="var(--ink-2)" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"';
const STITCH = 'fill="none" stroke="var(--fabric-line)" stroke-width="1" stroke-dasharray="3 2.4" stroke-linecap="round"';
const SEAM = 'fill="none" stroke="var(--ink-2)" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"';
const FAB = 'fill="var(--fabric)"';
const FAB2 = 'fill="var(--fabric-2)"';

const FLATS = {
  pants: {
    art: `
      <path d="M64,30 L176,30 C178,52 184,78 186,100 L180,330 L128,330 L121,134 Q120,128 119,134 L112,330 L60,330 L54,100 C56,78 62,52 64,30 Z" ${FAB} ${OUT}/>
      <path d="M64,30 L176,30 L176.7,44 L63.3,44 Z" ${FAB} ${OUT}/>
      <path d="M66,40.6 L174,40.6" ${STITCH}/>
      ${[74, 98, 137, 161].map(x => `<rect x="${x}" y="27" width="5" height="19" rx="1.2" ${FAB} stroke="var(--ink-2)" stroke-width="1.1"/>`).join('')}
      <circle cx="120" cy="37" r="3.2" fill="var(--surface)" stroke="var(--ink-2)" stroke-width="1.1"/>
      <path d="M120,44 L120,129" ${SEAM}/>
      <path d="M128,44 L128,96 Q128,110 120,114" ${STITCH}/>
      <path d="M84,44 Q88,70 56.6,84" ${SEAM}/><path d="M89,44 Q93,76 57.4,91" ${STITCH}/>
      <path d="M156,44 Q152,70 183.4,84" ${SEAM}/><path d="M151,44 Q147,76 182.6,91" ${STITCH}/>
      <path d="M87,138 L86,322" ${STITCH} opacity=".7"/><path d="M153,138 L154,322" ${STITCH} opacity=".7"/>
      <path d="M61,322 L111.6,322 M128.4,322 L179.3,322" ${STITCH}/>`,
    dims: {
      len: { t: 'v', x: 18, y1: 30, y2: 330, ext: [[64, 30], [60, 330]] },
      waistH: { t: 'h', y: 18, x1: 64, x2: 176, ext: [[64, 30], [176, 30]] },
      rise: { t: 'v2', x: 136, y1: 30, y2: 129, ly: 62, ext: [[121, 129]] },
      hipH: { t: 'h', y: 100, x1: 54, x2: 186 },
      thighH: { t: 'h', y: 148, x1: 121.5, x2: 184.7 },
      hemH: { t: 'h', y: 344, x1: 128, x2: 180, ext: [[128, 330], [180, 330]] },
    },
    zones: { waist: [110, 37, 'l'], fly: [124, 84, 'r'], pocket: [66, 70, 'l'], thigh: [154, 170, 'r'], knee: [86, 230, 'l'], hem: [154, 318, 'r'] },
  },
  skirt: {
    art: `
      <path d="M77,48 L163,48 C170,76 176,96 178,112 L202,296 Q120,312 38,296 L62,112 C64,96 70,76 77,48 Z" ${FAB} ${OUT}/>
      <path d="M78,34 L162,34 L163,48 L77,48 Z" ${FAB} ${OUT}/>
      <path d="M80,44.6 L160,44.6" ${STITCH}/>
      <circle cx="152" cy="41" r="2.8" fill="var(--surface)" stroke="var(--ink-2)" stroke-width="1.1"/>
      <path d="M100,48 L102,84 M140,48 L138,84" ${SEAM}/>
      <path d="M165,50 L172.6,96" ${STITCH}/>
      <path d="M44.4,288 Q120,303.4 195.6,288" ${STITCH}/>
      <path d="M96,120 L84,290 M144,120 L156,290" ${STITCH} opacity=".55"/>`,
    dims: {
      len: { t: 'v', x: 18, y1: 34, y2: 304, ext: [[78, 34], [120, 304]] },
      waistH: { t: 'h', y: 22, x1: 78, x2: 162, ext: [[78, 34], [162, 34]] },
      hipH: { t: 'h', y: 112, x1: 62, x2: 178 },
      hemH: { t: 'h', y: 322, x1: 38, x2: 202, ext: [[38, 296], [202, 296]] },
    },
    zones: { waist: [104, 41, 'l'], zip: [168, 72, 'r'], side: [62, 190, 'l'], hem: [150, 300, 'r'] },
  },
  tee: {
    art: `
      <path d="M98,38 L66,50 L30,94 L48,114 L74,102 L74,300 L166,300 L166,102 L192,114 L210,94 L174,50 L142,38 Q120,44 98,38 Z" ${FAB} ${OUT}/>
      <path d="M98,38 Q120,44 142,38 Q120,68 98,38 Z" ${FAB2} ${OUT}/>
      <path d="M102.6,41 Q120,62 137.4,41" ${STITCH}/>
      <path d="M66,50 Q72,78 74,102 M174,50 Q168,78 166,102" ${SEAM}/>
      <path d="M35,89.6 L52.4,108.6 M205,89.6 L187.6,108.6" ${STITCH}/>
      <path d="M74,292 L166,292" ${STITCH}/>`,
    dims: {
      len: { t: 'v', x: 18, y1: 38, y2: 300, ext: [[98, 38], [74, 300]] },
      shoulder: { t: 'h', y: 26, x1: 66, x2: 174, ext: [[66, 50], [174, 50]] },
      sleeve: { t: 'a', x1: 174, y1: 52, x2: 201, y2: 104, ly: 80 },
      chestH: { t: 'h', y: 124, x1: 74, x2: 166 },
    },
    zones: { neck: [120, 50, 'r'], chest: [104, 170, 'l'], sleeve: [196, 92, 'r'], side: [166, 236, 'r'], hem: [100, 296, 'l'] },
  },
  shirt: {
    art: `
      <path d="M100,40 L68,54 C60,110 46,180 34,238 L57,248 C63,198 70,150 76,116 L76,292 C78,310 104,318 120,318 C136,318 162,310 164,292 L164,116 C170,150 177,198 183,248 L206,238 C194,180 180,110 172,54 L140,40 Z" ${FAB} ${OUT}/>
      <path d="M98,32 Q120,26 142,32 L140,42 Q120,38 100,42 Z" ${FAB2} ${OUT}/>
      <path d="M98,32 L89.6,58.6 L116.4,54.4 L120,44 Z" ${FAB} ${OUT}/>
      <path d="M142,32 L150.4,58.6 L123.6,54.4 L120,44 Z" ${FAB} ${OUT}/>
      <path d="M114,56 L114,317 M126,56 L126,317" ${SEAM}/>
      ${[70, 108, 146, 184, 222, 260].map(y => `<circle cx="120" cy="${y}" r="2.8" fill="var(--surface)" stroke="var(--ink-2)" stroke-width="1"/>`).join('')}
      <path d="M84,96 L106,96 L106,119 Q95,125 84,119 Z" fill="none" ${OUT} stroke-width="1.1"/><path d="M84,100.4 L106,100.4" ${STITCH}/>
      <path d="M68,54 Q74,86 76,116 M172,54 Q166,86 164,116" ${SEAM}/>
      <path d="M36.6,224.2 L59.6,234.4 M203.4,224.2 L180.4,234.4" ${SEAM}/>
      <circle cx="47.6" cy="238.6" r="1.8" fill="var(--surface)" stroke="var(--ink-2)" stroke-width="1"/><circle cx="192.4" cy="238.6" r="1.8" fill="var(--surface)" stroke="var(--ink-2)" stroke-width="1"/>
      <path d="M80.4,290 C82.4,304 104,311 120,311 C136,311 157.6,304 159.6,290" ${STITCH}/>`,
    dims: {
      len: { t: 'v', x: 18, y1: 40, y2: 318, ext: [[100, 40], [120, 318]] },
      shoulder: { t: 'h', y: 18, x1: 68, x2: 172, ext: [[68, 54], [172, 54]] },
      chestH: { t: 'h', y: 128, x1: 76, x2: 164 },
      sleeve: { t: 'a', x1: 172, y1: 56, x2: 194.5, y2: 243, ly: 172 },
    },
    zones: { collar: [120, 46, 'r'], placket: [120, 196, 'l'], cuff: [196, 240, 'r'], chest: [95, 110, 'l'], elbow: [186, 150, 'r'] },
  },
  dress: {
    art: `
      <path d="M84,44 L98,44 Q120,96 142,44 L156,44 Q160,80 164,104 Q166,128 158,150 L196,330 Q120,342 44,330 L82,150 Q74,128 76,104 Q80,80 84,44 Z" ${FAB} ${OUT}/>
      <path d="M98,44 Q120,96 142,44 Q120,56 98,44 Z" ${FAB2} ${OUT}/>
      <path d="M101.4,47 Q120,88 138.6,47" ${STITCH}/>
      <path d="M82,150 Q120,154 158,150" ${SEAM}/>
      <path d="M104,150 L106,120 M136,150 L134,120" ${SEAM}/>
      <path d="M100,153 L90,316 M140,153 L150,316 M120,154 L120,330" ${STITCH} opacity=".55"/>
      <path d="M48.6,322 Q120,333.4 191.4,322" ${STITCH}/>`,
    dims: {
      len: { t: 'v', x: 18, y1: 44, y2: 336, ext: [[84, 44], [120, 336]] },
      shoulder: { t: 'h', y: 26, x1: 84, x2: 156, ext: [[84, 44], [156, 44]] },
      chestH: { t: 'h', y: 112, x1: 76.6, x2: 164.4 },
      waistH: { t: 'h', y: 150, x1: 82, x2: 158 },
    },
    zones: { neck: [120, 64, 'r'], zip: [120, 114, 'l'], waist: [150, 152, 'r'], side: [66, 236, 'l'], hem: [150, 326, 'r'] },
  },
  jacket: {
    art: `
      <path d="M98,40 L62,56 C56,112 44,180 34,242 L58,252 C64,200 70,150 74,118 L74,300 L112,300 Q120,299 120,292 Q120,299 128,300 L166,300 L166,118 C170,150 176,200 182,252 L206,242 C196,180 184,112 178,56 L142,40 Z" ${FAB2} ${OUT}/>
      <path d="M102,48 Q120,45 138,48 L122,156 L118,156 Z" fill="var(--surface-2)" ${OUT} stroke-width="1.1"/>
      <path d="M98,40 Q120,33 142,40 L138,48 Q120,44 102,48 Z" ${FAB} ${OUT}/>
      <path d="M102,48 L90,60 L97,67.6 L85.6,78 L118.6,158 Z" ${FAB} ${OUT}/>
      <path d="M138,48 L150,60 L143,67.6 L154.4,78 L121.4,158 Z" ${FAB} ${OUT}/>
      <path d="M88.6,79.4 L116,150 M151.4,79.4 L124,150" ${STITCH}/>
      <path d="M120,160 L120,292" ${SEAM}/>
      <circle cx="120" cy="176" r="3.4" fill="var(--surface)" stroke="var(--ink-2)" stroke-width="1.1"/><circle cx="120" cy="214" r="3.4" fill="var(--surface)" stroke="var(--ink-2)" stroke-width="1.1"/>
      <path d="M80,212 L108,210.6 L108,221 L80,222.4 Z" ${FAB} ${OUT} stroke-width="1.1"/><path d="M132,210.6 L160,212 L160,222.4 L132,221 Z" ${FAB} ${OUT} stroke-width="1.1"/>
      <path d="M134,103.6 L154,101.6 L154,106.4 L134,108.4 Z" ${FAB} ${OUT} stroke-width="1.1"/>
      <path d="M62,56 Q70,90 74,118 M178,56 Q170,90 166,118" ${SEAM}/>
      <path d="M37.6,226 L60.4,236 M202.4,226 L179.6,236" ${STITCH}/>
      ${[[52.6, 243.6], [55.2, 238.6], [187.4, 243.6], [184.8, 238.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="var(--surface)" stroke="var(--ink-2)" stroke-width=".9"/>`).join('')}
      <path d="M78,294 L112,294 M128,294 L162,294" ${STITCH}/>`,
    dims: {
      len: { t: 'v', x: 18, y1: 40, y2: 300, ext: [[98, 40], [74, 300]] },
      shoulder: { t: 'h', y: 20, x1: 62, x2: 178, ext: [[62, 56], [178, 56]] },
      chestH: { t: 'h', y: 132, x1: 74, x2: 166 },
      sleeve: { t: 'a', x1: 176, y1: 64, x2: 194, y2: 246, ly: 176 },
    },
    zones: { collar: [96, 58, 'l'], button: [120, 184, 'r'], pocket: [94, 222, 'l'], elbow: [188, 150, 'r'], cuff: [196, 244, 'r'], lining: [136, 100, 'r'] },
  },
};

const LX = 214; // 라벨 칸 시작
function pill(x, y, text, hi, anchor = 'start') {
  const fs = 10.5, h = 18, w = tw(text, fs) + 14;
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  return `<g><rect x="${f(x0)}" y="${f(y - h / 2)}" width="${f(w)}" height="${h}" rx="${h / 2}" ${hi
      ? 'fill="var(--tape)"' : 'fill="var(--surface)" stroke="var(--line-strong)" stroke-width="1"'}/>`
    + `<text x="${f(x0 + w / 2)}" y="${f(y + 3.7)}" text-anchor="middle" font-size="${fs}" font-weight="${hi ? 700 : 500}" fill="${hi ? 'var(--tape-ink)' : 'var(--ink-2)'}">${esc(text)}</text></g>`;
}
function tick(x, y, ux, uy, len, col, w) {
  const nx = -uy, ny = ux;
  return `<line x1="${f(x - nx * len)}" y1="${f(y - ny * len)}" x2="${f(x + nx * len)}" y2="${f(y + ny * len)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
}
function dimLine(x1, y1, x2, y2, hi) {
  const col = hi ? 'var(--tape)' : 'var(--ink-3)', w = hi ? 2.4 : 1.2;
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`
    + tick(x1, y1, ux, uy, 4.5, col, w) + tick(x2, y2, ux, uy, 4.5, col, w);
}
const lead = (x1, y1, x2, y2, hi) =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${hi ? 'var(--tape)' : 'var(--ink-3)'}" stroke-width="${hi ? 1.4 : 1}" stroke-dasharray="2 2.2" stroke-linecap="round"/>`;
const extLine = (x1, y1, x2, y2) =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="var(--ink-3)" stroke-width=".8" stroke-dasharray="1.6 2" opacity=".8"/>`;

function renderDim(id, d, m, hi, labels) {
  const v = m && m[id] != null && m[id] !== '' ? +m[id] : null;
  const text = FIELDS[id].label + (v != null && isFinite(v) ? ' ' + fmtCm(v) : '');
  let s = '';
  if (d.t === 'v') {
    (d.ext || []).forEach(([x, y]) => { s += extLine(x - 3, y, d.x - 5, y); });
    s += dimLine(d.x, d.y1, d.x, d.y2, hi);
    if (labels) {
      const cy = (d.y1 + d.y2) / 2;
      s += `<g transform="rotate(-90 ${d.x} ${f(cy)})">${pill(d.x, cy, text, hi, 'middle')}</g>`;
    }
  } else if (d.t === 'h') {
    (d.ext || []).forEach(([x, y]) => { s += extLine(x, y + (y > d.y ? -3 : 3), x, d.y + (y > d.y ? -5 : 5)); });
    s += dimLine(d.x1, d.y, d.x2, d.y, hi);
    if (labels) { s += lead(d.x2 + 6, d.y, LX - 3, d.y, hi) + pill(LX, d.y, text, hi); }
  } else if (d.t === 'v2') {
    (d.ext || []).forEach(([x, y]) => { s += extLine(x + 3, y, d.x + 5, y); });
    s += dimLine(d.x, d.y1, d.x, d.y2, hi);
    if (labels) { s += lead(d.x + 2, d.ly, LX - 3, d.ly, hi) + pill(LX, d.ly, text, hi); }
  } else if (d.t === 'a') {
    s += dimLine(d.x1, d.y1, d.x2, d.y2, hi);
    if (labels) {
      const t = (d.ly - d.y1) / (d.y2 - d.y1), lx = d.x1 + (d.x2 - d.x1) * t;
      s += `<circle cx="${f(lx)}" cy="${d.ly}" r="1.8" fill="${hi ? 'var(--tape)' : 'var(--ink-3)'}"/>` + lead(lx + 3, d.ly, LX - 3, d.ly, hi) + pill(LX, d.ly, text, hi);
    }
  }
  return `<g class="dim" data-field="${id}">${s}</g>`;
}

export function sketch(cat, { m = {}, highlight = null, labels = true } = {}) {
  const F = FLATS[cat] || FLATS.pants;
  const ids = CAT_FIELDS[cat] || [];
  let dims = '', top = '';
  for (const id of ids) {
    if (!F.dims[id]) continue;
    const g = renderDim(id, F.dims[id], m, id === highlight, labels);
    if (id === highlight) top = g; else dims += g;
  }
  return svg('0 0 320 360', `<g class="flat">${F.art}</g>${dims}${top}`,
    `role="img" aria-label="${esc((CAT_FIELDS[cat] || []).map(i => FIELDS[i].label).join(', '))} 실측 위치"`);
}

// ───────────────────────── 3. 손상 부위 지도 ─────────────────────────
export function damageMap(cat, { selected = [] } = {}) {
  const F = FLATS[cat] || FLATS.pants;
  const zones = DAMAGE_ZONES[cat] || [];
  const sel = new Set(selected);
  let z = '';
  for (const zone of zones) {
    const pos = F.zones[zone.id];
    if (!pos) continue;
    const [x0, y, side] = pos, x = x0 + 40, on = sel.has(zone.id);
    const fs = 11, h = 20, w = tw(zone.label, fs) + 16;
    const cxp = side === 'l' ? x - 22 - 8 - w : x + 22 + 8;
    z += `<g class="zone${on ? ' on' : ''}" data-zone="${zone.id}" role="button" tabindex="0" aria-pressed="${on}" aria-label="${esc(zone.label)}" style="cursor:pointer">
      <circle cx="${x}" cy="${y}" r="26" fill="transparent"/>
      <circle cx="${x}" cy="${y}" r="20" fill="${on ? 'var(--chalk)' : 'var(--surface)'}" fill-opacity="${on ? 0.18 : 0.35}" stroke="${on ? 'var(--chalk)' : 'var(--ink-3)'}" stroke-width="${on ? 2 : 1.4}" ${on ? '' : 'stroke-dasharray="3.5 3"'}/>
      <circle cx="${x}" cy="${y}" r="${on ? 4.5 : 3}" fill="${on ? 'var(--chalk)' : 'var(--ink-3)'}"/>
      ${on ? `<path d="M${x - 2.6},${y} l1.8,1.9 l3.4,-3.6" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
      <line x1="${side === 'l' ? x - 21 : x + 21}" y1="${y}" x2="${side === 'l' ? cxp + w : cxp}" y2="${y}" stroke="${on ? 'var(--chalk)' : 'var(--ink-3)'}" stroke-width="1" stroke-dasharray="${on ? '0' : '2 2'}"/>
      <rect x="${f(cxp)}" y="${y - h / 2}" width="${f(w)}" height="${h}" rx="${h / 2}" fill="${on ? 'var(--chalk)' : 'var(--surface)'}" stroke="${on ? 'var(--chalk)' : 'var(--line-strong)'}" stroke-width="1"/>
      <text x="${f(cxp + w / 2)}" y="${y + 3.9}" text-anchor="middle" font-size="${fs}" font-weight="${on ? 700 : 500}" fill="${on ? '#fff' : 'var(--ink-2)'}">${esc(zone.label)}</text>
    </g>`;
  }
  return svg('0 0 320 360', `<g class="flat" transform="translate(40 0)" opacity=".92">${F.art}</g>${z}`,
    'role="group" aria-label="손상 부위 선택"');
}

// ───────────────────────── 4. 2D 핏 (마네킹) ─────────────────────────
const ARM_A = 8 * Math.PI / 180;
function landmarks(body = {}) {
  const H = clamp(+body.height || 172, 140, 205), sex = body.sex === 'F' ? 'F' : 'M';
  const w = +body.weight || (sex === 'M' ? 70 : 55);
  const bmi = w / Math.pow(H / 100, 2);
  const inseam = clamp(+body.inseam || H * 0.455, H * 0.38, H * 0.52);
  const waistC = +body.waist || (sex === 'M' ? H * 0.45 + (bmi - 22) * 2.2 : H * 0.42 + (bmi - 21) * 2);
  const hipC = +body.hip || (sex === 'M' ? H * 0.55 + (bmi - 22) * 1.5 : H * 0.57 + (bmi - 21) * 1.6);
  const chestC = +body.chest || (sex === 'M' ? H * 0.53 + (bmi - 22) * 1.8 : H * 0.52 + (bmi - 21) * 1.6);
  return {
    H, sex, inseam, chestC, waistC, hipC,
    neck: H * 0.835, hps: H * 0.835 + 1.5, shoulder: H * 0.818, chest: H * 0.72, waist: H * 0.62, hip: H * 0.52,
    crotch: inseam, knee: H * 0.285, calf: H * 0.2, ankle: H * 0.04,
    shoulderHalf: H * (sex === 'M' ? 0.1135 : 0.105), neckHalf: H * 0.032,
    chestW: chestC * (sex === 'M' ? 0.34 : 0.33), waistW: waistC * 0.33, hipW: hipC * 0.35,
    elbowD: H * 0.19, wristD: H * 0.345, handD: H * 0.45,
  };
}
// 몸통 반폭 (v 높이에서)
function bodyHalfAt(Lm, v) {
  const pts = [[Lm.hps, Lm.neckHalf], [Lm.shoulder, Lm.shoulderHalf], [Lm.H * 0.74, Lm.chestW / 2], [Lm.waist, Lm.waistW / 2], [Lm.hip, Lm.hipW / 2], [Lm.crotch, Lm.hipW / 2 * 0.97], [0, Lm.hipW / 2 * 0.97]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [v1, a] = pts[i], [v2, b] = pts[i + 1];
    if (v <= v1 && v >= v2) return a + (b - a) * (v1 - v) / (v1 - v2 || 1);
  }
  return v > Lm.hps ? Lm.neckHalf : Lm.hipW / 2;
}
function legCenter(Lm, v) {
  const pts = [[Lm.hip, Lm.hipW / 4], [Lm.knee, Lm.H * 0.052], [Lm.ankle, Lm.H * 0.056], [0, Lm.H * 0.057]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [v1, a] = pts[i], [v2, b] = pts[i + 1];
    if (v <= v1 && v >= v2) return a + (b - a) * (v1 - v) / (v1 - v2 || 1);
  }
  return v > Lm.hip ? Lm.hipW / 4 : Lm.H * 0.057;
}
function armGeom(Lm, side) {
  return { sx: side * Lm.shoulderHalf * 0.9, sv: Lm.H * 0.802, d: [side * Math.sin(ARM_A), -Math.cos(ARM_A)], n: [side * Math.cos(ARM_A), Math.sin(ARM_A)] };
}
function sleeveStart(Lm, m, side) {
  const gsh = Math.max((+m.shoulder || Lm.shoulderHalf * 2) / 2, Lm.neckHalf * 2.2);
  const over = gsh - Lm.shoulderHalf;
  const px = side * gsh, pv = Lm.shoulder - Math.max(0, over) * 0.45 - 0.3;
  const a = armGeom(Lm, side);
  const proj = (px - a.sx) * a.d[0] + (pv - a.sv) * a.d[1];
  return { px, pv, proj, d: a.d, n: a.n, over };
}

export function fit2dPreset(cat, kind, presetId, body, m = {}) {
  const Lm = landmarks(body);
  const out = { ...m };
  const shorten = (field, val) => { const o = +m[field]; const v = half(val); out[field] = isFinite(o) && o > 0 ? Math.min(o, Math.max(5, v)) : Math.max(5, v); };
  if (kind === 'skirt_hem') {
    const t = { mini: Lm.knee + 10, knee: Lm.knee + 1, midi: (Lm.knee + Lm.ankle) / 2, long: Lm.ankle + 6 }[presetId];
    if (t != null) shorten('len', Lm.waist + 1.5 - t);
  } else if (kind === 'dress_hem') {
    const t = { knee: Lm.knee + 1, midi: (Lm.knee + Lm.ankle) / 2, long: Lm.ankle + 6 }[presetId];
    if (t != null) shorten('len', Lm.hps - t);
  } else if (kind === 'top_hem') {
    const t = { crop: Lm.waist + 2, hip: Lm.H * 0.575, mid: Lm.hip - 6 }[presetId];
    if (t != null) shorten('len', Lm.hps - t);
  } else if (kind === 'sleeve' || kind === 'short_sleeve') {
    const st = sleeveStart(Lm, m, 1);
    const along = {
      wristbone: Lm.wristD, below: Lm.wristD + 1.5, hand: Lm.wristD + 5,
      upper: Lm.H * 0.1, mid: Lm.elbowD - 5, elbow: Lm.elbowD,
    }[presetId];
    if (along != null) shorten('sleeve', along - st.proj);
  } else if (kind === 'width') {
    const ease = { slim: 8, regular: 12, loose: 18 }[presetId];
    if (ease != null) {
      const minC = Lm.chestC / 2 + 2;
      const tgt = Math.max(minC, (Lm.chestC + ease) / 2);
      if (m.chestH != null) out.chestH = half(Math.min(+m.chestH, tgt));
      if (cat === 'dress' && m.waistH != null) out.waistH = half(Math.min(+m.waistH, Math.max(Lm.waistC / 2 + 1.5, (Lm.waistC + ease * 0.7) / 2)));
    }
  }
  return out;
}

// 옷 모양 (cm, v 좌표). 바깥선 점과 디테일을 돌려줌
function garmentShape(cat, Lm, m, X, Y) {
  const pt = (x, v) => [X(x), Y(v)];
  const r = { d: '', detail: '', marks: {} };
  const W = fl => fl * 0.68; // 펼친 폭 → 앞에서 보이는 폭
  if (cat === 'pants') {
    const rise = +m.rise || 30, len = +m.len || 100;
    const top = Lm.crotch + rise, hemV = top - len;
    const pool = hemV < 0.6, hv = pool ? 0.4 : hemV;
    const wH = Math.max(W(+m.waistH || 40) / 2, bodyHalfAt(Lm, top) + 0.6);
    const hipH = Math.max(W(+m.hipH || 48) / 2, Lm.hipW / 2 + 1);
    const thighHalf = W(+m.thighH || 30) / 2, hemHalf = W(+m.hemH || 20) / 2 * (pool ? 1.06 : 1);
    const legs = side => {
      const cT = side * Math.max(legCenter(Lm, Lm.crotch - 4), thighHalf * 0.98);
      const cK = side * legCenter(Lm, Math.max(hv, Lm.knee));
      const cH = side * legCenter(Lm, hv);
      const kHalf = thighHalf + (hemHalf - thighHalf) * clamp((Lm.crotch - Lm.knee) / Math.max(1, Lm.crotch - hv), 0, 1);
      return {
        outer: [[side * hipH, Lm.hip], [cT + side * thighHalf, Lm.crotch - 4], [cK + side * kHalf, Math.max(hv + 2, Lm.knee)], [cH + side * hemHalf, hv]],
        inner: [[cH - side * hemHalf, hv], [cK - side * kHalf, Math.max(hv + 2, Lm.knee)], [cT - side * thighHalf, Lm.crotch - 4], [side * 0.4, Lm.crotch - 0.6]],
      };
    };
    const R = legs(1), Lg = legs(-1);
    const outerR = [[wH, top], ...R.outer], outerL = [[-wH, top], ...Lg.outer];
    const ptsR = outerR.map(p => pt(...p)), innerR = R.inner.map(p => pt(...p));
    const innerL = Lg.inner.map(p => pt(...p)).reverse(), outerLr = outerL.map(p => pt(...p)).reverse();
    r.d = M(pt(-wH, top)) + L(pt(wH, top)) + crSeg(ptsR, 0.8) + L(innerR[0]) + crSeg(innerR, 0.8) + L(innerL[0]) + crSeg(innerL, 0.8) + L(outerLr[0]) + crSeg(outerLr, 0.8) + ' Z';
    const wb = top - 4;
    r.detail += `<path d="${M(pt(-wH + 0.2, wb))}${L(pt(wH - 0.2, wb))}" ${SEAM} stroke-width=".9"/>`
      + `<path d="${M(pt(0, wb))}${L(pt(0, Lm.crotch + 1))}" ${SEAM} stroke-width=".9"/>`
      + `<path d="${M(pt(2.6, wb))}${L(pt(2.6, Lm.crotch + 6))} Q${f(X(2.6))},${f(Y(Lm.crotch + 2))} ${f(X(0))},${f(Y(Lm.crotch + 1.5))}" ${STITCH} stroke-width=".8"/>`
      + `<path d="${M(pt(wH * 0.55, top))} Q${f(X(wH * 0.6))},${f(Y(top - 8))} ${f(X(hipH * 0.98))},${f(Y(top - 11))} ${M(pt(-wH * 0.55, top))} Q${f(X(-wH * 0.6))},${f(Y(top - 8))} ${f(X(-hipH * 0.98))},${f(Y(top - 11))}" ${SEAM} stroke-width=".9"/>`;
    [-1, 1].forEach(sd => {
      const c = sd * legCenter(Lm, hv);
      r.detail += `<path d="${M(pt(c - hemHalf + 0.6, hv + 2.2))}${L(pt(c + hemHalf - 0.6, hv + 2.2))}" ${STITCH} stroke-width=".8"/>`;
      if (pool) {
        const ex = Math.min(3, Math.ceil((0.6 - hemV) / 2.5));
        for (let k = 1; k <= ex; k++) {
          const vv = hv + 2.5 + k * 3.2;
          r.detail += `<path d="${M(pt(c - hemHalf * 0.95, vv))} Q${f(X(c))},${f(Y(vv - 1.6))} ${f(X(c + hemHalf * 0.95))},${f(Y(vv))}" fill="none" stroke="var(--fabric-line)" stroke-width=".9" stroke-linecap="round"/>`;
        }
      }
    });
    r.marks = { hem: { v: hv, half: Math.abs(legCenter(Lm, hv)) + hemHalf }, width: { v: Lm.crotch - 4, half: Math.abs(legCenter(Lm, Lm.crotch - 4)) + thighHalf, legHalf: thighHalf, legC: Math.max(legCenter(Lm, Lm.crotch - 4), thighHalf * 0.98) }, hemW: { v: hv, legHalf: hemHalf, legC: legCenter(Lm, hv) }, waist: { v: top - 2, half: wH } };
  } else if (cat === 'skirt') {
    const top = Lm.waist + 1.5, len = +m.len || 60, hv = Math.max(0.6, top - len);
    const wH = Math.max(W(+m.waistH || 36) / 2, bodyHalfAt(Lm, top) + 0.6);
    const hipV = Math.max(hv + 1, Lm.hip - 2);
    const hipH = Math.max(W(+m.hipH || 46) / 2, Lm.hipW / 2 + 1);
    const hemH = Math.max(W(+m.hemH || 50) / 2, hipH * 1.02 + (hipV - hv) * 0.03);
    const side = s => [pt(s * wH, top), pt(s * hipH, hipV), pt(s * hemH, hv)];
    const Rr = side(1), Ll = side(-1).reverse();
    const dip = (hemH * 0.06);
    r.d = M(pt(-wH, top)) + L(pt(wH, top)) + crSeg(Rr, 0.7) + ` Q${f(X(0))},${f(Y(hv - dip))} ${f(Ll[0][0])},${f(Ll[0][1])}` + crSeg(Ll, 0.7) + ' Z';
    r.detail += `<path d="${M(pt(-wH + 0.2, top - 3.5))}${L(pt(wH - 0.2, top - 3.5))}" ${SEAM} stroke-width=".9"/>`
      + `<path d="${M(pt(-hemH + 1, hv + 2.2))} Q${f(X(0))},${f(Y(hv - dip + 2.2))} ${f(X(hemH - 1))},${f(Y(hv + 2.2))}" ${STITCH} stroke-width=".8"/>`
      + `<path d="${M(pt(-wH * 0.45, top - 3.5))}${L(pt(-hemH * 0.42, hv + 3))} ${M(pt(wH * 0.45, top - 3.5))}${L(pt(hemH * 0.42, hv + 3))}" ${STITCH} stroke-width=".7" opacity=".6"/>`;
    r.marks = { hem: { v: hv - dip * 0.5, half: hemH }, width: { v: hipV, half: hipH }, waist: { v: top - 1.5, half: wH } };
  } else if (cat === 'dress') {
    const sh = Math.max((+m.shoulder || 38) / 2, Lm.neckHalf * 2.4), strapW = Math.min(4.5, sh * 0.25);
    const chH = Math.max(W(+m.chestH || 46) / 2, Lm.chestW / 2 + 0.6), armV = Lm.H * 0.745;
    const wH = Math.max(W(+m.waistH || 38) / 2, Lm.waistW / 2 + 0.6);
    const hv = Math.max(0.6, Lm.hps - (+m.len || 110));
    const hipH = Lm.hipW / 2 + 1.6;
    const hemH = Math.max(hipH + 4, chH * 1.25, hipH + (Lm.hip - hv) * 0.1);
    const sv = Lm.shoulder - 0.4, neckV = Lm.H * 0.755;
    const sideR = [pt(sh, sv), pt(chH, armV), pt(wH, Lm.waist), pt(Math.max(hipH, wH), Math.min(Lm.hip, Lm.waist - 2)), pt(hemH, hv)].filter((p, i, a) => i === 0 || p[1] >= a[i - 1][1]);
    const sideL = [pt(-hemH, hv), pt(-Math.max(hipH, wH), Math.min(Lm.hip, Lm.waist - 2)), pt(-wH, Lm.waist), pt(-chH, armV), pt(-sh, sv)].filter((p, i, a) => i === 0 || p[1] <= a[i - 1][1]);
    const dip = hemH * 0.05;
    r.d = M(pt(-sh, sv)) + L(pt(-sh + strapW, sv)) + ` Q${f(X(0))},${f(Y(neckV - 4))} ${f(X(sh - strapW))},${f(Y(sv))}` + L(pt(sh, sv))
      + crSeg(sideR, 0.6) + ` Q${f(X(0))},${f(Y(hv - dip))} ${f(sideL[0][0])},${f(sideL[0][1])}` + crSeg(sideL, 0.6) + ' Z';
    r.detail += `<path d="${M(pt(-wH, Lm.waist))} Q${f(X(0))},${f(Y(Lm.waist - 0.8))} ${f(X(wH))},${f(Y(Lm.waist))}" ${SEAM} stroke-width=".9"/>`
      + `<path d="${M(pt(-hemH + 1, hv + 2.2))} Q${f(X(0))},${f(Y(hv - dip + 2.2))} ${f(X(hemH - 1))},${f(Y(hv + 2.2))}" ${STITCH} stroke-width=".8"/>`
      + `<path d="${M(pt(-wH * 0.5, Lm.waist - 1))}${L(pt(-hemH * 0.5, hv + 3))} ${M(pt(wH * 0.5, Lm.waist - 1))}${L(pt(hemH * 0.5, hv + 3))}" ${STITCH} stroke-width=".7" opacity=".6"/>`;
    r.marks = { hem: { v: hv - dip * 0.5, half: hemH }, width: { v: armV - 1.5, half: chH }, waist: { v: Lm.waist, half: wH }, shoulder: { v: sv, half: sh } };
  } else {
    // 상의: tee, shirt, jacket
    const kind = cat;
    const hx = Lm.neckHalf * (kind === 'jacket' ? 1.45 : 1.25), hv = Lm.hps;
    const R = sleeveStart(Lm, m, 1), Lf = sleeveStart(Lm, m, -1);
    const chH = Math.max(W(+m.chestH || 50) / 2, Lm.chestW / 2 + 0.8);
    const armV = Lm.H * 0.745 - Math.max(0, R.over) * 0.3;
    const hemV = Math.max(0.6, hv - (+m.len || 70));
    const hemH = Math.max(chH * 0.98, bodyHalfAt(Lm, hemV) + 1);
    const sl = +m.sleeve || (kind === 'tee' ? 20 : 60);
    const cw = kind === 'tee' ? Lm.H * 0.085 : kind === 'jacket' ? Lm.H * 0.07 : Lm.H * 0.06;
    const sleeve = S => {
      const out = [S.px + S.d[0] * sl, S.pv + S.d[1] * sl];
      const inn = [out[0] - S.n[0] * cw, out[1] - S.n[1] * cw];
      return { out, inn };
    };
    const sR = sleeve(R), sL = sleeve(Lf);
    const neckDip = kind === 'tee' ? Lm.H * 0.045 : kind === 'shirt' ? Lm.H * 0.03 : Lm.hps - Lm.H * 0.655;
    const shirtTail = kind === 'shirt' ? 3.2 : 0;
    r.d = M(pt(hx, hv)) + L(pt(R.px, R.pv)) + L(pt(...sR.out)) + L(pt(...sR.inn))
      + ` Q${f(X(chH + 1))},${f(Y(armV + 3))} ${f(X(chH))},${f(Y(armV))}` + L(pt(hemH, hemV + shirtTail))
      + (shirtTail ? ` Q${f(X(hemH * 0.6))},${f(Y(hemV - 0.6))} ${f(X(0))},${f(Y(hemV - 0.8))} Q${f(X(-hemH * 0.6))},${f(Y(hemV - 0.6))} ${f(X(-hemH))},${f(Y(hemV + shirtTail))}` : L(pt(-hemH, hemV)))
      + L(pt(-chH, armV)) + ` Q${f(X(-chH - 1))},${f(Y(armV + 3))} ${f(sL.inn[0] * 0 + X(sL.inn[0]))},${f(Y(sL.inn[1]))}`
      + L(pt(...sL.out)) + L(pt(Lf.px, Lf.pv)) + L(pt(-hx, hv))
      + ` Q${f(X(0))},${f(Y(hv - neckDip * (kind === 'jacket' ? 1 : 1.6)))} ${f(X(hx))},${f(Y(hv))} Z`;
    // 디테일
    const armhole = S => `<path d="${M(pt(S.px, S.pv))} Q${f(X(S.px * 0.96))},${f(Y((S.pv + armV) / 2))} ${f(X(Math.sign(S.px) * chH))},${f(Y(armV))}" ${SEAM} stroke-width=".9"/>`;
    r.detail += armhole(R) + armhole(Lf);
    const cuffBack = kind === 'tee' ? 1.6 : Lm.H * 0.035;
    [[R, sR], [Lf, sL]].forEach(([S, s]) => {
      const b = [s.out[0] - S.d[0] * cuffBack, s.out[1] - S.d[1] * cuffBack], bi = [s.inn[0] - S.d[0] * cuffBack, s.inn[1] - S.d[1] * cuffBack];
      r.detail += `<path d="${M(pt(...b))}${L(pt(...bi))}" ${kind === 'tee' ? STITCH : SEAM} stroke-width=".9"/>`;
    });
    if (kind === 'tee') {
      r.detail += `<path d="${M(pt(-hx * 0.86, hv - 0.6))} Q${f(X(0))},${f(Y(hv - neckDip * 1.35))} ${f(X(hx * 0.86))},${f(Y(hv - 0.6))}" ${STITCH} stroke-width=".8"/>`
        + `<path d="${M(pt(-hemH + 0.8, hemV + 2))}${L(pt(hemH - 0.8, hemV + 2))}" ${STITCH} stroke-width=".8"/>`;
    } else if (kind === 'shirt') {
      const topV = hv - neckDip * 1.4;
      r.detail += `<path d="${M(pt(-1.6, topV))}${L(pt(-1.6, hemV + 0.2))} ${M(pt(1.6, topV))}${L(pt(1.6, hemV + 0.2))}" ${SEAM} stroke-width=".8"/>`
        + `<path d="${M(pt(-hx, hv))}${L(pt(-hx - 2.6, hv - 6))}${L(pt(-0.6, topV + 0.4))} ${M(pt(hx, hv))}${L(pt(hx + 2.6, hv - 6))}${L(pt(0.6, topV + 0.4))}" fill="var(--fabric)" ${SEAM} stroke-width=".9"/>`;
      for (let v = topV - 6; v > hemV + 4; v -= 9) r.detail += `<circle cx="${f(X(0))}" cy="${f(Y(v))}" r="1.3" fill="var(--surface)" stroke="var(--ink-2)" stroke-width=".7"/>`;
    } else {
      const vV = Lm.H * 0.655;
      r.detail += `<path d="${M(pt(-hx, hv))}${L(pt(-hx - 3, hv - 5))}${L(pt(-hx - 1, hv - 8))}${L(pt(-hx - 4.4, hv - 11))}${L(pt(-0.6, vV))}${L(pt(-hx + 1.4, hv - 1))}Z" fill="var(--fabric)" ${SEAM} stroke-width=".8"/>`
        + `<path d="${M(pt(hx, hv))}${L(pt(hx + 3, hv - 5))}${L(pt(hx + 1, hv - 8))}${L(pt(hx + 4.4, hv - 11))}${L(pt(0.6, vV))}${L(pt(hx - 1.4, hv - 1))}Z" fill="var(--fabric)" ${SEAM} stroke-width=".8"/>`
        + `<path d="${M(pt(0, vV))}${L(pt(0, hemV))}" ${SEAM} stroke-width=".8"/>`;
      [vV - 3, vV - 12].forEach(v => { if (v > hemV + 2) r.detail += `<circle cx="${f(X(0))}" cy="${f(Y(v))}" r="1.5" fill="var(--surface)" stroke="var(--ink-2)" stroke-width=".7"/>`; });
      const pv = Math.max(hemV + 6, Lm.waist - 6);
      if (pv < vV - 4) r.detail += `<path d="${M(pt(-chH * 0.82, pv))}${L(pt(-chH * 0.3, pv + 0.4))} ${M(pt(chH * 0.3, pv + 0.4))}${L(pt(chH * 0.82, pv))}" ${SEAM} stroke-width=".9"/>`;
    }
    r.marks = {
      hem: { v: hemV, half: hemH },
      sleeve: [{ a: sR.out, b: sR.inn }, { a: sL.out, b: sL.inn }],
      width: { v: armV - 2, half: chH },
      shoulder: { v: R.pv + 0.6, half: Math.abs(R.px) },
    };
  }
  return r;
}

function mannequin(Lm, X, Y, gid) {
  const pt = (x, v) => [X(x), Y(v)];
  const H = Lm.H;
  const shade = `fill="url(#${gid})" stroke="var(--skin-2)" stroke-width=".8" stroke-linejoin="round"`;
  let s = '';
  // 발
  [-1, 1].forEach(sd => {
    const c = sd * legCenter(Lm, 0);
    s += `<ellipse cx="${f(X(c + sd * 0.6))}" cy="${f(Y(H * 0.016))}" rx="${f((H * 0.032) * (X(1) - X(0)))}" ry="${f(H * 0.017 * (X(1) - X(0)))}" ${shade}/>`;
  });
  // 팔 (몸통 뒤)
  [-1, 1].forEach(sd => {
    const a = armGeom(Lm, sd);
    const at = (t, w) => [a.sx + a.d[0] * t + a.n[0] * w, a.sv + a.d[1] * t + a.n[1] * w];
    const ts = [0, H * 0.09, Lm.elbowD, H * 0.27, Lm.wristD, H * 0.39, H * 0.435];
    const ws = [H * 0.027, H * 0.024, H * 0.018, H * 0.017, H * 0.012, H * 0.017, H * 0.01];
    const outer = ts.map((t, i) => pt(...at(t, ws[i])));
    const inner = ts.map((t, i) => pt(...at(t, -ws[i]))).reverse();
    const tip = pt(...at(Lm.handD, 0));
    s += `<path d="${M(outer[0])}${crSeg(outer, 0.9)} Q${f(tip[0])},${f(tip[1])} ${f(inner[0][0])},${f(inner[0][1])}${crSeg(inner, 0.9)} Z" ${shade}/>`;
  });
  // 다리
  [-1, 1].forEach(sd => {
    const lv = [Lm.hip, Lm.crotch, H * 0.40, Lm.knee, Lm.calf, H * 0.075, Lm.ankle * 0.6];
    const hw = [Lm.hipW / 4 + 0.2, Lm.hipW / 4 * 0.98, H * 0.047, H * 0.034, H * 0.037, H * 0.022, H * 0.019];
    const outer = lv.map((v, i) => pt(sd * (legCenter(Lm, v) + hw[i]), v));
    const inner = lv.map((v, i) => pt(sd * Math.max(0.3, legCenter(Lm, v) - hw[i]), v)).reverse();
    inner[inner.length - 1] = pt(sd * 0.3, Lm.crotch - 0.5);
    s += `<path d="${M(outer[0])}${crSeg(outer, 0.9)}${L(inner[0])}${crSeg(inner.slice(0, -1), 0.9)}${L(pt(sd * 0.3, Lm.crotch - 0.5))}${L(pt(0, Lm.hip))} Z" ${shade}/>`;
  });
  // 몸통
  const side = sd => [
    [sd * H * 0.028, H * 0.89], [sd * H * 0.03, Lm.neck], [sd * Lm.shoulderHalf * 0.55, H * 0.827], [sd * Lm.shoulderHalf, H * 0.806],
    [sd * Lm.shoulderHalf * 0.94, H * 0.772], [sd * Lm.chestW / 2, H * 0.735], [sd * Lm.chestW / 2 * 0.97, H * 0.69],
    [sd * Lm.waistW / 2, Lm.waist], [sd * Lm.hipW / 2, Lm.hip], [sd * Lm.hipW / 2 * 0.96, Lm.crotch + H * 0.012],
  ];
  const r = side(1).map(p => pt(...p)), l = side(-1).map(p => pt(...p)).reverse();
  s += `<path d="${M(r[0])}${crSeg(r, 0.85)} Q${f(X(0))},${f(Y(Lm.crotch - 1))} ${f(l[0][0])},${f(l[0][1])}${crSeg(l, 0.85)} Z" ${shade}/>`;
  // 머리
  s += `<ellipse cx="${f(X(0))}" cy="${f(Y(H - H * 0.062))}" rx="${f(H * 0.041 * (X(1) - X(0)))}" ry="${f(H * 0.062 * (X(1) - X(0)))}" ${shade}/>`;
  return s;
}

export function fit2d(cat, { body = {}, m = {}, item = null, mode = 'before' } = {}) {
  const Lm = landmarks(body);
  const floorY = 398, sc = 372 / Lm.H;
  const X = x => 100 + x * sc, Y = v => floorY - v * sc;
  const gid = uid('sk'), clip = uid('cl');
  let s = `<defs><linearGradient id="${gid}" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" style="stop-color:var(--skin-2)"/><stop offset=".32" style="stop-color:var(--skin)"/><stop offset=".68" style="stop-color:var(--skin)"/><stop offset="1" style="stop-color:var(--skin-2)"/></linearGradient></defs>`;
  s += `<ellipse cx="100" cy="${floorY + 1}" rx="${f(Lm.H * 0.16 * sc)}" ry="5" fill="var(--ink)" opacity=".07"/>`;
  s += `<line x1="14" y1="${floorY}" x2="186" y2="${floorY}" stroke="var(--line-strong)" stroke-width="1"/>`;
  s += mannequin(Lm, X, Y, gid);
  if (m && m.__ghost) {
    const gh = garmentShape(cat, Lm, m.__ghost, X, Y);
    s += `<path d="${gh.d}" fill="none" stroke="var(--ink-3)" stroke-width="1.1" stroke-dasharray="3 2.6" opacity=".85"/>`;
  }
  const g = garmentShape(cat, Lm, m, X, Y);
  const fill = cat === 'jacket' ? 'var(--fabric-2)' : 'var(--fabric)';
  s += `<path d="${g.d}" fill="${fill}" stroke="var(--fabric-line)" stroke-width="1.1" stroke-linejoin="round"/>`;
  s += `<g>${g.detail}</g>`;
  if (mode === 'after') s += tapeMark(cat, item, g.marks, X, Y);
  s += `<text x="100" y="416" text-anchor="middle" font-size="9.5" font-weight="700" letter-spacing="1.6" fill="var(--ink-3)">${mode === 'after' ? 'AFTER' : 'BEFORE'}</text>`;
  return svg('0 0 200 420', s, `role="img" aria-label="${mode === 'after' ? '수선 후' : '수선 전'} 핏 미리보기"`);
}

function tapeMark(cat, item, mk, X, Y) {
  const col = 'var(--tape)';
  const hline = (v, hw, ext = 6) => `<line x1="${f(X(-hw - ext))}" y1="${f(Y(v))}" x2="${f(X(hw + ext))}" y2="${f(Y(v))}" stroke="${col}" stroke-width="1.6" stroke-dasharray="4 3" stroke-linecap="round"/>`;
  const span = (v, x1, x2) => {
    const a = X(x1), b = X(x2), y = Y(v);
    return `<line x1="${f(a)}" y1="${f(y)}" x2="${f(b)}" y2="${f(y)}" stroke="${col}" stroke-width="1.6" stroke-dasharray="3 2.4"/>`
      + `<line x1="${f(a)}" y1="${f(y - 4)}" x2="${f(a)}" y2="${f(y + 4)}" stroke="${col}" stroke-width="1.6" stroke-linecap="round"/><line x1="${f(b)}" y1="${f(y - 4)}" x2="${f(b)}" y2="${f(y + 4)}" stroke="${col}" stroke-width="1.6" stroke-linecap="round"/>`;
  };
  if (!mk) return '';
  if ((item === 'sleeve') && mk.sleeve) {
    return mk.sleeve.map(({ a, b }) => {
      const dx = b[0] - a[0], dv = b[1] - a[1];
      const p1 = [a[0] + dx * -0.35, a[1] + dv * -0.35], p2 = [a[0] + dx * 1.35, a[1] + dv * 1.35];
      return `<line x1="${f(X(p1[0]))}" y1="${f(Y(p1[1]))}" x2="${f(X(p2[0]))}" y2="${f(Y(p2[1]))}" stroke="${col}" stroke-width="1.6" stroke-dasharray="3.5 2.6" stroke-linecap="round"/>`;
    }).join('');
  }
  if (['chestIn', 'sideIn', 'taper', 'waistIn', 'waistOut'].includes(item)) {
    if (cat === 'pants' && item === 'taper' && mk.width) return span(mk.width.v, mk.width.legC - mk.width.legHalf, mk.width.legC + mk.width.legHalf);
    const w = (item === 'waistIn' || item === 'waistOut') && mk.waist ? mk.waist : mk.width;
    if (w) return span(w.v, -w.half, w.half);
  }
  if (item === 'hemW' && mk.hemW) return span(mk.hemW.v + 1.2, mk.hemW.legC - mk.hemW.legHalf, mk.hemW.legC + mk.hemW.legHalf);
  if ((item === 'shoulder' || item === 'strap') && mk.shoulder) return span(mk.shoulder.v, -mk.shoulder.half, mk.shoulder.half);
  if (mk.hem) return hline(mk.hem.v, mk.hem.half);
  return '';
}

// ───────────────────────── 6. 작업 사례 그림 ─────────────────────────
const SAMPLE_FAB = ['var(--indigo)', 'var(--fabric-2)', 'var(--ink-2)'];
const SAMPLE_ST = ['var(--tape)', 'var(--fabric-line)', 'var(--fabric)'];
function photoFrame(inner, i, extra = '') {
  const bg = uid('bg'), vg = uid('vg');
  const rot = [-2.5, 1.8, -0.8][i % 3];
  return svg('0 0 200 200', `<defs>
      <linearGradient id="${bg}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" style="stop-color:var(--surface-2)"/><stop offset="1" style="stop-color:var(--line)"/></linearGradient>
      <radialGradient id="${vg}" cx=".5" cy=".42" r=".75"><stop offset=".55" style="stop-color:var(--ink);stop-opacity:0"/><stop offset="1" style="stop-color:var(--ink);stop-opacity:.10"/></radialGradient></defs>
    <rect width="200" height="200" fill="url(#${bg})"/>${extra}
    <g transform="rotate(${rot} 100 100)">${inner}</g>
    <rect width="200" height="200" fill="url(#${vg})"/>`, 'preserveAspectRatio="xMidYMid slice" role="img"', 'hidden');
}
const shoe = (x, y, flip = 1) =>
  `<path d="M${x - 24 * flip},${y} q${2 * flip},-16 ${20 * flip},-17 l${16 * flip},0 q${10 * flip},2 ${14 * flip},10 q${12 * flip},3 ${14 * flip},7 z" fill="var(--ink)" opacity=".86"/>`
  + `<path d="M${x - 22 * flip},${y - 3} l${46 * flip},0" stroke="var(--surface)" stroke-width="1.4" opacity=".5"/>`;

const SAMPLES = {
  'pants-hem': (i, after) => {
    const fab = SAMPLE_FAB[i % 3], st = SAMPLE_ST[i % 3];
    const floor = `<rect x="-20" y="170" width="240" height="60" fill="var(--line-strong)" opacity=".55"/>`;
    if (!after) {
      return floor + shoe(104, 172) + `<path d="M62,-10 L138,-10 L144,150 Q150,166 140,172 Q104,178 62,172 Q52,164 58,150 Z" fill="${fab}"/>
        <path d="M58,150 Q100,160 144,150 M57,136 Q100,147 145,136 M60,160 Q100,170 142,160" fill="none" stroke="var(--ink)" stroke-opacity=".28" stroke-width="2" stroke-linecap="round"/>
        <path d="M60,122 Q100,130 144,122" fill="none" stroke="var(--ink)" stroke-opacity=".18" stroke-width="2" stroke-linecap="round"/>
        <path d="M100,-10 L101,118" stroke="${st}" stroke-width="1.4" stroke-dasharray="4 3" opacity=".8"/>`;
    }
    return floor + shoe(104, 172) + `<rect x="84" y="118" width="30" height="40" rx="8" fill="var(--skin)"/>
      <path d="M64,-10 L136,-10 L139,122 L61,122 Z" fill="${fab}"/>
      <path d="M62,114 L138,114" stroke="${st}" stroke-width="1.6" stroke-dasharray="4 3"/>
      <path d="M100,-10 L100,112" stroke="${st}" stroke-width="1.4" stroke-dasharray="4 3" opacity=".8"/>
      <path d="M61,122 L139,122" stroke="var(--ink)" stroke-opacity=".25" stroke-width="2"/>`;
  },
  'pants-taper': (i, after) => {
    const fab = SAMPLE_FAB[i % 3], st = SAMPLE_ST[i % 3];
    const floor = `<rect x="-20" y="176" width="240" height="40" fill="var(--line-strong)" opacity=".55"/>`;
    const leg = (cx, top, bot) => `<path d="M${cx - top},-10 L${cx + top},-10 L${cx + bot},158 L${cx - bot},158 Z" fill="${fab}"/>
      <path d="M${cx + top - 4},-10 L${cx + bot - 4},150" stroke="${st}" stroke-width="1.3" stroke-dasharray="4 3" opacity=".85"/>
      <path d="M${cx - bot + 1},151 L${cx + bot - 1},151" stroke="${st}" stroke-width="1.4" stroke-dasharray="4 3"/>`;
    const ank = (cx) => `<rect x="${cx - 9}" y="152" width="18" height="18" rx="6" fill="var(--skin)"/>`;
    return floor + ank(64) + ank(136) + shoe(60, 182, 1) + shoe(140, 182, -1)
      + (after ? leg(64, 30, 17) + leg(136, 30, 17) : leg(64, 31, 29) + leg(136, 31, 29));
  },
  'shirt-sleeve': (i, after) => {
    const fab = ['var(--fabric)', 'var(--surface)', 'var(--fabric-2)'][i % 3];
    const hand = `<path d="M86,118 Q80,150 88,176 Q94,194 106,194 Q118,193 121,176 Q126,150 118,118 Z" fill="var(--skin)" stroke="var(--skin-2)" stroke-width="1.2"/>
      <path d="M117,138 Q132,142 133,158 Q131,165 124,163 Q121,151 116,148" fill="var(--skin)" stroke="var(--skin-2)" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M95,172 L96,190 M104,174 L105,192 M112,172 L112,188" stroke="var(--skin-2)" stroke-width="1" stroke-linecap="round" opacity=".8"/>`;
    const sleeve = (end) => `<path d="M40,-20 L132,-20 L${126},${end} L${70},${end} Z" fill="${fab}" stroke="var(--fabric-line)" stroke-width="1.2"/>
      <path d="M70,${end - 24} L126,${end - 24} L126,${end} L70,${end} Z" fill="${fab}" stroke="var(--fabric-line)" stroke-width="1.2"/>
      <circle cx="117" cy="${end - 12}" r="3.4" fill="var(--surface)" stroke="var(--ink-3)" stroke-width="1"/>
      <path d="M74,${end - 20} L122,${end - 20}" stroke="var(--fabric-line)" stroke-width="1" stroke-dasharray="3 2.4"/>
      <path d="M86,-20 L90,${end - 24}" stroke="var(--fabric-line)" stroke-width="1" opacity=".6"/>`;
    return hand + (after ? sleeve(126) : sleeve(176));
  },
  'dress-hem': (i, after) => {
    const fab = ['var(--chalk)', 'var(--fabric-2)', 'var(--indigo)'][i % 3];
    const floor = `<rect x="-20" y="180" width="240" height="40" fill="var(--line-strong)" opacity=".55"/>`;
    const legs = `<path d="M78,60 L92,60 L94,172 L82,172 Z M108,60 L122,60 L118,172 L106,172 Z" fill="var(--skin)" stroke="var(--skin-2)" stroke-width="1"/>`;
    const hem = after ? 112 : 172;
    const dress = `<path d="M70,-10 L130,-10 Q148,${hem * 0.5} 160,${hem} Q100,${hem + 10} 40,${hem} Q52,${hem * 0.5} 70,-10 Z" fill="${fab}" opacity=".92"/>
      <path d="M44,${hem - 6} Q100,${hem + 3} 156,${hem - 6}" fill="none" stroke="var(--surface)" stroke-width="1.3" stroke-dasharray="4 3" opacity=".75"/>
      <path d="M86,-10 Q80,${hem * 0.6} 70,${hem + 2} M114,-10 Q120,${hem * 0.6} 130,${hem + 2}" fill="none" stroke="var(--ink)" stroke-opacity=".15" stroke-width="2"/>`;
    return floor + legs + shoe(88, 186, 1) + shoe(112, 186, -1) + dress;
  },
  'jacket-lining': (i, after) => {
    const fab = SAMPLE_FAB[(i + 1) % 3];
    const lining = ['var(--tape-50)', 'var(--indigo-50)', 'var(--fabric)'][i % 3];
    const stripes = Array.from({ length: 9 }, (_, k) => `<path d="M${-20 + k * 28},210 L${60 + k * 28},-10" stroke="var(--surface)" stroke-width="9" opacity=".28"/>`).join('');
    const tear = after
      ? `<rect x="96" y="128" width="40" height="24" rx="2" fill="var(--surface)" stroke="var(--line-strong)"/><path d="M102,136 h28 M102,142 h20" stroke="var(--ink-3)" stroke-width="1.4"/>
         <path d="M70,40 L70,182" stroke="var(--fabric-line)" stroke-width="1.2" stroke-dasharray="3 2.4"/>`
      : `<path d="M96,70 l10,12 -6,10 12,8 -4,14 14,6 -8,16 10,14 -14,-4 -6,10 -6,-18 -12,4 4,-16 -10,-10 8,-10 -6,-14 z" fill="var(--ink)" opacity=".55"/>
         <path d="M118,104 q10,4 8,18 M92,120 q-8,8 -2,20 M104,148 q4,10 -4,16" fill="none" stroke="var(--fabric-line)" stroke-width="1.2" stroke-linecap="round"/>`;
    const clip = uid('lc');
    return `<defs><clipPath id="${clip}"><path d="M44,0 L176,0 L176,200 L44,200 Z"/></clipPath></defs>
      <path d="M0,0 L60,0 L52,200 L0,200 Z" fill="${fab}"/><path d="M200,0 L168,0 L172,200 L200,200 Z" fill="${fab}"/>
      <g clip-path="url(#${clip})"><rect x="40" y="0" width="140" height="200" fill="${lining}"/>${stripes}${tear}</g>
      <path d="M56,0 L50,200 M170,0 L174,200" stroke="var(--fabric-line)" stroke-width="1.4"/>`;
  },
  'zipper': (i, after) => {
    const fab = SAMPLE_FAB[(i + 2) % 3];
    const teeth = [];
    for (let k = 0; k < 15; k++) {
      const y = 10 + k * 12;
      const split = !after && y > 104 ? (y - 104) * 0.22 : 0;
      const gap = !after && (k === 11);
      if (!gap) teeth.push(`<rect x="${92 - split}" y="${y}" width="9" height="6" rx="1.4" fill="var(--tape)"/>`);
      teeth.push(`<rect x="${99 + split}" y="${y + 6}" width="9" height="6" rx="1.4" fill="var(--tape)"/>`);
    }
    const sy = after ? 18 : 94;
    return `<rect x="-10" y="-10" width="220" height="220" fill="${fab}"/>
      <path d="M86,-10 L86,${after ? 210 : 104} ${after ? '' : 'L74,210'}" stroke="var(--ink)" stroke-opacity=".25" stroke-width="10" fill="none"/>
      <path d="M114,-10 L114,${after ? 210 : 104} ${after ? '' : 'L126,210'}" stroke="var(--ink)" stroke-opacity=".25" stroke-width="10" fill="none"/>
      ${after ? '' : `<path d="M100,104 L80,210 L120,210 Z" fill="var(--ink)" opacity=".35"/>`}
      ${teeth.join('')}
      <g transform="rotate(${after ? 0 : 14} 100 ${sy + 12})"><rect x="88" y="${sy}" width="24" height="26" rx="6" fill="var(--ink-2)"/><rect x="94" y="${sy + 22}" width="12" height="26" rx="5" fill="var(--ink-2)"/><rect x="97" y="${sy + 34}" width="6" height="9" rx="2" fill="${fab}"/></g>
      <path d="M78,-10 L78,${after ? 210 : 100} M122,-10 L122,${after ? 210 : 100}" stroke="var(--surface)" stroke-width="1.2" stroke-dasharray="4 3" opacity=".55"/>`;
  },
};
export function workSample(kind, i = 0) {
  const fn = SAMPLES[kind] || SAMPLES['pants-hem'];
  const tag = (t, on) => `<g><rect x="10" y="10" width="${t === 'AFTER' ? 50 : 56}" height="20" rx="10" fill="${on ? 'var(--tape)' : 'var(--surface)'}" opacity=".95"/><text x="${t === 'AFTER' ? 35 : 38}" y="23.8" text-anchor="middle" font-size="10" font-weight="700" letter-spacing="1" fill="${on ? 'var(--tape-ink)' : 'var(--ink-2)'}">${t}</text></g>`;
  return {
    before: photoFrame(fn(i, false), i).replace('</svg>', tag('BEFORE', false) + '</svg>'),
    after: photoFrame(fn(i, true), i).replace('</svg>', tag('AFTER', true) + '</svg>'),
  };
}

// ───────────────────────── 7. 가게 그림 ─────────────────────────
function hashStr(s) { let h = 7; for (const c of String(s)) h = (h * 31 + c.codePointAt(0)) >>> 0; return h; }
export function shopHero(shop = {}) {
  if (shop.photo) return `<img class="shop-photo" src="${shop.photo}" alt="${String(shop.name || '').replace(/"/g, '')} 가게 사진" decoding="async">`;
  const h = ((+shop.hue || 220) % 360 + 360) % 360;
  const hs = hashStr(shop.id || shop.name || 'x');
  const v = hs % 3, flip = (hs >> 3) % 2 === 1;
  const hsl = (dh, s, l, a = 1) => `hsla(${(h + dh + 360) % 360},${s}%,${l}%,${a})`;
  const wall = uid('w'), light = uid('l'), floorG = uid('f');
  const T = x => (flip ? 390 - x : x);
  let s = `<defs>
    <linearGradient id="${wall}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hsl(0, 26, 80)}"/><stop offset="1" stop-color="${hsl(0, 20, 68)}"/></linearGradient>
    <linearGradient id="${floorG}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hsl(20, 16, 50)}"/><stop offset="1" stop-color="${hsl(20, 18, 40)}"/></linearGradient>
    <radialGradient id="${light}" cx="${flip ? 0.78 : 0.22}" cy=".35" r=".7"><stop offset="0" stop-color="hsla(44,95%,88%,.75)"/><stop offset="1" stop-color="hsla(44,95%,88%,0)"/></radialGradient></defs>
    <rect width="390" height="200" fill="url(#${wall})"/>
    <rect y="158" width="390" height="42" fill="url(#${floorG})"/>
    ${[0, 1, 2, 3, 4, 5, 6].map(k => `<line x1="${k * 62 - 10}" y1="200" x2="${k * 62 + 18}" y2="158" stroke="${hsl(20, 16, 36)}" stroke-width="1"/>`).join('')}
    <rect y="156" width="390" height="3" fill="${hsl(0, 14, 40)}"/>`;
  // 창
  if (v !== 2) {
    const wx = T(36) - (flip ? 96 : 0);
    s += `<rect x="${wx}" y="22" width="96" height="104" rx="4" fill="hsla(44,85%,86%,1)"/>
      <rect x="${wx}" y="22" width="96" height="104" rx="4" fill="none" stroke="${hsl(0, 16, 34)}" stroke-width="5"/>
      <line x1="${wx + 48}" y1="22" x2="${wx + 48}" y2="126" stroke="${hsl(0, 16, 34)}" stroke-width="4"/>
      <line x1="${wx}" y1="74" x2="${wx + 96}" y2="74" stroke="${hsl(0, 16, 34)}" stroke-width="4"/>
      <path d="M${wx + 10},126 L${wx + 86},126 L${wx + 150 * (flip ? -1 : 1) + 48},200 L${wx - 40 * (flip ? -1 : 1) + 48},200 Z" fill="hsla(44,95%,85%,.28)"/>`;
  }
  s += `<rect width="390" height="200" fill="url(#${light})"/>`;
  // 실 선반
  const rackX = v === 2 ? T(40) - (flip ? 150 : 0) : T(v === 0 ? 232 : 150) - (flip ? 130 : 0), rackW = v === 2 ? 150 : 130;
  const spoolHues = [0, 40, 200, 160, 320, 90, 260, 20];
  s += `<rect x="${rackX}" y="24" width="${rackW}" height="74" rx="3" fill="hsl(28,30%,52%)"/>`;
  for (let row = 0; row < 3; row++) {
    s += `<rect x="${rackX + 4}" y="${44 + row * 22}" width="${rackW - 8}" height="3" fill="hsl(28,30%,40%)"/>`;
    for (let k = 0; k < Math.floor((rackW - 12) / 15); k++) {
      const hh = (h + spoolHues[(k + row * 3 + hs) % spoolHues.length]) % 360;
      const x = rackX + 8 + k * 15, y = 30 + row * 22;
      const c = (k + row) % 5 === 2 ? '#f3b61f' : `hsl(${hh},58%,${50 + (k % 2) * 8}%)`;
      s += `<rect x="${x}" y="${y}" width="10" height="14" rx="2" fill="${c}"/><rect x="${x - 1}" y="${y}" width="12" height="2.4" rx="1" fill="hsl(28,25%,82%)"/><rect x="${x - 1}" y="${y + 11.6}" width="12" height="2.4" rx="1" fill="hsl(28,25%,82%)"/>`;
    }
  }
  // 줄자 (벽 고리에 걸림)
  const tx = v === 2 ? T(214) : T(v === 0 ? 196 : 300);
  s += `<circle cx="${tx}" cy="30" r="3" fill="${hsl(0, 10, 30)}"/>
    <path d="M${tx},31 C${tx - 6},70 ${tx + 10},96 ${tx + 2},132 M${tx},31 C${tx + 12},64 ${tx + 22},90 ${tx + 16},120" fill="none" stroke="#f3b61f" stroke-width="7" stroke-linecap="round"/>
    <path d="M${tx},31 C${tx - 6},70 ${tx + 10},96 ${tx + 2},132 M${tx},31 C${tx + 12},64 ${tx + 22},90 ${tx + 16},120" fill="none" stroke="hsl(40,60%,22%)" stroke-width="3" stroke-dasharray="1 3.2" opacity=".75"/>`;
  // 옷걸이 봉과 옷
  const railX = v === 0 ? T(120) - (flip ? 100 : 0) : v === 1 ? T(250) - (flip ? 120 : 0) : T(236) - (flip ? 136 : 0);
  const railW = v === 2 ? 136 : v === 1 ? 120 : 100;
  s += `<line x1="${railX - 4}" y1="44" x2="${railX + railW + 4}" y2="44" stroke="${hsl(0, 10, 30)}" stroke-width="3" stroke-linecap="round"/>`;
  const n = Math.floor(railW / 34);
  for (let k = 0; k < n; k++) {
    const cx = railX + 18 + k * 34, col = hsl(k * 47 + 10, 32 + (k % 2) * 12, 48 + (k % 3) * 8);
    s += `<path d="M${cx},44 q0,-6 4,-6 M${cx - 13},56 L${cx},48 L${cx + 13},56" fill="none" stroke="${hsl(0, 8, 28)}" stroke-width="1.6" stroke-linecap="round"/>`;
    if ((k + hs) % 2 === 0) {
      s += `<path d="M${cx - 14},55 L${cx - 5},50 L${cx},54 L${cx + 5},50 L${cx + 14},55 L${cx + 20},74 L${cx + 13},77 L${cx + 11},70 L${cx + 11},112 L${cx - 11},112 L${cx - 11},70 L${cx - 13},77 L${cx - 20},74 Z" fill="${col}"/>
        <line x1="${cx}" y1="54" x2="${cx}" y2="112" stroke="hsla(0,0%,100%,.35)" stroke-width="1"/>`;
    } else {
      s += `<path d="M${cx - 12},52 L${cx + 12},52 L${cx + 13},128 L${cx + 2},128 L${cx},70 L${cx - 2},128 L${cx - 13},128 Z" fill="${col}"/>
        <line x1="${cx - 12}" y1="58" x2="${cx + 12}" y2="58" stroke="hsla(0,0%,0%,.18)" stroke-width="1.4"/>`;
    }
  }
  // 작업대와 재봉틀
  const tbx = v === 1 ? T(30) - (flip ? 170 : 0) : T(v === 0 ? 170 : 40) - (flip ? 170 : 0);
  s += `<rect x="${tbx}" y="126" width="170" height="9" rx="2" fill="hsl(28,36%,40%)"/>
    <rect x="${tbx + 8}" y="135" width="7" height="40" fill="hsl(28,30%,32%)"/><rect x="${tbx + 155}" y="135" width="7" height="40" fill="hsl(28,30%,32%)"/>
    <rect x="${tbx + 6}" y="122" width="58" height="4" rx="1" fill="${hsl(180, 30, 60)}"/><rect x="${tbx + 12}" y="118" width="46" height="4" rx="1" fill="${hsl(120, 25, 66)}"/>`;
  const mx = tbx + 76;
  s += `<g>
    <rect x="${mx}" y="114" width="84" height="12" rx="3" fill="${hsl(0, 10, 90)}" stroke="${hsl(0, 12, 36)}" stroke-width="1.4"/>
    <path d="M${mx + 62},114 L${mx + 62},78 Q${mx + 62},70 ${mx + 54},70 L${mx + 14},70 Q${mx + 6},70 ${mx + 6},78 L${mx + 6},96 L${mx + 18},96 L${mx + 18},84 L${mx + 50},84 L${mx + 50},114 Z" fill="${hsl(0, 10, 90)}" stroke="${hsl(0, 12, 36)}" stroke-width="1.4" stroke-linejoin="round"/>
    <rect x="${mx + 9}" y="96" width="6" height="12" fill="${hsl(0, 10, 40)}"/><line x1="${mx + 12}" y1="108" x2="${mx + 12}" y2="114" stroke="${hsl(0, 10, 30)}" stroke-width="1.2"/>
    <circle cx="${mx + 70}" cy="88" r="9" fill="${hsl(0, 10, 82)}" stroke="${hsl(0, 12, 36)}" stroke-width="1.4"/><circle cx="${mx + 70}" cy="88" r="3" fill="${hsl(0, 12, 36)}"/>
    <rect x="${mx + 20}" y="62" width="2.4" height="8" fill="${hsl(0, 10, 36)}"/><rect x="${mx + 15}" y="54" width="12" height="9" rx="2" fill="#f3b61f"/>
    <path d="M${mx + 24},62 C${mx + 30},66 ${mx + 14},84 ${mx + 12},96" fill="none" stroke="#f3b61f" stroke-width="1"/>
    <rect x="${mx + 28}" y="74" width="26" height="4" rx="1.5" fill="${hsl(0, 60, 52)}" opacity=".85"/>
    <path d="M${mx - 26},126 L${mx + 10},122 L${mx + 30},126 Z" fill="${hsl(200, 40, 55)}" opacity=".9"/>
    </g>`;
  // 마네킹 (v2)
  if (v === 2) {
    const dx = T(330);
    s += `<rect x="${dx - 2}" y="120" width="4" height="40" fill="${hsl(0, 10, 30)}"/><path d="M${dx - 18},160 L${dx + 18},160" stroke="${hsl(0, 10, 30)}" stroke-width="3" stroke-linecap="round"/>
      <path d="M${dx - 4},52 L${dx + 4},52 L${dx + 20},62 Q${dx + 22},86 ${dx + 14},96 Q${dx + 18},110 ${dx + 16},122 L${dx - 16},122 Q${dx - 18},110 ${dx - 14},96 Q${dx - 22},86 ${dx - 20},62 Z" fill="hsl(30,28%,72%)" stroke="${hsl(0, 10, 40)}" stroke-width="1.2"/>
      <path d="M${dx - 20},62 Q${dx},70 ${dx + 20},62" fill="none" stroke="#f3b61f" stroke-width="3"/>`;
  }
  // 바닥 그림자, 화분
  const px = v === 1 ? T(356) : T(16);
  s += `<path d="M${px - 10},158 L${px + 10},158 L${px + 8},140 L${px - 8},140 Z" fill="hsl(18,40%,46%)"/>
    <path d="M${px},140 q-14,-12 -10,-30 q8,8 10,30 q2,-24 12,-32 q2,18 -12,32" fill="hsl(${(h + 120) % 360},28%,42%)"/>`;
  return svg('0 0 390 200', s, 'preserveAspectRatio="xMidYMid slice" role="img" aria-label="수선집 내부 그림"', 'hidden');
}

// ───────────────────────── 8. 로고 ─────────────────────────
export function logo(size = 28) {
  return svg('0 0 32 32', `
    <path d="M6.6,25.8 L22.6,6.6 Q24.6,4.4 26.4,5.6 Q27.8,7 25.8,9.2 L9.6,28 Q8.4,29.2 7,28.2 Q5.6,27.2 6.6,25.8 Z" fill="var(--indigo)"/>
    <path d="M21.8,8.6 L24.4,6.2" stroke="var(--surface)" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M23.2,7.3 C29.6,9 30,16.4 23.4,18.6 C17.6,20.6 12.4,19 8.8,21.6 C6.4,23.4 4.4,26.2 2.6,29" fill="none" stroke="var(--tape)" stroke-width="2.1" stroke-linecap="round"/>`,
    `width="${size}" height="${size}" role="img" aria-label="옷라인"`);
}
