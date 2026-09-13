#!/usr/bin/env node
/*
 * northstar-null-tables.js — the per-seed NULL TABLES behind every "why you
 * failed" card in docs/superpowers/specs/2026-09-12-northstar-design.md §4.
 *
 * WHY THIS EXISTS. The round-3 panel (2026-09-13) showed that a card band set
 * at a null arm's MEAN is crossed by single null seeds: card 1's "ratio < 1"
 * opened on 15 of 28 null seeds at the page config. A card may only open when
 * the run's measurement clears the EDGE of the null distribution — the most
 * extreme value any null seed reached — so the edge has to be tabulated, per
 * seed, at the configuration the card is read at, and committed with its
 * command. This file is that tabulation. It changes nothing under sim/ and
 * registers nothing; it is a probe of what the engine at HEAD does.
 *
 * Every row is one seed, one arm. `summarise` reads the rows back and prints
 * the edge each card's threshold is set from; the spec quotes those numbers.
 *
 * Usage (from the repository root; each call is bounded to run under 10 min):
 *   node tools/northstar-null-tables.js card14 page  <seedFrom> <seedTo>
 *   node tools/northstar-null-tables.js card14 level <seedFrom> <seedTo>
 *   node tools/northstar-null-tables.js card23 d8    <seedFrom> <seedTo>
 *   node tools/northstar-null-tables.js card23 d4    <seedFrom> <seedTo>
 *   node tools/northstar-null-tables.js card5  -     <seedFrom> <seedTo>
 *   node tools/northstar-null-tables.js card6  -     <seedFrom> <seedTo>
 *   node tools/northstar-null-tables.js card23 rm8   <seedFrom> <seedTo>   (round 4: the same
 *       seeds under randomMating, a = 1 and a = 0.25 — a second null for cards 2 and 3)
 *   node tools/northstar-null-tables.js card6null -  <seedFrom> <seedTo>   (round 4: shuffled
 *       against shuffled at a second width stream — a per-seed null for card 6)
 *   node tools/northstar-null-tables.js summarise <row files...>
 *   node tools/northstar-null-tables.js edges <row files...>              (round 4: re-runs the
 *       seed that defines each edge at full precision and rounds the edge OUTWARD)
 * The committed output is docs/2026-09-13-northstar-null-tables.md.
 *
 * ROUND 4 (2026-09-13). Rows print to three decimals and `summarise` took the
 * max/min of the printed rows, so card 2's edge 0.433 was the ROUNDED value of
 * seed 13's peak 0.4333..., which is above 0.433: an edge defined by a seed was
 * crossed by that seed. `edges` re-runs the defining seed at full precision and
 * rounds outward (an upper edge up, a lower edge down, one more step if the
 * rounding lands exactly on the value), so the defining seed sits strictly on
 * the null side of the committed edge. NST_PRECISION=full prints any mode's
 * rows unrounded.
 */
const R = require("path").join(__dirname, "..") + "/";
const I = require(R + "sim/ibm.js");
const E = require(R + "sim/evolve.js");
const { selfingFor } = require(R + "experiments/selfing-arms.js");

const mean = (x) => x.reduce((a, b) => a + b, 0) / x.length;
const sd = (xs) => {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
};
/* hybrid = ancestry strictly in (0.15, 0.85), experiments/hybrids-or-balance.js:87 */
const isHyb = (x) => x > 0.15 && x < 0.85;
const FULL = process.env.NST_PRECISION === "full";
const f = (x) =>
  x == null
    ? "null"
    : Number.isFinite(x)
      ? FULL
        ? String(x)
        : x.toFixed(3)
      : String(x);
/* outward rounding to three decimals: the committed edge must not be crossed
 * by the seed that defines it (round 4). */
