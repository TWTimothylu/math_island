/* ============ 3D 方塊角色 ============ */
const FACE_W = 256, FACE_H = 232;
const EYE_L = [80, 125], EYE_R = [176, 125], MOUTH = [128, 180];
const INK = '#2b1d14';

const _imgCache = {};
function getImg(src, cb) {
  if (!src) return null;
  let r = _imgCache[src];
  if (r) { if (r._ok) return r; r._cbs.push(cb); return null; }
  r = new Image(); r._cbs = [cb];
  r.onload = () => { r._ok = true; r._cbs.forEach(f => f && f()); r._cbs = []; };
  r.src = src; _imgCache[src] = r;
  return null;
}

function drawEye(ctx, style, x, y, side) {
  ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.lineCap = 'round';
  if (style === 'wink') style = side === 'r' ? 'happy' : 'shine';
  switch (style) {
    case 'shine':
      ctx.beginPath(); ctx.ellipse(x, y, 13, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 4, y - 7, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 5, y + 7, 2.6, 0, Math.PI * 2); ctx.fill(); break;
    case 'dot': ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill(); break;
    case 'happy': ctx.beginPath(); ctx.moveTo(x - 14, y + 6); ctx.quadraticCurveTo(x, y - 16, x + 14, y + 6); ctx.stroke(); break;
    case 'sleepy': ctx.beginPath(); ctx.moveTo(x - 14, y - 2); ctx.quadraticCurveTo(x, y + 10, x + 14, y - 2); ctx.stroke(); break;
    case 'star': {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 7 : 17, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); }
      ctx.closePath(); ctx.fillStyle = '#ffc533'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); break;
    }
  }
}
function drawMouth(ctx, style) {
  const [x, y] = MOUTH;
  ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (style) {
    case 'smile': ctx.beginPath(); ctx.moveTo(x - 18, y - 6); ctx.quadraticCurveTo(x, y + 12, x + 18, y - 6); ctx.stroke(); break;
    case 'open':
      ctx.beginPath(); ctx.moveTo(x - 20, y - 8); ctx.lineTo(x + 20, y - 8); ctx.quadraticCurveTo(x + 18, y + 22, x, y + 22); ctx.quadraticCurveTo(x - 18, y + 22, x - 20, y - 8); ctx.closePath();
      ctx.fillStyle = '#6b2a22'; ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = '#ff7f91'; ctx.beginPath(); ctx.ellipse(x, y + 20, 13, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); break;
    case 'cat': ctx.beginPath(); ctx.moveTo(x - 18, y - 6); ctx.quadraticCurveTo(x - 9, y + 8, x, y - 4); ctx.quadraticCurveTo(x + 9, y + 8, x + 18, y - 6); ctx.stroke(); break;
    case 'o': ctx.beginPath(); ctx.ellipse(x, y, 8, 10, 0, 0, Math.PI * 2); ctx.fillStyle = '#6b2a22'; ctx.fill(); break;
    case 'flat': ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.stroke(); break;
    case 'tongue':
      ctx.fillStyle = '#ff7f91'; ctx.beginPath(); ctx.ellipse(x + 6, y + 6, 8, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 18, y - 6); ctx.quadraticCurveTo(x, y + 8, x + 18, y - 6); ctx.stroke(); break;
  }
}
function drawBrows(ctx, style) {
  ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineCap = 'round';
  const y = 90;
  [[EYE_L[0], -1], [EYE_R[0], 1]].forEach(([x, s]) => {
    ctx.beginPath();
    if (style === 'soft') { ctx.lineWidth = 4; ctx.moveTo(x - 13, y + 3); ctx.quadraticCurveTo(x, y - 6, x + 13, y + 3); ctx.stroke(); }
    if (style === 'thick') { ctx.lineWidth = 9; ctx.moveTo(x - 13, y); ctx.lineTo(x + 13, y); ctx.stroke(); }
    if (style === 'angry') { ctx.lineWidth = 6; ctx.moveTo(x - 13 * s * -1, y - 6); ctx.lineTo(x + 13 * s * -1, y + 4); ctx.stroke(); }
  });
}
/* 畫整張臉（含手繪層） */
function drawFace(ctx, cfg, opts = {}) {
  ctx.clearRect(0, 0, FACE_W, FACE_H);
  if (!opts.transparent) { ctx.fillStyle = cfg.skin; ctx.fillRect(0, 0, FACE_W, FACE_H); }
  if (cfg.blush) {
    ctx.fillStyle = 'rgba(255,120,140,.42)';
    [[58, 160], [198, 160]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 19, 10, 0, 0, Math.PI * 2); ctx.fill(); });
  }
  drawBrows(ctx, cfg.brows);
  if (cfg.eyes !== 'none') { drawEye(ctx, cfg.eyes, EYE_L[0], EYE_L[1], 'l'); drawEye(ctx, cfg.eyes, EYE_R[0], EYE_R[1], 'r'); }
  if (cfg.mouth !== 'none') drawMouth(ctx, cfg.mouth);
  if (!opts.noDrawing && cfg.faceDraw) {
    const img = getImg(cfg.faceDraw, opts.onLoad);
    if (img) ctx.drawImage(img, 0, 0, FACE_W, FACE_H);
  }
}

