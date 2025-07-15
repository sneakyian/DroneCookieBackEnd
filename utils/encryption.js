const crypto = require('crypto');
//const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../config/.env.secret') });
const key = Buffer.from(process.env.ADDRESS_SECRET_KEY, 'hex'); // 32 bytes for aes-256-gcm

const algorithm = 'aes-256-gcm';

function encrypt(text) {
  const iv = crypto.randomBytes(12); // 12 bytes for GCM
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    content: encrypted,
    tag: authTag.toString('hex'),
  };
}

function decrypt({ iv, content, tag }) {
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  let decrypted = decipher.update(content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
