# 📰 Newsmania — The Morning Edition

> All the world's headlines. One place.

Newsmania is a full-stack newspaper web app that aggregates headlines from **17+ real news sources** into a beautiful editorial broadsheet interface. Features a screenshot tool, sticky notes, live ticker, dark mode, and full-text search.

---

## Features

| Feature | Description |
|---------|-------------|
| 📡 **News Aggregation** | Fetches RSS feeds from 17+ sources: TOI, NDTV, BBC, Reuters, TechCrunch, ESPN, and more |
| 🗂 **Categories** | Filter by All, India, World, Tech, Business, Sports, Science, Entertainment |
| 🔍 **Search** | Real-time search across all cached articles (`Ctrl+K`) |
| 📸 **Screenshot** | Capture current headlines as a printable/downloadable snapshot |
| 📝 **Notes** | Save thoughts linked to specific articles with color-coded sticky notes |
| 📺 **Live Ticker** | Scrolling ticker bar with the latest headlines |
| 🌙 **Dark Mode** | Full dark mode with preference saved in localStorage |
| ⚡ **Caching** | Server-side 10-minute cache so feeds load instantly on repeat visits |

---

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: HTML5, CSS3, jQuery
- **RSS Parsing**: `rss-parser`
- **Caching**: `node-cache`
- **Screenshot**: Browser Print API (client-side)
- **Notes Storage**: JSON file (easily swappable with MongoDB/SQLite)

---

## Quick Start

```bash
# 1. Clone or unzip the project
cd newsmania

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Start the server
npm start
# → http://localhost:3000

# Development (auto-restart)
npm run dev
```

---

## Project Structure

```
newsmania/
├── public/
│   ├── index.html          ← Single-page frontend
│   ├── css/
│   │   └── style.css       ← Full design system
│   └── js/
│       └── app.js          ← jQuery frontend logic
├── server/
│   ├── index.js            ← Express app entry
│   └── newsAggregator.js   ← RSS fetcher + cache
├── routes/
│   ├── news.js             ← /api/news endpoints
│   ├── notes.js            ← /api/notes CRUD
│   └── screenshot.js       ← /api/screenshot
├── .env.example
├── package.json
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/news` | All news (optional `?category=tech`) |
| GET | `/api/news/trending` | Most recent 30 articles across all sources |
| GET | `/api/news/sources` | List all sources |
| GET | `/api/news/search?q=query` | Full-text search |
| GET | `/api/notes` | Get all notes |
| POST | `/api/notes` | Create note `{ title, content, color, articleUrl }` |
| PUT | `/api/notes/:id` | Update note |
| DELETE | `/api/notes/:id` | Delete note |

---

## News Sources

| Source | Category |
|--------|----------|
| Times of India, NDTV, Hindustan Times | India |
| BBC World, Reuters, Al Jazeera | World |
| TechCrunch, The Verge, Wired | Technology |
| ESPN, Sky Sports | Sports |
| Business Standard, Economic Times | Business |
| NASA, Science Daily | Science |
| Hollywood Reporter | Entertainment |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+K` | Open search |
| `Esc` | Close modal / search / notes panel |

---

## Extending

**Add a new news source** — edit `server/newsAggregator.js`:
```js
'My Source': {
  url: 'https://example.com/rss',
  category: 'tech',
  color: '#3498db'
}
```

**Use a database for notes** — swap the JSON file logic in `routes/notes.js` with any DB adapter (MongoDB, SQLite, PostgreSQL).

---

## License

MIT
