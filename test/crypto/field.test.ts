import { describe, it, expect, beforeEach } from 'vitest';
import { randomBytes } from 'node:crypto';
import { encryptField, decryptField } from '@/lib/crypto/field';

beforeEach(() => {
  process.env.SUPABASE_DB_ENCRYPTION_KEY = randomBytes(32).toString('base64');
});

describe('field encryption', () => {
  it('round-trips a value and does not leak plaintext', () => {
    const ct = encryptField('low energy, poor sleep');
    expect(ct).not.toContain('low energy');
    expect(decryptField(ct)).toBe('low energy, poor sleep');
  });

  it('is version-tagged v1', () => {
    expect(encryptField('x').startsWith('v1:')).toBe(true);
  });

  it('uses a fresh IV (same input -> different ciphertext)', () => {
    expect(encryptField('same')).not.toBe(encryptField('same'));
  });

  it('detects tampering via the GCM auth tag', () => {
    const parts = encryptField('secret').split(':');
    const ct = Buffer.from(parts[2], 'base64');
    ct[0] ^= 0x01;
    parts[2] = ct.toString('base64');
    expect(() => decryptField(parts.join(':'))).toThrow();
  });

  it('detects a tampered auth tag', () => {
    const parts = encryptField('secret').split(':');
    const tag = Buffer.from(parts[3], 'base64');
    tag[0] ^= 0x01;
    parts[3] = tag.toString('base64');
    expect(() => decryptField(parts.join(':'))).toThrow();
  });

  it('rejects empty segments', () => {
    expect(() => decryptField('v1:::')).toThrow(/format/i);
  });

  it('fails to decrypt with a different key', () => {
    const ct = encryptField('secret');
    process.env.SUPABASE_DB_ENCRYPTION_KEY = randomBytes(32).toString('base64');
    expect(() => decryptField(ct)).toThrow();
  });

  it('rejects an unknown version tag', () => {
    expect(() => decryptField('v9:a:b:c')).toThrow(/format/i);
  });

  it('throws when the key env is missing or wrong size', () => {
    delete process.env.SUPABASE_DB_ENCRYPTION_KEY;
    expect(() => encryptField('x')).toThrow();
    process.env.SUPABASE_DB_ENCRYPTION_KEY = Buffer.from('tooshort').toString('base64');
    expect(() => encryptField('x')).toThrow(/32 bytes/);
  });
});
