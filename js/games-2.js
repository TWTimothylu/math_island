/* ============ 島 3：公因數海灣 ============ */

/* 3a 因數文氏圈 */
GAMES['3a'] = {
  concept: `<h3>⭕ 公因數與最大公因數</h3>
  兩個數<b>共同的因數</b>叫做<b>公因數</b>；公因數裡面<b>最大的</b>，叫做<b>最大公因數</b>。
  <div class="ex">12 的因數：1、2、3、4、6、12<br>18 的因數：1、2、3、6、9、18<br>公因數：1、2、3、6 → 最大公因數是 <b>6</b></div>
  💡 1 一定是任何兩個數的公因數。<br>玩法：先點數字，再點它屬於文氏圈的哪一區。`,
  play: (el, api) => {
    const d = deck([[12, 18], [16, 24], [18, 27], [20, 30], [24, 36], [15, 25], [12, 20], [18, 24]]);
    rounds(2, () => (box, done) => {
      const [A, B] = d(); const fa = factorsOf(A), fb = factorsOf(B);
      const all = shuffle([...new Set([...fa, ...fb])]);
      let sel = null, mistakes = 0, left = all.length;
      box.appendChild(Q(`把 <b style="color:#d9618a">${A}</b> 和 <b style="color:#2f86c0">${B}</b> 的因數放進文氏圈`, '中間重疊的地方 = 兩個數共同的因數（公因數）'));
      const chips = h('div', { class: 'row center', style: { marginBottom: '12px' } });
      all.forEach(n => chips.appendChild(h('button', { class: 'chip', onclick: e => { sel = n; Sfx.play('click'); $$('.chip', chips).forEach(c => c.classList.toggle('sel', c === e.currentTarget)); } }, n)));
      const venn = h('div', { class: 'venn' },
        h('div', { class: 'ring a' }), h('div', { class: 'ring b' }),
        h('div', { class: 'lbl', style: { left: '12%' } }, `只是 ${A} 的因數`), h('div', { class: 'lbl', style: { left: '50%', transform: 'translateX(-50%)', top: '-26px' } }, '公因數'), h('div', { class: 'lbl', style: { right: '12%' } }, `只是 ${B} 的因數`));
      const zones = { a: h('div', { class: 'zone za' }), c: h('div', { class: 'zone zc' }), b: h('div', { class: 'zone zb' }) };
      Object.entries(zones).forEach(([k, z]) => { z.onclick = () => put(k, z); venn.appendChild(z); });
      box.append(chips, h('div', { style: { height: '30px' } }), venn);
      const after = h('div'); box.appendChild(after);
      function put(k, z) {
        if (sel == null) { toast('先點一個數字喔！'); return; }
        const n = sel, inA = A % n === 0, inB = B % n === 0;
        const ans = inA && inB ? 'c' : inA ? 'a' : 'b';
        const chip = $$('.chip', chips).find(c => c.classList.contains('sel'));
        if (k !== ans) { mistakes++; shakeEl(z); Sfx.play('bad'); toast(`${n} ${inA ? '是' : '不是'} ${A} 的因數，${inB ? '是' : '不是'} ${B} 的因數`, 'bad'); return; }
        Sfx.play('pop'); chip.remove(); sel = null; z.appendChild(h('span', null, n)); left--;
        if (!left) {
          const g = gcd(A, B);
          after.appendChild(Q(`公因數有 ${fa.filter(x => B % x === 0).join('、')}。<b>最大公因數</b>是多少？`));
          after.appendChild(h('div', { class: 'np-wrap' }, numpad({
            onSubmit: v => {
              $$('span', zones.c).forEach(s => { if (+s.textContent === g) s.classList.add('gcd'); });
              done(v === g && mistakes <= 2, `${A} 和 ${B} 的公因數：${fa.filter(x => B % x === 0).join('、')}<br>最大的是 <b>${g}</b>，記作「${A} 和 ${B} 的最大公因數是 ${g}」` + (mistakes > 2 ? `（分類失誤 ${mistakes} 次）` : ''));
            }
          })));
          after.scrollIntoView({ behavior: 'smooth' });
        }
      }
    })(el, api);
  }
};

