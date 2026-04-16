// In Client-First mode (v3), the Phone app finds the news links.
// The Cloud server is only used to clean up the content with the AI Reader.

const JINA_PREFIX = 'https://r.jina.ai/';

async function scrapeArticles(dayStr, monthStr, yearStr) {
    // This function is now a backup in case the phone's direct fetch fails.
    console.log(`Cloud: Running Discovery Backup for ${dayStr} ${monthStr} ${yearStr}`);
    
    // We'll use the most stable Discovery URL as a fallback
    const rssUrl = `https://www.pib.gov.in/ViewRss.aspx?reg=3&lang=1`;

    try {
        const response = await fetch(rssUrl);
        const html = await response.text();
        const pridRegex = /PRID=(\d+)/g;
        const seenIds = new Set();
        const articles = [];
        
        let match;
        while ((match = pridRegex.exec(html)) !== null) {
            const id = match[1];
            if (!seenIds.has(id)) {
                seenIds.add(id);
                articles.push({
                    id,
                    title: `Press Release #${id}`,
                    link: `https://www.pib.gov.in/PressReleasePage.aspx?PRID=${id}`
                });
            }
        }
        return articles;
    } catch (err) {
        console.error("Cloud Discovery Failed:", err.message);
        return [];
    }
}

async function scrapeArticleDetail(url) {
    console.log(`Cloud: AI Reading content for ${url}`);
    const readerUrl = `${JINA_PREFIX}${url}`;

    try {
        const response = await fetch(readerUrl, {
            headers: { 'Accept': 'application/json' }
        });
        const data = await response.json();
        
        const content = data.data?.content || "Detailed content extraction failed.";
        const title = data.data?.title || "PIB Press Release";

        // Simple formatting for mobile view
        const contentHtml = `
            <div style="color: #ccc; line-height: 1.8; font-size: 1.15rem;">
                ${content.split('\n\n').join('</div><div style="margin-bottom: 1.5rem;">')}
            </div>
        `;

        return { title, content: contentHtml };
    } catch (err) {
        return { 
            title: 'Error', 
            content: `AI Reader was unable to fetch the content. PIB might be down or busy.` 
        };
    }
}

module.exports = { scrapeArticles, scrapeArticleDetail };
