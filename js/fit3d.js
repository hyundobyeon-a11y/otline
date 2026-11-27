// 옷라인 AI Fit Assistant: 바지 3D Before/After
// demo/src_fit3d.html 의 3D 부분을 앱 화면용 모듈로 옮김.
// 몸과 바지는 MakeHuman(MPFB) 메시 (models/mh_male.glb, mh_female.glb, demo/_blender/make_human.py 로 뽑음).
//
//   const fit = createFit3D({ before: canvasA, after: canvasB, onStatus: msg => ... });
//   await fit.set({ sex: 'M', body: {height, weight, waist, hip, inseam}, m: {len, waistH, hipH, thighH, rise, hemH}, after: {...} });
//   fit.view('front' | 'side' | 'back' | 'hem');  fit.snapshot() → PNG dataURL (After);  fit.dispose();
//
// 모양에 들어가는 값: 키(전체 크기), 다리 안쪽 길이(다리 비율, 모델 기준 ±8% 안), 총장과 밑위(밑단 높이),
// 밑단단면(밑단 폭), 허벅지단면(허벅지에서 무릎까지 폭, 전후 비율로). 몸무게, 허리, 엉덩이, 허리단면은 아직 모양에 안 들어감.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// 아티팩트 서버가 .glb 를 안 내보내서 같은 파일을 .wasm 이름으로 올림 (GLTFLoader 는 내용만 봄)
const EXT = (() => {
  try { const h = location.hostname; return (h.endsWith('claude.ai') || h.endsWith('claudeusercontent.com')) ? '.wasm' : '.glb'; }
  catch (e) { return '.glb'; }
})();
const TAPE_HEX = '#f3b61f';
const FOV = 22;                       // 망원 렌즈. 가까이서 넓게 보면 다리가 짧아 보임
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const smooth = t => t * t * (3 - 2 * t);
const num = (v, d) => (typeof v === 'number' && isFinite(v)) ? v : d;

// ---------- 모델 적재 (모듈 전체에서 한 번만) ----------
const cache = {};                     // 'M' | 'F' → Promise<model>
const listeners = {};                 // 받는 중 진행률을 알려줄 곳

function bakeAttr(mesh) {
  mesh.updateWorldMatrix(true, false);
  const g = mesh.geometry, pos = g.attributes.position, n = pos.count, out = new Float32Array(n * 3), v = new THREE.Vector3();
  for (let i = 0; i < n; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld); out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z; }
  return { pos0: out, n, index: g.index ? g.index.array.slice() : null, uv: g.attributes.uv ? g.attributes.uv.array.slice() : null, material: mesh.material };
}
// 한쪽 다리(li 0 = x<0, 1 = x>=0)의 y 띠 안 꼭짓점 평균 (x, z)
function bandCenter(P, y0, y1, li) {
  let sx = 0, sz = 0, k = 0;
  for (let i = 0; i < P.n; i++) {
    const x = P.pos0[i * 3], y = P.pos0[i * 3 + 1], z = P.pos0[i * 3 + 2];
    if (y < y0 || y > y1 || (li === 0 ? x >= 0 : x < 0)) continue;
    sx += x; sz += z; k++;
  }
  return k ? [sx / k, sz / k] : [li === 0 ? -0.1 : 0.1, 0];
}

