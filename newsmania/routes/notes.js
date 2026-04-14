const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

const NOTES_FILE = path.join(__dirname, '../server/notes.json');

function loadNotes() {
  if (!fs.existsSync(NOTES_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf-8')); }
  catch { return []; }
}

function saveNotes(notes) {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}

// GET all notes
router.get('/', (req, res) => {
  res.json({ success: true, data: loadNotes() });
});

// POST create note
router.post('/', (req, res) => {
  const { title, content, articleUrl, articleTitle, color = '#f9ca24' } = req.body;
  if (!content) return res.status(400).json({ success: false, error: 'Content required' });

  const notes = loadNotes();
  const note  = {
    id:           Date.now().toString(),
    title:        title || 'Untitled Note',
    content,
    articleUrl:   articleUrl   || null,
    articleTitle: articleTitle || null,
    color,
    createdAt:    new Date().toISOString(),
    updatedAt:    new Date().toISOString()
  };

  notes.unshift(note);
  saveNotes(notes);
  res.json({ success: true, data: note });
});

// PUT update note
router.put('/:id', (req, res) => {
  const notes = loadNotes();
  const idx   = notes.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Note not found' });

  notes[idx] = { ...notes[idx], ...req.body, updatedAt: new Date().toISOString() };
  saveNotes(notes);
  res.json({ success: true, data: notes[idx] });
});

// DELETE note
router.delete('/:id', (req, res) => {
  const notes = loadNotes();
  const filtered = notes.filter(n => n.id !== req.params.id);
  saveNotes(filtered);
  res.json({ success: true });
});

module.exports = router;
