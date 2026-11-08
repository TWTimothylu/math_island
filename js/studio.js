/* ============ 角色工作室：建立角色 / 衣櫥（換裝屋） / 方塊商店 ============ */

/* ---- 共用：3D 預覽台 ---- */
function makePreview(cfg, theme = 'meadow') {
  const TH = {
    meadow: { top: '#8fd46a', base: '#b98a5e', tip: '← 拖曳旋轉角色 →' },
    closet: { top: '#d9c8ff', base: '#8b6fd6', tip: '🪞 魔鏡魔鏡・拖曳旋轉' },
    shop: { top: '#ffd34d', base: '#c98d55', tip: '🛍️ 試衣台・拖曳旋轉' },
  }[theme];
  const box = h('div', { class: 'studio-preview theme-' + theme });
  const cv = h('canvas');
  box.append(cv, h('div', { class: 'rot-tip' }, TH.tip));
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.shadowMap.enabled = true;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(32, 1, .1, 50);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9d9a0, .75));
  const dl = new THREE.DirectionalLight(0xffffff, .55); dl.position.set(3, 6, 4); dl.castShadow = true; scene.add(dl);
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, .3, 6), MF(TH.top));
  plat.position.y = -.15; plat.receiveShadow = true; scene.add(plat);
  const plat2 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.2, .4, 6), MF(TH.base)); plat2.position.y = -.5; scene.add(plat2);
  const spin = new THREE.Group(); scene.add(spin);
  let swayT = 0, av = null, rotY = 0, dragging = false, lastX = 0, cheerT = 0, alive = true;
  const rebuild = () => { if (av) spin.remove(av); av = buildAvatar(cfg); spin.add(av); };
  rebuild();
  cv.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (dragging) { rotY += (e.clientX - lastX) * .012; lastX = e.clientX; } });
  cv.addEventListener('pointerup', () => dragging = false);
  const t0 = performance.now();
  function loop() {
    if (!alive) return;
    const w = box.clientWidth, hh = box.clientHeight;
    if (cv.width !== Math.floor(w * renderer.getPixelRatio()) || cv.height !== Math.floor(hh * renderer.getPixelRatio())) {
      renderer.setSize(w, hh, false); cam.aspect = w / Math.max(1, hh); cam.updateProjectionMatrix();
      const dz = cam.aspect < .75 ? 6.2 * .75 / cam.aspect : 6.2;
      cam.position.set(0, 1.9, dz); cam.lookAt(0, 1.05, 0);
    }
    const t = (performance.now() - t0) / 1000;
    if (!dragging) swayT += 1 / 60;
    spin.rotation.y = rotY + Math.sin(swayT * .7) * .45;
    if (av) animateAvatar(av, t, 0, { cheer: cheerT > t });
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return {
    el: box, rebuild,
    cheer: () => { cheerT = (performance.now() - t0) / 1000 + .8; },
    showBack: () => { rotY = Math.PI - Math.sin(swayT * .7) * .45; },
    showFront: () => { rotY = 0; },
    dispose: () => { alive = false; renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); },
  };
}

