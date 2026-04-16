const { scrapeArticles } = require('./agent');

async function verify() {
    console.log("--- FINAL STEALTH VERIFICATION ---");
    console.log("Testing in TRUE HEADLESS mode (Simulation of Cloud Environment)...");
    
    // Test with a known date that has 51 articles
    const articles = await scrapeArticles('15', 'March', '2024');
    
    if (articles && articles.length > 0) {
        console.log(`\nSUCCESS! Stealth bypass worked.`);
        console.log(`Found ${articles.length} articles in Headless mode.`);
        console.log(`Sample Title: ${articles[0].title}`);
    } else {
        console.log("\nFAILURE: Stealth bypass was detected or no articles found.");
    }
}

verify();
