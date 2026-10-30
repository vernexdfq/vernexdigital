#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const dir = __dirname;
const parts = [];
for (let i = 0; i < 10; i++) {
  const f = path.join(dir, "restore-boost-child.b64." + i);
  if (!fs.existsSync(f)) break;
  parts.push(fs.readFileSync(f, "utf8").trim());
}
if (!parts.length) {
  console.error("missing restore parts");
  process.exit(1);
}
const code = Buffer.from(parts.join(""), "base64").toString("utf8");
const target = path.join(dir, "restore-boost-child.cjs");
fs.writeFileSync(target, code);
require(target);
