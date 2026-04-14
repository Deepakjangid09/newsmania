const express = require('express');
const router  = express.Router();
const { fetchAllNews, searchNews, getTrending, SOURCES } = require('../server/newsAggregator');

// GET /api/news — all or by category
router.get('/', async (req, res) => {
  try {
    const { category = 'all' } = req.query;
    const data = await fetchAllNews(category);
    res.json({ success: true, data, total: data.reduce((n, f) => n + f.articles.length, 0) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/news/trending
router.get('/trending', async (req, res) => {
  try {
    const data = await getTrending();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/news/sources
router.get('/sources', (req, res) => {
  const sources = Object.entries(SOURCES).map(([name, s]) => ({
    name,
    category: s.category,
    color:    s.color
  }));
  res.json({ success: true, data: sources });
});

// GET /api/news/search?q=query
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, error: 'Query required' });
    const data = await searchNews(q);
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
