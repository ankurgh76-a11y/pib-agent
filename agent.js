const BASE_URL = 'https://www.pib.gov.in';
const JINA_PREFIX = 'https://r.jina.ai/';

async function scrapeArticles(dayStr, monthStr, yearStr) {
    console.log(`Agent: Investigating Direct PIB Connection...`);

    // We will talk DIRECTLY to PIB's list page via Jina
    const pibUrl = `${BASE_URL}/allRel.aspx?reg=3&lang=1`;
    const readerUrl = `${JINA_PREFIX}${pibUrl}`;

    try {
        const response = await fetch(readerUrl, {
            headers: { 'Accept': 'text/plain' }
        });
        const text = await response.text();

        // If the text contains "Access Denied" or "Unusual Traffic", we'll know for sure.
        if (text.includes("About this page") || text.includes("Access Denied") || text.includes("Too Many Requests")) {
            throw new Error(`PIB Security Block: ${text.substring(0, 500)}`);
        }

        // Try to parse article IDs anyway
        const articles = [];
        const regex = /PRID=(\d+)/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            articles.push({ id: match[1], title: `Article ${match[1]}`, link: `${BASE_URL}/PressReleasePage.aspx?PRID=${match[1]}` });
        }

        return articles;
    } catch (err) {
        // This is where we catch the "real" reason for the user to see
        throw new Error(`Direct PIB Connection Failed: ${err.message}`);
    }
}

async function scrapeArticleDetail(url) {
    const readerUrl = `${JINA_PREFIX}${url}`;
    try {
        const response = await fetch(readerUrl);
        const data = await response.json();
        return { title: data.data?.title || "PIB Release", content: data.data?.content || "No content" };
    } catch (err) {
        return { title: 'Error', content: err.message };
    }
}

module.exports = { scrapeArticles, scrapeArticleDetail };
