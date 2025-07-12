require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const urlParser = require('url');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/public', express.static(`${process.cwd()}/public`));

// Data store
let urlDatabase = {};
let nextId = 1;

// Home page
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Test route
app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

// POST: shorten URL
app.post('/api/shorturl', (req, res) => {
  const inputUrl = req.body.url;

  // Basic format validation
  const validFormat = /^https?:\/\/.+/i;
  if (!validFormat.test(inputUrl)) {
    return res.json({ error: 'invalid url' });
  }

  // DNS hostname validation
  const hostname = urlParser.parse(inputUrl).hostname;
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const shortId = nextId++;
    urlDatabase[shortId] = inputUrl;

    res.json({
      original_url: inputUrl,
      short_url: shortId
    });
  });
});

// GET: redirect by short_url
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortId = parseInt(req.params.short_url);
  const originalUrl = urlDatabase[shortId];

  if (!originalUrl) {
    return res.json({ error: 'No short URL found for given input' });
  }

  res.redirect(originalUrl);
});

// Start server
app.listen(port, () => {
  console.log(`URL Shortener running on port ${port}`);
});
