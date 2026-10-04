/*
  ENCOURAGEMENT + SELF-EXPLANATION
  --------------------------------
  Praise follows growth-mindset research: celebrate effort, strategy and
  fixing mistakes ("you undid it on BOTH sides!") rather than "you're smart".
  Mistakes get a gentle lead-in plus a specific tip, never a scolding.
  "Why" questions ask her to explain the idea in her own head (self-explanation),
  which helps the concept stick.
*/
(() => {
  const MQ = window.MQ;
  const { pick } = MQ;
  const name = () => MQ.store?.data?.name ? MQ.store.data.name : '';
  const withName = s => { const n = name(); return n && Math.random() < .35 ? s.replace(/([!.])(\s|$)/, `, ${n}$1$2`) : s; };

  MQ.praise = {
    // Tiny pop-up words on every correct step.
    step: () => pick(['Nice move!', 'Yes!', 'Exactly!', 'You got it!', 'Great thinking!', 'Spot on!', 'Smart choice!', 'Boom!', 'Nailed it!', 'Perfect!']),
    // Gentle lead-in when an answer is not right yet.
    oops: () => pick(['Almost!', 'Good try!', 'So close!', 'Not yet —', 'Hmm, let\'s think!', 'Nice effort!']),
    // After a whole problem, first try. Strategy-specific.
    solved(type) {
      const by = {
        solve: ['You undid each step on BOTH sides — that\'s exactly how mathematicians solve it! 🧠', 'You kept the scale balanced the whole way. That\'s the secret! ⚖️', 'You unwrapped x step by step and proved it. Amazing! 🎁'],
        percent: ['You figured out WHICH part of the whole you needed — that\'s the hardest part! 🎯', 'You picked multiply or divide for the right reason. Super smart strategy! 💡', 'You used the percent bar like a pro! 📊'],
        convert: ['You let the units tell you × or ÷ — no guessing needed! 📏', 'Great prediction AND great setup! 🔮', 'Units canceled perfectly. You\'re a conversion wizard! 🪄'],
        words: ['You turned a story into math — that\'s a real-world superpower! 🦸', 'You read like a detective and built the equation yourself! 🕵️', 'From words to equation to answer. Awesome! 🚀'],
        balance: ['You understand what = really means. That\'s the foundation of all algebra! 🏛️', 'Balanced like a pro! ⚖️'],
        choice: ['You spotted the mistake like a math detective! 🕵️', 'Finding mistakes is a pro-level skill! 🔍']
      };
      return withName(pick(by[type] || ['Awesome work! 🌟']));
    },
    // After a whole problem with some mistakes along the way.
    recovered: () => withName(pick([
      'You stuck with it and figured it out — that\'s how brains grow! 🌱',
      'Mistakes are proof you\'re trying. Great fix! 💪',
      'You found the fix yourself. That\'s real learning! 🔁',
      'Every mistake taught your brain something. Nice persistence! 🧠',
      'Not giving up is a superpower. Well done! 🦸'
    ])),
    streak: n => n >= 10 ? `🔥🔥🔥 ${n} in a row — unstoppable!` : n >= 5 ? `🔥🔥 ${n} in a row — you're on fire!` : n >= 3 ? `🔥 ${n} in a row!` : '',
    round(stars) {
      return withName([
        'You showed up and practiced — that\'s what matters! Play again and Ollie will help with the tricky parts. 🌱',
        'Nice job finishing! Every round builds your skills. 🌱',
        'Great work! You\'re getting stronger at this! 💪',
        'Perfect round! Your practice is paying off! 🏆'
      ][stars]);
    },
    yourTurn: () => withName(pick(['Your turn! Try one just like it. 💪', 'Now you try — you\'ve got this! 🚀', 'Your turn! Do what Ollie did. 🦉']))
  };

  /* Self-explanation questions: [question, right answer, ...wrong answers with why] */
  const WHY = {
    solve: [
      { q: '🤔 Quick think: why do we do the same thing to BOTH sides?', ok: 'To keep both sides equal (balanced)', bad: [['To make the numbers smaller', 'Smaller numbers are nice, but the real reason is keeping the = true.'], ['So x can jump over', 'Nothing really jumps — we change both sides equally so they stay equal.']] },
      { q: '🤔 Why do we undo the + or − BEFORE the × or ÷?', ok: 'It was done to x last, so it comes off first', bad: [['Adding always goes first in math', 'Not always! It is about UNWRAPPING: the last thing done to x is undone first.'], ['It doesn\'t matter at all', 'You could divide first, but then you must divide EVERY term — undoing the outside first is cleaner.']] },
      { q: '🤔 How can you be SURE your answer is right?', ok: 'Plug it back in — both sides match', bad: [['It looks like a nice number', 'Answers can be messy numbers! Checking is the only way to be sure.'], ['The scale picture looked level', 'The picture helps, but plugging it in PROVES it.']] },
      { q: '🤔 When a term "moves" across the = sign, what really happens?', ok: 'We do the opposite operation to both sides', bad: [['The number teleports to the other side', 'It looks that way, but really we did the opposite to BOTH sides.'], ['We just change its sign for fun', 'The sign changes because we did the OPPOSITE operation on both sides.']] }
    ],
    percent: [
      { q: '🤔 When do you DIVIDE in a percent problem?', ok: 'When working back to the original (the whole)', bad: [['When the percent is big', 'The size doesn\'t matter — what matters is whether you KNOW the original.'], ['Whenever you see the word "off"', '"Off" means a discount; you still multiply if you know the original price.']] },
      { q: '🤔 For a SALE price, why use 1 − rate?', ok: 'You pay what is LEFT after the discount', bad: [['Because discounts are subtraction problems', 'Close! 1 − rate is the part that is LEFT (like 100% − 25% = 75%).'], ['To make the answer smaller', 'The answer is smaller, but the reason is you pay the part that is left.']] },
      { q: '🤔 What does 100% stand for in these problems?', ok: 'The whole original amount', bad: [['The answer', 'The answer can be any part. 100% is always the ORIGINAL whole.'], ['One dollar', '100% is the whole amount, whatever it is.']] }
    ],
    convert: [
      { q: '🤔 Why do we put the old unit on the BOTTOM of the fraction?', ok: 'So it cancels out', bad: [['Bigger units always go on the bottom', 'It\'s not about size — it\'s about canceling the unit you want to get rid of.'], ['That\'s just the rule', 'There\'s a reason! On the bottom it cancels with the unit you started with.']] },
      { q: '🤔 Going to a SMALLER unit, the number gets…', ok: 'Bigger — you need more small pieces', bad: [['Smaller — the unit is smaller', 'Tricky! Smaller pieces means you need MORE of them to cover the same amount.'], ['It stays the same', 'The amount stays the same, but the NUMBER changes because the pieces are a different size.']] }
    ],
    words: [
      { q: '🤔 What\'s the FIRST thing to do with a word problem?', ok: 'Figure out what the question is asking', bad: [['Add up all the numbers', 'Not all numbers are used the same way (some aren\'t needed at all)!'], ['Guess an answer', 'Guessing skips the thinking. Find the question and name the unknown first.']] },
      { q: '🤔 In a story, what does "each" or "per" usually mean?', ok: 'Multiply that amount by x', bad: [['Add it once', '"Each" means it happens again and again — that\'s multiplying.'], ['Divide by it', 'Usually "each" means the amount repeats, so multiply by how many.']] }
    ],
    balance: [
      { q: '🤔 What does the = sign mean?', ok: 'Both sides have the same value', bad: [['"The answer comes next"', 'That\'s a common idea, but = really means both sides are EQUAL, like a balanced scale.'], ['Do the math now', '= is a balance: left side and right side are worth the same.']] }
    ]
  };
  MQ.whyQuestion = type => { const list = WHY[type]; return list ? pick(list) : null; };
})();
