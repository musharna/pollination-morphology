/*
 * #56 — IS THE RARE-LINEAGE FLOOR A COUNT OR A FREQUENCY?
 *
 * Registered in docs/2026-09-03-rare-floor-prereg.md before this ran.
 *
 * #55 found that the premium's rare-lineage VISIT advantage (3.52x below
 * minority frequency 0.1) fails to become offspring exactly where it is largest
 * (fitness 0.477 there). Mate finding is the candidate, and at N0=30 it could
 * not be tested because a minority FREQUENCY of 0.1 IS a minority COUNT of 3.
 *
 * Varying N0 separates them, and the predictions are opposite in p and identical
 * in k. Per-plant pollinator service is held constant with `visitsPerPlant`,
 * which is a verified no-op at N0=30 — so that arm is a byte-level anchor to
 * #55 — and verified live elsewhere.
 *
 *   RF_SEEDS=40 RF_CONFIGS=30:A node experiments/rare-floor.js
 *   RF_FROM=a.json,b.json node experiments/rare-floor.js     re-report, no re-sim
 */
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const fs = require("node:fs");
const zlib = require("node:zlib");
/* the SINGLE source for "does this arm self, and how" — the simulation and the
 * C10 control both ask it, so a new arm name cannot make them disagree. See the
 * long note in that file for the two times they did. */
const { selfingFor } = require("./selfing-arms.js");

const SITE_N = 160,
  D_EXCL = 8,
  SLICES = 8,
  WIDTH = 0.12;
const VPP = 800; /* per-plant service; 800*30 === the 24000 total #52-#55 used */
const N_SEEDS = Number(process.env.RF_SEEDS || 40);
const DUMP = process.env.RF_DUMP || null;
const FROM = process.env.RF_FROM || null;
const REPRO_SEEDS = 40;

/* generations scale with N0 so drift time is comparable in units of population
 * size; 35 at N0=30 keeps the anchor exactly as #55 ran it */
const gensFor = (N0) => Math.round((35 * N0) / 30);

/* C9 — cf counts OTHER conspecifics and cannot exceed k-1. Counted rather than
 * thrown so the whole run reports the violation instead of dying mid-cell. */
let c9violations = 0;

const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
const sd = (xs) => {
  if (xs.length < 2) return null;
  const m = mean(xs);
  return Math.sqrt(
    xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (xs.length - 1),
  );
};
function corr(a, b) {
  const n = a.length;
  if (n < 3) return null;
  const ma = mean(a),
    mb = mean(b);
  let sab = 0,
    saa = 0,
    sbb = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma,
      y = b[i] - mb;
    sab += x * y;
    saa += x * x;
    sbb += y * y;
  }
  return saa > 0 && sbb > 0 ? sab / Math.sqrt(saa * sbb) : null;
}

/* lineage label; anything strictly between 0 and 1 is a hybrid and is counted
 * separately rather than rounded into a side */
function label(x) {
  const a = x.anc || 0;
  if (a === 0) return 0;
  if (a === 1) return 1;
  return -1;
}

function replicate(seed, N0, arm) {
  const GENS = gensFor(N0);
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const phen = { slices: SLICES, width: WIDTH };
  const opts = {
    ...I.DEFAULTS,
    siteN: SITE_N,
    phenology: phen,
    visitsPerPlant: VPP,
  };
  /* Bx: arm B handed enough extra budget that its realised SPEND matches arm
   * A's. ⚠️ NOT a "budget-matched" arm in the sense #55's limitation described —
   * both arms were always GIVEN the same budget; they differ in how much of it
   * the allocation rule CONSUMES. */
  if (arm === "Bx") opts.visitsPerPlant = VPP * 1.574;
  /*
   * #57's selfing arms. `rate` is a maternal weight FLOOR, so a plant nobody
   * visited reproduces almost entirely by selfing (sim/ibm.js:670-701) — which
   * is reproductive assurance against exactly the mate limitation #56 measured,
   * and the one intervention that can lift the k=1 floor at all.
   *
   * ⚠️ Sn adds `ancNull`, and the pair exists because the TRACER CONVENTION
   * decides what "the floor lifted" means. Without it a selfed offspring keeps
   * the mother's `anc` unaveraged and counts as her lineage; with it that `anc`
   * is averaged against a random individual and the same seed counts as a
   * hybrid. The S-minus-Sn difference is the artefact, measured.
   */
  const self = selfingFor(arm);
  if (self) opts.selfing = self;
  /* the realised parentage, for the tracer-INDEPENDENT fitness measure below */
  opts.logMatings = true;
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  if (!built) return null;

  let pop = built.pop;
  const ancVar0 = I.ancestryVar(pop);
  const rows = [];
  let extinct = false;

  for (let g = 0; g < GENS; g++) {
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    phen.displayProportionalVisits = arm === "B" || arm === "Bx";

    const labels = pop.map(label);
    let n0 = 0,
      n1 = 0,
      nh = 0;
    for (const L of labels) {
      if (L === 0) n0++;
      else if (L === 1) n1++;
      else nh++;
    }

    const res = I.step(pop, opts, rng, g, srng, brng);

    const informative = n0 > 0 && n1 > 0;
    let k = null,
      p = null,
      r = null,
      w = null,
      selfShare = null,
      consPC = null,
      cf = null,
      wMat = null,
      minMothered = null,
      minorIs0 = null;
    if (informative) {
      minorIs0 = n0 < n1;
      const nMin = minorIs0 ? n0 : n1;
      const nMaj = minorIs0 ? n1 : n0;
      k = nMin;
      p = nMin / (nMin + nMaj);
      const minor = minorIs0 ? 0 : 1;

      if (res.visitsTo) {
        let vMin = 0,
          vMaj = 0;
        for (let i = 0; i < labels.length; i++) {
          if (labels[i] < 0) continue;
          if (labels[i] === minor) vMin += res.visitsTo[i];
          else vMaj += res.visitsTo[i];
        }
        const pcMaj = vMaj / nMaj;
        r = pcMaj > 0 ? vMin / nMin / pcMaj : null;
      }

      let o0 = 0,
        o1 = 0;
      for (const c of res.pop) {
        const L = label(c);
        if (L === 0) o0++;
        else if (L === 1) o1++;
      }
      const wMaj = (minorIs0 ? o1 : o0) / nMaj;
      w = wMaj > 0 ? (minorIs0 ? o0 : o1) / nMin / wMaj : null;

      /*
       * THE GEITONOGAMY MEASUREMENT. T has a diagonal and `received` skips it
       * (sim/ibm.js:1751, "selfing is not mating success"), so self-pollen is
       * separately visible. For the MINORITY lineage only: how much of what its
       * plants receive is their own pollen, and how much conspecific outcross
       * pollen does each of its plants get?
       */
      if (res.T) {
        let selfSum = 0,
          consSum = 0;
        for (let j = 0; j < labels.length; j++) {
          if (labels[j] !== minor) continue;
          selfSum += res.T[j][j];
          for (let i = 0; i < labels.length; i++) {
            if (i === j) continue;
            if (labels[i] === minor) consSum += res.T[i][j];
          }
        }
        const tot = selfSum + consSum;
        selfShare = tot > 0 ? selfSum / tot : null;
        consPC = consSum / nMin;
      }

      /*
       * #57 PRIMARY — CO-FLOWERING CONSPECIFICS. For each minority plant, how
       * many OTHER minority plants have an overlapping flowering window, by the
       * model's own in-flower predicate. `k` counts the lineage; this counts the
       * partners it can actually reach, and the two are only the same if the
       * lineage flowers together.
       */
      if (res.blooms) {
        const counts = [];
        for (let j = 0; j < labels.length; j++) {
          if (labels[j] !== minor) continue;
          let c = 0;
          for (let i = 0; i < labels.length; i++) {
            if (i === j || labels[i] !== minor) continue;
            if (I.ringDist(res.blooms[i], res.blooms[j]) <= WIDTH) c++;
          }
          counts.push(c);
        }
        cf = mean(counts);
        /* C9: cf counts OTHER conspecifics, so it cannot exceed k-1. Exceeding
         * it would mean the predicate is counting the plant itself or reaching
         * across lineages, and the primary would be measuring neither thing. */
        if (cf != null && cf > k - 1 + 1e-9) c9violations++;
      }

      /*
       * #57 SECONDARY 2 — FITNESS BY THE MOTHER'S LINEAGE, which the `anc`
       * averaging convention cannot touch. At k=1 the tracer says w=0, but self
       * share is self/(self + conspecific outcross) and is silent about pollen
       * from the OTHER lineage: a lone plant may be mothering hybrids. This
       * separates "she does not reproduce" from "her lineage does not persist",
       * and it is the only measure that stays meaningful under `ancNull`.
       */
      if (res.matings) {
        let mMin = 0,
          mMaj = 0;
        for (const m of res.matings) {
          const L = labels[m.m];
          if (L === minor) mMin++;
          else if (L >= 0) mMaj++;
        }
        const wmMaj = mMaj / nMaj;
        wMat = wmMaj > 0 ? mMin / nMin / wmMaj : null;
        /* the ABSOLUTE count, because at k=1 the question is not "how does her
         * rate compare" but "did she reproduce at all", and a ratio of 0 and a
         * ratio that is undefined look alike in a mean */
        minMothered = mMin;
      }
    }

    /* the flat budget's lineage-free signature */
    let crowdCorr = null;
    if (res.visitsTo && res.blooms) {
      const co = [],
        vis = [];
      for (let i = 0; i < res.blooms.length; i++) {
        let c = 0;
        for (let j = 0; j < res.blooms.length; j++)
          if (j !== i && I.ringDist(res.blooms[i], res.blooms[j]) <= WIDTH) c++;
        co.push(c);
        vis.push(res.visitsTo[i]);
      }
      crowdCorr = corr(co, vis);
    }

    rows.push({
      g,
      n0,
      n1,
      nh,
      informative,
      k,
      p,
      r,
      w,
      cf,
      wMat,
      minMothered,
      /* C10: an arm that does not actually self would produce a confident null
       * about selfing. Recorded so the control is data, not an assumption. */
      selfedN: (res.matings || []).filter((m) => m.selfed).length,
      matingsN: (res.matings || []).length,
      /*
       * ⚠️ #62's C-MATCH, RECORDED PER GENERATION SO IT IS CHECKED ON THE REAL
       * SWEEP AND NOT ONLY ON A FIXTURE. The dose arm and the flat arm must
       * spend an identical TOTAL of maternal assurance; if they do not, the
       * comparison is a test of how MUCH selfing there is rather than of its
       * shape, and #58 already answered that. A unit test on one seed cannot
       * see a drift that only appears at some population state, so the total
       * travels in the archive and the analysis asserts on it row by row.
       */
      selfWTot: res.selfW ? res.selfW.reduce((a, b) => a + b, 0) : null,
      /*
       * ⚠️ #63's C-RESID AND C-ZERO, RECORDED FOR THE SAME REASON. The
       * residualised arm's entire claim is that its assurance no longer tracks
       * `received`, and that its clipped variant starves a large but
       * lineage-unbiased share of plants. Both were measured PRE-FLIGHT, on a
       * re-run of a DIFFERENT arm — which makes them premises. Measured here
       * they are findings about the data that shipped.
       *
       * `selfWZeroMin`/`selfWZeroMaj` split the starved plants by lineage
       * because #62 refuted the abandoned-plant mechanism partly on its being
       * UNBIASED; at 66.7% starved that refutation has to be re-earned rather
       * than inherited.
       */
      selfWRho:
        res.selfW && res.received ? corr(res.selfW, res.received) : null,
      selfWZero: res.selfW ? res.selfW.filter((x) => x === 0).length : null,
      ...(() => {
        if (!res.selfW || !informative) return {};
        const minor = n0 < n1 ? 0 : 1;
        let zMin = 0,
          zMaj = 0,
          nMin = 0,
          nMaj = 0;
        for (let i = 0; i < res.selfW.length && i < labels.length; i++) {
          if (labels[i] === minor) {
            nMin++;
            if (res.selfW[i] === 0) zMin++;
          } else if (labels[i] === 1 - minor) {
            nMaj++;
            if (res.selfW[i] === 0) zMaj++;
          }
        }
        return {
          selfWZeroMin: zMin,
          selfWZeroMaj: zMaj,
          selfWNMin: nMin,
          selfWNMaj: nMaj,
        };
      })(),
      /*
       * ⚠️ #59: `matings` is pushed only when a seed ESTABLISHES, so under
       * inbreeding depression `selfedN/matingsN` is the share of SURVIVING
       * offspring that were selfed — which falls with cost even though the
       * selfing DECISION rate is untouched. Reading C10 off that alone would
       * report "the arm stopped selfing" when the arm is selfing exactly as
       * hard and the seeds are dying, which is a confident null about cost
       * hiding an inert-looking lever. `unmated` is the model's own count of
       * seeds that failed to establish (sim/ibm.js `failed`), and with the
       * default path's father<0 branch unreachable it is the cost deaths — so
       * ATTEMPTED selfing is `selfedN + unmated`, measured, not inferred from
       * the cost parameter. Positive control: at cost 0 `unmated` must be ~0.
       */
      recruits: res.recruits,
      unmated: res.unmated,
      target: res.target,
      selfShare,
      consPC,
      crowdCorr,
      spent: res.visitsSpent,
    });
    pop = res.pop;
  }

  return {
    seed,
    N0,
    arm,
    rows,
    fate: I.fateOf(pop, ancVar0, extinct),
  };
}

