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
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    const initialRes = await axios.get(targetUrl, { headers });
    const html = initialRes.data;

    const vqdMatch = html.match(/vqd='(.+?)'/) || html.match(/vqd=\\?"(.+?)\\?"/);
    const vqd = vqdMatch ? vqdMatch[1] : null;

    if (!vqd) {
      return res.status(500).json({
        error: 'Failed to extract DuckDuckGo token (vqd)',
        hint: 'DuckDuckGo may have changed its structure. Try again later or use Bing API.'
      });
    }

    const imageApiUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(topic)}&vqd=${vqd}`;

    const { data } = await axios.get(imageApiUrl, {
      headers: {
        ...headers,
        'Referer': targetUrl,
      }
    });

    const images = data.results.map(img => img.image);

    res.json({
      topic,
      total: images.length,
      images,
    });

  } catch (err) {
    res.status(500).json({
      error: 'Scraping failed',
      message: err.message,
      suggestion: 'Try switching to Bing, SerpAPI, or use static image sources if frequent failures occur.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
