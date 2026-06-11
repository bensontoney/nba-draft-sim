import { describe, it, expect } from 'vitest';
import { generateProspect, generateClass } from './generator.js';
import { ARCHETYPES } from './archetypes.js';
import { SKILL_KEYS, ATHLETIC_KEYS, POSITIONS } from './attributes.js';
import { createRng } from './rng.js';

function archById(id) {
  return ARCHETYPES.find((a) => a.id === id);
}

describe('generateProspect', () => {
  it('produces a prospect with the full attribute schema', () => {
    const p = generateProspect(createRng(1), 0);
    expect(p.id).toBeTruthy();
    expect(typeof p.bio.name).toBe('string');
    expect(POSITIONS).toContain(p.bio.position);
    for (const key of SKILL_KEYS) {
      expect(typeof p.skills[key]).toBe('number');
    }
    for (const key of ATHLETIC_KEYS) {
      expect(typeof p.athletic[key]).toBe('number');
    }
    expect(typeof p.measurables.heightIn).toBe('number');
    expect(typeof p.scouted.overall).toBe('number');
    expect(typeof p.scouted.potential).toBe('number');
    expect(typeof p.hidden.trueCeiling).toBe('number');
  });

  it('is deterministic for the same seed', () => {
    expect(generateProspect(createRng(9), 0)).toEqual(generateProspect(createRng(9), 0));
  });

  it('keeps all skill and athletic ratings within 0-99', () => {
    for (let s = 0; s < 50; s++) {
      const p = generateProspect(createRng(s), s);
      for (const key of SKILL_KEYS) {
        expect(p.skills[key]).toBeGreaterThanOrEqual(0);
        expect(p.skills[key]).toBeLessThanOrEqual(99);
      }
      for (const key of ATHLETIC_KEYS) {
        expect(p.athletic[key]).toBeGreaterThanOrEqual(0);
        expect(p.athletic[key]).toBeLessThanOrEqual(99);
      }
    }
  });

  it('respects archetype measurable ranges', () => {
    for (let s = 0; s < 50; s++) {
      const p = generateProspect(createRng(s), s);
      const arch = archById(p.hidden.archetypeId);
      expect(p.measurables.heightIn).toBeGreaterThanOrEqual(arch.measurables.heightIn[0]);
      expect(p.measurables.heightIn).toBeLessThanOrEqual(arch.measurables.heightIn[1]);
    }
  });

  it('exposes a hidden true current ability at or below the true ceiling', () => {
    for (let s = 0; s < 50; s++) {
      const p = generateProspect(createRng(s), s);
      expect(typeof p.hidden.trueOverall).toBe('number');
      expect(p.hidden.trueOverall).toBeLessThanOrEqual(p.hidden.trueCeiling);
    }
  });

  it('hides a true ceiling in the plausible 40-99 range', () => {
    for (let s = 0; s < 50; s++) {
      const p = generateProspect(createRng(s), s);
      expect(p.hidden.trueCeiling).toBeGreaterThanOrEqual(40);
      expect(p.hidden.trueCeiling).toBeLessThanOrEqual(99);
    }
  });

  it('assigns a positive scouting uncertainty band', () => {
    const p = generateProspect(createRng(4), 0);
    expect(p.scouted.uncertainty).toBeGreaterThan(0);
  });
});

describe('generateClass', () => {
  it('produces the requested number of prospects with unique ids', () => {
    const klass = generateClass(createRng(11), 60);
    expect(klass).toHaveLength(60);
    expect(new Set(klass.map((p) => p.id)).size).toBe(60);
  });

  it('produces positional variety', () => {
    const klass = generateClass(createRng(12), 60);
    const positions = new Set(klass.map((p) => p.bio.position));
    expect(positions.size).toBeGreaterThan(2);
  });

  it('produces a spread of talent (true ceilings vary)', () => {
    const klass = generateClass(createRng(13), 60);
    const ceilings = klass.map((p) => p.hidden.trueCeiling);
    expect(Math.max(...ceilings) - Math.min(...ceilings)).toBeGreaterThan(15);
  });

  it('makes stars rare — most prospects below 85 ceiling', () => {
    const klass = generateClass(createRng(14), 60);
    const stars = klass.filter((p) => p.hidden.trueCeiling >= 85);
    expect(stars.length).toBeLessThan(klass.length / 3);
  });
});