/* ---------- 3D 建模 ---------- */
const _matCache = {};
function M(color) { const k = String(color); return _matCache[k] || (_matCache[k] = new THREE.MeshLambertMaterial({ color })); }
function MF(color) { const k = 'f' + color; return _matCache[k] || (_matCache[k] = new THREE.MeshLambertMaterial({ color, flatShading: true })); }
function bx(parent, w, hgt, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, d), typeof color === 'object' ? color : M(color));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = false;
  parent.add(m); return m;
}
function shade(hex, amt) {
  const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, clamp(hsl.l + amt, 0, 1)); return '#' + c.getHexString();
}

function buildAvatar(cfg, opts = {}) {
  const root = new THREE.Group();
  const P = {};
  const skin = cfg.skin, cloth = cfg.clothColor, pants = cfg.pantsColor;
  const o = cfg.outfit;

  /* --- 腿 --- */
  const legColor = o === 'dress' ? skin : (o === 'overall' || o === 'suit') ? (o === 'suit' ? shade(cloth, -.18) : cloth) : o === 'astro' ? '#f1f3f5' : pants;
  ['L', 'R'].forEach((s, i) => {
    const g = new THREE.Group(); g.position.set(i ? .17 : -.17, .42, 0); root.add(g);
    bx(g, .26, .3, .28, legColor, 0, -.14, 0);
    bx(g, .28, .14, .34, o === 'astro' ? '#adb5bd' : '#4a3a2c', 0, -.35, .03);
    P['leg' + s] = g;
  });

  /* --- 身體 --- */
  const body = new THREE.Group(); body.position.y = .72; root.add(body); P.body = body;
  const bodyColor = (o === 'overall' || o === 'sailor' || o === 'astro') ? '#fdfdfd' : cloth;
  const bw = o === 'astro' ? .8 : .72;
  bx(body, bw, .6, o === 'astro' ? .52 : .46, bodyColor);
  if (o === 'tee') { bx(body, .2, .2, .02, '#ffffff', .14, .08, .235); }
  if (o === 'hoodie') {
    bx(body, .66, .3, .2, shade(cloth, -.08), 0, .3, -.3);
    bx(body, .46, .15, .02, shade(cloth, -.12), 0, -.16, .235);
    bx(body, .03, .14, .02, '#fff', -.08, .18, .235); bx(body, .03, .14, .02, '#fff', .08, .18, .235);
  }
  if (o === 'dress') {
    const sk = new THREE.Mesh(new THREE.CylinderGeometry(.4, .58, .34, 8), MF(cloth));
    sk.position.y = -.38; sk.castShadow = true; body.add(sk);
    bx(body, .5, .08, .02, '#ffffff', 0, .26, .235);
  }
  if (o === 'overall') {
    bx(body, .52, .34, .03, cloth, 0, -.12, .235);
    bx(body, .09, .3, .03, cloth, -.2, .14, .235); bx(body, .09, .3, .03, cloth, .2, .14, .235);
    bx(body, .06, .06, .02, '#ffd34d', -.2, .02, .255); bx(body, .06, .06, .02, '#ffd34d', .2, .02, .255);
    bx(body, .74, .12, .48, cloth, 0, -.26, 0);
  }
  if (o === 'sailor') {
    bx(body, .62, .3, .03, cloth, 0, .17, -.245);
    bx(body, .74, .08, .48, cloth, 0, .27, 0);
    bx(body, .2, .14, .06, '#e03131', 0, .14, .25);
    bx(body, .74, .1, .48, cloth, 0, -.26, 0);
  }
  if (o === 'suit') {
    bx(body, .22, .6, .02, '#ffffff', 0, 0, .235);
    bx(body, .08, .38, .03, '#e03131', 0, .02, .25);
  }
  if (o === 'astro') {
    bx(body, .32, .2, .03, cloth, 0, .02, .27);
    bx(body, .07, .07, .02, '#ffd34d', -.08, .03, .29); bx(body, .07, .07, .02, '#51cf66', .06, .03, .29);
    bx(body, .84, .1, .56, '#ced4da', 0, -.27, 0);
  }

  /* --- 手臂 --- */
  const longSleeve = ['hoodie', 'suit', 'astro', 'sailor'].includes(o);
  const sleeve = o === 'sailor' || o === 'astro' ? '#fdfdfd' : (o === 'overall' ? '#fdfdfd' : cloth);
  ['L', 'R'].forEach((s, i) => {
    const g = new THREE.Group(); g.position.set((i ? 1 : -1) * (bw / 2 + .11), .98, 0); root.add(g);
    bx(g, .2, .26, .22, sleeve, 0, -.12, 0);
    bx(g, .18, .3, .2, longSleeve ? sleeve : skin, 0, -.39, 0);
    if (longSleeve) bx(g, .17, .1, .19, o === 'sailor' ? cloth : skin, 0, -.56, 0);
    P['arm' + s] = g;
  });

  /* --- 頭 --- */
  const head = new THREE.Group(); head.position.y = 1.47; root.add(head); P.head = head;
  const faceCanvas = document.createElement('canvas'); faceCanvas.width = FACE_W; faceCanvas.height = FACE_H;
  const fctx = faceCanvas.getContext('2d');
  const tex = new THREE.CanvasTexture(faceCanvas);
  const redraw = () => { drawFace(fctx, cfg, { onLoad: () => { drawFace(fctx, cfg); tex.needsUpdate = true; } }); tex.needsUpdate = true; };
  redraw();
  const sk = new THREE.MeshLambertMaterial({ color: skin });
  const faceMat = new THREE.MeshLambertMaterial({ map: tex });
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(1, .9, .9), [sk, sk, sk, sk, faceMat, sk]);
  headMesh.castShadow = true; head.add(headMesh);
  root.userData.faceTex = tex; root.userData.redrawFace = redraw;
  // 耳朵
  bx(head, .08, .16, .14, skin, -.52, -.05, 0); bx(head, .08, .16, .14, skin, .52, -.05, 0);

  buildHair(head, cfg);
  buildHat(head, cfg.hat);
  buildFaceAcc(head, cfg.face);
  buildBack(body, cfg.back, P);
  if (o === 'astro' && cfg.back === 'none') { bx(body, .5, .5, .2, '#dee2e6', 0, .02, -.34); }

  root.userData.parts = P;
  root.traverse(m => { if (m.isMesh) m.castShadow = true; });
  return root;
}

