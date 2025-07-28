const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// List of URLs to scrape
const urls = [
  // Your original good sources
  'https://dornsife.usc.edu/news/stories/metro-unsafe-say-those-no-longer-riding-post-pandemic/',
  'https://www.metro.net/about/metros-customer-experience-survey-identifies-reliability-frequency-safety-cleanliness-and-homelessness-as-top-improvement-areas-the-annual-survey-informs-cx-action-plan-to-address-custom/',
  'https://laist.com/brief/news/transportation/la-metro-releases-report-tracking-public-safety-surge',
  'https://xtown.la/2019/09/26/want-to-avoid-crime-on-metro-stay-off-the-red-line/',
  'https://www.transittalent.com/articles/index.cfm?story=LA_Metro_Crime_Increase_2-27-2023',
  'https://laist.com/news/transportation/violence-metro-safety-public-transit-drug-trains-bus-driver-stabbing',
  'https://www.kcrw.com/news/shows/kcrw-features/la-metro-safety-perception',
  'https://www.rkmlaw.net/los-angeles-public-transit-accidents-injuries/',
  'https://www.metro.net/riding/safety/',
  'https://kingcounty.gov/depts/transportation/metro/safety-security.aspx',

  // ✅ New additional tested, meaningful safety content:
  'https://www.nsc.org/community-safety/safety-topics',
  'https://www.safewise.com/resources/crime-prevention/',
  'https://www.lapdonline.org/crime-prevention-tips/',
  'https://www.cdc.gov/violenceprevention/index.html',
  'https://www.cdc.gov/injury/index.html',
  'https://www.safetravel.govt.nz/how-keep-safe',
  'https://www.transit.dot.gov/TSP',
  'https://www.cdc.gov/transportationsafety/index.html',
  'https://www.nhtsa.gov/road-safety',
  'https://www.transit.dot.gov/regulations-and-guidance/safety/transit-safety-overview'
];


// Utility: generate safe filename from URL
function filenameFromUrl(url) {
  return url.replace(/https?:\/\//, '')
            .replace(/[\/?#:]/g, '_')
            .substring(0, 100) + '.md';
}

// Format content as Markdown
function toMarkdown(url, text) {
  return `# Source: ${url}

---

${text}
`;
}

// Scrape a single website
async function scrapeWebsite(url) {
  try {
    console.log(`🔍 Scraping: ${url}`);

    // Bypass SSL issues (only for dev scraping)
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const { data } = await axios.get(url, { timeout: 15000 });
    const $ = cheerio.load(data);

    // Remove unwanted tags
    $('script, style, iframe, noscript').remove();

    // === Improved extraction targeting meaningful content ===
    let text = $('article').text();
    if (!text || text.trim().length < 100) {
      text = $('#main-content').text() || $('.content').text() || $('.main-content').text();
    }
    if (!text || text.trim().length < 100) {
      text = $('body').text();
    }
    text = text.replace(/\s+/g, ' ').trim();

    if (!text || text.length < 100) {
      console.log('⚠️ Not enough meaningful text found, skipping.\n');
      return null;
    }

    console.log(`✅ Scraped cleaned text length: ${text.length}`);
    console.log('--- Preview ---');
    console.log(text.slice(0, 800) + '...');
    console.log('--- End of preview ---\n');

    const markdown = toMarkdown(url, text);

    const outputDir = path.join(__dirname, 'markdown');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const filename = filenameFromUrl(url);
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, markdown, 'utf8');
    console.log(`✅ Saved markdown file: ${filepath}\n`);

    return text;

  } catch (error) {
    console.error(`❌ Error scraping ${url}: ${error.message}`);
    return null;
  }
}

// Exportable for ingestion pipelines
module.exports = {
  scrapeWebsite
};

// Run directly: scrape all URLs and save markdowns
if (require.main === module) {
  (async () => {
    for (const url of urls) {
      await scrapeWebsite(url);
    }
    console.log('🎉 All URLs scraped and saved to markdown.');
  })();
}
