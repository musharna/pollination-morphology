"""Stage 4 smoke test for the built site/ — per-page expectations.

The first version of this test asserted "every canvas must animate on load".
That encoded MY belief, not the pages' spec, and it failed on two pages that are
behaving correctly. Inspection settled it:

  index.html       landing page. No canvas. Every same-origin link resolves 200.
  visit.html       AUTOPLAYS — its control reads "Pause" on load, 2 rAF sites.
                   Canvas must be non-blank AND change between two samples.
  sandbox.html     WAITS for the user (<button id="run">). Canvas non-blank on
                   load, must NOT animate before the click, and MUST animate
                   after it — the real end-to-end check that the evolution loop
                   runs in a browser.

Every page also asserts HTTP 200, zero console errors, zero uncaught exceptions.
Exits non-zero on any failure, naming it.
"""

import re
import signal
import sys
import threading
import functools
import http.server
import socketserver
import urllib.request

signal.signal(
    signal.SIGALRM,
    lambda *_: (sys.stderr.write("aborting: walltime guard\n"), sys.exit(2)),
)
signal.alarm(3600)

ROOT = (
    sys.argv[1] if len(sys.argv) > 1 else "site"
)
PORT = 0  # ephemeral: this host runs parallel jobs, fixed ports collide

SPEC = [
    ("index.html", "links"),
    ("visit.html", "autoplay"),
    ("sandbox.html", "click"),
]

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(("127.0.0.1", PORT), Handler)
PORT = httpd.server_address[1]
BASE = f"http://127.0.0.1:{PORT}"
print(f"serving {ROOT} on {BASE}")
threading.Thread(target=httpd.serve_forever, daemon=True).start()

failures, report = [], []

from playwright.sync_api import sync_playwright  # noqa: E402

SHOT = """() => Array.from(document.querySelectorAll('canvas')).map(c => {
  try {
    const u = c.toDataURL();
    // Distinct-colour count, grid-sampled. A data-URL LENGTH cannot tell a
    // rendered canvas from a uniform fill: a flat colour compresses tiny but is
    // not "non-blank" in any sense a reader would accept. Counting colours can.
    let ncol = -1;
    try {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      const seen = new Set();
      const step = Math.max(1, Math.floor((c.width * c.height) / 4000)) * 4;
      for (let i = 0; i + 3 < d.length; i += step) {
        seen.add((d[i] << 24) | (d[i + 1] << 16) | (d[i + 2] << 8) | d[i + 3]);
        if (seen.size > 64) break;
      }
      ncol = seen.size;
    } catch (e) { ncol = -1; }
    return u.length + ':' + u.slice(-64) + ':' + ncol;
  } catch (e) { return 'ERR:-1:-1'; }
})"""


def sample(page, settle, gap):
    page.wait_for_timeout(settle)
    a = page.evaluate(SHOT)
    page.wait_for_timeout(gap)
    b = page.evaluate(SHOT)
    n = len(a)
    changed = sum(1 for x, y in zip(a, b) if x != y)
    # <=1 distinct colour means nothing a viewer could see was drawn
    uniform = sum(1 for x in a if x.startswith("ERR") or int(x.rsplit(":", 1)[1]) <= 1)
    return n, changed, uniform


# ---------------------------------------------------------------- M2 (northstar)
# One assertion per M2 acceptance line (docs/superpowers/specs/2026-09-12-northstar-
# design.md section 9), every card state read from the DOM's data-state:
# the two positive seeds, the random-mating null block (seeds 1-5 x targets 4, 8;
# quantity on the null side AND grey on cards 1 and 4 - grey wins), and the
# STALLED fixture with its 0.80 / 0.85 controls. tests/sandbox-m2-*.test.js
# assert the same in the fake DOM; this is the real-browser control on them.
M2_RUN = """async (s) => {
  const $ = (id) => document.getElementById(id);
  if (s.lineages) {
    const E = window.Evolve;
    const g = { ...E.randomGenome(E.makeRng(4)), antherT: s.lineages };
    window.Sandbox.setLineage(0, g);
    window.Sandbox.setLineage(1, { ...g });
  }
  for (const k of ["seed", "d", "n", "gens", "siteN"]) if (k in s) $(k).value = String(s[k]);
  $("useD").checked = !!s.useD;
  $("d").disabled = !s.useD;
  $("mode").value = s.random ? "random" : "real";
  $("status").textContent = "running…";
  $("status").removeAttribute("data-error");
  $("run").click();
  const t0 = performance.now();
  while ($("status").textContent === "running…" && performance.now() - t0 < 90000)
    await new Promise((r) => setTimeout(r, 100));
  const band = $("sFateBand").textContent, hb = $("sHybBand").textContent;
  const st = /(\d+) of (\d+) generations recruited nothing/.exec(band);
  const hy = /hybrids among the parents in (\d+) of (\d+) generations/.exec(hb);
  const ra = /receipt ratio (\S+)/.exec(hb);
  const cards = {};
  for (const c of ["card1", "card2", "card3", "card4", "card5", "card6"])
    cards[c] = $(c) ? $(c).getAttribute("data-state") : null;
  return {
    status: $("status").textContent,
    error: $("status").getAttribute("data-error"),
    fate: $("sFate").textContent,
    stalled: st ? +st[1] : null,
    hyb: hy ? +hy[1] : null,
    ratio: ra ? ra[1] : null,
    cards,
  };
}"""


# ------------------------------------------------------------ the heatmap (#heat)
# The heat grid's OPAQUE pixel count (alpha 255, inside the grid rows from
# AncestryHeat.layout) is compared with a BASELINE: AncestryHeat.drawEmpty with
# the page's placeholder message, drawn on an offscreen canvas at the page's own
# logical size and devicePixelRatio (Sandbox.heatSize()), so the counts compare. (A
# distinct-colour count cannot fail here: anti-aliased placeholder text alone
# saturates it on a transparent canvas. The baseline is offscreen because #heat
# shows the labelled example on load, so #heat itself has no empty state.)
# On load, before #run: > 5x baseline, #heatLive says "Example run", and
# Sandbox.heat() is null (it is an example, not a run). After #run: > 5x
# baseline, Sandbox.heat() non-null, #heatLive no longer the example. Then a
# REAL mouse click on column 5's centre - computed from AncestryHeat.layout on
# the page's own model, scaled to the canvas's content box - moves the scrubber to generation 5. Positive control: #scrub reads 0
# before the click, so a scrubber already at 5 cannot pass it.
HEAT_INK = """(off) => {
  let c = document.getElementById('heat');
  if (!c) return -1;
  const S = window.Sandbox.heatSize(), W = S.W, H = S.H, dpr = S.dpr;
  if (off) {
    c = document.createElement('canvas');
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    window.AncestryHeat.drawEmpty(g, W, H,
      "press Run: each column will be one generation's plants, sorted by ancestry");
  }
  /* layout is in logical px; getImageData reads backing px, so scale by dpr */
  const lay = window.AncestryHeat.layout({ cols: [{ final: false }] }, W, H);
  const x0 = Math.round(lay.xOf(0) * dpr), y0 = Math.round(lay.heatTop * dpr),
    y1 = Math.round(lay.heatBot * dpr);
  const d = c.getContext('2d').getImageData(x0, y0, c.width - x0, y1 - y0).data;
  let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] === 255) n++;
  return n;
}"""

