// 수선집 비교 → 상세 → 예약 → 완료
import { screen, go, back, refresh, tab, backTo } from '../router.js';
import { ic, esc, stars, sheet, toast, appbar, fmtDate, fmtShort } from '../ui.js';
import { state, save, area, distM, fmtDist, isLiked, toggleLike, rankShops, quote, shopReviews, shopRating, isOpen, schedule, placeOrder, startDraft, changes } from '../store.js';
import { SHOPS, ITEMS, CATEGORIES, FIELDS, FEES, REVIEW_TAGS, catOf, shopOf, won, cm } from '../data.js';
import { catIcon, shopHero, workSample } from '../garments.js';
import { createMap } from '../map.js';
import { ticket, billHtml } from './request.js';
import { demoNote } from './home.js';

const gTitle = g => g.name || g.sub || catOf(g.cat).name;
// 가게 직접 배달 (수선 끝난 옷을 가게가 직접 가져다줌, 옷라인 배송과 따로)
export const selfTag = s => s.selfDelivery ? '<span class="tag ok">가게 직접 배달</span>' : '';
const selfFee = s => s.selfDelivery.fee ? won(s.selfDelivery.fee) : '무료';
const selfInfo = s => `${s.selfDelivery.km}km 안, 배달비 ${selfFee(s)}`;
function reqSummary(d) {
  return d.garments.map(g => { const ch = changes(g); const its = g.items.map(id => ITEMS[g.cat].find(i => i.id === id)?.name).filter(Boolean);
    return `<div class="small"><b>${esc(gTitle(g))}</b> <span class="sub">${its.join(', ')}</span>${ch[0] ? `<br><span class="muted xs">${FIELDS[ch[0].f].label} ${cm(ch[0].from)} → ${cm(ch[0].to)}${ch[1] ? `, ${FIELDS[ch[1].f].label} ${cm(ch[1].from)} → ${cm(ch[1].to)}` : ''}</span>` : ''}</div>`; }).join('');
}