/* ---- 商品目錄（商店販售的所有東西） ---- */
const COLOR_NAMES = {
  '#c0392b': '火焰紅', '#ff8fb1': '草莓粉', '#5bb8f0': '天空藍', '#7cd6a8': '薄荷綠', '#a78bfa': '葡萄紫', '#e8e8f0': '星光銀',
  '#ffb703': '閃亮金', '#2ec4b6': '湖水綠', '#e5383b': '正紅色', '#1b1b2f': '午夜黑',
};
const SHOP_CATS = [
  { id: 'all', name: '全部', ico: '✨' }, { id: 'hair', name: '髮型', ico: '💇' }, { id: 'hc', name: '染髮', ico: '🎨' },
  { id: 'outfit', name: '衣服', ico: '👕' }, { id: 'cc', name: '布料', ico: '🧵' }, { id: 'hat', name: '帽子', ico: '🎩' },
  { id: 'face', name: '眼鏡', ico: '👓' }, { id: 'back', name: '背飾', ico: '🎒' },
];
function shopCatalog() {
  const L = [];
  HAIR_STYLES.filter(i => i.price > 0).forEach(i => L.push({ cat: 'hair', key: 'hair:' + i.id, field: 'hair', val: i.id, name: i.name, ico: i.ico, price: i.price, view: 'head' }));
  HAIR_COLORS.filter(i => i.price > 0).forEach(i => L.push({ cat: 'hc', key: 'hc:' + i.c, field: 'hairColor', val: i.c, name: '染髮・' + (COLOR_NAMES[i.c] || '特別色'), color: i.c, price: i.price, view: 'head' }));
  OUTFITS.filter(i => i.price > 0).forEach(i => L.push({ cat: 'outfit', key: 'outfit:' + i.id, field: 'outfit', val: i.id, name: i.name, ico: i.ico, price: i.price, view: 'body' }));
  CLOTH_COLORS.filter(i => i.price > 0).forEach(i => L.push({ cat: 'cc', key: 'cc:' + i.c, field: 'clothColor', val: i.c, name: '布料・' + (COLOR_NAMES[i.c] || '特別色'), color: i.c, price: i.price, view: 'body' }));
  HATS.filter(i => i.price !== 0).forEach(i => L.push({ cat: 'hat', key: 'hat:' + i.id, field: 'hat', val: i.id, name: i.name, ico: i.ico, price: i.price, note: i.note, view: 'head' }));
  FACE_ACC.filter(i => i.price > 0).forEach(i => L.push({ cat: 'face', key: 'face:' + i.id, field: 'face', val: i.id, name: i.name, ico: i.ico, price: i.price, view: 'head' }));
  BACK_ACC.filter(i => i.price > 0).forEach(i => L.push({ cat: 'back', key: 'back:' + i.id, field: 'back', val: i.id, name: i.name, ico: i.ico, price: i.price, view: 'back' }));
  return L;
}
function rarityOf(it) {
  if (it.price < 0) return { id: 'myth', name: '非賣品' };
  if (it.price >= 200) return { id: 'legend', name: '傳說' };
  if (it.price >= 100) return { id: 'rare', name: '稀有' };
  return { id: 'common', name: '普通' };
}
function collectionCount() {
  const L = shopCatalog().filter(i => i.price > 0);
  return { have: L.filter(i => G.owned.includes(i.key)).length, total: L.length };
}
/* 今日特價：依日期決定，打 7 折 */
function dailyDeal() {
  const d = new Date(), seed = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
  const L = shopCatalog().filter(i => i.price > 0);
  const it = L[(seed * 7919) % L.length];
  return { key: it.key, price: Math.round(it.price * .7 / 5) * 5 };
}

/* ---- 商品縮圖：用離屏 renderer 把「穿上這件的你」拍成照片 ---- */
function renderThumbs(baseCfg, items, onThumb) {
  const SIZE = 180;
  const cv = document.createElement('canvas'); cv.width = cv.height = SIZE;
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setSize(SIZE, SIZE, false);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9c8a0, .8));
  const dl = new THREE.DirectionalLight(0xffffff, .5); dl.position.set(3, 5, 6); scene.add(dl);
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 50);
  let i = 0, stopped = false;
  function step() {
    if (stopped) return;
    for (let n = 0; n < 3 && i < items.length; n++, i++) {
      const it = items[i];
      const c = JSON.parse(JSON.stringify(baseCfg)); c[it.field] = it.val;
      const av = buildAvatar(c); scene.add(av);
      animateAvatar(av, 0, 0, {});
      if (it.view === 'head') { av.rotation.y = .35; cam.position.set(0, 1.95, 3.3); cam.lookAt(0, 1.7, 0); }
      else if (it.view === 'back') { av.rotation.y = Math.PI + .6; cam.position.set(0, 1.5, 5.0); cam.lookAt(0, 1.05, 0); }
      else { av.rotation.y = .3; cam.position.set(0, 1.4, 5.0); cam.lookAt(0, 1.05, 0); }
      r.render(scene, cam);
      onThumb(it.key, cv.toDataURL('image/png'));
      scene.remove(av);
    }
    if (i < items.length) requestAnimationFrame(step); else stop();
  }
  function stop() { if (stopped) return; stopped = true; r.dispose(); r.forceContextLoss && r.forceContextLoss(); }
  requestAnimationFrame(step);
  return stop;
}

/* =========================================================
   方塊商店
   ========================================================= */
