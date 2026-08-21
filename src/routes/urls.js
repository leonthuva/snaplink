const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Helper to promisify db methods
const run = (sql, params) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const get = (sql, params) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

// Create short URL
router.post('/urls', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const shortCode = Math.random().toString(36).substring(2, 8);
  
  try {
    await run('INSERT INTO urls (short_code, original_url) VALUES (?, ?)', [shortCode, url]);
    res.status(201).json({
      shortCode,
      shortUrl: `http://localhost:3000/${shortCode}`,
      originalUrl: url
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'Short code collision, try again' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// Get URL stats
router.get('/urls/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const url = await get('SELECT * FROM urls WHERE short_code = ?', [code]);
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    res.json(url);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Redirect to original URL
router.get('/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const url = await get('SELECT * FROM urls WHERE short_code = ?', [code]);
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    await run('UPDATE urls SET clicks = clicks + 1 WHERE short_code = ?', [code]);
    res.redirect(url.original_url);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;