// ───────── 비교 ─────────
let sort = 'rec', filters = {};
screen('compare', {
  render() {
    const d = state.draft;
    if (!d) { setTimeout(() => backTo('home'), 0); return ''; }
    const list = rankShops(d.garments, sort, filters);
    const prefer = state.preferShop && list.find(x => x.s.id === state.preferShop);
    const top = sort === 'rec' ? list.slice(0, 3) : list;
    const rest = sort === 'rec' ? list.slice(3) : [];
    const card = (x, i, best) => {
      const q = quote(d.garments, x.s), r = shopRating(x.s);
      return `<div class="cmp${best ? ' best' : ''}" data-shop="${x.s.id}" role="button" tabindex="0" id="c-${x.s.id}">
        ${best ? `<span class="rk">추천 ${i + 1}</span>` : ''}
        <div class="top"${best ? ' style="margin-top:8px"' : ''}><span class="thumb">${shopHero(x.s)}</span>
          <span class="grow" style="display:flex;flex-direction:column;gap:3px"><b style="font-size:16px">${esc(x.s.name)} ${x.s.id === state.preferShop ? '<span class="tag indigo">찜한 곳</span>' : ''}</b>
          <span class="dotsep">${stars(r.r, r.n)}<span>${fmtDist(x.d)}</span><span>${x.s.lead === 1 ? '내일 완료' : x.s.lead + '일'}</span></span></span>
          <button class="heart${isLiked(x.s.id) ? ' on' : ''}" data-like="${x.s.id}" aria-label="좋아요" style="border:0;background:none;color:var(--ink-3)">${ic('heart')}</button></div>
        ${x.why.length || x.s.selfDelivery ? `<div class="why">${x.why.map(w => `<span class="tag ${/입점/.test(w) ? 'chalk' : /전문/.test(w) ? 'indigo' : ''}">${w}</span>`).join('')}${selfTag(x.s)}</div>` : ''}
        <div class="quote"><span class="calc">표준가 ${won(q.std)}<br>${q.mk === 0 ? '추가금 없음' : `수선집 추가금 ${q.mk > 0 ? '+' : ''}${won(q.mk)}`}${q.newDisc ? `<br><span style="color:var(--chalk)">첫 주문 할인 ${won(-q.newDisc)}</span>` : ''}${q.bundle ? `<br><span style="color:var(--chalk)">묶음 할인 ${won(-q.bundle)}</span>` : ''}</span><span class="tot">${won(q.total)}</span></div>
      </div>`;
    };
    return `${appbar('수선집 비교')}
    <main class="content">
      <section class="card" style="display:flex;flex-direction:column;gap:8px;background:var(--indigo-50)">
        <div class="row between"><b class="small" style="color:var(--indigo)">${ic('clipboard-list', 'ic-16')} 나의 수선 요청서</b><button class="link strong" data-sheet>상세보기 ${ic('chevron-right', 'ic-16')}</button></div>
        ${reqSummary(d)}
        <div class="row between small"><span class="sub">표준가 합계</span><b class="price">${won(quote(d.garments).total)}</b></div>
      </section>
      <label class="search"><span>${ic('search', 'ic-16')}</span><input id="sq" placeholder="단골 수선집 이름으로 찾기" autocomplete="off"></label>
      <div class="mapbox" id="cmpMap"></div>
      <div class="chips">${[['rec', '추천순'], ['dist', '거리순'], ['price', '가격순'], ['review', '리뷰 많은 순']].map(([k, t]) => `<button class="chip" data-sort="${k}" aria-pressed="${sort === k}">${t}</button>`).join('')}
        <button class="chip filter" data-f="pickup" aria-pressed="${!!filters.pickup}">픽업 가능</button><button class="chip filter" data-f="today" aria-pressed="${!!filters.today}">오늘 접수</button><button class="chip filter" data-f="spec" aria-pressed="${!!filters.spec}">전문 수선집만</button></div>
      ${demoNote()}
      ${sort === 'rec' ? `<div class="sec-h"><h2>추천 수선집 3곳</h2><span class="muted xs">별점, 거리, 가격, 전문 분야로 골랐어요</span></div>` : ''}
      <div class="sec" id="cmpList">${top.map((x, i) => card(x, i, sort === 'rec')).join('') || '<div class="empty">조건에 맞는 수선집이 없어요</div>'}
      ${rest.length ? `<div class="sec-h" style="margin-top:8px"><h3>다른 수선집 ${rest.length}곳</h3></div>${rest.map(x => card(x)).join('')}` : ''}</div>
    </main>`;
  },
  mount(el) {
    const d = state.draft; if (!d) return;
    const list = rankShops(d.garments, sort, filters);
    const map = createMap(el.querySelector('#cmpMap'), { me: area().me, showCount: false, view: 900,
      shops: list.map(x => ({ id: x.s.id, x: x.s.x, y: x.s.y, name: x.s.name, isNew: x.s.isNew, label: won(quote(d.garments, x.s).total) })),
      onPin: id => { if (!id) return; const c = el.querySelector('#c-' + id); if (c) { c.scrollIntoView({ behavior: 'smooth', block: 'center' }); c.animate([{ boxShadow: 'inset 0 0 0 3px var(--tape)' }, { boxShadow: 'inset 0 0 0 0 transparent' }], { duration: 1400 }); } } });
    el.addEventListener('click', e => {
      const lk = e.target.closest('[data-like]'); if (lk) { e.stopPropagation(); const on = toggleLike(lk.dataset.like); lk.classList.toggle('on', on); toast(on ? '좋아요에 담았어요' : '좋아요에서 뺐어요', 'heart'); return; }
      const b = e.target.closest('button');
      if (b && b.dataset.sort) { sort = b.dataset.sort; refresh(); return; }
      if (b && b.dataset.f) { filters[b.dataset.f] = !filters[b.dataset.f]; refresh(); return; }
      if (b && b.hasAttribute('data-sheet')) { sheet(`<h3>나의 수선 요청서</h3><div class="body">${d.garments.map((g, i) => ticket(g, i)).join('')}</div><button class="btn primary" data-close>닫기</button>`); return; }
      const c = e.target.closest('[data-shop]'); if (c) go('shop', c.dataset.shop);
    });
    el.querySelector('#sq').addEventListener('input', e => {
      const v = e.target.value.trim();
      el.querySelectorAll('#cmpList .cmp').forEach(c => { c.hidden = v && !shopOf(c.dataset.shop).name.includes(v); });
    });
    return () => map.destroy();
  },
});

