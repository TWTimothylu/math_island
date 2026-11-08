/* ============ 島 5：應用港口 ============ */
const COPRIME_M = [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [3, 7], [2, 7], [5, 6], [4, 7]];

/* 5a 禮物分裝站 */
GAMES['5a'] = {
  concept: `<h3>🎁 分裝問題用「最大公因數」</h3>
  兩種東西要<b>平分</b>裝袋，每袋一樣多、而且都<b>分完沒剩</b> → 袋數必須同時是兩個數量的<b>因數</b>（公因數）。<br>
  「<b>最多</b>可以裝幾袋」→ 找<b>最大公因數</b>！
  <div class="ex">24 顆糖、36 塊餅乾 → 最大公因數 12 → 最多 12 袋，每袋 2 顆糖、3 塊餅乾</div>
  ⚠️ 進階：如果「糖果<b>剩</b> 2 顆、餅乾<b>少</b> 3 塊」，要先把多的<b>拿掉</b>、少的<b>補上</b>，再找最大公因數。`,
  play: (el, api) => {
    rounds(3, i => (box, done) => {
      const variant = i === 2;
      const g = pick(variant ? [6, 8, 9, 12] : [4, 6, 8, 9, 12]); const [m1, m2] = pick(COPRIME_M);
      const A0 = g * m1, B0 = g * m2;
      const r1 = variant ? ri(1, g - 2) : 0, r2 = variant ? ri(1, g - 2) : 0;
      const a = A0 + r1, b = B0 - r2;
      box.appendChild(h('div', { class: 'story', html: variant ?
        `🍬 有 <span class="em">${a}</span> 顆糖果、🍪 <span class="em">${b}</span> 塊餅乾，要平分裝成禮物袋（每袋糖果一樣多、餅乾也一樣多）。<br>結果<b>糖果剩下 ${r1} 顆</b>，<b>餅乾還少 ${r2} 塊</b>才夠分。最多裝了幾袋？` :
        `🍬 有 <span class="em">${a}</span> 顆糖果、🍪 <span class="em">${b}</span> 塊餅乾，要平分裝成禮物袋，每袋的糖果一樣多、餅乾也一樣多，而且<b>全部分完</b>。<br>最多可以裝幾袋？` }));
      const slider = h('input', { type: 'range', min: 1, max: Math.min(a, b, 30), value: 1 });
      const kl = h('b', null, 1);
      const bags = h('div', { class: 'bags' }); const info = h('div', { style: { textAlign: 'center', fontWeight: 900, margin: '8px 0', minHeight: '54px' } });
      box.append(h('div', { class: 'slider-row' }, '試試看裝 ', slider, kl, ' 袋'), bags, info);
      function draw() {
        const k = +slider.value; kl.textContent = k;
        bags.innerHTML = '';
        const ca = Math.floor(a / k), ra = a % k, cb = Math.floor(b / k), rb = b % k, shortB = rb ? k - rb : 0;
        for (let j = 0; j < Math.min(k, 30); j++) bags.appendChild(h('div', { class: 'bag', style: { animation: 'none' } }, '🛍️', h('br'), `🍬${ca}`, h('br'), `🍪${variant ? (rb ? cb + 1 : cb) : cb}`));
        if (!variant) info.innerHTML = (ra || rb) ? `<span class="leftover">${ra ? `糖果剩 ${ra} 顆` : ''} ${rb ? `餅乾剩 ${rb} 塊` : ''} → 沒有分完 ✗</span>` : `✓ 剛好分完！每袋 ${ca} 顆糖、${cb} 塊餅乾`;
        else {
          const okA = ra === r1, okB = shortB === r2;
          info.innerHTML = `糖果每袋 ${ca} 顆，剩 ${ra} 顆 ${okA ? '✓' : '✗'}<br>餅乾每袋 ${rb ? cb + 1 : cb} 塊，${shortB ? `少 ${shortB} 塊` : '剛好'} ${okB ? '✓' : '✗'}` + (okA && okB ? '<br>✓ 跟題目說的一樣！' : '');
        }
      }
      slider.addEventListener('input', () => { Sfx.play('click'); draw(); }); draw();
      if (variant) box.appendChild(h('div', { class: 'row center' }, h('button', { class: 'btn small ghost', onclick: e => { e.currentTarget.replaceWith(h('div', { class: 'story', style: { background: '#fff8d6' }, html: `💡 糖果拿掉多的 ${r1} 顆 → ${A0} 顆；餅乾補上少的 ${r2} 塊 → ${B0} 塊。就變成「剛好分完」的問題了！` })); } }, '💡 看提示')));
      box.appendChild(h('div', { class: 'np-wrap' }, h('div', { class: 'np-label' }, '最多裝幾袋？'), numpad({
        onSubmit: v => done(v === g, variant ? `先調整：${a} − ${r1} = ${A0}，${b} + ${r2} = ${B0}<br>${A0} 和 ${B0} 的最大公因數是 <b>${g}</b> → 最多 ${g} 袋` :
          `${a} 和 ${b} 的最大公因數是 <b>${g}</b> → 最多裝 ${g} 袋，每袋 ${a / g} 顆糖、${b / g} 塊餅乾`)
      })));
    })(el, api);
  }
};