HEAT_COL5 = """() => {
  const c = document.getElementById('heat');
  c.scrollIntoView({ block: 'center' });
  const H = window.Sandbox.heat();
  if (!H) return null;
  const S = window.Sandbox.heatSize();
  const lay = window.AncestryHeat.layout(H, S.W, S.H);
  const r = c.getBoundingClientRect();
  const k = c.clientWidth / S.W;
  return {
    x: r.left + c.clientLeft + (lay.xOf(5) + lay.colW / 2) * k,
    y: r.top + c.clientTop + c.clientHeight / 2,
  };
}"""


# The heat's backing store follows its displayed size x devicePixelRatio. In a
# device_scale_factor=2 context at 1400x900: canvas.width == round(2 x
# clientWidth) (within 1 px), Sandbox.heatSize().W == clientWidth, and the heat
# is displayed >= 500 px wide (positive control: it is on screen, so a 0-wide
# canvas cannot pass). Then the viewport goes to 900x900, which stacks the hero:
# clientWidth must change (control: the resize happened) and the backing width
# must follow the new clientWidth x 2.
HEAT_DPR = """() => {
  const c = document.getElementById('heat');
  const S = window.Sandbox && window.Sandbox.heatSize ? window.Sandbox.heatSize() : null;
  const other = Object.fromEntries(['field', 'bodyMap'].map((id) => {
    const e = document.getElementById(id);
    return [id, { cw: e.clientWidth, bw: e.width }];
  }));
  return { cw: c.clientWidth, bw: c.width, bh: c.height, shown: c.getBoundingClientRect().width,
           dpr: window.devicePixelRatio, S, other };
}"""


def heat_dpr_checks(browser, name, failures):
    ctx = browser.new_context(viewport={"width": 1400, "height": 900}, device_scale_factor=2)
    page = ctx.new_page()
    page.goto(f"{BASE}/{name}", wait_until="load")
    seen = []
    for vw in (1400, 900):
        if vw != 1400:
            page.set_viewport_size({"width": vw, "height": 900})
            try:  # a ResizeObserver callback is async: wait for it, then measure regardless
                page.wait_for_function(
                    "(w0) => document.getElementById('heat').clientWidth !== w0 && "
                    "Math.abs(document.getElementById('heat').width - "
                    "2 * document.getElementById('heat').clientWidth) <= 1",
                    arg=seen[0]["cw"], timeout=3000)
            except Exception:  # noqa: BLE001
                pass
        m = page.evaluate(HEAT_DPR)
        seen.append(m)
        at = f"{name}: DPR 2 at {vw}x900"
        if m["dpr"] != 2:
            failures.append(f"{at}: devicePixelRatio {m['dpr']}, want 2 (the context is wrong)")
        if abs(m["bw"] - round(2 * m["cw"])) > 1:
            failures.append(f"{at}: #heat backing width {m['bw']} vs clientWidth {m['cw']} - want {round(2 * m['cw'])}")
        # Task 5 (A1): the field and the body map follow the same rule
        for cid, o in m["other"].items():
            if o["cw"] < 200 or abs(o["bw"] - round(2 * o["cw"])) > 1:
                failures.append(f"{at}: #{cid} backing width {o['bw']} vs clientWidth {o['cw']} - want {round(2 * o['cw'])} (and displayed >= 200 px)")
        if not m["S"] or m["S"]["W"] != m["cw"]:
            failures.append(f"{at}: Sandbox.heatSize() {m['S']!r} - want W == clientWidth {m['cw']}")
        elif abs(m["bh"] - round(2 * m["S"]["H"])) > 1:
            failures.append(f"{at}: #heat backing height {m['bh']} vs logical H {m['S']['H']} - want {round(2 * m['S']['H'])}")
    if seen[0]["shown"] < 500:
        failures.append(f"{name}: control - #heat displayed {seen[0]['shown']:.0f} px wide at 1400x900, want >= 500")
    if seen[1]["cw"] == seen[0]["cw"]:
        failures.append(f"{name}: control - #heat clientWidth {seen[0]['cw']} did not change at 900x900 (no resize)")
    ctx.close()
    a, b = seen
    o = "; ".join(f"#{k} {v['bw']}/{v['cw']} at 1400, {b['other'][k]['bw']}/{b['other'][k]['cw']} at 900"
                  for k, v in a["other"].items())
    return f"DPR2 backing/clientWidth #heat {a['bw']}/{a['cw']} at 1400, {b['bw']}/{b['cw']} at 900; {o}"


HEAT_STATE = """() => [document.getElementById('heatLive').textContent,
  window.Sandbox.heat() === null]"""

# First screen at 1400x900, on load, before any scroll: the run controls, the
# verdict and both views are above the fold, and the Advanced drawer is shut.
# Positive control: #selfcheck (the page's last element) is measured BELOW the
# fold, so a probe that read every top as 0 cannot pass.
FIRST_SCREEN = """() => {
  const top = (id) => { const e = document.getElementById(id);
    return e ? Math.round(e.getBoundingClientRect().top) : null; };
  const adv = document.getElementById('advanced');
  return { tops: Object.fromEntries(['run', 'level', 'sFate', 'heat', 'field', 'selfcheck']
             .map((id) => [id, top(id)])),
           advOpen: adv ? adv.open : null, scrollY: window.scrollY };
}"""


def first_screen_checks(page, name, failures):
    fs = page.evaluate(FIRST_SCREEN)
    t = fs["tops"]
    for k in ["run", "level", "sFate", "heat", "field"]:
        if t[k] is None or t[k] >= 900:
            failures.append(f"{name}: #{k} top {t[k]} on load at 1400x900 - not on the first screen")
    if t["selfcheck"] is None or t["selfcheck"] < 900:
        failures.append(f"{name}: control - #selfcheck top {t['selfcheck']}, want below the fold (>= 900)")
    if fs["advOpen"] is not False:
        failures.append(f"{name}: #advanced open is {fs['advOpen']!r} on load, want False (a closed drawer)")
    return f"first screen tops {t}, advanced open {fs['advOpen']}"


