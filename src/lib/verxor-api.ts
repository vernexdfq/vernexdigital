/**
 * Server-side Verxor panel API client.
 * Requires env: VERXOR_API_BASE, VERXOR_PANEL_API_KEY
 */
const DEFAULT_BASE = "https://verxor.com/api/v1";

export function verxorConfig() {
  const base = (process.env.VERXOR_API_BASE || DEFAULT_BASE).replace(/\/$/, "");
  const key = process.env.VERXOR_PANEL_API_KEY || "";
  return { base, key, configured: Boolean(key) };
}

export async function verxorFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const { base, key } = verxorConfig();
  if (!key) {
    throw new Error("VERXOR_PANEL_API_KEY is not set");
  }
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("X-Api-Key", key);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...init, headers, cache: "no-store" });
}