function prepareModel(gltf) {
  let body = null, pants = null;
  gltf.scene.traverse(o => {
    if (!o.isMesh) return;
    if (/pants/i.test(o.name)) pants = o;
    else if (!body || o.geometry.attributes.position.count > body.geometry.attributes.position.count) body = o;
  });
  if (!body || !pants) throw new Error('몸 또는 바지 메시를 못 찾음');
  const B = bakeAttr(body), P = bakeAttr(pants);
  // 바닥을 0에 맞추고 키 재기
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < B.n; i++) { const y = B.pos0[i * 3 + 1]; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  for (let i = 0; i < B.n; i++) B.pos0[i * 3 + 1] -= minY;
  for (let i = 0; i < P.n; i++) P.pos0[i * 3 + 1] -= minY;
  const H0 = maxY - minY;
  // 가랑이: 바닥에서 올라가며 |x|<1cm 점이 처음 3칸 연속 나오는 높이
  const bands = new Array(Math.ceil(H0 * 100) + 3).fill(false);
  for (let i = 0; i < B.n; i++) if (Math.abs(B.pos0[i * 3]) < 0.01) bands[Math.floor(B.pos0[i * 3 + 1] * 100)] = true;
  let crotch0 = H0 * 0.47;
  for (let bi = 3; bi < bands.length - 2; bi++) if (bands[bi] && bands[bi + 1] && bands[bi + 2]) { crotch0 = bi / 100; break; }
  // 바지 밑단: 가장 낮은 꼭짓점. 밑단 단면(펼친 폭) ≈ π(가로+깊이)/4, 왼다리 아래 3cm 띠로 잼
  let hem0 = Infinity;
  for (let i = 0; i < P.n; i++) if (P.pos0[i * 3 + 1] < hem0) hem0 = P.pos0[i * 3 + 1];
  const legC = [[0, 0, 0], [0, 0, 0]], mx = [Infinity, -Infinity], mz = [Infinity, -Infinity];
  for (const li of [0, 1]) {
    let sx = 0, sz = 0, k = 0;
    for (let i = 0; i < P.n; i++) {
      const x = P.pos0[i * 3], y = P.pos0[i * 3 + 1], z = P.pos0[i * 3 + 2];
      if (y > hem0 + 0.03 || (li === 0 ? x >= 0 : x < 0)) continue;
      sx += x; sz += z; k++;
      if (li === 0) { mx[0] = Math.min(mx[0], x); mx[1] = Math.max(mx[1], x); mz[0] = Math.min(mz[0], z); mz[1] = Math.max(mz[1], z); }
    }
    if (k) legC[li] = [sx / k, hem0, sz / k];
  }
  const hemHalf0 = Math.PI * ((mx[1] - mx[0]) + (mz[1] - mz[0])) / 4;
  const kneeY0 = crotch0 * 0.55, thighY0 = crotch0 - 0.07;
  const kneeC = [bandCenter(P, kneeY0 - 0.02, kneeY0 + 0.02, 0), bandCenter(P, kneeY0 - 0.02, kneeY0 + 0.02, 1)];
  const thighC = [bandCenter(P, thighY0 - 0.02, thighY0 + 0.02, 0), bandCenter(P, thighY0 - 0.02, thighY0 + 0.02, 1)];
  return { body: B, pants: P, H0, crotch0, hem0, hemHalf0, legC, kneeC, thighC };
}

function loadModel(sex) {
  const key = sex === 'F' ? 'F' : 'M';
  if (cache[key]) return cache[key];
  const urlOf = ext => new URL('../models/mh_' + (key === 'F' ? 'female' : 'male') + ext, import.meta.url).href;
  const once = ext => new Promise((res, rej) => {
    new GLTFLoader().load(urlOf(ext),
      gltf => { try { res(prepareModel(gltf)); } catch (e) { rej(e); } },
      ev => { const pct = ev.total ? Math.round(ev.loaded / ev.total * 100) : null; (listeners[key] || []).forEach(f => f(pct)); },
      err => rej(err));
  });
  // 호스트 이름으로 고른 확장자가 안 맞으면 다른 쪽(.glb / .wasm)으로 한 번 더 시도
  cache[key] = once(EXT).catch(() => once(EXT === '.wasm' ? '.glb' : '.wasm')).catch(e => { delete cache[key]; throw e; });
  return cache[key];
}
// 화면에 들어가기 전에 미리 받아 둘 때
export function preload(sex) { return loadModel(sex).catch(() => null); }