function openShop() {
  const cfg = JSON.parse(JSON.stringify(G.avatar || DEFAULT_AVATAR));
  const original = JSON.parse(JSON.stringify(cfg));
  const catalog = shopCatalog();
  const deal = dailyDeal();
  const thumbs = {};
  let cat = 'all', hideOwned = false;
  const priceOf = it => it.key === deal.key ? deal.price : it.price;
  const owned = it => G.owned.includes(it.key);

  const pv = makePreview(cfg, 'shop');

  /* 店長 */
  const speech = h('div', { class: 'keeper-say' });
  const say = (txt) => { speech.textContent = txt; speech.classList.remove('pop'); void speech.offsetWidth; speech.classList.add('pop'); };
  const keeper = h('div', { class: 'keeper' }, h('div', { class: 'keeper-face', html: mascotSVG() }), h('div', null, h('div', { class: 'keeper-name' }, '店長 方方'), speech));

  const coinPill = h('span', { class: 'pill coin big-coin' }, '🪙 ', h('b', null, G.coins));
  const collPill = h('span', { class: 'pill' });
  const tryInfo = h('span', { class: 'try-info' });
  function refreshFoot() {
    coinPill.querySelector('b').textContent = G.coins;
    const cc = collectionCount(); collPill.textContent = `📦 收藏 ${cc.have} / ${cc.total}`;
    const trying = catalog.filter(it => cfg[it.field] === it.val && cfg[it.field] !== original[it.field] && !owned(it));
    tryInfo.textContent = trying.length ? `👗 試穿中 ${trying.length} 件（沒買的離開時會脫下）` : '';
  }

  /* 今日特價大看板 */
  const dealIt = catalog.find(i => i.key === deal.key);
  const dealImg = h('img', { class: 'deal-img', alt: '' });
  const dealBox = h('div', { class: 'deal-banner', onclick: () => tryOn(dealIt) },
    h('div', { class: 'deal-tag' }, '今日特價'),
    dealImg,
    h('div', { class: 'deal-text' }, h('b', null, dealIt.name), h('div', null, h('s', null, '🪙' + dealIt.price), ' → ', h('span', { class: 'deal-price' }, '🪙' + deal.price), ' 只有今天！')));

  const chips = h('div', { class: 'shop-chips' });
  const grid = h('div', { class: 'shop-grid' });
  const hideBtn = h('button', { class: 'tab', onclick: () => { hideOwned = !hideOwned; Sfx.play('click'); renderAll(); } });

  function renderChips() {
    chips.innerHTML = '';
    SHOP_CATS.forEach(c => {
      const n = c.id === 'all' ? catalog.length : catalog.filter(i => i.cat === c.id).length;
      if (!n) return;
      chips.appendChild(h('button', { class: 'chip' + (cat === c.id ? ' on' : ''), onclick: () => { cat = c.id; Sfx.play('click'); renderAll(); } }, c.ico + ' ' + c.name));
    });
    hideBtn.className = 'tab' + (hideOwned ? ' on' : '');
    hideBtn.textContent = hideOwned ? '✅ 只看還沒買的' : '只看還沒買的';
  }

  function tryOn(it) {
    if (it.price < 0 && !owned(it)) { say(`這是傳說中的「${it.name}」！${it.note || ''}，商店買不到喔～`); Sfx.play('bad'); return; }
    const wearing = cfg[it.field] === it.val;
    if (!wearing) cfg[it.field] = it.val;          // 試穿
    else if (original[it.field] !== it.val) cfg[it.field] = original[it.field]; // 再點一次＝脫下
    pv.rebuild(); Sfx.play('pop');
    if (it.view === 'back' && !wearing) pv.showBack(); else pv.showFront();
    if (!wearing) say(owned(it) ? `你已經有「${it.name}」了，直接穿上！` : pick([`「${it.name}」超適合你的！`, `哇～穿上「${it.name}」好有型！`, `「${it.name}」是人氣商品喔！`]));
    else say('換回原本的了～還想試試別的嗎？');
    renderGrid(); refreshFoot();
  }
  function buy(it, card) {
    const p = priceOf(it);
    if (G.coins < p) {
      say(`還差 ${p - G.coins} 枚因數幣…去島上完成任務就能賺到喔！`);
      Sfx.play('bad'); shakeEl(card); return;
    }
    G.coins -= p; G.owned.push(it.key); saveGame(); updateHUD();
    cfg[it.field] = it.val; original[it.field] = it.val; // 買了就穿上
    pv.rebuild(); pv.cheer(); Sfx.play('coin');
    say(pick([`謝謝惠顧！「${it.name}」是你的了 🎉`, `成交！穿起來真好看！`, `好眼光！「${it.name}」包起來～`]));
    toast(`🎉 買到了「${it.name}」！`, 'gold');
    card.classList.add('sold-anim');
    setTimeout(() => { renderGrid(); refreshFoot(); }, 450);
    refreshFoot();
  }

  function card(it) {
    const rr = rarityOf(it), own = owned(it), p = priceOf(it), wearing = cfg[it.field] === it.val, isDeal = it.key === deal.key;
    const img = h('div', { class: 'thumb' });
    if (thumbs[it.key]) img.appendChild(h('img', { src: thumbs[it.key], alt: it.name }));
    else img.appendChild(h('span', { class: 'thumb-ico' }, it.ico || ''));
    if (it.color) img.appendChild(h('span', { class: 'color-dot', style: { background: it.color } }));
    const el = h('div', { class: `shop-card r-${rr.id}${wearing ? ' wearing' : ''}${own ? ' owned' : ''}`, 'data-key': it.key },
      h('span', { class: 'rarity' }, rr.name),
      isDeal && !own ? h('span', { class: 'deal-ribbon' }, '特價') : null,
      wearing ? h('span', { class: 'wear-badge' + (own ? ' on' : '') }, own ? '穿著中' : '試穿中') : null,
      img,
      h('div', { class: 'card-name' }, it.name));
    let btn;
    if (own) btn = h('div', { class: 'owned-tag' }, '✓ 已擁有');
    else if (it.price < 0) btn = h('div', { class: 'owned-tag myth' }, '🏆 期末試煉獎勵');
    else btn = h('button', { class: 'btn small yellow buy-btn' + (G.coins < p ? ' poor' : ''), onclick: e => { e.stopPropagation(); buy(it, el); } },
      isDeal ? h('span', null, h('s', null, it.price), ' 🪙' + p) : '🪙 ' + p);
    el.appendChild(btn);
    el.addEventListener('click', () => tryOn(it));
    return el;
  }
  function renderGrid() {
    grid.innerHTML = '';
    let list = catalog.filter(i => cat === 'all' || i.cat === cat);
    if (hideOwned) list = list.filter(i => !owned(i));
    list.sort((a, b) => (owned(a) - owned(b)) || ((a.price < 0) - (b.price < 0)) || a.price - b.price);
    if (!list.length) grid.appendChild(h('div', { class: 'empty-shelf' }, '🎉 這一區你全部都買齊了！'));
    list.forEach(it => grid.appendChild(card(it)));
  }
  function renderAll() { renderChips(); renderGrid(); refreshFoot(); }

  const counter = h('div', { class: 'shop-counter' }, keeper, dealBox);
  const side = h('div', { class: 'shop-side' }, counter, h('div', { class: 'shop-toolbar' }, chips, hideBtn), grid);
  const body = h('div', { class: 'studio shop-studio' }, pv.el, side);
  const leaveBtn = h('button', { class: 'btn big', onclick: finish }, '👋 離開商店');
  const foot = h('div', { class: 'studio-foot shop-foot' }, h('div', { class: 'row' }, coinPill, collPill, tryInfo), leaveBtn);

  renderAll();
  say(G.coins >= 60 ? `歡迎光臨！你有 ${G.coins} 枚因數幣，點商品就能先試穿喔！` : '歡迎光臨！點商品可以免費試穿，喜歡再買～');

  let stopThumbs = null;
  const rec = Modal.open({
    title: '🛍️ 方塊商店', sub: '點商品免費試穿・喜歡再用因數幣買下來', body, foot, width: 'min(1120px,96vw)',
    onClose: () => { pv.dispose(); stopThumbs && stopThumbs(); }
  });
  rec.m.classList.add('shop-modal');
  rec.back.classList.add('shop-back');
  stopThumbs = renderThumbs(original, catalog, (key, url) => {
    thumbs[key] = url;
    if (key === deal.key) dealImg.src = url;
    const c = grid.querySelector(`[data-key="${CSS.escape(key)}"] .thumb`);
    if (c) { const ico = c.querySelector('.thumb-ico'); if (ico) ico.replaceWith(h('img', { src: url, alt: '' })); }
  });

  function finish() {
    stripUnowned(cfg, original);
    G.avatar = cfg; saveGame(); updateHUD();
    if (typeof World !== 'undefined') World.refreshPlayer();
    rec.close();
  }
}