// ───────── 상세 ─────────
const DAYS = '일월화수목금토';
const SAMPLE_KIND = { pants: ['pants-hem', 'pants-taper'], shirt: ['shirt-sleeve'], jacket: ['jacket-lining', 'shirt-sleeve'], dress: ['dress-hem'], skirt: ['dress-hem', 'zipper'], tee: ['shirt-sleeve'] };
let rvFilter = 'all';
screen('shop', {
  render(id) {
    const s = shopOf(id); if (!s) return appbar('수선집');
    const r = shopRating(s), reviews = shopReviews(s.id), d = state.draft;
    const dist = [5, 4, 3, 2, 1].map(k => { const n = k === 5 ? Math.round(r.n * 0.82) : k === 4 ? Math.round(r.n * 0.13) : k === 3 ? Math.round(r.n * 0.04) : k === 2 ? Math.round(r.n * 0.01) : 0; return { k, n }; });
    const maxN = Math.max(...dist.map(x => x.n), 1);
    const kinds = [...new Set(s.spec.flatMap(c => SAMPLE_KIND[c] || []))].slice(0, 2);
    const rvs = reviews.filter(v => rvFilter === 'all' || (rvFilter === 'photo' ? v.photo || (v.photos && v.photos.length) : v.cat === rvFilter));
    const order = [...s.spec, ...CATEGORIES.map(c => c.id).filter(c => !s.spec.includes(c))];
    const q = d && quote(d.garments, s);
    return `<div class="float-bar" id="fb"><button class="ib" data-back aria-label="뒤로">${ic('chevron-left', 'ic-24')}</button><h1>${esc(s.name)}</h1>
      <button class="ib" data-like aria-label="좋아요" style="color:${isLiked(s.id) ? 'var(--chalk)' : 'var(--ink)'}">${ic('heart', 'ic-24')}</button></div>
    <main class="content flush" style="gap:0;padding-bottom:0" id="sc">
      <div class="hero-img" style="margin-top:0">${shopHero(s)}</div>
      <section class="shop-head">
        <div class="row" style="gap:6px">${s.spec.map(c => `<span class="tag indigo">${catOf(c).name} 전문</span>`).join('')}${s.isNew ? '<span class="tag chalk">이번 주 입점</span>' : ''}</div>
        <h2>${esc(s.name)}</h2>
        <div class="dotsep">${stars(r.r, r.n)}<span>${fmtDist(distM(s))}</span><span>${s.lead === 1 ? '내일 완료' : `평균 ${s.lead}일`}</span></div>
        <div class="row small"><span class="${isOpen(s) ? 'open' : 'closed'}">${isOpen(s) ? '영업 중' : '영업 종료'}</span><span class="sub">${s.hours[0]}:00 ~ ${s.hours[1]}:00${s.closed.length ? `, ${s.closed.map(x => DAYS[x]).join(', ')}요일 휴무` : ', 연중무휴'}</span></div>
        <div class="row" style="flex-wrap:wrap;gap:4px">${s.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}${selfTag(s)}</div>
        ${demoNote()}
      </section>
      <nav class="tabs" id="tabs">${[['info', '기본정보'], ['price', '가격표'], ['work', '작업 사례'], ['review', `리뷰 ${r.n}`]].map(([k, t], i) => `<button data-tabto="${k}" class="${i === 0 ? 'on' : ''}">${t}</button>`).join('')}</nav>
      <section class="panel" id="p-info">
        <div class="sec-h"><h3>수선사 소개</h3><span class="muted small">경력 ${s.years}년</span></div>
        <p class="sub" style="font-size:14.5px;line-height:1.6">${esc(s.intro)}</p>
        <dl class="kv"><dt>주소</dt><dd>${esc(s.addr)}</dd><dt>안심번호</dt><dd class="row between">${esc(s.phone)} <button class="btn xs line" data-copy="${esc(s.phone)}">복사</button></dd>
          <dt>맡기는 방법</dt><dd>${s.pickup ? '직접 방문, 옷라인 픽업' : '직접 방문만'}</dd>
          <dt>받는 방법</dt><dd>매장에서 찾기, 옷라인 배송${s.selfDelivery ? `<span class="row" style="flex-wrap:wrap;gap:4px 6px;margin-top:6px"><span class="tag ok">${ic('bike')}가게 직접 배달</span><span class="small sub">${selfInfo(s)}</span></span>` : ''}</dd><dt>오늘 접수</dt><dd>${s.today ? '가능' : '내일부터'}</dd></dl>
        <div class="notice">${ic('shield-check')}<span>전화번호는 안심번호로 보여드려요. 옷라인으로 맡기면 <b>안심결제</b>와 <b>재수선 보장</b>을 받을 수 있어요.</span></div>
      </section>
      ${q ? `<section class="panel" style="margin-top:10px"><div class="sec-h"><h3>내 요청서 예상 견적</h3><button class="link strong" data-sheet>요청서 보기 ${ic('chevron-right', 'ic-16')}</button></div>${billHtml(q)}</section>` : ''}
      <section class="panel" id="p-price" style="margin-top:10px"><div class="sec-h"><h3>수선 가격표</h3><span class="muted xs">옷라인 표준가 기준</span></div>
        ${order.slice(0, 3).map(c => `<div class="group-h" style="margin-top:4px"><span style="width:20px;height:20px;display:inline-flex;color:var(--indigo)">${catIcon(c)}</span>${catOf(c).name}</div>
        <div class="pricelist">${ITEMS[c].map(it => { const mk = s.markup[it.group] || 0; return `<div class="l"><span>${esc(it.name)}</span><span>${mk ? `<span class="std">표준 ${won(it.price)}</span>` : ''}<b class="price">${won(it.price + mk)}~</b></span></div>`; }).join('')}</div>`).join('')}
        <button class="link" data-allprice style="align-self:center">${ic('chevron-down', 'ic-16')} 다른 의류 가격 보기</button>
      </section>
      <section class="panel" id="p-work" style="margin-top:10px"><div class="sec-h"><h3>수선 작업 사례</h3></div>
        <div class="gallery">${kinds.flatMap((k, i) => { const w = workSample(k, i); return [`<figure>${w.before}</figure>`, `<figure>${w.after}</figure>`]; }).join('')}</div>
      </section>
      <section class="panel" id="p-review" style="margin-top:10px">
        <div class="rv-sum"><div class="big"><b>${r.r.toFixed(1)}</b>${stars(r.r).replace(/[\d.]+/, '')}<span class="xs muted">리뷰 ${r.n}개</span></div>
          <div class="rv-bars">${dist.map(x => `<div><span>${x.k}</span><i style="--w:${(x.n / maxN) * 100}%"></i><span>${x.n}</span></div>`).join('')}</div></div>
        <div class="chips">${[['all', '전체'], ['photo', '사진 리뷰'], ...s.spec.map(c => [c, catOf(c).name])].map(([k, t]) => `<button class="chip sm" data-rv="${k}" aria-pressed="${rvFilter === k}">${t}</button>`).join('')}</div>
        <div>${rvs.map(v => `<div class="rv"><div class="who"><span class="av">${esc(v.who[0])}</span>${esc(v.who)}${v.mine ? ' <span class="tag indigo">내 리뷰</span>' : ''}<span class="muted xs" style="margin-left:auto;font-weight:500">${v.date.slice(5).replace('-', '/')}</span></div>
          <div class="row">${stars(v.star)}<span class="tag">${catOf(v.cat)?.name || ''}</span></div>
          ${v.photo ? `<div class="imgs">${(() => { const w = workSample(SAMPLE_KIND[v.cat]?.[0] || 'pants-hem', v.who.charCodeAt(0) % 3); return `<span>${w.before}</span><span>${w.after}</span>`; })()}</div>` : ''}
          ${v.photos && v.photos.length ? `<div class="imgs">${v.photos.map(p => `<span><img src="${p}" alt="" style="width:100%;height:100%;object-fit:cover"></span>`).join('')}</div>` : ''}
          <p>${esc(v.text)}</p>${v.tags?.length ? `<div class="row" style="flex-wrap:wrap;gap:4px">${v.tags.map(t => `<span class="tag yellow">${esc(t)}</span>`).join('')}</div>` : ''}</div>`).join('') || '<p class="small muted">조건에 맞는 리뷰가 없어요.</p>'}</div>
      </section>
      <div style="height:16px"></div>
    </main>
    <footer class="cta on-surface"><button class="btn line icon-only" data-like2 aria-label="좋아요" style="color:${isLiked(s.id) ? 'var(--chalk)' : 'var(--ink)'}">${ic('heart')}</button>
      ${d ? `<button class="btn primary" data-book>${ic('scissors')}수선 맡기기 <span style="opacity:.75;font-weight:500">${won(q.total)}</span></button>` : `<button class="btn primary" data-new>${ic('sparkles')}이 수선집에 요청서 만들기</button>`}</footer>`;
  },
  mount(el, id) {
    const s = shopOf(id); if (!s) return;
    const sc = el.querySelector('#sc'), fb = el.querySelector('#fb'), tabs = el.querySelector('#tabs');
    const panels = ['info', 'price', 'work', 'review'].map(k => el.querySelector('#p-' + k));
    sc.addEventListener('scroll', () => {
      fb.classList.toggle('solid', sc.scrollTop > 170);
      const lim = sc.getBoundingClientRect().top + fb.offsetHeight + tabs.offsetHeight + 8; let on = 0; panels.forEach((p, i) => { if (p && p.getBoundingClientRect().top <= lim) on = i; });
      tabs.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === on));
    }, { passive: true });
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.tabto) { const p = el.querySelector('#p-' + b.dataset.tabto); const off = fb.offsetHeight + tabs.offsetHeight - 1; sc.scrollTo({ top: sc.scrollTop + p.getBoundingClientRect().top - sc.getBoundingClientRect().top - off, behavior: 'smooth' }); }
      else if (b.hasAttribute('data-like') || b.hasAttribute('data-like2')) { const on = toggleLike(s.id); el.querySelectorAll('[data-like],[data-like2]').forEach(x => x.style.color = on ? 'var(--chalk)' : 'var(--ink)'); toast(on ? '좋아요에 담았어요' : '좋아요에서 뺐어요', 'heart'); }
      else if (b.dataset.copy) { const t = b.dataset.copy; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('안심번호를 복사했어요', 'copy')).catch(() => toast(t, 'phone')); }
      else if (b.dataset.rv) { rvFilter = b.dataset.rv; refresh(); setTimeout(() => { const p = el.isConnected ? el : document.querySelector('.view:last-child'); }, 0); }
      else if (b.hasAttribute('data-allprice')) { sheet(`<h3>${esc(s.name)} 전체 가격표</h3><div class="body">${CATEGORIES.map(c => `<div class="group-h">${c.name}</div><div class="pricelist">${ITEMS[c.id].map(it => `<div class="l"><span>${esc(it.name)}</span><b class="price">${won(it.price + (s.markup[it.group] || 0))}~</b></div>`).join('')}</div>`).join('')}</div><button class="btn primary" data-close>닫기</button>`); }
      else if (b.hasAttribute('data-sheet')) sheet(`<h3>나의 수선 요청서</h3><div class="body">${state.draft.garments.map((g, i) => ticket(g, i)).join('')}</div><button class="btn primary" data-close>닫기</button>`);
      else if (b.hasAttribute('data-book')) { state.booking = { shopId: s.id, dropoff: s.pickup ? 'pickup' : 'visit', date: null, slot: null, address: '서울 성북구 개운사길 50 (가상)', memo: '', receive: 'delivery', ship: 'normal', pay: 'card', agree: false }; save(); go('book'); }
      else if (b.hasAttribute('data-new')) { state.preferShop = s.id; startDraft(); go('req-cat'); }
    });
  },
});

