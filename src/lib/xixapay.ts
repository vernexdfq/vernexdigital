/**
 * XixaPay server client — dynamic (temporary) virtual accounts for user funding.
 * Docs: POST https://api.xixapay.com/api/v1/createVirtualAccount
 * Dynamic accounts require bankCode ["100004"] (OPay) and amount.
 */

const DEFAULT_BASE = "https://api.xixapay.com";

export type XixaPayConfig = {
  apiKey: string;
  secretKey: string;
  businessId: string;
  baseUrl: string;
};

export type DynamicAccountResult = {
  customerId: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  reservedAccountId: string;
  amount: number;
  expireAt: string | null;
};

export function getXixaPayConfig(): XixaPayConfig | null {
  const apiKey = process.env.XIXAPAY_API_KEY?.trim();
  const secretKey = process.env.XIXAPAY_SECRET_KEY?.trim();
  const businessId = process.env.XIXAPAY_BUSINESS_ID?.trim();
  const baseUrl = (process.env.XIXAPAY_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
  if (!apiKey || !secretKey || !businessId) return null;
  return { apiKey, secretKey, businessId, baseUrl };
}

export async function createDynamicVirtualAccount(input: {
  email: string;
  name: string;
  phoneNumber: string;
  amount: number;
  externalReference?: string;
  callbackUrl?: string;
}): Promise<DynamicAccountResult> {
  const cfg = getXixaPayConfig();
  if (!cfg) {
    throw new Error("XIXAPAY_NOT_CONFIGURED");
  }

  const amount = Math.round(Number(input.amount));
  if (!Number.isFinite(amount) || amount < 100) {
    throw new Error("AMOUNT_TOO_LOW");
  }

  const phone = String(input.phoneNumber || "08000000000").replace(/\D/g, "").slice(-11);
  const body: Record<string, unknown> = {
    email: input.email,
    name: input.name.slice(0, 80),
    phoneNumber: phone.length === 11 ? phone : "08000000000",
    bankCode: ["100004"],
    businessId: cfg.businessId,
    accountType: "dynamic",
    amount,
  };
  if (input.externalReference) body.externalReference = input.externalReference;
  if (input.callbackUrl) body.callbackUrl = input.callbackUrl;

  const res = await fetch(`${cfg.baseUrl}/api/v1/createVirtualAccount`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.secretKey}`,
      "api-key": cfg.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok || data.status === "fail" || data.message === "Unauthorized: Your API Key is not active") {
    const msg =
      (typeof data.message === "string" && data.message) ||
      (typeof data.error === "string" && data.error) ||
      `XixaPay error ${res.status}`;
    throw new Error(msg);
  }

  const accounts = (data.bankAccounts as Array<Record<string, unknown>>) || [];
  const acc = accounts[0];
  if (!acc?.accountNumber) {
    const errs = Array.isArray(data.errors) ? data.errors.join("; ") : "";
    throw new Error(errs || "No bank account returned from XixaPay");
  }

  const customer = (data.customer as Record<string, unknown>) || {};

  return {
    customerId: String(customer.customer_id || ""),
    bankCode: String(acc.bankCode || "100004"),
    accountNumber: String(acc.accountNumber),
    accountName: String(acc.accountName || "Vernex Digital"),
    bankName: String(acc.bankName || "OPay"),
    reservedAccountId: String(acc.Reserved_Account_Id || acc.reserved_account_id || ""),
    amount: Number(acc.amount ?? amount),
    expireAt: acc.expire_at ? String(acc.expire_at) : null,
  };
}