const outUp = (x) => {
  let e = Math.ceil(x * 1000) / 1000;
  if (e <= x) e = (Math.ceil(x * 1000) + 1) / 1000;
  return e;
};
const outDown = (x) => {
  let e = Math.floor(x * 1000) / 1000;
  if (e >= x) e = (Math.floor(x * 1000) - 1) / 1000;
  return e;
};

/* the page config (population.html:194-198, sim/ibm.js:600) and the level
 * config every cited experiment ran (experiments/secondary-contact.js:66-69) */
const CONFIGS = {
  page: { n: 18, gens: 24, siteN: 90 },
  level: { n: 30, gens: 35, siteN: 160 },
};

/* cards 1 and 4: the page loop, step(pop, opts, rng, g, srng) as
 * population.html:754-760 and tests/browser-bundle.test.js:183 drive it;
 * founded by foundTwoLineages at target d (population.html:727). Also the
 * gap-occupancy quantities cards 2 and 3 read, against the founding
 * placements held fixed (docs/ROADMAP.md:252-253). */
function run({ n, gens, siteN, seed, d, randomMating = false, extra = {} }) {
  const opts = { ...I.DEFAULTS, siteN, randomMating, ...extra };
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const built = I.foundTwoLineages(n, rng, srng, d, opts);
  if (!built) return null;
  const placeOf = (g) =>
    I.sitesOf([{ h1: g, h2: g }], opts, 0).map(I.placementOf)[0];
  const pA = placeOf(built.gA);
  const pB = placeOf(built.gB);
  const v0 = I.ancestryVar(built.pop);
  let pop = built.pop;
  let extinct = false;
  let hybGens = 0;
  let ratio = null;
  const gaps = [];
  const vars = [];
  for (let g = 0; g < gens; g++) {
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    const anc = pop.map((i) => (i.anc === undefined ? 0 : i.anc));
    const res = I.step(pop, opts, rng, g, srng);
    const h = [];
    const r = [];
    anc.forEach((a, i) => (isHyb(a) ? h : r).push(res.received[i]));
    if (h.length) hybGens++;
    if (h.length && r.length) ratio = mean(h) / mean(r);
    gaps.push(I.gapOccupancy(res.places, pA, pB).gap);
    vars.push(res.ancVar);
    pop = res.pop;
  }
  /* card 2's ordering: the generation the gap first held 10% of plants
   * against the generation ancestry variance first halved
   * (docs/2026-08-05-gap-occupancy.md:66-68) */
  const tGap = gaps.findIndex((x) => x >= 0.1);
  const tAnc = vars.findIndex((v) => v <= 0.5 * v0);
  return {
    realised: built.realised,
    fate: I.fateOf(pop, v0, extinct),
    hybGens,
    gens: gaps.length,
    ratio,
    peak: Math.max(...gaps),
    gmean: mean(gaps),
    tGap,
    tAnc,
  };
}

/* card 5: experiments/rare-floor.js replicate() rebuilt (:28-32,114-172):
 * N0 = 30, 35 generations, siteN 160, d = 8, phenology 8 slices width 0.12,
 * visitsPerPlant 800, arms from experiments/selfing-arms.js */
function rareFloor(seed, self) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const crng = self && self.cover != null ? I.coverRng(seed) : null;
  const opts = {
    ...I.DEFAULTS,
    siteN: 160,
    phenology: { slices: 8, width: 0.12 },
    visitsPerPlant: 800,
  };
  if (self) opts.selfing = self;
  const b = I.foundTwoLineages(30, rng, srng, 8, opts);
  if (!b) return null;
  let pop = b.pop;
  let extinct = false;
  const v0 = I.ancestryVar(pop);
  for (let g = 0; g < 35; g++) {
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    opts.phenology.displayProportionalVisits = false;
    pop = I.step(pop, opts, rng, g, srng, brng, null, crng).pop;
  }
  return { fate: I.fateOf(pop, v0, extinct) };
}

