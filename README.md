# NBA Draft Simulator

A full-stack, browser-based NBA draft simulator: generate a fictional draft class, scout prospects with a limited pool of scouting tokens, draft as one team's GM, then simulate every pick's career and see who became a star, a bust, or a steal.

**[Live demo →](#)** <!-- add Vercel URL after first deploy -->

## How it works

- **Setup** — pick a draft slot (1–30) or randomize it.
- **Scouting** — every prospect has a hidden true-ceiling value the user never sees directly. Scouted skill grades are that value blurred with noise; younger, rawer prospects have wider uncertainty bands. A fixed pool of ~10 scouting tokens can be spent to reveal a masked skill grade, "sharpen" a range, an NBA player comp, or a hidden intangible/red flag — scouting is a real resource-allocation decision, not busywork.
- **Draft** — 2 rounds, 60 picks, real NBA team names. The other 29 teams auto-draft using best-player-available plus positional need and some randomness.
- **Career simulation** — each drafted prospect's career plays out as a full age-based arc (rookie ramp → prime → decline) driven by the gap between their true ceiling and how they were scouted, which is what produces realistic busts and steals rather than just noise.
- **Results** — picks reveal one at a time, followed by a scorecard: per-slot expectations, steal/bust calls, a letter grade for the whole draft class, Rookie of the Year, and the draft's biggest steal and bust.

## Tech

React + Vite, fully client-side (no backend or database — everything is generated and simulated in the browser). Engine built test-first with Vitest: 10 test files, 93 passing tests covering generation, scouting, draft flow, career simulation, and grading. A Monte Carlo calibration script (`scripts/calibrate.js`) tunes the draft-class talent distribution to a realistic NBA shape (roughly 0–2 superstars, 4–5 all-stars, 15 starters, 21 role players, 18 busts per 60-pick class).

## Running locally

```bash
npm install
npm run dev      # dev server
npm test         # run the Vitest suite
npm run build    # production build
```
