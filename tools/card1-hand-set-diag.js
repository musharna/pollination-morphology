/* Card 1 under hand-set founding (docs/2026-09-24-card1-hand-set.md): per seed and arm,
 * the last-generation receipt ratio (the card's), hybrids in that generation, generations
 * with both sets, the ratio pooled over those generations, and their median.
 * Loop is tools/northstar-null-tables.js run() with hand: true.
 *   node tools/card1-hand-set-diag.js > rows.tsv   (d seed arm last lastH nGens pooled median) */
const R = require("path").join(__dirname, "..") + "/";
const I = require(R + "sim/ibm.js"), E = require(R + "sim/evolve.js");
globalThis.IBM = I; globalThis.Evolve = E; require(R + "population-run.js");
const SR = globalThis.SandboxRun;
const mean = (x) => x.reduce((a, b) => a + b, 0) / x.length;
const isHyb = (x) => x > 0.15 && x < 0.85;
const n = 18, gens = 24, siteN = 90;
for (const d of [4, 8]) for (let seed = 1; seed <= 30; seed++) for (const rm of [true, false]) {
  const opts = { ...I.DEFAULTS, siteN, randomMating: rm };
  const built = I.foundTwoLineages(n, E.makeRng(seed), I.signalRng(seed), d, opts);
  if (!built) continue;
  const rng = E.makeRng(seed), srng = I.signalRng(seed);
  let pop = SR.foundFromGenomes([built.gA, built.gB], n, rng, srng);
  let ratio = null, lastH = 0, H = 0, Rs = 0, nh = 0, nr = 0; const per = [];
  for (let g = 0; g < gens && pop.length >= 2; g++) {
    const anc = pop.map((i) => (i.anc === undefined ? 0 : i.anc));
    const res = I.step(pop, opts, rng, g, srng);
    const h = [], r = [];
    anc.forEach((a, i) => (isHyb(a) ? h : r).push(res.received[i]));
    if (h.length && r.length) { ratio = mean(h) / mean(r); lastH = h.length; per.push(ratio);
      H += h.reduce((a,b)=>a+b,0); nh += h.length; Rs += r.reduce((a,b)=>a+b,0); nr += r.length; }
    pop = res.pop;
  }
  const pooled = nh && Rs ? (H/nh)/(Rs/nr) : null;
  const med = per.length ? per.slice().sort((a,b)=>a-b)[per.length>>1] : null;
  console.log([d, seed, rm ? "null" : "placed", ratio, lastH, per.length, pooled, med].map(v => typeof v === "number" && !Number.isInteger(v) ? v.toFixed(3) : v).join("\t"));
}
