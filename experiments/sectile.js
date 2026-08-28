/*
 * Sectile pollinia — the intermediate dispersal unit, and the sharpest test the
 * packaging mechanism has.
 *
 * `dispersalUnit` was built to reproduce Johnson & Harder 2023's CROSSED pair:
 * solid pollinia have low removal (<45%) and high transfer (27.0%), granular
 * monads the reverse (>80%, 2.4%). One mechanism — a pollinium is one solid
 * object — with `viscidium` selected on removal alone, so the transfer figure
 * was a prediction. It landed at 27.1% against the measured 27.0%.
 *
 * That is two points, and two points can be joined by anything. Sectile
 * pollinia are the third: ~11% of orchid species have pollinia built of
 * numerous MASSULAE, each holding several hundred grains. If the mechanism is
 * right rather than merely fitted, the intermediate condition has to land in
 * the intermediate place WITHOUT a new parameter tuned to put it there.
 *
 * ⚠️ WHAT THE PAPER ACTUALLY SAYS — the roadmap had this half right.
 *
 * The roadmap recorded sectile as "grouped with monads on removal". Checked
 * against the full text, they group with monads on BOTH axes:
 *
 *   "the association of dispersal of solid pollinia (milkweeds and orchids)
 *    with low pollen removal and high transfer efficiency, but of massula and
 *    monad dispersal with higher removal AND LOWER TRANSFER EFFICIENCY
 *    (figure 3a) was not expected a priori"
 *
 * But the figure shows the structure is two-sided, and this is the part worth
 * predicting. Read off figure 3 (marginal means; my reading of the massula
 * point is calibrated against two values the text states outright — monad PTE
 * 1.4% and solid-orchid 28.5% — so the axis reading is sound):
 *
 *   unit         removal    PTE     relative export   Tukey PTE   Tukey RPE
 *   monad          0.83      1.5%        0.015            a           a
 *   massula        0.74     10.7%        0.085            a           b
 *   solid orchid   0.34     28.5%        0.115            b           b
 *   solid milkweed 0.34     24.5%        0.077            b           b
 *
 * On TRANSFER EFFICIENCY massulae group with monads. On NET EXPORT they group
 * with the solid pollinia, and monads sit alone and worst. Sectile pollinia buy
 * solid-pollinium net export at monad-like removal. A model that reproduces one
 * of those groupings and not the other has not reproduced the finding.
 *
 * ⚠️ THE PARAMETER IS SELECTED ON AN AXIS THAT IS NOT TRANSFER. `massulae` is
 * chosen to match the CARRYOVER LENGTH the paper states in text — "this minimal
 * visit number ranges from one flower for many orchids with solid pollinia, to
 * two flowers for milkweeds, to a few to 20 flowers for species with massulate
 * pollinia, to tens of flowers for species with monads" — so the transfer and
 * export figures remain predictions, exactly as `viscidium` was handled.
 *
 * ⚠️ PRE-REGISTERED PREDICTION, written before the first run. The model's monad
 * arm is known to be 2.9x too generous (7.1% against a measured 2.4%), so
 * absolute PTE is not quotable and the target has to be the POSITION between
 * the model's own two arms. On a log scale the measured massula sits 67% of the
 * way from monad (1.5%) to solid orchid (28.5%). Between the model's arms —
 * monad 7.1%, pollinium 27.1% — that position is ~17%. So: sectile PTE near
 * 17%, removal monad-like, net export grouping with the pollinium.
 */

const P = require("../sim/placement.js");
const C = require("../sim/carryover.js");

const bee = P.DEFAULT_BEE;
const POOL = 60;
const SEEDS = [3, 11, 29, 47, 61];
const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));
const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
const pct = (x) => (x === null ? "   n/a" : `${(100 * x).toFixed(1)}%`);

/* Same two-species geometry and the same bout settings the pollinium arm was
 * measured under, so the three units are comparable by construction rather than
 * by assertion. */
