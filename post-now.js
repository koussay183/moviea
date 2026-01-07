// Manual Facebook Post Generator
// Run this script to post a movie to Facebook immediately
// Usage: node post-now.js

require('dotenv').config();
const { postDailyMovie } = require('./workers/facebookCron');

console.log('🎬 Starting manual Facebook post...\n');

postDailyMovie()
    .then(() => {
        console.log('\n✅ Post completed successfully!');
        console.log('Check your Facebook page: https://www.facebook.com/108997815594061\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Post failed:', error.message);
        process.exit(1);
    });
