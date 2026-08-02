/*
 * Roadmap B, step 4 — flower constancy, the mechanism the measurement named.
 *
 * WHERE THIS COMES FROM. Three results bracket the problem. Placement selection
 * in a panmictic population is stabilising; placement inheritance blends;
 * pollinator heterogeneity does not break the symmetry. That last experiment
 * ended by naming the barrier precisely rather than vaguely:
 *
 *     rare/common per-capita mating success ~ 0.26
 *
 * A novel placement is not punished for being badly built — it is punished
 * because there is NOBODY TO EXCHANGE POLLEN WITH. A second pollinator does not
 * fix that, because it does not give a rare morph partners of its own kind.
 *
 * THE HYPOTHESIS. Flower constancy: a foraging bee tends to keep visiting the
 * kind of flower it last visited (Waser 1986; Chittka, Thomson & Waser 1999).
 * This should help a RARE morph disproportionately — a common morph would be
 * revisited by chance anyway, a rare one would not — which is negative
 * frequency dependence arriving from pollinator BEHAVIOUR rather than from
 * anything about the flower. It is one of the best-documented facts in
 * pollination biology and needs no new floral mechanism at all.
 *
 * THE MEASUREMENT is the one already validated in two-pollinators.js: the SAME
 * genome at two frequencies in the same population, so quality is constant by
 * construction and the ratio isolates frequency.
 *
 *   rare/common < 1   positive frequency dependence, the population converges
 *   rare/common > 1   NEGATIVE frequency dependence — what disruptive selection
 *                     needs, and what nothing in this project has yet produced
 *
 * ⚠️ TWO CONTROLS, both required. An IDENTICAL morph must score 1.00 at every
 * constancy, since there is then no difference for frequency to act on. And
 * constancy = 0 must reproduce the earlier measurement, or this is a different
 * experiment wearing the same name.
 */

const P = require("../sim/placement.js");
const C = require("../sim/carryover.js");
const E = require("../sim/evolve.js");

const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

function meanPlacement(hits) {
  if (!hits.length) return null;
  let cs = 0,
    sn = 0;
  for (const h of hits) {
    cs += Math.cos(h.phi);
    sn += Math.sin(h.phi);
  }
  return { s: mean(hits.map((h) => h.s)), phi: Math.atan2(sn, cs) };
}
const dist = (a, b) => C.bodyDist({ s: a.s, phi: a.phi }, b.s, b.phi);

const BEE = P.DEFAULT_BEE;
const build = (g, seed) => C.siteSet(E.toFlower(g), BEE, { n: 130, seed });
const viable = (s) => s.anther.length && s.stigma.length;

/* Placement sampling is stochastic, so an individual plant can come back with no
 * contacts on an unlucky seed. Requiring all 24 at once made a whole measurement
 * null on one bad draw; the genome is fixed and only the sampling seed varies,
 * so retrying a seed is unbiased. */
function buildViable(g, seed) {
  for (let k = 0; k < 8; k++) {
    const s = build(g, seed + k * 9973);
    if (viable(s)) return s;
  }
  return null;
}

function focalPerCapita(focalG, resG, nFocal, nOther, tag, opts) {
  const n = nFocal + nOther;
  const ss = [];
  for (let i = 0; i < nFocal; i++) ss.push(buildViable(focalG, tag + i));
  for (let i = 0; i < nOther; i++) ss.push(buildViable(resG, tag + 500 + i));
  if (ss.some((x) => x === null)) return null;
  const r = C.runBout(ss, new Array(n).fill(1 / n), {
    visits: 20000,
    seed: 13,
    ...opts,
  });
  let focal = 0;
  for (let i = 0; i < nFocal; i++)
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      focal += r.T[i][j] + r.T[j][i];
    }
  return focal / nFocal;
}

