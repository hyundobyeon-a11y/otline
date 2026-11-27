import { screen, go, refresh } from '../router.js';
import { ic, esc, stars, sheet, toast, appbar } from '../ui.js';
import { state, save, area, distM, fmtDist, isLiked, toggleLike, startDraft, activeOrders, orderSteps, unreadAlerts, shopRating, isOpen } from '../store.js';
import { SHOPS, AREAS, ITEMS, CATEGORIES, OPTIONS, DEMO_NOTE, PRICE_SRC, PANTS_HEM_COMBO, priceOf, catOf, shopOf, won } from '../data.js';
export const demoNote = () => `<p class="demo-note">${ic('info', 'ic-16')}<span>${DEMO_NOTE}</span></p>`;
import { catIcon, shopHero } from '../garments.js';
import { createMap } from '../map.js';

const thumb = s => shopHero(s);
export function shopRow(s, { showPrice = true } = {}) {
  const r = shopRating(s), d = distM(s);
  const cat = s.spec[0], it = ITEMS[cat][0];
  return `<div class="shop" data-shop="${s.id}" role="button" tabindex="0">
    <div class="thumb">${thumb(s)}</div>
    <div class="info">
      <div class="row between"><span class="nm">${esc(s.name)}${s.isNew ? '<span class="tag yellow">NEW</span>' : ''}</span>
        <button class="heart${isLiked(s.id) ? ' on' : ''}" data-like="${s.id}" aria-label="좋아요" aria-pressed="${isLiked(s.id)}">${ic('heart')}</button></div>
      <div class="dotsep">${stars(r.r, r.n)}<span>${fmtDist(d)}</span><span>${s.lead === 1 ? '내일 완료' : `${s.lead}일 소요`}</span><span class="${isOpen(s) ? 'open' : 'closed'}">${isOpen(s) ? '영업 중' : '영업 종료'}</span></div>
      ${showPrice ? `<div class="pr">${catOf(cat).name} ${it.name} <b>${won(it.price + s.markup.fit)}</b>~</div>` : ''}
      <div class="tags">${s.tags.slice(0, 3).map(t => `<span class="tag${/할인|입점/.test(t) ? ' chalk' : /픽업/.test(t) ? ' indigo' : ''}">${esc(t)}</span>`).join('')}${s.selfDelivery ? '<span class="tag ok">가게 직접 배달</span>' : ''}</div>
    </div></div>`;
}
export function wireShopRows(root, onChange) {
  root.addEventListener('click', e => {
    const lk = e.target.closest('[data-like]');
    if (lk) { e.stopPropagation(); const on = toggleLike(lk.dataset.like); lk.classList.toggle('on', on); lk.setAttribute('aria-pressed', on); toast(on ? '좋아요에 담았어요' : '좋아요에서 뺐어요', on ? 'heart' : 'heart-off'); onChange && onChange(); return; }
    const row = e.target.closest('[data-shop]');
    if (row) go('shop', row.dataset.shop);
  });
  root.addEventListener('keydown', e => { const row = e.target.closest('[data-shop]'); if (row && e.key === 'Enter') go('shop', row.dataset.shop); });
}

const QUICK = [
  { cat: 'pants', items: ['hem'], t: '바지 기장' },
  { cat: 'shirt', items: ['sleeve'], t: '셔츠 소매' },
  { cat: 'skirt', items: ['hem'], t: '치마 기장' },
  { cat: 'pants', items: ['zipper'], t: '지퍼 교체', repair: true },
];
let homeSort = 'dist', homeFilter = {};