// ───────── 예약 ─────────
let calOff = 0;
function slotTaken(date, slot) { const k = (date.getDate() * 7 + slot * 13) % 10; return k < 3; }
screen('book', {
  render() {
    const d = state.draft, bk = state.booking;
    if (!d || !bk) { setTimeout(() => backTo('home'), 0); return ''; }
    const s = shopOf(bk.shopId), q = quote(d.garments, s, bk);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const base = new Date(today.getFullYear(), today.getMonth() + calOff, 1);
    const first = base.getDay(), days = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    const sel = bk.date ? new Date(bk.date) : null;
    const maxDay = new Date(today); maxDay.setDate(maxDay.getDate() + 30);
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<span></span>';
    for (let n = 1; n <= days; n++) {
      const dt = new Date(base.getFullYear(), base.getMonth(), n);
      const off = dt < today || dt > maxDay || s.closed.includes(dt.getDay());
      const isSel = sel && dt.toDateString() === sel.toDateString();
      cells += `<button data-day="${dt.toISOString()}" ${off ? 'disabled' : ''} aria-pressed="${!!isSel}" class="${dt.getTime() === today.getTime() ? 'today' : ''}">${n}${dt.getTime() === today.getTime() ? '<small>오늘</small>' : ''}</button>`;
    }
    const slots = []; for (let h = s.hours[0]; h + 2 <= s.hours[1]; h += 2) slots.push(h);
    const now = new Date();
    const sch = bk.date ? schedule(bk, s) : null;
    const ready = bk.date && bk.slot && bk.agree && (bk.dropoff !== 'pickup' || bk.address.trim());
    return `${appbar('예약 신청')}
    <main class="content">
      <section class="card" style="display:flex;gap:12px;align-items:center"><span style="width:52px;height:52px;border-radius:14px;overflow:hidden;flex:none">${shopHero(s)}</span>
        <span class="grow"><span class="xs muted">선택한 수선집</span><br><b>${esc(s.name)}</b><br><span class="small sub">${d.garments.map(gTitle).map(esc).join(', ')} ${d.garments.length}벌</span></span><b class="price">${won(q.work - q.bundle - q.newDisc)}</b></section>

      <section class="sec"><div class="group-h">옷을 맡기는 방법</div><div class="opts">
        <button class="opt" data-drop="visit" aria-pressed="${bk.dropoff === 'visit'}"><span class="ico">${ic('store')}</span><span><b>직접 방문</b><small>매장에 직접 맡겨요. ${esc(s.addr)}</small></span><span class="add">무료</span></button>
        <button class="opt" data-drop="pickup" aria-pressed="${bk.dropoff === 'pickup'}" ${s.pickup ? '' : 'disabled style="opacity:.45"'}><span class="ico">${ic('truck')}</span><span><b>픽업 요청</b><small>${s.pickup ? '고른 날짜와 시간에 집 앞에서 가져가요' : '이 수선집은 픽업을 하지 않아요'}</small></span><span class="add">${d.garments.length >= 2 ? '무료' : '+' + won(FEES.pickup)}</span></button></div></section>

      <section class="sec"><div class="group-h">${bk.dropoff === 'pickup' ? '픽업 날짜' : '방문 날짜'}</div>
        <div class="cal"><div class="cal-h"><button class="ib" data-cal="-1" ${calOff <= 0 ? 'disabled' : ''} aria-label="이전 달">${ic('chevron-left')}</button><b>${base.getFullYear()}년 ${base.getMonth() + 1}월</b><button class="ib" data-cal="1" ${calOff >= 1 ? 'disabled' : ''} aria-label="다음 달">${ic('chevron-right')}</button></div>
          <div class="cal-g">${[...DAYS].map(w => `<span class="w">${w}</span>`).join('')}${cells}</div></div>
        ${bk.date ? `<div class="slots">${slots.map(h => { const past = sel && sel.toDateString() === now.toDateString() && h <= now.getHours(); const taken = slotTaken(sel, h); const k = `${h}-${h + 2}`; return `<button data-slot="${k}" ${past || taken ? 'disabled' : ''} aria-pressed="${bk.slot === k}">${h}시~${h + 2}시</button>`; }).join('')}</div>` : '<p class="note">날짜를 고르면 가능한 시간이 나와요.</p>'}</section>

      ${bk.dropoff === 'pickup' ? `<section class="sec"><div class="group-h">픽업 장소</div>
        <label class="field"><input class="input" id="addr" value="${esc(bk.address)}" style="font-weight:500"></label>
        <label class="field"><input class="input" id="memo" value="${esc(bk.memo || '')}" placeholder="기사님께 남길 말 (예: 문 앞에 걸어둘게요)" style="font-weight:500"></label></section>` : ''}

      <section class="sec"><div class="group-h">수선 후 받는 방법</div><div class="opts two">
        <button class="opt" data-recv="visit" aria-pressed="${bk.receive === 'visit'}" style="flex-direction:column;gap:6px"><span class="ico">${ic('store')}</span><span><b>매장에서 찾기</b><small>무료</small></span></button>
        <button class="opt" data-recv="delivery" aria-pressed="${bk.receive === 'delivery'}" style="flex-direction:column;gap:6px"><span class="ico">${ic('package')}</span><span><b>배송받기</b><small>${s.selfDelivery ? '옷라인, 가게 직접 배달' : `${won(FEES.ship.normal)}부터`}</small></span></button></div>
        ${bk.receive === 'delivery' ? `<div class="opts">
          <button class="opt" data-ship="normal" aria-pressed="${bk.ship === 'normal'}"><span class="ico">${ic('truck')}</span><span><b>옷라인 일반 배송</b><small>옷라인 택배로 수선 끝난 다음 날 도착</small></span><span class="add">${won(FEES.ship.normal)}</span><span class="radio"></span></button>
          <button class="opt" data-ship="fast" aria-pressed="${bk.ship === 'fast'}"><span class="ico">${ic('zap')}</span><span><b>옷라인 당일 배송</b><small>수선 끝난 날 옷라인 기사님이 가져다줘요</small></span><span class="add">${won(FEES.ship.fast)}</span><span class="radio"></span></button>
          ${s.selfDelivery ? `<button class="opt" data-ship="self" aria-pressed="${bk.ship === 'self'}"><span class="ico">${ic('bike')}</span><span><b>가게 직접 배달 <span class="tag ok">이 가게만</span></b><small>수선 끝난 날 수선사가 직접 가져다줘요 (${s.selfDelivery.km}km 안)</small></span><span class="add">${selfFee(s)}</span><span class="radio"></span></button>` : ''}</div>` : ''}</section>

      ${sch ? `<section class="sec"><div class="group-h">예상 일정</div><div class="timeline-mini">
        <div><span>${bk.dropoff === 'pickup' ? '픽업' : '방문'}</span><b>${fmtShort(sch.start)}</b></div><div><span>수선 완료</span><b>${fmtShort(sch.done)}</b></div><div><span>${bk.receive !== 'delivery' ? '찾으러 가기' : bk.ship === 'self' ? '가게 배달 도착' : '배송 도착'}</span><b>${fmtShort(sch.recv)}</b></div></div></section>` : ''}

      <section class="card sec"><div class="sec-h"><h3>결제 예정 금액</h3></div>${billHtml(q, { showFees: true })}</section>
      <section class="sec"><div class="group-h">결제 수단</div><div class="chips wrap">${[['card', '신용, 체크카드'], ['easy', '간편결제'], ['bank', '계좌이체']].map(([k, t]) => `<button class="chip" data-pay="${k}" aria-pressed="${bk.pay === k}">${t}</button>`).join('')}</div>
        <div class="notice">${ic('shield-check')}<span><b>안심결제</b>: 옷라인이 결제 금액을 보관했다가, 옷을 받고 확인하면 수선사에게 정산해요. 결과가 요청서와 다르면 재수선이나 환불을 도와드려요.</span></div>
        <button class="check" data-agree aria-pressed="${!!bk.agree}"><span class="box">${ic('check')}</span><span class="small">수선사가 옷을 확인한 뒤 금액이 바뀌면, 결제 전에 다시 동의를 받는다는 데 확인했어요</span></button></section>
    </main>
    <footer class="cta on-surface"><div class="sum"><small>총 결제 예정</small><b class="price">${won(q.total)}</b></div><button class="btn primary" data-go-book ${ready ? '' : 'disabled'}>${!bk.date ? '날짜를 골라주세요' : !bk.slot ? '시간을 골라주세요' : !bk.agree ? '확인에 체크해 주세요' : '예약 요청하기'}</button></footer>`;
  },
  mount(el) {
    const bk = state.booking; if (!bk) return;
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.drop) bk.dropoff = b.dataset.drop;
      else if (b.dataset.cal) { calOff += +b.dataset.cal; }
      else if (b.dataset.day) { bk.date = b.dataset.day; bk.slot = null; }
      else if (b.dataset.slot) { bk.slot = b.dataset.slot; const dd = new Date(bk.date); dd.setHours(+b.dataset.slot.split('-')[0]); bk.date = dd.toISOString(); }
      else if (b.dataset.recv) bk.receive = b.dataset.recv;
      else if (b.dataset.ship) bk.ship = b.dataset.ship;
      else if (b.dataset.pay) bk.pay = b.dataset.pay;
      else if (b.hasAttribute('data-agree')) bk.agree = !bk.agree;
      else if (b.hasAttribute('data-go-book')) { const o = placeOrder(); calOff = 0; go('book-done', o.id); return; }
      else return;
      save(); refresh();
    });
    el.addEventListener('input', e => { if (e.target.id === 'addr') bk.address = e.target.value; if (e.target.id === 'memo') bk.memo = e.target.value; save(); });
    el.addEventListener('change', e => { if (e.target.id === 'addr') refresh(); });
  },
});

