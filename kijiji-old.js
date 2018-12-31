const puppeteer = require('puppeteer');
const util = require('util');

console.log('Price checker started \n');

const SEARCH_SELECTOR = '#SearchKeyword';
const CATEGORY_SELECTOR = '#SearchCategory';
const LOCATION_SELECTOR = '#SearchLocationPicker';
const SEARCH_SUBMIT_SELECTOR = '#MainContainer > div.fes-pagelet > div > header > div.headerContainer-1051376346.headerContainer__on-2833799052 > div.searchBarWrapper-3128709573 > form > button';
const SORT_SELECTOR = '#SortSelectField';
let searchTerm = '2011 Chevrolet Cruze';
const MIM_PRICE = 1500;

let SEARCH_URL = 'https://www.kijiji.ca/b-cars-vehicles/winnipeg/' + searchTerm.replace(/\s/gi, '-') + '/k0c27l1700192';


async function run() {
    const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
    ];

    const options = {
    args,
    headless: false,
    ignoreHTTPSErrors: true,
    userDataDir: './chrome/tmp',
    slowMo: 250
    };
  const browser = await puppeteer.launch(options);

  console.log('Chrome launched successfully...\n');
  console.log('Creating a new page...\n');
  const page = await browser.newPage();
/*
  console.log('Setting viewport...\n');

  await page.setViewport({
      width: 375,
      height: 667
  });
*/

  console.log('Launching search page with term: ' + searchTerm + '...\n');
  await page.goto(SEARCH_URL, {
      timeout: 0,
      waitUntil: 'networkidle2'
  });

  console.log('Waiting for price selector...\n');
  await page.waitForSelector(SORT_SELECTOR);
  
  console.log('Selecting price ascending...\n');
  await page.select(SORT_SELECTOR, 'priceAsc');
  await page.waitFor(3000);

  /*
  console.log('Searching for ' + searchTerm + '...\n');
  await page.click(SEARCH_SELECTOR);
  await page.type(SEARCH_SELECTOR, searchTerm);

  console.log('Selecting vehicle category...\n');

  await page.select(CATEGORY_SELECTOR, '27');

  console.log('Submitting search...\n');

  await page.click(SEARCH_SUBMIT_SELECTOR);

  console.log('Waiting for navigation...\n');
  await page.waitForNavigation({
      timeout: 0
  });

  */

  console.log('Evaluating page...\n');
  let results = await page.evaluate(function(){
    var priceNodeList = document.querySelectorAll('.price');
    var anchors = [...priceNodeList];
    return anchors.map(node => node.textContent.replace(/\s|,/gi, '').replace('$', ''));
  });

  let priceArray = [];
  for(var i=0; i<results.length; i++){
      if(Number(results[i])){
          priceArray.push(Number(results[i]));
      }
  }

  console.log('Prices on page:\n', util.inspect(priceArray) + '\n');

  console.log('Done evaluating page...\n');
  console.log('Taking a screenshot...\n');
  await page.screenshot({ 
      path: 'screenshots/kijiji.png',
      fullPage: true
    });
  
  /*console.log('Doing nothing...Closing browser...\n');
  browser.close();
  console.log('Browser closed.\n');*/
}

run();