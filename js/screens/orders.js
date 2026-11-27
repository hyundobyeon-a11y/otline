// 요청 내역 → 진행 상황 → 채팅, 리뷰, 환불/재수선
import { screen, go, back, refresh, backTo } from '../router.js';
import { ic, esc, stars, sheet, toast, appbar, fmtDate, fmtShort, fmtTime } from '../ui.js';
import { state, save, advance, orderSteps, schedule, tailorReply, activeOrders, doneOrders, startDraft, quote } from '../store.js';
import { REVIEW_TAGS, catOf, shopOf, won, cm, FIELDS } from '../data.js';
import { catIcon, shopHero, workSample } from '../garments.js';
import { ticket, billHtml } from './request.js';

const orderOf = id => state.orders.find(o => o.id === id);
const gTitle = g => g.name || g.sub || catOf(g.cat).name;
const kindOf = g => g.cat === 'pants' ? (g.items.includes('taper') ? 'pants-taper' : 'pants-hem') : g.cat === 'jacket' ? 'jacket-lining' : g.cat === 'shirt' || g.cat === 'tee' ? 'shirt-sleeve' : 'dress-hem';

export function orderCard(o) {
  const s = shopOf(o.shopId), st = orderSteps(o), g = o.garments[0];
  const cls = o.canceled ? '' : o.status >= 6 ? 'done' : o.status === 0 ? 'wait' : 'working';
  const total = o.quote ? o.quote.total : quote(o.garments, s, o.booking).total;
  const label = o.canceled ? '취소됨' : st[o.status].t;
  return `<article class="order">
    <div class="top"><span>${fmtShort(new Date(o.createdAt))} 요청</span><span class="st ${cls}">${o.status >= 6 ? ic('check-circle-2', 'ic-16') : ''} ${label}</span></div>
    <div class="mid"><span class="gi">${catIcon(g.cat)}</span><span class="grow"><b>${esc(s.name)}</b><br><span class="small sub">${o.garments.map(gTitle).map(esc).join(', ')}${o.garments.length > 1 ? ` ${o.garments.length}벌` : ''}</span></span><b class="price">${won(total)}</b></div>
    ${o.status < 6 && !o.canceled ? `<div class="bar" style="--n:${st.length}">${st.map((_, i) => `<i class="${i <= o.status ? 'on' : ''}"></i>`).join('')}</div>` : ''}
    <div class="acts">${o.status >= 6
      ? `<button class="btn sm line grow" data-go="claim" data-p="${o.id}">재수선/환불</button>${o.reviewed ? `<button class="btn sm soft grow" data-reorder="${o.id}">같은 요청서로 다시</button>` : `<button class="btn sm primary grow" data-go="review" data-p="${o.id}">리뷰 쓰기</button>`}`
      : `<button class="btn sm line grow" data-go="chat" data-p="${o.id}">${ic('message-circle', 'ic-16')} 채팅</button><button class="btn sm primary grow" data-go="order" data-p="${o.id}">진행 상황</button>`}</div>
  </article>`;
}
export function reorder(o) {
  const g0 = o.garments[0];
  startDraft();
  state.draft.garments = o.garments.map(g => ({ ...JSON.parse(JSON.stringify(g)), id: 'g' + Math.random().toString(36).slice(2, 8), photos: [] }));
  state.preferShop = o.shopId; save();
  toast('지난 요청서를 그대로 불러왔어요', 'repeat');
  go('req-sheet');
}