/* 3b 寶石配對：質因數找最大公因數 */
GAMES['3b'] = {
  concept: `<h3>💎 用質因數找最大公因數</h3>
  先把兩個數都做質因數分解，再把<b>兩邊都有的質數</b>配成一對，<b>配對到的質數相乘</b>就是最大公因數！
  <div class="ex">24 = 2 × 2 × 2 × 3<br>36 = 2 × 2 × 3 × 3<br>共同的：2、2、3 → 最大公因數 = 2 × 2 × 3 = <b>12</b></div>
  玩法：點上面一顆寶石，再點下面<b>一樣的</b>寶石，就能配成一對。`,
  play: (el, api) => {
    const d = deck([[12, 18], [24, 36], [30, 45], [28, 42], [36, 60], [40, 60], [18, 30], [48, 72], [20, 50]]);
    rounds(3, () => (box, done) => {
      const [A, B] = d(); const pa = primeFactors(A), pb = primeFactors(B);
      let selA = null, mistakes = 0;
      box.appendChild(Q('把兩個數<b>共同的質因數寶石</b>配成一對！', '全部配完後按「配對完成」'));
      const rowA = h('div', { class: 'gem-row' }), rowB = h('div', { class: 'gem-row' }), rowC = h('div', { class: 'gem-row', style: { background: '#fff8d6', borderColor: '#ffd34d' } });
      pa.forEach(p => rowA.appendChild(gem(p, { onclick: e => { const g = e.currentTarget; $$('.gem', rowA).forEach(x => x.classList.remove('sel')); selA = g; g.classList.add('sel'); Sfx.play('click'); } })));
      pb.forEach(p => rowB.appendChild(gem(p, { onclick: e => pair(e.currentTarget) })));
      box.append(h('div', { class: 'row', style: { marginBottom: '8px' } }, h('span', { class: 'gem-label', style: { color: '#d9618a' } }, A + ' ='), rowA),
        h('div', { class: 'row', style: { marginBottom: '8px' } }, h('span', { class: 'gem-label', style: { color: '#2f86c0' } }, B + ' ='), rowB),
        h('div', { class: 'row', style: { marginBottom: '10px' } }, h('span', { class: 'gem-label' }, '共同的'), rowC));
      const okBtn = h('button', { class: 'btn', onclick: check }, '配對完成 ✔');
      const after = h('div');
      box.append(h('div', { class: 'row center' }, okBtn), after);
      function pair(gb) {
        if (!selA) { toast('先點上面那一排的寶石'); return; }
        if (selA.dataset.p !== gb.dataset.p) { mistakes++; shakeEl(gb); Sfx.play('bad'); toast('要選一樣的質數才能配對喔', 'bad'); return; }
        selA.classList.add('used'); selA.classList.remove('sel'); gb.classList.add('used'); Sfx.play('good');
        rowC.appendChild(gem(+gb.dataset.p, { sm: false }));
        selA = null;
      }
      function check() {
        const cnt = row => { const m = {}; $$('.gem:not(.used)', row).forEach(g => m[g.dataset.p] = (m[g.dataset.p] || 0) + 1); return m; };
        const ca = cnt(rowA), cb = cnt(rowB);
        if (Object.keys(ca).some(p => cb[p])) { mistakes++; Sfx.play('bad'); toast('還有一樣的寶石可以配對喔！再找找', 'bad'); return; }
        okBtn.disabled = true;
        const common = $$('.gem', rowC).map(g => +g.dataset.p);
        const g = gcd(A, B);
        after.appendChild(Q(`把共同的寶石乘起來：${common.length ? common.join(' × ') : '（沒有共同的質數）'} = ？`, `也就是 ${A} 和 ${B} 的最大公因數`));
        after.appendChild(h('div', { class: 'np-wrap' }, numpad({ onSubmit: v => done(v === g && mistakes <= 2, `共同的質因數：${common.join('、') || '無'}<br>最大公因數 = ${common.join(' × ') || '1'} = <b>${g}</b>`) })));
        after.scrollIntoView({ behavior: 'smooth' });
      }
    })(el, api);
  }
};

