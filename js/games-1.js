/* ============ 島 1：質數草原 ============ */

/* 1a 積木排排站：用積木排長方形，判斷質數／合數 */
GAMES['1a'] = {
  concept: `<h3>🧱 質數和合數</h3>
  一個數的<b>因數</b>，就是可以把它整除的數。<br>
  <b>質數</b>：只有 <b>1 和自己</b> 兩個因數。例如 2、3、5、7、11。<br>
  <b>合數</b>：除了 1 和自己，<b>還有其他因數</b>。例如 4、6、8、9。<br>
  <div class="ex">🧱 積木小技巧：把 N 個積木排成「每排一樣多」的長方形。<br>只能排成一長條 → 質數；還能排成別的長方形 → 合數。</div>`,
  play: (() => {
    let nextN;
    return (el, api) => {
      const easy = deck([5, 6, 7, 8, 9, 10, 11, 12, 13]), hard = deck([14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
      rounds(5, i => (box, done) => {
        const N = i < 2 ? easy() : hard();
        const found = new Set();
        box.appendChild(Q(`有 <b style="color:#d9618a">${N}</b> 個積木，試試看每排放幾個，能不能排成整齊的長方形？`, '點下面的數字，選「每排放幾個」，找出所有排得整齊的方法，再判斷它是質數還是合數。'));
        const btns = h('div', { class: 'nums', style: { marginBottom: '10px' } });
        const board = h('div', { class: 'blockboard' });
        const msg = h('div', { style: { fontWeight: 900, fontSize: '18px', textAlign: 'center', margin: '8px 0', minHeight: '27px' } });
        const foundEl = h('div', { class: 'found-list' });
        for (let w = 1; w <= N; w++) btns.appendChild(h('button', { class: 'num', onclick: e => arrange(w, e.currentTarget) }, w));
        function arrange(w, btn) {
          Sfx.play('pop');
          $$('.num', btns).forEach(b => b.classList.remove('sel')); btn.classList.add('sel');
          board.innerHTML = '';
          const grid = h('div', { class: 'blockgrid', style: { gridTemplateColumns: `repeat(${w},26px)` } });
          const rem = N % w;
          for (let k = 0; k < N; k++) {
            const isLeft = rem && k >= N - rem;
            grid.appendChild(h('div', { class: 'cube' + (isLeft ? ' left' : ''), style: { animationDelay: (k * .012) + 's' } }));
          }
          board.appendChild(grid);
          if (rem) { msg.innerHTML = `<span class="leftover">每排 ${w} 個，最後剩 ${rem} 個排不整齊 ✗</span>`; }
          else {
            const rows = N / w;
            msg.innerHTML = `✓ 排成 <b>${rows} 排</b>、每排 <b>${w} 個</b>：${N} = ${rows} × ${w}`;
            btn.classList.add('on');
            const key = Math.min(w, rows) + '×' + Math.max(w, rows);
            if (!found.has(key)) { found.add(key); foundEl.appendChild(h('span', { class: 'pop' }, key)); }
          }
        }
        box.append(btns, board, msg, h('div', { class: 'row', style: { margin: '6px 0 14px' } }, h('b', null, '找到的長方形：'), foundEl));
        box.appendChild(Q(`所以 ${N} 是……`));
        const fs = factorsOf(N);
        const ex = `${N} 的因數有 <b>${fs.join('、')}</b>，` + (isPrime(N) ? '只有 1 和自己兩個因數，積木只能排成一長條 → <b>質數</b>' : `除了 1 和 ${N} 還有其他因數 → <b>合數</b>`);
        mcq(box, ['🟡 質數', '🔵 合數'], isPrime(N) ? 0 : 1, done, ex);
      })(el, api);
    };
  })()
};

/* 1b 質數泡泡：限時點出質數泡泡 */
GAMES['1b'] = {
  concept: `<h3>🫧 快速認出質數</h3>
  記住 <b>50 以內的質數</b>：2、3、5、7、11、13、17、19、23、29、31、37、41、43、47。<br>
  判斷的方法：試試看能不能被 <b>2、3、5、7</b> 整除。<br>
  <div class="ex">⚠️ 陷阱：1 不是質數！ 51 = 3 × 17、57 = 3 × 19、49 = 7 × 7 都是合數喔！</div>
  遊戲規則：泡泡會往上飄，<b>只戳質數泡泡</b>！戳錯會扣分，讓質數飄走也會扣分。`,
  play(el, api) {
    const DUR = 40;
    let good = 0, wrong = 0, missed = 0, tLeft = DUR, running = true;
    const goodEl = h('b', null, 0), badEl = h('b', null, 0);
    const bar = h('i', { style: { width: '100%' } });
    const arena = h('div', { class: 'bubble-arena' });
    el.append(h('div', { class: 'arena-hud' }, h('span', { class: 'pill' }, '✅ 戳中質數 ', goodEl), h('span', { class: 'pill' }, '❌ 失誤 ', badEl), h('div', { class: 'timebar' }, bar)),
      arena, h('div', { style: { textAlign: 'center', fontWeight: 700, marginTop: '8px', color: '#8a735d' } }, '只戳「質數」泡泡！'));
    api.dots(0, 1);
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59];
    const traps = [1, 4, 6, 8, 9, 10, 12, 14, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55, 57];
    const bubbles = [];
    let spawnT = 0, last = performance.now();
    function note(x, y, txt, col) { const n = h('div', { class: 'float-note', style: { left: x + 'px', top: y + 'px', color: col } }, txt); arena.appendChild(n); setTimeout(() => n.remove(), 1000); }
    function spawn() {
      const n = Math.random() < .5 ? pick(primes) : pick(traps);
      const w = arena.clientWidth;
      const b = { n, x: 10 + Math.random() * (w - 90), y: arena.clientHeight + 10, v: 45 + Math.random() * 35 + (DUR - tLeft) * 1.2, wob: Math.random() * 6, dead: false };
      b.el = h('div', { class: 'bubble', style: { left: 0, top: 0, transform: `translate(${b.x}px, ${b.y}px)` } }, n);
      b.el.addEventListener('pointerdown', e => {
        e.preventDefault(); if (b.dead || !running) return;
        if (isPrime(n)) { good++; b.dead = true; b.el.classList.add('popped'); Sfx.play('pop'); note(b.x + 10, b.y, '+1 質數！', '#2b8a3e'); }
        else { wrong++; b.el.classList.add('wrong'); Sfx.play('bad'); note(b.x - 10, b.y, n === 1 ? '1 不是質數' : `${n} = ${pfStr(n)}`, '#c94545'); b.dead = true; setTimeout(() => b.el.classList.add('popped'), 350); }
        goodEl.textContent = good; badEl.textContent = wrong + missed;
      });
      arena.appendChild(b.el); bubbles.push(b);
    }
    function tick(now) {
      if (!running || !api.alive()) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      tLeft -= dt; bar.style.width = Math.max(0, tLeft / DUR * 100) + '%';
      spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = .55 + Math.random() * .45; }
      for (const b of bubbles) {
        if (b.dead && b.gone) continue;
        b.y -= b.v * dt; b.el.style.transform = `translate(${b.x + Math.sin(now / 500 + b.wob) * 8}px, ${b.y}px)`;
        if (b.y < -80 && !b.gone) { b.gone = true; b.el.remove(); if (!b.dead && isPrime(b.n)) { missed++; badEl.textContent = wrong + missed; } b.dead = true; }
      }
      if (tLeft <= 0) { running = false; setTimeout(() => api.alive() && api.finish(good, Math.max(1, good + wrong + missed)), 600); return; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(t => { last = t; tick(t); });
    api.onCleanup(() => running = false);
  }
};

/* 1c 三個籃子：質數／合數／都不是 */
GAMES['1c'] = {
  concept: `<h3>🧺 1 和偶數的秘密</h3>
  <b>1</b> 只有 1 個因數（就是 1），所以 1 <b>既不是質數，也不是合數</b>！<br>
  <b>2</b> 是<b>唯一的偶數質數</b>，也是最小的質數。<br>
  其他偶數（4、6、8…）都可以被 2 整除，所以都是<b>合數</b>。<br>
  <div class="ex">⚠️ 奇數不一定是質數：9 = 3 × 3、15 = 3 × 5、21 = 3 × 7 都是合數。</div>
  玩法：先點一張數字卡，再點它該去的籃子。`,
  play(el, api) {
    const waves = [shuffle([1, 2, pick([4, 6, 8, 10]), pick([3, 5, 7]), pick([9, 15, 21]), pick([11, 13, 17, 19])]),
      shuffle([pick([23, 29, 31, 37]), pick([27, 33, 39, 51]), pick([12, 14, 16, 18, 20]), pick([25, 35, 49]), pick([41, 43, 47]), 1])];
    let wave = 0, firstTry = 0, total = 0, sel = null;
    const tried = new Set();
    function render() {
      el.innerHTML = '';
      api.dots(wave, 2);
      const cards = h('div', { class: 'cards' });
      const list = waves[wave];
      el.append(Q('把數字卡放進正確的籃子', `第 ${wave + 1} / 2 波：先點數字卡，再點籃子`), cards);
      list.forEach(n => {
        const c = h('div', { class: 'ncard', onclick: () => { sel = n; Sfx.play('click'); $$('.ncard', cards).forEach(x => x.classList.toggle('sel', x === c)); } }, n);
        c.dataset.n = n; cards.appendChild(c);
      });
      const kinds = [['p', '🟡', '質數'], ['c', '🔵', '合數'], ['n', '🟣', '都不是']];
      const baskets = h('div', { class: 'baskets' });
      kinds.forEach(([k, ico, name]) => {
        const inn = h('div', { class: 'in' });
        const b = h('button', { class: 'basket ' + k, onclick: () => drop(k, b, inn) }, h('span', { class: 'bi' }, '🧺'), `${ico} ${name}`, inn);
        baskets.appendChild(b);
      });
      el.appendChild(baskets);
      const tip = h('div', { style: { textAlign: 'center', minHeight: '28px', fontWeight: 700, marginTop: '12px' } });
      el.appendChild(tip);
      function drop(k, b, inn) {
        if (sel == null) { toast('先點一張數字卡喔！'); return; }
        const n = sel, card = $$('.ncard', cards).find(c => +c.dataset.n === n);
        const ans = n === 1 ? 'n' : isPrime(n) ? 'p' : 'c';
        const key = wave + ':' + n;
        if (k === ans) {
          if (!tried.has(key)) firstTry++;
          total += tried.has(key) ? 0 : 1; tried.add(key + 'ok');
          Sfx.play('good'); card.remove(); inn.appendChild(h('span', { class: 'pop' }, n)); sel = null;
          tip.innerHTML = n === 1 ? '✓ 1 只有一個因數，不是質數也不是合數' : n === 2 ? '✓ 2 是唯一的偶數質數！' : isPrime(n) ? `✓ ${n} 只有 1 和 ${n} 兩個因數` : `✓ ${n} = ${pfStr(n)}，是合數`;
          if (!$$('.ncard', cards).length) {
            wave++;
            if (wave >= 2) setTimeout(() => api.finish(firstTry, 12), 700);
            else setTimeout(render, 900);
          }
        } else {
          if (!tried.has(key)) { tried.add(key); total++; }
          Sfx.play('bad'); shakeEl(b); shakeEl(card);
          tip.innerHTML = `<span class="leftover">✗ ${n === 1 ? '1 的因數只有 1 個喔！' : n === 2 ? '2 的因數只有 1 和 2…' : isPrime(n) ? `${n} 除了 1 和自己，找得到別的因數嗎？` : `${n} 可以寫成 ${pfStr(n)} 喔`}</span>`;
        }
      }
    }
    render();
  }
};

/* 1d 質數篩子：埃拉托斯特尼篩法 */
GAMES['1d'] = {
  concept: `<h3>🌀 用「篩子」找出所有質數</h3>
  古希臘數學家想到一個好方法：<br>
  ① 先劃掉 <b>1</b>（它不是質數）。<br>
  ② <b>2</b> 是質數，把 2 的倍數（4、6、8…）全部劃掉。<br>
  ③ 下一個沒被劃掉的 <b>3</b> 是質數，劃掉 3 的倍數…<br>
  ④ 再來是 <b>5</b>、<b>7</b>……剩下沒被劃掉的，就全部是質數！
  <div class="ex">💡 為什麼做到 7 就夠了？因為下一個質數 11 × 11 = 121，已經超過 50 了。</div>`,
  play(el, api) {
    const N = 50;
    const crossed = new Set(), primesMarked = new Set();
    const steps = [1, 2, 3, 5, 7];
    let step = 0, mistakes = 0;
    const msg = h('div', { class: 'q', style: { minHeight: '64px' } });
    const grid = h('div', { class: 'sieve' });
    const cells = {};
    const PCOL = { 1: '#868e96', 2: '#ff6b6b', 3: '#4dabf7', 5: '#40c057', 7: '#9775fa' };
    for (let n = 1; n <= N; n++) { const b = h('button', { onclick: () => tap(n, b) }, n); cells[n] = b; grid.appendChild(b); }
    el.append(msg, grid);
    api.dots(0, 5);
    function need() { const p = steps[step]; if (p === 1) return crossed.has(1) ? [] : [1]; const a = []; for (let m = p * 2; m <= N; m += p) if (!crossed.has(m)) a.push(m); return a; }
    function setMsg() {
      const p = steps[step], left = need().length;
      msg.innerHTML = p === 1 ? '第 1 步：<b>1</b> 不是質數，點一下把它劃掉！' :
        `第 ${step + 1} 步：<b style="color:${PCOL[p]}">${p}</b> 是質數 ⭐ 把 <b>${p} 的倍數</b>（不含 ${p}）全部劃掉！<small>還剩 ${left} 個要劃掉　｜　失誤 ${mistakes} 次</small>`;
    }
    function tap(n, b) {
      if (step >= steps.length || crossed.has(n)) return;
      const p = steps[step];
      const okTap = p === 1 ? n === 1 : (n % p === 0 && n !== p);
      if (okTap) { crossed.add(n); b.classList.add('cross'); b.style.setProperty('--c', PCOL[p]); Sfx.play('pop'); }
      else { mistakes++; Sfx.play('bad'); shakeEl(b); toast(p === 1 ? '先劃掉 1 喔' : n === p ? `${p} 是質數，要留下來！` : `${n} 不是 ${p} 的倍數喔`, 'bad'); }
      if (!need().length) {
        step++; api.dots(step, 5, Array(step).fill(true));
        if (step < steps.length) { const np = steps[step]; primesMarked.add(np); cells[np].classList.add('cur'); if (steps[step - 1] > 1) cells[steps[step - 1]].classList.replace('cur', 'prime'); Sfx.play('good'); }
        else return finishSieve();
      }
      setMsg();
    }
    function finishSieve() {
      cells[7].classList.replace('cur', 'prime');
      for (let n = 2; n <= N; n++) if (!crossed.has(n)) setTimeout(() => cells[n].classList.add('prime'), n * 25);
      msg.innerHTML = '篩完了！剩下的黃色格子都是質數 ✨';
      Sfx.play('win');
      setTimeout(() => {
        const box = h('div', { style: { marginTop: '14px' } });
        el.appendChild(box);
        box.appendChild(Q('數一數：<b>50 以內</b>共有幾個質數？'));
        const pad = numpad({
          onSubmit: v => {
            const okA = v === 15;
            box.classList.add('answered');
            const score = Math.max(0, 8 - mistakes) + (okA ? 2 : 0);
            feedback(box, okA, `50 以內的質數有 <b>15</b> 個：2、3、5、7、11、13、17、19、23、29、31、37、41、43、47。<br>篩的過程失誤 ${mistakes} 次。`, () => api.finish(score, 10), true);
          }
        });
        box.appendChild(h('div', { class: 'np-wrap' }, pad));
        box.scrollIntoView({ behavior: 'smooth' });
      }, 1400);
    }
    setMsg();
  }
};

/* 1e 是非小精靈 */
GAMES['1e'] = {
  concept: `<h3>🧚 奇數、偶數、質數、合數</h3>
  <b>奇數</b>：不能被 2 整除（1、3、5、7、9…）　<b>偶數</b>：能被 2 整除（0、2、4、6…）<br>
  <b>質數</b>：恰好有 2 個因數　<b>合數</b>：有 3 個以上的因數　<b>1</b>：都不是<br>
  <div class="ex">🔍 想推翻一句話，只要找到一個「反例」就夠了！<br>例如「質數都是奇數」→ 反例：2 是偶數又是質數，所以這句話是錯的。</div>`,
  play: (el, api) => {
    const pool = shuffle([
      ['所有的質數都是奇數。', false, '2 是質數，但 2 是偶數！'],
      ['所有的偶數都是合數。', false, '2 是偶數，卻是質數。'],
      ['1 是最小的質數。', false, '1 只有一個因數，不是質數；最小的質數是 2。'],
      ['大於 2 的偶數一定是合數。', true, '它們都有因數 2，因數至少有 1、2、自己三個。'],
      ['奇數不一定是質數。', true, '例如 9 = 3 × 3、15 = 3 × 5。'],
      ['合數至少有 3 個因數。', true, '除了 1 和自己，還有別的因數。'],
      ['最小的合數是 4。', true, '4 = 2 × 2，因數有 1、2、4。'],
      ['兩個質數相加，一定是偶數。', false, '2 + 3 = 5 是奇數。'],
      ['兩個奇數相乘，一定是奇數。', true, '例如 3 × 5 = 15、7 × 9 = 63。'],
      ['質數的因數只有 1 和它自己。', true, '這就是質數的定義。'],
      ['所有個位數是 9 的數都是合數。', false, '19、29 都是質數喔！'],
      ['所有個位數是 5 且大於 5 的數都是合數。', true, '它們都能被 5 整除。'],
      ['一個合數一定可以寫成兩個比自己小的數相乘。', true, '例如 12 = 3 × 4、9 = 3 × 3。'],
      ['51 是質數。', false, '51 = 3 × 17，是合數。'],
    ]);
    rounds(8, i => (box, done) => {
      const [s, ans, why] = pool[i];
      box.appendChild(h('div', { class: 'tf-card' }, '「' + s + '」'));
      const btns = h('div', { class: 'tf-btns' });
      const go = v => { $$('.btn', btns).forEach(b => b.disabled = true); done(v === ans, `這句話是 <b>${ans ? '對的 ⭕' : '錯的 ❌'}</b>：${why}`); };
      btns.append(h('button', { class: 'btn big', onclick: () => go(true) }, '⭕ 對'), h('button', { class: 'btn big red', onclick: () => go(false) }, '❌ 錯'));
      box.appendChild(btns);
    })(el, api);
  }
};

/* ============ 島 2：因數森林 ============ */

/* 2a 質因數獵人 */
GAMES['2a'] = {
  concept: `<h3>🏹 什麼是質因數？</h3>
  一個數的因數中，是<b>質數</b>的那些，就叫做這個數的<b>質因數</b>。<br>
  <div class="ex">例：12 的因數有 1、2、3、4、6、12<br>其中 2 和 3 是質數 → 12 的質因數是 <b>2、3</b></div>
  ⚠️ 1 不是質數，所以 <b>1 不是質因數</b>；4、6 是合數，也不是質因數。<br>
  玩法：先找出所有因數，再從因數中挑出質數。`,
  play: (el, api) => {
    const d = deck([12, 18, 20, 24, 28, 30, 36, 40, 42, 45]);
    rounds(3, () => (box, done) => {
      const N = d(); const fs = factorsOf(N), pfs = [...new Set(primeFactors(N))];
      let phase = 1, mistakes = 0;
      const found = new Set();
      const q = Q(`第 1 關：點出 <b>${N}</b> 的<b>所有因數</b>`, `共有 ${fs.length} 個因數，已找到 <span id="cnt">0</span> 個`);
      const nums = h('div', { class: 'nums' });
      for (let n = 1; n <= N; n++) nums.appendChild(h('button', { class: 'num', onclick: e => tap(n, e.currentTarget) }, n));
      box.append(q, nums);
      function tap(n, b) {
        if (phase === 1) {
          if (found.has(n)) return;
          if (N % n === 0) { found.add(n); b.classList.add('on'); Sfx.play('pop'); $('#cnt', q).textContent = found.size; if (found.size === fs.length) toPhase2(); }
          else { mistakes++; shakeEl(b); Sfx.play('bad'); toast(`${N} ÷ ${n} 有餘數，不是因數`, 'bad'); }
        }
      }
      function toPhase2() {
        phase = 2; Sfx.play('good');
        nums.remove();
        const chosen = new Set();
        q.innerHTML = ''; q.append(h('span', { html: `第 2 關：${N} 的因數裡，哪些是<b>質數</b>？點它們變成質因數寶石 💎` }), h('small', null, '全部找到後按「完成」'));
        const row = h('div', { class: 'row center', style: { margin: '10px 0' } });
        fs.forEach(f => row.appendChild(h('button', { class: 'chip', onclick: e => { const b = e.currentTarget; if (chosen.has(f)) { chosen.delete(f); b.classList.remove('sel'); } else { chosen.add(f); b.classList.add('sel'); } Sfx.play('click'); } }, f)));
        box.append(row, h('div', { class: 'row center' }, h('button', {
          class: 'btn', onclick: () => {
            const okA = chosen.size === pfs.length && pfs.every(p => chosen.has(p));
            done(okA && mistakes <= 2, `${N} 的因數：${fs.join('、')}<br>其中的質數 → <b>質因數是 ${pfs.join('、')}</b>` + (mistakes > 2 ? `（找因數時失誤 ${mistakes} 次）` : ''));
          }
        }, '完成 ✔')));
      }
    })(el, api);
  }
};

/* 2b 長方形花圃 */
GAMES['2b'] = {
  concept: `<h3>🌷 長方形的排列組合</h3>
  用 N 塊正方形花圃排成長方形，長方形的<b>長和寬</b>一定是 N 的<b>因數</b>！<br>
  <div class="ex">例：12 塊可以排成 1 × 12、2 × 6、3 × 4 三種長方形<br>→ 12 的因數有 1、2、3、4、6、12</div>
  因數總是<b>兩個兩個成對</b>出現（1 和 12、2 和 6、3 和 4），找因數時從小的開始試，就不會漏掉。`,
  play: (el, api) => {
    const d = deck([12, 16, 18, 20, 24, 30, 36]);
    rounds(2, () => (box, done) => {
      const N = d();
      const pairs = factorsOf(N).filter(f => f * f <= N).map(f => [f, N / f]);
      const got = new Set();
      box.appendChild(Q(`用 <b>${N}</b> 塊花圃排出<b>所有不同的長方形</b>`, '拉動滑桿決定「寬」，排得整齊就按「種下去！」（2×6 和 6×2 算同一種）'));
      const slider = h('input', { type: 'range', min: 1, max: N, value: 1 });
      const wl = h('b', null, '1');
      const board = h('div', { class: 'blockboard' });
      const info = h('div', { style: { textAlign: 'center', fontWeight: 900, fontSize: '18px', margin: '8px 0', minHeight: '27px' } });
      const plant = h('button', { class: 'btn pink' }, '🌷 種下去！');
      const slots = h('div', { class: 'row center' });
      pairs.forEach(() => slots.appendChild(h('div', { class: 'slot' }, '？')));
      box.append(h('div', { class: 'slider-row' }, '每排 ', slider, wl, ' 塊'), board, info, h('div', { class: 'row center' }, plant), h('div', { class: 'sect-title', style: { justifyContent: 'center', marginTop: '14px' } }, `需要找到 ${pairs.length} 種長方形`), slots);
      function draw() {
        const w = +slider.value; wl.textContent = w;
        board.innerHTML = '';
        const g = h('div', { class: 'blockgrid', style: { gridTemplateColumns: `repeat(${w},${w > 18 ? 16 : 24}px)` } });
        const rem = N % w;
        for (let k = 0; k < N; k++) g.appendChild(h('div', { class: 'cube flower' + (rem && k >= N - rem ? ' left' : ''), style: { width: (w > 18 ? 16 : 24) + 'px', height: (w > 18 ? 16 : 24) + 'px', animation: 'none' } }));
        board.appendChild(g);
        info.innerHTML = rem ? `<span class="leftover">最後一排少了 ${w - rem} 塊，不是長方形</span>` : `✓ ${N / w} 排 × 每排 ${w} 塊 = ${N}`;
        plant.disabled = !!rem;
      }
      slider.addEventListener('input', draw); draw();
      plant.onclick = () => {
        const w = +slider.value; if (N % w) return;
        const k = Math.min(w, N / w) + ' × ' + Math.max(w, N / w);
        if (got.has(k)) { toast('這種長方形已經種過了！換一種試試'); return; }
        got.add(k); Sfx.play('good');
        const s = $$('.slot', slots).find(s => !s.classList.contains('fill')); s.classList.add('fill'); s.textContent = k;
        if (got.size === pairs.length) {
          plant.disabled = true; slider.disabled = true;
          const q2 = h('div', { style: { marginTop: '16px' } });
          box.appendChild(q2);
          q2.appendChild(Q(`全部找到了！長方形的長和寬都是 ${N} 的因數。<br>那麼 <b>${N} 一共有幾個因數</b>？`));
          q2.appendChild(h('div', { class: 'np-wrap' }, numpad({ onSubmit: v => done(v === factorsOf(N).length, `長方形有 ${pairs.map(p => p.join('×')).join('、')}<br>所以 ${N} 的因數有 <b>${factorsOf(N).join('、')}</b>，共 ${factorsOf(N).length} 個` + (pairs.some(p => p[0] === p[1]) ? '（正方形的邊只算一次喔！）' : '')) })));
          q2.scrollIntoView({ behavior: 'smooth' });
        }
      };
    })(el, api);
  }
};

/* 2c 因數大樹：樹狀圖質因數分解 */
GAMES['2c'] = {
  concept: `<h3>🌳 質因數分解：樹狀圖</h3>
  把一個合數寫成<b>質數相乘</b>的形式，就叫做<b>質因數分解</b>。<br>
  樹狀圖的方法：把數拆成兩個數相乘，如果還是合數就繼續拆，直到每片葉子都是<b>質數</b>。
  <div class="ex">36 → 6 × 6 → (2 × 3) × (2 × 3)<br>所以 36 = 2 × 2 × 3 × 3</div>
  💡 不管一開始怎麼拆，最後得到的質數都一樣喔！`,
  play: (el, api) => {
    const d = deck([24, 30, 36, 40, 48, 60, 72, 84, 90, 100, 120]);
    rounds(3, () => (box, done) => {
      const N = d();
      const root = { v: N, kids: null };
      let selNode = null;
      box.appendChild(Q(`點<b>綠色</b>的數字，把它拆成兩個數相乘，直到全部變成<b>黃色質數寶石</b>！`, `目標：把 ${N} 做質因數分解`));
      const wrap = h('div', { class: 'tree-wrap' }); const tree = h('div', { class: 'tree' }); wrap.appendChild(tree);
      const menu = h('div', { class: 'split-menu' });
      const after = h('div');
      box.append(wrap, menu, after);
      function leaves(n) { return n.kids ? leaves(n.kids[0]) + leaves(n.kids[1]) : 1; }
      function depth(n) { return n.kids ? 1 + Math.max(depth(n.kids[0]), depth(n.kids[1])) : 1; }
      function render() {
        tree.innerHTML = '';
        const W = Math.max(300, leaves(root) * 72), H = depth(root) * 84;
        tree.style.width = W + 'px'; tree.style.height = H + 'px';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('width', W); svg.setAttribute('height', H);
        tree.appendChild(svg);
        let li = 0;
        (function place(n, dep) {
          if (n.kids) { place(n.kids[0], dep + 1); place(n.kids[1], dep + 1); n.x = (n.kids[0].x + n.kids[1].x) / 2; }
          else { n.x = (li++ + .5) * (W / leaves(root)); }
          n.y = 40 + dep * 84;
        })(root, 0);
        (function drawN(n) {
          if (n.kids) n.kids.forEach(k => { const l = document.createElementNS('http://www.w3.org/2000/svg', 'line'); l.setAttribute('x1', n.x); l.setAttribute('y1', n.y); l.setAttribute('x2', k.x); l.setAttribute('y2', k.y); l.setAttribute('stroke', '#8b5e3c'); l.setAttribute('stroke-width', 5); l.setAttribute('stroke-linecap', 'round'); svg.appendChild(l); drawN(k); });
          const pr = isPrime(n.v);
          const el2 = h('div', { class: 'tnode ' + (pr ? 'prime' : n.kids ? '' : 'comp'), style: { left: n.x + 'px', top: n.y + 'px' }, onclick: () => clickNode(n) }, n.v);
          tree.appendChild(el2);
        })(root);
      }
      function clickNode(n) {
        if (n.kids) return;
        if (isPrime(n.v)) { toast(`${n.v} 是質數，不能再拆了 ✨`); return; }
        selNode = n; Sfx.play('click');
        menu.innerHTML = '';
        menu.appendChild(h('b', { style: { alignSelf: 'center' } }, `${n.v} = `));
        factorsOf(n.v).filter(f => f > 1 && f * f <= n.v).forEach(a => menu.appendChild(h('button', { class: 'chip', onclick: () => split(n, a, n.v / a) }, `${a} × ${n.v / a}`)));
      }
      function split(n, a, b) {
        n.kids = [{ v: a, kids: null }, { v: b, kids: null }]; menu.innerHTML = ''; Sfx.play('pop'); render();
        const all = []; (function col(x) { if (x.kids) x.kids.forEach(col); else all.push(x.v); })(root);
        if (all.every(isPrime)) finishTree(all.sort((x, y) => x - y));
      }
      function finishTree(ps) {
        Sfx.play('good');
        after.appendChild(Q('樹長好了！所以 ' + N + ' 的質因數分解是？'));
        const right = ps.join(' × ');
        const wrongs = new Set();
        // 錯誤選項：把兩個質數合成合數、少一個質數、多一個質數
        if (ps.length >= 3) wrongs.add([ps[0] * ps[1], ...ps.slice(2)].join(' × '));
        wrongs.add(ps.slice(1).join(' × ') || '1');
        wrongs.add([...ps, ps[ps.length - 1]].sort((a, b) => a - b).join(' × '));
        if (wrongs.size < 3) wrongs.add([1, ...ps].join(' × '));
        mcqShuffled(after, `${N} = ${right}`, [...wrongs].filter(w => w !== right).slice(0, 3).map(w => `${N} = ${w}`), done,
          `把所有質數葉子乘起來：<b>${N} = ${right}</b>。合數（像 4、6、9）還能再拆，不能放在質因數分解裡；1 也不行！`);
        after.scrollIntoView({ behavior: 'smooth' });
      }
      render();
    })(el, api);
  }
};

/* 2d 短除法階梯（一個數） */
GAMES['2d'] = {
  concept: `<h3>🪜 質因數分解：短除法</h3>
  每一步都用一個<b>質數</b>去除，把商寫在下面，一直除到<b>商是質數</b>為止。
  <div class="ex" style="font-family:monospace;font-size:17px;line-height:1.5">2 | 60<br>2 | 30<br>3 | 15<br>&nbsp;&nbsp;&nbsp;&nbsp;5<br>→ 60 = 2 × 2 × 3 × 5</div>
  💡 從最小的質數 2 開始試，除不盡就換 3、5、7……<br>答案 = <b>左邊所有的除數 × 最下面的商</b>`,
  play: (el, api) => {
    const d = deck([60, 72, 84, 90, 96, 108, 126, 132, 150, 168, 180, 210]);
    rounds(3, () => (box, done) => {
      const N = d(); let cur = N, mistakes = 0;
      const divs = [];
      box.appendChild(Q(`用短除法把 <b>${N}</b> 做質因數分解`, '點右邊的質數當除數，除不盡會被彈回來喔！'));
      const ladder = h('div', { class: 'ladder' });
      const status = h('div', { style: { fontWeight: 700, minHeight: '24px' } });
      const pb = h('div', { class: 'prime-btns' });
      [2, 3, 5, 7, 11, 13].forEach(p => pb.appendChild(h('button', { class: 'btn yellow', onclick: e => divide(p, e.currentTarget) }, p)));
      const after = h('div');
      box.append(h('div', { class: 'ladder-zone' }, ladder, h('div', { class: 'ladder-ctrl' }, h('b', null, '選一個質數來除：'), pb, status)), after);
      function render() {
        ladder.innerHTML = '';
        divs.forEach((p, i) => { const v = N / divs.slice(0, i).reduce((a, b) => a * b, 1); ladder.appendChild(h('div', { class: 'lrow' }, h('span', { class: 'ld' }, p), h('span', { class: 'lv' }, v))); });
        ladder.appendChild(h('div', { class: 'lrow last' }, h('span', { class: 'ld' }, '.'), h('span', { class: 'lv' }, cur)));
      }
      function divide(p, b) {
        if (isPrime(cur)) return;
        if (cur % p) { mistakes++; shakeEl(b); Sfx.play('bad'); status.innerHTML = `<span class="leftover">${cur} ÷ ${p} 除不盡喔！</span>`; return; }
        divs.push(p); cur /= p; Sfx.play('pop'); render();
        status.textContent = `${cur * p} ÷ ${p} = ${cur}`;
        if (isPrime(cur)) {
          status.innerHTML = `商 <b>${cur}</b> 是質數，停！🛑`;
          $$('button', pb).forEach(x => x.disabled = true);
          const right = [...divs, cur].sort((a, b) => a - b);
          after.appendChild(Q('看著你的短除法，' + N + ' 的質因數分解是？'));
          const wr = [[...divs].join(' × '), [divs[0] * divs[1], ...divs.slice(2), cur].join(' × '), [...right, 2].sort((a, b) => a - b).join(' × ')];
          mcqShuffled(after, `${N} = ${right.join(' × ')}`, [...new Set(wr)].filter(w => w !== right.join(' × ')).map(w => `${N} = ${w}`), (okC, ex) => done(okC && mistakes <= 2, ex + (mistakes > 2 ? `<br>（除不盡的失誤 ${mistakes} 次，下次先想想能不能整除！）` : '')),
            `左邊的除數 ${divs.join('、')} 再乘上最下面的商 ${cur}：<b>${N} = ${right.join(' × ')}</b>`);
          after.scrollIntoView({ behavior: 'smooth' });
        }
      }
      render();
    })(el, api);
  }
};

/* 2e 因數鍊金台 */
GAMES['2e'] = {
  concept: `<h3>⚗️ 用質因數組合出所有因數</h3>
  一個數的每個因數，都是它的質因數<b>挑一些出來相乘</b>得到的！
  <div class="ex">12 = 2 × 2 × 3<br>不挑 → 1　挑 2 → 2　挑 3 → 3　挑 2、2 → 4　挑 2、3 → 6　全挑 → 12<br>所以 12 的因數是 1、2、3、4、6、12</div>
  💡 反過來說：如果一個數用到「不在裡面的質數」或「比較多個同樣的質數」，它就<b>不是</b>因數。`,
  play: (el, api) => {
    const d = deck([12, 18, 20, 28, 30, 36, 40, 45]);
    rounds(3, (ri) => (box, done) => {
      const N = d(); const ps = primeFactors(N); const fs = factorsOf(N);
      const got = new Set(); const sel = new Set();
      box.appendChild(Q(`${N} = ${ps.join(' × ')}　點寶石挑出幾顆，相乘就得到一個因數！`, `把 ${N} 的 ${fs.length} 個因數全部煉出來（一顆都不挑 = 1）`));
      const gemRow = h('div', { class: 'gem-row', style: { justifyContent: 'center' } });
      const prod = h('div', { style: { textAlign: 'center', fontSize: '22px', fontWeight: 900, margin: '10px 0' } });
      ps.forEach((p, i) => gemRow.appendChild(gem(p, { onclick: e => { const g = e.currentTarget; sel.has(i) ? sel.delete(i) : sel.add(i); g.classList.toggle('sel'); Sfx.play('click'); upd(); } })));
      const slots = h('div', { class: 'row center' });
      fs.forEach(() => slots.appendChild(h('div', { class: 'slot', style: { minWidth: '56px' } }, '？')));
      const brew = h('button', { class: 'btn pink' }, '⚗️ 煉出因數！');
      box.append(gemRow, prod, h('div', { class: 'row center' }, brew), h('div', { class: 'sect-title', style: { justifyContent: 'center', marginTop: '14px' } }, '因數收集冊'), slots);
      function val() { let v = 1; sel.forEach(i => v *= ps[i]); return v; }
      function upd() { const s = [...sel].map(i => ps[i]); prod.innerHTML = s.length ? `${s.join(' × ')} = <span style="color:#d9618a">${val()}</span>` : '（一顆都不挑）= <span style="color:#d9618a">1</span>'; }
      upd();
      brew.onclick = () => {
        const v = val();
        if (got.has(v)) { toast(`${v} 已經收集過了！試試別的組合`); return; }
        got.add(v); Sfx.play('good');
        const sorted = [...got].sort((a, b) => a - b);
        $$('.slot', slots).forEach((s, i) => { if (sorted[i] != null) { s.textContent = sorted[i]; s.classList.add('fill'); } });
        sel.clear(); $$('.gem', gemRow).forEach(g => g.classList.remove('sel')); upd();
        if (got.size === fs.length) {
          brew.disabled = true;
          // 檢驗題
          const M = pick([60, 84, 90, 126, 140, 150]); const mp = primeFactors(M);
          const sub = shuffle(mp).slice(0, ri === 0 ? 2 : 3); const right = sub.reduce((a, b) => a * b, 1);
          const wrongs = new Set();
          const bad1 = [...mp.filter(p => p !== 7 && p !== 11), 7].reduce((a, b) => a * b, 1); // 用到額外的 7
          const extra = mp.includes(7) ? 11 : 7;
          wrongs.add(mp[0] * extra); wrongs.add(mp[0] ** (mp.filter(p => p === mp[0]).length + 1));
          wrongs.add(mp[mp.length - 1] * extra);
          if (bad1 && M % bad1) wrongs.add(bad1);
          const w = [...wrongs].filter(x => M % x !== 0 && x !== right).slice(0, 3);
          const q2 = h('div', { style: { marginTop: '16px' } }); box.appendChild(q2);
          q2.appendChild(Q(`收集完成！挑戰題：<b>${M} = ${mp.join(' × ')}</b>，下面哪一個<b>是</b> ${M} 的因數？`));
          mcqShuffled(q2, right, w, done, `${right} = ${primeFactors(right).join(' × ')}，這些質數都能從 ${M} 的質因數中挑出來，所以是因數。其他選項用到了 ${M} 沒有（或不夠多）的質數。`);
          q2.scrollIntoView({ behavior: 'smooth' });
        }
      };
    })(el, api);
  }
};