// ---------- 몸, 바지 맞추기 ----------
// 다리 비율: 가랑이 높이를 다리 안쪽 길이로 옮기고 위아래를 나눠 늘이거나 줄임(키는 그대로)
function makeWarp(c0, c1, H) {
  const kLo = c1 / c0, kHi = (H - c1) / Math.max(0.1, H - c0);
  return y => (y <= c0 ? y * kLo : c1 + (y - c0) * kHi);
}
// 팔 내리기: 어깨 관절을 축으로 팔을 돌려 몸 옆에 늘어뜨림 (수직에서 바깥으로 12°). 관절 가까이는 조금만 돌려 어깨가 찢어지지 않게
function dropArms(pos, n, H) {
  const k = H / 1.75, xs = 0.2 * k, px = 0.165 * k, yMin = 0.35 * H;
  let topY = 0, hx = 0, hy = 0;
  for (let i = 0; i < n; i++) { const ax = Math.abs(pos[i * 3]), y = pos[i * 3 + 1]; if (ax > xs + 0.04 && y > yMin) { if (y > topY) topY = y; if (ax > hx) { hx = ax; hy = y; } } }
  const py = topY - 0.05;
  const cur = Math.atan2(hx - px, py - hy), rot = cur - 12 * Math.PI / 180;
  if (!(rot > 0)) return;
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], ax = Math.abs(x);
    if (ax <= xs || y <= yMin) continue;
    const w = clamp((ax - xs) / 0.05), sgn = x < 0 ? -1 : 1;
    const dx = ax - px, dy = y - py, r = Math.hypot(dx, dy), phi = Math.atan2(dx, -dy) - rot * w;
    pos[i * 3] = sgn * (px + r * Math.sin(phi)); pos[i * 3 + 1] = py - r * Math.cos(phi);
  }
}
function bakeBody(M, body) {
  const H = clamp(num(body.height, 170), 140, 205) / 100;
  const s = H / M.H0, n = M.body.n, out = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) out[i] = M.body.pos0[i] * s;
  dropArms(out, n, H);
  const c0 = M.crotch0 * s;
  const ins = clamp(num(body.inseam, c0 * 100) / 100, c0 * 0.92, c0 * 1.08);
  const warp = makeWarp(c0, ins, H);
  for (let i = 0; i < n; i++) out[i * 3 + 1] = warp(out[i * 3 + 1]);
  return { pos: out, s, H, crotch: ins, warp, key: `${H}|${ins}` };
}
// 바지: 키, 다리 비율대로 옮긴 뒤
//  (1) 허벅지~무릎을 thighF 비율로 다리 축 쪽으로 좁히거나 넓히고
//  (2) 무릎 아래를 밑단이 hemY(m, 바닥 기준, 음수면 바닥에 쌓임)에 오도록 늘이거나 줄이고
//  (3) 밑단 단면 hemHalf(cm)에 맞춰 무릎에서 밑단으로 갈수록 좁힘
function bakePants(M, baked, opt) {
  const s = baked.s, warp = baked.warp, n = M.pants.n, P = M.pants.pos0, out = new Float32Array(n * 3);
  const crotch = baked.crotch, kneeY = crotch * 0.55, thighTop = crotch - 0.01;
  const hem0 = warp(M.hem0 * s), hemY = Math.max(0.004, opt.hemY);
  const stretch = (kneeY - hemY) / Math.max(0.05, kneeY - hem0);
  const taper = opt.hemHalf ? clamp((opt.hemHalf / 100) / (M.hemHalf0 * s), 0.55, 1.8) : 1;
  const fT = clamp(num(opt.thighF, 1), 0.8, 1.15);
  for (let i = 0; i < n; i++) {
    let x = P[i * 3] * s, y = warp(P[i * 3 + 1] * s), z = P[i * 3 + 2] * s;
    if (y < thighTop) {
      const li = x < 0 ? 0 : 1, tc = M.thighC[li], kc = M.kneeC[li], hc = M.legC[li];
      let cx, cz, f;
      if (y >= kneeY) {                                         // 허벅지: 가랑이 바로 아래부터 빨리 붙음
        const u = clamp((thighTop - y) / Math.max(0.03, thighTop - kneeY));
        const w = smooth(clamp(u / 0.35));
        cx = (tc[0] + (kc[0] - tc[0]) * u) * s; cz = (tc[1] + (kc[1] - tc[1]) * u) * s;
        f = 1 + (fT - 1) * w;
      } else {                                                  // 무릎 아래: 무릎 중심에서 밑단 중심으로 이어지는 다리 축
        const t = clamp((kneeY - y) / Math.max(0.05, kneeY - hem0));
        cx = (kc[0] + (hc[0] - kc[0]) * t) * s; cz = (kc[1] + (hc[2] - kc[1]) * t) * s;
        f = fT + (taper - fT) * t;
        y = kneeY - (kneeY - y) * stretch;
      }
      x = cx + (x - cx) * f; z = cz + (z - cz) * f;
    }
    out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
  }
  // 바닥에 쌓이는 경우: 밑단 위 4cm 를 바깥으로 살짝 부풀려 천이 접힌 느낌
  if (opt.hemY < 0) {
    for (let i = 0; i < n; i++) {
      const y = out[i * 3 + 1];
      if (y < hemY + 0.04) {
        const k = 1 + Math.min(0.12, -opt.hemY * 1.5) * (1 - (y - hemY) / 0.04);
        const li = out[i * 3] < 0 ? 0 : 1, cx = M.legC[li][0] * s, cz = M.legC[li][2] * s;
        out[i * 3] = cx + (out[i * 3] - cx) * k; out[i * 3 + 2] = cz + (out[i * 3 + 2] - cz) * k;
      }
    }
  }
  return out;
}