/* 5b 正方形地磚：大長方形切成最大正方形 */
GAMES['5b'] = {
  concept: `<h3>🟩 大長方形切成正方形</h3>
  把長方形切成<b>一樣大的正方形</b>而且<b>沒有剩</b>，正方形的邊長必須能<b>同時整除長和寬</b>。<br>
  要切成「<b>最大</b>的正方形」→ 邊長 = 長和寬的<b>最大公因數</b>！
  <div class="ex">長 18、寬 12 → 最大公因數 6 → 邊長 6 公分<br>可以切 (18 ÷ 6) × (12 ÷ 6) = 3 × 2 = <b>6 塊</b></div>`,
  play: (el, api) => {
    const d = deck([[18, 12], [24, 16], [30, 20], [24, 18], [40, 24], [25, 15], [28, 21], [36, 24]]);
    rounds(3, () => (box, done) => {
      const [W, H] = d(); const g = gcd(W, H);
      box.appendChild(h('div', { class: 'story', html: `🏠 一塊長 <span class="em">${W}</span> 公分、寬 <span class="em">${H}</span> 公分的長方形地板，要切成<b>大小一樣的正方形地磚</b>，而且不能有剩。<br>地磚邊長最大是幾公分？可以切成幾塊？` }));
      const cv = h('canvas', { class: 'cv', width: 640, height: 360 }); const ctx = cv.getContext('2d');
      const slider = h('input', { type: 'range', min: 1, max: Math.min(W, H), value: 1 }); const sl = h('b', null, 1);
      const info = h('div', { style: { textAlign: 'center', fontWeight: 900, minHeight: '27px' } });
      box.append(h('div', { class: 'slider-row' }, '地磚邊長 ', slider, sl, ' 公分'), cv, info);
      function draw() {
        const s = +slider.value; sl.textContent = s;
        const f = Math.min(580 / W, 300 / H), ox = (640 - W * f) / 2, oy = (360 - H * f) / 2;
        ctx.clearRect(0, 0, 640, 360);
        ctx.fillStyle = '#f1e3c8'; ctx.fillRect(ox, oy, W * f, H * f);
        const cols = Math.floor(W / s), rows = Math.floor(H / s);
        for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) {
          ctx.fillStyle = (x + y) % 2 ? '#8fd46a' : '#a9e283'; ctx.fillRect(ox + x * s * f + 1, oy + y * s * f + 1, s * f - 2, s * f - 2);
        }
        ctx.fillStyle = 'rgba(255,107,107,.45)';
        if (W % s) ctx.fillRect(ox + cols * s * f, oy, (W % s) * f, H * f);
        if (H % s) ctx.fillRect(ox, oy + rows * s * f, W * f, (H % s) * f);
        ctx.strokeStyle = '#4a3a2c'; ctx.lineWidth = 3; ctx.strokeRect(ox, oy, W * f, H * f);
        ctx.fillStyle = '#4a3a2c'; ctx.font = '700 16px Fredoka, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${W} 公分`, 320, oy - 8); ctx.save(); ctx.translate(ox - 12, 180); ctx.rotate(-Math.PI / 2); ctx.fillText(`${H} 公分`, 0, 0); ctx.restore();
        info.innerHTML = (W % s || H % s) ? `<span class="leftover">紅色部分切不完 ✗（${W % s ? `${W} ÷ ${s} 有餘數 ` : ''}${H % s ? `${H} ÷ ${s} 有餘數` : ''}）</span>` : `✓ 剛好切完：${cols} × ${rows} = ${cols * rows} 塊`;
      }
      slider.addEventListener('input', draw); draw();
      const qbox = h('div'); box.appendChild(qbox);
      let ans1 = null;
      qbox.appendChild(h('div', { class: 'np-wrap' }, h('div', { class: 'np-label', id: 'lbl5b' }, '① 地磚邊長最大幾公分？'), numpad({
        onSubmit: (v, pad) => {
          if (ans1 === null) { ans1 = v; Sfx.play(v === g ? 'good' : 'bad'); $('#lbl5b', qbox).innerHTML = `① 邊長：${v} 公分 ${v === g ? '✓' : '✗'}<br>② 可以切成幾塊？`; pad.clear(); }
          else done(ans1 === g && v === (W / g) * (H / g), `${W} 和 ${H} 的最大公因數是 <b>${g}</b> → 邊長 ${g} 公分<br>可以切成 (${W} ÷ ${g}) × (${H} ÷ ${g}) = ${W / g} × ${H / g} = <b>${W / g * H / g} 塊</b>`);
        }
      })));
    })(el, api);
  }
};

