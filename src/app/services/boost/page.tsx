"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/lib/useUser";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  ArrowLeft, Search, X, Link2, Check, Folder, Star, Rocket, Info,
  RefreshCw, Zap, Wallet, ClipboardPaste, ListOrdered, ChevronDown,
  Sparkles, ShieldCheck, Users, Clock3, CircleAlert, Globe,
} from "lucide-react";
import "./boost-page.css";

type Platform = {
  id: string;
  name: string;
  color: string;
  initial: string;
  placeholder?: string;
  linkHint?: string;
  totalServices?: number;
};
type Service = {
  id: string;
  providerId: number;
  categoryId: string;
  group: string;
  name: string;
  ratePer1000: number;
  min: number;
  max: number;
  speed: string;
  refill?: boolean | string;
  quality?: string;
};
type Order = { id: string; service: string; speed: string; qty: number; total: number; status: string; link: string; platform?: string };
type PickerKind = "platform" | "category" | "service" | null;

const QTY_CHIPS = [500, 1000, 2500, 5000];
function formatNaira(n: number) {
  return "₦" + (Number.isFinite(n) ? n : 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatQty(n: number) { return Number(n || 0).toLocaleString("en-NG"); }
function PlatformMark({ platform, size = 22 }: { platform: string; size?: number }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true as const };
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
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg {...s} fill="#1877F2">
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
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
            <linearGradient id="igGradientLive" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f58529" />
              <stop offset="50%" stopColor="#dd2a7b" />
              <stop offset="100%" stopColor="#515bd4" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#igGradientLive)" />
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
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.2 13.2c-.4.4-1 .6-1.7.6-.8 0-1.5-.3-2-.8-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 .3.4.8.6 1.3.6.5 0 1-.2 1.3-.6.2-.2.5-.2.7 0 .2.2.2.5 0 .7zm-8.4-1.2c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm4.4 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" />
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
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.38 0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42 1.56 1.55 2.41 3.62 2.41 5.83 0 4.54-3.7 8.23-8.23 8.23zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.22.25-.86.84-.86 2.06 0 1.21.88 2.39 1.01 2.56.12.17 1.74 2.66 4.22 3.73.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.17-.48-.29z" />
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

const BOOST_ORDERS_STORAGE_KEY = 'verxor_boost_orders_v2';



function Label({ children }: { children: React.ReactNode }) { return <span className="boost-label">{children}</span>; }
function FormRow({ label, value, placeholder, icon, onClick, disabled }: { label: string; value: string | null; placeholder: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <div><Label>{label}</Label><button type="button" onClick={onClick} disabled={disabled} className={"boost-form-trigger " + (disabled ? "is-disabled" : "")}><span className="boost-form-icon">{icon}</span><span className={"boost-form-value " + (value ? "has-value" : "")}>{value ?? placeholder}</span>{value ? <Check size={16} className="boost-selected-check" /> : <ChevronDown size={17} className="boost-chevron" />}</button></div>;
}
function PickerPage({ title, open, onClose, search, onSearch, children }: { title: string; open: boolean; onClose: () => void; search: string; onSearch: (v: string) => void; children: React.ReactNode }) {
  if (!open) return null;
  return <div className="boost-picker-root" role="dialog" aria-modal="true"><header className="boost-picker-header"><button type="button" onClick={onClose} className="boost-picker-back"><ArrowLeft size={18}/> Back</button><h2>{title}</h2><button type="button" aria-label="Close" className="boost-picker-x" onClick={onClose}><X size={19}/></button></header><div className="boost-picker-search"><Search size={16}/><input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search by name…" autoFocus/><kbd>⌘ K</kbd></div><div className="boost-picker-list">{children}</div></div>;
}

export default function BoostAccountPage() {
  const { wallet, refresh: refreshUser } = useUser();
  const balance = wallet.balance;
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [platformId, setPlatformId] = useState<string | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [qty, setQty] = useState("");
  const [placed, setPlaced] = useState<Order[]>([]);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [pSearch, setPSearch] = useState("");
  const [cSearch, setCSearch] = useState("");
  const [sSearch, setSSearch] = useState("");

  const loadCatalog = async () => {
    setCatalogLoading(true);
    setCatalogError("");
    try {
      const res = await fetch("/api/boost/catalog", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.error || "The live catalog could not be loaded.");
      setPlatforms((Array.isArray(data.platforms) ? data.platforms : []).map((p: any) => ({
        id: String(p.id), name: String(p.name || p.id), color: String(p.brandColor || p.color || "#0F172A"),
        initial: String(p.initial || p.name || "?").slice(0, 2).toUpperCase(), placeholder: p.placeholder,
        linkHint: p.linkHint, totalServices: Number(p.totalServices) || 0,
      })));
      setAllServices((Array.isArray(data.services) ? data.services : []).map((s: any) => ({
        id: String(s.id), providerId: Number(s.providerId) || Number(s.id) || 0,
        categoryId: String(s.categoryId || s.platform || ""), group: String(s.group || s.categoryName || "Services"),
        name: String(s.name || s.title || "Service"), ratePer1000: Number(s.ratePer1000) || 0,
        min: Number(s.min) || 1, max: Number(s.max) || 1000000, speed: String(s.speed || ""), refill: s.refill, quality: s.quality,
      })));
    } catch (e) { setCatalogError(e instanceof Error ? e.message : "Catalog error"); }
    finally { setCatalogLoading(false); }
  };
  useEffect(() => { void loadCatalog(); }, []);

  const platform = platforms.find((p) => p.id === platformId) ?? null;
  const service = allServices.find((s) => s.id === serviceId) ?? null;
  const filteredPlatforms = useMemo(() => { const q = pSearch.trim().toLowerCase(); return q ? platforms.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)) : platforms; }, [platforms, pSearch]);
  const categories = useMemo(() => { if (!platformId) return []; const names = [...new Set(allServices.filter(s => s.categoryId === platformId).map(s => s.group))]; const q = cSearch.trim().toLowerCase(); return ["All Services", ...names].filter(c => !q || c.toLowerCase().includes(q)); }, [platformId, cSearch, allServices]);
  const services = useMemo(() => { if (!platformId) return []; const base = allServices.filter(s => s.categoryId === platformId); const list = group ? base.filter(s => s.group === group) : base; const q = sSearch.trim().toLowerCase(); return q ? list.filter(s => s.name.toLowerCase().includes(q) || s.group.toLowerCase().includes(q)) : list; }, [platformId, group, sSearch, allServices]);
  const quantity = Number(qty) || 0;
  const total = service && quantity > 0 ? Math.round((service.ratePer1000 / 1000) * quantity * 100) / 100 : 0;
  const shortfall = total > balance ? total - balance : 0;
  const inRange = service ? quantity >= service.min && quantity <= service.max : false;
  const canOrder = !!service && link.trim().length > 5 && quantity > 0 && inRange && shortfall === 0 && !ordering;
  const counts = useMemo(() => ({ platforms: platforms.length, services: allServices.length }), [platforms.length, allServices.length]);

  function selectPlatform(id: string) { if (id !== platformId) { setPlatformId(id); setGroup(null); setServiceId(null); } setPSearch(""); setPicker(null); }
  async function pasteLink() { try { const text = await navigator.clipboard.readText(); if (text) setLink(text.trim()); } catch { /* clipboard unavailable */ } }
  async function placeOrder() {
    if (!canOrder || !service) return;
    setOrdering(true); setOrderError("");
    try {
      const supabase = createBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sign in to place a boost order.");
      const res = await fetch("/api/boost/order", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ serviceId: service.id, link: link.trim(), quantity }) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.ok === false) throw new Error(result.error || "Order failed. Please retry.");
      const ord = result.order || {};
      setPlaced(prev => [{ id: String(ord.providerOrderId || ord.id || Date.now()), service: service.name, speed: service.speed, qty: quantity, total: Number(ord.amount) || total, status: String(ord.status || "processing"), link: link.trim(), platform: platform?.name }, ...prev]);
      setLink(""); setQty("");
      try { await refreshUser(); } catch { /* wallet refresh is non-critical */ }
    } catch (e) { setOrderError(e instanceof Error ? e.message : "Order failed"); }
    finally { setOrdering(false); }
  }

  return <main className="boost-page">
    <header className="boost-topbar"><button type="button" onClick={() => history.back()} className="boost-back" aria-label="Go back"><ArrowLeft size={18}/></button><div className="boost-title-wrap"><p className="boost-eyebrow">VERNEX DIGITAL · SERVICES</p><h1 className="boost-title">Boost account</h1></div><Link href="/fund" className="boost-wallet-btn"><Wallet size={14}/><span>{formatNaira(balance)}</span></Link></header>
    <section className="boost-hero"><div className="boost-hero-orb orb-one"/><div className="boost-hero-orb orb-two"/><div className="boost-hero-copy"><span className="boost-hero-kicker"><Sparkles size={13}/> GROW WITH CONFIDENCE</span><h2>Real momentum.<br/><span>Made simple.</span></h2><p>Find the right growth service for your audience, then track it all in one place.</p><div className="boost-hero-trust"><span><ShieldCheck size={14}/> Secure checkout</span><span><Zap size={13}/> Live catalog</span></div></div><div className="boost-hero-art" aria-hidden="true"><div className="boost-art-ring ring-a"/><div className="boost-art-ring ring-b"/><div className="boost-art-core"><Rocket size={28}/></div><span className="boost-art-node node-a"><Users size={15}/></span><span className="boost-art-node node-b"><Star size={14}/></span><span className="boost-art-node node-c"><Zap size={14}/></span></div></section>
    <section className="boost-wallet-strip"><div className="boost-wallet-icon"><Wallet size={17}/></div><div className="boost-wallet-copy"><span>Available balance</span><strong>{formatNaira(balance)}</strong></div><Link href="/fund" className="boost-fund-link">Add funds <ArrowLeft size={13}/></Link></section>
    <div className="boost-catalog-line"><div><h2>Build your order</h2><p>Choose a platform, category and service.</p></div><span className="boost-catalog-badge"><span className="live-dot"/> {catalogLoading ? "Syncing catalog" : `${counts.platforms} platforms · ${counts.services.toLocaleString()} services`}</span></div>
    {catalogLoading && <div className="boost-notice"><RefreshCw size={16} className="boost-spin"/> Connecting to live service catalog…</div>}
    {catalogError && <div className="boost-notice notice-error"><CircleAlert size={16}/><span>{catalogError}</span><button type="button" onClick={() => void loadCatalog()}>Try again</button></div>}
    {orderError && <div className="boost-notice notice-error"><CircleAlert size={16}/><span>{orderError}</span><button type="button" onClick={() => setOrderError("")} aria-label="Dismiss"><X size={15}/></button></div>}
    <div className="boost-layout"><div className="boost-main-column">
      <section className="boost-card boost-flow-card"><div className="boost-card-heading"><span className="boost-step">01</span><div><h3>Select your service</h3><p>Start by choosing where you want to grow.</p></div></div><div className="boost-form-grid"><FormRow label="Platform" value={platform?.name ?? null} placeholder="Choose a platform" icon={platform ? <PlatformMark platform={platform.id} size={19}/> : <Users size={17}/>} onClick={() => { setPSearch(""); setPicker("platform"); }} disabled={catalogLoading || !platforms.length}/><FormRow label="Category" value={platformId ? (group ?? "All Services") : null} placeholder={platformId ? "Choose a category" : "Select platform first"} icon={<Folder size={17}/>} onClick={() => { if (platformId) { setCSearch(""); setPicker("category"); } }} disabled={!platformId}/><FormRow label="Service" value={service?.name ?? null} placeholder={platformId ? "Choose a service" : "Select platform first"} icon={<Star size={17}/>} onClick={() => { if (platformId) { setSSearch(""); setPicker("service"); } }} disabled={!platformId}/></div>{service && <div className="boost-service-meta"><span><Clock3 size={13}/>{service.speed || "Delivery varies"}</span><span>Min {formatQty(service.min)}</span><span>Max {formatQty(service.max)}</span>{service.refill ? <span className="meta-refill">Refill included</span> : null}</div>}</section>
      {service && <section className="boost-card boost-details-card"><div className="boost-card-heading"><span className="boost-step">02</span><div><h3>Order details</h3><p>Enter the target and the quantity you need.</p></div></div><div className="boost-input-section"><Label>Target URL</Label><div className="boost-input-wrap"><Link2 size={17}/><input value={link} onChange={e => setLink(e.target.value)} placeholder={platform?.placeholder || "Paste a public profile or post URL"} aria-label="Target URL"/><button type="button" onClick={pasteLink} className="boost-paste"><ClipboardPaste size={14}/> Paste</button></div>{platform?.linkHint && <p className="boost-field-hint">{platform.linkHint}</p>}</div><div className="boost-input-section"><Label>Quantity</Label><div className="boost-qty-wrap"><span className="qty-hash">#</span><input value={qty} onChange={e => setQty(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder={`From ${formatQty(service.min)}`} aria-label="Quantity"/><span className="qty-range">{formatQty(service.min)}–{formatQty(service.max)}</span>{qty && <button type="button" aria-label="Clear quantity" onClick={() => setQty("")}><X size={14}/></button>}</div><div className="boost-qty-chips">{QTY_CHIPS.filter(q => q >= service.min && q <= service.max).map(q => <button type="button" key={q} className={Number(qty) === q ? "active" : ""} onClick={() => setQty(String(q))}>{formatQty(q)}</button>)}</div></div></section>}
      <section className="boost-card boost-summary-card"><div className="boost-summary-heading"><div><span className="boost-summary-label">ORDER SUMMARY</span><h3>{service ? service.name : "Your order at a glance"}</h3></div>{service && <span className="boost-speed-chip"><Zap size={12}/>{service.speed || "Standard"}</span>}</div>{!service || quantity === 0 ? <div className="boost-summary-empty"><span><ListOrdered size={18}/></span><p>Select a service and quantity to see your total.</p></div> : <div className="boost-summary-rows"><div><span>Rate per 1,000</span><strong>{formatNaira(service.ratePer1000)}</strong></div><div><span>Quantity</span><strong>{formatQty(quantity)}</strong></div><div><span>Estimated delivery</span><strong>{service.speed || "Varies by service"}</strong></div></div>}<div className="boost-summary-total"><div><span>Total to pay</span><strong>{formatNaira(total)}</strong></div><div className="boost-summary-balance"><span>Wallet balance</span><strong>{formatNaira(balance)}</strong></div></div>{service && quantity > 0 && !inRange && <p className="boost-inline-warning">Quantity must be between {formatQty(service.min)} and {formatQty(service.max)}.</p>}{shortfall > 0 && <Link href="/fund" className="boost-submit boost-submit-fund">Add {formatNaira(shortfall)} to continue</Link>}{shortfall <= 0 && <button type="button" onClick={placeOrder} disabled={!canOrder} className="boost-submit"><span>{ordering ? "Placing your order…" : "Place boost order"}</span>{ordering ? <RefreshCw size={16} className="boost-spin"/> : <ArrowLeft size={16}/>}</button>}<p className="boost-secure-note"><ShieldCheck size={13}/> Your order is checked against the live catalog before payment.</p></section>
      </div><aside className="boost-side-column"><section className="boost-tip-card"><span className="tip-icon"><Info size={16}/></span><div><h3>Quick tip</h3><p>Use a public URL that matches your chosen service. Private or restricted accounts may not be eligible.</p></div></section><section className="boost-trust-card"><h3>Designed for peace of mind</h3><div><ShieldCheck size={16}/><span><b>Verified pricing</b><small>Price validated on our server at checkout.</small></span></div><div><Zap size={16}/><span><b>Live availability</b><small>Services are synced from our provider.</small></span></div><div><Wallet size={16}/><span><b>Wallet protected</b><small>Clear charges and order records.</small></span></div></section></aside></div>
    <section className="boost-orders-card"><div className="boost-orders-head"><div><span className="boost-summary-label">ACTIVITY</span><h2>Recent boost orders</h2></div><span className="boost-order-count">{placed.length} {placed.length === 1 ? "order" : "orders"}</span></div>{placed.length === 0 ? <div className="boost-orders-empty"><span><ListOrdered size={20}/></span><p>Your new orders will appear here after checkout.</p></div> : <div className="boost-orders-list">{placed.map(o => <article className="boost-order-row" key={o.id}><span className="boost-order-mark"><PlatformMark platform={o.platform || "social"} size={19}/></span><div className="boost-order-info"><strong>{o.service}</strong><span>#{o.id} · {o.speed || "Standard"}</span><a href={o.link} target="_blank" rel="noreferrer">{o.link}</a></div><span className="boost-order-qty">{formatQty(o.qty)}</span><strong className="boost-order-cost">{formatNaira(o.total)}</strong><span className={`boost-order-status status-${o.status.toLowerCase()}`}>{o.status}</span></article>)}</div>}</section>
    <p className="boost-footnote"><ShieldCheck size={13}/> Prices are verified live when your order is submitted.</p>
    <PickerPage title="Choose platform" open={picker === "platform"} onClose={() => setPicker(null)} search={pSearch} onSearch={setPSearch}>{filteredPlatforms.map(p => <button key={p.id} type="button" onClick={() => selectPlatform(p.id)} className={`boost-picker-item ${platformId === p.id ? "selected" : ""}`}><span className="boost-picker-mark" style={{ background: `${p.color}14`, color: p.color }}><PlatformMark platform={p.id} size={22}/></span><span className="boost-picker-main"><strong>{p.name}</strong><small>{formatQty(allServices.filter(s => s.categoryId === p.id).length)} services available</small></span>{platformId === p.id ? <Check size={17}/> : <ChevronDown size={16}/>}</button>)}{!filteredPlatforms.length && <p className="boost-no-results">No platforms found.</p>}</PickerPage>
    <PickerPage title="Choose category" open={picker === "category"} onClose={() => setPicker(null)} search={cSearch} onSearch={setCSearch}>{categories.map(c => { const active = (group ?? "All Services") === c; const count = c === "All Services" ? allServices.filter(s => s.categoryId === platformId).length : allServices.filter(s => s.categoryId === platformId && s.group === c).length; return <button key={c} type="button" onClick={() => { setGroup(c === "All Services" ? null : c); setServiceId(null); setPicker(null); }} className={`boost-picker-item ${active ? "selected" : ""}`}><span className="boost-picker-mark category-mark"><Folder size={18}/></span><span className="boost-picker-main"><strong>{c}</strong><small>{formatQty(count)} services</small></span>{active && <Check size={17}/>}</button>; })}{!categories.length && <p className="boost-no-results">No categories found.</p>}</PickerPage>
    <PickerPage title="Choose service" open={picker === "service"} onClose={() => setPicker(null)} search={sSearch} onSearch={setSSearch}>{services.map(s => <button key={s.id} type="button" onClick={() => { setServiceId(s.id); setQty(""); setPicker(null); }} className={`boost-service-item ${serviceId === s.id ? "selected" : ""}`}><span className="boost-service-check"><Check size={13}/></span><span className="boost-service-option"><strong>{s.name}</strong><small>{s.speed || "Delivery varies"} · Min {formatQty(s.min)} · Max {formatQty(s.max)}</small></span><span className="boost-service-rate">{formatNaira(s.ratePer1000)}<small>/ 1K</small></span></button>)}{!services.length && <p className="boost-no-results">No services match this category.</p>}</PickerPage>
  </main>;
}
