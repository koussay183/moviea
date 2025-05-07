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

async function scrapeEpisode() {
    try {
        const { id, ep } = workerData;
        if (!id) {
            return parentPort.postMessage({ data: "Show ID is required" });
        }

        // Fetch show page
        const showResponse = await retryFetch(id);
        const showHtml = await showResponse.text();
        const $ = cheerio.load(showHtml, { decodeEntities: false });

        // Find episode link
        const episodeLinks = $(".episodes-links").find("a");
        if (!episodeLinks.length) {
            return parentPort.postMessage({ data: "No episodes found" });
        }

        let targetEpisodeLink;
        if (ep) {
            // Find specific episode
            episodeLinks.each((i, el) => {
                const link = $(el).attr("href");
                const episodeText = $(el).text().trim();
                if (episodeText.includes(ep)) {
                    targetEpisodeLink = link;
                    return false; // break each loop
                }
            });
        } else {
            // Get latest episode
            targetEpisodeLink = $(episodeLinks[0]).attr("href");
        }

        if (!targetEpisodeLink) {
            return parentPort.postMessage({ data: "Episode not found" });
        }

        // Fetch episode page
        const episodeResponse = await retryFetch(targetEpisodeLink);
        const episodeHtml = await episodeResponse.text();
        const $episode = cheerio.load(episodeHtml, { decodeEntities: false });

        // Extract watch servers
        const watchServers = [];
        $episode(".servers-list").find("li").each((i, el) => {
            const serverUrl = $episode(el).find("a").attr("data-url");
            const serverName = $episode(el).find("a").text().trim();
            if (serverUrl) {
                watchServers.push({ serverName, serverUrl });
            }
        });

        // Extract download links
        const downloadLinks = await extractDownloadLinks($episode, ".download-list");

        if (!watchServers.length && !downloadLinks.length) {
            return parentPort.postMessage({ data: "No streaming or download links found" });
        }

        parentPort.postMessage({
            data: {
                watchServers,
                downloadLinks
            }
        });

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
scrapeEpisode();