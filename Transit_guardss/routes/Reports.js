// routes/reports.js

const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const findNearestStation = require('../utils/findNearestStation');

// ✅ POST /reports - Add a new report
router.post('/', async (req, res) => {
  try {
    const { category, content, threatLevel, location } = req.body;

    // Validation
    if (!category || !content || !threatLevel) {
      return res.status(400).json({ error: "Category, content, and threat level are required." });
    }

    let stationName = null;
    let lineName = null;

    // Attach nearest station info if location is provided
    if (location && location.lat && location.lng) {
      const nearest = findNearestStation(location.lat, location.lng);
      if (nearest) {
        stationName = nearest.name;
        lineName = nearest.line;
      }
    }

    // Create and save report
    const newReport = new Report({
      category,
      content,
      threatLevel,
      location,
      stationName,
      lineName
    });

    await newReport.save();
    res.status(201).json(newReport);
  } catch (err) {
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
// This code defines the routes for managing reports in a transit system, including creating, listing, replying to, editing, and deleting reports and their replies.
// It also includes functionality to find the nearest station based on the report's location.