/* --------------------------------------------------------------- run/load */
const N0S = [20, 30, 60];
const out = {}; /* key "N0:arm" -> [replicate] */
const keyOf = (N0, arm) => `${N0}:${arm}`;
const ALL = [];
for (const N0 of N0S) for (const arm of ["A", "B"]) ALL.push([N0, arm]);
ALL.push([30, "Bx"]);
/* #57's selfing pair, N0=30 only: S lifts the k=1 floor, Sn measures how much of
 * that lift is the tracer's arithmetic rather than biology */
ALL.push([30, "S"]);
ALL.push([30, "Sn"]);
/* #58's rate sweep at N0=30. Arm A is the rate=0 cell of this sweep, so it is
 * not duplicated here. RF_CONFIGS selects which cells actually run. */
for (const r of [25, 50, 100, 200]) ALL.push([30, `R${r}`]);
/* the mechanical-null companion, at the one rate where HELD moved */
ALL.push([30, "R200n"]);
/* #59's cost sweep, at rate 2.0 — the only rate where #58 saw coexistence move,
 * so the only rate where inbreeding depression has something to take away. The
 * cost-0 cell of this sweep IS 30:R200 and is not duplicated. */
for (const c of [25, 50, 75, 95]) ALL.push([30, `R200c${c}`]);
/*
 * #62's dose-dependent arm, at the same rate 2.0 so its comparator is the
 * EXISTING 30:R200 cell rather than a new one. The two spend an identical total
 * of maternal assurance per generation (C-match, asserted in
 * tests/selfing-dose.test.js) and differ only in how it is distributed, so the
 * pair isolates the SHAPE of the floor from its SIZE — which #58 already swept.
 */
ALL.push([30, "R200d"]);
/*
 * #63's residualised arms, again at rate 2.0 so they compare against the SAME
 * existing 30:R200 flat cell and 30:R200d dose cell. Assurance is proportional
 * to the part of a plant's self-pollen that `received` does not predict, which
 * is the intervention #62 named in its own limitations and did not run.
 *
 * ⚠️ TWO ARMS BECAUSE THE PRE-FLIGHT FORCED IT. "r" clips negative residuals to
 * zero and thereby withdraws assurance from 66.7% of plants; "s" shifts instead,
 * preserving the IDENTICAL residual ordering while zeroing 3.3%. #62 refuted the
 * abandoned-plant mechanism at 4.3% and that refutation does not reach two
 * thirds, so the pair separates the ablation from the starvation. Registered in
 * docs/2026-09-04-selfing-resid-prereg.md before either existed.
 */
ALL.push([30, "R200r"]);
ALL.push([30, "R200s"]);
for (const [N0, arm] of ALL) out[keyOf(N0, arm)] = [];

/*
 * ⚠️ RF_FROM MUST READ THE ARCHIVES, NOT JUST THE SCRATCH DUMPS. Everything in
 * docs/data/ is gzipped, and this loader used to JSON.parse the raw bytes — so
 * the runner could not re-report from its own published archives, only from the
 * uncommitted _scratch copies that happened to still be lying around. It failed
 * loudly rather than silently, which is the only reason it was not worse: a
 * reproducibility archive nothing can read is not an archive.
 */
function loadDump(path) {
  const raw = path.endsWith(".gz")
    ? zlib.gunzipSync(fs.readFileSync(path))
    : fs.readFileSync(path);
  return JSON.parse(raw.toString("utf8"));
}

