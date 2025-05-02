const { parentPort , workerData} = require("worker_threads");
const cheerio = require("cheerio");
const request = require("request");


let url = `https://www.rikatv.com/film-watching.php?id=${workerData?.ep}&movie=${workerData?.id}&season=1`;

request(url, (error, response, html) => {
  console.log(url);
  if (!error && response.statusCode == 200) {
    const $ = cheerio.load(html);
    const iframeSrc = $('.embed-responsive-item').attr('src');
    const episodeCount = $('.anime__details__episodes a').length;
    parentPort.postMessage({ data: { iframeSrc, episodeCount } });
  } else {
    parentPort.postMessage({ data: "Error" });
  }
});