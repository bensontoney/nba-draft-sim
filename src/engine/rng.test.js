import { describe, it, expect } from 'vitest';
import { createRng } from './rng.js';

describe('createRng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = [a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next()];
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a.next()).not.toEqual(b.next());
  });

  it('next() returns floats in [0, 1)', () => {
    const r = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int(min, max) returns integers within an inclusive range', () => {
    const r = createRng(99);
    const seen = new Set();
    for (let i = 0; i < 1000; i++) {
      const v = r.int(3, 6);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    // over 1000 draws all four values should appear
    expect(seen).toEqual(new Set([3, 4, 5, 6]));
  });

  it('float(min, max) returns floats within [min, max)', () => {
    const r = createRng(5);
    for (let i = 0; i < 1000; i++) {
      const v = r.float(10, 20);
      expect(v).toBeGreaterThanOrEqual(10);
      expect(v).toBeLessThan(20);
    }
  });

  it('pick(array) returns an element of the array', () => {
    const r = createRng(13);
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 100; i++) {
      expect(arr).toContain(r.pick(arr));
    }
  });

  it('gaussian() is roughly centered on the mean', () => {
    const r = createRng(21);
    let sum = 0;
    const n = 5000;
    for (let i = 0; i < n; i++) sum += r.gaussian(50, 10);
    const mean = sum / n;
    expect(mean).toBeGreaterThan(48);
    expect(mean).toBeLessThan(52);
  });
});
