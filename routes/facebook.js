const express = require('express');
const router = express.Router();
const { postDailyMovie } = require('../workers/facebookCron');

/**
 * POST /api/facebook/post-movie
 * Manually trigger a Facebook movie post
 */
router.post('/post-movie', async (req, res) => {
    try {
        console.log('📢 Manual Facebook post triggered via API');
        
        // Trigger the movie posting function
        await postDailyMovie();
        
        res.json({
            success: true,
            message: 'Movie posted successfully to Facebook!',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error in manual post trigger:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to post movie to Facebook',
            error: error.message
        });
    }
});

/**
 * GET /api/facebook/status
 * Check Facebook cron job status
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        message: 'Facebook cron job is active',
        schedule: [
            '5:00 PM Tunisia Time (17:00)',
            '6:00 PM Tunisia Time (18:00)'
        ],
        timezone: 'Africa/Tunis',
        pageId: process.env.FACEBOOK_PAGE_ID || '108997815594061'
    });
});

module.exports = router;
