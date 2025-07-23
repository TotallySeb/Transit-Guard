// models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String }, // null if using OAuth
  displayName: { type: String, required: true },
  isMetroEmployee: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
// User.js - Mongoose model for users
// This file defines the schema for users, including fields for email, password hash, display name
// and whether they are a metro employee. It uses Mongoose to interact with MongoDB.