/* card 6: experiments/evolving-width.js replicate() rebuilt under the
 * conserved-display arm docs/FINDINGS.md:115-117 quotes: 30 plants, 35
 * generations, siteN 160, d = 8, S = 8, widthMut 0.03, conserveDisplay.
 * `width` is the experiment's own statistic, the mean expressed width over
 * the last five generations (evolving-width.js `wMean.slice(-5)`). */
function widthRun(seed, phen, wseed = seed) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  /* `wseed` differs from `seed` only in card6null's second shuffled arm: the
   * width stream (sim/ibm.js:1131, a plain parameter) is the one thing that
   * arm changes, so the paired difference between two shuffled runs is a null
   * draw for card 6's treatment-minus-shuffled statistic. */
  const wrng = phen.widthLocus ? I.widthRng(wseed) : null;
  const opts = { ...I.DEFAULTS, siteN: 160, phenology: phen };
  const built = I.foundTwoLineages(30, rng, srng, 8, opts);
  if (!built) return null;
  let pop = built.pop;
  const v0 = I.ancestryVar(pop);
  const wMean = [];
  let extinct = false;
  for (let g = 0; g < 35; g++) {
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    const res = I.step(pop, opts, rng, g, srng, brng, wrng);
    if (res.widths) wMean.push(mean(res.widths));
    pop = res.pop;
  }
  return {
    fate: I.fateOf(pop, v0, extinct),
    width: wMean.length ? mean(wMean.slice(-5)) : null,
    widthStart: wMean.length ? wMean[0] : null,
  };
}

function seeds(a, b) {
  const out = [];
  for (let s = Number(a); s <= Number(b); s++) out.push(s);
  return out;
}

