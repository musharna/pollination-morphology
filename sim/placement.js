/*
 * placement.js — where does pollen land?
 *
 * Grey-box v0 of the contact model described in
 * docs/2026-07-31-groundwork-axes.md §5.2–5.3.
 *
 * The load-bearing design constraint (axis 4.5): PLACEMENT IS NEVER A GENE.
 * Nothing here takes a placement site as an input. Sites are computed from
 * flower shape + body shape + entry geometry, always.
 *
 * Coordinates
 *   Flower axis runs from the mouth (t=0) into the tube (t=1), curving
 *   dorsally. theta = 0 is dorsal (the "roof" of the tube), theta = PI is
 *   ventral (the floor, where the landing platform is).
 *   Body runs s = 0 (head) to s = 1 (tail); phi = 0 is the animal's dorsal
 *   midline, phi = +/-PI its ventral midline.
 *
 * Two mechanisms that are easy to omit and without which nothing ever touches
 * anything:
 *
 *   1. ANTHERS PROJECT. A real anther rides on a filament out into the lumen;
 *      it is not flush with the tube wall. Modelled as a fraction of the
 *      local tube radius.
 *   2. THE ANIMAL RESTS ON THE FLOOR. It is not centred on the tube axis; it
 *      sits on the ventral wall.
 *
 * Both were absent in the first version, which made contact impossible: for a
 * flush anther the dorsal clearance reduces to 2*(tubeBase - bodyRadius), so
 * contact demanded exact tangency. Mutation testing then corrected the story
 * about WHICH one fixed it — deleting the floor-rest leaves dorsal contact
 * intact, because a projecting anther reaches the animal on its own. The
 * floor-rest earns its place through PRECISION (it fixes how the body sits,
 * so the site is repeatable), not through contact.
 *
 * Nototribic vs sternotribic placement is therefore not a setting anywhere.
 * It falls out of where the anther sits relative to the floor the animal
 * stands on.
 */

// ---------------------------------------------------------------- vectors

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a) => Math.sqrt(dot(a, a));
const unit = (a) => {
  const n = norm(a);
  return n === 0 ? [0, 0, 0] : scale(a, 1 / n);
};

// ---------------------------------------------------------------- flower

/*
 * A generalised cylinder on a curved axis with per-angle radius modulation.
 * Every parameter is a SHAPE parameter. See groundwork §5.2.
 */
const DEFAULT_FLOWER = {
  axisLen: 2.4,
  mouthR: 0.78, // radius at the mouth
  throatR: 0.34, // radius at the far end
  curve: 0.3, // dorsal curvature of the axis
  polarity: 0.45, // latent dorsoventral polarity — drives 3 traits at once
  antherT: 0.55, // anther depth along the tube
  antherTheta: 0.0, // anther angle around the tube (0 = dorsal)
  antherProject: 0.3, // reach into the lumen, as a fraction of local radius
  stigmaT: 0.6,
  stigmaTheta: 0.0,
  stigmaProject: 0.3,
};

/*
 * The traits a CYCLOIDEA-like gene co-regulates (Yang 2023). Not three
 * independent knobs, because in real flowers they are not.
 */
function polarityTraits(f) {
  return {
    zygomorphy: 0.55 * f.polarity, // dorsoventral cross-section asymmetry
    platformLen: 1.1 * f.polarity, // ventral landing platform
    platformAngle: 0.55 * f.polarity, // how far it droops
  };
}

/* Axis position. t < 0 extrapolates straight out of the mouth. */
function axisAt(f, t) {
  if (t < 0) return [0, 0, t * f.axisLen];
  return [0, f.curve * t * t * f.axisLen, t * f.axisLen];
}

/* Orthonormal frame: forward along the tube, dorsal, lateral. */
function axisFrame(f, t) {
  const tt = Math.max(t, 0);
  const fwd = unit([0, 2 * f.curve * tt * f.axisLen, f.axisLen]);
  const dorsal = unit([0, f.axisLen, -2 * f.curve * tt * f.axisLen]);
  return { fwd, dorsal, lateral: cross(fwd, dorsal) };
}

/* Mean radius at depth t, before the dorsoventral asymmetry is applied. */
function tubeBase(f, t) {
  return f.mouthR + (f.throatR - f.mouthR) * Math.min(Math.max(t, 0), 1);
}

/* Radius in a given direction. Dorsal is the wide side of a zygomorphic tube. */
function tubeRadius(f, t, theta) {
  return tubeBase(f, t) * (1 + polarityTraits(f).zygomorphy * Math.cos(theta));
}

/* A point on the inner wall. */
function surfacePoint(f, t, theta) {
  const { dorsal, lateral } = axisFrame(f, t);
  const r = tubeRadius(f, t, theta);
  return add(
    axisAt(f, t),
    add(
      scale(dorsal, r * Math.cos(theta)),
      scale(lateral, r * Math.sin(theta)),
    ),
  );
}

