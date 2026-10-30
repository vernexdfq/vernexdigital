#!/usr/bin/env node
/**
 * Build-time: wire boost page to live /api/boost/catalog + /api/boost/order.
 * Preserves UI; removes hard-coded PLATFORMS/SERVICES.
 */
const fs = require("fs");
const path = require("path");

const target = path.join(__dirname, "..", "src", "app", "services", "boost", "page.tsx");
if (!fs.existsSync(target)) {
  console.error("[apply-boost] page not found");
  process.exit(1);
}
let t = fs.readFileSync(target, "utf8");

if (t.includes("/api/boost/catalog") && t.includes("/api/boost/order") && t.includes("allServices")) {
  console.log("[apply-boost] already live");
  process.exit(0);
}

if (!t.includes("useEffect")) {
  t = t.replace(
    'import { useMemo, useState } from "react";',
    'import { useEffect, useMemo, useState } from "react";',
  );
}
if (!t.includes("createBrowserClient")) {
  t = t.replace(
    'import Link from "next/link";',
    'import Link from "next/link";\nimport { createBrowserClient } from "@/lib/supabase/client";',
  );
}

t = t.replace(/const PLATFORMS: Platform\[\] = \[[\s\S]*?\];/, "const PLATFORMS: Platform[] = [];");
t = t.replace(/const SERVICES: Service\[\] = \[[\s\S]*?\];/, "const SERVICES: Service[] = [];");

if (!t.includes("wholesaleUsd?")) {
  t = t.replace(
    "ratePer1000: number;\n  min: number;",
    "ratePer1000: number;\n  partnerRatePer1000?: number;\n  wholesaleUsd?: number;\n  min: number;",
  );
}

if (!t.includes("allServices")) {
  t = t.replace(
    "const { wallet } = useUser();\n  const balance = wallet.balance;",
    `const { wallet, refresh: refreshUser } = useUser();\n  const balance = wallet.balance;\n\n  const [platforms, setPlatforms] = useState(PLATFORMS);\n  const [allServices, setAllServices] = useState(SERVICES);\n  const [catalogLoading, setCatalogLoading] = useState(true);\n  const [catalogError, setCatalogError] = useState("");\n  const [ordering, setOrdering] = useState(false);\n  const [orderError, setOrderError] = useState("");`,
  );
}

if (!t.includes("/api/boost/catalog")) {
  const marker = 'const [sSearch, setSSearch] = useState("");';
  const effect = `const [sSearch, setSSearch] = useState("");\n\n  useEffect(() => {\n    let cancelled = false;\n    (async () => {\n      setCatalogLoading(true);\n      setCatalogError("");\n      try {\n        const res = await fetch("/api/boost/catalog", { cache: "no-store" });\n        const data = await res.json();\n        if (!res.ok || data.ok === false) throw new Error(data.error || "Failed to load services");\n        if (cancelled) return;\n        setPlatforms((data.platforms || []).map((p) => ({\n          id: p.id,\n          name: p.name,\n          color: p.color || p.brandColor || "#0F172A",\n          initial: p.initial || String(p.name || "").slice(0, 2).toUpperCase(),\n          placeholder: p.placeholder,\n          linkHint: p.linkHint,\n          totalServices: p.totalServices,\n        })));\n        setAllServices((data.services || []).map((s) => ({\n          id: String(s.id),\n          providerId: Number(s.providerId) || Number(s.id) || 0,\n          categoryId: String(s.categoryId || s.platform || ""),\n          group: String(s.group || s.categoryName || "Services"),\n          name: String(s.name || s.title || "Service"),\n          ratePer1000: Number(s.ratePer1000) || 0,\n          partnerRatePer1000: s.partnerRatePer1000,\n          wholesaleUsd: s.wholesaleUsd,\n          min: Number(s.min) || 1,\n          max: Number(s.max) || 1000000,\n          speed: String(s.speed || ""),\n        })));\n      } catch (e) {\n        if (!cancelled) setCatalogError(e instanceof Error ? e.message : "Catalog error");\n      } finally {\n        if (!cancelled) setCatalogLoading(false);\n      }\n    })();\n    return () => { cancelled = true; };\n  }, []);`;
  if (!t.includes(marker)) {
    console.error("[apply-boost] sSearch marker missing");
    process.exit(1);
  }
  t = t.replace(marker, effect);
}

