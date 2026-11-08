/* ============ 主程式 ============ */
let G = { avatar: null, coins: 0, owned: [], progress: {}, sound: true, teacher: false, outfits: [null, null, null] };

function saveGame() { Store.save(G); }
function totalCleared() { return ALL_TASKS.filter(t => (G.progress[t.id] || {}).stars > 0).length; }
function totalStars() { return Object.values(G.progress).reduce((s, p) => s + (p.stars || 0), 0); }
function updateHUD() {
  $('#hudName').textContent = (G.avatar && G.avatar.name) || '玩家';
  $('#hudCoins').textContent = G.coins;
  $('#hudStars').textContent = totalStars();
  $('#btnSound').firstChild.textContent = G.sound ? '🔊' : '🔇';
}

function onInteract(fac) {
  switch (fac.kind) {
    case 'task': Game.open(taskById(fac.id)); break;
    case 'shop': openStudio({ mode: 'shop' }); break;
    case 'wardrobe': openStudio({ mode: 'wardrobe' }); break;
    case 'map': openMap(); break;
    case 'final':
      if (totalCleared() >= FINAL_NEED || G.progress.final || G.teacher) Game.open(taskById('final'));
      else toast(`🔒 期末試煉塔：先完成 ${FINAL_NEED} 個任務（目前 ${totalCleared()} 個）`);
      break;
  }
}

/* ---- 任務地圖 ---- */
function openMap() {
  const body = h('div');
  const rec = Modal.open({ title: '🗺️ 任務地圖', sub: `已完成 ${totalCleared()} / ${ALL_TASKS.length} 個任務・⭐ ${totalStars()}`, body });
  const go = id => { rec.close(); World.teleport(id); Sfx.play('pop'); };
  body.appendChild(h('div', { class: 'map-isl' },
    h('h3', null, '🏝️ 中央島'),
    ...[['shop', '🛍️ 方塊商店：用因數幣買新外觀'], ['wardrobe', '👕 換裝屋：換上你的衣服'], ['final', `🏆 期末試煉塔（需完成 ${FINAL_NEED} 個任務）`]].map(([id, t]) =>
      h('div', { class: 'map-task' }, h('span', { class: 't' }, t), id === 'final' && G.progress.final ? h('span', { class: 'st' }, '⭐'.repeat(G.progress.final.stars)) : null, h('button', { class: 'btn small blue', onclick: () => go(id) }, '✈️ 前往')))));
  ISLANDS.forEach(isl => {
    const open = World.isIslandOpen(isl.id);
    const done = World.islandDone(isl.id);
    body.appendChild(h('div', { class: 'map-isl', style: open ? null : { opacity: .7 } },
      h('h3', null, `${isl.emoji} ${isl.code} ${isl.name}`, h('span', { class: 'pill' }, `${done}/${isl.tasks.length}`), open ? null : h('span', { class: 'locked-tag' }, `🔒 完成上一座島 ${unlockNeed(ISLANDS[isl.id - 2])} 個任務後開放`)),
      ...isl.tasks.map(t => {
        const p = G.progress[t.id];
        return h('div', { class: 'map-task' },
          h('span', { class: 't' }, `${t.icon} ${t.name}`, h('div', { class: 'game-tags' }, t.junyi.slice(0, 2).map(j => h('span', null, j)))),
          h('span', { class: 'st' }, p && p.stars ? '⭐'.repeat(p.stars) + '☆'.repeat(3 - p.stars) : '☆☆☆'),
          open ? h('button', { class: 'btn small blue', onclick: () => go(t.id) }, '✈️ 前往') : h('span', { class: 'locked-tag' }, '🔒'));
      })));
  });
}