/* Same genome, two frequencies, same population size. */
function freqDependence(focalG, resG, tag, opts, scale = 1) {
  /* `scale` multiplies both counts, holding the FREQUENCY fixed at 1/6 while
   * changing the absolute number of plants — which is what separates "rare" from
   * "few". */
  const nF = 4 * scale,
    nO = 20 * scale;
  const rare = focalPerCapita(focalG, resG, nF, nO, tag, opts);
  const common = focalPerCapita(focalG, resG, nO, nF, tag + 7 * scale, opts);
  if (!rare || !common || !(common > 0)) return null;
  return rare / common;
}

function pickResident(seed) {
  const rng = E.makeRng(seed);
  let best = null;
  for (let i = 0; i < 300; i++) {
    const g = E.randomGenome(rng);
    const s = build(g, 100 + i);
    if (!viable(s)) continue;
    if (!best || s.contactRate > best.rate)
      best = { g, rate: s.contactRate, s };
  }
  return best;
}

/* Morphs spanning a range of placement distances from the resident. */
function morphs(resG, resSite, n) {
  const rng = E.makeRng(77);
  const out = [];
  for (let k = 0; k < n; k++) {
    const mg = E.mutate(resG, rng, 0.15 + 1.35 * (k / n));
    const ms = build(mg, 6000 + k);
    if (!viable(ms)) continue;
    out.push({
      g: mg,
      d: dist(meanPlacement(ms.anther), meanPlacement(resSite.anther)),
    });
  }
  return out.sort((a, b) => a.d - b.d);
}

const res = pickResident(5);
const MORPHS = morphs(res.g, res.s, 30);
console.log(
  `\n  resident contact rate ${res.rate.toFixed(2)}; ${MORPHS.length} morphs spanning ` +
    `placement distance ${MORPHS[0].d.toFixed(1)}-${MORPHS[MORPHS.length - 1].d.toFixed(1)}`,
);

// ==========================================================================
rule("CONTROL 1 — an identical morph must score 1.00 at every constancy");
console.log(
  "  Same genome as the resident, so there is nothing for frequency to act on.\n" +
    "  A drift away from 1.00 as constancy rises would be bias, not biology.\n",
);
for (const constancy of [0, 0.3, 0.6, 0.9]) {
  const f = freqDependence(res.g, res.g, 90000, { constancy });
  console.log(
    `  constancy ${String(constancy).padEnd(5)}  rare/common = ${f.toFixed(3)}`,
  );
}

// ==========================================================================
rule("A — does constancy create a rare advantage?");
console.log(
  "  Morphs binned by placement distance. constancy 0 is the previously measured\n" +
    "  regime and must reproduce it (far bin around 0.26).\n",
);
const LEVELS = [0, 0.2, 0.4, 0.6, 0.8, 0.95];
const BINS = 3;
console.log(
  "  constancy   " +
    Array.from({ length: BINS }, (_, b) => `bin ${b + 1}`.padStart(9)).join(
      "",
    ) +
    "   morphs with rare advantage",
);
const table = [];
for (const constancy of LEVELS) {
  const rows = [];
  for (const m of MORPHS) {
    const f = freqDependence(m.g, res.g, 30000 + Math.round(m.d * 100), {
      constancy,
    });
    if (f !== null) rows.push({ d: m.d, f });
  }
  if (!rows.length) continue;
  const per = Math.floor(rows.length / BINS);
  const binned = [];
  for (let b = 0; b < BINS; b++)
    binned.push(
      mean(
        rows
          .slice(b * per, b === BINS - 1 ? rows.length : (b + 1) * per)
          .map((x) => x.f),
      ),
    );
  const neg = rows.filter((r) => r.f > 1).length / rows.length;
  table.push({ constancy, binned, neg });
  console.log(
    `  ${String(constancy).padEnd(11)} ` +
      binned.map((x) => x.toFixed(3).padStart(9)).join("") +
      `   ${(100 * neg).toFixed(0).padStart(3)}%`,
  );
}

rule("VERDICT");
const base = table[0],
  top = table[table.length - 1];
