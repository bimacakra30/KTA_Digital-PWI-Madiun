import crypto from "crypto";

/**
 * Membuat token verifikasi acak untuk QR code.
 * Format: base64url, 24 karakter, tidak berurutan, tidak memuat data pribadi.
 */
export function generateVerifyToken(): string {
  return crypto.randomBytes(18).toString("base64url");
}

/**
 * Hash IP address untuk ScanLog (privasi).
 * Menggunakan salt dari environment variable.
 */
export function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT || "default-salt";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Hash token untuk penyimpanan di ScanLog.
 * Token asli tidak disimpan di ScanLog untuk keamanan.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex").slice(0, 32);
}
