import { describe, it, expect } from 'vitest';
import {
  assignLockedItems,
  createScoutingState,
  revealItem,
  isRevealed,
  canReveal,
  deepDive,
  deepDiveCost,
  canDeepDive,
  effectiveUncertainty,
  potentialRange,
  LOCKED_ITEM_TYPES,
} from './scouting.js';
import { generateProspect } from './generator.js';
import { ARCHETYPES } from './archetypes.js';
import { SKILL_KEYS } from './attributes.js';
import { createRng } from './rng.js';

function makeProspect(seed = 1) {
  return generateProspect(createRng(seed), 0);
}

describe('assignLockedItems', () => {
  it('assigns between 1 and 3 unrevealed locked items', () => {
    for (let s = 0; s < 30; s++) {
      const items = assignLockedItems(createRng(s), makeProspect(s));
      expect(items.length).toBeGreaterThanOrEqual(1);
      expect(items.length).toBeLessThanOrEqual(3);
      for (const item of items) {
        expect(LOCKED_ITEM_TYPES).toContain(item.type);
        expect(item.revealed).toBe(false);
        expect(item.id).toBeTruthy();
      }
    }
  });

  it('gives every item a unique id within the prospect', () => {
    const items = assignLockedItems(createRng(7), makeProspect(7));
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('masked-skill items reference a real skill key', () => {
    const items = assignLockedItems(createRng(3), makeProspect(3));
    for (const item of items.filter((i) => i.type === 'maskedSkill')) {
      expect(SKILL_KEYS).toContain(item.payload.skillKey);
    }
  });

  it('comp items carry ceiling and floor comparisons from the archetype', () => {
    // seed chosen so a comp item appears; scan several to find one
    let found = false;
    for (let s = 0; s < 30 && !found; s++) {
      const prospect = makeProspect(s);
      const items = assignLockedItems(createRng(s + 100), prospect);
      const comp = items.find((i) => i.type === 'comp');
      if (comp) {
        const arch = ARCHETYPES.find((a) => a.id === prospect.hidden.archetypeId);
        expect(arch.comps.ceiling).toContain(comp.payload.ceiling);
        expect(arch.comps.floor).toContain(comp.payload.floor);
        found = true;
      }
    }
    expect(found).toBe(true);
  });
});

describe('token accounting', () => {
  it('createScoutingState starts with the given token pool', () => {
    const state = createScoutingState(10);
    expect(state.tokens).toBe(10);
  });

  it('revealItem spends one token and marks the item revealed', () => {
    const state = createScoutingState(10);
    const next = revealItem(state, 'p0', 'item-1');
    expect(next.tokens).toBe(9);
    expect(isRevealed(next, 'p0', 'item-1')).toBe(true);
    expect(isRevealed(state, 'p0', 'item-1')).toBe(false); // original unchanged (pure)
  });

  it('never spends below zero tokens', () => {
    let state = createScoutingState(1);
    state = revealItem(state, 'p0', 'a');
    expect(state.tokens).toBe(0);
    const blocked = revealItem(state, 'p0', 'b');
    expect(blocked.tokens).toBe(0);
    expect(isRevealed(blocked, 'p0', 'b')).toBe(false);
  });

  it('revealing the same item twice does not double-charge', () => {
    let state = createScoutingState(5);
    state = revealItem(state, 'p0', 'a');
    state = revealItem(state, 'p0', 'a');
    expect(state.tokens).toBe(4);
  });

  it('canReveal reflects whether tokens remain', () => {
    expect(canReveal(createScoutingState(1))).toBe(true);
    expect(canReveal(createScoutingState(0))).toBe(false);
  });
});

describe('deep dive', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('costs one fewer token than revealing each item piecemeal', () => {
    expect(deepDiveCost(items, createScoutingState(10), 'p0')).toBe(2);
  });

  it('reveals every item on the prospect at the discounted cost', () => {
    const state = deepDive(createScoutingState(10), items, 'p0');
    expect(state.tokens).toBe(8); // 3 items for 2 tokens
    for (const it of items) expect(isRevealed(state, 'p0', it.id)).toBe(true);
  });

  it('does not double-charge for already-revealed items', () => {
    let state = revealItem(createScoutingState(10), 'p0', 'a'); // 9 left, a revealed
    expect(deepDiveCost(items, state, 'p0')).toBe(1); // 2 remaining → cost 1
    state = deepDive(state, items, 'p0');
    expect(state.tokens).toBe(8);
  });

  it('is a no-op when it cannot be afforded', () => {
    const state = createScoutingState(1); // need 2 for 3 fresh items
    expect(canDeepDive(state, items, 'p0')).toBe(false);
    expect(deepDive(state, items, 'p0')).toBe(state);
  });
});

describe('projection band', () => {
  it('potentialRange brackets the potential by the uncertainty', () => {
    expect(potentialRange(80, 6)).toEqual({ low: 74, high: 86 });
  });

  it('a revealed sharpen tightens the effective uncertainty', () => {
    const prospect = makeProspect(2);
    const items = [
      { id: 's1', type: 'sharpen', payload: { newUncertainty: 3 } },
    ];
    let state = createScoutingState(5);
    expect(effectiveUncertainty(prospect, items, state)).toBe(prospect.scouted.uncertainty);
    state = revealItem(state, prospect.id, 's1');
    expect(effectiveUncertainty(prospect, items, state)).toBe(3);
  });
});

describe('hidden intangible', () => {
  it('an intangible report reveals the prospect\'s real hidden trait', () => {
    for (let s = 0; s < 60; s++) {
      const prospect = makeProspect(s);
      const items = assignLockedItems(createRng(s + 200), prospect);
      const report = items.find((i) => i.type === 'intangible');
      if (!report) continue;
      if (prospect.hidden.intangible) {
        expect(report.payload.trait).toBe(prospect.hidden.intangible.trait);
        expect(report.payload.positive).toBe(prospect.hidden.intangible.positive);
      } else {
        expect(report.payload.neutral).toBe(true);
      }
    }
  });

  it('positive traits carry a positive development nudge, negatives a negative one', () => {
    for (let s = 0; s < 80; s++) {
      const p = makeProspect(s);
      const { intangible, intangibleMod } = p.hidden;
      if (!intangible) {
        expect(intangibleMod).toBe(0);
      } else if (intangible.positive) {
        expect(intangibleMod).toBeGreaterThan(0);
      } else {
        expect(intangibleMod).toBeLessThan(0);
      }
    }
  });
});