if (FROM) {
  for (const f of FROM.split(",")) {
    const loaded = loadDump(f.trim());
    for (const key of Object.keys(loaded.cells))
      if (loaded.cells[key].length)
        out[key] = (out[key] || []).concat(loaded.cells[key]);
  }
  process.stderr.write(
    `re-reporting from ${FROM}: ` +
      Object.entries(out)
        .filter(([, v]) => v.length)
        .map(([k, v]) => `${k}=${v.length}`)
        .join(" ") +
      `\n`,
  );
}

/* RF_CONFIGS picks which cells to simulate, e.g. "30:A" or "20:A,20:B". One cell
 * is a job; all seven together are not, on the evidence of #55's two kills. */
const WANT = process.env.RF_CONFIGS
  ? process.env.RF_CONFIGS.split(",").map((s) => s.trim())
  : ALL.map(([n, a]) => keyOf(n, a));

function writeDump(tag) {
  if (!DUMP) return;
  fs.writeFileSync(
    DUMP,
    JSON.stringify({
      config: { SITE_N, D_EXCL, SLICES, WIDTH, VPP, N_SEEDS, N0S },
      cells: out,
    }),
  );
  process.stderr.write(`  ${tag} dump updated: ${DUMP}\n`);
}

/*
 * ⚠️ FAIL LOUD ON A CELL THAT DOES NOT EXIST. WANT is filtered against ALL, so
 * an RF_CONFIGS entry naming an unregistered cell used to be dropped in
 * silence: the run reported on whatever cells DID match and said nothing about
 * the ones it skipped. #59's own pre-flight asked for four cells and got two
 * that way — the cost arms had not been added to ALL yet — and nothing in the
 * output distinguished that from the cells having been run. A sweep that
 * quietly drops half its arms produces a report that is not wrong about any
 * number it prints, which is the worst way to be wrong.
 */
const UNKNOWN = WANT.filter((k) => !ALL.some(([n, a]) => keyOf(n, a) === k));
if (UNKNOWN.length) {
  process.stderr.write(
    `RF_CONFIGS names ${UNKNOWN.length} unknown cell(s): ${UNKNOWN.join(", ")}\n` +
      `known cells: ${ALL.map(([n, a]) => keyOf(n, a)).join(", ")}\n`,
  );
  process.exit(2);
}

if (!FROM)
  for (const [N0, arm] of ALL) {
    const key = keyOf(N0, arm);
    if (!WANT.includes(key)) continue;
    out[key] = [];
    for (let s = 1; s <= N_SEEDS; s++) {
      const rep = replicate(s, N0, arm);
      if (rep) out[key].push(rep);
      process.stderr.write(
        `  [${key}] seed ${s}/${N_SEEDS} founded=${out[key].length}\n`,
      );
      if (s % 5 === 0) writeDump(`[${key}] seed ${s}:`);
    }
    writeDump(`[${key}] cell complete:`);
  }

/* ------------------------------------------------------------------ report */
const have = (key) => out[key] && out[key].length;
console.log(
  `\n#56 rare-floor — visitsPerPlant=${VPP}, cells: ` +
    ALL.map(([n, a]) => keyOf(n, a))
      .filter(have)
      .map((k) => `${k}(${out[k].length})`)
      .join(" ") +
    (FROM ? `  [re-reported]` : ``),
);
console.log(
  `generations: ` + N0S.map((n) => `N0=${n}->${gensFor(n)}`).join("  "),
);

/* ---- controls */
const HELD = (key) => {
  if (!have(key)) return null;
  const r = out[key].filter((x) => x.seed <= REPRO_SEEDS);
  return r.length ? r.filter((x) => x.fate === "HELD").length / r.length : null;
};
const heldA = HELD("30:A"),
  heldB = HELD("30:B");
const C1 = heldA != null && Math.abs(heldA - 0.289) < 0.0005;
const C2 = heldB != null && Math.abs(heldB - 0.026) < 0.0005;
console.log("\ncontrols");
console.log(
  `  C1 N0=30 arm A HELD = ${heldA != null ? heldA.toFixed(3) : "—"} vs 0.289   ${heldA == null ? "not run" : C1 ? "PASS" : "FAIL"}`,
);
console.log(
  `  C2 N0=30 arm B HELD = ${heldB != null ? heldB.toFixed(3) : "—"} vs 0.026   ${heldB == null ? "not run" : C2 ? "PASS" : "FAIL"}`,
);
let c5 = true;
for (const [N0, arm] of ALL) {
  const key = keyOf(N0, arm);
  if (!have(key)) continue;
  for (const rep of out[key])
    for (const row of rep.rows) if (row.n0 + row.n1 + row.nh !== N0) c5 = false;
}
console.log(
  `  C5 lineage counts exhaust the population: ${c5 ? "PASS" : "FAIL"}`,
);
/* C9 is re-derived from the ROWS rather than trusted from the in-process
 * counter, because a dump loaded with RF_FROM was produced by another process
 * whose counter is gone. A control that silently reads 0 because nothing counted
 * is not a control. */
{
  let bad = 0,
    seen = 0;
  for (const [N0, arm] of ALL) {
    const key = keyOf(N0, arm);
    if (!have(key)) continue;
    for (const rep of out[key])
      for (const row of rep.rows) {
        if (!row.informative || row.cf == null) continue;
        seen++;
        if (row.cf > row.k - 1 + 1e-9) bad++;
      }
  }
  console.log(
    `  C9 co-flowering count never exceeds k-1: ` +
      (seen === 0
        ? "NO cf RECORDED — not a pass, the primary has no input"
        : bad === 0
          ? `PASS (0 violations in ${seen} informative generations)`
          : `FAIL (${bad} violations in ${seen})`),
  );
}
/* C10 — the selfing arms must actually self, and the others must not. An inert
 * arm returns a confident null about the intervention it was supposed to make. */
console.log(
  `  C10 selfed share of matings — must be 0 where selfingFor(arm) is null, > 0 where it is not`,
);
for (const [N0, arm] of ALL) {
  const key = keyOf(N0, arm);
  if (!have(key)) continue;
  let s = 0,
    t = 0;
  for (const rep of out[key])
    for (const row of rep.rows) {
      s += row.selfedN || 0;
      t += row.matingsN || 0;
    }
  /* ⚠️⚠️ THE EXPECTATION IS READ FROM THE ARM'S CONFIG, NOT FROM ITS NAME.
   * This predicate cried wolf twice — a name list that knew only S/Sn failed
   * #58's four rate cells, and the widened `/^R\d+$/` then failed #59's four
   * cost cells — both times while the simulation was doing exactly what it was
   * asked. A control that fails on correct behaviour is as broken as one that
   * passes on bad behaviour; it just fails in the direction that looks
   * conscientious. Asking selfingFor() removes the second derivation rather
   * than widening it a third time. */
  const cfg = selfingFor(arm);
  const frac = t > 0 ? s / t : null;
  /* ⚠️ under inbreeding depression the ESTABLISHED share is legitimately far
   * below the attempted rate — at cost 0.95 it reads ~9% — so a selfing arm is
   * only required to be non-zero here. #59's C10' carries the attempted-rate
   * check, which is the one that can tell an inert lever from a lethal one. */
  const ok = frac == null ? null : cfg ? frac > 0.01 : frac === 0;
  console.log(
    `     ${key.padEnd(6)} ${frac == null ? "no matings recorded" : (100 * frac).toFixed(2) + "%"}` +
      `${cfg ? `  (configured rate ${cfg.rate}, cost ${cfg.cost})` : "  (no selfing configured)"}` +
      `   ${ok == null ? "" : ok ? "PASS" : "FAIL"}`,
  );
}
console.log(
  "  C3 corr(slice crowding, visits) — negative under the premium, ~0 without",
);
for (const [N0, arm] of ALL) {
  const key = keyOf(N0, arm);
  if (!have(key)) continue;
  const xs = [];
  for (const rep of out[key])
    for (const row of rep.rows)
      if (row.crowdCorr != null) xs.push(row.crowdCorr);
  const m = mean(xs);
  console.log(
    `     ${key.padEnd(6)} ${m != null ? m.toFixed(3) : "—"}  (n=${xs.length} generations)`,
  );
}
console.log(
  `  C4 visits spent per generation (reported, not asserted — the allocation rule decides the SPEND)`,
);
for (const [N0, arm] of ALL) {
  const key = keyOf(N0, arm);
  if (!have(key)) continue;
  const xs = [];
  for (const rep of out[key]) for (const row of rep.rows) xs.push(row.spent);
  console.log(
    `     ${key.padEnd(6)} ${mean(xs) != null ? mean(xs).toFixed(0) : "—"}`,
  );
}

