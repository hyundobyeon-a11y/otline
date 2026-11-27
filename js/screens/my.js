// 좋아요, MY 옷라인, 내 옷장
import { screen, go, refresh } from '../router.js';
import { ic, esc, sheet, toast, appbar, fmtShort } from '../ui.js';
import { state, save, activeOrders, doneOrders, startDraft, resetAll } from '../store.js';
import { SHOPS, FIELDS, CAT_FIELDS, CATEGORIES, catOf, shopOf, won, cm } from '../data.js';
import { catIcon } from '../garments.js';
import { shopRow, wireShopRows } from './home.js';
import { orderCard, reorder } from './orders.js';

let likeSeg = 'shops';
screen('likes', {
  tab: 'likes',
  render() {
    const shops = SHOPS.filter(s => state.likes.includes(s.id));
    return `<header class="appbar large"><span></span><h1>좋아요</h1><span></span></header>
    <main class="content">
      <div class="seg"><button data-seg="shops" aria-pressed="${likeSeg === 'shops'}">수선집 ${shops.length}</button><button data-seg="drafts" aria-pressed="${likeSeg === 'drafts'}">저장한 요청서 ${state.savedDrafts.length}</button></div>
      ${likeSeg === 'shops'
        ? `<p class="small muted">관심 있는 수선집을 모아두면 요청서를 만들 때 먼저 보여드려요.</p><div id="likeList">${shops.map(s => shopRow(s)).join('') || `<div class="empty">${ic('heart')}<b>좋아요한 수선집이 없어요</b><span>수선집 옆 하트를 눌러보세요</span></div>`}</div>`
        : state.savedDrafts.map(d => `<article class="order"><div class="top"><span>${fmtShort(new Date(d.at))} 저장</span><span class="st wait">작성 중</span></div>
          <div class="mid"><span class="gi">${d.draft.garments[0]?.cat ? catIcon(d.draft.garments[0].cat) : ''}</span><span class="grow"><b>${d.draft.garments.map(g => esc(g.name || g.sub || (g.cat ? catOf(g.cat).name : '의류'))).join(', ')}</b><br><span class="small sub">${d.draft.garments.length}벌</span></span></div>
          <div class="acts"><button class="btn sm line grow" data-del="${d.id}">지우기</button><button class="btn sm primary grow" data-resume="${d.id}">이어서 만들기</button></div></article>`).join('') || `<div class="empty">${ic('bookmark')}<b>저장한 요청서가 없어요</b><span>요청서를 만들다 저장하면 여기서 이어서 만들 수 있어요</span></div>`}
    </main>`;
  },
  mount(el) {
    wireShopRows(el, () => setTimeout(refresh, 250));
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.seg) { likeSeg = b.dataset.seg; refresh(); }
      else if (b.dataset.del) { state.savedDrafts = state.savedDrafts.filter(d => d.id !== b.dataset.del); save(); refresh(); }
      else if (b.dataset.resume) { const d = state.savedDrafts.find(x => x.id === b.dataset.resume); state.draft = JSON.parse(JSON.stringify(d.draft)); state.savedDrafts = state.savedDrafts.filter(x => x !== d); save(); const g = state.draft.garments[state.draft.cur]; go(!g.cat ? 'req-cat' : !g.items.length ? 'req-items' : 'req-sheet'); }
    });
  },
});

