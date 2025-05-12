const express = require('express');
const { Worker } = require("worker_threads");
const path = require('path');
const app = express();
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

// Initialize cache with 30 minutes TTL
const cache = new NodeCache({ stdTTL: 1800 });

const port = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

const fs = require("fs");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { requests } = require("./requests");
const {
    detectLanguage,
    getTranslation,
    generateKeywords,    generateTitle,    generateStructuredData,
    detectCountryFromRequest
} = require('./seo/seoHelpers');
const { initSitemapSystem } = require('./controllers/sitemapController');

const API_KEY = process.env.API_KEY || '20108f1c4ed38f7457c479849a9999cc';

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

// Custom middleware to intercept movie routes with numeric IDs for SEO enhancement
app.get(/^\/all-about\/movie\/(\d+)$/, async (req, res, next) => {
    try {        const movieId = req.params[0]; // Get movie ID from regex match
          // Detect user's country & language from request
        const userCountry = await detectCountryFromRequest(req);
        const userLanguage = detectLanguage(userCountry);
        
        
        // Attempt to fetch additional movie details like credits for enhanced SEO
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=videos,credits,similar&language=${userLanguage}`);
        let movieInfo = await response.json();
        
        // If we have the movie info and its original language, we can fetch it again with that language
        if (movieInfo && movieInfo.original_language && movieInfo.original_language !== userLanguage) {
            try {
                const detailsInOriginalLang = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=videos,credits,similar&language=${movieInfo.original_language}`);
                const originalLangData = await detailsInOriginalLang.json();
                
                // Merge the data, prioritizing the user language data
                Object.assign(originalLangData, movieInfo);
                movieInfo = originalLangData;
            } catch (error) {
                console.error('Error fetching movie in original language:', error);
                // Continue with what we have
            }
        }
        
        if (movieInfo.success === false) {
            // If movie not found, continue to next middleware
            return next();
        }
        
        // Read the index.html file
        fs.readFile(path.join(__dirname, 'build', 'index.html'), 'utf-8', (err, data) => {
            if (err) {
                console.error('Error reading index.html:', err);
                return next(); // Continue to next middleware if file read fails
            }
            
            // Get img URL for various image sizes for optimization
            const imageUrlOriginal = movieInfo.backdrop_path ? 
                `https://image.tmdb.org/t/p/original/${movieInfo.backdrop_path}` : 
                (movieInfo.poster_path ? `https://image.tmdb.org/t/p/original/${movieInfo.poster_path}` : '');
                
            const imageUrlLarge = movieInfo.backdrop_path ? 
                `https://image.tmdb.org/t/p/w1280/${movieInfo.backdrop_path}` : 
                (movieInfo.poster_path ? `https://image.tmdb.org/t/p/w780/${movieInfo.poster_path}` : '');
                  // Use our SEO helper functions for optimized content
            const contentUrl = `https://moviea.tn/all-about/movie/${movieId}`;
            const optimizedTitle = generateTitle(movieInfo, 'movie', userLanguage);
            const optimizedDescription = movieInfo.overview || `${getTranslation('watch_now', userLanguage)} ${movieInfo.title || movieInfo.original_title} ${getTranslation('online', userLanguage)}`;
            const optimizedKeywords = generateKeywords(movieInfo, 'movie', userLanguage);
            
            // Generate rich structured data with VideoObject + Chapter schema
            // This creates a JSON-LD representation with dynamic chapters based on runtime
            // which helps Google understand the content structure and may enable chapter features in search
            const structuredData = generateStructuredData(movieInfo, 'movie', imageUrlOriginal, contentUrl, userLanguage);
            
            // Extract cast for rich structured data
            const movieCast = movieInfo.credits && movieInfo.credits.cast ? 
                movieInfo.credits.cast.slice(0, 5).map(actor => actor.name).join(', ') : '';
                
            // Extract director for rich structured data
            const movieDirector = movieInfo.credits && movieInfo.credits.crew ? 
                movieInfo.credits.crew.find(person => person.job === 'Director')?.name : '';
                
            // Create a complete SEO-optimized HTML document
            const seoHtml = `<!doctype html>
<html lang="${userLanguage}">
<head>
    <base href="/"/>
    <meta name="google-site-verification" content="gfLr6FcoTJz5djitWvSO041iz7i2PLCnaR6tRgpy_eI"/>
    <meta name="google-adsense-account" content="ca-pub-9662854573261832">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-78N5C676M5"></script>
    <script>function gtag(){dataLayer.push(arguments)}window.dataLayer=window.dataLayer||[],gtag("js",new Date),gtag("config","G-78N5C676M5")</script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9662854573261832" crossorigin="anonymous"></script>
    <script type="text/javascript" src="http://resources.infolinks.com/js/infolinks_main.js"></script>
    <meta charset="utf-8"/>
    <link rel="icon" href="./favicon.ico"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <meta name="theme-color" content="#000000"/>
    
    <!-- Enhanced SEO Meta Tags -->
    <title>${optimizedTitle}</title>
    <meta name="description" content="${optimizedDescription}"/>
    <meta name="keywords" content="${optimizedKeywords}">
    ${movieCast ? `<meta name="actors" content="${movieCast}">` : ''}
    ${movieDirector ? `<meta name="director" content="${movieDirector}">` : ''}
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph / Facebook / Social Sharing -->
    <meta property="og:type" content="video.movie"/>
    <meta property="og:title" content="${optimizedTitle}"/>
    <meta property="og:description" content="${optimizedDescription}"/>
    <meta property="og:image" content="${imageUrlLarge}"/>
    <meta property="og:image:width" content="1280"/>
    <meta property="og:image:height" content="720"/>
    <meta property="og:url" content="${contentUrl}"/>
    <meta property="og:site_name" content="Moviea.tn"/>
    <meta property="og:locale" content="${userLanguage}_${userCountry || userLanguage.toUpperCase()}"/>
    
    <!-- Twitter Card data -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${optimizedTitle}">
    <meta name="twitter:description" content="${optimizedDescription}">
    <meta name="twitter:image" content="${imageUrlLarge}">
    
    <!-- Structured Data for SEO - Enhanced with additional details -->
    <script type="application/ld+json">${structuredData}</script>
    
    <!-- Enhanced Link Tags -->
    <link rel="canonical" href="${contentUrl}"/>
    <link rel="alternate" hreflang="x-default" href="${contentUrl}"/>
    <link rel="alternate" hreflang="en" href="${contentUrl}"/>
    <link rel="alternate" hreflang="ar" href="${contentUrl}"/>
    <link rel="apple-touch-icon" href="./logo192.png"/>
    <link rel="manifest" href="./manifest.json"/>
    
    <!-- Inspectlet Tracking -->
    <script type="text/javascript">!function(){window.__insp=window.__insp||[],__insp.push(["wid",489353811]);setTimeout((function(){if(void 0===window.__inspld){window.__inspld=1;var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.id="inspsync",t.src=("https:"==document.location.protocol?"https":"http")+"://cdn.inspectlet.com/inspectlet.js?wid=489353811&r="+Math.floor((new Date).getTime()/36e5);var e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(t,e)}}),0)}()</script>
    
    <!-- Preload Critical Assets -->
    <link rel="preload" href="./static/js/main.3867268b.js" as="script">
    <link rel="preload" href="./static/css/main.291b9921.css" as="style">
    ${imageUrlLarge ? `<link rel="preload" href="${imageUrlLarge}" as="image">` : ''}
    
    <!-- CSS and JS -->
    <script defer="defer" src="./static/js/main.3867268b.js"></script>
    <link href="./static/css/main.291b9921.css" rel="stylesheet">
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
</body>
</html>`;
            
            // Send the enhanced SEO-optimized HTML with proper cache headers
            res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
            res.setHeader('Vary', 'Accept-Language, Accept-Encoding');
            res.send(seoHtml);
        });
    } catch (error) {
        console.error('Error in movie route middleware:', error);
        next(); // Continue to next middleware if there's an error
    }
});

