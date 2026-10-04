# Math Quest - Reasoning Builder

A no-framework static PWA for grades 7-8 math reasoning. It can be hosted entirely on GitHub Pages.

## What it teaches

- Equality and why legal equation steps must preserve both sides
- Basic single-variable algebra
- Unit conversions and the multiply-vs-divide decision
- Percents: amount vs final value vs original whole, including `1 - rate` and `1 + rate`
- Word-problem translation and equation selection

Each skill uses four modes: **Teach → Guided → Independent → Challenge**. Problems can have multiple reasoning checkpoints before the final calculation. The app separately tracks reasoning accuracy and final-answer accuracy.

Version 4 adds an unlockable level path, adaptive Smart Review, a drag/tap algebra manipulative lab, and an on-screen scratch pad. On supported linear equations, learners can drag or tap x/constant tiles to apply the inverse operation to **both** sides, undo/reset their tile moves, and split a pure multiple such as `3x = 15` into equal groups. The site keeps the existing animated balance/equation visuals, interactive percent models, conversion bridges, mistake-spotting rounds, escalating hints, correction rounds, stars, XP, streaks, and multi-skill Boss Quests.

## Run it

The easiest preview is any static web server. For example, from this folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish on GitHub Pages

1. Create a GitHub repository.
2. Copy everything in this folder to the repository root and push it.
3. In GitHub: **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose your main branch and `/ (root)`, then Save.
6. Open the Pages URL GitHub gives you. On a phone, use the browser's **Add to Home screen / Install app** option.

No database, server, npm install, or API key is required. Progress is stored in `localStorage`, so it stays on that browser/device.

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

## Easy next upgrades

- parent PIN and exportable progress report;
- optional learner profiles for multiple kids;
- sound/animation settings;
- a larger external JSON question bank or simple question-authoring screen.
