const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/scrape-images', async (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Valid URL required in body { url: "https://..." }' });
  }

  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(data);
    const imageURLs = [];

    $('img').each((i, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src');
      if (src && src.startsWith('http')) {
        imageURLs.push(src);
      }
    });

    res.json({
      total: imageURLs.length,
      images: imageURLs
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to scrape images', details: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Image Scraper API is Running');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
