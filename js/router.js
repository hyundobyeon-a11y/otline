// #해시 라우팅과 화면 전환. 화면은 screen(name, {render, mount, tab, explain}) 으로 등록
import { ic } from './ui.js';
import { unreadAlerts, activeOrders } from './store.js';

const defs = {};
const stack = [];
let appEl, onRoute = () => {};
// 탭 바 아이콘: iOS 탭 바처럼 꽉 찬 모양(house.fill, heart.fill, list.clipboard.fill, person.crop.circle.fill 비슷하게)
const TAB_SVG = {
  home: '<path d="M12.7 3.3a1.1 1.1 0 0 0-1.4 0L2.9 10.4a1 1 0 0 0 1.3 1.6l.5-.4v7.6A2.3 2.3 0 0 0 7 21.5h3v-5a2 2 0 0 1 4 0v5h3a2.3 2.3 0 0 0 2.3-2.3v-7.6l.5.4a1 1 0 0 0 1.3-1.6Z"/>',
  likes: '<path d="M12 21.2s-7.6-4.6-9.6-9.3C.9 8.5 2.9 4.4 6.8 4.4c2.2 0 3.7 1.2 5.2 3.1 1.5-1.9 3-3.1 5.2-3.1 3.9 0 5.9 4.1 4.4 7.5-2 4.7-9.6 9.3-9.6 9.3Z"/>',
  orders: '<path fill-rule="evenodd" d="M9.2 2.4h5.6a1.6 1.6 0 0 1 1.6 1.4h1.4A2.2 2.2 0 0 1 20 6v13.4a2.2 2.2 0 0 1-2.2 2.2H6.2A2.2 2.2 0 0 1 4 19.4V6a2.2 2.2 0 0 1 2.2-2.2h1.4a1.6 1.6 0 0 1 1.6-1.4ZM8 9.6a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2Zm0 4.2a1 1 0 1 0 0 2h5.2a1 1 0 1 0 0-2Z"/>',
  my: '<path fill-rule="evenodd" d="M12 1.8a10.2 10.2 0 1 0 0 20.4 10.2 10.2 0 0 0 0-20.4Zm0 4.4a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0 14a8.2 8.2 0 0 1-6.3-3c1.3-1.8 3.6-2.9 6.3-2.9s5 1.1 6.3 2.9a8.2 8.2 0 0 1-6.3 3Z"/>',
};
const TABS = [
  { id: 'home', t: '홈' },
  { id: 'likes', t: '좋아요' },
  { id: 'orders', t: '요청 내역' },
  { id: 'my', t: 'MY 옷라인' },
];
let lastTab = null;
export const screen = (name, def) => { defs[name] = def; };
export const current = () => stack[stack.length - 1];
export const defOf = n => defs[n];
export const stackNames = () => stack.map(e => e.name);

function parse(h) {
  h = (h || '').replace(/^#/, '');
  if (!h) return { name: 'home' };
  if (defs[h]) return { name: h };
  const i = h.lastIndexOf('-');
  if (i > 0 && defs[h.slice(0, i)]) return { name: h.slice(0, i), param: h.slice(i + 1) };
  return { name: 'home' };
}
const hashOf = e => '#' + e.name + (e.param ? '-' + e.param : '');

function tabbar(active) {
  const n = activeOrders().length;
  const to = Math.max(0, TABS.findIndex(t => t.id === active));
  const from = lastTab == null ? to : lastTab;
  lastTab = to;
  return `<nav class="tabbar" aria-label="메뉴"><i class="pill" style="--from:${from};--to:${to}"></i>${TABS.map(t => `<button data-tab="${t.id}" class="${t.id === active ? 'on' : ''}" aria-current="${t.id === active ? 'page' : 'false'}">
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${TAB_SVG[t.id]}</svg><span>${t.t}</span>${t.id === 'orders' && n ? `<span class="badge">${n}</span>` : ''}</button>`).join('')}</nav>`;
}

function build(entry) {
  const def = defs[entry.name];
  const v = document.createElement('section');
  v.className = 'view';
  v.dataset.screen = entry.name;
  v.innerHTML = def.render(entry.param) + (def.tab ? tabbar(def.tab) : '');
  wire(v);
  entry.el = v;
  entry.cleanup = def.mount ? def.mount(v, entry.param) : null;
  // 큰 제목: 내용 맨 위에 붙이고, 그 제목이 바 밑으로 지나가면 가운데 작은 제목을 켬
  const c = v.querySelector('.content'), bar = v.querySelector('.appbar');
  const large = bar && bar.classList.contains('large');
  if (c && large) c.insertAdjacentHTML('afterbegin', `<h1 class="large-title">${bar.querySelector('h1').innerHTML}</h1>`);
  if (c && bar) c.addEventListener('scroll', () => bar.classList.toggle('scrolled', c.scrollTop > (large ? 36 : 4)), { passive: true });
  return v;
}
function wire(root) {
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-back],[data-go],[data-tab]');
    if (!b || !root.contains(b)) return;
    if (b.hasAttribute('data-back')) { e.preventDefault(); back(); }
    else if (b.dataset.tab) { e.preventDefault(); tab(b.dataset.tab); }
    else if (b.dataset.go) { e.preventDefault(); go(b.dataset.go, b.dataset.p); }
  });
}
function teardown(entry) {
  if (entry.cleanup) { try { entry.cleanup(); } catch (e) { console.warn(e); } entry.cleanup = null; }
}
function show(entry, anim, leaving) {
  const v = build(entry);
  appEl.appendChild(v);
  const sc = v.querySelector('.content');
  if (sc && entry.scroll) sc.scrollTop = entry.scroll;
  if (leaving) {
    const old = leaving.el;
    if (anim === 'push') { v.classList.add('enter-push'); old.classList.add('leave-push'); }
    else if (anim === 'pop') { v.classList.add('enter-pop'); old.classList.add('leave-pop'); appEl.appendChild(old); }
    else v.classList.add('enter-fade');
    setTimeout(() => old.remove(), anim ? 330 : 0);
  }
  setTimeout(() => v.classList.remove('enter-push', 'enter-pop', 'enter-fade'), 340);
  try { history.replaceState(null, '', hashOf(entry)); } catch (e) {}
  onRoute(entry);
}
function leave(entry) {
  if (!entry) return;
  const sc = entry.el && entry.el.querySelector('.content');
  entry.scroll = sc ? sc.scrollTop : 0;
  teardown(entry);
}

