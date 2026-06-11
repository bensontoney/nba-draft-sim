// The draft board: sortable/filterable prospect list, scouting detail panel, and
// the live draft order. CPU picks resolve instantly between the user's selections.

import { useMemo, useState } from 'react';
import { useGame } from '../state/gameStore.jsx';
import { isDraftComplete, isUserOnClock } from '../engine/draftFlow.js';
import { prospectValue } from '../engine/draftAI.js';
import { POSITIONS } from '../engine/attributes.js';
import ProspectCard from '../components/ProspectCard.jsx';
import ProspectDetail from '../components/ProspectDetail.jsx';
import DraftOrderPanel from '../components/DraftOrderPanel.jsx';

const SORTS = {
  potential: (a, b) => b.scouted.potential - a.scouted.potential,
  overall: (a, b) => b.scouted.overall - a.scouted.overall,
  value: (a, b) => prospectValue(b) - prospectValue(a),
};

export default function DraftScreen() {
  const { game, reveal, pick, simulate } = useGame();
  const { draft, lockedItems, scouting } = game;
  const [selectedId, setSelectedId] = useState(null);
  const [sort, setSort] = useState('potential');
  const [posFilter, setPosFilter] = useState('ALL');

  const available = useMemo(() => {
    let list = draft.availableIds.map((id) => draft.prospectsById[id]);
    if (posFilter !== 'ALL') list = list.filter((p) => p.bio.position === posFilter);
    return [...list].sort(SORTS[sort]);
  }, [draft, sort, posFilter]);

  const complete = isDraftComplete(draft);
  const userTurn = isUserOnClock(draft);
  const selected = selectedId ? draft.prospectsById[selectedId] : available[0];

  function handleDraft(prospectId) {
    pick(prospectId);
    setSelectedId(null);
  }

  return (
    <div className="draft">
      <div className="draft__list">
        <div className="draft__controls">
          <div className="seg">
            {Object.keys(SORTS).map((key) => (
              <button
                type="button"
                key={key}
                className={`seg__btn${sort === key ? ' seg__btn--on' : ''}`}
                onClick={() => setSort(key)}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="seg">
            {['ALL', ...POSITIONS].map((pos) => (
              <button
                type="button"
                key={pos}
                className={`seg__btn${posFilter === pos ? ' seg__btn--on' : ''}`}
                onClick={() => setPosFilter(pos)}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        <div className="draft__cards">
          {available.map((p) => (
            <ProspectCard
              key={p.id}
              prospect={p}
              selected={selected?.id === p.id}
              onClick={() => setSelectedId(p.id)}
            />
          ))}
          {available.length === 0 && <p className="muted">No prospects left.</p>}
        </div>
      </div>

      <div className="draft__detail">
        {complete ? (
          <div className="draft__done">
            <h2>Draft complete</h2>
            <p>All 60 picks are in. Ready to see how the careers play out?</p>
            <button type="button" className="btn btn--primary btn--big" onClick={simulate}>
              Simulate Careers
            </button>
          </div>
        ) : (
          <ProspectDetail
            prospect={selected}
            lockedItems={selected ? lockedItems[selected.id] : []}
            scouting={scouting}
            onReveal={reveal}
            onDraft={handleDraft}
            canDraft={userTurn && selected && draft.availableIds.includes(selected.id)}
          />
        )}
      </div>

      <DraftOrderPanel draft={draft} />
    </div>
  );
}
