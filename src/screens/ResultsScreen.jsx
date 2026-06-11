// Post-sim results: a league-wide leaderboard of how every pick panned out,
// sortable, with the user's picks highlighted. Reset rolls a brand-new class.

import { useMemo, useState } from 'react';
import { useGame } from '../state/gameStore.jsx';
import { VERDICTS } from '../engine/careerSim.js';
import { teamName } from '../data/teams.js';
import CareerPage from '../components/CareerPage.jsx';

export default function ResultsScreen() {
  const { game, reset } = useGame();
  const { draft, careerResults, userTeamId } = game;
  const [view, setView] = useState('mine');

  const rows = useMemo(() => {
    const all = draft.picks.map((pick) => ({
      pick,
      prospect: draft.prospectsById[pick.prospectId],
      result: careerResults[pick.prospectId],
      isUser: pick.teamId === userTeamId,
    }));
    const filtered = view === 'mine' ? all.filter((r) => r.isUser) : all;
    return [...filtered].sort((a, b) => b.result.peak - a.result.peak);
  }, [draft, careerResults, userTeamId, view]);

  const userRows = draft.picks
    .filter((p) => p.teamId === userTeamId)
    .map((p) => careerResults[p.prospectId]);
  const bestVerdict = userRows.reduce((best, r) => {
    return VERDICTS.indexOf(r.verdict) > VERDICTS.indexOf(best) ? r.verdict : best;
  }, 'Bust');

  return (
    <div className="results">
      <header className="results__header">
        <div>
          <h1>Career Outcomes</h1>
          <p>
            Your best pick became a <strong>{bestVerdict}</strong>. Sorted by peak rating.
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={reset}>
          New Draft Class
        </button>
      </header>

      <div className="seg results__toggle">
        <button
          type="button"
          className={`seg__btn${view === 'mine' ? ' seg__btn--on' : ''}`}
          onClick={() => setView('mine')}
        >
          My Picks
        </button>
        <button
          type="button"
          className={`seg__btn${view === 'league' ? ' seg__btn--on' : ''}`}
          onClick={() => setView('league')}
        >
          Whole League
        </button>
      </div>

      <div className="results__grid">
        {rows.map(({ pick, prospect, result, isUser }) => (
          <CareerPage
            key={pick.overall}
            pick={pick}
            prospect={prospect}
            result={result}
            teamName={teamName(pick.teamId)}
            isUser={isUser}
          />
        ))}
      </div>
    </div>
  );
}