export function go(name, param, { replace = false } = {}) {
  if (!defs[name]) { console.warn('no screen', name); return; }
  const prev = current();
  leave(prev);
  const entry = { name, param };
  if (replace) stack.pop();
  stack.push(entry);
  show(entry, 'push', prev);
}
export function back(fallback = 'home') {
  const prev = current();
  if (stack.length <= 1) { if (prev && prev.name !== fallback) { leave(prev); stack.length = 0; const e = { name: fallback }; stack.push(e); show(e, 'pop', prev); } return; }
  leave(prev); stack.pop();
  show(current(), 'pop', prev);
}
// 몇 단계 위 화면까지 한꺼번에 돌아감 (예: 예약 완료 → 요청 내역)
export function backTo(name, param) {
  const prev = current();
  const i = stack.map(e => e.name).lastIndexOf(name);
  leave(prev);
  if (i >= 0) { stack.length = i + 1; }
  else { stack.length = 0; stack.push({ name, param }); }
  show(current(), 'pop', prev);
}
export function tab(name) {
  const prev = current();
  if (prev && prev.name === name && stack.length === 1) { const c = prev.el.querySelector('.content'); c && c.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  leave(prev);
  stack.length = 0;
  const e = { name };
  stack.push(e);
  show(e, null, prev);
}
// 지금 화면을 같은 자리에서 다시 그림 (스크롤 유지, 애니메이션 없음)
export function refresh() {
  const e = current(); if (!e) return;
  const old = e.el, sc = old.querySelector('.content'), top = sc ? sc.scrollTop : 0;
  teardown(e);
  const v = build(e);
  old.replaceWith(v);
  const sc2 = v.querySelector('.content'); if (sc2) sc2.scrollTop = top;
  onRoute(e);
}
// 데스크톱 화면 목록에서 바로 이동: 그 화면이 기대는 앞 화면까지 쌓아줌
export function jump(name, param, parents = []) {
  const prev = current();
  leave(prev);
  stack.length = 0;
  const root = defs[name].tab ? null : (parents[0] || 'home');
  if (root) stack.push({ name: root });
  parents.slice(1).forEach(p => stack.push(typeof p === 'string' ? { name: p } : p));
  const e = { name, param };
  stack.push(e);
  show(e, null, prev);
}
export function start(el, routeHook, initial) {
  appEl = el; onRoute = routeHook || onRoute;
  const p = parse(location.hash);
  const e = initial ? initial(p) : null;
  if (e) { stack.push(...e.stack); }
  else { if (!defs[p.name].tab) stack.push({ name: 'home' }); stack.push(p); }
  show(current(), null, null);
  window.addEventListener('hashchange', () => {
    const q = parse(location.hash), c = current();
    if (c && q.name === c.name && (q.param || '') === (c.param || '')) return;
    go(q.name, q.param);
  });
}
export const badgeCount = () => unreadAlerts();
