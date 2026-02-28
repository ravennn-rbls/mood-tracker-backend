const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Setup Environment Variables
const GROQ_API_KEY = process.env.GROQ_API_KEY; 

// 2. Database Connection for Railway
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 24780, 
  ssl: { 
    rejectUnauthorized: false 
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 3. Auto-Create Table on Startup
const initDB = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS moods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        mood_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  db.query(createTableQuery, (err) => {
    if (err) {
      console.error("❌ Table creation failed:", err.message);
    } else {
      console.log("✅ Database table is ready (created or already exists).");
    }
  });
};

// Database Connection Test
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ DATABASE ERROR:", err.code);
  } else {
    console.log("✅ Successfully connected to Railway DB!");
    connection.release();
    initDB(); // Run table creation after connection
  }
});

// 4. Health Check Route
app.get("/", (req, res) => {
  res.send("<h1>✅ Backend is Online!</h1><p>Try the /mood route to see data.</p>");
});

// 5. GET Moods
app.get("/mood", (req, res) => {
  db.query("SELECT * FROM moods ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 6. POST New Mood
app.post("/mood", async (req, res) => {
  const { full_name, mood_text } = req.body;
  if (!full_name || !mood_text) return res.status(400).json({ error: "Missing fields" });

  let aiAdvice = "";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a supportive mental health companion. Give a short, calming message." },
          { role: "user", content: `I am ${full_name} and I feel ${mood_text}` }
        ]
      })
    });

    const data = await response.json();
    aiAdvice = data.choices?.[0]?.message?.content || "Keep going, you're doing great.";

  } catch (error) {
    console.warn("Groq failed or key missing, using fallback.");
    const fallbacks = [
      "Take a deep breath. You are doing better than you think.",
      "It's okay to rest. You don't have to solve everything today.",
      "Small steps still move you forward."
    ];
    aiAdvice = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  db.query(
    "INSERT INTO moods (full_name, mood_text) VALUES (?, ?)",
    [full_name, mood_text],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ai_message: aiAdvice }); 
    }
  );
});

// 7. Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});