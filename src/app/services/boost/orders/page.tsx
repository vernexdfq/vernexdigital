"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Globe,
  Inbox,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import "../boost-page.css";

type OrderStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";
type Order = {
  id: string;
  service: string;
  platform: string;
  link: string;
  qty: number;
  total: number;
  status: OrderStatus;
  remains?: number;
  createdAt: string;
};

function normalizeStatus(raw: string): OrderStatus {
  const s = String(raw || "").toLowerCase().replace(/[_-]+/g, " ").trim();
  if (s.includes("complete") || s.includes("success") || s === "done") return "completed";
  if (s.includes("fail") || s.includes("reject") || s.includes("refund")) return "failed";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("progress") || s.includes("processing") || s.includes("partial")) return "processing";
  return "pending";
}

function formatNaira(v: number | null | undefined): string {
  const n = Number(v) || 0;
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatQty(v: number | null | undefined): string {
  const n = Number(v) || 0;
  return n.toLocaleString("en-NG");
}

function PlatformMark({ platform, size = 22 }: { platform: string; size?: number }) {
  const s = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true as const };
  const p = platform.toLowerCase();

  switch (p) {
    case 'apple-music':
    case 'apple':
      return (
        <svg {...s} fill="#FC3C44">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" style={{ display: 'none' }} />
          <path d="M18.8 4.2c-.4-.2-.8-.2-1.2 0l-8 3.5c-.4.2-.6.5-.6.9v7.8c-.6-.3-1.3-.4-2-.4C5.2 16 3.5 17.3 3.5 19s1.7 3 3.5 3 3.5-1.3 3.5-3v-6.9l7-3.1v4.4c-.6-.3-1.3-.4-2-.4-1.8 0-3.5 1.3-3.5 3s1.7 3 3.5 3 3.5-1.3 3.5-3V5.1c0-.4-.3-.8-.7-.9z" />
        </svg>
      );
    case 'audiomack':
      return (
        <svg {...s} fill="#FFA200">
          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.2l6.5 3.6v1.4L12 12.8 5.5 9.2V7.8L12 4.2zM5 11.1l6 3.3v5.1l-6-3.3v-5.1zm8 8.4v-5.1l6-3.3v5.1l-6 3.3z" />
        </svg>
      );
    case 'discord':
      return (
        <svg {...s} fill="#5865F2">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      );
    case 'facebook':
      return (
        <svg {...s} fill="#1877F2">
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z"/>
        </svg>
      );
    case 'google':
      return (
        <svg {...s} viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z" />
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
          <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9z" />
          <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg {...s}>
          <defs>
            <linearGradient id="igGradientPanelBoost" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f58529" />
              <stop offset="50%" stopColor="#dd2a7b" />
              <stop offset="100%" stopColor="#515bd4" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#igGradientPanelBoost)" />
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
          <circle cx="17.2" cy="6.8" r="1.2" fill="#fff" />
        </svg>
      );
    case 'kick':
      return (
        <svg {...s} fill="#53FC18">
          <rect width="24" height="24" rx="4" fill="#0B0E14" />
          <path fill="#53FC18" d="M6 4h4v6.5l4-6.5h4.5l-5 8 5.5 8H14.5l-4.5-6.5V20H6V4z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg {...s} fill="#0A66C2">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.5a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z" />
        </svg>
      );
    case 'pinterest':
      return (
        <svg {...s} fill="#E60023">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.64 7.86 6.38 9.3-.09-.78-.17-1.98.04-2.83.19-.77 1.22-5.17 1.22-5.17s-.31-.62-.31-1.54c0-1.45.84-2.53 1.88-2.53.89 0 1.32.67 1.32 1.47 0 .89-.57 2.23-.86 3.47-.25 1.04.52 1.89 1.54 1.89 1.85 0 3.27-1.95 3.27-4.77 0-2.49-1.79-4.24-4.35-4.24-2.96 0-4.7 2.22-4.7 4.51 0 .89.34 1.85.77 2.37.08.1.1.19.07.3-.08.33-.26 1.06-.3 1.2-.05.21-.17.26-.39.16-1.45-.67-2.35-2.78-2.35-4.48 0-3.64 2.65-6.99 7.63-6.99 4.01 0 7.13 2.86 7.13 6.68 0 3.99-2.51 7.2-6 7.2-1.17 0-2.27-.61-2.65-1.33l-.72 2.75c-.26 1-.97 2.26-1.44 3.03C9.9 21.84 10.92 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
        </svg>
      );
    case 'reddit':
      return (
        <svg {...s} fill="#FF4500">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.2 13.2c-.4.4-1 .6-1.7.6-.8 0-1.5-.3-2-.8-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 .3.4.8.6 1.3.6.5 0 1-.2 1.3-.6.2-.2.5-.2.7 0 .2.2.2.5 0 .7zm-8.4-1.2c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm4.4 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/>
        </svg>
      );
    case 'snapchat':
      return (
        <svg {...s} fill="#FFFC00">
          <rect width="24" height="24" rx="5" fill="#0F1419" />
          <path fill="#FFFC00" d="M12 4.5c2.3 0 4.1 1.7 4.1 3.9 0 .4 0 .9-.2 1.4.6.2 1.2.6 1.2 1.2 0 .5-.4.9-.8 1.1.2.6.4 1.3.5 2.1.2.2.6.4 1 .4.4 0 .8-.2 1-.4.2-.2.5-.1.6.1.1.3 0 .7-.3.9-.7.5-1.5.6-2.2.3-.5.9-1.2 1.6-2.1 1.9.4.5 1.1.8 1.9.8.3 0 .5.2.5.5s-.2.5-.5.5c-1.3 0-2.5-.6-3.2-1.6-.7 1-1.9 1.6-3.2 1.6-.3 0-.5-.2-.5-.5s.2-.5.5-.5c.8 0 1.5-.3 1.9-.8-.9-.3-1.6-1-2.1-1.9-.7.3-1.5.2-2.2-.3-.3-.2-.4-.6-.3-.9.1-.2.4-.3.6-.1.2.2.6.4 1 .4.4 0 .8-.2 1-.4.1-.8.3-1.5.5-2.1-.4-.2-.8-.6-.8-1.1 0-.6.6-1 1.2-1.2-.2-.5-.2-1-.2-1.4 0-2.2 1.8-3.9 4.1-3.9z" />
        </svg>
      );
    case 'soundcloud':
      return (
        <svg {...s} fill="#FF5500">
          <path d="M11.56 8.87V17h8.1c1.84 0 3.34-1.49 3.34-3.34 0-1.84-1.5-3.33-3.34-3.33-.2 0-.39.02-.58.05C18.6 8.35 16.7 6.8 14.4 6.8c-1.15 0-2.2.4-3.03 1.07l.19 1zm-1.8 1.2V17h1.08V9.67c-.38.11-.74.24-1.08.4zm-1.8 1.48V17h1.08v-4.12c-.37.2-.73.4-1.08.57zm-1.8 1.04V17h1.08v-2.31c-.36.21-.72.41-1.08.58zm-1.8.84V17h1.08v-.97c-.36.23-.72.43-1.08.6zm-1.8 1.02V17h1.08v-1c-.36.19-.72.35-1.08.47zM1 15.6V17h1.08v-1.28c-.37.13-.73.23-1.08.28z" />
        </svg>
      );
    case 'spotify':
      return (
        <svg {...s} fill="#1DB954">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.6 14.45c-.18.3-.56.4-.86.22-2.36-1.44-5.34-1.77-8.84-.97-.34.08-.68-.13-.76-.47-.08-.34.13-.68.47-.76 3.84-.88 7.14-.5 9.78 1.12.3.18.4.56.21.86zm1.23-2.74c-.23.37-.71.49-1.08.26-2.7-1.66-6.82-2.14-10.02-1.17-.41.12-.85-.11-.97-.52-.12-.41.11-.85.52-.97 3.66-1.11 8.16-.57 11.28 1.34.37.23.49.71.27 1.06zm.1-2.85C14.8 8.6 9.08 8.4 5.86 9.38c-.5.15-1.02-.13-1.17-.62-.15-.5.13-1.02.62-1.17 3.7-1.12 9.86-.9 13.74 1.36.45.27.6.86.33 1.31-.27.45-.86.6-1.31.33z" />
        </svg>
      );
    case 'telegram':
      return (
        <svg {...s} fill="#24A1DE">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8-1.6 7.56c-.12.54-.43.67-.87.42l-2.4-1.77-1.16 1.12c-.13.13-.24.24-.49.24l.17-2.43 4.47-4.04c.19-.17-.04-.27-.3-.1l-5.53 3.48-2.38-.74c-.52-.16-.53-.52.11-.77l9.3-3.58c.43-.2.81.1.68.61z" />
        </svg>
      );
    case 'threads':
      return (
        <svg {...s} fill="#0F1419">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.2 13.5c-.7 1.4-2 2.3-3.7 2.3-2.6 0-4.4-1.8-4.4-4.8s1.8-4.8 4.4-4.8c2.2 0 3.8 1.4 4.1 3.5h-1.8c-.3-1.1-1.2-1.8-2.3-1.8-1.5 0-2.5 1.1-2.5 3.1s1 3.1 2.5 3.1c1.1 0 1.8-.5 2.2-1.3l1.5.7z" />
        </svg>
      );
    case 'tiktok':
        return (
        <svg {...s} fill="#0F1419">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3 6.34 6.34 0 0 0 9.49 21.64 6.34 6.34 0 0 0 15.83 15.3V8.95a8.27 8.27 0 0 0 4.84 1.55V7.05a4.85 4.85 0 0 1-1.08-.36z" />
        </svg>
      );
    case 'twitch':
      return (
        <svg {...s} fill="#9146FF">
          <path d="M4 2L2 6v14h5v4l4-4h4l7-7V2H4zm16 11l-3 3h-4l-3 3v-3H6V4h14v9z" />
          <path d="M14 7h2v5h-2zM9 7h2v5H9z" />
        </svg>
      );
    case 'website-traffic':
      return (
        <svg {...s} fill="#0284C7">
          <circle cx="12" cy="12" r="10" fill="none" stroke="#0284C7" strokeWidth="2" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" fill="none" stroke="#0284C7" strokeWidth="2" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg {...s} fill="#25D366">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.38 0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42 1.56 1.55 2.41 3.62 2.41 5.83 0 4.54-3.7 8.23-8.23 8.23z" />
        </svg>
      );
    case 'x':
    case 'twitter':
      return (
        <svg {...s} fill="#0F1419">
          <path d="M18.24 2H21.5l-7.05 8.06L22.5 22h-6.17l-4.83-6.31L6.3 22H3.02l7.54-8.62L1.5 2h6.33l4.36 5.78L18.24 2zm-1.08 18.1h1.81L7.03 3.8H5.09l12.07 16.3z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg {...s} fill="#FF0000">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
        </svg>
      );
    default:
      return <Globe size={size} />;
  }
}


