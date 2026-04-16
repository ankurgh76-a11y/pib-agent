const cheerio = require('cheerio');
const fs = require('fs');

async function testFetchAndPost() {
    console.log("1. Fetching initial page...");
    const url = 'https://www.pib.gov.in/allRel.aspx?reg=3&lang=1';
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    };

    let res = await fetch(url, { headers });
    let html = await res.text();
    let $ = cheerio.load(html);

    const viewState = $('#__VIEWSTATE').val();
    const eventValidation = $('#__EVENTVALIDATION').val();
    const viewStateGenerator = $('#__VIEWSTATEGENERATOR').val();

    console.log("Tokens:", !!viewState, !!eventValidation);

    // Now POST to the same URL to get April 1, 2026 for example
    console.log("2. Posting form...");
    const pParams = new URLSearchParams();
    pParams.append('__EVENTTARGET', '');
    pParams.append('__EVENTARGUMENT', '');
    pParams.append('__VIEWSTATE', viewState);
    pParams.append('__VIEWSTATEGENERATOR', viewStateGenerator);
    pParams.append('__EVENTVALIDATION', eventValidation);
    pParams.append('ctl00$Bar1$ddlregion', '3');
    pParams.append('ctl00$Bar1$ddlLang', '1');
    pParams.append('ctl00$ContentPlaceHolder1$ddlMinistry', '0'); // All ministries
    pParams.append('ctl00$ContentPlaceHolder1$ddlday', '15'); // Day
    pParams.append('ctl00$ContentPlaceHolder1$ddlMonth', '3'); // March (1-12?) Wait PIB months are 1=Jan? Let's check options in fetch_dump
    pParams.append('ctl00$ContentPlaceHolder1$ddlYear', '2024'); // Year
    
    // Oh wait, did we check what the dropdown values are?
    // Let's write another script snippet to test the values
    fs.writeFileSync('params.txt', pParams.toString());
}

testFetchAndPost();
