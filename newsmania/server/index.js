require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const newsRoutes       = require('../routes/news');
const screenshotRoutes = require('../routes/screenshot');
const notesRoutes      = require('../routes/notes');

const app  = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/news',       newsRoutes);
app.use('/api/screenshot', screenshotRoutes);
app.use('/api/notes',      notesRoutes);

// Serve main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n📰 Newsmania running at http://localhost:${PORT}\n`);
});

module.exports = app;