/* A reproductive organ, carried on a filament projecting into the lumen. */
function organPoint(f, t, theta, project) {
  const { dorsal, lateral } = axisFrame(f, t);
  const r = tubeRadius(f, t, theta) * (1 - project);
  return add(
    axisAt(f, t),
    add(
      scale(dorsal, r * Math.cos(theta)),
      scale(lateral, r * Math.sin(theta)),
    ),
  );
}

const antherPoint = (f) =>
  organPoint(f, f.antherT, f.antherTheta, f.antherProject);
const stigmaPoint = (f) =>
  organPoint(f, f.stigmaT, f.stigmaTheta, f.stigmaProject);

// ------------------------------------------------------------ pollinator

/*
 * A labelled capsule chain. Regions are separate because retention and
 * grooming reach differ per region (groundwork §4.4, surface heterogeneity).
 */
const DEFAULT_BEE = {
  bodyLen: 1.75,
  regions: [
    { name: "face", s0: 0.0, s1: 0.16, r0: 0.3, r1: 0.32 },
    { name: "scutum", s0: 0.16, s1: 0.42, r0: 0.42, r1: 0.44 },
    { name: "scutellum", s0: 0.42, s1: 0.52, r0: 0.44, r1: 0.38 },
    { name: "abdomen", s0: 0.52, s1: 1.0, r0: 0.38, r1: 0.14 },
  ],
  reach: 0.85, // how far in it will push, in tube fractions
};

function bodyRadius(bee, s) {
  const c = Math.min(Math.max(s, 0), 1);
  for (const reg of bee.regions) {
    if (c >= reg.s0 && c <= reg.s1) {
      const k = (c - reg.s0) / (reg.s1 - reg.s0);
      return reg.r0 + (reg.r1 - reg.r0) * k;
    }
  }
  return bee.regions[bee.regions.length - 1].r1;
}

function regionAt(bee, s) {
  const c = Math.min(Math.max(s, 0), 1);
  for (const reg of bee.regions)
    if (c >= reg.s0 && c <= reg.s1) return reg.name;
  return bee.regions[bee.regions.length - 1].name;
}

/* Dorsal / ventral / lateral, from the angle around the animal's own body. */
function faceOf(phi) {
  const a = Math.abs(phi);
  if (a < Math.PI / 4) return "dorsal";
  if (a > (3 * Math.PI) / 4) return "ventral";
  return "lateral";
}

// ------------------------------------------------------------------ entry

const SAMPLE_S = [];
for (let s = 0; s <= 1.0001; s += 0.01) SAMPLE_S.push(Math.min(s, 1));

/*
 * How high does the animal ride? It rests on the ventral wall, so it is
 * lifted off the axis by however much its widest inserted part demands.
 * Rigid body, so one lift for the whole animal.
 */
function bodyOffset(f, bee, head) {
  const bodyT = bee.bodyLen / f.axisLen;
  const zyg = polarityTraits(f).zygomorphy;
  let lift = 0;
  for (const s of SAMPLE_S) {
    const t = head - s * bodyT;
    if (t <= 0) continue;
    const ventralWall = tubeBase(f, t) * (1 - zyg);
    lift = Math.max(lift, bodyRadius(bee, s) - ventralWall);
  }
  return lift;
}

/*
 * How far in can it get? It fits at depth t when the tube's dorsoventral span
 * accommodates its diameter — the asymmetry cancels, leaving the mean radius
 * as the constraint. Pure geometry, and the only thing enforcing the
 * tube-depth mechanic.
 */
function entryDepth(f, bee, { step = 0.005 } = {}) {
  const bodyT = bee.bodyLen / f.axisLen;
  let best = 0;
  for (let head = 0; head <= bee.reach; head += step) {
    let fits = true;
    for (const s of SAMPLE_S) {
      const t = head - s * bodyT;
      if (t <= 0) continue; // still outside the mouth
      if (bodyRadius(bee, s) > tubeBase(f, t)) {
        fits = false;
        break;
      }
    }
    if (!fits) break;
    best = head;
  }
  return best;
}

// ---------------------------------------------------------------- contact

/*
 * Given a target organ and an animal inserted to `head` depth with some roll
 * and lateral wobble, find the nearest point on the body and report the site
 * if they actually touch.
 */
function contactSite(
  f,
  bee,
  target,
  { head, roll = 0, wobble = 0, eps = 0.06 } = {},
) {
  const bodyT = bee.bodyLen / f.axisLen;
  const lift = bodyOffset(f, bee, head);
  let bestS = null;
  let bestD = Infinity;
  let bestQ = null;
  let bestFrame = null;

  for (let s = 0; s <= 1.0001; s += 0.004) {
    const t = head - s * bodyT;
    const frame = axisFrame(f, t);
    // Resting on the floor, lifted dorsally, with a little lateral wobble.
    const q = add(
      axisAt(f, t),
      add(scale(frame.dorsal, lift), scale(frame.lateral, wobble)),
    );
    const d = norm(sub(target, q));
    if (d < bestD) {
      bestD = d;
      bestS = Math.min(s, 1);
      bestQ = q;
      bestFrame = frame;
    }
  }

  const clearance = bestD - bodyRadius(bee, bestS);
  if (clearance > eps) return null; // never touched

  // Angle around the animal's own body, from its dorsal midline.
  const w = sub(target, bestQ);
  const perp = sub(w, scale(bestFrame.fwd, dot(w, bestFrame.fwd)));
  const dorsalRolled = add(
    scale(bestFrame.dorsal, Math.cos(roll)),
    scale(bestFrame.lateral, Math.sin(roll)),
  );
  const lateralRolled = cross(bestFrame.fwd, dorsalRolled);
  const phi = Math.atan2(dot(perp, lateralRolled), dot(perp, dorsalRolled));

  return {
    s: bestS,
    phi,
    region: regionAt(bee, bestS),
    face: faceOf(phi),
    clearance,
  };
}

