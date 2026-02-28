const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();

// Apply CORS globally
app.use(cors()); 
app.use(express.json());

// Connect using the EXACT keys from your Render Environment screenshot
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 24780,
  ssl: {
    rejectUnauthorized: false // Required for Railway
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test DB connection with the pool
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

app.get("/moods", (req, res) => {
  db.query("SELECT * FROM moods ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Render provides the PORT automatically
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));