// ───────── 요청 내역 ─────────
let seg = 'all';
screen('orders', {
  tab: 'orders',
  render() {
    const list = state.orders.filter(o => seg === 'all' || (seg === 'active' ? o.status < 6 && !o.canceled : seg === 'done' ? o.status >= 6 : o.canceled));
    return `<header class="appbar large"><span></span><h1>요청 내역</h1><span></span></header>
    <main class="content">
      <div class="seg" role="tablist">${[['all', '전체'], ['active', `진행 중 ${activeOrders().length}`], ['done', '완료'], ['cancel', '취소']].map(([k, t]) => `<button data-seg="${k}" aria-pressed="${seg === k}">${t}</button>`).join('')}</div>
      ${list.map(orderCard).join('') || `<div class="empty">${ic('clipboard-list')}<b>요청 내역이 없어요</b><span>수선 요청서를 만들어 수선집에 맡겨보세요</span><button class="btn sm primary" data-new>수선 맡기기</button></div>`}
    </main>`;
  },
  mount(el) {
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.seg) { seg = b.dataset.seg; refresh(); }
      else if (b.dataset.reorder) reorder(orderOf(b.dataset.reorder));
      else if (b.hasAttribute('data-new')) { startDraft(); go('req-cat'); }
    });
  },
});

// ───────── 진행 상황 ─────────
screen('order', {
  render(id) {
    const o = orderOf(id); if (!o) return appbar('진행 상황');
    const s = shopOf(o.shopId), st = orderSteps(o), sch = schedule(o.booking, s), cur = st[o.status];
    const head = o.status >= 6 ? '수선이 끝났어요!' : o.status === 3 ? '지금 수선 중이에요!' : o.status === 0 ? '수선사가 확인하고 있어요' : `${cur.t}`;
    const photos = Array.from({ length: o.progressPhotos }, (_, i) => workSample(kindOf(o.garments[0]), i)[i === 0 ? 'before' : 'after']);
    return `${appbar('수선 진행 상황', { right: `<button class="ib" data-go="chat" data-p="${o.id}" aria-label="채팅">${ic('message-circle', 'ic-24')}</button>` })}
    <main class="content">
      <section class="status-card"><span class="k">${o.no} / ${esc(s.name)}</span><h2>${head}</h2><span style="font-size:14px;opacity:.85">${esc(cur.d)}</span>
        <div class="eta"><span>${o.status >= 6 ? '받은 날' : o.booking.receive === 'delivery' ? '도착 예정' : '찾으러 갈 날'}</span><b>${fmtDate(o.status >= 6 ? new Date(o.history[6]) : sch.recv)}</b></div></section>
      ${o.status < 6 ? `<div class="demo-ctl">${ic('play-circle')}<span class="grow"><b>데모</b>: 수선사 쪽 진행을 한 단계씩 넘겨볼 수 있어요</span><button class="btn xs yellow" data-adv>다음 단계 ${ic('chevron-right', 'ic-16')}</button></div>` : ''}
      <section class="tl">${st.map((x, i) => {
        const cls = i < o.status ? 'past' : i === o.status ? (o.status >= 6 ? 'past' : 'now') : 'future';
        const t = o.history[i] ? new Date(o.history[i]) : null;
        return `<div class="s ${cls}"><span class="dot">${i < o.status || (i === o.status && o.status >= 6) ? ic('check') : i + 1}</span><div><b>${x.t}</b><small>${t ? `${fmtShort(t)} ${fmtTime(t)}` : i === 4 ? `${fmtShort(sch.done)} 예정` : ''}</small>
          ${i === 3 && o.status === 3 ? `<div class="acts">
            <button data-photo>${ic('camera')}진행 사진 요청하기<span class="chev">${ic('chevron-right', 'ic-16')}</span></button>
            <button data-go="chat" data-p="${o.id}">${ic('message-circle')}수선사와 채팅하기<span class="chev">${ic('chevron-right', 'ic-16')}</span></button>
            <button data-phone>${ic('phone')}수선집 안심번호 보기<span class="chev">${ic('chevron-right', 'ic-16')}</span></button></div>` : ''}
          ${i === 3 && photos.length ? `<div class="progress-photos">${photos.map(p => `<span>${p}</span>`).join('')}</div>` : ''}
          </div></div>`;
      }).join('')}</section>
      ${o.status >= 6 ? `<section class="sec"><div class="row">${o.reviewed ? `<button class="btn soft" data-reorder>${ic('repeat')}같은 요청서로 다시 맡기기</button>` : `<button class="btn primary" data-go="review" data-p="${o.id}">${ic('star')}리뷰 쓰기</button>`}<button class="btn line" data-go="claim" data-p="${o.id}">재수선/환불</button></div></section>` : ''}
      <section class="sec"><div class="sec-h"><h3>수선 요청서</h3></div>${o.garments.map((g, i) => ticket(g, i, { compact: true })).join('')}</section>
      <section class="card sec"><div class="sec-h"><h3>결제 정보</h3><span class="tag ok">${ic('shield-check', 'ic-16')}안심결제</span></div>${billHtml(o.quote || quote(o.garments, s, o.booking), { showFees: true })}</section>
      ${o.status === 0 ? `<button class="link" data-cancel style="align-self:center">예약 요청 취소</button>` : ''}
    </main>`;
  },
  mount(el, id) {
    const o = orderOf(id); if (!o) return;
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-adv')) { advance(o); refresh(); toast(orderSteps(o)[o.status].t, 'bell'); }
      else if (b.hasAttribute('data-photo')) {
        if (o.progressPhotos >= 2) { toast('사진을 이미 받았어요', 'image'); return; }
        o.chat.push({ from: 'me', t: new Date().toISOString(), text: '진행 사진 볼 수 있을까요?' }); save();
        toast('수선사에게 사진을 요청했어요', 'camera');
        setTimeout(() => { o.progressPhotos = 2; o.chat.push({ from: 'them', t: new Date().toISOString(), text: '지금 작업 중인 사진이에요!', img: kindOf(o.garments[0]) }); state.alerts.unshift({ id: 'a' + Date.now(), t: new Date().toISOString(), icon: 'image', title: '진행 사진이 왔어요', body: shopOf(o.shopId).name, to: 'order-' + o.id, read: false }); save(); if (el.isConnected) refresh(); }, 1600);
      }
      else if (b.hasAttribute('data-phone')) { const s = shopOf(o.shopId); sheet(`<h3>${esc(s.name)} 안심번호</h3><div class="body"><div class="card flat" style="text-align:center;font-size:22px;font-weight:700;letter-spacing:.04em;user-select:all">${esc(s.phone)}</div><p class="small sub">실제 번호 대신 안심번호로 연결돼요. 주문이 끝나고 7일 뒤에는 연결이 끊겨요.</p></div><button class="btn primary" data-close>확인</button>`); }
      else if (b.hasAttribute('data-reorder')) reorder(o);
      else if (b.hasAttribute('data-cancel')) { o.canceled = true; save(); toast('예약 요청을 취소했어요', 'x-circle'); back(); }
    });
  },
});

