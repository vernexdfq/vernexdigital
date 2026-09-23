"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

export default function AdminSettingsPage() {
  const [panelName, setPanelName] = useState("Vernex Digital");
  const [primaryColor, setPrimaryColor] = useState("#1877F2");
  const [supportWhatsApp, setSupportWhatsApp] = useState(
    "https://wa.me/2349164159443"
  );
  const [supportTelegram, setSupportTelegram] = useState(
    "https://t.me/vernexdigital_support"
  );
  const [supportEmail, setSupportEmail] = useState("support@vernexdigital.com");
  const [paystackPublic, setPaystackPublic] = useState("");
  const [paystackSecret, setPaystackSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPwd, setShowAdminPwd] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookUrl = "https://ital.vercel.app/api/webhooks/paystack";

  function flash(section: string) {
    setSaved(section);
    setTimeout(() => setSaved(null), 2000);
  }

  function copyWebhook() {
    navigator.clipboard?.writeText(webhookUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function saveSecurity() {
    setSecurityError("");
    setSecurityLoading(true);
    try {
      if (!adminEmail.trim().includes("@")) {
        setSecurityError("Enter a valid admin email");
        setSecurityLoading(false);
        return;
      }
      if (adminPassword.length < 8) {
        setSecurityError("Password must be at least 8 characters");
        setSecurityLoading(false);
        return;
      }

      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch("/api/admin/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          email: adminEmail.trim().toLowerCase(),
          password: adminPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setSecurityError(json.error || "Could not save password");
        setSecurityLoading(false);
        return;
      }

      setAdminPassword("");
      flash("security");
      setSecurityLoading(false);
    } catch {
      setSecurityError("Something went wrong");
      setSecurityLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-20">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#E2E8F0] px-4 h-14 flex items-center gap-3">
        <Link href="/admin" className="text-[#64748B]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-base font-semibold text-[#0F172A]">Settings</h1>
      </header>

      <div className="px-4 pt-4 max-w-lg mx-auto space-y-5">
        <section className="bg-white border border-[#E2E8F0] rounded-[14px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#0F172A]">A. Branding</p>
            {saved === "branding" && (
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <Check size={12} /> Saved
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B]">
            Customers only see your brand on the white-label front end.
          </p>

          <label className="block">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase">Panel name</span>
            <input
              value={panelName}
              onChange={(e) => setPanelName(e.target.value)}
              className="mt-1.5 w-full h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase">Primary color</span>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-11 h-11 rounded-[10px] border border-[#E2E8F0] cursor-pointer"
              />
              <input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2] font-mono"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase">Logo URL</span>
            <input
              placeholder="https://… or Drive link"
              className="mt-1.5 w-full h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase">WhatsApp support</span>
            <input
              value={supportWhatsApp}
              onChange={(e) => setSupportWhatsApp(e.target.value)}
              placeholder="https://wa.me/234… or channel link"
              className="mt-1.5 w-full h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase">Telegram support</span>
            <input
              value={supportTelegram}
              onChange={(e) => setSupportTelegram(e.target.value)}
              placeholder="https://t.me/…"
              className="mt-1.5 w-full h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase">Support email</span>
            <input
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="mt-1.5 w-full h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
            />
          </label>

          <button
            type="button"
            onClick={() => flash("branding")}
            className="w-full h-11 rounded-full bg-[#1877F2] text-white text-sm font-semibold"
          >
            Save branding
          </button>
        </section>

        <section className="bg-white border border-[#E2E8F0] rounded-[14px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#0F172A]">B. Payments</p>
            {saved === "payments" && (
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <Check size={12} /> Saved
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B]">
            Payments go to the panel owner’s merchant account. Keys are stored server-side when backend is live.
          </p>

          <label className="block">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase">Paystack public key</span>
            <input
              value={paystackPublic}
              onChange={(e) => setPaystackPublic(e.target.value)}
              placeholder="pk_test_… or pk_live_…"
              className="mt-1.5 w-full h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2] font-mono"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase">Paystack secret key</span>
            <div className="mt-1.5 relative">
              <input
                type={showSecret ? "text" : "password"}
                value={paystackSecret}
                onChange={(e) => setPaystackSecret(e.target.value)}
                placeholder="sk_test_… or sk_live_…"
                className="w-full h-11 pl-3 pr-10 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-[#0F172A]">Test mode</span>
            <button
              type="button"
              onClick={() => setTestMode((v) => !v)}
              className={`w-11 h-6 rounded-full transition-colors ${
                testMode ? "bg-[#1877F2]" : "bg-[#CBD5E1]"
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  testMode ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="bg-[#F8FAFC] rounded-[12px] p-3">
            <p className="text-[11px] font-semibold text-[#64748B] uppercase">Webhook URL</p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 text-[11px] text-[#0F172A] break-all">{webhookUrl}</code>
              <button
                type="button"
                onClick={copyWebhook}
                className="shrink-0 h-8 px-2.5 rounded-full bg-[#EFF6FF] text-[#1877F2] text-xs font-semibold flex items-center gap-1"
              >
                <Copy size={12} /> {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => flash("payments")}
            className="w-full h-11 rounded-full bg-[#1877F2] text-white text-sm font-semibold"
          >
            Save payment keys
          </button>
        </section>

        <section className="bg-white border border-[#E2E8F0] rounded-[14px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#0F172A]">C. Security</p>
            {saved === "security" && (
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <Check size={12} /> Saved
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B]">
            Set the admin email and password used on <strong>/admin/login</strong>. If you
            forget the password, use “Forgot password?” there — a reset link is sent to this
            email.
          </p>

          <label className="block">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase">Admin email</span>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="you@vernexdigital.com"
              className="mt-1.5 w-full h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase">Admin password</span>
            <div className="mt-1.5 relative">
              <input
                type={showAdminPwd ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full h-11 pl-3 pr-10 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
              />
              <button
                type="button"
                onClick={() => setShowAdminPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              >
                {showAdminPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {securityError && (
            <p className="text-[13px] font-medium text-red-600">{securityError}</p>
          )}

          <button
            type="button"
            onClick={saveSecurity}
            disabled={securityLoading}
            className="w-full h-11 rounded-full bg-[#1877F2] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {securityLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save security"
            )}
          </button>
        </section>

        <section className="bg-white border border-[#E2E8F0] rounded-[14px] p-4 space-y-2">
          <p className="text-sm font-semibold text-[#0F172A]">D. Panel plan</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#64748B]">Plan</span>
            <span className="text-sm font-semibold text-[#1877F2]">Child Panel</span>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed pt-1">
            API, pricing and renewal are handled with Verxor.
          </p>
        </section>
      </div>
    </div>
  );
}
