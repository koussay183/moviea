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
        const response = await fetchWithTimeout(url, options);
        return response;
    } catch (error) {
        if (retries < MAX_RETRIES) {
            return fetchWithRetries(url, options, retries + 1);
        }
        throw error;
    }
}

// Famous Player Scraper
async function scrapeFlixHQ(movie_name, runtime = null, imdb_id) {
    try {
        if (!movie_name) {
            parentPort.postMessage({ error: "No movie name provided" });
            return;
        }

        // Convert spaces to hyphens instead of URL encoding
        const searchQuery = movie_name.replace(/\s+/g, '-');
        const searchUrl = `https://flixhq.to/search/${searchQuery}`;
        
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
            const duration = $(el).find('.film-detail .fd-infor .fdi-duration').text().trim();

            
            if (type === 'movie') {
                // If runtime is specified, only add movies that match the runtime
                if (runtime) {
                    if (duration === runtime+"m") {
                        movies.push({
                            title,
                            href: href ? `https://flixhq.to${href}` : null,
                            posterUrl,
                            quality,
                            duration
                        });
                    }
                } else {
                    // No runtime filter, add all movies
                    movies.push({
                        title,
                        href: href ? `https://flixhq.to${href}` : null,
                        posterUrl,
                        quality,
                        duration
                    });
                }
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
        
        // Extract movie ID from URL (e.g., "watch-the-tank-141147" -> "141147")
        const movieIdMatch = topMovie.href.match(/-(\d+)$/);
        if (!movieIdMatch) {
            parentPort.postMessage({ results: [{ ...topMovie, servers: [] }] });
            return;
        }
        
        const movieId = movieIdMatch[1];
        
        // Fetch server list from ajax endpoint
        const episodeListUrl = `https://flixhq.to/ajax/episode/list/${movieId}`;
        const episodeListResponse = await fetchWithRetries(episodeListUrl, { headers });
        const episodeListHtml = await episodeListResponse.text();
        const episodePage = cheerio.load(episodeListHtml);
        
        // Extract servers with data-linkid
        const servers = [];
        episodePage('li.nav-item a[data-linkid]').each((_, el) => {
            const serverName = episodePage(el).attr('title') || episodePage(el).find('span').text().trim();
            const dataLinkId = episodePage(el).attr('data-linkid');
            
            if (serverName && dataLinkId) {
                servers.push({
                    name: serverName,
                    linkId: dataLinkId,
                    link: null
                });
            }
        });
        
        // Fetch streaming links for each server
        for (const server of servers) {
            try {
                const sourcesUrl = `https://flixhq.to/ajax/episode/sources/${server.linkId}`;
                const sourcesResponse = await fetchWithRetries(sourcesUrl, { headers });
                const sourcesData = await sourcesResponse.json();
                
                // Add the link and other data to the server object
                server.link = sourcesData.link || null;
                const cdn = await fetchWithRetries(server.link, {headers})
                console.log(cheerio.load(await cdn.text()).text())
                server.type = sourcesData.type || null;
                server.sources = sourcesData.sources || [];
                server.tracks = sourcesData.tracks || [];
            } catch (error) {
                server.error = error.message;
            }
        }
        
        // Combine all data
        const result = {
            title: topMovie.title,
            url: topMovie.href,
            movieId: movieId,
            posterUrl: topMovie.posterUrl,
            quality: topMovie.quality,
            servers
        };
        
        parentPort.postMessage({ results: [result] });
    } catch (error) {
        parentPort.postMessage({ error: error.message });
    }
}

// VidSRC PRO scraper
async function scraperCineby(imdb_id) {
    try {
        if (!imdb_id) {
            return null;
        }

        const url = `https://cineby.biz/embed/movie?imdb=${imdb_id}`;
        const fetchedResponse = await fetchWithRetries(url, { headers });
        
        if (!fetchedResponse.ok) {
            return null;
        }
        
        const searchHtml = await fetchedResponse.text();
        const $ = cheerio.load(searchHtml);
        const stream = $("#player_iframe").attr('src');
        
        return stream || null;
    } catch (error) {
        return null;
    }
}
// Listen for messages from the parent thread
parentPort.on('message', async (data) => {
    try {
        // Handle both string (old format) and object (new format with runtime)
        let movie_name, runtime, imdb_id;
        
        if (typeof data === 'string') {
            // Old format: just movie name
            movie_name = (data?.trim() || "").toLowerCase().replace(/[^0-9a-z]/g, " ").trim();
            runtime = null;
        } else if (typeof data === 'object' && data !== null) {
            // New format: { name, runtime }
            movie_name = (data.name?.trim() || "").toLowerCase().replace(/[^0-9a-z]/g, " ").trim();
            runtime = data.runtime;
            imdb_id = data.imdb_id;
        }
        
        // This Function is scraping the most famous player know i still have some issues in knwoing how they loading the script bundle from the player until i find a solution and the architecture i will use another scraper
        // scrapeFlixHQ(movie_name, runtime);
        
        const vidsrcProStream = await scraperCineby(imdb_id);

        parentPort.postMessage({ results: [
            {target: "vidsrcPro", stream: vidsrcProStream}
        ] });
    } catch (error) {
        parentPort.postMessage({ error: error.message });
    }
});
