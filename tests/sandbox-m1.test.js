/*
 * M1 acceptance for the sandbox screen (docs/superpowers/specs/2026-09-12-northstar-design.md
 * §3 items 1-4, §9 M1 row).
 *
 * ⚠️ THESE ARE PAGE TESTS, NOT MODEL TESTS, AND THAT IS THE POINT. The model
 * already has its own suite; what M1 adds is a screen. A test that imported
 * sim/ibm.js and swept a gene would pass on a page with no sliders on it at
 * all. So the page is LOADED — its <script src> files and its inline script,
 * in one context with require and module absent, which is the browser
 * condition — its sliders are driven through their own oninput handlers, and
 * every number is read back out of the DOM the page wrote it into.
 *
 * Seen-to-fail control: point SANDBOX_PAGE at the pre-change page, e.g.
 *   mkdir -p /tmp/pre && git show master:population.html > /tmp/pre/population.html
 *   SANDBOX_PAGE=/tmp/pre/population.html node --test tests/sandbox-m1.test.js
 * Every test below must fail there. They do: the pre-change page builds no
 * sliders, writes no body-map mirror, has no separation or target tile, and
 * does not load population-run.js.
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const { loadPage } = require("../tools/fake-dom.js");

const ROOT = path.join(__dirname, "..");
const PAGE = process.env.SANDBOX_PAGE || path.join(ROOT, "sandbox.html");
const PAGE_ROOT = process.env.SANDBOX_PAGE
  ? path.dirname(process.env.SANDBOX_PAGE)
  : ROOT;

const GENES = [
  "axisLen",
  "mouthR",
  "throatR",
  "curve",
  "polarity",
  "antherT",
  "antherProject",
  "antherTheta",
];

function load() {
  return loadPage(PAGE, { root: PAGE_ROOT });
}

/* The anther dot the page drew for one lineage, read back out of the page's own
 * aria-live mirror of the body map. Three decimals is what a screen reader is
 * given, so it is what a test gets: it is the page's number, not a recomputation. */
function antherOf(doc, lineage) {
  const txt = doc.getElementById("bodyLive")
    ? doc.getElementById("bodyLive").textContent
    : "";
  const m = new RegExp(
    `lineage ${lineage} anther at (-?[\\d.]+) along the body, (-?[\\d.]+) around it`,
  ).exec(txt);
  return m ? { s: +m[1], phi: +m[2] } : null;
}

function setSlider(doc, id, v) {
  const el = doc.getElementById(id);
  assert.ok(el, `no slider #${id} on the page`);
  el.value = String(v);
  assert.equal(
    typeof el.oninput,
    "function",
    `slider #${id} has no oninput handler — it is wired to nothing`,
  );
  el.oninput({ target: el });
}

/* ------------------------------------------------- the sliders exist, in range */

test("each lineage has eight sliders whose min/max are GENE_BOUNDS", () => {
  const { win, document: doc } = load();
  const E = win.Evolve;
  assert.ok(E && E.GENE_BOUNDS, "the bundle did not expose Evolve.GENE_BOUNDS");
  for (const li of [1, 2]) {
    const ids = GENES.map((k) => `g${li}_${k}`);
    for (const k of GENES) {
      const el = doc.getElementById(`g${li}_${k}`);
      assert.ok(el, `lineage ${li} has no slider for ${k}`);
      assert.equal(
        el.getAttribute("type"),
        "range",
        `${k} is not a slider on lineage ${li}`,
      );
      const [lo, hi] =
        k === "antherTheta" ? [-Math.PI, Math.PI] : E.GENE_BOUNDS[k];
      assert.equal(
        +el.getAttribute("min"),
        lo,
        `lineage ${li} ${k} min is not the model's bound`,
      );
      assert.equal(
        +el.getAttribute("max"),
        hi,
        `lineage ${li} ${k} max is not the model's bound`,
      );
    }
    assert.equal(new Set(ids).size, 8, "eight sliders per lineage");
  }
});

test("the bee's two sliders are labelled as fixed for the run", () => {
  const { document: doc, html } = load();
  for (const id of ["reach", "bodyLen"]) {
    const el = doc.getElementById(id);
    assert.ok(el, `no #${id} slider`);
    assert.equal(el.getAttribute("type"), "range");
  }
  const labels = [...html.matchAll(/<label[^>]*for="(reach|bodyLen)"[^>]*>/g)];
  assert.equal(labels.length, 2, "the two bee sliders have no <label for>");
  assert.match(
    html,
    /bee, fixed for the run/,
    'the bee sliders are not labelled "bee, fixed for the run"',
  );
});

