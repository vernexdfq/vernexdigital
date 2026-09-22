"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

const TYPES = [
  "Feature Suggestion — An idea for something new or an improvement",
  "Bug / Issue Report — Something isn't working as it should",
  "Poor Experience — A service or support experience that fell short",
  "What You Like — Tell us what's working well for you",
  "General Suggestion — Any other thoughts on how we can do better",
];

type Saved = {
  id: string;
  type: string;
  subject: string;
  message: string;
  when: string;
  status: string;
};

const STORAGE_KEY = "vernex_feedback_v1";

export default function FeedbackPage() {
  const [type, setType] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [typeOpen, setTypeOpen] = useState(false);
  const [list, setList] = useState<Saved[]>([]);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setList(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function save(next: Saved[]) {
    setList(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function submit() {
    if (!type || !subject.trim() || !message.trim()) return;
    const item: Saved = {
      id: "FB-" + Date.now().toString().slice(-6),
      type: type.split(" — ")[0],
      subject: subject.trim(),
      message: message.trim(),
      when: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "RECEIVED",
    };
    save([item, ...list]);
    setType("");
    setSubject("");
    setMessage("");
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-40">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#E2E8F0] px-4 h-14 flex items-center gap-3">
        <Link href="/profile" className="text-[#0F172A] flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={20} />
          Back
        </Link>
        <h1 className="text-base font-semibold text-[#0F172A]">Feedback</h1>
      </header>

      <div className="px-4 pt-4 space-y-4 pb-8">
        <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-[#0B1F4D] via-[#123A7A] to-[#1877F2] p-5 text-white">
          <p className="text-lg font-semibold">We&apos;re listening 👋</p>
          <p className="mt-1 text-sm text-white/80 leading-relaxed">
            Your feedback shapes Vernex Digital. Suggest a feature, flag a bug, tell us where we fell short, or just say
            what you like — every message reaches our team.
          </p>
        </div>

        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#64748B] uppercase">Share Something</p>

        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 space-y-3">
          <div>
            <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Feedback Type</label>
            <button
              type="button"
              onClick={() => setTypeOpen(true)}
              className="mt-1 w-full h-12 px-3 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-left text-[#0F172A]"
            >
              {type ? type.split(" — ")[0] : "Choose one..."}
            </button>
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Sum it up in a few words"
              className="mt-1 w-full h-12 px-3 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Your Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us as much detail as you'd like..."
              rows={4}
              className="mt-1 w-full px-3 py-3 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] text-sm resize-none"
            />
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!type || !subject.trim() || !message.trim()}
            className="w-full h-12 rounded-full bg-[#1877F2] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Send size={16} />
            {sent ? "Sent!" : "Send Feedback"}
          </button>
        </div>

        {list.length > 0 && (
          <>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#64748B] uppercase">Your Feedback</p>
            <div className="space-y-2.5">
              {list.map((item) => (
                <div key={item.id} className="bg-white rounded-[14px] border border-[#E2E8F0] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold tracking-wide text-[#1877F2] uppercase">{item.type}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#0F172A] uppercase">{item.subject}</p>
                  <p className="mt-1 text-sm text-[#475569] leading-relaxed whitespace-pre-wrap">{item.message}</p>
                  <p className="mt-2 text-[11px] text-[#94A3B8]">{item.when}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {typeOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col justify-end">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setTypeOpen(false)} />
          <div className="relative bg-white rounded-t-[20px] max-h-[70vh] overflow-y-auto pb-6">
            <p className="px-4 pt-4 pb-2 text-sm font-semibold text-[#0F172A]">Choose one...</p>
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setTypeOpen(false);
                }}
                className="w-full text-left px-4 py-3.5 text-sm text-[#0F172A] border-t border-[#F1F5F9] hover:bg-[#F8FAFC]"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
