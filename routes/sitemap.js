// Sitemap and health check routes
const express = require('express');
const router = express.Router();
const path = require('path');
const fetch = require('node-fetch');
const { initSitemapSystem } = require('../controllers/sitemapController');
const { safeJsonParse, detectCountryFromRequest, detectLanguage } = require('../utils/helpers');

// /search-sitemap.xml
router.get('/search-sitemap.xml', async (req, res) => {
    try {
        const API_KEY = process.env.API_KEY || '20108f1c4ed38f7457c479849a9999cc';
        const BASE_URL = process.env.BASE_URL || 'https://moviea.me';
        
        // We'll fetch popular movies and TV shows to build a sitemap with search queries
        const [moviesResponse, tvShowsResponse] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US`),
            fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=en-US`)
        ]);
        
        const movies = await safeJsonParse(moviesResponse);
        const tvShows = await safeJsonParse(tvShowsResponse);
        
        if (!movies || !tvShows) {
            return res.status(502).send('Invalid or empty JSON from upstream API');
        }
        
        // Get current date in W3C format for the lastmod tag
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        const seconds = String(now.getUTCSeconds()).padStart(2, '0');
        
        const lastMod = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+00:00`;
        
        // Create search sitemap XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        // Add search URLs for popular movies
        movies.results.forEach(movie => {
            if (movie.title) {
                xml += '  <url>\n';
                xml += `    <loc>${BASE_URL}/search-page?q=${encodeURIComponent(movie.title)}</loc>\n`;
                xml += `    <lastmod>${lastMod}</lastmod>\n`;
                xml += '    <changefreq>weekly</changefreq>\n';
                xml += '    <priority>0.7</priority>\n';
                xml += '  </url>\n';
            }
        });
        
        // Add search URLs for popular TV shows
        tvShows.results.forEach(show => {
            if (show.name) {
                xml += '  <url>\n';
                xml += `    <loc>${BASE_URL}/search-page?q=${encodeURIComponent(show.name)}</loc>\n`;
                xml += `    <lastmod>${lastMod}</lastmod>\n`;
                xml += '    <changefreq>weekly</changefreq>\n';
                xml += '    <priority>0.7</priority>\n';
                xml += '  </url>\n';
            }
        });
        
        // Add some common genre search queries
        const genres = ['action', 'comedy', 'drama', 'thriller', 'horror', 'romance', 'sci-fi', 'animation'];
        genres.forEach(genre => {
            xml += '  <url>\n';
            xml += `    <loc>${BASE_URL}/search-page?q=${encodeURIComponent(genre)}</loc>\n`;
            xml += `    <lastmod>${lastMod}</lastmod>\n`;
            xml += '    <changefreq>weekly</changefreq>\n';
            xml += '    <priority>0.5</priority>\n';
            xml += '  </url>\n';
        });
        
        xml += '</urlset>';
        
        // Send the sitemap
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        console.error('Error generating search sitemap:', error);
        res.status(500).send('Error generating search sitemap');
    }
});

// /health
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// /api/detect-country
router.get('/api/detect-country', async (req, res) => {
    try {
        // Get the country code using our enhanced function
        const countryCode = await detectCountryFromRequest(req);
        
        // Get IP information for debugging
        const ipInfo = {
            'cf-ipcountry': req.headers['cf-ipcountry'],
            'x-forwarded-for': req.headers['x-forwarded-for'],
            'x-real-ip': req.headers['x-real-ip'],
            'remoteAddress': req.connection?.remoteAddress
        };
        
        // Return both the detected country and the IP information
        res.status(200).json({
            detectedCountry: countryCode,
            ipInfo: ipInfo,
            language: detectLanguage(countryCode)
        });
    } catch (error) {
        console.error('Error in country detection test endpoint:', error);
        res.status(500).json({ 
            error: 'Failed to detect country', 
            message: error.message 
        });
    }
});

module.exports = router;
