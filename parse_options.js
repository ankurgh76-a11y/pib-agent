const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('fetch_dump.html', 'utf8');
const $ = cheerio.load(html);

console.log("Month options:");
$('select#ContentPlaceHolder1_ddlMonth option').each((i, el) => {
    console.log($(el).attr('value'), $(el).text());
});

console.log("Ministry options:");
$('select#ContentPlaceHolder1_ddlMinistry option').each((i, el) => {
    if(i < 3) console.log($(el).attr('value'), $(el).text());
});