function buildHair(head, cfg) {
  const c = cfg.hairColor, c2 = shade(c, -.07);
  const st = cfg.hair;
  if (st === 'none') return;
  if (st === 'mohawk') {
    bx(head, .22, .34, 1.0, c, 0, .58, -.02);
    bx(head, .22, .12, .1, c, 0, .38, .46);
    return;
  }
  if (st === 'afro') {
    const a = new THREE.Mesh(new THREE.IcosahedronGeometry(.8, 1), MF(c));
    a.position.set(0, .3, -.3); a.scale.set(1.02, .82, .95); a.castShadow = true; head.add(a);
    bx(head, 1.06, .14, .12, c, 0, .33, .45);
    return;
  }
  // 基本髮型
  bx(head, 1.08, .22, .98, c, 0, .4, -.01);
  bx(head, 1.08, .62, .18, c2, 0, .12, -.45);
  bx(head, 1.06, .14, .12, c, 0, .33, .455);
  bx(head, .24, .1, .1, c, -.3, .22, .46); bx(head, .2, .08, .1, c, .12, .24, .46);
  if (st === 'bob' || st === 'long') {
    bx(head, .14, .78, .92, c, -.54, .04, -.01); bx(head, .14, .78, .92, c, .54, .04, -.01);
    bx(head, 1.1, .95, .2, c2, 0, -.04, -.46);
  } else {
    bx(head, .12, .38, .86, c, -.53, .24, -.02); bx(head, .12, .38, .86, c, .53, .24, -.02);
  }
  if (st === 'long') { bx(head, 1.1, 1.4, .18, c2, 0, -.42, -.48); bx(head, .14, .7, .3, c, -.54, -.55, -.3); bx(head, .14, .7, .3, c, .54, -.55, -.3); }
  if (st === 'spiky') {
    const pos = [[-.32, .1], [0, .15], [.32, .1], [-.18, -.25], [.18, -.25], [0, -.4]];
    pos.forEach(([x, z], i) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(.17, .42, 4), MF(c));
      cone.position.set(x, .66, z); cone.rotation.set(z * .6, i * .4, -x * .9); cone.castShadow = true; head.add(cone);
    });
  }
  if (st === 'pony') {
    const tie = new THREE.Mesh(new THREE.IcosahedronGeometry(.1, 0), MF('#ff6b8a')); tie.position.set(0, .2, -.58); head.add(tie);
    const tail = bx(head, .28, .7, .26, c, 0, -.15, -.7); tail.rotation.x = .3;
  }
  if (st === 'buns') {
    [-1, 1].forEach(s => { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.24, 1), MF(c)); b.position.set(s * .38, .58, -.08); b.castShadow = true; head.add(b); });
  }
}

