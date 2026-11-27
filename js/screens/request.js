// 수선 맡기기 5단계: 의류와 항목 → 실측 → AI 핏 → 세부 요청 → 요청서
import { screen, go, back, refresh, backTo, current } from '../router.js';
import { ic, esc, sheet, toast, tapeProgress, keepFocus } from '../ui.js';
import { state, save, curG, setCat, addGarment, fitItems, repairItems, hasFit, hasRepair, initAfter, changes, applicableOptions, quote, garmentLines } from '../store.js';
import { CATEGORIES, ITEMS, FIELDS, CAT_FIELDS, PANTS_PRESETS, FIT2D_PRESETS, METHODS, DAMAGE_ZONES, DAMAGE_TYPES, SUB_PRESET, catOf, itemOf, won, cm, pantsLenAtFloor } from '../data.js';
import { catIcon, sketch, damageMap, fit2d, fit2dPreset, workSample } from '../garments.js';

export const snaps = new Map(); // 3D After 캡처 (저장 안 함, 화면 사이에서만)
const TOTAL = 5;
const r05 = v => Math.round(v * 2) / 2;
const gNo = () => String(state.draft.cur + 1).padStart(2, '0');
const gTitle = g => g.name || g.sub || (g.cat ? catOf(g.cat).name : '의류');

function guard() { if (!state.draft || !curG()) { setTimeout(() => backTo('home'), 0); return false; } return true; }
function bar(title) {
  return `<header class="appbar"><button class="ib" data-back aria-label="뒤로">${ic('chevron-left', 'ic-24')}</button><h1>${esc(title)}</h1>
    <button class="ib" data-quit aria-label="그만두기">${ic('x', 'ic-24')}</button></header>`;
}
function quitSheet() {
  sheet(`<h3>요청서 작성을 멈출까요?</h3><div class="body"><p class="sub small">저장하면 좋아요 탭의 '저장한 요청서'에서 이어서 만들 수 있어요.</p></div>
    <div class="row"><button class="btn line" data-x="drop">그냥 나가기</button><button class="btn primary" data-x="save">저장하고 나가기</button></div>`, (sh, close) => {
    sh.addEventListener('click', e => {
      const b = e.target.closest('[data-x]'); if (!b) return;
      if (b.dataset.x === 'save') { state.savedDrafts.unshift({ id: 'd' + Date.now(), at: new Date().toISOString(), draft: JSON.parse(JSON.stringify(state.draft)) }); toast('요청서를 저장했어요', 'bookmark'); }
      state.draft = null; save(); close(); setTimeout(() => backTo('home'), 150);
    });
  });
}
function wireQuit(el) { el.querySelector('[data-quit]')?.addEventListener('click', quitSheet); }
function prevGarments() {
  const d = state.draft; if (d.garments.length < 2) return '';
  return `<div class="chips">${d.garments.map((g, i) => i === d.cur ? `<span class="chip" aria-pressed="true">의류 ${String(i + 1).padStart(2, '0')} 작성 중</span>` : `<span class="chip"><span style="width:18px;height:18px;display:inline-flex;color:var(--indigo)">${g.cat ? catIcon(g.cat) : ''}</span>${esc(gTitle(g))}</span>`).join('')}</div>`;
}

// ───────── STEP 1. 의류 ─────────
screen('req-cat', {
  render() {
    if (!guard()) return '';
    const g = curG(), cat = g.cat && catOf(g.cat);
    return `${bar('수선 맡기기')}
    <main class="content">
      ${tapeProgress(1, TOTAL, '의류 선택')}
      ${prevGarments()}
      <div class="qhead"><h2>어떤 옷을 수선할까요?</h2><p>한 벌씩 만들고, 요청서에서 옷을 더 추가할 수 있어요</p></div>
      ${state.closet.length ? `<section class="sec"><div class="group-h">${ic('archive', 'ic-16')}내 옷장에서 고르기 <small>지난번 치수가 그대로 들어가요</small></div>
        <div class="chips">${state.closet.map(w => `<button class="chip" data-closet="${w.id}" aria-pressed="${g.closetId === w.id}"><span style="width:18px;height:18px;display:inline-flex">${catIcon(w.cat)}</span>${esc(w.name)}</button>`).join('')}</div></section>` : ''}
      <div class="cats" role="group" aria-label="의류 종류">
        ${CATEGORIES.map(c => `<button data-cat="${c.id}" aria-pressed="${g.cat === c.id}"><span class="gi">${catIcon(c.id)}</span>${c.name}<span class="tg">${c.fit3d ? '3D 핏 미리보기' : '핏 미리보기'}</span></button>`).join('')}
      </div>
      ${cat ? `<section class="sec"><div class="group-h">${cat.name} 종류</div>
        <div class="chips wrap">${cat.subs.map(s => `<button class="chip" data-sub="${esc(s)}" aria-pressed="${g.sub === s}">${esc(s)}</button>`).join('')}<button class="chip" data-sub="기타" aria-pressed="${g.sub === '기타'}">기타</button></div>
        <label class="field"><span>옷 이름 <em class="muted" style="font-style:normal">선택</em></span><input class="input" id="gname" placeholder="예: 검정 슬랙스" value="${esc(g.name)}" maxlength="20" style="font-weight:500"></label></section>` : ''}
    </main>
    <footer class="cta"><button class="btn primary" data-next ${cat ? '' : 'disabled'}>다음</button></footer>`;
  },
  mount(el) {
    wireQuit(el);
    const g = curG(); if (!g) return;
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.cat) { setCat(g, b.dataset.cat); save(); keepFocus(el, refresh); }
      else if (b.dataset.sub) { g.sub = b.dataset.sub; save(); el.querySelectorAll('[data-sub]').forEach(x => x.setAttribute('aria-pressed', x === b)); }
      else if (b.dataset.closet) { const w = state.closet.find(x => x.id === b.dataset.closet); Object.assign(g, { cat: w.cat, sub: w.sub, name: w.name, closetId: w.id, m: { ...w.m }, items: [], after: {}, options: {} }); save(); refresh(); toast(`${w.name} 치수를 불러왔어요`, 'archive'); }
      else if (b.hasAttribute('data-next')) go('req-items');
    });
    el.querySelector('#gname')?.addEventListener('input', e => { g.name = e.target.value.trim(); save(); });
  },
});

