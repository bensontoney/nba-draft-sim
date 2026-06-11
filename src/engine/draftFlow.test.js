import { describe, it, expect } from 'vitest';
import {
  createDraftState,
  isDraftComplete,
  isUserOnClock,
  currentPick,
  runCpuUntilUserOrEnd,
  makeUserPick,
} from './draftFlow.js';
import { buildDraftBoard } from './draftAI.js';
import { generateClass } from './generator.js';
import { TEAM_IDS } from '../data/teams.js';
import { createRng } from './rng.js';

function setup(seed = 1, userTeamId = 'LAL', userSlot = 5) {
  const prospects = generateClass(createRng(seed), 60);
  const board = buildDraftBoard(createRng(seed + 1), TEAM_IDS, userTeamId, userSlot);
  return { prospects, board, userTeamId };
}

describe('createDraftState', () => {
  it('initializes with a full board, all prospects available, at pick 0', () => {
    const { prospects, board, userTeamId } = setup();
    const state = createDraftState({ board, prospects, userTeamId });
    expect(state.board).toHaveLength(60);
    expect(state.availableIds).toHaveLength(60);
    expect(state.picks).toHaveLength(0);
    expect(state.currentIndex).toBe(0);
    expect(isDraftComplete(state)).toBe(false);
  });
});

describe('runCpuUntilUserOrEnd', () => {
  it('stops when the user is on the clock', () => {
    const { prospects, board, userTeamId } = setup(2, 'BOS', 6);
    let state = createDraftState({ board, prospects, userTeamId });
    state = runCpuUntilUserOrEnd(state, createRng(3));
    expect(isUserOnClock(state)).toBe(true);
    expect(currentPick(state).teamId).toBe(userTeamId);
    // CPUs ahead of the user's slot have already picked
    expect(state.picks.length).toBe(currentPick(state).overall - 1);
  });

  it('never drafts the same prospect twice', () => {
    const { prospects, board, userTeamId } = setup(4, 'DET', 1);
    let state = createDraftState({ board, prospects, userTeamId });
    // user at slot 1, so make the user pick first each round then let CPUs run
    const rng = createRng(5);
    while (!isDraftComplete(state)) {
      if (isUserOnClock(state)) {
        state = makeUserPick(state, state.availableIds[0], rng);
      } else {
        state = runCpuUntilUserOrEnd(state, rng);
      }
    }
    const drafted = state.picks.map((p) => p.prospectId);
    expect(new Set(drafted).size).toBe(drafted.length);
  });
});

describe('makeUserPick', () => {
  it('assigns the chosen prospect to the user team and advances', () => {
    const { prospects, board, userTeamId } = setup(6, 'GSW', 3);
    let state = createDraftState({ board, prospects, userTeamId });
    const rng = createRng(7);
    state = runCpuUntilUserOrEnd(state, rng);
    const choice = state.availableIds[0];
    const before = state.picks.length;
    state = makeUserPick(state, choice, rng);
    const userPick = state.picks.find((p) => p.prospectId === choice);
    expect(userPick.teamId).toBe(userTeamId);
    expect(state.picks.length).toBeGreaterThan(before);
    expect(state.availableIds).not.toContain(choice);
  });

  it('completes a full 60-pick draft with every prospect drafted once', () => {
    const { prospects, board, userTeamId } = setup(8, 'NYK', 10);
    let state = createDraftState({ board, prospects, userTeamId });
    const rng = createRng(9);
    while (!isDraftComplete(state)) {
      state = runCpuUntilUserOrEnd(state, rng);
      if (isUserOnClock(state)) {
        state = makeUserPick(state, state.availableIds[0], rng);
      }
    }
    expect(state.picks).toHaveLength(60);
    expect(state.availableIds).toHaveLength(0);
    const totalRostered = Object.values(state.rosters).reduce((n, r) => n + r.length, 0);
    expect(totalRostered).toBe(60);
  });
});
