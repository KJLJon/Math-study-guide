# Math Quest

An interactive, mobile-first math practice app for 8th grade. It's built around **doing** the math (tapping, dragging, building) instead of picking A/B/C/D or guessing numbers.

**Live site:** https://kjljon.github.io/Math-study-guide/

## What it teaches

| World | What she does |
| --- | --- |
| ⚖️ **Balance Basics** | Mystery bags and blocks on a scale. She predicts whether a move keeps it balanced, then watches it tip or stay level. |
| ↔️ **Across the = Sign** | She taps or **drags** the term stuck to x across the = sign, picks what it turns into, and watches the same move happen to **both sides**. A "shortcut" replay shows that "moving it across" *is* doing the opposite to both sides. |
| 🧩 **Solving Equations** | Two-step equations, x on both sides, parentheses (divide first or distribute), negatives. |
| 📏 **Unit Conversions** | Predict more or fewer, watch the bar split or group, then flip the unit fraction until the old unit cancels. The fraction shows whether to × or ÷. |
| % **Percents** | Drag a percent bar, tap the part the question asks for, and tap where the given amount goes. Knowing the original means multiply. Working backward becomes `0.75 × ? = 60`, so she sees *why* it's divide. |
| 💬 **Word Problems** | Tap the numbers, tap the question, choose what x means, **build the equation from tiles**, solve it, then say what the answer means. Some stories include a number she doesn't need. |

### How the teaching works

- **Each world has 4 levels:** Learn (Ollie the guide narrates every step and the target glows), Practice (questions, glow after a miss), Solo (she does the arithmetic on a keypad), and Boss (harder problems, no help).
- **No guess-and-check for equations.** She never types x. She makes each move, and moves that aren't helpful are explained instead of applied, e.g. "Not yet! The +6 was added last, so it comes off first."
- **Every wrong choice has a specific explanation.** For example, "3x means 3 TIMES x, so it crosses as ÷ 3, not − 3."
- **Every solution is checked** by plugging the answer back into the original equation.
- **Rounds of 5 problems** earn stars and unlock the next level. Missed problem types come back more often, and Smart Review drills them.
- **Extras:** 🛠️ *Solve MY equation* (type any homework equation), ⚡ Lightning Round (60-second game), 👑 Boss Mix, and 🎬 animated concept lessons with read-aloud.
- **Parent view** shows first-try accuracy per world and which *step* causes slips (choosing the operation vs. arithmetic vs. multiply-or-divide…).

## Hosting (GitHub Pages)

The app is fully static with relative paths, so it works from `/Math-study-guide/` or any folder.

1. Go to **Settings → Pages → Deploy from a branch**.
2. Pick the branch and `/ (root)`, then Save.

`.nojekyll` makes Pages serve the files as-is. The service worker fetches the newest files first (falling back to the cache offline), so updates show up right away. On a phone, use **Add to Home screen** to install it like an app.

Progress is saved in `localStorage` on that device only.

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page shell (screens + lesson modal) |
| `style.css` | Mobile-first styles and animations |
| `js/core.js` | Exact fractions, equation parser, animation and sound helpers |
| `js/store.js` | Progress (stars, levels, slips, daily streak) |
| `js/problems.js` | Worlds, levels and **problem generators**, where you add more practice |
| `js/act-solve.js` | Interactive equation solver (scale, tap/drag, both-sides animation, check) |
| `js/act-percent.js` | Percent bar activity |
| `js/act-convert.js` | Unit-fraction conversion activity |
| `js/act-words.js` | Word problems (tap, build, solve), "is it balanced?", and "spot the glitch" |
| `js/explainers.js` | Animated concept lessons |
| `js/blitz.js` | Lightning Round |
| `js/app.js` | Screens, rounds, guide bubble, keypad, results, parent view |

### Adding problems

Write a generator in `js/problems.js` that returns an activity spec, for example
`{ type: 'solve', eq: '4x - 3 = 17', prompt: 'Solve for x' }`, then add its name to a world's `levels` list.
