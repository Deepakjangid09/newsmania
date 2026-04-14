const Parser  = require('rss-parser');
const NodeCache = require('node-cache');

const parser = new Parser({
  customFields: {
    item: [['media:content', 'media'], ['media:thumbnail', 'thumbnail'], ['enclosure', 'enclosure']]
  }
});

// Cache for 10 minutes
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const SOURCES = {
  'Times of India':      { url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',   category: 'india',   color: '#c0392b' },
  'NDTV':               { url: 'https://feeds.feedburner.com/ndtvnews-top-stories',              category: 'india',   color: '#e74c3c' },
  'Hindustan Times':    { url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', category: 'india',   color: '#2980b9' },
  'BBC World':          { url: 'https://feeds.bbci.co.uk/news/world/rss.xml',                   category: 'world',   color: '#c0392b' },
  'Reuters':            { url: 'https://feeds.reuters.com/reuters/topNews',                      category: 'world',   color: '#e67e22' },
  'Al Jazeera':         { url: 'https://www.aljazeera.com/xml/rss/all.xml',                     category: 'world',   color: '#27ae60' },
  'TechCrunch':         { url: 'https://techcrunch.com/feed/',                                  category: 'tech',    color: '#2ecc71' },
  'The Verge':          { url: 'https://www.theverge.com/rss/index.xml',                        category: 'tech',    color: '#8e44ad' },
  'Wired':              { url: 'https://www.wired.com/feed/rss',                                category: 'tech',    color: '#2c3e50' },
  'ESPN':               { url: 'https://www.espn.com/espn/rss/news',                            category: 'sports',  color: '#e74c3c' },
  'Sky Sports':         { url: 'https://www.skysports.com/rss/12040',                           category: 'sports',  color: '#3498db' },
  'Business Standard':  { url: 'https://www.business-standard.com/rss/home_page_top_stories.rss', category: 'business', color: '#f39c12' },
  'Economic Times':     { url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms',   category: 'business', color: '#e67e22' },
  'NASA':               { url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',               category: 'science', color: '#3498db' },
  'Science Daily':      { url: 'https://www.sciencedaily.com/rss/all.xml',                     category: 'science', color: '#1abc9c' },
  'Hollywood Reporter': { url: 'https://www.hollywoodreporter.com/feed/',                      category: 'entertainment', color: '#9b59b6' },
};

/**
 * Fetch a single RSS feed with timeout
 */
async function fetchFeed(name, source) {
  const cacheKey = `feed_${name}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const feed = await Promise.race([
      parser.parseURL(source.url),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
    ]);

    const articles = (feed.items || []).slice(0, 12).map(item => {
      // Try to extract image
      let image = null;
      if      (item.enclosure?.url)             image = item.enclosure.url;
      else if (item.thumbnail?.['$']?.url)      image = item.thumbnail['$'].url;
      else if (item.media?.['$']?.url)          image = item.media['$'].url;
      else if (item['media:content']?.['$']?.url) image = item['media:content']['$'].url;

      return {
        title:     item.title        || 'Untitled',
        link:      item.link         || item.guid || '#',
        summary:   item.contentSnippet || item.content || '',
        pubDate:   item.pubDate      || item.isoDate || '',
        image,
        source:    name,
        category:  source.category,
        color:     source.color
      };
    });

    const result = { name, articles, category: source.category, color: source.color };
    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn(`  ⚠ Could not fetch "${name}": ${err.message}`);
    return { name, articles: [], category: source.category, color: source.color, error: true };
  }
}

/**
 * Fetch all feeds (or by category)
 */
async function fetchAllNews(category = 'all') {
  const sources = category === 'all'
    ? SOURCES
    : Object.fromEntries(Object.entries(SOURCES).filter(([, v]) => v.category === category));

  const results = await Promise.all(
    Object.entries(sources).map(([name, src]) => fetchFeed(name, src))
  );

  return results.filter(r => r.articles.length > 0);
}

/**
 * Search across cached feeds
 */
async function searchNews(query) {
  const allFeeds = await fetchAllNews('all');
  const q = query.toLowerCase();

  const results = [];
  for (const feed of allFeeds) {
    for (const article of feed.articles) {
      if (
        article.title.toLowerCase().includes(q) ||
        article.summary.toLowerCase().includes(q)
      ) {
        results.push(article);
      }
    }
  }
  return results;
}

/**
 * Get trending (most recent across all sources)
 */
async function getTrending() {
  const allFeeds = await fetchAllNews('all');
  const all = allFeeds.flatMap(f => f.articles);

  return all
    .filter(a => a.pubDate)
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, 30);
}

module.exports = { fetchAllNews, searchNews, getTrending, SOURCES };
