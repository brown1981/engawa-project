import * as crypto from 'node:crypto';

function encryptSync(text, masterKey) {
  if (!text || !masterKey) return null;
  try {
    const iv = crypto.randomBytes(12);
    const key = crypto.scryptSync(masterKey, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `ENC:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (e) {
    console.error('   ❌ Encryption Error:', e.message);
    return null;
  }
}

function decryptSync(encryptedText, masterKey) {
  if (!encryptedText || !masterKey) return null;
  try {
    const [ivHex, authTagHex, contentHex] = encryptedText.split(':');
    if (!ivHex || !authTagHex || !contentHex) return null;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.scryptSync(masterKey, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(contentHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    console.error('   ❌ Decryption Error:', e.message);
    return null;
  }
}

const masterKey = 'L21Axgec1oTWz0/B77cIh+weOfSERN75xUK6SLCLYV4=';
const original = 'test-api-key';
const encrypted = encryptSync(original, masterKey);
console.log('Encrypted:', encrypted);
const decrypted = decryptSync(encrypted.slice(4), masterKey);
console.log('Decrypted:', decrypted);
