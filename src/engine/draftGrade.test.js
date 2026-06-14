import { describe, it, expect } from 'vitest';
import {
  expectedPeakForSlot,
  valueOverExpectation,
  stealBust,
  letterForDelta,
  gradeDraft,
  royWinnerId,
  biggestStealAndBust,
} from './draftGrade.js';

const row = (overall, peak, rookie = peak, id = `p${overall}`) => ({
  pick: { overall },
  prospect: { id },
  result: { peak, seasons: rookie == null ? [] : [{ rating: rookie }] },
});

describe('expectedPeakForSlot', () => {
  it('expects more from earlier picks', () => {
    expect(expectedPeakForSlot(1)).toBeGreaterThan(expectedPeakForSlot(15));
    expect(expectedPeakForSlot(15)).toBeGreaterThan(expectedPeakForSlot(60));
  });

  it('treats the #1 pick as a near-star expectation', () => {
    expect(expectedPeakForSlot(1)).toBeCloseTo(83, 0);
  });
});

describe('stealBust', () => {
  it('flags a late pick who massively outperformed as a steal', () => {
    expect(stealBust({ overall: 45 }, { peak: 85 })).toBe('steal');
  });

  it('flags an early pick who flopped as a bust', () => {
    expect(stealBust({ overall: 2 }, { peak: 60 })).toBe('bust');
  });

  it('returns null for an on-expectation outcome', () => {
    const slot = 10;
    const onPar = Math.round(expectedPeakForSlot(slot));
    expect(stealBust({ overall: slot }, { peak: onPar })).toBeNull();
  });

  it('valueOverExpectation is positive for a steal, negative for a bust', () => {
    expect(valueOverExpectation({ overall: 50 }, { peak: 85 })).toBeGreaterThan(0);
    expect(valueOverExpectation({ overall: 1 }, { peak: 55 })).toBeLessThan(0);
  });
});

describe('letterForDelta / gradeDraft', () => {
  it('maps deltas to a sensible letter ladder', () => {
    expect(letterForDelta(10)).toBe('A+');
    expect(letterForDelta(0)).toBe('B');
    expect(letterForDelta(-12)).toBe('F');
  });

  it('grades a class of steals highly and a class of busts poorly', () => {
    const steals = [row(40, 85), row(50, 84), row(60, 80)];
    const busts = [row(1, 55), row(3, 52), row(5, 50)];
    expect(['A+', 'A', 'A-']).toContain(gradeDraft(steals).grade);
    expect(['F', 'D', 'D+']).toContain(gradeDraft(busts).grade);
  });

  it('returns N/A for an empty class', () => {
    expect(gradeDraft([]).grade).toBe('N/A');
  });
});

describe('royWinnerId', () => {
  it('picks the prospect with the best rookie-season rating', () => {
    const rows = [row(1, 90, 70, 'a'), row(2, 80, 78, 'b'), row(3, 75, 60, 'c')];
    expect(royWinnerId(rows)).toBe('b');
  });

  it('returns null when nobody has a rookie season', () => {
    expect(royWinnerId([row(1, 80, null, 'a')])).toBeNull();
  });
});

describe('biggestStealAndBust', () => {
  it('identifies the extreme over- and under-performer', () => {
    const rows = [row(1, 80, 80, 'a'), row(55, 88, 88, 'steal'), row(2, 50, 50, 'bust')];
    const { steal, bust } = biggestStealAndBust(rows);
    expect(steal.prospect.id).toBe('steal');
    expect(bust.prospect.id).toBe('bust');
  });
});
