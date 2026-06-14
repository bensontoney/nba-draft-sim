// Post-sim payoff. First the user's picks are revealed one at a time for drama,
// capped with a letter grade for the class and the draft's biggest steal & bust;
// then the whole-league board is available. Steal/bust badges, ROY, and awards
// come from the pure draftGrade helpers.

import { useMemo, useState } from 'react';
import { useGame } from '../state/gameStore.jsx';
import { teamName } from '../data/teams.js';
import { stealBust, gradeDraft, royWinnerId, biggestStealAndBust } from '../engine/draftGrade.js';
import CareerPage from '../components/CareerPage.jsx';

export default function ResultsScreen() {
  const { game, reset } = useGame();
  const { draft, careerResults, userTeamId } = game;
  const [view, setView] = useState('mine');
  const [revealed, setRevealed] = useState(0);

  const { leagueRows, userRows, royId, grade, big } = useMemo(() => {
    const all = draft.picks.map((pick) => ({
      pick,
      prospect: draft.prospectsById[pick.prospectId],
      result: careerResults[pick.prospectId],
      isUser: pick.teamId === userTeamId,
    }));
    const mine = all.filter((r) => r.isUser).sort((a, b) => a.pick.overall - b.pick.overall);
    return {
      leagueRows: [...all].sort((a, b) => b.result.peak - a.result.peak),
      userRows: mine,
      royId: royWinnerId(all),
      grade: gradeDraft(mine),
      big: biggestStealAndBust(all),
    };
  }, [draft, careerResults, userTeamId]);

  const allRevealed = revealed >= userRows.length;
  const card = (r) => (
    <CareerPage
      key={r.pick.overall}
      pick={r.pick}
      prospect={r.prospect}
      result={r.result}
      teamName={teamName(r.pick.teamId)}
      isUser={r.isUser}
      badge={stealBust(r.pick, r.result)}
      isRoy={r.prospect.id === royId}
    />
  );

  return (
    <div className="results">
      <header className="results__header">
        <div>
          <h1>Career Outcomes</h1>
          <p>
            {view === 'mine' && !allRevealed
              ? `Revealing your class — ${revealed} of ${userRows.length} picks in.`
              : 'How your class panned out, and the league around it.'}
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

      {/* Grade + biggest steal/bust — shown once the user's class is fully revealed. */}
      {(view === 'league' || allRevealed) && (
        <div className="scorecard">
          <div className={`scorecard__grade grade--${grade.grade[0]?.toLowerCase()}`}>
            <span className="scorecard__grade-letter">{grade.grade}</span>
            <span className="scorecard__grade-label">Your Draft</span>
          </div>
          <div className="scorecard__callouts">
            {big.steal && (
              <p className="callout callout--steal">
                <strong>Biggest steal:</strong> {big.steal.prospect.bio.name} — #{big.steal.pick.overall} to{' '}
                {teamName(big.steal.pick.teamId)}, peaked {big.steal.result.peak} ({big.steal.result.verdict})
              </p>
            )}
            {big.bust && (
              <p className="callout callout--bust">
                <strong>Biggest bust:</strong> {big.bust.prospect.bio.name} — #{big.bust.pick.overall} to{' '}
                {teamName(big.bust.pick.teamId)}, peaked {big.bust.result.peak} ({big.bust.result.verdict})
              </p>
            )}
          </div>
        </div>
      )}

      {view === 'mine' ? (
        <>
          <div className="results__grid">{userRows.slice(0, revealed).map(card)}</div>
          {!allRevealed && (
            <div className="reveal-cta">
              <button
                type="button"
                className="btn btn--draft btn--big"
                onClick={() => setRevealed((n) => n + 1)}
              >
                {revealed === 0
                  ? `Reveal your first pick (#${userRows[0]?.pick.overall})`
                  : `Reveal next pick (#${userRows[revealed]?.pick.overall})`}
              </button>
              {revealed > 0 && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => setRevealed(userRows.length)}
                >
                  Reveal all
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="results__grid">{leagueRows.map(card)}</div>
      )}
    </div>
  );
}