// Custom middleware to intercept TV show routes with numeric IDs for SEO enhancement
app.get(/^\/all-about\/tv\/(\d+)$/, async (req, res, next) => {
    try {
        const tvId = req.params[0]; // Get TV ID from regex match
          // Detect user's country & language from request
        const userCountry = await detectCountryFromRequest(req);
        const userLanguage = detectLanguage(userCountry);
          // Fetch TV show details with additional data for enhanced SEO
        const response = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${API_KEY}&append_to_response=videos,credits,keywords,similar,content_ratings,external_ids&language=${userLanguage}`);
        let tvInfo = await response.json();
        
        // If we have the TV info and its original language, we can fetch it again with that language
        if (tvInfo && tvInfo.original_language && tvInfo.original_language !== userLanguage) {
            try {
                const detailsInOriginalLang = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${API_KEY}&append_to_response=videos,credits,keywords,similar,content_ratings,external_ids&language=${tvInfo.original_language}`);
                const originalLangData = await detailsInOriginalLang.json();
                
                // Merge the data, prioritizing the user language data
                Object.assign(originalLangData, tvInfo);
                tvInfo = originalLangData;
            } catch (error) {
                console.error('Error fetching TV show in original language:', error);
                // Continue with what we have
            }
        }
        
        if (tvInfo.success === false) {
            // If TV show not found, continue to next middleware
            return next();
        }
        
        // Read the index.html file
        fs.readFile(path.join(__dirname, 'build', 'index.html'), 'utf-8', (err, data) => {
            if (err) {
                console.error('Error reading index.html:', err);
                return next(); // Continue to next middleware if file read fails
            }
            
            // Get img URL for various image sizes for optimization
            const imageUrlOriginal = tvInfo.backdrop_path ? 
                `https://image.tmdb.org/t/p/original/${tvInfo.backdrop_path}` : 
                (tvInfo.poster_path ? `https://image.tmdb.org/t/p/original/${tvInfo.poster_path}` : '');
                
            const imageUrlLarge = tvInfo.backdrop_path ? 
                `https://image.tmdb.org/t/p/w1280/${tvInfo.backdrop_path}` : 
                (tvInfo.poster_path ? `https://image.tmdb.org/t/p/w780/${tvInfo.poster_path}` : '');
                
            // Use our SEO helper functions for optimized content
            const contentUrl = `https://moviea.tn/all-about/tv/${tvId}`;
            const optimizedTitle = generateTitle(tvInfo, 'tv', userLanguage);
            const optimizedDescription = tvInfo.overview || `${getTranslation('watch_now', userLanguage)} ${tvInfo.name || tvInfo.original_name} ${getTranslation('online', userLanguage)}`;
            const optimizedKeywords = generateKeywords(tvInfo, 'tv', userLanguage);
            const structuredData = generateStructuredData(tvInfo, 'tv', imageUrlOriginal, contentUrl, userLanguage);
            
            // Extract cast for rich structured data
            const tvCast = tvInfo.credits && tvInfo.credits.cast ? 
                tvInfo.credits.cast.slice(0, 5).map(actor => actor.name).join(', ') : '';
                
            // Extract creators for rich structured data
            const tvCreators = tvInfo.created_by && tvInfo.created_by.length > 0 ? 
                tvInfo.created_by.map(creator => creator.name).join(', ') : '';
                
            // Get content rating information if available
            const contentRating = tvInfo.content_ratings && tvInfo.content_ratings.results ? 
                tvInfo.content_ratings.results.find(rating => rating.iso_3166_1 === userCountry)?.rating || 
                tvInfo.content_ratings.results.find(rating => rating.iso_3166_1 === 'US')?.rating : '';
              // Create a complete SEO-optimized HTML document
            const seoHtml = `<!doctype html>
<html lang="${userLanguage}">
<head>
    <base href="/"/>
    <meta name="google-site-verification" content="gfLr6FcoTJz5djitWvSO041iz7i2PLCnaR6tRgpy_eI"/>
    <meta name="google-adsense-account" content="ca-pub-9662854573261832">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-78N5C676M5"></script>
    <script>function gtag(){dataLayer.push(arguments)}window.dataLayer=window.dataLayer||[],gtag("js",new Date),gtag("config","G-78N5C676M5")</script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9662854573261832" crossorigin="anonymous"></script>
    <script type="text/javascript" src="http://resources.infolinks.com/js/infolinks_main.js"></script>
    <meta charset="utf-8"/>
    <link rel="icon" href="./favicon.ico"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <meta name="theme-color" content="#000000"/>
    
    <!-- Enhanced SEO Meta Tags -->
    <title>${optimizedTitle}</title>
    <meta name="description" content="${optimizedDescription}"/>
    <meta name="keywords" content="${optimizedKeywords}">
    ${tvCast ? `<meta name="actors" content="${tvCast}">` : ''}
    ${tvCreators ? `<meta name="creator" content="${tvCreators}">` : ''}
    ${contentRating ? `<meta name="rating" content="${contentRating}">` : ''}
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph / Facebook / Social Sharing -->
    <meta property="og:type" content="video.tv_show"/>
    <meta property="og:title" content="${optimizedTitle}"/>
    <meta property="og:description" content="${optimizedDescription}"/>
    <meta property="og:image" content="${imageUrlLarge}"/>
    <meta property="og:image:width" content="1280"/>
    <meta property="og:image:height" content="720"/>
    <meta property="og:url" content="${contentUrl}"/>
    <meta property="og:site_name" content="Moviea.tn"/>
    <meta property="og:locale" content="${userLanguage}_${userCountry || userLanguage.toUpperCase()}"/>
    ${tvInfo.number_of_seasons ? `<meta property="video:series" content="true"/>` : ''}
    ${tvInfo.number_of_seasons ? `<meta property="video:release_date" content="${tvInfo.first_air_date}"/>` : ''}
    
    <!-- Twitter Card data -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${optimizedTitle}">
    <meta name="twitter:description" content="${optimizedDescription}">
    <meta name="twitter:image" content="${imageUrlLarge}">
      <!-- Structured Data for SEO - Enhanced with additional details -->
    <script type="application/ld+json">${structuredData}</script>
    
    <!-- Enhanced Link Tags -->
    <link rel="canonical" href="${contentUrl}"/>
    <link rel="alternate" hreflang="x-default" href="${contentUrl}"/>
    <link rel="alternate" hreflang="en" href="${contentUrl}"/>
    <link rel="alternate" hreflang="ar" href="${contentUrl}"/>
    <link rel="apple-touch-icon" href="./logo192.png"/>
    <link rel="manifest" href="./manifest.json"/>
    
    <!-- Inspectlet Tracking -->
    <script type="text/javascript">!function(){window.__insp=window.__insp||[],__insp.push(["wid",489353811]);setTimeout((function(){if(void 0===window.__inspld){window.__inspld=1;var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.id="inspsync",t.src=("https:"==document.location.protocol?"https":"http")+"://cdn.inspectlet.com/inspectlet.js?wid=489353811&r="+Math.floor((new Date).getTime()/36e5);var e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(t,e)}}),0)}()</script>
    
    <!-- Preload Critical Assets -->
    <link rel="preload" href="./static/js/main.3867268b.js" as="script">
    <link rel="preload" href="./static/css/main.291b9921.css" as="style">
    ${imageUrlLarge ? `<link rel="preload" href="${imageUrlLarge}" as="image">` : ''}
    
    <!-- CSS and JS -->
    <script defer="defer" src="./static/js/main.3867268b.js"></script>
    <link href="./static/css/main.291b9921.css" rel="stylesheet">
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
</body>
</html>`;
            
            // Send the enhanced SEO-optimized HTML with proper cache headers
            res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
            res.setHeader('Vary', 'Accept-Language, Accept-Encoding');
            res.send(seoHtml);
        });
    } catch (error) {
        console.error('Error in TV show route middleware:', error);
        next(); // Continue to next middleware if there's an error
    }
});

