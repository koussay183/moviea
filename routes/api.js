// API routes for /movie/*, /tv/*, /person/*, /credit/*, /genres/*, /discover/*, /similar/*, /search/*, etc.
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { safeJsonParse } = require('../utils/helpers');
const { requests } = require('../requests');
const NodeCache = require('node-cache');

// API key for TMDB
const API_KEY = process.env.API_KEY || '20108f1c4ed38f7457c479849a9999cc';

// Helper for TMDB absolute URL
const TMDB_BASE = 'https://api.themoviedb.org/3';

// Cache middleware
const cacheMiddleware = (duration) => {
    const cache = new NodeCache({ stdTTL: duration });
    return (req, res, next) => {
        const key = req.originalUrl;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            return res.json(cachedResponse);
        }

        res.originalJson = res.json;
        res.json = (body) => {
            cache.set(key, body, duration);
            res.originalJson(body);
        };
        next();
    };
};

// Helper function to fetch from TMDB API and return data
const fetchAndReturn = async (url) => {
    try {
        console.log(`Fetching data from TMDB: ${url}`);
        const res = await fetch(TMDB_BASE + url);
        
        const data = await safeJsonParse(res);
        
        // Check for errors from safeJsonParse
        if (data && data.error) {
            console.error(`TMDB API error for ${url}: ${data.error}`);
            throw new Error(data.error);
        }
        
        // Check for TMDB API specific error responses
        if (data && data.success === false) {
            console.error(`TMDB API rejected request for ${url}: ${data.status_message || 'Unknown error'}`);
            throw new Error(data.status_message || 'TMDB API error');
        }
        
        return data;
    } catch (error) {
        console.error(`Error fetching from TMDB (${url}):`, error.message);
        throw error;
    }
};

// /movie/files/:name/:runtime
router.get('/movie/files/:name/:runtime', async (req, res) => {
    try {
        const name = req.params.name;
        const runtime = req.params.runtime;
        // Need to access the movieWorkerPool from index.js
        // This gets passed in during registration
        if (!req.app.locals.movieWorkerPool) {
            return res.status(500).json({ error: 'Worker pool not initialized' });
        }
        const result = await req.app.locals.movieWorkerPool.runTask({ name, runtime });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch movie data' });
    }
});

// /tv/files/:name/:s/:e
router.get('/tv/files/:name/:s/:e', async (req, res) => {
    try {
        const { name, s, e } = req.params;
        
        // Validate input parameters
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Series name is required' });
        }
        
        const season = parseInt(s);
        const episode = parseInt(e);
        
        if (isNaN(season) || season <= 0) {
            return res.status(400).json({ error: 'Invalid season number' });
        }
        
        if (isNaN(episode) || episode <= 0) {
            return res.status(400).json({ error: 'Invalid episode number' });
        }

        // Need to access the tvShowWorkerPool from index.js
        if (!req.app.locals.tvShowWorkerPool) {
            return res.status(500).json({ error: 'Worker pool not initialized' });
        }
        
        const result = await req.app.locals.tvShowWorkerPool.runTask({ 
            series_name: name.trim(), 
            episode, 
            season 
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch TV show data' });
    }
});

// /movie/:id
router.get("/movie/:id", async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Fetching movie details for ID: ${id}`);
        
        const response = await fetch(`${TMDB_BASE}/movie/${id}?api_key=${API_KEY}&append_to_response=videos`);
        const data = await safeJsonParse(response);
        
        // Check if the result has an error
        if (data && data.error) {
            console.error(`Error fetching movie data for ID ${id}: ${data.error}`);
            return res.status(data.status || 502).json({ 
                error: data.error,
                message: 'Failed to retrieve movie data from TMDB API',
                movieId: id
            });
        }
        
        // Check for TMDB API specific error responses
        if (data && data.success === false) {
            console.error(`TMDB API error for movie ${id}: ${data.status_message}`);
            return res.status(data.status_code || 404).json({
                error: data.status_message || 'Movie not found',
                message: 'TMDB API returned an error response',
                movieId: id
            });
        }
        
        res.send(data);
    } catch (error) {
        console.error(`Exception in /movie/${req.params.id}:`, error.message);
        res.status(500).json({ 
            error: 'Internal server error processing movie request',
            message: error.message,
            movieId: req.params.id
        });
    }
});

// /tv/:id
router.get("/tv/:id", async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Fetching TV show details for ID: ${id}`);
        
        const response = await fetch(`${TMDB_BASE}/tv/${id}?api_key=${API_KEY}&append_to_response=videos`);
        const data = await safeJsonParse(response);
        
        // Check if the result has an error
        if (data && data.error) {
            console.error(`Error fetching TV data for ID ${id}: ${data.error}`);
            return res.status(data.status || 502).json({ 
                error: data.error,
                message: 'Failed to retrieve TV show data from TMDB API',
                tvId: id
            });
        }
        
        // Check for TMDB API specific error responses
        if (data && data.success === false) {
            console.error(`TMDB API error for TV show ${id}: ${data.status_message}`);
            return res.status(data.status_code || 404).json({
                error: data.status_message || 'TV show not found',
                message: 'TMDB API returned an error response',
                tvId: id
            });
        }
        
        res.send(data);
    } catch (error) {
        console.error(`Exception in /tv/${req.params.id}:`, error.message);
        res.status(500).json({ 
            error: 'Internal server error processing TV show request',
            message: error.message,
            tvId: req.params.id
        });
    }
});

