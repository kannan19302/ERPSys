import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { hashPassword, comparePassword } from '@unerp/auth';

const TOTP_ISSUER = 'UniERP';

// Accept the adjacent 30s window on either side to tolerate clock skew.
authenticator.options = { window: 1 };

/**
 * Generates a fresh base32 TOTP secret usable by any standard authenticator app.
 */
export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Builds the otpauth:// URI and a self-contained data-URI QR image. The secret
 * is rendered locally and never leaves this process.
 */
export async function buildTotpEnrollment(email: string, secret: string) {
  const otpauthUrl = authenticator.keyuri(email, TOTP_ISSUER, secret);
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { otpauthUrl, qrDataUrl };
}

/**
 * Verifies a 6-digit TOTP code against the secret (constant-time inside otplib).
 */
export function verifyTotp(code: string, secret: string): boolean {
  try {
    return authenticator.verify({ token: code.trim(), secret });
  } catch {
    return false;
  }
}

/**
 * Generates `count` single-use recovery codes plus their bcrypt hashes. Only the
 * plaintext is ever shown to the user; only the hashes are stored.
 */
export async function generateRecoveryCodes(count = 10) {
  const plain: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = randomBytes(5).toString('hex'); // 10 hex chars
    plain.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  const hashes = await Promise.all(plain.map((c) => hashPassword(c)));
  return { plain, hashes };
}

/**
 * Checks a candidate recovery code against the stored hashes. Returns the index
 * of the consumed code, or -1 if none match.
 */
export async function matchRecoveryCode(candidate: string, hashes: string[]): Promise<number> {
  const normalized = candidate.trim().toLowerCase();
  for (let i = 0; i < hashes.length; i++) {
    if (await comparePassword(normalized, hashes[i]!)) return i;
  }
  return -1;
}

/**
 * Generates a password-reset token: a high-entropy plaintext for the user and
 * its SHA-256 hash for storage. The plaintext is never persisted.
 */
export function createResetToken() {
  const plain = randomBytes(32).toString('hex');
  return { plain, hash: hashResetToken(plain) };
}

/**
 * SHA-256 of a reset token. Deterministic so lookups can hash-then-match; the
 * DB only ever holds the hash.
 */
export function hashResetToken(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}

/**
 * Constant-time equality for two same-length hex digests.
 */
export function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