// Custom middleware to intercept Arabic TN TV content routes with numeric IDs for SEO enhancement
app.get(/^\/tn\/tv\/(\d+)$/, async (req, res, next) => {
    try {
        const tvId = req.params[0]; // Get TV ID from regex match
          // Detect user's country & language - but default to Arabic for Arabic content
        const userCountry = await detectCountryFromRequest(req) || 'tn';
        // Force Arabic language for Arabic TV content
        const userLanguage = 'ar';
        
        // Fetch TV details from the Arabic content API
        const response = await fetch(
            `https://content.shofha.com/api/mobile/contentFiles/${tvId}?subscriberId=8765592`,
            { headers: { "authorization": "Bearer c8ij8vntrhlreqv7g8shgqvecj", "platform": 1 } }
        );
        
        if (!response.ok) {
            return next(); // Continue to next middleware if API call fails
        }
        
        const tvInfo = await response.json();
        
        if (!tvInfo) {
            // If TV content not found, continue to next middleware
            return next();
        }
        
        // Read the index.html file
        fs.readFile(path.join(__dirname, 'build', 'index.html'), 'utf-8', (err, data) => {
            if (err) {
                console.error('Error reading index.html:', err);
                return next(); // Continue to next middleware if file read fails
            }
            
            // Use the SEO helpers to generate optimized content
            const contentName = tvInfo.name_ar || tvInfo.name_en;
            const contentUrl = `https://moviea.tn/tn/tv/${tvId}`;
            const imageUrl = tvInfo.previewImageUrl || '';
            
            // Create Arabic content object in the format our helper functions expect
            const arabicContent = {
                ...tvInfo,
                name: contentName,
                original_language: 'ar',
                type: tvInfo.type || 'tv',
            };
            
            // Generate optimized SEO content
            const optimizedTitle = generateTitle(arabicContent, 'arabic', userLanguage);
            const optimizedDescription = tvInfo.description_ar || tvInfo.description_en || 
                `${getTranslation('watch_now', userLanguage)} ${contentName} ${getTranslation('online', userLanguage)}`;
            const optimizedKeywords = generateKeywords(arabicContent, 'arabic', userLanguage);
            const structuredData = generateStructuredData(arabicContent, 'arabic', imageUrl, contentUrl, userLanguage);
            
            // Generate year and categories for additional metadata
            const year = tvInfo.publishDate ? new Date(tvInfo.publishDate).getFullYear() : '';
            const categories = tvInfo.categoryDTOs ? tvInfo.categoryDTOs.map(c => c.name_ar || c.name_en).join(', ') : '';
              // Create a complete SEO-optimized HTML document
            const seoHtml = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
    <base href="/"/>
    <meta name="google-site-verification" content="gfLr6FcoTJz5djitWvSO041iz7i2PLCnaR6tRgpy_eI"/>
    <meta name="google-adsense-account" content="ca-pub-9662854573261832">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-78N5C676M5"></script>
    <script>function gtag(){dataLayer.push(arguments)}window.dataLayer=window.dataLayer||[],gtag("js",new Date),gtag("config","G-78N5C676M5")</script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9662854573261832" crossorigin="anonymous"></script>
    <script type="text/javascript" src="http://resources.infolinks.com/js/infolinks_main.js"></script>
    <meta charset="utf-8"/>
    <link rel="icon" href="./favicon.ico"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <meta name="theme-color" content="#000000"/>
    
    <!-- Enhanced SEO Meta Tags -->
    <title>${optimizedTitle}</title>
    <meta name="description" content="${optimizedDescription}"/>
    <meta name="keywords" content="${optimizedKeywords}">
    <meta name="robots" content="index, follow">
    <meta name="language" content="Arabic">
    <meta name="geo.region" content="TN">
    ${categories ? `<meta name="category" content="${categories}">` : ''}
    ${year ? `<meta name="year" content="${year}">` : ''}
    
    <!-- Open Graph / Facebook / Social Sharing -->
    <meta property="og:type" content="video.tv_show"/>
    <meta property="og:title" content="${optimizedTitle}"/>
    <meta property="og:description" content="${optimizedDescription}"/>
    <meta property="og:image" content="${imageUrl}"/>
    <meta property="og:url" content="${contentUrl}"/>
    <meta property="og:site_name" content="Moviea.tn"/>
    <meta property="og:locale" content="ar_TN"/>
    
    <!-- Twitter Card data -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${optimizedTitle}">
    <meta name="twitter:description" content="${optimizedDescription}">
    <meta name="twitter:image" content="${imageUrl}">
    
    <!-- Enhanced Structured Data for SEO -->
    <script type="application/ld+json">${structuredData}</script>
      <!-- Enhanced Link Tags -->
    <link rel="canonical" href="${contentUrl}"/>
    <link rel="alternate" hreflang="x-default" href="${contentUrl}"/>
    <link rel="alternate" hreflang="ar" href="${contentUrl}"/>
    <link rel="apple-touch-icon" href="./logo192.png"/>
    <link rel="manifest" href="./manifest.json"/>
    
    <!-- Inspectlet Tracking -->
    <script type="text/javascript">!function(){window.__insp=window.__insp||[],__insp.push(["wid",489353811]);setTimeout((function(){if(void 0===window.__inspld){window.__inspld=1;var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.id="inspsync",t.src=("https:"==document.location.protocol?"https":"http")+"://cdn.inspectlet.com/inspectlet.js?wid=489353811&r="+Math.floor((new Date).getTime()/36e5);var e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(t,e)}}),0)}()</script>
    
    <!-- Preload Critical Assets -->
    <link rel="preload" href="./static/js/main.3867268b.js" as="script">
    <link rel="preload" href="./static/css/main.291b9921.css" as="style">
    ${imageUrl ? `<link rel="preload" href="${imageUrl}" as="image">` : ''}
    
    <!-- CSS and JS -->
    <script defer="defer" src="./static/js/main.3867268b.js"></script>
    <link href="./static/css/main.291b9921.css" rel="stylesheet">
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
</body>
</html>`;
            
            // Send the enhanced SEO-optimized HTML with proper cache headers
            res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
            res.setHeader('Vary', 'Accept-Language, Accept-Encoding');
            res.send(seoHtml);
        });
    } catch (error) {
        console.error('Error in Arabic TV route middleware:', error);
        next(); // Continue to next middleware if there's an error
    }
});

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

// Worker Pool Management
class WorkerPool {
    constructor(size, workerScript) {
        this.size = size;
        this.workers = [];
        this.queue = [];
        this.workerScript = workerScript;
        this.initialize();
    }

    initialize() {
        for (let i = 0; i < this.size; i++) {
            this.addWorker();
        }
    }

    addWorker() {
        const worker = new Worker(this.workerScript);
        worker.on('error', this.handleWorkerError.bind(this));
        worker.on('exit', (code) => {
            if (code !== 0) {
                this.handleWorkerExit(worker);
            }
        });
        this.workers.push({ worker, busy: false });
    }

    handleWorkerError(error) {
        console.error('Worker error:', error);
    }

    handleWorkerExit(worker) {
        this.workers = this.workers.filter(w => w.worker !== worker);
        this.addWorker();
    }

    async runTask(data) {
        return new Promise((resolve, reject) => {
            const availableWorker = this.workers.find(w => !w.busy);

            if (availableWorker) {
                availableWorker.busy = true;

                const timeoutId = setTimeout(() => {
                    availableWorker.worker.terminate();
                    reject(new Error('Worker timeout'));
                }, 30000);

                availableWorker.worker.once('message', (result) => {
                    clearTimeout(timeoutId);
                    availableWorker.busy = false;
                    resolve(result);
                });

                availableWorker.worker.once('error', (error) => {
                    clearTimeout(timeoutId);
                    availableWorker.busy = false;
                    reject(error);
                });

                availableWorker.worker.postMessage(data);
            } else {
                this.queue.push({ data, resolve, reject });
            }
        });
    }
}

// Initialize worker pools
const movieWorkerPool = new WorkerPool(2, './workers/movieWorker.js');
const tvShowWorkerPool = new WorkerPool(2, './workers/tvShowWorker.js');

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

// Routes with optimized error handling and caching
app.get("/movie/files/:name", cacheMiddleware(1800), async (req, res) => {
    try {
        const name = req.params.name;
        const result = await movieWorkerPool.runTask(name);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch movie data' });
    }
});

app.get("/tv/files/:name/:s/:e", cacheMiddleware(1800), async (req, res) => {
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

        const result = await tvShowWorkerPool.runTask({ 
            series_name: name.trim(), 
            episode, 
            season 
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch TV show data' });
    }
});

// Scraper for the arabic movies and tv shows
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

app.get("/movie-scraper/:movie_name", (req, res) => {
    const movie_name = req.params.movie_name;
    if (movie_name.length === 0) {
        return res.status(400).json({ error: "movie name needed" });
    }
    createWorker("./movieWorker.js", movie_name, res);
});

app.get("/tv-show/:tv_show_name/:season/:episode", cacheMiddleware(1800), async (req, res) => {
    try {
        const { tv_show_name, season, episode } = req.params;
        if (!tv_show_name.trim() || episode <= 0 || season <= 0) {
            return res.status(400).json({ error: "name needed" });
        }
        const result = await tvShowWorkerPool.runTask({ 
            series_name: tv_show_name.trim(), 
            episode: parseInt(episode), 
            season: parseInt(season) 
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch TV show data' });
    }
});

app.get("/tv/ramadan-scraper", (req, res) => {
    createWorker("./ramadanRow.js", null, res);
});

app.get("/tv/ramadan-scraper/watch/:id/:ep", (req, res) => {
    const { id, ep } = req.params;
    createWorker("./ramadanWatch.js", { id, ep }, res);
});

// APIS FOR THE MOVIE DB API --------------------------------------------------
const fetchAndReturn = async (url) => {
    const res = await fetch("https://api.themoviedb.org/3" + url);
    const data = await res.json();
    return data;
};

app.get('/share/movie/:id', async (req, res) => {
    fs.readFile(path.resolve("./build/index.html"), 'utf-8', async (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Some Error Happend");
        }
        const movieId = req.params.id;
        try {
            const result = await fetch("https://api.themoviedb.org/3/movie/" + movieId + "?api_key=20108f1c4ed38f7457c479849a9999cc");
            const info = await result.json();

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

app.get('/share/tn/:tvId', async (req, res) => {
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

            const info = await result.json();

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

app.get('/share/tv/:id', async (req, res) => {
    fs.readFile(path.resolve("./build/index.html"), 'utf-8', async (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Some Error Happend");
        }
        const movieId = req.params.id;
        try {
            const result = await fetch("https://api.themoviedb.org/3/tv/" + movieId + "?api_key=20108f1c4ed38f7457c479849a9999cc");
            const info = await result.json();

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

app.get('/genres/movie', async (req, res) => {
    res.send(await fetchAndReturn(requests.fetchGenreMovie));
});

app.get('/genres/tv', async (req, res) => {
    res.send(await fetchAndReturn(requests.fetchGenreTv));
});

app.get('/trending/:page?', async (req, res) => {
    res.send(await fetchAndReturn(requests.fetchTrending + `&page=${req.params.page || 1}`));
});

app.get('/discover/netflix/:page?', async (req, res) => {
    res.send(await fetchAndReturn(requests.fetchNetflixOriginals + `&page=${req.params.page || 1}`));
});

app.get('/discover/movie/:genre/:page?', async (req, res) => {
    res.send(await fetchAndReturn(`/discover/movie?api_key=${API_KEY}&with_genres=` + req.params.genre + `&page=${req.params.page || 1}`));
});

app.get('/discover/tv/:genre/:page?', async (req, res) => {
    res.send(await fetchAndReturn(`/discover/tv?api_key=${API_KEY}&with_genres=` + req.params.genre + `&page=${req.params.page || 1}`));
});

app.get("/similar/movie/:id/:page?", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`https://api.themoviedb.org/3/movie/${req.params.id}/similar?api_key=20108f1c4ed38f7457c479849a9999cc` + `&page=${req.params.page || 1}`);
    const data = await response.json();

    res.send(data);
});

app.get("/similar/tv/:id/:page?", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`https://api.themoviedb.org/3/tv/${req.params.id}/similar?api_key=20108f1c4ed38f7457c479849a9999cc` + `&page=${req.params.page || 1}`);
    const data = await response.json();

    res.send(data);
});

app.get("/movie/:id", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=20108f1c4ed38f7457c479849a9999cc&append_to_response=videos`);
    const data = await response.json();

    res.send(data);
});

app.get("/tv/:id", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=20108f1c4ed38f7457c479849a9999cc&append_to_response=videos`);
    const data = await response.json();

    res.send(data);
});