// /tv/season/:id/:season
router.get("/tv/season/:id/:season", cacheMiddleware(1800), async (req, res) => {
    try {
        const { id, season } = req.params;
        const response = await fetch(`${TMDB_BASE}/tv/${id}/season/${season}?api_key=${API_KEY}`);
        const data = await safeJsonParse(response);
        
        if (!data || data.success === false) {
            return res.status(404).json({ error: 'TV show or season not found' });
        }
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch TV show season data' });
    }
});

// /movie/credits/:id
router.get("/movie/credits/:id", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`${TMDB_BASE}/movie/${id}/credits?api_key=20108f1c4ed38f7457c479849a9999cc`);
    const data = await safeJsonParse(response);

    if (!data) {
        return res.status(502).json({ error: 'Invalid or empty JSON from upstream API' });
    }

    res.send(data);
});

// /movie/collection/:id
router.get("/movie/collection/:id", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`${TMDB_BASE}/collection/${id}?api_key=${API_KEY}`);
    const data = await safeJsonParse(response);

    if (!data) {
        return res.status(502).json({ error: 'Invalid or empty JSON from upstream API' });
    }

    res.send(data);
});

// /tv/credits/:id
router.get("/tv/credits/:id", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`${TMDB_BASE}/tv/${id}/credits?api_key=20108f1c4ed38f7457c479849a9999cc`);
    const data = await safeJsonParse(response);

    if (!data) {
        return res.status(502).json({ error: 'Invalid or empty JSON from upstream API' });
    }

    res.send(data);
});

// /person/:id
router.get("/person/:id", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`${TMDB_BASE}/person/${id}?api_key=20108f1c4ed38f7457c479849a9999cc`);
    const data = await safeJsonParse(response);

    if (!data) {
        return res.status(502).json({ error: 'Invalid or empty JSON from upstream API' });
    }

    res.send(data);
});

// /credit/:id
router.get("/credit/:id", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`${TMDB_BASE}/credit/${id}?api_key=20108f1c4ed38f7457c479849a9999cc`);
    const data = await safeJsonParse(response);

    if (!data) {
        return res.status(502).json({ error: 'Invalid or empty JSON from upstream API' });
    }

    res.send(data);
});

// /person/combined/:id
router.get("/person/combined/:id", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`${TMDB_BASE}/person/${id}/combined_credits?api_key=20108f1c4ed38f7457c479849a9999cc`);
    const data = await safeJsonParse(response);

    if (!data) {
        return res.status(502).json({ error: 'Invalid or empty JSON from upstream API' });
    }

    res.send(data);
});

// /genres/movie
router.get('/genres/movie', async (req, res) => {
    res.send(await fetchAndReturn(requests.fetchGenreMovie));
});

// /genres/tv
router.get('/genres/tv', async (req, res) => {
    res.send(await fetchAndReturn(requests.fetchGenreTv));
});

// /trending/:page?
router.get('/trending/:page?', async (req, res) => {
    res.send(await fetchAndReturn(requests.fetchTrending + `&page=${req.params.page || 1}`));
});

// /discover/netflix/:page?
router.get('/discover/netflix/:page?', async (req, res) => {
    try {
        console.log(`Fetching Netflix originals, page: ${req.params.page || 1}`);
        
        if (!requests || !requests.fetchNetflixOriginals) {
            console.error('fetchNetflixOriginals request URL is not defined');
            return res.status(500).json({ 
                error: 'Configuration error', 
                message: 'Netflix originals endpoint is not properly configured'
            });
        }
        
        const url = requests.fetchNetflixOriginals + `&page=${req.params.page || 1}`;
        console.log(`Using URL: ${url}`);
        
        const data = await fetchAndReturn(url);
        
        // Check if we got a valid response
        if (!data || (data.results && data.results.length === 0)) {
            console.log(`No Netflix originals found on page ${req.params.page || 1}`);
            return res.status(404).json({
                error: 'Not found',
                message: 'No Netflix originals found for this page',
                page: req.params.page || 1
            });
        }
        
        res.send(data);
    } catch (error) {
        console.error(`Error fetching Netflix originals: ${error.message}`);
        res.status(500).json({ 
            error: 'Failed to fetch Netflix originals', 
            message: error.message,
            page: req.params.page || 1
        });
    }
});

// /discover/movie/:genre/:page?
router.get('/discover/movie/:genre/:page?', async (req, res) => {
    res.send(await fetchAndReturn(`/discover/movie?api_key=${API_KEY}&with_genres=` + req.params.genre + `&page=${req.params.page || 1}`));
});

// /discover/tv/:genre/:page?
router.get('/discover/tv/:genre/:page?', async (req, res) => {
    res.send(await fetchAndReturn(`/discover/tv?api_key=${API_KEY}&with_genres=` + req.params.genre + `&page=${req.params.page || 1}`));
});

// /similar/movie/:id/:page?
router.get("/similar/movie/:id/:page?", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`${TMDB_BASE}/movie/${req.params.id}/similar?api_key=20108f1c4ed38f7457c479849a9999cc` + `&page=${req.params.page || 1}`);
    const data = await safeJsonParse(response);

    if (!data) {
        return res.status(502).json({ error: 'Invalid or empty JSON from upstream API' });
    }

    res.send(data);
});

// /similar/tv/:id/:page?
router.get("/similar/tv/:id/:page?", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`${TMDB_BASE}/tv/${req.params.id}/similar?api_key=20108f1c4ed38f7457c479849a9999cc` + `&page=${req.params.page || 1}`);
    const data = await safeJsonParse(response);

    if (!data) {
        return res.status(502).json({ error: 'Invalid or empty JSON from upstream API' });
    }

    res.send(data);
});

// /search/:q/:page?
router.get('/search/:q/:page?', async (req, res) => {
    res.send(await fetchAndReturn(requests.multiFetch + `&query=${req.params.q}&page=${req.params.page || 1}`));
});

module.exports = router;
