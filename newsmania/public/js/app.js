/* ═══════════════════════════════════════════════
   NEWSMANIA — app.js (jQuery + Vanilla)
   ═══════════════════════════════════════════════ */

$(function () {

  /* ── STATE ─────────────────────────────────── */
  let currentCategory = 'all';
  let selectedNoteColor = '#f9ca24';
  let notes = [];
  let allArticles = [];
  let searchDebounce;

  /* ── DATE & TIME ────────────────────────────── */
  function updateClock() {
    const now = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    $('#live-date').text(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`);
    $('#live-time').text(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ── DARK MODE ──────────────────────────────── */
  const savedTheme = localStorage.getItem('nm-theme') || 'light';
  if (savedTheme === 'dark') $('html').attr('data-theme', 'dark');

  $('#btn-dark').on('click', function () {
    const isDark = $('html').attr('data-theme') === 'dark';
    $('html').attr('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('nm-theme', isDark ? 'light' : 'dark');
    $('#dark-icon').html(isDark
      ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
      : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
    );
  });

  /* ── FETCH NEWS ─────────────────────────────── */
  function fetchNews(category = 'all') {
    $('#loader').show();
    $('#news-container').empty();

    $.ajax({
      url: `/api/news?category=${category}`,
      method: 'GET',
      success: function (res) {
        $('#loader').hide();
        if (res.success && res.data.length) {
          allArticles = res.data.flatMap(f => f.articles);
          renderNewsSections(res.data);
          setupTicker(allArticles);
        } else {
          showEmpty('No news found for this category.');
        }
      },
      error: function () {
        $('#loader').hide();
        showEmpty('Could not connect to the news server. Make sure it is running.');
      }
    });
  }

  /* ── RENDER SECTIONS ────────────────────────── */
  function renderNewsSections(feeds) {
    const $container = $('#news-container').empty();

    feeds.forEach((feed, i) => {
      if (!feed.articles.length) return;

      const $section = $('<div>').addClass('source-section')
        .css('animation-delay', `${i * 0.05}s`);

      const $header = $('<div>').addClass('source-header');
      $('<span>').addClass('source-dot').css('background', feed.color).appendTo($header);
      $('<span>').addClass('source-name').text(feed.name).appendTo($header);
      $('<span>').addClass('source-count').text(`${feed.articles.length} articles`).appendTo($header);
      $section.append($header);

      const $grid = $('<div>').addClass('articles-grid');
      feed.articles.forEach(article => {
        $grid.append(buildCard(article));
      });

      $section.append($grid);
      $container.append($section);
    });
  }

  /* ── BUILD ARTICLE CARD ─────────────────────── */
  function buildCard(article) {
    const $card = $('<div>').addClass('article-card');

    // Image
    if (article.image) {
      $('<img>')
        .addClass('article-image')
        .attr('src', article.image)
        .attr('alt', article.title)
        .attr('loading', 'lazy')
        .on('error', function () {
          $(this).replaceWith(noImagePlaceholder());
        })
        .appendTo($card);
    } else {
      $card.append(noImagePlaceholder());
    }

    const $body = $('<div>').addClass('article-body');

    // Meta
    const $meta = $('<div>').addClass('article-meta');
    $('<span>').addClass('article-category')
      .text(article.category)
      .css('background', article.color)
      .appendTo($meta);
    if (article.pubDate) {
      const d = new Date(article.pubDate);
      $('<span>').addClass('article-date')
        .text(isNaN(d) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))
        .appendTo($meta);
    }
    $body.append($meta);

    // Title
    $('<h3>').addClass('article-title').text(article.title).appendTo($body);

    // Summary
    if (article.summary) {
      $('<p>').addClass('article-summary')
        .text(stripHtml(article.summary))
        .appendTo($body);
    }

    // Footer
    const $footer = $('<div>').addClass('article-footer');
    $('<a>').addClass('article-read')
      .text('Read →')
      .attr({ href: article.link, target: '_blank', rel: 'noopener' })
      .appendTo($footer);

    $('<button>').addClass('article-note-btn')
      .text('+ Note')
      .on('click', function (e) {
        e.stopPropagation();
        openNoteModal(null, article.link, article.title);
      })
      .appendTo($footer);

    $body.append($footer);
    $card.append($body);
    return $card;
  }

  function noImagePlaceholder() {
    return $('<div>').addClass('no-image').html(
      `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
    );
  }

  function stripHtml(html) {
    return $('<div>').html(html).text().replace(/\s+/g, ' ').trim();
  }

  /* ── TICKER ─────────────────────────────────── */
  function setupTicker(articles) {
    const sample = articles.slice(0, 20);
    let html = '';
    sample.forEach(a => {
      html += `<span class="ticker-item">${a.title}</span>`;
    });
    // Duplicate for seamless scroll
    const $track = $('#ticker-track').html(html + html);
  }

  /* ── CATEGORY FILTER ────────────────────────── */
  $('.cat-btn').on('click', function () {
    $('.cat-btn').removeClass('active');
    $(this).addClass('active');
    currentCategory = $(this).data('cat');
    fetchNews(currentCategory);
  });

  /* ── SEARCH ─────────────────────────────────── */
  $('#btn-search').on('click', function () {
    $('#search-bar').toggleClass('open');
    if ($('#search-bar').hasClass('open')) {
      setTimeout(() => $('#search-input').focus(), 300);
    }
  });

  $('#search-close').on('click', function () {
    $('#search-bar').removeClass('open');
    $('#search-input').val('');
    fetchNews(currentCategory);
  });

  $('#search-input').on('input', function () {
    clearTimeout(searchDebounce);
    const q = $(this).val().trim();
    if (q.length < 2) { fetchNews(currentCategory); return; }

    searchDebounce = setTimeout(() => {
      $.ajax({
        url: `/api/news/search?q=${encodeURIComponent(q)}`,
        success: function (res) {
          if (res.success) renderSearchResults(res.data, q);
        }
      });
    }, 400);
  });

  function renderSearchResults(articles, q) {
    const $container = $('#news-container').empty();
    $('#loader').hide();

    $('<p>').addClass('search-results-header')
      .text(`${articles.length} results for "${q}"`)
      .appendTo($container);

    if (!articles.length) { showEmpty('No articles matched your search.'); return; }

    const $grid = $('<div>').addClass('articles-grid');
    articles.forEach(a => $grid.append(buildCard(a)));
    $container.append($grid);
  }

  /* ── NOTES ──────────────────────────────────── */
  function fetchNotes() {
    $.get('/api/notes', function (res) {
      if (res.success) { notes = res.data; renderNotes(); }
    });
  }

  function renderNotes() {
    const $list = $('#notes-list').empty();
    if (!notes.length) {
      $list.html('<p style="font-style:italic;color:var(--ink-4);font-size:13px;text-align:center;padding:24px 0;">No notes yet. Add one!</p>');
      return;
    }
    notes.forEach(note => {
      const $card = $('<div>').addClass('note-card')
        .css('border-left-color', note.color || '#f9ca24')
        .on('click', function () { openNoteModal(note); });

      $('<div>').addClass('note-card-title').text(note.title || 'Untitled').appendTo($card);
      $('<div>').addClass('note-card-excerpt').text(note.content).appendTo($card);

      const $footer = $('<div>').addClass('note-card-footer');
      const d = new Date(note.createdAt);
      $('<span>').addClass('note-card-date')
        .text(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }))
        .appendTo($footer);

      $('<button>').addClass('note-delete').text('Delete')
        .on('click', function (e) {
          e.stopPropagation();
          deleteNote(note.id);
        })
        .appendTo($footer);

      $card.append($footer);

      if (note.articleTitle && note.articleUrl) {
        $('<a>').addClass('note-article-link')
          .attr({ href: note.articleUrl, target: '_blank', rel: 'noopener' })
          .text('↗ ' + note.articleTitle)
          .on('click', e => e.stopPropagation())
          .appendTo($card);
      }

      $list.append($card);
    });
  }

  function openNoteModal(note = null, articleUrl = '', articleTitle = '') {
    if (note) {
      $('#modal-title').text('Edit Note');
      $('#note-title-input').val(note.title || '');
      $('#note-content-input').val(note.content || '');
      $('#note-id').val(note.id);
      $('#note-article-url').val(note.articleUrl || '');
      $('#note-article-title').val(note.articleTitle || '');
      selectedNoteColor = note.color || '#f9ca24';
    } else {
      $('#modal-title').text('New Note');
      $('#note-title-input').val('');
      $('#note-content-input').val('');
      $('#note-id').val('');
      $('#note-article-url').val(articleUrl);
      $('#note-article-title').val(articleTitle);
      selectedNoteColor = '#f9ca24';
    }

    // Sync color dots
    $('.color-dot').removeClass('active');
    $(`.color-dot[data-color="${selectedNoteColor}"]`).addClass('active');

    $('#note-modal').addClass('open');
    setTimeout(() => $('#note-content-input').focus(), 200);
  }

  function closeNoteModal() {
    $('#note-modal').removeClass('open');
  }

  $('#btn-notes').on('click', function () {
    $('#notes-panel').addClass('open');
    fetchNotes();
  });

  $('#notes-close').on('click', function () {
    $('#notes-panel').removeClass('open');
  });

  $('#add-note-btn').on('click', function () {
    openNoteModal();
  });

  $('#note-modal-close, #note-cancel').on('click', closeNoteModal);

  $('#note-modal').on('click', function (e) {
    if ($(e.target).is('#note-modal')) closeNoteModal();
  });

  // Color picker
  $(document).on('click', '.color-dot', function () {
    $('.color-dot').removeClass('active');
    $(this).addClass('active');
    selectedNoteColor = $(this).data('color');
  });

  // Save note
  $('#note-save').on('click', function () {
    const content = $('#note-content-input').val().trim();
    if (!content) { showToast('Please write something!'); return; }

    const id           = $('#note-id').val();
    const title        = $('#note-title-input').val().trim() || 'Untitled';
    const articleUrl   = $('#note-article-url').val();
    const articleTitle = $('#note-article-title').val();

    const payload = { title, content, color: selectedNoteColor, articleUrl, articleTitle };

    if (id) {
      // Update
      $.ajax({
        url: `/api/notes/${id}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function (res) {
          if (res.success) {
            notes = notes.map(n => n.id === id ? res.data : n);
            renderNotes();
            closeNoteModal();
            showToast('Note updated!');
          }
        }
      });
    } else {
      // Create
      $.ajax({
        url: '/api/notes',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function (res) {
          if (res.success) {
            notes.unshift(res.data);
            renderNotes();
            closeNoteModal();
            showToast('Note saved!');
          }
        }
      });
    }
  });

  function deleteNote(id) {
    if (!confirm('Delete this note?')) return;
    $.ajax({
      url: `/api/notes/${id}`,
      method: 'DELETE',
      success: function () {
        notes = notes.filter(n => n.id !== id);
        renderNotes();
        showToast('Note deleted.');
      }
    });
  }

  /* ── SCREENSHOT ─────────────────────────────── */
  $('#btn-screenshot').on('click', function () {
    showToast('Capturing screenshot…');

    // Client-side screenshot using browser print / html2canvas fallback
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Newsmania Screenshot</title>
        <style>
          body { font-family: Georgia, serif; background: #f5f0e8; color: #0d0d0d; margin: 0; padding: 20px; }
          h1 { font-size: 48px; text-align: center; border-bottom: 2px solid #0d0d0d; padding-bottom: 10px; }
          .meta { text-align: center; font-size: 13px; color: #888; margin-bottom: 20px; }
          .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .card { border: 1px solid #ccc; padding: 12px; }
          .card h3 { font-size: 15px; margin-bottom: 6px; }
          .card .src { font-size: 11px; color: #888; }
        </style>
      </head>
      <body>
        <h1>Newsmania</h1>
        <p class="meta">Screenshot · ${new Date().toLocaleString('en-IN')} · Category: ${currentCategory}</p>
        <div class="cards">
          ${allArticles.slice(0, 12).map(a => `
            <div class="card">
              <div class="src">${a.source}</div>
              <h3>${a.title}</h3>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([printContent], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');

    if (win) {
      win.onload = function () {
        win.print();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      };
      showToast('Print dialog opened!');
    } else {
      // Fallback: direct download
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsmania-${Date.now()}.html`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      showToast('Downloaded as HTML!');
    }
  });

  /* ── TOAST ──────────────────────────────────── */
  function showToast(msg, duration = 3000) {
    const $toast = $('#toast').text(msg).addClass('show');
    setTimeout(() => $toast.removeClass('show'), duration);
  }

  /* ── BACK TO TOP ────────────────────────────── */
  $(window).on('scroll', function () {
    if ($(this).scrollTop() > 400) {
      $('#back-top').addClass('visible');
    } else {
      $('#back-top').removeClass('visible');
    }
  });

  $('#back-top').on('click', function () {
    $('html, body').animate({ scrollTop: 0 }, 400);
  });

  /* ── EMPTY STATE ─────────────────────────────── */
  function showEmpty(msg) {
    $('#news-container').html(`
      <div style="text-align:center;padding:60px 20px;font-style:italic;color:var(--ink-3);font-size:16px;">
        ${msg}
      </div>
    `);
  }

  /* ── KEYBOARD SHORTCUTS ─────────────────────── */
  $(document).on('keydown', function (e) {
    if (e.key === 'Escape') {
      closeNoteModal();
      $('#search-bar').removeClass('open');
      $('#notes-panel').removeClass('open');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      $('#btn-search').trigger('click');
    }
  });

  /* ── INIT ───────────────────────────────────── */
  fetchNews('all');

});
