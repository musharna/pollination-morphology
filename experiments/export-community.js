/* Dump the evolved communities as raw placement sites, so the territories can
 * be drawn on the animal's body rather than summarised as a count. */
const fs = require("fs");
const P = require("../sim/placement.js");
const K = require("../sim/packing.js");
const E = require("../sim/evolve.js");

const N_SAMP = 60;
const rng0 = E.makeRng(99);
const sS = [], sP = [];
for (let i = 0; i < 120; i++) {
  const d = P.placementDistribution(E.toFlower(E.randomGenome(rng0)), P.DEFAULT_BEE, { n: N_SAMP, seed: 500 + i });
  if (d.hits.length >= 8) { sS.push(K.sSpread(d.hits)); sP.push(K.phiSpread(d.hits)); }
}
const ctx = { bee: P.DEFAULT_BEE, nSamp: N_SAMP, sSd: K.median(sS), phiSd: K.median(sP) };

const out = { arms: {} };
for (const name of ["L0", "L1", "L2"]) {
  const { state } = E.run({
    arm: E.ARMS[name], ctx: { ...ctx, seed: 1097 }, nSpecies: 40, generations: 400,
    sampleEvery: 100, k: 0.0005, mutRate: 0.03, extinctAt: 0.002, seed: 1,
  });
  const live = state.species.filter((s) => s.alive);
  out.arms[name] = live.map((s, i) => {
    let hits;
    if (name === "L2") {
      hits = P.placementDistribution(E.toFlower(s.g), P.DEFAULT_BEE, { n: 120, seed: 31 + i, part: "anther" }).hits;
    } else if (name === "L1") {
      const s0 = (s.g.antherT - 0.35) / 0.5;
      hits = K.syntheticHits(s0, 0, ctx.sSd, ctx.phiSd, { n: 120, seed: 31 + i });
    } else {
      hits = K.syntheticHits(0.5, 0, ctx.sSd, ctx.phiSd, { n: 120, seed: 31 + i });
    }
    return {
      n: +s.n.toFixed(4),
      region: P.dominantSite({ hits }) ? P.dominantSite({ hits }).label : "none",
      pts: hits.filter((_, j) => j % 2 === 0).map((h) => [+h.s.toFixed(3), +h.phi.toFixed(3)]),
    };
  });
}
out.regions = P.DEFAULT_BEE.regions.map((r) => ({ name: r.name, s0: r.s0, s1: r.s1 }));
fs.writeFileSync(process.argv[2], JSON.stringify(out));
console.log("L0", out.arms.L0.length, "· L1", out.arms.L1.length, "· L2", out.arms.L2.length, "species");
