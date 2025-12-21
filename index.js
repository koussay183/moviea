const express = require('express');
const { Worker } = require("worker_threads");
const path = require('path');
const app = express();
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

// Import route modules
const apiRoutes = require('./routes/api');
const arabicRoutes = require('./routes/arabic');
const seoRoutes = require('./routes/seo');
const shareRoutes = require('./routes/share');
const sitemapRoutes = require('./routes/sitemap');

// Initialize cache with 30 minutes TTL
const cache = new NodeCache({ stdTTL: 1800 });

const port = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || 'https://moviea.me';

const fs = require("fs");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const {
    getTranslation,
    generateKeywords,    
    generateTitle,    
    generateStructuredData
} = require('./seo/seoHelpers');
const { initSitemapSystem } = require('./controllers/sitemapController');

const API_KEY = process.env.API_KEY || '20108f1c4ed38f7457c479849a9999cc';

// Utility functions have been moved to utils/helpers.js
const { safeJsonParse, isSearchEngineCrawler, detectCountryFromRequest, detectLanguage } = require('./utils/helpers');

// Middleware
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// CORS middleware
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

// Rate limiting with much higher limits
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increase to 1000 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
    skipSuccessfulRequests: true, // Don't count successful requests
    skipFailedRequests: false // Still count failed requests to prevent abuse
});

// Apply rate limiting only to specific routes that need protection
app.use('/api/', limiter); // Apply to API routes only
app.use('/tv/files/', limiter); // Apply to TV files routes
app.use('/movie/files/', limiter); // Apply to movie files routes

// Register routes
console.log('[App Init] Registering route modules...');
app.use('/', apiRoutes);
app.use('/', arabicRoutes);
app.use('/', seoRoutes);
app.use('/share', shareRoutes);
app.use('/', sitemapRoutes);
console.log('[App Init] ✓ Route modules registered');

// Initialize the video sitemap system early so routes are registered BEFORE catch-all
console.log('[App Init] Initializing video sitemap system...');
initSitemapSystem(app, API_KEY, {
    generateOnStartup: true,
    cronSchedule: '0 4 * * *' // Every day at 4 AM
});
console.log('[App Init] ✓ Video sitemap system initialized');

// Custom middleware to intercept TV show routes with numeric IDs for SEO enhancement has been moved to /routes/seo.js
/* Original route removed and moved to routes/seo.js
app.get(/^\/all-about\/tv\/(\d+)$/, async (req, res, next) => {
    // Implementation moved to routes/seo.js
});
*/

// Custom middleware to intercept Arabic TN TV content routes has been moved to /routes/seo.js
/* Original route removed and moved to routes/seo.js
app.get(/^\/tn\/tv\/(\d+)$/, async (req, res, next) => {
    // Implementation moved to routes/seo.js
});
*/

// Custom middleware to intercept Arabic TN Movie content routes has been moved to /routes/seo.js
/* Original route removed and moved to routes/seo.js
app.get(/^\/tn\/movie\/(\d+)$/, async (req, res, next) => {
    // Implementation moved to routes/seo.js
});
*/

// Custom middleware to serve React app static files (comes after special routes)
app.use(express.static(path.join(__dirname, 'build'), {
    // Set proper cache headers for static files
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            // Don't cache HTML files
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
            // Cache static assets for 1 week
            res.setHeader('Cache-Control', 'public, max-age=604800');
        }
    }
}));

// Serve files from the public directory
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.xml')) {
            // Set proper XML content type for sitemap files
            res.setHeader('Content-Type', 'application/xml');
            // Cache for 1 day
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
    }
}));

// Worker Pool Management - Using module from workers/workerPool.js
const WorkerPool = require('./workers/workerPool');

// Initialize worker pools
const movieWorkerPool = new WorkerPool(2, './workers/movieWorker.js');
const tvShowWorkerPool = new WorkerPool(2, './workers/tvShowWorker.js');

// Make worker pools available to routes
app.locals.movieWorkerPool = movieWorkerPool;
app.locals.tvShowWorkerPool = tvShowWorkerPool;

// Cache middleware
const cacheMiddleware = (duration) => {
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

// Routes with optimized error handling and caching have been moved to api.js

// Scraper routes for the arabic movies and tv shows have been moved to arabic.js

// All APIS FOR THE MOVIE DB API have been moved to routes/api.js

// Share routes have been moved to /routes/share.js

// Share route for Arabic TV has been moved to /routes/share.js

// Share route for TV has been moved to /routes/share.js

// All TMDB API routes have been moved to /routes/api.js

// Additional TMDB API routes have been moved to /routes/api.js

// Generate a search sitemap for better search discoverability - moved to routes/sitemap.js
/* Original route removed and moved to routes/sitemap.js
app.get('/search-sitemap.xml', async (req, res) => {
    // Implementation moved to routes/sitemap.js
});
*/

// Function to detect if a request is coming from a search engine crawler or bot has been moved to utils/helpers.js

// Search page route with SEO enhancements has been moved to routes/seo.js
/* Original route removed and moved to routes/seo.js
app.get('/search-page', async (req, res, next) => {
    // Implementation moved to routes/seo.js
});
*/

// End of routes section

// Arabic content routes have been moved to /routes/arabic.js

// Test endpoint for IP-based location detection has been moved to routes/sitemap.js
/* Original route removed and moved to routes/sitemap.js
app.get('/api/detect-country', async (req, res) => {
    // Implementation moved to routes/sitemap.js
});
*/

// Catch-all route for React app - should be last
app.get('*', function(req, res) {
    // Log catch-all hits for debugging
    if (req.path.includes('.xml')) {
        console.log('[Catch-All] WARNING: XML request hit catch-all:', req.path);
        console.log('[Catch-All] This means the sitemap route did not match!');
    }
    
    // Exclude API routes and file requests from React routing
    if (req.path.startsWith('/api/') || 
        req.path.startsWith('/tv/files/') || 
        req.path.startsWith('/movie/files/') ||
        req.path.startsWith('/genres/') ||
        req.path.startsWith('/discover/') ||
        req.path.startsWith('/similar/') ||
        req.path.startsWith('/person/') ||
        req.path.startsWith('/credit/') ||
        req.path.startsWith('/search/') ||
        req.path.startsWith('/arabic/') ||
        req.path.startsWith('/reels/') ||
        req.path.startsWith('/ramadan/')) {
        return res.status(404).json({ error: 'Not found' });
    }

    // Avoid serving SPA for XML requests - should have been caught by sitemap routes
    if (req.path.endsWith('.xml')) {
        console.error('[Catch-All] ✗ XML request should not reach here:', req.path);
        return res.status(404).send('Sitemap not found');
    }
    
    // Special handling for placeholder URLs - redirect to home instead of 404
    if (req.path === '/__REDIRECT__' || 
        req.path === '/__HTML__' || 
        req.path === '/__POSTER__') {
        return res.redirect('/');
    }
    
    // Check if requesting a specific static file with extension
    const fileExtRegex = /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i;
    if (fileExtRegex.test(req.path)) {
        const filePath = path.join(__dirname, 'build', req.path);
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        } else {
            return res.status(404).json({ error: 'File not found' });
        }
    }
      // For all other routes, serve the index.html for client-side routing
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Health check endpoint has been moved to routes/sitemap.js
/* Original route removed and moved to routes/sitemap.js
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});
*/

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});


const server = app.listen(port, () => console.log(`Server running on port ${port}`));