#!/usr/bin/env node
/**
 * Build-time: wire boost page to live /api/boost/catalog + /api/boost/order.
 */
const fs = require("fs");
const path = require("path");

const target = path.join(__dirname, "..", "src", "app", "services", "boost", "page.tsx");
if (!fs.existsSync(target)) {
  console.error("[apply-boost] page not found");
  process.exit(1);
}
let t = fs.readFileSync(target, "utf8");

// Critical fix: filteredPlatforms must use live platforms state, not empty PLATFORMS
t = t.replace(
  /return q \? PLATFORMS\.filter\(\(p\) => p\.name\.toLowerCase\(\)\.includes\(q\)\) : PLATFORMS;/g,
  "return q ? platforms.filter((p) => p.name.toLowerCase().includes(q)) : platforms;"
);
t = t.replace(
  /}, \[pSearch\]\);(\s*\n\s*const categories = useMemo)/,
  "}, [platforms, pSearch]);$1"
);

if (t.includes("/api/boost/catalog") && t.includes("/api/boost/order") && t.includes("allServices")) {
  t = t.replace(/SERVICES\.filter/g, "allServices.filter");
  t = t.replace(/SERVICES\.find/g, "allServices.find");
  if (t.includes("PLATFORMS.filter") || /: PLATFORMS;/.test(t.split("filteredPlatforms")[1]?.slice(0, 400) || "")) {
    console.error("[apply-boost] filteredPlatforms still broken");
    process.exit(1);
  }
  fs.writeFileSync(target, t);
  console.log("[apply-boost] already live + fixed filteredPlatforms,", t.length, "bytes");
  process.exit(0);
}

if (!t.includes("useEffect")) {
  t = t.replace(
    'import { useMemo, useState } from "react";',
    'import { useEffect, useMemo, useState } from "react";'
  );
}
if (!t.includes("createBrowserClient")) {
  t = t.replace(
    'import Link from "next/link";',
    'import Link from "next/link";\nimport { createBrowserClient } from "@/lib/supabase/client";'
  );
}

t = t.replace(/const PLATFORMS: Platform\[\] = \[[\s\S]*?\];/, "const PLATFORMS: Platform[] = [];");
t = t.replace(/const SERVICES: Service\[\] = \[[\s\S]*?\];/, "const SERVICES: Service[] = [];");

if (!t.includes("wholesaleUsd?")) {
  t = t.replace(
    "ratePer1000: number;\n  min: number;",
    "ratePer1000: number;\n  partnerRatePer1000?: number;\n  wholesaleUsd?: number;\n  min: number;"
  );
}

if (!t.includes("allServices")) {
  t = t.replace(
    "const { wallet } = useUser();\n  const balance = wallet.balance;",
    `const { wallet, refresh: refreshUser } = useUser();
  const balance = wallet.balance;

  const [platforms, setPlatforms] = useState(PLATFORMS);
  const [allServices, setAllServices] = useState(SERVICES);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState("");`
  );
}

if (!t.includes("/api/boost/catalog")) {
  const marker = 'const [sSearch, setSSearch] = useState("");';
  const effect = `const [sSearch, setSSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      setCatalogError("");
      try {
        const res = await fetch("/api/boost/catalog", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || data.ok === false) throw new Error(data.error || "Failed to load services");
        if (cancelled) return;
        setPlatforms((data.platforms || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          color: p.color || p.brandColor || "#0F172A",
          initial: p.initial || String(p.name || "").slice(0, 2).toUpperCase(),
          placeholder: p.placeholder,
          linkHint: p.linkHint,
          totalServices: p.totalServices,
        })));
        setAllServices((data.services || []).map((s: any) => ({
          id: String(s.id),
          providerId: Number(s.providerId) || Number(s.id) || 0,
          categoryId: String(s.categoryId || s.platform || ""),
          group: String(s.group || s.categoryName || "Services"),
          name: String(s.name || s.title || "Service"),
          ratePer1000: Number(s.ratePer1000) || 0,
          partnerRatePer1000: s.partnerRatePer1000,
          wholesaleUsd: s.wholesaleUsd,
          min: Number(s.min) || 1,
          max: Number(s.max) || 1000000,
          speed: String(s.speed || ""),
        })));
      } catch (e) {
        if (!cancelled) setCatalogError(e instanceof Error ? e.message : "Catalog error");
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);`;
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
  /return q \? PLATFORMS\.filter\(\(p\) => p\.name\.toLowerCase\(\)\.includes\(q\)\) : PLATFORMS;/g,
  "return q ? platforms.filter((p) => p.name.toLowerCase().includes(q)) : platforms;"
);
t = t.replace(
  /return q \? platforms\.filter\(\(p\) => p\.name\.toLowerCase\(\)\.includes\(q\)\) : PLATFORMS;/g,
  "return q ? platforms.filter((p) => p.name.toLowerCase().includes(q)) : platforms;"
);
t = t.replace(
  /}, \[pSearch\]\);(\s*\n\s*const categories = useMemo)/,
  "}, [platforms, pSearch]);$1"
);
t = t.replace(
  /}, \[platformId, cSearch\]\);/,
  "}, [platformId, cSearch, allServices]);"
);
t = t.replace(
  /}, \[platformId, group, sSearch\]\);/,
  "}, [platformId, group, sSearch, allServices]);"
);

const mockPlace = /function placeOrder\(\) \{\s*if \(!canOrder \|\| !service\) return;\s*setPlaced\(\(prev\) => \[[\s\S]*?\.\.\.prev,\s*\]\);\s*setLink\(""\);\s*setQty\(""\);\s*\}/;
if (mockPlace.test(t)) {
  t = t.replace(
    mockPlace,
    `async function placeOrder() {
    if (!canOrder || !service) return;
    setOrdering(true);
    setOrderError("");
    try {
      const supabase = createBrowserClient();
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sign in to place an order");
      const res = await fetch("/api/boost/order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({
          serviceId: service.id,
          link: link.trim(),
          quantity,
          wholesaleUsd: service.wholesaleUsd,
          ratePer1000: service.ratePer1000,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || "Order failed");
      const ord = data.order || {};
      setPlaced((prev) => [
        {
          id: String(ord.providerOrderId || ord.id || Date.now()),
          service: service.name,
          speed: service.speed,
          qty: quantity,
          total: Number(ord.amount) || total,
          status: String(ord.status || "processing"),
          link: link.trim(),
        },
        ...prev,
      ]);
      setLink("");
      setQty("");
      try { await refreshUser(); } catch { /* optional */ }
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : "Order failed");
    } finally {
      setOrdering(false);
    }
  }`
  );
}

t = t.replace(
  "const canOrder = !!service && link.trim().length > 5 && quantity > 0 && inRange && !insufficient;",
  "const canOrder = !!service && link.trim().length > 5 && quantity > 0 && inRange && !insufficient && !ordering;"
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

if (t.includes("PLATFORMS.filter") || /filteredPlatforms[\s\S]{0,250}: PLATFORMS/.test(t)) {
  console.error("[apply-boost] filteredPlatforms still points at empty PLATFORMS");
  process.exit(1);
}

fs.writeFileSync(target, t);
console.log("[apply-boost] wired live catalog+order,", t.length, "bytes");
