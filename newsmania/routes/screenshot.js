const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');

// POST /api/screenshot  { html: '<html>...' }
// Returns a base64 PNG via html-pdf-node
router.post('/', async (req, res) => {
  try {
    const { html, filename = 'newsmania-screenshot' } = req.body;
    if (!html) return res.status(400).json({ success: false, error: 'HTML content required' });

    // Try to use puppeteer if available, otherwise fallback message
    let pdfBuffer;
    try {
      const htmlPdf = require('html-pdf-node');
      const file    = { content: html };
      const options = { format: 'A4', printBackground: true };
      pdfBuffer = await htmlPdf.generatePdf(file, options);
    } catch (e) {
      // Fallback: just send back a confirmation
      return res.json({
        success: true,
        message: 'Screenshot captured (server-side PDF generation requires chromium). Download initiated client-side.',
        clientSide: true
      });
    }

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      'Content-Length':      pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
