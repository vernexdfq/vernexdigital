import crypto from "crypto";

export function createLogsDownloadToken(orderId: string): string {
  const secret =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VERXOR_PANEL_API_KEY ||
    "vernex-digital-logs-token-secret-key-2026";
  return crypto.createHmac("sha256", secret).update(String(orderId).trim()).digest("hex").slice(0, 32);
}

export function buildLogsDownloadUrl(orderId: string): string {
  const token = createLogsDownloadToken(orderId);
  return `https://vernexdigital.com/api/logs/download?id=${encodeURIComponent(orderId)}&token=${token}`;
}

export function buildLogsCredentialsFileText(order: {
  id: string;
  platform: string;
  title: string;
  quantity: number;
  credentials: string[];
  createdAt?: string | Date;
}): string {
  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })
    : new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" });

  const lines = [
    "============================================================",
    "VERNEX DIGITAL — OFFICIAL CREDENTIAL DELIVERY",
    "============================================================",
    `Order Reference : ${order.id}`,
    `Platform        : ${order.platform}`,
    `Listing         : ${order.title}`,
    `Quantity        : ${order.quantity}`,
    `Delivered Items : ${order.credentials.length}`,
    `Delivery Date   : ${dateStr}`,
    `Status          : Delivered`,
    "------------------------------------------------------------",
    "DELIVERED CREDENTIALS (KEEP PRIVATE):",
    "------------------------------------------------------------",
    ...order.credentials,
    "------------------------------------------------------------",
    "USAGE INSTRUCTIONS:",
    "• Account Format: login:password (or login:password:email:2fa as specified).",
    "• 2FA Security: If a 2FA secret key is included, enter it at",
    "  https://2fa.live or into your Google Authenticator app to generate",
    "  the 6-digit one-time login code.",
    "• Cookies: If cookies are provided, use a browser cookie editor",
    "  extension to import them before logging in.",
    "------------------------------------------------------------",
    "24-HOUR REPLACEMENT POLICY:",
    "• All accounts are covered by a 24-hour replacement window for any",
    "  credentials that are invalid on first login.",
    "• To claim a replacement, contact Vernex Digital support within 24 hours with",
    `  your Order Reference: ${order.id}`,
    "------------------------------------------------------------",
    "CUSTOMER SUPPORT CHANNELS:",
    "• Support Email : support@vernexdigital.com",
    "• Website       : https://vernexdigital.com",
    "============================================================",
  ];

  return lines.join("\r\n");
}