screen('home', {
  tab: 'home',
  render() {
    const a = area(), act = activeOrders()[0];
    let list = SHOPS.map(s => ({ s, d: distM(s), r: shopRating(s) }));
    if (homeFilter.pickup) list = list.filter(x => x.s.pickup);
    if (homeFilter.today) list = list.filter(x => x.s.today);
    list.sort({ dist: (a, b) => a.d - b.d, rating: (a, b) => b.r.r - a.r.r, review: (a, b) => b.r.n - a.r.n }[homeSort]);
    const n = unreadAlerts();
    const newShop = SHOPS.find(s => s.isNew);
    return `
    <header class="homebar">
      <button class="loc" data-area>${esc(a.name)} ${ic('chevron-down')}</button>
      <span class="sp"></span>
      <button class="ib" data-go="search" aria-label="검색">${ic('search', 'ic-24')}</button>
      <button class="ib" data-go="alerts" aria-label="알림">${ic('bell', 'ic-24')}${n ? '<span class="dot"></span>' : ''}</button>
    </header>
    <main class="content">
      <button class="hero-cta" data-start>
        <span class="tape-strip"></span>
        <span class="k">${ic('sparkles', 'ic-16')} AI FIT ASSISTANT</span>
        <h2>수선 맡기기 전에<br>미리 입어보세요</h2>
        <p>실측 사이즈만 넣으면 수선 후 핏을 보여주고 요청서를 만들어 드려요</p>
        <span class="go">수선 맡기기 ${ic('arrow-right', 'ic-16')}</span>
        <svg class="art" viewBox="0 0 150 150" aria-hidden="true">
          <circle cx="92" cy="92" r="62" fill="rgba(255,255,255,.07)"/><circle cx="92" cy="92" r="62" fill="none" stroke="rgba(243,182,31,.7)" stroke-width="1.5" stroke-dasharray="4 5"/>
          <g style="color:#fff">${catIcon('pants').replace('<svg ', '<svg x="44" y="40" width="96" height="96" ')}</g>
        </svg>
      </button>

      ${act ? (() => { const sh = shopOf(act.shopId), st = orderSteps(act); return `
      <button class="order" data-go="order" data-p="${act.id}" style="border:0;text-align:left;width:100%">
        <div class="top"><span class="st working">${ic('scissors', 'ic-16')} ${st[act.status].t}</span><span>${esc(sh.name)}</span></div>
        <div class="bar" style="--n:${st.length}">${st.map((_, i) => `<i class="${i <= act.status ? 'on' : ''}"></i>`).join('')}</div>
        <div class="row between small"><span class="sub">${esc(act.garments.map(g => g.name || g.sub).join(', '))}</span><span class="link strong">진행 상황 ${ic('chevron-right', 'ic-16')}</span></div>
      </button>`; })() : ''}

      <section class="quick" aria-label="자주 맡기는 수선">
        ${QUICK.map((q, i) => `<button data-quick="${i}"><span class="gi">${catIcon(q.cat)}</span>${q.t}</button>`).join('')}
      </section>
      <button class="notice tap" data-go="prices">${ic('receipt')}<span class="grow"><b style="color:var(--ink)">수선 가격표</b> 바지 기장 ${won(ITEMS.pants[0].price)}부터, 맡기기 전에 값을 먼저 봐요</span>${ic('chevron-right', 'ic-16')}</button>

      <section class="sec">
        <div class="sec-h"><h2>내 주변 수선집</h2><span class="muted small">${esc(a.full)}</span></div>
        ${demoNote()}
        <div class="mapbox" id="homeMap"></div>
        <div class="chips">
          ${[['dist', '거리순'], ['rating', '별점순'], ['review', '리뷰 많은 순']].map(([k, t]) => `<button class="chip" data-sort="${k}" aria-pressed="${homeSort === k}">${t}</button>`).join('')}
          <button class="chip filter" data-f="pickup" aria-pressed="${!!homeFilter.pickup}">${ic('truck')}픽업 가능</button>
          <button class="chip filter" data-f="today" aria-pressed="${!!homeFilter.today}">${ic('clock-3')}오늘 접수</button>
        </div>
        <div class="list" id="homeList">${list.map(x => shopRow(x.s)).join('') || '<div class="empty">조건에 맞는 수선집이 없어요</div>'}</div>
      </section>

      ${newShop ? `<section class="sec">
        <div class="sec-h"><h2>이번 주 새로 들어온 수선집</h2></div>
        <button class="card" data-shop="${newShop.id}" style="border:0;text-align:left;display:flex;gap:14px;align-items:center;width:100%">
          <span style="width:64px;height:64px;border-radius:16px;overflow:hidden;flex:none">${thumb(newShop)}</span>
          <span class="grow" style="display:flex;flex-direction:column;gap:4px"><b>${esc(newShop.name)}</b><span class="small sub">${esc(newShop.intro)}</span>
          <span class="row"><span class="tag chalk">첫 주문 10% 할인</span><span class="tag">${fmtDist(distM(newShop))}</span></span></span>
        </button>
        <p class="note">인기 수선집에만 주문이 몰리지 않게, 새로 입점한 곳을 함께 보여드려요.</p>
      </section>` : ''}

      <section class="sec">
        <div class="sec-h"><h2>내 옷장에서 다시 맡기기</h2><button class="link" data-go="closet">전체 ${ic('chevron-right', 'ic-16')}</button></div>
        <div class="chips">${state.closet.slice(0, 6).map(w => `<button class="chip" data-closet="${w.id}"><span style="width:18px;height:18px;display:inline-flex;color:var(--indigo)">${catIcon(w.cat)}</span>${esc(w.name)}</button>`).join('')}</div>
      </section>
    </main>`;
  },
  mount(el) {
    const a = area();
    const map = createMap(el.querySelector('#homeMap'), { view: 900, // 실제 가게라 1km 안팎으로 퍼져 있어 넓게 보여줌
      me: a.me, shops: SHOPS.map(s => ({ id: s.id, x: s.x, y: s.y, name: s.name, isNew: s.isNew })),
      onPin: id => {
        const box = el.querySelector('#homeMap'); box.querySelector('.map-pop')?.remove();
        if (!id) return;
        const s = shopOf(id), r = shopRating(s);
        const pop = document.createElement('button'); pop.className = 'map-pop'; pop.dataset.shop = id;
        pop.innerHTML = `<span style="width:48px;height:48px;border-radius:12px;overflow:hidden;flex:none">${thumb(s)}</span><span class="grow" style="display:flex;flex-direction:column;gap:2px"><b>${esc(s.name)}</b><span class="dotsep">${stars(r.r, r.n)}<span>${fmtDist(distM(s))}</span></span></span>${ic('chevron-right')}`;
        box.appendChild(pop);
      },
    });
    wireShopRows(el);
    el.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.hasAttribute('data-start')) { startDraft(); go('req-cat'); }
      else if (t.dataset.quick != null) { const q = QUICK[+t.dataset.quick]; startDraft({ cat: q.cat, items: q.items }); state.draft.garments[0].sub = catOf(q.cat).subs[q.cat === 'pants' && !q.repair ? 1 : 0]; save(); go('req-items'); }
      else if (t.dataset.sort) { homeSort = t.dataset.sort; refresh(); }
      else if (t.dataset.f) { homeFilter[t.dataset.f] = !homeFilter[t.dataset.f]; refresh(); }
      else if (t.dataset.closet) { const w = state.closet.find(x => x.id === t.dataset.closet); startDraft({ from: w }); go('req-items'); }
      else if (t.hasAttribute('data-area')) areaSheet();
    });
    return () => map.destroy();
  },
});

