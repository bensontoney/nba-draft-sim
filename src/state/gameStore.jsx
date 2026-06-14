// Central game state: wires the pure engine to React.
//
// Snapshot data (prospects, draft state, scouting, results) lives in useState so
// the UI re-renders on change. The seeded RNG is mutable and stateful, so it lives
// in a ref that persists across renders without triggering re-renders itself.

import { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  isDraftComplete,
  isUserOnClock,
  stepCpuPick,
  applyUserPick,
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
    // CPU picks are paced one-by-one by the effect below, so the draft "runs"
    // visibly from pick 1 instead of jumping straight to the user's slot.
    const draft = createDraftState({ board, prospects, userTeamId });

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
    // Apply only the user's pick; the effect paces the CPU picks that follow.
    setGame((g) => ({ ...g, draft: applyUserPick(g.draft, prospectId) }));
  }

  // Draft-night pacing: while a CPU team is on the clock, resolve one pick on a
  // short timer so picks roll in live. Pauses automatically on the user's turn.
  useEffect(() => {
    if (game.phase !== 'draft') return undefined;
    const d = game.draft;
    if (isDraftComplete(d) || isUserOnClock(d)) return undefined;
    const t = setTimeout(() => {
      setGame((g) => {
        if (g.phase !== 'draft') return g;
        return { ...g, draft: stepCpuPick(g.draft, rngRef.current) };
      });
    }, 110);
    return () => clearTimeout(t);
  }, [game.phase, game.draft]);

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