/* 3c / 4c 兩數短除法 */
function ladderTwo(mode) {
  const pairs = mode === 'gcd' ? [[24, 36], [18, 30], [28, 42], [36, 48], [30, 45], [40, 60], [32, 48], [54, 72], [42, 56]]
    : [[12, 18], [8, 12], [10, 15], [16, 24], [18, 24], [9, 15], [14, 21], [20, 30], [12, 16]];
  return (el, api) => {
    const d = deck(pairs);
    rounds(3, () => (box, done) => {
      const [A, B] = d(); let a = A, b = B, mistakes = 0, stopped = false;
      const rows = [];
      box.appendChild(Q(`用短除法處理 <b>${A}</b> 和 <b>${B}</b>，求${mode === 'gcd' ? '<b>最大公因數</b>' : '<b>最小公倍數</b>'}`, '每一步選一個能<b>同時整除兩個數</b>的質數；兩數<b>互質</b>（公因數只剩 1）時按「停！」'));
      const ladder = h('div', { class: 'ladder' });
      const status = h('div', { style: { fontWeight: 700, minHeight: '48px' } });
      const pb = h('div', { class: 'prime-btns' });
      [2, 3, 5, 7, 11, 13].forEach(p => pb.appendChild(h('button', { class: 'btn yellow', onclick: e => divide(p, e.currentTarget) }, p)));
      const stopBtn = h('button', { class: 'btn red', onclick: stop }, '🛑 互質了，停！');
      const after = h('div');
      box.append(h('div', { class: 'ladder-zone' }, ladder, h('div', { class: 'ladder-ctrl' }, h('b', null, '選一個質數：'), pb, stopBtn, status)), after);
      function render(hl) {
        ladder.innerHTML = '';
        rows.forEach(([p, x, y]) => ladder.appendChild(h('div', { class: 'lrow' }, h('span', { class: 'ld', style: hl ? { background: '#fff3b0', borderRadius: '6px' } : null }, p), h('span', { class: 'lv' }, h('span', null, x), h('span', null, y)))));
        const lst = h('div', { class: 'lrow last' }, h('span', { class: 'ld' }, '.'), h('span', { class: 'lv' }, h('span', null, a), h('span', null, b)));
        if (hl === 'lcm') lst.querySelector('.lv').style.background = '#fff3b0';
        ladder.appendChild(lst);
      }
      function divide(p, btn) {
        if (stopped) return;
        const ia = a % p === 0, ib = b % p === 0;
        if (!(ia && ib)) { mistakes++; shakeEl(btn); Sfx.play('bad'); status.innerHTML = `<span class="leftover">${p} 沒辦法同時整除 ${a} 和 ${b}（${ia ? b : a} ÷ ${p} 除不盡）</span>`; return; }
        rows.push([p, a, b]); a /= p; b /= p; Sfx.play('pop'); status.textContent = `${a * p} ÷ ${p} = ${a}，${b * p} ÷ ${p} = ${b}`; render();
      }
      function stop() {
        if (stopped) return;
        const g = gcd(a, b);
        if (g !== 1) { mistakes++; Sfx.play('bad'); shakeEl(stopBtn); status.innerHTML = `<span class="leftover">${a} 和 ${b} 還有公因數 ${primeFactors(g)[0]}，還可以再除喔！</span>`; return; }
        stopped = true; Sfx.play('good');
        $$('button', pb).forEach(x => x.disabled = true); stopBtn.disabled = true;
        status.innerHTML = `${a} 和 ${b} 互質，停！✅`;
        const L = rows.map(r => r[0]);
        render(mode);
        if (mode === 'gcd') {
          const G = gcd(A, B);
          after.appendChild(Q(`最大公因數 = <b>左邊所有除數相乘</b> = ${L.join(' × ')} = ？`));
          after.appendChild(h('div', { class: 'np-wrap' }, numpad({ onSubmit: v => done(v === G && mistakes <= 2, `${A} 和 ${B} 的最大公因數 = ${L.join(' × ')} = <b>${G}</b>` + (mistakes > 2 ? `（失誤 ${mistakes} 次）` : '')) })));
        } else {
          const Lc = lcm(A, B);
          after.appendChild(Q(`最小公倍數 = <b>左邊所有除數 × 最下面的兩個數</b>（像一個 L 形）= ${L.join(' × ')} × ${a} × ${b} = ？`));
          after.appendChild(h('div', { class: 'np-wrap' }, numpad({ onSubmit: v => done(v === Lc && mistakes <= 2, `${A} 和 ${B} 的最小公倍數 = ${L.join(' × ')} × ${a} × ${b} = <b>${Lc}</b>` + (mistakes > 2 ? `（失誤 ${mistakes} 次）` : '')) })));
        }
        after.scrollIntoView({ behavior: 'smooth' });
      }
      render();
    })(el, api);
  };
}
GAMES['3c'] = {
  concept: `<h3>🗼 用短除法找最大公因數</h3>
  把兩個數並排，每次用一個<b>能同時整除兩數的質數</b>去除，直到兩個商<b>互質</b>為止。
  <div class="ex" style="font-family:monospace;font-size:17px;line-height:1.5">2 | 24　36<br>2 | 12　18<br>3 | &nbsp;6　&nbsp;9<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2　&nbsp;3　← 互質，停！</div>
  最大公因數 = <b>左邊的除數相乘</b> = 2 × 2 × 3 = 12`,
  play: ladderTwo('gcd')
};

