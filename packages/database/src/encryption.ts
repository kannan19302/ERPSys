import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const ENCODING = 'base64' as const;
const PREFIX = 'enc:';

function getEncryptionKey(): Buffer {
  const key = process.env.PII_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('PII_ENCRYPTION_KEY environment variable is required for field-level encryption.');
  }
  const buf = Buffer.from(key, 'hex');
  if (buf.length !== 32) {
    throw new Error('PII_ENCRYPTION_KEY must be a 64-character hex string (32 bytes for AES-256).');
  }
  return buf;
}

export function encryptField(plaintext: string): string {
  if (!plaintext) return plaintext;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
  encrypted += cipher.final(ENCODING);

  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, authTag, Buffer.from(encrypted, ENCODING)]);

  return PREFIX + payload.toString(ENCODING);
}

export function decryptField(ciphertext: string): string {
  if (!ciphertext || !ciphertext.startsWith(PREFIX)) return ciphertext;

  const key = getEncryptionKey();
  const payload = Buffer.from(ciphertext.slice(PREFIX.length), ENCODING);

  const iv = payload.subarray(0, IV_LENGTH);
  const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted.toString(ENCODING), ENCODING, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function isEncrypted(value: string): boolean {
  return value?.startsWith(PREFIX) ?? false;
}
