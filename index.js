const puppeteer = require("puppeteer");
const {BigQuery} = require('@google-cloud/bigquery');
const bigquery = new BigQuery();
const xlsx = require("xlsx");


async function startBrowser() {
  let browser;

  try {
    console.log("Opening the browser......");
    browser = await puppeteer.launch({
      headless: true,
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
  url: [
    "11000272", // Personal Care
    "11001155", // Home & Living
    "11000323", //OTC Medicine
    "11000338", //Supplements
    "11000304", //Medical Supplies
  ].map(s => `https://shopee.com.my/api/v4/search/search_items?by=sales&limit=60&match_id=${s}&newest=0&order=desc&page_type=search&scenario=PAGE_OTHERS&version=`),
  categories:['Personal Care','Home & Living','OTC Medicine','Supplements','Medical Supplies'],
  async scraper(browser) {
    let totalData = [];
    let page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 }); //setting wider viewport to load all products
    console.log(`URLs to be scraped: ${this.url.length}...`);
    await page.goto(this.url[0]);

    for (const links in this.url) {
      console.log(`Navigating to ` + this.url[links]);
      for (let i = 0; i <=1;i++) {
        if(i==1){
            this.url[links]=this.url[links].replace("newest=0","newest=60");
        }
        
      await page.goto(this.url[links]);
        let dataObj = [];
        const bodyHandle = await page.$('pre');
        const html = await page.evaluate((body) => body.innerHTML, bodyHandle);
        await bodyHandle.dispose();

        html_parsed = JSON.parse(html);
        product_list=[];
        dataObj=[];
        dataObj.product_name=[];

        //getting item_basic attribute of the parsed JSON, where all product info lies
        for(const [key,value] of Object.entries(html_parsed)){
            if(key=='items'){ 
                product_list.push(value);
            }
        }

        //preparing product name for mapping
        for(let i=0;i<product_list[0].length;i++){
            dataObj.product_name.push(product_list[0][i].item_basic.name);
        }

        //mapping all product info
        result = dataObj.product_name.map((name, i) => ({
            name,
            variants: product_list[0][i].item_basic.tier_variations[0].options.toString(),
            monthly_sold: product_list[0][i].item_basic.sold,
            price_min: parseFloat(product_list[0][i].item_basic.price_min)/10000,
            price_max: parseFloat(product_list[0][i].item_basic.price_max)/10000,
            category: this.categories[links],
            // subcategory: sub_category,
            scrape_date: new Date().toISOString().substring(0, 10),
            source: "shopee"
          }));
        // console.log(result.slice(0,1));
        totalData.push(...result);
      }
    }

    // console.log(totalData);
    let testresult = totalData.map(a => a);
    console.log(testresult);
    // saving to an excel file
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(totalData);
    xlsx.utils.book_append_sheet(wb, ws);
    xlsx.writeFile(wb, "items.xlsx");

    console.log("Done!");
  },
};

String.prototype.replaceAt = function(index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

// Pass the browser instance to the scraper controller
exports.startScrape = async (event, context, callback) => {
  scrapeAll(startBrowser());
  console.log("okokok");
};

scrapeAll(startBrowser());