/* 3d 互質小船 */
GAMES['3d'] = {
  concept: `<h3>⛵ 什麼是互質？</h3>
  如果兩個數的公因數<b>只有 1</b>（最大公因數是 1），就說這兩個數<b>互質</b>。
  <div class="ex">8 和 15：8 的因數 1、2、4、8；15 的因數 1、3、5、15 → 只有 1 是公因數 → <b>互質</b></div>
  💡 小發現：<br>・兩個<b>不同的質數</b>一定互質（例如 5 和 7）<br>・<b>相鄰的兩個數</b>一定互質（例如 14 和 15）<br>・<b>1 和任何數</b>都互質<br>・兩個合數也可能互質（例如 8 和 9）！`,
  play: (el, api) => {
    const yes = shuffle([[8, 15], [9, 16], [4, 9], [10, 21], [14, 15], [25, 36], [1, 12], [7, 11], [20, 21], [27, 32], [12, 35], [16, 21]]);
    const no = shuffle([[12, 18], [14, 21], [15, 25], [6, 9], [22, 33], [26, 39], [10, 25], [9, 27], [16, 24], [21, 35], [34, 51], [4, 10]]);
    const qs = shuffle([...yes.slice(0, 4), ...no.slice(0, 4)]);
    rounds(8, i => (box, done) => {
      const [a, b] = qs[i]; const g = gcd(a, b);
      box.appendChild(h('div', { class: 'tf-card' }, h('div', { style: { fontSize: '44px' } }, '⛵'), `${a} 和 ${b}`, h('div', { style: { fontSize: '16px', color: '#8a735d' } }, '這兩個數互質嗎？')));
      const btns = h('div', { class: 'tf-btns' });
      const ex = `${a} 的因數：${factorsOf(a).join('、')}<br>${b} 的因數：${factorsOf(b).join('、')}<br>` + (g === 1 ? '公因數只有 1 → <b>互質</b>' : `都有因數 ${g} → 最大公因數是 ${g}，<b>不互質</b>`);
      const go = v => { $$('.btn', btns).forEach(x => x.disabled = true); done(v === (g === 1), ex); };
      btns.append(h('button', { class: 'btn big', onclick: () => go(true) }, '🤝 互質'), h('button', { class: 'btn big red', onclick: () => go(false) }, '🙅 不互質'));
      box.appendChild(btns);
    })(el, api);
  }
};

/* ============ 島 4：公倍數雪山 ============ */

