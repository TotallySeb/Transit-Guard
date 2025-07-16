require('dotenv').config(); // Load .env variables

const express = require('express');
const mongoose = require('mongoose');
const reportsRoute = require('./routes/reports');

const app = express();
const PORT = 3000;

// Log env vars to confirm they're loaded
console.log('Database Name:', process.env.MONGODB_DB);
console.log('Collection Name:', process.env.MONGODB_COLLECTION);

// Connect to MongoDB Atlas using the URI from .env
const uri = process.env.MONGODB_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch(err => console.error('❌ Error connecting to MongoDB Atlas:', err));

// Middleware to parse JSON
app.use(express.json());

// Use your reports route
app.use('/reports', reportsRoute);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
// index.js - Main entry point for the application
// This file sets up the Express server, connects to MongoDB, and uses the reports route