// routes/reports.js

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
      media: uploadedFiles, // ensure your schema supports this
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

// ✅ GET /reports - List all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST /reports/:id/reply - Add a reply
router.post('/:id/reply', async (req, res) => {
  try {
    const { user = 'Anonymous', content } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: "Reply content is required." });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found." });
    }

    const reply = { user, content, createdAt: new Date() };
    report.replies.push(reply);
    await report.save();

    console.log(`🔔 New reply by ${user} on report "${report.category}"`);

    res.status(200).json({ message: "Reply added successfully.", reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ PUT /reports/:reportId/reply/:replyId - Edit a reply
router.put('/:reportId/reply/:replyId', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: "Updated content is required." });
    }

    const report = await Report.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ error: "Report not found." });
    }

    const reply = report.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ error: "Reply not found." });
    }

    reply.content = content;
    await report.save();

    res.status(200).json({ message: "Reply updated successfully.", reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE /reports/:reportId/reply/:replyId - Delete a reply
router.delete('/:reportId/reply/:replyId', async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ error: "Report not found." });
    }

    const reply = report.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ error: "Reply not found." });
    }

    reply.remove();
    await report.save();

    res.status(200).json({ message: "Reply deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET /reports/:id/replies - Retrieve replies for a report
router.get('/:id/replies', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found." });
    }
    res.status(200).json(report.replies || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
// This code defines the routes for handling reports in an Express application.
// It includes endpoints for creating, retrieving, updating, and deleting reports and their replies.
// It also integrates file uploads using Multer and sends email notifications when a new report is created.
// It uses a Mongoose model to interact with the MongoDB database and includes error handling for various operations.