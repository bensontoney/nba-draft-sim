import { describe, it, expect } from 'vitest';
import { buildDraftBoard, cpuSelect, prospectValue } from './draftAI.js';
import { generateClass, generateProspect } from './generator.js';
import { TEAM_IDS } from '../data/teams.js';
import { createRng } from './rng.js';

describe('buildDraftBoard', () => {
  it('produces 60 picks numbered 1-60 across two rounds', () => {
    const board = buildDraftBoard(createRng(1), TEAM_IDS, 'LAL', 5);
    expect(board).toHaveLength(60);
    expect(board.map((p) => p.overall)).toEqual(
      Array.from({ length: 60 }, (_, i) => i + 1),
    );
    expect(board.filter((p) => p.round === 1)).toHaveLength(30);
    expect(board.filter((p) => p.round === 2)).toHaveLength(30);
  });

  it('gives every team exactly two picks', () => {
    const board = buildDraftBoard(createRng(2), TEAM_IDS, 'BOS', 12);
    for (const id of TEAM_IDS) {
      expect(board.filter((p) => p.teamId === id)).toHaveLength(2);
    }
  });

  it('places the user team at the chosen first-round slot', () => {
    const board = buildDraftBoard(createRng(3), TEAM_IDS, 'DET', 1);
    expect(board[0].teamId).toBe('DET');

    const board7 = buildDraftBoard(createRng(3), TEAM_IDS, 'DET', 7);
    expect(board7.find((p) => p.overall === 7).teamId).toBe('DET');
  });

  it('still includes the user team when the slot is randomized', () => {
    const board = buildDraftBoard(createRng(4), TEAM_IDS, 'GSW', null);
    expect(board.filter((p) => p.teamId === 'GSW')).toHaveLength(2);
  });
});

describe('cpuSelect', () => {
  it('returns a prospect from the available pool', () => {
    const available = generateClass(createRng(5), 20);
    const pick = cpuSelect(createRng(6), available, []);
    expect(available).toContain(pick);
  });

  it('picks a clearly superior prospect over weak ones', () => {
    const weak = generateClass(createRng(7), 5).map((p) => ({
      ...p,
      scouted: { ...p.scouted, overall: 50, potential: 52 },
    }));
    const star = {
      ...generateProspect(createRng(8), 99),
      scouted: { overall: 95, potential: 97, uncertainty: 4 },
    };
    const available = [...weak, star];
    // jitter is small relative to the value gap, so the star always wins
    for (let s = 0; s < 20; s++) {
      expect(cpuSelect(createRng(s), available, [])).toBe(star);
    }
  });

  it('prospectValue weights potential over current overall', () => {
    const lowNow = { scouted: { overall: 60, potential: 90 } };
    const highNow = { scouted: { overall: 75, potential: 75 } };
    expect(prospectValue(lowNow)).toBeGreaterThan(prospectValue(highNow));
  });

  it('favors positional need on balance', () => {
    // two equal-value prospects, different positions; roster stacked at one position
    const guard = { id: 'g', bio: { position: 'PG' }, scouted: { overall: 70, potential: 70 } };
    const big = { id: 'b', bio: { position: 'C' }, scouted: { overall: 70, potential: 70 } };
    const roster = [
      { bio: { position: 'PG' } },
      { bio: { position: 'PG' } },
      { bio: { position: 'PG' } },
    ];
    let bigPicks = 0;
    for (let s = 0; s < 200; s++) {
      if (cpuSelect(createRng(s), [guard, big], roster).id === 'b') bigPicks++;
    }
    expect(bigPicks).toBeGreaterThan(100); // needed position picked more often than not
  });
});
