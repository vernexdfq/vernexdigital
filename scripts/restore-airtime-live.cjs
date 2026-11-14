#!/usr/bin/env node
/**
 * Restore the polished Buy Airtime UI from a known good commit, then
 * swap demo submit for live POST /api/airtime/order. UI stays the same.
 *
 * When the page is already live-wired in the repo, skip the network download
 * (raw.githubusercontent.com returns 404 while the account is spammy-flagged).
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const COMMIT = "e16e29c7577207e9307dedb74231e028d85c8abb";
const URL =
  "https://raw.githubusercontent.com/vernexdfq/vernexdigital/" +
  COMMIT +
  "/src/app/services/airtime/page.tsx";
const file = path.join(__dirname, "..", "src", "app", "services", "airtime", "page.tsx");

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "vernex-build" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location).then(resolve, reject);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (res.statusCode !== 200) {
            reject(new Error("HTTP " + res.statusCode + " " + body.slice(0, 200)));
            return;
          }
          resolve(body);
        });
      })
      .on("error", reject);
  });
}

function wireLive(s) {
  if (s.includes("submitLivePurchase") && s.includes("/api/airtime/order")) {
    return s;
  }
  if (!s.includes('import { useUser } from "@/lib/useUser";')) {
    throw new Error("useUser import missing");
  }
  if (!s.includes("createBrowserClient")) {
    s = s.replace(
      'import { useUser } from "@/lib/useUser";',
      'import { useUser } from "@/lib/useUser";\nimport { createBrowserClient } from "@/lib/supabase/client";',
    );
  }
  s = s.replace(
    "  const { profile, wallet, loading: userLoading } = useUser();",
    "  const { profile, wallet, loading: userLoading, refresh } = useUser();",
  );
  if (!s.includes("const [buying, setBuying]")) {
    s = s.replace(
      '  const [toast, setToast] = useState("");',
      '  const [toast, setToast] = useState("");\n  const [buying, setBuying] = useState(false);',
    );
  }

  const oldFn = `  const submitDemoPurchase = () => {
    if (!readyToConfirm || !selectedNetwork) return;
    saveRecentRecipient(normalizedPhone, selectedNetwork);
    setConfirmOpen(false);
    setToast("Airtime purchase submitted (demo)");
    setPhone("");
    setNetworkId(null);
    setAmountText("");
  };`;

  const newFn = `  const submitLivePurchase = async () => {
    if (!readyToConfirm || !selectedNetwork || buying) return;
    setBuying(true);
    try {
      const supabase = createBrowserClient();
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setToast("Sign in to buy airtime");
        setBuying(false);
        return;
      }
      const res = await fetch("/api/airtime/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: \`Bearer \${token}\`,
        },
        body: JSON.stringify({
          network: selectedNetwork,
          phone: normalizedPhone,
          amount,
        }),
      });
      const data = (await res.json().catch(() => ({})));
      if (!res.ok || data.ok === false) {
        setToast(
          data.error ||
            (data.refunded ? "Purchase failed — wallet refunded" : "Airtime purchase failed"),
        );
        return;
      }
      saveRecentRecipient(normalizedPhone, selectedNetwork);
      setConfirmOpen(false);
      setToast((data.order && data.order.message) || "Airtime purchase successful");
      setPhone("");
      setNetworkId(null);
      setAmountText("");
      void refresh();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Network error");
    } finally {
      setBuying(false);
    }
  };`;

  if (!s.includes(oldFn)) {
    throw new Error("submitDemoPurchase block not found in source UI");
  }
  s = s.replace(oldFn, newFn);

  s = s.replace(
    `<Smartphone size={13} /> Demo flow — no payment will be charged.`,
    `<Smartphone size={13} /> Live top-up via Verxor · wallet will be charged.`,
  );
  s = s.replace(
    `onClick={submitDemoPurchase} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#4C1D95] text-[13px] font-semibold text-white active:opacity-90">
              <Check size={16} strokeWidth={2.6} /> Confirm Purchase`,
    `disabled={buying} onClick={() => void submitLivePurchase()} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#4C1D95] text-[13px] font-semibold text-white active:opacity-90 disabled:opacity-60">
              <Check size={16} strokeWidth={2.6} /> {buying ? "Processing…" : "Confirm Purchase"}`,
  );

  s = s.replace(/submitted \(demo\)/g, "successful");
  s = s.replace(/Demo flow — no payment will be charged\./g, "Live top-up · wallet will be charged.");
  return s;
}

(async () => {
  try {
    // Fast path: file already live-wired in the repo — do not hit raw.githubusercontent.com
    if (fs.existsSync(file)) {
      const existing = fs.readFileSync(file, "utf8");
      if (existing.includes("submitLivePurchase") && existing.includes("/api/airtime/order")) {
        console.log("[restore-airtime-live] already live-wired (" + existing.length + " bytes) — skip download");
        process.exit(0);
      }
    }

    let raw = await get(URL);
    const wired = wireLive(raw);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, wired);
    console.log("[restore-airtime-live] wrote", file, wired.length, "bytes");
  } catch (e) {
    // Fallback: if download fails but a usable live file already exists, continue
    if (fs.existsSync(file)) {
      const existing = fs.readFileSync(file, "utf8");
      if (existing.includes("submitLivePurchase") && existing.includes("/api/airtime/order")) {
        console.warn("[restore-airtime-live] download failed; using existing live page");
        process.exit(0);
      }
    }
    console.error("[restore-airtime-live]", e.message || e);
    process.exit(1);
  }
})();
