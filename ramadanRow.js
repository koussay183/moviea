const { parentPort } = require("worker_threads");
const cheerio = require("cheerio");
const request = require("request");


let url = "https://www.rikatv.com/index.php";

request(url, (error, response, html) => {
 
  if (!error && response.statusCode == 200) {

    const $ = cheerio.load(html);
    let productItems = [];

    $('.product__item').each((index, element) => {
      // Extract id from the href attribute of the anchor tag inside product__item
    const href = $(element).find('a').eq(0).attr('href');
    let id = null;
    if (href) {
        const match = href.match(/id=(\d+)/);
        if (match) {
            id = match[1];
        }
    }
  
    let title = null;
    if (href) {
        const matchTitle = href.match(/&slug=(.*)/);
        if (matchTitle) {
            title = decodeURIComponent(matchTitle[1]);
        }
    }
  
      // Extract background image style
      // Extract background image URL directly from the data-setbg attribute of .set-bg
      const bgImageUrl = $(element).find('.set-bg').attr('data-setbg');
  
      // Push extracted information into the productItems array
      productItems.push({
          id,
          title,
          bgImageUrl
      });
  });
    parentPort.postMessage({ data: productItems });
  } else {
    parentPort.postMessage({ data: "Error" });
  }
});
