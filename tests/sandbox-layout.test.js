/*
 * The rebuilt layout, read off the page source: every id the tests and smoke
 * use is still there exactly once; the run controls are outside any <details>;
 * the Advanced drawer holds the population/option controls; bands are never
 * behind a click; prose is. Seen failing on the pre-rebuild page.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "sandbox.html"), "utf8");
const body = src.slice(src.indexOf("<body"), src.indexOf("<script"));

const KEPT_IDS = ("wrap seed useD d n gens siteN mode cam run play status level levelBrief " +
  "levelOpts levelNote levelWin allocExponent visitsPerPlant selfRate selfCost selfCover " +
  "phenOn phenSlices phenWidth phenWidthLocus phenWidthMut phenConserve phenPropVisits " +
  "phenPropBand loadWidthObj genes1 touch1 bodyMap bodyLive reach bodyLen sReal sRealBand " +
  "sTarget genes2 touch2 herkNote field fieldCaption fieldLive scrub sGen sSep sAnc sHyb " +
  "sHybBand sGap sGapBand sFate sFateBand sAncBand cards card1 card1State card1Text card4 " +
  "card4State card4Text card2 card2State card2Text card3 card3State card3Text card5 " +
  "card5State card5Text card6 card6State card6Text selfcheck heat heatLive").split(" ");

const at = (id) => body.indexOf(`id="${id}"`);
/* depth of <details> open at the element: opens minus closes before it */
const detailsDepth = (id) => {
  const pre = body.slice(0, at(id));
  return (pre.match(/<details\b/g) || []).length - (pre.match(/<\/details>/g) || []).length;
};
const inside = (outer, id) => {
  const s = at(outer);
  const e = body.indexOf("</details>", s);
  return at(id) > s && at(id) < e;
};

test("every kept id is present exactly once", () => {
  for (const id of KEPT_IDS)
    assert.equal(body.split(`id="${id}"`).length - 1, 1, `#${id}`);
});

test("one body map: the old #map canvas is gone (A14)", () => {
  assert.equal(at("map"), -1, 'id="map" is still in the page');
  assert.ok(at("bodyMap") > 0, "control: #bodyMap is present");
});

test("run controls, verdict and every band are outside any <details>", () => {
  for (const id of ["level", "seed", "run", "play", "status", "levelWin", "levelBrief",
    "sFate", "sFateBand", "sAncBand", "sHybBand", "sGapBand", "sRealBand", "heat", "field", "scrub"])
    assert.equal(detailsDepth(id), 0, `#${id} is behind a click`);
});

test("the Advanced drawer holds the population and option controls, closed", () => {
  assert.match(body, /<details id="advanced">/, "no closed #advanced drawer");
  for (const id of ["n", "gens", "siteN", "mode", "useD", "d", "allocExponent", "selfRate", "phenOn", "loadWidthObj"])
    assert.ok(inside("advanced", id), `#${id} not in the drawer`);
  assert.ok(!inside("advanced", "run"), "control: #run must not be in the drawer");
});

test("prose is behind a click; each card is a badge with its text inside <details>", () => {
  for (const id of ["about", "herkNote"]) assert.ok(detailsDepth(id) > 0, `#${id} is not collapsed`);
  for (const k of [1, 2, 3, 4, 5, 6]) {
    const s = at(`card${k}`);
    const e = body.indexOf(`id="card${k}Text"`);
    assert.ok(/<details\b/.test(body.slice(s, e)), `card ${k} text is not behind its summary`);
  }
});

test("the hero comes before the lineage section, and the cards directly after it", () => {
  assert.ok(at("hero") > 0 && at("hero") < at("cards"));
  assert.ok(at("cards") < at("genes1"));
  assert.ok(at("heat") < at("field"), "heat is the hero's left column");
});
