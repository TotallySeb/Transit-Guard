// models/Report.js

const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  user: { type: String, default: 'Anonymous' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const reportSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'] },
  content: { type: String, required: [true, 'Content is required'] },
  threatLevel: { type: String, required: [true, 'Threat level is required'] },
  location: {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 }
  },
  stationName: { type: String },
  lineName: { type: String },
  createdAt: { type: Date, default: Date.now },
  replies: [replySchema] // ✅ add replies array
});

const collectionName = process.env.MONGODB_COLLECTION || 'reports';
module.exports = mongoose.model('Report', reportSchema, collectionName);
// This code defines a Mongoose schema for reports in a transit system, including fields for title, content, threat level, location, station and line names, and an array of replies.
// It also sets a default collection name based on an environment variable or defaults to 'reports'.