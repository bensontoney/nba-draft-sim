// Converts numeric ratings (0-99) into NBA 2K-style letter grades.
//
// The engine stores and simulates everything as numbers (easy to add noise and
// develop over seasons); letter grades are purely a display layer.

// Best (A+) first → worst (F) last. Order matters for UI sorting/coloring.
export const GRADE_ORDER = [
  'A+', 'A', 'A-',
  'B+', 'B', 'B-',
  'C+', 'C', 'C-',
  'D+', 'D', 'D-',
  'F',
];

// Lower bound (inclusive) for each grade, highest band first.
const GRADE_BANDS = [
  [95, 'A+'],
  [90, 'A'],
  [87, 'A-'],
  [83, 'B+'],
  [80, 'B'],
  [77, 'B-'],
  [73, 'C+'],
  [70, 'C'],
  [67, 'C-'],
  [63, 'D+'],
  [60, 'D'],
  [55, 'D-'],
  [0, 'F'],
];

export function toGrade(rating) {
  const clamped = Math.max(0, Math.min(99, rating));
  for (const [floor, grade] of GRADE_BANDS) {
    if (clamped >= floor) return grade;
  }
  return 'F';
}
