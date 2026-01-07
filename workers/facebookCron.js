const cron = require('node-cron');
const axios = require('axios');
const fetch = require('node-fetch');
const { translateToArabic } = require('../utils/translator');

// Facebook credentials
const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID || '108997815594061';
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || 'EAAHlTJzTvB4BQQLG0CgmUTmZB7vNZAt3PvgisZB12sxnx3LZC9Da3hBgP8soauqm9ZCKwtuvyOBZBX3zwFM4M3eKVLm3rZAcHj1Ay0pKf24mdBlE4XeD1faC5J5EQae6bLaOkdSoDkFqfC2N3xte0MrZBCgMAu1QwtghPe7i2hcW6wLZAJJDAkSOAwB7h6nQy9LW78F3V1XZAu611EIyeO43YzqG0gBE85urEaCBSHj3jtfZAUHZAC77ZBdcr';

// Google Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDhuym2PwyOUc5OO60n3JvdPelu0U03AjE';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

// TMDB configuration
const API_KEY = process.env.API_KEY || '20108f1c4ed38f7457c479849a9999cc';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original';

// Track posted movie IDs to avoid duplicates
let postedMovieIds = new Set();

/**
 * Fetch a random popular movie from TMDB
 */
async function getRandomMovie() {
    try {
        // Get page 1-10 randomly to have variety
        const randomPage = Math.floor(Math.random() * 10) + 1;
        const url = `${TMDB_BASE}/movie/popular?api_key=${API_KEY}&language=en-US&page=${randomPage}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            throw new Error('No movies found');
        }
        
        // Filter out already posted movies
        let availableMovies = data.results.filter(movie => !postedMovieIds.has(movie.id));
        
        // If all movies from this page were posted, clear the set and use all
        if (availableMovies.length === 0) {
            console.log('All movies posted, resetting...');
            postedMovieIds.clear();
            availableMovies = data.results;
        }
        
        // Get a random movie from available ones
        const randomIndex = Math.floor(Math.random() * availableMovies.length);
        const movie = availableMovies[randomIndex];
        
        // Mark as posted
        postedMovieIds.add(movie.id);
        
        // Get full movie details including credits
        const detailsUrl = `${TMDB_BASE}/movie/${movie.id}?api_key=${API_KEY}&append_to_response=credits`;
        const detailsResponse = await fetch(detailsUrl);
        const movieDetails = await detailsResponse.json();
        
        return movieDetails;
    } catch (error) {
        console.error('Error fetching random movie:', error);
        throw error;
    }
}

/**
 * Format movie information for Facebook post
 */
function formatMovieInfo(movie) {
    const title = movie.title || 'Unknown Title';
    const releaseDate = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const overview = movie.overview || 'No description available.';
    
    // Get top 3 actors
    let cast = '';
    if (movie.credits && movie.credits.cast && movie.credits.cast.length > 0) {
        const topCast = movie.credits.cast.slice(0, 3).map(actor => actor.name);
        cast = topCast.join(', ');
    }
    
    // Get genres
    let genres = '';
    if (movie.genres && movie.genres.length > 0) {
        genres = movie.genres.map(g => g.name).join(', ');
    }
    
    return {
        id: movie.id,
        title,
        releaseDate,
        rating,
        overview,
        cast,
        genres,
        imageUrl: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null
    };
}

/**
 * Generate complete Facebook post using Google Gemini AI
 */
async function generateFullPost(movieInfo) {
    try {
        // Translate genres to Arabic for better context
        const arabicGenres = movieInfo.genres ? await translateToArabic(movieInfo.genres) : '';
        
        // Prepare movie data for Gemini
        const movieData = {
            title: movieInfo.title,
            year: movieInfo.releaseDate,
            genre: arabicGenres || movieInfo.genres,
            cast: movieInfo.cast,
            synopsis: movieInfo.overview,
            rating: `${movieInfo.rating}/10`,
            watch_url: `https://moviea.me/all-about/movie/${movieInfo.id}`
        };
        
        const prompt = `You are Gemina, a creative Arabic social media copywriter specialized in short viral Facebook posts about movies. 

Input: you will receive movie data as JSON or key-value pairs with these possible fields:
- title (string)                -> movie title
- original_title (string)       -> original title (if different)
- year (number)                 -> release year
- genre (string or list)        -> genres (e.g., "دراما، أكشن")
- director (string)
- cast (list of strings)        -> main actors
- synopsis (string)             -> short plot summary (1-3 sentences)
- long_description (string)     -> longer description/background (optional)
- runtime (string)              -> e.g., "2h 13m"
- rating (string)               -> e.g., "7.8/10" or "PG-13"
- language (string)
- country (string)
- release_date (string)         -> YYYY-MM-DD or readable date
- poster_url (string)           -> image URL (optional)
- trailer_url (string)          -> YouTube or other link (optional)
- watch_url (string)            -> link to watch on site (optional)
- tags (list)                   -> keywords/hashtags (optional)
- notable_quote (string)        -> short memorable line (optional)
- awards (string)               -> key awards/nominations (optional)
- age_rating (string)           -> e.g., "16+"

Output requirements (Arabic plain text, no HTML/markdown):
1. Produce ONLY the FULL post (4-8 short paragraphs). Must be in Modern Standard Arabic (natural, engaging), include emojis, and a clear CTA.
2. Start with a catchy headline line that includes the movie title and 1–3 emojis.
3. Add a one-line hook (intriguing sentence) under the headline.
4. For the FULL post include:
   - A short synopsis (2-4 sentences).
   - One-line bullets or short phrases for: النجوم، التصنيف، سنة الصدور، النوع.
   - If watch_url exists, include a CTA button text like: "▶️ شاهد الآن: <watch_url>"
   - 3–6 relevant hashtags (from tags or auto-generated). Keep hashtags English or Arabic but without spaces.
   - At the end add 2–3 emojis as mood tag.
5. Tone rules: friendly, slightly promotional but not spammy, not too long, avoid spoilers. If synopsis contains spoilers, shorten to non-spoiler teaser.
6. If any optional field is missing, omit that line gracefully.
7. Output must be valid UTF-8 Arabic text only. Do not output the input JSON back.

Movie Data:
${JSON.stringify(movieData, null, 2)}

Generate ONLY the FULL Facebook post in Arabic now:`;
        
        const response = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            },
            {
                headers: {
                    'x-goog-api-key': GEMINI_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            }
        );
        
        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return response.data.candidates[0].content.parts[0].text.trim();
        }
        
        return null;
        
    } catch (error) {
        // Log error but don't fail - use fallback instead
        if (error.response?.data?.error?.code === 503) {
            console.log('⚠️ Gemini API temporarily overloaded, using fallback');
        } else if (error.code === 'ECONNABORTED') {
            console.log('⚠️ Gemini API timeout, using fallback');
        } else {
            console.log('⚠️ Gemini API error, using fallback');
        }
        return null;
    }
}

