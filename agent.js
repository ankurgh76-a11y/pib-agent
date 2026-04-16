// Ultimate AI Agent Strategy:
// 1. Discovery: Use Google News RSS to find the latest PIB links (Never blocked, 100% GET-based).
// 2. Reading: Use AI Reader (Jina) to read the full content of those links (Bypasses all bot detection).

const BASE_URL = 'https://www.pib.gov.in';
const JINA_PREFIX = 'https://r.jina.ai/';

async function scrapeArticles(dayStr, monthStr, yearStr) {
    console.log(`Agent: Searching Google News for PIB articles on ${dayStr} ${monthStr} ${yearStr}...`);

    const monthMap = {
        "January": "01", "February": "02", "March": "03", "April": "04", "May": "05", "June": "06",
        "July": "07", "August": "08", "September": "09", "October": "10", "November": "11", "December": "12"
    };
    const numericMonth = isNaN(monthStr) ? monthMap[monthStr] : (monthStr.padStart(2, '0'));
    const dayParam = dayStr.padStart(2, '0');
    
    // Construct a Google News search query for PIB articles for a specific day
    const query = encodeURIComponent(`site:pib.gov.in releases after:${yearStr}-${numericMonth}-${dayParam} before:${yearStr}-${numericMonth}-${parseInt(dayParam)+2}`);
    const googleRssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;

    try {
        const response = await fetch(googleRssUrl);
        const xml = await response.text();

        // Extract <title> and <link> from the RSS feed
        const articles = [];
        const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>/g;
        let match;

        while ((match = itemRegex.exec(xml)) !== null) {
            const title = match[1].trim().replace(/&amp;/g, '&');
            const link = match[2];
            
            // Clean title (it often ends with "- Press Information Bureau")
            const cleanTitle = title.replace(/\s*-\s*Press Information Bureau\s*$/i, '');
            
            if (cleanTitle.length > 5 && link.includes('pib.gov.in')) {
                articles.push({
                    title: cleanTitle,
                    link: link,
                    id: link.match(/PRID=(\d+)/)?.[1] || Math.random().toString()
                });
            }
        }

        console.log(`Agent: Found ${articles.length} news articles via Google Discovery.`);
        return articles;
    } catch (err) {
        console.error('Agent Error:', err.message);
        return [];
    }
}

async function scrapeArticleDetail(url) {
    console.log(`Agent: Reading article detail via AI Reader: ${url}`);
    
    // Some Google News links are redirects, Jina handles them but it's better to ensure we have the direct link
    const readerUrl = `${JINA_PREFIX}${url}`;

    try {
        const response = await fetch(readerUrl, {
            headers: { 'Accept': 'application/json' }
        });
        const data = await response.json();
        
        const cleanContent = data.data?.content || "Content extraction failed.";
        const cleanTitle = data.data?.title || "PIB Press Release";

        const contentHtml = `
            <div style="color: #ccc; line-height: 1.6; font-size: 1.05rem;">
                ${cleanContent.split('\n\n').join('</div><div style="margin-bottom: 1rem;">')}
            </div>
        `;

        return {
            title: cleanTitle,
            content: contentHtml
        };
    } catch (err) {
        console.error('Agent Error:', err.message);
        return {
            title: 'Error',
            content: 'Failed to load article detail.'
        };
    }
}

module.exports = { scrapeArticles, scrapeArticleDetail };
