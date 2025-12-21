// Share routes for /share/movie/:id, /share/tv/:id, /share/tn/:tvId
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const { safeJsonParse } = require('../utils/helpers');

// /share/movie/:id
router.get('/movie/:id', async (req, res) => {
    fs.readFile(path.resolve("./build/index.html"), 'utf-8', async (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Some Error Happend");
        }
        const movieId = req.params.id;
        try {
            const result = await fetch("https://api.themoviedb.org/3/movie/" + movieId + "?api_key=20108f1c4ed38f7457c479849a9999cc");
            const info = await safeJsonParse(result);

            if (!info) {
                return res.status(502).send("Invalid or empty JSON from upstream API");
            }

            data = data.replace('Page Title', info?.title + " | On Moviea Now" || info?.original_title + " | On Moviea Now");
            data = data.replace('Page Title2', info?.title + " | On Moviea Now" || info?.original_title + " | On Moviea Now");
            data = data.replace('__DESCRIPTION__', info?.overview || '');
            data = data.replace('__DESCRIPTION__2', info?.overview || '');
            data = data.replace('__DESCRIPTION__3', info?.overview || '');
            data = data.replace('__FB_TITLE__', info?.title + " | On Moviea Now" || info?.original_title + " | On Moviea Now");
            data = data.replace('__FB_DESCRIPTION__', info?.overview || '');
            data = data.replace('__POSTER__', "https://image.tmdb.org/t/p/original/" + info?.backdrop_path || '');
            data = data.replace('__POSTER__2', "https://image.tmdb.org/t/p/original/" + info?.poster_path || '');
            data = data.replace('__REDIRECT__', "https://moviea.tn/all-about/movie/" + movieId);
            return res.send(data);
        } catch (error) {
            console.error('Error fetching movie info:', error);
            res.status(500).send("Error fetching movie information");
        }
    });
});

// /share/tn/:tvId
router.get('/tn/:tvId', async (req, res) => {
    fs.readFile(path.resolve("./build/index.html"), 'utf-8', async (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Some Error Happend");
        }
        const tvId = req.params.tvId;
        try {
            const result = await fetch(
                `https://content.shofha.com/api/mobile/contentFiles/${tvId}?subscriberId=8765592`,
                { headers: { "authorization": "Bearer c8ij8vntrhlreqv7g8shgqvecj", "platform": 1 } }
            );

            const info = await safeJsonParse(result);

            if (!info) {
                return res.status(502).send("Invalid or empty JSON from upstream API");
            }

            data = data.replace('Page Title', info?.name_ar + " | On Moviea Now");
            data = data.replace('Page Title2', info?.name_ar + " | On Moviea Now");
            data = data.replace('__DESCRIPTION__', info?.description_ar || '');
            data = data.replace('__DESCRIPTION__2', info?.description_ar || '');
            data = data.replace('__DESCRIPTION__3', info?.description_ar || '');
            data = data.replace('__FB_TITLE__', info?.name_ar + " | On Moviea Now");
            data = data.replace('__FB_DESCRIPTION__', info?.description_ar || '');
            data = data.replace('__POSTER__', info?.previewImageUrl || '');
            data = data.replace('__POSTER__2', info?.previewImageUrl || '');
            data = data.replace('__REDIRECT__', "https://moviea.tn/tn/tv/" + tvId);
            return res.send(data);
        } catch (error) {
            console.error('Error fetching TV show info:', error);
            res.status(500).send("Error fetching TV show information");
        }
    });
});

// /share/tv/:id
router.get('/tv/:id', async (req, res) => {
    fs.readFile(path.resolve("./build/index.html"), 'utf-8', async (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Some Error Happend");
        }
        const movieId = req.params.id;
        try {
            const result = await fetch("https://api.themoviedb.org/3/tv/" + movieId + "?api_key=20108f1c4ed38f7457c479849a9999cc");
            const info = await safeJsonParse(result);

            if (!info) {
                return res.status(502).send("Invalid or empty JSON from upstream API");
            }

            data = data.replace('Page Title', info?.name + " | On Moviea Now");
            data = data.replace('Page Title2', info?.name + " | On Moviea Now");
            data = data.replace('__DESCRIPTION__', info?.overview || '');
            data = data.replace('__DESCRIPTION__2', info?.overview || '');
            data = data.replace('__DESCRIPTION__3', info?.overview || '');
            data = data.replace('__FB_TITLE__', info?.name + " | On Moviea Now");
            data = data.replace('__FB_DESCRIPTION__', info?.overview || '');
            data = data.replace('__POSTER__', "https://image.tmdb.org/t/p/original/" + info?.backdrop_path || '');
            data = data.replace('__POSTER__2', "https://image.tmdb.org/t/p/original/" + info?.poster_path || '');
            data = data.replace('__REDIRECT__', "https://moviea.tn/all-about/tv/" + movieId);
            return res.send(data);
        } catch (error) {
            console.error('Error fetching TV info:', error);
            res.status(500).send("Error fetching TV information");
        }
    });
});

module.exports = router;