/**
 * Create Arabic post content
 */
async function createArabicPost(movieInfo) {
    try {
        // Try to generate full post with Gemini AI
        const geminiPost = await generateFullPost(movieInfo);
        
        if (geminiPost) {
            return geminiPost;
        }
        
        // Fallback: manual post creation with translated content
        const arabicOverview = await translateToArabic(movieInfo.overview);
        const arabicGenres = movieInfo.genres ? await translateToArabic(movieInfo.genres) : '';
        
        let postText = `🎬 ${movieInfo.title} 🎬\n`;
        postText += `━━━━━━━━━━━━━━━━━━━\n\n`;
        postText += `📅 سنة الإصدار: ${movieInfo.releaseDate}\n`;
        postText += `⭐ التقييم: ${movieInfo.rating}/10 ⭐\n\n`;
        
        if (arabicGenres) {
            postText += `🎭 النوع: ${arabicGenres}\n\n`;
        }
        
        if (movieInfo.cast) {
            postText += `👥 البطولة: ${movieInfo.cast}\n\n`;
        }
        
        postText += `📖 عن الفيلم:\n${arabicOverview}\n\n`;
        postText += `━━━━━━━━━━━━━━━━━━━\n`;
        postText += `🎥 شاهد الآن على موقعنا:\nhttps://moviea.me/all-about/movie/${movieInfo.id}\n\n`;
        postText += `#أفلام #سينما #مشاهدة_اون_لاين #moviea`;
        
        return postText;
    } catch (error) {
        console.error('Error creating Arabic post:', error);
        // Fallback to English if translation fails
        let postText = `🎬 ${movieInfo.title} 🎬\n\n`;
        postText += `📅 Release Year: ${movieInfo.releaseDate}\n`;
        postText += `⭐ Rating: ${movieInfo.rating}/10\n\n`;
        
        if (movieInfo.genres) {
            postText += `🎭 Genre: ${movieInfo.genres}\n`;
        }
        
        if (movieInfo.cast) {
            postText += `👥 Cast: ${movieInfo.cast}\n\n`;
        }
        
        postText += `📖 Story:\n${movieInfo.overview}\n\n`;
        postText += `🎥 Watch now on our website: https://moviea.me/all-about/movie/${movieInfo.id}`;
        
        return postText;
    }
}

