"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Gift,
  Lock,
  Shield,
  FileText,
  Headphones,
  HelpCircle,
  MessageSquare,
  ChevronRight,
  Copy,
  Check,
  LogOut,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

const DEMO_USER = {
  fullName: "Denny Kay",
  email: "dennygodzilla0@gmail.com",
  phone: "08141620644",
  referral: "E2637BDA",
  memberSince: "June 2026",
  initials: "DK",
};

export default function ProfilePage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pinForm, setPinForm] = useState({ password: "", pin: "", confirm: "" });
  const [pwdForm, setPwdForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [show, setShow] = useState({ password: false, pin: false, current: false, next: false });
  const [pinMsg, setPinMsg] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");

  function copyReferral() {
    navigator.clipboard?.writeText(DEMO_USER.referral).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleLogout() {
    try {
      const { createBrowserClient } = await import("@/lib/supabase/client");
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
    } catch {}
    try {
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch {}
    router.replace("/");
  }

  function submitPin() {
    if (!pinForm.password || pinForm.pin.length < 4 || pinForm.pin !== pinForm.confirm) {
      setPinMsg("Check password and PIN (min 4 digits, must match).");
      return;
    }
    setPinMsg("PIN updated successfully.");
    setTimeout(() => {
      setPinOpen(false);
      setPinForm({ password: "", pin: "", confirm: "" });
      setPinMsg("");
    }, 1200);
  }

  function submitPwd() {
    if (!pwdForm.current || pwdForm.next.length < 6 || pwdForm.next !== pwdForm.confirm) {
      setPwdMsg("Enter current password and a new password (min 6 chars, must match).");
      return;
    }
    setPwdMsg("Password updated successfully.");
    setTimeout(() => {
      setPwdOpen(false);
      setPwdForm({ current: "", next: "", confirm: "" });
      setPwdMsg("");
    }, 1200);
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-36">
      <div className="px-4 pt-5 pb-8">
        <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-[#0B1F4D] via-[#123A7A] to-[#1877F2] p-5 text-white shadow-lg">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_80%_20%,#60A5FA,transparent_50%)]" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-lg font-bold tracking-wide backdrop-blur-sm">
              {DEMO_USER.initials}
            </div>
            <div>
              <p className="text-lg font-semibold leading-tight">{DEMO_USER.fullName}</p>
              <p className="text-xs text-white/70 mt-0.5">Member since {DEMO_USER.memberSince}</p>
            </div>
          </div>
        </div>

        <p className="mt-6 mb-2 text-[11px] font-semibold tracking-[0.14em] text-[#64748B] uppercase">
          Account Information
        </p>
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] overflow-hidden divide-y divide-[#F1F5F9]">
          <InfoRow icon={<User size={16} className="text-[#1877F2]" />} label="Full Name" value={DEMO_USER.fullName} bg="bg-[#EFF6FF]" />
          <InfoRow icon={<Mail size={16} className="text-[#1877F2]" />} label="Email" value={DEMO_USER.email} bg="bg-[#EFF6FF]" />
          <InfoRow icon={<Phone size={16} className="text-[#1877F2]" />} label="Phone" value={DEMO_USER.phone} bg="bg-[#EFF6FF]" />
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center shrink-0">
              <Gift size={16} className="text-[#1877F2]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold tracking-wide text-[#94A3B8] uppercase">Referral Code</p>
              <p className="text-sm font-semibold text-[#0F172A] tracking-wider">{DEMO_USER.referral}</p>
            </div>
            <button
              type="button"
              onClick={copyReferral}
              className="h-8 px-3 rounded-full bg-[#EFF6FF] text-[#1877F2] text-xs font-semibold flex items-center gap-1.5"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <p className="mt-6 mb-2 text-[11px] font-semibold tracking-[0.14em] text-[#64748B] uppercase">
          Security
        </p>
        <div className="space-y-2.5">
          <MenuRow
            icon={<Lock size={18} className="text-[#F59E0B]" />}
            iconBg="bg-[#FFF7ED]"
            label="Change PIN"
            onClick={() => setPinOpen(true)}
          />
          <MenuRow
            icon={<Shield size={18} className="text-[#10B981]" />}
            iconBg="bg-[#ECFDF5]"
            label="Change Password"
            onClick={() => setPwdOpen(true)}
          />
          <Link href="/profile/privacy" className="block">
            <MenuRow
              icon={<FileText size={18} className="text-[#1877F2]" />}
              iconBg="bg-[#EFF6FF]"
              label="Privacy Policy"
            />
          </Link>
        </div>

        <p className="mt-6 mb-2 text-[11px] font-semibold tracking-[0.14em] text-[#64748B] uppercase">
          Support
        </p>
        <div className="space-y-2.5">
          <Link href="/profile/support" className="block">
            <MenuRow
              icon={<Headphones size={18} className="text-[#1877F2]" />}
              iconBg="bg-[#EFF6FF]"
              label="Help & Support"
            />
          </Link>
          <Link href="/profile/faqs" className="block">
            <MenuRow
              icon={<HelpCircle size={18} className="text-[#1877F2]" />}
              iconBg="bg-[#EFF6FF]"
              label="Frequently Asked Questions"
            />
          </Link>
          <Link href="/profile/feedback" className="block">
            <MenuRow
              icon={<MessageSquare size={18} className="text-[#1877F2]" />}
              iconBg="bg-[#EFF6FF]"
              label="Feedback"
            />
          </Link>
        </div>

        <div className="h-24" />
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-3 pt-2 bg-gradient-to-t from-[#F4F7FB] via-[#F4F7FB] to-transparent">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full h-14 rounded-full bg-[#1877F2] text-white text-base font-bold flex items-center justify-center gap-2.5 shadow-[0_10px_28px_rgba(24,119,242,0.4)] active:scale-[0.98] transition"
        >
          <LogOut size={20} strokeWidth={2.4} />
          Log Out
        </button>
      </div>

      {pinOpen && (
        <Sheet onClose={() => setPinOpen(false)} title="Change PIN">
          <p className="text-sm text-[#64748B] mb-4">
            Enter your account password to set a new 4–6 digit PIN.
          </p>
          <Field
            label="Account Password"
            type={show.password ? "text" : "password"}
            value={pinForm.password}
            onChange={(v) => setPinForm((p) => ({ ...p, password: v }))}
            right={
              <button type="button" onClick={() => setShow((s) => ({ ...s, password: !s.password }))}>
                {show.password ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <Field
            label="New PIN"
            type={show.pin ? "text" : "password"}
            value={pinForm.pin}
            onChange={(v) => setPinForm((p) => ({ ...p, pin: v.replace(/\D/g, "").slice(0, 6) }))}
            inputMode="numeric"
            right={
              <button type="button" onClick={() => setShow((s) => ({ ...s, pin: !s.pin }))}>
                {show.pin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <Field
            label="Confirm PIN"
            type="password"
            value={pinForm.confirm}
            onChange={(v) => setPinForm((p) => ({ ...p, confirm: v.replace(/\D/g, "").slice(0, 6) }))}
            inputMode="numeric"
          />
          {pinMsg && (
            <p className={`text-sm mb-3 ${pinMsg.includes("success") ? "text-emerald-600" : "text-red-500"}`}>
              {pinMsg}
            </p>
          )}
          <button
            type="button"
            onClick={submitPin}
            className="w-full h-12 rounded-full bg-[#1877F2] text-white text-sm font-semibold"
          >
            Update PIN
          </button>
        </Sheet>
      )}

      {pwdOpen && (
        <Sheet onClose={() => setPwdOpen(false)} title="Change Password">
          <p className="text-sm text-[#64748B] mb-4">
            Enter your current password, then choose a new one. If you forgot your password, use the login
            reset flow instead.
          </p>
          <Field
            label="Current Password"
            type={show.current ? "text" : "password"}
            value={pwdForm.current}
            onChange={(v) => setPwdForm((p) => ({ ...p, current: v }))}
            right={
              <button type="button" onClick={() => setShow((s) => ({ ...s, current: !s.current }))}>
                {show.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <Field
            label="New Password"
            type={show.next ? "text" : "password"}
            value={pwdForm.next}
            onChange={(v) => setPwdForm((p) => ({ ...p, next: v }))}
            right={
              <button type="button" onClick={() => setShow((s) => ({ ...s, next: !s.next }))}>
                {show.next ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <Field
            label="Confirm New Password"
            type="password"
            value={pwdForm.confirm}
            onChange={(v) => setPwdForm((p) => ({ ...p, confirm: v }))}
          />
          {pwdMsg && (
            <p className={`text-sm mb-3 ${pwdMsg.includes("success") ? "text-emerald-600" : "text-red-500"}`}>
              {pwdMsg}
            </p>
          )}
          <button
            type="button"
            onClick={submitPwd}
            className="w-full h-12 rounded-full bg-[#1877F2] text-white text-sm font-semibold"
          >
            Update Password
          </button>
        </Sheet>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-wide text-[#94A3B8] uppercase">{label}</p>
        <p className="text-sm font-medium text-[#0F172A] truncate">{value}</p>
      </div>
    </div>
  );
}

function MenuRow({
  icon,
  iconBg,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  onClick?: () => void;
}) {
  const inner = (
    <div className="w-full bg-white rounded-[14px] border border-[#E2E8F0] px-4 py-3.5 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>{icon}</div>
      <span className="flex-1 text-sm font-medium text-[#0F172A] text-left">{label}</span>
      <ChevronRight size={18} className="text-[#94A3B8]" />
    </div>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full">
        {inner}
      </button>
    );
  }
  return inner;
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <div className="relative bg-white rounded-t-[20px] px-5 pt-4 pb-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-[#0F172A]">{title}</h2>
          <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center text-[#64748B]">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  right,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "numeric" | "text";
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label className="text-[11px] font-medium text-[#64748B]">{label}</label>
      <div className="mt-1 relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={inputMode}
          className="w-full h-12 px-3 pr-10 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#0F172A]"
        />
        {right && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">{right}</div>}
      </div>
    </div>
  );
}
