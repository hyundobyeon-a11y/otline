// 앱 상태. 보는 사람 브라우저(localStorage)에만 저장. 못 쓰면 메모리로만 돎
import { SHOPS, ITEMS, OPTIONS, CAT_FIELDS, SAMPLE_MEASURE, AREAS, ORDER_STEPS, FEES, REVIEWS, shopOf, itemOf, catOf, pantsLenAtFloor, PANTS_PRESETS, SUB_PRESET } from './data.js';

const KEY = 'otline-app-v4'; // 11/27 바지 기장 이름을 복숭아뼈 기준으로 바꾸며 v4 (옛 저장값의 원브레이크 채팅, 옛 프리셋 id 는 안 읽음)
const listeners = new Set();
const iso = d => d.toISOString();
const daysAgo = (n, h = 14, m = 0) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, m, 0, 0); return iso(d); };
const daysLater = (n, h = 14) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, 0, 0, 0); return iso(d); };

function seed() {
  return {
    v: 2,
    area: 'anam',
    likes: ['s1', 's7'],
    body: { sex: 'M', height: 174, weight: 72, waist: 82, hip: 96, inseam: 79 },
    closet: [
      { id: 'w1', cat: 'pants', sub: '청바지', name: '생지 청바지', m: { len: 100, waistH: 41, hipH: 50, thighH: 31, rise: 30, hemH: 21 } },
      { id: 'w2', cat: 'pants', sub: '슬랙스', name: '검정 슬랙스', m: { len: 105, waistH: 42, hipH: 51, thighH: 30, rise: 29, hemH: 18.5 } },
      { id: 'w3', cat: 'shirt', sub: '드레스 셔츠', name: '흰 드레스 셔츠', m: { ...SAMPLE_MEASURE.M.shirt } },
      { id: 'w4', cat: 'jacket', sub: '코트', name: '네이비 울 코트', m: { len: 98, shoulder: 47, chestH: 57, sleeve: 66 } },
    ],
    draft: null,
    booking: null,
    savedDrafts: [],
    orders: [
      { id: 'o1', no: 'OT-1108-0412', shopId: 's1', createdAt: daysAgo(16, 11, 20), status: 6,
        garments: [{ id: 'g1', cat: 'pants', sub: '청바지', name: '생지 청바지', closetId: 'w1', items: ['hem'],
          m: { len: 106, waistH: 41, hipH: 50, thighH: 31, rise: 30, hemH: 21 }, after: { len: 100, waistH: 41, hipH: 50, thighH: 31, rise: 30, hemH: 21 },
          preset: 'mid', method: 'self', options: { hemFinish: 'original' }, note: '워싱 밑단 그대로 살려주세요', photos: [], damage: { zones: [], types: [] } }],
        booking: { dropoff: 'pickup', date: daysAgo(15, 10), slot: '10-12', address: '서울 성북구 개운사길 50 (가상)', receive: 'delivery', ship: 'normal', pay: 'card' },
        history: [daysAgo(16, 11, 20), daysAgo(16, 11, 42), daysAgo(15, 10, 50), daysAgo(15, 14, 5), daysAgo(15, 17, 30), daysAgo(14, 9, 10), daysAgo(14, 15, 2)],
        chat: [], progressPhotos: 1, reviewed: false, claimed: false },
      { id: 'o2', no: 'OT-1122-0871', shopId: 's1', createdAt: daysAgo(2, 20, 4), status: 3,
        garments: [{ id: 'g2', cat: 'pants', sub: '슬랙스', name: '검정 슬랙스', closetId: 'w2', items: ['hem', 'hemW'],
          m: { len: 110, waistH: 42, hipH: 51, thighH: 30, rise: 29, hemH: 20 }, after: { len: 105, waistH: 42, hipH: 51, thighH: 30, rise: 29, hemH: 18.5 },
          preset: 'heel', method: 'self', options: { hemFinish: 'hand', lining: 'no' }, note: '기존 밑단 마감과 실루엣 유지해 주세요', photos: [], damage: { zones: [], types: [] } }],
        booking: { dropoff: 'pickup', date: daysAgo(1, 14), slot: '14-16', address: '서울 성북구 개운사길 50 (가상)', receive: 'delivery', ship: 'normal', pay: 'card' },
        history: [daysAgo(2, 20, 4), daysAgo(2, 20, 31), daysAgo(1, 15, 12), daysAgo(0, 10, 3)],
        chat: [
          { from: 'sys', t: daysAgo(2, 20, 31), text: '예약이 확정됐어요. 안전한 거래를 위해 연락은 옷라인 채팅으로 해주세요.' },
          { from: 'them', t: daysAgo(1, 15, 20), text: '슬랙스 잘 받았어요. 발뒤꿈치 기준 105cm로 작업할게요!' },
        ], progressPhotos: 0, reviewed: false, claimed: false },
    ],
    myReviews: [],
    claims: [],
    alerts: [
      { id: 'a1', t: daysAgo(0, 10, 3), icon: 'scissors', title: '수선이 시작됐어요', body: '한땀 수선실에서 검정 슬랙스를 수선하고 있어요.', to: 'order-o2', read: false },
      { id: 'a2', t: daysAgo(1, 15, 20), icon: 'message-circle', title: '수선사 메시지', body: '슬랙스 잘 받았어요. 발뒤꿈치 기준 105cm로 작업할게요!', to: 'chat-o2', read: false },
      { id: 'a3', t: daysAgo(13, 9, 0), icon: 'star', title: '수선은 마음에 드셨나요?', body: '생지 청바지 후기를 남기면 다음 수선 때 1,000원 할인돼요.', to: 'review-o1', read: true },
    ],
  };
}

