/* ============ 3D 六角群島世界 ============ */
const World = (() => {
  const S = 1, SQ3 = Math.sqrt(3);
  const HUB_R = 5, ISL_R = 6, DIST = 36;
  let renderer, scene, camera, sun, raycaster, groundPlane;
  let player, playerAv, nameSprite, clickMarker;
  const islands = [], bridges = [], facilities = [], colliders = [], animated = [], critters = [], labels = [];
  let keys = {}, target = null, targetFac = null;
  let yaw = 0, dist = 17, pitch = .86;
  const camTarget = new THREE.Vector3();
  let water, waterPos0;
  let currentIsland = undefined, nearFac = null, lastStep = 0, cheerUntil = 0;
  let onInteract = () => { };
  let rng = mulberry32(20261106);

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const R = () => rng();
  const rpick = a => a[Math.floor(R() * a.length)];

  /* ---------- 六角座標 ---------- */
  const axial = (q, r) => [S * SQ3 * (q + r / 2), S * 1.5 * r];
  function toAxial(x, z) {
    const q = (SQ3 / 3 * x - z / 3) / S, r = (2 / 3 * z) / S;
    let rx = Math.round(q), rz = Math.round(r), ry = Math.round(-q - r);
    const dx = Math.abs(rx - q), dz = Math.abs(rz - r), dy = Math.abs(ry + q + r);
    if (dx > dy && dx > dz) rx = -ry - rz; else if (dy <= dz) rz = -rx - ry;
    return [rx, rz];
  }
  const hexDist = (q, r) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;

  const BIOMES = {
    hub: { grass: ['#9fdc78', '#94d66d', '#a9e283'], dirt: '#b98a5e', edge: '#f3e2b0', path: '#efe2c4', gem: '#ffd34d' },
    meadow: { grass: ['#8fd46a', '#9adb74', '#84cc5f'], dirt: '#b98a5e', edge: '#f4e0a8', path: '#ecdcb6', gem: '#ffd34d' },
    forest: { grass: ['#5fb64e', '#6bc057', '#56ac46'], dirt: '#8e6744', edge: '#d9c48d', path: '#cfb07f', gem: '#7cc95a' },
    beach: { grass: ['#f7e6ad', '#f2dc98', '#fbecbf'], dirt: '#d9b27a', edge: '#fff3cf', path: '#e9d3a2', gem: '#4dabf7' },
    snow: { grass: ['#f5f9ff', '#eaf2fc', '#ffffff'], dirt: '#8fa5bd', edge: '#dfeaf5', path: '#d3deea', gem: '#b197fc' },
    autumn: { grass: ['#f0b45e', '#e9a650', '#f5c272'], dirt: '#9c6b44', edge: '#f6dfae', path: '#dcc095', gem: '#ff922b' },
  };
  const ROOFS = ['#ff8a8a', '#5bb8f0', '#ffb84d', '#9775fa', '#5fc77a'];

  /* ---------- 小工具 ---------- */
  function mesh(geo, color, x = 0, y = 0, z = 0, parent, flat = true) {
    const m = new THREE.Mesh(geo, flat ? MF(color) : M(color));
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
    parent && parent.add(m); return m;
  }
  const G_BOX = new THREE.BoxGeometry(1, 1, 1);
  function cube(parent, w, hh, d, color, x, y, z) { const m = mesh(G_BOX, color, x, y, z, parent); m.scale.set(w, hh, d); return m; }

  function makeLabel(lines, opts = {}) {
    const c = document.createElement('canvas'), ctx = c.getContext('2d');
    const sizes = lines.map((_, i) => i === 0 ? (opts.big ? 52 : 40) : 30);
    const fonts = sizes.map(s => `700 ${s}px Fredoka, "Noto Sans TC", sans-serif`);
    let w = 0; lines.forEach((l, i) => { ctx.font = fonts[i]; w = Math.max(w, ctx.measureText(l).width); });
    c.width = Math.ceil(w + 56); c.height = sum(sizes.map(s => s + 14)) + 26;
    ctx.fillStyle = opts.bg || 'rgba(255,250,240,.96)';
    ctx.strokeStyle = opts.border || '#e8d6b8'; ctx.lineWidth = 6;
    const rr = 28; ctx.beginPath(); ctx.moveTo(rr, 3); ctx.arcTo(c.width - 3, 3, c.width - 3, c.height - 3, rr); ctx.arcTo(c.width - 3, c.height - 3, 3, c.height - 3, rr); ctx.arcTo(3, c.height - 3, 3, 3, rr); ctx.arcTo(3, 3, c.width - 3, 3, rr); ctx.closePath();
    ctx.fill(); ctx.stroke();
    let y = 16;
    lines.forEach((l, i) => { ctx.font = fonts[i]; ctx.fillStyle = i === 0 ? (opts.fg || '#4a3a2c') : '#8a735d'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(l, c.width / 2, y + 4); y += sizes[i] + 14; });
    const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sp.renderOrder = 20;
    const sc = (opts.scale || .7) / 100;
    sp.scale.set(c.width * sc, c.height * sc, 1);
    sp.userData.maxDist = opts.maxDist || 24;
    labels.push(sp);
    return sp;
  }
  function relabel(sp, lines, opts) {
    const n = makeLabel(lines, opts); labels.pop();
    sp.material.map.dispose(); sp.material.map = n.material.map; sp.scale.copy(n.scale); sp.material.needsUpdate = true;
  }

  /* ---------- 島嶼 ---------- */
  const capGeo = new THREE.CylinderGeometry(S * .985, S * .985, .25, 6);
  const colGeo = new THREE.CylinderGeometry(S * .985, S * .985, 3, 6);
  function buildIsland(isl) {
    const B = BIOMES[isl.biome];
    const tiles = [];
    for (let q = -isl.R; q <= isl.R; q++) for (let r = Math.max(-isl.R, -q - isl.R); r <= Math.min(isl.R, -q + isl.R); r++) {
      const [x, z] = axial(q, r); tiles.push({ q, r, d: hexDist(q, r), x: x + isl.cx, z: z + isl.cz });
    }
    isl.tiles = tiles;
    const caps = new THREE.InstancedMesh(capGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), tiles.length);
    const cols = new THREE.InstancedMesh(colGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), tiles.length);
    caps.receiveShadow = true; cols.receiveShadow = true; caps.castShadow = false;
    const m4 = new THREE.Matrix4(), col = new THREE.Color();
    tiles.forEach((t, i) => {
      const edge = t.d === isl.R;
      const onPath = t.d <= 1 || isl.paths.some(p => segDist(t.x, t.z, isl.cx, isl.cz, p[0], p[1]) < .62);
      t.path = onPath && !edge;
      const top = edge ? -.1 : (t.path ? 0 : R() * .04);
      t.top = top;
      m4.makeTranslation(t.x, top - .125, t.z); caps.setMatrixAt(i, m4);
      col.set(edge ? B.edge : t.path ? B.path : rpick(B.grass));
      if (isl.biome === 'beach' && !edge && !t.path && R() < .25) col.set('#a7de86');
      if (isl.biome === 'autumn' && !edge && !t.path && R() < .2) col.set('#8fcf6a');
      col.offsetHSL(0, 0, (R() - .5) * .03);
      caps.setColorAt(i, col);
      m4.makeTranslation(t.x, top - .25 - 1.5, t.z); cols.setMatrixAt(i, m4);
      col.set(edge ? shade(B.dirt, .08) : B.dirt); col.offsetHSL(0, 0, (R() - .5) * .05); cols.setColorAt(i, col);
    });
    scene.add(caps, cols);
    // 岸邊浪花
    const foam = new THREE.Mesh(new THREE.RingGeometry(isl.R * 1.5 * S + .6, isl.R * 1.5 * S + 2.2, 6, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .35, depthWrite: false }));
    foam.rotation.x = -Math.PI / 2; foam.rotation.z = Math.PI / 6; foam.position.set(isl.cx, -.68, isl.cz); scene.add(foam);
    animated.push(t => { const s = 1 + Math.sin(t * 1.4 + isl.cx) * .03; foam.scale.set(s, s, 1); foam.material.opacity = .25 + Math.sin(t * 1.4 + isl.cx) * .1; });
  }
  function segDist(px, pz, ax, az, bx, bz) {
    const vx = bx - ax, vz = bz - az, wx = px - ax, wz = pz - az;
    const t = clamp((wx * vx + wz * vz) / (vx * vx + vz * vz), 0, 1);
    return Math.hypot(px - (ax + vx * t), pz - (az + vz * t));
  }
  function tileAt(isl, x, z) {
    const [q, r] = toAxial(x - isl.cx, z - isl.cz);
    if (hexDist(q, r) > isl.R) return null;
    return isl.tiles.find(t => t.q === q && t.r === r);
  }

  /* ---------- 裝飾 ---------- */
  const DECOR = {
    tree(g, c = '#7cc95a') {
      cube(g, .32, 1.1, .32, '#8b5e3c', 0, .55, 0);
      cube(g, 1.4, 1.0, 1.4, c, 0, 1.45, 0); cube(g, .95, .6, .95, shade(c, .06), 0, 2.2, 0);
      cube(g, .5, .4, .5, shade(c, -.05), .55, 1.2, .5);
      return .55;
    },
    pine(g, c = '#3f9b4a', snow) {
      cube(g, .3, .8, .3, '#7a5234', 0, .4, 0);
      [[1.1, 1.0, 1.1], [.85, .9, 1.8], [.55, .8, 2.4]].forEach(([r, hh, y]) => {
        mesh(new THREE.ConeGeometry(r, hh, 6), c, 0, y, 0, g);
        if (snow) mesh(new THREE.ConeGeometry(r * .55, hh * .45, 6), '#ffffff', 0, y + hh * .3, 0, g);
      });
      return .5;
    },
    palm(g) {
      for (let i = 0; i < 5; i++) cube(g, .26, .45, .26, i % 2 ? '#c69a6a' : '#b4875a', i * .07, .22 + i * .44, 0);
      for (let i = 0; i < 5; i++) { const l = cube(g, 1.3, .08, .34, '#5fbf5a', .35 + Math.cos(i * 1.256) * .55, 2.3, Math.sin(i * 1.256) * .55); l.rotation.y = -i * 1.256; l.rotation.z = -.35; }
      mesh(new THREE.IcosahedronGeometry(.14, 0), '#8b5e3c', .35, 2.15, .15, g);
      return .4;
    },
    bush(g, c = '#6cc25a') { mesh(new THREE.IcosahedronGeometry(.55, 0), c, 0, .4, 0, g).scale.set(1, .8, 1); mesh(new THREE.IcosahedronGeometry(.35, 0), shade(c, .06), .4, .3, .2, g); return .5; },
    rock(g, c = '#b8b0a4') { mesh(new THREE.DodecahedronGeometry(.45, 0), c, 0, .25, 0, g).scale.set(1.2, .7, 1); return .5; },
    flower(g) {
      const cols = ['#ff8fb1', '#ffd34d', '#ffffff', '#b197fc', '#ff8a5b'];
      for (let i = 0; i < 3; i++) { const x = (R() - .5) * .8, z = (R() - .5) * .8; cube(g, .04, .25, .04, '#4f9a35', x, .12, z); cube(g, .16, .12, .16, rpick(cols), x, .28, z); cube(g, .07, .07, .07, '#ffd34d', x, .35, z); }
      return 0;
    },
    mushroom(g) {
      mesh(new THREE.CylinderGeometry(.13, .16, .4, 6), '#fff4e0', 0, .2, 0, g);
      mesh(new THREE.SphereGeometry(.36, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), '#ff6b6b', 0, .38, 0, g);
      cube(g, .08, .03, .08, '#fff', .15, .58, .1); cube(g, .07, .03, .07, '#fff', -.12, .6, -.08);
      return .25;
    },
    snowman(g) {
      mesh(new THREE.IcosahedronGeometry(.45, 1), '#ffffff', 0, .42, 0, g); mesh(new THREE.IcosahedronGeometry(.32, 1), '#ffffff', 0, 1.05, 0, g);
      mesh(new THREE.ConeGeometry(.06, .3, 4), '#ff922b', 0, 1.05, .4, g).rotation.x = Math.PI / 2;
      cube(g, .06, .06, .04, '#222', -.11, 1.14, .29); cube(g, .06, .06, .04, '#222', .11, 1.14, .29);
      cube(g, .7, .1, .1, '#e03131', 0, .8, .1);
      return .45;
    },
    crate(g) { cube(g, .7, .7, .7, '#c98d55', 0, .35, 0); cube(g, .72, .1, .72, '#a86f3d', 0, .6, 0); cube(g, .72, .1, .72, '#a86f3d', 0, .1, 0); return .45; },
    pumpkin(g) { mesh(new THREE.IcosahedronGeometry(.38, 1), '#ff922b', 0, .3, 0, g).scale.set(1.2, .85, 1.2); cube(g, .07, .2, .07, '#5a3a20', 0, .65, 0); return .4; },
    shell(g) { mesh(new THREE.ConeGeometry(.2, .3, 5), '#ffc2d4', 0, .1, 0, g).rotation.z = 1.4; mesh(new THREE.ConeGeometry(.15, .12, 5), '#ff922b', .5, .06, .3, g); return 0; },
  };
  const BIOME_DECOR = {
    hub: [['tree', '#7cc95a', 3], ['flower', 0, 4], ['bush', '#6cc25a', 2]],
    meadow: [['flower', 0, 7], ['tree', '#8fd46a', 3], ['bush', '#76c95d', 2], ['rock', '#c9c0b2', 1]],
    forest: [['pine', '#3f9b4a', 5], ['tree', '#4fae4a', 3], ['mushroom', 0, 3], ['bush', '#4f9a35', 2]],
    beach: [['palm', 0, 4], ['shell', 0, 3], ['rock', '#d8cbb5', 2], ['flower', 0, 1]],
    snow: [['pine', '#3f8a5a', 5, true], ['snowman', 0, 1], ['rock', '#cdd6e0', 2]],
    autumn: [['tree', '#ff9f43', 3], ['tree', '#e8590c', 2], ['pumpkin', 0, 2], ['crate', 0, 2], ['flower', 0, 1]],
  };
  function decorate(isl) {
    const pool = []; BIOME_DECOR[isl.biome].forEach(([k, c, w, extra]) => { for (let i = 0; i < w; i++) pool.push([k, c, extra]); });
    const density = isl.biome === 'hub' ? .2 : .32;
    isl.tiles.forEach(t => {
      if (t.d < 2 || t.d > isl.R - 1 || t.path) return;
      if (facilities.some(f => Math.hypot(f.x - t.x, f.z - t.z) < 3.0 || Math.hypot(f.fx - t.x, f.fz - t.z) < 1.8)) return;
      if (R() > density) return;
      const [k, c, extra] = rpick(pool);
      const g = new THREE.Group(); g.position.set(t.x + (R() - .5) * .5, t.top, t.z + (R() - .5) * .5); g.rotation.y = R() * 6.28;
      const s = .85 + R() * .35; g.scale.setScalar(s);
      const rad = DECOR[k](g, c || undefined, extra);
      scene.add(g);
      if (rad) colliders.push({ x: g.position.x, z: g.position.z, r: rad * s });
    });
  }

  /* ---------- 建築 ---------- */
  function buildBuilding(type, roof) {
    const g = new THREE.Group();
    const wall = '#fff4e2';
    const door = (z, y = .55, w = .62) => { cube(g, w, 1.05, .1, '#9c6b44', 0, y, z); cube(g, .1, .1, .05, '#ffd34d', .18, .55, z + .06); };
    const win = (x, y, z, ry = 0) => { const w = cube(g, .5, .5, .08, '#bfe9ff', x, y, z); w.rotation.y = ry; const f = cube(g, .6, .08, .1, '#fff', x, y - .3, z); f.rotation.y = ry; };
    let r = 1.7;
    switch (type) {
      case 'house': {
        cube(g, 2.6, 1.9, 2.3, wall, 0, .95, 0);
        cube(g, 2.7, .2, 2.4, shade(roof, -.15), 0, .1, 0);
        const rf = mesh(new THREE.ConeGeometry(2.25, 1.4, 4), roof, 0, 2.6, 0, g); rf.rotation.y = Math.PI / 4; rf.scale.z = .9;
        cube(g, .35, .8, .35, '#c9a27a', .7, 3.0, -.3);
        door(1.17); win(-.75, 1.15, 1.17); win(.85, 1.15, 1.17);
        r = 1.8; break;
      }
      case 'shop': { // 開放式市集攤位 + 旋轉大金幣
        const wood = '#c98d55', woodD = '#9c6b44';
        cube(g, 3.0, .25, 2.5, woodD, 0, .12, 0);
        cube(g, 2.9, 2.3, .2, wall, 0, 1.4, -1.1);               // 後牆
        cube(g, .2, 2.3, 2.2, wall, -1.4, 1.4, 0); cube(g, .2, 2.3, 2.2, wall, 1.4, 1.4, 0);
        [[-1.1, -.95], [-.1, -.95], [.9, -.95]].forEach(([x]) => {        // 後牆貨架
          [.9, 1.55, 2.2].forEach((y, k) => {
            cube(g, .85, .08, .35, wood, x, y, -.85);
            for (let i = 0; i < 3; i++) cube(g, .2, .22, .2, ['#ff8fb1', '#5bb8f0', '#ffd34d', '#7cc95a', '#b197fc', '#ff922b'][(i + k * 2 + Math.round(x * 3)) % 6], x - .27 + i * .27, y + .15, -.85);
          });
        });
        cube(g, 2.6, .85, .55, wood, 0, .65, .95);                // 櫃台
        cube(g, 2.75, .12, .7, '#ffe6b3', 0, 1.12, .95);
        cube(g, .35, .35, .35, '#ffd34d', -.8, 1.35, .95); cube(g, .3, .45, .3, '#ff8fb1', -.25, 1.4, .95);
        const gem = mesh(new THREE.OctahedronGeometry(.24, 0), '#5bb8f0', .45, 1.45, .95, g);
        cube(g, .4, .1, .3, '#b197fc', .95, 1.25, .95);
        [[-1.4, 1.2], [1.4, 1.2]].forEach(([x, z]) => cube(g, .16, 2.6, .16, woodD, x, 1.4, z));
        for (let i = 0; i < 7; i++) { const a = cube(g, .44, .08, 1.1, i % 2 ? '#fff' : roof, -1.32 + i * .44, 2.75, .75); a.rotation.x = .32; }
        for (let i = 0; i < 7; i++) mesh(new THREE.ConeGeometry(.22, .25, 4), i % 2 ? '#fff' : roof, -1.32 + i * .44, 2.42, 1.3, g).rotation.x = Math.PI;
        cube(g, 3.0, .25, 2.2, shade(roof, -.15), 0, 2.7, -.2);   // 屋頂
        const coin = new THREE.Group(); coin.position.set(0, 3.75, -.2); g.add(coin);
        mesh(new THREE.CylinderGeometry(.62, .62, .16, 16), '#ffd34d', 0, 0, 0, coin).rotation.x = Math.PI / 2;
        mesh(new THREE.CylinderGeometry(.46, .46, .18, 16), '#ffb703', 0, 0, 0, coin).rotation.x = Math.PI / 2;
        cube(coin, .26, .26, .22, '#fff4c2', 0, 0, 0);
        cube(g, .1, .55, .1, woodD, 0, 3.1, -.2);
        animated.push(t => { coin.rotation.y = t * 1.6; coin.position.y = 3.75 + Math.sin(t * 2) * .08; gem.rotation.y = t * 2; });
        r = 1.8; break;
      }
      case 'wardrobe': { // 巨大衣櫃造型 + 衣架 + 鏡子
        const wood = roof, woodD = shade(roof, -.25);
        cube(g, 2.3, .25, 1.8, woodD, 0, .12, -.1);
        cube(g, 2.2, 3.0, 1.6, wood, 0, 1.75, -.1);              // 櫃身
        cube(g, 2.45, .3, 1.8, woodD, 0, 3.35, -.1);              // 頂飾
        cube(g, 1.0, .35, .1, '#fff', 0, 3.0, .72);              // 名牌
        cube(g, .6, .12, .04, roof, 0, 3.0, .78);
        cube(g, .04, 2.4, .1, woodD, 0, 1.55, .72);              // 門縫
        const dl = new THREE.Group(); dl.position.set(-1.05, 0, .72); g.add(dl);
        cube(dl, 1.0, 2.4, .1, shade(roof, .12), .5, 1.55, 0); cube(dl, .1, .3, .1, '#ffd34d', .88, 1.6, .08);
        dl.rotation.y = -.55;                                     // 左門半開
        cube(g, 1.0, 2.4, .1, shade(roof, .12), .53, 1.55, .72); cube(g, .1, .3, .1, '#ffd34d', .15, 1.6, .8);
        ['#ff8fb1', '#5bb8f0', '#ffd34d', '#7cc95a'].forEach((c, i) => cube(g, .2, .9, .5, c, -.85 + i * .22, 1.7, .25)); // 櫃內衣服
        const hang = new THREE.Group(); hang.position.set(0, 3.55, -.1); g.add(hang);   // 大衣架
        mesh(new THREE.TorusGeometry(.18, .05, 6, 12, Math.PI * 1.4), '#c0c4cc', 0, .95, 0, hang);
        const a1 = cube(hang, 1.0, .1, .1, '#c0c4cc', -.42, .45, 0); a1.rotation.z = .55;
        const a2 = cube(hang, 1.0, .1, .1, '#c0c4cc', .42, .45, 0); a2.rotation.z = -.55;
        cube(hang, 1.75, .1, .1, '#c0c4cc', 0, .17, 0);
        cube(g, .06, 1.0, .06, '#c0c4cc', 0, 3.9, -.1);
        // 右側吊衣架
        cube(g, .1, 1.9, .1, '#8b8f99', 1.55, .95, .9); cube(g, .1, 1.9, .1, '#8b8f99', 1.55, .95, -.4);
        cube(g, .08, .08, 1.4, '#8b8f99', 1.55, 1.85, .25);
        const shirts = [];
        ['#ff8a5b', '#7cd6a8', '#a78bfa'].forEach((c, i) => {
          const s = new THREE.Group(); s.position.set(1.55, 1.82, -.15 + i * .42); g.add(s);
          cube(s, .1, .6, .34, c, 0, -.35, 0); cube(s, .1, .18, .58, c, 0, -.12, 0);
          shirts.push(s);
        });
        // 左側立鏡
        const mir = new THREE.Group(); mir.position.set(-1.6, 0, .55); mir.rotation.y = .5; g.add(mir);
        cube(mir, .75, 1.9, .1, '#ffd34d', 0, 1.15, 0);
        const glass = cube(mir, .6, 1.75, .06, '#dff3ff', 0, 1.15, .05);
        glass.material = new THREE.MeshLambertMaterial({ color: '#dff3ff', emissive: '#9fd8ff', emissiveIntensity: .25 });
        cube(mir, .5, .1, .4, '#9c6b44', 0, .12, 0);
        animated.push(t => {
          shirts.forEach((s, i) => s.rotation.x = Math.sin(t * 1.6 + i) * .12);
          hang.rotation.y = Math.sin(t * .9) * .25;
          glass.material.emissiveIntensity = .2 + Math.max(0, Math.sin(t * 1.3)) * .35;
        });
        r = 1.8; break;
      }
      case 'dome': {
        mesh(new THREE.CylinderGeometry(1.5, 1.6, 1.2, 8), wall, 0, .6, 0, g);
        mesh(new THREE.SphereGeometry(1.5, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), roof, 0, 1.2, 0, g);
        mesh(new THREE.CylinderGeometry(.18, .18, .5, 6), '#fff', 0, 2.8, 0, g);
        mesh(new THREE.IcosahedronGeometry(.22, 0), '#ffd34d', 0, 3.1, 0, g);
        door(1.5); r = 1.7; break;
      }
      case 'tent': {
        mesh(new THREE.ConeGeometry(1.8, 2.6, 6), roof, 0, 1.3, 0, g).rotation.y = Math.PI / 6;
        for (let i = 0; i < 3; i++) { const s = mesh(new THREE.ConeGeometry(1.82, 2.62, 6, 1, true, i * 2.09, .5), '#fff', 0, 1.3, 0, g); s.rotation.y = Math.PI / 6; }
        const d = cube(g, .8, 1.2, .1, '#5a3a20', 0, .6, 1.38); d.rotation.x = -.5;
        cube(g, .06, .8, .06, '#8b5e3c', 0, 2.9, 0); cube(g, .5, .3, .04, '#ffd34d', .26, 3.1, 0);
        r = 1.6; break;
      }
      case 'windmill': {
        mesh(new THREE.CylinderGeometry(1.0, 1.35, 3.2, 8), wall, 0, 1.6, 0, g);
        mesh(new THREE.ConeGeometry(1.3, 1.2, 8), roof, 0, 3.8, 0, g);
        door(1.2, .55); win(0, 2.2, 1.06);
        const hub = new THREE.Group(); hub.position.set(0, 3.0, 1.25); g.add(hub);
        cube(hub, .3, .3, .3, '#8b5e3c', 0, 0, 0);
        for (let i = 0; i < 4; i++) { const b = new THREE.Group(); b.rotation.z = i * Math.PI / 2; hub.add(b); cube(b, .3, 1.7, .06, '#fff', 0, 1.0, .05); cube(b, .06, 1.7, .08, '#c9a27a', -.15, 1.0, .05); }
        animated.push((t) => hub.rotation.z = t * .8);
        r = 1.5; break;
      }
      case 'tower': {
        mesh(new THREE.CylinderGeometry(1.15, 1.3, 3.4, 8), wall, 0, 1.7, 0, g);
        mesh(new THREE.ConeGeometry(1.55, 1.7, 8), roof, 0, 4.25, 0, g);
        cube(g, .06, .7, .06, '#8b5e3c', 0, 5.4, 0); cube(g, .45, .3, .04, roof, .24, 5.6, 0);
        door(1.25); win(0, 2.5, 1.18);
        r = 1.5; break;
      }
      case 'lighthouse': {
        for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(1.05 - i * .12 - .12, 1.05 - i * .12, 1, 8), i % 2 ? '#fff' : '#ff6b6b', 0, .5 + i, 0, g);
        const lamp = mesh(new THREE.CylinderGeometry(.55, .55, .7, 8), '#fff6bf', 0, 4.35, 0, g);
        lamp.material = new THREE.MeshLambertMaterial({ color: '#fff6bf', emissive: '#ffd34d', emissiveIntensity: .6 });
        mesh(new THREE.ConeGeometry(.75, .7, 8), roof, 0, 5.05, 0, g);
        door(1.0, .55, .55);
        animated.push(t => lamp.material.emissiveIntensity = .3 + Math.max(0, Math.sin(t * 2.5)) * .9);
        r = 1.3; break;
      }
      case 'bigtree': {
        cube(g, 1.4, 2.4, 1.4, '#8b5e3c', 0, 1.2, 0);
        cube(g, .6, 1.0, .1, '#5a3a20', 0, .55, .72);
        [[0, 3.2, 0, 3.4, 1.8], [1.1, 2.7, .4, 1.6, 1.2], [-1.1, 2.9, -.3, 1.7, 1.3], [0, 4.3, 0, 2.2, 1.1]].forEach(([x, y, z, s, hh]) => cube(g, s, hh, s, rpick(['#4fae4a', '#5fbf5a', '#47a042']), x, y, z));
        for (let i = 0; i < 5; i++) cube(g, .25, .25, .25, '#ffd34d', (R() - .5) * 2.6, 2.6 + R() * 1.8, 1.0 + R() * .3);
        r = 1.4; break;
      }
      case 'castle': {
        cube(g, 3.2, 2.6, 3.0, '#e9e2d6', 0, 1.3, 0);
        [[-1.5, -1.4], [1.5, -1.4], [-1.5, 1.4], [1.5, 1.4]].forEach(([x, z]) => {
          mesh(new THREE.CylinderGeometry(.55, .6, 3.6, 8), '#ded5c5', x, 1.8, z, g);
          mesh(new THREE.ConeGeometry(.75, 1.2, 8), '#9775fa', x, 4.2, z, g);
        });
        for (let i = 0; i < 5; i++) cube(g, .35, .35, .35, '#e9e2d6', -1.2 + i * .6, 2.75, 1.4);
        cube(g, .9, 1.4, .12, '#7a5234', 0, .7, 1.52);
        cube(g, .06, 1.2, .06, '#8b5e3c', 0, 3.4, 0); const fl = cube(g, .7, .45, .04, '#ffd34d', .37, 3.75, 0);
        animated.push(t => fl.rotation.y = Math.sin(t * 3) * .25);
        r = 2.2; break;
      }
      case 'board': {
        cube(g, .15, 1.8, .15, '#8b5e3c', -.9, .9, 0); cube(g, .15, 1.8, .15, '#8b5e3c', .9, .9, 0);
        cube(g, 2.2, 1.2, .12, '#c98d55', 0, 1.4, 0);
        cube(g, .6, .45, .02, '#fff', -.5, 1.55, .07); cube(g, .5, .4, .02, '#ffe3ec', .3, 1.35, .07); cube(g, .4, .3, .02, '#e3f4ff', .7, 1.65, .07);
        const roofb = mesh(new THREE.ConeGeometry(1.5, .5, 4), roof, 0, 2.25, 0, g); roofb.rotation.y = Math.PI / 4; roofb.scale.z = .35;
        r = 1.1; break;
      }
    }
    return { g, r };
  }

  function addFacility(def, isl, angle, rad) {
    const x = isl.cx + Math.cos(angle) * rad, z = isl.cz + Math.sin(angle) * rad;
    const { g, r } = buildBuilding(def.bld, def.roof);
    g.position.set(x, 0, z);
    g.rotation.y = Math.atan2(isl.cx - x, isl.cz - z); // +z 面向島中心
    scene.add(g);
    const fd = r + 1.1;
    const fac = { ...def, x, z, r, g, island: isl.id, fx: x + Math.sin(g.rotation.y) * fd, fz: z + Math.cos(g.rotation.y) * fd };
    g.traverse(o => o.userData.fac = fac);
    const lab = makeLabel(['…']); lab.position.set(0, def.bld === 'lighthouse' || def.bld === 'tower' ? 6.9 : def.bld === 'bigtree' ? 5.8 : 5.0, 0);
    if (def.bld === 'castle') lab.position.y = 6;
    if (def.bld === 'wardrobe' || def.bld === 'shop') lab.position.y = 5.5;
    g.add(lab); fac.label = lab;
    colliders.push({ x, z, r });
    facilities.push(fac);
    return fac;
  }

  /* ---------- 橋 ---------- */
  function buildBridge(isl) {
    const dx = Math.cos(isl.angle), dz = Math.sin(isl.angle);
    const s0 = HUB_R * 1.5 + .5, s1 = DIST - ISL_R * 1.5 - .5;
    const g = new THREE.Group(); scene.add(g);
    const yaw = Math.atan2(dx, dz);
    for (let s = s0 - .6; s <= s1 + .6; s += .55) {
      const p = cube(g, 2.4, .18, .48, Math.round(s / .55) % 2 ? '#c99868' : '#b8855a', dx * s, -.06, dz * s);
      p.rotation.y = yaw;
    }
    for (let s = s0; s <= s1; s += 2.4) [-1, 1].forEach(side => {
      const px = dx * s + Math.cos(yaw) * side * 1.15, pz = dz * s - Math.sin(yaw) * side * 1.15;
      cube(g, .16, .8, .16, '#8b5e3c', px, .3, pz);
    });
    [-1, 1].forEach(side => {
      const L = s1 - s0, m = (s0 + s1) / 2;
      const rail = cube(g, .1, .1, L, '#a86f3d', dx * m + Math.cos(yaw) * side * 1.15, .66, dz * m - Math.sin(yaw) * side * 1.15);
      rail.rotation.y = yaw;
    });
    // 柵門
    const gs = s1 - 1.2;
    const gate = new THREE.Group(); gate.position.set(dx * gs, 0, dz * gs); gate.rotation.y = yaw; scene.add(gate);
    cube(gate, .3, 2.2, .3, '#8b5e3c', -1.25, 1.1, 0); cube(gate, .3, 2.2, .3, '#8b5e3c', 1.25, 1.1, 0);
    cube(gate, 2.9, .3, .3, '#a86f3d', 0, 2.2, 0);
    for (let i = -2; i <= 2; i++) cube(gate, .14, 1.4, .1, '#c99868', i * .42, .75, 0);
    const lockLab = makeLabel(['🔒 尚未開放', `完成上一座島 ${unlockNeed(ISLANDS[Math.max(0, isl.id - 2)])} 個任務`], { maxDist: 30 });
    lockLab.position.set(0, 3.2, 0); gate.add(lockLab);
    const b = { isl, dx, dz, s0: s0 - 1.2, s1: s1 + 1.2, gs, gate, locked: true };
    bridges.push(b);
    return b;
  }

  /* ---------- 小生物 ---------- */
  function addCritter(isl, color) {
    const g = new THREE.Group();
    const body = mesh(new THREE.IcosahedronGeometry(.34, 1), color, 0, .34, 0, g); body.scale.set(1, .9, 1);
    cube(g, .07, .1, .04, '#2b1d14', -.11, .4, .31); cube(g, .07, .1, .04, '#2b1d14', .11, .4, .31);
    cube(g, .1, .05, .03, '#ff9fb5', -.2, .3, .3); cube(g, .1, .05, .03, '#ff9fb5', .2, .3, .3);
    const leaf = cube(g, .2, .04, .12, '#7cc95a', .05, .74, 0); leaf.rotation.z = .4;
    scene.add(g);
    const c = { g, isl, x: isl.cx + 2, z: isl.cz + 2, tx: isl.cx, tz: isl.cz, wait: R() * 3, ph: R() * 6 };
    g.position.set(c.x, 0, c.z);
    critters.push(c);
  }
  function updateCritters(t, dt) {
    critters.forEach(c => {
      const dx = c.tx - c.x, dz = c.tz - c.z, d = Math.hypot(dx, dz);
      if (d < .2) { c.wait -= dt; if (c.wait < 0) { const a = Math.random() * 6.28, rr = 2 + Math.random() * (c.isl.R * 1.2); c.tx = c.isl.cx + Math.cos(a) * rr; c.tz = c.isl.cz + Math.sin(a) * rr; c.wait = 1 + Math.random() * 3; } c.g.position.y = 0; }
      else {
        const sp = 1.4 * dt; const nx = c.x + dx / d * sp, nz = c.z + dz / d * sp;
        if (colliders.some(o => Math.hypot(o.x - nx, o.z - nz) < o.r + .3)) { c.tx = c.x; c.tz = c.z; }
        else { c.x = nx; c.z = nz; }
        c.g.position.set(c.x, Math.abs(Math.sin(t * 9 + c.ph)) * .3, c.z);
        c.g.rotation.y = Math.atan2(dx, dz);
      }
      // 靠近玩家會開心跳
      if (player && Math.hypot(player.position.x - c.x, player.position.z - c.z) < 2.2) c.g.position.y = Math.abs(Math.sin(t * 12 + c.ph)) * .5;
    });
  }

  /* ---------- 雲 ---------- */
  function addClouds() {
    for (let i = 0; i < 14; i++) {
      const g = new THREE.Group();
      const n = 3 + Math.floor(R() * 3);
      for (let k = 0; k < n; k++) cube(g, 2 + R() * 2.5, 1 + R() * 1, 2 + R() * 2, '#ffffff', k * 1.6 - n * .8, R() * .6, (R() - .5) * 1.5).castShadow = false;
      g.position.set((R() - .5) * 140, 16 + R() * 8, (R() - .5) * 140);
      scene.add(g);
      const sp = .6 + R() * .8;
      animated.push((t, dt) => { g.position.x += sp * dt; if (g.position.x > 80) g.position.x = -80; });
    }
  }

  /* ---------- 初始化 ---------- */
  function init(canvas, interactCb) {
    onInteract = interactCb;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    const sky = document.createElement('canvas'); sky.width = 2; sky.height = 256;
    const sctx = sky.getContext('2d'); const grd = sctx.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, '#7fd0ff'); grd.addColorStop(.6, '#c4ecff'); grd.addColorStop(1, '#f1fbff');
    sctx.fillStyle = grd; sctx.fillRect(0, 0, 2, 256);
    scene.background = new THREE.CanvasTexture(sky);
    scene.fog = new THREE.Fog('#d5f1ff', 55, 125);
    camera = new THREE.PerspectiveCamera(42, 1, .1, 400);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9fcf7f, .72));
    scene.add(new THREE.AmbientLight(0xfff2dd, .18));
    sun = new THREE.DirectionalLight(0xfff6e5, .62);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -28; sc.right = 28; sc.top = 28; sc.bottom = -28; sc.near = 1; sc.far = 120;
    sun.shadow.bias = -.0008; sun.shadow.radius = 3;
    scene.add(sun, sun.target);
    raycaster = new THREE.Raycaster();
    groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // 水
    const wg = new THREE.PlaneGeometry(300, 300, 90, 90); wg.rotateX(-Math.PI / 2);
    water = new THREE.Mesh(wg, new THREE.MeshLambertMaterial({ color: '#56c4e6', flatShading: true, transparent: true, opacity: .93 }));
    water.position.y = -.75; water.receiveShadow = true; scene.add(water);
    waterPos0 = Float32Array.from(wg.attributes.position.array);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshBasicMaterial({ color: '#2f8fb8' }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -4; scene.add(floor);

    // 島嶼定義
    const hub = { id: 0, name: '中央島', emoji: '🏝️', code: '', biome: 'hub', cx: 0, cz: 0, R: HUB_R, paths: [] };
    islands.push(hub);
    ISLANDS.forEach((d, k) => {
      const a = Math.PI * .9 + k * 2 * Math.PI / 5;
      islands.push({ ...d, cx: Math.cos(a) * DIST, cz: Math.sin(a) * DIST, R: ISL_R, angle: a, paths: [] });
    });

    // 設施（先決定位置，好讓小路與裝飾避開）
    const hubFac = [
      { id: 'shop', kind: 'shop', name: '方塊商店', icon: '🛍️', bld: 'shop', roof: '#ff8fb1' },
      { id: 'wardrobe', kind: 'wardrobe', name: '換裝屋', icon: '👕', bld: 'wardrobe', roof: '#b197fc' },
      { id: 'map', kind: 'map', name: '任務佈告欄', icon: '🗺️', bld: 'board', roof: '#5fc77a' },
      { id: 'final', kind: 'final', name: FINAL_TASK.name, icon: '🏆', bld: 'castle', roof: '#9775fa' },
    ];
    const gaps = ISLANDS.map((_, k) => Math.PI * .9 + k * 2 * Math.PI / 5 + Math.PI / 5);
    // gaps[4] 朝向鏡頭(南方偏)，留空當出生點
    const gapOrder = [0, 1, 2, 3];
    hubFac.forEach((f, i) => addFacility(f, hub, gaps[gapOrder[i]], f.bld === 'castle' ? 5.2 : 5.0));
    islands.slice(1).forEach(isl => {
      const back = Math.atan2(-isl.cz, -isl.cx); // 指向中央島
      const n = isl.tasks.length;
      isl.tasks.forEach((t, i) => {
        const a = back + (i + 1) * 2 * Math.PI / (n + 1);
        addFacility({ id: t.id, kind: 'task', name: t.name, icon: t.icon, bld: t.bld, roof: ROOFS[i % ROOFS.length], task: t }, isl, a, 6.3);
      });
    });
    // 小路
    islands.forEach(isl => {
      facilities.filter(f => f.island === isl.id).forEach(f => isl.paths.push([f.fx, f.fz]));
      if (isl.id) isl.paths.push([isl.cx - Math.cos(isl.angle) * 12, isl.cz - Math.sin(isl.angle) * 12]);
      else ISLANDS.forEach((_, k) => { const a = Math.PI * .9 + k * 2 * Math.PI / 5; isl.paths.push([Math.cos(a) * 9, Math.sin(a) * 9]); });
    });
    islands.forEach(buildIsland);
    islands.slice(1).forEach(buildBridge);

    // 島中央紀念碑
    islands.forEach(isl => {
      const g = new THREE.Group(); g.position.set(isl.cx, 0, isl.cz); scene.add(g);
      const B = BIOMES[isl.biome];
      if (isl.id === 0) {
        mesh(new THREE.CylinderGeometry(1.5, 1.7, .5, 6), '#e9dcc4', 0, .25, 0, g);
        const w = mesh(new THREE.CylinderGeometry(1.25, 1.25, .1, 6), '#7fd6f5', 0, .52, 0, g);
        mesh(new THREE.CylinderGeometry(.25, .35, 1.2, 6), '#e9dcc4', 0, .9, 0, g);
        animated.push(t => w.position.y = .5 + Math.sin(t * 3) * .02);
      } else {
        mesh(new THREE.CylinderGeometry(.9, 1.05, .6, 6), shade(B.dirt, .15), 0, .3, 0, g);
      }
      const gemM = new THREE.Mesh(new THREE.OctahedronGeometry(.55, 0), new THREE.MeshLambertMaterial({ color: B.gem, emissive: B.gem, emissiveIntensity: .25, flatShading: true }));
      gemM.position.y = 2; gemM.castShadow = true; g.add(gemM);
      animated.push(t => { gemM.rotation.y = t * 1.2; gemM.position.y = 2 + Math.sin(t * 2 + isl.cx) * .15; });
      const lab = makeLabel([isl.id ? `${isl.emoji} ${isl.code} ${isl.name}` : '🏝️ 因數群島・中央島'], { big: true, scale: .9, maxDist: 60 });
      lab.position.y = 3.6; g.add(lab);
      isl.gem = gemM; isl.label = lab;
      colliders.push({ x: isl.cx, z: isl.cz, r: isl.id ? 1.1 : 1.7 });
    });
    islands.forEach(decorate);
    islands.forEach((isl, i) => { const cols = ['#ffffff', '#ffe3a3', '#c9f2ff', '#ffd6e5', '#e6dcff', '#fff']; addCritter(isl, cols[i]); if (isl.id) addCritter(isl, cols[(i + 2) % 6]); });
    // 港口小船
    const harbor = islands[5];
    const boat = new THREE.Group(); scene.add(boat);
    cube(boat, 1.4, .5, 3, '#b8855a', 0, 0, 0); cube(boat, 1.0, .1, 2.6, '#e9c9a0', 0, .26, 0);
    cube(boat, .08, 2.2, .08, '#8b5e3c', 0, 1.3, 0); const sail = cube(boat, .05, 1.4, 1.1, '#fff', 0, 1.5, .3);
    const bx0 = harbor.cx + Math.cos(harbor.angle) * 13.5, bz0 = harbor.cz + Math.sin(harbor.angle) * 13.5;
    animated.push(t => { boat.position.set(bx0 + Math.sin(t * .3) * 1.2, -.55 + Math.sin(t * 1.6) * .08, bz0); boat.rotation.z = Math.sin(t * 1.3) * .05; boat.rotation.y = harbor.angle; });
    addClouds();

    // 玩家
    player = new THREE.Group(); scene.add(player);
    player.position.set(0, 0, 4.5);
    refreshPlayer();
    clickMarker = new THREE.Mesh(new THREE.RingGeometry(.3, .45, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
    clickMarker.rotation.x = -Math.PI / 2; scene.add(clickMarker);

    bindInput(canvas);
    onResize(); addEventListener('resize', onResize);
    refreshProgress(true);
    camTarget.copy(player.position);
    requestAnimationFrame(loop);
  }

  function refreshPlayer() {
    if (!player) return;
    if (playerAv) player.remove(playerAv);
    playerAv = buildAvatar(G.avatar || DEFAULT_AVATAR);
    playerAv.scale.setScalar(1.12);
    player.add(playerAv);
    if (nameSprite) player.remove(nameSprite);
    nameSprite = makeLabel([(G.avatar && G.avatar.name) || '玩家'], { scale: .5, maxDist: 99, bg: 'rgba(255,255,255,.9)' });
    nameSprite.position.y = 2.75; player.add(nameSprite);
  }

  /* ---------- 進度 / 鎖 ---------- */
  function islandDone(id) { const isl = ISLANDS.find(i => i.id === id); return isl.tasks.filter(t => (G.progress[t.id] || {}).stars > 0).length; }
  function isIslandOpen(id) {
    if (id <= 1 || G.teacher) return true;
    const prev = ISLANDS[id - 2];
    return islandDone(prev.id) >= unlockNeed(prev) && isIslandOpen(id - 1);
  }
  function refreshProgress(first) {
    bridges.forEach(b => {
      const open = isIslandOpen(b.isl.id);
      if (b.locked && open && !first) { toast(`🌉 ${b.isl.emoji} ${b.isl.name} 開放了！`, 'gold'); Sfx.play('unlock'); confetti(60); }
      b.locked = !open; b.gate.visible = !open;
    });
    facilities.forEach(f => {
      let lines;
      if (f.kind === 'task') {
        const p = G.progress[f.id];
        const open = isIslandOpen(f.island);
        lines = [`${f.icon} ${f.name}`, !open ? '🔒' : p && p.stars ? '⭐'.repeat(p.stars) + '☆'.repeat(3 - p.stars) : '❗ 新任務'];
      } else if (f.kind === 'final') {
        const done = totalCleared();
        const p = G.progress.final;
        lines = [`${f.icon} ${f.name}`, p && p.stars ? '⭐'.repeat(p.stars) + '☆'.repeat(3 - p.stars) : done >= FINAL_NEED ? '❗ 已開放' : `🔒 完成 ${done}/${FINAL_NEED} 個任務`];
      } else lines = [`${f.icon} ${f.name}`];
      relabel(f.label, lines);
    });
  }

  /* ---------- 輸入 ---------- */
  function bindInput(canvas) {
    let down = null, moved = false;
    canvas.addEventListener('pointerdown', e => { Sfx.init(); down = { x: e.clientX, y: e.clientY }; moved = false; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - down.x;
      if (Math.abs(dx) > 6 || Math.abs(e.clientY - down.y) > 6) moved = true;
      if (moved) { yaw -= (e.movementX || 0) * .006; }
    });
    canvas.addEventListener('pointerup', e => {
      if (down && !moved) clickAt(e.clientX, e.clientY);
      down = null;
    });
    canvas.addEventListener('wheel', e => { dist = clamp(dist + Math.sign(e.deltaY) * 1.5, 9, 32); e.preventDefault(); }, { passive: false });
    addEventListener('keydown', e => {
      if (Modal.isOpen()) { if (e.code === 'Escape') { const top = Modal.stack[Modal.stack.length - 1]; top && top.head.querySelector('.modal-close') && top.close(); } return; }
      if (e.target.tagName === 'INPUT') return;
      keys[e.code] = true;
      if (['KeyE', 'Enter', 'Space'].includes(e.code) && nearFac) { e.preventDefault(); interact(nearFac); }
      if (e.code === 'KeyQ') yaw += .3;
    });
    addEventListener('keyup', e => { keys[e.code] = false; });
    addEventListener('blur', () => keys = {});
  }
  function clickAt(cx, cy) {
    if (Modal.isOpen()) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector2((cx - rect.left) / rect.width * 2 - 1, -(cy - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(v, camera);
    const hits = raycaster.intersectObjects(facilities.map(f => f.g), true).filter(h => !h.object.isSprite || true);
    if (hits.length) {
      const fac = hits[0].object.userData.fac;
      if (fac) {
        if (Math.hypot(player.position.x - fac.fx, player.position.z - fac.fz) < 2.4) { interact(fac); return; }
        target = new THREE.Vector3(fac.fx, 0, fac.fz); targetFac = fac; showMarker(target); return;
      }
    }
    const p = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, p)) { target = p; targetFac = null; showMarker(p); }
  }
  function showMarker(p) { clickMarker.position.set(p.x, .06, p.z); clickMarker.material.opacity = .9; clickMarker.scale.setScalar(1.4); }

  function interact(fac) {
    keys = {}; target = null; targetFac = null;
    if (fac.kind === 'task' && !isIslandOpen(fac.island)) { toast('🔒 這座島還沒開放喔'); return; }
    onInteract(fac);
  }

  /* ---------- 走路判定 ---------- */
  function walkable(x, z) {
    for (const isl of islands) {
      if (Math.abs(x - isl.cx) > 13 || Math.abs(z - isl.cz) > 13) continue;
      const [q, r] = toAxial(x - isl.cx, z - isl.cz);
      if (hexDist(q, r) <= isl.R) return true;
    }
    for (const b of bridges) {
      const s = x * b.dx + z * b.dz, perp = Math.abs(-x * b.dz + z * b.dx);
      const end = b.locked ? b.gs - .5 : b.s1;
      if (s >= b.s0 && s <= end && perp <= 1.0) return true;
    }
    return false;
  }
  const blocked = (x, z) => colliders.some(c => (x - c.x) ** 2 + (z - c.z) ** 2 < (c.r + .32) ** 2);
  const ok = (x, z) => walkable(x, z) && !blocked(x, z);
  function islandAt(x, z) {
    for (const isl of islands) { const [q, r] = toAxial(x - isl.cx, z - isl.cz); if (hexDist(q, r) <= isl.R) return isl; }
    return null;
  }

  /* ---------- 迴圈 ---------- */
  let last = performance.now(), frame = 0, lockedNoticeT = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const t = now / 1000;
    frame++;
    if (Modal.isOpen() && frame % 3) return;

    // 移動
    let mx = 0, mz = 0;
    if (!Modal.isOpen()) {
      const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
      const s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
      if (f || s) { target = null; targetFac = null; mx = -Math.sin(yaw) * f + Math.cos(yaw) * s; mz = -Math.cos(yaw) * f - Math.sin(yaw) * s; }
      else if (target) {
        const dx = target.x - player.position.x, dz = target.z - player.position.z, d = Math.hypot(dx, dz);
        if (d < .2) { const tf = targetFac; target = null; targetFac = null; if (tf) { player.rotation.y = Math.atan2(tf.x - player.position.x, tf.z - player.position.z); interact(tf); } }
        else { mx = dx; mz = dz; }
      }
    }
    let walking = 0;
    const len = Math.hypot(mx, mz);
    if (len > 0) {
      mx /= len; mz /= len;
      const sp = 6.2 * dt, px = player.position.x, pz = player.position.z;
      const nx = px + mx * sp, nz = pz + mz * sp;
      let moved = true;
      if (ok(nx, nz)) player.position.set(nx, 0, nz);
      else if (ok(nx, pz) && Math.abs(mx) > .2) player.position.x = nx;
      else if (ok(px, nz) && Math.abs(mz) > .2) player.position.z = nz;
      else {
        moved = false;
        if (target && !targetFac) target = null;
        // 靠近鎖住的柵門時提示
        const b = bridges.find(b => b.locked && Math.hypot(b.dx * b.gs - px, b.dz * b.gs - pz) < 3);
        if (b && t - lockedNoticeT > 3) { lockedNoticeT = t; toast(`🔒 ${b.isl.name}還沒開放：先在上一座島完成 ${unlockNeed(ISLANDS[b.isl.id - 2])} 個任務`); }
      }
      if (moved) {
        walking = 1;
        const want = Math.atan2(mx, mz);
        let diff = want - player.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        player.rotation.y += diff * Math.min(1, dt * 12);
        if (t - lastStep > .28) { lastStep = t; Sfx.play('step'); }
      }
    }
    // 站在地面上的高度
    const ci = islandAt(player.position.x, player.position.z);
    let gy = 0;
    if (ci) { const tl = tileAt(ci, player.position.x, player.position.z); if (tl) gy = Math.max(0, tl.top); }
    player.position.y += (gy - player.position.y) * .3;
    if (playerAv) animateAvatar(playerAv, t, walking, { cheer: t < cheerUntil });

    // 島嶼名稱
    if (ci !== currentIsland) {
      if (ci && currentIsland !== undefined) showBanner(ci);
      currentIsland = ci;
    }

    // 附近設施
    let best = null, bd = 1e9;
    facilities.forEach(f => {
      const d = Math.min(Math.hypot(player.position.x - f.fx, player.position.z - f.fz), Math.hypot(player.position.x - f.x, player.position.z - f.z) - f.r - 1);
      if (d < 2.3 && d < bd) { bd = d; best = f; }
    });
    if (best !== nearFac) { nearFac = best; updatePrompt(); }

    // 動畫
    animated.forEach(fn => fn(t, dt));
    updateCritters(t, dt);
    if (clickMarker.material.opacity > 0) { clickMarker.material.opacity -= dt * 1.2; clickMarker.scale.multiplyScalar(1 - dt * .8); }
    const pa = water.geometry.attributes.position, arr = pa.array;
    for (let i = 0; i < arr.length; i += 3) { const x = waterPos0[i], z = waterPos0[i + 2]; arr[i + 1] = Math.sin(x * .18 + t * 1.2) * .13 + Math.cos(z * .15 + t * .9) * .11; }
    pa.needsUpdate = true;

    // 標籤距離
    labels.forEach(l => { const wp = l.getWorldPosition(_v); l.visible = l.parent && (l.parent.visible !== false) && wp.distanceTo(player.position) < l.userData.maxDist; });

    // 鏡頭
    camTarget.lerp(player.position, Math.min(1, dt * 5));
    const hd = dist * Math.cos(pitch);
    camera.position.set(camTarget.x + Math.sin(yaw) * hd, camTarget.y + dist * Math.sin(pitch) * .82, camTarget.z + Math.cos(yaw) * hd);
    camera.lookAt(camTarget.x, camTarget.y + 1, camTarget.z);
    sun.position.set(player.position.x + 18, 40, player.position.z + 14);
    sun.target.position.copy(player.position);
    renderer.render(scene, camera);
  }
  const _v = new THREE.Vector3();

  function updatePrompt() {
    const el = $('#prompt');
    if (!nearFac || Modal.isOpen()) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    el.innerHTML = '';
    el.append(h('span', { class: 'key' }, 'E'), `${nearFac.icon} ${nearFac.kind === 'task' ? '開始任務：' : ''}${nearFac.name}`);
    el.onclick = () => interact(nearFac);
  }
  let bannerTimer;
  function showBanner(isl) {
    const b = $('#placeBanner');
    b.textContent = isl.id ? `${isl.emoji} ${isl.code} ${isl.name}` : '🏝️ 中央島';
    b.classList.add('show'); clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => b.classList.remove('show'), 2600);
  }
  function onResize() {
    const w = innerWidth, hh = innerHeight;
    renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix();
    if (w < 700) dist = Math.max(dist, 20);
  }

  function teleport(facId) {
    const f = facilities.find(f => f.id === facId); if (!f) return;
    player.position.set(f.fx, 0, f.fz);
    player.rotation.y = Math.atan2(f.x - f.fx, f.z - f.fz);
    yaw = Math.atan2(f.fx - f.x, f.fz - f.z);
    camTarget.copy(player.position);
    target = null; targetFac = null;
  }
  function cheer() { cheerUntil = performance.now() / 1000 + 1.6; }

  return {
    init, refreshPlayer, refreshProgress, teleport, cheer, isIslandOpen, islandDone,
    rotate: d => yaw += d, zoom: d => dist = clamp(dist + d, 9, 32), updatePrompt,
    get facilities() { return facilities; }
  };
})();
