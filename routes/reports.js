const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const findNearestStation = require('../utils/findNearestStation'); // ✅ Ensure this line is present

// POST /reports - Add a new report
router.post('/', async (req, res) => {
  try {
    const { title, content, location } = req.body;

    let stationName = null;
    let lineName = null;

    if (location && location.lat && location.lng) {
      const nearest = findNearestStation(location.lat, location.lng);
      if (nearest) {
        stationName = nearest.name;
        lineName = nearest.line;
      }
    }

    const newReport = new Report({
      title,
      content,
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

// GET /reports - List all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
// routes/reports.js - Express route for handling reports
// This file defines the routes for adding and listing reports, using the Report model and findNearestStation utility
// Ensure that the findNearestStation utility is imported correctly to use it for finding the nearest metro station
// and that the Report model is used to interact with the MongoDB collection for reports.