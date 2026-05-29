const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Static files — serve the website/ folder ───────────
app.use(express.static(path.join(__dirname, 'website')));

// ── API: Contact Form ───────────────────────────────────
app.post('/api/contact', (req, res) => {
  const { name, email, brand, goal } = req.body;

  // Basic validation
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required.' });
  }

  const submission = {
    id:        Date.now(),
    timestamp: new Date().toISOString(),
    name,
    email,
    brand:     brand  || '—',
    goal:      goal   || '—',
  };

  console.log('\n📬 New contact submission:');
  console.log(JSON.stringify(submission, null, 2));

  // Save to submissions.json (append)
  const filePath = path.join(__dirname, 'submissions.json');
  let submissions = [];
  try {
    if (fs.existsSync(filePath)) {
      submissions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (_) {}
  submissions.push(submission);
  fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2));

  return res.status(200).json({
    success: true,
    message: 'Thanks! We\'ll be in touch soon.',
  });
});

// ── Catch-all: serve index.html for any unknown routes ─
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'website', 'index.html'));
});

// ── Start server ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 The 10x Brand server running at http://localhost:${PORT}\n`);
});
