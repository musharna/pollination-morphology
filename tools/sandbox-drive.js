/*
 * Drive population.html in the fake browser (tools/fake-dom.js) the way a
 * visitor does: set the controls, press Run, and read every number back out of
 * the DOM the page wrote it into. Shared by the M2 acceptance tests.
 *
 * ⚠️ NOTHING HERE COMPUTES A FATE OR A CARD STATE. It reads text and
 * `data-state` off elements; a test built on it fails if the page renders no
 * card, never closes one, or breaks the grey rule.
 */
const path = require("path");
const { execFileSync } = require("child_process");
const { loadPage } = require("./fake-dom.js");

const ROOT = path.join(__dirname, "..");
const PAGE = process.env.SANDBOX_PAGE || path.join(ROOT, "population.html");
const PAGE_ROOT = process.env.SANDBOX_PAGE
  ? path.dirname(process.env.SANDBOX_PAGE)
  : ROOT;

const CARDS = ["card1", "card2", "card3", "card4", "card5", "card6"];
/* M3b's option controls, by id (population.html, "Options" panel). */
const OPTION_IDS = [
  "allocExponent",
  "selfRate",
  "selfCost",
  "selfCover",
  "phenOn",
  "phenSlices",
  "phenWidth",
  "phenWidthLocus",
  "phenWidthMut",
  "phenConserve",
  "phenPropVisits",
  "visitsPerPlant",
];

/*
 * settings: { seed, useD, d, n, gens, siteN, random, lineages: [g1, g2] }
 */
function runPage(settings) {
  const P = loadPage(PAGE, { root: PAGE_ROOT });
  const doc = P.document;
  const set = (id, v) => {
    const el = doc.getElementById(id);
    if (!el) throw new Error(`no #${id} on the page`);
    el.value = String(v);
  };
  /* M3a: a level is chosen FIRST, as a visitor would, so the controls it
   * loads can then be overridden by the settings below (every slider stays live). */
  const pickLevel = (lv) => {
    const sel = doc.getElementById("level");
    if (!sel) throw new Error("no #level select on the page");
    sel.value = String(lv);
    if (!sel.onchange) throw new Error("#level has no onchange handler");
    sel.onchange({ target: sel });
  };
  if (settings.level !== undefined) pickLevel(settings.level);
  if (settings.lineages) {
    if (!P.win.Sandbox || !P.win.Sandbox.setLineage)
      throw new Error("the page exposes no Sandbox.setLineage");
    settings.lineages.forEach((g, li) => P.win.Sandbox.setLineage(li, g));
  }
  for (const k of ["seed", "d", "n", "gens", "siteN"])
    if (settings[k] !== undefined) set(k, settings[k]);
  /* the box is left as the level loaded it unless a setting names it */
  if (settings.useD !== undefined)
    doc.getElementById("useD").checked = !!settings.useD;
  set("mode", settings.random ? "random" : "real");
  /* M3b: the second level-5 run loads the width-locus object by the page's own
   * button, then any option control is set by id (a checkbox by boolean). */
  if (settings.loadWidth) {
    const b = doc.getElementById("loadWidthObj");
    if (!b || !b.onclick) throw new Error("no #loadWidthObj button on the page");
    b.onclick();
  }
  if (settings.options)
    for (const [id, v] of Object.entries(settings.options)) {
      const el = doc.getElementById(id);
      if (!el) throw new Error(`no option control #${id} on the page`);
      if (typeof v === "boolean") el.checked = v;
      else el.value = String(v);
    }
  if (settings.slide)
    for (const [li, k, v] of settings.slide) {
      const el = doc.getElementById(`g${li + 1}_${k}`);
      if (!el) throw new Error(`no slider g${li + 1}_${k}`);
      el.value = String(v);
      el.oninput({ target: el });
    }
  const controls = {
    n: doc.getElementById("n").value,
    gens: doc.getElementById("gens").value,
    siteN: doc.getElementById("siteN").value,
    mode: doc.getElementById("mode").value,
    runDisabled: !!doc.getElementById("run").disabled,
  };
  if (!settings.noRun) {
    P.timers.length = 0;
    doc.getElementById("run").onclick();
    while (P.timers.length) P.timers.shift()();
  }
  if (settings.thenLevel !== undefined) pickLevel(settings.thenLevel);
  const text = (id) => {
    const el = doc.getElementById(id);
    return el ? el.textContent || el.innerHTML : null;
  };
  const cards = {};
  for (const c of CARDS) {
    const el = doc.getElementById(c);
    cards[c] = el ? el.getAttribute("data-state") : null;
  }
  const fateBand = text("sFateBand") || "";
  const hybBand = text("sHybBand") || "";
  const stalled = /(\d+) of (\d+) generations recruited nothing/.exec(fateBand);
  const hyb = /hybrids among the parents in (\d+) of (\d+) generations/.exec(
    hybBand,
  );
  const ratio = /receipt ratio (\S+)/.exec(hybBand);
  const realised = /realised separation (\S+)/.exec(text("status") || "");
  return {
    status: text("status"),
    error: doc.getElementById("status").getAttribute("data-error"),
    fate: text("sFate"),
    stalledGens: stalled ? +stalled[1] : null,
    gensRun: stalled ? +stalled[2] : null,
    hybGens: hyb ? +hyb[1] : null,
    hybOf: hyb ? +hyb[2] : null,
    ratio: !ratio ? null : ratio[1] === "no" ? null : ratio[1],
    realised: realised ? realised[1] : null,
    useD: doc.getElementById("useD").checked,
    d: doc.getElementById("d").value,
    cards,
    controls,
    level: doc.getElementById("level")
      ? doc.getElementById("level").value
      : null,
    brief: text("levelBrief"),
    win: doc.getElementById("levelWin")
      ? doc.getElementById("levelWin").getAttribute("data-state")
      : null,
    winText: text("levelWin"),
    note: text("levelNote"),
    separation: text("sReal"),
    cardText: Object.fromEntries(CARDS.map((c) => [c, text(c + "Text")])),
    options: Object.fromEntries(
      OPTION_IDS.map((id) => {
        const el = doc.getElementById(id);
        return [id, !el ? null : el.type === "checkbox" ? el.checked : el.value];
      }),
    ),
    fieldCaption: text("fieldCaption"),
    page: P.win,
  };
}

/* The tool's rows, by running the tool — never hand-copied numbers. */
function toolRows(cfg, from, to) {
  const out = execFileSync(
    process.execPath,
    [
      path.join(ROOT, "tools/northstar-null-tables.js"),
      "card14",
      cfg,
      String(from),
      String(to),
    ],
    { encoding: "utf8", maxBuffer: 1 << 24 },
  );
  return out
    .split("\n")
    .filter((l) => l.startsWith("card14 ") && !/nobuild/.test(l))
    .map((l) => {
      const m =
        /d=(\d+) seed (\d+) (placed|null) realised (\S+) fate (.+?) hybGens (\d+)\/(\d+) ratio (\S+)/.exec(
          l,
        );
      return {
        d: +m[1],
        seed: +m[2],
        arm: m[3],
        realised: m[4],
        fate: m[5],
        hybGens: +m[6],
        gens: +m[7],
        ratio: m[8] === "null" ? null : m[8],
      };
    });
}

module.exports = { runPage, toolRows, CARDS, OPTION_IDS };
