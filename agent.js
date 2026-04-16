const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

chromium.use(stealth);

const BASE_URL = 'https://www.pib.gov.in';

// Use headless mode in cloud, but with stealth to avoid "Access Denied"
const LAUNCH_OPTIONS = {
    headless: true,
    args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
    ]
};

async function scrapeArticles(dayStr, monthStr, yearStr) {
    console.log(`Agent: Launching stealth browser for ${dayStr}/${monthStr}/${yearStr}...`);
    const browser = await chromium.launch(LAUNCH_OPTIONS);

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 3,
            hasTouch: true,
            isMobile: true
        });
        const page = await context.newPage();
        
        await page.goto(`${BASE_URL}/allRel.aspx?reg=3&lang=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // Wait for the dropdown to be available
        await page.waitForSelector('#ContentPlaceHolder1_ddlday', { timeout: 20000 });

        const monthMap = {
            "January": "1", "February": "2", "March": "3", "April": "4", "May": "5", "June": "6",
            "July": "7", "August": "8", "September": "9", "October": "10", "November": "11", "December": "12"
        };
        const numericMonth = isNaN(monthStr) ? monthMap[monthStr] : monthStr;
        const dayParam = dayStr.replace(/^0+/, '') || "1";

        await page.selectOption('#ContentPlaceHolder1_ddlday', dayParam);
        await page.selectOption('#ContentPlaceHolder1_ddlMonth', numericMonth);
        await page.selectOption('#ContentPlaceHolder1_ddlYear', yearStr);

        console.log("Agent: Selected date, waiting for PR list to load...");
        // Wait for the postback to finish.
        await page.waitForTimeout(5000); 

        const articles = await page.evaluate((baseUrl) => {
            const items = document.querySelectorAll('a');
            const results = [];
            items.forEach(a => {
                const href = a.getAttribute('href');
                const title = a.innerText.trim();
                if (href && href.includes('PRID=') && title.length > 5) {
                    if(!results.find(r => r.title === title)) {
                        results.push({
                            title: title,
                            link: href.startsWith('http') ? href : `${baseUrl}/${href.replace(/^\//,'')}`,
                            id: href.match(/PRID=(\d+)/)?.[1] || Math.random().toString()
                        });
                    }
                }
            });
            return results;
        }, BASE_URL);

        console.log(`Agent: Found ${articles.length} articles.`);
        return articles;
    } catch (error) {
        console.error('Agent Error:', error.message);
        return [];
    } finally {
        await browser.close();
    }
}

async function scrapeArticleDetail(url) {
    console.log(`Agent: Fetching stealth detail from ${url}`);
    const browser = await chromium.launch(LAUNCH_OPTIONS);

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 3,
            hasTouch: true,
            isMobile: true
        });
        const page = await context.newPage();
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        const detail = await page.evaluate(() => {
            const container = document.querySelector('form#form1, .container');
            if (!container) return { title: 'Not found', content: 'Content could not be loaded.' };
            
            const scripts = container.querySelectorAll('script, style');
            scripts.forEach(s => s.remove());
            
            const titleEl = container.querySelector('h2');
            const title = titleEl ? titleEl.innerText.trim() : 'PIB Press Release';
            
            // Try different content selectors as PIB layout can vary
            let contentDiv = container.querySelector('#PdfDiv');
            if(!contentDiv) contentDiv = container.querySelector('.innner-page-main-about-us-content-right-part');
            if(!contentDiv) contentDiv = container.querySelector('#ReleaseText, .ReleaseText');
            
            if (!contentDiv) {
                const rows = container.querySelectorAll('.row');
                contentDiv = rows[rows.length - 1];
            }
            
            return {
                title,
                content: contentDiv ? contentDiv.innerHTML : 'Content extraction failed.'
            };
        });

        return detail;
    } catch (error) {
        console.error('Agent Detail Error:', error.message);
        return { title: 'Error', content: 'Failed to load article detail.' };
    } finally {
        await browser.close();
    }
}

module.exports = { scrapeArticles, scrapeArticleDetail };
