const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  user: { type: String, default: 'Anonymous' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const mediaSchema = new mongoose.Schema({
  filename: String,
  path: String,
  mimetype: String,
});

const reportSchema = new mongoose.Schema({
  category: { type: String, required: [true, 'Category is required'] },
  content: { type: String, required: [true, 'Content is required'] },
  threatLevel: { type: String, required: [true, 'Threat level is required'] },
  location: {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 }
  },
  stationName: { type: String },
  lineName: { type: String },
  media: [mediaSchema], // <-- Added media field to store uploaded files info
  createdAt: { type: Date, default: Date.now },
  replies: [replySchema]
});

const collectionName = process.env.MONGODB_COLLECTION || 'reports';

module.exports = mongoose.model('Report', reportSchema, collectionName);
// Report.js - Mongoose model for reports
// This file defines the schema for reports, including fields for category, content, threat level, location, and media attachments.