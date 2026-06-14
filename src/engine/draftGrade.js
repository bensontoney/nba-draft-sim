// Draft payoff math — turns raw career outcomes into the emotional scoreboard:
// steal/bust badges (outcome vs. where a player was drafted), a letter grade for
// the user's class, the league ROY, and the draft's biggest steal & bust.
//
// All pure functions over { pick, result } rows so the Results UI stays thin.

// What a pick at a given draft slot is "supposed" to become. Front-of-draft picks
// are expected to be stars; value decays through the draft (log curve ≈ real value).
export function expectedPeakForSlot(slot) {
  return 83 - 16 * Math.log10(Math.max(1, slot));
}

// How far a career beat (+) or missed (−) the expectation for where it was drafted.
export function valueOverExpectation(pick, result) {
  return result.peak - expectedPeakForSlot(pick.overall);
}

// STEAL = meaningfully outperformed its slot; BUST = meaningfully underperformed.
const STEAL_THRESHOLD = 8;
const BUST_THRESHOLD = 8;

export function stealBust(pick, result) {
  const voe = valueOverExpectation(pick, result);
  if (voe >= STEAL_THRESHOLD) return 'steal';
  if (voe <= -BUST_THRESHOLD) return 'bust';
  return null;
}

// Letter grade for an average value-over-expectation across a set of picks.
export function letterForDelta(d) {
  if (d >= 9) return 'A+';
  if (d >= 6) return 'A';
  if (d >= 3.5) return 'A-';
  if (d >= 1.5) return 'B+';
  if (d >= 0) return 'B';
  if (d >= -1.5) return 'B-';
  if (d >= -3.5) return 'C+';
  if (d >= -5) return 'C';
  if (d >= -7) return 'C-';
  if (d >= -9) return 'D+';
  if (d >= -11) return 'D';
  return 'F';
}

// Grade the user's class by how much value it captured relative to slot expectation.
export function gradeDraft(rows) {
  if (!rows.length) return { grade: 'N/A', avgDelta: 0 };
  const avgDelta =
    rows.reduce((s, r) => s + valueOverExpectation(r.pick, r.result), 0) / rows.length;
  return { grade: letterForDelta(avgDelta), avgDelta };
}

// League-wide Rookie of the Year: best rookie-season (season 1) rating in the class.
// Returns the winning prospectId, or null if no rookie seasons exist.
export function royWinnerId(rows) {
  let bestId = null;
  let bestRookie = -Infinity;
  for (const r of rows) {
    const rookie = r.result.seasons[0]?.rating;
    if (rookie != null && rookie > bestRookie) {
      bestRookie = rookie;
      bestId = r.prospect.id;
    }
  }
  return bestId;
}

// The draft's single biggest steal and biggest bust (by value over expectation).
export function biggestStealAndBust(rows) {
  let steal = null;
  let bust = null;
  for (const r of rows) {
    const voe = valueOverExpectation(r.pick, r.result);
    if (steal === null || voe > steal.voe) steal = { ...r, voe };
    if (bust === null || voe < bust.voe) bust = { ...r, voe };
  }
  return { steal, bust };
}
