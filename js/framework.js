/* ============ 小遊戲框架 ============ */
const GAMES = {};

const Game = {
  open(task) {
    const def = GAMES[task.id];
    if (!def) { toast('這個任務還在施工中 🚧'); return; }
    const isl = ISLANDS.find(i => i.id === task.island);
    const cleanup = [];
    const dotsEl = h('div', { class: 'dots' });
    const sub = h('div', null,
      h('div', { class: 'sub' }, isl ? `${isl.emoji} ${isl.code} ${isl.name}` : '🏆 單元總複習'),
      h('div', { class: 'game-tags' }, task.junyi.map(j => h('span', null, j))));
    const rec = Modal.open({
      title: `${task.icon} ${task.name}`, sub, headExtra: dotsEl,
      onClose: () => { cleanup.forEach(f => { try { f(); } catch (e) { } }); World.updatePrompt(); }
    });
    $('#prompt').classList.add('hidden');
    const body = rec.bodyEl;
    const api = {
      body,
      onCleanup: fn => cleanup.push(fn),
      alive: () => rec.back.isConnected,
      dots(i, n, res = []) {
        dotsEl.innerHTML = '';
        for (let k = 0; k < n; k++) dotsEl.appendChild(h('i', { class: k < res.length ? (res[k] ? 'done' : 'bad') : (k === i ? 'cur' : '') }));
      },
      finish: (correct, total) => this.result(task, rec, correct, total, () => start()),
      close: () => rec.close(),
    };
    function intro() {
      dotsEl.innerHTML = '';
      body.innerHTML = '';
      body.appendChild(h('div', { class: 'concept' },
        h('div', { html: mascotSVG() }),
        h('div', null,
          h('div', { class: 'concept-card', html: def.concept }),
          h('div', { class: 'concept-foot' },
            h('a', { class: 'btn ghost', href: JUNYI_URL, target: '_blank', rel: 'noopener' }, '📺 到均一看教學影片'),
            h('button', { class: 'btn big', onclick: start }, '開始挑戰 ▶')))));
    }
    function start() {
      cleanup.splice(0).forEach(f => { try { f(); } catch (e) { } });
      body.innerHTML = '';
      Sfx.play('click');
      def.play(body, api);
    }
    intro();
  },

  result(task, rec, correct, total, retry) {
    const body = rec.bodyEl;
    const ratio = total ? correct / total : 0;
    const stars = ratio >= .9 ? 3 : ratio >= .7 ? 2 : ratio >= .5 ? 1 : 0;
    const prev = G.progress[task.id] || { stars: 0, plays: 0, best: 0 };
    let coins = 0;
    const isFinal = task.id === 'final';
    if (stars > prev.stars) coins = (prev.stars === 0 ? (isFinal ? 100 : 30) : 0) + (stars - prev.stars) * (isFinal ? 30 : 15);
    else if (stars > 0) coins = 5;
    let bonusItem = null;
    if (isFinal && stars > 0 && !G.owned.includes('hat:goldcrown')) { G.owned.push('hat:goldcrown'); bonusItem = '🏆 因數王冠（到衣櫥戴上它！）'; }
    G.progress[task.id] = { stars: Math.max(prev.stars, stars), plays: prev.plays + 1, best: Math.max(prev.best || 0, Math.round(ratio * 100)) };
    G.coins += coins;
    saveGame(); updateHUD(); World.refreshProgress();
    body.innerHTML = '';
    const msgs = ['差一點點！再試一次一定可以 💪', '過關了！做得不錯 👍', '好厲害！快要完美了 ✨', '完美！你是因數大師 🌟'];
    body.appendChild(h('div', { class: 'result' },
      h('div', { html: mascotSVG(stars === 3 ? 'wow' : 'happy'), style: { width: '110px', margin: '0 auto' } }),
      h('div', { class: 'stars' }, [0, 1, 2].map(i => h('span', { class: i < stars ? '' : 'off', style: { animationDelay: (i * .18) + 's' } }, '⭐'))),
      h('h3', null, msgs[stars]),
      h('div', { style: { fontWeight: 700, color: '#8a735d' } }, `答對 ${correct} / ${total}`),
      coins ? h('div', { class: 'reward' }, '🪙 +' + coins, h('span', { style: { fontSize: '15px' } }, '因數幣')) : null,
      bonusItem ? h('div', { class: 'reward', style: { display: 'flex', width: 'fit-content', margin: '6px auto' } }, '🎁 ' + bonusItem) : null,
      h('div', { class: 'concept-foot' },
        h('button', { class: 'btn ghost', onclick: retry }, '🔁 再玩一次'),
        h('button', { class: 'btn big', onclick: () => rec.close() }, '回到島上 ➜'))));
    if (stars > 0) { Sfx.play('win'); confetti(stars * 30); World.cheer(); if (coins) setTimeout(() => Sfx.play('coin'), 500); }
    else Sfx.play('bad');
  }
};

