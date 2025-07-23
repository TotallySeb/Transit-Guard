require('dotenv').config(); // Load .env variables

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const reportsRoute = require('./routes/Reports');
const stationsRoute = require('./routes/stations'); // <-- Import stations route

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0'; // Allow network connections

// Log env vars to confirm they're loaded
console.log('Database Name:', process.env.MONGODB_DB);
console.log('Collection Name:', process.env.MONGODB_COLLECTION);

// Connect to MongoDB Atlas using the URI from .env
const uri = process.env.MONGODB_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch(err => console.error('❌ Error connecting to MongoDB Atlas:', err));

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON

// Serve uploads folder statically at /uploads URL path
app.use('/uploads', express.static('uploads'));

// Use your routes
app.use('/reports', reportsRoute);
app.use('/stations', stationsRoute); // <-- Register stations route

// ✅ Global fallback for unhandled routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Global JSON error handler
app.use((err, req, res, next) => {
  console.error('🔥 Uncaught server error:', err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});

// index.js - Main entry point for the application
// This file sets up the Express server, connects to MongoDB, and uses the reports and stations routes
// It also loads environment variables from a .env file for configuration.
