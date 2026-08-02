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

/* Shared-area overlap of two normalised signatures, 0 to 1.
 *
 * ⚠️ The type guard is load-bearing. A continuous signature is an OBJECT with
 * no .length, so handing one to this function skips the loop entirely and
 * returns 0 — "these species do not overlap at all" — with no error raised. A
 * silent zero here inflates every packing ceiling that consumes it, and the
 * resulting table looks completely ordinary. Refuse instead. */
function overlap(a, b) {
  if (!a || !b || a.length === undefined || b.length === undefined)
    throw new Error(
      "overlap: expected histogram signatures; got a continuous one (use kdeOverlap)",
    );
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
/*
 * Samples retained per cloud; pairwise cost is 2*M^2.
 *
 * ⚠️ THIS CONSTANT CARRIES THE ONLY ASYMMETRIC ERROR IN THE ESTIMATOR, so it
 * is the one that can decide an arm comparison on its own. Measured against a
 * 400-point reference at identical bandwidth, retaining M points biases mean
 * pairwise overlap by:
 *
 *     M     real irregular clouds    synthetic gaussian blobs
 *     48          +0.0036                    -0.0050
 *     96          +0.0014                    -0.0024
 *    192          +0.0002                    -0.0011
 *
 * Note the OPPOSITE SIGNS. Too few points over-states overlap for an irregular
 * cloud and under-states it for a clean gaussian one, so the error does not
 * cancel between L2 and the synthetic 1-D control — it adds, and it favours the
 * control. The differential is 0.0086 at M=48 against a mean overlap near 0.06,
 * and shrinks to 0.0013 by M=192.
 *
 * Any result comparing a morphology-derived arm against a synthetic one must
 * therefore be shown to be STABLE IN M rather than quoted at one setting.
 * kdeSig takes an m override for exactly that check.
 */
const KDE_M = 96;

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

/* Interquartile range — the robust spread the bandwidth rule falls back to. */
function iqr(xs) {
  if (xs.length < 4) return Infinity;
  const a = [...xs].sort((x, y) => x - y);
  const q = (f) => a[Math.min(a.length - 1, Math.floor(f * a.length))];
  return Math.max(0, q(0.75) - q(0.25));
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
/*
 * dims: 2 is the full body surface. dims: 1 is the SAME hits with roll thrown
 * away — the continuous counterpart of sig1D, for the L1-strict arm. It is a
 * marginalisation, not a separate model: the points are unchanged and the roll
 * axis simply stops contributing distance.
 *
 * The projection theorem survives the move to a continuous metric.
 * min(integral f, integral g) >= integral min(f, g), so marginalising can only
 * RAISE the overlapping coefficient, exactly as it could only raise min-sum
 * overlap on the histogram. L2 >= L1-strict therefore remains forced rather
 * than measured. (This estimator is a finite-sample approximation of that
 * integral, so individual pairs can jitter a little either way; the direction
 * holds in aggregate and tests/packing.test.js checks it on the real pool.)
 */
function kdeSig(hits, { dims = 2, m = KDE_M } = {}) {
  const pts = subsample(hits, m);
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
  const sP =
    Math.sqrt(Math.max(0, -2 * Math.log(Math.max(1e-12, R)))) / PHI_UNIT_W;
  /*
   * ⚠️ THE BANDWIDTH RULE WAS INVESTIGATED AND LEFT ALONE — recorded because
   * the obvious-looking change here is wrong.
   *
   * L2's clouds are irregular and often multimodal while the synthetic control's
   * blobs are exactly gaussian, so the gaussian-optimal rule looked like it must
   * be over-smoothing L2 and inflating its overlap — a bias pointing straight at
   * the comparison this project exists to make. Silverman's robust variant
   * (0.9 * min(sd, IQR/1.34)) was the natural fix.
   *
   * Measured, by decomposing the estimator's error into a sample-size part and a
   * bandwidth part, that story is false. The BANDWIDTH bias is SYMMETRIC across
   * the two cloud types (+0.0108 real vs +0.0106 synthetic), so it very largely
   * cancels in any ratio between arms; and the robust rule made the residual
   * difference slightly WORSE, not better. The whole asymmetry lives in KDE_M
   * instead — see the note there. A change justified by a mechanism that turned
   * out not to exist does not get to stay just because it sounds more careful.
   */
  const rule = (sd) => Math.max(1e-4, 1.06 * sd * Math.pow(n, -0.2));
  const sig = {
    pts,
    hs: rule(sS),
    hp: dims === 1 ? 1 : rule(sP),
    dims,
    n,
  };
  sig.self = pts.map((q) => density(sig, q));
  return sig;
}

/* Gaussian product kernel, distances in bin-width units. */
function density(sig, q) {
  const { pts, hs, hp, dims, n } = sig;
  let acc = 0;
  for (const p of pts) {
    const ds = (q.s - p.s) / S_UNIT_W / hs;
    if (dims === 1) {
      acc += Math.exp(-0.5 * ds * ds);
    } else {
      const dp = angDelta(q.phi, p.phi) / PHI_UNIT_W / hp;
      acc += Math.exp(-0.5 * (ds * ds + dp * dp));
    }
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
  /* Guard the CLASS, not the instance. Comparing a 1-D signature against a 2-D
   * one silently measures nothing coherent — the roll axis contributes distance
   * for one side and not the other — and the result would still be a plausible
   * number in [0, 1]. That is exactly the failure a bounded output hides, so it
   * has to be refused rather than returned. */
  if (A.dims !== B.dims)
    throw new Error(`kdeOverlap: dimension mismatch ${A.dims} vs ${B.dims}`);
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
