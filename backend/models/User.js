const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  portfolio: [
    {
      symbol: String,
      shares: Number,
      buyPrice: Number,
      buyDate: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);