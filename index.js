const express = require('express');
const cors = require('cors');
const { scrapeArticles, scrapeArticleDetail } = require('./agent');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper to get month name
const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

app.get('/', (req, res) => {
    res.send('PIB Agent Server is Live! 🚀');
});

app.get('/api/articles', async (req, res) => {
    const { d, m, y } = req.query;
    
    // Default to today if not provided
    const date = new Date();
    const day = d || date.getDate();
    const month = m || monthNames[date.getMonth()];
    const year = y || date.getFullYear();

    try {
        const articles = await scrapeArticles(day, month, year);
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch articles' });
    }
});

app.get('/api/article-detail', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const detail = await scrapeArticleDetail(url);
        res.json(detail);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch article detail' });
    }
});

app.listen(PORT, () => {
    console.log(`Agent Server running on http://localhost:${PORT}`);
});
