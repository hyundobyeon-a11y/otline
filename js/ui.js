// 공통 부품: 아이콘, 토스트, 바텀시트, 줄자 진행 막대, 이스케이프
const iconCache = {};
const pascal = n => n.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());

// lucide 아이콘을 SVG 문자열로. 라이브러리가 안 오면 빈 칸(크기만 차지)으로 둠
export function ic(name, cls = '') {
  const key = name + '|' + cls;
  if (iconCache[key]) return iconCache[key];
  const L = window.lucide && window.lucide.icons;
  const node = L && (L[pascal(name)]);
  let out;
  if (!node) out = `<svg class="lucide ${cls}" viewBox="0 0 24 24" aria-hidden="true"></svg>`;
  else {
    const kids = (node[2] || []).map(([tag, a]) => `<${tag} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
    out = `<svg class="lucide lucide-${name} ${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${kids}</svg>`;
  }
  iconCache[key] = out;
  return out;
}

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let toastTimer;
export function toast(msg, icon = 'check-circle-2') {
  const app = document.getElementById('app');
  let t = app.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); app.appendChild(t); }
  t.innerHTML = ic(icon) + `<span>${esc(msg)}</span>`;
  clearTimeout(toastTimer);
  t.classList.remove('on'); void t.offsetWidth; t.classList.add('on');
  toastTimer = setTimeout(() => t.classList.remove('on'), 2200);
}

// 바텀시트. html 안의 [data-close] 를 누르면 닫힘. onMount(sheetEl, close) 로 이벤트를 붙임
export function sheet(html, onMount) {
  const app = document.getElementById('app');
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true');
  sh.innerHTML = `<div class="grab"></div>${html}`;
  app.append(scrim, sh);
  requestAnimationFrame(() => { scrim.classList.add('on'); sh.classList.add('on'); });
  const close = () => { scrim.classList.remove('on'); sh.classList.remove('on'); setTimeout(() => { scrim.remove(); sh.remove(); }, 300); };
  scrim.addEventListener('click', close);
  sh.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  onMount && onMount(sh, close);
  return close;
}

// 줄자 진행 막대 (수선 맡기기 단계)
export function tapeProgress(step, total, title) {
  const pct = Math.round((step / total) * 100);
  const marks = Array.from({ length: total }, (_, i) => `<span class="${i < step ? 'done' : ''}">${i + 1}</span>`).join('');
  return `<div><div class="tape" style="--n:${total}" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${step}" aria-label="수선 요청서 만들기 진행">
    <div class="fill" style="width:${pct}%"></div><div class="marks">${marks}</div></div>
    <div class="stepinfo"><span>STEP ${String(step).padStart(2, '0')} <b>${esc(title)}</b></span><span>${step} / ${total}</span></div></div>`;
}

export function stars(r, n) {
  return `<span class="stars">${ic('star')}${r.toFixed(1)}${n != null ? `<small>(${n})</small>` : ''}</span>`;
}

// iOS 26 내비게이션 바. large 면 내용 맨 위에 큰 제목이 붙고(router), 스크롤하면 가운데 작은 제목으로 바뀜
export function appbar(title, { back = true, right = '', surface = false, large = false } = {}) {
  return `<header class="appbar${surface ? ' on-surface' : ''}${large ? ' large' : ''}">
    ${back ? `<button class="ib" data-back aria-label="뒤로">${ic('chevron-left', 'ic-24')}</button>` : '<span></span>'}
    <h1>${esc(title)}</h1>
    <div class="ib-wrap">${right}</div></header>`;
}

export const fmtDate = d => `${d.getMonth() + 1}월 ${d.getDate()}일 (${'일월화수목금토'[d.getDay()]})`;
export const fmtShort = d => `${d.getMonth() + 1}/${d.getDate()}(${'일월화수목금토'[d.getDay()]})`;
export const fmtTime = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

// 같은 요소를 다시 그릴 때 입력칸 포커스와 커서를 지킴
export function keepFocus(root, fn) {
  const a = document.activeElement;
  const id = a && root.contains(a) && a.id;
  const pos = id && 'selectionStart' in a ? [a.selectionStart, a.selectionEnd] : null;
  fn();
  if (id) { const n = root.querySelector('#' + CSS.escape(id)); if (n) { n.focus(); if (pos && n.setSelectionRange) try { n.setSelectionRange(pos[0], pos[1]); } catch (e) {} } }
}
