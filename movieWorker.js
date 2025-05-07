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

// Sanitize movie name
const movie_name = (workerData?.trim() || "").toLowerCase().replace(/[^0-9a-z]/g, " ").trim();

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

async function scrapeMovie() {
    try {
        const searchUrl = `https://mycima.tv/search/${movie_name}`;
        const response = await retryFetch(searchUrl);
        const html = await response.text();
        
        const $ = cheerio.load(html, { decodeEntities: false });
        const recommended_movies = $(".Thumb--GridItem");
        const links_of_recommended_movies = [];

        recommended_movies.each((i, el) => {
            const link = $(el).find("a").attr("href");
            const modablej = $(el).find("a").children().find("em").text();
            if (modablej !== "( نسخة مدبلجة )") {
                links_of_recommended_movies.push(link);
            }
        });

        if (!links_of_recommended_movies.length) {
            return parentPort.postMessage({ data: "Not Found" });
        }

        const movie_link = links_of_recommended_movies[0]?.replace("wecima.show", "mycima.tv");
        if (!movie_link) {
            return parentPort.postMessage({ data: "Not Found" });
        }

        const moviePageRes = await retryFetch(movie_link);
        const movieHtml = await moviePageRes.text();
        const $movie = cheerio.load(movieHtml, { decodeEntities: false });

        // Extract watch servers
        const watchServers = $movie(".WatchServersList").find("li");
        const watchServersArray = [];
        watchServers.each((i, el) => {
            const serverUrl = $movie(el).find("btn").data("url")?.replace("cdn1.g2hc4em13a.shop", "mycima.tv");
            let serverName = $movie(el).find("strong").text();
            serverName = serverName === "سيرفر ماي سيما" ? "Moviea" : serverName;
            if (serverUrl) {
                watchServersArray.push({ serverName, serverUrl });
            }
        });

        // Extract download links
        const download_links = $movie(".List--Download--Wecima--Single").find("li");
        const download_links_movies = [];
        download_links.each((i, el) => {
            const download_url = $movie(el).find("a").attr("href");
            const quality = $movie(el).find("a").find("quality").text();
            const resolution = $movie(el).find("a").find("resolution").text();
            if (download_url) {
                download_links_movies.push({ download_url, quality, resolution });
            }
        });

        parentPort.postMessage({ 
            data: { 
                watchServersArray: watchServersArray.filter(Boolean),
                download_links_movies: download_links_movies.filter(Boolean)
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
    // Clean up any resources
    process.removeAllListeners();
    if (parentPort) {
        parentPort.close();
    }
}

// Handle worker termination
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Start scraping
scrapeMovie();