(() => {
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[rand(0, a.length - 1)];
  const fmt = n => Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
  // Builds a multiple-choice step. Duplicate options (e.g. 0.5 vs 1 - 0.5) are dropped so
  // there is never more than one button with the right text.
  const choice = (q, options, correct, why) => {
    const right = options[correct], seen = new Set(), out = [];
    for (const o of options) if (!seen.has(o)) { seen.add(o); out.push(o); }
    return { q, options: out, correct: out.indexOf(right), why };
  };

  const G = {};

  G.eq_add = () => {
    const x = rand(3, 15), a = rand(3, 12), rhs = x + a;
    return {
      prompt: `Solve: x + ${a} = ${rhs}`,
      steps: [choice('What should you do first?', [
        `Subtract ${a} from both sides`,
        `Subtract ${a} only from the left`,
        `Add ${a} to both sides`,
        `Change +${a} to -${a} without changing the right side`
      ], 0, 'Subtracting the same amount from both sides preserves equality.')],
      answer: x,
      hint: `Undo +${a} with -${a} on both sides.`
    };
  };

  G.eq_mult = () => {
    const x = rand(2, 10), a = rand(2, 9), rhs = x * a;
    return {
      prompt: `Solve: ${a}x = ${rhs}`,
      steps: [choice('How do you isolate x?', [
        `Divide both sides by ${a}`,
        `Subtract ${a} from both sides`,
        `Divide only the left side by ${a}`,
        `Add ${a} to both sides`
      ], 0, 'Division undoes multiplication, and it must be applied to both sides.')],
      answer: x,
      hint: `What operation undoes x ${a}?`
    };
  };

  G.eq_twostep = G.alg_twostep = () => {
    const x = rand(2, 12), m = rand(2, 7), a = rand(2, 10), rhs = m * x + a;
    return {
      prompt: `Solve: ${m}x + ${a} = ${rhs}`,
      steps: [
        choice('What should you undo first?', [
          `Add ${a}`,
          `Subtract ${a} from both sides`,
          `Divide only the left side by ${m}`,
          `Subtract ${m}`
        ], 1, `Remove +${a} by subtracting ${a} from both sides.`),
        choice(`After that you have ${m}x = ${rhs - a}. What next?`, [
          `Multiply both sides by ${m}`,
          `Divide both sides by ${m}`,
          `Subtract ${m} from both sides`,
          'Guess and check'
        ], 1, 'Division undoes multiplication.')
      ],
      answer: x,
      hint: 'Remove the added amount, then undo the multiplication.'
    };
  };

  G.eq_bothsides = () => {
    const x = rand(2, 9), m1 = rand(3, 7), m2 = rand(1, m1 - 1), b = rand(2, 10);
    const c = (m1 - m2) * x + b;
    return {
      prompt: `Solve: ${m1}x + ${b} = ${m2}x + ${c}`,
      steps: [
        choice('Which is a valid first step?', [
          `Subtract ${m2}x from both sides`,
          `Subtract ${m2}x only from the right`,
          `Move ${m2}x to the left but keep it +${m2}x`,
          `Divide only the left side by ${m1}`
        ], 0, 'Subtracting the same x-term from both sides keeps the equation equivalent.'),
        choice(`After subtracting ${m2}x, which idea comes next?`, [
          'Keep using inverse operations on both sides',
          'Move numbers across without flipping their signs',
          'Try random values',
          'Only change the side with x'
        ], 0, 'Every step should preserve equality.')
      ],
      answer: x,
      hint: 'Remove an x-term from both sides, then solve the remaining equation.'
    };
  };

  G.eq_distribute = G.alg_distribute = () => {
    const x = rand(2, 8), a = rand(2, 5), b = rand(1, 5), rhs = a * (x + b);
    return {
      prompt: `Solve: ${a}(x + ${b}) = ${rhs}`,
      steps: [
        choice('Which first step is valid?', [
          `Divide both sides by ${a}`,
          `Subtract ${a} only from the left`,
          `Subtract ${a} from both sides`,
          `Add ${b} to both sides`
        ], 0, 'Dividing both sides by the outside factor is a clean way to preserve equality.'),
        choice(`After dividing by ${a}, you get x + ${b} = ${rhs / a}. What next?`, [
          `Subtract ${b} from both sides`,
          `Divide both sides by ${b}`,
          `Add ${b} to both sides`,
          'Stop'
        ], 0, 'Undo the addition with subtraction on both sides.')
      ],
      answer: x,
      hint: 'Undo the outside multiplication first.'
    };
  };

  G.alg_onestep_add = () => {
    const subtract = Math.random() < 0.5, x = rand(3, 20), a = rand(2, 12);
    const rhs = subtract ? x - a : x + a;
    return {
      prompt: `Solve: x ${subtract ? '-' : '+'} ${a} = ${rhs}`,
      steps: [choice('Which inverse operation isolates x?', [
        subtract ? `Add ${a} to both sides` : `Subtract ${a} from both sides`,
        subtract ? `Subtract ${a} from both sides` : `Add ${a} to both sides`,
        `Multiply both sides by ${a}`,
        `Divide both sides by ${a}`
      ], 0, 'Use the inverse operation on both sides.')],
      answer: x,
      hint: 'Use the inverse operation.'
    };
  };

  G.alg_onestep_mult = () => {
    const x = rand(2, 12), m = rand(2, 9);
    return {
      prompt: `Solve: ${m}x = ${m * x}`,
      steps: [choice('What undoes multiplication?', [
        `Divide both sides by ${m}`, `Subtract ${m}`, `Multiply by ${m}`, `Add ${m}`
      ], 0, 'Division is the inverse of multiplication.')],
      answer: x,
      hint: `Divide both sides by ${m}.`
    };
  };

  G.alg_fraction = () => {
    const d = rand(2, 6), x = d * rand(2, 9), a = rand(1, 6), rhs = x / d + a;
    return {
      prompt: `Solve: x/${d} + ${a} = ${rhs}`,
      steps: [
        choice('First step?', [`Subtract ${a} from both sides`, `Multiply only the left side by ${d}`, `Divide both sides by ${a}`, `Add ${a}`], 0, 'Remove the added amount first.'),
        choice(`Then x/${d} = ${rhs - a}. What next?`, [`Multiply both sides by ${d}`, `Divide both sides by ${d}`, `Subtract ${d}`, 'Stop'], 0, 'Multiplication undoes division.')
      ],
      answer: x,
      hint: 'Undo addition first, then undo division.'
    };
  };

  G.conv_ft_in = () => {
    if (Math.random() < 0.5) {
      const ft = rand(2, 9);
      return {
        prompt: `Convert ${ft} feet to inches.`,
        steps: [
          choice('Will the numerical answer get larger or smaller?', ['Larger', 'Smaller'], 0, 'Inches are smaller units, so it takes more of them.'),
          choice('Which operation?', ['Multiply by 12', 'Divide by 12'], 0, 'There are 12 inches in each foot.')
        ],
        answer: ft * 12, unit: 'in', conv: {v: ft, from: 'ft', to: 'in', k: 12, big: true}, hint: 'Big unit to smaller unit: the number gets bigger.'
      };
    }
    const ft = rand(2, 9), inches = ft * 12;
    return {
      prompt: `Convert ${inches} inches to feet.`,
      steps: [
        choice('Will the numerical answer get larger or smaller?', ['Larger', 'Smaller'], 1, 'Feet are larger units, so fewer are needed.'),
        choice('Which operation?', ['Multiply by 12', 'Divide by 12'], 1, 'Group the inches into sets of 12.')
      ],
      answer: ft, unit: 'ft', conv: {v: inches, from: 'in', to: 'ft', k: 12, big: false}, hint: 'Small unit to bigger unit: divide.'
    };
  };

  G.conv_hr_min = () => {
    if (Math.random() < 0.5) {
      const h = pick([1.5, 2, 2.5, 3, 3.5]);
      return {
        prompt: `Convert ${h} hours to minutes.`,
        steps: [
          choice('Minutes are smaller units. What should happen to the number?', ['It should get larger', 'It should get smaller'], 0, 'Smaller units require a larger count.'),
          choice('What operation uses 60 min = 1 hr?', ['Multiply by 60', 'Divide by 60'], 0, 'Each hour contains 60 minutes.')
        ],
        answer: h * 60, unit: 'min', conv: {v: h, from: 'hr', to: 'min', k: 60, big: true}, hint: 'Hours to minutes: multiply by 60.'
      };
    }
    const mins = pick([90, 120, 150, 180, 210]);
    return {
      prompt: `Convert ${mins} minutes to hours.`,
      steps: [
        choice('Hours are larger units. What should happen to the number?', ['Larger', 'Smaller'], 1, 'Larger units require a smaller count.'),
        choice('Which operation?', ['Multiply by 60', 'Divide by 60'], 1, 'Divide minutes into groups of 60.')
      ],
      answer: mins / 60, unit: 'hr', conv: {v: mins, from: 'min', to: 'hr', k: 60, big: false}, hint: 'Minutes to hours: divide by 60.'
    };
  };

  G.conv_lb_oz = () => {
    const lb = rand(2, 8);
    return {
      prompt: `Convert ${lb} pounds to ounces.`,
      steps: [
        choice('Ounces are smaller than pounds. Multiply or divide?', ['Multiply', 'Divide'], 0, 'The numerical count gets larger.'),
        choice('Use 1 lb = 16 oz. Which setup?', [`${lb} x 16`, `${lb} / 16`], 0, 'Multiply by the number of ounces in each pound.')
      ],
      answer: lb * 16, unit: 'oz', conv: {v: lb, from: 'lb', to: 'oz', k: 16, big: true}, hint: '1 lb = 16 oz.'
    };
  };

  G.conv_metric = () => {
    if (Math.random() < 0.5) {
      const m = pick([1.2, 1.5, 2.4, 3.2, 4.5]);
      return {
        prompt: `Convert ${m} meters to centimeters.`,
        steps: [
          choice('Centimeters are smaller units. What should the number do?', ['Get larger', 'Get smaller'], 0, 'There are many centimeters in one meter.'),
          choice('Which operation?', ['x 100', '/ 100'], 0, '1 meter = 100 centimeters.')
        ],
        answer: m * 100, unit: 'cm', conv: {v: m, from: 'm', to: 'cm', k: 100, big: true}, hint: 'Meters to centimeters: x100.'
      };
    }
    const cm = pick([150, 240, 320, 450, 750]);
    return {
      prompt: `Convert ${cm} centimeters to meters.`,
      steps: [
        choice('Meters are larger units. What should the number do?', ['Get larger', 'Get smaller'], 1, 'A larger unit needs a smaller numerical count.'),
        choice('Which operation?', ['x 100', '/ 100'], 1, 'Group centimeters into hundreds.')
      ],
      answer: cm / 100, unit: 'm', conv: {v: cm, from: 'cm', to: 'm', k: 100, big: false}, hint: 'Centimeters to meters: divide by 100.'
    };
  };

  G.conv_yd_in = () => {
    const yd = pick([1.5, 2, 2.5, 3]);
    return {
      prompt: `Convert ${yd} yards to inches.`,
      steps: [
        choice('What is a useful chain?', ['yards -> feet -> inches', 'yards -> ounces -> inches', 'yards -> hours -> inches'], 0, 'Use connected length units.'),
        choice('Which calculation works?', [`${yd} x 3 x 12`, `${yd} / 3 / 12`, `${yd} x 12 / 3`], 0, '1 yd = 3 ft and 1 ft = 12 in.')
      ],
      answer: yd * 36, unit: 'in', conv: {v: yd, from: 'yd', to: 'in', k: 36, big: true, chain: '1 yd = 3 ft, 1 ft = 12 in'}, hint: '1 yd = 3 ft, then 1 ft = 12 in.'
    };
  };

  G.conv_minutes_clock = () => {
    const mins = pick([90, 135, 150, 165]);
    const h = Math.floor(mins / 60), r = mins % 60;
    return {
      prompt: `Convert ${mins} minutes to hours and minutes.`,
      steps: [choice('How many complete groups of 60 fit?', [String(h), String(h + 1), String(Math.max(0, h - 1))], 0, 'Complete groups of 60 are whole hours.')],
      answerText: `${h} h ${r} min`, answerMinutes: mins, conv: {v: mins, from: 'min', to: 'hr', k: 60, big: false},
      answerAlt: [`${h}:${String(r).padStart(2, '0')}`, `${h} h ${r} min`, `${h}hr ${r}min`, `${h} hr ${r} min`],
      hint: 'Divide by 60; the remainder is minutes.'
    };
  };

  G.pct_of = () => {
    const rate = pick([10, 20, 25, 30, 40, 50]), whole = pick([40, 50, 60, 80, 100, 120]);
    return {
      prompt: `Find ${rate}% of ${whole}.`,
      steps: [
        choice('What relationship is this?', ['percent amount = rate x whole', 'whole = part / rate', 'final = whole x (1 - rate)'], 0, 'The question asks for a percent amount of a known whole.'),
        choice('Which decimal represents the rate?', [String(rate / 100), rate === 50 ? String(rate / 10) : String(1 - rate / 100), String(rate)], 0, 'Divide the percent by 100.')
      ],
      answer: whole * rate / 100, pct: {mode: 'of', rate, whole},
      hint: `${rate / 100} x ${whole}`
    };
  };

  G.pct_discount_choice = () => {
    const price = pick([40, 60, 80, 100]), rate = pick([10, 20, 25, 30]);
    return {
      prompt: `A $${price} item is ${rate}% off. Find the final sale price.`,
      steps: [
        choice('What does the question want?', ['The discount amount', 'The final price', 'The original price'], 1, 'It asks what you pay after the discount.'),
        choice('Which multiplier gives the final price directly?', [String(rate / 100), String(1 - rate / 100), String(1 + rate / 100)], 1, `After a ${rate}% discount, ${100 - rate}% remains.`)
      ],
      answer: price * (1 - rate / 100), unit: '$', pct: {mode: 'decrease', rate, whole: price}, hint: `Use 1 - ${rate / 100}.`
    };
  };

  G.pct_discount = () => {
    const price = pick([40, 60, 80, 100, 120]), rate = pick([10, 20, 25]);
    if (Math.random() < 0.65) {
      return {
        prompt: `A $${price} item is ${rate}% off. What is the sale price?`,
        steps: [choice('Do you use the rate or 1 - rate?', [`Use ${rate / 100}`, `Use ${1 - rate / 100}`], 1, 'The final price is the percent that remains.')],
        answer: price * (1 - rate / 100), unit: '$', pct: {mode: 'decrease', rate, whole: price}, hint: 'Final after discount = whole x (1 - rate).'
      };
    }
    return {
      prompt: `A $${price} item is ${rate}% off. What is the discount amount?`,
      steps: [choice('Do you use the rate or 1 - rate?', [`Use ${rate / 100}`, `Use ${1 - rate / 100}`], 0, 'The discount amount itself is rate x whole.')],
      answer: price * rate / 100, unit: '$', pct: {mode: 'of', rate, whole: price}, hint: 'Discount amount = rate x original.'
    };
  };

  G.pct_tip = () => {
    const bill = pick([30, 40, 50, 60, 80]), rate = pick([15, 20, 25]);
    return {
      prompt: `A $${bill} bill gets a ${rate}% tip. What is the total after tip?`,
      steps: [choice('Which multiplier gives the total directly?', [String(rate / 100), String(1 + rate / 100), String(1 - rate / 100)], 1, 'The total is 100% plus the tip percent.')],
      answer: bill * (1 + rate / 100), unit: '$', pct: {mode: 'increase', rate, whole: bill}, hint: 'Final after increase = whole x (1 + rate).'
    };
  };

  G.pct_whole = () => {
    const rate = pick([20, 25, 30, 40, 50]), whole = pick([40, 60, 80, 100, 120]), part = whole * rate / 100;
    return {
      prompt: `${fmt(part)} is ${rate}% of what number?`,
      steps: [choice('You know the part and the rate. Multiply or divide by the decimal rate?', ['Multiply', 'Divide'], 1, 'whole = part / rate.')],
      answer: whole, pct: {mode: 'whole', rate, part},
      hint: `${part} / ${rate / 100}`
    };
  };

  G.pct_increase = () => {
    const whole = pick([40, 50, 80, 100, 120]), rate = pick([10, 20, 25]);
    return {
      prompt: `A value of ${whole} increases by ${rate}%. What is the new value?`,
      steps: [choice('Which multiplier gives the new value?', [String(rate / 100), String(1 + rate / 100), String(1 - rate / 100)], 1, 'Keep the original 100% and add the increase.')],
      answer: whole * (1 + rate / 100), pct: {mode: 'increase', rate, whole},
      hint: 'Use 1 + rate.'
    };
  };

  G.pct_reverse_discount = () => {
    const original = pick([40, 60, 80, 100, 120]), rate = pick([20, 25, 50]), final = original * (1 - rate / 100);
    return {
      prompt: `After a ${rate}% discount, an item costs $${fmt(final)}. What was the original price?`,
      steps: [
        choice('The final price is what percent of the original?', [`${rate}%`, `${100 - rate}%`, `${100 + rate}%`], 1, 'Subtract the discount from 100%.'),
        choice('To find the original whole from the final part, what do you do?', [`Multiply by ${1 - rate / 100}`, `Divide by ${1 - rate / 100}`], 1, 'part / remaining rate = original whole.')
      ],
      answer: original, unit: '$', pct: {mode: 'reverse', rate, part: final}, hint: `Final = original x ${1 - rate / 100}; work backward with division.`
    };
  };

  G.pct_change = () => {
    const start = pick([40, 60, 80, 100]), rate = pick([20, 25, 50]), end = start * (1 + rate / 100);
    return {
      prompt: `A price rises from $${start} to $${fmt(end)}. What is the percent increase?`,
      steps: [
        choice('What is the amount of increase?', [`$${fmt(end - start)}`, `$${start}`, `$${end}`], 0, 'New - original = change.'),
        choice('Percent change compares the change to which number?', ['The original value', 'The new value', '100'], 0, 'Percent change = change / original.')
      ],
      answer: rate, unit: '%', pct: {mode: 'change', rate, whole: start, part: end}, hint: '(change / original) x 100.'
    };
  };

  G.word_linear = () => {
    const start = pick([10, 12, 15, 18]), each = pick([4, 5, 6, 8]), n = rand(4, 9), goal = start + each * n;
    return {
      prompt: `A school club already has $${start} and earns $${each} for each item sold. It wants $${goal}. How many items must it sell?`,
      steps: [
        choice('What is the unknown?', ['Number of items sold', 'Starting money', 'Money per item'], 0, 'The question asks how many items.'),
        choice('Which equation matches the story?', [`${start} + ${each}x = ${goal}`, `${start}x + ${each} = ${goal}`, `${goal} + ${each}x = ${start}`], 0, 'Start amount + earnings per item x items = goal.')
      ],
      answer: n, unit: 'items', hint: `${start} + ${each}x = ${goal}`
    };
  };

  G.word_time = () => {
    const total = pick([75, 90, 95, 120]), used = pick([25, 30, 40, 45]);
    return {
      prompt: `You have ${total} minutes before you need to leave. A task takes ${used} minutes. How many minutes remain?`,
      steps: [choice('Which relationship matches “remaining”?', ['total - used', 'total + used', 'used / total'], 0, 'Remaining means what is left after using some time.')],
      answer: total - used, unit: 'min', hint: 'Total time - used time.'
    };
  };

  G.word_discount = () => {
    const price = pick([40, 48, 60, 80]), rate = pick([20, 25, 50]);
    return {
      prompt: `A $${price} sweatshirt is ${rate}% off. What is the sale price?`,
      steps: [
        choice('What type of percent quantity is requested?', ['Discount amount', 'Final amount after discount', 'Original whole'], 1, 'Sale price means the final amount.'),
        choice('Which multiplier should you use?', [String(rate / 100), String(1 - rate / 100)], 1, 'Use the percent that remains.')
      ],
      answer: price * (1 - rate / 100), unit: '$', hint: 'Use 1 - rate.'
    };
  };

  G.word_conversion = () => {
    const hours = pick([1.5, 2, 2.5]);
    return {
      prompt: `Practice lasts ${hours} hours. How many minutes is that?`,
      steps: [choice('Minutes are smaller units. Multiply or divide by 60?', ['Multiply', 'Divide'], 0, 'Each hour contains 60 minutes.')],
      answer: hours * 60, unit: 'min', hint: 'hours x 60.'
    };
  };

  G.word_percentwhole = () => {
    const whole = pick([40, 60, 80, 100]), rate = pick([20, 25, 30, 50]), part = whole * rate / 100;
    return {
      prompt: `You saved $${part}, which is ${rate}% of the full price. What is the full price?`,
      steps: [
        choice('What do you know?', ['part and rate', 'whole and rate', 'change and new value'], 0, 'The savings are a part of the unknown whole.'),
        choice('How do you recover the whole?', [`$${part} x ${rate / 100}`, `$${part} / ${rate / 100}`], 1, 'whole = part / rate.')
      ],
      answer: whole, unit: '$', hint: 'part / decimal rate.'
    };
  };

  G.word_split = () => {
    const each = pick([8, 10, 12, 14]), people = 3, total = each * people, snack = pick([2, 3, 4]);
    return {
      prompt: `You and two friends split a $${total} total equally. Then each person buys a $${snack} snack. How much does each person spend?`,
      steps: [choice('What should happen first?', [`Divide ${total} by 3`, `Multiply ${total} by 3`, `Add ${snack} to ${total} before splitting`], 0, 'First split the shared total equally.')],
      answer: each + snack, unit: '$', hint: 'Split first, then add each person’s snack.'
    };
  };

  G.word_battery = () => {
    const start = pick([60, 80, 100]), use = pick([20, 25, 50]);
    const used = start * use / 100;
    return {
      prompt: `A phone battery is at ${start}%. It uses ${use}% of its current charge. What percent battery remains?`,
      steps: [
        choice(`What is ${use}% of the current ${start}% charge?`, [`${used}%`, `${use}%`, `${start - use}%`], 0, 'The percent is taken of the current charge, not of a full 100% battery.'),
        choice('Then what do you do?', ['Subtract that used amount from the current charge', 'Subtract the rate directly no matter what', 'Add the used amount'], 0, 'Remaining = current charge - amount used.')
      ],
      answer: start - used, unit: '%', hint: `First find ${use}% of ${start}, then subtract it from ${start}.`
    };
  };

  G.word_goal = () => {
    const goal = pick([200, 240, 300, 400]), rate = pick([25, 50, 60, 65, 75]);
    return {
      prompt: `A fundraiser goal is $${goal}. The group has reached ${rate}% of the goal. How much has it raised?`,
      steps: [choice('What kind of percent problem is this?', ['Find a percent amount of a known whole', 'Find the whole from a part', 'Find a final price after discount'], 0, 'The goal is the whole; we want a percent of it.')],
      answer: goal * rate / 100, unit: '$', hint: `${rate / 100} x ${goal}`
    };
  };

  G.word_linear_decimal = () => {
    const fee = pick([3, 5, 6]), per = pick([0.25, 0.4, 0.5]), n = pick([20, 24, 30, 40]), total = fee + per * n;
    return {
      prompt: `A photo shop charges $${fee} plus $${per.toFixed(2)} per print. Your total is $${fmt(total)}. How many prints did you order?`,
      steps: [choice('Which equation matches?', [`${fee} + ${per}p = ${fmt(total)}`, `${fee}p + ${per} = ${fmt(total)}`, `${fmt(total)} + ${per}p = ${fee}`], 0, 'Fixed fee + per-print cost x number of prints = total.')],
      answer: n, unit: 'prints', hint: `${fee} + ${per}p = ${fmt(total)}`
    };
  };

  /* ------------------------------------------------------------------
     ACROSS THE = SIGN
     "Moving" a term is a shortcut for doing the inverse operation to
     BOTH sides. Each problem carries a `moves` list the app animates.
     ------------------------------------------------------------------ */
  const moveAdd = (x, a, b, sub) => ({
    left: ['x', `${sub ? '−' : '+'} ${a}`], right: [String(b)], mover: 1, from: 'left',
    landAs: `${sub ? '+' : '−'} ${a}`,
    both: `x ${sub ? '−' : '+'} ${a} ${sub ? '+' : '−'} ${a} = ${b} ${sub ? '+' : '−'} ${a}`,
    result: `x = ${b} ${sub ? '+' : '−'} ${a}`, final: `x = ${x}`
  });
  const moveMult = (x, m, b) => ({
    left: [String(m), 'x'], right: [String(b)], mover: 0, from: 'left', landAs: `÷ ${m}`, tight: true,
    both: `${m}x ÷ ${m} = ${b} ÷ ${m}`, result: `x = ${b} ÷ ${m}`, final: `x = ${x}`
  });

  G.move_add = () => {
    const sub = Math.random() < 0.45, x = rand(4, 18), a = rand(2, 12), b = sub ? x - a : x + a;
    if (b < 1) return G.move_add();
    return {
      prompt: `x ${sub ? '−' : '+'} ${a} = ${b}`, equation: `x ${sub ? '-' : '+'} ${a} = ${b}`,
      steps: [
        choice(`If you "move" the ${sub ? '−' : '+'}${a} to the other side, what does the right side become?`, [
          `${b} ${sub ? '+' : '−'} ${a}`, `${b} ${sub ? '−' : '+'} ${a}`, `${b} × ${a}`, `${b} ÷ ${a}`
        ], 0, `Moving ${sub ? '−' : '+'}${a} really means ${sub ? 'adding' : 'subtracting'} ${a} on BOTH sides. On the left it cancels to zero; on the right it shows up as ${sub ? '+' : '−'}${a}.`)
      ],
      answer: x, moves: [moveAdd(x, a, b, sub)],
      hint: `${sub ? 'Subtracting' : 'Adding'} ${a} is undone by ${sub ? 'adding' : 'subtracting'} ${a} — on both sides.`
    };
  };

  G.move_mult = () => {
    const x = rand(2, 12), m = rand(2, 9), b = m * x;
    return {
      prompt: `${m}x = ${b}`, equation: `${m}x = ${b}`,
      steps: [
        choice(`The ${m} is MULTIPLYING x. When it crosses the = sign, it becomes…`, [
          `÷ ${m}  →  x = ${b} ÷ ${m}`, `− ${m}  →  x = ${b} − ${m}`, `× ${m}  →  x = ${b} × ${m}`, `+ ${m}  →  x = ${b} + ${m}`
        ], 0, `Multiplying is undone by dividing, so ${m}x = ${b} becomes x = ${b} ÷ ${m}. Subtracting ${m} is the #1 trap — ${m}x means ${m} TIMES x, not ${m} PLUS x.`)
      ],
      answer: x, moves: [moveMult(x, m, b)],
      hint: `${m}x means ${m} × x. What undoes × ${m}?`
    };
  };

  G.move_div = () => {
    const d = rand(2, 8), b = rand(2, 12), x = d * b;
    return {
      prompt: `x ÷ ${d} = ${b}`, equation: `x / ${d} = ${b}`,
      steps: [
        choice(`x is being DIVIDED by ${d}. When the ÷ ${d} crosses the = sign, it becomes…`, [
          `× ${d}  →  x = ${b} × ${d}`, `÷ ${d}  →  x = ${b} ÷ ${d}`, `− ${d}  →  x = ${b} − ${d}`, `+ ${d}  →  x = ${b} + ${d}`
        ], 0, `Dividing is undone by multiplying: multiply BOTH sides by ${d}.`)
      ],
      answer: x,
      moves: [{ left: ['x', `÷ ${d}`], right: [String(b)], mover: 1, from: 'left', landAs: `× ${d}`,
        both: `x ÷ ${d} × ${d} = ${b} × ${d}`, result: `x = ${b} × ${d}`, final: `x = ${x}` }],
      hint: `Multiplication undoes division.`
    };
  };

  G.move_flipside = () => {
    const x = rand(3, 15), a = rand(2, 11), b = x + a;
    return {
      prompt: `${b} = x + ${a}`, equation: `${b} = x + ${a}`,
      steps: [
        choice(`Here x is on the RIGHT. If you move the +${a} to the left side, what do you get?`, [
          `${b} − ${a} = x`, `${b} + ${a} = x`, `${a} − ${b} = x`, `${b} = x`
        ], 0, `Subtract ${a} from both sides: ${b} − ${a} = x + ${a} − ${a}. x can live on either side — ${b - a} = x means the same as x = ${b - a}.`)
      ],
      answer: x,
      moves: [{ left: [String(b)], right: ['x', `+ ${a}`], mover: 1, from: 'right', landAs: `− ${a}`,
        both: `${b} − ${a} = x + ${a} − ${a}`, result: `${b} − ${a} = x`, final: `x = ${x}` }],
      hint: `It works the same in either direction: undo +${a} on both sides.`
    };
  };

  G.move_twostep = () => {
    const x = rand(2, 10), m = rand(2, 6), a = rand(2, 12), b = m * x + a;
    return {
      prompt: `${m}x + ${a} = ${b}`, equation: `${m}x + ${a} = ${b}`,
      steps: [
        choice('Which term should cross the = sign FIRST?', [
          `The + ${a} (it becomes − ${a})`, `The ${m} (it becomes ÷ ${m})`, `The ${b} (it becomes − ${b})`, `The x`
        ], 0, `Unwrap from the outside in. x was multiplied by ${m} first, THEN ${a} was added — so the +${a} comes off first. (Dividing first would mean dividing EVERY term by ${m}.)`),
        choice(`Now you have ${m}x = ${b - a}. When the ${m} crosses, it becomes…`, [
          `÷ ${m}`, `− ${m}`, `× ${m}`, `+ ${m}`
        ], 0, `${m}x means ${m} times x. Undo multiplication with division.`)
      ],
      answer: x,
      moves: [
        { left: [`${m}x`, `+ ${a}`], right: [String(b)], mover: 1, from: 'left', landAs: `− ${a}`,
          both: `${m}x + ${a} − ${a} = ${b} − ${a}`, result: `${m}x = ${b - a}`, final: `${m}x = ${b - a}` },
        moveMult(x, m, b - a)
      ],
      hint: 'Last thing done to x comes off first: undo the +, then the ×.'
    };
  };

  G.move_bothsides = () => {
    const x = rand(2, 9), m1 = rand(4, 8), m2 = rand(1, m1 - 2), b = rand(2, 9), c = (m1 - m2) * x + b;
    const m2s = m2 === 1 ? '' : m2;
    return {
      prompt: `${m1}x + ${b} = ${m2s}x + ${c}`, equation: `${m1}x + ${b} = ${m2s}x + ${c}`,
      steps: [
        choice(`Move the ${m2s}x from the right to the left. Which equation is correct?`, [
          `${m1}x − ${m2s}x + ${b} = ${c}`, `${m1}x + ${m2s}x + ${b} = ${c}`, `${m1}x + ${b} = ${c} − ${m2s}x`, `${m1}x + ${b} − ${m2s}x = ${m2s}x + ${c}`
        ], 0, `Subtract ${m2s}x from both sides. It cancels on the right and shows up as −${m2s}x on the left.`),
        choice(`That simplifies to ${m1 - m2}x + ${b} = ${c}. What crosses next?`, [
          `+ ${b} (becomes − ${b})`, `${m1 - m2} (becomes ÷ ${m1 - m2})`, `${c} (becomes − ${c})`, 'Nothing — guess and check'
        ], 0, 'Clear the added number first, then undo the multiplication.')
      ],
      answer: x,
      moves: [
        { left: [`${m1}x`, `+ ${b}`], right: [`${m2s}x`, `+ ${c}`], mover: 0, from: 'right', landAs: `− ${m2s}x`,
          both: `${m1}x + ${b} − ${m2s}x = ${m2s}x − ${m2s}x + ${c}`, result: `${m1 - m2}x + ${b} = ${c}`, final: `${m1 - m2}x + ${b} = ${c}` },
        { left: [`${m1 - m2}x`, `+ ${b}`], right: [String(c)], mover: 1, from: 'left', landAs: `− ${b}`,
          both: `${m1 - m2}x + ${b} − ${b} = ${c} − ${b}`, result: `${m1 - m2}x = ${c - b}`, final: `x = ${x}` }
      ],
      hint: 'Get all the x-terms on one side first, then the numbers on the other.'
    };
  };

  G.move_wrong = () => {
    const x = rand(3, 9), m = rand(2, 6), a = rand(2, 9);
    const names = ['Maya', 'Leo', 'Priya', 'Sam', 'Jordan', 'Ava'];
    const who = pick(names);
    const cases = [
      () => ({ eq: `${m}x = ${m * x}`, bad: `x = ${m * x} − ${m}`,
        options: [`The ${m} was multiplying, so it should become ÷ ${m}`, `The ${m} should become + ${m}`, `Nothing is wrong`, `The ${m * x} should become negative`],
        why: `${m}x means ${m} TIMES x. The opposite of × is ÷, so x = ${m * x} ÷ ${m} = ${x}.`, answer: x, moves: [moveMult(x, m, m * x)] }),
      () => ({ eq: `x + ${a} = ${x + a}`, bad: `x = ${x + a} + ${a}`,
        options: [`The + ${a} should flip to − ${a} when it crosses`, `The ${a} should become ÷ ${a}`, `Nothing is wrong`, `The ${x + a} should be divided by ${a}`],
        why: `Crossing the = sign flips the operation: + becomes −. Really it's "subtract ${a} from both sides."`, answer: x, moves: [moveAdd(x, a, x + a, false)] }),
      () => ({ eq: `${m}x + ${a} = ${m * x + a}`, bad: `x + ${a} = ${m * x + a} ÷ ${m}`,
        options: [`Dividing by ${m} must divide EVERY term, including the + ${a}`, `The ${m} should become − ${m}`, `Nothing is wrong`, `The + ${a} should become × ${a}`],
        why: `If you divide one side by ${m}, the WHOLE side gets divided: (${m}x + ${a}) ÷ ${m}. Easier: move the + ${a} first.`, answer: x,
        moves: [{ left: [`${m}x`, `+ ${a}`], right: [String(m * x + a)], mover: 1, from: 'left', landAs: `− ${a}`,
          both: `${m}x + ${a} − ${a} = ${m * x + a} − ${a}`, result: `${m}x = ${m * x}`, final: `x = ${x}` }] })
    ];
    const c = pick(cases)();
    return {
      prompt: `Spot the glitch! ${who} solved ${c.eq} and wrote:  ${c.bad}`, equation: c.eq.replace(/−/g, '-'),
      steps: [choice('What went wrong?', c.options, 0, c.why)],
      answer: c.answer, moves: c.moves, mistake: true,
      hint: 'Fix the move, then solve the equation correctly.'
    };
  };

  /* ------------------------------------------------------------------
     PERCENTS: choose the ONE multiplier/divider that answers the question
     ------------------------------------------------------------------ */
  G.pct_left = () => {
    const rate = pick([10, 15, 20, 25, 30, 35, 40, 60]);
    const item = pick(['sneakers', 'a hoodie', 'a video game', 'headphones', 'a backpack']);
    return {
      prompt: `${item[0].toUpperCase() + item.slice(1)} ${item.startsWith('a ') ? 'is' : 'are'} ${rate}% off. What percent of the original price do you still pay?`,
      steps: [choice('The original price is the whole. What percent is the whole?', ['100%', `${rate}%`, '1%', '50%'], 0,
        `The original price is always 100%. The discount takes ${rate}% away, so 100% − ${rate}% = ${100 - rate}% is left. As a decimal: 1 − ${rate / 100} = ${fmt(1 - rate / 100)}.`)],
      answer: 100 - rate, unit: '%', pct: { mode: 'decrease', rate, whole: 100 },
      hint: `100% − ${rate}%`
    };
  };

  G.pct_multiplier = () => {
    const rate = pick([10, 20, 25, 30, 40]), r = rate / 100, P = pick([20, 40, 60, 80, 100, 120]);
    const R = fmt(r), L = fmt(1 - r), U = fmt(1 + r);
    const scen = pick([
      { p: `A $${P} jacket is ${rate}% off. How much do you PAY?`, ok: `× ${L}`, bad: [`× ${R}`, `× ${U}`, `÷ ${L}`], ans: P * (1 - r), why: `You pay what is LEFT after the discount: 100% − ${rate}% = ${100 - rate}%, so × ${L}.`, pct: { mode: 'decrease', rate, whole: P } },
      { p: `A $${P} jacket is ${rate}% off. How much do you SAVE?`, ok: `× ${R}`, bad: [`× ${L}`, `× ${U}`, `÷ ${R}`], ans: P * r, why: `The savings ARE the ${rate}% piece, so multiply the original by ${R}.`, pct: { mode: 'of', rate, whole: P } },
      { p: `A $${P} dinner gets a ${rate}% tip. What is the TOTAL?`, ok: `× ${U}`, bad: [`× ${R}`, `× ${L}`, `÷ ${U}`], ans: P * (1 + r), why: `The total is the original 100% PLUS ${rate}% more = ${100 + rate}%, so × ${U}.`, pct: { mode: 'increase', rate, whole: P } },
      { p: `Sales tax is ${rate}% on a $${P} bike. How much is just the TAX?`, ok: `× ${R}`, bad: [`× ${U}`, `× ${L}`, `÷ ${R}`], ans: P * r, why: `The tax by itself is the ${rate}% piece: × ${R}.`, pct: { mode: 'of', rate, whole: P } },
      { p: `After a ${rate}% discount you paid $${fmt(P * (1 - r))}. What was the ORIGINAL price?`, ok: `÷ ${L}`, bad: [`× ${L}`, `× ${U}`, `÷ ${R}`], ans: P, why: `$${fmt(P * (1 - r))} is the ${100 - rate}% that was left. You know a PART and want the WHOLE, so divide: ÷ ${L}.`, pct: { mode: 'reverse', rate, part: P * (1 - r) } },
      { p: `A price went UP ${rate}% and is now $${fmt(P * (1 + r))}. What was it BEFORE?`, ok: `÷ ${U}`, bad: [`× ${U}`, `× ${L}`, `÷ ${R}`], ans: P, why: `$${fmt(P * (1 + r))} is ${100 + rate}% of the original. Work backward to 100%: ÷ ${U}.`, pct: { mode: 'reverseUp', rate, part: P * (1 + r) } }
    ]);
    const start = scen.ok.startsWith('÷') ? fmt(scen.pct.part) : String(P);
    return {
      prompt: scen.p,
      steps: [
        choice('Do you know the ORIGINAL (the whole, 100%), or are you working BACKWARD to it?', [
          'I know the original → multiply', 'I know an after-amount and need the original → divide'
        ], scen.ok.startsWith('÷') ? 1 : 0, scen.ok.startsWith('÷') ? 'Going backward to the original whole means dividing.' : 'Starting from the original whole means multiplying.'),
        choice(`Which ONE step gets the answer from ${scen.ok.startsWith('÷') ? '$' + start : '$' + P}?`, [scen.ok, ...scen.bad], 0, scen.why)
      ],
      answer: scen.ans, unit: '$', pct: scen.pct,
      hint: 'Part you lose → rate. What is left after a decrease → 1 − rate. Total after an increase → 1 + rate. Going backward → divide.'
    };
  };

  G.pct_stack = () => {
    const P = pick([40, 60, 80, 100, 120]), d = pick([20, 25, 30]), t = pick([5, 10]);
    const sale = P * (1 - d / 100), total = sale * (1 + t / 100);
    return {
      prompt: `A $${P} game is ${d}% off. Then ${t}% sales tax is added to the sale price. What is the final cost?`,
      steps: [
        choice('First, what multiplier gives the SALE price?', [`× ${fmt(1 - d / 100)}`, `× ${fmt(d / 100)}`, `× ${fmt(1 + d / 100)}`], 0, `${d}% off leaves ${100 - d}%: $${P} × ${fmt(1 - d / 100)} = $${fmt(sale)}.`),
        choice(`Now add ${t}% tax to $${fmt(sale)}. Which multiplier?`, [`× ${fmt(1 + t / 100)}`, `× ${fmt(t / 100)}`, `× ${fmt(1 - t / 100)}`], 0, `Tax is added on top: 100% + ${t}% = ${100 + t}%.`)
      ],
      answer: total, unit: '$', pct: { mode: 'decrease', rate: d, whole: P },
      hint: `$${P} × ${fmt(1 - d / 100)} × ${fmt(1 + t / 100)}`
    };
  };

  /* ------------------------------------------------------------------
     CONVERSIONS: pick the unit fraction that cancels the old unit
     ------------------------------------------------------------------ */
  const UNIT_PAIRS = [
    ['feet', 'inches', 'ft', 'in', 12], ['yards', 'feet', 'yd', 'ft', 3], ['hours', 'minutes', 'hr', 'min', 60],
    ['minutes', 'seconds', 'min', 's', 60], ['pounds', 'ounces', 'lb', 'oz', 16], ['gallons', 'quarts', 'gal', 'qt', 4],
    ['meters', 'centimeters', 'm', 'cm', 100], ['kilometers', 'meters', 'km', 'm', 1000], ['kilograms', 'grams', 'kg', 'g', 1000],
    ['liters', 'milliliters', 'L', 'mL', 1000], ['days', 'hours', 'day', 'hr', 24], ['cups', 'fluid ounces', 'c', 'fl oz', 8]
  ];
  G.conv_factor_pick = () => {
    const [bigN, smallN, big, small, k] = pick(UNIT_PAIRS);
    const toSmall = Math.random() < 0.5;
    const v = toSmall ? pick([2, 3, 4, 5, 6, 1.5, 2.5]) : k * rand(2, 6);
    const from = toSmall ? big : small, to = toSmall ? small : big;
    const good = toSmall ? `× (${k} ${small} / 1 ${big})` : `× (1 ${big} / ${k} ${small})`;
    const bad = toSmall ? `× (1 ${big} / ${k} ${small})` : `× (${k} ${small} / 1 ${big})`;
    return {
      prompt: `Convert ${v} ${toSmall ? bigN : smallN} to ${toSmall ? smallN : bigN}.`,
      steps: [
        choice(`Which unit fraction makes "${from}" cancel out?`, [good, bad], 0,
          `Put the unit you want to get RID of (${from}) on the BOTTOM so it cancels with the ${from} you start with.`),
        choice(`So, do you multiply or divide ${v} by ${k}?`, [`Multiply by ${k}`, `Divide by ${k}`], toSmall ? 0 : 1,
          toSmall ? `Going to a smaller unit (${small}) takes MORE of them → multiply.` : `Going to a bigger unit (${big}) takes FEWER of them → divide.`)
      ],
      answer: toSmall ? v * k : v / k, unit: to, conv: { v, from, to, k, big: toSmall },
      hint: `1 ${big} = ${k} ${small}. Bigger unit → fewer of them.`
    };
  };

  G.conv_rate = () => {
    const c = pick([
      () => { const mph = pick([30, 45, 60, 90]); return { p: `A train goes ${mph} miles per hour. How many miles does it go per MINUTE?`, a: mph / 60, u: 'miles', q: 'One minute is a much smaller chunk of time than an hour. Will the distance in one minute be bigger or smaller?', o: ['Smaller → divide by 60', 'Bigger → multiply by 60'], ok: 0, why: `In one minute you only get 1/60 of the hour's distance: ${mph} ÷ 60.` }; },
      () => { const cpm = pick([2, 3, 4, 5]); return { p: `A leaky faucet drips ${cpm} cups per minute. How many cups per HOUR?`, a: cpm * 60, u: 'cups', q: 'An hour holds 60 minutes. Will the cups in one hour be bigger or smaller?', o: ['Bigger → multiply by 60', 'Smaller → divide by 60'], ok: 0, why: `60 minutes of dripping: ${cpm} × 60.` }; },
      () => { const ppm = pick([2, 3, 4]); return { p: `You read ${ppm} pages per minute. How many pages can you read in 1.5 hours?`, a: ppm * 90, u: 'pages', q: 'First change 1.5 hours to minutes. What is it?', o: ['90 minutes', '150 minutes', '1.5 minutes'], ok: 0, why: `1.5 × 60 = 90 minutes, then ${ppm} × 90.` }; },
      () => { const kmh = pick([4, 5, 6]); return { p: `You walk ${kmh} kilometers per hour. How many METERS do you walk per hour?`, a: kmh * 1000, u: 'm', q: 'Meters are smaller than kilometers. Multiply or divide by 1000?', o: ['Multiply by 1000', 'Divide by 1000'], ok: 0, why: `1 km = 1000 m, so ${kmh} km = ${kmh * 1000} m.` }; }
    ])();
    return { prompt: c.p, steps: [choice(c.q, c.o, c.ok, c.why)], answer: c.a, unit: c.u, hint: c.why };
  };

  /* ------------------------------------------------------------------
     WORD PROBLEMS: translate English into algebra (with classic traps)
     ------------------------------------------------------------------ */
  G.word_translate = () => {
    const a = rand(2, 9), n = rand(a + 2, a + 14), m = rand(2, 5);
    const c = pick([
      { s: `${a} more than a number is ${n + a}.`, ok: `n + ${a} = ${n + a}`, bad: [`${a}n = ${n + a}`, `n − ${a} = ${n + a}`, `${a} − n = ${n + a}`], why: '"More than" means add.' },
      { s: `${a} less than a number is ${n - a}.`, ok: `n − ${a} = ${n - a}`, bad: [`${a} − n = ${n - a}`, `n + ${a} = ${n - a}`, `${a}n = ${n - a}`], why: 'TRAP! "5 less than a number" means start with the number, then take 5 away: n − 5. The order flips from the English.' },
      { s: `A number decreased by ${a} is ${n - a}.`, ok: `n − ${a} = ${n - a}`, bad: [`${a} − n = ${n - a}`, `n ÷ ${a} = ${n - a}`, `n + ${a} = ${n - a}`], why: '"Decreased by" means subtract from the number.' },
      { s: `Twice a number, plus ${a}, is ${2 * n + a}.`, ok: `2n + ${a} = ${2 * n + a}`, bad: [`2(n + ${a}) = ${2 * n + a}`, `n + 2 + ${a} = ${2 * n + a}`, `${a}n + 2 = ${2 * n + a}`], why: '"Twice a number" is 2n. Then add.' },
      { s: `${m} times the sum of a number and ${a} is ${m * (n + a)}.`, ok: `${m}(n + ${a}) = ${m * (n + a)}`, bad: [`${m}n + ${a} = ${m * (n + a)}`, `n + ${m} + ${a} = ${m * (n + a)}`, `${m} + n + ${a} = ${m * (n + a)}`], why: '"The sum" is a group — add first, so it needs parentheses.' },
      { s: `${a} subtracted from a number is ${n - a}.`, ok: `n − ${a} = ${n - a}`, bad: [`${a} − n = ${n - a}`, `n + ${a} = ${n - a}`, `${a}n = ${n - a}`], why: 'TRAP! "Subtracted FROM a number" means the number comes first.' },
      { s: `The quotient of a number and ${m} is ${n}.`, ok: `n ÷ ${m} = ${n}`, bad: [`${m} ÷ n = ${n}`, `${m}n = ${n}`, `n − ${m} = ${n}`], why: '"Quotient" means divide, in the order given: the number ÷ ' + m + '.' }
    ]);
    const ans = c.s.startsWith('The quotient') ? n * m : n;
    return {
      prompt: `Translate, then solve: "${c.s}" What is the number?`,
      steps: [choice('Which equation matches the sentence?', [c.ok, ...c.bad], 0, c.why)],
      answer: ans, hint: `Solve ${c.ok}.`, equation: c.ok.replace(/−/g, '-').replace(/÷/g, '/')
    };
  };

  window.MATH_GENERATORS = G;
})();
