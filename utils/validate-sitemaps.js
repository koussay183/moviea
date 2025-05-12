/**
 * Sitemap System Validation
 * 
 * This script validates that the sitemap generation system is working correctly
 * after the code reorganization.
 */

const { initSitemapSystem, generateFullVideoSitemap } = require('./controllers/sitemapController');
const path = require('path');
const fs = require('fs').promises;

// TMDB API Key
const API_KEY = process.env.TMDB_API_KEY || '20108f1c4ed38f7457c479849a9999cc';

// Test output directory
const TEST_OUTPUT_DIR = path.join(__dirname, 'public', 'sitemaps', 'test');

async function ensureTestDirExists() {
    try {
        await fs.access(TEST_OUTPUT_DIR);
    } catch (error) {
        console.log('Creating test directory...');
        try {
            await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
            console.log('Test directory created');
        } catch (err) {
            console.error('Error creating test directory:', err);
            throw err;
        }
    }
}

async function validateSitemapGeneration() {
    try {
        console.log('Validating sitemap generation system...');
        await ensureTestDirExists();
        
        // Generate a test sitemap
        console.log('Generating test sitemap...');
        const result = await generateFullVideoSitemap(API_KEY);
        
        console.log('Validation successful!');
        console.log('----------------');
        console.log(`Videos processed: ${result.videosProcessed}`);
        console.log(`Sitemap files generated: ${result.sitemapFiles.length}`);
        console.log('Sitemap files:');
        result.sitemapFiles.forEach(file => console.log(`- ${file}`));
        
        return true;
    } catch (error) {
        console.error('Validation failed:', error);
        return false;
    }
}

// Only run if executed directly
if (require.main === module) {
    validateSitemapGeneration()
        .then(success => {
            if (success) {
                console.log('\nSitemap system is working correctly! 🎉');
                process.exit(0);
            } else {
                console.error('\nSitemap system validation failed. 😢');
                process.exit(1);
            }
        })
        .catch(err => {
            console.error('Unexpected error:', err);
            process.exit(1);
        });
} else {
    // Export for use in other files
    module.exports = { validateSitemapGeneration };
}