function main(argv) {
  const [mode, sub, from, to] = argv;
  if (mode === "card14") {
    const c = CONFIGS[sub];
    if (!c) throw new Error("card14 needs page|level");
    console.log(
      `# card14 ${sub} N=${c.n} gens=${c.gens} siteN=${c.siteN} seeds ${from}-${to}`,
    );
    for (const seed of seeds(from, to))
      for (const d of [8, 4])
        for (const rm of [false, true]) {
          const x = run({ ...c, seed, d, randomMating: rm });
          if (!x) {
            console.log(`card14 ${sub} d=${d} seed ${seed} nobuild`);
            continue;
          }
          console.log(
            `card14 ${sub} d=${d} seed ${seed} ${rm ? "null" : "placed"} realised ${f(x.realised)} fate ${x.fate} hybGens ${x.hybGens}/${x.gens} ratio ${f(x.ratio)}`,
          );
        }
  } else if (mode === "card23") {
    /* rm8 / rm4 (round 4): the same seeds under randomMating. Parentage then
     * ignores placement (sim/ibm.js:2130,2203), so a gap that fills is not a
     * bridge: a null where cards 2 and 3's explanation cannot be true. */
    const rm = sub === "rm8" || sub === "rm4";
    const d = sub === "d4" || sub === "rm4" ? 4 : 8;
    const c = CONFIGS.level;
    const tag = rm ? "card23rm" : "card23";
    console.log(
      `# ${tag} d=${d} N=${c.n} gens=${c.gens} siteN=${c.siteN}${rm ? " randomMating" : ""} seeds ${from}-${to}`,
    );
    for (const seed of seeds(from, to))
      for (const a of [null, 0.25]) {
        const x = run({
          ...c,
          seed,
          d,
          randomMating: rm,
          extra: a == null ? {} : { allocExponent: a },
        });
        if (!x) {
          console.log(
            `${tag} d=${d} a=${a == null ? 1 : a} seed ${seed} nobuild`,
          );
          continue;
        }
        console.log(
          `${tag} d=${d} a=${a == null ? 1 : a} seed ${seed} realised ${f(x.realised)} fate ${x.fate} peak ${f(x.peak)} mean ${f(x.gmean)} tGap ${x.tGap} tAnc ${x.tAnc}`,
        );
      }
  } else if (mode === "card5") {
    console.log(
      `# card5 rare-floor N0=30 gens=35 siteN=160 d=8 phenology 8/0.12 visitsPerPlant 800 seeds ${from}-${to}`,
    );
    for (const seed of seeds(from, to))
      for (const arm of ["R200", "R200q69", "R200q85"]) {
        const x = rareFloor(seed, selfingFor(arm));
        console.log(`card5 seed ${seed} arm ${arm} ${x ? x.fate : "nobuild"}`);
      }
  } else if (mode === "card6") {
    const base = {
      slices: 8,
      widthLocus: true,
      widthMut: 0.03,
      conserveDisplay: true,
    };
    console.log(
      `# card6 evolving-width S=8 conserved N0=30 gens=35 siteN=160 d=8 widthMut 0.03 seeds ${from}-${to}`,
    );
    for (const seed of seeds(from, to)) {
      const t = widthRun(seed, base);
      const s = widthRun(seed, { ...base, shuffleWidth: true });
      const diff =
        t && s && t.width != null && s.width != null ? t.width - s.width : null;
      console.log(
        `card6 seed ${seed} treatment ${t ? `${f(t.width)} ${t.fate}` : "nobuild"} shuffled ${s ? `${f(s.width)} ${s.fate}` : "nobuild"} diff ${f(diff)}`,
      );
    }
  } else if (mode === "card6null") {
    /* round 4: two shuffled arms at the same seed, differing only in the width
     * stream (widthRng(seed) against widthRng(seed + 1000)). Neither arm ties
     * width to fitness, so their difference is a draw from card 6's null. */
    const base = {
      slices: 8,
      widthLocus: true,
      widthMut: 0.03,
      conserveDisplay: true,
      shuffleWidth: true,
    };
    console.log(
      `# card6null evolving-width S=8 conserved shuffled(widthRng seed) minus shuffled(widthRng seed+1000) N0=30 gens=35 siteN=160 d=8 widthMut 0.03 seeds ${from}-${to}`,
    );
    for (const seed of seeds(from, to)) {
      const a = widthRun(seed, base);
      const b = widthRun(seed, base, seed + 1000);
      const diff =
        a && b && a.width != null && b.width != null ? a.width - b.width : null;
      console.log(
        `card6null seed ${seed} shuffledA ${a ? `${f(a.width)} ${a.fate}` : "nobuild"} shuffledB ${b ? `${f(b.width)} ${b.fate}` : "nobuild"} diff ${f(diff)}`,
      );
    }
  } else if (mode === "summarise") {
    summarise(argv.slice(1));
  } else if (mode === "edges") {
    edges(argv.slice(1));
  } else {
    throw new Error(
      "mode: card14 | card23 | card5 | card6 | card6null | summarise | edges",
    );
  }
}

/* Read row files back and print the edge of each null distribution, the
 * value a card's threshold must clear, and how many positive-arm seeds clear it. */
