// Canonical attribute keys for a prospect, grouped like NBA 2K.
// Shared by the generator, scouting, and UI so the schema stays consistent.

export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

// ~25 skill ratings, grouped by category. Group labels drive the UI layout.
export const SKILL_GROUPS = {
  'Outside Scoring': ['closeShot', 'midRange', 'threePoint', 'freeThrow', 'shotIQ'],
  Finishing: ['layup', 'standingDunk', 'drivingDunk', 'postControl', 'drawFoul', 'hands'],
  Playmaking: ['passAccuracy', 'ballHandle', 'speedWithBall', 'passIQ', 'passVision'],
  Defense: ['interiorD', 'perimeterD', 'steal', 'block', 'lateralQuickness', 'defensiveIQ'],
  Rebounding: ['offRebound', 'defRebound'],
  Intangibles: ['bballIQ'],
};

export const SKILL_KEYS = Object.values(SKILL_GROUPS).flat();

// Human-readable labels for each skill key (for UI).
export const SKILL_LABELS = {
  closeShot: 'Close Shot',
  midRange: 'Mid-Range',
  threePoint: 'Three-Point',
  freeThrow: 'Free Throw',
  shotIQ: 'Shot IQ',
  layup: 'Layup',
  standingDunk: 'Standing Dunk',
  drivingDunk: 'Driving Dunk',
  postControl: 'Post Control',
  drawFoul: 'Draw Foul',
  hands: 'Hands',
  passAccuracy: 'Pass Accuracy',
  ballHandle: 'Ball Handle',
  speedWithBall: 'Speed w/ Ball',
  passIQ: 'Pass IQ',
  passVision: 'Pass Vision',
  interiorD: 'Interior D',
  perimeterD: 'Perimeter D',
  steal: 'Steal',
  block: 'Block',
  lateralQuickness: 'Lateral Quickness',
  defensiveIQ: 'Defensive IQ',
  offRebound: 'Off. Rebound',
  defRebound: 'Def. Rebound',
  bballIQ: 'Basketball IQ',
};

// Athleticism attributes.
export const ATHLETIC_KEYS = [
  'speed', 'acceleration', 'strength', 'vertical', 'stamina', 'hustle', 'durability',
];

export const ATHLETIC_LABELS = {
  speed: 'Speed',
  acceleration: 'Acceleration',
  strength: 'Strength',
  vertical: 'Vertical',
  stamina: 'Stamina',
  hustle: 'Hustle',
  durability: 'Durability',
};

export const MEASURABLE_KEYS = ['heightIn', 'weightLb', 'wingspanIn'];
