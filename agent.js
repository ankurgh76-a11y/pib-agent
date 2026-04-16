const BASE_URL = 'https://www.pib.gov.in';
const JINA_PREFIX = 'https://r.jina.ai/';

async function scrapeArticles(dayStr, monthStr, yearStr) {
    console.log(`Agent: Searching news for Date: ${dayStr} ${monthStr} ${yearStr}`);

    const monthMap = {
        "January": "01", "February": "02", "March": "03", "April": "04", "May": "05", "June": "06",
        "July": "07", "August": "08", "September": "09", "October": "10", "November": "11", "December": "12"
    };
    const numericMonth = isNaN(monthStr) ? (monthMap[monthStr] || "01") : (monthStr.padStart(2, '0'));
    const d = parseInt(dayStr);
    
    // Construct a simpler query that works reliably
    // We search for PIB releases published around that specific date
    const query = encodeURIComponent(`site:pib.gov.in after:${yearStr}-${numericMonth}-${d-1} before:${yearStr}-${numericMonth}-${d+1}`);
    const googleRssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;

    try {
        const response = await fetch(googleRssUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const xml = await response.text();

        const articles = [];
        // More robust parsing for Google News RSS
        const items = xml.split('<item>');
        items.shift(); // remove header
        
        for (const item of items) {
            const titleMatch = item.match(/<title>(.*?)<\/title>/);
            const linkMatch = item.match(/<link>(.*?)<\/link>/);
            
            if (titleMatch && linkMatch) {
                const title = titleMatch[1].replace(/&amp;/g, '&').replace(/\s*-\s*Press Information Bureau\s*$/i, '');
                const link = linkMatch[1];
                
                if (title.length > 5 && link.includes('pib.gov.in')) {
                    articles.push({
                        title: title,
                        link: link,
                        id: link.match(/PRID=(\d+)/)?.[1] || Math.random().toString()
                    });
                }
            }
        }

        console.log(`Agent: Found ${articles.length} news items.`);
        return articles;
    } catch (err) {
        console.error('Agent Error:', err.message);
        return [];
    }
}

async function scrapeArticleDetail(url) {
    console.log(`Agent: Fetching story via AI Reader: ${url}`);
    const readerUrl = `${JINA_PREFIX}${url}`;

    try {
        const response = await fetch(readerUrl, {
            headers: { 'Accept': 'application/json' }
        });
        const data = await response.json();
        
        const cleanContent = data.data?.content || "No detailed content found for this release.";
        const cleanTitle = data.data?.title || "Press Release";

        const contentHtml = `
            <div style="color: #ccc; line-height: 1.6; font-size: 1.05rem; white-space: pre-wrap;">
                ${cleanContent}
            </div>
        `;

        return {
            title: cleanTitle,
            content: contentHtml
        };
    } catch (err) {
        console.error('Agent Detail Error:', err.message);
        return {
            title: 'Error reading story',
            content: 'Could not load the full content via the AI Reader.'
        };
    }
}

module.exports = { scrapeArticles, scrapeArticleDetail };
