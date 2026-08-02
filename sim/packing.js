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

/* ------------------------------------------------------- continuous overlap
 *
 * ⚠️ WHY THIS EXISTS. The histogram overlap above discretises placement into
 * S_BINS x PHI_BINS cells. When a placement is TIGHTER THAN ONE CELL it
 * collapses to a single-cell spike, and overlap degenerates to a binary
 * same-cell/different-cell test: distance information is gone, and so is the
 * meaning of tau (a threshold cannot matter if overlaps are only ever 0 or 1).
 * The packing ceiling then reports "how many cells are usable" instead of a
 * fact about geometry. Measured: at sSd 0.0109 the ceiling was 21 at EVERY
 * tau, and halving the precision to 0.0054 left it at 21.
 *
 * Raising the bin count would only move that floor, not remove it — the next
 * arm with finer placement re-trips it silently. The correct model is that
 * these are continuous distributions whose overlap has a continuous value, and
 * the histogram was an implementation shortcut for estimating it.
 *
 * So: a non-parametric estimate of the overlapping coefficient
 * OVL = integral of min(fA, fB). NON-parametric is required rather than a
 * Gaussian closed form, because L2's placements are empirical hit clouds from
 * real geometry and are not Gaussian — they have a distinct head-cap region.
 *
 * Bandwidth comes from each cloud's OWN spread (Silverman), so there is no
 * fixed resolution floor at any precision. Distances are in BIN-WIDTH UNITS so
 * the aspect ratio, and therefore tau, stays commensurate with the histogram
 * metric it replaces.
 */
const S_UNIT_W = (1 - S_LO) / S_BINS;
const PHI_UNIT_W = (2 * Math.PI) / PHI_BINS;
const KDE_M = 48; // samples retained per cloud; pairwise cost is 2*M^2

function angDelta(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/* Deterministic even subsample — no rng, so a signature is reproducible. */
function subsample(hits, m) {
  if (hits.length <= m) return hits;
  const out = [];
  for (let i = 0; i < m; i++) out.push(hits[Math.floor((i * hits.length) / m)]);
  return out;
}

function stdev(xs) {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(
    xs.reduce((a, x) => a + (x - m) * (x - m), 0) / (xs.length - 1),
  );
}

/*
 * A continuous signature: the retained points, per-axis bandwidths in bin-width
 * units, and the self-density at each point (precomputed so the pairwise cost
 * stays at 2*M^2 rather than 4*M^2).
 */
function kdeSig(hits) {
  const pts = subsample(hits, KDE_M);
  const n = pts.length;
  if (!n) return null;
  const sS = stdev(pts.map((p) => p.s)) / S_UNIT_W;
  /* Circular spread, via the resultant length, so a cloud straddling +/-pi is
   * not reported as maximally wide. */
  let cs = 0,
    sn = 0;
  for (const p of pts) {
    cs += Math.cos(p.phi);
    sn += Math.sin(p.phi);
  }
  const R = Math.sqrt(cs * cs + sn * sn) / n;
  const sP = Math.sqrt(Math.max(0, -2 * Math.log(Math.max(1e-12, R)))) / PHI_UNIT_W;
  const rule = (sd) => Math.max(1e-4, 1.06 * sd * Math.pow(n, -0.2));
  const sig = { pts, hs: rule(sS), hp: rule(sP), n };
  sig.self = pts.map((q) => density(sig, q));
  return sig;
}

/* Gaussian product kernel, distances in bin-width units. */
function density(sig, q) {
  const { pts, hs, hp, n } = sig;
  let acc = 0;
  for (const p of pts) {
    const ds = (q.s - p.s) / S_UNIT_W / hs;
    const dp = angDelta(q.phi, p.phi) / PHI_UNIT_W / hp;
    acc += Math.exp(-0.5 * (ds * ds + dp * dp));
  }
  return acc / (n * hs * hp);
}

/*
 * Symmetric estimator of the overlapping coefficient, bounded in [0, 1]:
 * identical clouds give 1, disjoint clouds give 0, and it varies CONTINUOUSLY
 * with separation at any precision.
 */
function kdeOverlap(A, B) {
  if (!A || !B) return 0;
  let a = 0;
  for (let i = 0; i < A.pts.length; i++)
    a += Math.min(1, density(B, A.pts[i]) / Math.max(1e-300, A.self[i]));
  let b = 0;
  for (let i = 0; i < B.pts.length; i++)
    b += Math.min(1, density(A, B.pts[i]) / Math.max(1e-300, B.self[i]));
  return 0.5 * (a / A.pts.length + b / B.pts.length);
}

function kdeOverlapMatrix(sigs) {
  const n = sigs.length;
  const m = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    m[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      const o = kdeOverlap(sigs[i], sigs[j]);
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
  kdeSig,
  kdeOverlap,
  kdeOverlapMatrix,
  KDE_M,
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
