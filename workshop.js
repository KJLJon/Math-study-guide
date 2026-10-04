/*
  EQUATION WORKSHOP
  -----------------
  A step-by-step equation solver the learner drives. She picks an operation
  (+ − × ÷) and a value; the workshop applies it to BOTH sides, animates the
  balance, writes the work like a notebook, strikes out zero pairs, and
  explains how that move is the same as "moving a term across the = sign".

  Numbers are kept as exact fractions so x/3 or 1/2 never turn into 0.333….
*/
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[rand(0, a.length - 1)];
  const MQ = () => window.MQ || { toast(){}, celebrate(){}, sfx(){}, addXP(){} };

  /* ---------- exact fractions ---------- */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const Q = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
  const qAdd = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
  const qSub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
  const qMul = (a, b) => Q(a.n * b.n, a.d * b.d);
  const qDiv = (a, b) => Q(a.n * b.d, a.d * b.n);
  const qEq = (a, b) => a.n === b.n && a.d === b.d;
  const qZero = a => a.n === 0;
  const qOne = a => a.n === 1 && a.d === 1;
  const qNum = a => a.n / a.d;
  const qStr = (a, signed = false) => {
    const body = a.d === 1 ? String(Math.abs(a.n)) : `${Math.abs(a.n)}/${a.d}`;
    if (signed) return `${a.n < 0 ? '−' : '+'} ${body}`;
    return `${a.n < 0 ? '−' : ''}${body}`;
  };
  const qFromText = t => {
    const [w, f = ''] = t.split('.');
    const d = 10 ** f.length;
    return Q(Math.round(Number(t) * d), d);
  };

  /* ---------- linear expressions {x: Q, c: Q} ---------- */
  const L = (x = Q(0), c = Q(0)) => ({ x, c });
  const lAdd = (a, b) => L(qAdd(a.x, b.x), qAdd(a.c, b.c));
  const lSub = (a, b) => L(qSub(a.x, b.x), qSub(a.c, b.c));
  const lScale = (a, q) => L(qMul(a.x, q), qMul(a.c, q));
  const lEq = (a, b) => qEq(a.x, b.x) && qEq(a.c, b.c);
  const lEval = (a, v) => qAdd(qMul(a.x, v), a.c);

  /* ---------- parser: handles 3(x+2) - 4 = x/2 + 7, decimals, implicit × ---------- */
  function parseEquation(text) {
    const parts = String(text).split('=');
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) throw new Error('An equation needs exactly one = sign with something on each side.');
    const ctx = { v: null };
    return { left: parseExpr(parts[0], ctx), right: parseExpr(parts[1], ctx), v: ctx.v || 'x' };
  }
  function parseExpr(text, ctx = { v: null }) {
    const src = String(text).replace(/[−–—]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/');
    const toks = [];
    for (let i = 0; i < src.length;) {
      const ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      const num = src.slice(i).match(/^\d*\.?\d+/);
      if (num) { toks.push({ t: 'num', v: qFromText(num[0]) }); i += num[0].length; continue; }
      if (/[a-zA-Z]/.test(ch)) {
        if (ctx.v && ctx.v !== ch) throw new Error('Use just one letter for the unknown.');
        ctx.v = ch; toks.push({ t: 'var' }); i++; continue;
      }
      if ('+-*/()'.includes(ch)) { toks.push({ t: ch }); i++; continue; }
      throw new Error(`I don't understand "${ch}".`);
    }
    let p = 0;
    const peek = () => toks[p], take = () => toks[p++];
    function expr() {
      let v = term();
      while (peek() && (peek().t === '+' || peek().t === '-')) { const op = take().t; const r = term(); v = op === '+' ? lAdd(v, r) : lSub(v, r); }
      return v;
    }
    function mul(a, b) {
      if (qZero(a.x)) return lScale(b, a.c);
      if (qZero(b.x)) return lScale(a, b.c);
      throw new Error('x × x (squared) is beyond this workshop.');
    }
    function term() {
      let v = factor();
      for (;;) {
        const t = peek();
        if (!t) break;
        if (t.t === '*') { take(); v = mul(v, factor()); }
        else if (t.t === '/') { take(); const d = factor(); if (!qZero(d.x)) throw new Error('Dividing by x is beyond this workshop.'); if (qZero(d.c)) throw new Error('You cannot divide by 0.'); v = lScale(v, qDiv(Q(1), d.c)); }
        else if (t.t === 'var' || t.t === '(' || t.t === 'num') { if (t.t === 'num' && toks[p - 1]?.t !== ')') break; v = mul(v, factor()); }
        else break;
      }
      return v;
    }
    function factor() {
      const t = take();
      if (!t) throw new Error('Something is missing at the end.');
      if (t.t === '-') return lScale(factor(), Q(-1));
      if (t.t === '+') return factor();
      if (t.t === 'num') return L(Q(0), t.v);
      if (t.t === 'var') return L(Q(1), Q(0));
      if (t.t === '(') { const v = expr(); if (take()?.t !== ')') throw new Error('Missing a closing ).'); return v; }
      throw new Error(`Unexpected "${t.t}".`);
    }
    const out = expr();
    if (p < toks.length) throw new Error(`Unexpected "${toks[p].t === 'num' ? qStr(toks[p].v) : toks[p].t}".`);
    return out;
  }

  /* ---------- display ---------- */
  function xText(q, v) {
    if (qZero(q)) return '';
    const neg = q.n < 0, n = Math.abs(q.n);
    let body;
    if (q.d === 1) body = n === 1 ? v : `${n}${v}`;
    else body = n === 1 ? `${v}/${q.d}` : `${n}${v}/${q.d}`;
    return { neg, body };
  }
  // Returns [{k:'x'|'c', html}] with the first term unsigned unless negative.
  function terms(e, v) {
    const out = [];
    const xt = xText(e.x, v);
    if (xt) {
      const coef = e.x.d === 1 && Math.abs(e.x.n) !== 1 ? `<span class="coef">${Math.abs(e.x.n)}</span>${v}` : esc(xt.body);
      out.push({ k: 'x', html: `${xt.neg ? '−' : ''}${coef}` });
    }
    if (!qZero(e.c)) out.push({ k: 'c', html: out.length ? esc(qStr(e.c, true)) : esc(qStr(e.c)) });
    if (!out.length) out.push({ k: 'c', html: '0' });
    return out;
  }
  const exprText = (e, v) => { const t = document.createElement('div'); t.innerHTML = terms(e, v).map(x => x.html).join(' '); return t.textContent; };
  const sideHTML = (e, v, mark = {}) => terms(e, v).map(t => `<span class="wt wt-${t.k} ${mark[t.k] || ''}">${t.html}</span>`).join(' ');

  /* ---------- state ---------- */
  let st = null, op = '−', returnTo = null, shortcutOn = true, hintLevel = 0;
  let rewardGiven = false;

  function complexity(s) {
    let n = 0;
    for (const e of [s.left, s.right]) {
      if (!qZero(e.x)) { n += 1; if (!qOne(e.x)) n += 1; }
      if (!qZero(e.c)) n += 1;
    }
    if (!qZero(s.left.x) && !qZero(s.right.x)) n += 2;
    return n;
  }
  function solvedValue(s) {
    const isX = e => qOne(e.x) && qZero(e.c);
    if (isX(s.left) && qZero(s.right.x)) return s.right.c;
    if (isX(s.right) && qZero(s.left.x)) return s.left.c;
    return null;
  }
  function special(s) {
    if (qEq(s.left.x, s.right.x) && !qZero(s.left.x)) return null;
    if (qZero(s.left.x) && qZero(s.right.x)) return qEq(s.left.c, s.right.c) ? 'all' : 'none';
    return null;
  }

  function load(text, fromQuest) {
    const msg = $('#wsError');
    let parsed;
    try { parsed = parseEquation(text); }
    catch (e) { if (msg) { msg.textContent = '⚠️ ' + e.message; msg.hidden = false; } MQ().sfx('bad'); return false; }
    if (msg) msg.hidden = true;
    if (qZero(parsed.left.x) && qZero(parsed.right.x)) { if (msg) { msg.textContent = '⚠️ That equation has no unknown in it. Add an x!'; msg.hidden = false; } return false; }
    st = { v: parsed.v, original: text.trim(), origL: parsed.left, origR: parsed.right, left: parsed.left, right: parsed.right, history: [] };
    hintLevel = 0; rewardGiven = false;
    $('#wsInput').value = text.trim();
    $('#wsPaper').innerHTML = `<div class="ws-step first"><div class="ws-line start"><span class="ws-side l">${esc(sideOfOriginal(0))}</span><span class="ws-eq">=</span><span class="ws-side r">${esc(sideOfOriginal(1))}</span><span class="ws-note">start</span></div></div>`;
    const normalized = `${exprText(st.left, st.v)}=${exprText(st.right, st.v)}`.replace(/\s/g, '');
    const typed = st.original.replace(/\s/g, '').replace(/[−–]/g, '-').replace(/-/g, '−');
    if (normalized !== typed) appendSimplifyRow();
    renderBalance(); renderPicks(); setFeedback(fromQuest ? 'Your quest equation is loaded. What is attached to x? Undo it on BOTH sides.' : 'Pick an operation and a number, then hit <b>Do it to BOTH sides</b>.', 'info');
    $('#wsCheck').hidden = true;
    return true;
  }
  function sideOfOriginal(i) { return st.original.split('=')[i].trim().replace(/-/g, '−').replace(/\*/g, '×'); }
  function appendSimplifyRow() {
    $('#wsPaper').insertAdjacentHTML('beforeend', `<div class="ws-step"><div class="ws-line result"><span class="ws-side l">${sideHTML(st.left, st.v)}</span><span class="ws-eq">=</span><span class="ws-side r">${sideHTML(st.right, st.v)}</span><span class="ws-note">simplify each side (distribute / combine)</span></div></div>`);
  }

  function renderBalance(work) {
    const b = $('#wsBalance'); if (!b) return;
    b.querySelector('.pan.left b').innerHTML = work ? work.left : sideHTML(st.left, st.v);
    b.querySelector('.pan.right b').innerHTML = work ? work.right : sideHTML(st.right, st.v);
  }

  function renderPicks() {
    const seen = new Set(), picks = [];
    const addPick = (txt) => { if (!seen.has(txt)) { seen.add(txt); picks.push(txt); } };
    for (const e of [st.left, st.right]) {
      if (!qZero(e.c)) addPick(qStr(Q(Math.abs(e.c.n), e.c.d)));
      if (!qZero(e.x)) {
        const a = Q(Math.abs(e.x.n), e.x.d);
        if (!qOne(a)) addPick(qStr(a));
        if (a.d !== 1) addPick(String(a.d));
        addPick(qOne(a) ? st.v : `${qStr(a)}${st.v}`.replace(/^(\d+)\/(\d+)(\w)$/, '$1$3/$2'));
      }
    }
    $('#wsPicks').innerHTML = picks.slice(0, 7).map(p => `<button type="button" class="ws-pick" data-pick="${esc(p)}">${esc(p)}</button>`).join('');
    $('#wsPicks').querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => { $('#wsValue').value = b.dataset.pick; MQ().sfx('tap'); }));
  }

  function setFeedback(html, kind) {
    const f = $('#wsFeedback'); f.className = `ws-feedback ${kind || ''}`; f.innerHTML = html;
    f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop');
  }

  function apply() {
    if (!st) return;
    if (solvedValue(st) || special(st)) { setFeedback('This one is finished! Load a new equation or press 🎲.', 'info'); return; }
    const raw = $('#wsValue').value.trim();
    if (!raw) { setFeedback('Type a number (or tap one of the quick picks) to use with ' + op + '.', 'warn'); $('#wsValue').focus(); return; }
    let val;
    try { val = parseExpr(raw, { v: st.v }); } catch (e) { setFeedback('⚠️ ' + esc(e.message), 'warn'); return; }
    if ((op === '×' || op === '÷') && !qZero(val.x)) { setFeedback('Multiplying or dividing by x is beyond this workshop — use a number.', 'warn'); return; }
    if ((op === '×' || op === '÷') && qZero(val.c)) { setFeedback(op === '÷' ? 'Dividing by 0 is never allowed — it breaks math!' : 'Multiplying both sides by 0 makes 0 = 0. Balanced, but you lose all the information. Try another number.', 'warn'); MQ().sfx('bad'); return; }
    if ((op === '+' || op === '−') && qZero(val.x) && qZero(val.c)) { setFeedback('Adding or subtracting 0 changes nothing. Pick a different number.', 'warn'); return; }

    const before = { left: st.left, right: st.right };
    let left, right;
    if (op === '+') { left = lAdd(st.left, val); right = lAdd(st.right, val); }
    if (op === '−') { left = lSub(st.left, val); right = lSub(st.right, val); }
    if (op === '×') { left = lScale(st.left, val.c); right = lScale(st.right, val.c); }
    if (op === '÷') { left = lScale(st.left, qDiv(Q(1), val.c)); right = lScale(st.right, qDiv(Q(1), val.c)); }
    st.history.push({ left: st.left, right: st.right });
    st.left = left; st.right = right; hintLevel = 0;

    const valTxt = exprText(val, st.v);
    const chip = `${op} ${/\s/.test(valTxt) || valTxt.startsWith('−') ? `(${valTxt})` : valTxt}`;
    // Which terms cancel (zero pairs) on each side?
    const markFor = (b, a) => {
      const m = {};
      if (op === '+' || op === '−') {
        if (!qZero(b.c) && qZero(a.c) && !qZero(val.c)) m.c = 'cancel';
        if (!qZero(b.x) && qZero(a.x) && !qZero(val.x)) m.x = 'cancel';
      } else if (!qZero(b.x) && qOne(a.x) && !qOne(b.x)) m.x = 'cancel-coef';
      return m;
    };
    const mL = markFor(before.left, left), mR = markFor(before.right, right);
    const wrap = (e, m) => {
      const h = sideHTML(e, st.v, m);
      const multi = terms(e, st.v).length > 1 && (op === '×' || op === '÷');
      const chipCls = Object.values(m).some(Boolean) ? 'cancel' : '';
      return `${multi ? '(' : ''}${h}${multi ? ')' : ''} <span class="opchip ${chipCls}">${esc(chip)}</span>`;
    };
    const verb = { '+': `add ${valTxt} to`, '−': `subtract ${valTxt} from`, '×': `multiply`, '÷': `divide` }[op];
    const note = op === '+' || op === '−' ? `${verb} both sides` : `${verb} both sides by ${valTxt}`;

    let shortcut = '';
    const canceledSide = Object.keys(mL).length ? 'left' : Object.keys(mR).length ? 'right' : null;
    if (canceledSide && shortcutOn) {
      const other = canceledSide === 'left' ? 'right' : 'left';
      const src = canceledSide === 'left' ? before.left : before.right;
      const m = canceledSide === 'left' ? mL : mR;
      let gone = '';
      if (m.c) gone = qStr(src.c, true).replace(/\s/g, '');
      else if (m.x === 'cancel') { const t = xText(src.x, st.v); gone = `${t.neg ? '−' : '+'}${t.body}`; }
      else if (m.x === 'cancel-coef') gone = `× ${qStr(src.x)}`;
      shortcut = `<div class="ws-shortcut">↔️ <b>Shortcut view:</b> the <b>${esc(gone)}</b> vanished from the ${canceledSide} side and showed up on the ${other} side as <b>${esc(chip)}</b>. That is ALL "moving it across the = sign" means — you really did <i>${esc(note)}</i>.</div>`;
    }

    $('#wsPaper').insertAdjacentHTML('beforeend', `<div class="ws-step new">
      <div class="ws-line work"><span class="ws-side l">${wrap(before.left, mL)}</span><span class="ws-eq">=</span><span class="ws-side r">${wrap(before.right, mR)}</span><span class="ws-note">${esc(note)}</span></div>
      <div class="ws-line result"><span class="ws-side l">${sideHTML(left, st.v)}</span><span class="ws-eq">=</span><span class="ws-side r">${sideHTML(right, st.v)}</span></div>
      ${shortcut}</div>`);
    $('#wsPaper').lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

    // Balance animation: left gets the move → tilts; right gets it → level again.
    const bal = $('#wsBalance');
    renderBalance({ left: wrap(before.left, {}), right: sideHTML(before.right, st.v) });
    bal.classList.remove('tilt', 'level'); void bal.offsetWidth; bal.classList.add('tilt');
    MQ().sfx('tap');
    setTimeout(() => { renderBalance({ left: wrap(before.left, {}), right: wrap(before.right, {}) }); bal.classList.remove('tilt'); bal.classList.add('level'); MQ().sfx('whoosh'); }, 650);
    setTimeout(() => { renderBalance(); bal.classList.remove('level'); renderPicks(); }, 1500);

    $('#wsValue').value = '';
    const sv = solvedValue(st), sp = special(st);
    const cb = complexity(before), ca = complexity(st);
    if (sv) setTimeout(() => win(sv), 1300);
    else if (sp === 'all') setFeedback('🤯 Both sides are identical — <b>every</b> number works! (This is called an identity.)', 'good');
    else if (sp === 'none') setFeedback('🚫 The x-terms canceled and left a false statement, so <b>no number</b> works. (No solution.)', 'good');
    else if (ca < cb) { setFeedback('✅ <b>Balanced, and simpler!</b> Great move. What is still attached to ' + st.v + '?', 'good'); }
    else if (ca === cb) setFeedback(`⚖️ <b>Still balanced</b> — every legal move keeps it true. But ${st.v} isn't any more alone. Try the <i>opposite</i> of what is attached to ${st.v}, or ↶ Undo.`, 'warn');
    else { setFeedback(`⚖️ <b>Still balanced</b> — but that made it messier. That's OK! Tap ↶ Undo and use the <b>opposite</b> operation instead.`, 'warn'); MQ().sfx('bad'); }
  }

  function win(val) {
    const v = st.v, vs = qStr(val);
    const bare = val.n < 0 || val.d !== 1 ? `(${vs})` : vs;
    const sub = side => sideOfOriginal(side).replace(new RegExp(`(\\d|\\))\\s*${v}`, 'g'), `$1·(${vs})`).replace(new RegExp(v, 'g'), bare);
    const lv = qStr(lEval(st.origL, val)), rv = qStr(lEval(st.origR, val));
    const ok = qEq(lEval(st.origL, val), lEval(st.origR, val));
    setFeedback(`🎉 <b>${esc(v)} = ${esc(vs)}</b> — solved with legal moves only!`, 'good');
    const c = $('#wsCheck');
    c.hidden = false;
    c.innerHTML = `<b>✔ Check it:</b> put ${esc(v)} = ${esc(vs)} back into the ORIGINAL equation<div class="ws-check-line"><span>${esc(sub(0))}</span><span class="ws-eq">=</span><span>${esc(sub(1))}</span></div><div class="ws-check-line final"><span>${esc(lv)}</span><span class="ws-eq">${ok ? '=' : '≠'}</span><span>${esc(rv)}</span> <span class="ws-ok">${ok ? '✓ Both sides match!' : '✗'}</span></div>`;
    MQ().celebrate(); MQ().sfx('win');
    if (!rewardGiven) { rewardGiven = true; MQ().addXP(5); MQ().toast('+5 XP — Workshop solve!'); }
  }

  function undo() {
    if (!st || !st.history.length) { MQ().toast('Nothing to undo'); return; }
    const prev = st.history.pop(); st.left = prev.left; st.right = prev.right;
    const steps = $('#wsPaper').querySelectorAll('.ws-step.new'); steps[steps.length - 1]?.remove();
    $('#wsCheck').hidden = true; renderBalance(); renderPicks();
    setFeedback('↶ Undone. The balance is back where it was.', 'info');
  }

  function hint() {
    if (!st) return;
    if (solvedValue(st) || special(st)) return;
    hintLevel++;
    const v = st.v, L0 = st.left, R0 = st.right;
    let q, a;
    if (!qZero(L0.x) && !qZero(R0.x)) {
      const t = xText(R0.x, v);
      q = `There is ${v} on BOTH sides. Get rid of the ${v}-term on one side first.`;
      a = `Try: <b>${t.neg ? '+' : '−'} ${t.body}</b> on both sides.`;
    } else {
      const xs = qZero(L0.x) ? R0 : L0, sideName = qZero(L0.x) ? 'right' : 'left';
      if (!qZero(xs.c)) {
        q = `On the ${sideName} side, ${qStr(xs.c, true).replace(' ', '')} is stuck to the ${v}-term. What is the opposite of ${xs.c.n < 0 ? 'subtracting' : 'adding'} ${qStr(Q(Math.abs(xs.c.n), xs.c.d))}?`;
        a = `Try: <b>${xs.c.n < 0 ? '+' : '−'} ${qStr(Q(Math.abs(xs.c.n), xs.c.d))}</b> on both sides.`;
      } else if (xs.x.d !== 1 && Math.abs(xs.x.n) === 1) {
        q = `${v} is being divided by ${xs.x.d}${xs.x.n < 0 ? ' (and is negative)' : ''}. What undoes dividing?`;
        a = `Try: <b>× ${xs.x.n < 0 ? '−' : ''}${xs.x.d}</b> on both sides.`;
      } else {
        q = `${v} is being multiplied by ${qStr(xs.x)}. What undoes multiplying?`;
        a = `Try: <b>÷ ${qStr(xs.x)}</b> on both sides.`;
      }
    }
    setFeedback(`💡 ${esc(q).replace(/&lt;b&gt;|&lt;\/b&gt;/g, '')}${hintLevel > 1 ? `<br>${a}` : '<br><small>Tap 💡 again for a stronger hint.</small>'}`, 'info');
  }

  const RANDOM = {
    1: () => pick([
      () => { const x = rand(2, 15), a = rand(2, 12); return `x + ${a} = ${x + a}`; },
      () => { const x = rand(8, 20), a = rand(2, 7); return `x - ${a} = ${x - a}`; },
      () => { const x = rand(2, 12), m = rand(2, 9); return `${m}x = ${m * x}`; },
      () => { const d = rand(2, 6), b = rand(2, 9); return `x/${d} = ${b}`; }
    ])(),
    2: () => pick([
      () => { const x = rand(2, 10), m = rand(2, 7), a = rand(1, 12); return `${m}x + ${a} = ${m * x + a}`; },
      () => { const x = rand(2, 10), m = rand(2, 7), a = rand(1, 12); return `${m}x - ${a} = ${m * x - a}`; },
      () => { const d = rand(2, 5), b = rand(2, 8), a = rand(1, 9); return `x/${d} + ${a} = ${b + a}`; }
    ])(),
    3: () => { const x = rand(2, 9), m1 = rand(4, 8), m2 = rand(1, m1 - 1), b = rand(1, 10), c = (m1 - m2) * x + b; return `${m1}x + ${b} = ${m2 === 1 ? '' : m2}x + ${c}`; },
    4: () => pick([
      () => { const x = rand(2, 8), a = rand(2, 5), b = rand(1, 6); return `${a}(x + ${b}) = ${a * (x + b)}`; },
      () => { const x = rand(4, 10), a = rand(2, 5), b = rand(1, 3), d = rand(1, 9); return `${a}(x - ${b}) + ${d} = ${a * (x - b) + d}`; }
    ])(),
    5: () => pick([
      () => { const x = rand(2, 9), m = rand(2, 6), a = rand(3, 20); return `-${m}x + ${a} = ${-m * x + a}`; },
      () => { const x = rand(-9, -2), m = rand(2, 6), a = rand(1, 9); return `${m}x + ${a} = ${m * x + a}`; },
      () => { const d = rand(2, 4), x = d * rand(-6, 6) || d, a = rand(1, 8); return `x/${d} - ${a} = ${x / d - a}`; }
    ])()
  };

  function render() {
    $('#workshopView').innerHTML = `
      <button class="back" id="wsBack">← Back</button>
      <div class="lesson-head"><div><div class="eyebrow">🛠️ EQUATION WORKSHOP</div><h1>Solve it like a pro</h1></div></div>
      <p class="muted ws-intro">Type <b>any</b> equation — even one from homework — or roll a random one. You choose each move; the workshop does it to <b>both sides</b> so you can see exactly why it works. No guessing needed!</p>
      <div class="card ws-card">
        <div class="ws-load">
          <input id="wsInput" autocomplete="off" spellcheck="false" aria-label="Equation to solve" placeholder="Try: 3x + 6 = 18  or  2(x - 4) = x + 5">
          <button id="wsLoad" class="primary" type="button">Load</button>
        </div>
        <div class="ws-random"><span>🎲 Random:</span>
          <button type="button" data-level="1">One-step</button><button type="button" data-level="2">Two-step</button>
          <button type="button" data-level="3">x on both sides</button><button type="button" data-level="4">Parentheses</button><button type="button" data-level="5">Negatives</button>
        </div>
        <div id="wsError" class="ws-error" hidden></div>

        <div id="wsBalance" class="ws-balance" aria-hidden="true">
          <div class="beam"><div class="pan left"><b></b></div><div class="pan right"><b></b></div></div>
          <div class="post"></div><div class="base"></div>
        </div>

        <div class="ws-paper" id="wsPaper" aria-live="polite"></div>
        <div id="wsCheck" class="ws-check" hidden></div>
        <div id="wsFeedback" class="ws-feedback info"></div>

        <div class="ws-pad">
          <div class="ws-ops" role="radiogroup" aria-label="Operation">
            ${['+', '−', '×', '÷'].map(o => `<button type="button" class="ws-op ${o === op ? 'active' : ''}" data-op="${o}" aria-label="${{'+':'add','−':'subtract','×':'multiply','÷':'divide'}[o]}">${o}</button>`).join('')}
          </div>
          <input id="wsValue" autocomplete="off" inputmode="text" aria-label="Value" placeholder="6, 3x, 1/2 …">
          <button id="wsApply" class="primary ws-apply" type="button">Do it to BOTH sides ⚖️</button>
        </div>
        <div class="ws-picks-row"><small>Quick picks:</small><div id="wsPicks" class="ws-picks"></div></div>
        <div class="ws-tools">
          <button id="wsHint" type="button" class="secondary">💡 Hint</button>
          <button id="wsUndo" type="button" class="secondary">↶ Undo</button>
          <label class="ws-toggle"><input id="wsShortcut" type="checkbox" checked> Show the "moving across" shortcut</label>
        </div>
      </div>
      <div class="card ws-legend">
        <h3>How to read the notebook</h3>
        <div class="lesson-strip">
          <div class="rule"><strong>1 • CHOOSE</strong>Pick the <i>opposite</i> of what is attached to x.</div>
          <div class="rule"><strong>2 • BOTH SIDES</strong>The <span class="opchip">− 6</span> chip lands on each side. The scale tips, then levels.</div>
          <div class="rule"><strong>3 • CANCEL</strong><span class="wt cancel-demo">+ 6</span> and <span class="opchip cancel-demo">− 6</span> make zero — they get crossed out.</div>
        </div>
      </div>`;
    $('#wsBack').addEventListener('click', () => { if (returnTo) returnTo(); });
    $('#wsLoad').addEventListener('click', () => load($('#wsInput').value));
    $('#wsInput').addEventListener('keydown', e => { if (e.key === 'Enter') load($('#wsInput').value); });
    document.querySelectorAll('#workshopView [data-level]').forEach(b => b.addEventListener('click', () => { load(RANDOM[b.dataset.level]()); MQ().sfx('tap'); }));
    document.querySelectorAll('#workshopView .ws-op').forEach(b => b.addEventListener('click', () => {
      op = b.dataset.op; document.querySelectorAll('#workshopView .ws-op').forEach(x => x.classList.toggle('active', x === b)); MQ().sfx('tap');
    }));
    $('#wsApply').addEventListener('click', apply);
    $('#wsValue').addEventListener('keydown', e => {
      if (e.key === 'Enter') apply();
      const map = { '+': '+', '-': '−', '*': '×', '/': '÷' };
      if (map[e.key] && !e.target.value) { e.preventDefault(); document.querySelector(`#workshopView .ws-op[data-op="${map[e.key]}"]`)?.click(); }
    });
    $('#wsUndo').addEventListener('click', undo);
    $('#wsHint').addEventListener('click', hint);
    $('#wsShortcut').addEventListener('change', e => { shortcutOn = e.target.checked; document.querySelectorAll('#workshopView .ws-shortcut').forEach(n => n.hidden = !shortcutOn); });
  }

  let rendered = false;
  window.MathWorkshop = {
    open(equation, back, backLabel) {
      if (!rendered) { render(); rendered = true; }
      returnTo = back; $('#wsBack').textContent = backLabel || '← Back';
      if (equation) load(equation, true);
      else if (!st) load(RANDOM[2]());
    },
    parseEquation, parseExpr
  };
})();
