const express = require('express');
const router = express.Router();
const path = require('path');
const Report = require('../models/Report');
const findNearestStation = require('../utils/findNearestStation');
const { sendReportEmail } = require('../utils/email');
const upload = require('../utils/upload');

// ✅ GET /reports - return all reports or only recent reports if ?recentOnly=true
router.get('/', async (req, res) => {
  try {
    const { recentOnly } = req.query;
    let filter = {};

    if (recentOnly === 'true') {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      filter.createdAt = { $gte: threeDaysAgo };
    }

    const reports = await Report.find(filter).sort({ createdAt: -1 }); // newest first
    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// ✅ POST /reports - Add a new report with file uploads
router.post('/', upload.array('media', 10), async (req, res) => {
  try {
    console.log('req.files:', req.files);
    console.log('req.body:', req.body);

    const { category, content, threatLevel, location } = req.body;

    if (!category || !content || !threatLevel) {
      return res.status(400).json({ error: "Category, content, and threat level are required." });
    }

    let stationName = null;
    let lineName = null;

    let parsedLocation = null;
    if (location) {
      try {
        parsedLocation = JSON.parse(location);
      } catch {
        parsedLocation = location;
      }
    }
    if (parsedLocation && parsedLocation.lat && parsedLocation.lng) {
      const nearest = findNearestStation(parsedLocation.lat, parsedLocation.lng);
      if (nearest) {
        stationName = nearest.name;
        lineName = nearest.line;
      }
    }

    const uploadedFiles = req.files ? req.files.map(file => ({
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
    })) : [];

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

    sendReportEmail(newReport);

    res.status(201).json(newReport);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// ✅ POST /reports/:id/replies - Add a reply to a specific report
router.post('/:id/replies', async (req, res) => {
  console.log('POST /reports/:id/replies called with id:', req.params.id);
  try {
    const reportId = req.params.id;
    const { user = 'Anonymous', content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Reply content is required' });
    }

    // Use updateOne to push reply efficiently
    const result = await Report.updateOne(
      { _id: reportId },
      { $push: { replies: { user, content } } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const updatedReport = await Report.findById(reportId).select('replies');

    res.status(201).json({ message: 'Reply added', replies: updatedReport.replies });
  } catch (err) {
    console.error('Error adding reply:', err);

    if (err.errors) {
      for (const key in err.errors) {
        console.error(`Validation error on ${key}:`, err.errors[key].message);
      }
    }
    if (err.stack) {
      console.error('Stack trace:', err.stack);
    }

    res.status(500).json({ error: 'Failed to add reply' });
  }
});

module.exports = router;
