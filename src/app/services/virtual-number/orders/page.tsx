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
  X,
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
  createdAt?: string;
  expiresAt?: number;
  refunded?: boolean;
};

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
  } catch {}
}

function statusBadge(status: VnOrder["status"]) {
  switch (status) {
    case "received":
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          ✓ Done
        </span>
      );
    case "waiting":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
          Waiting
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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const raw = sessionStorage.getItem("vn_recent_orders");
        if (raw) {
          const parsed = JSON.parse(raw) as VnOrder[];
          if (Array.isArray(parsed) && parsed.length) setOrders(parsed);
        }
      } catch {}

      try {
        const token = await getToken();
        if (!token) {
          if (!cancelled) setLoading(false);
          return;
        }
        const res = await fetch("/api/vn/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && data.ok && Array.isArray(data.orders) && data.orders.length) {
          const mapped: VnOrder[] = data.orders.map((o: any) => ({
            id: String(o.id),
            phone: o.phone,
            service: o.service,
            country: o.country,
            provider: o.provider || "Grizzly",
            providerSlug: o.providerSlug || o.provider || "grizzly",
            providerOrderId: o.providerOrderId,
            status: o.status || "waiting",
            code: o.code,
            priceNgn: o.priceNgn,
            refunded: o.refunded,
            createdAt: o.createdAt,
          }));
          setOrders(mapped);
          persistOrders(mapped);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (orders.length) persistOrders(orders);
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.phone.includes(q) ||
        o.service.toLowerCase().includes(q) ||
        o.provider.toLowerCase().includes(q) ||
        (o.code || "").includes(q),
    );
  }, [orders, query]);

  const updateOrder = useCallback((id: string, patch: Partial<VnOrder>) => {
    setOrders((prev) => {
      const next = prev.map((o) => (o.id === id ? { ...o, ...patch } : o));
      persistOrders(next);
      return next;
    });
  }, []);

  async function checkOtp(order: VnOrder) {
    if (!order.providerOrderId) {
      setMsg("Missing order id — cannot check OTP");
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
      if (order.id) qs.set("orderId", order.id);
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
    if (!order.providerOrderId) {
      setMsg("Missing order id");
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
          orderId: order.id,
          priceNgn: order.priceNgn || 0,
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
      setMsg(data.refunded ? "Cancelled and refunded" : "Cancelled");
      void refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setBusyId(null);
    }
  }

  async function copyCode(id: string, code?: string) {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {}
  }

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

      <div className="px-4 pt-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">My Orders</h2>
            <p className="text-sm text-[#64748B] mt-0.5">{orders.length} total</p>
          </div>
          <span className="text-[11px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-full">
            {orders.length} total
          </span>
        </div>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search service, number…"
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#E2E8F0] bg-white text-sm outline-none focus:border-[#1877F2] text-[#0F172A] placeholder:text-[#94A3B8]"
          />
        </div>

        <div className="rounded-xl bg-[#EEF4FF] border border-[#BFDBFE] px-3.5 py-3 text-[13px] text-[#1E40AF] leading-relaxed">
          <span className="font-semibold">Tip:</span> Tap{" "}
          <span className="font-semibold">Check OTP</span> on a pending order to fetch your
          verification code. Use Cancel if you no longer need the number (refund when
          available).
        </div>

        {msg ? (
          <div className="text-sm text-[#0F172A] bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2">
            <span>{msg}</span>
            <button type="button" onClick={() => setMsg("")} className="text-[#94A3B8]">
              <X size={14} />
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="py-16 text-center text-sm text-[#94A3B8]">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl px-4 py-14 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-3">
              <Phone size={22} className="text-[#94A3B8]" />
            </div>
            <p className="text-sm font-medium text-[#0F172A]">No orders found</p>
            <p className="text-xs text-[#94A3B8] mt-1">
              {query ? "Try a different search" : "Your number purchases will show here"}
            </p>
            <Link
              href="/services/virtual-number"
              className="inline-flex mt-4 text-sm font-semibold text-[#1877F2]"
            >
              Order a number →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => (
              <div
                key={o.id}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center shrink-0">
                      <Phone size={18} className="text-[#1877F2]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-[#0F172A] truncate">
                        {o.service}
                      </p>
                      <p className="text-sm font-medium text-[#1877F2] tabular-nums mt-0.5">
                        {o.phone}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
                          {o.provider}
                        </span>
                        {o.country && (
                          <span className="text-[10px] text-[#94A3B8]">{o.country}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {statusBadge(o.status)}
                </div>

                <div className="mt-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B] mb-1">
                    OTP Code
                  </p>
                  {o.code ? (
                    <p className="text-2xl font-bold tracking-widest text-[#0F172A] tabular-nums">
                      {o.code}
                    </p>
                  ) : (
                    <p className="text-lg font-medium text-[#CBD5E1] tracking-widest">
                      — — — — —
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {o.code ? (
                    <button
                      type="button"
                      onClick={() => copyCode(o.id, o.code)}
                      className="flex-1 min-w-[120px] h-10 bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
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
                        onClick={() => checkOtp(o)}
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
                        disabled={busyId === o.id}
                        onClick={() => cancelOrder(o)}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
