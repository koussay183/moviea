const { parentPort, workerData } = require("worker_threads");
const cheerio = require("cheerio");
const request = require("request");
const { default: axios } = require("axios");

var movie_name = workerData?.trim();
movie_name = movie_name?.toLowerCase();

let newMovieName = "";
for (let ch of movie_name) {
  if (ch.match(/^[0-9a-z]+$/)) {
    newMovieName += ch;
  } else {
    newMovieName += " ";
  }
}

// let url = `https://www.wecima.store/?s=${newMovieName}`;

// request(url, async (error, response, html) => {
//   if (!error && response.statusCode == 200) {
//     const $ = cheerio.load(html);
//     let recommended_movies = $(".MovieItem");
//     let links_of_recommended_movies = [];

//     recommended_movies.each((i, el) => {
//       let link = $(el).find("a").attr("href");
//       let modablej = $(el).find(".title").text();
      
//       if (!modablej.includes("مدبلج")) {        
//         links_of_recommended_movies.push(link);
//       }
//     });
//     if (links_of_recommended_movies.length === 0) {
//       parentPort.postMessage({ data: "Not Found" });
//       return;
//     }

//     let movie_link = links_of_recommended_movies[0];
    

//     try {
//       const res = await axios.get(movie_link+"watch");
//       const $ = cheerio.load(res.data);
//       let watchServers = $('.ServersList').find("li");
//       let watchServersArray = [];

      
//       watchServers.each((i, el) => {
//         let serverUrl = $(el).attr('data-watch')
//         const rawText = $(el).clone().children().remove().end().text().trim();
//         let serverName = rawText.replace(/^\d+/, '').trim();
//         watchServersArray.push({ serverName, serverUrl });
//       });

//       const res2 = await axios.get(movie_link+"download");
//       const $2 = cheerio.load(res2.data);

//       let download_links = $2(".ServersList").find("li");
//       let download_links_movies = [];

//       download_links.each((i, el) => {
//         let download_url = $(el).find("a").attr("href");
//         let quality = "Web-Dl";
//         let resolution = "1080p";

//         download_links_movies.push({
//           download_url,
//           quality,
//           resolution,
//         });
//       });

//       parentPort.postMessage({ data: { watchServersArray, download_links_movies } });
//     } catch (error) {
//       parentPort.postMessage({ data: "Not Found" });
//     }
//   } else {
//     parentPort.postMessage({ data: "Not Found" });
//   }
// });

let url2 = `https://mycima.tv/search/${newMovieName}`;

request(url2, async (error, response, html) => {
  
  if (!error && response.statusCode == 200) {
    console.log(html);
    const $ = cheerio.load(html);
    let recommended_movies = $(".Thumb--GridItem");
    let links_of_recommended_movies = [];

    recommended_movies.each((i, el) => {
      let link = $(el).find("a").attr("href");
      let modablej = $(el).find("a").children().find("em").text()
      if(modablej != "( نسخة مدبلجة )"){
        links_of_recommended_movies.push(link);
      }
      
    });
    
    let movie_link = links_of_recommended_movies[0];
    movie_link = movie_link?.replace("wecima.show","mycima.tv")
    
    try {
      
        const headers = {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'en,de-DE;q=0.9,de;q=0.8,en-US;q=0.7,ar;q=0.6,fr;q=0.5',
          'Cache-Control': 'max-age=0',
          'Cookie': '_gid=GA1.2.2084152077.1717323014; cf_clearance=1FEKR0XGk8u6k5t91A5iqN8vxOlnt.rDWpiBcQyOzug-1717411111-1.0.1.1-81UFegvHUDk6WkVtFdAhJnsxZ9B.b6YSO.HOVfGH7g5_5vocjQip817GPHJKVUL3V2kdZrNmuweOR0B4GrxlRw; _ga=GA1.2.2036713354.1717323011; _gat_gtag_UA_128370636_1=1; _ga_6JHTFKY3P3=GS1.1.1717416029.3.1.1717416116.0.0.0',
          'Priority': 'u=0, i',
          'Referer': 'https://mycima.tv/movies/',
          'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
          'Sec-Ch-Ua-Arch': '"x86"',
          'Sec-Ch-Ua-Bitness': '"64"',
          'Sec-Ch-Ua-Full-Version': '"125.0.6422.113"',
          'Sec-Ch-Ua-Full-Version-List': '"Google Chrome";v="125.0.6422.113", "Chromium";v="125.0.6422.113", "Not.A/Brand";v="24.0.0.0"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Model': '""',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Ch-Ua-Platform-Version': '"15.0.0"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        };
        const proxy = {
          protocol: "https",
          host: "200.125.168.132", // Free proxy from the list
          port: 999,
        };
        const res = await axios.get(movie_link)

        const $ = cheerio.load(res.data);
        let watchServers = $(".WatchServersList").find("li");
        let watchServersArrayy = [];

        watchServers.each((i, el) => {
          let serverUrl = $(el).find("btn").data("url");
          serverUrl?.replace("cdn1.g2hc4em13a.shop", "mycima.tv");
          let serverName = $(el).find("strong").text();
          serverName = serverName == "سيرفر ماي سيما" ? "Moviea" : serverName;

          watchServersArrayy.push({ serverName, serverUrl });
        });

        let download_links = $(".List--Download--Wecima--Single").find("li");
        let download_links_movies = [];

        download_links.each((i, el) => {
          let download_url = $(el).find("a").attr("href");
          let quality = $(el).find("a").find("quality").text();
          let resolution = $(el).find("a").find("resolution").text();

          download_links_movies.push({
            download_url,
            quality,
            resolution,
          });
        });
        parentPort.postMessage({ data: watchServersArrayy, download_links_movies });
        
    } catch (error) {
      parentPort.postMessage({ data: error.message });
    }
  } else {
    parentPort.postMessage({ data: "Not Found" });
  }
});