function summarise(files) {
  const fs = require("fs");
  const rows = files.flatMap((p) =>
    fs
      .readFileSync(p, "utf8")
      .split("\n")
      .filter((l) => /^card\d/.test(l)),
  );
  const num = (l, k) => {
    const m = l.match(new RegExp(`\\b${k} (\\S+)`));
    return m ? (m[1] === "null" ? null : Number(m[1])) : null;
  };
  const str = (l, k) => {
    const m = l.match(new RegExp(`\\b${k} (\\S+(?: lost)?)`));
    return m ? m[1] : null;
  };
  const fateOf = (l) =>
    (l.match(/ fate (HELD|FUSED|one lost|BOTH LOST)/) || [])[1];
  const minmax = (xs) =>
    `min ${f(Math.min(...xs))} max ${f(Math.max(...xs))} n ${xs.length}`;

  for (const cfg of ["page", "level"]) {
    const c14 = rows.filter(
      (l) => l.startsWith(`card14 ${cfg} `) && !/nobuild/.test(l),
    );
    if (!c14.length) continue;
    console.log(
      `\n== card 1 at ${cfg}: hybrid/rest receipt ratio (finite values only; Infinity = rest received nothing, counted separately)`,
    );
    for (const d of [8, 4]) {
      const nul = c14.filter((l) => l.includes(`d=${d} `) && / null /.test(l));
      const pl = c14.filter((l) => l.includes(`d=${d} `) && / placed /.test(l));
      const nr = nul.map((l) => num(l, "ratio"));
      const finite = nr.filter((x) => x != null && Number.isFinite(x));
      const inf = nr.filter((x) => x === Infinity).length;
      const undef = nr.filter((x) => x == null).length;
      const nullMin = Math.min(...finite);
      console.log(
        `  d=${d} null: ${minmax(finite)} Infinity ${inf} undefined ${undef} -> edge ${f(nullMin)} (a card-1 ratio must be BELOW this)`,
      );
      const pr = pl.map((l) => [num(l, "seed"), num(l, "ratio"), fateOf(l)]);
      const clear = pr.filter(
        ([, x, ft]) =>
          x != null && Number.isFinite(x) && x < nullMin && ft !== "HELD",
      );
      console.log(
        `  d=${d} placed, not HELD, ratio below the edge: ${clear.length} of ${pr.length} seeds` +
          (clear.length
            ? ` -> seeds ${clear.map(([s, x]) => `${s} (${f(x)})`).join(", ")}`
            : ""),
      );
    }
    console.log(`\n== card 4 at ${cfg}: hybrid generations`);
    for (const d of [8, 4]) {
      const nul = c14.filter((l) => l.includes(`d=${d} `) && / null /.test(l));
      const pl = c14.filter((l) => l.includes(`d=${d} `) && / placed /.test(l));
      const hg = (l) => Number(str(l, "hybGens").split("/")[0]);
      const nh = nul.map(hg);
      console.log(
        `  d=${d} null hybGens: ${minmax(nh)} -> edge ${Math.min(...nh)} (card 4 opens at 0, which must be BELOW this)`,
      );
      const opens = pl.filter((l) => hg(l) === 0 && fateOf(l) === "one lost");
      console.log(
        `  d=${d} placed, \`one lost\` with 0 hybrid generations: ${opens.length} of ${pl.length} seeds`,
      );
    }
  }

  for (const d of [8, 4]) {
    const c23 = rows.filter(
      (l) => l.startsWith(`card23 d=${d} `) && !/nobuild/.test(l),
    );
    if (!c23.length) continue;
    const nul = c23.filter((l) => / a=1 /.test(l));
    const pos = c23.filter((l) => / a=0.25 /.test(l));
    /* round 4: the randomMating rows are a second null arm; the edge is the
     * most extreme value EITHER null reached */
    const rmRows = rows.filter(
      (l) => l.startsWith(`card23rm d=${d} `) && !/nobuild/.test(l),
    );
    const peaks = nul.map((l) => num(l, "peak"));
    const means = nul.map((l) => num(l, "mean"));
    /* the lead: generations between the gap first holding 10% and ancestry
     * variance first halving. Under randomMating fusion is immediate, so the
     * gap cannot lead it; a lead is what a bridge has and random mating lacks. */
    const lead = (l) =>
      num(l, "tGap") >= 0 && num(l, "tAnc") >= 0
        ? num(l, "tAnc") - num(l, "tGap")
        : null;
    const rmPeaks = rmRows.map((l) => num(l, "peak"));
    const rmMeans = rmRows.map((l) => num(l, "mean"));
    const rmLeads = rmRows.map(lead).filter((x) => x != null);
    const leadEdge = rmLeads.length ? Math.max(...rmLeads) : -Infinity;
    console.log(
      `\n== cards 2 and 3 at level config, d=${d}: gap occupancy, null a=1 (${nul.length} seeds)${rmRows.length ? ` + randomMating (${rmRows.length} rows, a=1 and a=0.25 are identical: parentage ignores T)` : ""}`,
    );
    console.log(
      `  a=1 null peak: ${minmax(peaks)}; mean: ${minmax(means)} -> card 2 peak edge ${f(Math.max(...peaks))}, card 3 mean edge ${f(Math.max(...means))} (3-decimal rows; \`edges\` prints the outward-rounded value)`,
    );
    if (rmRows.length) {
      const rf = { HELD: 0, FUSED: 0, "one lost": 0, "BOTH LOST": 0 };
      rmRows.forEach((l) => rf[fateOf(l)]++);
      console.log(
        `  randomMating null peak: ${minmax(rmPeaks)}; mean: ${minmax(rmMeans)}; fates HELD/FUSED/one lost/BOTH LOST: ${rf.HELD}/${rf.FUSED}/${rf["one lost"]}/${rf["BOTH LOST"]}; lead (tAnc - tGap, both >= 0): min ${Math.min(...rmLeads)} max ${leadEdge} n ${rmLeads.length} -> lead edge ${leadEdge} (the lead must be ABOVE this; integer, no rounding)`,
      );
      console.log(
        `  randomMating null reaches every peak/mean edge (max peak ${f(Math.max(...rmPeaks))}, max mean ${f(Math.max(...rmMeans))}), so gap occupancy alone cannot close it; the lead does`,
      );
    }
    const nf = { HELD: 0, FUSED: 0, "one lost": 0, "BOTH LOST": 0 };
    nul.forEach((l) => nf[fateOf(l)]++);
    console.log(
      `  null fates HELD/FUSED/one lost/BOTH LOST: ${nf.HELD}/${nf.FUSED}/${nf["one lost"]}/${nf["BOTH LOST"]}`,
    );
    const nullOrdered = nul.filter(
      (l) =>
        fateOf(l) === "FUSED" &&
        num(l, "tGap") >= 0 &&
        num(l, "tAnc") >= 0 &&
        num(l, "tGap") < num(l, "tAnc"),
    ).length;
    console.log(`  null FUSED with gap-before-halving: ${nullOrdered}`);
    const pEdge = Math.max(...peaks);
    const mEdge = Math.max(...means);
    /* card 2's signature: FUSED, peak beyond the a=1 edge, lead beyond the
     * randomMating edge; card 3's: FUSED, mean beyond the a=1 edge, same lead */
    const sig2 = (l) =>
      fateOf(l) === "FUSED" &&
      num(l, "peak") > pEdge &&
      lead(l) != null &&
      lead(l) > leadEdge;
    const sig3 = (l) =>
      fateOf(l) === "FUSED" &&
      num(l, "mean") > mEdge &&
      lead(l) != null &&
      lead(l) > leadEdge;
    console.log(
      `  a=1 null seeds reaching card 2's full signature: ${nul.filter(sig2).length}; card 3's: ${nul.filter(sig3).length}; randomMating null seeds reaching card 2's: ${rmRows.filter(sig2).length}; card 3's: ${rmRows.filter(sig3).length}`,
    );
    const c2 = pos.filter(sig2);
    const c3 = pos.filter(sig3);
    const pf = { HELD: 0, FUSED: 0, "one lost": 0, "BOTH LOST": 0 };
    pos.forEach((l) => pf[fateOf(l)]++);
    console.log(
      `  a=0.25 (${pos.length} seeds) fates HELD/FUSED/one lost/BOTH LOST: ${pf.HELD}/${pf.FUSED}/${pf["one lost"]}/${pf["BOTH LOST"]}`,
    );
    console.log(
      `  card 2 opens (FUSED, peak > ${f(pEdge)}, lead > ${leadEdge}): ${c2.length} seeds${c2.length ? " -> " + c2.map((l) => `${num(l, "seed")} (${f(num(l, "peak"))}, lead ${lead(l)})`).join(", ") : ""}`,
    );
    console.log(
      `  card 3 opens (FUSED, mean > ${f(mEdge)}, lead > ${leadEdge}): ${c3.length} seeds${c3.length ? " -> " + c3.map((l) => `${num(l, "seed")} (${f(num(l, "mean"))}, lead ${lead(l)})`).join(", ") : ""}`,
    );
  }

  const c5 = rows.filter((l) => l.startsWith("card5 "));
  if (c5.length) {
    const fate = (seed, arm) => {
      const l = c5.find((x) => x.includes(` seed ${seed} arm ${arm} `));
      return l ? l.replace(/^.* arm \S+ /, "") : null;
    };
    const ss = [...new Set(c5.map((l) => num(l, "seed")))];
    console.log(
      `\n== card 5 at level-4 config (${ss.length} seeds): paired fate against the flat floor (q = 0 is bit-identical to flat, docs/2026-09-12-northstar-page-config-probe.md)`,
    );
    for (const arm of ["R200q69", "R200q85"]) {
      const open = ss.filter(
        (s) => fate(s, "R200") === "HELD" && fate(s, arm) !== "HELD",
      );
      const rev = ss.filter(
        (s) => fate(s, "R200") !== "HELD" && fate(s, arm) === "HELD",
      );
      const flatHeld = ss.filter((s) => fate(s, "R200") === "HELD").length;
      const armHeld = ss.filter((s) => fate(s, arm) === "HELD").length;
      console.log(
        `  ${arm}: flat HELD ${flatHeld}, arm HELD ${armHeld}; opens (flat HELD, arm not) ${open.length} -> seeds ${open.join(", ") || "none"}; reversed (flat not, arm HELD) ${rev.length} -> seeds ${rev.join(", ") || "none"}`,
      );
    }
  }

  const c6 = rows.filter((l) => l.startsWith("card6 ") && !/nobuild/.test(l));
  if (c6.length) {
    const diffs = c6.map((l) => num(l, "diff")).filter((x) => x != null);
    const { interval } = require(R + "sim/paired-stats.js");
    const ci = interval(diffs);
    console.log(
      `\n== card 6 at S = 8 conserved (${diffs.length} seeds): treatment minus shuffled width`,
    );
    console.log(
      `  per-seed diff: ${minmax(diffs)} mean ${f(mean(diffs))} sd ${f(sd(diffs))}; seeds with diff <= 0: ${diffs.filter((x) => x <= 0).length}`,
    );
    console.log(
      `  t interval over these seeds: [${f(ci.t[0])}, ${f(ci.t[1])}] (the finding's n = 12 interval is [0.140, 0.442], docs/FINDINGS.md:115-117)`,
    );
    const c6n = rows.filter(
      (l) => l.startsWith("card6null ") && !/nobuild/.test(l),
    );
    if (c6n.length) {
      const nd = c6n.map((l) => num(l, "diff")).filter((x) => x != null);
      const edge = Math.max(...nd);
      console.log(
        `  shuffled-minus-shuffled null (${nd.length} seeds): ${minmax(nd)} mean ${f(mean(nd))} sd ${f(sd(nd))} -> card 6 edge ${f(edge)} (treatment minus shuffled must be ABOVE this; 3-decimal rows, see \`edges\`)`,
      );
      const open = diffs.filter((x) => x > edge).length;
      console.log(
        `  treatment minus shuffled above that edge: ${open} of ${diffs.length} seeds`,
      );
    }
  }
}