function twoSpecies() {
  const a = { ...P.DEFAULT_FLOWER, antherT: 0.5, stigmaT: 0.5, antherTheta: 0 };
  const b = {
    ...P.DEFAULT_FLOWER,
    antherT: 0.5,
    stigmaT: 0.5,
    antherTheta: Math.PI,
  };
  return [a, b].map((f, i) => C.siteSet(f, bee, { n: 200, seed: 11 + i }));
}
const SITES = twoSpecies();
const AB = [0.5, 0.5];
const BASE = { visitsPerFlower: 25, groom: 0.3, harvest: 0.2 };

/*
 * All three of Johnson & Harder's quantities from one bout, plus the carryover
 * length the parameter is selected on.
 *
 *   removal  = released / committed          (their removal efficiency, RE)
 *   transfer = delivered / released          (their PTE)
 *   export   = removal * transfer            (their relative pollen export)
 *   serviced = DISTINCT RECIPIENT FLOWERS per donor flower's pollen — the
 *              "minimal visit number". A solid pollinium services one, a
 *              flower's worth of monads services many. That is the quantity the
 *              paper describes in text, and it is measured rather than assumed.
 *
 * ⚠️⚠️ AND `serviced` COUNTED THE WRONG THING UNTIL 2026-08-28. It was
 * `ageOnDeposit.length / flowersUsed` — deposition EVENTS per donor, not
 * distinct recipients. Two massulae from one donor landing on the same stigma
 * are two events and ONE flower serviced, so the old counter overcounted by
 * exactly the amount of that doubling-up, and did so most at HIGH massula
 * counts. That is not cosmetic: this is the counter the massula count is
 * SELECTED on against Johnson & Harder's "a few to 20", so an inflated value
 * changes which counts qualify and therefore which one the rest of the file
 * predicts from. Both are carried below so the size of the correction is
 * visible rather than asserted.
 */
const fates = (opts) => fatesPool(POOL, opts);

function fatesPool(pool, opts) {
  const POOL = pool;
  const rem = [],
    pte = [],
    serv = [],
    servEvents = [];
  for (const seed of SEEDS) {
    const r = C.runBout(SITES, AB, {
      visits: 14000,
      seed,
      pollenPerFlower: POOL,
      ...opts,
    });
    let released = 0,
      committed = 0,
      delivered = 0,
      flowers = 0;
    for (let i = 0; i < SITES.length; i++) {
      released += r.released[i];
      committed += r.flowersUsed[i] * POOL;
      delivered += r.T[i][i];
      flowers += r.flowersUsed[i];
    }
    if (committed > 0) rem.push(released / committed);
    if (released > 0) pte.push(delivered / released);
    if (flowers > 0) {
      serv.push(r.servicedPairs / flowers);
      /* the superseded counter, kept so the correction can be shown */
      servEvents.push(r.ageOnDeposit.length / flowers);
    }
  }
  const removal = mean(rem),
    transfer = mean(pte);
  return {
    removal,
    transfer,
    serviced: mean(serv),
    servicedEvents: mean(servEvents),
    export: removal === null || transfer === null ? null : removal * transfer,
  };
}

// ==========================================================================
// The two anchors, re-measured here so every number in this file is one run
// ==========================================================================
rule("SECTILE POLLINIA — the intermediate unit");

/*
 * ⚠️ THE ARM CONFIGURATIONS ARE NOT INTERCHANGEABLE, AND ASSUMING THEY WERE
 * VOIDED THE FIRST RUN OF THIS FILE.
 *
 * Two settings are properties of the dispersal unit rather than of the bout,
 * and `experiments/dispersal-unit.js` sets them per arm for reasons it records:
 *
 *   presentRate  the dispensing schedule. The monad arm carried forward is
 *                0.05 — a flower offers a twentieth of its pool per visit. At
 *                the default 1.0 a flower dumps everything into the first
 *                visitor, which pins removal at 100% and destroys carryover.
 *   harvest      a pollinarium is GLUED ON and is not collectible food, so a
 *                bee cannot pack it away. That file records leaving harvest
 *                active on a pollinium as "simply wrong biology". It applies to
 *                sectile too — Johnson & Harder's own figure 1c shows sectile
 *                pollinaria of Disa harveyana glued to a horsefly's proboscis.
 *
 * The first run of this file inherited one BASE for all three arms and got a
 * pollinium at 88.2% removal against the 27.0% that arm was validated at. Every
 * downstream number was void, including two that printed as passes.
 */