/* 5c 燈塔與公車：共同出現的時間 */
GAMES['5c'] = {
  concept: `<h3>🚌 什麼時候會「再一次同時」發生？</h3>
  A 每隔 a 分鐘發生一次、B 每隔 b 分鐘發生一次，兩者同時發生後，下一次同時發生要再過 <b>a 和 b 的最小公倍數</b>分鐘。
  <div class="ex">兩路公車 8:00 同時發車，A 每 12 分、B 每 18 分一班<br>12 和 18 的最小公倍數是 36 → 下一次同時發車是 <b>8:36</b></div>
  💡 可以按「▶ 播放」看時間軸驗證你的答案！`,
  play: (el, api) => {
    const types = shuffle(['lamp', 'bus', 'lib']);
    rounds(3, i => (box, done) => {
      const type = types[i];
      const [a, b] = pick(type === 'lamp' ? [[4, 6], [6, 10], [8, 12], [6, 9], [10, 15]] : type === 'bus' ? [[12, 18], [15, 20], [10, 25], [12, 16], [20, 30], [10, 15]] : [[3, 4], [4, 6], [5, 6], [6, 8], [4, 10], [3, 8]]);
      const L = lcm(a, b), unit = type === 'lamp' ? '秒' : type === 'bus' ? '分' : '天';
      const ic = type === 'lamp' ? ['🔴', '🔵'] : type === 'bus' ? ['🚌', '🚎'] : ['👦', '👧'];
      const hr = pick([7, 8, 9]);
      const story = type === 'lamp' ? `🗼 海邊有兩座燈塔：紅燈塔每 <span class="em">${a}</span> 秒亮一次，藍燈塔每 <span class="em">${b}</span> 秒亮一次。剛剛兩座燈塔<b>同時亮</b>了，最少再過<b>幾秒</b>會再同時亮？`
        : type === 'bus' ? `🚏 早上 <b>${hr}:00</b> 兩路公車同時發車。A 路每 <span class="em">${a}</span> 分鐘一班，B 路每 <span class="em">${b}</span> 分鐘一班。下一次同時發車是<b>幾點幾分</b>？`
          : `📚 小明每 <span class="em">${a}</span> 天去一次圖書館，小美每 <span class="em">${b}</span> 天去一次。<b>5 月 1 日</b>兩人同時去了圖書館，下一次在圖書館遇到是 <b>5 月幾日</b>？`;
      box.appendChild(h('div', { class: 'story', html: story }));
      const T = L * 2 + Math.max(a, b);
      const cv = h('canvas', { class: 'cv', width: 640, height: 170 }); const ctx = cv.getContext('2d');
      let cur = -1, anim = 0;
      function draw() {
        ctx.clearRect(0, 0, 640, 170);
        const X = t => 40 + t / T * 570;
        ctx.strokeStyle = '#4a3a2c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(40, 140); ctx.lineTo(615, 140); ctx.stroke();
        ctx.font = '700 12px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#8a735d';
        const step = T > 60 ? 10 : 5;
        for (let t = 0; t <= T; t += step) { ctx.fillRect(X(t) - 1, 136, 2, 8); ctx.fillText(t, X(t), 160); }
        ctx.font = '22px sans-serif';
        for (let t = 0; t <= Math.min(cur, T); t++) {
          const hitA = t % a === 0, hitB = t % b === 0;
          if (hitA) ctx.fillText(ic[0], X(t), 52);
          if (hitB) ctx.fillText(ic[1], X(t), 100);
          if (hitA && hitB) { ctx.fillStyle = 'rgba(255,211,77,.35)'; ctx.fillRect(X(t) - 12, 25, 24, 108); ctx.fillStyle = '#8a735d'; }
        }
        if (cur >= 0 && cur <= T) { ctx.fillStyle = '#ff6b6b'; ctx.fillRect(X(cur) - 1.5, 20, 3, 120); ctx.fillStyle = '#8a735d'; }
        ctx.font = '700 13px Fredoka, "Noto Sans TC", sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#4a3a2c';
        ctx.fillText(`（${unit}）`, 2, 160);
      }
      draw();
      const play = h('button', {
        class: 'btn small blue', onclick: () => {
          cancelAnimationFrame(anim); const st = performance.now();
          const go = now => { if (!api.alive()) return; cur = Math.floor((now - st) / 1000 * (T / 5)); draw(); if (cur < T) anim = requestAnimationFrame(go); else { cur = T; draw(); } };
          anim = requestAnimationFrame(go);
        }
      }, '▶ 播放時間軸');
      api.onCleanup(() => cancelAnimationFrame(anim));
      box.append(cv, h('div', { class: 'row center', style: { margin: '8px 0' } }, play));
      const ex = `${a} 和 ${b} 的最小公倍數是 <b>${L}</b>，`;
      if (type === 'bus') {
        const fmt = m => `${hr + Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
        const opts = [...new Set([L, a * b, a + b, Math.max(a, b) * 2, gcd(a, b) * 10].filter(m => m !== L && m < 120))].slice(0, 3);
        mcqShuffled(box, fmt(L), opts.map(fmt).filter(x => x !== fmt(L)), done, ex + `所以再過 ${L} 分鐘 → <b>${fmt(L)}</b>`);
      } else {
        box.appendChild(h('div', { class: 'np-wrap' }, h('div', { class: 'np-label' }, type === 'lamp' ? '再過幾秒？' : '5 月幾日？'), numpad({
          onSubmit: v => done(v === (type === 'lib' ? 1 + L : L), type === 'lib' ? ex + `所以再過 ${L} 天：1 + ${L} = <b>5 月 ${1 + L} 日</b>（小心不是 ${L} 日喔！）` : ex + `所以最少再過 <b>${L} 秒</b>會再同時亮`)
        })));
      }
    })(el, api);
  }
};

/* 5d 拼出大正方形 */
GAMES['5d'] = {
  concept: `<h3>🧩 小長方形拼成大正方形</h3>
  用一樣的長方形磁磚（長 a、寬 b）拼成正方形，正方形的邊長必須同時是 a 和 b 的<b>倍數</b>。<br>
  「<b>最小</b>的正方形」→ 邊長 = a 和 b 的<b>最小公倍數</b>！
  <div class="ex">磁磚長 6、寬 4 → 最小公倍數 12 → 正方形邊長 12<br>需要 (12 ÷ 6) × (12 ÷ 4) = 2 × 3 = <b>6 塊</b></div>`,
  play: (el, api) => {
    const d = deck([[6, 4], [8, 6], [5, 3], [10, 4], [9, 6], [12, 8], [7, 2], [10, 6]]);
    rounds(3, () => (box, done) => {
      const [a, b] = d(); const L = lcm(a, b);
      box.appendChild(h('div', { class: 'story', html: `🧩 有很多塊長 <span class="em">${a}</span> 公分、寬 <span class="em">${b}</span> 公分的長方形磁磚，要拼成一個<b>最小的正方形</b>（磁磚方向都一樣）。<br>正方形的邊長是幾公分？需要幾塊磁磚？` }));
      const cv = h('canvas', { class: 'cv', width: 640, height: 380 }); const ctx = cv.getContext('2d');
      const slider = h('input', { type: 'range', min: Math.max(a, b), max: L * 2, value: Math.max(a, b) }); const sl = h('b', null, slider.value);
      const info = h('div', { style: { textAlign: 'center', fontWeight: 900, minHeight: '27px' } });
      box.append(h('div', { class: 'slider-row' }, '正方形邊長 ', slider, sl, ' 公分'), cv, info);
      const cols = ['#ffb347', '#ffd34d', '#ff8fb1', '#5bb8f0', '#7cc95a', '#b197fc'];
      function draw() {
        const s = +slider.value; sl.textContent = s;
        const f = 300 / (s + Math.max(a, b)), ox = (640 - s * f) / 2 - 20, oy = 30;
        ctx.clearRect(0, 0, 640, 380);
        const nx = Math.ceil(s / a), ny = Math.ceil(s / b);
        for (let x = 0; x < nx; x++) for (let y = 0; y < ny; y++) {
          const over = (x + 1) * a > s || (y + 1) * b > s;
          ctx.fillStyle = over ? 'rgba(255,107,107,.35)' : cols[(x + y * 2) % cols.length];
          ctx.fillRect(ox + x * a * f + 1, oy + y * b * f + 1, a * f - 2, b * f - 2);
        }
        ctx.strokeStyle = '#4a3a2c'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]); ctx.strokeRect(ox, oy, s * f, s * f); ctx.setLineDash([]);
        ctx.fillStyle = '#4a3a2c'; ctx.font = '700 16px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${s} 公分`, ox + s * f / 2, oy - 8);
        const okS = s % a === 0 && s % b === 0;
        info.innerHTML = okS ? `✓ 剛好拼滿：橫 ${s / a} 塊 × 直 ${s / b} 塊 = ${s / a * s / b} 塊` : `<span class="leftover">紅色磁磚會超出去 ✗（${s % a ? `${s} 不是 ${a} 的倍數 ` : ''}${s % b ? `${s} 不是 ${b} 的倍數` : ''}）</span>`;
      }
      slider.addEventListener('input', draw); draw();
      let ans1 = null; const qbox = h('div'); box.appendChild(qbox);
      qbox.appendChild(h('div', { class: 'np-wrap' }, h('div', { class: 'np-label', id: 'lbl5d' }, '① 最小正方形的邊長幾公分？'), numpad({
        onSubmit: (v, pad) => {
          if (ans1 === null) { ans1 = v; Sfx.play(v === L ? 'good' : 'bad'); $('#lbl5d', qbox).innerHTML = `① 邊長：${v} 公分 ${v === L ? '✓' : '✗'}<br>② 需要幾塊磁磚？`; pad.clear(); }
          else done(ans1 === L && v === (L / a) * (L / b), `${a} 和 ${b} 的最小公倍數是 <b>${L}</b> → 邊長 ${L} 公分<br>需要 (${L} ÷ ${a}) × (${L} ÷ ${b}) = ${L / a} × ${L / b} = <b>${L / a * L / b} 塊</b>`);
        }
      })));
    })(el, api);
  }
};

