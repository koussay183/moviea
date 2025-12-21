// Arabic routes for /arabic/*, /reels/:page, /ramadan/*
const express = require('express');
const router = express.Router();
const { Worker } = require("worker_threads");
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const { safeJsonParse } = require('../utils/helpers');
const NodeCache = require('node-cache');

// Helper for creating worker processes
const createWorker = (workerPath, workerData, res) => {
    const worker = new Worker(workerPath, { workerData });
    let isResponseSent = false;

    worker.on("message", (data) => {
        if (!isResponseSent) {
            res.status(200).json(data);
            isResponseSent = true;
        }
    });

    worker.on("error", (error) => {
        if (!isResponseSent) {
            res.status(500).json({ error: error.message });
            isResponseSent = true;
        }
    });

    worker.on("exit", (code) => {
        if (!isResponseSent) {
            if (code !== 0) {
                res.status(500).json({ error: `Worker stopped with exit code ${code}` });
            } else {
                res.status(500).json({ error: "Unknown error" });
            }
            isResponseSent = true;
        }
    });

    return worker;
};

// /arabic/categories/:id
router.get('/arabic/categories/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Fetching Arabic category: ${id}`);
        
        const apiUrl = `https://content.shofha.com/api/categories/${id}?subscriberId=16640329&opCode=60502`;
        
        // Enhanced headers - more complete set for API request
        const response = await fetch(apiUrl, { 
            method: 'GET',
            headers: { 
                'authorization': "Bearer c8ij8vntrhlreqv7g8shgqvecj", 
                'platform': "1",
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'MovieaTN/1.0'
            }
        });
        
        // Check response status before parsing
        if (!response.ok) {
            console.error(`Error status from API: ${response.status} ${response.statusText}`);
            console.error(`Request URL: ${apiUrl}`);
            
            // Try to get response body for more details
            let errorBody = '';
            try {
                errorBody = await response.text();
                console.error(`Response body: ${errorBody}`);
            } catch (e) {
                console.error(`Failed to read response body: ${e.message}`);
            }
            
            return res.status(response.status).json({ 
                error: `API Error: ${response.status} ${response.statusText}`,
                message: 'Failed to retrieve category data from upstream API',
                categoryId: id,
                details: errorBody
            });
        }
        
        const data = await safeJsonParse(response);
        
        // Check if the result has an error
        if (data && data.error) {
            console.error(`Error fetching category ${id}: ${data.error}`);
            return res.status(data.status || 502).json({ 
                error: data.error,
                message: 'Failed to retrieve category data from upstream API',
                categoryId: id
            });
        }
        
        // Check for empty response
        if (!data || Object.keys(data).length === 0) {
            console.error(`Empty data received for category ${id}`);
            return res.status(404).json({
                error: 'No data found',
                message: 'Upstream API returned empty data',
                categoryId: id
            });
        }
        
        // Success
        res.send(data);
    } catch (error) {
        console.error(`Exception in /arabic/categories/${req.params.id}:`, error.message);
        res.status(500).json({ 
            error: 'Internal server error processing category request',
            message: error.message
        });
    }
});

// /arabic/files/:id
router.get('/arabic/files/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Fetching Arabic content file: ${id}`);
        
        const apiUrl = `https://content.shofha.com/api/mobile/contentFiles/${id}?subscriberId=8765592`;
        const response = await fetch(apiUrl, { 
            headers: { 
                authorization: "Bearer c8ij8vntrhlreqv7g8shgqvecj", 
                platform: "1" // Using string instead of number to avoid potential header issues
            } 
        });
        
        const data = await safeJsonParse(response);
        
        // Check if the result has an error
        if (data && data.error) {
            console.error(`Error fetching content file ${id}: ${data.error}`);
            return res.status(data.status || 502).json({ 
                error: data.error,
                message: 'Failed to retrieve content from upstream API',
                contentId: id
            });
        }
        
        if (!data) {
            console.error(`Content file ${id} not found or returned empty`);
            return res.status(404).json({ error: 'Content not found', contentId: id });
        }
        if (!data.contentFilesEpisodesDTOs || data.contentFilesEpisodesDTOs.length === 0) {
            try {
                if (!data.fileId) {
                    return res.status(404).json({ error: 'File ID not found' });
                }
                const playlistResponse = await fetch(`https://content.shofha.com/api/mobile/contentPlaylist/${data.fileId}`, {
                    headers: {
                        "accept": "application/json, text/plain, */*",
                        "authorization": "Bearer c8ij8vntrhlreqv7g8shgqvecj",
                        "platform": 1
                    }
                });
                if (!playlistResponse.ok) {
                    return res.json(data);
                }
                const playlistData = await safeJsonParse(playlistResponse);
                if (playlistData) {
                    const newOne = { ...data, contentFilesEpisodesDTOs: playlistData };
                    return res.json(newOne);
                }
            } catch (playlistError) {
                console.error('Playlist fetch error:', playlistError);
                return res.json(data);
            }
        }
        res.json(data);
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ 
            error: 'Failed to fetch content',
            details: error.message 
        });
    }
});