/* ---- the two binnings */
function cells(key, field, lo, hi, byCount) {
  const xs = [];
  if (!have(key)) return xs;
  for (const rep of out[key])
    for (const row of rep.rows) {
      if (!row.informative || row[field] == null) continue;
      const v = byCount ? row.k : row.p;
      if (v == null || v < lo || v >= hi) continue;
      xs.push(row[field]);
    }
  return xs;
}
const K_BINS = [];
for (let k = 1; k <= 10; k++) K_BINS.push([k, k + 1, `k=${k}`]);
const P_BINS = [];
for (let b = 0; b < 10; b++)
  P_BINS.push([
    b / 20,
    (b + 1) / 20,
    `${(b / 20).toFixed(2)}-${((b + 1) / 20).toFixed(2)}`,
  ]);

function table(field, bins, byCount, arm) {
  console.log(
    `\n  ${field === "w" ? "realised fitness ratio w" : field === "r" ? "per-capita visit ratio r" : field} by minority ${byCount ? "COUNT" : "FREQUENCY"}, arm ${arm}`,
  );
  console.log(
    `    bin        ` + N0S.map((n) => `N0=${String(n).padEnd(12)}`).join(""),
  );
  for (const [lo, hi, name] of bins) {
    const cellsFor = N0S.map((n) =>
      cells(keyOf(n, arm), field, lo, hi, byCount),
    );
    if (!cellsFor.some((c) => c.length)) continue;
    console.log(
      `    ${name.padEnd(10)} ` +
        cellsFor
          .map((c) => {
            const m = mean(c);
            return (
              (m == null ? "  —  " : m.toFixed(3)) +
              ` (${String(c.length).padStart(3)})   `
            );
          })
          .join(""),
    );
  }
}

/*
 * THE SPEND-MATCHED COMPARISON, at N0=30 only. All three arms there share a
 * population size, so they can be put side by side: A has the premium, B does
 * not, and Bx does not but is handed enough extra budget that its realised SPEND
 * matches A's. If A's advantage were really about delivering more visits rather
 * than about allocating them differently, Bx would look like A.
 */
function armsAt30(field, bins, byCount) {
  const arms = ["A", "B", "Bx"];
  if (!arms.every((a) => have(keyOf(30, a)))) return;
  console.log(
    `\n  ${field === "w" ? "fitness ratio w" : "visit ratio r"} by minority ${byCount ? "COUNT" : "FREQUENCY"}, N0=30, all three arms`,
  );
  console.log(`    bin        ` + arms.map((a) => `${a.padEnd(15)}`).join(""));
  for (const [lo, hi, name] of bins) {
    const cs = arms.map((a) => cells(keyOf(30, a), field, lo, hi, byCount));
    if (!cs.some((c) => c.length)) continue;
    console.log(
      `    ${name.padEnd(10)} ` +
        cs
          .map((c) => {
            const m = mean(c);
            return (
              (m == null ? "  —  " : m.toFixed(3)) +
              ` (${String(c.length).padStart(3)})  `
            );
          })
          .join(""),
    );
  }
}

/* ---- primary: which axis collapses the three curves */
const MIN_OBS = 5;
const MIN_BINS = 4;
function dispersion(bins, byCount, arm) {
  const sds = [],
    devs = [];
  let shared = 0;
  for (const [lo, hi] of bins) {
    const ms = N0S.map((n) => {
      const c = cells(keyOf(n, arm), "w", lo, hi, byCount);
      return c.length >= MIN_OBS ? mean(c) : null;
    });
    if (ms.some((m) => m == null)) continue;
    shared++;
    sds.push(sd(ms));
    devs.push(Math.abs(mean(ms) - 1));
  }
  if (shared < MIN_BINS) return { shared, D: null };
  const scale = mean(devs);
  if (!(scale > 0.02)) return { shared, D: null, degenerate: true };
  return { shared, D: mean(sds) / scale, scale };
}

/*
 * AN INTERVAL ON THE RATIO, not just a point. The registered thresholds are 1.25
 * and 0.80 and a point estimate landing outside them says nothing about how
 * firmly. Seeds are resampled WITHIN each cell — a seed is one trajectory and
 * its generations are not independent draws, so resampling generations would
 * understate the spread the way it would have in #55.
 */
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function bootstrapRatio(arm, nb) {
  const rnd = mulberry32(20260903);
  const orig = {};
  for (const n of N0S) orig[keyOf(n, arm)] = out[keyOf(n, arm)];
  const ratios = [];
  for (let b = 0; b < nb; b++) {
    for (const n of N0S) {
      const key = keyOf(n, arm);
      const src = orig[key];
      const res = [];
      for (let i = 0; i < src.length; i++)
        res.push(src[(rnd() * src.length) | 0]);
      out[key] = res;
    }
    const dk = dispersion(K_BINS, true, arm);
    const dp = dispersion(P_BINS, false, arm);
    if (dk.D != null && dp.D != null && dk.D > 0) ratios.push(dp.D / dk.D);
  }
  for (const n of N0S) out[keyOf(n, arm)] = orig[keyOf(n, arm)];
  return ratios;
}
const quant = (xs, p) => {
  const s = xs.slice().sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))];
};

for (const arm of ["A", "B"]) {
  if (!N0S.every((n) => have(keyOf(n, arm)))) continue;
  table("w", K_BINS, true, arm);
  table("w", P_BINS, false, arm);
}
table("r", K_BINS, true, "A");
armsAt30("r", K_BINS, true);
armsAt30("w", K_BINS, true);
{
  const h = (a) => {
    const v = HELD(keyOf(30, a));
    return v == null ? "—" : v.toFixed(3);
  };
  if (have(keyOf(30, "Bx")))
    console.log(
      `\n  HELD at N0=30 (seeds 1..${REPRO_SEEDS}):  A ${h("A")}   B ${h("B")}   Bx ${h("Bx")}` +
        `\n  Bx is arm B handed enough budget to SPEND what arm A spends. If A's advantage were` +
        `\n  about the number of visits delivered rather than their allocation, Bx would match A.`,
    );
}

console.log(
  `\nPRIMARY — does w collapse on COUNT or on FREQUENCY? (arm A; >1.25 count, <0.80 frequency)`,
);
for (const arm of ["A", "B"]) {
  if (!N0S.every((n) => have(keyOf(n, arm)))) {
    console.log(`  arm ${arm}: not all three N0 present, skipped`);
    continue;
  }
  const dk = dispersion(K_BINS, true, arm);
  const dp = dispersion(P_BINS, false, arm);
  if (dk.D == null || dp.D == null) {
    console.log(
      `  arm ${arm}: NOT ESTIMABLE — shared bins count=${dk.shared} freq=${dp.shared} ` +
        `(need ${MIN_BINS})${dk.degenerate || dp.degenerate ? ", or |w-1| too small to normalise by" : ""}. ` +
        `No ratio is reported; a collapse statistic over too few bins is not a result.`,
    );
    continue;
  }
  const ratio = dp.D / dk.D;
  const verdict =
    ratio > 1.25
      ? "COUNT"
      : ratio < 0.8
        ? "FREQUENCY"
        : "NO VERDICT (0.80-1.25)";
  const boot = bootstrapRatio(arm, 2000);
  const lo = boot.length ? quant(boot, 0.025) : null;
  const hi = boot.length ? quant(boot, 0.975) : null;
  const pCount = boot.length
    ? boot.filter((x) => x > 1.25).length / boot.length
    : null;
  console.log(
    `  arm ${arm}: D_count=${dk.D.toFixed(3)} (${dk.shared} bins)  D_freq=${dp.D.toFixed(3)} (${dp.shared} bins)  ` +
      `ratio D_p/D_k = ${ratio.toFixed(3)}  ->  ${verdict}` +
      (lo != null
        ? `\n          bootstrap over seeds: [${lo.toFixed(3)}, ${hi.toFixed(3)}], ` +
          `P(ratio > 1.25) = ${pCount.toFixed(3)}  (n=${boot.length}/2000 resamples estimable)`
        : ``),
  );
}

/* ---- secondary: crossing points */
function crossing(bins, byCount, arm, N0) {
  let prev = null;
  for (const [lo, hi] of bins) {
    const c = cells(keyOf(N0, arm), "w", lo, hi, byCount);
    if (c.length < MIN_OBS) continue;
    const m = mean(c);
    const x = (lo + hi) / 2;
    if (prev && prev.m < 1 && m >= 1) {
      const f = (1 - prev.m) / (m - prev.m);
      return prev.x + f * (x - prev.x);
    }
    prev = { x, m };
  }
  return null;
}
console.log(
  `\nSECONDARY — where does w cross 1?  (count hypothesis: k* agrees, p* does not)`,
);
for (const N0 of N0S) {
  if (!have(keyOf(N0, "A"))) continue;
  const ks = crossing(K_BINS, true, "A", N0);
  const ps = crossing(P_BINS, false, "A", N0);
  console.log(
    `  N0=${String(N0).padStart(2)}   k* = ${ks == null ? "—" : ks.toFixed(2)}    p* = ${ps == null ? "—" : ps.toFixed(3)}` +
      (ks != null ? `   (k*/N0 = ${(ks / N0).toFixed(3)})` : ""),
  );
}