# ------------------------------------------- Task 5: thumbnails and the body map
# A thumbnail is drawn when more than 5% of its pixels differ from its own
# top-left corner pixel by more than 24 in any channel (a distinct-colour count
# saturates on anti-aliasing and could not fail, Task 2). Moving g1_axisLen to
# its max must change #thumb1 and leave #thumb2 byte-identical (control: the
# other card is untouched). Seen failing with renderThumb returning at once.
THUMB_INK = """(id) => {
  const c = document.getElementById(id);
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4)
    for (let k = 0; k < 4; k++) if (Math.abs(d[i + k] - d[k]) > 24) { n++; break; }
  return n / (c.width * c.height);
}"""
# FNV-1a over the canvas's backing pixels: equal iff (up to hash collision) identical
CANVAS_SIG = """(id) => {
  const c = document.getElementById(id);
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let h = 2166136261;
  for (let i = 0; i < d.length; i++) h = Math.imul(h ^ d[i], 16777619) >>> 0;
  return h;
}"""
SET_INPUT = """([id, v]) => {
  const e = document.getElementById(id);
  const was = e.value;
  e.value = v === null ? e.max : String(v);
  e.dispatchEvent(new Event('input'));
  return was;
}"""


def thumb_checks(page, name, failures):
    ink = [page.evaluate(THUMB_INK, f"thumb{i}") for i in (1, 2)]
    for i, f in zip((1, 2), ink):
        if not f > 0.05:
            failures.append(f"{name}: #thumb{i} has {f:.1%} of pixels off its corner colour on load (need > 5%)")
    s1, s2 = page.evaluate(CANVAS_SIG, "thumb1"), page.evaluate(CANVAS_SIG, "thumb2")
    g1 = page.evaluate("() => window.Sandbox.lineage(0)")
    page.evaluate(SET_INPUT, ["g1_axisLen", None])
    t1, t2 = page.evaluate(CANVAS_SIG, "thumb1"), page.evaluate(CANVAS_SIG, "thumb2")
    # exact restore (a range input snaps a written value to its step)
    page.evaluate("(g) => window.Sandbox.setLineage(0, g)", g1)
    if t1 == s1:
        failures.append(f"{name}: g1_axisLen to its max left #thumb1 unchanged")
    if t2 != s2:
        failures.append(f"{name}: g1_axisLen changed #thumb2 (control: only lineage 1's card may redraw)")
    return f"thumbs {ink[0]:.1%}/{ink[1]:.1%} off-corner, axisLen max -> thumb1 {'changed' if t1 != s1 else 'SAME'}, thumb2 {'same' if t2 == s2 else 'CHANGED'}"


# After a run: #bodyMap differs between scrub 0 and scrub 10 (the shown
# generation is drawn). Then the camera restore: redraw the field at the shown
# generation (an input on #scrub at its own value), sample; move a gene slider
# (renderThumb swaps the camera and render target), redraw the same way,
# sample again - identical. The field camera is first dragged off its default
# yaw/pitch with a real pointer drag (the thumbnail camera shares the patch's
# yaw 0.5 / pitch 0.62, so a missing yaw/pitch restore is invisible at the
# defaults); control: the drag changed the field. Positive control: before the thumb render the field
# shows the scene (> 20% of its pixels off its corner colour) - without it, a
# field already broken by the load-time thumbnail renders compares equal to
# itself. Seen failing with renderThumb's `finally` removed.
# Heat labels fit at the displayed width (Task 5b). CanvasRenderingContext2D
# fillText is wrapped to record every label drawn on #heat - {text, x, y, w =
# measureText (capped at a maxWidth), align}; a clearRect on #heat starts a new
# draw, so only the last draw is kept - while the heat redraws, then unwrapped.
# The example (on load, whose "final: one lost" and title are the long labels)
# is redrawn by a resize; the run's heat (after #run) by an 'input' on #scrub
# and by a resize. At 1400x900 and at 700x900: every label lies within [0, W];
# no gutter label (drawn left of the plot) ends past lay.padL - 4; no two
# labels on one baseline overlap. Positive control: the labels named in
# HEAT_LABEL_NEED were recorded, so an empty recording cannot pass. (BASE's
# layout has no padL; its plot origin xOf(0) is the same number.)
HEAT_REC_ON = """() => {
  const c = document.getElementById('heat');
  const P = CanvasRenderingContext2D.prototype;
  const R = (window.__heatRec = { rec: [], fillText: P.fillText, clearRect: P.clearRect });
  P.clearRect = function () {
    if (this.canvas === c) R.rec = [];
    return R.clearRect.apply(this, arguments);
  };
  P.fillText = function (text, x, y, maxW) {
    if (this.canvas === c) {
      let w = this.measureText(text).width;
      if (maxW !== undefined) w = Math.min(w, maxW);
      R.rec.push({ text: String(text), x, y, w, align: this.textAlign });
    }
    return R.fillText.apply(this, arguments);
  };
}"""
HEAT_REC_OFF = """() => {
  const P = CanvasRenderingContext2D.prototype, R = window.__heatRec;
  P.fillText = R.fillText;
  P.clearRect = R.clearRect;
  delete window.__heatRec;
  const S = window.Sandbox.heatSize();
  const model = window.Sandbox.heat() || window.ExampleHeat.model;
  const lay = window.AncestryHeat.layout(model, S.W, S.H);
  return { rec: R.rec, W: S.W, padL: lay.padL === undefined ? lay.xOf(0) : lay.padL };
}"""
HEAT_LABEL_NEED = ("generation 0", "final", "HELD line", "hybrid band")


def _heat_resize(page, vw, failures, at):
    w0 = page.evaluate("() => document.getElementById('heat').clientWidth")
    page.set_viewport_size({"width": vw, "height": 900})
    try:  # the ResizeObserver refit is async
        page.wait_for_function(
            "(w0) => document.getElementById('heat').clientWidth !== w0", arg=w0, timeout=3000)
    except Exception:  # noqa: BLE001
        failures.append(f"{at}: control - #heat clientWidth stayed {w0} at {vw}x900 (no resize)")
    page.wait_for_timeout(300)


def _heat_label_assert(m, at, need, failures):
    W, padL = m["W"], m["padL"]
    got = [t["text"] for t in m["rec"]]
    for n in need:
        if not any(t.startswith(n) for t in got):
            failures.append(f"{at}: control - no {n!r} label recorded (got {got[:8]})")
    spans = []
    for t in m["rec"]:
        x0 = t["x"] - t["w"] if t["align"] == "right" else t["x"] - t["w"] / 2 if t["align"] == "center" else t["x"]
        spans.append((round(t["y"], 1), x0, x0 + t["w"], t["text"]))
    for y, x0, x1, text in spans:
        if x0 < -0.5 or x1 > W + 0.5:
            failures.append(f"{at}: {text!r} spans [{x0:.1f}, {x1:.1f}], outside [0, {W}]")
        if x0 < padL and x1 > padL - 4:
            failures.append(f"{at}: gutter label {text!r} ends at {x1:.1f}, past padL {padL} - 4")
    for y in sorted({sp[0] for sp in spans}):
        row = sorted((sp for sp in spans if sp[0] == y), key=lambda sp: sp[1])
        for a, b in zip(row, row[1:]):
            if b[1] < a[2]:
                failures.append(f"{at}: {a[3]!r} [{a[1]:.1f}, {a[2]:.1f}] overlaps {b[3]!r} [{b[1]:.1f}, {b[2]:.1f}] on y={y}")
    gut = max((sp[2] for sp in spans if sp[1] < padL), default=0)
    return f"W {W} {len(spans)} labels gutter<={gut:.1f}/padL {padL}"


