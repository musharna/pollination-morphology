/*
 * selfing-sweep.js — is there a rate that is BOTH admissible AND effective?
 *
 * Roadmap :300, open since 2026-08-07: "whether a SMALLER rate sits in a window
 * that is both admissible and effective. The prereg asked for a sweep and this
 * run tested ONE rate — ⚠️ but the two gates squeeze from opposite directions,
 * so the window may not exist."
 *
 * THE SQUEEZE, which is why this is a real question and not a formality:
 *
 *   ADMISSIBILITY wants a LOW rate. The claim is only admissible where the test
 *   arm is DISTINGUISHABLE from the full-selfing control; a treatment that
 *   behaves like total selfing IS total selfing, whatever its parameter says.
 *
 *   ATTRIBUTION wants a HIGH rate. The selfing-specific effect is
 *   selfing-minus-floorOnly, and floorOnly carries the maternal-weight
 *   flattening without the selfing. A small rate barely selfs, so there is
 *   nothing left over once the flattening is subtracted.
 *
 * A window exists only if those two intervals both clear zero somewhere on the
 * same rate. They may not, and a clean empty answer is a result — but it is a
 * result about THE RATES TESTED.
 *
 * ⚠️ THIS HEADER USED TO SAY "STRUCTURALLY unavailable to this model, at any
 * dose", and the verdict said it too. Neither was earned. The sweep is a finite
 * grid, so it cannot speak for the rates between or beyond its points; and every
 * gate is a FAILURE TO REJECT, so without a pre-declared equivalence margin an
 * interval spanning zero cannot tell "indistinguishable from total selfing" from
 * "not resolvable by this design". An empty answer is therefore "no TESTED rate
 * met the conjunction", which is a smaller and true claim.
 *
 * ⚠️ IT DRIVES experiments/selfing.js RATHER THAN RE-IMPLEMENTING IT. Every
 * number below comes out of the same file, the same estimator and the same two
 * gates that produced the published single-rate result — a sweep carrying its
 * own copy of the estimator would be testing the copy. That is not a
 * hypothetical: this project has already had two green tests over a step() that
 * ignored the flag they claimed to exercise.
 */

const { execFileSync } = require("child_process");
const path = require("path");

const SMOKE = process.env.SW_SMOKE === "1";
/*
 * Declared here, before any run. 0.5 is the published rate and is included so
 * the sweep reproduces it in place rather than quoting it from a document.
 */
const RATES = SMOKE ? [0.1, 0.5] : [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.7];

const f3 = (x) =>
  x == null || Number.isNaN(x) ? "     - " : x.toFixed(3).padStart(7);
const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));
const ciStr = (d) => (d ? `${f3(d.m)} +/- ${d.h.toFixed(3)}` : "        -    ");
/* the same predicate selfing.js applies — an interval clears zero when its
 * half-width is smaller than the distance of its centre from zero */
const excludes0 = (d) => !!d && Math.abs(d.m) > d.h;

console.log("=".repeat(78));
console.log(
  "  SELFING RATE SWEEP — does an admissible AND effective window exist?",
);
console.log("=".repeat(78));
if (SMOKE)
  console.log(
    "\n*** SW_SMOKE=1 — tiny configuration, two rates. NOT RESULTS.\n",
  );

