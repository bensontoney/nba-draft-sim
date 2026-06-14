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

export const INTANGIBLES = {
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
      // Reflect the prospect's REAL hidden trait (set in the generator), so the
      // report is actionable — it tells you which way development will break.
      const intan = prospect.hidden.intangible;
      if (!intan) {
        return {
          ...base,
          label: 'Character & intangibles report',
          payload: { positive: true, neutral: true, trait: 'No red flags — solid pro makeup' },
        };
      }
      return {
        ...base,
        label: 'Character & intangibles report',
        payload: { positive: intan.positive, trait: intan.trait },
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

// Deep dive: reveal every locked item on one prospect at once. Costs one fewer
// token than revealing them piecemeal (min 1) — committing fully to a prospect is
// cheaper per item, creating a concentrate-vs-spread decision. No-op if unaffordable.
export function deepDiveCost(items, state, prospectId) {
  const unrevealed = items.filter((it) => !isRevealed(state, prospectId, it.id));
  return Math.max(0, unrevealed.length - 1);
}

export function canDeepDive(state, items, prospectId) {
  const unrevealed = items.filter((it) => !isRevealed(state, prospectId, it.id));
  return unrevealed.length > 0 && state.tokens >= deepDiveCost(items, state, prospectId);
}

export function deepDive(state, items, prospectId) {
  const unrevealed = items.filter((it) => !isRevealed(state, prospectId, it.id));
  if (unrevealed.length === 0) return state;
  const cost = deepDiveCost(items, state, prospectId);
  if (state.tokens < cost) return state;
  const revealed = { ...state.revealed };
  for (const it of unrevealed) revealed[revealKey(prospectId, it.id)] = true;
  return { tokens: state.tokens - cost, revealed };
}

// --- Projection band (the POT range shown in the UI) ---

// A prospect's effective uncertainty, tightened if a revealed "sharpen" item applies.
export function effectiveUncertainty(prospect, items, state) {
  let u = prospect.scouted.uncertainty;
  for (const it of items) {
    if (it.type === 'sharpen' && isRevealed(state, prospect.id, it.id)) {
      u = Math.min(u, it.payload.newUncertainty);
    }
  }
  return u;
}

// The low–high band where the prospect's ceiling plausibly sits, given uncertainty.
export function potentialRange(potential, uncertainty) {
  const half = Math.round(uncertainty);
  return {
    low: Math.max(40, Math.round(potential) - half),
    high: Math.min(99, Math.round(potential) + half),
  };
}