screen('my', {
  tab: 'my',
  render() {
    const act = activeOrders().length, done = doneOrders(), last = done[0];
    const lastShop = last && shopOf(last.shopId);
    return `<header class="appbar large"><span></span><h1>MY 옷라인</h1><button class="ib" data-go="alerts" aria-label="알림">${ic('bell', 'ic-24')}</button></header>
    <main class="content">
      <div class="profile"><span class="av">${ic('user-round')}</span><div class="grow"><b>옷라인 회원님</b><br><span class="small muted">서울 성북구, 수선 ${state.orders.length}회</span></div><button class="link" data-body>내 치수 ${ic('chevron-right', 'ic-16')}</button></div>
      <div class="stats"><button data-tab="orders"><b>${act}</b>진행 중</button><button data-tab="orders"><b>${done.length}</b>완료</button><button data-rvs><b>${state.myReviews.length}</b>내 리뷰</button></div>
      ${last ? `<section class="reorder"><span class="k">${ic('repeat', 'ic-16')} 원클릭 재주문</span>
        <div class="row"><span style="width:44px;height:44px;color:var(--indigo);flex:none">${catIcon(last.garments[0].cat)}</span><span class="grow"><b>${esc(last.garments[0].name || last.garments[0].sub)}</b><br><span class="small sub">${esc(lastShop.name)}, ${fmtShort(new Date(last.createdAt))}</span></span></div>
        <p class="small sub">지난번 치수와 요청사항을 그대로 불러와서 같은 수선집에 다시 맡겨요.</p>
        <button class="btn sm primary" data-reorder="${last.id}" style="width:100%">같은 요청서로 다시 맡기기</button></section>` : ''}
      ${last ? `<section class="sec"><div class="sec-h"><h3>최근 완료된 수선</h3></div>${orderCard(last)}</section>` : ''}
      <div class="menu">
        <button data-go="prices">${ic('receipt')}수선 가격표<span class="r">${ic('chevron-right', 'ic-16')}</span></button>
        <button data-go="closet">${ic('archive')}내 옷장과 저장된 치수<span class="r">${state.closet.length}벌 ${ic('chevron-right', 'ic-16')}</span></button>
        <button data-tab="orders">${ic('file-text')}지난 수선 요청서<span class="r">${state.orders.length} ${ic('chevron-right', 'ic-16')}</span></button>
        <button data-rvs>${ic('star')}내가 쓴 리뷰<span class="r">${state.myReviews.length} ${ic('chevron-right', 'ic-16')}</span></button>
        <button data-claims>${ic('life-buoy')}재수선/환불 문의 내역<span class="r">${state.claims.length} ${ic('chevron-right', 'ic-16')}</span></button>
        <button data-addr>${ic('map-pin')}픽업, 배송 주소<span class="r">${ic('chevron-right', 'ic-16')}</span></button>
      </div>
      <div class="menu">
        <button data-theme>${ic('sun-moon')}화면 테마<span class="r">${document.documentElement.dataset.theme === 'dark' ? '다크' : document.documentElement.dataset.theme === 'light' ? '라이트' : '시스템'} ${ic('chevron-right', 'ic-16')}</span></button>
        <button data-reset>${ic('rotate-ccw')}데모 처음부터<span class="r">${ic('chevron-right', 'ic-16')}</span></button>
      </div>
      <p class="note" style="text-align:center">옷라인 5조 프로토타입. 수선집은 이름과 주소만 실제이고, 별점, 후기는 예시예요.</p>
    </main>`;
  },
  mount(el) {
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.reorder) reorder(state.orders.find(o => o.id === b.dataset.reorder));
      else if (b.hasAttribute('data-body')) bodySheet();
      else if (b.hasAttribute('data-rvs')) sheet(`<h3>내가 쓴 리뷰</h3><div class="body">${state.myReviews.map(r => `<div class="card flat"><b>${esc(shopOf(r.shopId).name)}</b> <span class="stars">${ic('star')}${r.star}</span><p class="small sub" style="margin-top:4px">${esc(r.text)}</p></div>`).join('') || '<p class="sub small">아직 쓴 리뷰가 없어요. 완료된 수선에서 리뷰를 쓰면 다음 수선 때 1,000원 할인돼요.</p>'}</div><button class="btn primary" data-close>닫기</button>`);
      else if (b.hasAttribute('data-claims')) sheet(`<h3>재수선/환불 문의</h3><div class="body">${state.claims.map(c => `<div class="card flat" style="display:flex;flex-direction:column;gap:4px"><div class="row between"><b>${c.type === 'redo' ? '재수선 요청' : c.type === 'refund' ? '환불 요청' : '기타 문의'}</b><span class="tag yellow">${esc(c.status)}</span></div><span class="small sub">${esc(shopOf(c.shopId).name)}, ${esc(c.reason)}</span>${c.got ? `<span class="xs muted">받은 치수 ${esc(c.got)}cm</span>` : ''}</div>`).join('') || '<p class="sub small">문의 내역이 없어요.</p>'}</div><button class="btn primary" data-close>닫기</button>`);
      else if (b.hasAttribute('data-addr')) sheet(`<h3>픽업, 배송 주소</h3><div class="body"><div class="opt" aria-pressed="true"><span class="ico">${ic('house')}</span><span><b>집</b><small>서울 성북구 개운사길 50 (가상)</small></span></div><div class="opt"><span class="ico">${ic('building-2')}</span><span><b>학교</b><small>서울 성북구 안암로 145 (가상)</small></span></div></div><button class="btn primary" data-close>확인</button>`);
      else if (b.hasAttribute('data-theme')) { const r = document.documentElement, cur = r.dataset.theme; const nx = !cur ? 'dark' : cur === 'dark' ? 'light' : ''; if (nx) r.dataset.theme = nx; else delete r.dataset.theme; try { localStorage.setItem('otline-theme', nx); } catch (e) {} refresh(); }
      else if (b.hasAttribute('data-reset')) sheet(`<h3>데모를 처음 상태로 돌릴까요?</h3><div class="body"><p class="sub small">이 브라우저에 저장된 요청서, 주문, 리뷰, 옷장이 처음 예시로 돌아가요.</p></div><div class="row"><button class="btn line" data-close>취소</button><button class="btn primary" data-doreset>처음부터</button></div>`, (sh, close) => sh.querySelector('[data-doreset]').addEventListener('click', () => { resetAll(); close(); setTimeout(() => location.reload(), 250); }));
    });
  },
});

