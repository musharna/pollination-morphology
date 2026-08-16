/*
 * A minimal RGB raster + PNG writer, so geometry can be rendered and LOOKED AT
 * without a browser. Node's zlib is the only dependency.
 *
 * ⚠️ This exists because two renderers shipped unseen. Tests could check the
 * data was sane; nothing could check the picture was.
 */
const zlib = require("zlib");
const fs = require("fs");

function raster(w, h, bg = [16, 18, 22]) {
  const buf = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    buf[i * 3] = bg[0];
    buf[i * 3 + 1] = bg[1];
    buf[i * 3 + 2] = bg[2];
  }
  return { w, h, buf };
}

const hex = (c) => {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

function px(r, x, y, col) {
  if (x < 0 || y < 0 || x >= r.w || y >= r.h) return;
  const i = (y * r.w + x) * 3;
  r.buf[i] = col[0];
  r.buf[i + 1] = col[1];
  r.buf[i + 2] = col[2];
}

/* even-odd point-in-polygon; quads here are small so the bbox scan is cheap */
function fillPoly(r, pts, col) {
  let x0 = Infinity,
    x1 = -Infinity,
    y0 = Infinity,
    y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  x0 = Math.max(0, Math.floor(x0));
  x1 = Math.min(r.w - 1, Math.ceil(x1));
  y0 = Math.max(0, Math.floor(y0));
  y1 = Math.min(r.h - 1, Math.ceil(y1));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i],
          [xj, yj] = pts[j];
        if (
          yi > y + 0.5 !== yj > y + 0.5 &&
          x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi
        )
          inside = !inside;
      }
      if (inside) px(r, x, y, col);
    }
  }
}

function fillCircle(r, cx, cy, rad, col) {
  const x0 = Math.max(0, Math.floor(cx - rad)),
    x1 = Math.min(r.w - 1, Math.ceil(cx + rad));
  const y0 = Math.max(0, Math.floor(cy - rad)),
    y1 = Math.min(r.h - 1, Math.ceil(cy + rad));
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= rad * rad)
        px(r, x, y, col);
}

const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return (b) => {
    let c = -1;
    for (let i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 255] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(CRC(td));
  return Buffer.concat([len, td, crc]);
}

function writePng(r, file) {
  const raw = Buffer.alloc(r.h * (r.w * 3 + 1));
  for (let y = 0; y < r.h; y++) {
    raw[y * (r.w * 3 + 1)] = 0; // filter: none
    r.buf.copy(raw, y * (r.w * 3 + 1) + 1, y * r.w * 3, (y + 1) * r.w * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(r.w, 0);
  ihdr.writeUInt32BE(r.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  fs.writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", ihdr),
      chunk("IDAT", zlib.deflateSync(raw)),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}

module.exports = { raster, hex, fillPoly, fillCircle, writePng };
