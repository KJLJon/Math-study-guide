(() => {
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[rand(0, a.length - 1)];
  const fmt = n => Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
  const choice = (q, options, correct, why) => ({ q, options, correct, why });

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
          `Move ${m2}x and flip its sign`,
          `Divide only the left side by ${m1}`
        ], 0, 'Subtracting the same x-term from both sides keeps the equation equivalent.'),
        choice(`After subtracting ${m2}x, which idea comes next?`, [
          'Keep using inverse operations on both sides',
          'Move everything across = without showing operations',
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
          `Move ${a} to the right`,
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
        answer: ft * 12, unit: 'in', hint: 'Big unit to smaller unit: the number gets bigger.'
      };
    }
    const ft = rand(2, 9), inches = ft * 12;
    return {
      prompt: `Convert ${inches} inches to feet.`,
      steps: [
        choice('Will the numerical answer get larger or smaller?', ['Larger', 'Smaller'], 1, 'Feet are larger units, so fewer are needed.'),
        choice('Which operation?', ['Multiply by 12', 'Divide by 12'], 1, 'Group the inches into sets of 12.')
      ],
      answer: ft, unit: 'ft', hint: 'Small unit to bigger unit: divide.'
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
        answer: h * 60, unit: 'min', hint: 'Hours to minutes: multiply by 60.'
      };
    }
    const mins = pick([90, 120, 150, 180, 210]);
    return {
      prompt: `Convert ${mins} minutes to hours.`,
      steps: [
        choice('Hours are larger units. What should happen to the number?', ['Larger', 'Smaller'], 1, 'Larger units require a smaller count.'),
        choice('Which operation?', ['Multiply by 60', 'Divide by 60'], 1, 'Divide minutes into groups of 60.')
      ],
      answer: mins / 60, unit: 'hr', hint: 'Minutes to hours: divide by 60.'
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
      answer: lb * 16, unit: 'oz', hint: '1 lb = 16 oz.'
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
        answer: m * 100, unit: 'cm', hint: 'Meters to centimeters: x100.'
      };
    }
    const cm = pick([150, 240, 320, 450, 750]);
    return {
      prompt: `Convert ${cm} centimeters to meters.`,
      steps: [
        choice('Meters are larger units. What should the number do?', ['Get larger', 'Get smaller'], 1, 'A larger unit needs a smaller numerical count.'),
        choice('Which operation?', ['x 100', '/ 100'], 1, 'Group centimeters into hundreds.')
      ],
      answer: cm / 100, unit: 'm', hint: 'Centimeters to meters: divide by 100.'
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
      answer: yd * 36, unit: 'in', hint: '1 yd = 3 ft, then 1 ft = 12 in.'
    };
  };

  G.conv_minutes_clock = () => {
    const mins = pick([90, 135, 150, 165]);
    const h = Math.floor(mins / 60), r = mins % 60;
    return {
      prompt: `Convert ${mins} minutes to hours and minutes.`,
      steps: [choice('How many complete groups of 60 fit?', [String(h), String(h + 1), String(Math.max(0, h - 1))], 0, 'Complete groups of 60 are whole hours.')],
      answerText: `${h} h ${r} min`,
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
        choice('Which decimal represents the rate?', [String(rate / 100), String(1 - rate / 100), String(rate)], 0, 'Divide the percent by 100.')
      ],
      answer: whole * rate / 100,
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
      answer: price * (1 - rate / 100), unit: '$', hint: `Use 1 - ${rate / 100}.`
    };
  };

  G.pct_discount = () => {
    const price = pick([40, 60, 80, 100, 120]), rate = pick([10, 20, 25]);
    if (Math.random() < 0.65) {
      return {
        prompt: `A $${price} item is ${rate}% off. What is the sale price?`,
        steps: [choice('Do you use the rate or 1 - rate?', [`Use ${rate / 100}`, `Use ${1 - rate / 100}`], 1, 'The final price is the percent that remains.')],
        answer: price * (1 - rate / 100), unit: '$', hint: 'Final after discount = whole x (1 - rate).'
      };
    }
    return {
      prompt: `A $${price} item is ${rate}% off. What is the discount amount?`,
      steps: [choice('Do you use the rate or 1 - rate?', [`Use ${rate / 100}`, `Use ${1 - rate / 100}`], 0, 'The discount amount itself is rate x whole.')],
      answer: price * rate / 100, unit: '$', hint: 'Discount amount = rate x original.'
    };
  };

  G.pct_tip = () => {
    const bill = pick([30, 40, 50, 60, 80]), rate = pick([15, 20, 25]);
    return {
      prompt: `A $${bill} bill gets a ${rate}% tip. What is the total after tip?`,
      steps: [choice('Which multiplier gives the total directly?', [String(rate / 100), String(1 + rate / 100), String(1 - rate / 100)], 1, 'The total is 100% plus the tip percent.')],
      answer: bill * (1 + rate / 100), unit: '$', hint: 'Final after increase = whole x (1 + rate).'
    };
  };

  G.pct_whole = () => {
    const rate = pick([20, 25, 30, 40, 50]), whole = pick([40, 60, 80, 100, 120]), part = whole * rate / 100;
    return {
      prompt: `${fmt(part)} is ${rate}% of what number?`,
      steps: [choice('You know the part and the rate. Multiply or divide by the decimal rate?', ['Multiply', 'Divide'], 1, 'whole = part / rate.')],
      answer: whole,
      hint: `${part} / ${rate / 100}`
    };
  };

  G.pct_increase = () => {
    const whole = pick([40, 50, 80, 100, 120]), rate = pick([10, 20, 25]);
    return {
      prompt: `A value of ${whole} increases by ${rate}%. What is the new value?`,
      steps: [choice('Which multiplier gives the new value?', [String(rate / 100), String(1 + rate / 100), String(1 - rate / 100)], 1, 'Keep the original 100% and add the increase.')],
      answer: whole * (1 + rate / 100),
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
      answer: original, unit: '$', hint: `Final = original x ${1 - rate / 100}; work backward with division.`
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
      answer: rate, unit: '%', hint: '(change / original) x 100.'
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

  window.MATH_GENERATORS = G;
})();
