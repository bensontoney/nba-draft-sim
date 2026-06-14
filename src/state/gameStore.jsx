// Central game state: wires the pure engine to React.
//
// Snapshot data (prospects, draft state, scouting, results) lives in useState so
// the UI re-renders on change. The seeded RNG is mutable and stateful, so it lives
// in a ref that persists across renders without triggering re-renders itself.

import { createContext, useContext, useRef, useState } from 'react';
import { createRng } from '../engine/rng.js';
import { generateClass } from '../engine/generator.js';
import {
  assignLockedItems,
  createScoutingState,
  revealItem,
  deepDive as deepDiveState,
} from '../engine/scouting.js';
import { buildDraftBoard } from '../engine/draftAI.js';
import {
  createDraftState,
  runCpuUntilUserOrEnd,
  makeUserPick,
} from '../engine/draftFlow.js';
import { simulateCareer } from '../engine/careerSim.js';
import { TEAM_IDS } from '../data/teams.js';

const TOKEN_POOL = 10;
const CLASS_SIZE = 60;

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const rngRef = useRef(null);
  const [game, setGame] = useState({ phase: 'setup' });

  function startDraft({ userTeamId, userSlot, simMode }) {
    const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    const rng = createRng(seed);
    rngRef.current = rng;

    const prospects = generateClass(rng, CLASS_SIZE);
    const lockedItems = {};
    for (const p of prospects) lockedItems[p.id] = assignLockedItems(rng, p);

    const board = buildDraftBoard(rng, TEAM_IDS, userTeamId, userSlot);
    let draft = createDraftState({ board, prospects, userTeamId });
    draft = runCpuUntilUserOrEnd(draft, rng);

    setGame({
      phase: 'draft',
      seed,
      userTeamId,
      userSlot,
      simMode,
      lockedItems,
      scouting: createScoutingState(TOKEN_POOL),
      draft,
      careerResults: null,
    });
  }

  function reveal(prospectId, itemId) {
    setGame((g) => ({ ...g, scouting: revealItem(g.scouting, prospectId, itemId) }));
  }

  function deepDive(prospectId) {
    setGame((g) => ({
      ...g,
      scouting: deepDiveState(g.scouting, g.lockedItems[prospectId] ?? [], prospectId),
    }));
  }

  function pick(prospectId) {
    setGame((g) => ({ ...g, draft: makeUserPick(g.draft, prospectId, rngRef.current) }));
  }

  function simulate() {
    setGame((g) => {
      const results = {};
      for (const pk of g.draft.picks) {
        const prospect = g.draft.prospectsById[pk.prospectId];
        results[pk.prospectId] = simulateCareer(prospect, rngRef.current, g.simMode);
      }
      return { ...g, phase: 'results', careerResults: results };
    });
  }

  function reset() {
    setGame({ phase: 'setup' });
  }

  const value = { game, startDraft, reveal, deepDive, pick, simulate, reset };
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook lives with its provider
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