/* 4a 青蛙兔子跳跳 */
GAMES['4a'] = {
  concept: `<h3>🐸 公倍數與最小公倍數</h3>
  兩個數<b>共同的倍數</b>叫做<b>公倍數</b>；公倍數中<b>最小的</b>（0 除外），叫做<b>最小公倍數</b>。
  <div class="ex">青蛙每次跳 4 格：4、8、<b>12</b>、16、20、<b>24</b>…<br>兔子每次跳 6 格：6、<b>12</b>、18、<b>24</b>…<br>一起踩到的 12、24… 是公倍數，最小公倍數是 <b>12</b></div>
  💡 公倍數有無限多個，而且都是<b>最小公倍數的倍數</b>（12、24、36…）。`,
  play: (el, api) => {
    const d = deck([[4, 6], [3, 5], [6, 8], [4, 10], [6, 9], [2, 7], [8, 12], [3, 4], [5, 6]]);
    rounds(3, () => (box, done) => {
      const [a, b] = d(); const L = lcm(a, b); const M = 2 * L + Math.max(a, b);
      const SP = 30, W = (M + 1) * SP + 40;
      let fp = 0, rp = 0, phase = 1, mistakes = 0;
      box.appendChild(Q(`🐸 青蛙每次跳 <b>${a}</b> 格，🐰 兔子每次跳 <b>${b}</b> 格，都從 0 出發。`, '按按鈕讓牠們跳，找出牠們<b>一起踩到</b>的數字，再點數線上的那個數字！'));
      const ask = h('div', { class: 'q', style: { fontSize: '18px', color: '#2f86c0' } });
      const wrap = h('div', { class: 'nl-wrap' }); const nl = h('div', { class: 'nl', style: { width: W + 'px' } }); wrap.appendChild(nl);
      nl.appendChild(h('div', { class: 'axis', style: { width: W + 'px' } }));
      const X = n => 20 + n * SP + SP / 2;
      for (let n = 0; n <= M; n++) nl.appendChild(h('div', { class: 'tick', style: { left: X(n) + 'px' }, onclick: e => answer(n, e.currentTarget) }, n));
      const frog = h('div', { class: 'critter', style: { left: X(0) + 'px', top: '62px' } }, '🐸');
      const bun = h('div', { class: 'critter', style: { left: X(0) + 'px', top: '118px' } }, '🐰');
      nl.append(frog, bun);
      const jf = h('button', { class: 'btn', onclick: () => jump('f') }, `🐸 跳 +${a}`), jr = h('button', { class: 'btn pink', onclick: () => jump('r') }, `🐰 跳 +${b}`);
      box.append(ask, wrap, h('div', { class: 'row center', style: { marginTop: '12px' } }, jf, jr));
      function setAsk() { ask.innerHTML = phase === 1 ? '❓ 牠們<b>第一次</b>一起踩到的數字（0 除外）是？點數線上的數字' : '❓ 太好了！那<b>第二次</b>一起踩到的數字是？'; }
      setAsk();
      function jump(w) {
        Sfx.play('pop');
        if (w === 'f') { if (fp + a > M) { toast('跳到盡頭了'); return; } fp += a; frog.style.left = X(fp) + 'px'; nl.appendChild(h('div', { class: 'mark', style: { left: X(fp) + 'px', top: '75px', background: '#40c057' } })); }
        else { if (rp + b > M) { toast('跳到盡頭了'); return; } rp += b; bun.style.left = X(rp) + 'px'; nl.appendChild(h('div', { class: 'mark', style: { left: X(rp) + 'px', top: '128px', background: '#ff8fb1' } })); }
        const cur = w === 'f' ? fp : rp; wrap.scrollTo({ left: X(cur) - wrap.clientWidth / 2, behavior: 'smooth' });
      }
      function answer(n, t) {
        if (phase > 2) return;
        const want = phase * L;
        if (n === want) {
          t.classList.add('ok'); Sfx.play('good');
          if (phase === 1) { phase = 2; setAsk(); }
          else { phase = 3; done(mistakes <= 1, `${a} 的倍數：${[1, 2, 3, 4, 5, 6].map(k => k * a).filter(x => x <= M).join('、')}…<br>${b} 的倍數：${[1, 2, 3, 4, 5, 6].map(k => k * b).filter(x => x <= M).join('、')}…<br>最小公倍數是 <b>${L}</b>，下一個公倍數是 ${2 * L}（= ${L} × 2）`); }
        } else {
          mistakes++; shakeEl(t); Sfx.play('bad');
          const fm = n % a === 0, rm = n % b === 0;
          toast(n === 0 ? '0 不算喔！' : `${n}：${fm ? '青蛙會踩到' : '青蛙踩不到'}、${rm ? '兔子會踩到' : '兔子踩不到'}${fm && rm ? '，但不是第' + (phase === 1 ? '一' : '二') + '次喔' : ''}`, 'bad');
          if (mistakes >= 3) { phase = 3; done(false, `答案是 ${L} 和 ${2 * L}。${a} 和 ${b} 的最小公倍數是 <b>${L}</b>`); }
        }
      }
    })(el, api);
  }
};

