const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ====== FLE CONFIG (Auto-switch for dev/prod) ======
const { kmsProviders, encryptedFieldsMap } = require('./config/fle');
const uri = process.env.MONGODB_URI || 'mongodb+srv://ianmccann194:52vM0Tf5yYU5dkP0@cluster0.9hlzj88.mongodb.net/cookie-drone?retryWrites=true&w=majority';

// ----- Mongoose Connection with FLE -----
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
  .catch(err => console.error(err));

// ====== EXPRESS SETUP ======
const app = express();
app.use(cors());
app.use(express.json());

// ====== USER SCHEMA ======
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  password: String, // Always hash in real apps!
  savedAddresses: [String], // <-- FLE ENCRYPTED!
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// ====== ORDER SCHEMA ======
const orderSchema = new mongoose.Schema({
  name: String,
  address: String,
  contact: String,
  cart: [
    { name: String, quantity: Number }
  ],
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// ====== ROUTES ======

// --- Signup
app.post('/users/signup', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send({ success: true, user });
  } catch (err) {
    res.status(400).send({ success: false, error: err.message });
  }
});

// --- Login (plaintext for now, add bcrypt for production!)
app.post('/users/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email, password: req.body.password });
    if (!user) return res.status(400).send({ success: false, error: 'Invalid credentials' });
    res.send({ success: true, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).send({ success: false, error: err.message });
  }
});

// --- Save an order
app.post('/orders', async (req, res) => {
  console.log('Received POST /orders:', req.body);
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).send({ success: true, order });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ====== START SERVER ======
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