def heat_label_checks(page, name, failures, example):
    """example=True: before #run (the example, title included), redrawn by resizes.
    example=False: after #run, redrawn by an 'input' on #scrub, then by a resize."""
    tag = "example" if example else "run"
    need = HEAT_LABEL_NEED + (("example:",) if example else ())
    notes = []
    if example:
        for vw in (700, 1400):
            page.evaluate(HEAT_REC_ON)
            _heat_resize(page, vw, failures, f"{name}: heat labels ({tag})")
            notes.append(f"{vw}: " + _heat_label_assert(
                page.evaluate(HEAT_REC_OFF), f"{name}: heat labels ({tag}) at {vw}x900", need, failures))
    else:
        page.evaluate(HEAT_REC_ON)
        page.evaluate("() => document.getElementById('scrub').dispatchEvent(new Event('input'))")
        notes.append("1400: " + _heat_label_assert(
            page.evaluate(HEAT_REC_OFF), f"{name}: heat labels ({tag}) at 1400x900", need, failures))
        page.evaluate(HEAT_REC_ON)
        _heat_resize(page, 700, failures, f"{name}: heat labels ({tag})")
        notes.append("700: " + _heat_label_assert(
            page.evaluate(HEAT_REC_OFF), f"{name}: heat labels ({tag}) at 700x900", need, failures))
        _heat_resize(page, 1400, failures, f"{name}: heat labels ({tag}) restore")
    return f"heat labels {tag} " + "; ".join(notes)


def run_view_checks(page, name, failures):
    page.evaluate(SET_INPUT, ["scrub", 0])
    b0 = page.evaluate(CANVAS_SIG, "bodyMap")
    page.evaluate(SET_INPUT, ["scrub", 10])
    b10 = page.evaluate(CANVAS_SIG, "bodyMap")
    if b0 == b10:
        failures.append(f"{name}: #bodyMap identical at scrub 0 and scrub 10 - the shown generation is not drawn")
    g = page.evaluate("() => document.getElementById('scrub').value")
    page.evaluate(SET_INPUT, ["scrub", g])
    pre_drag = page.evaluate(CANVAS_SIG, "field")
    page.evaluate("() => document.getElementById('field').scrollIntoView({ block: 'center' })")
    bb = page.locator("#field").bounding_box()
    cx, cy = bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2
    page.mouse.move(cx, cy)
    page.mouse.down()
    page.mouse.move(cx + 80, cy + 40, steps=8)
    page.mouse.up()
    page.evaluate(SET_INPUT, ["scrub", g])
    f0 = page.evaluate(CANVAS_SIG, "field")
    if f0 == pre_drag:
        failures.append(f"{name}: control - a pointer drag on #field left it unchanged (the camera did not move off its default)")
    fink = page.evaluate(THUMB_INK, "field")
    if not fink > 0.2:
        failures.append(f"{name}: control - #field has {fink:.1%} of pixels off its corner colour at the shown generation (need > 20%: the scene is not drawn)")
    g2 = page.evaluate("() => window.Sandbox.lineage(1)")
    page.evaluate(SET_INPUT, ["g2_mouthR", None])
    page.evaluate(SET_INPUT, ["scrub", g])
    f1 = page.evaluate(CANVAS_SIG, "field")
    page.evaluate("(g) => window.Sandbox.setLineage(1, g)", g2)
    if f0 != f1:
        failures.append(f"{name}: #field changed after a thumbnail render at the same generation - the camera or render target was not restored")
    return f"bodyMap scrub0 vs 10 {'differ' if b0 != b10 else 'SAME'}, field {fink:.1%} off-corner, field across a thumb render {'identical' if f0 == f1 else 'CHANGED'}"


def heat_load_checks(page, name, failures):
    """Before #run: the labelled example, not a run. Returns (baseline, ink on load)."""
    base = page.evaluate(HEAT_INK, True)
    ink = page.evaluate(HEAT_INK, False)
    live, no_model = page.evaluate(HEAT_STATE)
    if base <= 0 or ink <= 5 * base:
        failures.append(
            f"{name}: #heat grid has {ink} opaque pixels on load vs {base} on the empty "
            f"placeholder baseline (need > 5x: the example is not drawn)"
        )
    if not live.startswith("Example run"):
        failures.append(f"{name}: #heatLive on load reads {live[:60]!r}, want 'Example run...'")
    if not no_model:
        failures.append(f"{name}: Sandbox.heat() is non-null before #run - the example posed as a run")
    return base, ink


def heat_checks(page, name, failures, ink_empty, ink_load):
    ink = page.evaluate(HEAT_INK, False)
    if ink_empty <= 0 or ink <= 5 * ink_empty:
        failures.append(
            f"{name}: #heat grid has {ink} opaque pixels after #run vs {ink_empty} on the "
            f"empty placeholder baseline (need > 5x)"
        )
    live, _ = page.evaluate(HEAT_STATE)
    if live.startswith("Example"):
        failures.append(f"{name}: #heatLive still reads the example after #run: {live[:60]!r}")
    before = page.evaluate("() => document.getElementById('scrub').value")
    if before != "0":
        failures.append(f"{name}: #scrub read {before!r} before the heat click (control expects '0')")
    pt = page.evaluate(HEAT_COL5)
    if pt is None:
        failures.append(f"{name}: Sandbox.heat() is null after #run - nothing to click")
        return f"heat opaque baseline {ink_empty}, load {ink_load}, run {ink}, no model"
    page.mouse.click(pt["x"], pt["y"])
    page.wait_for_timeout(300)
    after = page.evaluate(
        "() => [document.getElementById('scrub').value, document.getElementById('sGen').textContent]"
    )
    if after[0] != "5" or not after[1].startswith("5 /"):
        failures.append(
            f"{name}: clicked #heat column 5 - #scrub {after[0]!r}, #sGen {after[1]!r} (want 5, '5 / ...')"
        )
    return f"heat opaque baseline {ink_empty}, load {ink_load}, run {ink}, scrub {before}->{after[0]} on column-5 click"


