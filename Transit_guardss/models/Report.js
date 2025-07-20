// models/Report.js

const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  user: { type: String, default: 'Anonymous' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const reportSchema = new mongoose.Schema({
  category: { type: String, required: [true, 'Category is required'] }, // ✅ changed from 'title' to 'category'
  content: { type: String, required: [true, 'Content is required'] },
  threatLevel: { type: String, required: [true, 'Threat level is required'] },
  location: {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 }
  },
  stationName: { type: String },
  lineName: { type: String },
  createdAt: { type: Date, default: Date.now },
  replies: [replySchema] // ✅ replies array remains
});

const collectionName = process.env.MONGODB_COLLECTION || 'reports';
module.exports = mongoose.model('Report', reportSchema, collectionName);