function areaSheet() {
  sheet(`<h3>동네 설정</h3><div class="body"><p class="small sub">설정한 동네를 기준으로 가까운 수선집을 보여드려요.</p>
    <div class="opts">${AREAS.map(a => `<button class="opt" data-a="${a.id}" aria-pressed="${state.area === a.id}"><span class="ico">${ic('map-pin')}</span><span><b>${a.name}</b><small>${a.full}</small></span><span class="radio"></span></button>`).join('')}</div></div>
    <button class="btn line" data-close>닫기</button>`, (sh, close) => {
    sh.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b) return; state.area = b.dataset.a; save(); close(); setTimeout(refresh, 200); toast(`${AREAS.find(a => a.id === b.dataset.a).name} 기준으로 바꿨어요`, 'map-pin'); });
  });
}

// ───────── 검색 ─────────
let q = '';
// ───────── 수선 가격표 (11/27, 모두의수선 공식 가격표를 옷라인 표준가로 씀) ─────────
const PRICE_TABS = [['pants', '바지'], ['jeans', '청바지'], ['skirt', '치마'], ['tee', '티셔츠/맨투맨'], ['shirt', '셔츠/블라우스'], ['dress', '원피스'], ['jacket', '재킷/코트']];
let priceTab = 'pants';
screen('prices', {
  render() {
    const cat = priceTab === 'jeans' ? 'pants' : priceTab, sub = priceTab === 'jeans' ? '청바지' : null;
    // 작은 글씨 = 그 표의 항목 이름 (코트처럼 다른 값은 ref 에 같이 적혀 있음)
    const row = it => `<button class="opt" data-item="${cat}:${it.id}"><span><b>${esc(it.name)}</b><small>${it.src === 'm' ? esc(it.ref) : it.src === 'news' ? '수선업 기사 근거 (5만~8만원 하단)' : '옷라인 예시 가격'}</small></span><span class="add">${won(priceOf(it, sub))}~</span></button>`;
    const opts = OPTIONS.filter(o => o.cats.includes(cat)).flatMap(o => o.choices.filter(c => c.add).map(c => ({ q: o.q, ...c })));
    return `${appbar('수선 가격표')}
    <main class="content">
      <div class="qhead"><h2>옷라인 표준 가격표</h2><p>수선집마다 추가금이 조금씩 붙을 수 있어요. 최종 금액은 수선사가 옷을 본 뒤 정해져요</p></div>
      <div class="chips">${PRICE_TABS.map(([k, t]) => `<button class="chip" data-ptab="${k}" aria-pressed="${priceTab === k}">${t}</button>`).join('')}</div>
      <section class="sec"><div class="group-h">${ic('ruler', 'ic-16')}핏, 사이즈 수선 <small>누르면 바로 요청서를 만들어요</small></div>
        <div class="opts plist">${ITEMS[cat].filter(i => i.group === 'fit').map(row).join('')}</div>
        ${cat === 'pants' ? `<p class="note">${ic('info', 'ic-16')} 기장과 밑단 통을 같이 하면 ${PANTS_HEM_COMBO.name} ${won(priceOf(PANTS_HEM_COMBO, sub))}이에요.</p>` : ''}</section>
      <section class="sec"><div class="group-h">${ic('wrench', 'ic-16')}기타 수선, 손상 복원</div>
        <div class="opts plist">${ITEMS[cat].filter(i => i.group === 'repair').map(row).join('')}</div></section>
      ${opts.length ? `<section class="sec"><div class="group-h">${ic('plus', 'ic-16')}추가 옵션 <small>세부 요청에서 고르면 붙어요</small></div>
        <div class="opts">${opts.map(o => `<div class="opt" style="cursor:default"><span><b>${esc(o.t)}</b><small>${esc(o.q)}</small></span><span class="add">+${won(o.add)}</span></div>`).join('')}</div></section>` : ''}
      <p class="note">${ic('book-open', 'ic-16')} 가격 근거: ${esc(PRICE_SRC)}. '옷라인 예시 가격'이라고 적힌 항목은 그 표에 없어서 정한 예시예요.</p>
    </main>`;
  },
  mount(el) {
    el.addEventListener('click', e => {
      const t = e.target.closest('[data-ptab]'); if (t) { priceTab = t.dataset.ptab; refresh(); return; }
      const it = e.target.closest('[data-item]'); if (!it) return;
      const [cat, id] = it.dataset.item.split(':');
      const g = startDraft({ cat, items: [id] }); g.sub = priceTab === 'jeans' ? '청바지' : catOf(cat).subs[0]; save();
      go('req-items');
    });
  },
});

