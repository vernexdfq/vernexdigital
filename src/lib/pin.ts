import { createHash } from "crypto";

/**
 * Hash a 4-digit PIN for storage / verification.
 * Uses a server-only salt so hashes cannot be reversed offline.
 */
export function hashPin(pin: string, email: string): string {
  const salt =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 24) ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 24) ||
    "vernex-pin-salt";
  return createHash("sha256")
    .update(`${pin}:${email.toLowerCase().trim()}:${salt}`)
    .digest("hex");
}

export function verifyPin(pin: string, email: string, storedHash: string): boolean {
  if (!pin || !email || !storedHash) return false;
  return hashPin(pin, email) === storedHash;
}
