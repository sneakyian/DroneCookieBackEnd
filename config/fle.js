// config/fle.js
const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'development';

let kmsProviders, masterKey, encryptedFieldsMap;

// --------- DEV/TEST: LOCAL KEY ---------
if (env !== 'production') {
  // Generate your dev key ONCE and save it to this file:
  // node -e "console.log(require('crypto').randomBytes(96).toString('base64'))"
  // Copy-paste output to dev.master-key.txt (base64)
  const localMasterKey = Buffer.from(
    fs.readFileSync(path.resolve(__dirname, './dev.master-key.txt'), 'utf8'),
    'base64'
  );
  kmsProviders = { local: { key: localMasterKey } };
  masterKey = { keyAltNames: ['local-key'] };
  console.log('FLE: Using LOCAL key for dev/test');
}
// --------- PRODUCTION: GOOGLE CLOUD KMS ---------
else {
  const serviceAccount = require('./prod-service-account.json');
  kmsProviders = {
    gcp: {
      email: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    },
  };
  masterKey = {
    projectId: 'YOUR_GCP_PROJECT_ID',
    location: 'YOUR_KMS_LOCATION', // e.g., 'us-east1'
    keyRing: 'YOUR_KEY_RING',
    keyName: 'YOUR_KEY_NAME',
  };
  console.log('FLE: Using GOOGLE CLOUD KMS for prod');
}

// ----- Example: Encrypted fields for 'users' collection -----
encryptedFieldsMap = {
  'cookie-drone.users': {
    fields: [
      {
        path: 'savedAddresses',
        bsonType: 'array',
        keyId: undefined, // Will be set by autoEncryption
        queries: { queryType: 'equality' },
        algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
      },
      // Add other sensitive fields as needed
    ],
  },
};

module.exports = {
  kmsProviders,
  masterKey,
  encryptedFieldsMap,
};
