// Renders a single skill as a colored letter grade. Shows "?" when the value is
// masked behind an unrevealed scouting token.

import { toGrade } from '../engine/grades.js';

function gradeColor(grade) {
  if (grade.startsWith('A')) return '#39d98a';
  if (grade.startsWith('B')) return '#7bd23a';
  if (grade.startsWith('C')) return '#e6c029';
  if (grade.startsWith('D')) return '#e08a2b';
  return '#e0533b'; // F
}

export default function SkillGrade({ label, rating, masked = false }) {
  const grade = masked ? '?' : toGrade(rating);
  const color = masked ? '#6b7280' : gradeColor(grade);
  return (
    <div className="skill-grade">
      <span className="skill-grade__label">{label}</span>
      <span className="skill-grade__value" style={{ color, borderColor: color }}>
        {grade}
      </span>
    </div>
  );
}
