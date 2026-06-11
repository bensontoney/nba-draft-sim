# NBA Draft Simulator — Design (v1)

A client-side web app (React + Vite) that generates a fictional NBA draft class in
the spirit of NBA 2K, lets you GM one team through the draft, then simulates how
every prospect's career pans out — so you can see who hit, who busted, and who was
a steal. No backend, no database: everything is generated and simulated in the browser.

## Core loop
Setup → Draft Board → Simulate → Results → Reset (new class).

## The signature mechanic: hidden true ceiling
Every prospect has a hidden `trueCeiling` (and `trueOverall`) the user never sees.
Public scouted ratings are those values blurred with noise — wider for younger/rawer
prospects. The career sim develops players toward their *true* values, so the gap
between scouting and reality is what produces busts and steals.

## Scouting tokens
A fixed pool (10) per draft, 1 token per reveal. Each prospect carries 1–3 randomly
assigned locked items you can spend a token to uncover:
- **maskedSkill** — a skill grade shown as `?` until revealed
- **sharpen** — narrows the potential uncertainty band
- **comp** — an NBA ceiling/floor player comparison (from the archetype's comp list)
- **intangible** — a character note or red flag

## Architecture

```
src/
├── engine/          Pure logic, no React. Fully unit-tested (Vitest).
│   ├── rng.js          Seedable PRNG (mulberry32) — determinism for tests.
│   ├── grades.js       Numeric rating (0-99) → letter grade (A+..F).
│   ├── attributes.js   Canonical skill/athletic keys + labels (2K-style groups).
│   ├── archetypes.js   8 position archetypes: measurable ranges, tendencies, comps.
│   ├── names.js        Name / college / age pools.
│   ├── generator.js    Builds coherent prospects + hidden ceiling + scouting fog.
│   ├── scouting.js     Locked-item assignment + token reveal accounting.
│   ├── draftAI.js      Draft board ordering + CPU best-available-by-value picks.
│   ├── careerSim.js    Multi-season + single-roll career simulation, verdicts.
│   └── draftFlow.js     Draft state transitions (CPU auto-pick, user picks).
├── data/
│   └── teams.js        30 NBA franchises.
├── state/
│   └── gameStore.jsx   React context wiring the engine to the UI (+ RNG ref).
├── components/        ProspectCard, ProspectDetail, SkillGrade, DraftOrderPanel, CareerPage.
├── screens/           SetupScreen, DraftScreen, ResultsScreen.
└── App.jsx            Phase router (setup | draft | results).
```

Every `engine/` module is a pure function of its inputs + an injected RNG, so the
whole simulation is deterministic under a seed and testable without the UI. This is
also what will let the planned historical / 2026 modes swap `generator` for a data
loader while reusing `draftAI`, `careerSim`, and `draftFlow` unchanged.

## Commands
- `npm run dev` — local dev server
- `npm test` — run the unit suite (Vitest)
- `npm run build` — production build

## Status
v1 complete: auto-generated mode, full core loop, 63 passing unit tests.

## Future (not in v1)
- Historical mode (real past draft classes) and current-2026 prospect mode — both
  reuse this engine with a different data source.
- Persisted "Hall of Fame" history across resets.