// ----------------------------------------------------------- distributions

/*
 * How tightly is the animal's roll controlled on entry?
 *
 * This is the mechanism by which zygomorphy actually matters, and omitting it
 * leaves the CYCLOIDEA term with no path to placement at all. A radially
 * symmetric flower can be entered at any roll angle, so pollen smears around
 * the whole circumference; a bilateral flower with a landing platform fixes
 * the animal's orientation, so the site is repeatable.
 *
 * PRECISION IS THEREFORE DERIVED, never set. It is a separate axis from mean
 * position (Armbruster's accuracy framework, groundwork §4.2) and this is
 * where it comes from.
 */
function rollSpread(f) {
  const grip = Math.min(1, polarityTraits(f).platformLen);
  return Math.PI * (1 - 0.92 * grip);
}

/* Deterministic PRNG — no wall-clock, no Math.random (groundwork §5.4). */
function makeRng(seed) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  };
}

/*
 * Sample many visits with jitter. The DISTRIBUTION, not the single contact,
 * is the object of interest — Armbruster's accuracy framework needs a mean
 * and a spread, and they are separate axes (groundwork §4.2).
 */
function placementDistribution(
  f,
  bee,
  { n = 240, seed = 1, part = "anther" } = {},
) {
  const rng = makeRng(seed);
  const target = part === "stigma" ? stigmaPoint(f) : antherPoint(f);
  const nominal = entryDepth(f, bee);
  const spread = rollSpread(f);
  const hits = [];
  let misses = 0;

  for (let i = 0; i < n; i++) {
    const head = nominal * (0.86 + 0.14 * rng());
    const roll = (rng() - 0.5) * spread;
    const wobble = (rng() - 0.5) * 0.12;
    const site = contactSite(f, bee, target, { head, roll, wobble });
    if (site) hits.push(site);
    else misses++;
  }
  return { hits, misses, n, depth: nominal, contactRate: hits.length / n };
}

// ------------------------------------------------------------ the readout

const S_BINS = 18;
const PHI_BINS = 20;

function histogram(hits) {
  const h = new Float64Array(S_BINS * PHI_BINS);
  for (const p of hits) {
    const si = Math.min(S_BINS - 1, Math.max(0, Math.floor(p.s * S_BINS)));
    const pi = Math.min(
      PHI_BINS - 1,
      Math.max(0, Math.floor(((p.phi + Math.PI) / (2 * Math.PI)) * PHI_BINS)),
    );
    h[si * PHI_BINS + pi] += 1;
  }
  let total = 0;
  for (const v of h) total += v;
  if (total > 0) for (let i = 0; i < h.length; i++) h[i] /= total;
  return h;
}

/*
 * Overlap of two placement distributions on the body surface, 0 to 1. The
 * whole readout of v0: two species that place pollen on disjoint parts of one
 * shared animal cannot pollinate each other, however identical the rest of
 * their biology.
 *
 * HONEST LIMIT: this is placement overlap, not a transfer rate. It ignores
 * carryover, packaging efficiency and last-male advantage — all enumerated,
 * all deferred past v0.
 */
function placementOverlap(distA, distB) {
  if (distA.hits.length === 0 || distB.hits.length === 0) return 0;
  const a = histogram(distA.hits);
  const b = histogram(distB.hits);
  let o = 0;
  for (let i = 0; i < a.length; i++) o += Math.min(a[i], b[i]);
  return o;
}

/* Where did most of the pollen go? For the caption under the reveal. */
function dominantSite(dist) {
  if (dist.hits.length === 0) return null;
  const counts = new Map();
  for (const p of dist.hits) {
    const key = `${p.region} (${p.face})`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let bestKey = null;
  let bestN = -1;
  for (const [k, v] of counts) if (v > bestN) ((bestN = v), (bestKey = k));
  return { label: bestKey, share: bestN / dist.hits.length };
}

const API = {
  DEFAULT_FLOWER,
  DEFAULT_BEE,
  polarityTraits,
  axisAt,
  axisFrame,
  tubeBase,
  tubeRadius,
  surfacePoint,
  organPoint,
  antherPoint,
  stigmaPoint,
  bodyRadius,
  regionAt,
  faceOf,
  bodyOffset,
  entryDepth,
  contactSite,
  rollSpread,
  makeRng,
  placementDistribution,
  placementOverlap,
  dominantSite,
  histogram,
};

if (typeof module !== "undefined" && module.exports) module.exports = API;
if (typeof window !== "undefined") window.Placement = API;