// ---------- 줄자 그림 (발 옆에 세운 노란 줄자, 26cm) ----------
function makeTapeTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 640;
  const g = c.getContext('2d'), per = 640 / 26;
  g.fillStyle = TAPE_HEX; g.fillRect(0, 0, 64, 640);
  g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(60, 0, 4, 640);
  g.fillStyle = '#2a2006';
  for (let v = 0; v <= 26; v++) { const y = 640 - v * per; const len = v % 5 === 0 ? 30 : (v % 1 === 0 ? 16 : 10); g.fillRect(0, Math.round(y) - 1, len, 3); }
  g.font = '700 24px system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle';
  for (const v of [5, 10, 15, 20, 25]) g.fillText(String(v), 58, 640 - v * per);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// ---------- 화면 하나 ----------
const TAPE_W = 0.026, TAPE_H = 0.26;
function makeView(canvas, tapeTex) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
  const scene = new THREE.Scene();
  // 스튜디오 조명: 방 모양 환경광(PMREM)으로 몸에 부드러운 반사, 위에서 비추는 주광 하나가 바닥에 흐린 그림자
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment(renderer);
  const envRT = pmrem.fromScene(room, 0.04);
  scene.environment = envRT.texture;
  pmrem.dispose(); if (typeof room.dispose === 'function') room.dispose();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 40);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc9cfd8, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(1.2, 6, 2.2); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.near = 1; key.shadow.camera.far = 12;
  key.shadow.camera.left = key.shadow.camera.bottom = -1.4; key.shadow.camera.right = key.shadow.camera.top = 1.4;
  key.shadow.radius = 10; key.shadow.blurSamples = 16; key.shadow.bias = -0.0002; scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.45); fill.position.set(-3, 2, 1.5); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.5); rim.position.set(0, 3, -4); scene.add(rim);
  const floorGeo = new THREE.PlaneGeometry(8, 8), floorMat = new THREE.ShadowMaterial({ opacity: 0.16 });
  const floor = new THREE.Mesh(floorGeo, floorMat); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  // 발밑 접지 그림자: 가운데가 진한 둥근 그라데이션 한 장
  const aoCan = document.createElement('canvas'); aoCan.width = aoCan.height = 256;
  { const ctx = aoCan.getContext('2d'), gr = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 256, 256); }
  const aoTex = new THREE.CanvasTexture(aoCan), aoGeo = new THREE.PlaneGeometry(0.9, 0.55), aoMat = new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false });
  const ao = new THREE.Mesh(aoGeo, aoMat); ao.rotation.x = -Math.PI / 2; ao.position.y = 0.002; scene.add(ao);
  // 마네킹: 살짝 윤기 있는 밝은 회색. 바지는 glb 에 든 질감 그대로
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xe2dfda, roughness: 0.62, metalness: 0, envMapIntensity: 0.9 });
  const body = new THREE.Mesh(new THREE.BufferGeometry(), skin); body.castShadow = true; body.visible = false; scene.add(body);
  const pants = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial()); pants.castShadow = true; pants.visible = false; scene.add(pants);
  // 줄자 + 밑단 표시선 (카메라 쪽을 보도록 매번 돌림)
  const tapeGeo = new THREE.PlaneGeometry(TAPE_W, TAPE_H), tapeMat = new THREE.MeshBasicMaterial({ map: tapeTex, toneMapped: false, side: THREE.DoubleSide });
  const tape = new THREE.Mesh(tapeGeo, tapeMat); tape.visible = false; scene.add(tape);
  const markGeo = new THREE.PlaneGeometry(1, 0.0035), markMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(TAPE_HEX), toneMapped: false, side: THREE.DoubleSide, transparent: true, opacity: 0.95, depthTest: false });
  const mark = new THREE.Mesh(markGeo, markMat); mark.visible = false; mark.renderOrder = 2; scene.add(mark);

  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false; controls.enableDamping = false;
  controls.minDistance = 0.6; controls.maxDistance = 9;
  controls.minPolarAngle = 0.25; controls.maxPolarAngle = Math.PI / 2 + 0.04;
  controls.zoomSpeed = 0.6; controls.rotateSpeed = 0.8;

  const disposables = [floorGeo, floorMat, aoTex, aoGeo, aoMat, skin, tapeGeo, tapeMat, markGeo, markMat, envRT];
  let w0 = 0, h0 = 0;
  function sizeOK() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return false;
    if (w !== w0 || h !== h0) { w0 = w; h0 = h; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    return true;
  }
  return { canvas, renderer, scene, camera, controls, body, pants, tape, mark, disposables, sizeOK,
    aspect: () => (canvas.clientWidth && canvas.clientHeight) ? canvas.clientWidth / canvas.clientHeight : 0.55,
    hemY: 0, hemOut: 0.07, legs: null };
}

