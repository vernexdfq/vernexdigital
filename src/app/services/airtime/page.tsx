"use client";

import "./airtime.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Phone,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useUser } from "@/lib/useUser";

type NetworkId = "mtn" | "airtel" | "glo" | "9mobile";
type NetworkOption = { id: NetworkId; label: string; color: string };
type RecentRecipient = { phone: string; networkId: NetworkId | null; lastUsed: number };

const NETWORKS: NetworkOption[] = [
  { id: "mtn", label: "MTN", color: "#FFCC00" },
  { id: "airtel", label: "Airtel", color: "#E60000" },
  { id: "glo", label: "Glo", color: "#00A859" },
  { id: "9mobile", label: "9mobile", color: "#005B38" },
];
const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000, 10000, 20000];
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 50000;
const RECENT_RECIPIENTS_KEY = "vernexdigital_airtime_recent_recipients_v1";
const LOGOS: Record<NetworkId, string> = {
  mtn: "https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/mtn.svg",
  airtel: "https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/airtel.svg",
  glo: "https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/glo.svg",
  "9mobile": "https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/9mobile.svg",
};

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) return `0${digits.slice(3)}`;
  return digits;
}

function detectNetwork(value: string): NetworkId | null {
  const phone = normalizePhone(value);
  if (phone.length < 4) return null;
  const prefix = phone.slice(0, 4);
  const prefixMap: Record<string, NetworkId> = {
    "0803": "mtn", "0806": "mtn", "0703": "mtn", "0706": "mtn", "0810": "mtn", "0813": "mtn", "0814": "mtn", "0816": "mtn", "0903": "mtn", "0906": "mtn", "0913": "mtn", "0916": "mtn", "0704": "mtn",
    "0802": "airtel", "0808": "airtel", "0701": "airtel", "0708": "airtel", "0812": "airtel", "0901": "airtel", "0902": "airtel", "0904": "airtel", "0907": "airtel", "0912": "airtel", "0801": "airtel",
    "0805": "glo", "0807": "glo", "0705": "glo", "0811": "glo", "0815": "glo", "0905": "glo", "0915": "glo",
    "0809": "9mobile", "0817": "9mobile", "0818": "9mobile", "0908": "9mobile", "0909": "9mobile", "0918": "9mobile",
  };
  return prefixMap[prefix] ?? null;
}

function formatPhone(value: string) {
  const phone = normalizePhone(value);
  if (phone.length === 11) return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  return phone;
}

function naira(value: number) {
  return `₦${value.toLocaleString("en-NG")}`;
}

function NetworkLogo({ id }: { id: NetworkId }) {
  const [failed, setFailed] = useState(false);
  const network = NETWORKS.find((item) => item.id === id)!;
  return (
    <span className="air-network-logo" style={{ "--network-color": network.color } as React.CSSProperties}>
      {failed ? <span className={`air-logo-fallback air-logo-${id}`}>{id === "9mobile" ? "9" : network.label.slice(0, 1)}</span> : (
        <img src={LOGOS[id]} alt={`${network.label} logo`} onError={() => setFailed(true)} />
      )}
    </span>
  );
}

function PromoArtwork() {
  return (
    <svg className="air-tower-svg" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="air-phone-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4F46E5" /><stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>
        <linearGradient id="air-glow-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity=".8" /><stop offset="100%" stopColor="#818CF8" stopOpacity=".2" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="50" r="35" fill="url(#air-glow-gradient)" />
      <g transform="translate(45 12) rotate(8 25 43)">
        <rect width="50" height="86" rx="10" fill="url(#air-phone-gradient)" stroke="#6366F1" strokeWidth="2" />
        <rect x="4" y="8" width="42" height="70" rx="6" fill="#0B132B" opacity=".9" />
        <path d="M16 48c4-4 14-4 18 0M20 54c2.5-2.5 7.5-2.5 10 0" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="25" cy="59" r="2" fill="#38BDF8" />
        <rect x="20" y="4" width="10" height="2" rx="1" fill="#475569" />
      </g>
      <circle cx="25" cy="30" r="2.5" fill="#38BDF8" /><circle cx="15" cy="50" r="1.5" fill="#818CF8" /><circle cx="35" cy="75" r="2" fill="#38BDF8" />
    </svg>
  );
}