/* ---- secondary 2: geitonogamy, measured */
console.log(
  `\nSECONDARY 2 — is it geitonogamy? minority self-pollen share and conspecific outcross receipt`,
);
console.log(
  `  (mate limitation predicts self share RISES and conspecific receipt FALLS as the minority thins)`,
);
for (const N0 of N0S) {
  const key = keyOf(N0, "A");
  if (!have(key)) continue;
  console.log(`  N0=${N0}, arm A`);
  console.log(
    `     k        self share       conspecific outcross receipt / plant     n`,
  );
  for (const [lo, hi, name] of K_BINS) {
    const ss = cells(key, "selfShare", lo, hi, true);
    const cp = cells(key, "consPC", lo, hi, true);
    if (ss.length < MIN_OBS) continue;
    console.log(
      `     ${name.padEnd(6)}  ${mean(ss).toFixed(4)}            ${mean(cp).toFixed(2)}                        ${ss.length}`,
    );
  }
}

/* ==========================================================================
 * #57 PRIMARY — at fixed minority COUNT, does fitness rise with CO-FLOWERING
 * partners?
 *
 * The design filed for #57 compared how well `w` collapses across N0 when binned
 * by k against by cf. A pre-flight killed it: under the premium cf is about
 * 0.9(k-1), because the premium drives each lineage into its own bloom slice, so
 * the two axes are nearly the SAME axis and the comparison would return NO
 * VERDICT by construction rather than by evidence.
 *
 * What survives is the residual spread — sd(cf | k) = 1.72, and at k=11 cf runs
 * from 2.0 to 10.0 — which lets the question be asked WITHIN a count stratum:
 * hold k, split on cf, and see whether w moves. Currency is cf if it does,
 * k if it does not.
 * ========================================================================== */
const MIN_STRATUM = 12;

function rowsOf(keys) {
  const bySeedKey = [];
  for (const key of keys) {
    if (!have(key)) continue;
    for (const rep of out[key])
      bySeedKey.push(
        rep.rows.filter(
          (r) => r.informative && r.w != null && r.cf != null && r.k >= 2,
        ),
      );
  }
  return bySeedKey; /* one array per seed, so the bootstrap can resample seeds */
}

/* `field` defaults to w, the registered primary. Running the SAME statistic on
 * `r` diagnoses an unregistered sign rather than leaving it unexplained: under a
 * flat per-slice budget, minority plants that co-flower more tightly occupy
 * fewer slices, so fewer slices draw a full allowance for them. If the negative
 * effect on fitness is that crowding, it must show up in visits first. */
function cfEffect(seedGroups, field) {
  const f = field || "w";
  const all = [];
  for (const g of seedGroups) for (const r of g) all.push(r);
  const byK = new Map();
  for (const r of all) {
    if (r[f] == null) continue;
    if (!byK.has(r.k)) byK.set(r.k, []);
    byK.get(r.k).push(r);
  }
  let num = 0,
    den = 0,
    strata = 0;
  for (const [, rows] of byK) {
    if (rows.length < MIN_STRATUM) continue;
    const cfs = rows.map((r) => r.cf).sort((a, b) => a - b);
    const med = cfs[Math.floor(cfs.length / 2)];
    const hi = rows.filter((r) => r.cf > med).map((r) => r[f]);
    const lo = rows.filter((r) => r.cf <= med).map((r) => r[f]);
    if (hi.length < 3 || lo.length < 3) continue;
    strata++;
    num += rows.length * (mean(hi) - mean(lo));
    den += rows.length;
  }
  return { d: den > 0 ? num / den : null, strata };
}

function mb32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const qq = (xs, p) => {
  const s = xs.slice().sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))];
};

console.log(
  `\n#57 PRIMARY — at fixed k, does w rise with co-flowering partners cf?`,
);
console.log(
  `  registered: CI excludes 0 above -> cf is a currency beyond k; CI contains 0 with`,
);
console.log(
  `  half-width < 0.15 -> k alone suffices; CI contains 0 and wider -> NO VERDICT.`,
);
for (const [label2, keys] of [
  ["arm A, all N0 pooled", N0S.map((n) => keyOf(n, "A"))],
  ["arm A, N0=30 only", [keyOf(30, "A")]],
  ["arm A, N0=60 only", [keyOf(60, "A")]],
  ["arm B, N0=30", [keyOf(30, "B")]],
]) {
  const groups = rowsOf(keys);
  if (!groups.length) continue;
  const pt = cfEffect(groups);
  if (pt.d == null || pt.strata < 4) {
    console.log(
      `  ${label2.padEnd(22)} UNESTIMABLE — ${pt.strata} usable k strata (need 4). ` +
        `A stratified statistic over fewer is not reported.`,
    );
    continue;
  }
  const rnd = mb32(20260903);
  const boot = [];
  for (let b = 0; b < 2000; b++) {
    const rs = [];
    for (let i = 0; i < groups.length; i++)
      rs.push(groups[(rnd() * groups.length) | 0]);
    const e = cfEffect(rs);
    if (e.d != null && e.strata >= 4) boot.push(e.d);
  }
  const lo = qq(boot, 0.025),
    hi = qq(boot, 0.975);
  const half = (hi - lo) / 2;
  const verdict =
    lo > 0
      ? "cf IS a currency beyond k"
      : hi < 0
        ? "cf NEGATIVE — unregistered direction, reported not interpreted"
        : half < 0.15
          ? "k ALONE SUFFICES (informative null)"
          : "NO VERDICT — underpowered";
  console.log(
    `  ${label2.padEnd(22)} d = ${pt.d.toFixed(4)}  [${lo.toFixed(4)}, ${hi.toFixed(4)}]` +
      `  half-width ${half.toFixed(4)}  ${pt.strata} strata  ->  ${verdict}`,
  );
}

/* the named fallback reading, structural and independent of w entirely */
console.log(
  `\n#57 FALLBACK READING — cf/(k-1): does the PREMIUM make census count equal partner count?`,
);
for (const [N0, arm] of ALL) {
  const key = keyOf(N0, arm);
  if (!have(key)) continue;
  const xs = [];
  for (const rep of out[key])
    for (const r of rep.rows)
      if (r.informative && r.cf != null && r.k >= 2) xs.push(r.cf / (r.k - 1));
  if (xs.length < 20) continue;
  console.log(
    `  ${key.padEnd(6)} mean cf/(k-1) = ${mean(xs).toFixed(3)}  (n=${xs.length} generations)`,
  );
}

/* SECONDARY 2 — is a lone plant sterile, or just not perpetuating her lineage? */
console.log(
  `\n#57 SECONDARY 2 — fitness by the MOTHER's lineage (tracer-independent) vs by the tracer`,
);
console.log(
  `  ⚠️ wMat equals w wherever nothing blends — an offspring's own label IS its`,
);
console.log(
  `  mother's unless a cross happened. It earns its place at k=1, where it says`,
);
console.log(
  `  whether the lone plant mothered ANYTHING (hybrids included) or nothing at all.`,
);
console.log(
  `  cell     k     w (tracer)     wMat (by mother)   offspring mothered   n`,
);
for (const [N0, arm] of ALL) {
  const key = keyOf(N0, arm);
  if (!have(key)) continue;
  for (const k of [1, 2, 3]) {
    const ws = [],
      wm = [],
      mo = [];
    for (const rep of out[key])
      for (const r of rep.rows) {
        if (!r.informative || r.k !== k) continue;
        if (r.w != null) ws.push(r.w);
        if (r.wMat != null) wm.push(r.wMat);
        if (r.minMothered != null) mo.push(r.minMothered);
      }
    if (!ws.length && !wm.length) continue;
    console.log(
      `  ${key.padEnd(6)}  ${k}    ${ws.length ? mean(ws).toFixed(4) : "  —  "}         ` +
        `${wm.length ? mean(wm).toFixed(4) : "  —  "}            ` +
        `${mo.length ? mean(mo).toFixed(3).padStart(8) : "    —   "}         ` +
        `${Math.max(ws.length, wm.length)}`,
    );
  }
}