function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw); if (s && s.v === 2) return s; } } catch (e) {}
  return seed();
}
export const state = load();
let saveTimer;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 용량 초과면 사진 빼고 저장 */ try { const s = JSON.parse(JSON.stringify(state)); (s.draft?.garments || []).forEach(g => g.photos = []); s.orders.forEach(o => o.garments.forEach(g => g.photos = [])); localStorage.setItem(KEY, JSON.stringify(s)); } catch (e2) {} } }, 150);
  listeners.forEach(f => f());
}
export const onChange = f => { listeners.add(f); return () => listeners.delete(f); };
export function resetAll() { try { localStorage.removeItem(KEY); } catch (e) {} const s = seed(); Object.keys(state).forEach(k => delete state[k]); Object.assign(state, s); save(); }

export const area = () => AREAS.find(a => a.id === state.area) || AREAS[0];
export const distM = shop => { const a = area().me; return Math.round(Math.hypot(shop.x - a.x, shop.y - a.y) * 2.5 / 10) * 10; };
export const fmtDist = m => m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
export const isLiked = id => state.likes.includes(id);
export function toggleLike(id) { const i = state.likes.indexOf(id); if (i >= 0) state.likes.splice(i, 1); else state.likes.push(id); save(); return i < 0; }

// ───────── 수선 요청서(초안) ─────────
let gid = 0;
export function newGarment(cat = null, from = null) {
  const g = { id: 'g' + Date.now().toString(36) + (gid++), cat, sub: null, name: '', closetId: null, items: [], m: {}, after: {}, preset: null, fitPreset: {},
    method: 'self', options: {}, note: '', photos: [], damage: { zones: [], types: [] }, snapshot: null };
  if (from) { Object.assign(g, { cat: from.cat, sub: from.sub, name: from.name, closetId: from.id, m: { ...from.m } }); }
  else if (cat) g.m = { ...SAMPLE_MEASURE[state.body.sex][cat] };
  return g;
}
export function startDraft(opts = {}) {
  const g = newGarment(opts.cat || null, opts.from || null);
  if (opts.items) g.items = [...opts.items];
  state.draft = { garments: [g], cur: 0 };
  state.booking = null;
  save();
  return g;
}
export function addGarment() { const g = newGarment(); state.draft.garments.push(g); state.draft.cur = state.draft.garments.length - 1; save(); return g; }
export const curG = () => state.draft && state.draft.garments[state.draft.cur];
export function setCat(g, cat) {
  if (g.cat === cat) return;
  g.cat = cat; g.sub = catOf(cat).subs[0]; g.items = []; g.closetId = null; g.m = { ...SAMPLE_MEASURE[state.body.sex][cat] }; g.after = {}; g.options = {}; g.damage = { zones: [], types: [] };
}
export const fitItems = g => g.items.map(id => itemOf(g.cat, id)).filter(i => i && i.group === 'fit');
export const repairItems = g => g.items.map(id => itemOf(g.cat, id)).filter(i => i && i.group === 'repair');
export const hasFit = g => fitItems(g).length > 0;
export const hasRepair = g => repairItems(g).length > 0;