t = t.replace(/PLATFORMS\.find/g, "platforms.find");
t = t.replace(/SERVICES\.find/g, "allServices.find");
t = t.replace(/SERVICES\.filter/g, "allServices.filter");
t = t.replace(
  /return q \? platforms\.filter\(\(p\) => p\.name\.toLowerCase\(\)\.includes\(q\)\) : PLATFORMS;/,
  "return q ? platforms.filter((p) => p.name.toLowerCase().includes(q)) : platforms;",
);
t = t.replace(
  /const list = allServices\.filter\(\(s\) => s\.categoryId === platformId\);/,
  "const list = allServices.filter((s) => s.categoryId === platformId);",
);

const mockPlace = /function placeOrder\(\) \{\s*if \(!canOrder \|\| !service\) return;\s*setPlaced\(\(prev\) => \[[\s\S]*?\.\.\.prev,\s*\]\);\s*setLink\(""\);\s*setQty\(""\);\s*\}/;
if (mockPlace.test(t)) {
  t = t.replace(
    mockPlace,
    `async function placeOrder() {\n    if (!canOrder || !service) return;\n    setOrdering(true);\n    setOrderError("");\n    try {\n      const supabase = createBrowserClient();\n      const { data: sess } = await supabase.auth.getSession();\n      const token = sess.session?.access_token;\n      if (!token) throw new Error("Sign in to place an order");\n      const res = await fetch("/api/boost/order", {\n        method: "POST",\n        headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` },\n        body: JSON.stringify({\n          serviceId: service.id,\n          link: link.trim(),\n          quantity,\n          wholesaleUsd: service.wholesaleUsd,\n          ratePer1000: service.ratePer1000,\n        }),\n      });\n      const data = await res.json().catch(() => ({}));\n      if (!res.ok || data.ok === false) throw new Error(data.error || "Order failed");\n      const ord = data.order || {};\n      setPlaced((prev) => [\n        {\n          id: String(ord.providerOrderId || ord.id || Date.now()),\n          service: service.name,\n          speed: service.speed,\n          qty: quantity,\n          total: Number(ord.amount) || total,\n          status: String(ord.status || "processing"),\n          link: link.trim(),\n        },\n        ...prev,\n      ]);\n      setLink("");\n      setQty("");\n      try { await refreshUser(); } catch { /* optional */ }\n    } catch (e) {\n      setOrderError(e instanceof Error ? e.message : "Order failed");\n    } finally {\n      setOrdering(false);\n    }\n  }`,
  );
}

t = t.replace(
  "const canOrder = !!service && link.trim().length > 5 && quantity > 0 && inRange && !insufficient;",
  "const canOrder = !!service && link.trim().length > 5 && quantity > 0 && inRange && !insufficient && !ordering;",
);

if (t.indexOf("{catalogLoading") < 0) {
  const tipEnd = t.indexOf("Quick Tip:");
  if (tipEnd > 0) {
    const close = t.indexOf("</div>", tipEnd);
    if (close > 0) {
      const insert = close + 6;
      t =
        t.slice(0, insert) +
        `\n        {catalogLoading && <p className="text-center text-[13px] text-slate-500">Loading live services…</p>}\n        {catalogError && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{catalogError}</p>}\n        {orderError && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{orderError}</p>}` +
        t.slice(insert);
    }
  }
}

t = t.replace(/Place Order(\s*<\/button>)/, '{ordering ? "Placing…" : "Place Order"}$1');

fs.writeFileSync(target, t);
console.log("[apply-boost] wired live catalog+order,", t.length, "bytes");