console.log(
  `  furthest-bin rare/common: ${base.binned[BINS - 1].toFixed(3)} at constancy ${base.constancy}` +
    ` -> ${top.binned[BINS - 1].toFixed(3)} at constancy ${top.constancy}`,
);
console.log(
  `  morphs with a rare advantage: ${(100 * base.neg).toFixed(0)}% -> ${(100 * top.neg).toFixed(0)}%`,
);
const crossed = table.find((t) => t.binned[BINS - 1] > 1);
console.log(
  crossed
    ? `\n  ✅ NEGATIVE FREQUENCY DEPENDENCE from constancy ${crossed.constancy} upward: a rare\n` +
        "  placement now does BETTER than a common one."
    : "\n  ⚠️ HYPOTHESIS REFUTED, AND IN THE WRONG DIRECTION. Constancy does not relieve\n" +
        "  the rare morph's penalty — it DEEPENS it. Part B tests why.",
);
console.log();

// ==========================================================================
// B — is this about being RARE, or about being FEW?
// ==========================================================================
/*
 * Constancy made rare morphs worse, not better. A mechanism is available and it
 * is not about frequency at all: with only four rare plants, a constant forager
 * is trapped circulating among those same four individuals, and a revisit to a
 * plant the bee has already emptied contributes nothing — self-transfer is
 * excluded from mating success. The common morph, with twenty plants, does not
 * run out of new partners.
 *
 * ⚠️ The calibration control already hinted at this: an IDENTICAL morph drifted
 * from 0.968 to 0.943 as constancy rose, and there is no real difference there
 * for frequency to act on. That drift can only be about how many individuals
 * carry the focal label.
 *
 * The discriminator: hold the FREQUENCY at 1/6 and scale the absolute counts.
 * If the penalty is about frequency it should not move. If it is about running
 * out of partners, it should weaken as the rare morph gains individuals.
 */
rule("B — DISCRIMINATOR: rare, or merely few?");
console.log(
  "  Frequency held at 1/6 throughout; only the absolute plant counts change.\n",
);
console.log("  rare/total plants   constancy 0   constancy 0.8   change");
const far = MORPHS[MORPHS.length - 3];
const scaled = [];
for (const scale of [1, 2, 3]) {
  const lo = freqDependence(
    far.g,
    res.g,
    70000 + scale * 200,
    { constancy: 0 },
    scale,
  );
  const hi = freqDependence(
    far.g,
    res.g,
    70000 + scale * 200,
    { constancy: 0.8 },
    scale,
  );
  if (lo === null || hi === null) continue;
  scaled.push({ scale, lo, hi, drop: hi - lo });
  console.log(
    `  ${String(4 * scale).padStart(4)}/${String(24 * scale).padEnd(14)} ${lo.toFixed(3).padStart(11)}   ${hi.toFixed(3).padStart(13)}   ${(hi - lo >= 0 ? "+" : "") + (hi - lo).toFixed(3)}`,
  );
}
if (scaled.length >= 2) {
  const f = scaled[0],
    l = scaled[scaled.length - 1];
  const shrank = Math.abs(l.drop) < 0.6 * Math.abs(f.drop);
  console.log(
    `\n  The constancy penalty goes ${f.drop.toFixed(3)} -> ${l.drop.toFixed(3)} as the rare morph grows from\n` +
      `  ${4 * f.scale} plants to ${4 * l.scale} at the SAME frequency, while the BASELINE eases ` +
      `${f.lo.toFixed(3)} -> ${l.lo.toFixed(3)}.`,
  );
  console.log(
    shrank
      ? "\n  The penalty is about having FEW partners, not about being rare."
      : "\n  ⚠️ THE CONSTANCY PENALTY IS SCALE-INVARIANT, so it is a genuine FREQUENCY\n" +
          "  effect and not partner exhaustion — my explanation for the refutation was\n" +
          "  wrong too. Constancy amplifies whatever the encounter rate already is: a\n" +
          "  bee that lands on the majority stays there. It REINFORCES the majority\n" +
          "  rather than protecting the minority, which is the documented minority\n" +
          "  disadvantage of flower constancy. Only the BASELINE penalty eases with\n" +
          "  population size, and that part IS partner availability.",
  );
}
console.log();
