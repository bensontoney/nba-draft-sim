// Prospect & draft-class generation.
//
// Each prospect gets a HIDDEN `trueCeiling` the user never sees. Public scouted
// ratings are that ceiling blurred with noise (wider for younger/rawer players).
// The career sim later develops players toward their true ceiling — so the gap
// between scouted and true is exactly what produces busts and steals.

import { ARCHETYPES } from './archetypes.js';
import { SKILL_KEYS, ATHLETIC_KEYS } from './attributes.js';
import { generateName, pickCollege, generateAge } from './names.js';
import { INTANGIBLES } from './scouting.js';

const BASELINE_SKILL = 50;
const BASELINE_ATHLETIC = 60;

function clamp(v, lo = 0, hi = 99) {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

export function generateProspect(rng, idSuffix) {
  const arch = rng.pick(ARCHETYPES);
  const age = generateAge(rng);

  // Hidden true ceiling: most prospects project as future role players / starters,
  // with a thin right tail of stars (the occasional "star bump"). This keeps the
  // realized verdict distribution shaped like a real NBA draft class.
  const base = rng.gaussian(74.5, 7.5);
  const starBump = rng.next() < 0.055 ? rng.float(3, 12) : 0;
  const trueCeiling = clamp(base + starBump, 48, 99);

  // Rawness: younger prospects sit further below their ceiling now (more upside).
  const rawnessYears = Math.max(0, 22 - age); // 0..4
  const gap = rng.float(3, 8) + rawnessYears * rng.float(1.5, 3.5);
  const overall = clamp(trueCeiling - gap, 35, 99);

  // Skills: blend the archetype's tendency with the player's current overall, then add noise.
  const skills = {};
  for (const key of SKILL_KEYS) {
    const tendency = arch.skills?.[key] ?? BASELINE_SKILL;
    const center = tendency * 0.6 + overall * 0.4;
    skills[key] = clamp(center + rng.gaussian(0, 6));
  }

  // Athleticism: centered on archetype tendency.
  const athletic = {};
  for (const key of ATHLETIC_KEYS) {
    const tendency = arch.athletic?.[key] ?? BASELINE_ATHLETIC;
    athletic[key] = clamp(tendency + rng.gaussian(0, 7));
  }

  const measurables = {
    heightIn: rng.int(arch.measurables.heightIn[0], arch.measurables.heightIn[1]),
    weightLb: rng.int(arch.measurables.weightLb[0], arch.measurables.weightLb[1]),
    wingspanIn: rng.int(arch.measurables.wingspanIn[0], arch.measurables.wingspanIn[1]),
  };

  // Hidden intangible trait. It both nudges career development (intangibleMod, read
  // by careerSim) AND is what a "Character & intangibles report" scouting token
  // reveals — so spending a token on it is a genuine edge, not flavor text.
  const intangibleRoll = rng.next();
  let intangible = null;
  let intangibleMod = 0;
  if (intangibleRoll < 0.26) {
    intangible = { positive: true, trait: rng.pick(INTANGIBLES.positive) };
    intangibleMod = Number(rng.float(0.06, 0.15).toFixed(3));
  } else if (intangibleRoll > 0.8) {
    intangible = { positive: false, trait: rng.pick(INTANGIBLES.negative) };
    intangibleMod = -Number(rng.float(0.06, 0.17).toFixed(3));
  }

  // Scouting fog — wider band for younger/rawer prospects (the mystery boxes).
  // The band is shown as a POT range in the UI; a "sharpen" token narrows it.
  const uncertainty = clamp(5 + rawnessYears * 3 + rng.float(0, 5), 3, 24);
  const potential = clamp(trueCeiling + rng.gaussian(0, uncertainty / 2), 40, 99);
  const scoutedOverall = clamp(overall + rng.gaussian(0, 2), 35, 99);

  return {
    id: `p${idSuffix}`,
    bio: {
      name: generateName(rng),
      age,
      position: arch.position,
      college: pickCollege(rng),
    },
    measurables,
    athletic,
    skills,
    scouted: {
      overall: scoutedOverall,
      potential,
      uncertainty,
    },
    hidden: {
      trueCeiling,
      trueOverall: overall, // true current ability; the sim develops this toward the ceiling
      developmentRate: Number(rng.float(0.7, 1.3).toFixed(2)),
      injuryProneness: Number(rng.float(0, 0.5).toFixed(2)),
      intangible, // { positive, trait } | null — surfaced via scouting token
      intangibleMod, // career-realization nudge applied in careerSim
      archetypeId: arch.id,
    },
  };
}

export function generateClass(rng, count = 60) {
  const prospects = [];
  for (let i = 0; i < count; i++) {
    prospects.push(generateProspect(rng, i));
  }
  return prospects;
}