/* ---------------------------------------------------------------------------
 * DIAGNOSING THE UNREGISTERED SIGN. The primary came back NEGATIVE in arm A: at
 * fixed k, minority lineages whose plants co-flower MORE have slightly LOWER
 * fitness. That is the opposite of a mate-limitation effect, so it is not
 * interpreted as one — but leaving a sign unexplained is worse than testing the
 * obvious mechanism against it.
 *
 * Under a flat per-slice budget the visits in a slice are shared among whoever
 * flowers there, so a minority packed into ONE slice has fewer slices drawing a
 * full allowance for it. If the fitness effect is that crowding rather than
 * anything about mating, the same statistic on the VISIT ratio must be negative
 * too — and it must be ABSENT in arm B, which has no flat budget to crowd.
 * ------------------------------------------------------------------------- */
console.log(
  `\n#57 DIAGNOSTIC (post-hoc, labelled as such) — the same statistic on the VISIT ratio r`,
);
console.log(
  `  crowding predicts NEGATIVE in the premium arms and ABSENT in arm B`,
);
for (const [lbl, keys] of [
  ["arm A, all N0 pooled", N0S.map((n) => keyOf(n, "A"))],
  ["arm A, N0=60 only", [keyOf(60, "A")]],
  ["arm B, N0=30", [keyOf(30, "B")]],
]) {
  const groups = rowsOf(keys);
  if (!groups.length) continue;
  const pt = cfEffect(groups, "r");
  if (pt.d == null || pt.strata < 4) {
    console.log(`  ${lbl.padEnd(22)} UNESTIMABLE (${pt.strata} strata)`);
    continue;
  }
  const rnd = mb32(20260904);
  const boot = [];
  for (let b = 0; b < 2000; b++) {
    const rs = [];
    for (let i = 0; i < groups.length; i++)
      rs.push(groups[(rnd() * groups.length) | 0]);
    const e = cfEffect(rs, "r");
    if (e.d != null && e.strata >= 4) boot.push(e.d);
  }
  console.log(
    `  ${lbl.padEnd(22)} d(r) = ${pt.d.toFixed(4)}  ` +
      `[${qq(boot, 0.025).toFixed(4)}, ${qq(boot, 0.975).toFixed(4)}]  ${pt.strata} strata`,
  );
}

/* ==========================================================================
 * #58 — HOW FAR DOES SELFING MOVE THE FLOOR?
 *
 * Registered in docs/2026-09-03-selfing-rate-prereg.md.
 *
 * PRIMARY: offspring mothered PER MINORITY PLANT, pooled over k <= 2, at each
 * selfing rate, bootstrapped over seeds and differenced against rate 0.
 *
 * k <= 2 is the floor region and k <= 3 is not — #56 measured w = 0.000 at k=1
 * and 0.734 at k=2 but 1.646 at k=3, so k=3 would dilute the floor with counts
 * that have already escaped it.
 *
 * ⚠️ THE PRIMARY IS THE MOTHER-BASED MEASURE, and the tracer measure is printed
 * beside it at every rate. #57 found them differing by a factor of SEVEN at k=1
 * — 0.0000 against 0.769 — decided entirely by whether a selfed offspring's
 * `anc` is averaged against a random individual. A rate sweep read off the
 * tracer alone would produce a clean, confident, wrong curve.
 * ========================================================================== */
const RATE_CELLS = [
  ["rate 0.00", keyOf(30, "A")],
  ["rate 0.25", keyOf(30, "R25")],
  ["rate 0.50", keyOf(30, "R50")],
  ["rate 1.00", keyOf(30, "R100")],
  ["rate 2.00", keyOf(30, "R200")],
];
const KMAX = 2;
const MIN_FLOOR_OBS = 20;

/* per seed: the mother-based per-plant rescue, and the tracer measure beside it */
function floorSeeds(key, field) {
  if (!have(key)) return null;
  const groups = [];
  for (const rep of out[key]) {
    const vals = [];
    for (const r of rep.rows) {
      if (!r.informative || r.k == null || r.k > KMAX) continue;
      if (field === "mothered") {
        if (r.minMothered != null) vals.push(r.minMothered / r.k);
      } else if (r[field] != null) vals.push(r[field]);
    }
    groups.push(vals);
  }
  return groups;
}
const flat = (gs) => gs.reduce((a, g) => a.concat(g), []);

if (RATE_CELLS.some(([, k]) => have(k))) {
  console.log(
    `\n#58 PRIMARY — offspring mothered per minority plant at k<=${KMAX}, by selfing rate`,
  );
  console.log(
    `  registered: CI of (rate r - rate 0) above 0 for any r -> selfing lifts the floor;`,
  );
  console.log(
    `  all CIs containing 0 with half-widths < 0.15 -> a null; wider -> NO VERDICT.`,
  );
  console.log(
    `  rate       selfed%   mothered/plant [95% CI]        vs rate 0 [95% CI]        tracer w    obs`,
  );
  const base = floorSeeds(keyOf(30, "A"), "mothered");
  for (const [lbl, key] of RATE_CELLS) {
    if (!have(key)) {
      console.log(`  ${lbl.padEnd(10)} (not run)`);
      continue;
    }
    const gs = floorSeeds(key, "mothered");
    const obs = flat(gs).length;
    /* selfed share, the C10 control, re-asserted at full n */
    let s = 0,
      t = 0;
    for (const rep of out[key])
      for (const row of rep.rows) {
        s += row.selfedN || 0;
        t += row.matingsN || 0;
      }
    const wgs = floorSeeds(key, "w");
    if (obs < MIN_FLOOR_OBS) {
      console.log(
        `  ${lbl.padEnd(10)} ${((100 * s) / t).toFixed(1).padStart(6)}%   UNESTIMABLE — ${obs} informative generations at k<=${KMAX} (need ${MIN_FLOOR_OBS})`,
      );
      continue;
    }
    const rnd = mb32(20260905);
    const self = [],
      diff = [];
    for (let b = 0; b < 2000; b++) {
      const pick = (g) => {
        const rs = [];
        for (let i = 0; i < g.length; i++) rs.push(g[(rnd() * g.length) | 0]);
        return mean(flat(rs));
      };
      const a = pick(gs);
      if (a != null) self.push(a);
      if (base) {
        const bb = pick(base);
        if (a != null && bb != null) diff.push(a - bb);
      }
    }
    const m = mean(flat(gs));
    const wm = mean(flat(wgs));
    const dlo = diff.length ? qq(diff, 0.025) : null,
      dhi = diff.length ? qq(diff, 0.975) : null;
    console.log(
      `  ${lbl.padEnd(10)} ${((100 * s) / t).toFixed(1).padStart(6)}%   ` +
        `${m.toFixed(3)} [${qq(self, 0.025).toFixed(3)}, ${qq(self, 0.975).toFixed(3)}]   ` +
        /* ⚠️ the rate-0 reference may simply not be loaded — a single-cell run
         * has nothing to difference against. Say so rather than throwing on a
         * null, which is what this did: the SIMULATION finished and only the
         * report died, and the per-5-seed checkpoint is why nothing was lost. */
        `${
          key === keyOf(30, "A")
            ? "     (reference)      "
            : dlo == null
              ? "  (no rate-0 loaded)  "
              : `${(dhi + dlo) / 2 >= 0 ? "+" : ""}${((dhi + dlo) / 2).toFixed(3)} [${dlo.toFixed(3)}, ${dhi.toFixed(3)}]`.padEnd(
                  22,
                )
        }  ` +
        `${wm != null ? wm.toFixed(3) : "  —  "}      ${obs}`,
    );
  }
  /* the outcome-level question: does any of this change coexistence?
   * ⚠️ HELD is read on seeds 1..40 for comparability with #52-#57, and the
   * rate-0 cell must give 0.289 while the selfing arms MUST NOT — they are a
   * different model, and a control demanding they matched would be wrong in the
   * direction of looking rigorous. */
  console.log(
    `\n  HELD by rate. Seeds 1..${REPRO_SEEDS} anchor the rate-0 cell to 0.289; the interval` +
      `\n  uses ALL seeds, bootstrapped over runs, differenced against rate 0.`,
  );
  console.log(`  rate       seeds1-40   all seeds          vs rate 0 [95% CI]`);
  const heldRuns = (key) =>
    have(key) ? out[key].map((r) => (r.fate === "HELD" ? 1 : 0)) : null;
  const base0 = heldRuns(keyOf(30, "A"));
  for (const [lbl, key] of RATE_CELLS) {
    if (!have(key)) continue;
    const h40 = HELD(key);
    const runs = heldRuns(key);
    const all = mean(runs);
    let cell = "     (reference)";
    if (base0 && key !== keyOf(30, "A")) {
      const rnd = mb32(20260906);
      const diff = [];
      const pick = (g) => {
        let s = 0;
        for (let i = 0; i < g.length; i++) s += g[(rnd() * g.length) | 0];
        return s / g.length;
      };
      for (let b = 0; b < 4000; b++) diff.push(pick(runs) - pick(base0));
      const lo = qq(diff, 0.025),
        hi = qq(diff, 0.975);
      cell =
        `${lo > 0 ? "+" : ""}${((lo + hi) / 2).toFixed(3)} [${lo.toFixed(3)}, ${hi.toFixed(3)}]` +
        (lo > 0 ? "  EXCLUDES 0" : "");
    }
    console.log(
      `  ${lbl.padEnd(10)} ${h40 == null ? "  —  " : h40.toFixed(3)}       ` +
        `${all.toFixed(3)} (${runs.filter((x) => x).length}/${runs.length})     ${cell}`,
    );
  }

  /* k=1 alone, the structural extreme, reported separately as registered */
  console.log(`\n  k = 1 alone (the structural extreme):`);
  console.log(`  rate       mothered/plant   tracer w    lone-generations`);
  for (const [lbl, key] of RATE_CELLS) {
    if (!have(key)) continue;
    const mo = [],
      ws = [];
    for (const rep of out[key])
      for (const r of rep.rows) {
        if (!r.informative || r.k !== 1) continue;
        if (r.minMothered != null) mo.push(r.minMothered);
        if (r.w != null) ws.push(r.w);
      }
    if (!mo.length) continue;
    console.log(
      `  ${lbl.padEnd(10)} ${mean(mo).toFixed(3).padStart(8)}        ` +
        `${ws.length ? mean(ws).toFixed(3) : "  —  "}        ${mo.length}`,
    );
  }
}