const rows = [];
for (const rate of RATES) {
  process.stderr.write(`  running rate=${rate} …\n`);
  const out = execFileSync(
    process.execPath,
    [path.join(__dirname, "selfing.js")],
    {
      env: {
        ...process.env,
        SELF_RATE: String(rate),
        SELF_JSON: "1",
        ...(SMOKE ? { SELF_SMOKE: "1" } : {}),
      },
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  const line = out.split("\n").find((l) => l.startsWith("##JSON## "));
  if (!line) throw new Error(`rate ${rate} produced no machine-readable line`);
  rows.push(JSON.parse(line.slice(9)));
}

rule("THE SWEEP");
console.log(
  "  rate    admissibility        attribution          realised effect      loss",
);
console.log(
  "          (selfing vs ALWAYS)  (selfing - floorOnly) (vs baseline)      free/dead",
);
for (const r of rows) {
  console.log(
    `  ${String(r.rate).padEnd(6)}${ciStr(r.admissible)}  ${ciStr(
      r.attribution,
    )}  ${ciStr(r.realised)}   ${String(r.lostTreat).padStart(3)}/${String(
      r.lostDead,
    ).padStart(3)}`,
  );
}

rule("THE TWO GATES, APPLIED");

/*
 * ⚠️ APPLIED, NOT REPORTED AND WALKED PAST. The first version of the
 * single-rate verdict printed both gates and then reached its conclusion
 * without consulting either — which is the only reason an inadmissible positive
 * was ever visible. The gates decide here.
 */
const admissibleAt = rows.filter((r) => excludes0(r.admissible));
const attributedAt = rows.filter((r) => excludes0(r.attribution));
const effectiveAt = rows.filter(
  (r) => excludes0(r.realised) && r.realised.m < 0,
);
const WINDOW = rows.filter(
  (r) =>
    excludes0(r.admissible) &&
    excludes0(r.attribution) &&
    excludes0(r.realised) &&
    r.realised.m < 0,
);

const list = (rs) => (rs.length ? rs.map((r) => r.rate).join(", ") : "(none)");
console.log(`  distinguishable from total selfing at: ${list(admissibleAt)}`);
console.log(`  separable from the weight floor at:    ${list(attributedAt)}`);
console.log(`  a rare advantage at:                   ${list(effectiveAt)}`);
console.log(`\n  ALL THREE:                             ${list(WINDOW)}`);

/*
 * ⚠️⚠️ WHAT AN UNMET GATE DOES AND DOES NOT LICENSE. Every gate here is a
 * FAILURE TO REJECT: the interval spans zero. Failing closed on that is right —
 * an arm that cannot be separated from total selfing must not be credited — but
 * it is NOT evidence that the arm IS total selfing. Those two readings differ
 * only in the width of the interval, and NO EQUIVALENCE MARGIN WAS PRE-DECLARED
 * for this sweep, so neither is licensed by it.
 *
 * The half-widths are therefore printed, so a spanning interval cannot be read
 * as a demonstration of sameness. For the same reason the verdict below is
 * scoped to the RATES TESTED: seven grid points cannot speak for the continuum
 * between and beyond them.
 */
rule("RESOLUTION — is an unmet gate a null, or an unresolved question?");
console.log(
  "  No equivalence margin was pre-declared, so a spanning interval is reported\n" +
    "  as UNRESOLVED rather than as equivalence. Half-widths, for scale:\n",
);
console.log("  rate    admissibility          attribution");
const wid = (d) =>
  !d
    ? "        -       "
    : (excludes0(d) ? "clears 0" : "spans 0 ") + ` h=${d.h.toFixed(3)}`;
for (const r of rows)
  console.log(
    `  ${String(r.rate).padEnd(6)}${wid(r.admissible).padEnd(23)}${wid(r.attribution)}`,
  );

const widest = rows
  .filter((r) => r.admissible && !excludes0(r.admissible))
  .reduce((a, r) => (a && a.admissible.h > r.admissible.h ? a : r), null);
if (widest)
  console.log(
    `\n  ⚠️ The widest unmet admissibility interval is h=${widest.admissible.h.toFixed(3)}, at rate ${widest.rate}. An\n` +
      '  effect smaller than that is invisible to this design, so "cannot be told apart\n' +
      '  from total selfing" means the sweep lacked the resolution to tell them apart —\n' +
      "  not that they are the same.",
  );

rule("VERDICT");

if (WINDOW.length) {
  console.log(
    `  ✅ A WINDOW EXISTS at rate(s) ${list(WINDOW)}. Reproductive assurance is\n` +
      "  admissible and effective there: distinguishable from total selfing,\n" +
      "  separable from the maternal-weight flattening, and moving the realised\n" +
      "  exponent toward a rare advantage.\n\n" +
      "  ⚠️ THIS IS THE SCREEN ONLY. It says assurance repairs mate-finding at\n" +
      "  this dose. It does NOT say the rescued lineages stay distinct — that is\n" +
      "  a multi-generation question this estimator cannot reach, and the\n" +
      "  2026-08-07 pre-registration named it separately.",
  );
} else if (!attributedAt.length && admissibleAt.length) {
  console.log(
    "  ❌ NO TESTED RATE MEETS THE CONJUNCTION — and the binding gate is\n" +
      "  ATTRIBUTION. Among the rates swept, those that stay distinguishable from\n" +
      "  total selfing do not produce an effect separable from the maternal-weight\n" +
      "  FLATTENING that the floor causes on its own, so whatever moves at the high\n" +
      "  rates tested is not the selfing.\n\n" +
      '  ⚠️ "Not separable" is a failure to reject, not a demonstration of sameness,\n' +
      "  and no equivalence margin was pre-declared — see the RESOLUTION table.",
  );
} else if (!admissibleAt.length && attributedAt.length) {
  console.log(
    "  ❌ NO TESTED RATE MEETS THE CONJUNCTION — and the binding gate is\n" +
      "  ADMISSIBILITY. Among the rates swept, every one with a separable effect\n" +
      "  fails to separate from TOTAL SELFING, which manufactures isolation by\n" +
      "  severing mating from pollination. On this grid the effect is real and the\n" +
      "  mechanism looks like the trivial one.\n\n" +
      '  ⚠️ "Fails to separate" is not "is the same as": the admissibility gate is a\n' +
      "  failure to reject and no equivalence margin was pre-declared. A rate between\n" +
      "  the grid points is untested, not excluded — see the RESOLUTION table.",
  );
} else if (!admissibleAt.length && !attributedAt.length) {
  console.log(
    `  ❌ NO TESTED RATE MEETS THE CONJUNCTION, and neither gate opens anywhere on\n` +
      "  the grid: no rate swept is both distinguishable from total selfing and\n" +
      `  separable from the weight floor.\n  rates swept (${rows.length}): ${rows.map((r) => r.rate).join(", ")}\n\n` +
      '  ⚠️ THAT IS NOT "STRUCTURALLY UNAVAILABLE AT ANY DOSE", which is what this\n' +
      "  line used to say. Two things stand between the observation and that claim.\n" +
      "  The grid is finite, and nothing here speaks for the rates between or beyond\n" +
      "  its points. And every gate is a FAILURE TO REJECT: without a pre-declared\n" +
      '  equivalence margin, an interval spanning zero cannot distinguish "the arm\n' +
      '  behaves like total selfing" from "this design cannot resolve the\n' +
      '  difference". See the RESOLUTION table above for which rows are which.\n\n' +
      "  ⚠️ Read the loss column before believing the knob was inert: if\n" +
      "  free-vs-fully-costed lineage loss separates, the mechanism was doing\n" +
      "  something and the gates are rejecting WHAT it did, not whether it ran.",
  );
} else {
  console.log(
    "  ❌ NO WINDOW. Both gates open somewhere, but never on the same rate —\n" +
      "  which is the squeeze roadmap :300 predicted: admissibility wants a low\n" +
      "  rate and attribution wants a high one, and the two demands do not\n" +
      "  overlap anywhere in the swept range.",
  );
}

/*
 * ⚠️ A NEGATIVE NEEDS A POSITIVE CONTROL IN THE SAME REPORT. If nothing
 * separated anywhere, the honest first suspicion is a dead harness rather than
 * a dead mechanism. Lineage loss under free selfing against fully-costed
 * selfing is the arm that must move if the knob is doing anything at all.
 */
const bit = rows.filter((r) => r.lostDead > r.lostTreat);
console.log(
  bit.length
    ? `\n  ✅ POSITIVE CONTROL: the knob is live — lineage loss rises when every\n` +
        `  selfed seed dies, at rate(s) ${list(bit)}. A null above is about the\n` +
        "  mechanism, not about a switch that was never connected."
    : "\n  ⚠️⚠️ POSITIVE CONTROL FAILED: lineage loss never separated between free\n" +
        "  and fully-costed selfing at ANY rate. Nothing above is interpretable —\n" +
        "  that pattern is what a disconnected knob looks like.",
);
