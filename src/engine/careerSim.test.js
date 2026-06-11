import { describe, it, expect } from 'vitest';
import { simulateCareer, verdictFor, VERDICTS } from './careerSim.js';
import { generateClass, generateProspect } from './generator.js';
import { createRng } from './rng.js';

describe('verdictFor', () => {
  it('maps peak ratings to the verdict ladder', () => {
    expect(verdictFor(95)).toBe('Superstar');
    expect(verdictFor(84)).toBe('All-Star');
    expect(verdictFor(76)).toBe('Starter');
    expect(verdictFor(68)).toBe('Role Player');
    expect(verdictFor(55)).toBe('Bust');
  });

  it('only returns known verdicts', () => {
    for (let r = 30; r <= 99; r++) {
      expect(VERDICTS).toContain(verdictFor(r));
    }
  });
});

describe('simulateCareer — multi-season', () => {
  it('returns a verdict, peak, and 5-8 seasons of stat lines', () => {
    const p = generateProspect(createRng(1), 0);
    const result = simulateCareer(p, createRng(2), 'multi');
    expect(VERDICTS).toContain(result.verdict);
    expect(typeof result.peak).toBe('number');
    expect(result.seasons.length).toBeGreaterThanOrEqual(5);
    expect(result.seasons.length).toBeLessThanOrEqual(8);
    for (const s of result.seasons) {
      expect(s.stats.ppg).toBeGreaterThanOrEqual(0);
      expect(s.stats.rpg).toBeGreaterThanOrEqual(0);
      expect(s.stats.apg).toBeGreaterThanOrEqual(0);
    }
  });

  it('peak equals the best single-season rating', () => {
    const p = generateProspect(createRng(3), 0);
    const result = simulateCareer(p, createRng(4), 'multi');
    const best = Math.max(...result.seasons.map((s) => s.rating));
    expect(result.peak).toBe(best);
  });

  it('is deterministic for the same seed', () => {
    const p = generateProspect(createRng(5), 0);
    const a = simulateCareer(p, createRng(6), 'multi');
    const b = simulateCareer(p, createRng(6), 'multi');
    expect(a).toEqual(b);
  });
});

describe('simulateCareer — single-roll', () => {
  it('returns a verdict and peak without per-season detail', () => {
    const p = generateProspect(createRng(7), 0);
    const result = simulateCareer(p, createRng(8), 'single');
    expect(VERDICTS).toContain(result.verdict);
    expect(typeof result.peak).toBe('number');
    expect(result.seasons).toHaveLength(0);
  });
});

describe('core mechanic — busts and steals emerge', () => {
  it('produces both steals and busts across simulated classes', () => {
    let steals = 0;
    let busts = 0;
    for (let seed = 0; seed < 8; seed++) {
      const klass = generateClass(createRng(seed), 60);
      for (const p of klass) {
        const result = simulateCareer(p, createRng(seed * 1000 + Number(p.id.slice(1))), 'multi');
        // steal: modestly scouted but became a star
        if (p.scouted.potential < 75 && result.peak >= 82) steals++;
        // bust: hyped potential but never panned out
        if (p.scouted.potential >= 85 && result.peak < 74) busts++;
      }
    }
    expect(steals).toBeGreaterThan(0);
    expect(busts).toBeGreaterThan(0);
  });
});
