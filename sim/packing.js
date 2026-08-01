/*
 * How many species can coexist on one shared pollinator?
 *
 * Two species can coexist reproductively if the pollen they place on the
 * shared animal lands in sufficiently different places — pairwise placement
 * overlap at or below a threshold tau. The number of species that can be
 * mutually compatible at a given tau is the PACKING CEILING, and groundwork
 * §4.4 predicts that ceiling is where a 2-D placement surface beats a 1-D
 * placement axis.
 *
 * Everything here is a pure function of hit lists. The point of routing every
 * arm of the ablation through ONE overlap metric and ONE packing algorithm is
 * that an arm can only differ in the thing being ablated — the geometry of the
 * placement space — and never in how it is scored.
 */

/*
 * Along-body binning runs from the front of the head's cap to the tail.
 *
 * S_UNITS is the RESOLUTION — bins per body length — and is what sets how
 * finely two species must differ to count as separated. S_EXTRA prepends bins
 * ahead of the spine end for the head's forward cap, where contacts with organs
 * deeper than the head can reach now land (see the cap note in placement.js).
 *
 * The extra bins are prepended AT THE SAME WIDTH deliberately. That makes
 * binning for s >= 0 a pure index shift, so every species that never touches
 * the cap keeps a numerically identical histogram and identical overlaps — and
 * the before/after comparison for the cap fix isolates the cap rather than
 * silently moving every number in the project. tests/head-cap.test.js pins it.
 */
const S_UNITS = 18;
const S_EXTRA = 6;
const S_BINS = S_UNITS + S_EXTRA;
const S_LO = -S_EXTRA / S_UNITS;
const PHI_BINS = 20;

/* ---------------------------------------------------------------- signatures
 *
 * A signature is a normalised occupancy vector over the animal's body. The
 * ONLY difference between the L1 and L2 arms is which signature is used, so
 * the ablation is a one-line change rather than a second implementation.
 */

/* L2: the full 2-D body surface — position along the body AND roll around it. */
function sig2D(hits) {
  const h = new Float64Array(S_BINS * PHI_BINS);
  for (const p of hits) h[sBin(p.s) * PHI_BINS + phiBin(p.phi)] += 1;
  return normalise(h);
}

/*
 * L1: the same hits with roll thrown away — placement collapses to a single
 * coordinate along the body.
 *
 * NOTE THE FORCED DIRECTION. Marginalising a joint histogram can only ever
 * increase the min-sum overlap of two distributions, so L2 >= L1-strict is a
 * theorem about projection, not a finding about biology. What is NOT forced,
 * and is the actual measurement, is the MAGNITUDE: if the reachable placements
 * all sit in a thin ribbon at one roll angle, discarding roll costs nothing
 * and the third dimension is decorative. That is the failure this arm exists
 * to be able to report.
 */
function sig1D(hits) {
  const h = new Float64Array(S_BINS);
  for (const p of hits) h[sBin(p.s)] += 1;
  return normalise(h);
}

const sBin = (s) =>
  Math.min(S_BINS - 1, Math.max(0, Math.floor((s - S_LO) * S_UNITS)));
const phiBin = (phi) =>
  Math.min(
    PHI_BINS - 1,
    Math.max(0, Math.floor(((phi + Math.PI) / (2 * Math.PI)) * PHI_BINS)),
  );

function normalise(h) {
  let total = 0;
  for (const v of h) total += v;
  if (total > 0) for (let i = 0; i < h.length; i++) h[i] /= total;
  return h;
}

/* Shared-area overlap of two normalised signatures, 0 to 1. */
function overlap(a, b) {
  let o = 0;
  for (let i = 0; i < a.length; i++) o += Math.min(a[i], b[i]);
  return o;
}

function overlapMatrix(sigs) {
  const n = sigs.length;
  const m = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    m[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      const o = overlap(sigs[i], sigs[j]);
      m[i][j] = o;
      m[j][i] = o;
    }
  }
  return m;
}

/* ------------------------------------------------------------------ packing
 *
 * Largest set of species that are pairwise compatible (overlap <= tau) — a
 * maximum independent set, which is NP-hard, so this is randomised greedy with
 * restarts and reports the best found. It is a LOWER BOUND on the true
 * ceiling. Every arm runs the identical routine with the identical restart
 * count, so any weakness in the heuristic applies equally to all of them and
 * cannot manufacture a difference between arms.
 */
