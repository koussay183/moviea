const { parentPort, workerData } = require("worker_threads");
const cheerio = require("cheerio");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configure timeout and retry logic
const TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;

const headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
};

async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: { ...headers, ...options.headers }
        });
        clearTimeout(timeout);
        return response;
    } catch (error) {
        clearTimeout(timeout);
        throw error;
    }
}

async function retryFetch(url, options = {}) {
    let lastError;
    
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            return await fetchWithTimeout(url, options);
        } catch (error) {
            lastError = error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    throw lastError;
}

async function extractDownloadLinks($, selector) {
    const downloadLinks = [];
    $(selector).find("li").each((i, el) => {
        const download_url = $(el).find("a").attr("href");
        const quality = $(el).find("a").find("quality").text();
        const resolution = $(el).find("a").find("resolution").text();
        if (download_url) {
            downloadLinks.push({ download_url, quality, resolution });
        }
    });
    return downloadLinks;
}

async function scrapeTVShow() {
    try {
        const { series_name, episode, season } = workerData;
        const searchUrl = `https://mycima.tv/search/${series_name}/list`;
        
        // Initial search for the TV show
        const searchResponse = await retryFetch(searchUrl);
        const searchHtml = await searchResponse.text();
        const $ = cheerio.load(searchHtml, { decodeEntities: false });
        
        const recommendedSeries = $(".Thumb--GridItem");
        if (!recommendedSeries.length) {
            return parentPort.postMessage({ data: "Not Found" });
        }

        // Get first search result
        const firstSeriesLink = $(recommendedSeries[0]).find("a").attr("href")?.replace("weciimaa.online", "mycima.tv");
        if (!firstSeriesLink) {
            return parentPort.postMessage({ data: "Not Found" });
        }

        // Fetch series page
        const seriesResponse = await retryFetch(firstSeriesLink);
        const seriesHtml = await seriesResponse.text();
        const $series = cheerio.load(seriesHtml, { decodeEntities: false });
        
        // Handle different season list formats
        let seasonsList = $series(".List--Seasons--Episodes");
        let isSingleSeason = false;

        if (!seasonsList.length) {
            seasonsList = $series(".Seasons--Episodes");
            isSingleSeason = true;
        }

        if (isSingleSeason) {
            // Handle single season shows
            const episodeLinks = seasonsList.find("a");
            if (!episodeLinks.length || episode > episodeLinks.length) {
                return parentPort.postMessage({ data: "Episode Not Found" });
            }

            const targetEpisodeLink = episodeLinks[episodeLinks.length - episode]?.attribs?.href?.replace("weciimaa.online", "mycima.tv");
            if (!targetEpisodeLink) {
                return parentPort.postMessage({ data: "Episode Not Found" });
            }

            const episodeResponse = await retryFetch(targetEpisodeLink);
            const episodeHtml = await episodeResponse.text();
            const $episode = cheerio.load(episodeHtml, { decodeEntities: false });

            const watchLink = $episode("iframe[name='watch']").attr("data-lazy-src");
            
            // Extract download links
            const download_ep_links = await extractDownloadLinks($episode, "body > root > rootinside > singlecontainer > singlecontainerright > wecima > singlesections > singlesection:nth-child(1) > div > div.Download--Wecima--Single > ul:nth-child(2)");
            const download_season_links = await extractDownloadLinks($episode, "body > root > rootinside > singlecontainer > singlecontainerright > wecima > singlesections > singlesection:nth-child(1) > div > div.Download--Wecima--Single > ul:nth-child(4)");

            parentPort.postMessage({
                data: watchLink,
                download_ep_links,
                download_season_links: download_season_links.length ? download_season_links : "We Don't Have Download All The Season Of This TV Show Yet"
            });

        } else {
            // Handle multi-season shows
            const seasonsLinks = seasonsList.find("a");
            if (season > seasonsLinks.length) {
                return parentPort.postMessage({ data: "Season Not Found" });
            }

            const seasonLink = seasonsLinks[season - 1]?.attribs?.href?.replace("weciimaa.online", "mycima.tv");
            if (!seasonLink) {
                return parentPort.postMessage({ data: "Season Not Found" });
            }

            const seasonResponse = await retryFetch(seasonLink);
            const seasonHtml = await seasonResponse.text();
            const $season = cheerio.load(seasonHtml, { decodeEntities: false });

            const episodesList = $season(".Episodes--Seasons--Episodes");
            const episodeLinks = episodesList.find("a");
            
            if (episode > episodeLinks.length) {
                return parentPort.postMessage({ data: "Episode Not Found" });
            }

            const targetEpisodeLink = episodeLinks[episodeLinks.length - episode]?.attribs?.href?.replace("weciimaa.online", "mycima.tv");
            if (!targetEpisodeLink) {
                return parentPort.postMessage({ data: "Episode Not Found" });
            }

            const episodeResponse = await retryFetch(targetEpisodeLink);
            const episodeHtml = await episodeResponse.text();
            const $episode = cheerio.load(episodeHtml, { decodeEntities: false });

            const watchLink = $episode("iframe[name='watch']").attr("data-lazy-src");

            // Extract download links
            const download_ep_links = await extractDownloadLinks($episode, "body > root > rootinside > singlecontainer > singlecontainerright > wecima > singlesections > singlesection:nth-child(1) > div > div.Download--Wecima--Single > ul:nth-child(2)");
            const download_season_links = await extractDownloadLinks($episode, "body > root > rootinside > singlecontainer > singlecontainerright > wecima > singlesections > singlesection:nth-child(1) > div > div.Download--Wecima--Single > ul:nth-child(4)");

            parentPort.postMessage({
                data: watchLink,
                download_ep_links,
                download_season_links: download_season_links.length ? download_season_links : "We Don't Have Download All The Season Of This TV Show Yet"
            });
        }

    } catch (error) {
        parentPort.postMessage({ 
            data: "Error", 
            error: error.message 
        });
    }
}

// Cleanup function for worker
function cleanup() {
    process.removeAllListeners();
    if (parentPort) {
        parentPort.close();
    }
}

// Handle worker termination
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Start scraping
scrapeTVShow();
