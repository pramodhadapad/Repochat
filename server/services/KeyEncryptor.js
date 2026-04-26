const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
// ENCRYPTION_KEY should be 32 bytes (64 hex characters)
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('Invalid ENCRYPTION_KEY. Must be 64 hex characters (32 bytes).');
  }
  return Buffer.from(key, 'hex');
};

/**
 * Encrypts plain text using AES-256-GCM.
 * @param {string} text - The text to encrypt.
 * @returns {object} - An object containing iv, encrypted data, and authTag.
 */
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    encrypted: encrypted.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Decrypts data using AES-256-GCM.
 * @param {object} encryptedObj - Object containing iv, encrypted data, and authTag (plain or Mongoose subdocument).
 * @returns {string} - The decrypted plain text.
 */
function decrypt(encryptedObj) {
  const raw = encryptedObj && typeof encryptedObj.toObject === 'function'
    ? encryptedObj.toObject()
    : encryptedObj || {};
  const { iv, encrypted, authTag } = raw;
  if (!iv || !encrypted || !authTag) {
    throw new Error('Invalid encrypted key format. Please save your API key again from Dashboard.');
  }
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'hex')),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
