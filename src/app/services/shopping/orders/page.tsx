"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Package, Send } from "lucide-react";
import {
  fetchMyRequests,
  fetchRequestMessages,
  sendRequestMessage,
  subscribeRequestMessages,
  type ShopOrderRequest,
  type ShopRequestMessage,
  type ShopRequestStatus,
} from "@/lib/shopRequests";

const STATUS_STYLES: Record<ShopRequestStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-600", label: "Pending" },
  quoted: { bg: "bg-blue-50", text: "text-[#1877F2]", label: "Quoted" },
  confirmed: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Confirmed" },
  delivered: { bg: "bg-slate-100", text: "text-slate-500", label: "Delivered" },
  cancelled: { bg: "bg-red-50", text: "text-red-600", label: "Cancelled" },
};

function naira(n: number) {
  return "₦" + Math.round(n).toLocaleString("en-NG");
}

function when(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ShoppingOrdersPage() {
  const [requests, setRequests] = useState<ShopOrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);
  const [open, setOpen] = useState<ShopOrderRequest | null>(null);
  const [messages, setMessages] = useState<ShopRequestMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setRequests(await fetchMyRequests());
      setSignedOut(false);
    } catch (e) {
      if (/sign in/i.test(e instanceof Error ? e.message : "")) setSignedOut(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadThread = useCallback(async (id: string) => {
    try {
      setMessages(await fetchRequestMessages(id));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadThread(open.id);
    const unsub = subscribeRequestMessages(open.id, () => loadThread(open.id));
    return unsub;
  }, [open, loadThread]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function send() {
    const body = draft.trim();
    if (!body || !open || sending) return;
    setSending(true);
    try {
      await sendRequestMessage(open.id, "customer", body);
      setDraft("");
      await loadThread(open.id);
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  }

  if (open) {
    const style = STATUS_STYLES[open.status];
    return (
      <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
        <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
          <div className="flex h-14 items-center gap-2.5 px-4">
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#64748B] hover:bg-[#F1F5F9]"
              aria-label="Back to orders"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-bold text-[#0F172A]">{open.productTitle}</h1>
              <p className="text-[11px] font-semibold text-[#64748B]">
                x{open.quantity} · {naira(open.unitPrice * open.quantity)}
              </p>
            </div>
            <span className={"shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold " + style.bg + " " + style.text}>
              {style.label}
            </span>
          </div>
        </header>

        <div className="mx-auto w-full max-w-lg flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
          <div className="rounded-xl border border-slate-100 bg-white p-3">
            <p className="text-[12px] font-bold text-slate-900">Deliver to</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{open.location}</p>
            <p className="mt-1.5 text-[11px] font-semibold text-slate-400">WhatsApp · {open.whatsapp}</p>
          </div>

          {messages.map((m) => {
            const mine = m.sender === "customer";
            return (
              <div key={m.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
                <div
                  className={
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed " +
                    (mine
                      ? "rounded-br-md bg-[#1877F2] text-white"
                      : "rounded-bl-md border border-slate-100 bg-white text-slate-700")
                  }
                >
                  {m.body.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                  <p className={"mt-1 text-[10px] " + (mine ? "text-blue-100" : "text-slate-300")}>{when(m.createdAt)}</p>
                </div>
              </div>
            );
          })}
          <div className="h-2" />
        </div>

        <div className="sticky bottom-0 border-t border-[#E2E8F0] bg-white px-4 py-3">
          <div className="mx-auto flex max-w-lg items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Message the admin…"
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#1877F2] focus:outline-none"
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || !draft.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1877F2] text-white disabled:opacity-50 active:scale-95"
              aria-label="Send message"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10">
      <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link
            href="/services/shopping"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#64748B] hover:bg-[#F1F5F9]"
            aria-label="Back to shopping"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-[15px] font-semibold text-[#0F172A]">My Orders</h1>
            <p className="text-[11px] font-medium text-[#94A3B8]">Chat with the admin about your orders</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-3 px-4 pt-4">
        {loading ? (
          <div className="flex justify-center py-14">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1877F2] border-t-transparent" />
          </div>
        ) : signedOut ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Package size={22} />
            </span>
            <p className="mt-3 text-[13px] font-semibold text-slate-500">Sign in to see your orders</p>
            <Link
              href="/auth"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#1877F2] px-5 text-[13px] font-bold text-white"
            >
              Sign in
            </Link>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <MessageCircle size={22} />
            </span>
            <p className="mt-3 text-[13px] font-semibold text-slate-500">No orders yet</p>
            <p className="mt-0.5 text-[12px] text-slate-400">
              Pick a product on the Shopping page and tap checkout to start.
            </p>
          </div>
        ) : (
          requests.map((r) => {
            const style = STATUS_STYLES[r.status];
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setOpen(r)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[14px] font-bold text-slate-900">{r.productTitle}</p>
                  <span className={"shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold " + style.bg + " " + style.text}>
                    {style.label}
                  </span>
                </div>
                <p className="mt-1 text-[12px] font-semibold text-slate-400">
                  x{r.quantity} · {naira(r.unitPrice * r.quantity)} · {when(r.createdAt)}
                </p>
                <p className="mt-1.5 truncate text-[12px] text-slate-400">Deliver to: {r.location}</p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
