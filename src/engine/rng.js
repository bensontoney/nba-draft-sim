// Seedable pseudo-random number generator.
//
// Every randomized part of the engine draws from one of these so a draft class
// (and its simulated careers) can be reproduced exactly from a single seed —
// which is what makes the whole engine deterministically unit-testable.

// mulberry32: a small, fast, well-distributed 32-bit PRNG.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed) {
  const next = mulberry32(seed);

  const rng = {
    // Float in [0, 1).
    next,

    // Float in [min, max).
    float(min, max) {
      return min + next() * (max - min);
    },

    // Integer in [min, max] (inclusive both ends).
    int(min, max) {
      return Math.floor(min + next() * (max - min + 1));
    },

    // Random element of an array.
    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    },

    // Normally-distributed value (Box-Muller transform). Used for scouting noise.
    gaussian(mean = 0, stdev = 1) {
      let u = 0;
      let v = 0;
      while (u === 0) u = next();
      while (v === 0) v = next();
      const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      return mean + z * stdev;
    },
  };

  return rng;
}
