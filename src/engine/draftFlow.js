// Draft orchestration — pure state transitions the UI store drives.
//
// Holds the board, who's been picked, and each team's roster. CPU teams pick via
// cpuSelect; the user picks interactively. All updates are immutable so React can
// diff state cleanly and the flow stays unit-testable without any UI.

import { cpuSelect } from './draftAI.js';

export function createDraftState({ board, prospects, userTeamId }) {
  return {
    board,
    userTeamId,
    prospectsById: Object.fromEntries(prospects.map((p) => [p.id, p])),
    availableIds: prospects.map((p) => p.id),
    picks: [],
    rosters: {},
    currentIndex: 0,
  };
}

export function isDraftComplete(state) {
  return state.currentIndex >= state.board.length;
}

export function currentPick(state) {
  return state.board[state.currentIndex];
}

export function isUserOnClock(state) {
  return !isDraftComplete(state) && currentPick(state).teamId === state.userTeamId;
}

// Record a prospect being taken at the current pick and advance the board.
function applyPick(state, prospect) {
  const pick = currentPick(state);
  const roster = state.rosters[pick.teamId] ?? [];
  return {
    ...state,
    availableIds: state.availableIds.filter((id) => id !== prospect.id),
    picks: [...state.picks, { ...pick, prospectId: prospect.id }],
    rosters: { ...state.rosters, [pick.teamId]: [...roster, prospect] },
    currentIndex: state.currentIndex + 1,
  };
}

// Resolve a single CPU pick. No-op if the draft is over or the user is on the clock.
// Stepping one at a time (vs. the loop below) lets the UI pace the draft for drama
// while drawing from the same seeded rng, so outcomes stay deterministic.
export function stepCpuPick(state, rng) {
  if (isDraftComplete(state) || isUserOnClock(state)) return state;
  const pick = currentPick(state);
  const available = state.availableIds.map((id) => state.prospectsById[id]);
  const roster = state.rosters[pick.teamId] ?? [];
  const chosen = cpuSelect(rng, available, roster);
  return applyPick(state, chosen);
}

// Auto-run CPU picks until the user is on the clock or the draft ends.
export function runCpuUntilUserOrEnd(state, rng) {
  let next = state;
  while (!isDraftComplete(next) && !isUserOnClock(next)) {
    next = stepCpuPick(next, rng);
  }
  return next;
}

// Apply the user's selection only (CPU picks are paced separately by the UI).
export function applyUserPick(state, prospectId) {
  if (!isUserOnClock(state)) return state;
  const prospect = state.prospectsById[prospectId];
  if (!prospect) return state;
  return applyPick(state, prospect);
}

// Apply the user's selection, then let CPUs run up to the user's next turn.
export function makeUserPick(state, prospectId, rng) {
  return runCpuUntilUserOrEnd(applyUserPick(state, prospectId), rng);
}
