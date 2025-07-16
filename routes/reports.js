const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// POST /reports - Add a new report
router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;

    // ✅ Validation to ensure both fields are present
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const newReport = new Report({ title, content });
    await newReport.save();

    res.status(201).json(newReport);
  } catch (err) {
    console.error('Error creating report:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /reports - List all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find();
    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;