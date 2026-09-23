/*
 * A DOM small enough to run population.html's inline script, and no smaller.
 *
 * ⚠️ WHY THIS EXISTS. M1's acceptance is about what the PAGE does at load —
 * eight sliders per lineage whose min/max come from Evolve.GENE_BOUNDS, and the
 * level-1 target printed beside the realised separation before anything is
 * clicked. Those are DOM facts. A regex over the HTML cannot see them, because
 * the sliders are built in JS precisely so the bounds are never retyped: a test
 * that greps the source would pass on a page that built no sliders at all.
 *
 * So this is not a browser. It is: getElementById over the ids in the page
 * source plus anything the script creates, attributes, values, and a canvas
 * context that discards everything. If the page ever needs layout, measurement
 * or events beyond oninput/onchange/onclick, use a real browser (tools/smoke-site.py)
 * rather than growing this.
 */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function noopContext() {
  /* every 2d-context call is a no-op; property writes are kept so nothing throws */
  const store = {};
  return new Proxy(store, {
    get(t, k) {
      if (k in t) return t[k];
      return () => {};
    },
    set(t, k, v) {
      t[k] = v;
      return true;
    },
  });
}

class FakeElement {
  constructor(doc, tag, attrs = {}) {
    this._doc = doc;
    this.tagName = tag.toUpperCase();
    this.attrs = { ...attrs };
    this.children = [];
    this.style = {};
    this._text = "";
    this._id = attrs.id || "";
    if (this._id) doc.byId.set(this._id, this);
    doc.all.push(this);
    if ("value" in attrs) this._value = attrs.value;
    this.checked = "checked" in attrs;
    this.disabled = "disabled" in attrs;
  }
  get id() {
    return this._id;
  }
  set id(v) {
    this._id = v;
    this.attrs.id = v;
    this._doc.byId.set(v, this);
  }
  get value() {
    return this._value === undefined ? "" : this._value;
  }
  set value(v) {
    this._value = String(v);
  }
  get type() {
    return this.attrs.type || "";
  }
  set type(v) {
    this.attrs.type = v;
  }
  get className() {
    return this.attrs.class || "";
  }
  set className(v) {
    this.attrs.class = v;
  }
  setAttribute(k, v) {
    this.attrs[k] = String(v);
    if (k === "id") this.id = String(v);
    if (k === "value") this._value = String(v);
    if (k === "disabled") this.disabled = true;
  }
  getAttribute(k) {
    return k in this.attrs ? this.attrs[k] : null;
  }
  removeAttribute(k) {
    delete this.attrs[k];
  }
  hasAttribute(k) {
    return k in this.attrs;
  }
  appendChild(c) {
    this.children.push(c);
    return c;
  }
  get textContent() {
    return this._text;
  }
  set textContent(v) {
    this._text = String(v);
    this.children = [];
  }
  get innerHTML() {
    return this._html || "";
  }
  set innerHTML(v) {
    this._html = String(v);
    this.children = [];
  }
  set innerText(v) {
    this.textContent = v;
  }
  getContext() {
    if (!this._ctx) this._ctx = noopContext();
    return this._ctx;
  }
  addEventListener() {}
  removeEventListener() {}
  focus() {}
  setPointerCapture() {}
  /* every descendant, self included — the page has no deep tree to speak of */
  descendants() {
    const out = [];
    const walk = (e) => {
      for (const c of e.children) {
        out.push(c);
        walk(c);
      }
    };
    walk(this);
    return out;
  }
}

/*
 * The page source, as stub elements. Only elements carrying an id are made:
 * the script reaches the DOM exclusively through getElementById, so an element
 * without one is unreachable and a stub for it would be decoration.
 */
function parseIds(html) {
  const out = [];
  const re = /<([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const [, tag, raw] = m;
    const attrs = {};
    const ar = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*"([^"]*)")?/g;
    let a;
    while ((a = ar.exec(raw))) {
      if (!a[1]) continue;
      attrs[a[1]] = a[2] === undefined ? "" : a[2];
    }
    if (attrs.id) out.push({ tag, attrs });
  }
  return out;
}

function makeDocument(html) {
  const doc = {
    byId: new Map(),
    all: [],
    getElementById(id) {
      return doc.byId.get(id) || null;
    },
    createElement(tag) {
      return new FakeElement(doc, tag);
    },
    body: null,
    documentElement: null,
    addEventListener() {},
  };
  for (const { tag, attrs } of parseIds(html)) new FakeElement(doc, tag, attrs);
  doc.body = new FakeElement(doc, "body");
  doc.documentElement = new FakeElement(doc, "html");
  return doc;
}

function inlineScripts(html) {
  return [
    ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
  ].map((m) => m[1]);
}

function scriptSrcs(html) {
  return [...html.matchAll(/<script[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(
    (m) => m[1],
  );
}

/*
 * Load a page the way a browser would: the <script src> files in order, then
 * the inline script — all in ONE context with require and module ABSENT, which
 * is the actual browser condition and the reason the bundle test exists.
 *
 * `root` is the directory the src paths resolve against, so the same loader can
 * be pointed at the repo tree or at the built site/ artifact.
 */
function loadPage(pageFile, { root = ROOT, runInline = true } = {}) {
  const html = fs.readFileSync(pageFile, "utf8");
  const document = makeDocument(html);
  const win = {};
  const timers = [];
  Object.assign(win, {
    document,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    performance: { now: () => 0 },
    setTimeout: (fn) => {
      timers.push(fn);
      return timers.length;
    },
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    devicePixelRatio: 1,
  });
  win.window = win;
  const ctx = vm.createContext({
    window: win,
    document,
    console,
    Math,
    JSON,
    Date,
    Number,
    String,
    Array,
    Object,
    Infinity,
    NaN,
    isFinite,
    isNaN,
    matchMedia: win.matchMedia,
    performance: win.performance,
    requestAnimationFrame: win.requestAnimationFrame,
    cancelAnimationFrame: win.cancelAnimationFrame,
    setTimeout: win.setTimeout,
    clearTimeout: win.clearTimeout,
    setInterval: win.setInterval,
    clearInterval: win.clearInterval,
  });
  const loaded = [];
  for (const src of scriptSrcs(html)) {
    const f = path.join(root, src);
    vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: src });
    loaded.push(src);
  }
  if (runInline)
    for (const [i, src] of inlineScripts(html).entries())
      vm.runInContext(src, ctx, {
        filename: `${path.basename(pageFile)}#${i}`,
      });
  return { win, document, ctx, loaded, html, timers };
}

module.exports = { loadPage, makeDocument, FakeElement, scriptSrcs };
