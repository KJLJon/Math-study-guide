/*
  SOLVE ACTIVITY — the interactive equation engine.

  The learner never types a guess for x. Instead she:
    1. TAPS the part that is stuck to x (or DRAGS it across the = sign),
    2. CHOOSES how to undo it (the opposite operation, on BOTH sides),
    3. WATCHES it happen: chips land on both sides of the scale, zero pairs
       cancel, and a "shortcut" replay shows the same move as "moving across".
  Unhelpful taps are not applied — the guide explains why instead.
  At the end she checks the answer by plugging it back in.

  Help fades with ctx.level: 0 Learn (narrated + glowing targets),
  1 Practice (questions, glow after a miss), 2 Solo, 3 Boss (she does the arithmetic).
*/
(() => {
  const MQ = window.MQ;
  const { Q, L, esc, sleep, qZero, qOne, qStr, qPretty, qAbs, qNeg, qEq, qDiv, qMul } = MQ;
  MQ.act = MQ.act || {};

  /* ---------- text helpers ---------- */
  const signed = (q, first) => {
    const body = qPretty(qAbs(q));
    if (first) return (q.n < 0 ? '−' : '') + body;
    return `${q.n < 0 ? '−' : '+'} ${body}`;
  };
  function coefText(a, v) {
    if (qOne(a)) return v;
    if (qEq(a, Q(-1))) return '−' + v;
    if (a.d !== 1 && Math.abs(a.n) === 1) return `${a.n < 0 ? '−' : ''}${v}/${a.d}`;
    if (a.d !== 1) return `${a.n < 0 ? '−' : ''}(${qStr(qAbs(a))})${v}`;
    return `${qStr(a)}${v}`;
  }
  function exprText(e, v) {
    const parts = [];
    if (!qZero(e.x)) parts.push(coefText(e.x, v));
    if (!qZero(e.c)) parts.push(signed(e.c, !parts.length));
    return parts.length ? parts.join(' ') : '0';
  }
  MQ.exprText = exprText;

  // Detect "a(x ± b)" so the first move can be "divide by a" or "distribute".
  function detectGroup(sideText) {
    const t = sideText.replace(/\s+/g, '').replace(/[−–]/g, '-');
    const m = t.match(/^(-?\d+)\(([a-z])([+-]\d+(?:\.\d+)?)\)$/i);
    if (!m) return null;
    return { a: Q(Number(m[1])), inner: L(Q(1), MQ.qFromText(m[3])) };
  }

  /* ---------- the scale (balance) ---------- */
  function scaleHTML() {
    return `<div class="scale" aria-hidden="true">
      <div class="beam"></div>
      <div class="pan L"><div class="pan-items"></div><div class="pan-dish"></div></div>
      <div class="pan R"><div class="pan-items"></div><div class="pan-dish"></div></div>
      <div class="fulcrum"></div></div>`;
  }
  const blockable = e => e.x.d === 1 && e.c.d === 1 && e.x.n >= 0 && e.x.n <= 5 && e.c.n >= 0 && e.c.n <= 20;
  function panHTML(e, v, blocks, groups = 1) {
    if (blocks) {
      const bags = Array.from({ length: e.x.n }, () => `<span class="bag">${esc(v)}</span>`);
      const blks = Array.from({ length: e.c.n }, () => `<i class="blk"></i>`);
      if (groups > 1) {
        const bp = e.x.n / groups, cp = e.c.n / groups, rows = [];
        for (let g = 0; g < groups; g++) rows.push(`<div class="grp" data-g="${g}">${bags.slice(g * bp, (g + 1) * bp).join('')}${blks.slice(g * cp, (g + 1) * cp).join('')}</div>`);
        return rows.join('');
      }
      return (bags.join('') + blks.join('')) || '<span class="pan-zero">0</span>';
    }
    return `<span class="pan-text">${esc(exprText(e, v))}</span>`;
  }

  /* ---------- main ---------- */
  async function runSolve(spec, ctx, host) {
    const parsed = MQ.parseEquation(spec.eq);
    const v = parsed.v;
    const st = {
      v, left: parsed.left, right: parsed.right,
      group: { L: detectGroup(spec.eq.split('=')[0]), R: detectGroup(spec.eq.split('=')[1]) },
      original: spec.eq.trim(), origL: parsed.left, origR: parsed.right
    };
    const useBlocks = !!spec.blocks;
    host.insertAdjacentHTML('beforeend', `<div class="solve">
      ${scaleHTML()}
      <div class="trail"></div>
      <div class="eqn-wrap"><div class="eqn"></div><div class="eqn-tools"></div></div>
      <div class="shortcut" hidden></div>
      <div class="check-panel" hidden></div></div>`);
    const root = host.lastElementChild;
    const scale = MQ.$('.scale', root), eqn = MQ.$('.eqn', root), trail = MQ.$('.trail', root), tools = MQ.$('.eqn-tools', root), shortcutEl = MQ.$('.shortcut', root);
    const solution = MQ.solveLinear(st.left, st.right);

    const sideOf = k => k === 'L' ? st.left : st.right;
    const setSide = (k, e) => { if (k === 'L') st.left = e; else st.right = e; };
    const blocksNow = () => useBlocks && blockable(st.left) && blockable(st.right) && !st.group.L && !st.group.R;

    function renderScale(groups = 1) {
      const b = blocksNow();
      scale.classList.toggle('text-mode', !b);
      MQ.$('.pan.L .pan-items', scale).innerHTML = st.group.L ? `<span class="pan-text">${esc(groupText(st.group.L))}</span>` : panHTML(st.left, v, b, groups);
      MQ.$('.pan.R .pan-items', scale).innerHTML = st.group.R ? `<span class="pan-text">${esc(groupText(st.group.R))}</span>` : panHTML(st.right, v, b, groups);
    }
    const groupText = g => `${qStr(g.a)}(${exprText(g.inner, v)})`;

    function sideChips(k) {
      const g = st.group[k];
      if (g) return `<span class="chip tap coef" data-side="${k}" data-part="gcoef">${esc(qStr(g.a))}</span><span class="paren">(</span><span class="ginner" data-side="${k}" data-part="ginner">${esc(exprText(g.inner, v))}</span><span class="paren">)</span>`;
      const e = sideOf(k), out = [];
      if (!qZero(e.x)) {
        const a = e.x;
        let inner;
        if (qOne(a)) inner = `<span class="xvar">${esc(v)}</span>`;
        else if (a.d !== 1 && Math.abs(a.n) === 1) inner = `${a.n < 0 ? '<span class="chip tap coef neg" data-side="' + k + '" data-part="coef">−</span>' : ''}<span class="frac"><span class="xvar">${esc(v)}</span><span class="chip tap den" data-side="${k}" data-part="den">${a.d}</span></span>`;
        else inner = `<span class="chip tap coef" data-side="${k}" data-part="coef">${esc(qEq(a, Q(-1)) ? '−' : a.d !== 1 ? '(' + qStr(a) + ')' : qStr(a))}</span><span class="xvar">${esc(v)}</span>`;
        out.push(`<span class="term xterm tap" data-side="${k}" data-part="xterm">${inner}</span>`);
      }
      if (!qZero(e.c)) out.push(`<span class="term chip tap const" data-side="${k}" data-part="const">${esc(signed(e.c, !out.length))}</span>`);
      if (!out.length) out.push('<span class="term zero">0</span>');
      return out.join(' ');
    }
    // Shrink the equation font until it fits the card (phones are narrow).
    function fit() {
      eqn.style.fontSize = '';
      let size = parseFloat(getComputedStyle(eqn).fontSize), guard = 0;
      while (eqn.scrollWidth > eqn.clientWidth + 1 && size > 15 && guard++ < 30) { size -= 2; eqn.style.fontSize = size + 'px'; }
    }
    function renderEqn() {
      eqn.innerHTML = `<div class="side" data-side="L">${sideChips('L')}</div><div class="eqsign">=</div><div class="side" data-side="R">${sideChips('R')}</div>`;
      tools.innerHTML = (st.group.L || st.group.R) ? `<button type="button" class="mini-btn" data-distribute>✳️ Distribute instead</button>` : '';
      MQ.replay(eqn, 'enter'); fit();
    }

    /* --- which side has x? is it solved? --- */
    const hasX = k => st.group[k] ? true : !qZero(sideOf(k).x);
    function solvedSide() {
      for (const k of ['L', 'R']) {
        const o = k === 'L' ? 'R' : 'L';
        const e = sideOf(k);
        if (!st.group[k] && qOne(e.x) && qZero(e.c) && !hasX(o)) return k;
      }
      return null;
    }
    function special() {
      if (hasX('L') || hasX('R')) return null;
      return qEq(st.left.c, st.right.c) ? 'all' : 'none';
    }

    /* --- the best move right now (for narration, hints, glow) --- */
    function bestPick() {
      for (const k of ['L', 'R']) if (st.group[k]) return hasX(k === 'L' ? 'R' : 'L') ? { side: k, part: 'distribute' } : { side: k, part: 'gcoef' };
      const xl = hasX('L'), xr = hasX('R');
      if (xl && xr) {
        const small = Math.abs(MQ.qNum(st.left.x)) <= Math.abs(MQ.qNum(st.right.x)) ? 'L' : 'R';
        return { side: small, part: 'xterm' };
      }
      const S = xl ? 'L' : 'R', e = sideOf(S);
      if (!qZero(e.c)) return { side: S, part: 'const' };
      return { side: S, part: e.x.d !== 1 && Math.abs(e.x.n) === 1 ? (e.x.n < 0 ? 'coef' : 'den') : 'coef' };
    }
    const chipFor = p => p.part === 'distribute' ? MQ.$('[data-distribute]', tools) : MQ.$(`[data-side="${p.side}"][data-part="${p.part}"]`, eqn);

    function judge(p) {
      const g = st.group[p.side];
      const other = p.side === 'L' ? 'R' : 'L';
      if (g) {
        if (p.part === 'ginner') return `Those are locked inside the parentheses. Undo the <b>${qStr(g.a)} ×</b> first (tap the ${qStr(g.a)}), or tap <b>Distribute</b>.`;
        if (hasX(other)) return 'x is on both sides — tap <b>Distribute</b> first so you can gather the x-terms.';
        return null;
      }
      const e = sideOf(p.side), xl = hasX('L'), xr = hasX('R');
      if (xl && xr) {
        if (p.part === 'coef' || p.part === 'den') return `x is on <b>both</b> sides. Before you divide, gather the x's on one side: tap a whole x-term like <b>${esc(coefText(sideOf(other).x, v))}</b>.`;
        return null;
      }
      const S = xl ? 'L' : 'R';
      if (p.side !== S) return `That number is already by itself on its side. We want <b>${esc(v)}</b> alone — look at what is stuck to ${esc(v)}.`;
      if (p.part === 'xterm') return `If ${esc(v)} leaves, it's gone from the side we're working on! Undo what's <b>attached</b> to ${esc(v)} instead.`;
      if ((p.part === 'coef' || p.part === 'den') && !qZero(e.c)) {
        return `Not yet! ${esc(v)} was ${p.part === 'den' ? 'divided' : 'multiplied'} FIRST, then <b>${esc(signed(e.c, false))}</b> was added on. Unwrap from the outside: undo the <b>${esc(signed(e.c, false))}</b> first. <small>(${p.part === 'den' ? 'Multiplying' : 'Dividing'} now would have to hit EVERY term.)</small>`;
      }
      return null;
    }

    /* --- narration for the "pick" step --- */
    function narratePick(attempt) {
      const best = bestPick();
      const lvl = ctx.level;
      const e = sideOf(best.side);
      let txt;
      if (best.part === 'distribute') {
        txt = lvl === 0 ? `x is on BOTH sides, and one side has parentheses. First <b>distribute</b>: multiply every term inside by the number outside. Tap <b>Distribute</b>.` : `Parentheses AND x on both sides. What should you do first?`;
      } else if (best.part === 'gcoef') {
        const g = st.group[best.side];
        txt = lvl === 0 ? `<b>${qStr(g.a)}(…)</b> means ${qStr(g.a)} TIMES the whole group. Tap the <b>${qStr(g.a)}</b> to undo the multiplying.` : `What is the group being multiplied by? Undo it — or distribute.`;
      } else if (best.part === 'xterm') {
        txt = lvl === 0 ? `${esc(v)} is on <b>both sides</b>. Gather them: tap <b>${esc(coefText(e.x, v))}</b> (or drag it across the =).` : `${esc(v)} is on both sides. Which ${esc(v)}-term will you move?`;
      } else if (best.part === 'const') {
        txt = lvl === 0 ? `What's stuck to ${esc(v)}? <b>${esc(signed(e.c, false))}</b> is ${e.c.n > 0 ? 'added on' : 'taken away'}. Tap it — or drag it across the = sign.` : lvl === 1 ? `What is stuck to ${esc(v)} that comes off first? Tap it (or drag it across).` : `Your move! Tap or drag what you want to undo.`;
      } else if (best.part === 'den') {
        txt = lvl === 0 ? `${esc(v)}/${e.x.d} means ${esc(v)} <b>divided by ${e.x.d}</b>. Tap the <b>${e.x.d}</b> to undo it.` : lvl === 1 ? `What is ${esc(v)} being divided by? Tap it.` : `Your move!`;
      } else {
        const a = e.x;
        txt = lvl === 0 ? (qEq(a, Q(-1)) ? `−${esc(v)} means −1 × ${esc(v)}. Tap the <b>−</b> sign to undo it.` : `<b>${esc(coefText(a, v))}</b> means ${qPretty(a)} <b>TIMES</b> ${esc(v)}. Tap the <b>${qPretty(a)}</b>.`) : lvl === 1 ? `Only one thing is left stuck to ${esc(v)}. Tap it.` : `Your move!`;
      }
      if (ctx.isDemo()) {
        const demoTxt = {
          distribute: `👀 <b>Watch me.</b> There are parentheses AND x on both sides, so first I'll <b>distribute</b> — multiply every term inside by the number outside.`,
          gcoef: `👀 <b>Watch me.</b> The whole group is being multiplied. I'll undo that multiplying first.`,
          xterm: `👀 <b>Watch me.</b> x is on BOTH sides. I'll gather the x's by moving <b>${esc(coefText(e.x, v))}</b>.`,
          const: `👀 <b>Watch me.</b> What's stuck to ${esc(v)}? <b>${esc(signed(e.c, false))}</b> was ${e.c.n > 0 ? 'added on' : 'taken away'} last, so I'll undo it first.`,
          den: `👀 <b>Watch me.</b> ${esc(v)} is being <b>divided by ${e.x.d}</b>. I'll undo that next.`,
          coef: `👀 <b>Watch me.</b> <b>${esc(coefText(e.x, v))}</b> means ${qPretty(e.x)} TIMES ${esc(v)}. I'll undo the multiplying.`
        };
        txt = demoTxt[best.part] || txt;
      }
      ctx.say(txt);
      const glow = ctx.isDemo() || lvl === 0 || (lvl === 1 && attempt > 0);
      MQ.$$('.glow', eqn).forEach(n => n.classList.remove('glow'));
      if (glow) chipFor(best)?.classList.add('glow');
    }

    /* --- wait for a tap or drag on a chip --- */
    function waitPick() {
      return new Promise(resolve => {
        let drag = null;
        const finish = p => { cleanup(); resolve(p); };
        const onDown = ev => {
          const dist = ev.target.closest('[data-distribute]');
          if (dist) { finish({ part: 'distribute' }); return; }
          const chip = ev.target.closest('[data-part]');
          if (!chip || !eqn.contains(chip)) return;
          ev.preventDefault();
          drag = { chip, x: ev.clientX, y: ev.clientY, moved: false, ghost: null, id: ev.pointerId };
          try { eqn.setPointerCapture(ev.pointerId); } catch {}
        };
        const onMove = ev => {
          if (!drag) return;
          const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
          if (!drag.moved && Math.hypot(dx, dy) > 10) {
            drag.moved = true;
            const r = drag.chip.getBoundingClientRect();
            drag.ghost = document.createElement('div'); drag.ghost.className = 'flyer dragging'; drag.ghost.textContent = drag.chip.textContent.trim();
            Object.assign(drag.ghost.style, { left: `${r.left}px`, top: `${r.top}px`, minWidth: `${r.width}px`, height: `${r.height}px` });
            document.body.appendChild(drag.ghost); drag.chip.classList.add('lifted'); eqn.classList.add('dragging');
          }
          if (drag.moved) drag.ghost.style.transform = `translate(${dx}px, ${dy}px) rotate(-4deg) scale(1.1)`;
        };
        const onUp = ev => {
          if (!drag) return;
          const d = drag; drag = null;
          d.chip.classList.remove('lifted'); eqn.classList.remove('dragging');
          if (d.ghost) d.ghost.remove();
          const p = { side: d.chip.dataset.side, part: d.chip.dataset.part, dragged: false };
          if (!d.moved) { MQ.sfx('pick'); finish(p); return; }
          const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.side, .eqsign');
          const target = over?.classList.contains('eqsign') ? null : over?.dataset.side;
          if (target && target !== p.side) { p.dragged = true; MQ.sfx('whoosh'); finish(p); }
          else if (over?.classList.contains('eqsign')) { ctx.say('Drop it all the way on the <b>other side</b> of the = sign.'); }
        };
        const onClick = ev => { const dist = ev.target.closest('[data-distribute]'); if (dist) finish({ part: 'distribute' }); };
        const cleanup = () => { eqn.removeEventListener('pointerdown', onDown); eqn.removeEventListener('pointermove', onMove); eqn.removeEventListener('pointerup', onUp); eqn.removeEventListener('pointercancel', onUp); tools.removeEventListener('click', onClick); };
        eqn.addEventListener('pointerdown', onDown); eqn.addEventListener('pointermove', onMove); eqn.addEventListener('pointerup', onUp); eqn.addEventListener('pointercancel', onUp);
        tools.addEventListener('click', onClick);
      });
    }

    /* --- build the operation for a pick, and the answer choices --- */
    function opFor(p) {
      const g = st.group[p.side], e = sideOf(p.side);
      const sideName = p.side === 'L' ? 'left' : 'right';
      if (p.part === 'gcoef' || p.part === 'coef' || p.part === 'den') {
        const a = g ? g.a : e.x;                   // multiply by 1/a undoes it
        const neg = a.n < 0, nice = qPretty(a);
        const disp = neg ? `(${nice})` : nice;
        if (p.part === 'den') {
          const d = String(a.d);
          return { kind: 'mul', factor: Q(a.d * (neg ? -1 : 1)), chip: `× ${neg ? '(−' + d + ')' : d}`, label: `× ${d}`, from: `÷ ${d}`,
            options: [
              { t: `× ${d} on both sides`, ok: true },
              { t: `÷ ${d} on both sides`, why: `${esc(v)} is already being divided by ${d}. Dividing again goes the wrong way — the opposite of ÷ is ×.` },
              { t: `− ${d} on both sides`, why: `${esc(v)}/${d} means ${esc(v)} DIVIDED by ${d}, not minus ${d}. The opposite of ÷ is ×.` },
              { t: `× ${d} on the ${sideName} side only`, why: 'Only one side? The scale would tip and the equation would be false. Do it to BOTH sides.' }
            ] };
        }
        const label = `÷ ${disp}`;
        return { kind: 'mul', factor: qDiv(Q(1), a), chip: label, label, from: `× ${disp}`,
          options: [
            { t: `÷ ${disp} on both sides`, ok: true },
            { t: `− ${nice.replace('−', '')} on both sides`, why: `${esc(coefText(a, v))} means ${nice} <b>TIMES</b> ${esc(v)}, not ${nice} plus ${esc(v)}. The opposite of × is ÷.` },
            { t: `× ${disp} on both sides`, why: 'That would multiply again and make it bigger. Undo × with ÷.' },
            { t: `÷ ${disp} on the ${sideName} side only`, why: 'Only one side? The scale tips! Whatever you do to one side, do to the other.' }
          ] };
      }
      if (p.part === 'const') {
        const c = e.c, val = qPretty(qAbs(c)), inv = c.n > 0 ? '−' : '+', same = c.n > 0 ? '+' : '−';
        return { kind: 'add', delta: L(Q(0), qNeg(c)), chip: `${inv} ${val}`, label: `${inv} ${val}`, from: `${same} ${val}`,
          options: [
            { t: `${inv} ${val} on both sides`, ok: true },
            { t: `${same} ${val} on both sides`, why: `That ${same === '+' ? 'adds' : 'takes away'} even more! To undo ${same} ${val}, do the <b>opposite</b>: ${inv} ${val}.` },
            { t: `${inv} ${val} on the ${sideName} side only`, why: 'Only one side? The scale would tip and the equation would be false. Do it to BOTH sides.' },
            { t: `÷ ${val} on both sides`, why: `÷ undoes ×. But this ${val} is being <b>${c.n > 0 ? 'added' : 'subtracted'}</b>, so undo it with ${inv}.` }
          ] };
      }
      // whole x-term
      const a = e.x, tt = coefText(qAbs(a), v), inv = a.n > 0 ? '−' : '+', same = a.n > 0 ? '+' : '−';
      return { kind: 'add', delta: L(qNeg(a), Q(0)), chip: `${inv} ${tt}`, label: `${inv} ${tt}`, from: `${same} ${tt}`,
        options: [
          { t: `${inv} ${tt} on both sides`, ok: true },
          { t: `${same} ${tt} on both sides`, why: `That piles on more ${esc(v)}'s. To remove ${same} ${tt}, do the opposite: ${inv} ${tt}.` },
          { t: `${inv} ${tt} on the ${sideName} side only`, why: 'Only one side? The scale tips! Do it to BOTH sides.' }
        ] };
    }

    /* --- do the move with animations --- */
    async function applyMove(p, op) {
      const other = p.side === 'L' ? 'R' : 'L';
      const beforeTxt = lineText();
      const g = st.group[p.side];
      // 1. Chips land on both sides; the scale tips, then levels.
      const sideEls = { L: MQ.$('.side[data-side="L"]', eqn), R: MQ.$('.side[data-side="R"]', eqn) };
      const picked = chipFor(p);
      const heavier = op.kind === 'add' ? (MQ.qNum(op.delta.c) + MQ.qNum(op.delta.x) > 0) : Math.abs(MQ.qNum(op.factor)) > 1;
      const addChip = k => {
        const multi = op.kind === 'mul' && MQ.$$('.term', sideEls[k]).length > 1;
        if (multi) { sideEls[k].insertAdjacentHTML('afterbegin', '<span class="paren">(</span>'); sideEls[k].insertAdjacentHTML('beforeend', '<span class="paren">)</span>'); }
        sideEls[k].insertAdjacentHTML('beforeend', ` <span class="opchip land">${esc(op.chip)}</span>`);
        fit();
        return sideEls[k].lastElementChild;
      };
      MQ.sfx('pop');
      const chipS = addChip(p.side);
      scale.className = scale.className.replace(/ tip-\w+/g, '') + (heavier ? (p.side === 'L' ? ' tip-left' : ' tip-right') : (p.side === 'L' ? ' tip-right' : ' tip-left'));
      ctx.say(`${esc(op.chip)} on the ${p.side === 'L' ? 'left' : 'right'}… the scale tips! ⚖️`);
      await sleep(ctx.level >= 2 ? 450 : 750);
      MQ.sfx('pop');
      const chipO = addChip(other);
      scale.className = scale.className.replace(/ tip-\w+/g, '');
      ctx.say(`…and ${esc(op.chip)} on the ${other === 'L' ? 'left' : 'right'}. Balanced again! ✅`);
      await sleep(ctx.level >= 2 ? 450 : 800);

      // 2. Zero pair / cancel on the picked side.
      picked?.classList.add('cancel'); chipS.classList.add('cancel');
      ctx.say(op.kind === 'add' ? `<b>${esc(op.from)}</b> and <b>${esc(op.chip)}</b> make zero — they cancel out!` : `<b>${esc(op.from)}</b> and <b>${esc(op.chip)}</b> undo each other!`);
      MQ.sfx('whoosh');
      // Scale: remove blocks / split into groups.
      if (blocksNow()) {
        if (op.kind === 'add') {
          const n = Math.abs(MQ.qNum(op.delta.c)), nx = Math.abs(MQ.qNum(op.delta.x));
          for (const k of ['L', 'R']) {
            const pan = MQ.$(`.pan.${k} .pan-items`, scale);
            MQ.$$('.blk', pan).slice(-n || 9999).slice(0, n).forEach(b => b.classList.add('leaving'));
            if (nx) MQ.$$('.bag', pan).slice(-nx).forEach(b => b.classList.add('leaving'));
          }
        } else {
          const groups = Math.round(Math.abs(1 / MQ.qNum(op.factor)));
          if (groups > 1) {
            renderScale(groups); await sleep(500);
            MQ.$$('.grp:not([data-g="0"])', scale).forEach(gr => gr.classList.add('leaving'));
          }
        }
      }
      await sleep(ctx.level >= 2 ? 500 : 900);

      // 3. Shortcut replay: the same move looks like a hop across the = sign.
      shortcutEl.hidden = false;
      shortcutEl.innerHTML = `↔️ <b>Shortcut:</b> it looks like <b>${esc(op.from)}</b> jumped across the = and turned into <b>${esc(op.chip)}</b>. That's all "moving it across" means!`;
      MQ.replay(shortcutEl, 'enter');
      if (picked) await MQ.fly(picked, chipO, { text: op.from, flipTo: op.chip, duration: ctx.level >= 2 ? 650 : 900 });
      chipO.classList.add('glow-once');

      // 4. Compute the new equation.
      let newP, newO;
      if (g) { newP = op.kind === 'mul' ? g.inner : MQ.lScale(g.inner, g.a); st.group[p.side] = null; }
      else newP = op.kind === 'add' ? MQ.lAdd(sideOf(p.side), op.delta) : MQ.lScale(sideOf(p.side), op.factor);
      newO = op.kind === 'add' ? MQ.lAdd(sideOf(other), op.delta) : MQ.lScale(sideOf(other), op.factor);

      // 5. Arithmetic on the other side: auto for Learn/Practice, she does it in Solo/Boss.
      const oBefore = sideOf(other);
      const numericOnly = qZero(oBefore.x) && qZero(newO.x);
      if (ctx.level >= 2 && numericOnly && !ctx.free) {
        const a = qPretty(oBefore.c), res = newO.c;
        const expr = op.kind === 'add' ? `${a} ${esc(op.chip)}` : `${a} ${esc(op.chip)}`;
        await ctx.number(`Now the arithmetic: <b>${expr} = ?</b>`, MQ.qNum(res), { hint: () => op.kind === 'add' ? `Start at ${a} and ${op.chip.startsWith('−') ? 'count back' : 'count up'} ${op.chip.slice(2)}.` : `${a} split into ${op.chip.slice(2)} equal groups.` });
      }
      setSide(p.side, newP); setSide(other, newO);
      trail.insertAdjacentHTML('beforeend', `<div class="trail-line"><span>${esc(beforeTxt)}</span><em>${esc(op.label)} both sides</em></div>`);
      MQ.replay(trail.lastElementChild, 'enter');
      renderScale(); renderEqn();
    }

    function lineText() {
      const s = k => st.group[k] ? groupText(st.group[k]) : exprText(sideOf(k), v);
      return `${s('L')} = ${s('R')}`;
    }

    /* --- loop --- */
    renderScale(); renderEqn();
    ctx.setHint(() => {
      const b = bestPick();
      chipFor(b)?.classList.add('glow');
      return b.part === 'distribute' ? 'Tap Distribute to open the parentheses first.' : b.part === 'xterm' ? `Gather the ${esc(v)}'s: move the ${esc(v)}-term that glows.` : b.part === 'const' ? 'Undo the + or − part first (it was added last). It glows now.' : 'Undo the multiplying or dividing — the glowing part.';
    });

    let guard = 0;
    while (!solvedSide() && !special() && guard++ < 12) {
      let attempt = 0, p;
      for (;;) {
        narratePick(attempt);
        if (ctx.isDemo()) { await ctx.next('▶ Show me'); p = { ...bestPick(), dragged: false }; MQ.sfx('pick'); break; }
        p = await waitPick();
        if (p.part === 'distribute') break;
        const why = judge(p);
        if (!why) break;
        attempt++; ctx.oops(why, 'pick'); chipFor(p)?.classList.add('shake-once');
        await sleep(1400);
      }
      if (p.part === 'distribute') {
        const k = st.group.L ? 'L' : 'R', g = st.group[k];
        const before = lineText();
        setSide(k, MQ.lScale(g.inner, g.a)); st.group[k] = null;
        trail.insertAdjacentHTML('beforeend', `<div class="trail-line"><span>${esc(before)}</span><em>distribute</em></div>`);
        ctx.say(`Distribute: ${qStr(g.a)} × ${esc(v)} and ${qStr(g.a)} × ${esc(qPretty(g.inner.c))}. Every term inside gets multiplied!`);
        MQ.sfx('whoosh'); renderScale(); renderEqn(); await sleep(1200);
        continue;
      }
      MQ.$$('.glow', eqn).forEach(n => n.classList.remove('glow'));
      chipFor(p)?.classList.add('selected');
      const op = opFor(p);
      const q = p.dragged
        ? `<b>${esc(op.from)}</b> crossed the = sign! What does it really mean?`
        : ctx.level === 0 ? `To undo <b>${esc(op.from)}</b>, use the <b>opposite</b> — and keep the scale balanced. Pick one:` : `How do you undo <b>${esc(op.from)}</b>?`;
      await ctx.ask(ctx.isDemo() ? `How do I undo <b>${esc(op.from)}</b>?` : q, MQ.shuffle(op.options), { tag: 'op', demoWhy: `It's the <b>opposite</b> of ${esc(op.from)}, and I do it to <b>both sides</b> so the scale stays balanced.` });
      const wasDemo = ctx.isDemo();
      await applyMove(p, op);
      ctx.moveDone();
      if (wasDemo && !ctx.isDemo() && !solvedSide()) { ctx.say('✋ <b>Your turn!</b> I did the first move — you finish it. 💪', 'yay'); MQ.sfx('good'); await sleep(1500); }
      shortcutEl.hidden = true;
    }

    const sp = special();
    if (sp) {
      ctx.say(sp === 'all' ? `🤯 The ${esc(v)}'s canceled and both sides match — <b>every</b> number works!` : `🚫 The ${esc(v)}'s canceled and left something false — <b>no</b> number works.`);
      await ctx.button('Got it ▶');
      return sp;
    }

    // Check by substitution.
    const k = solvedSide(), val = sideOf(k === 'L' ? 'R' : 'L').c;
    MQ.sfx('good');
    ctx.say(`🎉 <b>${esc(v)} = ${esc(qPretty(val))}</b>! But are we sure? Let's <b>check</b> by putting it back into the ORIGINAL equation.`);
    await ctx.button(`🔍 Check ${esc(v)} = ${esc(qPretty(val))}`);
    await showCheck(val);
    return val;

    async function showCheck(val) {
      const panel = MQ.$('.check-panel', root);
      const vs = qPretty(val), sub = val.n < 0 || val.d !== 1 ? `(${vs})` : vs;
      const sides = st.original.split('=').map(s => s.trim().replace(/-/g, '−').replace(/\*/g, '×')
        .replace(new RegExp(`(\\d|\\))\\s*${v}`, 'g'), `$1·(${vs})`).replace(new RegExp(v, 'g'), sub));
      const lv = MQ.lEval(st.origL, val), rv = MQ.lEval(st.origR, val);
      panel.hidden = false;
      panel.innerHTML = `<div class="check-title">🔍 Check: put <b>${esc(v)} = ${esc(vs)}</b> into <b>${esc(st.original.replace(/-/g, '−'))}</b></div>
        <div class="check-row"><span>${esc(sides[0])}</span><b>=</b><span>${esc(sides[1])}</span></div>
        <div class="check-row final"><span class="cv l">?</span><b class="cmp">=</b><span class="cv r">?</span></div>`;
      MQ.replay(panel, 'enter');
      await sleep(600);
      await Promise.all([MQ.countTo(MQ.$('.cv.l', panel), 0, MQ.qNum(lv), 700), MQ.countTo(MQ.$('.cv.r', panel), 0, MQ.qNum(rv), 700)]);
      MQ.$('.check-row.final', panel).classList.add('ok');
      MQ.$('.check-row.final', panel).insertAdjacentHTML('beforeend', '<em>✓ Both sides match!</em>');
      MQ.sfx('win'); MQ.celebrate(18);
      ctx.say(`Both sides equal ${esc(qPretty(lv))}. <b>${esc(v)} = ${esc(vs)}</b> is right — proven, not guessed! 💪`);
      await sleep(700);
    }
  }

  MQ.runSolve = runSolve;
  MQ.act.solve = async (spec, ctx) => {
    if (spec.story) ctx.stage.insertAdjacentHTML('beforeend', `<p class="story-mini">${esc(spec.story)}</p>`);
    const val = await runSolve(spec, ctx, ctx.stage);
    ctx.done(spec.unit && typeof val === 'object' ? `${esc(spec.v || 'x')} = ${esc(qPretty(val))} ${esc(spec.unit)}` : '');
  };
})();
