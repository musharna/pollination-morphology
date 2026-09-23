/*
 * The sandbox's generation loop, as a file.
 *
 * ⚠️ THIS FILE EXISTS SO THE FIDELITY TEST CAN EXECUTE THE PAGE'S OWN LOOP.
 * It used to live inline in population.html, which meant tests/browser-bundle.test.js
 * could only assert against a loop HAND-COPIED into the test ("verbatim in
 * structure") — a test that proves the copy matches run(), never that the page
 * does. A copy is exactly the defect the test exists to catch. So the loop moved
 * out here, the page loads it with <script src>, and the test loads the same file
 * into the fake browser and calls it.
 *
 * Protocol (the page's, section 9 of the northstar spec): the caller makes
 * `rng = Evolve.makeRng(seed)` and `srng = IBM.signalRng(seed)` ONCE, founds the
 * population with those two, and then drives every generation with the same two.
 * Founding's draws are consumed before generation 0. `IBM.run({found})` makes
 * fresh streams, so it is a DIFFERENT run at the same seed; the page's numbers are
 * the null tables' numbers (tools/northstar-null-tables.js) and not run()'s.
 *
 * Classic script, no module system: the bundle and this file share one global
 * lexical scope in the browser, so everything here is inside one IIFE.
 */
(function (global) {
  "use strict";

  /* Which slice of the bout gets logged.
   *
   * ⚠️ `logBout` records a WINDOW of real visits — which plant, where on the
   * body the stigma swept, which grains it took and from whom. It draws no
   * random numbers, so the generation is identical with it on; asserted by
   * tests/bout-log.test.js, which was seen to fail against a version that did
   * draw one.
   *
   * The window starts well into the bout on purpose: at visit 0 the animal is
   * empty by construction, so a window at the start would honestly show a bee
   * that delivers nothing. */
  const BOUT_FROM = 600,
    BOUT_N = 60;

  /*
   * Replay the logged window to get what the animal is CARRYING after each
   * visit — the pollen on its body, which is what the renderer draws.
   *
   * ⚠️ THIS IS A PARTIAL LOAD AND THE PAGE SAYS SO. The log truncates the
   * per-visit grain detail (see LOG_GRAINS in sim/carryover.js) and the
   * window opens mid-bout, so grains picked up before it started are not in
   * here — a stigma taking one of those finds nothing to remove and the
   * removal is skipped. The COUNTS drawn beside the animal come from the
   * log's exact tallies rather than from this reconstruction, so the
   * numbers are the model's even though the specks are a sample.
   */
  function replayLoad(log) {
    let load = [];
    const out = [];
    for (const rec of log) {
      for (const g of rec.took) {
        const i = load.findIndex(
          (x) => x.sp === g.sp && x.s === g.s && x.phi === g.phi,
        );
        if (i >= 0) load.splice(i, 1);
      }
      for (const g of rec.gave)
        load.push({ s: g.s, phi: g.phi, sp: rec.j, ok: g.ok });
      out.push(load.slice(-90));
    }
    return out;
  }

  /*
   * The founding, from two hand-set genomes.
   *
   * ⚠️ THE `base` MUST CARRY THE SIGNAL LOCUS. foundPopulation takes `base`
   * whole (`b = base || {...randomGenome, [SIGNAL_GENE]: sr()}`, sim/ibm.js:438)
   * and then wraps `h[SIGNAL_GENE] + gauss * spread` (:442), so a base of the
   * eight shape genes alone gives NaN signal on EVERY founder — verified, and
   * invisible until something downstream reads it. The two signal draws come
   * from `srng` in the order lineage 1, lineage 2, as foundTwoLineages draws
   * its own (:562, :572).
   *
   * ⚠️ AND `half` IS NOT WRITTEN TWICE. The second call takes `n - half`, as
   * foundTwoLineages splits it (:584-592); writing `half` again founds n - 1
   * plants at odd n and passes every finite-allele check there is. That is why
   * the acceptance COUNTS founders and labels.
   *
   * It lives here rather than in the page's inline script for the same reason
   * the loop does: so the test can execute the page's own recipe instead of a
   * copy of it.
   */
  function foundFromGenomes(genomes, n, rng, srng) {
    const I = global.IBM;
    const half = Math.floor(n / 2);
    return [
      ...I.foundPopulation(half, rng, {
        spread: 0.02,
        srng,
        base: { ...genomes[0], [I.SIGNAL_GENE]: srng() },
        anc: 0,
      }),
      ...I.foundPopulation(n - half, rng, {
        spread: 0.02,
        srng,
        base: { ...genomes[1], [I.SIGNAL_GENE]: srng() },
        anc: 1,
      }),
    ];
  }

  /*
   * The loop itself.
   *
   * ⚠️ Driven with step() rather than through run(), because run() returns only
   * summary history and this page needs every generation's GENOMES to draw the
   * flowers. `found` is the founding population (an array of individuals), `rng`
   * and `srng` are the two streams already used to found it, and `gens` is the
   * generation cap. Returns one frame per generation: the PARENTS of that
   * generation plus everything the renderer and the tiles read off them.
   */
  function runGenerations(found, opts, rng, srng, gens) {
    const I = global.IBM,
      E = global.Evolve;
    let pop = found;
    const out = [];
    let extinct = false;
    let stalledGens = 0;
    for (let g = 0; g < gens; g++) {
      if (pop.length < 2) {
        extinct = true;
        break;
      }
      const anc = pop.map((ind) => (ind.anc === undefined ? 0 : ind.anc));
      const res = I.step(
        pop,
        { ...opts, logBout: { from: BOUT_FROM, count: BOUT_N } },
        rng,
        g,
        srng,
      );
      out.push({
        pop,
        anc,
        flowers: pop.map((ind) => E.toFlower(I.shapeOf(ind))),
        sites: I.sitesOf(pop, opts, g),
        places: res.places,
        /* per-parent siring received: the hybrid-fraction and receipt-ratio
         * tiles are M2's, but the quantity is the loop's and the fidelity
         * test asserts it against the null tables now. */
        received: res.received,
        sep: res.cluster ? res.cluster.separation : 0,
        ancVar: res.ancVar,
        recruits: res.recruits,
        log: res.visitLog || [],
        carried: replayLoad(res.visitLog || []),
        visits: opts.visits,
      });
      /* ⚠️ A GENERATION THAT RECRUITS NOTHING HANDS THE PARENTS BACK
       * (sim/ibm.js step: `next.length ? next : pop`), so its ancestry
       * variance is the founders' and fate would read HELD. Counted here and
       * passed to fateOf as `stalled` (northstar spec §3). */
      if (res.recruits === 0) stalledGens++;
      pop = res.pop;
    }
    /* `frames` are the PARENTS of each generation, which is what the field
     * draws. `final` is the last generation's OFFSPRING, which the frames drop
     * and which every fate in docs/ is read off (tools/northstar-null-tables.js:130). */
    return { frames: out, final: pop, extinct, stalledGens };
  }

  /* hybrid = ancestry strictly in (0.15, 0.85), experiments/hybrids-or-balance.js:87 */
  const isHybrid = (a) => a > 0.15 && a < 0.85;
  const meanOf = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

  /*
   * Card 1 and card 4's quantities, read off the frames exactly as
   * tools/northstar-null-tables.js run() reads them: on the PARENTS of each
   * generation (the `anc` array is taken before step), a hybrid generation is
   * one whose parents held a plant with anc strictly in (0.15, 0.85), and the
   * receipt ratio is mean `received` of hybrids over the rest in the LAST
   * generation where both sets were non-empty (null if never).
   */
  function quantities(frames) {
    let hybGens = 0;
    let ratio = null;
    for (const f of frames) {
      const hyb = [],
        rest = [];
      f.anc.forEach((a, i) => (isHybrid(a) ? hyb : rest).push(f.received[i]));
      if (hyb.length) hybGens++;
      if (hyb.length && rest.length) ratio = meanOf(hyb) / meanOf(rest);
    }
    return { hybGens, ratio };
  }

  /*
   * The configurations cards 1 and 4 were tabulated at (null tables,
   * docs/2026-09-13-northstar-null-tables.md; tools/northstar-null-tables.js
   * CONFIGS): the page's and the level's (N, generations, siteN).
   */
  const CONFIGS = {
    page: { n: 18, gens: 24, siteN: 90 },
    level: { n: 30, gens: 35, siteN: 160 },
  };
  /* card 1's edge: the lowest receipt ratio any of the 58 null runs reached at
   * the page configuration, target 8 seed 22 at 0.60324, rounded DOWN (null
   * tables, `edges`). At the level configuration a null run reaches 0, so no
   * edge exists there and card 1 is grey (spec §4, card 1). */
  const CARD1_EDGE = 0.603;

  function configOf(sig) {
    for (const [name, c] of Object.entries(CONFIGS))
      if (sig.n === c.n && sig.gens === c.gens && sig.siteN === c.siteN)
        return name;
    return null;
  }
  const describe = (sig) =>
    `N ${sig.n}, ${sig.gens} generations, siteN ${sig.siteN}, ` +
    `${sig.randomMating ? "random mating" : "placement-mediated"}, ` +
    `${sig.options.length ? "options " + sig.options.join(", ") : "no option set"}, ` +
    `${sig.defaultBee ? "the default bee" : "a changed bee"}`;

  /*
   * The cards' states, by the spec's precedence (§4, round 6): GREY WINS. A run
   * outside a card's signature is grey whatever its fate and quantities; open
   * and closed are decided only inside it. STALLED opens no card (§3).
   *
   * `sig` = { n, gens, siteN, randomMating, options: [option keys set],
   * defaultBee }; `fate` the engine's string; `q` = quantities(frames).
   * Returns { card1..card6: { state, text } }.
   */
  function cardStates(sig, fate, q) {
    const cfg = configOf(sig);
    const clean = !sig.randomMating && sig.options.length === 0 && sig.defaultBee;
    const grey = (at) => ({
      state: "grey",
      text: `measured at ${at}; this run ${describe(sig)}`,
    });
    const at = (names) =>
      names
        .map((k) => {
          const c = CONFIGS[k];
          return `N ${c.n}, ${c.gens} generations, siteN ${c.siteN}`;
        })
        .join(" or ") + ", placement-mediated, no option set, the default bee";

    let card1;
    if (!(clean && cfg === "page")) card1 = grey(at(["page"]));
    else if (
      (fate === "one lost" || fate === "FUSED") &&
      q.ratio !== null &&
      q.ratio < CARD1_EDGE
    )
      card1 = {
        state: "open",
        text: `hybrids received less than the rest of the field: receipt ratio ${q.ratio.toFixed(3)}, below the null edge ${CARD1_EDGE}; hybrids among the parents in ${q.hybGens} generations`,
      };
    else
      card1 = {
        state: "closed",
        text:
          q.ratio === null
            ? "closed: hybrids and the rest never shared a generation"
            : `closed: receipt ratio ${q.ratio.toFixed(3)}, not below the null edge ${CARD1_EDGE}` +
              (fate === "one lost" || fate === "FUSED" ? "" : `; fate ${fate}`),
      };

    let card4;
    if (!(clean && cfg !== null)) card4 = grey(at(["page", "level"]));
    else if (fate === "one lost" && q.hybGens === 0)
      card4 = {
        state: "open",
        text: "secondary contact excludes: one lineage was lost and the parents held no hybrid in any generation",
      };
    else
      card4 = {
        state: "closed",
        text: `closed: fate ${fate}, hybrids among the parents in ${q.hybGens} generations`,
      };

    const later = (n) => ({
      state: "grey",
      text: `card ${n} is built in M3; this run ${describe(sig)}`,
    });
    return {
      card1,
      card4,
      card2: later(2),
      card3: later(3),
      card5: later(5),
      card6: later(6),
    };
  }

  global.SandboxRun = {
    runGenerations,
    foundFromGenomes,
    quantities,
    cardStates,
    isHybrid,
    CONFIGS,
    CARD1_EDGE,
    replayLoad,
    BOUT_FROM,
    BOUT_N,
  };
})(typeof window !== "undefined" ? window : globalThis);
