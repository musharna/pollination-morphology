/*
 * Roadmap item D — is the s=0 pile-up an artefact, and does it threaten the
 * ablation?
 *
 * contactSite sweeps the body CENTRELINE over s in [0,1] and takes the nearest
 * point to the organ. The sweep stops dead at s=0, so an organ lying ahead of
 * the animal's face has nowhere else to map: every such morphology collapses
 * onto one coordinate. Four of the nine species v1 evolved sit exactly there.
 *
 * That matters beyond tidiness. The s axis is the ONLY axis the L1 arms are
 * allowed to use. If a whole class of morphologies is unresolvable in s but
 * still resolvable in phi, the boundary could be manufacturing part of the
 * 3.3x headline rather than reporting it.
 *
 * Three hypotheses, and this probe is the discriminator:
 *
 *   H1  CAP-LESS COORDINATE EDGE. The centreline sweep has no forward cap, so
 *       organs ahead of the head pin at s=0 by construction.
 *       Predicts: pinned contacts have organ depth antherT > head.
 *
 *   H2  REAL CONTACT, DEGENERATE ANGLE. Touching the face IS s=0 for a capsule
 *       with a cap, so the pin is geometrically right — but phi is computed
 *       from perp = w - (w.fwd)fwd, which vanishes as the organ approaches the
 *       body axis, making the angle noise-dominated.
 *       Predicts: small |perp|/|w| on pinned contacts, and phi that swings
 *       under re-seeded wobble. THIS is the one that would void the ablation.
 *
 *   H3  NO ARTEFACT. The face is reachable by every flower geometry, so it is
 *       a low-competition placement and selection genuinely piles species there.
 *       Predicts: the pile-up survives a properly capped head.
 *
 * H1 and H2 are compatible: H1 says why s=0, H2 asks whether the separation
 * those species have is real.
 */

const P = require("../sim/placement.js");
const K = require("../sim/packing.js");
const E = require("../sim/evolve.js");

const bee = P.DEFAULT_BEE;
const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));

/* -------------------------------------------------------------------------
 * The probe duplicates contactSite's nearest-centrepoint sweep so that sim/
 * stays untouched while it is being measured. A duplicate is only worth
 * anything if it is faithful, so it self-checks against the real function's
 * reported s and the run aborts if they disagree.
 * ---------------------------------------------------------------------- */
function probe(f, target, { head, roll, wobble }) {
  const bodyT = bee.bodyLen / f.axisLen;
  const lift = P.bodyOffset(f, bee, head);
  let bestS = null,
    bestD = Infinity,
    bestQ = null,
    bestFrame = null;

  for (let s = 0; s <= 1.0001; s += 0.004) {
    const t = head - s * bodyT;
    const fr = P.axisFrame(f, t);
    const a = P.axisAt(f, t);
    const q = [
      a[0] + fr.dorsal[0] * lift + fr.lateral[0] * wobble,
      a[1] + fr.dorsal[1] * lift + fr.lateral[1] * wobble,
      a[2] + fr.dorsal[2] * lift + fr.lateral[2] * wobble,
    ];
    const d = Math.hypot(target[0] - q[0], target[1] - q[1], target[2] - q[2]);
    if (d < bestD) {
      bestD = d;
      bestS = Math.min(s, 1);
      bestQ = q;
      bestFrame = fr;
    }
  }

  const w = [target[0] - bestQ[0], target[1] - bestQ[1], target[2] - bestQ[2]];
  const wf =
    w[0] * bestFrame.fwd[0] + w[1] * bestFrame.fwd[1] + w[2] * bestFrame.fwd[2];
  const perp = [
    w[0] - bestFrame.fwd[0] * wf,
    w[1] - bestFrame.fwd[1] * wf,
    w[2] - bestFrame.fwd[2] * wf,
  ];
  const nw = Math.hypot(w[0], w[1], w[2]);
  const np = Math.hypot(perp[0], perp[1], perp[2]);
  return { s: bestS, offAxis: nw > 0 ? np / nw : 0 };
}

function evolvedCommunity() {
  const rng0 = E.makeRng(99);
  const sS = [],
    sP = [];
  for (let i = 0; i < 120; i++) {
    const d = P.placementDistribution(E.toFlower(E.randomGenome(rng0)), bee, {
      n: 60,
      seed: 500 + i,
    });
    if (d.hits.length >= 8) {
      sS.push(K.sSpread(d.hits));
      sP.push(K.phiSpread(d.hits));
    }
  }
  const ctx = {
    bee,
    nSamp: 60,
    sSd: K.median(sS),
    phiSd: K.median(sP),
    seed: 1097,
  };
  const { state } = E.run({
    arm: E.ARMS.L2,
    ctx,
    nSpecies: 40,
    generations: 400,
    sampleEvery: 100,
    k: 0.0005,
    mutRate: 0.03,
    extinctAt: 0.002,
    seed: 1,
  });
  return state.species.filter((s) => s.alive).map((s) => E.toFlower(s.g));
}

