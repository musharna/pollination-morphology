/*
 * The speculative deck (northstar spec §14): a data table, one JSON file beside
 * the page. Rule, carried from ~/dyson-tree: a card moves an INPUT, never the
 * mating rule. Every row's `input` (and, for an object `value`, every effective
 * leaf `input.key...`) must resolve to one of:
 *   - a locus in IBM.ALL_KEYS (where `signal` lives);
 *   - a top-level IBM.DEFAULTS key;
 *   - a dotted path whose tail is listed for its option below;
 *   - a key of DEFAULT_BEE;
 *   - a bout parameter on the allowlist (`groom`, `harvest`, sim/carryover.js);
 *   - an input registered in spec §13 (`linkSignal`, `phenology.link`).
 * No row may name `fateOf`, and no path may be or start with a reserved key:
 * `randomMating`, `optima`, `optimaK`, `demography`, `selfing` (§13).
 *
 * ⚠️ The test carries its own must-fail rows, so an empty deck or a broken
 * loader cannot pass it: the fixture's six bad rows must ALL be reported and the
 * same fixture minus them must pass, in one case.
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const I = require("../sim/ibm.js");
const P = require("../sim/placement.js");

const DECK = path.join(__dirname, "..", "deck.json");
const RESERVED = ["randomMating", "optima", "optimaK", "demography", "selfing"];
/* option tails: DEFAULTS.phenology is null, so its keys are listed here, each
 * one the engine reads (sim/ibm.js: sliceCountOf :204, widthLocus / widthMut /
 * conserveDisplay / displayProportionalVisits / shuffleWidth, width :1473,
 * link :2143, mut). */
const OPTION_TAILS = {
  phenology: [
    "slices",
    "width",
    "widthLocus",
    "widthMut",
    "conserveDisplay",
    "displayProportionalVisits",
    "shuffleWidth",
    "link",
    "mut",
  ],
};
const BOUT = ["groom", "harvest"];
const REGISTERED = ["linkSignal", "phenology.link"];

function pathOk(p) {
  if (p === "fateOf" || p.split(".").includes("fateOf")) return "names fateOf";
  for (const r of RESERVED)
    if (p === r || p.startsWith(r + ".")) return `reserved key ${r}`;
  if (REGISTERED.includes(p)) return null;
  if (!p.includes(".")) {
    if (I.ALL_KEYS.includes(p)) return null;
    if (Object.prototype.hasOwnProperty.call(I.DEFAULTS, p)) return null;
    if (Object.prototype.hasOwnProperty.call(P.DEFAULT_BEE, p)) return null;
    if (BOUT.includes(p)) return null;
    return "resolves to no input";
  }
  const [head, ...rest] = p.split(".");
  if (OPTION_TAILS[head] && rest.length === 1 && OPTION_TAILS[head].includes(rest[0]))
    return null;
  return "resolves to no input";
}

/* every effective leaf: an object value contributes input.key for each key,
 * recursively, so an object cannot carry a key the row's input alone hides */
function leaves(input, value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const ks = Object.keys(value);
    if (!ks.length) return [input];
    return ks.flatMap((k) => leaves(`${input}.${k}`, value[k]));
  }
  return [input];
}

function checkDeck(rows) {
  if (!Array.isArray(rows)) throw new Error("deck is not an array of rows");
  const bad = [];
  rows.forEach((row, i) => {
    const inputs = Array.isArray(row.input) ? row.input : [row.input];
    const problems = [];
    if (!inputs.length || inputs.some((x) => typeof x !== "string" || !x))
      problems.push("no input");
    for (const inp of inputs.filter((x) => typeof x === "string" && x)) {
      const paths = "value" in row ? leaves(inp, row.value) : [inp];
      /* the row's own input is checked too, so a legal-looking object cannot
       * launder a reserved head */
      for (const p of new Set([inp, ...paths])) {
        const why = pathOk(p);
        if (why) problems.push(`${p}: ${why}`);
      }
    }
    if (JSON.stringify(row).includes("fateOf") && !problems.some((x) => /fateOf/.test(x)))
      problems.push("names fateOf");
    if (problems.length) bad.push({ row: i, card: row.card, problems });
  });
  return bad;
}

const LEGAL = [
  { card: "legal locus", input: "polarity", badge: "DEMONSTRATED" },
  { card: "legal group", input: ["axisLen", "mouthR"], badge: "DEMONSTRATED" },
  { card: "legal bee", input: "reach", badge: "DECLARED" },
  { card: "legal option object", input: "phenology", value: { slices: 8, width: 0.12 }, badge: "MEASURED" },
  { card: "legal bout", input: "groom", value: 0, badge: "DECLARED" },
];
const MUST_FAIL = [
  { card: "reserved selfing", input: "selfing.rate", badge: "DECLARED" },
  { card: "reserved demography", input: "demography.K", badge: "DECLARED" },
  { card: "reserved optima", input: "optima", badge: "DECLARED" },
  { card: "the fate rule", input: "fateOf", badge: "DECLARED" },
  { card: "no such key", input: "nectarVolume", badge: "DECLARED" },
  { card: "object leaf hides a key", input: "phenology", value: { slices: 8, stigmaRace: 2 }, badge: "DECLARED" },
];

test("the checker reports all six must-fail rows, and passes the fixture without them", () => {
  const fixture = [...LEGAL, ...MUST_FAIL];
  const bad = checkDeck(fixture);
  assert.deepEqual(
    bad.map((b) => b.card).sort(),
    MUST_FAIL.map((r) => r.card).sort(),
    `reported ${JSON.stringify(bad)}`,
  );
  for (const b of bad) console.log(`must-fail row ${b.row} (${b.card}): ${b.problems.join("; ")}`);
  assert.deepEqual(checkDeck(LEGAL), [], "the legal rows alone did not pass");
});

test("the committed deck exists, carries the five backbone rows, and every row resolves", () => {
  assert.ok(fs.existsSync(DECK), "deck.json is missing");
  const rows = JSON.parse(fs.readFileSync(DECK, "utf8"));
  assert.ok(Array.isArray(rows) && rows.length >= 5, "the deck has fewer than five rows");
  const backbone = [
    ["CYCLOIDEA knockout", "polarity", "DEMONSTRATED"],
    ["spur-length genes", "axisLen", "DECLARED"],
    ["scent by structural genes", "signal", "DEMONSTRATED"],
    ["MYB colour factors", "signal", "DECLARED"],
    ["architecture is simple", ["axisLen", "mouthR", "throatR", "antherT", "antherProject", "curve", "polarity", "antherTheta"], "DEMONSTRATED"],
  ];
  for (const [card, input, badge] of backbone) {
    const r = rows.find((x) => x.card === card);
    assert.ok(r, `backbone row "${card}" missing`);
    assert.deepEqual(r.input, input, `${card}: input`);
    assert.equal(r.badge, badge, `${card}: badge`);
    assert.ok(typeof r.anchor === "string" && r.anchor.length > 0, `${card}: no anchor`);
  }
  for (const r of rows.filter((x) => x.input === "signal"))
    assert.match(r.note || "", /not a slider: the founding signal draw/, `${r.card}: signal badge text`);
  assert.deepEqual(checkDeck(rows), [], "a committed row does not resolve");
});