// ───────── STEP 1. 수선 항목 ─────────
screen('req-items', {
  render() {
    if (!guard()) return '';
    const g = curG(), list = ITEMS[g.cat] || [];
    const row = it => `<button class="check" data-item="${it.id}" aria-pressed="${g.items.includes(it.id)}"><span class="box">${ic('check')}</span><span>${esc(it.name)}</span><span class="p">${won(it.price)}~</span></button>`;
    const fit = hasFit(g), rep = hasRepair(g);
    const next = !g.items.length ? '수선할 부분을 골라주세요' : fit ? '다음: 실측 사이즈 입력' : '다음: 손상 부위 알려주기';
    return `${bar('수선 항목 선택')}
    <main class="content">
      ${tapeProgress(1, TOTAL, '수선 항목')}
      <div class="mini-sum"><span class="gi">${catIcon(g.cat)}</span><span class="grow"><span class="xs muted">의류 ${gNo()}</span><br><b>${esc(catOf(g.cat).name)} / ${esc(g.sub || '')}</b>${g.name ? ` <span class="small muted">${esc(g.name)}</span>` : ''}</span><button class="btn xs line" data-back>변경</button></div>
      <div class="qhead"><h2>어떤 부분을 수선할까요?</h2><p>여러 항목을 함께 고를 수 있어요</p></div>
      <section class="sec"><div class="group-h">${ic('ruler', 'ic-16')}핏, 사이즈 수선 <span class="tag indigo">${catOf(g.cat).fit3d ? '3D' : 'AI'} 핏 미리보기</span></div>
        <div class="opts">${list.filter(i => i.group === 'fit').map(row).join('')}</div></section>
      <section class="sec"><div class="group-h">${ic('wrench', 'ic-16')}기타 수선, 손상 복원</div>
        <div class="opts">${list.filter(i => i.group === 'repair').map(row).join('')}</div>
        <p class="note">${ic('info', 'ic-16')} 기타 수선만 고르면 핏 미리보기 없이 손상 부위와 사진으로 바로 요청서를 만들어요.</p></section>
    </main>
    <footer class="cta"><div class="sum"><small>표준가 합계</small><b class="price">${won(garmentLines(g).reduce((a, l) => a + l.p, 0))}</b></div>
      <button class="btn primary" data-next ${g.items.length ? '' : 'disabled'}>${next}</button></footer>`;
  },
  mount(el) {
    wireQuit(el);
    const g = curG(); if (!g) return;
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.item) { const i = g.items.indexOf(b.dataset.item); if (i >= 0) g.items.splice(i, 1); else g.items.push(b.dataset.item); g.after = {}; save(); refresh(); }
      else if (b.hasAttribute('data-next')) go(hasFit(g) ? 'req-measure' : 'req-detail');
    });
  },
});