export default function AirtimePage() {
  const { profile, wallet, loading: userLoading } = useUser();
  const [phone, setPhone] = useState("");
  const [networkId, setNetworkId] = useState<NetworkId | null>(null);
  const [amountText, setAmountText] = useState("");
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false);
  const [recentRecipients, setRecentRecipients] = useState<RecentRecipient[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_RECIPIENTS_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentRecipients(parsed.filter((item): item is RecentRecipient =>
            item && typeof item.phone === "string" && normalizePhone(item.phone).length === 11,
          ).slice(0, 3));
        }
      }
    } catch { /* Ignore malformed local history and keep the form usable. */ }
  }, []);

  const registeredPhone = useMemo(() => {
    const normalized = normalizePhone(profile?.phone ?? "");
    return normalized.length === 11 ? normalized : "";
  }, [profile?.phone]);
  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone]);
  const selectedNetwork = networkId ?? detectNetwork(normalizedPhone);
  const selectedNetworkInfo = NETWORKS.find((item) => item.id === selectedNetwork);
  const amount = Number(amountText.replace(/,/g, "")) || 0;
  const validPhone = normalizedPhone.length === 11 && normalizedPhone.startsWith("0");
  const validAmount = amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;
  const balance = Number(wallet.balance) || 0;
  const insufficient = validAmount && amount > balance;
  const readyToConfirm = Boolean(selectedNetwork && validPhone && validAmount && !insufficient);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const choosePhone = useCallback((value: string, suppliedNetwork?: NetworkId | null) => {
    const clean = normalizePhone(value);
    setPhone(clean);
    setNetworkId(suppliedNetwork ?? detectNetwork(clean));
    setRecipientPickerOpen(false);
  }, []);

  const saveRecentRecipient = useCallback((number: string, network: NetworkId) => {
    const updated = [
      { phone: number, networkId: network, lastUsed: Date.now() },
      ...recentRecipients.filter((recipient) => recipient.phone !== number),
    ].slice(0, 3);
    setRecentRecipients(updated);
    try { localStorage.setItem(RECENT_RECIPIENTS_KEY, JSON.stringify(updated)); } catch { /* Local history is optional. */ }
  }, [recentRecipients]);

  const submitDemoPurchase = () => {
    if (!readyToConfirm || !selectedNetwork) return;
    saveRecentRecipient(normalizedPhone, selectedNetwork);
    setConfirmOpen(false);
    setToast("Airtime purchase submitted (demo)");
    setPhone("");
    setNetworkId(null);
    setAmountText("");
  };

  return (
    <main className="air-page">
      <header className="air-topbar">
        <Link href="/home" className="air-back" aria-label="Back to home"><ArrowLeft size={18} strokeWidth={2.4} /></Link>
        <div className="air-title-wrap"><h1 className="air-title">Buy Airtime</h1><p className="air-subtitle">Instant mobile top-up</p></div>
        <nav className="air-topbar-right" aria-label="Airtime navigation">
          <Link href="/history" className="air-history-link">History</Link>
          <Link href="/fund" className="air-wallet-btn" aria-label="Fund wallet">
            <Wallet size={15} strokeWidth={2.2} /><span className="air-wallet-val">{userLoading ? "₦…" : naira(balance)}</span><Plus size={14} className="air-wallet-plus" />
          </Link>
        </nav>
      </header>

      <section className="air-promo-banner" aria-label="Airtime promotion">
        <div className="air-promo-content">
          <div className="air-promo-badge"><Zap size={11} className="air-promo-zap" /><span>FAST TOP-UP</span></div>
          <h2 className="air-promo-title">Airtime Recharge</h2>
          <p className="air-promo-desc">Top up any major network in moments.</p>
        </div>
        <div className="air-promo-art"><PromoArtwork /></div>
        <div className="air-promo-dots" aria-hidden="true"><span className="dot active" /><span className="dot" /></div>
      </section>

      <section className="air-section" aria-labelledby="network-heading">
        <div className="air-section-head"><h2 id="network-heading">Select Network</h2><p>{selectedNetworkInfo ? `${selectedNetworkInfo.label} selected` : "Choose a provider or enter a number to detect it."}</p></div>
        <div className="air-networks" role="group" aria-label="Mobile network">
          {NETWORKS.map((network) => {
            const selected = selectedNetwork === network.id;
            return <button key={network.id} type="button" className={`air-net${selected ? " selected" : ""}`} aria-pressed={selected} onClick={() => setNetworkId(network.id)}>
              {selected && <span className="air-net-badge"><Check size={11} strokeWidth={3.5} /></span>}
              <span className="air-net-logo-wrap"><NetworkLogo id={network.id} /></span><span className="air-net-label">{network.label}</span>
            </button>;
          })}
        </div>
      </section>

      <section className="air-section air-details" aria-labelledby="details-heading">
        <div className="air-section-head"><h2 id="details-heading">Recharge Details</h2><p>Enter the recipient and choose an amount.</p></div>
        <div className="air-field">
          <div className={`air-input-wrap${phone && !validPhone ? " is-error" : ""}`}>
            <span className="air-input-lead-icon"><Phone size={17} strokeWidth={2.2} /></span>
            <input type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 000 0000" value={phone} onChange={(event) => {
              const next = event.target.value.replace(/[^0-9+]/g, "").slice(0, 14);
              const detected = detectNetwork(next);
              setPhone(next);
              if (detected) setNetworkId(detected);
            }} aria-label="Recipient phone number" />
            {phone && <button type="button" className="air-clear" aria-label="Clear recipient number" onClick={() => { setPhone(""); setNetworkId(null); }}><X size={14} /></button>}
          </div>
          {phone && !validPhone && <p className="air-field-error" role="alert">Enter a valid 11-digit Nigerian number.</p>}
          {phone && validPhone && selectedNetworkInfo && <p className="air-field-success"><CheckCircle2 size={13} /> {selectedNetworkInfo.label} detected from the number.</p>}
          <div className="air-recipient-actions">
            <button type="button" className="air-use-mine" onClick={() => setRecipientPickerOpen(true)}><Sparkles size={13} /> Use My Number</button>
            {recentRecipients.length > 0 && <button type="button" className="air-recent-btn" onClick={() => setRecipientPickerOpen(true)} aria-label="Choose a recent recharge number"><Clock3 size={15} /><span>Recent numbers</span></button>}
          </div>
        </div>

        <div className="air-field">
          <div className="air-input-wrap">
            <span className="air-input-lead-icon"><Wallet size={17} strokeWidth={2.2} /></span><span className="air-naira" aria-hidden="true">₦</span>
            <input type="text" inputMode="numeric" placeholder={`${MIN_AMOUNT} – ${MAX_AMOUNT.toLocaleString("en-NG")}`} value={amountText} onChange={(event) => setAmountText(event.target.value.replace(/[^0-9]/g, ""))} aria-label="Airtime amount in naira" />
            {amountText && <button type="button" className="air-clear" aria-label="Clear amount" onClick={() => setAmountText("")}><X size={14} /></button>}
          </div>
          {amount > 0 && !validAmount && <p className="air-field-error" role="alert">Choose an amount between ₦100 and ₦50,000.</p>}
        </div>

        <div className="air-wallet-strip">
          <div className="air-wallet-strip-left"><Wallet size={14} className="air-strip-ico" /><span>Available balance: <strong>{userLoading ? "Loading…" : naira(balance)}</strong></span></div>
          <Link href="/fund" className="air-strip-fund-btn">Fund Wallet</Link>
        </div>

        <div className="air-quick">
          <span className="air-quick-label">Quick amounts</span>
          <div className="air-quick-grid">
            {QUICK_AMOUNTS.map((value) => <button key={value} type="button" className={`air-chip${amount === value ? " active" : ""}`} aria-pressed={amount === value} onClick={() => setAmountText(String(value))}>{naira(value)}</button>)}
          </div>
        </div>
      </section>

      {amount > 0 && <section className="air-summary" aria-live="polite">
        <div className="air-summary-row"><span>You pay</span><strong>{naira(amount)}</strong></div>
        {insufficient && <div className="air-summary-warn"><span className="air-warn-text"><AlertCircle size={15} /> Insufficient balance. Add {naira(amount - balance)} to continue.</span><Link href="/fund" className="air-warn-fund-link">Fund wallet</Link></div>}
      </section>}

      {insufficient ? <Link href="/fund" className="air-cta air-cta-fund"><Wallet size={18} /> Fund Wallet</Link> : <button type="button" className="air-cta" disabled={!readyToConfirm} onClick={() => setConfirmOpen(true)}><LockKeyhole size={16} /> {readyToConfirm ? "Continue to confirm" : "Enter recipient and amount"}</button>}

      <div className="air-trust"><span className="air-trust-icon"><ShieldCheck size={15} /></span><div className="air-trust-body"><strong>Secure airtime purchase</strong><p>Review the recipient and amount before confirming.</p></div></div>

      {recipientPickerOpen && <div className="air-modal-backdrop" onClick={() => setRecipientPickerOpen(false)}>
        <section className="air-modal-card" role="dialog" aria-modal="true" aria-labelledby="recipient-title" onClick={(event) => event.stopPropagation()}>
          <div className="air-modal-header"><div className="air-modal-title-wrap"><h3 id="recipient-title">Choose a recipient</h3><p>Pick your account number or a recent top-up.</p></div><button type="button" className="air-modal-close" onClick={() => setRecipientPickerOpen(false)} aria-label="Close recipient picker"><X size={17} /></button></div>
          <div className="air-modal-list">
            {registeredPhone && <button type="button" className="air-modal-item" onClick={() => choosePhone(registeredPhone)}><span className="air-modal-item-icon account"><Phone size={18} /></span><span className="air-modal-item-info"><span className="air-modal-item-top"><strong>{formatPhone(registeredPhone)}</strong><span className="air-tag primary">My account</span></span><span className="air-modal-item-sub">Phone number on your account</span></span></button>}
            {recentRecipients.map((recipient) => <button type="button" className="air-modal-item" key={recipient.phone} onClick={() => choosePhone(recipient.phone, recipient.networkId)}><span className="air-modal-item-icon recent"><Clock3 size={18} /></span><span className="air-modal-item-info"><span className="air-modal-item-top"><strong>{formatPhone(recipient.phone)}</strong>{recipient.networkId && <span className={`air-tag net-${recipient.networkId}`}>{NETWORKS.find((network) => network.id === recipient.networkId)?.label}</span>}</span><span className="air-modal-item-sub">Previously recharged on this device</span></span></button>)}
            {!registeredPhone && recentRecipients.length === 0 && <div className="air-modal-empty"><p>No saved numbers yet.</p><span>Enter a number to get started. Successful demo submissions are saved on this device.</span></div>}
          </div>
        </section>
      </div>}

      {confirmOpen && selectedNetworkInfo && <div className="air-modal-backdrop" onClick={() => setConfirmOpen(false)}>
        <section className="air-confirm-card" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(event) => event.stopPropagation()}>
          <div className="air-modal-header"><div className="air-modal-title-wrap"><h3 id="confirm-title">Confirm Airtime</h3><p>Check the details before continuing.</p></div><button type="button" className="air-modal-close" onClick={() => setConfirmOpen(false)} aria-label="Close confirmation"><X size={17} /></button></div>
          <div className="air-confirm-details">
            <div><span>Network</span><strong><NetworkLogo id={selectedNetworkInfo.id} />{selectedNetworkInfo.label}</strong></div>
            <div><span>Recipient</span><strong>{formatPhone(normalizedPhone)}</strong></div>
            <div className="air-confirm-total"><span>Amount</span><strong>{naira(amount)}</strong></div>
          </div>
          <p className="air-demo-note"><Smartphone size={15} /> Airtime checkout is currently a demo flow; no payment will be charged.</p>
          <button type="button" className="air-cta" onClick={submitDemoPurchase}><Check size={17} /> Confirm demo purchase</button>
          <button type="button" className="air-cancel-btn" onClick={() => setConfirmOpen(false)}>Go back</button>
        </section>
      </div>}

      {toast && <div className="air-toast" role="status"><CheckCircle2 size={16} />{toast}</div>}
    </main>
  );
}
