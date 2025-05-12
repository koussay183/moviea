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
        });
        clearTimeout(timeout);
        return response;
    } catch (error) {
        clearTimeout(timeout);
        throw error;
    }
}

async function fetchWithRetries(url, options = {}, retries = 0) {
    try {
        return await fetchWithTimeout(url, options);
    } catch (error) {
        if (retries < MAX_RETRIES) {
            console.log(`Retrying fetch for ${url} (attempt ${retries + 1}/${MAX_RETRIES})`);
            return fetchWithRetries(url, options, retries + 1);
        }
        throw error;
    }
}

async function scrapeFlixHQ() {
    try {
        if (!movie_name) {
            parentPort.postMessage({ error: "No movie name provided" });
            return;
        }

        console.log(`Searching for movie: "${movie_name}"`);
        const searchUrl = `https://flixhq.to/search/${encodeURIComponent(movie_name)}`;
        
        const searchResponse = await fetchWithRetries(searchUrl, { headers });
        const searchHtml = await searchResponse.text();
        const $ = cheerio.load(searchHtml);
        
        // Find movie cards
        const movieElements = $('.film_list-wrap .flw-item');
        const movies = [];
        
        movieElements.each((_, el) => {
            const titleElement = $(el).find('.film-name a');
            const title = titleElement.text().trim();
            const href = titleElement.attr('href');
            const posterUrl = $(el).find('.film-poster img').attr('data-src');
            const quality = $(el).find('.film-poster .film-poster-quality').text().trim();
            const type = $(el).find('.film-detail .fd-infor .fdi-type').text().trim().toLowerCase();
            
            if (type === 'movie') {
                movies.push({
                    title,
                    href: href ? `https://flixhq.to${href}` : null,
                    posterUrl,
                    quality,
                });
            }
        });
        
        if (movies.length === 0) {
            parentPort.postMessage({ results: [] });
            return;
        }
        
        // Get the top result and extract its details
        const topMovie = movies[0];
        if (!topMovie.href) {
            parentPort.postMessage({ results: movies });
            return;
        }
        
        console.log(`Found movie: "${topMovie.title}", fetching details...`);
        const movieResponse = await fetchWithRetries(topMovie.href, { headers });
        const movieHtml = await movieResponse.text();
        const moviePage = cheerio.load(movieHtml);
        
        // Extract server data
        const serverElements = moviePage('#list-server-more .server-item');
        const servers = [];
        
        serverElements.each((_, el) => {
            const serverName = moviePage(el).text().trim();
            const serverId = moviePage(el).attr('data-id');
            
            if (serverName && serverId) {
                servers.push({
                    name: serverName,
                    id: serverId
                });
            }
        });
        
        // Combine all data
        const result = {
            title: topMovie.title,
            url: topMovie.href,
            posterUrl: topMovie.posterUrl,
            quality: topMovie.quality,
            servers
        };
        
        parentPort.postMessage({ results: [result] });
    } catch (error) {
        console.error("MovieWorker Error:", error);
        parentPort.postMessage({ error: error.message });
    }
}

// Start the scraping process
scrapeFlixHQ();
