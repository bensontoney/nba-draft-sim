import { describe, it, expect } from 'vitest';
import {
  assignLockedItems,
  createScoutingState,
  revealItem,
  isRevealed,
  canReveal,
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
