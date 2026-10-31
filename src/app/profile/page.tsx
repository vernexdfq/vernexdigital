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
  Loader2,
} from "lucide-react";
import { useUser } from "@/lib/useUser";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, loading, initials, memberSince } = useUser();
  const [copied, setCopied] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pinForm, setPinForm] = useState({ password: "", pin: "", confirm: "" });
  const [pwdForm, setPwdForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [show, setShow] = useState({
    password: false,
    pin: false,
    current: false,
    next: false,
  });
  const [pinMsg, setPinMsg] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");

  function copyReferral() {
    if (!profile?.referral_code) return;
    navigator.clipboard?.writeText(profile.referral_code).catch(() => {});
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
    if (
      !pinForm.password ||
      pinForm.pin.length < 4 ||
      pinForm.pin !== pinForm.confirm
    ) {
      setPinMsg("Check password and PIN (min 4 digits, must match).");
      return;
    }
    setPinMsg("PIN update will be available when the security API is live.");
  }

  function submitPwd() {
    if (
      !pwdForm.current ||
      pwdForm.next.length < 6 ||
      pwdForm.next !== pwdForm.confirm
    ) {
      setPwdMsg(
        "Enter current password and a new password (min 6 chars, must match)."
      );
      return;
    }
    setPwdMsg("Password update will be available when the security API is live.");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] pb-24 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1877F2]" size={28} />
      </div>
    );
  }

  const fullName = profile?.full_name || "User";
  const email = profile?.email || "—";
  const phone = profile?.phone || "—";
  const referral = profile?.referral_code || "—";

  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-24">
      <div className="px-4 pt-5 pb-8 space-y-6">
        {/* Header card */}
        <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-[#0B1B3A] via-[#0F2748] to-[#123A7A] p-5 text-white shadow-[0_10px_28px_rgba(11,27,58,0.28)]">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_80%_20%,#60A5FA,transparent_50%)]" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-lg font-bold tracking-wide backdrop-blur-sm">
              {initials}
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">{fullName}</p>
              {memberSince ? (
                <p className="text-xs text-white/70 mt-0.5">Member since {memberSince}</p>
              ) : (
                <p className="text-xs text-white/70 mt-0.5">Vernex member</p>
              )}
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div>
          <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-[#4D5C70] uppercase">
            Account Information
          </p>
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.06)] overflow-hidden divide-y divide-[#F1F5F9]">
            <InfoRow
              icon={<User size={16} className="text-[#1877F2]" />}
              label="Full Name"
              value={fullName}
              bg="bg-[#EFF6FF]"
            />
            <InfoRow
              icon={<Mail size={16} className="text-[#1877F2]" />}
              label="Email"
              value={email}
              bg="bg-[#EFF6FF]"
            />
            <InfoRow
              icon={<Phone size={16} className="text-[#1877F2]" />}
              label="Phone"
              value={phone}
              bg="bg-[#EFF6FF]"
            />
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center shrink-0">
                <Gift size={16} className="text-[#1877F2]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold tracking-wide text-[#64748B] uppercase">
                  Referral Code
                </p>
                <p className="text-sm font-bold text-[#0F172A] tracking-wider">{referral}</p>
              </div>
              <button
                type="button"
                onClick={copyReferral}
                className="h-8 px-3.5 rounded-full bg-[#1877F2] text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_2px_8px_rgba(24,119,242,0.30)] transition-all duration-150 ease-out active:scale-[0.94] active:translate-y-[1px] active:shadow-none"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Security */}
        <div>
          <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-[#4D5C70] uppercase">
            Security
          </p>
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.06)] overflow-hidden divide-y divide-[#F1F5F9]">
            <MenuRow
              icon={<Lock size={18} className="text-[#D97706]" />}
              iconBg="bg-[#FFF3DF]"
              label="Change PIN"
              onClick={() => setPinOpen(true)}
            />
            <MenuRow
              icon={<Shield size={18} className="text-[#059669]" />}
              iconBg="bg-[#E3F4EC]"
              label="Change Password"
              onClick={() => setPwdOpen(true)}
            />
            <Link href="/profile/privacy">
              <MenuRow
                icon={<FileText size={18} className="text-[#1877F2]" />}
                iconBg="bg-[#EFF6FF]"
                label="Privacy Policy"
              />
            </Link>
          </div>
        </div>

        {/* Support */}
        <div>
          <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-[#4D5C70] uppercase">
            Support
          </p>
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.06)] overflow-hidden divide-y divide-[#F1F5F9]">
            <Link href="/profile/support">
              <MenuRow
                icon={<Headphones size={18} className="text-[#1877F2]" />}
                iconBg="bg-[#EFF6FF]"
                label="Help & Support"
              />
            </Link>
            <Link href="/profile/faqs">
              <MenuRow
                icon={<HelpCircle size={18} className="text-[#1877F2]" />}
                iconBg="bg-[#EFF6FF]"
                label="Frequently Asked Questions"
              />
            </Link>
            <Link href="/profile/feedback">
              <MenuRow
                icon={<MessageSquare size={18} className="text-[#1877F2]" />}
                iconBg="bg-[#EFF6FF]"
                label="Feedback"
              />
            </Link>
          </div>
        </div>

        {/* Log Out — prominent, impossible to miss */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full h-[52px] rounded-[14px] bg-[#E5322D] text-white text-[15px] font-bold flex items-center justify-center gap-2.5 shadow-[0_8px_24px_rgba(229,50,45,0.32)] transition-all duration-150 ease-out hover:bg-[#D32722] active:scale-[0.98] active:translate-y-[1px] active:shadow-none"
        >
          <LogOut size={19} strokeWidth={2.4} />
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
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, password: !s.password }))}
              >
                {show.password ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <Field
            label="New PIN"
            type={show.pin ? "text" : "password"}
            value={pinForm.pin}
            onChange={(v) =>
              setPinForm((p) => ({
                ...p,
                pin: v.replace(/\D/g, "").slice(0, 6),
              }))
            }
            inputMode="numeric"
            right={
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, pin: !s.pin }))}
              >
                {show.pin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <Field
            label="Confirm PIN"
            type="password"
            value={pinForm.confirm}
            onChange={(v) =>
              setPinForm((p) => ({
                ...p,
                confirm: v.replace(/\D/g, "").slice(0, 6),
              }))
            }
            inputMode="numeric"
          />
          {pinMsg && (
            <p
              className={\"text-sm mb-3 \" + (pinMsg.includes(\"success\") || pinMsg.includes(\"live\") ? \"text-emerald-600\" : \"text-red-500\")}
            >
              {pinMsg}
            </p>
          )}
          <button
            type="button"
            onClick={submitPin}
            className="w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-bold shadow-[0_4px_14px_rgba(24,119,242,0.30)] transition-all duration-150 ease-out active:scale-[0.98] active:translate-y-[1px] active:shadow-none"
          >
            Update PIN
          </button>
        </Sheet>
      )}

      {pwdOpen && (
        <Sheet onClose={() => setPwdOpen(false)} title="Change Password">
          <p className="text-sm text-[#64748B] mb-4">
            Enter your current password, then choose a new one.
          </p>
          <Field
            label="Current Password"
            type={show.current ? "text" : "password"}
            value={pwdForm.current}
            onChange={(v) => setPwdForm((p) => ({ ...p, current: v }))}
            right={
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
              >
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
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, next: !s.next }))}
              >
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
            <p
              className={\"text-sm mb-3 \" + (pwdMsg.includes(\"success\") || pwdMsg.includes(\"live\") ? \"text-emerald-600\" : \"text-red-500\")}
            >
              {pwdMsg}
            </p>
          )}
          <button
            type="button"
            onClick={submitPwd}
            className="w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-bold shadow-[0_4px_14px_rgba(24,119,242,0.30)] transition-all duration-150 ease-out active:scale-[0.98] active:translate-y-[1px] active:shadow-none"
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
    <div className="flex items-center gap-3 px-4 py-4">
      <div className={"w-9 h-9 rounded-xl " + bg + " flex items-center justify-center shrink-0"}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-wide text-[#64748B] uppercase">{label}</p>
        <p className="text-sm font-semibold text-[#0F172A] truncate">{value}</p>
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
    <div className="w-full bg-white px-4 py-[13px] flex items-center gap-3 transition-colors duration-150 active:bg-[#F6F9FE]">
      <div className={"w-10 h-10 rounded-xl " + iconBg + " flex items-center justify-center shrink-0"}>
        {icon}
      </div>
      <span className="flex-1 text-sm font-semibold text-[#0F172A] text-left">{label}</span>
      <ChevronRight size={18} className="text-[#94A3B8]" />
    </div>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full active:scale-[0.99] transition-transform duration-150">
        {inner}
      </button>
    );
  }
  return (
    <div className="w-full active:scale-[0.99] transition-transform duration-150">
      {inner}
    </div>
  );
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
      <div className="relative bg-white rounded-t-[20px] px-5 pt-4 pb-8 max-h-[85vh] overflow-y-auto shadow-[0_-8px_40px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-[#0F172A]">{title}</h2>
          <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center text-[#64748B] active:scale-90 transition-transform">
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
      <label className="text-[11px] font-bold text-[#4D5C70]">{label}</label>
      <div className="mt-1.5 relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={inputMode}
          className="w-full h-12 px-3.5 pr-10 rounded-[12px] bg-white border border-[#DCE3EB] shadow-[0_1px_3px_rgba(15,23,42,0.05)] text-sm font-medium text-[#0F172A] outline-none focus:border-[#1877F2] focus:ring-[3px] focus:ring-[#1877F2]/15 transition-all"
        />
        {right && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">{right}</div>
        )}
      </div>
    </div>
  );
}
