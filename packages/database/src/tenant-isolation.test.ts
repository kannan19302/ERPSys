import { describe, it, expect } from 'vitest';
import { encryptField, decryptField, isEncrypted } from './encryption';

describe('PII Field Encryption', () => {
  const originalKey = process.env.PII_ENCRYPTION_KEY;

  // Use a test key: 32 bytes = 64 hex chars
  const TEST_KEY = 'a'.repeat(64);

  beforeAll(() => {
    process.env.PII_ENCRYPTION_KEY = TEST_KEY;
  });

  afterAll(() => {
    if (originalKey) {
      process.env.PII_ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.PII_ENCRYPTION_KEY;
    }
  });

  it('encrypts and decrypts a field correctly', () => {
    const ssn = '123-45-6789';
    const encrypted = encryptField(ssn);

    expect(encrypted).not.toBe(ssn);
    expect(isEncrypted(encrypted)).toBe(true);
    expect(encrypted.startsWith('enc:')).toBe(true);

    const decrypted = decryptField(encrypted);
    expect(decrypted).toBe(ssn);
  });

  it('returns empty strings unchanged', () => {
    expect(encryptField('')).toBe('');
    expect(decryptField('')).toBe('');
  });

  it('returns non-encrypted strings unchanged from decrypt', () => {
    expect(decryptField('plain-text')).toBe('plain-text');
  });

  it('produces different ciphertext each time (random IV)', () => {
    const value = 'sensitive-data';
    const enc1 = encryptField(value);
    const enc2 = encryptField(value);

    expect(enc1).not.toBe(enc2);
    expect(decryptField(enc1)).toBe(value);
    expect(decryptField(enc2)).toBe(value);
  });
});
