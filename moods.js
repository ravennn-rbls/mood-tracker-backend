const express = require('express');
const router = express.Router();

let moods = []; // temporary in-memory storage

// POST – Create Mood
router.post('/', (req, res) => {
  const { user_id, mood_text } = req.body;
  const newMood = { id: moods.length + 1, user_id, mood_text };
  moods.push(newMood);
  res.status(201).json({ message: 'Mood created successfully', mood: newMood });
});

// GET – Read Moods
router.get('/', (req, res) => {
  res.json(moods);
});

module.exports = router;
