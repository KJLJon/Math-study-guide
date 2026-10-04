/*
  CONVERT ACTIVITY — predict, see it, then let the UNITS decide × or ÷.

  1. PREDICT: will the new number be MORE or FEWER?  (then watch the bar split/group)
  2. BUILD the unit fraction: tap ↕ Flip until the old unit is on the bottom; units cancel.
  3. COMPUTE with the keypad.

  spec: { v, from, to, steps:[{top:[n,'in'], bot:[n,'ft']}], bar:{big,small,k,bigCount} | null, more:boolean }
  Every step lists the CORRECT orientation; the activity starts some of them flipped.
*/
(() => {
  const MQ = window.MQ;
  const { esc, sleep, fmt } = MQ;
  MQ.act = MQ.act || {};

  const unitSpan = (u, cls = '') => `<span class="u ${cls}" data-u="${esc(u)}">${esc(u)}</span>`;

  MQ.act.convert = async (spec, ctx) => {
    const fromTxt = spec.fromBottom ? `${fmt(spec.v)} ${spec.from}/${spec.fromBottom}` : `${fmt(spec.v)} ${spec.from}`;
    ctx.stage.insertAdjacentHTML('beforeend', `<div class="conv">
      ${spec.bar ? `<div class="cbar ${spec.bar.big ? '' : 'small-first'}" style="--k:${Math.min(spec.bar.k, 60)}">${Array.from({ length: Math.min(6, Math.ceil(spec.bar.bigCount - 1e-9)) }, (_, i) => `<span class="cb" style="--w:${Math.min(1, spec.bar.bigCount - i)}"><em>1 ${esc(spec.bar.bigU)}</em></span>`).join('')}${spec.bar.bigCount > 6 ? '<span class="cb-more">…</span>' : ''}</div>
        <div class="cbar-cap"><span>${esc(fromTxt)}</span></div>` : ''}
      <div class="fact">📐 ${spec.steps.map(s => `${s.bot[0]} ${esc(s.bot[1])} = ${s.top[0]} ${esc(s.top[1])}`).join(' · ')}</div>
      <div class="cexpr"><span class="cstart">${fmt(spec.v)} ${unitSpan(spec.from, 'start-top')}${spec.fromBottom ? ` / ${unitSpan(spec.fromBottom, 'start-bot')}` : ''}</span><span class="cfracs"></span><span class="cres"></span></div>
    </div>`);
    const root = ctx.stage.lastElementChild;
    const fracs = MQ.$('.cfracs', root), res = MQ.$('.cres', root), cbar = MQ.$('.cbar', root);

    /* ---- 1. Predict ---- */
    const smaller = spec.more ? `${spec.to}` : `${spec.to}`;
    await ctx.ask(ctx.level === 0
      ? `First, predict! ${esc(spec.predictWhy)} So will the number of <b>${esc(smaller)}</b> be MORE or FEWER than ${fmt(spec.v)}?`
      : `Predict: will the answer in <b>${esc(spec.to)}</b> be more or fewer than ${fmt(spec.v)}?`, [
      { t: '📈 More', ok: spec.more, why: spec.predictWhy + ' So you need FEWER of them.' },
      { t: '📉 Fewer', ok: !spec.more, why: spec.predictWhy + ' So you need MORE of them.' }
    ].map(o => ({ ...o, why: o.ok ? undefined : o.why })), { tag: 'predict', grid: 2 });
    if (cbar) {
      cbar.classList.toggle('split', spec.bar.big);
      MQ.replay(cbar, 'anim');
      MQ.sfx('whoosh');
      ctx.say(spec.bar.big ? `See? Each 1 ${esc(spec.bar.bigU)} splits into <b>${spec.bar.k}</b> ${esc(spec.bar.smallU)}. Same length, more pieces → the number gets <b>bigger</b>.` : `Group every <b>${spec.bar.k}</b> ${esc(spec.bar.smallU)} into 1 ${esc(spec.bar.bigU)}. Bigger pieces → <b>fewer</b> of them.`);
      await sleep(1900);
    }

    /* ---- 2. Unit fractions ---- */
    let value = spec.v;
    for (let i = 0; i < spec.steps.length; i++) {
      const s = spec.steps[i];
      let flipped = Math.random() < 0.6;
      const card = MQ.h(`<span class="ufrac"><span class="ut"></span><span class="ub"></span></span>`);
      fracs.appendChild(MQ.h('<span class="times">×</span>')); fracs.appendChild(card);
      const paint = () => {
        const top = flipped ? s.bot : s.top, bot = flipped ? s.top : s.bot;
        MQ.$('.ut', card).innerHTML = `${top[0]} ${unitSpan(top[1])}`; MQ.$('.ub', card).innerHTML = `${bot[0]} ${unitSpan(bot[1])}`;
      };
      paint(); MQ.replay(card, 'pop-in');
      const cancelTop = !!s.cancelTop, cancelU = cancelTop ? s.top[1] : s.bot[1], keepU = cancelTop ? s.bot[1] : s.top[1];
      const where = cancelTop ? 'top' : 'bottom', opp = cancelTop ? 'bottom' : 'top';
      ctx.say(ctx.level === 0
        ? `This fraction equals 1 (${s.bot[0]} ${esc(s.bot[1])} is the same amount as ${s.top[0]} ${esc(s.top[1])}). You have <b>${esc(cancelU)}</b> on the ${opp}, so put ${esc(cancelU)} on the <b>${where}</b> of the fraction — then they cancel. Flip it if needed.`
        : `Set up the fraction so <b>${esc(cancelU)}</b> cancels. Flip it if needed.`);
      ctx.setHint(() => `You have ${esc(cancelU)} on the ${opp}. Put ${esc(cancelU)} on the ${where} of the fraction so they cancel.`);
      for (;;) {
        if (ctx.isDemo()) ctx.say(flipped ? `👀 ${esc(cancelU)} is on the ${opp} of the fraction — the same place as the ${esc(cancelU)} we have, so nothing would cancel. I'll <b>flip</b> it.` : `👀 Now ${esc(cancelU)} is on the ${where}, so it will cancel. I'll <b>use</b> this fraction.`);
        const pick = await ctx.ask('', [{ t: '↕ Flip it', id: 'flip' }, { t: '✔ Use this fraction', id: 'use' }], { tag: 'frac', grid: 2, free: true, demoPick: flipped ? 'flip' : 'use' });
        if (pick.id === 'flip') { flipped = !flipped; card.classList.remove('flip'); void card.offsetWidth; card.classList.add('flip'); MQ.sfx('tap'); paint(); continue; }
        if (!flipped) break;
        MQ.replay(card, 'shake-once');
        ctx.oops(`Look: ${esc(cancelU)} is on the ${opp} of BOTH — that makes ${esc(cancelU)} × ${esc(cancelU)}. Nothing cancels! Flip it.`, 'frac');
      }
      // Cancel animation.
      const prevUnit = i === 0 ? MQ.$(`.u[data-u="${CSS.escape(cancelU)}"]`, MQ.$('.cstart', root)) : MQ.$$(`.ufrac .ut .u[data-u="${CSS.escape(cancelU)}"]`, root).slice(-2)[0];
      const botUnit = MQ.$(cancelTop ? '.ut .u' : '.ub .u', card);
      prevUnit?.classList.add('cancel'); botUnit.classList.add('cancel');
      MQ.sfx('good');
      ctx.say(`<b>${esc(cancelU)}</b> cancels ${esc(cancelU)}! Now the unit is <b>${esc(keepU)}</b>. ✂️`);
      await sleep(1100);
      // Compute: × top ÷ bottom (one of them is 1).
      const mult = s.top[0] / s.bot[0];
      const isMul = s.bot[0] === 1;
      const k = isMul ? s.top[0] : s.bot[0];
      const next = value * mult;
      const sentence = `${fmt(value)} ${isMul ? '×' : '÷'} ${k}`;
      if (!isMul && ctx.level <= 1) { ctx.say(`The ${k} is on the <b>bottom</b>, so this is <b>dividing</b> by ${k}.`); await sleep(1300); }
      if (isMul && ctx.level <= 1) { ctx.say(`The ${k} is on the <b>top</b>, so this is <b>multiplying</b> by ${k}.`); await sleep(1100); }
      await ctx.number(`<b>${sentence} = ?</b>`, next, { hint: () => isMul ? `${fmt(value)} groups of ${k}.` : `How many groups of ${k} fit in ${fmt(value)}?` });
      value = next;
    }
    res.innerHTML = ` = <b>${fmt(value)} ${esc(spec.to)}${spec.toBottom ? '/' + esc(spec.toBottom) : ''}</b>`;
    MQ.replay(res, 'pop-in');
    if (cbar && !spec.bar.big) { cbar.classList.add('grouped'); }
    MQ.sfx('win');
    ctx.done(`${esc(fromTxt)} = <b>${fmt(value)} ${esc(spec.to)}${spec.toBottom ? '/' + esc(spec.toBottom) : ''}</b> ${spec.more === value > spec.v ? '— just like you predicted!' : ''}`);
  };
})();