// ───────── STEP 2. 실측 ─────────
let focusField = null;
screen('req-measure', {
  render() {
    if (!guard()) return '';
    const g = curG(), b = state.body, fields = CAT_FIELDS[g.cat];
    const touched = new Set(fitItems(g).flatMap(i => i.changes || []));
    const num = (id, label, v, u = 'cm', min, max) => `<label class="field"><span>${label}</span><span class="unit" data-u="${u}"><input class="input" type="number" inputmode="decimal" id="${id}" value="${v}" min="${min}" max="${max}" step="0.5"></span></label>`;
    return `${bar('실측 사이즈 입력')}
    <main class="content">
      ${tapeProgress(2, TOTAL, '실측 사이즈')}
      <div class="qhead"><h2>치수를 알려주세요</h2><p>내 몸 치수와 옷의 실측 사이즈로 수선 후 핏을 계산해요</p></div>
      <section class="card sec">
        <div class="sec-h"><h3>내 신체 정보</h3><span class="tag ok">${ic('check', 'ic-16')}저장된 치수</span></div>
        <div class="seg" role="group" aria-label="성별"><button data-sex="M" aria-pressed="${b.sex === 'M'}">남성</button><button data-sex="F" aria-pressed="${b.sex === 'F'}">여성</button></div>
        <div class="grid2">
          ${num('b-height', '키', b.height, 'cm', 140, 200)}${num('b-weight', '몸무게', b.weight, 'kg', 35, 140)}
          ${num('b-waist', '허리둘레', b.waist, 'cm', 55, 130)}${num('b-hip', '엉덩이둘레', b.hip, 'cm', 70, 150)}
        </div>
        ${g.cat === 'pants' || g.cat === 'skirt' || g.cat === 'dress' ? num('b-inseam', '다리 안쪽 길이 (가랑이에서 바닥까지)', b.inseam, 'cm', 60, 100) : ''}
      </section>
      <section class="card sec">
        <div class="sec-h"><h3>맡길 의류 <span class="muted small" style="font-weight:500">${esc(gTitle(g))}</span></h3><button class="link strong" data-guide>${ic('ruler', 'ic-16')} 재는 법</button></div>
        <div class="sketchbox" id="sk">${sketch(g.cat, { m: g.m, highlight: focusField && fields.includes(focusField) ? focusField : [...touched][0], labels: true })}</div>
        <div class="grid2">${fields.map(f => `<label class="field"><span>${FIELDS[f].label}${touched.has(f) ? ' <span class="tag yellow" style="height:18px">수선</span>' : ''}</span><span class="unit" data-u="cm"><input class="input${touched.has(f) ? ' hl' : ''}" type="number" inputmode="decimal" id="m-${f}" data-f="${f}" value="${g.m[f] ?? ''}" step="0.5"></span></label>`).join('')}</div>
        <p class="note">단면은 옷을 바닥에 펼쳐 잰 한쪽 폭이에요. 쇼핑몰 상품 페이지의 실측 사이즈를 그대로 넣어도 돼요.</p>
      </section>
    </main>
    <footer class="cta"><button class="btn primary" data-next>다음: 핏 미리보기</button></footer>`;
  },
  mount(el) {
    wireQuit(el);
    const g = curG(); if (!g) return;
    if (g.cat === 'pants') import('../fit3d.js').then(m => m.preload && m.preload(state.body.sex)).catch(() => {});
    const sk = el.querySelector('#sk');
    const redraw = f => { sk.innerHTML = sketch(g.cat, { m: g.m, highlight: f, labels: true }); };
    el.addEventListener('focusin', e => { const f = e.target.dataset && e.target.dataset.f; if (f) { focusField = f; redraw(f); } });
    el.addEventListener('input', e => {
      const t = e.target, v = parseFloat(t.value); if (!isFinite(v)) return;
      if (t.dataset.f) { g.m[t.dataset.f] = v; g.after = {}; redraw(t.dataset.f); }
      else if (t.id.startsWith('b-')) state.body[t.id.slice(2)] = v;
      save();
    });
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.sex) { state.body.sex = b.dataset.sex; if (b.dataset.sex === 'F' && state.body.height > 168) Object.assign(state.body, { height: 163, weight: 54, waist: 68, hip: 92, inseam: 74 }); if (b.dataset.sex === 'M' && state.body.height < 168) Object.assign(state.body, { height: 174, weight: 72, waist: 82, hip: 96, inseam: 79 }); save(); keepFocus(el, refresh); }
      else if (b.hasAttribute('data-guide')) guideSheet(g);
      else if (b.hasAttribute('data-next')) { g.after = {}; initAfter(g); save(); go('req-fit'); }
    });
  },
});
function guideSheet(g) {
  sheet(`<h3>실측 사이즈 재는 법</h3><div class="body">
    <div class="sketchbox" style="background:var(--surface-2)">${sketch(g.cat, { m: null, highlight: null, labels: true })}</div>
    ${CAT_FIELDS[g.cat].map(f => `<div class="row" style="align-items:flex-start"><span class="tag yellow" style="min-width:74px;justify-content:center">${FIELDS[f].label}</span><span class="small sub">${FIELDS[f].hint}</span></div>`).join('')}
    <div class="notice">${ic('lightbulb')}<span>옷을 평평한 바닥에 펼치고, 줄자를 당기지 않은 채로 재주세요. 단면 × 2 가 둘레예요.</span></div></div>
    <button class="btn primary" data-close>확인</button>`);
}

