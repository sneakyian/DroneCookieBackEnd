const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { kmsProviders, encryptedFieldsMap } = require('./config/fle');


const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI
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

// Signup route
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
 
const orderSchema = new mongoose.Schema({
  name: String,
  address: String,
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
