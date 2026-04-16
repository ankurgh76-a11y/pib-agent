// No more heavy browsers needed! Using AI Reader API to bypass bot protection.
const BASE_URL = 'https://www.pib.gov.in';
const JINA_PREFIX = 'https://r.jina.ai/';

async function scrapeArticles(dayStr, monthStr, yearStr) {
    console.log(`Agent: Fetching articles for ${dayStr} ${monthStr} ${yearStr} via AI Reader...`);

    const monthMap = {
        "January": "1", "February": "2", "March": "3", "April": "4", "May": "5", "June": "6",
        "July": "7", "August": "8", "September": "9", "October": "10", "November": "11", "December": "12"
    };
    const numericMonth = isNaN(monthStr) ? monthMap[monthStr] : monthStr;
    const dayParam = dayStr.replace(/^0+/, '') || "1";

    // PIP supports GET parameters for archives, making it way easier for the AI reader
    const pibUrl = `${BASE_URL}/allRel.aspx?reg=3&lang=1&y=${yearStr}&m=${numericMonth}&d=${dayParam}`;
    const readerUrl = `${JINA_PREFIX}${pibUrl}`;

    try {
        const response = await fetch(readerUrl, {
            headers: { 'Accept': 'text/plain' }
        });
        const markdown = await response.text();

        // Extract article links from Jina's markdown output
        // Pattern: [Title](URL)
        const regex = /\[([^\]]{10,})\]\((https:\/\/www\.pib\.gov\.in\/PressReleasePage\.aspx\?PRID=(\d+)[^)]+)\)/g;
        const articles = [];
        let match;

        while ((match = regex.exec(markdown)) !== null) {
            const title = match[1].trim();
            const link = match[2];
            const id = match[3];

            if (!articles.find(a => a.id === id)) {
                articles.push({ title, link, id });
            }
        }

        console.log(`Agent: Found ${articles.length} articles via AI Reader.`);
        return articles;
    } catch (err) {
        console.error('Agent Error:', err.message);
        return [];
    }
}

async function scrapeArticleDetail(url) {
    console.log(`Agent: Reading full article detail via AI Reader: ${url}`);
    const readerUrl = `${JINA_PREFIX}${url}`;

    try {
        const response = await fetch(readerUrl, {
            headers: { 'Accept': 'application/json' }
        });
        const data = await response.json();
        
        // Jina API returns a clean "content" field in JSON mode
        const cleanContent = data.data?.content || "Content extraction failed.";
        const cleanTitle = data.data?.title || "PIB Press Release";

        // Convert the markdown content to simple HTML for our React app to render
        // (We can use a simple regex-based conversion or just return it as text)
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
            content: 'Failed to load article detail using Cloud AI Reader.'
        };
    }
}

module.exports = { scrapeArticles, scrapeArticleDetail };
