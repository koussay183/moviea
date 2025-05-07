const { parentPort } = require("worker_threads");
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

async function scrapeRamadanShows() {
    try {
        const url = "https://tv.cimaclub.vip/category/%D9%85%D8%B3%D9%84%D8%B3%D9%84%D8%A7%D8%AA-%D8%B1%D9%85%D8%B6%D8%A7%D9%86-2024/";
        
        const response = await retryFetch(url);
        const html = await response.text();
        const $ = cheerio.load(html, { decodeEntities: false });
        
        const shows = [];
        const articles = $("article");
        
        articles.each((i, el) => {
            const link = $(el).find("a").attr("href");
            const image = $(el).find("img").attr("src");
            const title = $(el).find("h1.title").text().trim();
            const episode = $(el).find("episode").text().trim();
            
            if (link && title) {
                shows.push({
                    link,
                    image,
                    title,
                    episode
                });
            }
        });
        
        if (!shows.length) {
            parentPort.postMessage({ data: "No shows found" });
            return;
        }

        parentPort.postMessage({ data: shows });

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
scrapeRamadanShows();
