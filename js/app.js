/*
  APP: screens + the round player.
  Screens: home, world (level path), play (one problem at a time), end (round results), parent, blitz.
  The player gives each activity a `ctx` with:
    say(html) · ask(question, options) · number(prompt, answer) · button(label) · oops(why, tag) · setHint(fn) · done(summary)
*/
(() => {
  const MQ = window.MQ;
  const { $, $$, esc, sleep } = MQ;
  const store = MQ.store;
  const WORLD = id => MQ.WORLDS.find(w => w.id === id);
  MQ.addXP = n => store.addXP(n);

  /* ---------------- screens ---------------- */
  let current = 'home';
  function show(id) {
    if (id !== 'blitzView') window.MathBlitz?.stop();
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === (id === 'blitzView' ? id : 'scr-' + id)));
    current = id;
    document.body.dataset.screen = id;
    window.scrollTo(0, 0);
  }
  MQ.home = () => { renderHome(); show('home'); };

  MQ.renderStats = () => {
    $$('[data-xp]').forEach(n => n.textContent = store.data.xp);
    $$('[data-streak]').forEach(n => n.textContent = store.data.day.streak || 0);
    $$('[data-mute]').forEach(b => { b.textContent = store.muted() ? '🔇' : '🔊'; b.setAttribute('aria-label', store.muted() ? 'Sound is off' : 'Sound is on'); });
  };

  /* ---------------- HOME ---------------- */
  function worldStars(id) { return store.world(id).levels.reduce((a, l) => a + l.stars, 0); }
  function nextLevel(id) { const ls = store.world(id).levels; const i = ls.findIndex(l => !l.cleared); return i === -1 ? 3 : i; }
  function suggestion() {
    const last = store.data.lastWorld;
    if (last && WORLD(last)) return last;
    return MQ.WORLDS.find(w => !store.world(w.id).levels[0].cleared)?.id || 'moving';
  }
  function renderHome() {
    const sug = WORLD(suggestion()), sl = nextLevel(sug.id);
    const goal = 3, today = store.data.day.last === new Date().toLocaleDateString('en-CA') ? store.data.day.roundsToday : 0;
    const totalStars = MQ.WORLDS.reduce((a, w) => a + worldStars(w.id), 0);
    const missKinds = MQ.WORLDS.flatMap(w => Object.entries(store.world(w.id).misses).filter(([k, n]) => n > 0 && MQ.KIND_NAMES[k]));
    $('#scr-home').innerHTML = `
      <header class="topbar"><div class="brand"><span class="logo">MQ</span><b>Math Quest</b></div>
        <div class="stats"><span class="pill">⭐ <b data-xp></b></span><span class="pill">🔥 <b data-streak></b></span><button class="pill icon" data-mute type="button"></button></div></header>
      <div class="wrap">
        ${store.data.name ? `<div class="hello">👋 Hi, <b>${esc(store.data.name)}</b>! Ollie missed you. 🦉</div>` : `<form class="name-card" id="nameForm"><span class="nc-owl">🦉</span><label for="nameIn">Hi! I'm Ollie. What should I call you?</label><div class="nc-row"><input id="nameIn" maxlength="20" autocomplete="off" placeholder="Your name"><button class="go-btn" type="submit">Save</button></div></form>`}
        <section class="hero-card" style="--c:${sug.color};--bg:${sug.bg}">
          <div class="hero-top">
            <div><div class="eyebrow">KEEP GOING</div><h1>${sug.icon} ${esc(sug.title)}</h1><p>${MQ.LEVELS[sl].icon} Level ${sl + 1}: ${MQ.LEVELS[sl].name} — ${esc(MQ.LEVELS[sl].blurb)}</p></div>
            <div class="ring" style="--p:${Math.min(1, today / goal)}"><div><b>${Math.min(today, goal)}/${goal}</b><small>today</small></div></div>
          </div>
          <button class="big-btn" id="continueBtn" type="button">▶ Play</button>
        </section>

        <div class="tool-grid">
          <button class="tool t-workshop" id="workshopBtn" type="button"><span>🛠️</span><b>Solve MY equation</b><small>Type homework & solve it step by step</small></button>
          <button class="tool t-blitz" id="blitzBtn" type="button"><span>⚡</span><b>Lightning Round</b><small>60-second speed game</small></button>
          ${missKinds.length ? `<button class="tool t-review" id="reviewBtn" type="button"><span>🎯</span><b>Smart Review</b><small>Practice your trouble spots</small></button>` : ''}
          <button class="tool t-boss" id="bossBtn" type="button"><span>👑</span><b>Boss Mix</b><small>Every topic, no help</small></button>
        </div>

        <div class="section-head"><h2>Worlds</h2><span class="pill">⭐ ${totalStars} / ${MQ.WORLDS.length * 12}</span></div>
        <div class="worlds">${MQ.WORLDS.map((w, i) => {
          const ls = store.world(w.id).levels;
          return `<button class="world-card" data-world="${w.id}" style="--c:${w.color};--bg:${w.bg};--i:${i}" type="button">
            <span class="w-icon">${w.icon}</span>
            <span class="w-body"><b>${esc(w.title)}</b><small>${esc(w.blurb)}</small>
              <span class="w-levels">${ls.map((l, j) => `<i class="${l.cleared ? 'done' : store.unlocked(w.id, j) ? 'open' : ''}" title="${MQ.LEVELS[j].name}">${l.cleared ? '★'.repeat(l.stars) || '✓' : store.unlocked(w.id, j) ? j + 1 : '🔒'}</i>`).join('')}</span></span>
            <span class="w-go">›</span></button>`;
        }).join('')}</div>

        <div class="section-head"><h2>🎬 Watch the idea</h2></div>
        <div class="lesson-row">${MQ.WORLDS.map(w => `<button class="lesson-chip" data-lesson="${w.id}" style="--c:${w.color};--bg:${w.bg}" type="button"><span>${w.icon}</span>${esc(w.title)}</button>`).join('')}</div>

        <button class="link-btn" id="parentBtn" type="button">📊 Parent / teacher progress</button>
      </div>`;
    MQ.renderStats();
    $('#continueBtn').onclick = () => startRound(sug.id, sl);
    $('#nameForm')?.addEventListener('submit', e => { e.preventDefault(); const n = $('#nameIn').value.trim(); if (!n) return; store.setName(n); MQ.sfx('win'); MQ.celebrate(40); MQ.toast(`Nice to meet you, ${n}! 🎉`); renderHome(); });
    $$('[data-world]').forEach(b => b.onclick = () => openWorld(b.dataset.world));
    $$('[data-lesson]').forEach(b => b.onclick = () => window.MathExplainers.open(b.dataset.lesson, WORLD(b.dataset.lesson).title));
    $('#workshopBtn').onclick = openWorkshop;
    $('#blitzBtn').onclick = () => { window.MathBlitz.open(); show('blitzView'); };
    $('#bossBtn').onclick = startBoss;
    if ($('#reviewBtn')) $('#reviewBtn').onclick = startReview;
    $('#parentBtn').onclick = openParent;
  }

  /* ---------------- WORLD (level path) ---------------- */
  function openWorld(id) {
    const w = WORLD(id), wd = store.world(id);
    store.data.lastWorld = id;
    const trouble = Object.entries(wd.misses).filter(([k, n]) => n > 0 && MQ.KIND_NAMES[k]).sort((a, b) => b[1] - a[1]).slice(0, 3);
    $('#scr-world').innerHTML = `
      <header class="topbar"><button class="back" data-home type="button">‹ Home</button><div class="stats"><span class="pill">⭐ <b data-xp></b></span><button class="pill icon" data-mute type="button"></button></div></header>
      <div class="wrap">
        <section class="world-hero" style="--c:${w.color};--bg:${w.bg}">
          <span class="w-icon big">${w.icon}</span><h1>${esc(w.title)}</h1><p>${esc(w.blurb)}</p>
          <button class="watch" data-lesson="${id}" type="button">🎬 Watch the idea first</button>
        </section>
        <div class="path" style="--c:${w.color};--bg:${w.bg}">
          ${MQ.LEVELS.map((L, j) => {
            const lv = wd.levels[j], open = store.unlocked(id, j);
            return `<button class="node ${open ? 'open' : 'locked'} ${lv.cleared ? 'cleared' : ''} ${open && !lv.cleared ? 'next' : ''}" data-level="${j}" style="--i:${j}" type="button" ${open ? '' : 'aria-disabled="true"'}>
              <span class="n-circle">${open ? L.icon : '🔒'}</span>
              <span class="n-text"><b>Level ${j + 1} · ${L.name}</b><small>${open ? esc(L.blurb) : `Clear Level ${j} to unlock`}</small>
              <span class="n-stars">${[0, 1, 2].map(s => `<i class="${s < lv.stars ? 'on' : ''}">★</i>`).join('')}</span></span></button>`;
          }).join('')}
        </div>
        ${trouble.length ? `<div class="trouble"><b>🎯 Trouble spots:</b> ${trouble.map(([k]) => `<span>${esc(MQ.KIND_NAMES[k])}</span>`).join('')}<small>Rounds will give you extra practice on these.</small></div>` : ''}
      </div>`;
    MQ.renderStats();
    $('#scr-world [data-home]').onclick = MQ.home;
    $('#scr-world [data-lesson]').onclick = () => window.MathExplainers.open(id, w.title);
    $$('#scr-world [data-level]').forEach(b => b.onclick = () => {
      const j = Number(b.dataset.level);
      if (!store.unlocked(id, j)) { MQ.toast(`Clear Level ${j} first! 🔒`); MQ.sfx('bad'); MQ.replay(b, 'shake-once'); return; }
      startRound(id, j);
    });
    show('world');
  }

  /* ---------------- PLAY ---------------- */
  let session = null;   // {round:[{worldId,kind}], i, level, worldId, results:[], mode}
  let ctxToken = 0;

  function startRound(worldId, level) {
    store.data.lastWorld = worldId;
    const first = level === 0 && !store.seen(`intro-${worldId}`);
    session = { mode: 'world', worldId, level, round: MQ.buildRound(worldId, level), i: 0, results: [] };
    if (first && window.MathExplainers?.has(worldId)) {
      showPlayShell();
      const w = WORLD(worldId);
      $('#playPrompt').innerHTML = `<div class="intro-card" style="--c:${w.color};--bg:${w.bg}"><span class="w-icon big">${w.icon}</span><h2>${esc(w.title)}</h2><p>New world! Want to watch a 1-minute animated lesson first?</p></div>`;
      $('#stage').innerHTML = '';
      setBubble('Hi! I\'m Ollie. 🦉 I\'ll guide you. Watching the idea first makes the puzzles easier!');
      $('#controls').innerHTML = `<div class="choices two"><button class="choice" id="introWatch" type="button">🎬 Watch first</button><button class="choice" id="introSkip" type="button">▶ Start playing</button></div>`;
      $('#introWatch').onclick = () => { $('#controls').innerHTML = ''; window.MathExplainers.open(worldId, w.title, () => nextProblem()); };
      $('#introSkip').onclick = () => { $('#controls').innerHTML = ''; nextProblem(); };
      return;
    }
    showPlayShell(); nextProblem();
  }
  function startReview() {
    const items = MQ.WORLDS.flatMap(w => Object.entries(store.world(w.id).misses).filter(([k, n]) => n > 0 && MQ.GENERATORS[k]).map(([k, n]) => ({ worldId: w.id, kind: k, n })));
    items.sort((a, b) => b.n - a.n);
    const round = Array.from({ length: 5 }, (_, i) => items[i % items.length]).map(({ worldId, kind }) => ({ worldId, kind }));
    session = { mode: 'review', level: 1, round: MQ.shuffle(round), i: 0, results: [] };
    showPlayShell(); nextProblem();
  }
  function startBoss() {
    const round = MQ.shuffle(MQ.WORLDS).slice(0, 5).map(w => ({ worldId: w.id, kind: MQ.pick(w.levels[MQ.rand(2, 3)]) }));
    session = { mode: 'boss', level: 3, round, i: 0, results: [] };
    showPlayShell(); nextProblem();
  }

  function showPlayShell(title) {
    $('#scr-play').innerHTML = `
      <header class="play-top">
        <button class="icon-btn" id="quitBtn" aria-label="Quit round" type="button">✕</button>
        <div class="round-bar" aria-hidden="true">${(session?.round || [0]).map(it => `<i class="${it?.demo ? 'demo' : ''}"></i>`).join('')}</div>
        <span class="streak-badge" id="streakBadge" hidden></span>
        <button class="icon-btn" id="hintBtn" aria-label="Hint" type="button">💡</button>
      </header>
      <main class="play-main"><div id="playPrompt" class="play-prompt"></div><div id="stage" class="stage"></div></main>
      <footer class="dock" id="dock">
        <div class="guide"><div class="mascot" id="mascot" aria-hidden="true">🦉</div><div class="bubble" id="bubble" aria-live="polite"></div></div>
        <div id="controls" class="controls"></div>
      </footer>`;
    $('#quitBtn').onclick = () => { ctxToken++; if (session?.mode === 'world') openWorld(session.worldId); else MQ.home(); };
    $('#hintBtn').onclick = () => MQ._hint?.();
    show('play');
  }

  function setBubble(html, mood = '') {
    const b = $('#bubble'); if (!b) return;
    b.innerHTML = html; b.className = `bubble ${mood}`;
    MQ.replay(b, 'talk');
    const m = $('#mascot'); m.className = `mascot ${mood}`; MQ.replay(m, mood === 'oops' ? 'm-oops' : mood === 'yay' ? 'm-yay' : 'm-talk');
  }

  function paintRoundBar() {
    $$('.round-bar i').forEach((n, j) => {
      const r = session.results[j], demo = session.round[j]?.demo;
      n.className = (demo ? 'demo ' : '') + (j < session.i ? (demo ? 'good' : r ? 'good' : 'ok') : j === session.i ? 'now' : '');
    });
  }

  async function nextProblem() {
    if (!session) return;
    if (session.mode !== 'free' && session.i >= session.round.length) return endRound();
    const item = session.round[session.i];
    const spec = MQ.makeProblem(item.kind);
    paintRoundBar();
    const w = WORLD(item.worldId);
    const badge = item.demo ? '<span class="mode-badge demo">👀 Watch Ollie</span>' : item.review ? '<span class="mode-badge review">🔁 Quick review</span>' : session.round[session.i - 1]?.demo ? '<span class="mode-badge turn">✋ Your turn</span>' : item.faded ? '<span class="mode-badge turn">🤝 Ollie starts, you finish</span>' : '';
    $('#playPrompt').innerHTML = `<div class="tag" style="--c:${w.color};--bg:${w.bg}">${w.icon} ${esc(w.title)} · ${MQ.LEVELS[session.level].name}</div>${badge}<h2 class="prompt-text">${esc(spec.prompt)}</h2>`;
    MQ.replay($('#playPrompt'), 'enter');
    $('#stage').innerHTML = ''; $('#controls').innerHTML = '';
    const help = item.review ? Math.min(session.level, 1) : session.level;
    const ctx = makeCtx({ worldId: item.worldId, kind: item.kind, level: item.demo ? 0 : help, demo: item.demo ? 'full' : item.faded ? 1 : 0 });
    if (session.round[session.i - 1]?.demo) setBubble(MQ.praise.yourTurn(), 'yay');
    const ok = await runActivity(spec, ctx);
    if (!ok) return;
    if (item.demo) {
      session.results.push(null);
      await successSheet(ctx, 0, spec, true);
      session.i++; return nextProblem();
    }
    const firstTry = ctx.firstTry;
    // Self-explanation: a quick "why" question in the guided levels.
    if (help <= 1 && !ctx.free && (session.round[session.i - 1]?.demo || Math.random() < .4)) {
      const wq = MQ.whyQuestion(spec.type);
      if (wq) {
        await sleep(500);
        try { await ctx.ask(wq.q, MQ.shuffle([{ t: wq.ok, ok: true }, ...wq.bad.map(([t, why]) => ({ t, why }))]), { tag: 'why', noMiss: true }); }
        catch (e) { if (e === DEAD) return; }
        if (!ctx.alive()) return;
      }
    }
    session.results.push(firstTry);
    session.streak = firstTry ? (session.streak || 0) + 1 : 0;
    store.problem(item.worldId, firstTry);
    if (firstTry) store.fixed(item.worldId, item.kind);
    const xp = firstTry ? 10 : 5; store.addXP(xp);
    ctx.firstTry = firstTry;
    await successSheet(ctx, xp, spec);
    session.i++;
    nextProblem();
  }

  async function runActivity(spec, ctx) {
    const fn = MQ.act[spec.type];
    try { await fn(spec, ctx); }
    catch (e) { if (e === DEAD) return false; console.error(e); setBubble('Oops — that puzzle broke. Let\'s try another!', 'oops'); await sleep(1200); }
    return ctx.alive();
  }

  const DEAD = Symbol('dead');
  function makeCtx({ worldId, kind, level, free = false, demo = 0 }) {
    const token = ++ctxToken;
    let hintFn = null, hintsUsed = 0;
    let demoMoves = demo === 'full' ? Infinity : demo || 0;
    const alive = () => token === ctxToken;
    const guard = () => { if (!alive()) throw DEAD; };
    const never = () => new Promise(() => {});
    const ctx = {
      level, free, worldId, kind, firstTry: true, summary: '',
      stage: $('#stage'),
      alive,
      // Worked-example mode: Ollie makes the moves, she taps "Next" at her own pace.
      isDemo: () => demoMoves > 0,
      moveDone() { if (demoMoves > 0 && demoMoves !== Infinity) demoMoves--; },
      next(label = '▶ Next') {
        if (!alive()) return never();
        const c = $('#controls');
        c.innerHTML = `<button class="big-btn next-btn" type="button">${label}</button>`;
        return new Promise(r => c.firstElementChild.addEventListener('click', () => { if (alive()) { MQ.sfx('tap'); c.innerHTML = ''; r(); } }, { once: true }));
      },
      say(html, mood) { if (!alive()) return; setBubble(html, mood); },
      setHint(fn) { hintFn = fn; },
      oops(html, tag) {
        if (!alive()) return;
        if (!free && tag !== 'why') { ctx.firstTry = false; store.miss(worldId, kind); store.miss(worldId, 'tag:' + tag); }
        setBubble(`<span class="oops-tag">${MQ.praise.oops()}</span> ${html}`, 'oops'); MQ.sfx('bad');
      },
      ask(q, options, opts = {}) {
        if (!alive()) return never();
        if (q) setBubble(q);
        const c = $('#controls');
        const two = opts.grid === 2 || options.length === 2;
        c.innerHTML = `<div class="choices ${two ? 'two' : ''}">${options.map((o, i) => `<button class="choice" data-i="${i}" type="button" style="--i:${i}">${esc(o.t)}</button>`).join('')}</div>`;
        if (ctx.isDemo() && (opts.demoPick || !opts.free)) {
          // Show the choice Ollie makes (and why), then wait for "Next".
          const idx = opts.free ? options.findIndex(o => o.id === opts.demoPick) : options.findIndex(o => o.ok);
          const btns = [...c.querySelectorAll('.choice')]; btns.forEach(b => b.disabled = true);
          const b = btns[idx];
          return (async () => {
            await sleep(700); if (!alive()) return never();
            b.classList.add('demo-pick'); MQ.sfx('pick');
            if (!opts.free) setBubble(`${q ? q + '<br>' : ''}👉 I pick <b>${esc(options[idx].t)}</b>. ${opts.demoWhy || ''}`);
            c.insertAdjacentHTML('beforeend', '<button class="big-btn next-btn" type="button">▶ Next</button>');
            await new Promise(r => c.querySelector('.next-btn').addEventListener('click', r, { once: true }));
            if (!alive()) return never();
            MQ.sfx('good'); c.innerHTML = '';
            return options[idx];
          })();
        }
        return new Promise(resolve => {
          c.querySelectorAll('.choice').forEach(b => b.addEventListener('click', async () => {
            if (!alive()) return;
            const o = options[Number(b.dataset.i)];
            if (opts.free) { MQ.sfx('tap'); c.innerHTML = ''; resolve(o); return; }
            if (o.ok) {
              c.querySelectorAll('.choice').forEach(x => x.disabled = true);
              b.classList.add('right'); MQ.sfx('good');
              MQ.burst(b); MQ.floatText(b, MQ.praise.step());
              await sleep(650); if (!alive()) return;
              c.innerHTML = ''; resolve(o);
            } else {
              b.classList.add('wrong'); b.disabled = true;
              ctx.oops(o.why || 'Try another one.', opts.tag || 'choice');
            }
          }));
        });
      },
      number(promptHtml, expected, opts = {}) {
        if (!alive()) return never();
        setBubble(promptHtml);
        if (ctx.isDemo()) return demoKeypad(expected, opts, ctx);
        return keypad(expected, opts, ctx);
      },
      button(label) {
        if (!alive()) return never();
        const c = $('#controls');
        c.innerHTML = `<button class="big-btn" type="button">${label}</button>`;
        return new Promise(r => c.firstElementChild.addEventListener('click', () => { if (alive()) { MQ.sfx('tap'); c.innerHTML = ''; r(); } }, { once: true }));
      },
      done(summary) { ctx.summary = summary || ''; }
    };
    MQ._hint = () => {
      if (!alive()) return;
      if (!hintFn) { setBubble('Read what I said above — you\'ve got this! 💪'); return; }
      hintsUsed++; if (level >= 2 && !free) ctx.firstTry = false;
      setBubble('💡 ' + hintFn(), 'hint'); MQ.sfx('tap');
    };
    // Wrap async helpers so a quit stops the activity cleanly.
    for (const k of ['ask', 'number', 'button']) { const f = ctx[k]; ctx[k] = (...a) => { guard(); return f(...a).then(v => { guard(); return v; }); }; }
    return ctx;
  }

  /* ---------------- keypad ---------------- */
  // Worked example: Ollie "types" the answer, she taps Next.
  async function demoKeypad(expected, opts, ctx) {
    const c = $('#controls');
    c.innerHTML = `<div class="keypad"><div class="kp-display"><span class="kp-prefix">${esc(opts.prefix || '')}</span><span class="kp-val" id="kpVal"></span><span class="kp-caret"></span></div></div>`;
    const txt = MQ.fmt(expected).replace('-', '−');
    for (const ch of txt) { await sleep(260); if (!ctx.alive()) return new Promise(() => {}); $('#kpVal').textContent += ch; MQ.sfx('tap'); }
    $('.kp-display', c).classList.add('right');
    await ctx.next();
    return expected;
  }
  function keypad(expected, opts, ctx) {
    const c = $('#controls');
    c.innerHTML = `<div class="keypad">
      <div class="kp-display"><span class="kp-prefix">${esc(opts.prefix || '')}</span><span class="kp-val" id="kpVal"></span><span class="kp-caret"></span></div>
      <div class="kp-keys">${['7', '8', '9', '⌫', '4', '5', '6', '−', '1', '2', '3', '.', '0'].map(k => `<button type="button" class="kp-key ${k === '⌫' ? 'fn' : ''}" data-k="${k}">${k}</button>`).join('')}<button type="button" class="kp-key go" data-k="ok">Check ✓</button></div></div>`;
    const valEl = $('#kpVal'); let val = '', tries = 0;
    if (window.__mqTest) window.__mqTest.expected = expected;
    return new Promise(resolve => {
      const press = k => {
        if (!ctx.alive()) { document.removeEventListener('keydown', onKey); return; }
        if (k === '⌫') val = val.slice(0, -1);
        else if (k === '−') val = val.startsWith('-') ? val.slice(1) : '-' + val;
        else if (k === 'ok') return submit();
        else if (k === '.' && val.includes('.')) return;
        else if (val.replace('-', '').length < 9) val += k;
        valEl.textContent = val.replace('-', '−'); MQ.sfx('tap');
      };
      const submit = async () => {
        if (!val || val === '-' || val === '.') return;
        const n = Number(val);
        if (Math.abs(n - expected) < 0.006) {
          document.removeEventListener('keydown', onKey);
          $('.kp-display', c).classList.add('right'); MQ.sfx('good');
          MQ.burst($('.kp-display', c)); MQ.floatText($('.kp-display', c), MQ.praise.step());
          await sleep(700); c.innerHTML = ''; resolve(n); return;
        }
        tries++;
        MQ.replay($('.kp-display', c), 'shake-once');
        if (tries >= 3) {
          document.removeEventListener('keydown', onKey);
          ctx.oops(`It's <b>${MQ.fmt(expected)}</b>. ${opts.hint ? esc('') + opts.hint() : ''} Let's keep going.`, 'number');
          val = String(MQ.fmt(expected)); valEl.textContent = val.replace('-', '−');
          await sleep(2400); c.innerHTML = ''; resolve(expected); return;
        }
        ctx.oops(tries === 1 ? 'Check your arithmetic and try again.' : `💡 ${opts.hint ? opts.hint() : 'Take it one step at a time.'}`, 'number');
        val = ''; valEl.textContent = '';
      };
      const onKey = e => {
        if (current !== 'play' && current !== 'workshop') return;
        if (/^[0-9.]$/.test(e.key)) press(e.key);
        else if (e.key === '-') press('−');
        else if (e.key === 'Backspace') press('⌫');
        else if (e.key === 'Enter') press('ok');
      };
      document.addEventListener('keydown', onKey);
      c.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => press(b.dataset.k)));
    });
  }

  /* ---------------- success sheet + round end ---------------- */
  async function successSheet(ctx, xp, spec = {}, demo = false) {
    const c = $('#controls');
    if (demo) {
      setBubble(`<b>That's how it's done!</b> ${ctx.summary} Now <b>you</b> try one just like it. 💪`, 'yay');
      MQ.celebrate(14); MQ.sfx('good');
      c.innerHTML = `<button class="big-btn" id="nextBtn" type="button">✋ My turn!</button>`;
      await new Promise(r => $('#nextBtn').addEventListener('click', r, { once: true }));
      MQ.sfx('tap'); return;
    }
    const praise = ctx.firstTry ? MQ.praise.solved(spec.type) : MQ.praise.recovered();
    setBubble(`${praise}${ctx.summary ? `<br><small>${ctx.summary}</small>` : ''}`, 'yay');
    MQ.celebrate(ctx.firstTry ? 60 : 30); MQ.sfx(ctx.firstTry ? 'win' : 'good');
    MQ.burst($('#mascot'), { count: 10, emojis: ['💖', '⭐', '✨', '🎉'] });
    const streak = session?.streak || 0, sMsg = session?.mode !== 'free' ? MQ.praise.streak(streak) : '';
    const sb = $('#streakBadge');
    if (sb) { sb.hidden = streak < 2; sb.textContent = `🔥 ${streak}`; MQ.replay(sb, 'pop-in'); }
    c.innerHTML = `<div class="success ${ctx.firstTry ? '' : 'meh'}">
      <div class="success-row"><span class="xp-pop">+${xp} XP</span>${ctx.firstTry ? '<span class="ft">⭐ First try!</span>' : '<span class="ft grow">🌱 Brain growing!</span>'}</div>
      ${sMsg ? `<div class="streak-msg">${sMsg}</div>` : ''}
      <button class="big-btn" id="nextBtn" type="button">Continue ▶</button></div>`;
    if (sMsg) { MQ.burst($('.streak-msg'), { count: 12, emojis: ['🔥', '✨', '⭐'] }); if (streak >= 5) MQ.fireworks(3); }
    await new Promise(r => $('#nextBtn').addEventListener('click', r, { once: true }));
    MQ.sfx('tap');
  }

  async function endRound() {
    const s = session, scored = s.results.filter(r => r !== null), good = scored.filter(Boolean).length;
    const ratio = scored.length ? good / scored.length : 1;
    const stars = ratio >= 1 ? 3 : ratio >= .75 ? 2 : ratio >= .5 ? 1 : 0;
    const res = store.round(s.mode === 'world' ? s.worldId : null, s.mode === 'world' ? s.level : null, Math.max(stars, s.mode === 'world' && s.level === 0 ? 1 : 0));
    store.addXP(15);
    const w = s.mode === 'world' ? WORLD(s.worldId) : null;
    const unlock = res.newlyCleared && s.level < 3;
    $('#scr-end').innerHTML = `<div class="wrap end">
      <div class="end-card">
        <div class="end-title">${stars === 3 ? 'PERFECT ROUND!' : stars ? 'ROUND COMPLETE!' : 'ROUND DONE!'}</div>
        <div class="end-stars">${[0, 1, 2].map(i => `<span class="es ${i < stars ? 'on' : ''}" style="--i:${i}">★</span>`).join('')}</div>
        <p class="end-sub">${good} of ${scored.length} on the first try · +${good * 10 + (scored.length - good) * 5 + 15} XP</p>
        <p class="end-tip ${stars >= 2 ? 'great' : ''}">${MQ.praise.round(stars)}</p>
        ${unlock ? `<div class="unlock">🔓 Level ${s.level + 2}: ${MQ.LEVELS[s.level + 1].name} unlocked!</div>` : ''}
        <div class="end-btns">
          ${unlock ? `<button class="big-btn" id="endNext" type="button">Next level ▶</button>` : ''}
          <button class="${unlock ? 'ghost-btn' : 'big-btn'}" id="endAgain" type="button">↻ Play again</button>
          <button class="ghost-btn" id="endMap" type="button">${w ? 'World map' : 'Home'}</button>
        </div>
      </div></div>`;
    show('end');
    MQ.sfx(stars ? 'win' : 'good');
    await sleep(350);
    const starEls = $$('.es.on');
    for (let i = 0; i < stars; i++) { await sleep(380); MQ.sfx('star'); MQ.burst(starEls[i], { count: 12, emojis: ['⭐', '✨', '🌟'] }); }
    MQ.celebrate(stars ? 80 : 30);
    if (stars === 3) MQ.fireworks(6);
    if (unlock) setTimeout(() => { MQ.sfx('unlock'); MQ.fireworks(4); MQ.burst($('.unlock'), { count: 16, emojis: ['🔓', '✨', '🎉'] }); }, 900 + stars * 380);
    $('#endAgain').onclick = () => s.mode === 'world' ? startRound(s.worldId, s.level) : s.mode === 'review' ? startReview() : startBoss();
    $('#endMap').onclick = () => w ? openWorld(w.id) : MQ.home();
    if ($('#endNext')) $('#endNext').onclick = () => startRound(s.worldId, s.level + 1);
  }

  /* ---------------- WORKSHOP (free equation) ---------------- */
  const RANDOM_EQ = [
    () => `${MQ.rand(2, 9)}x + ${MQ.rand(1, 9)} = ${MQ.rand(20, 60)}`.replace(/(\d+)x \+ (\d+) = (\d+)/, (m, a, b) => { const x = MQ.rand(2, 9); return `${a}x + ${b} = ${a * x + Number(b)}`; }),
    () => { const x = MQ.rand(2, 9), a = MQ.rand(4, 8), c = MQ.rand(1, a - 1), b = MQ.rand(1, 9); return `${a}x + ${b} = ${c === 1 ? '' : c}x + ${(a - c) * x + b}`; },
    () => { const x = MQ.rand(2, 8), a = MQ.rand(2, 5), b = MQ.rand(1, 6); return `${a}(x + ${b}) = ${a * (x + b)}`; },
    () => { const d = MQ.rand(2, 5), q = MQ.rand(2, 8), b = MQ.rand(1, 9); return `x/${d} - ${b} = ${q - b}`; }
  ];
  function openWorkshop(prefill) {
    session = { mode: 'free', level: 1, round: [], i: 0, results: [] };
    showPlayShell();
    $('.round-bar').innerHTML = '<span class="ws-title">🛠️ Solve MY equation</span>';
    $('#quitBtn').onclick = () => { ctxToken++; MQ.home(); };
    const load = async eq => {
      const ctx = makeCtx({ level: 1, free: true });
      try { MQ.parseEquation(eq); } catch (e) { setBubble('⚠️ ' + esc(e.message), 'oops'); return; }
      $('#stage').innerHTML = '';
      try { await MQ.runSolve({ eq }, ctx, $('#stage')); }
      catch (e) { if (e === DEAD) return; setBubble('⚠️ ' + esc(e.message || 'I could not solve that one.'), 'oops'); return; }
      if (!ctx.alive()) return;
      MQ.addXP(5);
      setBubble('🎉 Solved and checked! Type another one or tap 🎲.', 'yay');
      $('#controls').innerHTML = `<button class="big-btn" id="wsAgain" type="button">🎲 Another one</button>`;
      $('#wsAgain').onclick = () => { const e = MQ.pick(RANDOM_EQ)(); $('#wsInput').value = e; load(e); };
    };
    $('#playPrompt').innerHTML = `<div class="ws-load"><input id="wsInput" autocomplete="off" spellcheck="false" inputmode="text" aria-label="Your equation" placeholder="e.g. 3x + 6 = 18"><button class="go-btn" id="wsGo" type="button">Go</button></div>
      <div class="ws-hint">Works with things like <code>2(x - 4) = x + 5</code>, <code>x/3 + 2 = 7</code>, <code>-4x + 1 = 13</code>. <button class="mini-btn" id="wsRand" type="button">🎲 Random</button></div>`;
    $('#stage').innerHTML = '';
    setBubble('Type an equation from your homework (or tap 🎲) and I\'ll help you solve it — <b>you</b> make every move!');
    $('#controls').innerHTML = '';
    const go = () => load($('#wsInput').value);
    $('#wsGo').onclick = go;
    $('#wsInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#wsInput').blur(); go(); } });
    $('#wsRand').onclick = () => { const e = MQ.pick(RANDOM_EQ)(); $('#wsInput').value = e; load(e); };
    if (prefill) { $('#wsInput').value = prefill; load(prefill); }
    current = 'workshop';
  }

  /* ---------------- PARENT VIEW ---------------- */
  function openParent() {
    $('#scr-parent').innerHTML = `<header class="topbar"><button class="back" data-home type="button">‹ Home</button></header>
      <div class="wrap"><h1 class="page-title">📊 Progress</h1><p class="muted">Saved on this device only. "First try" means solved without any wrong taps.</p>
      ${MQ.WORLDS.map(w => {
        const d = store.world(w.id), acc = d.total ? Math.round(d.firstTry / d.total * 100) : 0;
        const tags = Object.entries(d.misses).filter(([k, n]) => k.startsWith('tag:') && n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
        return `<section class="p-card" style="--c:${w.color};--bg:${w.bg}"><h3>${w.icon} ${esc(w.title)}</h3>
          <div class="p-levels">${d.levels.map((l, j) => `<span class="${l.cleared ? 'done' : ''}">L${j + 1} ${'★'.repeat(l.stars)}${'☆'.repeat(3 - l.stars)}</span>`).join('')}</div>
          <div class="p-row"><span>Problems</span><b>${d.total}</b></div>
          <div class="p-row"><span>First-try accuracy</span><b>${d.total ? acc + '%' : '—'}</b></div>
          <div class="p-bar"><i style="width:${acc}%"></i></div>
          <div class="p-row"><span>Most slips</span><b>${tags.length ? tags.map(([k]) => esc(MQ.MISS_NAMES[k.slice(4)] || k.slice(4))).join(', ') : '—'}</b></div></section>`;
      }).join('')}
      <p class="muted small">Slips are counted per step (e.g. "choosing the opposite operation"), so you can see whether the trouble is the idea or the arithmetic.</p>
      <button class="ghost-btn danger" id="resetBtn" type="button">Reset all progress</button></div>`;
    $('#scr-parent [data-home]').onclick = MQ.home;
    $('#resetBtn').onclick = () => { if (confirm('Reset all Math Quest progress on this device?')) { store.reset(); MQ.home(); } };
    show('parent');
  }

  /* ---------------- boot ---------------- */
  document.addEventListener('click', e => {
    const m = e.target.closest('[data-mute]');
    if (m) { store.setMuted(!store.muted()); MQ.renderStats(); if (!store.muted()) MQ.sfx('good'); }
  });
  window.MathExplainers?.init();
  MQ.home();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
