/*
  QUESTION BANK
  -------------
  This file intentionally contains DATA, not page layout.
  Add another template object to a skill/stage to create more randomized problem families.
  app.js knows how to turn each "kind" into unlimited concrete questions.
*/
window.MATH_BANK = {
  equality: {
    title: 'Equality & Balance', icon: '⚖️',
    description: 'Understand what the equal sign means and why the same operation must happen on both sides.',
    lesson: {
      teach: ['The equal sign means both sides have the same value.', 'To keep an equation true, apply the same operation to both sides.', 'Say “subtract 5 from both sides,” not “move 5 over.”'],
      guided: ['Name the operation before doing arithmetic.', 'Undo operations in reverse order.', 'Check: did you change both sides the same way?'],
      independent: ['Choose a legal sequence of equal operations.', 'Solve, then substitute your answer to check.'],
      challenge: ['Variables can appear on both sides.', 'There may be more than one valid first step. Explain why yours works.']
    },
    templates: {
      teach:[{kind:'eq_add',range:[3,12]},{kind:'eq_mult',range:[2,9]}],
      guided:[{kind:'eq_add',range:[4,18]},{kind:'eq_twostep',range:[2,8]}],
      independent:[{kind:'eq_twostep',range:[2,12]},{kind:'eq_bothsides',range:[2,7]}],
      challenge:[{kind:'eq_bothsides',range:[2,10]},{kind:'eq_distribute',range:[2,8]}]
    }
  },
  moving: {
    title: 'Across the = Sign', icon: '↔️',
    description: 'Learn what "move it to the other side" REALLY means — and why + flips to − and × flips to ÷.',
    lesson: {
      teach: ['"Moving" a term is a shortcut for doing the opposite operation to BOTH sides.', 'When a term crosses the = sign, its operation flips: + ↔ −, × ↔ ÷.', '3x means 3 TIMES x — so the 3 crosses as ÷ 3, never − 3.'],
      guided: ['Unwrap from the outside in: the + or − comes off before the × or ÷.', 'x can end up on either side: 7 = x is the same as x = 7.'],
      independent: ['Say what really happens: "subtract 5 from both sides" — then do the shortcut.', 'Check by plugging your answer back into the ORIGINAL equation.'],
      challenge: ['With x on both sides, move the x-terms together first.', 'Spot the glitch: find the illegal move, then fix it.']
    },
    templates: {
      teach: [{kind:'move_add'},{kind:'move_add'},{kind:'move_mult'}],
      guided: [{kind:'move_mult'},{kind:'move_div'},{kind:'move_flipside'},{kind:'move_twostep'}],
      independent: [{kind:'move_twostep'},{kind:'move_flipside'},{kind:'move_div'},{kind:'move_wrong'}],
      challenge: [{kind:'move_bothsides'},{kind:'move_wrong'},{kind:'move_twostep'}]
    }
  },
  algebra: {
    title:'Basic Algebra', icon:'🧩',
    description:'Solve single-variable equations by identifying and undoing operations.',
    lesson:{
      teach:['Ask: what is being done to x?', 'Use the inverse operation to undo it.'],
      guided:['For two-step equations, undo addition/subtraction before multiplication/division in most standard forms.', 'Write one legal equation step per line.'],
      independent:['Choose the steps yourself and verify by substitution.'],
      challenge:['Use distribution and combine steps without losing the meaning of equality.']
    },
    templates:{
      teach:[{kind:'alg_onestep_add'},{kind:'alg_onestep_mult'}],
      guided:[{kind:'alg_twostep'}],
      independent:[{kind:'alg_twostep'},{kind:'alg_fraction'}],
      challenge:[{kind:'alg_distribute'},{kind:'eq_bothsides'}]
    }
  },
  conversions:{
    title:'Unit Conversions', icon:'📏',
    description:'Decide whether the number should grow or shrink, then choose multiply or divide.',
    lesson:{
      teach:['Big unit → smaller unit: the numerical value usually gets bigger.', 'Small unit → bigger unit: the numerical value usually gets smaller.'],
      guided:['Write the conversion relationship first.', 'Predict whether your answer should be larger or smaller before calculating.'],
      independent:['Use a conversion factor and keep the units attached.'],
      challenge:['Chain two conversions and use reasonableness to catch mistakes.']
    },
    templates:{
      teach:[{kind:'conv_ft_in'},{kind:'conv_hr_min'},{kind:'conv_factor_pick'}],
      guided:[{kind:'conv_lb_oz'},{kind:'conv_metric'},{kind:'conv_factor_pick'}],
      independent:[{kind:'conv_factor_pick'},{kind:'conv_hr_min'},{kind:'conv_metric'},{kind:'conv_rate'}],
      challenge:[{kind:'conv_yd_in'},{kind:'conv_minutes_clock'},{kind:'conv_rate'}]
    }
  },
  percents:{
    title:'Percents', icon:'%',
    description:'Decide what the question wants before deciding whether to multiply, divide, or use 1 ± rate.',
    lesson:{
      teach:['Percent amount = rate × whole.', 'If you know the part and rate, whole = part ÷ rate.', 'Final after discount = whole × (1 − rate).'],
      guided:['Underline whether the question asks for the change amount or the final amount.', 'Convert percent to a decimal before multiplying or dividing.'],
      independent:['Choose among rate, 1 − rate, 1 + rate, or division based on the relationship.'],
      challenge:['Reverse percent problems start from a final or partial amount and work back to the original.']
    },
    templates:{
      teach:[{kind:'pct_left'},{kind:'pct_of'},{kind:'pct_discount_choice'}],
      guided:[{kind:'pct_discount'},{kind:'pct_tip'},{kind:'pct_whole'},{kind:'pct_multiplier'}],
      independent:[{kind:'pct_multiplier'},{kind:'pct_increase'},{kind:'pct_whole'},{kind:'pct_multiplier'}],
      challenge:[{kind:'pct_reverse_discount'},{kind:'pct_change'},{kind:'pct_stack'},{kind:'pct_multiplier'}]
    }
  },
  words:{
    title:'Word Problems', icon:'💬',
    description:'Translate a situation into a mathematical relationship, then solve and interpret the result.',
    lesson:{
      teach:['Name the unknown first.', 'Look for the relationship between quantities before reaching for arithmetic.'],
      guided:['Classify the problem: equation, conversion, percent amount, percent final, or percent whole.', 'Write an equation before calculating.'],
      independent:['Choose the representation and solve with units.'],
      challenge:['Ignore distracting details and combine more than one step when needed.']
    },
    templates:{
      teach:[{kind:'word_translate'},{kind:'word_linear'},{kind:'word_time'}],
      guided:[{kind:'word_translate'},{kind:'word_linear'},{kind:'word_discount'},{kind:'word_conversion'}],
      independent:[{kind:'word_linear'},{kind:'word_percentwhole'},{kind:'word_split'}],
      challenge:[{kind:'word_battery'},{kind:'word_goal'},{kind:'word_linear_decimal'},{kind:'pct_stack'}]
    }
  }
};