/* ---- 回合制 ---- */
function rounds(n, make) {
  return (el, api) => {
    let i = 0, correct = 0; const res = [];
    const next = () => {
      if (!api.alive()) return;
      if (i >= n) return api.finish(correct, n);
      api.dots(i, n, res);
      el.innerHTML = '';
      const box = h('div'); el.appendChild(box);
      let answered = false;
      make(i, api)(box, (ok, explain) => {
        if (answered) return; answered = true;
        if (ok) correct++; res.push(!!ok); api.dots(i + 1, n, res);
        feedback(box, ok, explain, () => { i++; next(); }, i === n - 1);
      });
    };
    next();
  };
}
function feedback(box, ok, explain, onNext, isLast) {
  box.classList.add('answered');
  Sfx.play(ok ? 'good' : 'bad');
  const fb = h('div', { class: 'feedback ' + (ok ? 'good' : 'bad') },
    h('div', { class: 'fb-icon' }, ok ? '🎉' : '🤔'),
    h('div', { class: 'fb-text' }, h('b', null, ok ? pick(['答對了！', '太棒了！', '正確！', '好厲害！']) : '再想想看～'), h('br'), h('span', { html: explain || '' })),
    h('button', { class: 'btn ' + (ok ? '' : 'blue'), onclick: onNext }, isLast ? '看結果 ★' : '下一題 →'));
  box.appendChild(fb);
  setTimeout(() => fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
}

/* ---- 數字鍵盤 ---- */
function numpad({ onSubmit, maxLen = 5, label }) {
  let val = '';
  const disp = h('div', { class: 'disp' }, '');
  const set = v => { val = v.slice(0, maxLen); disp.textContent = val || ' '; };
  const press = k => {
    Sfx.play('click');
    if (k === '⌫') set(val.slice(0, -1));
    else if (k === '✔') { if (val !== '') onSubmit(parseInt(val, 10), pad); }
    else set(val + k);
  };
  const keys = h('div', { class: 'keys' }, ['7', '8', '9', '4', '5', '6', '1', '2', '3', '⌫', '0', '✔'].map(k =>
    h('button', { class: k === '✔' ? 'ok' : '', onclick: () => press(k) }, k)));
  const pad = h('div', { class: 'numpad' }, label ? h('div', { style: { fontWeight: 900 } }, label) : null, disp, keys);
  pad.clear = () => set('');
  set('');
  const kh = e => {
    if (!pad.isConnected) { removeEventListener('keydown', kh); return; }
    if (pad.closest('.answered')) return;
    if (/^\d$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') press('⌫');
    else if (e.key === 'Enter') { e.preventDefault(); press('✔'); }
  };
  addEventListener('keydown', kh);
  return pad;
}

/* ---- 選擇題 ---- */
function mcq(box, options, correctIdx, done, explain, cls = 'choice-list') {
  const list = h('div', { class: cls });
  options.forEach((o, i) => list.appendChild(h('button', {
    class: 'choice', html: String(o), onclick: e => {
      $$('.choice', list).forEach((b, k) => { if (k === correctIdx) b.classList.add('right'); });
      if (i !== correctIdx) e.currentTarget.classList.add('wrong');
      done(i === correctIdx, explain);
    }
  })));
  box.appendChild(list);
  return list;
}
function mcqShuffled(box, correct, wrongs, done, explain) {
  const opts = shuffle([correct, ...wrongs]);
  return mcq(box, opts, opts.indexOf(correct), done, explain);
}
const Q = (text, small) => h('div', { class: 'q' }, h('span', { html: text }), small ? h('small', { html: small }) : null);