/* ------------------------------------------------------- slider sensitivity */

/*
 * ⚠️ BOTH BRANCHES ARE NAMED, which is what round 4 of the spec fixed. The old
 * acceptance ("the slider moves a dot, or is labelled no-effect") passed on
 * either outcome for every gene, so it could not fail. Here: the seven moving
 * genes must each shift lineage 2's anther dot by at least 0.1 body distance
 * AND carry no no-effect label, while `curve` alone must carry it.
 *
 * Magnitudes measured at this bee on this genome, for the report:
 * antherT 11.216, throatR 7.544, antherTheta (0 to pi) 7.465, axisLen 4.376,
 * polarity 0.642, mouthR 0.415, antherProject 0.188, curve 0.000
 * (tmp/v4-pollen/probe5_gene_sensitivity.out, base genome seed 1).
 */
test("every moving gene shifts lineage 2's anther dot; curve alone says it does not", () => {
  const { win, document: doc } = load();
  const I = win.IBM;

  const measured = {};
  for (const k of GENES) {
    const el = doc.getElementById(`g2_${k}`);
    assert.ok(el, `lineage 2 has no slider for ${k}`);
    /* antherTheta WRAPS: -pi and pi are the same point on the body, so the
     * sweep that means anything is 0 to pi (spec §9, M1 row). */
    const [lo, hi] =
      k === "antherTheta"
        ? [0, Math.PI]
        : [+el.getAttribute("min"), +el.getAttribute("max")];

    setSlider(doc, `g2_${k}`, lo);
    const a = antherOf(doc, 2);
    setSlider(doc, `g2_${k}`, hi);
    const b = antherOf(doc, 2);
    assert.ok(a && b, `the page drew no anther dot for lineage 2 at ${k}`);
    measured[k] = I.dist(a, b);

    /* leave the gene where the page found it, so the genes are swept one at a
     * time against the same start genome rather than cumulatively */
    setSlider(doc, `g2_${k}`, +el.getAttribute("value"));
  }

  for (const k of GENES) {
    if (k === "curve") continue;
    assert.ok(
      measured[k] >= 0.1,
      `${k} swept bound to bound moved the dot ${measured[k].toFixed(3)} — under 0.1, so the slider is wired to nothing`,
    );
  }
  assert.ok(
    measured.curve < 0.1,
    `curve moved the dot ${measured.curve.toFixed(3)} at this bee — the "no effect" label would be a lie`,
  );

  /* and the label, which is the other half of the acceptance */
  for (const k of GENES) {
    const el = doc.getElementById(`g2_${k}_eff`);
    assert.ok(el, `no effect label beside lineage 2's ${k}`);
    if (k === "curve")
      assert.equal(
        el.textContent,
        "no effect at this bee",
        "curve is not labelled as having no effect at this bee",
      );
    else
      assert.equal(
        el.textContent,
        "",
        `${k} moves the dot but is labelled "${el.textContent}"`,
      );
  }
});

/* --------------------------------------------------------------- the tiles */

test("the level-1 target reads beside the realised separation before any click", () => {
  const { document: doc } = load();
  const sep = doc.getElementById("sReal");
  const target = doc.getElementById("sTarget");
  const band = doc.getElementById("sRealBand");
  assert.ok(
    sep && target && band,
    "the separation and target tiles are absent",
  );
  assert.match(
    target.textContent,
    /reach 8/,
    'the level-1 target does not read "reach 8" at load',
  );
  assert.match(
    sep.textContent,
    /^\d+\.\d+$/,
    "no realised separation is printed at load",
  );
  assert.ok(band.textContent.length > 0, "the separation carries no band");

  /* ⚠️ AND IT IS NOT THE CLUSTER TILE. res.cluster.separation is a ratio with
   * an unbounded denominator (sim/ibm.js:920); the two are labelled differently
   * and never share a band. */
  const cluster = doc.getElementById("sSep");
  assert.ok(cluster, "the cluster-separation tile is gone");
  assert.notEqual(
    cluster,
    sep,
    "the realised separation and the cluster separation are the same element",
  );
});