// ───────── 채팅 ─────────
screen('chat', {
  render(id) {
    const o = orderOf(id); if (!o) return appbar('채팅');
    const s = shopOf(o.shopId);
    const msgs = o.chat.map(m => {
      const t = fmtTime(new Date(m.t));
      if (m.from === 'sys') return `<div class="msg sys">${esc(m.text)}</div>`;
      if (m.img) return `<div class="msg them img">${workSample(m.img, 1).after}</div><div class="msg them">${esc(m.text)}<span class="t">${t}</span></div>`;
      return `<div class="msg ${m.from === 'me' ? 'me' : 'them'}">${esc(m.text)}<span class="t">${t}</span></div>`;
    }).join('');
    return `${appbar(s.name, { right: `<button class="ib" data-go="order" data-p="${o.id}" aria-label="진행 상황">${ic('clipboard-list', 'ic-24')}</button>` })}
      <div class="notice" style="margin:0 12px 6px;flex:none">${ic('shield-check')}<span>연락처를 주고받고 앱 밖에서 거래하면 안심결제와 재수선 보장을 받을 수 없어요.</span></div>
      <div class="chat" id="chat">${msgs}</div>
      <div class="quick-replies">${['언제 끝나나요?', '진행 사진 보내주세요', '추가 금액이 있나요?', '감사합니다!'].map(t => `<button class="chip sm" data-qr="${t}">${t}</button>`).join('')}</div>
      <form class="composer" id="cf"><input id="ci" placeholder="메시지 보내기" autocomplete="off" aria-label="메시지"><button class="send" aria-label="보내기">${ic('arrow-up')}</button></form>`;
  },
  mount(el, id) {
    const o = orderOf(id); if (!o) return;
    const box = el.querySelector('#chat'), inp = el.querySelector('#ci');
    box.scrollTop = box.scrollHeight;
    let timer;
    const send = text => {
      text = text.trim(); if (!text) return;
      const now = new Date().toISOString();
      o.chat.push({ from: 'me', t: now, text }); save();
      box.insertAdjacentHTML('beforeend', `<div class="msg me">${esc(text)}<span class="t">${fmtTime(new Date())}</span></div><div class="typing"><i></i><i></i><i></i></div>`);
      box.scrollTop = box.scrollHeight;
      if (/\d{2,3}[- ]?\d{3,4}[- ]?\d{4}|카톡|카카오/.test(text)) box.insertAdjacentHTML('beforeend', `<div class="msg sys">개인 연락처는 상대에게 가려서 전달돼요.</div>`);
      timer = setTimeout(() => {
        const r = tailorReply(text);
        const wantsPhoto = /사진/.test(text);
        o.chat.push({ from: 'them', t: new Date().toISOString(), text: r });
        if (wantsPhoto) { o.progressPhotos = Math.max(o.progressPhotos, 1); o.chat.push({ from: 'them', t: new Date().toISOString(), text: '작업 중인 사진이에요', img: kindOf(o.garments[0]) }); }
        save();
        box.querySelector('.typing')?.remove();
        box.insertAdjacentHTML('beforeend', `<div class="msg them">${esc(r)}<span class="t">${fmtTime(new Date())}</span></div>` + (wantsPhoto ? `<div class="msg them img">${workSample(kindOf(o.garments[0]), 1).after}</div>` : ''));
        box.scrollTop = box.scrollHeight;
      }, 1300);
    };
    el.querySelector('#cf').addEventListener('submit', e => { e.preventDefault(); send(inp.value); inp.value = ''; });
    el.addEventListener('click', e => { const q = e.target.closest('[data-qr]'); if (q) send(q.dataset.qr); });
    return () => clearTimeout(timer);
  },
});

