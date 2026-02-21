const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to Railway MySQL using environment variables
const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

// Test DB connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Database connected successfully ✅");
    connection.release();
  }
});

// POST /moods - save mood and return AI advice
app.post("/moods", (req, res) => {
  const { name, mood } = req.body;
  if (!name || !mood) return res.status(400).json({ error: "Missing fields" });

  db.query(
    "INSERT INTO moods (name, mood) VALUES (?, ?)",
    [name, mood],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      // Simple AI response logic
      const moodLower = mood.toLowerCase();
      let advice = "";
      if (moodLower.includes("sad")) advice = `${name}, it's okay to feel sad sometimes.`;
      else if (moodLower.includes("happy")) advice = `That's great, ${name}! Keep spreading positive energy!`;
      else if (moodLower.includes("stress")) advice = `${name}, try to take short breaks and relax.`;
      else advice = `${name}, thanks for sharing your mood. Take care!`;

      res.json({ advice });
    }
  );
});

// Optional GET /moods - list all moods
app.get("/moods", (req, res) => {
  db.query("SELECT * FROM moods ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));