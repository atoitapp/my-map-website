// server.js
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Server-side password
const PASSWORD = 'lsad123';

// Example camp data
let camps = [
  { name: 'Camp A', date: '2026-01-04', nowtime: '10:00', campnotes: 'Note A', expertlat: 45.5017, expertlon: -73.5673 },
  { name: 'Camp B', date: '2026-01-04', nowtime: '11:00', campnotes: 'Note B', expertlat: 45.505, expertlon: -73.565 },
];

// Login endpoint
app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    res.json({ success: true, token: 'secret-token' }); // simple token for demo
  } else {
    res.status(401).json({ success: false, message: 'Wrong password' });
  }
});

// Camps endpoint
app.get('/camps', (req, res) => {
  // In production, validate token here
  res.json(camps);
});

// Optional: simulate updating camps every 10 seconds
setInterval(() => {
  const latOffset = (Math.random() - 0.5) / 100;
  const lonOffset = (Math.random() - 0.5) / 100;
  camps = camps.map(c => ({
    ...c,
    expertlat: c.expertlat + latOffset,
    expertlon: c.expertlon + lonOffset
  }));
}, 10000);

app.listen(3000, () => console.log('Server running at http://localhost:3000'));