// ───────── 리뷰 ─────────
screen('review', {
  render(id) {
    const o = orderOf(id); if (!o) return appbar('리뷰');
    const s = shopOf(o.shopId), r = o._rv || (o._rv = { star: 0, tags: [], text: '', photos: [] });
    return `${appbar('리뷰 쓰기')}
    <main class="content">
      <section class="card" style="display:flex;gap:12px;align-items:center"><span style="width:48px;height:48px;border-radius:12px;overflow:hidden;flex:none">${shopHero(s)}</span><span><b>${esc(s.name)}</b><br><span class="small sub">${o.garments.map(gTitle).map(esc).join(', ')} ${fmtShort(new Date(o.history[o.history.length - 1]))}</span></span></section>
      <div class="qhead" style="align-items:center;text-align:center"><h2>수선 결과는 만족스러우셨나요?</h2></div>
      <div class="bigstars">${[1, 2, 3, 4, 5].map(n => `<button data-star="${n}" class="${n <= r.star ? 'on' : ''}" aria-label="${n}점">${ic('star')}</button>`).join('')}</div>
      <section class="sec"><div class="group-h">어떤 점이 좋았나요?</div><div class="chips wrap">${REVIEW_TAGS.map(t => `<button class="chip sm filter" data-tag="${t}" aria-pressed="${r.tags.includes(t)}">${t}</button>`).join('')}</div></section>
      <section class="sec"><div class="group-h">요청한 치수와 비교</div>
        ${o.garments.map(g => { const c = Object.keys(g.after || {}).filter(f => g.after[f] !== g.m[f]); return c.length ? `<div class="card flat small" style="display:flex;flex-direction:column;gap:6px">${c.map(f => `<div class="row between"><span>${FIELDS[f].label}</span><span>요청 <b>${cm(g.after[f])}</b></span></div>`).join('')}<div class="row" style="gap:6px"><button class="chip sm filter" data-fit="ok" aria-pressed="${r.fit === 'ok'}">요청대로 됐어요</button><button class="chip sm filter" data-fit="off" aria-pressed="${r.fit === 'off'}">조금 달라요</button></div></div>` : ''; }).join('')}</section>
      <section class="sec"><div class="group-h">수선 후기</div><textarea class="input" id="rt" placeholder="수선 경험을 자유롭게 적어주세요">${esc(r.text)}</textarea></section>
      <section class="sec"><div class="group-h">수선 전후 사진 <small>선택</small></div>
        <div class="photos">${['Before', 'After'].map((t, i) => r.photos[i] ? `<div class="photo-slot"><img src="${r.photos[i]}" alt="${t}"></div>` : `<label class="photo-slot">${ic('camera')}<span>${t}</span><input type="file" accept="image/*" data-ph="${i}"></label>`).join('')}</div></section>
      ${r.fit === 'off' ? `<div class="notice warn">${ic('alert-triangle')}<span>요청과 다르다면 리뷰 대신 <b>재수선 요청</b>을 먼저 해보세요. 옷라인이 수선집과 조율해 드려요. <button class="link strong" data-go="claim" data-p="${o.id}">재수선 요청하기</button></span></div>` : ''}
    </main>
    <footer class="cta"><button class="btn primary" data-submit ${r.star ? '' : 'disabled'}>${r.star ? '리뷰 등록하기' : '별점을 골라주세요'}</button></footer>`;
  },
  mount(el, id) {
    const o = orderOf(id); if (!o) return; const r = o._rv;
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.star) { r.star = +b.dataset.star; refresh(); }
      else if (b.dataset.tag) { const i = r.tags.indexOf(b.dataset.tag); if (i >= 0) r.tags.splice(i, 1); else r.tags.push(b.dataset.tag); b.setAttribute('aria-pressed', r.tags.includes(b.dataset.tag)); }
      else if (b.dataset.fit) { r.fit = b.dataset.fit; refresh(); }
      else if (b.hasAttribute('data-submit')) {
        const d = new Date();
        state.myReviews.unshift({ shopId: o.shopId, orderId: o.id, who: '나', star: r.star, date: d.toISOString().slice(0, 10), cat: o.garments[0].cat, tags: r.tags, text: r.text || '만족해요.', photos: r.photos });
        o.reviewed = true; delete o._rv; save(); toast('리뷰를 등록했어요. 다음 수선 1,000원 할인!', 'star'); back();
      }
    });
    el.querySelector('#rt').addEventListener('input', e => { r.text = e.target.value; });
    el.addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { r.photos[+e.target.dataset.ph] = rd.result; refresh(); }; rd.readAsDataURL(f); });
  },
});

