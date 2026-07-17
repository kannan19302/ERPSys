import { describe, it, expect } from 'vitest';
import {
  generateTotpSecret,
  verifyTotp,
  generateRecoveryCodes,
  matchRecoveryCode,
  createResetToken,
  hashResetToken,
} from '../auth-crypto';
import { authenticator } from 'otplib';

describe('auth-crypto', () => {
  describe('TOTP', () => {
    it('generates a usable secret and verifies a live code', () => {
      const secret = generateTotpSecret();
      expect(secret.length).toBeGreaterThan(0);
      const code = authenticator.generate(secret);
      expect(verifyTotp(code, secret)).toBe(true);
    });

    it('rejects an incorrect code', () => {
      const secret = generateTotpSecret();
      expect(verifyTotp('000000', secret)).toBe(false);
    });
  });

  describe('recovery codes', () => {
    it('generates codes whose hashes verify once and only for the right code', async () => {
      const { plain, hashes } = await generateRecoveryCodes(5);
      expect(plain).toHaveLength(5);
      expect(hashes).toHaveLength(5);

      const idx = await matchRecoveryCode(plain[2]!, hashes);
      expect(idx).toBe(2);

      const miss = await matchRecoveryCode('deadbeef-00', hashes);
      expect(miss).toBe(-1);
    });

    it('matches case-insensitively', async () => {
      const { plain, hashes } = await generateRecoveryCodes(2);
      const idx = await matchRecoveryCode(plain[0]!.toUpperCase(), hashes);
      expect(idx).toBe(0);
    });
  });

  describe('reset tokens', () => {
    it('produces a plaintext plus a deterministic sha256 hash', () => {
      const { plain, hash } = createResetToken();
      expect(plain).toMatch(/^[a-f0-9]{64}$/);
      expect(hash).toBe(hashResetToken(plain));
      // Different tokens hash differently.
      expect(hash).not.toBe(hashResetToken(plain + 'x'));
    });
  });
});
