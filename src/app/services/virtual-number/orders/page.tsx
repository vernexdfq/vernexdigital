"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Search,
  Copy,
  Check,
  Phone,
  RefreshCw,
} from "lucide-react";
import { useUser } from "@/lib/useUser";

type VnOrder = {
  id: string;
  phone: string;
  service: string;
  country?: string;
  provider: string;
  providerSlug?: string;
  providerOrderId?: string;
  status: "waiting" | "received" | "completed" | "cancelled" | "expired" | "refunded";
  code?: string;
  priceNgn?: number;
  wholesaleNgn?: number;
  createdAt?: string;
  expiresAt?: number;
  cancelAvailableAt?: number;
  refunded?: boolean;
};

const OTP_POLL_MS = 5000;

async function getToken(): Promise<string | null> {
  try {
    const { createBrowserClient } = await import("@/lib/supabase/client");
    const supabase = createBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

function persistOrders(list: VnOrder[]) {
  try {
    sessionStorage.setItem("vn_recent_orders", JSON.stringify(list.slice(0, 30)));
  } catch {
    /* ignore */
  }
}

function orderKey(o: { id?: string; providerOrderId?: string; phone?: string }) {
  return String(o.providerOrderId || o.id || o.phone || "");
}

/** Merge session + API so a just-purchased waiting order never disappears. */
function mergeOrders(session: VnOrder[], api: VnOrder[]): VnOrder[] {
  const map = new Map<string, VnOrder>();
  for (const o of session) {
    const k = orderKey(o);
    if (k) map.set(k, o);
  }
  for (const o of api) {
    const k = orderKey(o);
    if (!k) continue;
    const prev = map.get(k);
    if (!prev) {
      map.set(k, o);
      continue;
    }
    map.set(k, {
      ...prev,
      ...o,
      expiresAt: o.expiresAt || prev.expiresAt,
      cancelAvailableAt: o.cancelAvailableAt || prev.cancelAvailableAt,
      wholesaleNgn: o.wholesaleNgn ?? prev.wholesaleNgn,
      code: o.code || prev.code,
      status:
        o.status === "waiting" && prev.status === "received" ? prev.status : o.status || prev.status,
    });
  }
  return Array.from(map.values()).sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : a.expiresAt || 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : b.expiresAt || 0;
    return tb - ta;
  });
}

function formatTimer(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function statusBadge(status: VnOrder["status"]) {
  switch (status) {
    case "received":
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          ✓ Code ready
        </span>
      );
    case "waiting":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
          Waiting for SMS
        </span>
      );
    case "cancelled":
    case "expired":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
          × Cancelled
        </span>
      );
    case "refunded":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          ✓ Refunded
        </span>
      );
    default:
      return <span className="text-[11px] font-medium text-[#64748B]">{status}</span>;
  }
}

