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

// Auto-run CPU picks until the user is on the clock or the draft ends.
export function runCpuUntilUserOrEnd(state, rng) {
  let next = state;
  while (!isDraftComplete(next) && !isUserOnClock(next)) {
    const pick = currentPick(next);
    const available = next.availableIds.map((id) => next.prospectsById[id]);
    const roster = next.rosters[pick.teamId] ?? [];
    const chosen = cpuSelect(rng, available, roster);
    next = applyPick(next, chosen);
  }
  return next;
}

// Apply the user's selection, then let CPUs run up to the user's next turn.
export function makeUserPick(state, prospectId, rng) {
  if (!isUserOnClock(state)) return state;
  const prospect = state.prospectsById[prospectId];
  if (!prospect) return state;
  return runCpuUntilUserOrEnd(applyPick(state, prospect), rng);
}