/* ---- 應用題產生器（5e 與期末共用） ---- */
const WORD_GENS = [
  () => { const g = pick([6, 8, 9, 12, 15]); const [m, n] = pick(COPRIME_M); const a = g * m, b = g * n; return { tool: 'gcd', ans: g, text: `✏️ 有 ${a} 枝鉛筆和 ${b} 本筆記本，要平分給一些小朋友，每人分到的鉛筆一樣多、筆記本也一樣多，而且都沒有剩。<b>最多</b>可以分給幾位小朋友？`, ex: `${a} 和 ${b} 的最大公因數是 <b>${g}</b> → 最多 ${g} 位` }; },
  () => { const g = pick([6, 8, 12, 15, 18]); const [m, n] = pick(COPRIME_M); const a = g * m, b = g * n; return { tool: 'gcd', ans: g, text: `🎀 兩條緞帶分別長 ${a} 公分和 ${b} 公分，要剪成<b>一樣長</b>的小段，而且都不能有剩。每段<b>最長</b>是幾公分？`, ex: `${a} 和 ${b} 的最大公因數是 <b>${g}</b> → 每段最長 ${g} 公分` }; },
  () => { const g = pick([5, 6, 10, 12]); const [m, n] = pick(COPRIME_M); const a = g * m, b = g * n; return { tool: 'gcd', ans: g, text: `💰 哥哥有 ${a} 元、弟弟有 ${b} 元零用錢，兩人每天都花<b>一樣多</b>的錢（整數元），最後兩人都<b>剛好花完</b>。每天<b>最多</b>花幾元？`, ex: `每天花的錢要同時整除 ${a} 和 ${b}；最大公因數是 <b>${g}</b> → 每天最多 ${g} 元` }; },
  () => { const [a, b] = pick([[12, 18], [15, 20], [10, 25], [12, 16], [20, 30], [6, 8]]); const L = lcm(a, b); return { tool: 'lcm', ans: L, text: `⏰ 甲鬧鐘每 ${a} 分鐘響一次，乙鬧鐘每 ${b} 分鐘響一次。兩個鬧鐘剛剛同時響，<b>最少</b>再過幾分鐘會再同時響？`, ex: `${a} 和 ${b} 的最小公倍數是 <b>${L}</b> → 再過 ${L} 分鐘` }; },
  () => { const [a, b] = pick([[4, 6], [6, 8], [5, 6], [6, 9], [4, 10], [8, 12]]); const L = lcm(a, b); const r = ri(1, Math.min(a, b) - 1); return { tool: 'lcm', ans: L + r, text: `🍊 一籃橘子，每 ${a} 個裝一袋會<b>剩 ${r} 個</b>，每 ${b} 個裝一袋也<b>剩 ${r} 個</b>。這籃橘子<b>最少</b>有幾個？（超過 ${r} 個）`, ex: `拿掉剩下的 ${r} 個，就能同時被 ${a} 和 ${b} 整除 → 最小公倍數 ${L}，再加回 ${r}：${L} + ${r} = <b>${L + r}</b> 個` }; },
  () => { const [a, b] = pick([[4, 6], [6, 8], [5, 6], [6, 9], [4, 10], [8, 12]]); const L = lcm(a, b); const k = ri(1, Math.min(a, b) - 1); return { tool: 'lcm', ans: L - k, text: `🍪 一盒餅乾，每 ${a} 塊裝一包會<b>少 ${k} 塊</b>，每 ${b} 塊裝一包也<b>少 ${k} 塊</b>。這盒餅乾<b>最少</b>有幾塊？`, ex: `再補 ${k} 塊就能同時被 ${a} 和 ${b} 整除 → 最小公倍數 ${L}，再減去 ${k}：${L} − ${k} = <b>${L - k}</b> 塊` }; },
  () => { const [a, b] = pick([[6, 8], [4, 6], [6, 9], [8, 12], [6, 10]]); const L = lcm(a, b); return { tool: 'lcm', ans: L, text: `🍰 一盒蛋糕平分給 ${a} 人或平分給 ${b} 人，都剛好分完沒有剩。這盒蛋糕<b>最少</b>有幾塊？`, ex: `塊數要同時是 ${a} 和 ${b} 的倍數 → 最小公倍數 <b>${L}</b> 塊` }; },
];
function wordRound(gen) {
  return (box, done) => {
    const P = gen();
    let toolOk = null;
    box.appendChild(h('div', { class: 'story', html: P.text }));
    const step = h('div');
    box.appendChild(step);
    step.appendChild(Q('第 1 步：這題要用什麼來解？'));
    const tb = h('div', { class: 'tf-btns' });
    const choose = t => {
      toolOk = t === P.tool;
      $$('.btn', tb).forEach(b => b.disabled = true);
      Sfx.play(toolOk ? 'good' : 'bad');
      step.appendChild(h('div', { style: { fontWeight: 700, margin: '10px 0', color: toolOk ? '#2b8a3e' : '#c94545' } }, toolOk ? '✓ 沒錯！' : `✗ 這題其實要用「${P.tool === 'gcd' ? '最大公因數' : '最小公倍數'}」喔：${P.tool === 'gcd' ? '把東西「分開、分完」，找「最多、最大」' : '「同時發生、湊成一樣」，找「最少、最小」'}`));
      step.appendChild(h('div', { class: 'np-wrap' }, h('div', { class: 'np-label' }, '第 2 步：答案是？'), numpad({ onSubmit: v => done(toolOk && v === P.ans, P.ex) })));
      step.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    tb.append(h('button', { class: 'btn big blue', onclick: () => choose('gcd') }, '最大公因數'), h('button', { class: 'btn big pink', onclick: () => choose('lcm') }, '最小公倍數'));
    step.appendChild(tb);
  };
}

/* 5e 港口任務板 */
GAMES['5e'] = {
  concept: `<h3>📋 用哪一個？最大公因數 vs 最小公倍數</h3>
  <b>最大公因數</b>：把東西「<b>分開</b>、平分、剪成、切成」，問「<b>最多、最大、最長</b>」<br>
  <b>最小公倍數</b>：「<b>同時</b>發生、再次相遇、拼成、湊成」，問「<b>最少、最小、最早</b>」
  <div class="ex">🍊 每 4 個一數剩 1、每 6 個一數也剩 1 → 先找最小公倍數 12，再 <b>+1</b> = 13<br>🍪 每 4 個一數少 1、每 6 個一數也少 1 → 最小公倍數 12，再 <b>−1</b> = 11</div>`,
  play: (el, api) => {
    const order = shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, 5);
    rounds(5, i => wordRound(WORD_GENS[order[i]]))(el, api);
  }
};

