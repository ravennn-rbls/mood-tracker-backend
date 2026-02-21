import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Test route
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Example route for mood entries
app.post('/mood', (req, res) => {
  const { mood, note } = req.body;
  db.query(
    'INSERT INTO moods (mood, note) VALUES (?, ?)',
    [mood, note],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.send({ success: true, id: results.insertId });
    }
  );
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});