#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const dir = __dirname;
const parts = [];
for (let i = 0; i < 10; i++) {
  const f = path.join(dir, `airtime-page.b64.${i}`);
  if (!fs.existsSync(f)) break;
  parts.push(fs.readFileSync(f, "utf8").trim());
}
if (!parts.length) {
  console.error("[restore-airtime-live] no b64 parts");
  process.exit(1);
}
const file = path.join(__dirname, "..", "src", "app", "services", "airtime", "page.tsx");
fs.mkdirSync(path.dirname(file), { recursive: true });
const body = Buffer.from(parts.join(""), "base64").toString("utf8");
if (!body.includes("submitLivePurchase")) {
  console.error("[restore-airtime-live] decoded page missing live submit");
  process.exit(1);
}
fs.writeFileSync(file, body);
console.log("[restore-airtime-live] wrote", file, body.length, "bytes");