/* ============ 期末試煉塔 ============ */
GAMES['final'] = {
  concept: `<h3>🏆 期末試煉：六上第一單元總複習</h3>
  共 <b>10 題</b>，涵蓋：質數與合數、質因數分解、最大公因數、最小公倍數、應用題。<br>
  答對 5 題以上就能通過，還可以得到特別獎勵 <b>🏆 因數王冠</b>！
  <div class="ex">💡 小提醒：<br>・1 不是質數也不是合數，2 是唯一的偶數質數<br>・最大公因數：共同的質因數相乘<br>・最小公倍數：每種質因數取比較多的那邊相乘</div>`,
  play: (el, api) => {
    const items = [
      (box, done) => { const p = pick([23, 29, 31, 37, 41, 43, 47, 53]); box.appendChild(Q('下面哪一個是<b>質數</b>？')); mcqShuffled(box, p, shuffle([51, 57, 91, 49, 39, 27, 33]).slice(0, 3), done, `${p} 只有 1 和 ${p} 兩個因數。51 = 3×17、57 = 3×19、91 = 7×13、49 = 7×7 都是合數。`); },
      (box, done) => { box.appendChild(Q('下面哪一個<b>既不是質數，也不是合數</b>？')); mcqShuffled(box, 1, [2, 9, 0 + pick([11, 15, 21])], done, '1 只有一個因數，所以不是質數也不是合數。'); },
      (box, done) => { const N = pick([72, 84, 90, 120, 126, 150]); const ps = primeFactors(N); box.appendChild(Q(`<b>${N}</b> 的質因數分解是？`)); mcqShuffled(box, ps.join(' × '), [[ps[0] * ps[1], ...ps.slice(2)].join(' × '), ps.slice(1).join(' × '), [...ps, 2].sort((a, b) => a - b).join(' × ')], done, `${N} = <b>${ps.join(' × ')}</b>（全部都要是質數，乘起來要剛好等於 ${N}）`); },
      (box, done) => { const [a, b] = pick([[36, 48], [42, 56], [45, 60], [54, 72], [48, 80]]); const g = gcd(a, b); box.appendChild(Q(`<b>${a}</b> 和 <b>${b}</b> 的<b>最大公因數</b>是多少？`)); box.appendChild(h('div', { class: 'np-wrap' }, numpad({ onSubmit: v => done(v === g, `${a} = ${pfStr(a)}，${b} = ${pfStr(b)}<br>共同的質因數相乘 = <b>${g}</b>`) }))); },
      (box, done) => { const [a, b] = pick([[12, 20], [18, 24], [15, 25], [16, 20], [14, 35]]); const L = lcm(a, b); box.appendChild(Q(`<b>${a}</b> 和 <b>${b}</b> 的<b>最小公倍數</b>是多少？`)); box.appendChild(h('div', { class: 'np-wrap' }, numpad({ onSubmit: v => done(v === L, `${a} = ${pfStr(a)}，${b} = ${pfStr(b)}<br>每種質數取多的那邊 = <b>${L}</b>`) }))); },
      (box, done) => { const y = pick([[8, 15], [9, 16], [14, 25], [21, 22]]); box.appendChild(Q('下面哪一組數<b>互質</b>？')); mcqShuffled(box, y.join(' 和 '), shuffle([[12, 18], [15, 25], [14, 21], [9, 27], [16, 24]]).slice(0, 3).map(p => p.join(' 和 ')), done, `${y[0]} 和 ${y[1]} 的公因數只有 1，所以互質。`); },
      (box, done) => { const [a, b] = pick([[4, 6], [6, 8], [6, 9], [8, 12]]); const L = lcm(a, b); box.appendChild(Q(`下面哪一個是 <b>${a}</b> 和 <b>${b}</b> 的<b>公倍數</b>？`)); const w = [a * pick([5, 7]), b * pick([5, 7]), L + a].filter(x => x % L); mcqShuffled(box, L * pick([2, 3]), [...new Set(w)].slice(0, 3), done, `最小公倍數是 ${L}，公倍數就是 ${L} 的倍數：${L}、${2 * L}、${3 * L}…`); },
      wordRound(pick([WORD_GENS[0], WORD_GENS[1], WORD_GENS[2]])),
      wordRound(pick([WORD_GENS[3], WORD_GENS[6]])),
      wordRound(pick([WORD_GENS[4], WORD_GENS[5]])),
    ];
    rounds(10, i => items[i])(el, api);
  }
};
