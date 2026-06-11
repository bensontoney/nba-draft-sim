// Draft order + CPU auto-pick logic.
//
// The user controls one team and picks at its slots; the other 29 teams draft
// themselves with cpuSelect. CPUs see only *scouted* values (same fog as the
// player), so they can reach on busts and pass on steals too — keeping it realistic.

// Fisher-Yates shuffle using the seeded rng (in place).
function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Build a 60-pick board: 2 rounds, same team order each round (standard NBA format).
// userSlot (1..N) fixes the user team's first-round position; null/0 randomizes it.
export function buildDraftBoard(rng, teamIds, userTeamId, userSlot) {
  const others = shuffle(teamIds.filter((id) => id !== userTeamId), rng);

  const order = [...others];
  const validSlot = Number.isInteger(userSlot) && userSlot >= 1 && userSlot <= teamIds.length;
  const insertAt = validSlot ? userSlot - 1 : rng.int(0, teamIds.length - 1);
  order.splice(insertAt, 0, userTeamId);

  const picks = [];
  let overall = 1;
  for (let round = 1; round <= 2; round++) {
    for (const teamId of order) {
      picks.push({ overall: overall++, round, teamId });
    }
  }
  return picks;
}

// Draft value: potential weighted above current ability (teams draft upside).
export function prospectValue(prospect) {
  return prospect.scouted.overall * 0.4 + prospect.scouted.potential * 0.6;
}

// Choose a prospect for a CPU team: best scouted value, nudged by positional need,
// with light randomness so runs differ and the CPU isn't a perfect optimizer.
export function cpuSelect(rng, available, roster = []) {
  const posCount = {};
  for (const p of roster) {
    posCount[p.bio.position] = (posCount[p.bio.position] || 0) + 1;
  }

  let best = null;
  let bestScore = -Infinity;
  for (const p of available) {
    const have = posCount[p.bio.position] || 0;
    const needBonus = Math.max(0, 2 - have) * 1.5; // thin at this position → small boost
    const jitter = rng.float(-3, 3);
    const score = prospectValue(p) + needBonus + jitter;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}
