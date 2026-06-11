// Name, college, and age generation for fictional prospects.
// Pools are deliberately broad so a 60-prospect class rarely repeats a full name.

const FIRST_NAMES = [
  'Jalen', 'DeAndre', 'Marcus', 'Tyrese', 'Cason', 'Amari', 'Jaylen', 'Keon',
  'Donovan', 'Trey', 'Xavier', 'Isaiah', 'Cam', 'Bryce', 'Devin', 'Malik',
  'Jaden', 'Kobe', 'Tariq', 'Emoni', 'Dariq', 'Quentin', 'Rashad', 'Obi',
  'Jamal', 'Terrence', 'Darius', 'Brandon', 'Anthony', 'Julian', 'Nolan',
  'Khalil', 'Zion', 'Ausar', 'Amen', 'Scoot', 'Brice', 'Gradey', 'Dereck',
  'Ochai', 'Bennedict', 'Jabari', 'Paolo', 'Chet', 'Keegan', 'Bilal', 'Reed',
];

const LAST_NAMES = [
  'Johnson', 'Williams', 'Carter', 'Thompson', 'Robinson', 'Jackson', 'Mitchell',
  'Walker', 'Brooks', 'Henderson', 'Coleman', 'Bridges', 'Holmes', 'Powell',
  'Reaves', 'Sanders', 'Foster', 'Hayes', 'Bennett', 'Murray', 'Banks', 'Greene',
  'Dawson', 'Ellis', 'Freeman', 'Grant', 'Hampton', 'Ingram', 'Knox', 'Lowe',
  'Maxey', 'Newton', 'Okafor', 'Porter', 'Quinn', 'Reddick', 'Spencer', 'Tatum',
  'Vance', 'Whitmore', 'Young', 'Avery', 'Booker', 'Cunningham', 'Dort', 'Edey',
];

export const COLLEGES = [
  'Duke', 'Kentucky', 'Kansas', 'North Carolina', 'UCLA', 'Gonzaga', 'Michigan',
  'Arizona', 'Baylor', 'Auburn', 'Houston', 'Tennessee', 'Texas', 'Alabama',
  'Villanova', 'Michigan State', 'Indiana', 'Connecticut', 'Purdue', 'Illinois',
  'Memphis', 'USC', 'Florida', 'Marquette', 'Creighton', 'Oregon', 'Ohio State',
  'G League Ignite', 'Overtime Elite', 'Real Madrid (Spain)', 'Mega (Serbia)',
  'Metropolitans 92 (France)', 'NBL (Australia)', 'Ratiopharm Ulm (Germany)',
];

export function generateName(rng) {
  return `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
}

export function pickCollege(rng) {
  return rng.pick(COLLEGES);
}

// Most prospects are 18-20; a few older international/senior prospects up to 23.
export function generateAge(rng) {
  return rng.int(18, 23);
}
