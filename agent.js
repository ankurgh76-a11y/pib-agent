// Final Cloud-Stable Agent Logic
const JINA_PREFIX = 'https://r.jina.ai/';
const PIB_BASE = 'https://www.pib.gov.in';

async function scrapeArticles(dayStr, monthStr, yearStr) {
    console.log(`Agent: Fetching latest releases via Official RSS Backdoor...`);

    // The PIB RSS feed is the most stable GET-based list of articles.
    // It is designed for news aggregators like ours.
    const rssUrl = `https://pib.gov.in/ViewRss.aspx?reg=3&lang=1`;

    try {
        const response = await fetch(rssUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = await response.text();

        // The RSS feed at this URL actually returns a simple HTML list on some servers.
        // We'll parse both XML-style and HTML-style patterns to be safe.
        const articles = [];
        const regex = /PRID=(\d+)/g;
        const seenIds = new Set();
        
        let match;
        while ((match = regex.exec(html)) !== null) {
            const id = match[1];
            if (!seenIds.has(id)) {
                seenIds.add(id);
                // We'll pull a generic title first, then Jina will give us the real one in Detail view
                articles.push({
                    id,
                    title: `PIB News Release #${id}`,
                    link: `${PIB_BASE}/PressReleasePage.aspx?PRID=${id}`
                });
            }
        }

        // Final Fallback: If RSS is empty on Render, we use a Search query through Jina
        if (articles.length === 0) {
            console.log("Agent: RSS was empty. Using Archive Search Fallback...");
            const fallbackUrl = `${JINA_PREFIX}${PIB_BASE}/index.aspx`;
            const fbRes = await fetch(fallbackUrl);
            const fbText = await fbRes.text();
            
            while ((match = regex.exec(fbText)) !== null) {
                const id = match[1];
                if (!seenIds.has(id)) {
                    seenIds.add(id);
                    articles.push({
                        id,
                        title: `Latest Release #${id}`,
                        link: `${PIB_BASE}/PressReleasePage.aspx?PRID=${id}`
                    });
                }
            }
        }

        console.log(`Agent: Found ${articles.length} articles.`);
        return articles;
    } catch (err) {
        throw new Error(`Cloud Agent Error: ${err.message}`);
    }
}

async function scrapeArticleDetail(url) {
    console.log(`Agent: Reading full article content via AI Reader: ${url}`);
    const readerUrl = `${JINA_PREFIX}${url}`;

    try {
        const response = await fetch(readerUrl, {
            headers: { 'Accept': 'application/json' }
        });
        const data = await response.json();
        
        const cleanContent = data.data?.content || "Content extraction failed.";
        const cleanTitle = data.data?.title || "PIB Press Release";

        // Convert MD to a simple mobile-friendly view
        const contentHtml = `
            <div style="color: #ccc; line-height: 1.7; font-size: 1.1rem;">
                ${cleanContent.split('\n\n').join('</div><div style="margin-bottom: 1.5rem;">')}
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
            content: 'The content could not be loaded via the Cloud AI Reader.'
        };
    }
}

module.exports = { scrapeArticles, scrapeArticleDetail };