/* Round 4. Re-run the seed that defines each numeric edge at full precision and
 * print the edge rounded OUTWARD, so the defining seed sits strictly on the
 * null side. Reads the same row files as `summarise` to find the seeds. */
function edges(files) {
  const fs = require("fs");
  const rows = files.flatMap((p) =>
    fs
      .readFileSync(p, "utf8")
      .split("\n")
      .filter((l) => /^card\d/.test(l)),
  );
  const num = (l, k) => {
    const m = l.match(new RegExp(`\\b${k} (\\S+)`));
    return m ? (m[1] === "null" ? null : Number(m[1])) : null;
  };
  const F = (x) => String(x);
  const argmin = (ls, k) => {
    let best = null;
    for (const l of ls) {
      const v = num(l, k);
      if (v == null || !Number.isFinite(v)) continue;
      if (!best || v < best.v) best = { l, v };
    }
    return best;
  };
  const argmax = (ls, k) => {
    let best = null;
    for (const l of ls) {
      const v = num(l, k);
      if (v == null || !Number.isFinite(v)) continue;
      if (!best || v > best.v) best = { l, v };
    }
    return best;
  };
  console.log(
    "# edges: the defining seed of each null edge re-run at full precision; committed edge = outward rounding (card 1 DOWN, cards 2, 3, 6 UP)",
  );
  for (const cfg of ["page", "level"])
    for (const d of [8, 4]) {
      const nul = rows.filter(
        (l) =>
          l.startsWith(`card14 ${cfg} d=${d} `) &&
          / null /.test(l) &&
          !/nobuild/.test(l),
      );
      const b = argmin(nul, "ratio");
      if (!b) continue;
      const seed = num(b.l, "seed");
      const x = run({ ...CONFIGS[cfg], seed, d, randomMating: true });
      console.log(
        `card1 ${cfg} d=${d} defining seed ${seed} null ratio ${F(x.ratio)} (row ${b.v.toFixed(3)}) -> edge ${outDown(x.ratio).toFixed(3)} (ratio must be BELOW this; the seed is not)`,
      );
    }
  for (const d of [8, 4]) {
    const nul = rows.filter(
      (l) =>
        l.startsWith(`card23 d=${d} `) && / a=1 /.test(l) && !/nobuild/.test(l),
    );
    if (!nul.length) continue;
    for (const [k, card] of [
      ["peak", "card2"],
      ["mean", "card3"],
    ]) {
      const b = argmax(nul, k);
      const seed = num(b.l, "seed");
      const x = run({ ...CONFIGS.level, seed, d });
      const v = k === "peak" ? x.peak : x.gmean;
      console.log(
        `${card} d=${d} defining seed ${seed} a=1 null ${k} ${F(v)} (row ${b.v.toFixed(3)}) -> edge ${outUp(v).toFixed(3)} (${k} must be ABOVE this; the seed is not)`,
      );
    }
    const rm = rows.filter(
      (l) => l.startsWith(`card23rm d=${d} `) && !/nobuild/.test(l),
    );
    if (rm.length) {
      const leads = rm
        .map((l) =>
          num(l, "tGap") >= 0 && num(l, "tAnc") >= 0
            ? num(l, "tAnc") - num(l, "tGap")
            : null,
        )
        .filter((x) => x != null);
      console.log(
        `cards 2 and 3 d=${d} randomMating null lead (tAnc - tGap): max ${Math.max(...leads)} over ${leads.length} rows -> lead edge ${Math.max(...leads)} (the lead must be ABOVE this; integer, exact)`,
      );
    }
  }
  const c6n = rows.filter(
    (l) => l.startsWith("card6null ") && !/nobuild/.test(l),
  );
  if (c6n.length) {
    const b = argmax(c6n, "diff");
    const seed = num(b.l, "seed");
    const base = {
      slices: 8,
      widthLocus: true,
      widthMut: 0.03,
      conserveDisplay: true,
      shuffleWidth: true,
    };
    const A = widthRun(seed, base);
    const B = widthRun(seed, base, seed + 1000);
    const v = A.width - B.width;
    console.log(
      `card6 defining seed ${seed} shuffled-minus-shuffled diff ${F(v)} (row ${b.v.toFixed(3)}) -> edge ${outUp(v).toFixed(3)} (treatment minus shuffled must be ABOVE this; the seed is not)`,
    );
  }
}

if (require.main === module) main(process.argv.slice(2));
