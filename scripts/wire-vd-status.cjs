#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const page = path.join(__dirname, '..', 'src', 'app', 'services', 'boost', 'page.tsx');
if (!fs.existsSync(page)) {
  console.error('[wire-vd-status] page missing');
  process.exit(1);
}
let text = fs.readFileSync(page, 'utf8');

const oldNorm = `function normalizeStatus(raw: string): OrderStatus {
  const s = String(raw || "").toLowerCase();
  if (["completed", "success", "done"].includes(s)) return "completed";
  if (s === "in_progress") return "in_progress";
  if (["processing", "queued", "running"].includes(s)) return "processing";
  if (["failed", "cancelled", "canceled", "refunded"].includes(s)) return "failed";
  return "pending";
}`;

const newNorm = `function normalizeStatus(raw: string): OrderStatus {
  const s = String(raw || "").toLowerCase().replace(/[_-]+/g, " ").trim();
  if (s.includes("complete") || s.includes("success") || s === "done") return "completed";
  if (s.includes("fail") || s.includes("cancel") || s.includes("refund")) return "failed";
  if (s.includes("progress") || s.includes("processing") || s.includes("partial") || s.includes("running") || s.includes("queued")) return "processing";
  if (s === "pending" || !s) return "pending";
  return "pending";
}`;

if (text.includes(oldNorm)) {
  text = text.replace(oldNorm, newNorm);
  console.log('[wire-vd-status] normalizeStatus fixed');
} else if (text.includes('s.includes("progress")')) {
  console.log('[wire-vd-status] normalizeStatus already fixed');
} else {
  console.warn('[wire-vd-status] normalizeStatus pattern not found');
}

const oldLabel = `function statusLabel(s: OrderStatus) { return s === "in_progress" ? "In progress" : s[0].toUpperCase() + s.slice(1); }`;
const newLabel = `function statusLabel(s: OrderStatus) {
  if (s === "in_progress" || s === "processing") return "In progress";
  if (s === "completed") return "Completed";
  if (s === "pending") return "Pending";
  if (s === "failed") return "Failed";
  return s[0].toUpperCase() + s.slice(1);
}`;
if (text.includes(oldLabel)) {
  text = text.replace(oldLabel, newLabel);
  console.log('[wire-vd-status] statusLabel fixed');
}

const oldFx = 'useEffect(() => { void loadCatalog(); void loadOrders(); }, []);';
const newFx = `useEffect(() => {
    void loadCatalog();
    void loadOrders();
    const id = window.setInterval(() => { void loadOrders(); }, 20000);
    return () => window.clearInterval(id);
  }, []);`;
if (text.includes(oldFx)) {
  text = text.replace(oldFx, newFx);
  console.log('[wire-vd-status] auto-refresh added');
} else if (text.includes('setInterval(() => { void loadOrders(); }')) {
  console.log('[wire-vd-status] auto-refresh already present');
}

fs.writeFileSync(page, text);
console.log('[wire-vd-status] done (' + text.length + ' bytes)');
