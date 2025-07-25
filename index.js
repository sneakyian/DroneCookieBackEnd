const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { encrypt, decrypt } = require('./utils/encryption'); // <-- Add this!

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  password: String, // For real apps, always hash passwords!
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

app.post('/users/signup', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send({ success: true, user });
  } catch (err) {
    res.status(400).send({ success: false, error: err.message });
  }
});

app.post('/users/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email, password: req.body.password });
    if (!user) return res.status(400).send({ success: false, error: 'Invalid credentials' });
    res.send({ success: true, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).send({ success: false, error: err.message });
  }
});

// --- ORDER SCHEMA: address is now an object ---
const orderSchema = new mongoose.Schema({
  name: String,
  address: { iv: String, content: String, tag: String }, // <--- Make address an object
  contact: String,
  cart: [
    {
      name: String,
      quantity: Number
    }
  ],
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// --- POST /orders: Encrypt address before save ---
app.post('/orders', async (req, res) => {
  try {
    const addressEncrypted = encrypt(req.body.address);
    const order = new Order({
      ...req.body,
      address: addressEncrypted
    });
    await order.save();
    res.status(201).send({ success: true, order });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// --- GET /orders/:id: Decrypt address for client (optional) ---
app.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ success: false, error: "Order not found" });

    let address;
    if (order.address && typeof order.address === 'object' && order.address.iv) {
      address = decrypt(order.address);
    } else {
      address = order.address;
    }
    res.send({ ...order.toObject(), address });
  } catch (err) {
    res.status(500).send({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