function setGeom(mesh, src, pos) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (src.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(src.uv, 2));
  if (src.index) g.setIndex(new THREE.BufferAttribute(src.index, 1));
  g.computeVertexNormals();
  mesh.geometry.dispose(); mesh.geometry = g; mesh.visible = true;
}
function setPantsMaterial(view, src, tint) {
  if (view.pantsSrc === src.material) return;
  if (view.pants.material && view.pantsSrc) view.pants.material.dispose();
  const mat = src.material.clone(); mat.side = THREE.DoubleSide; mat.envMapIntensity = 0.6; mat.roughness = Math.max(0.7, mat.roughness ?? 0.8);
  if (tint) mat.color.multiply(tint);
  view.pants.material = mat; view.pantsSrc = src.material;
}

// 카메라 맞추기: 세로로 긴 화면에 사람을 꽉 차게
const VIEW_DIR = { front: [0, 0.03, 1], side: [1, 0.03, 0], back: [0, 0.03, -1], hem: [0.28, 0.17, 1] };
function frame(v, name, H, legX) {
  const aspect = v.aspect(), half = Math.tan(FOV * Math.PI / 360);
  const target = new THREE.Vector3(), dir = new THREE.Vector3(...(VIEW_DIR[name] || VIEW_DIR.front)).normalize();
  let yLo, yHi, halfW;
  if (name === 'hem') { target.set(legX + 0.09, 0, 0.03); yLo = -0.03; yHi = 0.5; halfW = 0.2; }
  else { target.set(0, 0, 0); yLo = -0.05; yHi = 0.86 * H; halfW = 0.3; }
  const vNeed = Math.max((yHi - yLo) * 1.05, (2 * halfW) / aspect);
  const d = vNeed / 2 / half;
  target.y = (yLo + yHi) / 2;
  v.camera.position.copy(target).addScaledVector(dir, d);
  v.controls.target.copy(target);
  v.controls.minDistance = d * 0.45; v.controls.maxDistance = d * 1.6;
  v.controls.update();
}
// 줄자는 늘 화면 오른쪽, 발 옆에 서 있게: 카메라의 오른쪽 방향으로 떨어뜨려 세움
const _r = new THREE.Vector3(), _f = new THREE.Vector3();
function placeTape(v) {
  if (!v.legs) return;
  v.camera.getWorldDirection(_f); _f.y = 0; if (_f.lengthSq() < 1e-6) _f.set(0, 0, -1); _f.normalize();
  _r.set(-_f.z, 0, _f.x);                                        // 수평 오른쪽
  const t = v.controls.target;
  // 다리 중심이 화면 오른쪽으로 가장 멀리 있는 쪽 기준
  let legR = -Infinity;
  for (const L of v.legs) legR = Math.max(legR, (L[0] - t.x) * _r.x + (L[1] - t.z) * _r.z);
  const off = Math.max(legR + v.hemOut + 0.07, 0.16);
  const bx = t.x + _r.x * off, bz = t.z + _r.z * off;
  const ry = Math.atan2(-_f.x, -_f.z);
  v.tape.position.set(bx, TAPE_H / 2, bz); v.tape.rotation.set(0, ry, 0); v.tape.visible = true;
  const y = Math.max(0.005, v.hemY), x0 = legR + v.hemOut * 0.85, len = Math.max(0.02, off - x0 - TAPE_W / 2);
  const mx = t.x + _r.x * (x0 + len / 2), mz = t.z + _r.z * (x0 + len / 2);
  v.mark.position.set(mx, y, mz); v.mark.rotation.set(0, ry, 0); v.mark.scale.set(len, 1, 1); v.mark.visible = true;
}

