const express = require('express');
const router = express.Router();
const Bookmark = require('../models/bookmark');
const { validateBookmark } = require('../middleware');
const { processUrl } = require('../services/aiProcessor');
const { isValidUrl } = require('../utils/validators');

// Create bookmark
router.post('/bookmarks', validateBookmark, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL. Must be a valid http:// or https:// URL' });
  }

  try {
    let { tags, summary, ...rest } = req.body;

    if (!tags || !summary) {
      const aiResult = await processUrl(url);
      tags = tags || aiResult.tags;
      summary = summary || aiResult.summary;
    }

    const bookmark = await Bookmark.create({ ...rest, tags, summary });
    res.status(201).json(bookmark);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all bookmarks
router.get('/bookmarks', async (req, res) => {
  try {
    const { category, tag, search, limit, offset } = req.query;
    const bookmarks = await Bookmark.getAll({ category, tag, search, limit, offset });
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get bookmark by ID
router.get('/bookmarks/:id', async (req, res) => {
  try {
    const bookmark = await Bookmark.getById(req.params.id);
    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    res.json(bookmark);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Update bookmark
router.put('/bookmarks/:id', validateBookmark, async (req, res) => {
  try {
    const bookmark = await Bookmark.update(req.params.id, req.body);
    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    res.json(bookmark);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete bookmark
router.delete('/bookmarks/:id', async (req, res) => {
  try {
    const result = await Bookmark.delete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;