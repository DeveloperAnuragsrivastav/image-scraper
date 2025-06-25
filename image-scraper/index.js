const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ Image Scraper API is Running');
});

app.post('/scrape-images', async (req, res) => {
  const { topic, url } = req.body;

  let targetUrl = url;

  if (topic) {
    const query = encodeURIComponent(topic);
    targetUrl = `https://duckduckgo.com/?q=${query}&iax=images&ia=images`;
  }

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Valid topic or URL required' });
  }

  try {
    const initialRes = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const vqdMatch = initialRes.data.match(/vqd='(.+?)'/);
    const vqd = vqdMatch ? vqdMatch[1] : null;

    if (!vqd) {
      return res.status(500).json({ error: 'Failed to extract DuckDuckGo token (vqd)' });
    }

    const apiUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(topic)}&vqd=${vqd}`;

    const { data } = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': targetUrl
      }
    });

    const images = data.results.map(img => img.image);

    res.json({
      topic,
      source: "duckduckgo",
      total: images.length,
      images
    });

  } catch (err) {
    res.status(500).json({ error: 'Scraping failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
