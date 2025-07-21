const express = require('express');
const router = express.Router();
const path = require('path');
const Report = require('../models/Report');
const findNearestStation = require('../utils/findNearestStation');
const { sendReportEmail } = require('../utils/email'); // ✅ Import email sender
const upload = require('../utils/upload'); // ✅ Import multer upload

// ✅ POST /reports - Add a new report with file uploads
router.post('/', upload.array('media', 10), async (req, res) => {
  try {
    // Debug logs to check files and body received
    console.log('req.files:', req.files);
    console.log('req.body:', req.body);

    const { category, content, threatLevel, location } = req.body;

    // Validation
    if (!category || !content || !threatLevel) {
      return res.status(400).json({ error: "Category, content, and threat level are required." });
    }

    let stationName = null;
    let lineName = null;

    // Attach nearest station info if location provided
    let parsedLocation = null;
    if (location) {
      try {
        parsedLocation = JSON.parse(location);
      } catch {
        parsedLocation = location; // if already an object
      }
    }
    if (parsedLocation && parsedLocation.lat && parsedLocation.lng) {
      const nearest = findNearestStation(parsedLocation.lat, parsedLocation.lng);
      if (nearest) {
        stationName = nearest.name;
        lineName = nearest.line;
      }
    }

    // Handle uploaded files
    const uploadedFiles = req.files ? req.files.map(file => ({
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
    })) : [];

    // Create and save report
    const newReport = new Report({
      category,
      content,
      threatLevel,
      location: parsedLocation || null,
      stationName,
      lineName,
      media: uploadedFiles,
    });

    await newReport.save();

    // ✅ Send email notification after saving
    sendReportEmail(newReport);

    res.status(201).json(newReport);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// ... rest of your routes unchanged

module.exports = router;
// Reports.js - Express route for handling reports
// This file defines the API endpoints for creating and managing reports.
// It includes functionality for uploading files, validating input, and sending email notifications.
// It uses multer for file uploads and nodemailer for sending emails.