// 핏 단계에 들어갈 때 after 기본값을 채움
export function initAfter(g) {
  const a = { ...g.m, ...g.after };
  const fit = fitItems(g).map(i => i.id);
  if (g.cat === 'pants') {
    if (fit.includes('hem') && (g.after.len == null)) { const p = PANTS_PRESETS.find(x => x.id === (g.preset || SUB_PRESET[g.sub] || 'mid')); g.preset = p.id; a.len = Math.min(g.m.len, pantsLenAtFloor(state.body, g.m, p.floor)); }
    if ((fit.includes('hemW') || fit.includes('taper')) && g.after.hemH == null) a.hemH = Math.max(13, g.m.hemH - 2);
    if (fit.includes('taper') && g.after.thighH == null) a.thighH = Math.max(18, g.m.thighH - 2);
    if (fit.includes('waistIn') && g.after.waistH == null) a.waistH = g.m.waistH - 1.5;
    if (fit.includes('waistOut') && g.after.waistH == null) a.waistH = g.m.waistH + 1.5;
  }
  // 바뀌지 않는 칸은 원래 값으로 되돌림
  const changeable = new Set(fitItems(g).flatMap(i => i.changes || []));
  Object.keys(a).forEach(k => { if (!changeable.has(k)) a[k] = g.m[k]; });
  g.after = a;
}
export function changes(g) {
  return (CAT_FIELDS[g.cat] || []).filter(f => g.after[f] != null && Math.abs(g.after[f] - g.m[f]) >= 0.25).map(f => ({ f, from: g.m[f], to: g.after[f], d: g.after[f] - g.m[f] }));
}
export function applicableOptions(g) {
  return OPTIONS.filter(o => o.cats.includes(g.cat) && o.when.some(w => g.items.includes(w)));
}
export function garmentLines(g, shop = null) {
  const lines = [];
  for (const id of g.items) {
    const it = itemOf(g.cat, id); if (!it) continue;
    const mk = shop ? (shop.markup[it.group] || 0) : 0;
    lines.push({ t: it.name, std: it.price, mk, p: it.price + mk });
  }
  for (const o of applicableOptions(g)) {
    const v = g.options[o.id]; const c = o.choices.find(x => x.v === v);
    if (c && c.add) lines.push({ t: c.t, std: c.add, mk: 0, p: c.add, extra: true });
  }
  return lines;
}
export function quote(garments, shop = null, bk = null) {
  let std = 0, mk = 0;
  const per = garments.map(g => { const ls = garmentLines(g, shop); const s = ls.reduce((a, l) => a + l.std, 0), m = ls.reduce((a, l) => a + l.mk, 0); std += s; mk += m; return { g, lines: ls, sum: s + m }; });
  const work = std + mk;
  const bundle = garments.length >= 2 ? Math.round(work * FEES.bundleRate / 100) * 100 : 0;
  const isFirstAtShop = shop && shop.newDiscount && !state.orders.some(o => o.shopId === shop.id);
  const newDisc = isFirstAtShop ? Math.round(work * shop.newDiscount / 100) * 100 : 0;
  let pickup = 0, ship = 0;
  if (bk) {
    if (bk.dropoff === 'pickup') pickup = garments.length >= 2 ? 0 : FEES.pickup;
    if (bk.receive === 'delivery') ship = FEES.ship[bk.ship || 'normal'];
  }
  return { per, std, mk, work, bundle, newDisc, pickup, pickupFree: bk && bk.dropoff === 'pickup' && garments.length >= 2, ship, total: work - bundle - newDisc + pickup + ship };
}