app.get("/tv/season/:id/:season", cacheMiddleware(1800), async (req, res) => {
    try {
        const { id, season } = req.params;
        const response = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${API_KEY}`);
        const data = await response.json();
        
        if (data.success === false) {
            return res.status(404).json({ error: 'TV show or season not found' });
        }
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch TV show season data' });
    }
});

app.get("/movie/credits/:id", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=20108f1c4ed38f7457c479849a9999cc`);
    const data = await response.json();

    res.send(data);
});

app.get("/movie/collection/:id", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`https://api.themoviedb.org/3/collection/${id}?api_key=${API_KEY}`);
    const data = await response.json();

    res.send(data);
});

app.get("/tv/credits/:id", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`https://api.themoviedb.org/3/tv/${id}/credits?api_key=20108f1c4ed38f7457c479849a9999cc`);
    const data = await response.json();

    res.send(data);
});

app.get("/person/:id", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`https://api.themoviedb.org/3/person/${id}?api_key=20108f1c4ed38f7457c479849a9999cc`);
    const data = await response.json();

    res.send(data);
});

app.get("/credit/:id", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`https://api.themoviedb.org/3/credit/${id}?api_key=20108f1c4ed38f7457c479849a9999cc`);
    const data = await response.json();

    res.send(data);
});