function buildHat(head, id) {
  switch (id) {
    case 'cap':
      bx(head, 1.12, .26, 1.02, '#e8504f', 0, .52, 0); bx(head, .9, .06, .42, '#e8504f', 0, .4, .64);
      bx(head, .12, .06, .12, '#fff', 0, .68, 0); bx(head, .3, .16, .02, '#fff', 0, .53, .515); break;
    case 'beanie':
      bx(head, 1.12, .38, 1.04, '#ffb84d', 0, .55, 0); bx(head, 1.18, .14, 1.1, '#ff922b', 0, .36, 0);
      { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.16, 1), MF('#fff')); p.position.y = .86; head.add(p); } break;
    case 'bow': {
      bx(head, .14, .14, .14, '#ff5c8a', .3, .58, .12);
      [-1, 1].forEach(s => { const w = new THREE.Mesh(new THREE.ConeGeometry(.17, .3, 4), MF('#ff8fb1')); w.rotation.z = s * Math.PI / 2; w.position.set(.3 + s * .17, .58, .12); head.add(w); });
      break;
    }
    case 'leaf': {
      bx(head, .05, .2, .05, '#4f9a35', .02, .6, 0);
      const l = bx(head, .36, .05, .2, '#7cc95a', .17, .72, 0); l.rotation.z = .45;
      const l2 = bx(head, .24, .05, .15, '#9be07a', -.1, .7, 0); l2.rotation.z = -.5; break;
    }
    case 'flower': {
      const cols = ['#ff8fb1', '#ffd34d', '#ffffff', '#b197fc'];
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; bx(head, .15, .1, .15, i % 2 ? '#7cc95a' : cols[(i / 2) % 4 | 0], Math.sin(a) * .5, .52, Math.cos(a) * .48); }
      break;
    }
    case 'headphones': {
      const band = new THREE.Mesh(new THREE.TorusGeometry(.6, .05, 6, 18, Math.PI), M('#3d4a6b')); band.position.y = .02; head.add(band);
      bx(head, .14, .32, .32, '#ff6b8a', -.6, 0, 0); bx(head, .14, .32, .32, '#ff6b8a', .6, 0, 0); break;
    }
    case 'wizard': {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(.78, .78, .05, 16), MF('#6c4bd1')); brim.position.y = .5; head.add(brim);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(.46, 1, 8), MF('#7e62d9')); cone.position.set(0, 1.0, -.03); cone.rotation.z = .18; head.add(cone);
      bx(head, .14, .14, .04, '#ffd34d', .05, .82, .37); break;
    }
    case 'crown': case 'goldcrown': {
      const big = id === 'goldcrown';
      const r = big ? .46 : .38;
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r, big ? .22 : .17, 10), MF('#ffcc33')); ring.position.y = .58; head.add(ring);
      const n = big ? 7 : 5;
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const s = new THREE.Mesh(new THREE.ConeGeometry(.08, big ? .28 : .2, 4), MF('#ffcc33')); s.position.set(Math.sin(a) * r * .9, big ? .8 : .75, Math.cos(a) * r * .9); head.add(s); }
      if (big) { bx(head, .1, .1, .04, '#e03131', 0, .58, r + .01); bx(head, .08, .08, .04, '#4dabf7', -.25, .58, r * .78); bx(head, .08, .08, .04, '#51cf66', .25, .58, r * .78); }
      break;
    }
  }
}
function buildFaceAcc(head, id) {
  const y = -.035;
  if (id === 'glasses') {
    [-.19, .19].forEach(x => { const t = new THREE.Mesh(new THREE.TorusGeometry(.12, .022, 6, 16), M('#3a3a46')); t.position.set(x, y, .47); head.add(t); });
    bx(head, .14, .03, .03, '#3a3a46', 0, y + .02, .47);
    bx(head, .03, .03, .44, '#3a3a46', -.51, y + .02, .26); bx(head, .03, .03, .44, '#3a3a46', .51, y + .02, .26);
  }
  if (id === 'sunglasses') {
    bx(head, .3, .17, .04, '#1d1d24', -.19, y, .47); bx(head, .3, .17, .04, '#1d1d24', .19, y, .47);
    bx(head, 1.04, .04, .03, '#1d1d24', 0, y + .07, .47);
    bx(head, .06, .05, .02, '#ffffff', -.26, y + .03, .495);
  }
}
function buildBack(body, id, P) {
  if (id === 'backpack') {
    bx(body, .56, .56, .26, '#ff922b', 0, .0, -.36); bx(body, .58, .2, .28, '#e8590c', 0, .2, -.37);
    bx(body, .3, .14, .04, '#ffd34d', 0, -.08, -.5);
    bx(body, .08, .5, .04, '#e8590c', -.22, .02, .245); bx(body, .08, .5, .04, '#e8590c', .22, .02, .245);
  }
  if (id === 'cape') {
    const g = new THREE.Group(); g.position.set(0, .28, -.27); body.add(g);
    bx(g, .8, 1.0, .05, '#e03131', 0, -.5, 0);
    bx(g, .82, .08, .07, '#ffd34d', 0, 0, 0);
    P.cape = g;
  }
  if (id === 'wings') {
    [-1, 1].forEach(s => {
      const g = new THREE.Group(); g.position.set(s * .14, .14, -.27); body.add(g);
      const w = bx(g, .55, .36, .05, '#ffffff', s * .3, .06, -.05); w.rotation.z = s * .35;
      bx(g, .4, .2, .06, '#e7f5ff', s * .26, -.06, -.06).rotation.z = s * .35;
      P['wing' + (s < 0 ? 'L' : 'R')] = g;
    });
  }
}

