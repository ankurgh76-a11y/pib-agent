const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('fetch_dump.html', 'utf8');
const $ = cheerio.load(html);

console.log("Selects:");
$('select').each((i, el) => {
    console.log($(el).attr('name'), $(el).attr('id'));
});

console.log("\nForm action:");
console.log($('form').attr('action'));

console.log("\nHidden Inputs:");
$('input[type="hidden"]').each((i, el) => {
    console.log($(el).attr('name'), $(el).attr('value')?.substring(0, 50));
});

console.log("\nArticles:");
$('ul.release_list li a, .content-area li a, a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('PRID=')) {
        console.log($(el).text().trim(), href);
    }
});
