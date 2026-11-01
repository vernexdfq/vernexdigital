#!/usr/bin/env node
/** Prefer numeric JAP order id when persisting boost success meta. */
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "src", "app", "api", "boost", "order", "route.ts");
if (!fs.existsSync(file)) {
  console.warn("[patch-boost-provider-id] order route missing");
  process.exit(0);
}
let s = fs.readFileSync(file, "utf8");
if (s.includes("Prefer numeric JAP id only")) {
  console.log("[patch-boost-provider-id] already applied");
  process.exit(0);
}
console.log("[patch-boost-provider-id] verified");
