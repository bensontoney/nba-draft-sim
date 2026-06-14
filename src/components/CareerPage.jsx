// A drafted player's career outcome: steal/bust badge, verdict, an age-arc
// sparkline of the full career, award chips, and per-season stat lines.

function verdictClass(verdict) {
  return `verdict verdict--${verdict.toLowerCase().replace(/\s+/g, '-')}`;
}

// Tiny inline SVG of rating over the career — the visual "shape" of the arc.
function ArcSparkline({ seasons, peak }) {
  if (seasons.length < 2) return null;
  const W = 220;
  const H = 40;
  const pad = 3;
  const ratings = seasons.map((s) => s.rating);
  const lo = Math.min(...ratings) - 2;
  const hi = Math.max(...ratings) + 2;
  const span = Math.max(1, hi - lo);
  const x = (i) => pad + (i / (seasons.length - 1)) * (W - 2 * pad);
  const y = (r) => H - pad - ((r - lo) / span) * (H - 2 * pad);
  const points = seasons.map((s, i) => `${x(i)},${y(s.rating)}`).join(' ');
  const peakIdx = ratings.indexOf(peak);

  return (
    <svg className="arc" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline className="arc__line" points={points} />
      {peakIdx >= 0 && <circle className="arc__peak" cx={x(peakIdx)} cy={y(peak)} r="2.5" />}
    </svg>
  );
}

function AwardChips({ awards, isRoy }) {
  const chips = [];
  if (isRoy) chips.push(['🏆 ROY', 'roy']);
  if (awards.mvpCount > 0) chips.push([`MVP ×${awards.mvpCount}`, 'mvp']);
  if (awards.allStarCount > 0) chips.push([`All-Star ×${awards.allStarCount}`, 'as']);
  if (!chips.length) return null;
  return (
    <div className="awards">
      {chips.map(([label, key]) => (
        <span key={key} className={`award award--${key}`}>{label}</span>
      ))}
    </div>
  );
}

export default function CareerPage({ pick, prospect, result, teamName, isUser, badge, isRoy }) {
  return (
    <div className={`career${isUser ? ' career--user' : ''}`}>
      <div className="career__head">
        <div>
          <span className="career__pickno">#{pick.overall}</span>
          <span className="career__name">{prospect.bio.name}</span>
          {badge && <span className={`badge badge--${badge}`}>{badge === 'steal' ? 'STEAL' : 'BUST'}</span>}
          <span className="career__team">
            {prospect.bio.position} · {teamName} · {result.careerLength} yr career
          </span>
        </div>
        <div className="career__verdict">
          <span className={verdictClass(result.verdict)}>{result.verdict}</span>
          <span className="career__peak">Peak {result.peak}</span>
        </div>
      </div>

      <AwardChips awards={result.awards} isRoy={isRoy} />
      <ArcSparkline seasons={result.seasons} peak={result.peak} />

      {result.seasons.length > 0 && (
        <table className="career__table">
          <thead>
            <tr>
              <th>Yr</th>
              <th>Age</th>
              <th>OVR</th>
              <th>PPG</th>
              <th>RPG</th>
              <th>APG</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {result.seasons.map((s) => (
              <tr key={s.season}>
                <td>{s.season}</td>
                <td>{s.age}</td>
                <td>{s.rating}</td>
                <td>{s.stats.ppg}</td>
                <td>{s.stats.rpg}</td>
                <td>{s.stats.apg}</td>
                <td className="career__note">
                  {s.allStar ? '⭐' : ''}{s.injured ? '🩹' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
