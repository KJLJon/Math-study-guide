/*
  WORLDS + PROBLEM GENERATORS
  ---------------------------
  Each world has 4 levels: Learn (narrated), Practice, Solo, Boss.
  A level lists generator "kinds"; a round picks 5 of them (favoring kinds
  the learner has missed). Each generator returns an activity spec:
    { type: 'solve'|'percent'|'convert'|'words'|'choice'|'balance', kind, prompt, ... }
  To add more practice: write a generator below and list its kind in a level.
*/
(() => {
  const MQ = window.MQ;
  const { rand, pick, fmt } = MQ;
  const G = {};

  /* ===================== EQUATIONS ===================== */
  const solve = (kind, eq, prompt, extra = {}) => ({ type: 'solve', kind, eq, prompt: prompt || 'Solve for x — get x alone!', ...extra });

  G.bal_game = () => {
    const x = rand(2, 8), a = rand(2, 6), b = x + a;
    const k = rand(1, 3);
    const moves = MQ.shuffle([
      { text: `Add ${k} blocks to the LEFT side only`, dl: k, dr: 0 },
      { text: `Add ${k} blocks to BOTH sides`, dl: k, dr: k },
      { text: `Take 1 block off the RIGHT side only`, dl: 0, dr: -1 }
    ]).slice(0, 2);
    if (!moves.some(m => m.dl === m.dr)) moves[1] = { text: `Add ${k} blocks to BOTH sides`, dl: k, dr: k };
    return { type: 'balance', kind: 'bal_game', x, a, b, moves, prompt: 'Keep the scale balanced!' };
  };
  G.bal_add = () => { const x = rand(2, 9), a = rand(2, 8); return solve('bal_add', `x + ${a} = ${x + a}`, null, { blocks: true }); };
  G.bal_mult = () => { const a = rand(2, 4), x = rand(2, 5); return solve('bal_mult', `${a}x = ${a * x}`, null, { blocks: true }); };
  G.bal_two = () => { const a = rand(2, 3), x = rand(2, 4), b = rand(1, 5); return solve('bal_two', `${a}x + ${b} = ${a * x + b}`, null, { blocks: true }); };

  G.eq_add = () => { const x = rand(3, 20), a = rand(2, 15); return solve('eq_add', `x + ${a} = ${x + a}`); };
  G.eq_sub = () => { const x = rand(8, 25), a = rand(2, 9); return solve('eq_sub', `x - ${a} = ${x - a}`); };
  G.eq_mult = () => { const a = rand(2, 9), x = rand(2, 12); return solve('eq_mult', `${a}x = ${a * x}`); };
  G.eq_div = () => { const d = rand(2, 6), b = rand(2, 9); return solve('eq_div', `x/${d} = ${b}`); };
  G.eq_right = () => { const x = rand(3, 15), a = rand(2, 12); return solve('eq_right', `${x + a} = x + ${a}`, 'Solve for x — x is on the right this time!'); };
  G.eq_two = () => { const a = rand(2, 7), x = rand(2, 10), b = rand(1, 12); return solve('eq_two', `${a}x + ${b} = ${a * x + b}`); };
  G.eq_two_sub = () => { const a = rand(2, 7), x = rand(2, 10), b = rand(1, 9); return solve('eq_two_sub', `${a}x - ${b} = ${a * x - b}`); };
  G.eq_div_two = () => { const d = rand(2, 5), q = rand(2, 8), b = rand(1, 9); return solve('eq_div_two', `x/${d} + ${b} = ${q + b}`); };
  G.eq_both = () => { const x = rand(2, 9), a = rand(4, 8), c = rand(1, a - 2), b = rand(1, 10), d = (a - c) * x + b; return solve('eq_both', `${a}x + ${b} = ${c === 1 ? '' : c}x + ${d}`); };
  G.eq_paren = () => { const a = rand(2, 5), b = rand(1, 6), x = rand(2, 8); return solve('eq_paren', `${a}(x + ${b}) = ${a * (x + b)}`); };
  G.eq_neg = () => pick([
    () => { const a = rand(2, 6), x = rand(2, 9), b = rand(3, 20); return solve('eq_neg', `-${a}x + ${b} = ${-a * x + b}`); },
    () => { const a = rand(2, 6), x = -rand(2, 9), b = rand(1, 9); return solve('eq_neg', `${a}x + ${b} = ${a * x + b}`); }
  ])();
  G.eq_both_paren = () => { const x = rand(2, 7), a = rand(2, 4), b = rand(1, 4), c = rand(1, a * 2 - 1); const rhs = a * (x + b) - c * x; if (c >= a) return G.eq_both_paren(); return solve('eq_both_paren', `${a}(x + ${b}) = ${c === 1 ? '' : c}x + ${rhs}`); };

  G.glitch = () => {
    const x = rand(3, 9), a = rand(2, 6), b = rand(2, 9), who = pick(['Maya', 'Leo', 'Priya', 'Sam', 'Jordan', 'Ava', 'Eli']);
    const c = pick([
      { eq: `${a}x = ${a * x}`, bad: `x = ${a * x} − ${a}`, ok: `The ${a} is MULTIPLYING x, so it should cross as ÷ ${a}`, wrong: [`The ${a} should cross as + ${a}`, 'Nothing is wrong'], why: `${a}x means ${a} TIMES x.` },
      { eq: `x + ${b} = ${x + b}`, bad: `x = ${x + b} + ${b}`, ok: `The + ${b} should flip to − ${b} when it crosses`, wrong: [`The ${b} should cross as ÷ ${b}`, 'Nothing is wrong'], why: 'Crossing the = flips the operation: + becomes −.' },
      { eq: `${a}x + ${b} = ${a * x + b}`, bad: `x + ${b} = ${a * x + b} ÷ ${a}`, ok: `Dividing by ${a} must divide EVERY term, including the + ${b}`, wrong: [`The ${a} should cross as − ${a}`, 'Nothing is wrong'], why: 'Unwrap from the outside: move the + first.' },
      { eq: `x − ${b} = ${x}`, bad: `x = ${x} − ${b}`, ok: `The − ${b} should flip to + ${b} when it crosses`, wrong: [`The ${b} should cross as × ${b}`, 'Nothing is wrong'], why: 'Undo subtracting with adding.' }
    ]);
    return {
      type: 'choice', kind: 'glitch', prompt: `🕵️ Spot the glitch! ${who} solved ${c.eq} like this:`,
      visual: `<div class="glitch"><div class="g-line">${c.eq}</div><div class="g-line bad">${c.bad} <span>❌</span></div></div>`,
      questions: [{ q: 'What went wrong?', options: [{ t: c.ok, ok: true }, ...c.wrong.map(w => ({ t: w, why: c.why }))] }],
      then: c.eq.replace(/−/g, '-'), thenSay: 'Now solve it the RIGHT way.'
    };
  };

  /* ===================== PERCENTS ===================== */
  const items = ['hoodie', 'pair of sneakers', 'video game', 'backpack', 'skateboard', 'phone case', 'jacket', 'concert ticket'];
  const P = (kind, o) => ({ type: 'percent', kind, ...o });
  G.pct_sale = () => { const w = pick([20, 40, 60, 80, 100, 120]), r = pick([10, 20, 25, 30, 40]), it = pick(items); return P('pct_sale', { mode: 'decrease', rate: r, whole: w, prompt: `A $${w} ${it} is ${r}% off. How much do you PAY?`, ask: 'what you pay' }); };
  G.pct_save = () => { const w = pick([20, 40, 60, 80, 100]), r = pick([10, 20, 25, 30, 40]), it = pick(items); return P('pct_save', { mode: 'of', rate: r, whole: w, prompt: `A $${w} ${it} is ${r}% off. How much money do you SAVE?`, ask: 'the amount you save', word: { piece: 'discount', rest: 'you pay' } }); };
  G.pct_tip = () => { const w = pick([20, 40, 60, 80]), r = pick([10, 15, 20, 25]); return P('pct_tip', { mode: 'increase', rate: r, whole: w, prompt: `Dinner costs $${w}. You add a ${r}% tip. What is the TOTAL?`, ask: 'the total', word: { extra: 'tip' } }); };
  G.pct_tax = () => { const w = pick([20, 40, 60, 80, 100]), r = pick([5, 10]), it = pick(items); return P('pct_tax', { mode: 'increase', rate: r, whole: w, prompt: `A $${w} ${it} has ${r}% sales tax. What is the TOTAL cost?`, ask: 'the total', word: { extra: 'tax' } }); };
  G.pct_taxonly = () => { const w = pick([20, 40, 60, 80, 100]), r = pick([5, 10, 20]); return P('pct_taxonly', { mode: 'of', rate: r, whole: w, prompt: `Sales tax is ${r}% on a $${w} bike helmet. How much is just the TAX?`, ask: 'just the tax', word: { piece: 'tax', rest: '' } }); };
  G.pct_whole = () => { const w = pick([40, 60, 80, 100, 120]), r = pick([10, 20, 25, 50]); return P('pct_whole', { mode: 'whole', rate: r, part: w * r / 100, whole: w, prompt: `You saved $${fmt(w * r / 100)}, which was ${r}% off the full price. What was the FULL price?`, ask: 'the full price', word: { piece: 'saved' } }); };
  G.pct_reverse = () => { const w = pick([40, 60, 80, 100, 120]), r = pick([20, 25, 40, 50]); return P('pct_reverse', { mode: 'reverse', rate: r, part: w * (1 - r / 100), whole: w, prompt: `After a ${r}% discount, a ${pick(items)} costs $${fmt(w * (1 - r / 100))}. What was the ORIGINAL price?`, ask: 'the original price' }); };
  G.pct_reverse_up = () => { const w = pick([20, 40, 60, 80, 100]), r = pick([10, 20, 25, 50]); return P('pct_reverse_up', { mode: 'reverseUp', rate: r, part: w * (1 + r / 100), whole: w, prompt: `A price went UP ${r}% and is now $${fmt(w * (1 + r / 100))}. What was it BEFORE?`, ask: 'the price before' }); };

  /* ===================== CONVERSIONS ===================== */
  const UNITS = {
    ft_in: ['feet', 'inches', 'ft', 'in', 12, 'An inch is much smaller than a foot'],
    yd_ft: ['yards', 'feet', 'yd', 'ft', 3, 'A foot is smaller than a yard'],
    hr_min: ['hours', 'minutes', 'hr', 'min', 60, 'A minute is much shorter than an hour'],
    min_s: ['minutes', 'seconds', 'min', 's', 60, 'A second is much shorter than a minute'],
    lb_oz: ['pounds', 'ounces', 'lb', 'oz', 16, 'An ounce is much lighter than a pound'],
    gal_qt: ['gallons', 'quarts', 'gal', 'qt', 4, 'A quart is smaller than a gallon'],
    m_cm: ['meters', 'centimeters', 'm', 'cm', 100, 'A centimeter is much smaller than a meter'],
    km_m: ['kilometers', 'meters', 'km', 'm', 1000, 'A meter is much smaller than a kilometer'],
    kg_g: ['kilograms', 'grams', 'kg', 'g', 1000, 'A gram is much lighter than a kilogram'],
    L_mL: ['liters', 'milliliters', 'L', 'mL', 1000, 'A milliliter is much smaller than a liter'],
    day_hr: ['days', 'hours', 'day', 'hr', 24, 'An hour is shorter than a day'],
    c_floz: ['cups', 'fluid ounces', 'c', 'fl oz', 8, 'A fluid ounce is smaller than a cup']
  };
  function conv(kind, key, toSmall, v) {
    const [bigN, smallN, big, small, k, why] = UNITS[key];
    v ??= toSmall ? pick([2, 3, 4, 5, 6, 1.5, 2.5]) : k * pick([2, 3, 4, 5, 1.5].filter(n => Number.isInteger(k * n)));
    return {
      type: 'convert', kind, prompt: `Convert ${fmt(v)} ${toSmall ? bigN : smallN} to ${toSmall ? smallN : bigN}.`,
      v, from: toSmall ? big : small, to: toSmall ? small : big, more: toSmall,
      predictWhy: `${why}.`,
      steps: [toSmall ? { top: [k, small], bot: [1, big] } : { top: [1, big], bot: [k, small] }],
      bar: { big: toSmall, k, bigU: big, smallU: small, bigCount: toSmall ? v : v / k }
    };
  }
  G.cv_ft_in = () => conv('cv_ft_in', 'ft_in', Math.random() < .6);
  G.cv_hr_min = () => conv('cv_hr_min', 'hr_min', Math.random() < .6);
  G.cv_basic = () => conv('cv_basic', pick(['yd_ft', 'lb_oz', 'gal_qt', 'm_cm', 'day_hr', 'c_floz']), Math.random() < .5);
  G.cv_metric = () => conv('cv_metric', pick(['km_m', 'kg_g', 'L_mL', 'm_cm']), Math.random() < .5);
  G.cv_down = () => conv('cv_down', pick(['ft_in', 'hr_min', 'lb_oz', 'm_cm', 'yd_ft', 'min_s']), false);
  G.cv_chain = () => pick([
    () => { const v = pick([2, 3, 1.5, 2.5]); return { type: 'convert', kind: 'cv_chain', prompt: `Convert ${fmt(v)} yards to inches.`, v, from: 'yd', to: 'in', more: true, predictWhy: 'An inch is MUCH smaller than a yard.', steps: [{ top: [3, 'ft'], bot: [1, 'yd'] }, { top: [12, 'in'], bot: [1, 'ft'] }], bar: { big: true, k: 36, bigU: 'yd', smallU: 'in', bigCount: v } }; },
    () => { const v = pick([2, 3, 1.5]); return { type: 'convert', kind: 'cv_chain', prompt: `Convert ${fmt(v)} hours to seconds.`, v, from: 'hr', to: 's', more: true, predictWhy: 'A second is MUCH shorter than an hour.', steps: [{ top: [60, 'min'], bot: [1, 'hr'] }, { top: [60, 's'], bot: [1, 'min'] }], bar: null }; }
  ])();
  G.cv_rate = () => pick([
    () => { const v = pick([30, 45, 60, 90]); return { type: 'convert', kind: 'cv_rate', prompt: `A train goes ${v} miles per hour. How many miles per MINUTE is that?`, v, from: 'mi', fromBottom: 'hr', to: 'mi', toBottom: 'min', more: false, predictWhy: 'A minute is a tiny piece of an hour, so the train goes fewer miles in it.', steps: [{ top: [1, 'hr'], bot: [60, 'min'], cancelTop: true }], bar: null }; },
    () => { const v = pick([2, 3, 4, 5]); return { type: 'convert', kind: 'cv_rate', prompt: `A faucet drips ${v} cups per minute. How many cups per HOUR?`, v, from: 'c', fromBottom: 'min', to: 'c', toBottom: 'hr', more: true, predictWhy: 'An hour holds 60 minutes of dripping.', steps: [{ top: [60, 'min'], bot: [1, 'hr'], cancelTop: true }], bar: null }; }
  ])();

  /* ===================== WORD PROBLEMS ===================== */
  const W = (kind, o) => ({ type: 'words', kind, v: 'x', mustUse: o.mustUse || [], ...o });
  G.wp_club = () => {
    const s = pick([10, 12, 15, 20]), r = pick([4, 5, 6, 8]), n = rand(3, 9), goal = s + r * n;
    return W('wp_club', {
      prompt: 'Story problem', story: `A club already has $${s}. It earns $${r} for each bracelet it sells. How many bracelets must it sell to have $${goal}?`,
      need: [`$${s}`, `$${r}`, `$${goal}`], letMeaning: 'the number of bracelets sold', letWrong: ['the money per bracelet', 'the starting money'],
      tiles: [`${s}`, '+', `${r}x`, '=', `${goal}`, `${s}x`, '−'], mustUse: [`${s}`, `${r}`, `${goal}`], eq: `${s} + ${r}x = ${goal}`, answer: n,
      unitWord: 'bracelets', meaningWrong: ['dollars', 'clubs'], buildHint: `Start amount + (money EACH time × x) = goal. "Each" means it gets multiplied by x.`
    });
  };
  G.wp_phone = () => {
    const s = pick([15, 20, 25, 30]), r = pick([2, 3, 4, 5]), n = rand(2, 9), tot = s + r * n, who = pick(['Maya', 'Leo', 'Ana', 'Jay']);
    return W('wp_phone', {
      prompt: 'Story problem', story: `A phone plan costs $${s} a month plus $${r} for every GB of data. ${who}'s bill was $${tot}. How many GB did ${who} use?`,
      need: [`$${s}`, `$${r}`, `$${tot}`], letMeaning: 'the number of GB used', letWrong: ['the monthly fee', 'the total bill'],
      tiles: [`${s}`, '+', `${r}x`, '=', `${tot}`, `${s}x`, `${r}`], mustUse: [`${s}`, `${r}x`, `${tot}`], eq: `${s} + ${r}x = ${tot}`, answer: n,
      unitWord: 'GB', meaningWrong: ['dollars', 'months'], buildHint: 'Fixed fee + (cost per GB × x) = total bill.'
    });
  };
  G.wp_spend = () => {
    const s = pick([80, 100, 120, 150]), r = pick([5, 6, 8, 10]), n = rand(2, 8), left = s - r * n, who = pick(['Leo', 'Ava', 'Sam']);
    return W('wp_spend', {
      prompt: 'Story problem', story: `${who} has $${s} and spends $${r} each week on lunch. After how many weeks will ${who} have $${left} left?`,
      need: [`$${s}`, `$${r}`, `$${left}`], letMeaning: 'the number of weeks', letWrong: ['the money spent each week', 'the money left'],
      tiles: [`${s}`, '−', `${r}x`, '=', `${left}`, '+', `${r}`], mustUse: [`${s}`, `${r}x`, `${left}`], eq: `${s} − ${r}x = ${left}`, answer: n,
      unitWord: 'weeks', meaningWrong: ['dollars', 'lunches per day'], buildHint: 'Spending takes money AWAY: start − (amount each week × x) = what is left.'
    });
  };
  G.wp_tickets = () => {
    const t = pick([8, 9, 12, 15]), pop = pick([5, 6, 7]), n = rand(2, 6), tot = t * n + pop;
    return W('wp_tickets', {
      prompt: 'Story problem', story: `Movie tickets cost $${t} each. Popcorn costs $${pop}. Your group spent $${tot} on tickets and one popcorn. How many tickets did you buy?`,
      need: [`$${t}`, `$${pop}`, `$${tot}`], letMeaning: 'the number of tickets', letWrong: ['the price of popcorn', 'the total spent'],
      tiles: [`${t}x`, '+', `${pop}`, '=', `${tot}`, `${pop}x`, `${t}`], mustUse: [`${t}x`, `${pop}`, `${tot}`], eq: `${t}x + ${pop} = ${tot}`, answer: n,
      unitWord: 'tickets', meaningWrong: ['dollars', 'popcorns'], buildHint: '"Each" ticket → multiply by x. Popcorn is just added once.'
    });
  };
  G.wp_distract = () => {
    const s = pick([10, 15, 20]), r = pick([3, 4, 5]), n = rand(3, 8), tot = s + r * n, age = rand(12, 14), who = pick(['Jordan', 'Priya', 'Eli']);
    return W('wp_distract', {
      prompt: 'Story problem', story: `${who} is ${age} years old and is saving for a $${tot} game. ${who} has $${s} saved and adds $${r} every week. How many weeks until ${who} can buy the game?`,
      need: [`$${tot}`, `$${s}`, `$${r}`], extra: [`${age}`], extraWhy: `Does ${who}'s age change how many weeks it takes? Nope — it's a distraction!`,
      letMeaning: 'the number of weeks', letWrong: [`${who}'s age`, 'the price of the game'],
      tiles: [`${s}`, '+', `${r}x`, '=', `${tot}`, `${age}`, `${s}x`], mustUse: [`${s}`, `${r}x`, `${tot}`], eq: `${s} + ${r}x = ${tot}`, answer: n,
      unitWord: 'weeks', meaningWrong: ['years old', 'dollars'], buildHint: 'Saved now + (amount each week × x) = price of the game.'
    });
  };
  G.wp_gyms = () => {
    const f = pick([20, 30, 40]), a = pick([3, 4, 5]), b = a + pick([2, 3, 5]), n = f / (b - a);
    if (!Number.isInteger(n)) return G.wp_gyms();
    return W('wp_gyms', {
      prompt: 'Story problem', story: `Gym A costs $${f} to join plus $${a} per visit. Gym B costs $${b} per visit with no fee. After how many visits do they cost the same?`,
      need: [`$${f}`, `$${a}`, `$${b}`], letMeaning: 'the number of visits', letWrong: ['the joining fee', 'the cost per visit'],
      tiles: [`${f}`, '+', `${a}x`, '=', `${b}x`, `${f}x`, `${b}`], mustUse: [`${f}`, `${a}x`, `${b}x`], eq: `${f} + ${a}x = ${b}x`, answer: n,
      unitWord: 'visits', meaningWrong: ['dollars', 'gyms'], buildHint: '"Cost the same" means Gym A\'s cost = Gym B\'s cost.'
    });
  };
  G.wp_translate = () => {
    const a = rand(2, 9), n = rand(a + 2, a + 14), m = rand(2, 5);
    const c = pick([
      { s: `${a} more than a number is ${n + a}.`, t: ['x', '+', `${a}`, '=', `${n + a}`, '−', `${a}x`], eq: `x + ${a} = ${n + a}`, ans: n, h: '"More than" means add.' },
      { s: `${a} less than a number is ${n - a}.`, t: ['x', '−', `${a}`, '=', `${n - a}`, '+', `${a} − x`], eq: `x − ${a} = ${n - a}`, ans: n, h: 'TRAP! "5 less than a number" means the number, then take 5 away: x − 5.' },
      { s: `Twice a number, plus ${a}, is ${2 * n + a}.`, t: ['2x', '+', `${a}`, '=', `${2 * n + a}`, 'x', '2'], eq: `2x + ${a} = ${2 * n + a}`, ans: n, h: '"Twice a number" is 2x.' },
      { s: `A number divided by ${m} is ${n}.`, t: [`x/${m}`, '=', `${n}`, `${m}x`, `${m}/x`], eq: `x/${m} = ${n}`, ans: n * m, h: '"Divided by" → x/' + m + '.' },
      { s: `${m} times a number, minus ${a}, is ${m * n - a}.`, t: [`${m}x`, '−', `${a}`, '=', `${m * n - a}`, '+', `${a}x`], eq: `${m}x − ${a} = ${m * n - a}`, ans: n, h: `"${m} times a number" is ${m}x, then subtract ${a}.` }
    ]);
    const nums = c.s.match(/\d+/g);
    return W('wp_translate', {
      prompt: 'Translate, then solve', story: `${c.s} What is the number?`, need: [...new Set(nums)],
      letMeaning: 'the mystery number', letWrong: ['the number on the right side', 'how many steps it takes'],
      tiles: c.t, mustUse: [...new Set(nums)], eq: c.eq, answer: c.ans,
      unitWord: 'is the mystery number', meaningWrong: ['is how many steps it takes', 'is the number on the right side'], buildHint: c.h
    });
  };

  /* ===================== WORLDS ===================== */
  MQ.WORLDS = [
    { id: 'balance', icon: '⚖️', title: 'Balance Basics', color: '#2ea7a0', bg: '#dcf5f1', blurb: 'What = really means, and why every move happens to BOTH sides.',
      levels: [['bal_game', 'bal_add', 'bal_add'], ['bal_game', 'bal_add', 'bal_mult'], ['bal_mult', 'bal_two', 'eq_add'], ['bal_two', 'eq_mult', 'eq_sub', 'glitch']] },
    { id: 'moving', icon: '↔️', title: 'Across the = Sign', color: '#2f9e57', bg: '#e3f6e8', blurb: 'Drag terms across the = and see why + flips to − and × flips to ÷.',
      levels: [['eq_add', 'eq_sub', 'eq_add'], ['eq_mult', 'eq_div', 'eq_right', 'eq_sub'], ['eq_two', 'eq_right', 'glitch', 'eq_div'], ['eq_two_sub', 'glitch', 'eq_both', 'eq_div_two']] },
    { id: 'algebra', icon: '🧩', title: 'Solving Equations', color: '#5c4ee5', bg: '#ece9ff', blurb: 'Two-step equations, x on both sides, parentheses and negatives.',
      levels: [['eq_two', 'eq_two_sub'], ['eq_two', 'eq_div_two', 'eq_two_sub'], ['eq_both', 'eq_paren', 'eq_two_sub'], ['eq_neg', 'eq_both_paren', 'eq_both', 'eq_paren']] },
    { id: 'units', icon: '📏', title: 'Unit Conversions', color: '#4588d7', bg: '#e7f1fd', blurb: 'Predict bigger or smaller, then let the units tell you × or ÷.',
      levels: [['cv_ft_in', 'cv_hr_min'], ['cv_basic', 'cv_ft_in', 'cv_down'], ['cv_metric', 'cv_basic', 'cv_down'], ['cv_chain', 'cv_rate', 'cv_metric']] },
    { id: 'percents', icon: '%', title: 'Percents', color: '#d95e93', bg: '#fce5ef', blurb: 'Rate or 1 − rate? Multiply or divide? The percent bar shows you.',
      levels: [['pct_sale', 'pct_save'], ['pct_sale', 'pct_tip', 'pct_taxonly', 'pct_save'], ['pct_whole', 'pct_reverse', 'pct_tax', 'pct_sale'], ['pct_reverse', 'pct_reverse_up', 'pct_whole', 'pct_tip']] },
    { id: 'words', icon: '💬', title: 'Word Problems', color: '#d39b20', bg: '#fff4cf', blurb: 'Find the numbers, name the unknown, build the equation, solve.',
      levels: [['wp_club', 'wp_translate'], ['wp_phone', 'wp_translate', 'wp_tickets'], ['wp_spend', 'wp_distract', 'wp_tickets'], ['wp_gyms', 'wp_distract', 'wp_spend']] }
  ];
  MQ.LEVELS = [
    { name: 'Learn', icon: '👀', blurb: 'Your guide shows every step' },
    { name: 'Practice', icon: '🧭', blurb: 'You lead, with hints' },
    { name: 'Solo', icon: '🚀', blurb: 'You do the arithmetic too' },
    { name: 'Boss', icon: '👑', blurb: 'Harder mix, no help' }
  ];
  MQ.KIND_NAMES = {
    bal_game: 'what keeps the scale balanced', bal_add: 'removing blocks from both sides', bal_mult: 'splitting into equal groups', bal_two: 'two-step balance',
    eq_add: 'undoing + (subtract both sides)', eq_sub: 'undoing − (add both sides)', eq_mult: '× crosses as ÷', eq_div: '÷ crosses as ×', eq_right: 'x on the right side',
    eq_two: 'two-step equations', eq_two_sub: 'two-step with −', eq_div_two: 'x/d + b equations', eq_both: 'x on both sides', eq_paren: 'parentheses', eq_neg: 'negatives', eq_both_paren: 'parentheses + x both sides',
    glitch: 'spotting illegal moves', pct_sale: 'sale price (1 − rate)', pct_save: 'amount saved (rate)', pct_tip: 'total with tip (1 + rate)', pct_tax: 'total with tax (1 + rate)', pct_taxonly: 'tax amount (rate)',
    pct_whole: 'finding the whole (÷)', pct_reverse: 'original price before discount (÷)', pct_reverse_up: 'price before an increase (÷)',
    cv_ft_in: 'feet ↔ inches', cv_hr_min: 'hours ↔ minutes', cv_basic: 'customary units', cv_metric: 'metric units', cv_down: 'small → big units (÷)', cv_chain: 'two-step conversions', cv_rate: 'rate conversions',
    wp_club: 'start + rate × x stories', wp_phone: 'fee + per-unit stories', wp_spend: 'spending (subtraction) stories', wp_tickets: '"each" means multiply', wp_distract: 'ignoring extra numbers', wp_gyms: 'two plans cost the same', wp_translate: 'translating words to algebra'
  };
  // Mistake categories → readable labels for the parent view.
  MQ.MISS_NAMES = { pick: 'choosing what to undo first', op: 'choosing the opposite operation', number: 'arithmetic', drag: 'reading the percent bar', part: 'which part the question asks for', decimal: 'percent → decimal', muldiv: 'multiply vs divide', reverse: 'working backward (÷)', predict: 'bigger vs smaller unit', frac: 'setting up the unit fraction', extra: 'ignoring extra numbers', question: 'finding the question', let: 'naming the unknown', build: 'writing the equation', meaning: 'what the answer means', legal: 'legal moves', choice: 'spotting mistakes' };

  MQ.makeProblem = kind => { const g = G[kind]; if (!g) throw new Error('Unknown problem kind ' + kind); return { ...g(), kind }; };
  MQ.GENERATORS = G;

  // Build a round of 5, following "I do → we do → you do" and spaced review:
  //  Learn:     1 worked example (Ollie solves, she steps through) + 4 of her own (first one the same kind)
  //  Practice:  first problem is "faded" — Ollie does the first move, she finishes — then practice
  //  Solo/Boss: practice, with one spaced-review problem from an earlier level or another world
  // Kinds she has missed are picked more often.
  MQ.buildRound = (worldId, lvl, n = 5) => {
    const w = MQ.WORLDS.find(x => x.id === worldId);
    const pool = w.levels[lvl], misses = MQ.store.world(worldId).misses;
    const pickKind = i => {
      const weak = pool.filter(k => (misses[k] || 0) > 0);
      return weak.length && Math.random() < .4 ? pick(weak) : i < pool.length ? pool[i] : pick(pool);
    };
    let items = Array.from({ length: n }, (_, i) => ({ worldId, kind: pickKind(i) }));
    items = lvl === 0 ? items : MQ.shuffle(items);
    if (lvl === 0) {
      // Worked example first, then the same kind for "your turn".
      items[0] = { worldId, kind: pool[0], demo: true };
      items[1] = { worldId, kind: pool[0] };
    }
    if (lvl === 1 && MQ.GENERATORS[items[0].kind] && /^(eq_|bal_add|bal_mult|bal_two)/.test(items[0].kind)) items[0].faded = true;
    if (lvl >= 1) {
      // Spaced review: an earlier level of this world, or a level she cleared in another world.
      const options = [];
      for (let j = 0; j < lvl; j++) options.push({ worldId, kind: pick(w.levels[j]) });
      for (const o of MQ.WORLDS) if (o.id !== worldId) MQ.store.world(o.id).levels.forEach((L, j) => { if (L.cleared) options.push({ worldId: o.id, kind: pick(o.levels[j]) }); });
      if (options.length) items[n - 1] = { ...pick(options), review: true };
    }
    return items;
  };
})();