/* 把沒擁有的試穿品換回原本的 */
function stripUnowned(c, original) {
  const chk = (prefix, list, field) => {
    const it = list.find(x => (x.id ?? x.c ?? x) === c[field]); const price = it ? (it.price ?? 0) : 0;
    if (!(price === 0 || G.owned.includes(prefix + ':' + c[field]))) c[field] = original[field];
  };
  chk('hair', HAIR_STYLES, 'hair'); chk('hc', HAIR_COLORS, 'hairColor'); chk('outfit', OUTFITS, 'outfit'); chk('cc', CLOTH_COLORS, 'clothColor');
  chk('hat', HATS, 'hat'); chk('face', FACE_ACC, 'face'); chk('back', BACK_ACC, 'back');
}

/* =========================================================
   建立角色 / 換裝屋（只顯示自己擁有的東西）
   ========================================================= */
function openStudio({ mode = 'create', onDone } = {}) {
  if (mode === 'shop') return openShop();
  const cfg = JSON.parse(JSON.stringify(G.avatar || DEFAULT_AVATAR));
  const original = JSON.parse(JSON.stringify(cfg));
  let tab = 'look';
  const isCloset = mode === 'wardrobe';
  const pv = makePreview(cfg, isCloset ? 'closet' : 'meadow');
  const rebuild = pv.rebuild;
  const has = (prefix, it) => { const id = typeof it === 'string' ? it : (it.id ?? it.c); const price = typeof it === 'string' ? 0 : (it.price ?? 0); return price === 0 || G.owned.includes(prefix + ':' + id); };

  const side = h('div');
  let nameInput = null;
  if (mode === 'create') {
    nameInput = h('input', { maxlength: 10, placeholder: '幫你的角色取名字', value: cfg.name || '' });
    nameInput.addEventListener('input', () => { cfg.name = nameInput.value.trim(); });
    side.appendChild(h('div', { class: 'studio-name' }, h('span', { style: { fontWeight: 900 } }, '名字'), nameInput,
      h('button', { class: 'btn small yellow', onclick: () => { nameInput.value = cfg.name = pick(['小因', '阿倍', '質質', '公公因', '數數', '小方', '米米', '樂樂', '小星']) + pick(['', '寶', '醬', '仔']); } }, '🎲 隨機')));
  }

  /* 換裝屋專屬：搭配欄 + 隨機搭配 + 收藏進度 */
  if (isCloset) {
    if (!Array.isArray(G.outfits)) G.outfits = [null, null, null];
    const slots = h('div', { class: 'outfit-slots' });
    const OUTFIT_FIELDS = ['hair', 'hairColor', 'outfit', 'clothColor', 'pantsColor', 'hat', 'face', 'back'];
    const renderSlots = () => {
      slots.innerHTML = '';
      G.outfits.forEach((o, i) => {
        slots.appendChild(h('div', { class: 'ofit' + (o ? ' full' : '') },
          h('div', { class: 'ofit-name' }, `搭配 ${i + 1}`),
          h('div', { class: 'ofit-ico' }, o ? (OUTFITS.find(x => x.id === o.outfit) || {}).ico + ((HATS.find(x => x.id === o.hat) || {}).ico || '') : '空'),
          h('div', { class: 'row', style: { gap: '4px', justifyContent: 'center' } },
            o ? h('button', { class: 'btn tiny blue', onclick: () => { Object.assign(cfg, o); rebuild(); pv.cheer(); renderContent(); Sfx.play('pop'); toast(`👕 換上搭配 ${i + 1}`); } }, '穿上') : null,
            h('button', { class: 'btn tiny ghost', onclick: () => { const s = {}; OUTFIT_FIELDS.forEach(f => s[f] = cfg[f]); G.outfits[i] = s; saveGame(); renderSlots(); Sfx.play('coin'); toast(`💾 已存成搭配 ${i + 1}`); } }, o ? '覆蓋' : '存入'))));
      });
    };
    renderSlots();
    const randomFit = () => {
      const own = (list, prefix) => list.filter(it => has(prefix, it));
      cfg.hair = pick(own(HAIR_STYLES, 'hair')).id; cfg.hairColor = pick(own(HAIR_COLORS, 'hc')).c;
      cfg.outfit = pick(own(OUTFITS, 'outfit')).id; cfg.clothColor = pick(own(CLOTH_COLORS, 'cc')).c; cfg.pantsColor = pick(PANTS_COLORS);
      cfg.hat = pick(own(HATS, 'hat')).id; cfg.face = pick(own(FACE_ACC, 'face')).id; cfg.back = pick(own(BACK_ACC, 'back')).id;
      rebuild(); pv.cheer(); renderContent(); Sfx.play('pop');
    };
    const cc = collectionCount();
    side.appendChild(h('div', { class: 'closet-head' },
      h('div', { class: 'closet-top' },
        h('div', null, h('b', null, '🪞 我的衣櫃'), h('div', { class: 'closet-coll' }, `📦 收藏 ${cc.have} / ${cc.total}`, h('div', { class: 'coll-bar' }, h('i', { style: { width: (cc.have / cc.total * 100) + '%' } })))),
        h('button', { class: 'btn small yellow', onclick: randomFit }, '🎲 隨機搭配')),
      slots));
  }

  const tabsEl = h('div', { class: 'tabs' });
  const content = h('div');
  side.append(tabsEl, content);
  const TABS = [['look', '🧑 外表'], ['face', '✏️ 五官'], ['wear', '👕 服裝'], ['acc', '🎀 配件']];
  function renderTabs() {
    tabsEl.innerHTML = '';
    TABS.forEach(([k, n]) => tabsEl.appendChild(h('button', { class: 'tab' + (tab === k ? ' on' : ''), onclick: () => { tab = k; Sfx.play('click'); renderTabs(); renderContent(); } }, n)));
  }

  /* 只列出擁有的；最後放一格「去商店」提示 */
  let missing = 0;
  function shopHint(n) {
    if (!n) return null;
    if (mode === 'create') return h('div', { class: 'opt more' }, h('span', { class: 'ico' }, '🛍️'), `還有 ${n} 款`, h('small', null, '商店解鎖'));
    return h('div', { class: 'opt more', onclick: () => { finish(); openShop(); } }, h('span', { class: 'ico' }, '🛍️'), `還有 ${n} 款`, h('small', null, '去商店看看'));
  }
  function optGrid(list, prefix, cur, setter) {
    const g = h('div', { class: 'opt-grid' });
    const mine = list.filter(it => has(prefix, it));
    mine.forEach(it => g.appendChild(h('div', {
      class: 'opt' + (cur === it.id ? ' on' : '') + (it.price ? ' bought' : ''),
      onclick: () => { setter(it.id); rebuild(); renderContent(); Sfx.play('pop'); if (prefix === 'back' && it.id !== 'none') pv.showBack(); else pv.showFront(); }
    }, h('span', { class: 'ico' }, it.ico || '•'), it.name, it.price ? h('span', { class: 'star-tag' }, '★') : null)));
    const n = list.length - mine.length - (list.some(x => x.price < 0 && !has(prefix, x)) ? 1 : 0);
    const hint = shopHint(n); if (hint) g.appendChild(hint);
    return g;
  }
  function swatches(list, prefix, cur, setter) {
    const g = h('div', { class: 'swatches' });
    const mine = list.filter(it => has(prefix, it));
    mine.forEach(it => {
      const c = typeof it === 'string' ? it : it.c;
      g.appendChild(h('div', { class: 'sw' + (cur === c ? ' on' : ''), style: { background: c }, onclick: () => { setter(c); rebuild(); renderContent(); Sfx.play('pop'); } }));
    });
    const n = list.length - mine.length;
    if (n) g.appendChild(h('div', { class: 'sw more', title: '商店有更多顏色', onclick: () => { if (mode !== 'create') { finish(); openShop(); } } }, '+' + n));
    return g;
  }
  function textOpts(list, cur, setter) {
    const g = h('div', { class: 'row', style: { gap: '6px' } });
    list.forEach(it => g.appendChild(h('button', { class: 'tab' + (cur === it.id ? ' on' : ''), onclick: () => { setter(it.id); rebuild(); renderContent(); Sfx.play('click'); } }, it.name)));
    return g;
  }

  function renderContent() {
    content.innerHTML = '';
    const T = t => h('div', { class: 'sect-title' }, t);
    if (tab === 'look') {
      content.append(T('膚色'), swatches(SKINS, 'skin', cfg.skin, v => cfg.skin = v),
        T('髮型'), optGrid(HAIR_STYLES, 'hair', cfg.hair, v => cfg.hair = v),
        T('髮色'), swatches(HAIR_COLORS, 'hc', cfg.hairColor, v => cfg.hairColor = v));
    }
    if (tab === 'face') {
      content.append(T('👀 眼睛'), textOpts(EYES, cfg.eyes, v => cfg.eyes = v),
        T('〰️ 眉毛'), textOpts(BROWS, cfg.brows, v => cfg.brows = v),
        T('👄 嘴巴'), textOpts(MOUTHS, cfg.mouth, v => cfg.mouth = v),
        T('😊 腮紅'), textOpts([{ id: true, name: '有腮紅' }, { id: false, name: '不要' }], cfg.blush, v => cfg.blush = v),
        T('✏️ 自己畫五官（畫在臉上，斜線區域會被瀏海蓋住）'), drawPanel());
    }
    if (tab === 'wear') {
      content.append(T('衣服'), optGrid(OUTFITS, 'outfit', cfg.outfit, v => cfg.outfit = v),
        T('衣服顏色'), swatches(CLOTH_COLORS, 'cc', cfg.clothColor, v => cfg.clothColor = v),
        T('褲子／鞋子顏色'), swatches(PANTS_COLORS, 'pc', cfg.pantsColor, v => cfg.pantsColor = v));
    }
    if (tab === 'acc') {
      content.append(T('頭上'), optGrid(HATS, 'hat', cfg.hat, v => cfg.hat = v),
        T('臉上'), optGrid(FACE_ACC, 'face', cfg.face, v => cfg.face = v),
        T('背上'), optGrid(BACK_ACC, 'back', cfg.back, v => cfg.back = v));
    }
  }

  /* ---- 手繪五官 ---- */
  let undoStack = [];
  function drawPanel() {
    const wrap = h('div', { class: 'face-canvas-wrap' });
    const bg = h('canvas', { width: FACE_W, height: FACE_H });
    const dr = h('canvas', { width: FACE_W, height: FACE_H });
    wrap.append(bg, dr, h('div', { class: 'hairzone' }, '瀏海區'));
    drawFace(bg.getContext('2d'), cfg, { noDrawing: true });
    const dctx = dr.getContext('2d');
    if (cfg.faceDraw) { const im = new Image(); im.onload = () => dctx.drawImage(im, 0, 0, FACE_W, FACE_H); im.src = cfg.faceDraw; }
    let color = '#2b1d14', size = 7, erasing = false, drawing = false, lx = 0, ly = 0;
    const pos = e => { const r = dr.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * FACE_W, (e.clientY - r.top) / r.height * FACE_H]; };
    dr.addEventListener('pointerdown', e => {
      e.preventDefault(); drawing = true; dr.setPointerCapture(e.pointerId);
      undoStack.push(dctx.getImageData(0, 0, FACE_W, FACE_H)); if (undoStack.length > 20) undoStack.shift();
      [lx, ly] = pos(e); stroke(lx, ly, lx + .01, ly + .01);
    });
    dr.addEventListener('pointermove', e => { if (!drawing) return; const [x, y] = pos(e); stroke(lx, ly, x, y); lx = x; ly = y; });
    const end = () => { if (!drawing) return; drawing = false; commit(); };
    dr.addEventListener('pointerup', end); dr.addEventListener('pointercancel', end);
    function stroke(a, b, c, d) {
      dctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
      dctx.strokeStyle = color; dctx.lineWidth = erasing ? size * 2.2 : size; dctx.lineCap = 'round'; dctx.lineJoin = 'round';
      dctx.beginPath(); dctx.moveTo(a, b); dctx.lineTo(c, d); dctx.stroke();
    }
    function commit() {
      const data = dctx.getImageData(0, 0, FACE_W, FACE_H).data;
      let any = false; for (let i = 3; i < data.length; i += 16) if (data[i]) { any = true; break; }
      cfg.faceDraw = any ? dr.toDataURL('image/png') : '';
      rebuild();
    }
    const pens = ['#2b1d14', '#000000', '#ffffff', '#e03131', '#ff8fb1', '#ff922b', '#ffd34d', '#4dabf7', '#7cc95a', '#9775fa'];
    const penRow = h('div', { class: 'row' });
    const sizeRow = h('div', { class: 'row' });
    function renderTools() {
      penRow.innerHTML = ''; sizeRow.innerHTML = '';
      pens.forEach(p => penRow.appendChild(h('div', { class: 'pen' + (!erasing && color === p ? ' on' : ''), style: { background: p }, onclick: () => { color = p; erasing = false; renderTools(); } })));
      [4, 7, 12, 18].forEach(s => sizeRow.appendChild(h('button', { class: 'size' + (size === s ? ' on' : ''), onclick: () => { size = s; renderTools(); } }, h('i', { style: { width: s + 'px', height: s + 'px' } }))));
      sizeRow.appendChild(h('button', { class: 'tab' + (erasing ? ' on' : ''), onclick: () => { erasing = !erasing; renderTools(); } }, '🧽 橡皮擦'));
    }
    renderTools();
    const tools = h('div', { class: 'draw-tools' },
      h('b', null, '畫筆顏色'), penRow, h('b', null, '粗細'), sizeRow,
      h('div', { class: 'row' },
        h('button', { class: 'btn small ghost', onclick: () => { if (undoStack.length) { dctx.putImageData(undoStack.pop(), 0, 0); commit(); } } }, '↩️ 復原'),
        h('button', { class: 'btn small red', onclick: () => { undoStack.push(dctx.getImageData(0, 0, FACE_W, FACE_H)); dctx.clearRect(0, 0, FACE_W, FACE_H); commit(); } }, '🗑️ 清空')),
      h('div', { style: { fontSize: '13px', color: '#8a735d', fontWeight: 700, lineHeight: 1.5 } }, '小提示：把眼睛、嘴巴選「不要」，就能完全自己畫喔！畫完後角色臉上會立刻出現。'));
    return h('div', { class: 'face-draw' }, wrap, tools);
  }

  renderTabs(); renderContent();

  /* ---- 底部 ---- */
  const titleMap = { create: '🎨 建立你的角色', wardrobe: '👕 換裝屋' };
  const doneBtn = h('button', { class: 'btn big', onclick: finish }, mode === 'create' ? '出發去群島！ ➜' : '✨ 就穿這套');
  const footLeft = h('div', { class: 'row' });
  if (isCloset) footLeft.append(h('button', { class: 'btn small ghost', onclick: () => { Object.assign(cfg, JSON.parse(JSON.stringify(original))); rebuild(); renderContent(); Sfx.play('click'); } }, '↩️ 換回原本的'));
  else footLeft.append(h('span', { class: 'pill coin' }, '🪙 ', h('b', null, G.coins)));
  const foot = h('div', { class: 'studio-foot' + (isCloset ? ' closet-foot' : '') }, footLeft, doneBtn);
  const body = h('div', { class: 'studio' + (isCloset ? ' closet-studio' : '') }, pv.el, side);
  const rec = Modal.open({
    title: titleMap[mode], sub: mode === 'create' ? '取個名字，打扮成你喜歡的樣子吧！' : '在魔鏡前換上你擁有的衣服，還可以存成搭配！',
    body, foot, closable: mode !== 'create',
    onClose: () => pv.dispose()
  });
  if (isCloset) { rec.m.classList.add('closet-modal'); rec.back.classList.add('closet-back'); }

  function finish() {
    if (mode === 'create' && !cfg.name) { shakeEl(nameInput); nameInput.focus(); toast('先幫角色取個名字吧！'); return; }
    stripUnowned(cfg, original);
    G.avatar = cfg; saveGame(); updateHUD();
    if (typeof World !== 'undefined') World.refreshPlayer();
    rec.close();
    onDone && onDone();
  }
}
