require('dotenv').config();
const express = require('express');
const path = require('path');
const { requestLogger, errorHandler, notFound } = require('./middleware');
const urlRoutes = require('./routes/urls');
const bookmarkRoutes = require('./routes/bookmarks');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', bookmarkRoutes);
app.use('/api', urlRoutes);

// Short URL redirect (must be after API routes)
app.use('/', urlRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;