// ───────── 환불 / 재수선 ─────────
const REASONS = ['요청한 치수와 달라요', '마감이 깔끔하지 않아요', '옷이 손상됐어요', '약속한 날짜보다 늦었어요', '기타'];
screen('claim', {
  render(id) {
    const o = orderOf(id); if (!o) return appbar('문의');
    const s = shopOf(o.shopId), c = o._cl || (o._cl = { type: 'redo', reason: REASONS[0], text: '' });
    const g = o.garments[0], ch = Object.keys(g.after || {}).filter(f => g.after[f] !== g.m[f]);
    return `${appbar('재수선, 환불 요청')}
    <main class="content">
      <section class="card" style="display:flex;flex-direction:column;gap:6px"><span class="xs muted">문의할 주문</span><b>${esc(s.name)}</b><span class="small sub">${o.garments.map(gTitle).map(esc).join(', ')}, ${won((o.quote || quote(o.garments, s, o.booking)).total)}</span></section>
      <section class="sec"><div class="group-h">어떤 도움이 필요하신가요?</div><div class="opts">
        ${[['redo', '재수선 요청', '같은 수선집에서 무료로 다시 고쳐요', 'repeat'], ['refund', '환불 요청', '수선 결과를 확인하고 일부나 전부 돌려드려요', 'wallet'], ['etc', '기타 문의', '옷라인 상담원이 답해드려요', 'help-circle']].map(([k, t, d, i]) => `<button class="opt" data-type="${k}" aria-pressed="${c.type === k}"><span class="ico">${ic(i)}</span><span><b>${t}</b><small>${d}</small></span><span class="radio"></span></button>`).join('')}</div></section>
      <section class="sec"><div class="group-h">요청 사유</div><div class="chips wrap">${REASONS.map(r => `<button class="chip sm filter" data-reason="${r}" aria-pressed="${c.reason === r}">${r}</button>`).join('')}</div></section>
      ${ch.length ? `<section class="sec"><div class="group-h">기존 수선 요청서</div><div class="card flat small">${ch.map(f => `<div class="row between" style="padding:4px 0"><span>${FIELDS[f].label}</span><span>${cm(g.m[f])} → <b>${cm(g.after[f])}</b> 요청</span></div>`).join('')}
        <label class="field" style="margin-top:8px"><span>받은 옷을 재보니 (선택)</span><span class="unit" data-u="cm"><input class="input" type="number" id="got" placeholder="${cm(g.after[ch[0]]).replace('cm', '')}" step="0.5"></span></label></div></section>` : ''}
      <section class="sec"><div class="group-h">상세 내용</div><textarea class="input" id="ct" placeholder="불편한 점을 적어주세요">${esc(c.text)}</textarea>
        <label class="photo-slot" style="aspect-ratio:auto;height:64px;flex-direction:row">${ic('camera')}<span>수선 결과 사진 첨부</span><input type="file" accept="image/*"></label></section>
      <div class="notice">${ic('life-buoy')}<span><b>옷라인이 도와드릴게요.</b> 요청은 수선집에 바로 가지 않고 옷라인이 먼저 확인한 뒤 전달해요. 결과는 MY 옷라인 &gt; 재수선/환불 문의에서 볼 수 있어요.</span></div>
    </main>
    <footer class="cta"><button class="btn primary" data-submit>문의 접수하기</button></footer>`;
  },
  mount(el, id) {
    const o = orderOf(id); if (!o) return; const c = o._cl;
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.type) { c.type = b.dataset.type; el.querySelectorAll('[data-type]').forEach(x => x.setAttribute('aria-pressed', x === b)); }
      else if (b.dataset.reason) { c.reason = b.dataset.reason; el.querySelectorAll('[data-reason]').forEach(x => x.setAttribute('aria-pressed', x === b)); }
      else if (b.hasAttribute('data-submit')) {
        state.claims.unshift({ id: 'c' + Date.now(), orderId: o.id, shopId: o.shopId, type: c.type, reason: c.reason, text: c.text, got: el.querySelector('#got')?.value || null, at: new Date().toISOString(), status: '옷라인 검토 중' });
        o.claimed = true; delete o._cl;
        state.alerts.unshift({ id: 'a' + Date.now(), t: new Date().toISOString(), icon: 'life-buoy', title: '문의를 접수했어요', body: '옷라인이 확인하고 하루 안에 답해드릴게요.', to: 'my', read: false });
        save(); toast('문의를 접수했어요', 'life-buoy'); back();
      }
    });
    el.querySelector('#ct').addEventListener('input', e => { c.text = e.target.value; });
  },
});
