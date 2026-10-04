/*
  CORE: shared helpers used by every screen and activity.
  - exact fractions (Q) and linear expressions (L) so equations never drift to 0.3333…
  - a small equation parser:  3(x + 2) - 4 = x/2 + 7
  - DOM helpers, sleep/animation helpers, sound effects, confetti
*/
(() => {
  const MQ = window.MQ = window.MQ || {};

  /* ---------------- DOM + timing ---------------- */
  MQ.$ = (s, root = document) => root.querySelector(s);
  MQ.$$ = (s, root = document) => [...root.querySelectorAll(s)];
  MQ.esc = s => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  MQ.rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  MQ.pick = a => a[MQ.rand(0, a.length - 1)];
  MQ.shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = MQ.rand(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  MQ.fmt = n => Number.isInteger(n) ? String(n) : String(Number(Number(n).toFixed(2)));
  MQ.money = n => { const s = Number(n).toFixed(2); return '$' + (s.endsWith('.00') ? s.slice(0, -3) : s); };
  MQ.reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  MQ.sleep = ms => new Promise(r => setTimeout(r, MQ.reduced() ? Math.min(ms, 60) : ms));
  MQ.h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  MQ.replay = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  // Fly a copy of `fromEl` to `toEl` (optionally changing its text half-way, e.g. "+ 6" → "− 6").
  MQ.fly = async (fromEl, toEl, { text, flipTo, duration = 900, cls = '' } = {}) => {
    if (!fromEl || !toEl) return;
    const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    if (MQ.reduced() || !document.body.animate) return;
    const g = document.createElement('div');
    g.className = 'flyer ' + cls;
    g.textContent = text ?? fromEl.textContent;
    Object.assign(g.style, { left: `${a.left}px`, top: `${a.top}px`, minWidth: `${a.width}px`, height: `${a.height}px` });
    document.body.appendChild(g);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const lift = Math.min(-50, -Math.abs(dx) * .25);
    g.animate([
      { transform: 'translate(0,0) rotateY(0) scale(1)' },
      { transform: `translate(${dx * .5}px, ${dy * .5 + lift}px) rotateY(90deg) scale(1.15)`, offset: .5 },
      { transform: `translate(${dx}px, ${dy}px) rotateY(0) scale(1)` }
    ], { duration, easing: 'cubic-bezier(.45,.05,.35,1)' });
    if (flipTo) setTimeout(() => { g.textContent = flipTo; g.classList.add('flipped'); }, duration / 2);
    await MQ.sleep(duration);
    g.remove();
  };

  // Count a number element from one value to another.
  MQ.countTo = async (el, from, to, ms = 600) => {
    if (!el) return;
    if (MQ.reduced()) { el.textContent = MQ.fmt(to); return; }
    const t0 = performance.now();
    await new Promise(res => {
      const tick = now => {
        const k = Math.min(1, (now - t0) / ms), v = from + (to - from) * (1 - Math.pow(1 - k, 3));
        el.textContent = Number.isInteger(from) && Number.isInteger(to) ? String(Math.round(v)) : MQ.fmt(v);
        if (k < 1) requestAnimationFrame(tick); else { el.textContent = MQ.fmt(to); res(); }
      };
      requestAnimationFrame(tick);
    });
  };

  /* ---------------- sound ---------------- */
  let audio = null;
  const TONES = {
    tap: [[520, .04]], pick: [[620, .05]], good: [[660, .08], [880, .12]], combo: [[660, .06], [880, .06], [1175, .12]],
    bad: [[196, .16]], win: [[523, .09], [659, .09], [784, .09], [1046, .24]], whoosh: [[330, .05], [495, .06]],
    pop: [[880, .03]], unlock: [[440, .08], [554, .08], [659, .08], [880, .26]], star: [[988, .07], [1319, .12]]
  };
  MQ.sfx = type => {
    if (MQ.store?.muted()) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      audio ||= new AC();
      let t = audio.currentTime;
      for (const [f, d] of TONES[type] || []) {
        const o = audio.createOscillator(), g = audio.createGain();
        o.type = type === 'bad' ? 'triangle' : 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.1, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + d);
        o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + d + .03); t += d * .85;
      }
    } catch {}
    try { if (type === 'bad' && navigator.vibrate) navigator.vibrate(40); } catch {}
  };

  /* ---------------- confetti + toast ---------------- */
  MQ.celebrate = (n = 28) => {
    const c = document.getElementById('celebration'); if (!c || MQ.reduced()) return;
    const colors = ['#5c4ee5', '#f4b942', '#2ea7a0', '#d95e93', '#4588d7', '#2f9e57'];
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i'); p.className = 'confetti';
      p.style.left = `${Math.random() * 100}%`; p.style.background = MQ.pick(colors);
      p.style.setProperty('--dx', `${(Math.random() - .5) * 160}px`); p.style.animationDelay = `${Math.random() * 200}ms`;
      c.appendChild(p); setTimeout(() => p.remove(), 1800);
    }
  };
  MQ.toast = msg => {
    const t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show'); clearTimeout(MQ.toast.timer);
    MQ.toast.timer = setTimeout(() => t.classList.remove('show'), 1800);
  };

  /* ---------------- exact fractions ---------------- */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const Q = MQ.Q = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
  Object.assign(MQ, {
    qAdd: (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d),
    qSub: (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d),
    qMul: (a, b) => Q(a.n * b.n, a.d * b.d),
    qDiv: (a, b) => Q(a.n * b.d, a.d * b.n),
    qEq: (a, b) => a.n === b.n && a.d === b.d,
    qZero: a => a.n === 0,
    qOne: a => a.n === 1 && a.d === 1,
    qNum: a => a.n / a.d,
    qAbs: a => Q(Math.abs(a.n), a.d),
    qNeg: a => Q(-a.n, a.d),
    qStr: a => {
      const body = a.d === 1 ? String(Math.abs(a.n)) : `${Math.abs(a.n)}/${a.d}`;
      return (a.n < 0 ? '−' : '') + body;
    },
    // Decimal-friendly display: 3/4 → 0.75 when it terminates nicely, else 3/4.
    qPretty: a => {
      if (a.d === 1) return MQ.qStr(a);
      let d = a.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5;
      if (d === 1) return (a.n < 0 ? '−' : '') + MQ.fmt(Math.abs(a.n / a.d));
      return MQ.qStr(a);
    },
    qFromText: t => {
      const f = (String(t).split('.')[1] || '');
      const d = 10 ** f.length;
      return Q(Math.round(Number(t) * d), d);
    },
    qFromNum: x => MQ.qFromText(String(Number(Number(x).toFixed(6))))
  });

  /* ---------------- linear expressions {x: Q, c: Q} ---------------- */
  const L = MQ.L = (x = Q(0), c = Q(0)) => ({ x, c });
  Object.assign(MQ, {
    lAdd: (a, b) => L(MQ.qAdd(a.x, b.x), MQ.qAdd(a.c, b.c)),
    lSub: (a, b) => L(MQ.qSub(a.x, b.x), MQ.qSub(a.c, b.c)),
    lScale: (a, q) => L(MQ.qMul(a.x, q), MQ.qMul(a.c, q)),
    lEval: (a, v) => MQ.qAdd(MQ.qMul(a.x, v), a.c)
  });

  /* ---------------- parser ---------------- */
  // parseExpr("3(x+2) - 4") → {x: 3, c: 2}. Supports + − × ÷ * /, parentheses,
  // decimals, implicit multiplication (2x, 3(x+1)) and any single letter as the unknown.
  function parseExpr(text, ctx = { v: null }) {
    const src = String(text).replace(/[−–—]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/');
    const toks = [];
    for (let i = 0; i < src.length;) {
      const ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      const num = src.slice(i).match(/^\d*\.?\d+/);
      if (num) { toks.push({ t: 'num', v: MQ.qFromText(num[0]) }); i += num[0].length; continue; }
      if (/[a-zA-Z]/.test(ch)) {
        if (ctx.v && ctx.v !== ch) throw new Error('Use just one letter for the unknown.');
        ctx.v = ch; toks.push({ t: 'var' }); i++; continue;
      }
      if ('+-*/()'.includes(ch)) { toks.push({ t: ch }); i++; continue; }
      throw new Error(`I don't understand "${ch}".`);
    }
    let p = 0;
    const peek = () => toks[p], take = () => toks[p++];
    const mul = (a, b) => {
      if (MQ.qZero(a.x)) return MQ.lScale(b, a.c);
      if (MQ.qZero(b.x)) return MQ.lScale(a, b.c);
      throw new Error('x × x (squared) is beyond this app.');
    };
    function expr() {
      let v = term();
      while (peek() && (peek().t === '+' || peek().t === '-')) { const op = take().t; const r = term(); v = op === '+' ? MQ.lAdd(v, r) : MQ.lSub(v, r); }
      return v;
    }
    function term() {
      let v = factor();
      for (;;) {
        const t = peek(); if (!t) break;
        if (t.t === '*') { take(); v = mul(v, factor()); }
        else if (t.t === '/') {
          take(); const d = factor();
          if (!MQ.qZero(d.x)) throw new Error('Dividing by x is beyond this app.');
          if (MQ.qZero(d.c)) throw new Error('You cannot divide by 0.');
          v = MQ.lScale(v, MQ.qDiv(Q(1), d.c));
        }
        else if (t.t === 'var' || t.t === '(') v = mul(v, factor());
        else if (t.t === 'num' && toks[p - 1]?.t === ')') v = mul(v, factor());
        else break;
      }
      return v;
    }
    function factor() {
      const t = take();
      if (!t) throw new Error('Something is missing at the end.');
      if (t.t === '-') return MQ.lScale(factor(), Q(-1));
      if (t.t === '+') return factor();
      if (t.t === 'num') return L(Q(0), t.v);
      if (t.t === 'var') return L(Q(1), Q(0));
      if (t.t === '(') { const v = expr(); if (take()?.t !== ')') throw new Error('Missing a closing ).'); return v; }
      throw new Error(`Unexpected "${t.t}".`);
    }
    if (!toks.length) throw new Error('One side of the = is empty.');
    const out = expr();
    if (p < toks.length) throw new Error('That does not look like a complete expression.');
    return out;
  }
  MQ.parseExpr = parseExpr;
  MQ.parseEquation = text => {
    const parts = String(text).split('=');
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) throw new Error('An equation needs exactly one = sign with something on each side.');
    const ctx = { v: null };
    return { left: parseExpr(parts[0], ctx), right: parseExpr(parts[1], ctx), v: ctx.v || 'x' };
  };
  // Solution of a linear equation, or 'all' / 'none'.
  MQ.solveLinear = (left, right) => {
    const a = MQ.qSub(left.x, right.x), b = MQ.qSub(right.c, left.c);
    if (MQ.qZero(a)) return MQ.qZero(b) ? 'all' : 'none';
    return MQ.qDiv(b, a);
  };
})();
