import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const VERSION = 'v1';

function getKey(): Buffer {
  const raw = process.env.SUPABASE_DB_ENCRYPTION_KEY;
  if (!raw) throw new Error('SUPABASE_DB_ENCRYPTION_KEY is not set');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('SUPABASE_DB_ENCRYPTION_KEY must decode to 32 bytes (base64 of a 256-bit key)');
  }
  return key;
}

/** Encrypts a UTF-8 string. Format: "v1:<ivB64>:<ciphertextB64>:<authTagB64>". */
export function encryptField(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${iv.toString('base64')}:${ct.toString('base64')}:${tag.toString('base64')}`;
}

export function decryptField(value: string): string {
  const parts = value.split(':');
  if (parts.length !== 4 || parts[0] !== VERSION || parts.some((p) => p === '')) {
    throw new Error('Unrecognized ciphertext format');
  }
  const [, ivB64, ctB64, tagB64] = parts;
  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const pt = Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]);
  return pt.toString('utf8');
}
