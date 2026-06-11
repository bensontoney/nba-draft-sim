// Full prospect dossier: measurables, athleticism, grouped skill grades, scouted
// projection, and the scouting-token reveal panel. Masked skills show "?" until a
// token is spent; revealed locked items surface comps, intangibles, and sharper grades.

import {
  SKILL_GROUPS,
  SKILL_LABELS,
  ATHLETIC_KEYS,
  ATHLETIC_LABELS,
} from '../engine/attributes.js';
import { toGrade } from '../engine/grades.js';
import { isRevealed, canReveal } from '../engine/scouting.js';
import SkillGrade from './SkillGrade.jsx';

function heightStr(inches) {
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

function maskedSkillKeys(lockedItems, scouting, prospectId) {
  // A skill stays masked only while its locked item is unrevealed.
  const masked = new Set();
  for (const item of lockedItems) {
    if (item.type === 'maskedSkill' && !isRevealed(scouting, prospectId, item.id)) {
      masked.add(item.payload.skillKey);
    }
  }
  return masked;
}

function RevealedIntel({ lockedItems, scouting, prospectId, prospect }) {
  const revealedComps = [];
  const revealedTraits = [];
  let sharpened = false;
  for (const item of lockedItems) {
    if (!isRevealed(scouting, prospectId, item.id)) continue;
    if (item.type === 'comp') revealedComps.push(item.payload);
    if (item.type === 'intangible') revealedTraits.push(item.payload);
    if (item.type === 'sharpen') sharpened = true;
  }
  if (!revealedComps.length && !revealedTraits.length && !sharpened) return null;

  return (
    <div className="intel">
      {revealedComps.map((c, i) => (
        <p key={`c${i}`} className="intel__line">
          <strong>Comp:</strong> Ceiling {c.ceiling} · Floor {c.floor}
        </p>
      ))}
      {revealedTraits.map((t, i) => (
        <p key={`t${i}`} className={`intel__line intel__line--${t.positive ? 'good' : 'bad'}`}>
          <strong>Intangible:</strong> {t.trait}
        </p>
      ))}
      {sharpened && (
        <p className="intel__line">
          <strong>Film study:</strong> projection sharpened (uncertainty ±
          {prospect.scouted.uncertainty} narrowed)
        </p>
      )}
    </div>
  );
}

export default function ProspectDetail({
  prospect,
  lockedItems,
  scouting,
  onReveal,
  onDraft,
  canDraft,
}) {
  if (!prospect) {
    return <div className="detail detail--empty">Select a prospect to scout.</div>;
  }

  const { bio, measurables, athletic, skills, scouted } = prospect;
  const masked = maskedSkillKeys(lockedItems, scouting, prospect.id);

  return (
    <div className="detail">
      <div className="detail__header">
        <div>
          <h2 className="detail__name">{bio.name}</h2>
          <p className="detail__sub">
            {bio.position} · {heightStr(measurables.heightIn)} · {measurables.weightLb} lb ·{' '}
            {measurables.wingspanIn}" wing · Age {bio.age}
          </p>
          <p className="detail__sub">{bio.college}</p>
        </div>
        <div className="detail__ovr">
          <div className="detail__ovr-num">{Math.round(scouted.overall)}</div>
          <div className="detail__ovr-label">OVR · POT {toGrade(scouted.potential)}</div>
        </div>
      </div>

      {canDraft && (
        <button type="button" className="btn btn--draft" onClick={() => onDraft(prospect.id)}>
          Draft {bio.name}
        </button>
      )}

      <div className="tokens">
        <div className="tokens__head">
          <span>Scouting · {scouting.tokens} tokens left</span>
        </div>
        <div className="tokens__items">
          {lockedItems.map((item) => {
            const done = isRevealed(scouting, prospect.id, item.id);
            return (
              <button
                type="button"
                key={item.id}
                className={`token-item${done ? ' token-item--done' : ''}`}
                disabled={done || !canReveal(scouting)}
                onClick={() => onReveal(prospect.id, item.id)}
              >
                {done ? '✓ ' : '🔒 '}
                {item.label}
              </button>
            );
          })}
        </div>
        <RevealedIntel
          lockedItems={lockedItems}
          scouting={scouting}
          prospectId={prospect.id}
          prospect={prospect}
        />
      </div>

      <div className="detail__athletic">
        {ATHLETIC_KEYS.map((key) => (
          <span key={key} className="athletic-pill">
            {ATHLETIC_LABELS[key]} <strong>{athletic[key]}</strong>
          </span>
        ))}
      </div>

      <div className="skills">
        {Object.entries(SKILL_GROUPS).map(([group, keys]) => (
          <div key={group} className="skills__group">
            <h4 className="skills__title">{group}</h4>
            <div className="skills__grid">
              {keys.map((key) => (
                <SkillGrade
                  key={key}
                  label={SKILL_LABELS[key]}
                  rating={skills[key]}
                  masked={masked.has(key)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