function packingCeiling(mat, tau, { restarts = 200, seed = 1 } = {}) {
  const n = mat.length;
  if (n === 0) return { size: 0, members: [] };
  let rng = seed >>> 0 || 1;
  const next = () => {
    rng ^= rng << 13;
    rng ^= rng >>> 17;
    rng ^= rng << 5;
    return (rng >>> 0) / 4294967296;
  };

  let best = [];
  for (let r = 0; r < restarts; r++) {
    const order = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const chosen = [];
    for (const cand of order) {
      let ok = true;
      for (const c of chosen) {
        if (mat[cand][c] > tau) {
          ok = false;
          break;
        }
      }
      if (ok) chosen.push(cand);
    }
    if (chosen.length > best.length) best = chosen;
  }
  return { size: best.length, members: best.sort((a, b) => a - b) };
}

/* ------------------------------------------------- synthetic placement sites
 *
 * For the steelman and control arms, which are not derived from any
 * morphology. A species is a blob of visits centred on (s0, phi0) with a given
 * spread; roll wraps because it is an angle around the body.
 */
function syntheticHits(
  s0,
  phi0,
  sSd,
  phiSd,
  { n = 240, seed = 1, sLo = 0 } = {},
) {
  let rng = seed >>> 0 || 1;
  const next = () => {
    rng ^= rng << 13;
    rng ^= rng >>> 17;
    rng ^= rng << 5;
    return (rng >>> 0) / 4294967296;
  };
  /* Box-Muller, so the synthetic arms get a real gaussian rather than a
   * uniform box that would pack differently for reasons of shape alone. */
  const gauss = () =>
    Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next());

  const hits = [];
  for (let i = 0; i < n; i++) {
    let s = s0 + gauss() * sSd;
    /* Off the end of the animal. sLo defaults to 0 — the spine end — so the
     * synthetic arms keep the domain they had. The ablation passes the bee's
     * actual cap extent instead, because a steelman confined to a smaller
     * surface than the real animal gets would be a rigged comparison. */
    if (s < sLo || s > 1) continue;
    let phi = phi0 + gauss() * phiSd;
    while (phi > Math.PI) phi -= 2 * Math.PI;
    while (phi < -Math.PI) phi += 2 * Math.PI;
    hits.push({ s, phi });
  }
  return hits;
}

/* ------------------------------------------------------- spread measurement
 *
 * Precision must be MATCHED across arms or the comparison is rigged: a
 * steelman handed tighter blobs than the real geometry produces would pack
 * more species for a reason that has nothing to do with dimensionality. These
 * read the real spread off the L2 distributions so the synthetic arms inherit
 * it rather than being assigned a number by hand.
 */
function sSpread(hits) {
  const mean = hits.reduce((a, h) => a + h.s, 0) / hits.length;
  const v = hits.reduce((a, h) => a + (h.s - mean) ** 2, 0) / hits.length;
  return Math.sqrt(v);
}

/* Circular standard deviation of roll, in radians. */
function phiSpread(hits) {
  const c = hits.reduce((a, h) => a + Math.cos(h.phi), 0) / hits.length;
  const s = hits.reduce((a, h) => a + Math.sin(h.phi), 0) / hits.length;
  const R = Math.min(1, Math.sqrt(c * c + s * s));
  if (R < 1e-9) return Math.PI;
  return Math.sqrt(-2 * Math.log(R));
}

const median = (xs) => {
  const a = [...xs].sort((x, y) => x - y);
  return a.length % 2
    ? a[(a.length - 1) / 2]
    : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
};

const API = {
  S_BINS,
  S_UNITS,
  S_EXTRA,
  S_LO,
  sBin,
  PHI_BINS,
  sig1D,
  sig2D,
  overlap,
  overlapMatrix,
  packingCeiling,
  syntheticHits,
  sSpread,
  phiSpread,
  median,
};

if (typeof module !== "undefined" && module.exports) module.exports = API;
if (typeof window !== "undefined") window.Packing = API;
