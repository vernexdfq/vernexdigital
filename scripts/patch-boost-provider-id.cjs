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
const old = `    const order = (data.order as Record<string, unknown>) || {};
    const providerOrderId = String(
      order.ref || order.providerOrderId || order.id || data.order || "",
    );`;
const neu = `    const order = (data.order as Record<string, unknown>) || {};
    // Prefer numeric JAP id only — never child ref like boost-xxx
    const candidates = [
      order.providerOrderId,
      order.orderId,
      order.id,
      order.order,
      data.providerOrderId,
    ];
    let providerOrderId = "";
    for (const c of candidates) {
      const s = String(c ?? "").trim();
      if (/^\\d{6,}$/.test(s)) {
        providerOrderId = s;
        break;
      }
    }
    if (!providerOrderId) {
      providerOrderId = String(order.providerOrderId || order.id || "").trim();
    }`;
if (!s.includes(old)) {
  console.warn("[patch-boost-provider-id] pattern not found");
  process.exit(0);
}
s = s.replace(old, neu);
fs.writeFileSync(file, s);
console.log("[patch-boost-provider-id] applied");
