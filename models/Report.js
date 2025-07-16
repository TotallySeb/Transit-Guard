const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const collectionName = process.env.MONGODB_COLLECTION || 'reports';

module.exports = mongoose.model('Report', reportSchema, collectionName);
// models/Report.js - Mongoose model for reports
// This file defines the schema for a report and exports the model