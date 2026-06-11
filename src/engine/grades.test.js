import { describe, it, expect } from 'vitest';
import { toGrade, GRADE_ORDER } from './grades.js';

describe('toGrade', () => {
  it('maps top ratings to A+', () => {
    expect(toGrade(99)).toBe('A+');
    expect(toGrade(95)).toBe('A+');
  });

  it('maps mid ratings to a C band', () => {
    expect(toGrade(72)).toBe('C');
  });

  it('maps the floor to F', () => {
    expect(toGrade(40)).toBe('F');
    expect(toGrade(0)).toBe('F');
  });

  it('clamps values above 99 and below 0', () => {
    expect(toGrade(120)).toBe('A+');
    expect(toGrade(-10)).toBe('F');
  });

  it('returns grades that all exist in GRADE_ORDER', () => {
    for (let n = 0; n <= 99; n++) {
      expect(GRADE_ORDER).toContain(toGrade(n));
    }
  });

  it('is monotonic — higher ratings never give a worse grade', () => {
    let prevIdx = GRADE_ORDER.length - 1; // F is last/worst
    for (let n = 0; n <= 99; n++) {
      const idx = GRADE_ORDER.indexOf(toGrade(n));
      // index 0 is best (A+); as n rises, idx should never increase
      expect(idx).toBeLessThanOrEqual(prevIdx);
      prevIdx = idx;
    }
  });
});
