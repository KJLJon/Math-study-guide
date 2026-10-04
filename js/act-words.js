/*
  WORD PROBLEM ACTIVITY — read like a detective, then build the equation yourself.

  1. TAP every number you need (L3+ stories include a number you DON'T need).
  2. TAP the question sentence.
  3. CHOOSE what x stands for.
  4. BUILD the equation from tiles (any equation with the right solution counts:
     15 + 5x = 40 and 40 = 5x + 15 are both fine).
  5. SOLVE it with the balance engine, then say what the answer MEANS.

  spec: { story, need:['$15','$5','$40'], extra:['13'], letMeaning, letWrong:[..], tiles:[..], eq, answer, unitWord, meaningWrong:[..], buildHint }
  Also: MQ.act.choice (multiple-choice "spot the glitch") and MQ.act.balance ("is it still balanced?").
*/
(() => {
  const MQ = window.MQ;
  const { esc, sleep } = MQ;
  MQ.act = MQ.act || {};

  function storyHTML(story, nums) {
    // Wrap each sentence; wrap tappable numbers ($15, 25%, 3.5) inside it.
    return story.split(/(?<=[.?!])\s+/).map((sen, i) => {
      const body = esc(sen).replace(/(?<![#\w;])(\$?\d+(?:\.\d+)?%?)/g, m => `<span class="num" data-num="${m}">${m}</span>`);
      return `<span class="sen" data-q="${/\?\s*$/.test(sen) ? 1 : 0}">${body}</span>`;
    }).join(' ');
  }

  MQ.act.words = async (spec, ctx) => {
    const v = spec.v || 'x';
    ctx.stage.insertAdjacentHTML('beforeend', `<div class="wp">
      <div class="story">${storyHTML(spec.story)}</div>
      <div class="found"></div>
      <div class="build" hidden><div class="slots" aria-live="polite"></div><div class="tiles"></div></div>
      <div class="solve-host"></div>
    </div>`);
    const root = ctx.stage.lastElementChild, story = MQ.$('.story', root);
    const need = new Set(spec.need), extra = new Set(spec.extra || []);

    /* ---- 1. tap the numbers ---- */
    const found = new Set();
    ctx.say(ctx.level === 0 ? `🖍️ Detective step: tap every <b>number</b> in the story. (${need.size} to find)` : extra.size ? `🖍️ Tap only the numbers you <b>need</b>. Careful — one is a distraction!` : `🖍️ Tap the numbers in the story.`);
    ctx.setHint(() => { MQ.$$('.num', story).forEach(n => { if (need.has(n.dataset.num) && !n.classList.contains('hit')) n.classList.add('glow'); }); return 'The glowing numbers are the ones you need.'; });
    if (ctx.isDemo()) {
      ctx.say('👀 <b>Watch me.</b> A math detective first circles every number in the story.');
      await ctx.next('▶ Show me');
      for (const n of MQ.$$('.num', story)) if (need.has(n.dataset.num)) { n.classList.add('hit'); found.add(n.dataset.num); MQ.sfx('pop'); await sleep(450); }
      MQ.$('.found', root).innerHTML = [...found].map(f => `<span class="found-chip">${esc(f)}</span>`).join('');
    } else await new Promise(resolve => {
      const onTap = ev => {
        const n = ev.target.closest('.num'); if (!n) return;
        const val = n.dataset.num;
        if (n.classList.contains('hit')) return;
        if (extra.has(val)) { ctx.oops(spec.extraWhy || `Do you need <b>${esc(val)}</b> to answer the question? Not every number in a story matters!`, 'extra'); MQ.replay(n, 'shake-once'); n.classList.add('nope'); return; }
        if (!need.has(val)) return;
        n.classList.add('hit'); n.classList.remove('glow'); found.add(val); MQ.sfx('pop');
        MQ.$('.found', root).innerHTML = [...found].map(f => `<span class="found-chip">${esc(f)}</span>`).join('');
        ctx.say(`Found ${found.size} of ${need.size}! ${found.size < need.size ? 'Keep going…' : ''}`);
        if ([...need].every(x => found.has(x))) { story.removeEventListener('click', onTap); resolve(); }
      };
      story.addEventListener('click', onTap);
    });
    await sleep(400);

    /* ---- 2. tap the question ---- */
    ctx.say('❓ Now tap the <b>question</b> — the sentence that says what they want.');
    ctx.setHint(() => { MQ.$('.sen[data-q="1"]', story)?.classList.add('glow'); return 'It\'s the sentence that ends with a question mark.'; });
    if (ctx.isDemo()) {
      ctx.say('👀 Next I underline the <b>question</b> — what are they actually asking?');
      await ctx.next(); MQ.$('.sen[data-q="1"]', story).classList.add('q-hit'); MQ.sfx('good'); await sleep(500);
    } else await new Promise(resolve => {
      const onTap = ev => {
        const s = ev.target.closest('.sen'); if (!s) return;
        if (s.dataset.q === '1') { s.classList.add('q-hit'); s.classList.remove('glow'); MQ.sfx('good'); story.removeEventListener('click', onTap); resolve(); }
        else { ctx.oops('That sentence gives information. Find the one that ASKS something.', 'question'); MQ.replay(s, 'shake-once'); }
      };
      story.addEventListener('click', onTap);
    });

    /* ---- 3. what is x? ---- */
    await ctx.ask(`Let <b>${esc(v)}</b> = the thing we don't know. What should ${esc(v)} stand for?`, MQ.shuffle([
      { t: spec.letMeaning, ok: true },
      ...spec.letWrong.map(w => ({ t: w, why: `We already know that from the story. ${esc(v)} is what the QUESTION asks for.` }))
    ]), { tag: 'let' });
    MQ.$('.found', root).insertAdjacentHTML('beforeend', `<span class="found-chip let">${esc(v)} = ${esc(spec.letMeaning)}</span>`);

    /* ---- 4. build the equation ---- */
    const build = MQ.$('.build', root), slots = MQ.$('.slots', build), tray = MQ.$('.tiles', build);
    build.hidden = false; MQ.replay(build, 'enter');
    const placed = [];
    tray.innerHTML = MQ.shuffle(spec.tiles).map((t, i) => `<button type="button" class="tile" data-i="${i}">${esc(t)}</button>`).join('');
    const paintSlots = () => {
      slots.innerHTML = placed.length ? placed.map((t, i) => `<button type="button" class="tile placed" data-p="${i}">${esc(t.text)}</button>`).join('') : '<span class="slot-ph">Tap tiles to build the equation…</span>';
    };
    paintSlots();
    tray.addEventListener('click', ev => {
      const b = ev.target.closest('.tile'); if (!b || b.disabled) return;
      placed.push({ text: b.textContent, el: b }); b.disabled = true; MQ.sfx('tap'); paintSlots(); MQ.replay(slots.lastElementChild, 'pop-in');
    });
    slots.addEventListener('click', ev => {
      const b = ev.target.closest('.tile'); if (!b) return;
      const [t] = placed.splice(Number(b.dataset.p), 1); t.el.disabled = false; paintSlots();
    });
    ctx.setHint(() => spec.buildHint);
    let tries = 0, eqText;
    ctx.say(ctx.level === 0 ? `🔗 Build the equation. ${spec.buildHint}` : `🔗 Build an equation for the story with the tiles.`);
    if (ctx.isDemo()) {
      ctx.say(`👀 Now I build the equation. ${spec.buildHint}`);
      await ctx.next('▶ Show me');
      for (const tok of spec.eq.split(' ')) {
        const t = MQ.$$('.tile:not(:disabled)', tray).find(x => x.textContent === tok);
        if (t) { placed.push({ text: t.textContent, el: t }); t.disabled = true; paintSlots(); MQ.replay(slots.lastElementChild, 'pop-in'); MQ.sfx('tap'); await sleep(420); }
      }
      slots.classList.add('ok');
    }
    while (!ctx.isDemo()) {
      const pick = await ctx.ask('', [{ t: '↶ Clear', id: 'clear' }, { t: '✔ Check equation', id: 'check' }], { tag: 'build', grid: 2, free: true, keepSay: true });
      if (pick.id === 'clear') { placed.splice(0).forEach(t => t.el.disabled = false); paintSlots(); continue; }
      eqText = placed.map(t => t.text).join(' ');
      let ok = false, why = '';
      try {
        const p = MQ.parseEquation(eqText);
        const sol = MQ.solveLinear(p.left, p.right);
        const usedAll = spec.mustUse.every(n => placed.some(t => t.text.includes(n)));
        ok = typeof sol === 'object' && Math.abs(MQ.qNum(sol) - spec.answer) < 1e-9 && usedAll;
        if (!ok) why = spec.buildHint;
      } catch (e) { why = placed.length ? `That's not a complete equation yet. ${placed.some(t => t.text === '=') ? '' : 'It needs an = sign.'}` : 'Tap some tiles first!'; }
      if (ok) { MQ.sfx('good'); slots.classList.add('ok'); MQ.burst(slots); break; }
      tries++;
      ctx.oops(`${why}${tries >= 2 ? `<br><small>Here it is: <b>${esc(spec.eq)}</b>. Build that.</small>` : ''}`, 'build');
      MQ.replay(slots, 'shake-once');
    }
    eqText ||= spec.eq;
    ctx.say(`✅ <b>${esc(eqText)}</b> matches the story! Now ${ctx.isDemo() ? "I'll" : ''} solve it.`);
    await sleep(1000);
    build.querySelector('.tiles').remove();

    /* ---- 5. solve, then interpret ---- */
    const host = MQ.$('.solve-host', root);
    const sol = await MQ.runSolve({ eq: eqText }, ctx, host);
    const ans = typeof sol === 'object' ? MQ.qPretty(sol) : spec.answer;
    await ctx.ask(`${esc(v)} = ${esc(ans)}. What does that MEAN in the story?`, MQ.shuffle([
      { t: `${ans} ${spec.unitWord}`, ok: true },
      ...spec.meaningWrong.map(w => ({ t: `${ans} ${w}`, why: `Remember: ${esc(v)} = ${esc(spec.letMeaning)}.` }))
    ]), { tag: 'meaning' });
    ctx.done(`<b>${esc(ans)} ${esc(spec.unitWord)}</b> — and you proved it!`);
  };

  /* ---------- multiple-choice with an optional follow-up solve ---------- */
  MQ.act.choice = async (spec, ctx) => {
    if (spec.visual) ctx.stage.insertAdjacentHTML('beforeend', spec.visual);
    for (const q of spec.questions) await ctx.ask(q.q, MQ.shuffle(q.options), { tag: q.tag || 'choice' });
    if (spec.then) {
      ctx.say(spec.thenSay || 'Now solve it the right way.'); await sleep(900);
      await MQ.runSolve({ eq: spec.then, blocks: spec.blocks }, ctx, ctx.stage);
    }
    ctx.done(spec.doneText || '');
  };

  /* ---------- "Is it still balanced?" with a blocks scale ---------- */
  MQ.act.balance = async (spec, ctx) => {
    // spec: { x, a, b, moves:[{text, dl, dr}] }  scale = (bag + a blocks) vs (b blocks); x = b - a
    ctx.stage.insertAdjacentHTML('beforeend', `<div class="balgame">
      <div class="scale"><div class="beam"></div>
        <div class="pan L"><div class="pan-items"></div><div class="pan-dish"></div></div>
        <div class="pan R"><div class="pan-items"></div><div class="pan-dish"></div></div><div class="fulcrum"></div></div>
      <div class="bal-eq"></div><div class="bal-move" hidden></div></div>`);
    const root = ctx.stage.lastElementChild, scale = MQ.$('.scale', root);
    let l = spec.a, r = spec.b;
    const blocks = (n, cls = '') => Array.from({ length: Math.max(0, n) }, () => `<i class="blk ${cls}"></i>`).join('');
    const paint = (lc = '', rc = '') => {
      MQ.$('.pan.L .pan-items', scale).innerHTML = `<span class="bag">x</span>${blocks(l)}${lc}`;
      MQ.$('.pan.R .pan-items', scale).innerHTML = `${blocks(r)}${rc}`;
      MQ.$('.bal-eq', root).textContent = `x${l ? ' + ' + l : ''} = ${r}`;
    };
    paint();
    ctx.say(ctx.level === 0 ? `The bag holds a mystery number of blocks (that's <b>x</b>). Both pans weigh the same — that's what <b>=</b> means. Let's test some moves!` : `Each move: will the scale stay balanced?`);
    await sleep(ctx.level === 0 ? 2200 : 900);
    for (const m of spec.moves) {
      const mv = MQ.$('.bal-move', root); mv.hidden = false; mv.innerHTML = `Move: <b>${esc(m.text)}</b>`; MQ.replay(mv, 'enter');
      const balanced = m.dl === m.dr;
      await ctx.ask(`If we <b>${esc(m.text.toLowerCase())}</b>, is the scale still balanced?`, [
        { t: '⚖️ Still balanced', ok: balanced, why: 'Only ONE side changed, so that side gets heavier or lighter. Watch!' },
        { t: '↘️ It tips over', ok: !balanced, why: 'Both sides changed by the SAME amount, so they still match. Watch!' }
      ].map(o => ({ ...o, why: o.ok ? undefined : o.why })), { tag: 'legal', grid: 2 });
      // animate
      const change = (side, d) => {
        const pan = MQ.$(`.pan.${side} .pan-items`, scale);
        if (d < 0) MQ.$$('.blk', pan).slice(d).forEach(b => b.classList.add('leaving'));
        if (d > 0) pan.insertAdjacentHTML('beforeend', blocks(d, 'arriving'));
      };
      change('L', m.dl); await sleep(250); change('R', m.dr);
      scale.classList.remove('tip-left', 'tip-right');
      const lw = l + m.dl + spec.x, rw = r + m.dr;
      if (lw > rw) scale.classList.add('tip-left'); else if (rw > lw) scale.classList.add('tip-right');
      MQ.sfx(balanced ? 'good' : 'bad');
      ctx.say(balanced ? `✅ Same change on both sides → still balanced. That's a <b>legal</b> move.` : `⚠️ Only one side changed → it tips. The equation is now <b>false</b>!`);
      await sleep(1700);
      if (balanced) { l += m.dl; r += m.dr; }
      scale.classList.remove('tip-left', 'tip-right'); paint();
      await sleep(300);
    }
    MQ.$('.bal-move', root).hidden = true;
    await ctx.ask(`The pans show <b>x${l ? ' + ' + l : ''} = ${r}</b>. Which move gets the bag ALONE and keeps it balanced?`, MQ.shuffle([
      { t: `Take ${l} blocks off BOTH sides`, ok: true },
      { t: `Take ${l} blocks off the left only`, why: 'Then the left gets lighter and the scale tips.' },
      { t: `Add ${l} blocks to both sides`, why: 'That keeps it balanced, but now there are even MORE blocks next to the bag.' }
    ]), { tag: 'legal' });
    MQ.$$('.pan.L .blk, .pan.R .blk', scale).forEach((b, i, all) => { const pan = b.closest('.pan'); if (MQ.$$('.blk', pan).indexOf(b) >= MQ.$$('.blk', pan).length - l) b.classList.add('leaving'); });
    MQ.sfx('whoosh'); await sleep(900);
    r -= l; l = 0; paint();
    ctx.say(`The bag balances <b>${r}</b> blocks, so <b>x = ${r}</b>. 🎉`);
    MQ.sfx('win');
    ctx.done(`x = <b>${r}</b>`);
  };
})();