/* 動畫：walk 0~1 */
function animateAvatar(av, t, walk, extra = {}) {
  const P = av.userData.parts; if (!P) return;
  const sw = Math.sin(t * 11) * .7 * walk;
  P.armL.rotation.x = sw; P.armR.rotation.x = -sw;
  P.legL.rotation.x = -sw; P.legR.rotation.x = sw;
  const bob = Math.abs(Math.sin(t * 11)) * .07 * walk + Math.sin(t * 2.2) * .015 * (1 - walk);
  P.body.position.y = .72 + bob; P.head.position.y = 1.47 + bob;
  P.head.rotation.z = Math.sin(t * 1.7) * .04 * (1 - walk);
  P.armL.position.y = P.armR.position.y = .98 + bob;
  if (extra.cheer) { P.armL.rotation.z = -2.6; P.armR.rotation.z = 2.6; P.armL.rotation.x = P.armR.rotation.x = 0; }
  else { P.armL.rotation.z = -.06; P.armR.rotation.z = .06; }
  if (P.cape) P.cape.rotation.x = .12 + walk * .55 + Math.sin(t * 6) * .06 * (walk + .3);
  if (P.wingL) { const f = Math.sin(t * (walk ? 14 : 4)) * .35; P.wingL.rotation.y = f; P.wingR.rotation.y = -f; }
}
