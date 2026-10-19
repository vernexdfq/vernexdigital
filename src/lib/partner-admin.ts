/** Env-based partner admin access (no Supabase user required). */
export function partnerAdminEmails(): string[] {
  return (process.env.PARTNER_ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isPartnerAdminEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  if (!e) return false;
  return partnerAdminEmails().includes(e);
}

export function checkPartnerAdminPassword(password: string): boolean {
  const expected = process.env.PARTNER_ADMIN_PASSWORD || "";
  return expected.length >= 8 && password === expected;
}

export const PARTNER_ADMIN_COOKIE = "vernex_partner_admin";

/** Simple opaque token = base64(email|expiry|hmac-lite using password) */
export function makePartnerAdminToken(email: string): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const secret = process.env.PARTNER_ADMIN_PASSWORD || "partner";
  const payload = `${email.trim().toLowerCase()}|${exp}`;
  const sig = simpleHash(payload + "|" + secret);
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

export function verifyPartnerAdminToken(token: string): { ok: true; email: string } | { ok: false } {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split("|");
    if (parts.length !== 3) return { ok: false };
    const [email, expStr, sig] = parts;
    const exp = Number(expStr);
    if (!email || !Number.isFinite(exp) || Date.now() > exp) return { ok: false };
    if (!isPartnerAdminEmail(email)) return { ok: false };
    const secret = process.env.PARTNER_ADMIN_PASSWORD || "partner";
    const expect = simpleHash(`${email}|${exp}|${secret}`);
    if (sig !== expect) return { ok: false };
    return { ok: true, email };
  } catch {
    return { ok: false };
  }
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}
