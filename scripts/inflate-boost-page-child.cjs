#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const dir = __dirname;
const parts = [];
for (let i = 0; i < 20; i++) {
  const f = path.join(dir, "boost-page.b64." + i);
  if (!fs.existsSync(f)) break;
  parts.push(fs.readFileSync(f, "utf8").trim());
}
if (!parts.length) {
  console.error("[boost-page] missing parts");
  process.exit(1);
}
const text = zlib.gunzipSync(Buffer.from(parts.join(""), "base64")).toString("utf8");
if (!text.includes("/api/boost/catalog") || !text.includes("/api/boost/order")) {
  console.error("[boost-page] markers missing");
  process.exit(1);
}
const target = path.join(dir, "..", "src", "app", "services", "boost", "page.tsx");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, text);
console.log("[boost-page] restored", text.length, "bytes");
