/**
 * Video Sitemap Controller
 * 
 * Manages generating and serving video sitemaps, and setting up periodic
 * regeneration and search engine pinging.
 */

const path = require('path');
const fs = require('fs').promises;
const { generateAndSaveVideoSitemaps } = require('../utils/sitemaps/videoSitemapGenerator');
const { fetchPopularMovies, fetchPopularTVShows } = require('../workers/tmdbDataFetcher');
const nodeCron = require('node-cron');

// Constants
const SITEMAP_DIR = path.join(__dirname, '..', 'public', 'sitemaps');
const BASE_URL = process.env.BASE_URL || 'https://moviea.tn';

// Ensure the sitemap directory exists
async function ensureSitemapDirExists() {
    try {
        await fs.access(SITEMAP_DIR);
        console.log('Sitemap directory exists');
    } catch (error) {
        console.log('Creating sitemap directory...');
        try {
            await fs.mkdir(SITEMAP_DIR, { recursive: true });
            console.log('Sitemap directory created successfully');
        } catch (err) {
            console.error('Error creating sitemap directory:', err);
        }
    }
}

/**
 * Generates a full video sitemap with movies and TV shows
 * @param {string} apiKey - TMDB API key
 * @returns {Promise<Object>} Results of sitemap generation
 */
async function generateFullVideoSitemap(apiKey) {
    try {
        // Ensure sitemap directory exists
        await ensureSitemapDirExists();
        
        console.log('Fetching movies and TV shows for video sitemap...');
        
        // Fetch movies and TV shows in parallel
        const [movies, tvShows] = await Promise.all([
            fetchPopularMovies(apiKey),
            fetchPopularTVShows(apiKey)
        ]);
        
        console.log(`Generating video sitemap with ${movies.length} movies and ${tvShows.length} TV shows`);
        
        // Generate sitemaps
        const result = await generateAndSaveVideoSitemaps(
            movies,
            tvShows,
            BASE_URL,
            SITEMAP_DIR
        );
        
        console.log(`Video sitemap generation complete: ${result.videosProcessed} videos processed`);
        return result;
    } catch (error) {
        console.error('Error generating video sitemap:', error);
        throw error;
    }
}

/**
 * Sets up routes for serving sitemap files
 * @param {Express} app - Express application instance
 * @param {string} apiKey - TMDB API key
 */
function setupSitemapRoutes(app, apiKey) {
    // Serve video sitemap files
    app.get('/video-sitemap.xml', async (req, res) => {
        try {
            const filePath = path.join(SITEMAP_DIR, 'video-sitemap.xml');
            
            // Check if sitemap exists
            try {
                await fs.access(filePath);
            } catch (error) {
                // If sitemap doesn't exist, generate it
                console.log('Video sitemap not found, generating...');
                await generateFullVideoSitemap(apiKey);
            }
            
            res.header('Content-Type', 'application/xml');
            res.sendFile(filePath);
        } catch (error) {
            console.error('Error serving video sitemap:', error);
            res.status(500).send('Error generating video sitemap');
        }
    });

    // Serve video sitemap index file (if it exists)
    app.get('/video-sitemap-index.xml', async (req, res) => {
        try {
            const filePath = path.join(SITEMAP_DIR, 'video-sitemap-index.xml');
            
            try {
                await fs.access(filePath);
                res.header('Content-Type', 'application/xml');
                res.sendFile(filePath);
            } catch (error) {
                // If index doesn't exist, redirect to the main sitemap
                res.redirect('/video-sitemap.xml');
            }
        } catch (error) {
            console.error('Error serving video sitemap index:', error);
            res.status(500).send('Error serving video sitemap index');
        }
    });

    // Serve any numbered video sitemap files
    app.get('/video-sitemap-:num.xml', async (req, res) => {
        try {
            const filePath = path.join(SITEMAP_DIR, `video-sitemap-${req.params.num}.xml`);
            
            try {
                await fs.access(filePath);
                res.header('Content-Type', 'application/xml');
                res.sendFile(filePath);
            } catch (error) {
                // If specific numbered sitemap doesn't exist, redirect to the index or main sitemap
                try {
                    await fs.access(path.join(SITEMAP_DIR, 'video-sitemap-index.xml'));
                    res.redirect('/video-sitemap-index.xml');
                } catch {
                    res.redirect('/video-sitemap.xml');
                }
            }
        } catch (error) {
            console.error(`Error serving video sitemap ${req.params.num}:`, error);
            res.status(500).send(`Error serving video sitemap ${req.params.num}`);
        }
    });
    
    // Force regenerate sitemap - protect with authentication in production
    app.get('/api/regenerate-sitemap', async (req, res) => {
        try {
            console.log('Manually triggering sitemap regeneration...');
            const result = await generateFullVideoSitemap(apiKey);
            res.json({
                success: true,
                message: 'Video sitemap regenerated successfully',
                stats: {
                    videosProcessed: result.videosProcessed,
                    sitemapFiles: result.sitemapFiles
                }
            });
        } catch (error) {
            console.error('Error regenerating sitemap:', error);
            res.status(500).json({
                success: false,
                message: 'Error regenerating sitemap',
                error: error.message
            });
        }
    });
}

/**
 * Sets up a scheduled task to periodically regenerate the sitemap
 * @param {string} apiKey - TMDB API key
 * @param {string} cronSchedule - Cron schedule for regeneration
 */
function setupSitemapScheduler(apiKey, cronSchedule = '0 3 * * *') { // Default: every day at 3 AM
    nodeCron.schedule(cronSchedule, async () => {
        console.log(`[${new Date().toISOString()}] Running scheduled video sitemap generation`);
        try {
            await generateFullVideoSitemap(apiKey);
            console.log(`[${new Date().toISOString()}] Scheduled video sitemap generation completed successfully`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Scheduled video sitemap generation failed:`, error);
        }
    });
    
    console.log(`Video sitemap generator scheduled to run: ${cronSchedule}`);
}

/**
 * Initialize the sitemap system
 * @param {Express} app - Express application instance
 * @param {string} apiKey - TMDB API key
 * @param {Object} options - Configuration options
 * @param {boolean} options.generateOnStartup - Whether to generate sitemap on server startup
 * @param {string} options.cronSchedule - Cron schedule for regeneration
 */
function initSitemapSystem(app, apiKey, options = {}) {
    const { 
        generateOnStartup = true, 
        cronSchedule = '0 3 * * *' 
    } = options;
    
    // Ensure the sitemap directory exists first
    ensureSitemapDirExists().then(() => {
        // Set up routes
        setupSitemapRoutes(app, apiKey);
        
        // Set up scheduler
        setupSitemapScheduler(apiKey, cronSchedule);
        
        // Generate on startup if requested
        if (generateOnStartup) {
            console.log('Initial video sitemap generation starting...');
            setTimeout(() => {
                generateFullVideoSitemap(apiKey).catch(err => {
                    console.error('Initial video sitemap generation failed:', err);
                });
            }, 5000); // Small delay to ensure server is fully initialized
        }
    }).catch(err => {
        console.error('Failed to initialize sitemap system:', err);
    });
}

module.exports = {
    initSitemapSystem,
    generateFullVideoSitemap
};