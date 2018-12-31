const puppeteer = require('puppeteer');
const util = require('util');
const SortedArray = require('sorted-array');
const log = require('./logger');

const MIN_PRICE = 3000;
const SECOND_PAGE_SELECTOR = '#mainPageContent > div.layout-3 > div.col-2 > div > div.bottom-bar > div > a:nth-child(3)';
const THIRD_PAGE_SELECTOR = '#mainPageContent > div.layout-3 > div.col-2 > div > div.bottom-bar > div > span.page-link';

let lowestPrice = 0;
let pageNumber = 1;
let numPages = 1;
let priceArray = [];

module.exports = {
    run: async function(vehicle){
        let startTime = new Date().getTime();
        let searchTerm = vehicle.year + ' ' + vehicle.make + ' ' + vehicle.model;
        let SEARCH_URL = 'https://www.kijiji.ca/b-cars-vehicles/winnipeg/' + searchTerm.trim().replace(/\s/gi, '-') + '/k0c27l1700192?sort=priceAsc';

        log.info('\nPrice checker started \n');
    
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
        headless: true,
        ignoreHTTPSErrors: true,
        userDataDir: './chrome/tmp'
        };
        const browser = await puppeteer.launch(options);
        
        log.info('Chrome launched successfully...\n');
        log.info('Creating a new page...\n');
        const page = await browser.newPage();
        
        
        log.info('Launching search page with term: ' + searchTerm + '...\n');
        await page.goto(SEARCH_URL, {
            timeout: 0,
            waitUntil: 'networkidle2'
        });
        
        //check for number of pages
        numPages = await page.evaluate(function(numPages, SECOND_PAGE_SELECTOR, THIRD_PAGE_SELECTOR){
            var nextPage = document.querySelector(SECOND_PAGE_SELECTOR);
            var thirdPage = document.querySelector(THIRD_PAGE_SELECTOR);
            if(!nextPage){
                return numPages;
            }
            if(!thirdPage){
                numPages = 2;
            }else{
                numPages = 3;
            }
            return numPages;
        }, numPages, SECOND_PAGE_SELECTOR, THIRD_PAGE_SELECTOR);
        
        
        priceArray = await evaluatePage(page);
        
        log.info('Determining lowest price...\n');
        
        lowestPrice = await determineLowestPrice(page, priceArray);
        
        log.info('Done evaluating page...\n');
        
        log.info('LOWEST PRICE: ' + lowestPrice + ' \n');
        
        log.info('Doing nothing...Closing browser...\n');
        
        browser.close();
        
        log.info('Browser closed.\n');
        
        let endTime = new Date().getTime();
        
        let seconds = (endTime - startTime)/1000;
        
        log.info('Price checker executed in: ' + seconds + 'seconds\n');
        
        return lowestPrice;
    
    }//End run function
}//END module.exports

async function evaluatePage(page){
log.info('Evaluating page...\n');
  let results = await page.evaluate(function(){
    //Remove paid ads on the page first
    var ads = document.querySelectorAll('.top-feature');
    for(var i=0; i< ads.length; i++){
        ads[i].parentNode.removeChild(ads[i]);
    }

    //Evaluate native ads on the page next
    var priceNodeList = document.querySelectorAll('.price');
    if(priceNodeList){
        var anchors = [...priceNodeList];
        return anchors.map(node => node.textContent.replace(/\s|,/gi, '').replace('$', ''));
    }
    return [];
  });

  for(var i=0; i<results.length; i++){
      if(Number(results[i])){
          priceArray.push(Number(results[i]));
      }
  }
  return priceArray;
}

async function otherPages(page, mode){
    if(mode == 0){
        await page.click(SECOND_PAGE_SELECTOR);
    }else{
        await page.click(THIRD_PAGE_SELECTOR);
    }
    try{
        await page.waitForNavigation({
            waitUntil: 'networkidle2'
        });
    }catch(e){
        throw new Error('Timed out. This may be because of your internet connection. Try again.');
    }
    return await evaluatePage(page);
}

async function determineLowestPrice(page, priceArray){
    if(priceArray.length > 0){
        priceArray = new SortedArray(priceArray).array;
        for(var i=0; i<priceArray.length; i++){
            if(priceArray[i] > MIN_PRICE){
              lowestPrice = priceArray[i];
              break;
            }
            if(i==priceArray.length-1){
                //Initiate next Page protocol if numPages > 1
                if(numPages > 1){
                    log.info('Initiating next page protocol...\n');
                    if(pageNumber == 1){
                        ++pageNumber;
                        priceArray = await otherPages(page, 0);
                        if(priceArray.length > 0){
                            break;
                        }
                    }
                    if(priceArray.length ==0 && numPages > 2){
                        priceArray = await otherPages(page, 1);
                        break;
                    }
                }
            }
        }
    }
    return lowestPrice;
}
