import { describe, it, expect } from 'vitest';
import { ARCHETYPES } from './archetypes.js';
import { POSITIONS, SKILL_KEYS, ATHLETIC_KEYS } from './attributes.js';

describe('ARCHETYPES', () => {
  it('is a non-empty list', () => {
    expect(Array.isArray(ARCHETYPES)).toBe(true);
    expect(ARCHETYPES.length).toBeGreaterThan(0);
  });

  it('covers every position', () => {
    const covered = new Set(ARCHETYPES.map((a) => a.position));
    for (const pos of POSITIONS) {
      expect(covered.has(pos)).toBe(true);
    }
  });

  it('every archetype has the required shape', () => {
    for (const a of ARCHETYPES) {
      expect(typeof a.id).toBe('string');
      expect(typeof a.label).toBe('string');
      expect(POSITIONS).toContain(a.position);
      expect(a.measurables).toBeTruthy();
      expect(a.measurables.heightIn).toHaveLength(2);
      expect(a.measurables.heightIn[0]).toBeLessThan(a.measurables.heightIn[1]);
    }
  });

  it('has unique ids', () => {
    const ids = ARCHETYPES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('skill and athletic tendency overrides use only valid keys', () => {
    for (const a of ARCHETYPES) {
      for (const key of Object.keys(a.skills ?? {})) {
        expect(SKILL_KEYS).toContain(key);
      }
      for (const key of Object.keys(a.athletic ?? {})) {
        expect(ATHLETIC_KEYS).toContain(key);
      }
    }
  });

  it('every archetype provides ceiling and floor comps', () => {
    for (const a of ARCHETYPES) {
      expect(Array.isArray(a.comps.ceiling)).toBe(true);
      expect(a.comps.ceiling.length).toBeGreaterThan(0);
      expect(Array.isArray(a.comps.floor)).toBe(true);
      expect(a.comps.floor.length).toBeGreaterThan(0);
    }
  });
});
