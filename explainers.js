/*
  ANIMATED CONCEPT LESSONS ("Watch the idea")
  -------------------------------------------
  Each world has a short sequence of animated scenes. Animations are pure CSS:
  elements use classes like .a-pop / .a-fade / .a-strike with a --d delay, so a
  scene "plays" every time it is rendered and "Replay" simply re-renders it.
*/
(() => {
  const d = s => `style="--d:${s}s"`;
  const eq = (l, r, cls = '', delay = 0) => `<div class="ex-eq ${cls}" ${d(delay)}><span class="l">${l}</span><span class="e">=</span><span class="r">${r}</span></div>`;
  const chip = (t, delay, extra = '') => `<span class="ex-chip a-pop ${extra}" ${d(delay)}>${t}</span>`;
  const strike = (t, delay) => `<span class="a-strike" ${d(delay)}>${t}</span>`;
  const scale = (l, r, mode = '', delay = 0) => `<div class="ex-scale ${mode}" ${d(delay)}><div class="ex-beam"><div class="ex-pan l"><b>${l}</b></div><div class="ex-pan r"><b>${r}</b></div></div><div class="ex-post"></div></div>`;

  const S = {
    balance: {
      t: 'The = sign means "same value"',
      h: `${scale('x + 5', '12')}<div class="ex-caption a-fade" ${d(.6)}>Both pans weigh the same. That is all "=" means.</div>`,
      say: 'An equation is a balanced scale. Whatever is on the left has exactly the same value as whatever is on the right.'
    },
    oneSide: {
      t: 'Change ONE side → it tips over',
      h: `${scale('x + 5 <span class="ex-chip a-pop" style="--d:.5s">− 5</span>', '12', 'tip', 0)}<div class="ex-caption bad a-fade" ${d(1.6)}>✗ Now the sides are NOT equal. The equation is broken.</div>`,
      say: 'If you subtract 5 from only the left side, the left gets lighter and the scale tips. The equation is no longer true.'
    },
    bothSides: {
      t: 'Change BOTH sides the same way → still balanced',
      h: `${scale('x + 5 <span class="ex-chip a-pop" style="--d:.5s">− 5</span>', '12 <span class="ex-chip a-pop" style="--d:1.1s">− 5</span>', 'tip-level')}
          <div class="ex-caption good a-fade" ${d(2.2)}>✓ Still level! And now it says <b>x = 7</b>.</div>`,
      say: 'Do the same thing to both sides and the scale stays level. That is the one golden rule of equations.'
    },
    check: {
      t: 'Check by putting your answer back in',
      h: `${eq('x + 5', '12')}${eq('<span class="ex-hl">7</span> + 5', '12', 'a-fade', .6)}${eq('12', '12 <span class="ex-ok">✓</span>', 'a-fade', 1.4)}
          <div class="ex-caption a-fade" ${d(2)}>If both sides match, your answer is right. No guessing needed!</div>`,
      say: 'Replace x with your answer in the original equation. If both sides come out the same, you know you are right.'
    },

    trick: {
      t: 'The "move it across" trick',
      h: `${eq('x <span class="ex-hop-out">+ 5</span>', '12 <span class="ex-hop-in">− 5</span>')}${eq('x', '12 − 5', 'a-fade', 2.2)}${eq('x', '7', 'a-fade', 2.9)}
          <div class="ex-caption a-fade" ${d(3.4)}>The +5 seems to jump over the = and turn into −5. Looks like magic… but it isn't. Next!</div>`,
      say: 'You may have heard: move the 5 to the other side and change its sign. Let’s see what is REALLY happening.'
    },
    really: {
      t: 'What REALLY happens',
      h: `${eq('x + 5', '12')}
          ${eq(`x ${strike('+ 5', 1.8)} ${chip(strike('− 5', 1.8), .5)}`, `12 ${chip('− 5', 1.0, 'stay')}`, 'a-fade', .3)}
          ${eq('x', '12 <span class="ex-hl">− 5</span>', 'a-fade', 2.4)}
          <div class="ex-caption a-fade" ${d(3)}>We subtracted 5 from <b>both sides</b>. On the left, +5 − 5 = 0 (gone!). On the right, the −5 stays. <b>That</b> is the "move".</div>`,
      say: 'We subtract 5 from both sides. On the left, plus 5 minus 5 makes zero, so it disappears. On the right, the minus 5 is still there. So it LOOKS like the 5 moved and flipped.'
    },
    opposites: {
      t: 'Crossing the = flips the operation',
      h: `<div class="ex-flips">
            <div class="ex-flip a-pop" ${d(.2)}><span>+ 5</span><i>crosses as</i><span>− 5</span></div>
            <div class="ex-flip a-pop" ${d(.7)}><span>− 5</span><i>crosses as</i><span>+ 5</span></div>
            <div class="ex-flip a-pop" ${d(1.2)}><span>× 3</span><i>crosses as</i><span>÷ 3</span></div>
            <div class="ex-flip a-pop" ${d(1.7)}><span>÷ 4</span><i>crosses as</i><span>× 4</span></div>
          </div><div class="ex-caption a-fade" ${d(2.3)}>Every operation has an opposite that undoes it.</div>`,
      say: 'Plus and minus undo each other. Times and divide undo each other. When something crosses the equal sign, it turns into its opposite.'
    },
    multTrap: {
      t: 'The #1 trap: 3x = 12',
      h: `${eq('<span class="ex-hl">3</span>x', '12')}
          <div class="ex-two">
            <div class="ex-wrong a-fade" ${d(.6)}>${eq('x', '12 − 3')}<b>✗ = 9</b><small>3x is NOT 3 + x</small></div>
            <div class="ex-right a-fade" ${d(1.6)}>${eq('x', '12 ÷ 3')}<b>✓ = 4</b><small>3x means 3 × x</small></div>
          </div><div class="ex-caption a-fade" ${d(2.4)}>The 3 is <b>multiplying</b>, so it crosses as <b>÷ 3</b>. Check: 3 × 4 = 12 ✓</div>`,
      say: 'Three x means three TIMES x. The 3 is multiplying, so it crosses as divide by 3, not minus 3. Twelve divided by three is four.'
    },
    unwrap: {
      t: 'Unwrap it like a present',
      h: `<div class="ex-wrap-row a-fade" ${d(.1)}><b>Build it:</b><span class="ex-box">x</span><i>× 3</i><span class="ex-box">3x</span><i>+ 6</i><span class="ex-box gift">3x + 6</span></div>
          <div class="ex-wrap-row a-fade" ${d(1.4)}><b>Unwrap:</b><span class="ex-box gift">3x + 6</span><i class="undo">− 6</i><span class="ex-box">3x</span><i class="undo">÷ 3</i><span class="ex-box">x</span></div>
          <div class="ex-caption a-fade" ${d(2.4)}>Last thing ON is the first thing OFF — like shoes go on after socks, but come off first.</div>`,
      say: 'To build three x plus six, you multiply by 3, then add 6. To unwrap it, go backwards: undo the plus 6 first, then undo the times 3.'
    },
    divideAll: {
      t: 'Dividing hits EVERY term',
      h: `${eq('3x + 6', '18')}
          <div class="ex-two">
            <div class="ex-wrong a-fade" ${d(.6)}>${eq('x + 6', '6')}<b>✗</b><small>only divided part of the left side</small></div>
            <div class="ex-right a-fade" ${d(1.5)}>${eq('x + 2', '6')}<b>✓</b><small>(3x + 6) ÷ 3 = x + 2</small></div>
          </div><div class="ex-caption a-fade" ${d(2.3)}>That's why it is easier to move the + 6 first!</div>`,
      say: 'If you divide a side by 3, everything on that side gets divided, including the 6. That is why we usually move the plus 6 first.'
    },
    recipe: {
      t: 'Your 4-step recipe',
      h: `<ol class="ex-list">
            <li class="a-pop" ${d(.2)}><b>Name it.</b> What is attached to x? (+, −, ×, ÷)</li>
            <li class="a-pop" ${d(.7)}><b>Flip it.</b> Use the opposite operation.</li>
            <li class="a-pop" ${d(1.2)}><b>Both sides.</b> Say: "I subtract 6 from both sides."</li>
            <li class="a-pop" ${d(1.7)}><b>Check it.</b> Plug the answer into the original.</li>
          </ol>`,
      say: 'Name it, flip it, do it to both sides, check it. Try it in the Equation Workshop!'
    },

    convBar: {
      t: 'Big unit → small unit = MORE of them',
      h: `<div class="ex-bar-wrap"><div class="ex-bar three">${[0, 1, 2].map(i => `<span class="seg"><em>1 ft</em><i class="ticks a-fade" ${d(.9 + i * .4)}></i></span>`).join('')}</div></div>
          <div class="ex-caption a-fade" ${d(2.3)}>3 feet = 3 × 12 = <b>36 inches</b>. Same length, smaller pieces, so the number gets <b>bigger → multiply</b>.</div>`,
      say: 'Each foot splits into 12 little inches. Same length, but more pieces. Going to a smaller unit makes the number bigger, so you multiply.'
    },
    convBack: {
      t: 'Small unit → big unit = FEWER of them',
      h: `<div class="ex-bar-wrap"><div class="ex-bar three grouped">${[0, 1, 2].map(i => `<span class="seg"><i class="ticks"></i><em class="a-pop" ${d(.6 + i * .4)}>12 in</em></span>`).join('')}</div></div>
          <div class="ex-caption a-fade" ${d(2)}>36 inches grouped into 12s = 36 ÷ 12 = <b>3 feet</b>. Bigger pieces, so the number gets <b>smaller → divide</b>.</div>`,
      say: 'Going the other way, group the little inches into feet. Bigger pieces means fewer of them, so you divide.'
    },
    unitFraction: {
      t: 'The unit-fraction trick (never guess again!)',
      h: `<div class="ex-frac-row">3 ${strike('ft', 1.4)} × <span class="ex-frac a-pop" ${d(.5)}><span>12 in</span><span>1 ${strike('ft', 1.4)}</span></span> = <b class="a-fade" ${d(2)}>36 in</b></div>
          <div class="ex-caption a-fade" ${d(2.5)}>Put the unit you want to <b>get rid of</b> on the <b>bottom</b>. It cancels, and the math tells you whether to × or ÷.</div>`,
      say: 'Multiply by a fraction equal to one, with the old unit on the bottom. The feet cancel, leaving inches. The units tell you what to do.'
    },
    unitFraction2: {
      t: 'Same trick, other direction',
      h: `<div class="ex-frac-row">150 ${strike('min', 1.4)} × <span class="ex-frac a-pop" ${d(.5)}><span>1 hr</span><span>60 ${strike('min', 1.4)}</span></span> = 150 ÷ 60 = <b class="a-fade" ${d(2)}>2.5 hr</b></div>
          <div class="ex-caption a-fade" ${d(2.5)}>The 60 ended up on the bottom, so it is a <b>divide</b>. Does 2.5 hours sound reasonable for 150 minutes? Yes!</div>`,
      say: 'Minutes on the bottom so they cancel. The 60 is on the bottom, so you divide. Always ask: is the answer reasonable?'
    },

    pctWhole: {
      t: 'Percent means "out of 100"',
      h: `<div class="ex-tape"><div class="ex-tape-bar"><span class="keep" style="width:75%">75%</span><span class="cut" style="width:25%">25%</span></div><div class="ex-tape-label">the whole original = <b>100%</b> = 1</div></div>
          <div class="ex-caption a-fade" ${d(.8)}>The original price is <b>always 100%</b>. Turn a percent into a decimal by ÷ 100: 25% = 0.25.</div>`,
      say: 'Percent means out of one hundred. The original amount is always 100 percent, which is the decimal 1.'
    },
    pctDecrease: {
      t: '25% OFF: what is left?',
      h: `<div class="ex-tape"><div class="ex-tape-bar"><span class="keep" style="width:75%">$60 · 75%</span><span class="cut a-away" style="width:25%;--d:.8s">$20 · 25%</span></div></div>
          ${eq('pay', '$80 × (1 − 0.25) = $80 × 0.75 = $60', 'a-fade', 1.8)}
          <div class="ex-caption a-fade" ${d(2.6)}>Want what is LEFT after a decrease? Use <b>1 − rate</b>. Want the piece cut off? Use the <b>rate</b>.</div>`,
      say: 'Twenty-five percent off cuts a quarter away. You pay the 75 percent that is left: times zero point seven five. The savings is the 25 percent piece: times zero point two five.'
    },
    pctIncrease: {
      t: '20% TIP or TAX: what is the total?',
      h: `<div class="ex-tape"><div class="ex-tape-bar grow"><span class="keep" style="width:83.3%">$50 · 100%</span><span class="add a-grow" style="width:16.7%;--d:.6s">+20%</span></div></div>
          ${eq('total', '$50 × (1 + 0.20) = $50 × 1.2 = $60', 'a-fade', 1.6)}
          <div class="ex-caption a-fade" ${d(2.4)}>Total after an increase? Use <b>1 + rate</b> — you keep the whole 100% AND add more.</div>`,
      say: 'For a tip, tax, or increase, you keep the original 100 percent and add more on top. So multiply by 1 plus the rate.'
    },
    pctDecide: {
      t: 'Multiply or divide?',
      h: `<div class="ex-arrows">
            <div class="ex-arrow-row a-fade" ${d(.2)}><span class="ex-box">ORIGINAL<br><b>$80</b></span><i class="fwd">× 0.75 →</i><span class="ex-box">AFTER<br><b>$60</b></span></div>
            <div class="ex-arrow-row a-fade" ${d(1.2)}><span class="ex-box">ORIGINAL<br><b>?</b></span><i class="back">← ÷ 0.75</i><span class="ex-box">AFTER<br><b>$60</b></span></div>
          </div>
          <div class="ex-caption a-fade" ${d(2)}>Know the <b>original</b>? <b>Multiply</b>. Know the <b>after</b> amount and need the original? Go backward — <b>divide</b>.</div>`,
      say: 'Going forward from the original, multiply. Going backward to find the original, divide by the same number.'
    },
    pctTrap: {
      t: 'Trap: working backward',
      h: `<div class="ex-caption">After 25% off, a hoodie costs $60. What was the original?</div>
          <div class="ex-two">
            <div class="ex-wrong a-fade" ${d(.5)}><div class="ex-eq">60 + 25% of 60 = 75</div><b>✗</b><small>the 25% was of the ORIGINAL, not of $60</small></div>
            <div class="ex-right a-fade" ${d(1.5)}><div class="ex-eq">60 ÷ 0.75 = 80</div><b>✓</b><small>check: 80 × 0.75 = 60</small></div>
          </div>`,
      say: 'You cannot just add 25 percent back, because the 25 percent was taken from the original, which was bigger. Divide by zero point seven five instead.'
    },
    pctClues: {
      t: 'Clue words',
      h: `<div class="ex-clues">
            <div class="a-pop" ${d(.2)}><b>× rate</b><span>discount amount · tax amount · tip · "what is 20% of"</span></div>
            <div class="a-pop" ${d(.7)}><b>× (1 − rate)</b><span>sale price · after a decrease · what is left · remaining</span></div>
            <div class="a-pop" ${d(1.2)}><b>× (1 + rate)</b><span>total with tax/tip · after an increase · markup price</span></div>
            <div class="a-pop" ${d(1.7)}><b>÷ (…)</b><span>"original price" · "what number" · "before" · working backward</span></div>
          </div>`,
      say: 'Look for clue words to choose: the rate, one minus the rate, one plus the rate, or divide to work backward.'
    },

    wordPlan: {
      t: 'Read like a detective',
      h: `<ol class="ex-list">
            <li class="a-pop" ${d(.2)}>🖍️ <b>Circle the numbers</b> and their units.</li>
            <li class="a-pop" ${d(.7)}>❓ <b>Underline the question.</b> What exactly do they want?</li>
            <li class="a-pop" ${d(1.2)}>✍️ <b>Let x =</b> the thing you don't know.</li>
            <li class="a-pop" ${d(1.7)}>🔗 <b>Write the equation</b>, then solve and check it makes sense.</li>
          </ol>`,
      say: 'Circle the numbers, underline the question, name the unknown, then write an equation. Only then do the math.'
    },
    wordMap: {
      t: 'Translate the story piece by piece',
      h: `<div class="ex-story"><span class="c1">A club has $15</span>, <span class="c2">earns $5 for each</span> <span class="c3">item sold</span>, and <span class="c4">wants $40</span>.</div>
          <div class="ex-eq big a-fade" ${d(.5)}><span class="c1 a-pop" ${d(.8)}>15</span>&nbsp;+&nbsp;<span class="c2 a-pop" ${d(1.3)}>5</span><span class="c3 a-pop" ${d(1.8)}>x</span>&nbsp;=&nbsp;<span class="c4 a-pop" ${d(2.3)}>40</span></div>
          <div class="ex-caption a-fade" ${d(2.9)}>Starting amount + rate × how many = total. "Each" or "per" usually means <b>multiply by x</b>.</div>`,
      say: 'The starting amount stands alone. The amount per item gets multiplied by x. The goal goes on the other side of the equal sign.'
    },
    wordTraps: {
      t: 'Word traps',
      h: `<div class="ex-clues">
            <div class="a-pop" ${d(.2)}><b>5 more than n</b><span>n + 5</span></div>
            <div class="a-pop" ${d(.6)}><b>5 less than n</b><span class="hot">n − 5 &nbsp;(NOT 5 − n!)</span></div>
            <div class="a-pop" ${d(1)}><b>twice n</b><span>2n</span></div>
            <div class="a-pop" ${d(1.4)}><b>3 times the sum of n and 4</b><span>3(n + 4)</span></div>
            <div class="a-pop" ${d(1.8)}><b>is · equals · gives</b><span>=</span></div>
          </div>`,
      say: 'Watch out for less than. Five less than a number means the number minus five. The order is flipped from the words.'
    }
  };

  const LESSONS = {
    equality: ['balance', 'oneSide', 'bothSides', 'check'],
    moving: ['trick', 'really', 'opposites', 'multTrap', 'unwrap', 'divideAll', 'recipe'],
    algebra: ['unwrap', 'opposites', 'multTrap', 'divideAll', 'check', 'recipe'],
    conversions: ['convBar', 'convBack', 'unitFraction', 'unitFraction2'],
    percents: ['pctWhole', 'pctDecrease', 'pctIncrease', 'pctDecide', 'pctTrap', 'pctClues'],
    words: ['wordPlan', 'wordMap', 'wordTraps', 'pctClues']
  };

  let list = [], idx = 0, title = '';
  const modal = () => document.getElementById('explainer');

  function speak(text) {
    try {
      if (!('speechSynthesis' in window)) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.rate = 0.98; speechSynthesis.speak(u);
    } catch {}
  }

  function draw() {
    const m = modal(), s = S[list[idx]];
    m.querySelector('.ex-title').textContent = `${title} · ${idx + 1}/${list.length}`;
    m.querySelector('.ex-scene-title').textContent = s.t;
    const stage = m.querySelector('.ex-stage');
    stage.innerHTML = s.h;
    m.querySelector('.ex-say').textContent = s.say;
    m.querySelector('.ex-dots').innerHTML = list.map((_, i) => `<i class="${i === idx ? 'on' : ''}"></i>`).join('');
    m.querySelector('[data-ex=prev]').disabled = idx === 0;
    m.querySelector('[data-ex=next]').textContent = idx === list.length - 1 ? 'Done ✓' : 'Next ▶';
    if (m.dataset.voice === 'on') speak(s.say);
    window.MQ?.sfx('whoosh');
  }

  function close() {
    modal().hidden = true;
    try { speechSynthesis.cancel(); } catch {}
    document.body.classList.remove('modal-open');
  }

  function init() {
    const m = modal();
    m.querySelector('[data-ex=prev]').addEventListener('click', () => { if (idx > 0) { idx--; draw(); } });
    m.querySelector('[data-ex=next]').addEventListener('click', () => {
      if (idx < list.length - 1) { idx++; draw(); }
      else { close(); window.MQ?.toast('Concept lesson complete! 🎬'); window.MQ?.addXP(3); }
    });
    m.querySelector('[data-ex=replay]').addEventListener('click', draw);
    m.querySelector('[data-ex=close]').addEventListener('click', close);
    m.querySelector('[data-ex=voice]').addEventListener('click', e => {
      const on = m.dataset.voice !== 'on'; m.dataset.voice = on ? 'on' : 'off';
      e.currentTarget.textContent = on ? '🔊 Reading aloud' : '🔈 Read aloud';
      if (on) speak(S[list[idx]].say); else { try { speechSynthesis.cancel(); } catch {} }
    });
    m.addEventListener('click', e => { if (e.target === m) close(); });
    document.addEventListener('keydown', e => {
      if (m.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') m.querySelector('[data-ex=next]').click();
      if (e.key === 'ArrowLeft') m.querySelector('[data-ex=prev]').click();
    });
  }

  window.MathExplainers = {
    init,
    has: key => !!LESSONS[key],
    open(key, label) {
      list = LESSONS[key] || []; idx = 0; title = label || 'Concept lesson';
      if (!list.length) return;
      modal().hidden = false; document.body.classList.add('modal-open'); draw();
      modal().querySelector('[data-ex=next]').focus();
    }
  };
})();
