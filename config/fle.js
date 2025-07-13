const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'development';

let kmsProviders, masterKey, encryptedFieldsMap;

// --------- DEV/TEST: LOCAL KEY ---------
if (env !== 'production') {
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
      endpoint: 'cloudkms.googleapis.com', // optional, default is fine
    }
  };
  masterKey = {
    projectId: 'YOUR_PROJECT_ID',
    location: 'YOUR_KMS_REGION',    // e.g., 'us-east1'
    keyRing: 'YOUR_KEY_RING_NAME',
    keyName: 'YOUR_KEY_NAME',
    // keyVersion: '1',  // optional, not usually needed
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
        keyId: undefined, // Will be set automatically
        queries: { queryType: 'equality' },
        algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
      },
      // Add more encrypted fields as needed!
    ],
  },
};

module.exports = {
  kmsProviders,
  masterKey,
  encryptedFieldsMap,
};