screen('search', {
  render() {
    return `<header class="appbar" style="grid-template-columns:48px 1fr 8px">
      <button class="ib" data-back aria-label="뒤로">${ic('chevron-left', 'ic-24')}</button>
      <label class="search" style="height:42px"><span>${ic('search', 'ic-16')}</span><input id="q" type="search" placeholder="수선집 이름이나 수선 항목" value="${esc(q)}" autocomplete="off"></label><span></span></header>
      <main class="content" id="res"></main>`;
  },
  mount(el) {
    const inp = el.querySelector('#q'), res = el.querySelector('#res');
    const draw = () => {
      q = inp.value.trim();
      if (!q) {
        res.innerHTML = `<section class="sec"><div class="sec-h"><h3>많이 찾는 수선</h3></div><div class="chips wrap">${['바지 기장', '허리 줄임', '소매 기장', '지퍼 교체', '원피스 기장', '안감 교체', '단추'].map(t => `<button class="chip" data-q="${t}">${t}</button>`).join('')}</div></section>
          <section class="sec"><div class="sec-h"><h3>가까운 수선집</h3></div>${demoNote()}${SHOPS.slice().sort((a, b) => distM(a) - distM(b)).slice(0, 3).map(s => shopRow(s)).join('')}</section>`;
        return;
      }
      const words = q.split(/\s+/);
      const hit = t => words.every(w => t.includes(w));
      const shops = SHOPS.filter(s => hit(s.name + s.tags.join(' ') + s.intro + s.spec.map(c => catOf(c).name).join(' ')));
      const items = [];
      for (const c of CATEGORIES) for (const it of ITEMS[c.id]) if (hit(c.name + ' ' + it.name) || hit(it.name)) items.push({ c, it });
      res.innerHTML = `${items.length ? `<section class="sec"><div class="sec-h"><h3>수선 항목</h3><span class="muted small">눌러서 바로 요청서 만들기</span></div>
        <div>${items.slice(0, 8).map(({ c, it }) => `<button class="res-row" data-item="${c.id}:${it.id}"><span class="ico"><span style="width:26px;height:26px;display:block;color:var(--indigo)">${catIcon(c.id)}</span></span><span class="grow"><b>${c.name} ${it.name}</b><br><span class="xs muted">${it.group === 'fit' ? 'AI 핏 미리보기 가능' : '사진으로 손상 부위 전달'}</span></span><span class="price">${won(it.price)}~</span></button>`).join('')}</div></section>` : ''}
        <section class="sec"><div class="sec-h"><h3>수선집 ${shops.length}곳</h3></div>${shops.length ? demoNote() : ''}${shops.map(s => shopRow(s)).join('') || '<p class="small muted">이름이 맞는 수선집이 없어요.</p>'}</section>`;
    };
    inp.addEventListener('input', draw);
    res.addEventListener('click', e => {
      const c = e.target.closest('[data-q]'); if (c) { inp.value = c.dataset.q; draw(); return; }
      const it = e.target.closest('[data-item]'); if (it) { const [cat, id] = it.dataset.item.split(':'); startDraft({ cat, items: [id] }); go('req-items'); }
    });
    wireShopRows(res);
    draw();
    setTimeout(() => inp.focus({ preventScroll: true }), 350);
  },
});