/* 4b 寶石合體：質因數找最小公倍數 */
GAMES['4b'] = {
  concept: `<h3>🔮 用質因數找最小公倍數</h3>
  最小公倍數要「<b>包含</b>」兩個數的所有質因數。做法：<br>
  每一種質數，看兩個數中<b>誰的數量比較多</b>，就拿那麼多個。
  <div class="ex">12 = 2 × 2 × 3<br>18 = 2 × 3 × 3<br>2 最多有 2 個、3 最多有 2 個 → 2 × 2 × 3 × 3 = <b>36</b></div>
  💡 也可以想成：<b>共同的寶石只放一次</b>，再加上各自剩下的寶石。`,
  play: (el, api) => {
    const d = deck([[12, 18], [8, 12], [10, 15], [6, 20], [9, 12], [14, 21], [15, 20], [12, 30], [8, 20]]);
    rounds(3, () => (box, done) => {
      const [A, B] = d(); const pa = primeFactors(A), pb = primeFactors(B); const L = lcm(A, B);
      const pot = []; let mistakes = 0, over = false;
      box.appendChild(Q(`做出能同時被 <b>${A}</b> 和 <b>${B}</b> 整除、而且<b>最小</b>的合體寶石！`, '點下方的寶石放進合體鍋，點鍋裡的寶石可以拿出來'));
      const rA = h('div', { class: 'gem-row' }), rB = h('div', { class: 'gem-row' });
      pa.forEach(p => rA.appendChild(gem(p, { sm: true }))); pb.forEach(p => rB.appendChild(gem(p, { sm: true })));
      const potEl = h('div', { class: 'gem-row', style: { background: '#f3e8ff', borderColor: '#b197fc', justifyContent: 'center' } });
      const val = h('div', { style: { textAlign: 'center', fontSize: '22px', fontWeight: 900, margin: '8px 0' } });
      const pal = h('div', { class: 'row center' });
      [...new Set([...pa, ...pb])].sort((x, y) => x - y).forEach(p => pal.appendChild(gem(p, { onclick: () => { if (over) return; pot.push(p); pot.sort((x, y) => x - y); Sfx.play('click'); render(); } })));
      const fuse = h('button', { class: 'btn pink', onclick: check }, '🔮 合體！');
      box.append(h('div', { class: 'row' }, h('span', { class: 'gem-label' }, A + ' ='), rA), h('div', { class: 'row', style: { margin: '8px 0' } }, h('span', { class: 'gem-label' }, B + ' ='), rB),
        h('div', { class: 'sect-title' }, '🍲 合體鍋'), potEl, val, h('div', { class: 'sect-title' }, '寶石材料'), pal, h('div', { class: 'row center', style: { marginTop: '12px' } }, fuse));
      function render() {
        potEl.innerHTML = '';
        pot.forEach((p, i) => potEl.appendChild(gem(p, { onclick: () => { if (over) return; pot.splice(i, 1); Sfx.play('click'); render(); } })));
        val.textContent = pot.length ? `${pot.join(' × ')} = ${pot.reduce((x, y) => x * y, 1)}` : '鍋子是空的';
      }
      render();
      function check() {
        const need = {}; [...new Set([...pa, ...pb])].forEach(p => need[p] = Math.max(pa.filter(x => x === p).length, pb.filter(x => x === p).length));
        const has = {}; pot.forEach(p => has[p] = (has[p] || 0) + 1);
        const bad = Object.keys(need).find(p => (has[p] || 0) !== need[p]);
        const ex = `${A} = ${pa.join(' × ')}，${B} = ${pb.join(' × ')}<br>每種質數取比較多的那邊 → 最小公倍數 = ${primeFactors(L).join(' × ')} = <b>${L}</b>`;
        if (!bad) { over = true; return done(mistakes <= 1, ex); }
        mistakes++; Sfx.play('bad'); shakeEl(potEl);
        const ca = pa.filter(x => x == bad).length, cb = pb.filter(x => x == bad).length, ch = has[bad] || 0;
        toast(`寶石 ${bad}：${A} 有 ${ca} 個、${B} 有 ${cb} 個，鍋裡有 ${ch} 個 → ${ch < Math.max(ca, cb) ? '不夠，沒辦法被整除' : '太多了，就不是「最小」'}`, 'bad');
        if (mistakes >= 3) { over = true; done(false, ex); }
      }
    })(el, api);
  }
};

