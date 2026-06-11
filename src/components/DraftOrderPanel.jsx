// Side panel: who's on the clock, recent picks, and the user's haul so far.

import { teamName } from '../data/teams.js';
import { currentPick, isDraftComplete } from '../engine/draftFlow.js';

export default function DraftOrderPanel({ draft }) {
  const onClock = isDraftComplete(draft) ? null : currentPick(draft);
  const recent = draft.picks.slice(-8).reverse();
  const yourPicks = draft.picks.filter((p) => p.teamId === draft.userTeamId);

  return (
    <aside className="order-panel">
      <div className="order-panel__clock">
        {onClock ? (
          <>
            <div className="order-panel__pickno">Pick {onClock.overall}</div>
            <div className="order-panel__team">
              {teamName(onClock.teamId)}
              {onClock.teamId === draft.userTeamId && ' — You’re on the clock!'}
            </div>
          </>
        ) : (
          <div className="order-panel__team">Draft complete</div>
        )}
      </div>

      <h4 className="order-panel__title">Your Picks ({yourPicks.length})</h4>
      <ul className="order-panel__list">
        {yourPicks.map((p) => (
          <li key={p.overall}>
            <span className="order-panel__num">#{p.overall}</span>{' '}
            {draft.prospectsById[p.prospectId].bio.name}
          </li>
        ))}
        {yourPicks.length === 0 && <li className="order-panel__muted">None yet</li>}
      </ul>

      <h4 className="order-panel__title">Recent Picks</h4>
      <ul className="order-panel__list">
        {recent.map((p) => (
          <li key={p.overall}>
            <span className="order-panel__num">#{p.overall}</span> {teamName(p.teamId)} —{' '}
            {draft.prospectsById[p.prospectId].bio.name}
          </li>
        ))}
        {recent.length === 0 && <li className="order-panel__muted">Draft starting…</li>}
      </ul>
    </aside>
  );
}