// ───────── 수선집 추천 ─────────
export function rankShops(garments, sort = 'rec', filters = {}) {
  const cats = new Set(garments.map(g => g.cat).filter(Boolean));
  let list = SHOPS.map(s => ({ s, d: distM(s), q: garments.length ? quote(garments, s).work : 0 }));
  if (filters.pickup) list = list.filter(x => x.s.pickup);
  if (filters.today) list = list.filter(x => x.s.today);
  if (filters.spec) list = list.filter(x => x.s.spec.some(c => cats.has(c)));
  const minQ = Math.min(...list.map(x => x.q || Infinity)), minD = Math.min(...list.map(x => x.d));
  for (const x of list) {
    const spec = x.s.spec.some(c => cats.has(c));
    x.spec = spec;
    x.score = (x.s.rating / 5) * 30 + (1 - Math.min(x.d, 2000) / 2000) * 25 + (x.q ? (minQ / x.q) * 25 : 12) + (spec ? 20 : 6) + (x.s.isNew ? 5 : 0);
    x.why = [];
    if (spec) x.why.push(catOf([...cats].find(c => x.s.spec.includes(c))).name + ' 수선 전문');
    if (x.d === minD) x.why.push('가장 가까움');
    if (x.q && x.q === minQ) x.why.push('가장 저렴');
    if (x.s.lead === 1) x.why.push('내일 완료');
    if (x.s.isNew) x.why.push('이번 주 입점');
  }
  const by = { rec: (a, b) => b.score - a.score, dist: (a, b) => a.d - b.d, price: (a, b) => a.q - b.q, review: (a, b) => b.s.reviews - a.s.reviews, rating: (a, b) => b.s.rating - a.s.rating };
  return list.sort(by[sort] || by.rec);
}
export function shopReviews(id) {
  const mine = state.myReviews.filter(r => r.shopId === id).map(r => ({ ...r, mine: true }));
  return [...mine, ...(REVIEWS[id] || [])];
}
export function shopRating(s) {
  const mine = state.myReviews.filter(r => r.shopId === s.id);
  if (!mine.length) return { r: s.rating, n: s.reviews };
  const n = s.reviews + mine.length; return { r: (s.rating * s.reviews + mine.reduce((a, x) => a + x.star, 0)) / n, n };
}
export function isOpen(s, d = new Date()) {
  if (s.closed.includes(d.getDay())) return false;
  const h = d.getHours() + d.getMinutes() / 60; return h >= s.hours[0] && h < s.hours[1];
}