function bodySheet() {
  const b = state.body;
  const f = (k, t, u = 'cm') => `<label class="field"><span>${t}</span><span class="unit" data-u="${u}"><input class="input" type="number" data-k="${k}" value="${b[k]}" step="0.5"></span></label>`;
  sheet(`<h3>내 신체 치수</h3><div class="body"><p class="small sub">요청서를 만들 때마다 이 치수로 핏을 계산해요.</p>
    <div class="seg"><button data-sex="M" aria-pressed="${b.sex === 'M'}">남성</button><button data-sex="F" aria-pressed="${b.sex === 'F'}">여성</button></div>
    <div class="grid2">${f('height', '키')}${f('weight', '몸무게', 'kg')}${f('waist', '허리둘레')}${f('hip', '엉덩이둘레')}</div>${f('inseam', '다리 안쪽 길이')}</div>
    <button class="btn primary" data-close>저장</button>`, sh => {
    sh.addEventListener('input', e => { const k = e.target.dataset.k, v = parseFloat(e.target.value); if (k && isFinite(v)) { b[k] = v; save(); } });
    sh.addEventListener('click', e => { const s = e.target.closest('[data-sex]'); if (s) { b.sex = s.dataset.sex; save(); sh.querySelectorAll('[data-sex]').forEach(x => x.setAttribute('aria-pressed', x === s)); } });
  });
}

screen('closet', {
  render() {
    return `${appbar('내 옷장')}
    <main class="content">
      <p class="small sub">수선을 맡긴 옷의 치수가 자동으로 저장돼요. 옷을 누르면 그 치수로 바로 요청서를 만들어요.</p>
      <div class="closet">${state.closet.map(w => `<button data-w="${w.id}"><span class="gi">${catIcon(w.cat)}</span><b>${esc(w.name)}</b><small>${esc(catOf(w.cat).name)} / ${esc(w.sub || '')}<br>${CAT_FIELDS[w.cat].slice(0, 3).map(f => `${FIELDS[f].label} ${cm(w.m[f])}`).join(', ')}</small></button>`).join('')}</div>
      <button class="btn line stitch" data-new style="height:56px;flex:none">${ic('plus')}새 옷으로 요청서 만들기</button>
    </main>`;
  },
  mount(el) {
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.w) { const w = state.closet.find(x => x.id === b.dataset.w); startDraft({ from: w }); go('req-items'); }
      if (b.hasAttribute('data-new')) { startDraft(); go('req-cat'); }
    });
  },
});
