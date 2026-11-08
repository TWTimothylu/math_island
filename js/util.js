/* ============ 共用工具 ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
  }
  return el;
}

/* ---- 數學 ---- */
const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const factorsOf = n => { const a = []; for (let i = 1; i <= n; i++) if (n % i === 0) a.push(i); return a; };
const primeFactors = n => { const a = []; let m = n; for (let p = 2; p * p <= m; p++) while (m % p === 0) { a.push(p); m /= p; } if (m > 1) a.push(m); return a; };
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const lcm = (a, b) => a / gcd(a, b) * b;
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pfStr = n => primeFactors(n).join(' × ');
const sum = a => a.reduce((x, y) => x + y, 0);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/* 從 list 中依序取不重複題目 */
function deck(list) { let d = shuffle(list); return () => { if (!d.length) d = shuffle(list); return d.pop(); }; }

const GEM_COLORS = { 2: '#ff6b6b', 3: '#4dabf7', 5: '#40c057', 7: '#9775fa', 11: '#ff922b', 13: '#f06595', 17: '#20c997', 19: '#fab005' };
function gem(p, opts = {}) {
  const el = h('div', { class: 'gem' + (opts.sm ? ' sm' : '') }, p);
  el.style.setProperty('--c', GEM_COLORS[p] || '#868e96');
  el.dataset.p = p;
  if (opts.onclick) el.addEventListener('click', opts.onclick);
  return el;
}

/* ---- 存檔 ---- */
const SAVE_KEY = 'math-island-v1';
const Store = {
  load() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
  save(d) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch (e) { } },
  clear() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }
};

/* ---- 音效 (WebAudio 合成) ---- */
const Sfx = {
  ctx: null, on: true,
  init() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  tone(freq, dur, type = 'sine', vol = .15, delay = 0, slide = 0) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + dur + .02);
  },
  play(name) {
    this.init();
    switch (name) {
      case 'pop': this.tone(520, .12, 'sine', .18, 0, 1.8); break;
      case 'click': this.tone(700, .05, 'square', .05); break;
      case 'good': this.tone(660, .12, 'triangle', .18); this.tone(990, .18, 'triangle', .16, .09); break;
      case 'bad': this.tone(220, .22, 'sawtooth', .07, 0, .7); break;
      case 'coin': [988, 1319].forEach((f, i) => this.tone(f, .14, 'square', .07, i * .07)); break;
      case 'win': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .22, 'triangle', .16, i * .11)); break;
      case 'open': this.tone(440, .1, 'triangle', .12, 0, 1.5); break;
      case 'step': this.tone(180 + Math.random() * 40, .04, 'sine', .04); break;
      case 'unlock': [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, .25, 'triangle', .15, i * .09)); break;
    }
  }
};

/* ---- UI 小工具 ---- */
function toast(msg, type = '') {
  const t = h('div', { class: 'toast ' + type }, msg);
  $('#toastRoot').appendChild(t);
  setTimeout(() => t.remove(), 2800);
}
function confetti(n = 70) {
  const cols = ['#ff6b6b', '#ffd34d', '#7cc95a', '#5bb8f0', '#b197fc', '#ff8fb1'];
  for (let i = 0; i < n; i++) {
    const c = h('div', { class: 'confetti' });
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = pick(cols);
    c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
    c.style.animationDelay = Math.random() * .5 + 's';
    c.style.borderRadius = Math.random() < .5 ? '50%' : '3px';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3800);
  }
}
function shakeEl(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

/* 吉祥物：小方糖「方方」 (SVG) */
function mascotSVG(mood = 'happy') {
  const mouth = mood === 'wow' ? '<ellipse cx="60" cy="74" rx="6" ry="7" fill="#5a3825"/>' :
    '<path d="M50 70 Q60 80 70 70" stroke="#5a3825" stroke-width="4" fill="none" stroke-linecap="round"/>';
  return `<svg viewBox="0 0 120 120" class="mascot" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="110" rx="34" ry="6" fill="rgba(0,0,0,.12)"/>
    <path d="M60 10 L104 34 L104 84 L60 108 L16 84 L16 34 Z" fill="#9fe07f" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>
    <path d="M60 10 L104 34 L60 58 L16 34 Z" fill="#c4f2a8"/>
    <path d="M60 18 q10 -14 22 -8 q-8 10 -22 8" fill="#57b33a"/>
    <circle cx="44" cy="60" r="7" fill="#3a2a1e"/><circle cx="76" cy="60" r="7" fill="#3a2a1e"/>
    <circle cx="46" cy="57" r="2.5" fill="#fff"/><circle cx="78" cy="57" r="2.5" fill="#fff"/>
    <ellipse cx="34" cy="72" rx="7" ry="4" fill="#ff9fb5" opacity=".8"/><ellipse cx="86" cy="72" rx="7" ry="4" fill="#ff9fb5" opacity=".8"/>
    ${mouth}</svg>`;
}

/* ---- Modal ---- */
const Modal = {
  stack: [],
  open({ title, sub, body, foot, onClose, width, headExtra, closable = true }) {
    const back = h('div', { class: 'modal-back' });
    const m = h('div', { class: 'modal panel' });
    if (width) m.style.width = width;
    const head = h('div', { class: 'modal-head' },
      h('div', { style: { flex: 1, minWidth: 0 } }, h('h2', null, title), sub ? (typeof sub === 'string' ? h('div', { class: 'sub' }, sub) : sub) : null),
      headExtra || null,
      closable ? h('button', { class: 'modal-close', onclick: () => close(), title: '關閉' }, '✕') : null);
    const bodyEl = h('div', { class: 'modal-body' });
    if (body) bodyEl.appendChild(body);
    m.append(head, bodyEl);
    if (foot) m.appendChild(foot);
    back.appendChild(m);
    $('#modalRoot').appendChild(back);
    Sfx.play('open');
    const rec = { back, m, bodyEl, head, onClose };
    this.stack.push(rec);
    function close() {
      if (!back.isConnected) return;
      back.remove();
      Modal.stack = Modal.stack.filter(r => r !== rec);
      onClose && onClose();
    }
    rec.close = close;
    return rec;
  },
  isOpen() { return this.stack.length > 0; }
};
