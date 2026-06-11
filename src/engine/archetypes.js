// Position archetypes. Each defines plausible measurable ranges and skill/athletic
// *tendencies* (sparse overrides on a neutral baseline) so generated prospects are
// internally coherent — a rim-running center isn't 6'0" with an A+ three-point shot.
//
// `comps` supplies ceiling/floor NBA player comparisons surfaced via scouting tokens.
//
// Tendency values are 0-99 centers; the generator rolls variance around them and
// scales by the prospect's overall talent. Skills not listed fall to the baseline.

export const ARCHETYPES = [
  {
    id: 'floor-general',
    label: 'Floor General',
    position: 'PG',
    measurables: { heightIn: [73, 76], weightLb: [175, 195], wingspanIn: [75, 79] },
    athletic: { speed: 82, acceleration: 82, stamina: 80, strength: 45 },
    skills: {
      passAccuracy: 84, ballHandle: 84, speedWithBall: 82, passIQ: 86, passVision: 86,
      perimeterD: 70, steal: 74, threePoint: 72, freeThrow: 78, bballIQ: 84,
      standingDunk: 30, block: 25, offRebound: 35, defRebound: 45,
    },
    comps: {
      ceiling: ['Chris Paul', 'Tyrese Haliburton', 'Trae Young'],
      floor: ['backup floor general', 'two-way fringe rotation guard'],
    },
  },
  {
    id: 'scoring-guard',
    label: 'Shot-Creating Guard',
    position: 'SG',
    measurables: { heightIn: [75, 78], weightLb: [190, 210], wingspanIn: [78, 82] },
    athletic: { speed: 80, acceleration: 82, vertical: 78, stamina: 78 },
    skills: {
      threePoint: 82, midRange: 82, closeShot: 78, freeThrow: 80, shotIQ: 80,
      ballHandle: 82, speedWithBall: 80, drawFoul: 78, layup: 80,
      perimeterD: 64, defRebound: 45, block: 25,
    },
    comps: {
      ceiling: ['Devin Booker', 'Donovan Mitchell', 'Bradley Beal'],
      floor: ['microwave bench scorer', 'streaky combo guard'],
    },
  },
  {
    id: 'three-and-d-wing',
    label: '3&D Wing',
    position: 'SF',
    measurables: { heightIn: [78, 81], weightLb: [205, 225], wingspanIn: [81, 85] },
    athletic: { speed: 76, acceleration: 74, strength: 68, vertical: 74 },
    skills: {
      threePoint: 80, freeThrow: 76, shotIQ: 74,
      perimeterD: 84, lateralQuickness: 82, steal: 78, defensiveIQ: 80, interiorD: 66,
      defRebound: 64, ballHandle: 58,
    },
    comps: {
      ceiling: ['Kawhi Leonard', 'Paul George', 'OG Anunoby'],
      floor: ['end-of-bench 3&D wing', 'spot-up corner specialist'],
    },
  },
  {
    id: 'slashing-wing',
    label: 'Slashing Wing',
    position: 'SF',
    measurables: { heightIn: [78, 81], weightLb: [210, 230], wingspanIn: [81, 85] },
    athletic: { speed: 80, acceleration: 84, vertical: 86, strength: 70 },
    skills: {
      drivingDunk: 86, layup: 84, closeShot: 80, drawFoul: 80, speedWithBall: 80,
      ballHandle: 76, threePoint: 62, freeThrow: 68,
      perimeterD: 70, steal: 72, defRebound: 60,
    },
    comps: {
      ceiling: ['Zion Williamson', 'Jaylen Brown', 'Aaron Gordon'],
      floor: ['athletic energy wing', 'non-shooting slasher'],
    },
  },
  {
    id: 'two-way-forward',
    label: 'Two-Way Forward',
    position: 'PF',
    measurables: { heightIn: [80, 82], weightLb: [225, 245], wingspanIn: [83, 87] },
    athletic: { strength: 80, speed: 70, vertical: 78, stamina: 76 },
    skills: {
      postControl: 72, drivingDunk: 80, standingDunk: 80, layup: 76, closeShot: 76,
      threePoint: 68, freeThrow: 70,
      interiorD: 80, perimeterD: 72, block: 74, steal: 70, defensiveIQ: 78,
      offRebound: 76, defRebound: 82,
    },
    comps: {
      ceiling: ['Jayson Tatum', 'Pascal Siakam', 'Scottie Barnes'],
      floor: ['rotation combo forward', 'tweener forward'],
    },
  },
  {
    id: 'stretch-big',
    label: 'Stretch Big',
    position: 'PF',
    measurables: { heightIn: [81, 84], weightLb: [230, 250], wingspanIn: [84, 88] },
    athletic: { strength: 76, speed: 62, vertical: 70, stamina: 72 },
    skills: {
      threePoint: 80, midRange: 78, freeThrow: 78, shotIQ: 76, closeShot: 74,
      postControl: 66, standingDunk: 72,
      interiorD: 70, block: 70, defensiveIQ: 72,
      offRebound: 70, defRebound: 80, hands: 74,
    },
    comps: {
      ceiling: ['Karl-Anthony Towns', 'Lauri Markkanen', 'Kristaps Porzingis'],
      floor: ['stretch-five specialist', 'pick-and-pop bench big'],
    },
  },
  {
    id: 'rim-running-big',
    label: 'Rim-Running Big',
    position: 'C',
    measurables: { heightIn: [82, 85], weightLb: [240, 265], wingspanIn: [86, 91] },
    athletic: { strength: 84, vertical: 84, speed: 64, stamina: 72 },
    skills: {
      standingDunk: 88, drivingDunk: 80, closeShot: 78, layup: 72, hands: 78,
      drawFoul: 70, threePoint: 25, freeThrow: 55,
      interiorD: 82, block: 84, defensiveIQ: 72, lateralQuickness: 50,
      offRebound: 84, defRebound: 86,
    },
    comps: {
      ceiling: ['Bam Adebayo', 'Clint Capela', 'Walker Kessler'],
      floor: ['backup lob-threat center', 'energy big'],
    },
  },
  {
    id: 'defensive-anchor',
    label: 'Defensive Anchor Big',
    position: 'C',
    measurables: { heightIn: [83, 86], weightLb: [245, 270], wingspanIn: [88, 93] },
    athletic: { strength: 86, vertical: 78, speed: 58, durability: 70 },
    skills: {
      standingDunk: 82, closeShot: 72, postControl: 70, hands: 72,
      threePoint: 25, freeThrow: 52,
      interiorD: 88, block: 90, defensiveIQ: 84, lateralQuickness: 55,
      offRebound: 82, defRebound: 88,
    },
    comps: {
      ceiling: ['Rudy Gobert', 'Victor Wembanyama', 'Brook Lopez'],
      floor: ['defensive specialist backup', 'foul-prone project big'],
    },
  },
];