test("the herkogamy note states the derived stigma and its clamp", () => {
  const { html } = load();
  assert.match(html, /stigmaT/, "the herkogamy note does not name stigmaT");
  assert.match(
    html,
    /Math\.min\(0\.92, antherT \+ HERKOGAMY\)/,
    "the herkogamy note does not print the rule, clamp included",
  );
});

/* ------------------------------------------------------------- the founding */

/*
 * ⚠️ THE RECIPE IS EXECUTED, NOT RETYPED. foundFromGenomes lives in
 * population-run.js and the page calls it; the test calls the same function out
 * of the loaded page, so a page that founds some other way fails here.
 *
 * Two things a finite-allele check alone cannot see, both verified failures:
 * a `base` without the signal locus gives NaN signal on every founder, and a
 * recipe that writes `half` twice founds n - 1 plants at odd n.
 */
test("the founding recipe founds N plants with the right labels and finite alleles", () => {
  const { win } = load();
  const I = win.IBM;
  const E = win.Evolve;
  assert.ok(
    win.SandboxRun && typeof win.SandboxRun.foundFromGenomes === "function",
    "the page does not load population-run.js's founding recipe",
  );

  /* level 1's start genome: the one randomGenome(makeRng(1)) draws, signal 0.5 */
  const g = { ...E.randomGenome(E.makeRng(1)), signal: 0.5 };

  for (const [n, a0, a1] of [
    [5, 2, 3],
    [30, 15, 15],
  ]) {
    const pop = win.SandboxRun.foundFromGenomes(
      [g, g],
      n,
      E.makeRng(1),
      I.signalRng(1),
    );
    assert.equal(pop.length, n, `N = ${n} founded ${pop.length} plants`);
    assert.equal(
      pop.filter((i) => i.anc === 0).length,
      a0,
      `N = ${n}: wrong count of anc 0 — is the second call passing half twice?`,
    );
    assert.equal(
      pop.filter((i) => i.anc === 1).length,
      a1,
      `N = ${n}: wrong count of anc 1`,
    );
    for (const ind of pop)
      for (const hap of ["h1", "h2"])
        for (const k of I.ALL_KEYS)
          assert.ok(
            Number.isFinite(ind[hap][k]),
            `founder allele ${hap}.${k} is ${ind[hap][k]} — a base without the signal locus gives NaN on every founder`,
          );
  }
});

/* --------------------------------------------------- the engine is untouched */

test("the page's own script still parses and the loop is not inline", () => {
  const src = fs.readFileSync(PAGE, "utf8");
  assert.match(
    src,
    /<script[^>]*src="population-run\.js"/,
    "the page does not load population-run.js",
  );
  const inline = [
    ...src.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
  ];
  assert.ok(inline.length > 0, "no inline script");
  for (const [, body] of inline)
    assert.ok(
      !/\bI\.step\s*\(/.test(body),
      "sandbox.html still drives step() inline — the loop belongs in population-run.js",
    );
});

/* -------------------------------------------- "never touches the bee" */

/* ⚠️ A STATE WITH NO DOT IS NOT A BROKEN PAGE. `placementDistribution` with no
 * hits is the model saying the flower never touches the animal
 * (sim/evolve.js:165). The page must say so rather than quietly drawing
 * nothing, and the realised separation must go to "not measured" rather than
 * to a number computed from one lineage. Configuration found by search, then
 * driven through the page's own sliders. */
test("a flower that never touches the bee says so, and the separation is not measured", () => {
  const { document: doc } = load();
  const set = (id, v) => setSlider(doc, id, v);
  set("reach", 0.4);
  set("g2_antherT", 0.35);
  set("g2_throatR", 0.16);
  set("g2_mouthR", 1.0);

  assert.equal(
    doc.getElementById("touch2").textContent,
    "this flower never touches the bee",
    "the panel does not report a flower that misses the animal entirely",
  );
  assert.equal(
    antherOf(doc, 2),
    null,
    "an anther dot was drawn for a flower with no hits",
  );
  assert.equal(
    doc.getElementById("sReal").textContent,
    "—",
    "a realised separation was printed with only one lineage on the bee",
  );
  assert.equal(doc.getElementById("sRealBand").textContent, "not measured");
});