// ───────── STEP 3. AI 핏 ─────────
function kindFor(g, it) {
  if (it.id === 'hem') return g.cat === 'skirt' ? 'skirt_hem' : g.cat === 'dress' ? 'dress_hem' : g.cat === 'pants' ? null : 'top_hem';
  if (it.id === 'sleeve') return g.cat === 'tee' && g.sub !== '긴팔' && g.sub !== '맨투맨' && g.sub !== '후드' ? 'short_sleeve' : 'sleeve';
  if (['chestIn', 'sideIn'].includes(it.id) || (g.cat === 'dress' && it.id === 'waistIn')) return 'width';
  return null;
}
function legIcon(floor) { // 프리셋 버튼 안의 작은 바짓단 그림
  const y = 40 - floor * 1.6;
  return `<svg viewBox="0 0 34 44" aria-hidden="true"><rect x="10" y="2" width="9" height="${y - 2}" rx="1.5" fill="var(--fabric)" stroke="var(--fabric-line)" stroke-width="1"/><path d="M11 ${Math.min(42, y + 1)} L11 42 L24 42 Q26 42 26 40 L26 38 L19 37 L19 ${Math.min(42, y + 1)}" fill="var(--skin)" stroke="var(--skin-2)" stroke-width="1"/><line x1="3" y1="42.5" x2="31" y2="42.5" stroke="var(--line-strong)" stroke-width="1"/></svg>`;
}
function slider(id, label, val, min, max, base) {
  const d = r05(val - base);
  return `<div class="slider"><div class="top"><span>${label}</span><output id="o-${id}">${cm(val)}${d ? `<small>${d > 0 ? '+' : '−'}${cm(Math.abs(d))}</small>` : ''}</output></div>
    <input type="range" class="tape-range" id="r-${id}" data-f="${id}" min="${min}" max="${max}" step="0.5" value="${val}" aria-label="${label}">
    <div class="ends"><span>${cm(min)}</span><span>지금 ${cm(base)}</span></div></div>`;
}
screen('req-fit', {
  render() {
    if (!guard()) return '';
    const g = curG(), b = state.body, its = fitItems(g);
    if (!Object.keys(g.after).length) initAfter(g);
    const use3d = g.cat === 'pants';
    const ch = changes(g);
    const main = ch[0];
    let controls = '';
    for (const it of its) {
      if (g.cat === 'pants' && it.id === 'hem') {
        const rec = SUB_PRESET[g.sub] || 'mid', recP = PANTS_PRESETS.find(p => p.id === rec);
        controls += `<section class="sec"><div class="group-h">${ic('ruler', 'ic-16')}기장 <small>밑단이 발목 어디쯤 올지 골라요</small></div>
          ${(() => { const recLen = pantsLenAtFloor(b, g.m, recP.floor), nowFloor = b.inseam - (g.m.len - g.m.rise);
            return recLen < g.m.len
              ? `<div class="ai-note">${ic('sparkles')}<span>지금은 밑단이 ${nowFloor <= 0 ? `바닥에 ${cm(-nowFloor || 0)} 쌓여요` : `바닥 위 ${cm(nowFloor)}에 와요`}. 키 ${b.height}cm, 다리 안쪽 ${b.inseam}cm 기준 ${esc(g.sub || '바지')} 추천 기장: <b>${recP.name}</b> (총장 ${cm(recLen)}, ${cm(g.m.len - recLen)} 줄임)</span></div>`
              : `<div class="ai-note">${ic('sparkles')}<span>지금 밑단이 바닥 위 ${cm(nowFloor)}라 ${esc(g.sub || '바지')} 추천 기장(<b>${recP.name}</b>)보다 이미 짧아요. 더 짧게 원할 때만 줄이세요</span></div>`; })()}
          <div class="presets">${PANTS_PRESETS.map(p => `<button data-preset="${p.id}" aria-pressed="${g.preset === p.id}">${legIcon(p.floor)}${p.name}<small>바닥 위 ${p.floor}cm</small></button>`).join('')}</div>
          ${slider('len', '총장', g.after.len, Math.max(60, g.m.len - 24), g.m.len, g.m.len)}</section>`;
      } else if (g.cat === 'pants') {
        if (it.id === 'hemW') controls += `<section class="sec">${slider('hemH', '밑단단면', g.after.hemH, Math.max(12, g.m.hemH - 7), g.m.hemH, g.m.hemH)}</section>`;
        if (it.id === 'taper') controls += `<section class="sec"><div class="group-h">통 줄임 <small>허벅지부터 밑단까지 자연스럽게</small></div>${slider('thighH', '허벅지단면', g.after.thighH, Math.max(18, g.m.thighH - 5), g.m.thighH, g.m.thighH)}${its.some(i => i.id === 'hemW') ? '' : slider('hemH', '밑단단면', g.after.hemH, Math.max(12, g.m.hemH - 7), g.m.hemH, g.m.hemH)}</section>`;
        if (it.id === 'waistIn' || it.id === 'waistOut') { const up = it.id === 'waistOut'; controls += `<section class="sec">${slider('waistH', '허리단면', g.after.waistH, up ? g.m.waistH : g.m.waistH - 5, up ? g.m.waistH + 4 : g.m.waistH, g.m.waistH)}<p class="note">내 허리둘레 ${b.waist}cm면 허리단면 ${cm(b.waist / 2 + 1)} 정도가 편해요. 허리 변화는 3D 대신 요청서 치수로 전달돼요.</p></section>`; }
      } else {
        const kind = kindFor(g, it), ps = kind && FIT2D_PRESETS[kind];
        const f = (it.changes || [])[0];
        controls += `<section class="sec"><div class="group-h">${esc(it.name)}</div>
          ${ps ? `<div class="presets ${ps.length === 3 ? 'n3' : ''}">${ps.map(p => `<button data-p2="${it.id}:${kind}:${p.id}" aria-pressed="${g.fitPreset[it.id] === p.id}">${esc(p.name)}</button>`).join('')}</div>` : ''}
          ${(it.changes || []).map(ff => slider(ff, FIELDS[ff].label, g.after[ff], r05(g.m[ff] * (ff === 'len' || ff === 'sleeve' ? 0.7 : 0.8)), ff === 'shoulder' || ff === 'len' || ff === 'sleeve' || ff === 'chestH' || ff === 'waistH' || ff === 'hipH' || ff === 'hemH' ? g.m[ff] : g.m[ff], g.m[ff])).join('')}</section>`;
      }
    }
    const delta = main ? `${FIELDS[main.f].label} ${main.d > 0 ? '+' : '−'}${cm(Math.abs(main.d))}` : '변경 없음';
    return `${bar('AI Fit Assistant')}
    <main class="content">
      ${tapeProgress(3, TOTAL, '원하는 핏')}
      <div class="fitstage" id="stage">
        <div class="pane">${use3d ? '<span class="lab">BEFORE</span>' : ''}${use3d ? '<canvas id="cvB" aria-label="수선 전 3D"></canvas>' : `<div id="svB" style="width:100%">${fit2d(g.cat, { body: b, m: g.m, item: its[0]?.id, mode: 'before' })}</div>`}</div>
        <div class="pane">${use3d ? '<span class="lab after">AFTER</span>' : ''}${use3d ? '<canvas id="cvA" aria-label="수선 후 3D"></canvas>' : `<div id="svA" style="width:100%">${fit2d(g.cat, { body: b, m: { ...g.after, __ghost: g.m }, item: its[0]?.id, mode: 'after' })}</div>`}</div>
        <span class="delta${use3d ? '' : ' top'}" id="delta">${esc(delta)}</span>
        ${use3d ? '<div class="loading" id="ld">3D 모델 준비 중…</div>' : ''}
      </div>
      ${use3d ? `<div class="views-row">${[['front', '정면'], ['side', '옆'], ['back', '뒤'], ['hem', '밑단 확대']].map(([k, t], i) => `<button class="chip sm" data-view="${k}" aria-pressed="${i === 0}">${t}</button>`).join('')}</div><p class="note" style="text-align:center;margin-top:-10px">드래그하면 돌려볼 수 있어요</p>` : ''}
      ${controls}
      <p class="note">${ic('info', 'ic-16')} 예상 핏이라 실제 수선 결과와 조금 다를 수 있어요.</p>
    </main>
    <footer class="cta"><button class="btn primary" data-next>다음: 세부 요청사항</button></footer>`;
  },
  mount(el) {
    wireQuit(el);
    const g = curG(); if (!g) return;
    const its = fitItems(g);
    let fit = null, alive = true, raf = 0;
    const deltaEl = el.querySelector('#delta');
    const snap = () => { if (!fit) return; const s = fit.snapshot({ front: true, both: true }); if (s && s.after) snaps.set(g.id, { before: s.before, after: s.after, key: JSON.stringify(g.after) }); };
    const upd2d = () => {
      if (g.cat === 'pants' && fit) return;
      const B = el.querySelector('#svB'), A = el.querySelector('#svA');
      if (B) B.innerHTML = fit2d(g.cat, { body: state.body, m: g.m, item: its[0]?.id, mode: 'before' });
      if (A) A.innerHTML = fit2d(g.cat, { body: state.body, m: { ...g.after, __ghost: g.m }, item: its[0]?.id, mode: 'after' });
    };
    const upd = () => {
      const ch = changes(g), main = ch[0];
      deltaEl.textContent = main ? `${FIELDS[main.f].label} ${main.d > 0 ? '+' : '−'}${cm(Math.abs(main.d))}` : '변경 없음';
      el.querySelectorAll('input[type=range]').forEach(r => { const f = r.dataset.f, o = el.querySelector('#o-' + f); const d = r05(g.after[f] - g.m[f]); if (o) o.innerHTML = `${cm(g.after[f])}${d ? `<small>${d > 0 ? '+' : '−'}${cm(Math.abs(d))}</small>` : ''}`; r.value = g.after[f]; });
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { if (fit) fit.set({ sex: state.body.sex, body: state.body, m: g.m, after: g.after }).catch(() => {}); else upd2d(); });
      save();
    };
    if (g.cat === 'pants') {
      const ld = el.querySelector('#ld');
      import('../fit3d.js').then(mod => {
        if (!alive) return;
        fit = mod.createFit3D({ before: el.querySelector('#cvB'), after: el.querySelector('#cvA'), onStatus: s => { if (ld) { ld.hidden = !s; ld.textContent = s || ''; } } });
        return fit.set({ sex: state.body.sex, body: state.body, m: g.m, after: g.after }).then(() => { if (ld) ld.hidden = true; snap(); });
      }).catch(err => {
        console.warn(err); fit && fit.dispose(); fit = null;
        // 3D 가 안 되면 그림으로 대신 보여줌
        const B = el.querySelector('#cvB'), A = el.querySelector('#cvA');
        if (B) B.outerHTML = `<div id="svB" style="width:100%"></div>`; if (A) A.outerHTML = `<div id="svA" style="width:100%"></div>`;
        if (ld) ld.hidden = true; el.querySelector('.views-row')?.remove(); upd2d();
      });
    }
    el.addEventListener('input', e => {
      const r = e.target; if (!r.dataset.f) return;
      g.after[r.dataset.f] = parseFloat(r.value);
      if (r.dataset.f === 'len' && g.cat === 'pants') { g.preset = null; el.querySelectorAll('[data-preset]').forEach(x => x.setAttribute('aria-pressed', 'false')); }
      if (r.dataset.f === 'hemH' && g.after.hemH > g.after.thighH) g.after.thighH = g.after.hemH;
      upd();
    });
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.preset) {
        const p = PANTS_PRESETS.find(x => x.id === b.dataset.preset); g.preset = p.id;
        g.after.len = Math.min(g.m.len, pantsLenAtFloor(state.body, g.m, p.floor));
        el.querySelectorAll('[data-preset]').forEach(x => x.setAttribute('aria-pressed', x === b)); upd();
      } else if (b.dataset.p2) {
        const [itId, kind, pid] = b.dataset.p2.split(':'), it = itemOf(g.cat, itId);
        const nm = fit2dPreset(g.cat, kind, pid, state.body, g.m);
        for (const f of it.changes || []) if (nm[f] != null) g.after[f] = Math.min(g.m[f], nm[f]);
        g.fitPreset[itId] = pid;
        el.querySelectorAll(`[data-p2^="${itId}:"]`).forEach(x => x.setAttribute('aria-pressed', x === b)); upd();
      } else if (b.dataset.view) { fit && fit.view(b.dataset.view); el.querySelectorAll('[data-view]').forEach(x => x.setAttribute('aria-pressed', x === b)); }
      else if (b.hasAttribute('data-next')) { snap(); go('req-detail'); }
    });
    return () => { alive = false; cancelAnimationFrame(raf); if (fit) { snap(); fit.dispose(); } };
  },
});

