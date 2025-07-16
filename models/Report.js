const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'] },
  content: { type: String, required: [true, 'Content is required'] },
  location: {
    lat: {
      type: Number,
      min: [-90, 'Latitude must be >= -90'],
      max: [90, 'Latitude must be <= 90'],
      required: function() { return this.location != null; }
    },
    lng: {
      type: Number,
      min: [-180, 'Longitude must be >= -180'],
      max: [180, 'Longitude must be <= 180'],
      required: function() { return this.location != null; }
    }
  },
  stationName: { type: String, required: false },
  lineName: { type: String, required: false },
  createdAt: { type: Date, default: Date.now }
});

const collectionName = process.env.MONGODB_COLLECTION || 'reports';

module.exports = mongoose.model('Report', reportSchema, collectionName);
// models/Report.js - Mongoose model for reports
// This file defines the schema for a report and exports the model