const BOUT = { visitsPerFlower: 25, groom: 0.3 };
const monad = fates({ ...BOUT, harvest: 0.2, presentRate: 0.05 });
/* ⚠️ viscidium 0.25, NOT the module default of 0.6. `dispersal-unit.js` SELECTED
 * 0.25 as the least extreme setting that still clears the <45% removal target;
 * 0.6 is merely the value sitting in DEFAULTS and gives 88.0% removal. Reading
 * the default and assuming it was the validated one voided a whole run of this
 * file — the anchor gate below is what caught it. */
const solid = fates({
  ...BOUT,
  harvest: 0,
  presentRate: 1.0,
  dispersalUnit: "pollinium",
  viscidium: 0.25,
});
/* Sectile: glued like a pollinarium (harvest 0), but the pollen travels as
 * massulae. The whole set boards on removal, then lands piece by piece. */
const sectileArm = (massulae) =>
  fates({
    ...BOUT,
    harvest: 0,
    presentRate: 1.0,
    dispersalUnit: "sectile",
    massulae,
  });

/*
 * ⚠️ GATE. If the two anchors do not reproduce the values their own arms were
 * validated at, this harness is measuring something else and nothing below it
 * means anything. Checked before any sectile number is computed, because the
 * first run produced confident green checkmarks on top of broken anchors.
 */
const ANCHORS = {
  monadTransfer: 0.071,
  solidRemoval: 0.27,
  /* 18.6% is the pollinium's transfer at the SELECTED viscidium under this
   * bout's grooming. The project's 27.1% headline is a different quantity — the
   * end of part C's decomposition, which adds adhesion (groom 0.05) as a
   * separate mechanism. Every arm here shares one grooming rate so the
   * comparison is not confounded by it. */
  solidTransfer: 0.186,
};
const anchorOk =
  Math.abs(monad.transfer - ANCHORS.monadTransfer) < 0.02 &&
  Math.abs(solid.removal - ANCHORS.solidRemoval) < 0.08 &&
  Math.abs(solid.transfer - ANCHORS.solidTransfer) < 0.06;

console.log("  the two anchors, re-measured in this file's bout:\n");
console.log(
  "  unit          removal   transfer   net export   flowers serviced",
);
const row = (label, f) =>
  console.log(
    `  ${label.padEnd(12)}  ${pct(f.removal).padStart(7)}   ${pct(f.transfer).padStart(8)}   ` +
      `${pct(f.export).padStart(10)}   ${(f.serviced === null ? "n/a" : f.serviced.toFixed(1)).padStart(16)}`,
  );
row("monad", monad);
row("solid pollinium", solid);
console.log(
  `\n  ANCHOR GATE — these arms were validated at monad transfer ${pct(ANCHORS.monadTransfer)},\n` +
    `  pollinium removal ${pct(ANCHORS.solidRemoval)} and transfer ${pct(ANCHORS.solidTransfer)}.\n  ` +
    (anchorOk
      ? "✅ reproduced; the sectile numbers below are measured on the same harness."
      : "⛔ NOT REPRODUCED. The harness is configured differently from the one those\n" +
        "  values came from, so nothing below would mean anything. Stopping here."),
);
if (!anchorOk) {
  console.log();
  process.exit(1);
}

// ==========================================================================
// A — select `massulae` on CARRYOVER LENGTH, not on transfer
// ==========================================================================
rule(
  "A — how many massulae? Selected on flowers serviced, target 'a few to 20'",
);

