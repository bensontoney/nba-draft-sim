// Compact prospect row for the draft board list.

import { toGrade } from '../engine/grades.js';

function heightStr(inches) {
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

export default function ProspectCard({ prospect, selected, onClick }) {
  const { bio, scouted, measurables } = prospect;
  return (
    <button
      type="button"
      className={`prospect-card${selected ? ' prospect-card--selected' : ''}`}
      onClick={onClick}
    >
      <div className="prospect-card__main">
        <span className="prospect-card__name">{bio.name}</span>
        <span className="prospect-card__meta">
          {bio.position} · {heightStr(measurables.heightIn)} · Age {bio.age} · {bio.college}
        </span>
      </div>
      <div className="prospect-card__ratings">
        <span className="rating-pill" title="Scouted overall">
          OVR {Math.round(scouted.overall)}
        </span>
        <span className="rating-pill rating-pill--pot" title="Scouted potential">
          POT {toGrade(scouted.potential)}
        </span>
      </div>
    </button>
  );
}
