/*
  LIGHTNING ROUND
  ---------------
  60-second rapid-fire game that drills the split-second DECISIONS behind each
  skill (which operation undoes this? rate or 1 − rate? × or ÷ for this unit?).
  Wrong answers pause briefly to show why, so speed never beats understanding.
*/
(() => {
  const $ = s => document.querySelector(s);
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[rand(0, a.length - 1)];
  const fmt = n => String(Number(n.toFixed(2)));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rand(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const MQ = () => window.MQ || { toast(){}, celebrate(){}, sfx(){}, addXP(){} };
  const BEST_KEY = 'mathQuestBlitzBest';

  const CARDS = {
    move: () => pick([
      () => { const a = rand(2, 12), b = rand(13, 30); return { q: `x + ${a} = ${b}`, ask: `x = ${b} ▢ ${a}`, ok: '−', opts: ['+', '−', '×', '÷'], why: `+${a} crosses as −${a}` }; },
      () => { const a = rand(2, 12), b = rand(2, 20); return { q: `x − ${a} = ${b}`, ask: `x = ${b} ▢ ${a}`, ok: '+', opts: ['+', '−', '×', '÷'], why: `−${a} crosses as +${a}` }; },
      () => { const a = rand(2, 9), b = a * rand(2, 9); return { q: `${a}x = ${b}`, ask: `x = ${b} ▢ ${a}`, ok: '÷', opts: ['+', '−', '×', '÷'], why: `${a}x means ${a} × x, so it crosses as ÷${a}` }; },
      () => { const a = rand(2, 9), b = rand(2, 9); return { q: `x ÷ ${a} = ${b}`, ask: `x = ${b} ▢ ${a}`, ok: '×', opts: ['+', '−', '×', '÷'], why: `÷${a} crosses as ×${a}` }; },
      () => { const a = rand(2, 12), b = rand(13, 30); return { q: `${b} = x + ${a}`, ask: `${b} ▢ ${a} = x`, ok: '−', opts: ['+', '−', '×', '÷'], why: `+${a} crosses as −${a} (x is on the right, that's fine)` }; }
    ])(),
    pct: () => {
      const r = pick([10, 15, 20, 25, 30, 40]), R = fmt(r / 100), Lf = fmt(1 - r / 100), U = fmt(1 + r / 100);
      return pick([
        { q: `${r}% off`, ask: 'price you PAY = original ▢', ok: `× ${Lf}`, opts: [`× ${R}`, `× ${Lf}`, `× ${U}`, `÷ ${Lf}`], why: `you pay the ${100 - r}% that is left` },
        { q: `${r}% off`, ask: 'money you SAVE = original ▢', ok: `× ${R}`, opts: [`× ${R}`, `× ${Lf}`, `× ${U}`, `÷ ${R}`], why: `savings are the ${r}% piece` },
        { q: `${r}% tip`, ask: 'TOTAL bill = meal ▢', ok: `× ${U}`, opts: [`× ${R}`, `× ${Lf}`, `× ${U}`, `÷ ${U}`], why: `total is 100% + ${r}%` },
        { q: `paid after ${r}% off`, ask: 'ORIGINAL = paid ▢', ok: `÷ ${Lf}`, opts: [`× ${Lf}`, `÷ ${Lf}`, `× ${U}`, `÷ ${R}`], why: `paid = original × ${Lf}, so go backward with ÷` },
        { q: `${r}% tax`, ask: 'just the TAX = price ▢', ok: `× ${R}`, opts: [`× ${R}`, `× ${U}`, `× ${Lf}`, `÷ ${R}`], why: `the tax alone is the ${r}% piece` }
      ]);
    },
    conv: () => {
      const [big, small, k] = pick([['ft', 'in', 12], ['yd', 'ft', 3], ['hr', 'min', 60], ['min', 'sec', 60], ['lb', 'oz', 16], ['m', 'cm', 100], ['km', 'm', 1000], ['gal', 'qt', 4], ['day', 'hr', 24]]);
      const down = Math.random() < 0.5;
      return { q: down ? `${big} → ${small}` : `${small} → ${big}`, ask: `1 ${big} = ${k} ${small}`, ok: down ? `× ${k}` : `÷ ${k}`, opts: [`× ${k}`, `÷ ${k}`], why: down ? `smaller unit → more of them → ×` : `bigger unit → fewer of them → ÷` };
    },
    words: () => {
      const a = rand(2, 9);
      return pick([
        { q: `${a} less than n`, ask: 'translate', ok: `n − ${a}`, opts: [`n − ${a}`, `${a} − n`, `${a}n`, `n + ${a}`], why: '"less than" flips the order' },
        { q: `${a} more than n`, ask: 'translate', ok: `n + ${a}`, opts: [`n + ${a}`, `${a}n`, `n − ${a}`, `${a} − n`], why: '"more than" means add' },
        { q: `n decreased by ${a}`, ask: 'translate', ok: `n − ${a}`, opts: [`n − ${a}`, `${a} − n`, `n ÷ ${a}`, `n + ${a}`], why: 'decreased by = subtract' },
        { q: `${a} times a number`, ask: 'translate', ok: `${a}n`, opts: [`${a}n`, `n + ${a}`, `n ÷ ${a}`, `${a} − n`], why: 'times = multiply' },
        { q: `the sum of n and ${a}, times 2`, ask: 'translate', ok: `2(n + ${a})`, opts: [`2(n + ${a})`, `2n + ${a}`, `n + 2${a}`, `2 + n + ${a}`], why: 'the sum is a group → parentheses' },
        { q: `$${a} for each ticket, n tickets`, ask: 'cost', ok: `${a}n`, opts: [`${a}n`, `${a} + n`, `n ÷ ${a}`, `${a} − n`], why: '"each" → multiply' }
      ]);
    }
  };
  const LABELS = { move: '↔️ Across the =', pct: '% Percents', conv: '📏 Units', words: '💬 Words' };

  let state = null, timer = null;

  function newCard() {
    const types = state.types;
    const type = pick(types), c = CARDS[type]();
    c.type = type; c.opts = shuffle([...new Set(c.opts)]);
    state.card = c; state.locked = false;
    const area = $('#blitzCard');
    area.innerHTML = `<div class="blitz-tag">${LABELS[type]}</div><div class="blitz-q">${c.q}</div><div class="blitz-ask">${c.ask}</div>
      <div class="blitz-opts ${c.opts.length === 2 ? 'two' : ''}">${c.opts.map((o, i) => `<button type="button" data-i="${i}"><small>${i + 1}</small>${o}</button>`).join('')}</div><div class="blitz-why" id="blitzWhy"></div>`;
    area.classList.remove('flip-in'); void area.offsetWidth; area.classList.add('flip-in');
    area.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => answer(Number(b.dataset.i), b)));
  }

  function answer(i, btn) {
    if (!state || state.locked || state.over) return;
    const c = state.card, ok = c.opts[i] === c.ok;
    state.locked = true;
    const btns = [...document.querySelectorAll('#blitzCard [data-i]')];
    btns.forEach(b => { b.disabled = true; if (c.opts[Number(b.dataset.i)] === c.ok) b.classList.add('right'); });
    if (ok) {
      state.combo++; const pts = state.combo >= 5 ? 3 : state.combo >= 3 ? 2 : 1;
      state.score += pts; state.right++;
      btn.classList.add('right');
      $('#blitzWhy').innerHTML = `<b>+${pts}</b>${pts > 1 ? ` 🔥 combo ×${pts}` : ''}`;
      MQ().sfx(state.combo >= 3 ? 'combo' : 'good');
      setTimeout(() => { if (!state.over) newCard(); }, 380);
    } else {
      state.combo = 0; state.wrong++; state.misses[c.type] = (state.misses[c.type] || 0) + 1;
      btn.classList.add('wrong');
      $('#blitzWhy').innerHTML = `✗ It's <b>${c.ok}</b> — ${c.why}`;
      MQ().sfx('bad');
      setTimeout(() => { if (!state.over) newCard(); }, 1700);
    }
    renderHud();
  }

  function renderHud() {
    $('#blitzScore').textContent = state.score;
    $('#blitzCombo').textContent = state.combo >= 3 ? `🔥 ×${state.combo >= 5 ? 3 : 2}` : `streak ${state.combo}`;
    const left = Math.max(0, state.end - Date.now());
    $('#blitzTime').textContent = Math.ceil(left / 1000);
    $('#blitzBar').style.width = `${(left / 60000) * 100}%`;
  }

  function finish() {
    clearInterval(timer); state.over = true;
    let best = 0; try { best = Number(localStorage.getItem(BEST_KEY) || 0); } catch {}
    const isBest = state.score > best;
    if (isBest) { try { localStorage.setItem(BEST_KEY, String(state.score)); } catch {} best = state.score; }
    const worst = Object.entries(state.misses).sort((a, b) => b[1] - a[1])[0];
    const xp = Math.min(20, Math.round(state.score / 2));
    MQ().addXP(xp);
    if (isBest || state.score >= 10) { MQ().celebrate(); MQ().sfx('win'); }
    $('#blitzCard').innerHTML = `<div class="blitz-end">
      <div class="blitz-big">${state.score}</div><div>points ${isBest ? '— <b>NEW BEST! 🏆</b>' : `(best: ${best})`}</div>
      <div class="blitz-stats"><span>✓ ${state.right} right</span><span>✗ ${state.wrong} to review</span><span>+${xp} XP</span></div>
      ${worst ? `<p>Most slips: <b>${LABELS[worst[0]]}</b>. Try its 🎬 concept lesson, then come back!</p>` : '<p>No slips at all — amazing!</p>'}
      <button class="primary" id="blitzAgain" type="button">Play again ⚡</button></div>`;
    $('#blitzAgain').addEventListener('click', start);
  }

  function start() {
    const types = [...document.querySelectorAll('#blitzView [data-btype]:checked')].map(x => x.value);
    if (!types.length) { MQ().toast('Pick at least one topic'); return; }
    state = { score: 0, combo: 0, right: 0, wrong: 0, misses: {}, types, end: Date.now() + 60000, over: false };
    clearInterval(timer); timer = setInterval(() => { renderHud(); if (Date.now() >= state.end) finish(); }, 200);
    renderHud(); newCard(); MQ().sfx('whoosh');
  }

  function render() {
    let best = 0; try { best = Number(localStorage.getItem(BEST_KEY) || 0); } catch {}
    $('#blitzView').innerHTML = `
      <button class="back" data-back>← Quest map</button>
      <div class="lesson-head"><div><div class="eyebrow">⚡ LIGHTNING ROUND</div><h1>60-second decisions</h1></div><div class="mastery-pill">Best: ${best}</div></div>
      <p class="muted">Quick! Pick the right move. Three in a row = combo points. A wrong answer pauses to show you why.</p>
      <div class="blitz-topics">${Object.entries(LABELS).map(([k, v]) => `<label><input type="checkbox" data-btype value="${k}" checked> ${v}</label>`).join('')}</div>
      <div class="card blitz-card">
        <div class="blitz-hud"><span>⏱ <b id="blitzTime">60</b>s</span><span>⭐ <b id="blitzScore">0</b></span><span id="blitzCombo">streak 0</span></div>
        <div class="blitz-timebar"><span id="blitzBar" style="width:100%"></span></div>
        <div id="blitzCard" class="blitz-area"><div class="blitz-end"><div class="blitz-big">⚡</div><p>Ready? You have 60 seconds.</p><button class="primary" id="blitzGo" type="button">Start!</button></div></div>
      </div>`;
    $('#blitzGo').addEventListener('click', start);
    $('#blitzView [data-back]').addEventListener('click', () => { stop(); window.MQ?.home(); });
  }

  function stop() { clearInterval(timer); if (state) state.over = true; }

  document.addEventListener('keydown', e => {
    if (!state || state.over || !$('#blitzView')?.classList.contains('active')) return;
    const n = Number(e.key); if (n >= 1 && n <= 4) document.querySelector(`#blitzCard [data-i="${n - 1}"]`)?.click();
  });

  window.MathBlitz = { open() { stop(); state = null; render(); }, stop };
})();