const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "pending",
  processing: "in progress",
  completed: "completed",
  failed: "failed",
  cancelled: "cancelled",
};

/**
 * /services/boost/orders — the full boost order history.
 * "View all orders" on the boost page links here. Orders live in the panel
 * database forever (nothing is ever deleted), so this page always shows every
 * order with its live provider status.
 */
export default function BoostOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const loadOrders = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    setOrdersError("");
    try {
      const supabase = createBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setSignedIn(false);
        setOrders([]);
        return;
      }
      setSignedIn(true);
      const res = await fetch("/api/boost/orders?limit=200", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.ok === false) throw new Error(payload.error || "Could not load orders.");
      setOrders(
        (Array.isArray(payload.orders) ? payload.orders : []).map((o: Record<string, unknown>) => ({
          id: String(o.providerOrderId || o.id || o.txnId || ""),
          service: String(o.service || "Boost"),
          platform: String(o.platform || ""),
          link: String(o.link || ""),
          qty: Number(o.qty) || Number(o.quantity) || 0,
          total: Number(o.total) || 0,
          status: normalizeStatus(String(o.status || "pending")),
          remains: o.remains != null ? Number(o.remains) : undefined,
          createdAt: String(o.createdAt || ""),
        })),
      );
    } catch (e) {
      setOrdersError(e instanceof Error ? e.message : "Could not load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
    const t = window.setInterval(() => void loadOrders(true), 20000);
    return () => window.clearInterval(t);
  }, [loadOrders]);

  const handleCopy = useCallback(async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Order ID copied");
    } catch {
      /* clipboard unavailable */
    }
  }, [showToast]);

  return (
    <div className="boost-page">
      <header className="boost-topbar">
        <Link href="/services/boost" className="boost-back" aria-label="Back">
          <ArrowLeft size={18} strokeWidth={2.4} />
        </Link>
        <div className="boost-title-wrap">
          <h1 className="boost-title">Boost Orders</h1>
          <p className="boost-subtitle">All your boost orders &middot; kept forever</p>
        </div>
        <span className="boost-wallet-btn" title={`${orders.length} orders`}>
          <Inbox size={14} />
          <span className="boost-wallet-val">{orders.length}</span>
        </span>
      </header>

      <div className="boost-tip">
        <Info size={14} className="boost-tip-icon" />
        <span>Statuses sync live with the provider every 20 seconds. Failed orders are refunded automatically.</span>
      </div>

      <section className="boost-orders-section" aria-labelledby="boost-orders-heading">
        <div className="boost-orders-head">
          <h2 id="boost-orders-heading" className="boost-orders-title">My Orders</h2>
          <button type="button" className="boost-refresh-btn" onClick={() => void loadOrders()} disabled={refreshing || loading}>
            <RefreshCw size={12} className={refreshing ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
        {ordersError && (
          <div className="boost-orders-empty" style={{ color: "#A8463D" }}>
            <Info size={22} />
            <p>{ordersError}</p>
          </div>
        )}
        <div className="boost-orders-list">
          {loading ? (
            <div style={{ padding: "36px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", color: "#64748B" }}>
              <Loader2 size={28} className="spin" style={{ color: "#2563EB" }} />
              <span style={{ fontSize: "13px", fontWeight: 600 }}>Loading your orders…</span>
            </div>
          ) : signedIn === false ? (
            <div className="boost-orders-empty">
              <Inbox size={28} />
              <p>Sign in to view your boost orders.</p>
            </div>
          ) : !ordersError && orders.length === 0 ? (
            <div className="boost-orders-empty">
              <Inbox size={28} />
              <p>No boost orders yet. Place your first boost on the Boost page.</p>
            </div>
          ) : (
            orders.map((o) => (
              <div key={o.id + o.createdAt} className="boost-order-item">
                <div className="boost-order-top">
                  <div className="boost-order-service">
                    <div className="boost-order-icon"><PlatformMark platform={o.platform || "social"} size={16} /></div>
                    <span className="boost-order-title">{o.service}</span>
                  </div>
                  <span className={`boost-order-badge st-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                </div>
                <div className="boost-order-details">
                  <div className="boost-order-detail-item">
                    <span className="boost-order-detail-label">Qty</span>
                    <span className="boost-order-detail-val">{formatQty(o.qty)}</span>
                  </div>
                  <div className="boost-order-detail-item">
                    <span className="boost-order-detail-label">Amount</span>
                    <span className="boost-order-detail-val">{formatNaira(o.total)}</span>
                  </div>
                  {o.remains != null && Number.isFinite(o.remains) ? (
                    <div className="boost-order-detail-item">
                      <span className="boost-order-detail-label">Remains</span>
                      <span className="boost-order-detail-val">{formatQty(o.remains)}</span>
                    </div>
                  ) : null}
                </div>
                <div className="boost-order-footer">
                  <button type="button" className="boost-order-ref" onClick={() => void handleCopy(o.id)}>
                    <Copy size={11} /> {o.id || "—"}
                  </button>
                  <span className="boost-order-date">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : ""}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {toast ? (
        <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 60, background: "#111827", color: "#fff", fontSize: 12, fontWeight: 600, padding: "10px 16px", borderRadius: 999, boxShadow: "0 8px 24px rgba(15,23,42,.25)" }}>
          {toast}
        </div>
      ) : null}
    </div>
  );
}
