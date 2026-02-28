const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json());

// Database Connection using Environment Variables
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: { 
    rejectUnauthorized: false // Required for Railway/External connections
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test DB connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Database connected successfully ✅");
    connection.release();
  }
});

// POST /mood - For submitting the form (Matches your Vue: api.post('/mood'))
app.post("/mood", (req, res) => {
  const { full_name, mood_text } = req.body;
  
  if (!full_name || !mood_text) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.query(
    "INSERT INTO moods (full_name, mood_text) VALUES (?, ?)",
    [full_name, mood_text],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      let advice = `Thanks for sharing, ${full_name}!`;
      const lowerMood = mood_text.toLowerCase();
      
      // Basic AI logic
      if (lowerMood.includes("sad")) {
        advice = "I'm sorry you're feeling sad. Take a deep breath.";
      } else if (lowerMood.includes("happy")) {
        advice = "That's great! Keep that positive energy going!";
      }
      
      // Send response back (Matches your Vue: res.data.ai_message)
      res.json({ ai_message: advice });
    }
  );
});

// GET /mood - For fetching history (Matches your Vue: api.get('/mood'))
app.get("/mood", (req, res) => {
  db.query("SELECT * FROM moods ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Render provides the PORT automatically
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));