// A drafted player's career outcome: verdict badge, peak, and per-season stat lines.

function verdictClass(verdict) {
  return `verdict verdict--${verdict.toLowerCase().replace(/\s+/g, '-')}`;
}

export default function CareerPage({ pick, prospect, result, teamName, isUser }) {
  return (
    <div className={`career${isUser ? ' career--user' : ''}`}>
      <div className="career__head">
        <div>
          <span className="career__pickno">#{pick.overall}</span>
          <span className="career__name">{prospect.bio.name}</span>
          <span className="career__team">
            {prospect.bio.position} · {teamName}
          </span>
        </div>
        <div className="career__verdict">
          <span className={verdictClass(result.verdict)}>{result.verdict}</span>
          <span className="career__peak">Peak {result.peak}</span>
        </div>
      </div>

      {result.seasons.length > 0 && (
        <table className="career__table">
          <thead>
            <tr>
              <th>Yr</th>
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
                <td>{s.rating}</td>
                <td>{s.stats.ppg}</td>
                <td>{s.stats.rpg}</td>
                <td>{s.stats.apg}</td>
                <td className="career__note">{s.injured ? '🩹 injury' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
