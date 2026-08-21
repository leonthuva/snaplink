// Request logging middleware
function requestLogger(req, res, next) {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
}

// Error handling middleware
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
}

// 404 handler
function notFound(req, res, next) {
  res.status(404).json({ error: 'Not found' });
}

// Bookmark validation middleware
function validateBookmark(req, res, next) {
  const { url, title } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }
  
  if (title && typeof title !== 'string') {
    return res.status(400).json({ error: 'Title must be a string' });
  }
  
  if (req.body.tags && !Array.isArray(req.body.tags)) {
    return res.status(400).json({ error: 'Tags must be an array' });
  }
  
  if (req.body.category && typeof req.body.category !== 'string') {
    return res.status(400).json({ error: 'Category must be a string' });
  }
  
  if (req.body.summary && typeof req.body.summary !== 'string') {
    return res.status(400).json({ error: 'Summary must be a string' });
  }
  
  next();
}

module.exports = {
  requestLogger,
  errorHandler,
  notFound,
  validateBookmark
};