screen('book-done', {
  render(id) {
    const o = state.orders.find(x => x.id === id); if (!o) return appbar('예약');
    const s = shopOf(o.shopId), sch = schedule(o.booking, s);
    return `<main class="content" style="padding-top:calc(var(--sb,52px) + 20px)">
      <div class="done-wrap" style="flex:none;padding-top:24px"><div class="done-badge">${ic('check')}</div>
        <h2>예약을 요청했어요</h2><p>${esc(s.name)}에서 요청서를 확인하면<br>알림으로 알려드릴게요.</p></div>
      <section class="label-card"><div class="label-head"><div><div class="w">OTLINE</div><h3>${esc(s.name)}</h3></div><div class="no">예약 번호<br>${o.no}</div></div>
        <div class="label-body"><dl class="kv">
          <dt>${o.booking.dropoff === 'pickup' ? '픽업' : '방문'}</dt><dd>${fmtDate(sch.start)} ${o.booking.slot.replace('-', '시~')}시</dd>
          ${o.booking.dropoff === 'pickup' ? `<dt>픽업 장소</dt><dd>${esc(o.booking.address)}</dd>` : ''}
          <dt>수선 완료</dt><dd>${fmtDate(sch.done)} 예정</dd>
          <dt>받는 방법</dt><dd>${o.booking.receive === 'delivery' ? `${o.booking.ship === 'self' ? '가게 직접 배달' : `옷라인 ${o.booking.ship === 'fast' ? '당일' : '일반'} 배송`}, ${fmtDate(sch.recv)} 도착 예정` : '매장에서 찾기'}</dd>
          <dt>의류</dt><dd>${o.garments.map(g => esc(g.name || g.sub)).join(', ')}</dd>
          <dt>결제 예정</dt><dd><b>${won(o.quote.total)}</b> (안심결제)</dd></dl></div></section>
      <div class="notice">${ic('archive')}<span>맡긴 옷의 치수를 <b>내 옷장</b>에 저장했어요. 다음에는 한 번에 다시 맡길 수 있어요.</span></div>
    </main>
    <footer class="cta"><button class="btn line" data-home>홈으로</button><button class="btn primary" data-track>진행 상황 보기</button></footer>`;
  },
  mount(el, id) {
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-home')) tab('home');
      if (b.hasAttribute('data-track')) { tab('orders'); setTimeout(() => go('order', id), 60); }
    });
  },
});
