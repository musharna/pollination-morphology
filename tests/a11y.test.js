/*
 * Basic accessibility acceptance for the two single-file simulations.
 * No DOM library: the checks are regex over the source, deliberately simple.
 *
 * Seen-to-fail control: run against the pre-change page with
 *   A11Y_PAGE=<(git show origin/master:population.html) node --test tests/a11y.test.js
 * (or set A11Y_PAGE to any file) — every assertion group must fail there.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const PAGES = process.env.A11Y_PAGE
  ? [process.env.A11Y_PAGE]
  : ["population.html", "visit.html"].map((f) => path.join(ROOT, f));

/* Opening tags of one element type, as attribute strings. The pages are
 * prettier-formatted, so tags can span lines; [^>]* is enough because no
 * attribute here contains a literal ">". */
function tags(src, name) {
  const re = new RegExp(`<${name}\\b([^>]*)>`, "gi");
  const out = [];
  let m;
  while ((m = re.exec(src))) out.push({ attrs: m[1], index: m.index });
  return out;
}
function attr(attrs, name) {
  const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i"));
  return m ? m[1] : null;
}
function stripComments(src) {
  return src.replace(/<!--[\s\S]*?-->/g, "");
}

for (const page of PAGES) {
  const src = stripComments(fs.readFileSync(page, "utf8"));
  const label = path.basename(page);
  const labelFor = new Set(
    tags(src, "label")
      .map((t) => attr(t.attrs, "for"))
      .filter(Boolean),
  );

  test(`${label}: every input/select has a label or aria-label`, () => {
    const controls = [...tags(src, "input"), ...tags(src, "select")];
    assert.ok(controls.length > 0, "page has form controls");
    const unnamed = controls.filter((t) => {
      const id = attr(t.attrs, "id");
      return !(attr(t.attrs, "aria-label") || (id && labelFor.has(id)));
    });
    assert.deepEqual(
      unnamed.map((t) => t.attrs.trim()),
      [],
      "controls without an accessible name",
    );
  });

  test(`${label}: every button has an accessible name`, () => {
    const re = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
    const unnamed = [];
    let m;
    let count = 0;
    while ((m = re.exec(src))) {
      count++;
      const text = m[2].replace(/<[^>]*>/g, "").trim();
      if (!text && !attr(m[1], "aria-label")) unnamed.push(m[1].trim());
    }
    assert.ok(count > 0, "page has buttons");
    assert.deepEqual(unnamed, [], "buttons without an accessible name");
  });

  test(`${label}: every canvas has role="img" and an aria-label`, () => {
    const canvases = tags(src, "canvas");
    assert.ok(canvases.length > 0, "page has a canvas");
    const bad = canvases.filter(
      (t) => attr(t.attrs, "role") !== "img" || !attr(t.attrs, "aria-label"),
    );
    assert.deepEqual(
      bad.map((t) => t.attrs.trim()),
      [],
      "canvases without role=img + aria-label",
    );
  });

  test(`${label}: canvas has a visually-hidden aria-live text mirror`, () => {
    assert.match(
      src,
      /class="visually-hidden"[^>]*aria-live="polite"|aria-live="polite"[^>]*class="visually-hidden"/,
    );
  });

  test(`${label}: landmarks — <main> and a Controls section`, () => {
    assert.match(src, /<main\b/);
    assert.match(
      src,
      /<(section|fieldset)\b[^>]*aria-label="Controls"|<legend\b/,
    );
  });

  test(`${label}: prefers-reduced-motion is honoured in CSS and JS`, () => {
    assert.match(src, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    assert.match(
      src,
      /matchMedia\(\s*["']\(prefers-reduced-motion:\s*reduce\)["']/,
    );
  });

  test(`${label}: visible focus style`, () => {
    assert.match(src, /:focus-visible/);
  });
}