// ---------- 공개 API ----------
// 같은 canvas 를 dispose 뒤 다시 쓰면 잃은 WebGL 컨텍스트를 되살린 다음 그림
function acquire(canvas) {
  const ext = canvas.__fit3dLose;
  if (!ext) return Promise.resolve();
  const wait = (pr, ms) => Promise.race([pr, new Promise(r => setTimeout(r, ms))]);
  // lost 이벤트가 먼저 지나가야 restoreContext 가 먹음
  // lost 이벤트 처리가 끝난 다음 턴에 restoreContext 를 불러야 함 (마이크로태스크에서 부르면 무시됨)
  return wait(canvas.__fit3dLost || Promise.resolve(), 400).then(() => new Promise(r => setTimeout(r, 20))).then(() => wait(new Promise(res => {
    canvas.addEventListener('webglcontextrestored', () => res(), { once: true });
    try { ext.restoreContext(); } catch (e) { res(); }
  }), 1500)).then(() => { canvas.__fit3dLose = null; canvas.__fit3dLost = null; });
}

export function createFit3D({ before, after, onStatus } = {}) {
  if (!before || !after) throw new Error('canvas 두 개가 필요함');
  let lastMsg;
  const status = m => { if (m === lastMsg) return; lastMsg = m; try { onStatus && onStatus(m); } catch (e) { /* 화면 쪽 오류는 무시 */ } };
  const tapeTex = makeTapeTexture();
  const views = [];
  let vB = null, vA = null, handlers = [];
  let disposed = false, seq = 0, current = null, viewName = 'front', userMoved = false, ready = false;
  let raf = 0, syncing = false, lastKey = null, lastBody = null, H = 1.74, legX = 0.1;

  function renderNow() {
    if (disposed) return;
    for (const v of views) { if (!v.sizeOK()) continue; placeTape(v); v.renderer.render(v.scene, v.camera); }
  }
  function requestRender() {
    if (disposed || raf) return;
    raf = requestAnimationFrame(() => { raf = 0; renderNow(); });
  }
  // 두 화면 회전 같이
  const onChange = src => () => {
    if (syncing) { requestRender(); return; }
    syncing = true;
    for (const v of views) if (v !== src) { v.camera.position.copy(src.camera.position); v.controls.target.copy(src.controls.target); v.controls.update(); }
    syncing = false;
    requestRender();
  };
  const onStart = () => { userMoved = true; };

  const init = Promise.all([acquire(before), acquire(after)]).then(() => {
    if (disposed) return;
    vB = makeView(before, tapeTex); vA = makeView(after, tapeTex);
    views.push(vB, vA);
    handlers = views.map(v => { const h = onChange(v); v.controls.addEventListener('change', h); v.controls.addEventListener('start', onStart); return h; });
  });
  init.catch(() => {});                                       // WebGL 을 못 만들면 set() 이 같은 오류로 거절함

  const ro = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(() => {
    if (disposed) return;
    if (!userMoved && ready) for (const v of views) frame(v, viewName, H, legX);
    requestRender();
  }) : null;
  if (ro) { ro.observe(before); ro.observe(after); }

  async function set(p = {}) {
    if (disposed) return;
    const my = ++seq;
    const sex = p.sex === 'F' ? 'F' : 'M';
    const body = p.body || {}, m = p.m || {}, a = Object.assign({}, m, p.after || {});
    let M;
    const waiting = !cache[sex];
    if (waiting) {
      status('3D 모델 받는 중…');
      (listeners[sex] = listeners[sex] || []).push(pct => { if (!disposed && my === seq) status(pct == null ? '3D 모델 받는 중…' : `3D 모델 받는 중… ${pct}%`); });
    }
    try { M = await loadModel(sex); await init; }
    catch (e) { if (!disposed) status('3D 모델을 불러오지 못했어요'); throw e; }
    finally { if (waiting) listeners[sex] = []; }
    if (disposed || my !== seq || !views.length) return;        // 더 새로운 set 이 있으면 그쪽이 그림
    const ins = num(body.inseam, num(body.height, 170) * 0.45);
    const bodyKey = `${sex}|${num(body.height, 170)}|${ins}`;
    if (bodyKey !== lastKey) {
      lastBody = bakeBody(M, Object.assign({}, body, { inseam: ins }));
      lastKey = bodyKey;
      for (const v of views) { setGeom(v.body, M.body, lastBody.pos); setPantsMaterial(v, M.pants, v === vA ? new THREE.Color(0.92, 0.95, 1.08) : null); }
      H = lastBody.H; legX = M.legC[1][0] * lastBody.s;
      const legs = [[M.legC[0][0] * lastBody.s, M.legC[0][2] * lastBody.s], [M.legC[1][0] * lastBody.s, M.legC[1][2] * lastBody.s]];
      for (const v of views) v.legs = legs;
    }
    const baked = lastBody;
    // 밑단 높이(바닥 기준) = 다리 안쪽 길이 − (총장 − 밑위). 음수면 바닥에 쌓임
    const hemOf = g => (ins - (num(g.len, 100) - num(g.rise, 30))) / 100;
    const thighF = (num(a.thighH, 30) / Math.max(1, num(m.thighH, 30)));
    const hB = hemOf(m), hA = hemOf(a);
    setGeom(vB.pants, M.pants, bakePants(M, baked, { hemY: hB, hemHalf: num(m.hemH, 0) || null, thighF: 1 }));
    setGeom(vA.pants, M.pants, bakePants(M, baked, { hemY: hA, hemHalf: num(a.hemH, 0) || null, thighF }));
    vB.hemY = hB; vA.hemY = hA;
    // 다리 중심에서 밑단 바깥 끝까지 대략 거리 (단면 × 2 = 둘레, 둘레/π = 지름)
    vB.hemOut = Math.max(0.05, num(m.hemH, 21) / 100 * 2 / Math.PI / 2 * 1.15);
    vA.hemOut = Math.max(0.05, num(a.hemH, 21) / 100 * 2 / Math.PI / 2 * 1.15);
    if (!ready || !userMoved) for (const v of views) frame(v, viewName, H, legX);
    ready = true;
    current = { sex, body, m, after: a };
    status(null);
    renderNow();
  }

  function view(name) {
    if (!VIEW_DIR[name]) name = 'front';
    viewName = name; userMoved = false;
    if (!ready) return;
    for (const v of views) frame(v, name, H, legX);
    renderNow();
  }

  // opts.front: 지금 보기와 상관없이 정면으로 찍고 원래 보기로 되돌림. opts.both: { before, after } 둘 다
  function snapshot(opts = {}) {
    if (disposed || !ready) return null;
    const prev = viewName, swap = opts.front && prev !== 'front';
    if (swap) for (const v of views) frame(v, 'front', H, legX);
    renderNow();
    let out = null;
    try { out = opts.both ? { before: before.toDataURL('image/png'), after: after.toDataURL('image/png') } : after.toDataURL('image/png'); } catch (e) { out = null; }
    if (swap) { for (const v of views) frame(v, prev, H, legX); renderNow(); }
    return out;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    if (ro) ro.disconnect();
    views.forEach((v, i) => {
      v.controls.removeEventListener('change', handlers[i]); v.controls.removeEventListener('start', onStart);
      v.controls.dispose();
      v.body.geometry.dispose(); v.pants.geometry.dispose();
      if (v.pantsSrc && v.pants.material) v.pants.material.dispose();
      v.disposables.forEach(d => d.dispose && d.dispose());
      v.renderer.renderLists.dispose();
      const gl = v.renderer.getContext(), ext = gl && gl.getExtension('WEBGL_lose_context');
      v.renderer.dispose();
      // GPU 메모리를 바로 돌려줌. 같은 canvas 를 다시 쓰면 acquire 가 되살림 (그러려면 lost 이벤트를 막아야 함)
      if (ext) {
        v.canvas.__fit3dLost = new Promise(r => v.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); r(); }, { once: true }));
        v.canvas.__fit3dLose = ext; ext.loseContext();
      }
    });
    tapeTex.dispose();
  }

  return { set, view, snapshot, dispose, get state() { return current; } };
}
