// Full prospect dossier: measurables, athleticism, grouped skill grades, scouted
// projection (shown as a POT range that scouting narrows), and the scouting-token
// reveal panel. Masked skills show "?" until a token is spent; revealed locked items
// surface comps, intangibles, and a sharper projection.

import {
  SKILL_GROUPS,
  SKILL_LABELS,
  ATHLETIC_KEYS,
  ATHLETIC_LABELS,
} from '../engine/attributes.js';
import { toGrade } from '../engine/grades.js';
import {
  isRevealed,
  canReveal,
  canDeepDive,
  deepDiveCost,
  effectiveUncertainty,
  potentialRange,
} from '../engine/scouting.js';
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

// Visual POT band — the lower/upper bound where the ceiling plausibly sits. The fill
// shrinks as uncertainty drops (e.g. after a "sharpen" token), so the payoff is felt.
function ProjectionBand({ prospect, lockedItems, scouting }) {
  const uncertainty = effectiveUncertainty(prospect, lockedItems, scouting);
  const { low, high } = potentialRange(prospect.scouted.potential, uncertainty);
  const span = 99 - 40;
  const leftPct = ((low - 40) / span) * 100;
  const widthPct = ((high - low) / span) * 100;
  const sharp = uncertainty <= prospect.scouted.uncertainty / 2;
  return (
    <div className="band">
      <div className="band__labels">
        <span>POT projection</span>
        <span className="band__range">
          {toGrade(low)}–{toGrade(high)}
          {sharp && <span className="band__tag"> · sharpened</span>}
        </span>
      </div>
      <div className="band__track">
        <div
          className={`band__fill${sharp ? ' band__fill--sharp' : ''}`}
          style={{ left: `${leftPct}%`, width: `${Math.max(2, widthPct)}%` }}
        />
      </div>
    </div>
  );
}

function RevealedIntel({ lockedItems, scouting, prospectId }) {
  const revealedComps = [];
  const revealedTraits = [];
  for (const item of lockedItems) {
    if (!isRevealed(scouting, prospectId, item.id)) continue;
    if (item.type === 'comp') revealedComps.push(item.payload);
    if (item.type === 'intangible') revealedTraits.push(item.payload);
  }
  if (!revealedComps.length && !revealedTraits.length) return null;

  return (
    <div className="intel">
      {revealedComps.map((c, i) => (
        <p key={`c${i}`} className="intel__line">
          <strong>Comp:</strong> Ceiling {c.ceiling} · Floor {c.floor}
        </p>
      ))}
      {revealedTraits.map((t, i) => (
        <p
          key={`t${i}`}
          className={`intel__line intel__line--${t.neutral ? 'neutral' : t.positive ? 'good' : 'bad'}`}
        >
          <strong>Intangible:</strong> {t.trait}
        </p>
      ))}
    </div>
  );
}

export default function ProspectDetail({
  prospect,
  lockedItems,
  scouting,
  onReveal,
  onDeepDive,
  onDraft,
  canDraft,
}) {
  if (!prospect) {
    return <div className="detail detail--empty">Select a prospect to scout.</div>;
  }

  const { bio, measurables, athletic, skills, scouted } = prospect;
  const masked = maskedSkillKeys(lockedItems, scouting, prospect.id);
  const diveOk = canDeepDive(scouting, lockedItems, prospect.id);
  const diveCost = deepDiveCost(lockedItems, scouting, prospect.id);

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
          <div className="detail__ovr-label">OVR</div>
        </div>
      </div>

      <ProjectionBand prospect={prospect} lockedItems={lockedItems} scouting={scouting} />

      {canDraft && (
        <button type="button" className="btn btn--draft" onClick={() => onDraft(prospect.id)}>
          Draft {bio.name}
        </button>
      )}

      <div className="tokens">
        <div className="tokens__head">
          <span>Scouting · {scouting.tokens} tokens left</span>
          {onDeepDive && lockedItems.length > 1 && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={!diveOk}
              onClick={() => onDeepDive(prospect.id)}
            >
              Deep dive ({diveCost} 🪙)
            </button>
          )}
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
        <RevealedIntel lockedItems={lockedItems} scouting={scouting} prospectId={prospect.id} />
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