// ───────── 주문 ─────────
export function addWorkDays(date, n, closed = [0]) {
  const d = new Date(date); let k = 0;
  while (k < n) { d.setDate(d.getDate() + 1); if (!closed.includes(d.getDay())) k++; }
  return d;
}
export function schedule(bk, shop) {
  const start = new Date(bk.date);
  const done = addWorkDays(start, shop.lead, shop.closed);
  const recv = bk.receive === 'delivery' ? addWorkDays(done, bk.ship === 'fast' ? 0 : 1, [0]) : done;
  return { start, done, recv: bk.receive === 'delivery' && bk.ship === 'fast' ? done : recv };
}
export function placeOrder() {
  const d = state.draft, bk = state.booking, shop = shopOf(bk.shopId);
  const n = state.orders.length + 1;
  const now = new Date();
  const no = `OT-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(1000 + Math.floor(Math.random() * 8999))}`;
  const o = { id: 'o' + (Date.now() % 100000), no, shopId: shop.id, createdAt: iso(now), status: 0, garments: JSON.parse(JSON.stringify(d.garments)), booking: { ...bk },
    history: [iso(now)], chat: [{ from: 'sys', t: iso(now), text: `${shop.name}에 예약을 요청했어요. 수선사가 요청서를 확인하면 알려드릴게요.` }], progressPhotos: 0, reviewed: false, claimed: false, quote: quote(d.garments, shop, bk) };
  // 옷 치수를 내 옷장에 남겨서 다음에 바로 다시 맡길 수 있게 함
  for (const g of o.garments) {
    if (g.closetId) { const w = state.closet.find(x => x.id === g.closetId); if (w) w.m = { ...g.after }; }
    else { const id = 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); state.closet.unshift({ id, cat: g.cat, sub: g.sub, name: g.name || `${g.sub || catOf(g.cat).name}`, m: { ...(Object.keys(g.after).length ? g.after : g.m) } }); g.closetId = id; }
  }
  state.orders.unshift(o);
  state.alerts.unshift({ id: 'a' + Date.now(), t: iso(now), icon: 'calendar-check', title: '예약을 요청했어요', body: `${shop.name}, ${o.garments.length}벌`, to: 'order-' + o.id, read: false });
  state.draft = null; state.booking = null;
  save();
  return o;
}
const STEP_MSG = {
  1: (s) => ({ them: '요청서 확인했어요. 말씀하신 치수대로 작업 가능해요. 예약 확정할게요!' }),
  2: (s, o) => ({ sys: o.booking.dropoff === 'pickup' ? '옷을 수거해서 수선집에 맡겼어요.' : '수선집에 옷을 맡기셨어요.' }),
  3: () => ({ them: '지금 작업 시작합니다. 진행 사진이 필요하면 말씀 주세요.' }),
  4: () => ({ them: '수선 끝났어요. 요청하신 치수 다시 재봤는데 딱 맞아요.' }),
  5: () => ({ sys: '옷이 배송을 시작했어요.' }),
  6: () => ({ sys: '수령을 확인했어요. 안심결제 금액이 수선사에게 정산돼요.' }),
};
export const orderSteps = o => o.booking.receive === 'delivery' ? ORDER_STEPS : ORDER_STEPS.map(s => s.id === 'shipping' ? { id: 'shipping', t: '수령 대기', d: '매장에서 옷을 찾아가세요' } : s);
export function advance(o) {
  if (o.status >= 6) return;
  o.status++;
  const now = new Date(); o.history[o.status] = iso(now);
  const shop = shopOf(o.shopId);
  const m = STEP_MSG[o.status](shop, o);
  if (m.them) o.chat.push({ from: 'them', t: iso(now), text: m.them });
  if (m.sys) o.chat.push({ from: 'sys', t: iso(now), text: m.sys });
  const st = orderSteps(o)[o.status];
  state.alerts.unshift({ id: 'a' + Date.now(), t: iso(now), icon: o.status === 6 ? 'package-check' : 'bell', title: st.t, body: `${shop.name}: ${st.d}`, to: 'order-' + o.id, read: false });
  save();
}
export const activeOrders = () => state.orders.filter(o => o.status < 6 && !o.canceled);
export const doneOrders = () => state.orders.filter(o => o.status >= 6);
export const unreadAlerts = () => state.alerts.filter(a => !a.read).length;

// 수선사 자동 답장 (데모)
export function tailorReply(text) {
  if (/\d{2,3}[- ]?\d{3,4}[- ]?\d{4}|카톡|카카오|연락처|번호/.test(text)) return '연락은 옷라인 채팅으로 드릴게요. 앱 밖에서 거래하면 안심결제와 재수선 보장을 받으실 수 없어요.';
  if (/언제|며칠|완료|끝나/.test(text)) return '내일 오후 중으로 끝날 것 같아요. 끝나면 바로 알려드릴게요.';
  if (/사진/.test(text)) return '네, 작업 중인 사진 찍어서 보내드릴게요!';
  if (/가격|얼마|추가/.test(text)) return '요청서 금액에서 추가되는 건 없어요. 혹시 생기면 작업 전에 먼저 여쭤볼게요.';
  if (/감사|고맙/.test(text)) return '감사합니다. 예쁘게 해드릴게요!';
  return '네, 확인했어요. 말씀하신 대로 반영할게요.';
}
