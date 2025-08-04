// index.js (CommonJS version)

const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const reportsRoute = require('./routes/Reports');
const stationsRoute = require('./routes/stations');
const chatbotRoute = require('./routes/chatbot');

const app = express();
const PORT = process.env.PORT || 3000; // Use PORT from .env or default to 3000
const HOST = '0.0.0.0'; // Allow network connections

// Log env vars to confirm they're loaded
console.log('Database Name:', process.env.MONGODB_DB);
console.log('Collection Name:', process.env.MONGODB_COLLECTION);
console.log('Server Port:', PORT);

// Connect to MongoDB Atlas using the URI from .env
const uri = process.env.ATLAS_CONNECTION_STRING;
mongoose.connect(uri)
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch(err => console.error('❌ Error connecting to MongoDB Atlas:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploads folder statically at /uploads URL path
app.use('/uploads', express.static('uploads'));

// Use your routes
app.use('/reports', reportsRoute);
app.use('/stations', stationsRoute);
app.use('/chatbot', chatbotRoute);
app.get('/', (req, res) => {
  res.send('Welcome to the Transit Guard API!');
});

// Global fallback for unhandled routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global JSON error handler
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

module.exports = app; // Export app for testing or other uses