GAMES['4c'] = {
  concept: `<h3>🏔️ 用短除法找最小公倍數</h3>
  做法跟找最大公因數一樣，除到兩個商<b>互質</b>為止。不同的是最後要乘上<b>最下面的兩個商</b>！
  <div class="ex" style="font-family:monospace;font-size:17px;line-height:1.5">2 | 12　18<br>3 | &nbsp;6　&nbsp;9<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2　&nbsp;3</div>
  最小公倍數 = 左邊 × 下面（像英文字母 <b>L</b>）= 2 × 3 × 2 × 3 = <b>36</b><br>
  最大公因數 = 只乘左邊 = 2 × 3 = 6`,
  play: ladderTwo('lcm')
};

/* 4d 公倍數列車 */
GAMES['4d'] = {
  concept: `<h3>🚂 所有的公倍數</h3>
  找到最小公倍數後，<b>它的倍數就是所有的公倍數</b>！
  <div class="ex">4 和 6 的最小公倍數是 12 → 公倍數：12、24、36、48…</div>
  💡 如果兩個數<b>互質</b>，最小公倍數就是<b>兩數相乘</b>。<br>例如 4 和 9 互質 → 最小公倍數 = 4 × 9 = 36。<br>
  玩法：把所有是公倍數的車廂都點起來，再按「發車」。`,
  play: (el, api) => {
    const d = deck([[4, 6], [6, 9], [3, 5], [4, 7], [8, 12], [6, 10], [5, 6], [9, 12], [4, 9], [6, 8]]);
    rounds(4, () => (box, done) => {
      const [a, b] = d(); const L = lcm(a, b);
      const rights = []; for (let m = L; m <= 100 && rights.length < 4; m += L) rights.push(m);
      const distract = new Set();
      for (let m = a; m <= 100; m += a) if (m % L) distract.add(m);
      for (let m = b; m <= 100; m += b) if (m % L) distract.add(m);
      const wr = shuffle([...distract]).slice(0, 7 - rights.length);
      const cars = shuffle([...rights, ...wr]);
      const sel = new Set();
      box.appendChild(Q(`哪些車廂是 <b>${a}</b> 和 <b>${b}</b> 的<b>公倍數</b>？全部點出來！`, gcd(a, b) === 1 ? `小提示：${a} 和 ${b} 互質喔` : '小提示：先想想最小公倍數是多少'));
      const train = h('div', { class: 'row center', style: { gap: '6px' } }, h('span', { style: { fontSize: '40px' } }, '🚂'));
      cars.forEach(n => train.appendChild(h('button', { class: 'chip', style: { minWidth: '62px', minHeight: '54px', fontSize: '22px' }, onclick: e => { sel.has(n) ? sel.delete(n) : sel.add(n); e.currentTarget.classList.toggle('sel'); Sfx.play('click'); } }, n)));
      box.append(train, h('div', { class: 'row center', style: { marginTop: '16px' } }, h('button', {
        class: 'btn', onclick: e => {
          e.currentTarget.disabled = true;
          const okA = rights.every(r => sel.has(r)) && [...sel].every(s => s % L === 0);
          done(okA, `${a} 和 ${b} 的最小公倍數是 <b>${L}</b>${gcd(a, b) === 1 ? `（互質，所以 = ${a} × ${b}）` : ''}<br>公倍數就是 ${L} 的倍數：<b>${rights.join('、')}</b>…`);
        }
      }, '🚦 發車！')));
    })(el, api);
  }
};
