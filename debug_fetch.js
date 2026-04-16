const fs = require('fs');

(async () => {
    try {
        console.log("Fetching...");
        const response = await fetch('https://www.pib.gov.in/allRel.aspx?reg=3&lang=1', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });
        const html = await response.text();
        fs.writeFileSync('fetch_dump.html', html);
        console.log("Fetch complete. Size:", html.length);
        if (html.includes('Access Denied')) {
            console.log("Still Access Denied via fetch.");
        } else {
            console.log("Fetch successful! No access denied.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
})();