def m2_checks(browser, name):
    notes = []
    page = browser.new_page()
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto(f"{BASE}/{name}", wait_until="load")
    run = lambda s: page.evaluate(M2_RUN, s)  # noqa: E731
    PAGE_CFG = {"n": 18, "gens": 24, "siteN": 90}
    # card 4: target 8 seed 1; card 1: target 4 seed 16 (spec M2 row)
    for seed, d, hyb, ratio, card in ((1, 8, 0, "no", "card4"), (16, 4, 1, "0.111", "card1")):
        r = run({**PAGE_CFG, "seed": seed, "d": d, "useD": True})
        if (r["fate"], r["hyb"], r["ratio"], r["cards"][card]) != ("one lost", hyb, ratio, "open"):
            failures.append(f"{name}: M2 positive target {d} seed {seed} read {r}")
        notes.append(f"t{d}s{seed} {r['fate']} {card} {r['cards'][card]}")
    # the null block: quantity on the null side AND grey on cards 1 and 4
    grey = 0
    for seed in range(1, 6):
        for d in (4, 8):
            r = run({**PAGE_CFG, "seed": seed, "d": d, "useD": True, "random": True})
            ok_q = r["hyb"] == 23 and r["ratio"] is not None and (
                r["ratio"] == "Infinity" or float(r["ratio"]) >= 1.146)
            ok_s = r["cards"]["card1"] == "grey" and r["cards"]["card4"] == "grey"
            if not (ok_q and ok_s):
                failures.append(f"{name}: M2 null target {d} seed {seed} read {r}")
            grey += ok_s
    notes.append(f"null block grey {grey}/10")
    # the STALLED fixture (level configuration, hand-set pair) and its controls
    LEVEL = {"n": 30, "gens": 35, "siteN": 160, "seed": 1, "useD": False}
    r = run({**LEVEL, "lineages": 0.825})
    exp = {"card1": "grey", "card2": "grey", "card3": "grey", "card4": "closed",
           "card5": "grey", "card6": "grey"}
    if r["fate"] != "STALLED" or r["stalled"] != 35 or r["cards"] != exp:
        failures.append(f"{name}: M2 stall fixture read {r}")
    notes.append(f"stall {r['fate']} {r['stalled']}/35")
    sweep_state(page, name, "stall", errs, True)
    r = run({**LEVEL, "lineages": 0.80})
    if r["fate"] != "FUSED" or r["stalled"] != 0:
        failures.append(f"{name}: M2 stall control antherT 0.80 read {r}")
    r = run({**LEVEL, "lineages": 0.85})
    if not r["error"] or "never touches the bee" not in r["error"]:
        failures.append(f"{name}: M2 antherT 0.85 was founded: {r}")
    page.close()
    return notes


# ---------------------------------------------------------------- M3a (northstar)
# One assertion per M3a acceptance line (spec section 9, M3a row; brief
# docs/superpowers/briefs/2026-09-22-m3a-levels.md), read off the real DOM:
# level 3's controls before any run; level 1's separation 8 by a slider alone
# (a real `input` event on the range element, not setLineage); level 2 at seed 1,
# target 8: `one lost`, lost, the no-known-win copy; loading each level opens no
# card; and a 35-generation, siteN 160 run TIMED inside 60 s.
M3A_LEVEL = """(lv) => {
  const $ = (id) => document.getElementById(id);
  const sel = $("level");
  sel.value = String(lv);
  sel.dispatchEvent(new Event("change"));
  const cards = {};
  for (const c of ["card1", "card2", "card3", "card4", "card5", "card6"])
    cards[c] = $(c).getAttribute("data-state");
  return {
    n: $("n").value, gens: $("gens").value, siteN: $("siteN").value,
    run: $("run").disabled, win: $("levelWin").getAttribute("data-state"),
    sep: $("sReal").textContent, note: $("levelNote").textContent, cards,
  };
}"""
M3A_SLIDE = """([id, v]) => {
  const $ = (x) => document.getElementById(x);
  const el = $(id);
  el.value = String(v);
  el.dispatchEvent(new Event("input"));
  return { sep: $("sReal").textContent, win: $("levelWin").getAttribute("data-state") };
}"""


def m3a_checks(browser, name):
    notes = []
    page = browser.new_page()
    page.goto(f"{BASE}/{name}", wait_until="load")
    lv = lambda x: page.evaluate(M3A_LEVEL, x)  # noqa: E731
    # line 1: level 3 reads N 30, 35, 160 before running
    r = lv(3)
    if (r["n"], r["gens"], r["siteN"]) != ("30", "35", "160"):
        failures.append(f"{name}: M3a level 3 controls read {r}")
    notes.append(f"L3 {r['n']}/{r['gens']}/{r['siteN']}")
    # line 2: level 1, separation 8 by sliders alone; not won at load
    r = lv(1)
    if r["win"] != "pending" or r["sep"] != "0.000" or not r["run"]:
        failures.append(f"{name}: M3a level 1 at load read {r}")
    hi = page.evaluate("() => window.Evolve.GENE_BOUNDS.antherT[1]")
    s = page.evaluate(M3A_SLIDE, ["g2_antherT", hi - 0.02])
    if not (float(s["sep"]) >= 8 and s["win"] == "won"):
        failures.append(f"{name}: M3a level 1 slider reached {s}")
    notes.append(f"L1 sep {s['sep']} {s['win']}")
    # line 3 and the timed run: level 2 at seed 1, target 8, 35 generations, siteN 160
    lv(2)
    t = page.evaluate(
        """async () => {
          const $ = (id) => document.getElementById(id);
          $("seed").value = "1"; $("useD").checked = true; $("d").disabled = false;
          $("d").value = "8";
          const t0 = performance.now();
          $("run").click();
          while ($("status").textContent === "running…" || $("status").textContent === "press Run")
            await new Promise((r) => setTimeout(r, 50));
          return {
            ms: performance.now() - t0, fate: $("sFate").textContent,
            gens: $("gens").value, siteN: $("siteN").value,
            win: $("levelWin").getAttribute("data-state"), note: $("levelNote").textContent,
            error: $("status").getAttribute("data-error"),
            card4: $("card4").getAttribute("data-state"),
          };
        }"""
    )
    if (t["fate"], t["win"]) != ("one lost", "lost") or "No win from placement alone" not in t["note"]:
        failures.append(f"{name}: M3a level 2 seed 1 target 8 read {t}")
    if (t["gens"], t["siteN"]) != ("35", "160") or t["error"] or t["ms"] >= 60000:
        failures.append(f"{name}: M3a timed run {t['ms']:.0f} ms at {t['gens']}/{t['siteN']} ({t['error']})")
    notes.append(f"L2 s1 t8 {t['fate']} {t['win']}; 35-gen siteN-160 run {t['ms'] / 1000:.1f} s")
    # loading any level opens no card; control: the level-2 run itself opened card 4
    if t["card4"] != "open":
        failures.append(f"{name}: M3a control: level 2 seed 1 target 8 did not open card 4 ({t['card4']})")
    for x in (1, 2, 3, 4, 5, 6):
        r = lv(x)
        if "open" in r["cards"].values():
            failures.append(f"{name}: M3a loading level {x} left a card open {r['cards']}")
    page.close()
    return notes