/* ==========================================================================
 * #59 — DOES INBREEDING DEPRESSION CLOSE THE SELFING ESCAPE?
 *
 * Registered in docs/2026-09-03-selfing-cost-prereg.md.
 *
 * #58 lifted the k=1 floor from an exact 0.000 to 0.580 with `cost` pinned at
 * 0 — a selfed offspring ALWAYS established. Every rescue it measured is
 * therefore an upper bound. This sweeps `cost` at rate 2.0, the only rate where
 * #58 saw coexistence move and so the only rate where a cost has something to
 * take away.
 *
 * ⚠️⚠️ COST IS A COMPETITIVE PENALTY HERE, NOT A DEMOGRAPHIC ONE, and the whole
 * reading depends on it. With demography off the recruitment loop runs
 * `while (next.length < target)`, so a selfed seed killed by `cost` does not
 * cost the population a recruit — the loop draws another mother and the slot
 * goes to whoever the visit-weighted draw favours. The brief flagged the
 * opposite possibility (cost doing demographic damage on top of genetic), so it
 * is MEASURED below rather than assumed, and asserted in tests/rare-floor.test.js.
 *
 * ⚠️⚠️ C10 MUST BE READ ON ATTEMPTED SELFING, NOT ESTABLISHED SELFING. `matings`
 * is pushed only when a seed establishes, so `selfedN/matingsN` falls with cost
 * even though the selfing DECISION rate is untouched — at cost 0.95 roughly
 * nineteen of every twenty selfed seeds die and the arm LOOKS like it stopped
 * selfing. Reporting that as C10 would hand back a confident null about cost
 * while the real story was an inert-looking lever. #58's C10 already had to be
 * widened once for this class of blind spot; this is the same trap wearing a
 * different coat. `unmated` is the model's own count of seeds that failed to
 * establish, so ATTEMPTS = selfedN + unmated, measured.
 * ========================================================================== */
const COST_CELLS = [
  ["cost 0.00", keyOf(30, "R200"), 0],
  ["cost 0.25", keyOf(30, "R200c25"), 0.25],
  ["cost 0.50", keyOf(30, "R200c50"), 0.5],
  ["cost 0.75", keyOf(30, "R200c75"), 0.75],
  ["cost 0.95", keyOf(30, "R200c95"), 0.95],
];

/* per seed, so k=1 can carry an interval this time — #58 reported the k=1
 * series as bare means and explicitly declined to promote it to a shape claim
 * on that basis. The brief asks for intervals here. */
function k1Seeds(key, field) {
  if (!have(key)) return null;
  return out[key].map((rep) => {
    const vals = [];
    for (const r of rep.rows) {
      if (!r.informative || r.k !== 1) continue;
      const v = field === "mothered" ? r.minMothered : r[field];
      if (v != null) vals.push(v);
    }
    return vals;
  });
}

/* resample SEEDS and pool the generations inside them — the same estimator
 * #58's primary used, kept identical so the two sweeps stay comparable even
 * though a paired bootstrap would be tighter (the arms do share seeds). */
function bootSeeds(gs, rnd, nb) {
  const bs = [];
  for (let b = 0; b < nb; b++) {
    const rs = [];
    for (let i = 0; i < gs.length; i++) rs.push(gs[(rnd() * gs.length) | 0]);
    const m = mean(flat(rs));
    if (m != null && isFinite(m)) bs.push(m);
  }
  return bs;
}

/* the C10' aggregates: attempted vs established selfing, and the demographic
 * check the brief demanded */
function costStats(key) {
  let selfed = 0,
    matings = 0,
    unmated = 0,
    recruits = 0,
    target = 0,
    gens = 0,
    stalls = 0,
    haveDemog = 0;
  for (const rep of out[key])
    for (const r of rep.rows) {
      gens++;
      selfed += r.selfedN || 0;
      matings += r.matingsN || 0;
      if (r.recruits != null && r.target != null) {
        haveDemog++;
        unmated += r.unmated || 0;
        recruits += r.recruits;
        target += r.target;
        if (r.recruits < r.target) stalls++;
      }
    }
  return {
    gens,
    haveDemog,
    est: matings ? selfed / matings : null,
    /* ATTEMPTS = established selfed seeds + the ones cost killed */
    att:
      haveDemog && matings + unmated
        ? (selfed + unmated) / (matings + unmated)
        : null,
    recrPerGen: haveDemog ? recruits / haveDemog : null,
    unmatedPerGen: haveDemog ? unmated / haveDemog : null,
    stallPct: haveDemog ? (100 * stalls) / haveDemog : null,
    shortfall: haveDemog ? target - recruits : null,
  };
}

