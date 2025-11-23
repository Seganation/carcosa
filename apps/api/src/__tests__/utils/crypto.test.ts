import { describe, it, expect } from 'vitest';
import { encryptWithKey, decryptWithKey } from '../../crypto.js';
import { hashPassword } from '../../auth.js';

describe('Crypto Utils', () => {
  // Libsodium requires exactly 32 bytes for crypto_secretbox
  const testEncryptionKey = 'base64:' + Buffer.from('a'.repeat(32)).toString('base64');

  describe('encryptWithKey and decryptWithKey', () => {
    it('should encrypt and decrypt a string', async () => {
      const plaintext = 'secret-api-key-12345';

      const encrypted = await encryptWithKey(testEncryptionKey, plaintext);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);

      const decrypted = await decryptWithKey(testEncryptionKey, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for the same plaintext', async () => {
      const plaintext = 'test-value';

      const encrypted1 = await encryptWithKey(testEncryptionKey, plaintext);
      const encrypted2 = await encryptWithKey(testEncryptionKey, plaintext);

      // Different because of random nonce
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to the same value
      const decrypted1 = await decryptWithKey(testEncryptionKey, encrypted1);
      const decrypted2 = await decryptWithKey(testEncryptionKey, encrypted2);
      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });

    it('should handle empty strings', async () => {
      const encrypted = await encryptWithKey(testEncryptionKey, '');
      const decrypted = await decryptWithKey(testEncryptionKey, encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle long strings', async () => {
      const longString = 'a'.repeat(1000);
      const encrypted = await encryptWithKey(testEncryptionKey, longString);
      const decrypted = await decryptWithKey(testEncryptionKey, encrypted);
      expect(decrypted).toBe(longString);
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'my-secure-password-123';

      const hashedPassword = await hashPassword(password);
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toContain('$2');  // bcrypt hash prefix
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'test-password';

      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Different because of salt
      expect(hash1).not.toBe(hash2);
    });

    it('should handle special characters in passwords', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      const hashedPassword = await hashPassword(password);
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).toContain('$2');
    });
  });
});