# ---------------------------------------------------------------- M3b (northstar)
# One assertion per M3b acceptance line (spec section 9, M3b row; brief
# docs/superpowers/briefs/2026-09-23-m3b-options-cards.md), every card state read
# off data-state, founded at target d = 8 (the null tables' protocol). Plus the
# null blocks (seeds 1-5): cards 2 and 3 under a = 1 and under randomMating
# (quantity on the null side AND grey), card 5's flat arm (never open). Every
# run is timed; the slowest is reported against the 60 s budget.
M3B_RUN = """async (s) => {
  const $ = (id) => document.getElementById(id);
  const sel = $("level");
  sel.value = String(s.level);
  sel.dispatchEvent(new Event("change"));
  if (s.loadWidth) $("loadWidthObj").click();
  for (const [id, v] of Object.entries(s.options || {})) {
    if (typeof v === "boolean") $(id).checked = v; else $(id).value = String(v);
  }
  $("seed").value = String(s.seed);
  $("useD").checked = true; $("d").disabled = false; $("d").value = "8";
  $("mode").value = s.random ? "random" : "real";
  $("status").textContent = "running…";
  $("status").removeAttribute("data-error");
  const t0 = performance.now();
  $("run").click();
  while ($("status").textContent === "running…" && performance.now() - t0 < 180000)
    await new Promise((r) => setTimeout(r, 100));
  const cards = {}, text = {};
  for (const c of ["card1", "card2", "card3", "card4", "card5", "card6"]) {
    cards[c] = $(c).getAttribute("data-state");
    text[c] = $(c + "Text").textContent;
  }
  const st = /(\d+) of (\d+) generations recruited nothing/.exec($("sFateBand").textContent);
  return {
    ms: performance.now() - t0, error: $("status").getAttribute("data-error"),
    fate: $("sFate").textContent, stalled: st ? +st[1] : null, cards, text,
    caption: $("fieldCaption").textContent,
  };
}"""


def _gap(t):
    m = re.search(r"peak gap (\S+), mean gap (\S+), lead (-?\d+|none)", t or "")
    return (m.group(1), m.group(2), m.group(3)) if m else None


def _pair(t):
    m = re.search(r"this run (.+?); its flat arm \(q = 0, same rate\) (HELD|one lost|FUSED|BOTH LOST|STALLED)", t or "")
    return (m.group(1), m.group(2)) if m else None


def _diff(t):
    m = re.search(r"treatment minus shuffled (-?\d+\.\d+)", t or "")
    return m.group(1) if m else None


def m3b_checks(browser, name):
    notes = []
    page = browser.new_page()
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto(f"{BASE}/{name}", wait_until="load")
    slowest = [0.0, ""]

    def run(s, tag):
        r = page.evaluate(M3B_RUN, s)
        if r["ms"] > slowest[0]:
            slowest[0], slowest[1] = r["ms"], tag
        if r["error"]:
            failures.append(f"{name}: M3b {tag} errored: {r['error']}")
        return r

    # level 5 seeds 1-5: HELD one lost HELD one lost one lost, no stall, the no-log caption
    exp5 = {1: "HELD", 2: "one lost", 3: "HELD", 4: "one lost", 5: "one lost"}
    got5 = []
    for seed, fate in exp5.items():
        r = run({"level": 5, "seed": seed}, f"L5 s{seed}")
        got5.append(r["fate"])
        if r["fate"] != fate or r["stalled"] != 0 or "bout not drawn" not in r["caption"]:
            failures.append(f"{name}: M3b level 5 seed {seed} read {r['fate']} stalled {r['stalled']} caption {r['caption']!r}")
        if seed == 3:
            sweep_state(page, name, "L5", errs, True)
    notes.append("L5 s1-5 " + "/".join(got5))
    # level 4: q 0.85 seed 8 open; q 1 seed 8 closed; q 0.69 seed 1 closed reversed
    for q, seed, fate, flat, state in ((0.85, 8, "one lost", "HELD", "open"), (1, 8, "one lost", "HELD", "closed"),
                                       (0.69, 1, "HELD", "one lost", "closed")):
        r = run({"level": 4, "seed": seed, "options": {"selfCover": q}}, f"L4 q{q} s{seed}")
        if (r["fate"], _pair(r["text"]["card5"]), r["cards"]["card5"]) != (fate, (fate, flat), state):
            failures.append(f"{name}: M3b level 4 q {q} seed {seed} read {r['fate']} {r['cards']['card5']} {r['text']['card5']!r}")
        notes.append(f"L4 q{q} s{seed} {r['fate']}/{flat} c5 {r['cards']['card5']}")
    # level 3: seed 6 open/open; seed 1 closed; seed 6 random grey by signature
    for seed, rm, fate, gap, state in ((6, False, "FUSED", ("0.633", "0.266", "3"), "open"),
                                       (1, False, "one lost", None, "closed"),
                                       (6, True, "FUSED", ("0.720", "0.507", "0"), "grey")):
        r = run({"level": 3, "seed": seed, "random": rm}, f"L3 s{seed}{' rm' if rm else ''}")
        ok = r["fate"] == fate and r["cards"]["card2"] == state and r["cards"]["card3"] == state
        if gap is not None:
            ok = ok and _gap(r["text"]["card2"]) == gap and _gap(r["text"]["card3"]) == gap
        if not ok:
            failures.append(f"{name}: M3b level 3 seed {seed} rm {rm} read {r['fate']} {r['cards']} {r['text']['card2']!r}")
        notes.append(f"L3 s{seed}{' rm' if rm else ''} {r['fate']} c2/c3 {r['cards']['card2']}/{r['cards']['card3']}")
    # card 6: the width-locus object, seeds 3, 13, 23
    for seed, d, state in ((3, "0.393", "closed"), (13, "0.768", "open"), (23, "-0.006", "closed")):
        r = run({"level": 5, "seed": seed, "loadWidth": True}, f"c6 s{seed}")
        if (_diff(r["text"]["card6"]), r["cards"]["card6"]) != (d, state):
            failures.append(f"{name}: M3b card 6 seed {seed} read {r['cards']['card6']} {r['text']['card6']!r}")
        notes.append(f"c6 s{seed} {_diff(r['text']['card6'])} {r['cards']['card6']}")
    # null blocks, seeds 1-5
    bad = 0
    for seed in range(1, 6):
        r = run({"level": 3, "seed": seed, "options": {"allocExponent": ""}}, f"c23 a=1 s{seed}")
        g = _gap(r["text"]["card2"])
        if not g or float(g[0]) >= 0.434 or float(g[1]) >= 0.170 or r["cards"]["card2"] != "grey" or r["cards"]["card3"] != "grey":
            failures.append(f"{name}: M3b card 2/3 a=1 null seed {seed} read {g} {r['cards']}"); bad += 1
        r = run({"level": 3, "seed": seed, "random": True}, f"c23 rm s{seed}")
        g = _gap(r["text"]["card2"])
        if not g or (g[2] != "none" and int(g[2]) > 1) or r["cards"]["card2"] != "grey" or r["cards"]["card3"] != "grey":
            failures.append(f"{name}: M3b card 2/3 random-mating null seed {seed} read {g} {r['cards']}"); bad += 1
        r = run({"level": 4, "seed": seed, "options": {"selfCover": 0}}, f"c5 flat s{seed}")
        if r["cards"]["card5"] == "open":
            failures.append(f"{name}: M3b card 5 flat null seed {seed} opened: {r['text']['card5']!r}"); bad += 1
    notes.append(f"null blocks bad {bad}/15")
    if slowest[0] >= 60000:
        failures.append(f"{name}: M3b slowest run {slowest[1]} took {slowest[0]:.0f} ms (budget 60 s)")
    notes.append(f"slowest run {slowest[1]} {slowest[0] / 1000:.1f} s")
    page.close()
    return notes


