/*
  PERCENT ACTIVITY — a draggable percent bar (tape diagram).

  1. DRAG the bar to show the rate (ticks every 10%).
  2. If the problem gives an AFTER amount: TAP which part of the bar that amount is.
  3. TAP the part of the bar the question is asking for.
  4. Know the whole?  →  whole × decimal   (multiply forward)
     Need the whole?  →  decimal × ? = amount, undo the × by ÷  (divide backward)
  This is how the app answers "when do I multiply vs divide?" and "rate vs 1 − rate".

  spec: { mode: 'of'|'decrease'|'increase'|'whole'|'reverse'|'reverseUp', rate, whole, part, prompt, word }
*/
(() => {
  const MQ = window.MQ;
  const { esc, sleep, fmt, money } = MQ;
  MQ.act = MQ.act || {};

  const decimal = pct => fmt(pct / 100);
  const fracOf = pct => { const q = MQ.qFromNum(pct / 100); return q; };

  function mulHint(whole, pct) {
    if (pct === 50) return `50% is half: ${money(whole)} ÷ 2.`;
    if (pct === 25) return `25% is a quarter: ${money(whole)} ÷ 4.`;
    if (pct === 75) return `75% is three quarters: ${money(whole)} ÷ 4 × 3.`;
    const ten = whole / 10;
    return `Find 10% first: 10% of ${money(whole)} = ${money(ten)}. ${pct}% is ${fmt(pct / 10)} × ${money(ten)}.`;
  }
  function divHint(part, pct) {
    const q = fracOf(pct);
    return `${decimal(pct)} = ${q.n}/${q.d}. Dividing by ${q.n}/${q.d} is the same as ÷ ${q.n}, then × ${q.d}: ${money(part)} ÷ ${q.n} × ${q.d}.`;
  }

  MQ.act.percent = async (spec, ctx) => {
    const { mode, rate } = spec;
    const inc = mode === 'increase' || mode === 'reverseUp';
    const max = inc ? 150 : 100;
    const target = inc ? 100 + rate : rate;
    const knownWhole = ['of', 'decrease', 'increase'].includes(mode);
    const step = rate % 5 === 0 ? 5 : 1;
    const W = x => `${(x / max) * 100}%`;

    ctx.stage.insertAdjacentHTML('beforeend', `<div class="pbar-wrap">
      <div class="pbar-labels"><span class="pl whole" style="width:${W(100)}">100% = ${knownWhole ? `<b>${money(spec.whole)}</b>` : '<b class="unk">?</b>'}</span></div>
      <div class="pbar" style="--max:${max}">
        <div class="ticks">${Array.from({ length: max / 10 + 1 }, (_, i) => `<i style="left:${W(i * 10)}"><small>${i % 5 === 0 || max === 100 ? i * 10 + '%' : ''}</small></i>`).join('')}</div>
        <button type="button" class="seg piece" data-seg="piece"><b></b><small></small></button>
        <button type="button" class="seg rest" data-seg="rest"><b></b><small></small></button>
        ${inc ? '<button type="button" class="seg extra" data-seg="extra"><b></b><small></small></button>' : ''}
        <div class="handle" role="slider" tabindex="0" aria-label="Percent" aria-valuemin="0" aria-valuemax="${max}"><span></span></div>
        <div class="hundred-line" style="left:${W(100)}"></div>
      </div>
      <div class="pbar-brackets">
        <button type="button" class="bracket whole-br" data-seg="whole" style="width:${W(100)}">⟵ whole = 100% ⟶</button>
        ${inc ? `<button type="button" class="bracket total-br" data-seg="total" style="width:${W(target)}">⟵ new total ⟶</button>` : ''}
      </div>
      <div class="pmath" hidden></div>
    </div>`);
    const wrap = ctx.stage.lastElementChild;
    const bar = MQ.$('.pbar', wrap), handle = MQ.$('.handle', wrap), pmath = MQ.$('.pmath', wrap);
    const seg = n => MQ.$(`[data-seg="${n}"]`, wrap);
    let h = inc ? 100 : 0;

    function paint() {
      if (inc) {
        seg('piece').style.cssText = `left:0;width:${W(0)}`;
        seg('rest').style.cssText = `left:0;width:${W(100)}`;
        seg('extra').style.cssText = `left:${W(100)};width:${W(Math.max(0, h - 100))}`;
        MQ.$('b', seg('rest')).textContent = '100%';
        MQ.$('b', seg('extra')).textContent = h > 100 ? `+${h - 100}%` : '';
      } else {
        seg('piece').style.cssText = `left:0;width:${W(h)}`;
        seg('rest').style.cssText = `left:${W(h)};width:${W(100 - h)}`;
        MQ.$('b', seg('piece')).textContent = h ? `${h}%` : '';
        MQ.$('b', seg('rest')).textContent = h < 100 ? `${100 - h}%` : '';
      }
      handle.style.left = W(h);
      handle.setAttribute('aria-valuenow', h);
      MQ.$('span', handle).textContent = inc ? `${h}%` : `${h}%`;
    }
    paint();

    /* ---- Step 1: drag to the rate ---- */
    const dragGoal = inc ? `Drag the handle to show the <b>+${rate}%</b> that gets ADDED on top of 100%.` : `Drag the handle to cut off <b>${rate}%</b> of the bar. Each tick is 10%.`;
    ctx.say(ctx.level === 0 ? `${dragGoal} ${inc ? '' : `<small>(${rate}% means ${rate} out of every 100.)</small>`}` : dragGoal);
    ctx.setHint(() => { handle.classList.add('glow'); return `Find the tick for ${target}%. ${target % 10 ? `It's halfway between ${Math.floor(target / 10) * 10}% and ${Math.ceil(target / 10) * 10}%.` : ''}`; });
    if (ctx.level === 0) handle.classList.add('glow');
    if (ctx.isDemo()) {
      ctx.say(`👀 <b>Watch me.</b> ${dragGoal}`);
      await ctx.next('▶ Show me');
      for (let v = h; v !== target; v += (target > v ? step : -step)) { h = v; paint(); await sleep(70); }
      h = target; paint(); handle.classList.remove('glow'); handle.classList.add('locked'); MQ.sfx('good'); MQ.replay(bar, 'lock');
      ctx.say(`There's ${inc ? '+' : ''}${rate}%! ${inc ? `The original is 100%, plus ${rate}% more.` : `The pink part is ${rate}%, and ${100 - rate}% is left.`}`);
      await ctx.next();
    } else await new Promise(resolve => {
      let dragging = false;
      const setFrom = ev => {
        const r = bar.getBoundingClientRect();
        let pct = ((ev.clientX - r.left) / r.width) * max;
        pct = Math.round(pct / step) * step;
        h = Math.max(inc ? 100 : 0, Math.min(max, pct)); paint();
      };
      const check = () => {
        if (h === target) {
          cleanup(); handle.classList.remove('glow'); handle.classList.add('locked'); MQ.sfx('good');
          MQ.replay(bar, 'lock'); resolve();
        } else if (h !== (inc ? 100 : 0)) {
          ctx.oops(`That shows ${inc ? '+' + (h - 100) : h}%. We need ${inc ? '+' : ''}${rate}%. ${ctx.level < 2 ? 'Count the ticks: each one is 10%.' : ''}`, 'drag');
        }
      };
      const down = ev => { dragging = true; try { bar.setPointerCapture(ev.pointerId); } catch {} setFrom(ev); MQ.sfx('tap'); };
      const move = ev => { if (dragging) setFrom(ev); };
      const up = () => { if (!dragging) return; dragging = false; MQ.eatClick(); check(); };
      const key = ev => {
        const d = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step }[ev.key];
        if (d) { ev.preventDefault(); h = Math.max(inc ? 100 : 0, Math.min(max, h + d)); paint(); }
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); check(); }
      };
      const cleanup = () => { bar.removeEventListener('pointerdown', down); bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up); handle.removeEventListener('keydown', key); };
      bar.addEventListener('pointerdown', down); bar.addEventListener('pointermove', move); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
      handle.addEventListener('keydown', key);
    });
    wrap.classList.add('ready');
    if (!inc) { MQ.$('small', seg('piece')).textContent = spec.word?.piece || (mode === 'decrease' || mode === 'reverse' ? 'taken off' : 'the part'); MQ.$('small', seg('rest')).textContent = spec.word?.rest || (mode === 'decrease' || mode === 'reverse' ? 'left' : 'the rest'); }
    else { MQ.$('small', seg('rest')).textContent = 'original'; MQ.$('small', seg('extra')).textContent = spec.word?.extra || 'added'; }

    // Tap a part of the bar. `want` is the correct data-seg; returns when tapped correctly.
    const segName = { piece: `the ${rate}% piece`, rest: `the ${100 - rate}% that is left`, extra: `the +${rate}% extra`, whole: 'the whole 100%', total: `the new total (${100 + rate}%)` };
    async function tapPart(question, want, whyFor) {
      ctx.say(question);
      const glowEl = seg(want === 'total' ? 'total' : want);
      if (ctx.level === 0) glowEl?.classList.add('glow');
      if (ctx.isDemo()) {
        glowEl?.classList.add('glow');
        ctx.say(`👀 ${question.replace(/ Tap it\.?/, '')}<br>👉 It's <b>${segName[want]}</b>.`);
        await ctx.next(); glowEl?.classList.remove('glow'); MQ.sfx('good'); return;
      }
      ctx.setHint(() => { glowEl?.classList.add('glow'); return `It's ${segName[want]}.`; });
      await new Promise(resolve => {
        const onTap = ev => {
          const b = ev.target.closest('[data-seg]'); if (!b || !wrap.contains(b)) return;
          const s = b.dataset.seg;
          if (s === want) { wrap.removeEventListener('click', onTap); glowEl?.classList.remove('glow'); MQ.sfx('good'); resolve(); }
          else { ctx.oops(whyFor(s), 'part'); MQ.replay(b, 'shake-once'); }
        };
        wrap.addEventListener('click', onTap);
      });
    }

    /* ---- Step 2: where does the given amount go? ---- */
    if (!knownWhole) {
      const given = money(spec.part);
      const want = mode === 'whole' ? 'piece' : mode === 'reverse' ? 'rest' : 'total';
      const say = mode === 'reverse' ? `You PAID ${given} after the discount. Which part of the bar did you pay for? Tap it.` : mode === 'reverseUp' ? `${given} is the price AFTER it went up. Which part of the bar is that? Tap it.` : `${given} is ${rate}% of the number. Which part of the bar is ${given}? Tap it.`;
      await tapPart(say, want, s => s === 'piece' && mode === 'reverse' ? `That piece was taken OFF — you didn't pay it. You paid for what was left.` : s === 'whole' ? `The whole is the ORIGINAL price — that's what we don't know yet!` : `Not that part. ${mode === 'reverse' ? 'You pay for what is LEFT after the discount.' : mode === 'reverseUp' ? 'The after-price includes the original AND the extra.' : `${given} matches the ${rate}% piece.`}`);
      const el = seg(want);
      const label = MQ.h(`<span class="money-tag">${given}</span>`); el.appendChild(label); MQ.replay(label, 'pop-in');
      MQ.$('.pl.whole', wrap).innerHTML = '100% = <b class="unk">?</b>';
    }

    /* ---- Step 3: what does the question want? ---- */
    const ask = { of: 'piece', decrease: 'rest', increase: 'total', whole: 'whole', reverse: 'whole', reverseUp: 'whole' }[mode];
    const askWord = spec.ask || { of: 'the part', decrease: 'what you pay', increase: 'the total', whole: 'the whole number', reverse: 'the original price', reverseUp: 'the price before' }[mode];
    await tapPart(`Now: the question asks for <b>${esc(askWord)}</b>. Which part of the bar is that? Tap it.`, ask, s => {
      if (ask === 'rest' && s === 'piece') return `That's the ${rate}% that comes OFF (the discount). You pay what's LEFT.`;
      if (ask === 'piece' && s === 'rest') return `That's what's left. The question asks for the ${rate}% piece itself.`;
      if (ask === 'total') return `For an increase you keep the whole 100% AND add the extra — tap the new total bracket.`;
      if (ask === 'whole') return `We already know that part! The question wants the ORIGINAL — the whole 100%.`;
      return 'Not that part — read the question again.';
    });
    const askPct = { piece: rate, rest: 100 - rate, total: 100 + rate, whole: 100 }[ask];
    const askEl = ask === 'whole' ? MQ.$('.whole-br', wrap) : seg(ask);
    askEl.classList.add('asked');

    /* ---- Step 4: multiply forward or divide backward ---- */
    pmath.hidden = false;
    let answer;
    if (knownWhole) {
      const dec = decimal(askPct);
      const opts = MQ.shuffle([...new Set([dec, fmt(askPct / 10), String(askPct), decimal(ask === 'piece' ? 100 - rate : rate)])].filter(o => o !== dec)).slice(0, 2);
      pmath.innerHTML = `<div class="pm-line">${askPct}% of ${money(spec.whole)}</div>`;
      MQ.replay(pmath, 'enter');
      await ctx.ask(`We need <b>${askPct}% of ${money(spec.whole)}</b>. What is ${askPct}% as a decimal?`, MQ.shuffle([
        { t: dec, ok: true }, ...opts.map(o => ({ t: o, why: `Percent means "out of 100", so divide by 100: ${askPct} ÷ 100 = ${dec}.` }))
      ]), { tag: 'decimal' });
      pmath.insertAdjacentHTML('beforeend', `<div class="pm-line">= ${money(spec.whole)} × ${dec}</div>`);
      if (ctx.level >= 1) {
        await ctx.ask(`You KNOW the whole (${money(spec.whole)}). Multiply or divide?`, MQ.shuffle([
          { t: `${money(spec.whole)} × ${dec}`, ok: true },
          { t: `${money(spec.whole)} ÷ ${dec}`, why: `Dividing is for working BACKWARD to an unknown whole. Here you know the whole, so "${askPct}% of" means multiply.` },
          { t: `${money(spec.whole)} − ${dec}`, why: `${dec} is a fraction of the price, not dollars. "Of" means multiply.` }
        ]), { tag: 'muldiv' });
      } else {
        ctx.say(`"<b>of</b>" means multiply. You know the whole, so: <b>${money(spec.whole)} × ${dec}</b>.`); await sleep(1300);
      }
      answer = spec.whole * askPct / 100;
      await ctx.number(`<b>${money(spec.whole)} × ${dec} = ?</b>`, answer, { prefix: '$', hint: () => mulHint(spec.whole, askPct) });
    } else {
      const known = { whole: rate, reverse: 100 - rate, reverseUp: 100 + rate }[mode];
      const dec = decimal(known);
      pmath.innerHTML = `<div class="pm-line">${known}% of <b class="unk">?</b> = ${money(spec.part)}</div><div class="pm-line big">${dec} × <b class="unk">?</b> = ${money(spec.part)}</div>`;
      MQ.replay(pmath, 'enter');
      ctx.say(`So <b>${known}%</b> of the unknown whole is ${money(spec.part)}. That's an equation: <b>${dec} × ? = ${money(spec.part)}</b>.`);
      await sleep(ctx.level === 0 ? 1800 : 900);
      await ctx.ask(`The <b>?</b> is being MULTIPLIED by ${dec}. How do you undo that?`, MQ.shuffle([
        { t: `÷ ${dec} on both sides`, ok: true },
        { t: `× ${dec} on both sides`, why: `That multiplies AGAIN. To undo × ${dec}, divide. This is why working backward means dividing!` },
        { t: `− ${dec} on both sides`, why: `${dec} is multiplying, not being added. The opposite of × is ÷.` },
        { t: `Add ${mode === 'reverseUp' ? 'nothing' : rate + '% back on'}`, why: `Tempting, but the ${rate}% was ${mode === 'reverseUp' ? 'added to' : 'taken from'} the ORIGINAL, not from ${money(spec.part)}. Undo the × ${dec} with ÷.` }
      ]), { tag: 'reverse' });
      pmath.insertAdjacentHTML('beforeend', `<div class="pm-line">? = ${money(spec.part)} ÷ ${dec}</div>`);
      answer = mode === 'whole' ? spec.part * 100 / rate : spec.whole ?? spec.part / (known / 100);
      await ctx.number(`<b>${money(spec.part)} ÷ ${dec} = ?</b>`, answer, { prefix: '$', hint: () => divHint(spec.part, known) });
    }

    /* ---- Step 5: reveal money on the bar ---- */
    const whole = knownWhole ? spec.whole : answer;
    const show = (name, pct) => { const el = seg(name); if (!el) return; let t = MQ.$('.money-tag', el); if (!t) { t = MQ.h('<span class="money-tag"></span>'); el.appendChild(t); } t.textContent = money(whole * pct / 100); MQ.replay(t, 'pop-in'); };
    if (inc) { show('rest', 100); show('extra', rate); } else { show('piece', rate); show('rest', 100 - rate); }
    MQ.$('.pl.whole', wrap).innerHTML = `100% = <b>${money(whole)}</b>`;
    MQ.sfx('win');
    ctx.done(`${esc(askWord[0].toUpperCase() + askWord.slice(1))}: <b>${money(answer)}</b>`);
  };
})();
