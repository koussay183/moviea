const { parentPort, workerData } = require("worker_threads");
const cheerio = require("cheerio");
const request = require("request");

const url = `https://mycima.tv/search/${workerData?.series_name}/list`;

try {
  request(url, (error, response, html) => {
    
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(html);

      let recommended_series = $(".Thumb--GridItem");

      let links_of_recommended_series = [];

      for (let i = 0; i < recommended_series.length; i++) {
        const link = $(recommended_series[i]).find("a").attr("href");
        links_of_recommended_series.push(link);
      }

      try {
        request(links_of_recommended_series[0]?.replace("weciimaa.online","mycima.tv"), (error, response, html) => {
          if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
            let temp_list = $(".List--Seasons--Episodes");

            if (!temp_list.length) {
              temp_list = $(".Seasons--Episodes");
              let episodes_links = temp_list.find("a");

              request(
                episodes_links[episodes_links.length - workerData?.episode]
                  ?.attribs?.href?.replace("weciimaa.online","mycima.tv"),
                (error, response, html) => {
                  if (!error && response.statusCode == 200) {
                    const $ = cheerio.load(html);
                    const link = $("iframe[name='watch']").attr(
                      "data-lazy-src"
                    );
                    let download_links = $(
                      "body > root > rootinside > singlecontainer > singlecontainerright > wecima > singlesections > singlesection:nth-child(1) > div > div.Download--Wecima--Single > ul:nth-child(2)"
                    ).find("li");
                    let download_ep_links = [];

                    download_links.each((i, el) => {
                      let download_url = $(el).find("a").attr("href");
                      let quality = $(el).find("a").find("quality").text();
                      let resolution = $(el)
                        .find("a")
                        .find("resolution")
                        .text();

                      download_ep_links.push({
                        download_url,
                        quality,
                        resolution,
                      });
                    });

                    let download_season = $(
                      "body > root > rootinside > singlecontainer > singlecontainerright > wecima > singlesections > singlesection:nth-child(1) > div > div.Download--Wecima--Single > ul:nth-child(4)"
                    ).find("li");
                    let download_season_links = [];
                    download_season.each((i, el) => {
                      let download_url = $(el).find("a").attr("href");
                      let quality = $(el).find("a").find("quality").text();
                      let resolution = $(el)
                        .find("a")
                        .find("resolution")
                        .text();

                      download_season_links.push({
                        download_url,
                        quality,
                        resolution,
                      });
                    });
                    parentPort.postMessage({
                      data: link,
                      download_ep_links: download_ep_links,
                      download_season_links:
                        download_season_links ||
                        "We Dont Have Download All The Season Of This Tv Show Yet",
                    });
                  } else {
                    parentPort.postMessage({ error: "true" });
                  }
                }
              );
            } else {
              const seasons_links = temp_list.find("a");
              const season = parseInt(workerData?.season);
              if (season > seasons_links.length)
                return res.status(400).json({ error: "Season Not Found !" });

              request(
                seasons_links[season - 1]?.attribs?.href?.replace("weciimaa.online","mycima.tv"),
                (error, response, html) => {
                  if (!error && response.statusCode == 200) {
                    let $ = cheerio.load(html);

                    temp_list = $(".Episodes--Seasons--Episodes");
                    let episodes_links = temp_list.find("a");

                    if (workerData?.episode > episodes_links.length)
                      return res
                        .status(400)
                        .json({ error: "Episode Not Found !" });

                    request(
                      episodes_links[
                        episodes_links.length - workerData?.episode
                      ]?.attribs?.href?.replace("weciimaa.online","mycima.tv"),
                      (error, response, html) => {
                        if (!error && response.statusCode == 200) {
                          const $ = cheerio.load(html);
                          const link = $("iframe[name='watch']").attr(
                            "data-lazy-src"
                          );

                          let download_links = $(
                            "body > root > rootinside > singlecontainer > singlecontainerright > wecima > singlesections > singlesection:nth-child(1) > div > div.Download--Wecima--Single > ul:nth-child(2)"
                          ).find("li");
                          let download_ep_links = [];

                          download_links.each((i, el) => {
                            let download_url = $(el).find("a").attr("href");
                            let quality = $(el)
                              .find("a")
                              .find("quality")
                              .text();
                            let resolution = $(el)
                              .find("a")
                              .find("resolution")
                              .text();

                            download_ep_links.push({
                              download_url,
                              quality,
                              resolution,
                            });
                          });

                          let download_season = $(
                            "body > root > rootinside > singlecontainer > singlecontainerright > wecima > singlesections > singlesection:nth-child(1) > div > div.Download--Wecima--Single > ul:nth-child(4)"
                          ).find("li");
                          let download_season_links = [];
                          download_season.each((i, el) => {
                            let download_url = $(el).find("a").attr("href");
                            let quality = $(el)
                              .find("a")
                              .find("quality")
                              .text();
                            let resolution = $(el)
                              .find("a")
                              .find("resolution")
                              .text();

                            download_season_links.push({
                              download_url,
                              quality,
                              resolution,
                            });
                          });
                          parentPort.postMessage({
                            data: link,
                            download_ep_links: download_ep_links,
                            download_season_links:
                              download_season_links ||
                              "We Dont Have Download All The Season Of This Tv Show Yet",
                          });
                        }
                      }
                    );
                  }
                }
              );
            }
          } else {
            parentPort.postMessage({ error: "Error" });
          }
        });
      } catch (err) {
        parentPort.postMessage({ data: "Not Found" });
      }
    } else {
      parentPort.postMessage({ data: "Not Found" });
    }
  });
} catch (err) {
  parentPort.postMessage({ data: "Not Found" });
}
