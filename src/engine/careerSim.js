// Career simulation — the payoff layer.
//
// A career is decided in two steps:
//   1. ONE career-level "realization" roll fixes how much of a prospect's hidden
//      upside (trueCeiling − trueOverall) he actually reaches, nudged by his
//      development rate, intangibles, injury proneness, and rare bust/breakout
//      events. That fixes his realized career peak.
//   2. A full, age-based career arc is drawn under that peak — a rookie ramp, a
//      prime plateau, then decline — for a realistic number of seasons (busts
//      wash out in a few years, stars play 15+).
//
// The verdict keys off the peak the player *actually achieves* on that arc, not a
// lucky single-season noise spike — so stars stay rare and the gap between the
// scouted projection and the real outcome is what produces busts and steals.

import { ARCHETYPES } from './archetypes.js';

export const VERDICTS = ['Bust', 'Role Player', 'Starter', 'All-Star', 'Superstar'];

// Peak rating → career verdict. (Distribution is calibrated via scripts/calibrate.js.)
export function verdictFor(peak) {
  if (peak >= 90) return 'Superstar';
  if (peak >= 82) return 'All-Star';
  if (peak >= 74) return 'Starter';
  if (peak >= 66) return 'Role Player';
  return 'Bust';
}

// Rare discrete career outcomes that widen the tails (tuned in Phase 2 calibration).
const BUST_CHANCE = 0.13;
const BREAKOUT_CHANCE = 0.08;

function round1(n) {
  return Math.round(n * 10) / 10;
}

function clampRating(v) {
  return Math.max(30, Math.min(99, v));
}

function positionOf(prospect) {
  const arch = ARCHETYPES.find((a) => a.id === prospect.hidden.archetypeId);
  return arch ? arch.position : prospect.bio.position;
}

// Per-season box-score line derived from rating + position.
function statLine(rating, position, rng) {
  const scale = Math.max(0, (rating - 40) / 50); // 0 .. ~1.2
  let ppg;
  let rpg;
  let apg;
  switch (position) {
    case 'PG':
      ppg = 4 + scale * 20; rpg = 2 + scale * 3; apg = 3 + scale * 7; break;
    case 'SG':
      ppg = 4 + scale * 22; rpg = 2.5 + scale * 3; apg = 2 + scale * 4; break;
    case 'SF':
      ppg = 4 + scale * 21; rpg = 3 + scale * 4.5; apg = 1.5 + scale * 3.5; break;
    case 'PF':
      ppg = 4 + scale * 19; rpg = 4 + scale * 6.5; apg = 1 + scale * 2.5; break;
    case 'C':
      ppg = 3 + scale * 18; rpg = 5 + scale * 7.5; apg = 1 + scale * 2; break;
    default:
      ppg = 4 + scale * 20; rpg = 3 + scale * 5; apg = 2 + scale * 3;
  }
  return {
    ppg: Math.max(0, round1(ppg + rng.gaussian(0, 1.4))),
    rpg: Math.max(0, round1(rpg + rng.gaussian(0, 0.8))),
    apg: Math.max(0, round1(apg + rng.gaussian(0, 0.7))),
  };
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 2);
}

// Step 1: the single roll that fixes how much of the hidden upside is realized.
// Returns the realized career peak rating (can undershoot current ability on a
// hard bust, or modestly overshoot the ceiling on a breakout).
export function realizeCareerPeak(prospect, rng) {
  const { trueOverall, trueCeiling, developmentRate, injuryProneness } = prospect.hidden;
  const intangibleMod = prospect.hidden.intangibleMod ?? 0; // Phase 3 wires this from traits
  const gap = trueCeiling - trueOverall;

  let realization = 0.62 + (developmentRate - 1.0) * 0.8 + intangibleMod;
  realization += rng.gaussian(0, 0.16); // career-to-career variance
  realization -= injuryProneness * 0.35; // injuries cost development

  const roll = rng.next();
  if (roll < BUST_CHANCE) {
    realization -= rng.float(0.35, 0.75); // derailed — never put it together
  } else if (roll > 1 - BREAKOUT_CHANCE) {
    realization += rng.float(0.22, 0.5); // exceeded the projection
  }

  realization = Math.max(-0.25, Math.min(1.35, realization));
  return clampRating(trueOverall + gap * realization);
}

// Better players stick around longer; busts flame out in a few seasons.
function careerLengthFor(careerPeak, injuryProneness, rng) {
  const quality = Math.max(0, (careerPeak - 52) / 38); // ~0 (bust) .. ~1.2 (superstar)
  let length = rng.float(2, 5) + quality * 11;
  length -= injuryProneness * rng.float(0, 7);
  return Math.max(1, Math.min(19, Math.round(length)));
}

function awardsFor(seasons) {
  let allStarCount = 0;
  let allNbaCount = 0;
  let mvpCount = 0;
  for (const s of seasons) {
    if (s.rating >= 82) allStarCount++;
    if (s.rating >= 85) allNbaCount++;
    if (s.rating >= 92) mvpCount++;
  }
  // `roy` is league-wide (one per draft class) — assigned in the Results layer.
  return { roy: false, allStarCount, allNbaCount, mvpCount };
}

// Step 2: draw the age-based arc under the realized peak.
function simulateMulti(prospect, rng) {
  const { trueOverall, injuryProneness } = prospect.hidden;
  const position = positionOf(prospect);
  const startAge = prospect.bio.age;

  const careerPeak = realizeCareerPeak(prospect, rng);
  const length = careerLengthFor(careerPeak, injuryProneness, rng);
  const peakAge = startAge + rng.int(4, 7); // hits his prime a few years in
  const declineRate = rng.float(1.6, 3.0);
  const rookieRating = Math.min(trueOverall, careerPeak); // can't debut above his realized peak

  const seasons = [];
  for (let i = 0; i < length; i++) {
    const age = startAge + i;
    const inPrime = age >= peakAge && age <= peakAge + 2;

    let base;
    if (age < peakAge) {
      const span = peakAge - startAge;
      const t = span <= 0 ? 1 : Math.min(1, (age - startAge) / span);
      base = rookieRating + (careerPeak - rookieRating) * easeOut(t); // rising
    } else if (inPrime) {
      base = careerPeak; // prime plateau — the true peak shows here
    } else {
      base = careerPeak - (age - (peakAge + 2)) * declineRate; // decline
    }

    const injured = rng.next() < injuryProneness * 0.22;
    let rating = base;
    if (!inPrime) rating -= Math.abs(rng.gaussian(0, 1.1)); // cosmetic, downward only
    if (injured) rating -= rng.float(3, 7);
    rating = Math.round(clampRating(Math.min(rating, careerPeak)));

    seasons.push({
      season: i + 1,
      age,
      rating,
      injured,
      allStar: rating >= 82,
      stats: statLine(rating, position, rng),
    });
  }

  const peak = Math.max(...seasons.map((s) => s.rating));
  return {
    seasons,
    peak,
    verdict: verdictFor(peak),
    careerLength: length,
    awards: awardsFor(seasons),
  };
}

function simulateSingle(prospect, rng) {
  const peak = Math.round(realizeCareerPeak(prospect, rng));
  return {
    seasons: [],
    peak,
    verdict: verdictFor(peak),
    careerLength: 0,
    awards: { roy: false, allStarCount: 0, allNbaCount: 0, mvpCount: 0 },
  };
}

export function simulateCareer(prospect, rng, mode = 'multi') {
  return mode === 'single' ? simulateSingle(prospect, rng) : simulateMulti(prospect, rng);
}
