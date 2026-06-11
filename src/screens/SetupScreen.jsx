// Pre-draft setup: choose your team, your draft slot, and career-sim depth.

import { useState } from 'react';
import { TEAMS } from '../data/teams.js';
import { useGame } from '../state/gameStore.jsx';

export default function SetupScreen() {
  const { startDraft } = useGame();
  const [userTeamId, setUserTeamId] = useState(TEAMS[0].id);
  const [slotMode, setSlotMode] = useState('random');
  const [userSlot, setUserSlot] = useState(1);
  const [simMode, setSimMode] = useState('multi');

  function handleStart() {
    startDraft({
      userTeamId,
      userSlot: slotMode === 'random' ? null : userSlot,
      simMode,
    });
  }

  return (
    <div className="setup">
      <header className="setup__header">
        <h1>NBA Draft Simulator</h1>
        <p>Generate a fresh draft class, run your board, then watch careers unfold.</p>
      </header>

      <section className="setup__section">
        <h3>Your Team</h3>
        <div className="team-grid">
          {TEAMS.map((t) => (
            <button
              type="button"
              key={t.id}
              className={`team-chip${userTeamId === t.id ? ' team-chip--on' : ''}`}
              onClick={() => setUserTeamId(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="setup__section">
        <h3>Draft Position</h3>
        <div className="setup__row">
          <label className="radio">
            <input
              type="radio"
              checked={slotMode === 'random'}
              onChange={() => setSlotMode('random')}
            />
            Randomize
          </label>
          <label className="radio">
            <input
              type="radio"
              checked={slotMode === 'choose'}
              onChange={() => setSlotMode('choose')}
            />
            Choose slot
          </label>
          {slotMode === 'choose' && (
            <select value={userSlot} onChange={(e) => setUserSlot(Number(e.target.value))}>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  Pick #{n}
                </option>
              ))}
            </select>
          )}
        </div>
      </section>

      <section className="setup__section">
        <h3>Career Simulation</h3>
        <div className="setup__row">
          <label className="radio">
            <input
              type="radio"
              checked={simMode === 'multi'}
              onChange={() => setSimMode('multi')}
            />
            Multi-season (stat lines)
          </label>
          <label className="radio">
            <input
              type="radio"
              checked={simMode === 'single'}
              onChange={() => setSimMode('single')}
            />
            Single-roll (fast verdict)
          </label>
        </div>
      </section>

      <button type="button" className="btn btn--primary btn--big" onClick={handleStart}>
        Start Draft
      </button>
    </div>
  );
}
