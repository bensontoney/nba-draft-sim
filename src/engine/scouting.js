// Scouting tiers + the token economy.
//
// Each prospect carries 1-3 randomly-assigned LOCKED items the user can spend a
// scouting token to uncover: a masked skill grade, a "sharpen" (narrows the
// potential uncertainty band), an NBA ceiling/floor comp, or an intangible/red flag.
// Because items are randomly distributed, some prospects are mystery boxes worth
// investigating and others are largely known — making each token spend a gamble.

import { ARCHETYPES } from './archetypes.js';
import { SKILL_KEYS, SKILL_LABELS } from './attributes.js';

export const LOCKED_ITEM_TYPES = ['maskedSkill', 'sharpen', 'comp', 'intangible'];

const INTANGIBLES = {
  positive: ['Elite work ethic', 'High motor', 'Natural leader', 'Gym rat', 'Clutch gene'],
  negative: [
    'Injury concerns',
    'Questionable work ethic',
    'Maturity questions',
    'Locker-room red flag',
    'Inconsistent motor',
  ],
};

function archetypeOf(prospect) {
  return ARCHETYPES.find((a) => a.id === prospect.hidden.archetypeId);
}

function buildItem(rng, prospect, type, index) {
  const base = { id: `${prospect.id}-li${index}`, type, revealed: false };
  switch (type) {
    case 'maskedSkill': {
      const skillKey = rng.pick(SKILL_KEYS);
      return {
        ...base,
        label: `Hidden grade: ${SKILL_LABELS[skillKey]}`,
        payload: { skillKey },
      };
    }
    case 'sharpen': {
      // Narrow the scouting fog to a tighter band once revealed.
      const newUncertainty = Math.max(2, Math.round(prospect.scouted.uncertainty * 0.4));
      return {
        ...base,
        label: 'Deeper film study (sharpen projection)',
        payload: { newUncertainty },
      };
    }
    case 'comp': {
      const arch = archetypeOf(prospect);
      return {
        ...base,
        label: 'Pro player comparison',
        payload: {
          ceiling: rng.pick(arch.comps.ceiling),
          floor: rng.pick(arch.comps.floor),
        },
      };
    }
    case 'intangible': {
      const positive = rng.next() > 0.45;
      const pool = positive ? INTANGIBLES.positive : INTANGIBLES.negative;
      return {
        ...base,
        label: 'Character & intangibles report',
        payload: { positive, trait: rng.pick(pool) },
      };
    }
    default:
      return base;
  }
}

export function assignLockedItems(rng, prospect) {
  const count = rng.int(1, 3);
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push(buildItem(rng, prospect, rng.pick(LOCKED_ITEM_TYPES), i));
  }
  return items;
}

// --- Token state (pure, immutable updates) ---

export function createScoutingState(tokens) {
  return { tokens, revealed: {} };
}

function revealKey(prospectId, itemId) {
  return `${prospectId}:${itemId}`;
}

export function isRevealed(state, prospectId, itemId) {
  return Boolean(state.revealed[revealKey(prospectId, itemId)]);
}

export function canReveal(state) {
  return state.tokens > 0;
}

export function revealItem(state, prospectId, itemId) {
  if (isRevealed(state, prospectId, itemId)) return state; // already revealed — no charge
  if (state.tokens <= 0) return state; // out of tokens — no-op, never goes negative
  return {
    tokens: state.tokens - 1,
    revealed: { ...state.revealed, [revealKey(prospectId, itemId)]: true },
  };
}