app.get("/person/combined/:id", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`https://api.themoviedb.org/3/person/${id}/combined_credits?api_key=20108f1c4ed38f7457c479849a9999cc`);
    const data = await response.json();

    res.send(data);
});

app.get('/search/:q/:page?', async (req, res) => {
    res.send(await fetchAndReturn(requests.multiFetch + `&query=${req.params.q}&page=${req.params.page || 1}`));
});

// Generate a search sitemap for better search discoverability


// Generate a search sitemap for better search discoverability
app.get('/search-sitemap.xml', async (req, res) => {
    try {
        // We'll fetch popular movies and TV shows to build a sitemap with search queries
        const [moviesResponse, tvShowsResponse] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US`),
            fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=en-US`)
        ]);
        
        const movies = (await moviesResponse.json()).results || [];
        const tvShows = (await tvShowsResponse.json()).results || [];
        
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
        movies.forEach(movie => {
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
        tvShows.forEach(show => {
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

// Function to detect if a request is coming from a search engine crawler or bot
function isSearchEngineCrawler(req) {
    const userAgent = req.get('user-agent') || '';
    
    // If no user agent, assume it's not a crawler
    if (!userAgent) return false;
    
    const crawlers = [
        // Major search engines
        'googlebot', 'google-structured-data', 'adsbot-google',
        'bingbot', 'msnbot', 'adidxbot',
        'yandexbot', 'yandex.com/bots',
        'duckduckbot',
        'slurp', // Yahoo
        'baiduspider',
        'sogou',
        'exabot', // Exalead
        'seznambot', // Seznambot
        'gigabot', // Gigablast
        'ia_archiver', // Alexa/Internet Archive
        
        // Social media crawlers
        'facebookexternalhit', 'facebot', 'whatsapp',
        'twitterbot', 'linkedinbot', 'pinterest',
        'slackbot', 'vkshare', 'telegrambot',
        'redditbot', 'tumblrbot',
        
        // Content aggregation services
        'flipboard', 'nuzzel', 'feedly', 'fetchrss',
        'embedly', 'quora link preview', 'showyoubot', 'outbrain',
        
        // Tools and validators
        'w3c_validator', 'chrome-lighthouse', 'google page speed', 'pagespeed',
        'developers.google.com/+/web/snippet', 'amp-validator',
        'gtmetrix', 'ahrefs', 'semrush', 'majestic', 
        
        // Preview bots
        'skypeuripreview', 'bitlybot', 'bitrix link preview', 'xing-contenttabreceiver',
        
        // Other bots
        'crawler', 'spider', 'bot', 'ahrefsbot', 'screaming frog',
        'headlesschrome', 'phantom', 'selenium', 'wget', 'curl',
        'archive.org_bot', 'rogerbot', 'qwantify'
    ];
    
    const lowerCaseUserAgent = userAgent.toLowerCase();
    return crawlers.some(crawler => lowerCaseUserAgent.includes(crawler));
}

app.get('/search-page', async (req, res, next) => {
    try {
        // Get search query from query parameters
        const query = req.query.q;
        const page = req.query.page || 1;
        
        // If no query is provided, continue to client-side rendering
        if (!query || query.trim() === '') {
            return next();
        }
        
        // Check if the request is from a search engine crawler
        const isBot = isSearchEngineCrawler(req);
        
        // If the request is from a real user, let the React app handle it
        if (!isBot) {
            return next(); // Pass control to the client-side React app
        }
        
        // For search engine crawlers, continue with SEO-optimized server rendering
        // Fetch search results
        const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=${page}`);
        const searchResults = await response.json();
        
        if (!searchResults || !searchResults.results || searchResults.success === false) {
            // If search fails, continue to client-side rendering
            return next();
        }
        
        // Get user's country & language
        const userCountry = await detectCountryFromRequest(req);
        const userLanguage = detectLanguage(userCountry);
        
        // Read the index.html file
        fs.readFile(path.join(__dirname, 'build', 'index.html'), 'utf-8', (err, data) => {
            if (err) {
                console.error('Error reading index.html:', err);
                return next(); // Continue to next middleware if file read fails
            }
            
            // Get top result thumbnail if available for Open Graph images
            let imageUrl = '';
            if (searchResults.results.length > 0) {
                const topResult = searchResults.results[0];
                if (topResult.poster_path) {
                    imageUrl = `https://image.tmdb.org/t/p/w500${topResult.poster_path}`;
                } else if (topResult.backdrop_path) {
                    imageUrl = `https://image.tmdb.org/t/p/w780${topResult.backdrop_path}`;
                }
            }
            
            // Create content for SEO
            const contentUrl = `${BASE_URL}/search-page?q=${encodeURIComponent(query)}${page > 1 ? `&page=${page}` : ''}`;
            const optimizedTitle = `Search results for "${query}" - Moviea.tn`;
            const optimizedDescription = `Find movies, TV shows, and people matching "${query}" - Page ${page} of search results on Moviea.tn.`;
            const optimizedKeywords = `${query}, movies, search, tv shows, films, series, actors, online streaming`;
            
            // Format top results for structured data
            const topResults = searchResults.results.slice(0, 5);
            const resultNames = topResults.map(item => 
                item.title || item.name || item.original_title || item.original_name
            ).filter(Boolean).join(', ');
            
            const totalResults = searchResults.total_results || topResults.length;
            
                        // Generate structured data for search results
            const structuredData = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'SearchResultsPage',
                'url': contentUrl,
                'name': optimizedTitle,
                'description': optimizedDescription,
                'mainContentOfPage': {
                    '@type': 'WebPageElement',
                    'cssSelector': '#root'
                },
                'mainEntity': {
                    '@type': 'ItemList',
                    'numberOfItems': totalResults,
                    'itemListElement': topResults.map((item, index) => ({
                        '@type': 'ListItem',
                        'position': index + 1,
                        'item': {
                            '@type': item.media_type === 'movie' ? 'Movie' : (item.media_type === 'tv' ? 'TVSeries' : 'Person'),
                            'url': `${BASE_URL}/${item.media_type === 'movie' ? 'all-about/movie/' : (item.media_type === 'tv' ? 'all-about/tv/' : 'person/')}${item.id}`,
                            'name': item.title || item.name || item.original_title || item.original_name,
                            'image': item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 
                                   (item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : '')
                        }
                    }))
                },                'potentialAction': {
                    '@type': 'SearchAction',
                    'target': {
                        '@type': 'EntryPoint',
                        'urlTemplate': `${BASE_URL}/search-page?q={search_term_string}`
                    },
                    'query-input': 'required name=search_term_string'
                },
                'pagination': {
                    '@type': 'SiteNavigationElement',
                    'currentPage': parseInt(page),
                    'numberOfItems': totalResults,
                    'numberOfPages': Math.ceil(searchResults.total_pages || 1)
                },
                'isPartOf': {
                    '@type': 'WebSite',
                    'url': BASE_URL,
                    'name': 'Moviea.tn',
                    'potentialAction': {
                        '@type': 'SearchAction',
                        'target': `${BASE_URL}/search-page?q={search_term_string}`,
                        'query-input': 'required name=search_term_string'
                    }
                }
            });
            
            // Create a complete SEO-optimized HTML document
            const seoHtml = `<!doctype html>
<html lang="${userLanguage}">
<head>
    <base href="/"/>
    <meta name="google-site-verification" content="gfLr6FcoTJz5djitWvSO041iz7i2PLCnaR6tRgpy_eI"/>
    <meta name="google-adsense-account" content="ca-pub-9662854573261832">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-78N5C676M5"></script>
    <script>function gtag(){dataLayer.push(arguments)}window.dataLayer=window.dataLayer||[],gtag("js",new Date),gtag("config","G-78N5C676M5")</script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9662854573261832" crossorigin="anonymous"></script>
    <script type="text/javascript" src="http://resources.infolinks.com/js/infolinks_main.js"></script>
    <meta charset="utf-8"/>
    <link rel="icon" href="./favicon.ico"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <meta name="theme-color" content="#000000"/>
    
    <!-- Enhanced SEO Meta Tags -->
    <title>${optimizedTitle}</title>
    <meta name="description" content="${optimizedDescription}"/>
    <meta name="keywords" content="${optimizedKeywords}">
    <meta name="robots" content="index, follow">
      <!-- Open Graph / Facebook / Social Sharing -->
    <meta property="og:type" content="website"/>
    <meta property="og:title" content="${optimizedTitle}"/>
    <meta property="og:description" content="${optimizedDescription}"/>
    ${imageUrl ? `<meta property="og:image" content="${imageUrl}"/>` : ''}
    <meta property="og:url" content="${contentUrl}"/>
    <meta property="og:site_name" content="Moviea.tn"/>
    <meta property="og:locale" content="${userLanguage}_${userCountry || userLanguage.toUpperCase()}"/>
    
    <!-- Accessibility and Semantic Web Metadata -->
    <meta name="search-results" content="true" />
    <meta name="search-term" content="${query}" />
    <meta name="search-results-count" content="${totalResults}" />
    
    <!-- Twitter Card data -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${optimizedTitle}">
    <meta name="twitter:description" content="${optimizedDescription}">
    ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}">` : ''}
    
    <!-- Structured Data for SEO - Search Results -->
    <script type="application/ld+json">${structuredData}</script>
      <!-- Enhanced Link Tags -->
    <link rel="canonical" href="${contentUrl}"/>
    <link rel="alternate" hreflang="x-default" href="${contentUrl}"/>
    <link rel="alternate" hreflang="en" href="${contentUrl}"/>
    <link rel="alternate" hreflang="ar" href="${contentUrl}"/>
    <link rel="apple-touch-icon" href="./logo192.png"/>
    <link rel="manifest" href="./manifest.json"/>
    
    <!-- Pagination Links for SEO -->
    ${parseInt(page) > 1 ? 
      `<link rel="prev" href="${BASE_URL}/search-page?q=${encodeURIComponent(query)}&page=${parseInt(page) - 1}"/>` : ''}
    ${searchResults.total_pages && parseInt(page) < searchResults.total_pages ? 
      `<link rel="next" href="${BASE_URL}/search-page?q=${encodeURIComponent(query)}&page=${parseInt(page) + 1}"/>` : ''}
    
    <!-- Preload Critical Assets -->
    <link rel="preload" href="./static/js/main.3867268b.js" as="script">
    <link rel="preload" href="./static/css/main.291b9921.css" as="style">
    ${imageUrl ? `<link rel="preload" href="${imageUrl}" as="image">` : ''}
    
    <!-- CSS and JS -->
    <script defer="defer" src="./static/js/main.3867268b.js"></script>
    <link href="./static/css/main.291b9921.css" rel="stylesheet">
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
</body>
</html>`;
            
            // Send the enhanced SEO-optimized HTML with proper cache headers
            res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
            res.setHeader('Vary', 'Accept-Language, Accept-Encoding');
            res.send(seoHtml);
        });
    } catch (error) {
        console.error('Error in search-page route middleware:', error);
        next(); // Continue to next middleware if there's an error
    }
});

// ARABIC ROUTES ------------------------------------------------------------------------------------

app.get("/arabic/categories/:id", async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`https://content.shofha.com/api/categories/${id}?subscriberId=16640329&opCode=60502`, { headers: { authorization: "Bearer c8ij8vntrhlreqv7g8shgqvecj", platform: 1 } });
    const data = await response.json();

    res.send(data);
});