// ───────── STEP 4. 세부 요청 ─────────
function shrink(file) { // 사진을 긴 변 640px JPEG 로 줄여 저장
  return new Promise(res => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, 640 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.78)); };
    img.onerror = () => res(null); img.src = url;
  });
}
const svgData = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/var\(--[a-z0-9-]+\)/g, m => ({ 'var(--surface-2)': '#f5f7fa', 'var(--fabric)': '#c9d3e6', 'var(--fabric-2)': '#a9b8d6', 'var(--fabric-line)': '#6f7f9f', 'var(--ink)': '#121826', 'var(--ink-2)': '#465165', 'var(--ink-3)': '#8b94a5', 'var(--tape)': '#f3b61f', 'var(--chalk)': '#d8473d', 'var(--surface)': '#ffffff', 'var(--line)': '#e3e7ee', 'var(--line-strong)': '#cdd4df', 'var(--skin)': '#e6dfd8', 'var(--skin-2)': '#cfc6bd', 'var(--indigo)': '#233f86', 'var(--surface-3)': '#e9edf3' }[m] || '#999')));
screen('req-detail', {
  render() {
    if (!guard()) return '';
    const g = curG(), fit = hasFit(g), rep = hasRepair(g);
    const opts = applicableOptions(g);
    const types = [...new Set(repairItems(g).flatMap(it => DAMAGE_TYPES[it.id] || DAMAGE_TYPES.default))];
    const need = rep, slots = ['앞면', '뒷면', '수선 부위'];
    return `${bar(rep && !fit ? '기타 수선 요청' : '세부 요청사항')}
    <main class="content">
      ${tapeProgress(4, TOTAL, '세부 요청')}
      <div class="qhead"><h2>${fit ? '어떻게 치수를 전달할까요?' : '어떤 부분이 불편하신가요?'}</h2><p>${fit ? '정확할수록 다시 맡기는 일이 줄어요' : '옷 그림에서 손상된 곳을 눌러주세요'}</p></div>
      ${fit ? `<div class="opts">${METHODS.map(m => `<button class="opt" data-method="${m.id}" aria-pressed="${g.method === m.id}"><span class="ico">${ic(m.icon === 'pin' ? 'map-pin' : m.icon)}</span><span><b>${m.t}</b><small>${m.d}</small></span><span class="radio"></span></button>`).join('')}</div>` : ''}
      ${opts.map(o => `<section class="sec"><div class="group-h">${esc(o.q)}</div><div class="opts">${o.choices.map(c => `<button class="opt" data-opt="${o.id}:${c.v}" aria-pressed="${(g.options[o.id] || o.choices[0].v) === c.v}"><span><b>${esc(c.t)}</b>${c.sub ? `<small>${esc(c.sub)}</small>` : ''}</span><span class="add">${c.add ? '+' + won(c.add) : '추가금 없음'}</span></button>`).join('')}</div></section>`).join('')}
      ${rep ? `<section class="sec">${fit ? `<div class="group-h">${ic('wrench', 'ic-16')}기타 수선 부위 <small>${repairItems(g).map(i => i.name).join(', ')}</small></div>` : ''}
        <div class="dmg" id="dmg">${damageMap(g.cat, { selected: g.damage.zones })}</div>
        <div class="chips wrap" id="zoneChips">${DAMAGE_ZONES[g.cat].map(z => `<button class="chip sm filter" data-zone="${z.id}" aria-pressed="${g.damage.zones.includes(z.id)}">${z.label}</button>`).join('')}</div>
        <div class="group-h">구체적인 손상 유형</div>
        <div class="chips wrap">${types.map(t => `<button class="chip sm filter" data-type="${esc(t)}" aria-pressed="${g.damage.types.includes(t)}">${esc(t)}</button>`).join('')}</div></section>` : ''}
      <section class="sec"><div class="group-h">${ic('camera', 'ic-16')}의류 사진 <span class="tag ${need ? 'chalk' : ''}">${need ? '필수' : '선택'}</span> <small>최대 3장</small></div>
        <div class="photos">${slots.map((s, i) => g.photos[i] ? `<div class="photo-slot"><img src="${g.photos[i]}" alt="${s} 사진"><button class="x" data-rm="${i}" aria-label="사진 지우기">${ic('x')}</button></div>` : `<label class="photo-slot${need && !g.photos.length ? ' req' : ''}">${ic('camera')}<span>${s}</span><input type="file" accept="image/*" data-slot="${i}" aria-label="${s} 사진 올리기"></label>`).join('')}</div>
        ${!g.photos.length ? `<button class="link strong" data-sample>${ic('image-plus', 'ic-16')} 예시 사진으로 채우기 (데모)</button>` : ''}
        ${need ? '<p class="note">손상 수선은 사진이 있어야 수선사가 견적을 낼 수 있어요.</p>' : ''}</section>
      <section class="sec"><div class="group-h">추가 요청사항 <small>선택</small></div>
        <textarea class="input" id="note" maxlength="300" placeholder="${fit ? '예: 기존 밑단 마감과 실루엣은 그대로 유지해 주세요' : '예: 지퍼 색은 원래와 비슷한 남색으로 해주세요'}">${esc(g.note)}</textarea></section>
    </main>
    <footer class="cta"><button class="btn primary" data-next ${need && !g.photos.length ? 'disabled' : ''}>${need && !g.photos.length ? '사진을 1장 이상 올려주세요' : '수선 요청서 만들기'}</button></footer>`;
  },
  mount(el) {
    wireQuit(el);
    const g = curG(); if (!g) return;
    applicableOptions(g).forEach(o => { if (!g.options[o.id]) g.options[o.id] = o.choices[0].v; });
    const toggle = (arr, v) => { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); };
    el.addEventListener('click', e => {
      const z = e.target.closest('.zone,[data-zone]');
      if (z) { toggle(g.damage.zones, z.dataset.zone); save(); el.querySelector('#dmg').innerHTML = damageMap(g.cat, { selected: g.damage.zones }); el.querySelectorAll('#zoneChips [data-zone]').forEach(c => c.setAttribute('aria-pressed', g.damage.zones.includes(c.dataset.zone))); return; }
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.method) { g.method = b.dataset.method; save(); el.querySelectorAll('[data-method]').forEach(x => x.setAttribute('aria-pressed', x === b)); }
      else if (b.dataset.opt) { const [o, v] = b.dataset.opt.split(':'); g.options[o] = v; save(); el.querySelectorAll(`[data-opt^="${o}:"]`).forEach(x => x.setAttribute('aria-pressed', x === b)); }
      else if (b.dataset.type) { toggle(g.damage.types, b.dataset.type); save(); b.setAttribute('aria-pressed', g.damage.types.includes(b.dataset.type)); }
      else if (b.dataset.rm != null) { g.photos.splice(+b.dataset.rm, 1); save(); keepFocus(el, refresh); }
      else if (b.hasAttribute('data-sample')) { const kind = hasRepair(g) ? (g.items.includes('zipper') ? 'zipper' : 'jacket-lining') : g.cat === 'pants' ? 'pants-hem' : g.cat === 'shirt' || g.cat === 'jacket' ? 'shirt-sleeve' : 'dress-hem'; const w = workSample(kind, 1); g.photos = [svgData(w.before)]; save(); refresh(); toast('예시 사진을 넣었어요', 'image'); }
      else if (b.hasAttribute('data-next')) go('req-sheet');
    });
    el.addEventListener('keydown', e => { const z = e.target.closest('.zone'); if (z && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); z.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
    el.addEventListener('change', async e => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const d = await shrink(f); if (!d) { toast('사진을 읽지 못했어요', 'alert-circle'); return; }
      g.photos.push(d); g.photos = g.photos.slice(0, 3); save(); refresh();
    });
    el.querySelector('#note').addEventListener('input', e => { g.note = e.target.value; save(); });
  },
});