# ------------------------------------------------------ state sweep (Task 7 Step 1)
# Level 1 on load (no run), levels 2-6 at seed 3 after #run, and the stall fixture
# (tests/sandbox-heat.test.js: free sandbox, seed 1, n 30, gens 35, siteN 160,
# useD off, both lineages E.randomGenome(E.makeRng(4)) with antherT 0.825 - M2's
# `run({**LEVEL, "lineages": 0.825})`). In every state #heat, #bodyMap, #thumb1
# and #thumb2 each carry > 2% ink (THUMB_INK: the share of backing pixels off the
# canvas's top-left corner pixel by > 24 in a channel; a distinct-colour count
# saturates on anti-aliasing), and the page has raised zero errors. After each run:
# #sFate == Sandbox.result().fate == the fate in the heat's drawn "final: <fate>"
# label, recorded by the Task 5b fillText wrapper around one heat redraw (#scrub
# 0 -> 1); that redraw must also change #heat's pixels - a heat left showing the
# example (clearResult draws it before every run) keeps its ink, so ink alone
# cannot see a heat that was never drawn for the run. Positive control: a final
# label was recorded. The stall fixture is measured on M2's page after M2's own
# stall run, level 5 seed 3 on M3b's page after its own run: not run twice.
SWEEP_INK = ("heat", "bodyMap", "thumb1", "thumb2")
SWEEP_ORDER = ("L1", "L2", "L3", "L4", "L5", "L6", "stall")
sweep_notes = {}
SWEEP_LEVEL = """async (s) => {
  const $ = (id) => document.getElementById(id);
  const sel = $("level");
  sel.value = String(s.level);
  sel.dispatchEvent(new Event("change"));
  if (!s.run) return { error: null, status: $("status").textContent };
  $("seed").value = String(s.seed);
  $("status").textContent = "running…";
  $("status").removeAttribute("data-error");
  $("run").click();
  const t0 = performance.now();
  while ($("status").textContent === "running…" && performance.now() - t0 < 180000)
    await new Promise((r) => setTimeout(r, 100));
  return { error: $("status").getAttribute("data-error"), status: $("status").textContent };
}"""
SWEEP_FATE = """() => [document.getElementById('sFate').textContent,
  window.Sandbox.result() ? window.Sandbox.result().fate : null]"""


def sweep_state(page, name, tag, pageerrors, ran):
    at = f"{name}: sweep {tag}"
    ink = {c: page.evaluate(THUMB_INK, c) for c in SWEEP_INK}
    for c, f in ink.items():
        if not f > 0.02:
            failures.append(f"{at}: #{c} ink {f:.2%} (need > 2%)")
    note = " ".join(f"{c} {f:.1%}" for c, f in ink.items())
    if ran:
        s0 = page.evaluate(CANVAS_SIG, "heat")
        page.evaluate(HEAT_REC_ON)
        page.evaluate(SET_INPUT, ["scrub", 1])
        rec = page.evaluate(HEAT_REC_OFF)["rec"]
        s1 = page.evaluate(CANVAS_SIG, "heat")
        page.evaluate(SET_INPUT, ["scrub", 0])
        fin = [t["text"] for t in rec if t["text"].startswith("final")]
        drawn = fin[-1][len("final: "):] if fin and fin[-1].startswith("final: ") else None
        shown, model = page.evaluate(SWEEP_FATE)
        if not fin:
            failures.append(f"{at}: control - no 'final' label recorded on a heat redraw (got {[t['text'] for t in rec][:6]})")
        if s0 == s1:
            failures.append(f"{at}: #heat unchanged when #scrub moved 0 -> 1 - the heat is not drawn for the run")
        if not (shown == model == drawn and model):
            failures.append(f"{at}: fate disagrees - #sFate {shown!r}, Sandbox.result().fate {model!r}, heat label {fin[-1] if fin else None!r}")
        note += f", fate {shown}/{model}/{drawn}, heat {'follows' if s0 != s1 else 'STATIC'} on scrub"
    if pageerrors:
        failures.append(f"{at}: {len(pageerrors)} page error(s): {pageerrors[:2]}")
    sweep_notes[tag] = f"{tag} {note}, pageerrors {len(pageerrors)}"


def sweep_checks(browser, name):
    """Level 1 loaded, levels 2, 3, 4 and 6 at seed 3 run, on one page."""
    page = browser.new_page()
    page.set_viewport_size({"width": 1400, "height": 900})
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto(f"{BASE}/{name}", wait_until="load")
    for lv in (1, 2, 3, 4, 6):
        r = page.evaluate(SWEEP_LEVEL, {"level": lv, "seed": 3, "run": lv != 1})
        if r["error"]:
            failures.append(f"{name}: sweep L{lv} run errored: {r['error']}")
        sweep_state(page, name, f"L{lv}", errs, lv != 1)
    page.close()
    return "sweep " + "; ".join(sweep_notes.get(t, f"{t} NOT MEASURED") for t in SWEEP_ORDER)