app.get("/arabic/files/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const response = await fetch(`https://content.shofha.com/api/mobile/contentFiles/${id}?subscriberId=8765592`, { 
            headers: { 
                authorization: "Bearer c8ij8vntrhlreqv7g8shgqvecj", 
                platform: 1 
            } 
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data) {
            return res.status(404).json({ error: 'Content not found' });
        }

        // Check if episodes array is empty
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
                    // If playlist request fails, just return the original data
                    return res.json(data);
                }

                const playlistData = await playlistResponse.json();
                
                if (playlistData) {
                    const newOne = { ...data, contentFilesEpisodesDTOs: playlistData };
                    return res.json(newOne);
                }
            } catch (playlistError) {
                console.error('Playlist fetch error:', playlistError);
                // If playlist request fails, return the original data
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

app.get("/reels/:page", async (req, res) => {
    const page = req.params.page;
    const response = await fetch(`https://content.shofha.com/api/mobile/ReelsPerGeoV2?size=10&page=${page}&opCode=60502`, { headers: { authorization: "Bearer c8ij8vntrhlreqv7g8shgqvecj", platform: 1 } });
    const data = await response.json();

    res.send(data);
});

app.get("/ramadan/tv", async (req, res) => {
    const response = await fetch(`${BASE_URL}/tv/ramadan-scraper`);
    const data = await response.json();

    res.send(data);
});

app.get("/tv/ramadan/watch/:id", async (req, res) => {
    const response = await fetch(`${BASE_URL}/tv/ramadan-scraper/watch/${req.params.id}`);
    const data = await response.json();

    res.send(data);
});

// Catch-all route for React app - should be last
app.get('*', function(req, res) {
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

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Test endpoint for IP-based location detection
app.get('/api/detect-country', async (req, res) => {
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

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

// Initialize the video sitemap system
console.log('Initializing video sitemap system...');
initSitemapSystem(app, API_KEY, {
    generateOnStartup: true,
    cronSchedule: '0 4 * * *' // Every day at 4 AM
});

const server = app.listen(port, () => console.log(`Server running on port ${port}`));