console.log(
  "  Johnson & Harder, in text: solid pollinia service one flower, milkweeds\n" +
    "  two, MASSULATE POLLINIA A FEW TO 20, monads tens. That is the axis the\n" +
    "  parameter is chosen on, so transfer stays a prediction.\n",
);
console.log(
  "  massulae   grains each   removal   flowers serviced   (old: deposits)   in target?",
);
const sweep = [];
for (const massulae of [1, 2, 4, 6, 10, 15, 20, 30, 60]) {
  const f = sectileArm(massulae);
  const inTarget = f.serviced >= 3 && f.serviced <= 20;
  const wasInTarget = f.servicedEvents >= 3 && f.servicedEvents <= 20;
  sweep.push({ massulae, ...f, inTarget, wasInTarget });
  console.log(
    `  ${String(massulae).padStart(8)}   ${(POOL / massulae).toFixed(1).padStart(11)}   ` +
      `${pct(f.removal).padStart(7)}   ${f.serviced.toFixed(1).padStart(16)}   ` +
      `${f.servicedEvents.toFixed(1).padStart(14)}   ${inTarget ? "✅" : ""}` +
      `${inTarget !== wasInTarget ? "  ⚠️ the old counter disagreed" : ""}`,
  );
}

const qualifying = sweep.filter((s) => s.inTarget);
if (!qualifying.length) {
  console.log(
    "\n  ⚠️ NO massula count puts carryover in the stated range. The parameter\n" +
      "  cannot be selected on this axis, so nothing below is a prediction.",
  );
} else {
  /* The middle of the qualifying range rather than whichever end flatters the
   * prediction — picking the extreme would be selecting on the outcome. */
  const chosen = qualifying[Math.floor((qualifying.length - 1) / 2)];
  console.log(
    `\n  ${qualifying.length} counts land in range. Selected the MIDDLE one, massulae = ${chosen.massulae}\n` +
      `  (${(POOL / chosen.massulae).toFixed(1)} grains each, ${chosen.serviced.toFixed(1)} flowers serviced) — taking an end of the\n` +
      `  range would be selecting on the outcome the next section tests.`,
  );

  // ======================================================================
  // B — the prediction
  // ======================================================================
  rule("B — transfer and export at that massula count are PREDICTIONS");

  const sec = sectileArm(chosen.massulae);
  console.log(
    "  unit          removal   transfer   net export   flowers serviced",
  );
  row("monad", monad);
  row("SECTILE", sec);
  row("solid pollinium", solid);

  /* Where does sectile sit between the two anchors, on a log scale? The
   * measured value is 67% of the way from monad to solid orchid. */
  const lg = (x) => Math.log(x);
  const posOf = (x) =>
    (lg(x) - lg(monad.transfer)) / (lg(solid.transfer) - lg(monad.transfer));
  const pos = posOf(sec.transfer);
  console.log(
    `\n  PRE-REGISTERED, and it is the POSITION that was registered, not a number:\n` +
      `  from Johnson & Harder's figure 3a the measured massula sits 67% of the way\n` +
      `  from monad (1.5%) to solid orchid (28.5%) on a log PTE scale. That comes\n` +
      `  entirely from published data. Mapped onto THIS model's anchors\n` +
      `  (${pct(monad.transfer)} and ${pct(solid.transfer)}) it predicts ${pct(Math.exp(lg(monad.transfer) + 0.67 * (lg(solid.transfer) - lg(monad.transfer))))}.\n` +
      `  MEASURED HERE: transfer ${pct(sec.transfer)}, at ${(100 * pos).toFixed(0)}% of the way.`,
  );
  const hit = pos > 0.4 && pos < 0.9;
  console.log(
    hit
      ? `  ✅ Intermediate, and in the right part of the interval. The mechanism\n` +
          `  places the third condition correctly without a parameter tuned to do it.`
      : `  ⚠️ NOT where the measured unit sits (${(100 * pos).toFixed(0)}% vs 67%). One mechanism at three\n` +
          `  grain sizes does not reproduce the three measured conditions.`,
  );

  // ======================================================================
  // C — the two-axis grouping, which is the part that can fail
  // ======================================================================
  rule(
    "C — does sectile group with monads on PTE but with pollinia on export?",
  );

  const nearer = (x, a, b) =>
    Math.abs(lg(x) - lg(a)) < Math.abs(lg(x) - lg(b)) ? "monad" : "pollinium";
  const pteGroup = nearer(sec.transfer, monad.transfer, solid.transfer);
  const expGroup = nearer(sec.export, monad.export, solid.export);
  console.log(
    `  transfer efficiency: sectile ${pct(sec.transfer)} is nearer ${pteGroup}` +
      `   (measured: groups with MONAD)`,
  );
  console.log(
    `  net export:          sectile ${pct(sec.export)} is nearer ${expGroup}` +
      `   (measured: groups with POLLINIUM)`,
  );
  console.log(
    `  removal:             sectile ${pct(sec.removal)} vs monad ${pct(monad.removal)}, ` +
      `pollinium ${pct(solid.removal)}   (measured: monad-like)`,
  );

  const splitReproduced = expGroup === "pollinium";
  console.log(
    splitReproduced
      ? `\n  ✅ The SPLIT is reproduced: sectile buys pollinium-level net export at\n` +
          `  monad-like removal. That is the "not expected a priori" structure, and it\n` +
          `  falls out of one mechanism at an intermediate grain size.`
      : `\n  ⚠️ The split is NOT reproduced — sectile's net export sits with the monads.\n` +
          `  The model makes it a scaled-down pollinium rather than the distinct\n` +
          `  economy the data show, so packaging alone does not explain the finding.`,
  );

  // ======================================================================
  // D — is that negative a RESOLUTION ARTEFACT?
  // ======================================================================
  /*
   * A negative from a model whose pollen pool is 60 abstract grains has an
   * obvious alternative explanation: real massulae hold several hundred grains
   * each and real pollinia tens of thousands, so a 60-grain pool may simply be
   * too coarse for a massula to be meaningfully "coherent". This project has
   * already been caught once by exactly that — the 24-bin histogram that
   * saturated below one bin width and made a real effect vanish.
   *
   * So the negative gets the same treatment the overlap metric got: vary the
   * resolution and see whether the conclusion moves.
   */
  rule(
    "D — resolution control: does the negative survive a bigger pollen pool?",
  );
  console.log("   pool   massulae   grains each   transfer   flowers serviced");
  const grid = [];
  for (const pool of [60, 600, 6000]) {
    for (const k of [10, 30, 100]) {
      if (k > pool) continue;
      const f = fatesPool(pool, {
        ...BOUT,
        harvest: 0,
        presentRate: 1.0,
        dispersalUnit: "sectile",
        massulae: k,
      });
      grid.push({ pool, k, ...f });
      console.log(
        `  ${String(pool).padStart(5)}   ${String(k).padStart(8)}   ${(pool / k).toFixed(1).padStart(11)}   ` +
          `${pct(f.transfer).padStart(8)}   ${f.serviced.toFixed(1).padStart(16)}`,
      );
    }
  }
  const byK = {};
  for (const g of grid) (byK[g.k] = byK[g.k] || []).push(g.transfer);
  const invariant = Object.values(byK).every(
    (v) => Math.max(...v) - Math.min(...v) < 0.005,
  );
  console.log(
    invariant
      ? "\n  ⚠️ TRANSFER DEPENDS ON THE MASSULA COUNT ALONE, NOT ON THE POOL. Every row\n" +
          "  with the same count gives the same transfer at 60, 600 and 6000 grains, so\n" +
          "  GRAINS PER MASSULA IS IRRELEVANT TO TRANSFER in this model. The negative is\n" +
          "  therefore NOT a resolution artefact — it survives a hundredfold finer pool.\n" +
          "\n  What actually binds is a TENSION BETWEEN THE TWO AXES: carryover length\n" +
          "  pushes the massula count UP, and transfer falls as it rises. The model\n" +
          "  cannot match sectile's carryover and its transfer efficiency at once, and\n" +
          "  that is a sharper statement than 'the mechanism fails'."
      : "\n  Transfer moves with pool size at fixed massula count, so the part B negative\n" +
          "  may be a resolution artefact and must not be reported as a mechanism failure.",
  );
}

console.log();