with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, mode in SPEC:
        page = browser.new_page()
        if mode == "click":
            page.set_viewport_size({"width": 1400, "height": 900})
        errors, pageerrors = [], []
        page.on(
            "console",
            lambda m: (
                errors.append(f"{m.type}: {m.text}") if m.type == "error" else None
            ),
        )
        page.on("pageerror", lambda e: pageerrors.append(str(e)))

        resp = page.goto(f"{BASE}/{name}", wait_until="load")
        status = resp.status if resp else None
        if status != 200:
            failures.append(f"{name}: HTTP {status}")

        n, changed, uniform = sample(page, 1200, 1800)
        note = ""

        if mode == "links":
            if n:
                failures.append(f"{name}: expected no canvas, found {n}")
            hrefs = page.evaluate(
                """() => Array.from(document.querySelectorAll('a[href]'))
                     .map(a => a.getAttribute('href')).filter(h => !/^https?:/.test(h))"""
            )
            for h in hrefs:
                try:
                    with urllib.request.urlopen(f"{BASE}/{h}", timeout=10) as r:
                        code = r.status
                except Exception as e:  # noqa: BLE001
                    code = f"ERR {e}"
                if code != 200:
                    failures.append(f"index.html link '{h}' -> {code}")
                report.append(f"    link {h:<18} -> {code}")
            # Every <img> must actually decode: the tiles are lazy, so bring each
            # into view, wait for it to settle, then require naturalWidth > 0.
            # Positive control: the page must carry at least one <img>, else an
            # empty page would pass.
            page.evaluate(
                """() => document.querySelectorAll('img').forEach(i => i.scrollIntoView())"""
            )
            try:
                page.wait_for_function(
                    "() => Array.from(document.images).every(i => i.complete)", timeout=15000
                )
            except Exception:  # noqa: BLE001
                failures.append(f"{name}: an <img> never finished loading within 15 s")
            imgs = page.evaluate(
                """() => Array.from(document.images).map(i => [i.getAttribute('src'), i.naturalWidth])"""
            )
            if not imgs:
                failures.append(f"{name}: expected <img> tiles, found none")
            for src, w in imgs:
                if not w > 0:
                    failures.append(f"{name}: <img src='{src}'> did not load (naturalWidth {w})")
                report.append(f"    img  {src:<24} naturalWidth {w}")
            note = f"{len(hrefs)} same-origin links checked, {len(imgs)} img checked"

        elif mode == "autoplay":
            if uniform:
                failures.append(f"{name}: {uniform} canvas with <=1 distinct colour")
            if n == 0 or changed == 0:
                failures.append(
                    f"{name}: expected autoplay, {n} canvas, {changed} animating"
                )
            note = f"animating on load {changed}/{n}"

        elif mode == "static":
            if uniform:
                failures.append(
                    f"{name}: {uniform} canvas with <=1 distinct colour - static page drew nothing"
                )
            if n == 0:
                failures.append(f"{name}: expected a rendered canvas, found none")
            note = f"static by design, {n} canvas rendered non-blank"

        elif mode == "click":
            # sandbox.html's real contract, read off the page (lines 1060-1088):
            # #run disables itself, computes the generations, and ON COMPLETION
            # enables #scrub and #play. So Run DRAWS ONCE; Play animates the
            # playback. Asserting "animates after Run" was wrong; the right
            # assertions are that the computation ran, drew, and armed playback.
            # sandbox.html legitimately shows an EMPTY plot area before #run, so a
            # uniform canvas on load is CORRECT here and is deliberately not
            # asserted against (except #heat, which shows the labelled example:
            # heat_load_checks). What must hold is that #run then draws.
            pass
            if changed:
                failures.append(f"{name}: animated BEFORE #run was clicked ({changed})")
            fs_note = first_screen_checks(page, name, failures)

            # M1 acceptance, asserted in a REAL browser before anything is clicked:
            # eight sliders per lineage whose min/max come from Evolve.GENE_BOUNDS
            # (never retyped - antherTheta has no GENE_BOUNDS row and wraps to
            # [-pi, pi]), and the realised separation with level 1's target beside
            # it. tests/sandbox-m1.test.js asserts the same things in a fake DOM;
            # this is the real-execution control on that fixture.
            m1 = page.evaluate(
                """() => {
                  const B = window.Evolve.GENE_BOUNDS;
                  const keys = Object.keys(B).concat(["antherTheta"]);
                  const bad = [];
                  let n = 0;
                  for (const li of [1, 2]) for (const k of keys) {
                    const el = document.getElementById(`g${li}_${k}`);
                    if (!el) { bad.push(`missing g${li}_${k}`); continue; }
                    n++;
                    const lo = k === "antherTheta" ? -Math.PI : B[k][0];
                    const hi = k === "antherTheta" ?  Math.PI : B[k][1];
                    if (+el.min !== lo || +el.max !== hi)
                      bad.push(`g${li}_${k} range ${el.min}..${el.max}`);
                  }
                  const sep = document.getElementById("sReal");
                  const tgt = document.getElementById("sTarget");
                  return {
                    n, bad,
                    sep: sep ? sep.textContent : null,
                    target: tgt ? tgt.textContent : null,
                  };
                }"""
            )
            if m1["n"] != 16 or m1["bad"]:
                failures.append(
                    f"{name}: M1 sliders - {m1['n']}/16 present, problems {m1['bad'][:4]}"
                )
            if not m1["sep"] or not re.match(r"^\d+\.\d+$", m1["sep"]):
                failures.append(
                    f"{name}: no realised separation at load (read {m1['sep']!r})"
                )
            if not m1["target"] or "reach 8" not in m1["target"]:
                failures.append(
                    f"{name}: level 1's target does not read beside the separation "
                    f"at load (read {m1['target']!r})"
                )

            thumb_note = thumb_checks(page, name, failures)
            label_note = heat_label_checks(page, name, failures, True)
            pre = page.evaluate(SHOT)
            heat_base, heat_load = heat_load_checks(page, name, failures)
            page.click("#run")
            try:
                page.wait_for_selector("#play:not([disabled])", timeout=60000)
                completed = True
            except Exception:
                completed = False
                failures.append(f"{name}: #run never enabled #play within 60s - the run did not complete")
            post = page.evaluate(SHOT)
            drew = sum(1 for a, b in zip(pre, post) if a != b)
            if completed and drew == 0:
                failures.append(f"{name}: #run completed but the canvas never changed - nothing was drawn")
            heat_note = "heat not checked (run incomplete)"
            view_note = "run views not checked (run incomplete)"
            if completed:
                heat_note = heat_checks(page, name, failures, heat_base, heat_load)
                heat_note += ", " + heat_label_checks(page, name, failures, False)
                view_note = run_view_checks(page, name, failures)
            n3, changed3, _ = (0, 0, 0)
            if completed:
                page.click("#play")
                n3, changed3, _ = sample(page, 600, 2200)
                if changed3 == 0:
                    failures.append(f"{name}: clicked #play and NOTHING animated - playback does not run")
            note = (f"{fs_note}, idle on load {changed}/{n}, #run drew {drew}/{len(post)} canvas, "
                    f"{heat_note}, {label_note}, {thumb_note}, {view_note}, #play animating {changed3}/{n3}")
            m2_notes = m2_checks(browser, name)
            note += "; M2 " + ", ".join(m2_notes)
            note += "; M3a " + ", ".join(m3a_checks(browser, name))
            note += "; M3b " + ", ".join(m3b_checks(browser, name))
            note += "; " + heat_dpr_checks(browser, name, failures)
            note += "; " + sweep_checks(browser, name)

        if errors:
            failures.append(f"{name}: {len(errors)} console error(s): {errors[:3]}")
        if pageerrors:
            failures.append(
                f"{name}: {len(pageerrors)} uncaught exception(s): {pageerrors[:3]}"
            )

        report.append(
            f"  {name:<18} HTTP {status}  console-err {len(errors)}  uncaught {len(pageerrors)}  [{mode}] {note}"
        )
        page.close()
    browser.close()

httpd.shutdown()

print("=== smoke results ===")
print("\n".join(report))
print()
if failures:
    print(f"*** {len(failures)} FAILURE(S) ***")
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("all entry points: HTTP 200, zero console errors, zero uncaught exceptions.")
print("visit canvases carry >1 distinct colour; sandbox.html's #heat shows the")
print("labelled example before #run (> 5x the placeholder's opaque pixels); what")
print("is asserted after that is that #run draws and #play then animates.")
