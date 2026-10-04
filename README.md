# Math Quest - Reasoning Builder

A no-framework static PWA for grades 7-8 math reasoning. It can be hosted entirely on GitHub Pages.

## What it teaches

- Equality and why legal equation steps must preserve both sides
- Moving terms across the = sign (and why + flips to −, × flips to ÷)
- Basic single-variable algebra
- Unit conversions and the multiply-vs-divide decision
- Percents: amount vs final value vs original whole, including `1 - rate` and `1 + rate`
- Word-problem translation and equation selection

Each skill uses four modes: **Teach → Guided → Independent → Challenge**. Problems can have multiple reasoning checkpoints before the final calculation. The app separately tracks reasoning accuracy and final-answer accuracy.

### New in version 5

- **↔️ Across the = Sign world**: a whole world on what "move it to the other side" *really* means. A **Move Animator** flies the term across the = sign, flips its operation (+↔−, ×↔÷), and shows the same step done to both sides. It also has "spot the glitch" problems built on the classic mistakes (3x = 12 → x = 12 − 3, forgetting to flip a sign, dividing only part of a side).
- **🛠️ Equation Workshop**: type *any* linear equation, including homework with parentheses, fractions, or x on both sides. The learner picks each operation, and the workshop applies it to **both sides** on an animated balance scale. It writes the work in notebook lines, crosses out zero pairs, and shows the "moving across" shortcut for each step. Every move is legal, so it explains when a move was *legal but unhelpful*. It finishes with a substitution check. Quest equations open here with one tap.
- **🎬 Concept lessons**: short animated lessons for every world (balance, moving terms, unwrapping, unit fractions, percent bars, word traps), with optional read-aloud.
- **⚡ Lightning Round**: a 60-second game that drills the split-second decisions (which inverse operation, rate vs 1 − rate vs 1 + rate, × vs ÷ for units, word traps). It has combos and a personal best.
- **Percent bar (tape diagram)** with a "multiply or divide?" decision guide, **unit-split bars** with a unit-fraction tester for conversions, and a **🖍️ clue highlighter** for word problems.
- New problem families: choosing the one-step percent multiplier, discount-then-tax, unit-fraction picking, rate conversions, and translating words to equations ("5 less than n").
- Answer choices are now shuffled, so the right answer isn't always "A". Plus sound effects (with a mute button) and more forgiving time answers ("2:15", "2 h 15 min").

Version 4 adds an unlockable level path, adaptive Smart Review, a drag/tap algebra manipulative lab, and an on-screen scratch pad. On supported linear equations, learners can drag or tap x/constant tiles to apply the inverse operation to **both** sides, undo/reset their tile moves, and split a pure multiple such as `3x = 15` into equal groups. The site keeps the existing animated balance/equation visuals, interactive percent models, conversion bridges, mistake-spotting rounds, escalating hints, correction rounds, stars, XP, streaks, and multi-skill Boss Quests.

## Live site

**https://kjljon.github.io/Math-study-guide/**

The app is fully static and uses only relative paths, so it runs as-is from the
`/Math-study-guide/` sub-path on GitHub Pages (or any folder on any static host).

### Turn on GitHub Pages (one time)

1. On GitHub, open the repo's **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Pick the branch that holds these files and the **`/ (root)`** folder, then **Save**.
4. After a minute the site is live. On a phone, use **Add to Home screen** to install it like an app.

`.nojekyll` tells GitHub Pages to serve the files exactly as they are.

## Run it locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

No database, server, npm install, or API key is required. Progress is stored in
`localStorage`, so it stays on that browser/device.

## Add more questions later

Open `question-bank.js`. Each skill has template lists for `teach`, `guided`, `independent`, and `challenge`. Add an existing `kind` to a list to change the mix or frequency.

Example:

```js
challenge: [
  {kind:'pct_reverse_discount'},
  {kind:'pct_change'},
  {kind:'pct_change'} // appears more often because it is listed twice
]
```

The actual randomized generators live in `generators.js`. To create a brand-new problem family, add a new generator there and then reference its `kind` from `question-bank.js`.

## Design notes / evidence base

The learning design follows current evidence-based guidance from the U.S. Department of Education's Institute of Education Sciences / What Works Clearinghouse, including:

- using solved examples to analyze algebraic reasoning;
- teaching students to use the structure of algebraic representations;
- comparing/selecting strategies rather than memorizing unexplained symbol-moving rules;
- monitoring and reflecting on the problem-solving process;
- using visual/concrete representations and clear mathematical language;
- spacing learning and interleaving worked examples with problem-solving practice.

Useful official resources:

- Teaching Strategies for Improving Algebra Knowledge in Middle and High School Students: https://ies.ed.gov/ncee/wwc/PracticeGuide/20
- Toolkit to Support Evidence-Based Algebra Instruction in Middle and High School: https://ies.ed.gov/ncee/rel/algebra-middle-and-high-school/intro
- Improving Mathematical Problem Solving in Grades 4 Through 8: https://ies.ed.gov/ncee/wwc/PracticeGuide/16
- Organizing Instruction and Study to Improve Student Learning: https://ies.ed.gov/ncee/wwc/practiceguide/1

## Version 4 progression and adaptive review

- Each skill has an unlock path: **Teach → Guided → Independent → Challenge**. Two successful quests unlock the next level.
- Mistakes are tracked by problem family on the local device. Smart Review prioritizes the strongest current misconception, and ordinary practice also periodically favors a missed family.
- Focused questions are labeled so the learner and parent can see why that problem was selected.
- The parent view shows the current adaptive focus alongside reasoning and answer accuracy.
- Progress stays local in `localStorage`; no account or server is required.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page layout |
| `app.js` | Quest flow, progress, and the per-world visuals |
| `question-bank.js` | Worlds, lessons, and which problem families appear at each level |
| `generators.js` | Randomized problem generators |
| `workshop.js` | Equation Workshop (exact-fraction step solver) |
| `explainers.js` | Animated concept lessons |
| `blitz.js` | Lightning Round game |
| `sw.js` | Offline support (network-first, so new versions show up right away) |

## Easy next upgrades

- parent PIN and exportable progress report;
- optional learner profiles for multiple kids;
- a larger external JSON question bank or simple question-authoring screen.