/* ---- 設定 ---- */
function openSettings() {
  const body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } });
  const rec = Modal.open({ title: '⚙️ 設定', body, width: 'min(520px,94vw)' });
  const teacherBtn = h('button', { class: 'btn ' + (G.teacher ? 'yellow' : 'ghost'), onclick: () => { G.teacher = !G.teacher; saveGame(); World.refreshProgress(true); rec.close(); openSettings(); toast(G.teacher ? '👩‍🏫 老師模式：全部島嶼開放' : '一般模式'); } }, G.teacher ? '👩‍🏫 老師模式：開啟中' : '👩‍🏫 老師模式（開放全部島嶼）');
  body.append(
    h('div', { class: 'speech' }, '🎯 學習內容：均一教育平台【六上】第一單元 最大公因數與最小公倍數（類翰林版）', h('br'), h('a', { href: JUNYI_URL, target: '_blank', rel: 'noopener' }, '開啟均一課程頁面 ↗')),
    teacherBtn,
    h('button', { class: 'btn blue', onclick: () => { rec.close(); openStudio({ mode: 'wardrobe' }); } }, '🎨 重新打扮角色'),
    h('button', {
      class: 'btn red', onclick: () => {
        if (confirm('確定要清除所有進度、因數幣和角色嗎？這個動作無法復原。')) { Store.clear(); location.reload(); }
      }
    }, '🗑️ 清除存檔重新開始'));
}

/* ---- 開場 ---- */
function welcome(done) {
  const body = h('div', { class: 'intro' },
    h('div', { html: mascotSVG() }),
    h('div', { class: 'speech', html: `嗨！我是群島的守護精靈<b>「方方」</b> 🌱<br>
      歡迎來到<b>因數群島</b>！這裡有 <b>5 座六角形的島</b>，每座島都藏著數學的秘密：<br>
      🌼 質數草原 → 🌲 因數森林 → 🐚 公因數海灣 → ⛄ 公倍數雪山 → ⚓ 應用港口<br>
      完成島上的任務可以得到 <b>🪙 因數幣</b>，拿去中央島的商店買新衣服！<br>
      首先，來打扮一下你自己吧！` }));
  const rec = Modal.open({
    title: '🏝️ 歡迎來到因數群島', body, closable: false, width: 'min(720px,96vw)',
    foot: h('div', { class: 'studio-foot', style: { justifyContent: 'flex-end' } }, h('button', { class: 'btn big', onclick: () => { Sfx.init(); rec.close(); done(); } }, '建立我的角色 ✨'))
  });
}

async function boot() {
  const saved = Store.load();
  if (saved) G = Object.assign(G, saved);
  Sfx.on = G.sound;
  try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]); } catch (e) { }
  World.init($('#world'), onInteract);
  updateHUD();
  $('#loading').classList.add('fade'); setTimeout(() => $('#loading').remove(), 600);

  $('#btnMap').onclick = () => openMap();
  $('#btnWardrobe').onclick = () => openStudio({ mode: 'wardrobe' });
  $('#btnSound').onclick = () => { G.sound = Sfx.on = !G.sound; saveGame(); updateHUD(); Sfx.play('click'); };
  $('#btnSettings').onclick = () => openSettings();
  $('#camL').onclick = () => World.rotate(.5);
  $('#camR').onclick = () => World.rotate(-.5);
  $('#camIn').onclick = () => World.zoom(-3);
  $('#camOut').onclick = () => World.zoom(3);

  const showHud = () => {
    $('#hud').classList.remove('hidden');
    setTimeout(() => $('#helpTip') && $('#helpTip').classList.add('hidden'), 15000);
  };
  if (!G.avatar) {
    welcome(() => openStudio({
      mode: 'create', onDone: () => {
        G.coins = Math.max(G.coins, 50); saveGame(); updateHUD(); showHud();
        toast(`🎉 ${G.avatar.name}，送你 50 因數幣當見面禮！`, 'gold'); Sfx.play('coin');
        setTimeout(() => toast('🌉 從中央島走過左邊的橋，去「質數草原」開始冒險吧！'), 1800);
      }
    }));
  } else showHud();
}
boot();
