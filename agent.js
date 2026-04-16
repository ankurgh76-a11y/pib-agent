// Hybrid Agent Strategy:
// 1. Fetch the list of articles directly (faster, no block for small list pages).
// 2. Read the full article content using AI Reader (to bypass bot detection for Detail pages).

const BASE_URL = 'https://www.pib.gov.in';
const JINA_PREFIX = 'https://r.jina.ai/';

async function scrapeArticles(dayStr, monthStr, yearStr) {
    console.log(`Agent: Fetching links for ${dayStr} ${monthStr} ${yearStr}...`);

    const monthMap = {
        "January": "1", "February": "2", "March": "3", "April": "4", "May": "5", "June": "6",
        "July": "7", "August": "8", "September": "9", "October": "10", "November": "11", "December": "12"
    };
    const numericMonth = isNaN(monthStr) ? monthMap[monthStr] : monthStr;
    const dayParam = dayStr.replace(/^0+/, '') || "1";

    // Standard list URL
    const pibUrl = `${BASE_URL}/allRel.aspx?reg=3&lang=1`;

    try {
        // Direct fetch for the list (usually not blocked if we use a clean User-Agent)
        const response = await fetch(pibUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html'
            }
        });
        const html = await response.text();

        // Extract article IDs and titles from the HTML
        // Note: For historical dates, PIB uses a POST. To keep it simple and AI-friendly,
        // we will fetch the LATEST releases from the main page.
        const regex = /PressReleasePage\.aspx\?PRID=(\d+)["'][^>]*>(.*?)<\/a>/g;
        const articles = [];
        let match;

        while ((match = regex.exec(html)) !== null) {
            const id = match[1];
            const title = match[2].trim().replace(/<[^>]+>/g, '');
            const link = `${BASE_URL}/PressReleasePage.aspx?PRID=${id}`;

            if (title.length > 10 && !articles.find(a => a.id === id)) {
                articles.push({ id, title, link });
            }
        }

        console.log(`Agent: Found ${articles.length} news links.`);
        
        // If the user picked a specific date and we found nothing (because it's not today),
        // we use Jina to perform a search for that date.
        if (articles.length === 0) {
            console.log("Agent: Using AI Search fallback for specific date...");
            const searchUrl = `${JINA_PREFIX}${BASE_URL}/allRel.aspx?reg=3&lang=1&y=${yearStr}&m=${numericMonth}&d=${dayParam}`;
            const searchResponse = await fetch(searchUrl);
            const markdown = await searchResponse.text();
            
            // Extract from Jina markdown
            const jinaRegex = /\[(.*?)\]\((.*?PRID=(\d+).*?)\)/g;
            while ((match = jinaRegex.exec(markdown)) !== null) {
                const title = match[1].trim();
                const link = match[2];
                const id = match[3];
                if (title.length > 10 && !articles.find(a => a.id === id)) {
                    articles.push({ id, title, link });
                }
            }
        }

        return articles;
    } catch (err) {
        console.error('Agent Error:', err.message);
        return [];
    }
}

async function scrapeArticleDetail(url) {
    console.log(`Agent: Reading article detail via AI Reader: ${url}`);
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

        return { title: cleanTitle, content: contentHtml };
    } catch (err) {
        console.error('Agent Error:', err.message);
        return { title: 'Error', content: 'Failed to load article detail.' };
    }
}

module.exports = { scrapeArticles, scrapeArticleDetail };