// ───────── STEP 5. 요청서 ─────────
export function ticket(g, i, { editable = false, compact = false } = {}) {
  const ch = changes(g), its = g.items.map(id => itemOf(g.cat, id)).filter(Boolean);
  let snap = snaps.get(g.id);
  if (snap && snap.key !== JSON.stringify(g.after)) snap = null; // 치수를 바꾼 뒤면 옛 캡처는 안 씀
  const fit = its.some(x => x.group === 'fit');
  const before = fit ? (snap ? `<img src="${snap.before}" alt="수선 전 3D 핏">` : fit2d(g.cat, { body: state.body, m: g.m, item: its[0]?.id, mode: 'before' })) : '';
  const after = fit ? (snap ? `<img src="${snap.after}" alt="수선 후 3D 핏">` : fit2d(g.cat, { body: state.body, m: { ...g.after, __ghost: g.m }, item: its[0]?.id, mode: 'after' })) : '';
  const method = METHODS.find(m => m.id === g.method);
  const optTxt = applicableOptions(g).map(o => { const c = o.choices.find(c => c.v === (g.options[o.id] || o.choices[0].v)); return c.add ? c.t : null; }).filter(Boolean);
  const zones = g.damage.zones.map(z => DAMAGE_ZONES[g.cat].find(x => x.id === z)?.label).filter(Boolean);
  return `<article class="label-card">
    <div class="label-head"><div><div class="w">OTLINE</div><h3>의류 ${String(i + 1).padStart(2, '0')} ${esc(gTitle(g))}</h3></div>
      <div class="no">${esc(catOf(g.cat).name)} / ${esc(g.sub || '')}${editable ? `<br><button class="btn xs" data-edit="${i}" style="margin-top:6px;background:rgba(255,255,255,.14);color:#fff">수정</button>` : ''}</div></div>
    <div class="label-body">
      ${fit && !compact ? `<div class="ba"><div class="side-img">${before}<span>BEFORE</span></div><div class="arr">${ic('arrow-right')}</div><div class="side-img">${after}<span style="color:var(--indigo)">AFTER</span></div></div>` : ''}
      ${!fit && !compact ? `<div class="dmg" style="background:var(--surface-2)">${damageMap(g.cat, { selected: g.damage.zones })}</div>` : ''}
      ${ch.length ? `<table class="mt"><thead><tr><th>부위</th><th>기존</th><th>수선 후</th><th>변경</th></tr></thead><tbody>${ch.map(c => `<tr><td>${FIELDS[c.f].label}</td><td>${cm(c.from)}</td><td><b>${cm(c.to)}</b></td><td class="chg">${c.d > 0 ? '+' : '−'}${cm(Math.abs(c.d))}</td></tr>`).join('')}</tbody></table>` : ''}
      <dl class="kv">
        <dt>수선 항목</dt><dd>${its.map(x => esc(x.name)).join(', ')}</dd>
        ${fit && g.preset && g.cat === 'pants' ? `<dt>원하는 기장</dt><dd>${esc(PANTS_PRESETS.find(p => p.id === g.preset)?.name || '')}</dd>` : ''}
        ${fit ? `<dt>측정 방법</dt><dd>${esc(method?.t || '')}</dd>` : ''}
        ${optTxt.length ? `<dt>추가 옵션</dt><dd>${optTxt.map(esc).join(', ')}</dd>` : ''}
        ${zones.length ? `<dt>손상 부위</dt><dd>${zones.join(', ')}${g.damage.types.length ? ` (${g.damage.types.map(esc).join(', ')})` : ''}</dd>` : ''}
        ${g.note ? `<dt>요청사항</dt><dd>${esc(g.note)}</dd>` : ''}
        <dt>첨부 사진</dt><dd>${g.photos.length ? `${ic('image', 'ic-16')} ${g.photos.length}장` : '없음'}</dd>
      </dl>
    </div></article>`;
}
export function billHtml(q, { showFees = false } = {}) {
  const rows = [];
  q.per.forEach((p, i) => p.lines.forEach(l => rows.push(`<div class="l"><span>${q.per.length > 1 ? `의류 ${i + 1} ` : ''}${esc(l.t)}${l.extra ? ' 추가금' : ' 표준가'}</span><span>${won(l.std)}</span></div>`)));
  if (q.mk) rows.push(`<div class="l"><span>수선집 추가금</span><span>${q.mk > 0 ? '+' : ''}${won(q.mk)}</span></div>`);
  if (q.bundle) rows.push(`<div class="l disc"><span>묶음 할인 (2벌 이상 5%)</span><span>${won(-q.bundle)}</span></div>`);
  if (q.newDisc) rows.push(`<div class="l disc"><span>신규 입점 첫 주문 할인</span><span>${won(-q.newDisc)}</span></div>`);
  if (showFees) {
    if (q.pickupFree) rows.push(`<div class="l disc"><span>픽업비 (2벌 이상 무료)</span><span>0원</span></div>`);
    else if (q.pickup) rows.push(`<div class="l"><span>픽업비</span><span>${won(q.pickup)}</span></div>`);
    if (q.ship) rows.push(`<div class="l"><span>배송비</span><span>${won(q.ship)}</span></div>`);
  }
  return `<div class="bill">${rows.join('')}<div class="t"><span>${showFees ? '총 결제 예정 금액' : '총 예상 수선비'}</span><b>${won(q.total)}</b></div></div>`;
}
screen('req-sheet', {
  render() {
    if (!state.draft) { setTimeout(() => backTo('home'), 0); return ''; }
    const d = state.draft, q = quote(d.garments);
    return `${bar('수선 요청서')}
    <main class="content">
      ${tapeProgress(5, TOTAL, '요청서 완성')}
      <div class="row" style="gap:12px"><span style="width:44px;height:44px;border-radius:50%;background:var(--ok-50);color:var(--ok);display:grid;place-items:center;flex:none">${ic('check', 'ic-24')}</span>
        <div><h2 style="font-size:21px">수선 요청서가 완성됐어요</h2><p class="small muted">수선집에 전달할 내용을 확인해 주세요</p></div></div>
      ${d.garments.map((g, i) => ticket(g, i, { editable: true })).join('')}
      <button class="btn line stitch" data-add style="height:58px;flex:none;width:100%">${ic('plus')}수선할 의류 추가하기 ${d.garments.length < 2 ? '<span class="tag chalk">2벌부터 5% 할인</span>' : ''}</button>
      <section class="card sec"><div class="sec-h"><h3>예상 수선 금액</h3><span class="tag">옷라인 표준가</span></div>${billHtml(q)}
        <p class="note">수선집마다 추가금이 조금씩 달라요. 다음 화면에서 수선집별 금액을 비교할 수 있어요. 최종 금액은 수선사가 옷을 확인한 뒤 확정돼요.</p></section>
    </main>
    <footer class="cta"><button class="btn line icon-only" data-savedraft aria-label="요청서 저장">${ic('bookmark')}</button><button class="btn primary" data-next>수선집 고르기</button></footer>`;
  },
  mount(el) {
    wireQuit(el);
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.edit != null) { state.draft.cur = +b.dataset.edit; save(); const g = curG(); go(hasFit(g) ? 'req-fit' : 'req-detail'); }
      else if (b.hasAttribute('data-add')) { addGarment(); go('req-cat'); }
      else if (b.hasAttribute('data-savedraft')) { state.savedDrafts.unshift({ id: 'd' + Date.now(), at: new Date().toISOString(), draft: JSON.parse(JSON.stringify(state.draft)) }); save(); toast('좋아요 탭에 요청서를 저장했어요', 'bookmark'); }
      else if (b.hasAttribute('data-next')) go('compare');
    });
  },
});