if (COST_CELLS.some(([, k]) => have(k))) {
  /* ---- C10' and the demographic check, FIRST, because they decide whether any
   * number below means anything ---- */
  console.log(
    `\n#59 C10' — is each cell still a SELFING arm, and is cost demographic?`,
  );
  console.log(
    `  registered: ATTEMPTED selfing must stay non-zero and roughly FLAT across cost;`,
  );
  console.log(
    `  established selfing may fall freely. Recruits/gen must stay at target (30) —`,
  );
  console.log(
    `  a shortfall would mean cost is doing demographic damage on top of genetic.`,
  );
  console.log(
    `  cell        attempted%   established%   recruits/gen   unmated/gen   stall%   shortfall`,
  );
  for (const [lbl, key] of COST_CELLS) {
    if (!have(key)) {
      console.log(`  ${lbl.padEnd(11)} (not run)`);
      continue;
    }
    const s = costStats(key);
    if (!s.haveDemog) {
      console.log(
        `  ${lbl.padEnd(11)} ${((100 * s.est) | 0).toString().padStart(9)}%   ` +
          `(loaded from a dump written before recruits/unmated were recorded — demographic check UNAVAILABLE)`,
      );
      continue;
    }
    console.log(
      `  ${lbl.padEnd(11)} ${(100 * s.att).toFixed(2).padStart(9)}%   ` +
        `${(100 * s.est).toFixed(2).padStart(11)}%   ` +
        `${s.recrPerGen.toFixed(3).padStart(12)}   ` +
        `${s.unmatedPerGen.toFixed(2).padStart(11)}   ` +
        `${s.stallPct.toFixed(2).padStart(6)}   ` +
        `${String(s.shortfall).padStart(9)}`,
    );
  }

  /* ---- PRIMARY: mothered per minority plant at k<=2 ---- */
  console.log(
    `\n#59 PRIMARY — offspring mothered per minority plant at k<=${KMAX}, by inbreeding-depression cost`,
  );
  console.log(
    `  registered: CI of (cost c - cost 0) BELOW 0 -> depression erodes the rescue;`,
  );
  console.log(
    `  all CIs containing 0 with half-widths < 0.15 -> the rescue survives; wider -> NO VERDICT.`,
  );
  console.log(
    `  cost       mothered/plant [95% CI]        vs cost 0 [95% CI]        tracer w    obs`,
  );
  const cbase = floorSeeds(keyOf(30, "R200"), "mothered");
  for (const [lbl, key] of COST_CELLS) {
    if (!have(key)) {
      console.log(`  ${lbl.padEnd(10)} (not run)`);
      continue;
    }
    const gs = floorSeeds(key, "mothered");
    const obs = flat(gs).length;
    const wgs = floorSeeds(key, "w");
    if (obs < MIN_FLOOR_OBS) {
      console.log(
        `  ${lbl.padEnd(10)} UNESTIMABLE — ${obs} informative generations at k<=${KMAX} (need ${MIN_FLOOR_OBS})`,
      );
      continue;
    }
    const rnd = mb32(20260907);
    const self = bootSeeds(gs, rnd, 2000);
    const diff = [];
    if (cbase)
      for (let b = 0; b < 2000; b++) {
        const pick = (g) => {
          const rs = [];
          for (let i = 0; i < g.length; i++) rs.push(g[(rnd() * g.length) | 0]);
          return mean(flat(rs));
        };
        const a = pick(gs),
          bb = pick(cbase);
        if (a != null && bb != null) diff.push(a - bb);
      }
    const m = mean(flat(gs));
    const wm = mean(flat(wgs));
    const dlo = diff.length ? qq(diff, 0.025) : null,
      dhi = diff.length ? qq(diff, 0.975) : null;
    console.log(
      `  ${lbl.padEnd(10)} ${m.toFixed(3)} [${qq(self, 0.025).toFixed(3)}, ${qq(self, 0.975).toFixed(3)}]   ` +
        `${
          key === keyOf(30, "R200")
            ? "     (reference)      "
            : dlo == null
              ? "  (no cost-0 loaded)  "
              : `${(dhi + dlo) / 2 >= 0 ? "+" : ""}${((dhi + dlo) / 2).toFixed(3)} [${dlo.toFixed(3)}, ${dhi.toFixed(3)}]`.padEnd(
                  22,
                )
        }  ` +
        `${wm != null ? wm.toFixed(3) : "  —  "}      ${obs}`,
    );
  }

  /* ---- k = 1, WITH intervals, and the registered shape discriminator ---- */
  console.log(
    `\n  k = 1 alone (the structural extreme), with intervals this time:`,
  );
  console.log(
    `  cost       mothered/plant [95% CI]        vs cost 0 [95% CI]        tracer w   lone-gens`,
  );
  const k1base = k1Seeds(keyOf(30, "R200"), "mothered");
  const k1meas = {};
  for (const [lbl, key] of COST_CELLS) {
    if (!have(key)) continue;
    const gs = k1Seeds(key, "mothered");
    const obs = flat(gs).length;
    if (!obs) continue;
    const rnd = mb32(20260908);
    const self = bootSeeds(gs, rnd, 2000);
    const diff = [];
    if (k1base)
      for (let b = 0; b < 2000; b++) {
        const pick = (g) => {
          const rs = [];
          for (let i = 0; i < g.length; i++) rs.push(g[(rnd() * g.length) | 0]);
          return mean(flat(rs));
        };
        const a = pick(gs),
          bb = pick(k1base);
        if (a != null && bb != null) diff.push(a - bb);
      }
    const m = mean(flat(gs));
    const ws = k1Seeds(key, "w");
    const wm = mean(flat(ws));
    k1meas[key] = { m, lo: qq(self, 0.025), hi: qq(self, 0.975), obs };
    const dlo = diff.length ? qq(diff, 0.025) : null,
      dhi = diff.length ? qq(diff, 0.975) : null;
    console.log(
      `  ${lbl.padEnd(10)} ${m.toFixed(3)} [${qq(self, 0.025).toFixed(3)}, ${qq(self, 0.975).toFixed(3)}]   ` +
        `${
          key === keyOf(30, "R200")
            ? "     (reference)      "
            : dlo == null
              ? "  (no cost-0 loaded)  "
              : `${(dhi + dlo) / 2 >= 0 ? "+" : ""}${((dhi + dlo) / 2).toFixed(3)} [${dlo.toFixed(3)}, ${dhi.toFixed(3)}]`.padEnd(
                  22,
                )
        }  ` +
        `${wm != null ? wm.toFixed(3) : "  —  "}      ${obs}`,
    );
  }

  /*
   * THE REGISTERED SHAPE TEST. Both readings agree the rescue shrinks; they
   * disagree about HOW FAST, and the disagreement is arithmetic rather than
   * rhetorical, so it can be written down before the run.
   *
   *   H1 "proportional loss" — a selfed seed establishes with probability
   *      (1 - cost), so the rescue is simply scaled: m(c) = m(0) * (1 - c).
   *
   *   H2 "re-draw compensation" — a killed seed does not end the generation,
   *      it costs a DRAW, and the loop keeps drawing until the slot is filled.
   *      Total draws inflate by 1/(1 - s*c) with s the attempted-selfing share,
   *      and a mate-limited mother's share of draws is unchanged, so she gets
   *      more attempts as cost rises: m(c) = m(0) * (1 - c) / (1 - s*c).
   *
   * They diverge most in the middle — at cost 0.5 H2 predicts about 1.5x H1 —
   * which is where the discriminating power sits, and why the sweep is not just
   * its endpoints. `s` is MEASURED at cost 0, not assumed.
   */
  const c0 = k1meas[keyOf(30, "R200")];
  const s0 = have(keyOf(30, "R200")) ? costStats(keyOf(30, "R200")).att : null;
  if (c0 && s0 != null) {
    console.log(
      `\n  Registered shape test at k=1. s = attempted-selfing share at cost 0 = ${s0.toFixed(4)}.`,
    );
    console.log(
      `  cost      measured [95% CI]         H1 (1-c)    H2 (1-c)/(1-sc)    excluded by the CI`,
    );
    for (const [lbl, key, c] of COST_CELLS) {
      const mm = k1meas[key];
      if (!mm || key === keyOf(30, "R200")) continue;
      const h1 = c0.m * (1 - c);
      const h2 = (c0.m * (1 - c)) / (1 - s0 * c);
      const ex = [];
      if (h1 < mm.lo || h1 > mm.hi) ex.push("H1");
      if (h2 < mm.lo || h2 > mm.hi) ex.push("H2");
      console.log(
        `  ${lbl.padEnd(9)} ${mm.m.toFixed(3)} [${mm.lo.toFixed(3)}, ${mm.hi.toFixed(3)}]   ` +
          `${h1.toFixed(3).padStart(9)}    ${h2.toFixed(3).padStart(12)}    ` +
          `${ex.length ? ex.join(" and ") + " excluded" : "neither — UNRESOLVED"}`,
      );
    }
  }

  /* ---- HELD: does any of this reach coexistence? ---- */
  console.log(
    `\n  HELD by cost, all seeds, bootstrapped over runs, differenced against cost 0.` +
      `\n  ⚠️ cost 0 here is the SELFING arm at rate 2.0 (#58 measured 0.404), NOT arm A.`,
  );
  console.log(`  cost       seeds1-40   all seeds          vs cost 0 [95% CI]`);
  const heldRunsC = (key) =>
    have(key) ? out[key].map((r) => (r.fate === "HELD" ? 1 : 0)) : null;
  const cbase0 = heldRunsC(keyOf(30, "R200"));
  for (const [lbl, key] of COST_CELLS) {
    if (!have(key)) continue;
    const h40 = HELD(key);
    const runs = heldRunsC(key);
    let cell = "     (reference)";
    if (cbase0 && key !== keyOf(30, "R200")) {
      const rnd = mb32(20260909);
      const diff = [];
      const pick = (g) => {
        let s = 0;
        for (let i = 0; i < g.length; i++) s += g[(rnd() * g.length) | 0];
        return s / g.length;
      };
      for (let b = 0; b < 4000; b++) diff.push(pick(runs) - pick(cbase0));
      const lo = qq(diff, 0.025),
        hi = qq(diff, 0.975);
      cell =
        `${lo > 0 ? "+" : ""}${((lo + hi) / 2).toFixed(3)} [${lo.toFixed(3)}, ${hi.toFixed(3)}]` +
        (hi < 0
          ? "  EXCLUDES 0 (below)"
          : lo > 0
            ? "  EXCLUDES 0 (above)"
            : "");
    }
    console.log(
      `  ${lbl.padEnd(10)} ${h40 == null ? "  —  " : h40.toFixed(3)}       ` +
        `${mean(runs).toFixed(3)} (${runs.filter((x) => x).length}/${runs.length})     ${cell}`,
    );
  }
}