// ───────── 알림 ─────────
screen('alerts', {
  render() {
    const ago = t => { const m = (Date.now() - new Date(t)) / 60000; return m < 60 ? `${Math.max(1, Math.round(m))}분 전` : m < 1440 ? `${Math.round(m / 60)}시간 전` : `${Math.round(m / 1440)}일 전`; };
    return `${appbar('알림', { right: `<button class="link" data-readall style="font-size:13px">모두 읽음</button>` })}
    <main class="content flush" style="gap:0">${state.alerts.length ? state.alerts.map(a => `<button class="alert-row${a.read ? '' : ' unread'}" data-a="${a.id}">
      <span class="ico">${ic(a.icon)}</span><span class="grow"><b>${esc(a.title)}</b><span class="small sub">${esc(a.body)}</span><br><small>${ago(a.t)}</small></span>${a.read ? '' : '<span class="tag chalk" style="height:18px">N</span>'}</button>`).join('') : `<div class="empty">${ic('bell-off')}<b>알림이 없어요</b></div>`}</main>`;
  },
  mount(el) {
    el.addEventListener('click', e => {
      if (e.target.closest('[data-readall]')) { state.alerts.forEach(a => a.read = true); save(); refresh(); return; }
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = state.alerts.find(x => x.id === b.dataset.a); a.read = true; save();
      const i = a.to.lastIndexOf('-'); if (i < 0) go(a.to); else go(a.to.slice(0, i), a.to.slice(i + 1));
    });
  },
});