/**
 * Post to Facebook Page with image upload
 */
async function postToFacebook(message, imageUrl) {
    try {
        // Upload photo directly to Facebook to avoid "link preview" look
        // This makes the post look native with the image fully displayed
        const facebookApiUrl = `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/photos`;
        
        const postData = {
            url: imageUrl,
            caption: message,
            access_token: FACEBOOK_ACCESS_TOKEN
        };
        
        const response = await axios.post(facebookApiUrl, postData);
        
        return response.data;
    } catch (error) {
        console.error('Error posting to Facebook:');
        if (error.response?.data) {
            console.error('Facebook API Error:', JSON.stringify(error.response.data, null, 2));
        }
        console.error('Error message:', error.message);
        
        // Check for common permission errors
        if (error.response?.status === 403) {
            console.error('\n⚠️  PERMISSION ERROR: Your Facebook access token needs these permissions:');
            console.error('   - pages_read_engagement');
            console.error('   - pages_manage_posts');
            console.error('\n   Please regenerate your token with these permissions at:');
            console.error('   https://developers.facebook.com/tools/explorer/\n');
        }
        
        throw error;
    }
}

/**
 * Main function to execute daily movie post
 */
async function postDailyMovie() {
    try {
        // 1. Get a random movie
        const movie = await getRandomMovie();
        
        // 2. Format movie information
        const movieInfo = formatMovieInfo(movie);
        
        // 3. Create Arabic post content
        const postContent = await createArabicPost(movieInfo);
        
        // 4. Post to Facebook
        if (movieInfo.imageUrl) {
            await postToFacebook(postContent, movieInfo.imageUrl);
        }
        
    } catch (error) {
        console.error('❌ Error in daily movie post job:', error);
    }
}

/**
 * Initialize the cron job
 * Runs twice daily at 5:00 PM and 6:00 PM (17:00 and 18:00)
 * Cron format: minute hour day month weekday
 * 0 17 * * * = At 17:00 (5 PM) every day
 * 0 18 * * * = At 18:00 (6 PM) every day
 */
function initFacebookCron() {
    // Schedule for 5 PM every day
    cron.schedule('0 17 * * *', () => {
        postDailyMovie();
    }, {
        timezone: "Africa/Tunis"
    });
    
    // Schedule for 6 PM every day
    cron.schedule('0 18 * * *', () => {
        postDailyMovie();
    }, {
        timezone: "Africa/Tunis"
    });
}

module.exports = {
    initFacebookCron,
    postDailyMovie // Export for manual testing
};