// /reels/:page
router.get('/reels/:page', async (req, res) => {
    try {
        const page = req.params.page;
        console.log(`Fetching reels page: ${page}`);
        
        const apiUrl = `https://content.shofha.com/api/mobile/ReelsPerGeoV2?size=10&page=${page}&opCode=60502`;
        const response = await fetch(apiUrl, { 
            headers: { 
                authorization: "Bearer c8ij8vntrhlreqv7g8shgqvecj", 
                platform: "1" 
            } 
        });
        
        const data = await safeJsonParse(response);
        
        // Check if the result has an error
        if (data && data.error) {
            console.error(`Error fetching reels page ${page}: ${data.error}`);
            return res.status(data.status || 502).json({ 
                error: data.error,
                message: 'Failed to retrieve reels data from upstream API',
                page
            });
        }
        
        res.send(data);
    } catch (error) {
        console.error(`Exception in /reels/${req.params.page}:`, error.message);
        res.status(500).json({ 
            error: 'Internal server error processing reels request',
            message: error.message
        });
    }
});

// /ramadan/tv
router.get('/ramadan/tv', async (req, res) => {
    try {
        console.log(`Fetching ramadan tv data`);
        
        const apiUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/tv/ramadan-scraper`;
        const response = await fetch(apiUrl);
        
        const data = await safeJsonParse(response);
        
        // Check if the result has an error
        if (data && data.error) {
            console.error(`Error fetching ramadan tv data: ${data.error}`);
            return res.status(data.status || 502).json({ 
                error: data.error,
                message: 'Failed to retrieve ramadan TV data'
            });
        }
        
        res.send(data);
    } catch (error) {
        console.error(`Exception in /ramadan/tv:`, error.message);
        res.status(500).json({ 
            error: 'Internal server error processing ramadan TV request',
            message: error.message
        });
    }
});

// /tv/ramadan/watch/:id
router.get('/tv/ramadan/watch/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Fetching ramadan tv watch data for ID: ${id}`);
        
        const apiUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/tv/ramadan-scraper/watch/${id}`;
        const response = await fetch(apiUrl);
        
        const data = await safeJsonParse(response);
        
        // Check if the result has an error
        if (data && data.error) {
            console.error(`Error fetching ramadan tv watch data for ID ${id}: ${data.error}`);
            return res.status(data.status || 502).json({ 
                error: data.error,
                message: 'Failed to retrieve ramadan TV watch data',
                id
            });
        }
        
        res.send(data);
    } catch (error) {
        console.error(`Exception in /tv/ramadan/watch/${req.params.id}:`, error.message);
        res.status(500).json({ 
            error: 'Internal server error processing ramadan TV watch request',
            message: error.message,
            id: req.params.id
        });
    }
});

// Direct worker routes
router.get("/movie-scraper/:movie_name", (req, res) => {
    const movie_name = req.params.movie_name;
    if (movie_name.length === 0) {
        return res.status(400).json({ error: "movie name needed" });
    }
    createWorker("./movieWorker.js", movie_name, res);
});

// Cache middleware for tv-show route
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

router.get("/tv-show/:tv_show_name/:season/:episode", cacheMiddleware(1800), async (req, res) => {
    try {
        const { tv_show_name, season, episode } = req.params;
        if (!tv_show_name.trim() || episode <= 0 || season <= 0) {
            return res.status(400).json({ error: "name needed" });
        }
        
        if (!req.app.locals.tvShowWorkerPool) {
            return res.status(500).json({ error: 'Worker pool not initialized' });
        }
        
        const result = await req.app.locals.tvShowWorkerPool.runTask({ 
            series_name: tv_show_name.trim(), 
            episode: parseInt(episode), 
            season: parseInt(season) 
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch TV show data' });
    }
});

router.get("/tv/ramadan-scraper", (req, res) => {
    createWorker("./ramadanRow.js", null, res);
});

router.get("/tv/ramadan-scraper/watch/:id/:ep", (req, res) => {
    const { id, ep } = req.params;
    createWorker("./ramadanWatch.js", { id, ep }, res);
});

module.exports = router;
