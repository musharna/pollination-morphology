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
 * same rate. They may not, and a clean empty answer is a result: it would say
 * reproductive assurance is not merely unhelpful here but STRUCTURALLY
 * unavailable to this model, at any dose.
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
    "  ❌ NO WINDOW — and the binding gate is ATTRIBUTION. Rates that stay\n" +
      "  distinguishable from total selfing never produce an effect separable\n" +
      "  from the maternal-weight FLATTENING that the floor causes on its own.\n" +
      "  Whatever moves at high rates is not the selfing.",
  );
} else if (!admissibleAt.length && attributedAt.length) {
  console.log(
    "  ❌ NO WINDOW — and the binding gate is ADMISSIBILITY. Every rate with a\n" +
      "  separable effect is indistinguishable from TOTAL SELFING, which\n" +
      "  manufactures isolation by severing mating from pollination. The effect\n" +
      "  is real and the mechanism is the trivial one.",
  );
} else if (!admissibleAt.length && !attributedAt.length) {
  console.log(
    "  ❌ NO WINDOW, AND NEITHER GATE OPENS ANYWHERE. Across the whole swept\n" +
      "  range no rate is both distinguishable from total selfing and separable\n" +
      "  from the weight floor. Reproductive assurance is not merely unhelpful\n" +
      "  in this model — it is STRUCTURALLY UNAVAILABLE, at any dose.\n\n" +
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
