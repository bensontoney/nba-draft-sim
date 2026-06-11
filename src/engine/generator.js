// Prospect & draft-class generation.
//
// Each prospect gets a HIDDEN `trueCeiling` the user never sees. Public scouted
// ratings are that ceiling blurred with noise (wider for younger/rawer players).
// The career sim later develops players toward their true ceiling — so the gap
// between scouted and true is exactly what produces busts and steals.

import { ARCHETYPES } from './archetypes.js';
import { SKILL_KEYS, ATHLETIC_KEYS } from './attributes.js';
import { generateName, pickCollege, generateAge } from './names.js';

const BASELINE_SKILL = 50;
const BASELINE_ATHLETIC = 60;

function clamp(v, lo = 0, hi = 99) {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

export function generateProspect(rng, idSuffix) {
  const arch = rng.pick(ARCHETYPES);
  const age = generateAge(rng);

  // Hidden true ceiling, right-skewed (Math.pow biases the roll low) so stars are rare.
  const roll = Math.pow(rng.next(), 1.8);
  const trueCeiling = clamp(48 + roll * (99 - 48), 40, 99);

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

  // Scouting fog — wider band for younger/rawer prospects (the mystery boxes).
  const uncertainty = clamp(4 + rawnessYears * 2.5 + rng.float(0, 4), 2, 20);
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
