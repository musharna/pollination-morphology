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
  if (settings.lineages) {
    if (!P.win.Sandbox || !P.win.Sandbox.setLineage)
      throw new Error("the page exposes no Sandbox.setLineage");
    settings.lineages.forEach((g, li) => P.win.Sandbox.setLineage(li, g));
  }
  for (const k of ["seed", "d", "n", "gens", "siteN"])
    if (settings[k] !== undefined) set(k, settings[k]);
  doc.getElementById("useD").checked = !!settings.useD;
  set("mode", settings.random ? "random" : "real");
  P.timers.length = 0;
  doc.getElementById("run").onclick();
  while (P.timers.length) P.timers.shift()();
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
    cards,
    cardText: Object.fromEntries(CARDS.map((c) => [c, text(c + "Text")])),
    win: P.win,
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

module.exports = { runPage, toolRows, CARDS };
