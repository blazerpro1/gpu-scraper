const puppeteer = require("puppeteer");
// const {BigQuery} = require('@google-cloud/bigquery');
// const bigquery = new BigQuery();
const xlsx = require("xlsx");


async function startBrowser() {
  let browser;

  try {
    console.log("Opening the browser......");
    browser = await puppeteer.launch({
      headless: false,
      args: ["--disable-setuid-sandbox"],
      ignoreHTTPSErrors: true,
    });
  } catch (err) {
    console.log("Could not create a browser instance => : ", err);
  }
  return browser;
}

async function scrapeAll(browserInstance) {
  let browser;
  try {
    browser = await browserInstance;
    await scraperObject.scraper(browser);
  } catch (err) {
    console.log("Could not resolve the browser instance => ", err);
  }
}
// ----------------------------------- pageScraper
const scraperObject = {
  url: ["https://shopee.com.my/api/v4/search/search_items?by=relevancy&keyword=rtx%203070&limit=100&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2"],

  async scraper(browser) {
    let totalData = [];
    let page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 }); //setting wider viewport to load all products

    for (let links in this.url) {
        console.log("Going to Shopee API to scrape : " + this.url[0]);
        await page.goto(this.url[links], {waitUntil: 'networkidle2'});
        console.log("Running link: " + links);
            
        data = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("pre")).map(x => x.textContent)
        });

        //WHY tf is data2 = data[0] not working?
        //let data2 = data[0];


        const data2 = JSON.parse(data[0]);
        // for(let i = 0; i < 10; i++){
        //     console.log(data2.items[i].item_basic.tier_variations[0].options);
        // }
        for(let i = 0; i < 100; i++){
            totalData.push({
                name: data2.items[i].item_basic.name,
                price_min: parseFloat(data2.items[i].item_basic.price_min)/100000,
                price_max: parseFloat(data2.items[i].item_basic.price_max)/100000,
                stock: data2.items[i].item_basic.stock,
                variation: data2.items[i].item_basic.tier_variations[0].options.toString(),
                historical_sold: data2.items[i].item_basic.historical_sold,
                liked_count: data2.items[i].item_basic.liked_count
            })
        }

    }
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = dd + '-' + mm + '-' + yyyy;

    // saving to an excel file
    const wb = xlsx.utils.book_new();
    // const wb = xlsx.readFile("GPU.xlsx");
    const ws = xlsx.utils.json_to_sheet(totalData);
    xlsx.utils.book_append_sheet(wb, ws, today, true);
    xlsx.writeFile(wb, "GPU.xlsx");

    console.log("Done!");
    browser.close();
    
  },
};


// Pass the browser instance to the scraper controller
exports.startScrape = async (event, context, callback) => {
  scrapeAll(startBrowser());
  console.log("okokok");
};

scrapeAll(startBrowser());