export default function VirtualNumberOrdersPage() {
  const { wallet, refresh } = useUser();
  const balance = wallet?.balance ?? 0;
  const [orders, setOrders] = useState<VnOrder[]>([]);
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [tick, setTick] = useState(0);

  const updateOrder = useCallback((id: string, patch: Partial<VnOrder>) => {
    setOrders((prev) => {
      const next = prev.map((o) =>
        o.id === id || o.providerOrderId === id ? { ...o, ...patch } : o,
      );
      persistOrders(next);
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    let sessionList: VnOrder[] = [];
    try {
      const raw = sessionStorage.getItem("vn_recent_orders");
      if (raw) {
        const parsed = JSON.parse(raw) as VnOrder[];
        if (Array.isArray(parsed)) sessionList = parsed;
      }
    } catch {
      /* ignore */
    }

    try {
      const token = await getToken();
      if (!token) {
        setOrders(sessionList);
        setLoading(false);
        return;
      }
      const res = await fetch("/api/vn/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok && Array.isArray(data.orders)) {
        const mapped: VnOrder[] = data.orders.map((o: Record<string, unknown>) => ({
          id: String(o.id || o.providerOrderId || ""),
          phone: String(o.phone || ""),
          service: String(o.service || ""),
          country: o.country ? String(o.country) : undefined,
          provider: String(o.provider || "Grizzly"),
          providerSlug: String(o.providerSlug || o.provider || "grizzly"),
          providerOrderId: o.providerOrderId ? String(o.providerOrderId) : undefined,
          status: (o.status as VnOrder["status"]) || "waiting",
          code: o.code ? String(o.code) : undefined,
          priceNgn: Number(o.priceNgn) || undefined,
          refunded: Boolean(o.refunded),
          createdAt: o.createdAt ? String(o.createdAt) : undefined,
        }));
        const merged = mergeOrders(sessionList, mapped);
        setOrders(merged);
        persistOrders(merged);
      } else {
        setOrders(sessionList);
      }
    } catch {
      setOrders(sessionList);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const waiting = orders.filter((o) => o.status === "waiting" && o.providerOrderId);
    if (!waiting.length) return;

    let cancelled = false;
    const pollOne = async (order: VnOrder) => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const qs = new URLSearchParams({
          providerOrderId: order.providerOrderId!,
          provider: order.providerSlug || "grizzly",
        });
        if (order.id && !order.id.startsWith("local_")) qs.set("orderId", order.id);
        const res = await fetch(`/api/vn/status?${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled || !data.ok) return;
        if (data.otp || data.code) {
          updateOrder(order.id, {
            code: String(data.otp || data.code),
            status: "received",
          });
        } else if (data.status === "cancelled" || data.status === "expired") {
          updateOrder(order.id, { status: data.status });
        }
      } catch {
        /* ignore */
      }
    };

    const run = () => {
      for (const o of waiting) void pollOne(o);
    };
    run();
    const id = setInterval(run, OTP_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [orders, updateOrder]);

  useEffect(() => {
    const now = Date.now();
    for (const o of orders) {
      if (o.status === "waiting" && o.expiresAt && o.expiresAt <= now) {
        updateOrder(o.id, { status: "expired" });
      }
    }
  }, [tick, orders, updateOrder]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.phone.includes(q) ||
        o.service.toLowerCase().includes(q) ||
        (o.code || "").includes(q),
    );
  }, [orders, query]);

  async function checkOtp(order: VnOrder) {
    if (!order.providerOrderId) {
      setMsg("Missing provider order id");
      return;
    }
    setBusyId(order.id);
    setMsg("");
    try {
      const token = await getToken();
      if (!token) {
        setMsg("Sign in again");
        return;
      }
      const qs = new URLSearchParams({
        providerOrderId: order.providerOrderId,
        provider: order.providerSlug || "grizzly",
      });
      if (order.id && !order.id.startsWith("local_")) qs.set("orderId", order.id);
      const res = await fetch(`/api/vn/status?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setMsg(data.error || "Could not check status");
        return;
      }
      if (data.otp || data.code) {
        updateOrder(order.id, {
          code: String(data.otp || data.code),
          status: "received",
        });
        setMsg("OTP received!");
      } else if (data.status === "cancelled" || data.status === "expired") {
        updateOrder(order.id, { status: data.status });
      } else {
        setMsg("Still waiting for SMS…");
      }
    } catch {
      setMsg("Network error");
    } finally {
      setBusyId(null);
    }
  }

  async function cancelOrder(order: VnOrder) {
    if (!order.providerOrderId) return;
    const lockUntil = order.cancelAvailableAt || 0;
    if (lockUntil && Date.now() < lockUntil) {
      setMsg(`Cancel available in ${formatTimer(lockUntil - Date.now())}`);
      return;
    }
    setBusyId(order.id);
    setMsg("");
    try {
      const token = await getToken();
      if (!token) {
        setMsg("Sign in again");
        return;
      }
      const res = await fetch("/api/vn/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          providerOrderId: order.providerOrderId,
          orderId: order.id?.startsWith("local_") ? undefined : order.id,
          priceNgn: order.priceNgn || 0,
          wholesaleNgn: order.wholesaleNgn || 0,
          provider: order.providerSlug || "grizzly",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.earlyDenied) {
        setMsg(data.error || "Cancel not available yet — wait a bit");
        return;
      }
      if (!res.ok || !data.ok) {
        setMsg(data.error || "Cancel failed");
        return;
      }
      updateOrder(order.id, {
        status: data.refunded ? "refunded" : "cancelled",
        refunded: Boolean(data.refunded),
      });
      setMsg(data.refunded ? "Cancelled and refunded to wallet" : "Cancelled");
      void refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setBusyId(null);
    }
  }

  async function copyCode(order: VnOrder) {
    if (!order.code) return;
    try {
      await navigator.clipboard.writeText(order.code);
      setCopiedId(order.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      /* ignore */
    }
  }

  void tick;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      <header className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/services/virtual-number" className="p-1 -ml-1 text-[#64748B]">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-[15px] font-semibold text-[#0F172A]">Order History</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#16A34A] tabular-nums">
            ₦{Number(balance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </span>
          <button
            type="button"
            className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B]"
          >
            <Bell size={18} />
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-[#0F172A]">My Orders</h2>
            <p className="text-xs text-[#94A3B8]">{orders.length} total</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void load();
            }}
            className="text-xs font-medium text-[#1877F2] flex items-center gap-1"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search service, number…"
            className="w-full h-11 pl-10 pr-3 rounded-xl border border-[#E2E8F0] bg-white text-sm outline-none focus:border-[#1877F2]"
          />
        </div>

        <div className="rounded-xl bg-[#EEF4FF] border border-[#D6E4FF] px-3 py-2.5 text-[12px] text-[#1E40AF] leading-relaxed">
          <span className="font-semibold">Tip:</span> After you order a number, wait here for the
          SMS. Codes appear automatically. Tap Check OTP anytime. Cancel after 5 minutes if you no
          longer need the number.
        </div>

        {msg ? <p className="text-sm text-center text-[#1877F2] font-medium">{msg}</p> : null}

        {loading ? (
          <p className="text-sm text-[#94A3B8] text-center py-12">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 flex flex-col items-center text-center">
            <Phone className="text-[#CBD5E1] mb-2" size={32} />
            <p className="text-sm font-medium text-[#0F172A]">No orders yet</p>
            <p className="text-xs text-[#94A3B8] mt-1 mb-4">
              Order a number and come back here for your code
            </p>
            <Link
              href="/services/virtual-number"
              className="h-10 px-4 rounded-xl bg-[#1877F2] text-white text-sm font-semibold flex items-center"
            >
              Order a number
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => {
              const now = Date.now();
              const expiresLeft =
                o.status === "waiting" && o.expiresAt ? o.expiresAt - now : 0;
              const cancelLeft =
                o.status === "waiting" && o.cancelAvailableAt
                  ? Math.max(0, o.cancelAvailableAt - now)
                  : 0;
              const canCancel =
                o.status === "waiting" &&
                (!o.cancelAvailableAt || o.cancelAvailableAt <= now);

              return (
                <div
                  key={o.id || o.providerOrderId}
                  className={`bg-white border rounded-2xl p-4 ${
                    o.status === "waiting" ? "border-amber-200 shadow-sm" : "border-[#E2E8F0]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A]">{o.service}</p>
                      <p className="text-sm text-[#1877F2] font-mono tabular-nums mt-0.5">
                        {o.phone || "—"}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] mt-1">
                        {o.priceNgn ? `₦${o.priceNgn.toLocaleString("en-NG")}` : ""}
                      </p>
                    </div>
                    {statusBadge(o.status)}
                  </div>

                  {o.status === "waiting" ? (
                    <div className="mt-3 space-y-1">
                      {expiresLeft > 0 ? (
                        <p className="text-xs text-[#64748B]">
                          Expires in{" "}
                          <span className="font-semibold tabular-nums text-[#0F172A]">
                            {formatTimer(expiresLeft)}
                          </span>
                        </p>
                      ) : null}
                      {!canCancel && cancelLeft > 0 ? (
                        <p className="text-[11px] text-[#94A3B8]">
                          Cancel available in {formatTimer(cancelLeft)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {o.code ? (
                    <div className="mt-3 rounded-xl bg-[#F0FDF4] border border-emerald-100 px-3 py-3">
                      <p className="text-[11px] font-medium text-emerald-700 mb-1">OTP CODE</p>
                      <p className="text-2xl font-bold tracking-[0.2em] text-[#0F172A] tabular-nums">
                        {o.code}
                      </p>
                    </div>
                  ) : o.status === "waiting" ? (
                    <div className="mt-3 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] px-3 py-3">
                      <p className="text-[11px] font-medium text-[#94A3B8] mb-1">OTP CODE</p>
                      <p className="text-lg font-semibold tracking-[0.25em] text-[#CBD5E1]">
                        — — — — —
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {o.code ? (
                      <button
                        type="button"
                        onClick={() => void copyCode(o)}
                        className="flex-1 min-w-[120px] h-10 bg-[#1877F2] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
                      >
                        {copiedId === o.id ? (
                          <>
                            <Check size={16} /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={16} /> Copy OTP
                          </>
                        )}
                      </button>
                    ) : o.status === "waiting" ? (
                      <>
                        <button
                          type="button"
                          disabled={busyId === o.id}
                          onClick={() => void checkOtp(o)}
                          className="flex-1 min-w-[120px] h-10 bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          <RefreshCw
                            size={15}
                            className={busyId === o.id ? "animate-spin" : ""}
                          />
                          {busyId === o.id ? "Checking…" : "Check OTP"}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === o.id || !canCancel}
                          onClick={() => void cancelOrder(o)}
                          className="h-10 px-4 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}

                    {(o.status === "cancelled" ||
                      o.status === "expired" ||
                      o.status === "refunded") && (
                      <Link
                        href="/services/virtual-number"
                        className="flex-1 min-w-[120px] h-10 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5"
                      >
                        ⚡ Buy Again
                      </Link>
                    )}
                  </div>

                  {o.refunded || o.status === "refunded" ? (
                    <p className="mt-2.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                      ✓{" "}
                      {o.priceNgn
                        ? `₦${o.priceNgn.toLocaleString("en-NG")}`
                        : "Amount"}{" "}
                      refunded to your wallet
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
