// Monte-Carlo calibration harness for draft-class balance.
//
// Generates many draft classes, simulates every prospect's career, and prints the
// verdict distribution + outcome stats so the generator/careerSim constants can be
// tuned until a class looks like a realistic NBA draft. Run: `node scripts/calibrate.js`.
//
// Target per 60-pick class (rough real-NBA shape):
//   Superstar ~0-2 · All-Star ~3-5 · Starter ~10-12 · Role Player ~18-22 · Bust rest

import { createRng } from '../src/engine/rng.js';
import { generateClass } from '../src/engine/generator.js';
import { simulateCareer, VERDICTS } from '../src/engine/careerSim.js';

const CLASSES = Number(process.argv[2]) || 400;
const CLASS_SIZE = 60;

const totals = Object.fromEntries(VERDICTS.map((v) => [v, 0]));
const perClassCounts = Object.fromEntries(VERDICTS.map((v) => [v, []]));
let peakSum = 0;
let lengthSum = 0;
let careerN = 0;
let steals = 0;
let busts = 0;
let allStarCareers = 0;
let mvpCareers = 0;

for (let c = 0; c < CLASSES; c++) {
  const rng = createRng(c + 1);
  const klass = generateClass(rng, CLASS_SIZE);
  const classCount = Object.fromEntries(VERDICTS.map((v) => [v, 0]));

  for (const p of klass) {
    const result = simulateCareer(p, rng, 'multi');
    totals[result.verdict]++;
    classCount[result.verdict]++;
    peakSum += result.peak;
    lengthSum += result.careerLength;
    careerN++;
    if (result.awards.allStarCount > 0) allStarCareers++;
    if (result.awards.mvpCount > 0) mvpCareers++;

    const expected = (p.scouted.overall + p.scouted.potential) / 2;
    if (result.peak - expected >= 6) steals++;
    if (expected - result.peak >= 10) busts++;
  }

  for (const v of VERDICTS) perClassCounts[v].push(classCount[v]);
}

const mean = (arr) => arr.reduce((s, n) => s + n, 0) / arr.length;
const pct = (n) => ((100 * n) / careerN).toFixed(1).padStart(5);

console.log(`\nCalibration over ${CLASSES} classes × ${CLASS_SIZE} prospects = ${careerN} careers\n`);
console.log('Verdict            per-class avg     share');
console.log('------------------------------------------');
for (const v of VERDICTS) {
  console.log(
    `${v.padEnd(14)} ${mean(perClassCounts[v]).toFixed(1).padStart(8)}        ${pct(totals[v])}%`,
  );
}
console.log('------------------------------------------');
console.log(`mean peak rating:   ${(peakSum / careerN).toFixed(1)}`);
console.log(`mean career length: ${(lengthSum / careerN).toFixed(1)} seasons`);
console.log(`careers with >=1 All-Star season: ${pct(allStarCareers)}%`);
console.log(`careers with >=1 MVP season:      ${pct(mvpCareers)}%`);
console.log(`steals (beat projection by >=6):  ${pct(steals)}%`);
console.log(`busts  (missed projection by >=10): ${pct(busts)}%`);
console.log();