/* Replay placementDistribution's own jitter schedule so the probe sees exactly
 * the visits the model saw — a different schedule would measure a different
 * animal. */
function visits(f, n, seed) {
  const rng = P.makeRng(seed);
  const nominal = P.entryDepth(f, bee);
  const spread = P.rollSpread(f);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      head: nominal * (0.86 + 0.14 * rng()),
      roll: (rng() - 0.5) * spread,
      wobble: (rng() - 0.5) * 0.12,
    });
  }
  return out;
}

function main() {
  const flowers = evolvedCommunity();
  console.log(`evolved L2 community: ${flowers.length} species\n`);

  rule(
    "H1 / H2 — where the pinned contacts come from, and how well conditioned",
  );
  console.log(
    "  sp  antherT   head   pinned(s<0.01)   organ ahead of head   median |perp|/|w|",
  );

  let checked = 0,
    mismatch = 0;
  const rows = [];
  flowers.forEach((f, i) => {
    const target = P.antherPoint(f);
    const vs = visits(f, 200, 11 + i);
    const rng = P.makeRng(11 + i); // same seed -> same schedule, for contactSite
    const nominal = P.entryDepth(f, bee);
    const spread = P.rollSpread(f);

    let pinned = 0,
      ahead = 0,
      hits = 0;
    const offs = [],
      heads = [];
    for (let k = 0; k < 200; k++) {
      const head = nominal * (0.86 + 0.14 * rng());
      const roll = (rng() - 0.5) * spread;
      const wobble = (rng() - 0.5) * 0.12;
      const site = P.contactSite(f, bee, target, { head, roll, wobble });
      if (!site) continue;
      hits++;
      const pr = probe(f, target, { head, roll, wobble });
      checked++;
      if (Math.abs(pr.s - site.s) > 1e-9) mismatch++;
      offs.push(pr.offAxis);
      heads.push(head);
      if (site.s < 0.01) pinned++;
      if (f.antherT > head) ahead++;
    }
    if (!hits) return;
    offs.sort((a, b) => a - b);
    const medOff = offs[Math.floor(offs.length / 2)];
    const medHead = heads.sort((a, b) => a - b)[Math.floor(heads.length / 2)];
    rows.push({ i, pinned: pinned / hits, medOff });
    console.log(
      `  ${String(i).padStart(2)}   ${f.antherT.toFixed(3)}  ${medHead.toFixed(3)}` +
        `   ${(pinned / hits).toFixed(3).padStart(13)}` +
        `   ${(ahead / hits).toFixed(3).padStart(19)}` +
        `   ${medOff.toFixed(4).padStart(17)}`,
    );
  });

  if (mismatch > 0) {
    console.log(
      `\n  ABORT: probe disagreed with contactSite on ${mismatch}/${checked} sites.`,
    );
    process.exit(1);
  }
  console.log(
    `\n  probe matched contactSite on all ${checked} sites (duplicate is faithful).`,
  );

  rule("H2 — is phi stable, or is it riding a vanishing perpendicular?");
  console.log(
    "  A well-conditioned angle barely moves when the wobble is re-drawn.\n" +
      "  Reported as the circular sd of phi across 40 re-draws at FIXED head and\n" +
      "  roll, so the only thing changing is a jitter the animal cannot control.\n",
  );
  console.log(
    "  sp   pinned share   median |perp|/|w|   phi sd under re-wobble",
  );
  for (const r of rows) {
    const f = flowers[r.i];
    const target = P.antherPoint(f);
    const nominal = P.entryDepth(f, bee);
    const head = nominal * 0.93;
    const roll = 0;
    const phis = [];
    for (let k = 0; k < 40; k++) {
      const wobble = -0.06 + (0.12 * k) / 39;
      const site = P.contactSite(f, bee, target, { head, roll, wobble });
      if (site) phis.push(site.phi);
    }
    if (phis.length < 5) {
      console.log(`  ${String(r.i).padStart(2)}   (no contact at fixed head)`);
      continue;
    }
    let sx = 0,
      sy = 0;
    for (const p of phis) {
      sx += Math.cos(p);
      sy += Math.sin(p);
    }
    const R = Math.hypot(sx, sy) / phis.length;
    const sd = Math.sqrt(Math.max(0, -2 * Math.log(Math.max(R, 1e-12))));
    console.log(
      `  ${String(r.i).padStart(2)}   ${r.pinned.toFixed(3).padStart(12)}` +
        `   ${r.medOff.toFixed(4).padStart(17)}   ${sd.toFixed(3).padStart(21)}`,
    );
  }

  console.log(
    "\n  If the pinned species show a small |perp|/|w| AND a large phi sd, their\n" +
      "  separation is a numerical accident and the ablation inherits it. If phi is\n" +
      "  stable, the pin is a coordinate cosmetic and the ablation is safe.",
  );
}

main();
