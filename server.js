const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Database Connection for Railway
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 24780,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10
});

// 2. Auto-create table with ai_response column
db.query(`
  CREATE TABLE IF NOT EXISTS moods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    mood_text TEXT NOT NULL,
    ai_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`, (err) => { 
  if (err) console.error("❌ Table Error:", err.message);
  else console.log("✅ Table Ready with AI Response column"); 
});

// 3. Health Check
app.get("/", (req, res) => res.send("<h1>✅ AI Mood Tracker API is Live!</h1>"));

// 4. POST Mood (Using Smart Fallback Logic)
app.post("/mood", async (req, res) => {
  const { full_name, mood_text } = req.body;
  
  if (!full_name || !mood_text) {
    return res.status(400).json({ error: "Missing fields" });
  }
  
  // Dynamic fallback responses that feel like AI
  const responses = [
    `Hey ${full_name}, it's totally okay to feel "${mood_text}". Take a deep breath.`,
    `I hear you, ${full_name}. Remember that your feelings are valid and this too shall pass. 🌿`,
    `Thanks for sharing, ${full_name}. Be extra kind to yourself today.`,
    `Small steps still move you forward, ${full_name}. You're doing great.`
  ];
  
  const aiAdvice = responses[Math.floor(Math.random() * responses.length)];

  db.query(
    "INSERT INTO moods (full_name, mood_text, ai_response) VALUES (?, ?, ?)",
    [full_name, mood_text, aiAdvice],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ai_message: aiAdvice });
    }
  );
});

// 5. GET Mood History
app.get("/mood", (req, res) => {
  db.query("SELECT * FROM moods ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 6. Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});