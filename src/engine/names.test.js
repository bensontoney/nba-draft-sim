import { describe, it, expect } from 'vitest';
import { generateName, pickCollege, generateAge, COLLEGES } from './names.js';
import { createRng } from './rng.js';

describe('names', () => {
  it('generateName returns a "First Last" string', () => {
    const name = generateName(createRng(1));
    expect(typeof name).toBe('string');
    expect(name.trim().split(/\s+/).length).toBeGreaterThanOrEqual(2);
  });

  it('generateName is deterministic for the same seed', () => {
    expect(generateName(createRng(5))).toBe(generateName(createRng(5)));
  });

  it('pickCollege returns a college from the pool', () => {
    const r = createRng(2);
    for (let i = 0; i < 50; i++) {
      expect(COLLEGES).toContain(pickCollege(r));
    }
  });

  it('generateAge returns a plausible draft age (18-23)', () => {
    const r = createRng(3);
    for (let i = 0; i < 200; i++) {
      const age = generateAge(r);
      expect(age).toBeGreaterThanOrEqual(18);
      expect(age).toBeLessThanOrEqual(23);
    }
  });
});
