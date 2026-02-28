const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

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

// Matches your Railway table: mood_entries
app.post("/mood", async (req, res) => {
  const { full_name, mood_text } = req.body;
  if (!full_name || !mood_text) return res.status(400).json({ error: "Missing fields" });

  const responses = [
    `Hey ${full_name}, it's okay to feel "${mood_text}". Take a deep breath.`,
    `I hear you, ${full_name}. Your feelings are valid. 🌿`,
    `Thanks for sharing, ${full_name}. Be kind to yourself today.`
  ];
  const aiAdvice = responses[Math.floor(Math.random() * responses.length)];

  // Match columns: user_name and mood_text
  db.query(
    "INSERT INTO mood_entries (user_name, mood_text) VALUES (?, ?)",
    [full_name, mood_text],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ai_message: aiAdvice });
    }
  );
});

app.get("/mood", (req, res) => {
  // Alias user_name to full_name so the frontend recognizes it
  db.query("SELECT id, user_name AS full_name, mood_text, created_At FROM mood_entries ORDER BY created_At DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get("/", (req, res) => res.send("<h1>✅ Backend is Online!</h1>"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));