const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  user: { type: String, default: 'Anonymous' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const mediaSchema = new mongoose.Schema({
  filename: String,
  path: String,
  mimetype: String,
});

const reportSchema = new mongoose.Schema({
  category: { type: String, required: true },
  content: { type: String, required: true },
  threatLevel: { type: String, required: true },
  location: {
    lat: Number,
    lng: Number,
  },
  stationName: String,
  lineName: String,
  media: [mediaSchema],  // Array of uploaded files
  replies: [replySchema],  // Array of replies
  createdAt: { type: Date, default: Date.now },
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
