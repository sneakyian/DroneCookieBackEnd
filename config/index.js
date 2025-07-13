const mongoose = require('mongoose');
const { kmsProviders, encryptedFieldsMap } = require('./config/fle');
require('dotenv').config();

const uri = process.env.MONGODB_URI; // Your Atlas connection string

const connOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

if (kmsProviders) {
  connOptions.autoEncryption = {
    keyVaultNamespace: 'encryption.__keyVault',
    kmsProviders,
    schemaMap: encryptedFieldsMap,
  };
}

mongoose.connect(uri, connOptions)
  .then(() => console.log('MongoDB Connected (with FLE)!'))
  .catch(err => console.error('MongoDB connection error:', err));
