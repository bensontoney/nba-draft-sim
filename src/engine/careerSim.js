// Career simulation — the payoff layer.
//
// Players develop from their TRUE current ability toward their TRUE ceiling,
// shaped by a development-rate roll and random events (breakouts, injuries,
// late-career decline). Because the user drafted on the *scouted* (fogged)
// projection, the gap between scouting and reality is what reveals busts and steals.

import { ARCHETYPES } from './archetypes.js';

export const VERDICTS = ['Bust', 'Role Player', 'Starter', 'All-Star', 'Superstar'];

// Peak rating → career verdict.
export function verdictFor(peak) {
  if (peak >= 90) return 'Superstar';
  if (peak >= 82) return 'All-Star';
  if (peak >= 74) return 'Starter';
  if (peak >= 66) return 'Role Player';
  return 'Bust';
}

function round1(n) {
  return Math.round(n * 10) / 10;
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

function clampRating(v) {
  return Math.max(30, Math.min(99, v));
}

function simulateMulti(prospect, rng) {
  const { trueOverall, trueCeiling, developmentRate, injuryProneness } = prospect.hidden;
  const position = positionOf(prospect);
  const numSeasons = rng.int(5, 8);

  const seasons = [];
  let current = trueOverall;
  let peak = current;

  for (let i = 0; i < numSeasons; i++) {
    const ageProgress = numSeasons > 1 ? i / (numSeasons - 1) : 0; // 0 (rookie) .. 1 (late)
    const injured = rng.next() < injuryProneness * 0.25;

    // Development is strongest early and tapers; events add upside/downside surprise.
    const room = trueCeiling - current;
    const growth = room * developmentRate * 0.35 * (1 - ageProgress * 0.5);
    const event = rng.gaussian(0, 3);
    const decline = ageProgress > 0.7 ? (ageProgress - 0.7) * 8 : 0;

    let rating = current + growth + event - decline;
    if (injured) rating -= 6;
    rating = clampRating(rating);
    current = rating;

    const roundedRating = Math.round(rating);
    peak = Math.max(peak, roundedRating);
    seasons.push({
      season: i + 1,
      rating: roundedRating,
      injured,
      stats: statLine(rating, position, rng),
    });
  }

  return { seasons, peak: Math.round(peak), verdict: verdictFor(peak) };
}

function simulateSingle(prospect, rng) {
  const { trueOverall, trueCeiling } = prospect.hidden;
  // One roll for how much of the ceiling gap the player realizes (can over/undershoot).
  const realized = trueOverall + (trueCeiling - trueOverall) * rng.float(0.3, 1.1);
  const peak = Math.round(clampRating(realized + rng.gaussian(0, 2)));
  return { seasons: [], peak, verdict: verdictFor(peak) };
}

export function simulateCareer(prospect, rng, mode = 'multi') {
  return mode === 'single' ? simulateSingle(prospect, rng) : simulateMulti(prospect, rng);
}
