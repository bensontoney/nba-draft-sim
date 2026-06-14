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
  it('returns a verdict, peak, awards, and a full-length career of stat lines', () => {
    const p = generateProspect(createRng(1), 0);
    const result = simulateCareer(p, createRng(2), 'multi');
    expect(VERDICTS).toContain(result.verdict);
    expect(typeof result.peak).toBe('number');
    expect(result.seasons.length).toBeGreaterThanOrEqual(1);
    expect(result.seasons.length).toBeLessThanOrEqual(19);
    expect(result.careerLength).toBe(result.seasons.length);
    expect(result.awards).toMatchObject({ allStarCount: expect.any(Number) });
    for (const s of result.seasons) {
      expect(typeof s.age).toBe('number');
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

  it('seasons follow an age progression starting at the prospect age', () => {
    const p = generateProspect(createRng(11), 0);
    const result = simulateCareer(p, createRng(12), 'multi');
    expect(result.seasons[0].age).toBe(p.bio.age);
    for (let i = 1; i < result.seasons.length; i++) {
      expect(result.seasons[i].age).toBe(result.seasons[i - 1].age + 1);
    }
  });

  it('is deterministic for the same seed', () => {
    const p = generateProspect(createRng(5), 0);
    const a = simulateCareer(p, createRng(6), 'multi');
    const b = simulateCareer(p, createRng(6), 'multi');
    expect(a).toEqual(b);
  });

  it('only awards All-Star seasons when the peak reaches the All-Star line', () => {
    for (let seed = 0; seed < 40; seed++) {
      const p = generateProspect(createRng(seed), 0);
      const result = simulateCareer(p, createRng(seed + 500), 'multi');
      if (result.peak < 82) expect(result.awards.allStarCount).toBe(0);
      if (result.awards.mvpCount > 0) expect(result.peak).toBeGreaterThanOrEqual(92);
    }
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

describe('realism — distribution and arc behavior', () => {
  // Aggregate a large sample of simulated careers once for the statistical checks.
  function sample() {
    const careers = [];
    for (let seed = 0; seed < 12; seed++) {
      const klass = generateClass(createRng(seed), 60);
      for (const p of klass) {
        const result = simulateCareer(p, createRng(seed * 1000 + Number(p.id.slice(1))), 'multi');
        careers.push({ p, result });
      }
    }
    return careers;
  }

  it('does not inflate peaks above the hidden ceiling on average', () => {
    const careers = sample();
    const meanPeak = careers.reduce((s, c) => s + c.result.peak, 0) / careers.length;
    const meanCeiling = careers.reduce((s, c) => s + c.p.hidden.trueCeiling, 0) / careers.length;
    // Players realize only part of their upside, so achieved peaks sit below ceilings.
    expect(meanPeak).toBeLessThan(meanCeiling);
  });

  it('keeps stars rare relative to role players and busts', () => {
    const careers = sample();
    const stars = careers.filter((c) => ['All-Star', 'Superstar'].includes(c.result.verdict)).length;
    const lows = careers.filter((c) => ['Bust', 'Role Player'].includes(c.result.verdict)).length;
    expect(lows).toBeGreaterThan(stars);
  });

  it('career length correlates with quality (good players play longer)', () => {
    const careers = sample();
    const good = careers.filter((c) => c.result.peak >= 80);
    const poor = careers.filter((c) => c.result.peak < 65);
    const avg = (arr) => arr.reduce((s, c) => s + c.result.careerLength, 0) / arr.length;
    expect(avg(good)).toBeGreaterThan(avg(poor));
  });
});

describe('core mechanic — busts and steals emerge', () => {
  it('produces both steals and busts relative to the scouted expectation', () => {
    let steals = 0;
    let busts = 0;
    for (let seed = 0; seed < 12; seed++) {
      const klass = generateClass(createRng(seed), 60);
      for (const p of klass) {
        const result = simulateCareer(p, createRng(seed * 1000 + Number(p.id.slice(1))), 'multi');
        // What a GM would reasonably expect: midpoint of current ability and ceiling.
        const expected = (p.scouted.overall + p.scouted.potential) / 2;
        if (result.peak - expected >= 6) steals++; // notably outperformed projection
        if (expected - result.peak >= 10) busts++; // notably fell short
      }
    }
    expect(steals).toBeGreaterThan(0);
    expect(busts).toBeGreaterThan(0);
  });
});
