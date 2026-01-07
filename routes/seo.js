// SEO and bot-detection routes: /tn/movie/:id, /tn/tv/:id, /all-about/movie/:id, /all-about/tv/:id, /search-page
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const { isSearchEngineCrawler, detectCountryFromRequest, detectLanguage, safeJsonParse } = require('../utils/helpers');
const { generateTitle, generateKeywords, generateStructuredData, getTranslation } = require('../seo/seoHelpers');
const {
    generateDetailedPlot,
    generateProductionDetails,
    generateCastCrewSection,
    generateTrailerSection,
    generateRelatedMovies,
    generateBreadcrumbs,
    generateEnhancedStructuredData,
    generateUserReviews
} = require('../seo/advancedSeoGenerator');

// /tn/movie/:id - Arabic movie route for SEO
router.get(/^\/tn\/movie\/(\d+)$/, async (req, res, next) => {
    try {
        // Check if the request is from a search engine crawler
        const isBot = isSearchEngineCrawler(req);
        
        // If the request is from a real user, let the React app handle it
        if (!isBot) {
            return next(); // Pass control to the client-side React app
        }
        
        const movieId = req.params[0]; // Get movie ID from regex match
        // Detect user's country & language - but default to Arabic for Arabic content
        const userCountry = await detectCountryFromRequest(req) || 'tn';
        // Force Arabic language for Arabic movie content
        const userLanguage = 'ar';
        
        // Fetch movie details from the Arabic content API
        const response = await fetch(
            `https://content.shofha.com/api/mobile/contentFiles/${movieId}?subscriberId=8765592`,
            { headers: { "authorization": "Bearer c8ij8vntrhlreqv7g8shgqvecj", "platform": 1 } }
        );
        
        if (!response.ok) {
            return next(); // Continue to next middleware if API call fails
        }
        
        const movieInfo = await safeJsonParse(response);
        
        if (!movieInfo) {
            // If movie content not found, continue to next middleware
            return next();
        }
        
        // Read the index.html file
        fs.readFile(path.join(__dirname, '..', 'build', 'index.html'), 'utf-8', (err, data) => {
            if (err) {
                console.error('Error reading index.html:', err);
                return next(); // Continue to next middleware if file read fails
            }
            
            // Use the SEO helpers to generate optimized content
            const contentName = movieInfo.name_ar || movieInfo.name_en;
            const contentUrl = `https://moviea.me/tn/movie/${movieId}`;
            const imageUrl = movieInfo.previewImageUrl || '';
            
            // Create Arabic content object in the format our helper functions expect
            const arabicContent = {
                ...movieInfo,
                name: contentName,
                original_language: 'ar',
                type: movieInfo.type || 'movie',
            };
            
            // Generate optimized SEO content
            const optimizedTitle = generateTitle(arabicContent, 'arabic', userLanguage);
            const optimizedDescription = movieInfo.description_ar || movieInfo.description_en || 
                `${getTranslation('watch_now', userLanguage)} ${contentName} ${getTranslation('online', userLanguage)}`;
            const optimizedKeywords = generateKeywords(arabicContent, 'arabic', userLanguage);
            const structuredData = generateStructuredData(arabicContent, 'arabic', imageUrl, contentUrl, userLanguage);
            
            // Generate year and categories for additional metadata
            const year = movieInfo.publishDate ? new Date(movieInfo.publishDate).getFullYear() : '';
            const categories = movieInfo.categoryDTOs ? movieInfo.categoryDTOs.map(c => c.name_ar || c.name_en).join(', ') : '';
            
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
    <script type="text/javascript" src="https://resources.infolinks.com/js/infolinks_main.js"></script>
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
    <meta property="og:type" content="video.movie"/>
    <meta property="og:title" content="${optimizedTitle}"/>
    <meta property="og:description" content="${optimizedDescription}"/>
    <meta property="og:image" content="${imageUrl}"/>
    <meta property="og:url" content="${contentUrl}"/>
    <meta property="og:site_name" content="Moviea.me"/>
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
        console.error('Error in Arabic Movie route middleware:', error);
        next(); // Continue to next middleware if there's an error
    }
});
// /tn/tv/:id - Arabic TV route for SEO
router.get(/^\/tn\/tv\/(\d+)$/, async (req, res, next) => {
    try {
        // Check if the request is from a search engine crawler
        const isBot = isSearchEngineCrawler(req);
        
        // If the request is from a real user, let the React app handle it
        if (!isBot) {
            return next(); // Pass control to the client-side React app
        }
        
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
        
        const tvInfo = await safeJsonParse(response);
        
        if (!tvInfo) {
            // If TV content not found, continue to next middleware
            return next();
        }
        
        // Read the index.html file
        fs.readFile(path.join(__dirname, '..', 'build', 'index.html'), 'utf-8', (err, data) => {
            if (err) {
                console.error('Error reading index.html:', err);
                return next(); // Continue to next middleware if file read fails
            }
            
            // Use the SEO helpers to generate optimized content
            const contentName = tvInfo.name_ar || tvInfo.name_en;
            const contentUrl = `https://moviea.me/tn/tv/${tvId}`;
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
    <script type="text/javascript" src="https://resources.infolinks.com/js/infolinks_main.js"></script>
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
    <meta property="og:site_name" content="Moviea.me"/>
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
// /all-about/movie/:id - Movie SEO route with comprehensive 2000+ word content
router.get(/^\/all-about\/movie\/(\d+)$/, async (req, res, next) => {
    try {
        // Check if the request is from a search engine crawler
        const isBot = isSearchEngineCrawler(req);
        
        // If the request is from a real user, let the React app handle it
        if (!isBot) {
            return next(); // Pass control to the client-side React app
        }
        
        const movieId = req.params[0]; // Get movie ID from regex match
        // Detect user's country & language from request
        const userCountry = await detectCountryFromRequest(req);
        const userLanguage = detectLanguage(userCountry);
        
        const API_KEY = process.env.API_KEY || '20108f1c4ed38f7457c479849a9999cc';
        
        // Attempt to fetch additional movie details like credits, reviews for enhanced SEO
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=videos,credits,similar,release_dates,production_companies,production_countries,reviews&language=${userLanguage}`);
        let movieInfo = await safeJsonParse(response);
        
        // If we have the movie info and its original language, we can fetch it again with that language
        if (movieInfo && movieInfo.original_language && movieInfo.original_language !== userLanguage) {
            try {
                const detailsInOriginalLang = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=videos,credits,similar,release_dates,production_companies,production_countries,reviews&language=${movieInfo.original_language}`);
                const originalLangData = await safeJsonParse(detailsInOriginalLang);
                
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
        fs.readFile(path.join(__dirname, '..', 'build', 'index.html'), 'utf-8', (err, data) => {
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
            const contentUrl = `https://moviea.me/all-about/movie/${movieId}`;
            const optimizedTitle = generateTitle(movieInfo, 'movie', userLanguage);
            const optimizedDescription = movieInfo.overview || `${getTranslation('watch_now', userLanguage)} ${movieInfo.title || movieInfo.original_title} ${getTranslation('online', userLanguage)}`;
            const optimizedKeywords = generateKeywords(movieInfo, 'movie', userLanguage);
            
            // Generate enhanced structured data with comprehensive schemas
            const structuredData = generateEnhancedStructuredData(movieInfo, 'movie', imageUrlOriginal, contentUrl, userLanguage);
            
            // Extract cast for rich structured data
            const movieCast = movieInfo.credits && movieInfo.credits.cast ? 
                movieInfo.credits.cast.slice(0, 5).map(actor => actor.name).join(', ') : '';
                
            // Extract director for rich structured data
            const movieDirector = movieInfo.credits && movieInfo.credits.crew ? 
                movieInfo.credits.crew.find(person => person.job === 'Director')?.name : '';
                
            // Extract genres for display
            const genres = movieInfo.genres ? movieInfo.genres.map(g => g.name).join(', ') : '';
            const releaseYear = movieInfo.release_date ? new Date(movieInfo.release_date).getFullYear() : '';
            const rating = movieInfo.vote_average ? movieInfo.vote_average.toFixed(1) : 'N/A';
            const runtime = movieInfo.runtime ? `${movieInfo.runtime} min` : '';
            
            // Generate comprehensive SEO content sections
            const breadcrumbs = generateBreadcrumbs(movieInfo, 'movie', contentUrl, userLanguage);
            const trailerSection = generateTrailerSection(movieInfo, 'movie', userLanguage);
            const detailedPlot = generateDetailedPlot(movieInfo, 'movie', userLanguage);
            const productionDetails = generateProductionDetails(movieInfo, 'movie', userLanguage);
            const castCrewSection = generateCastCrewSection(movieInfo, 'movie', userLanguage);
            const relatedMovies = generateRelatedMovies(movieInfo, 'movie', userLanguage);
            const userReviews = generateUserReviews(movieInfo, 'movie', userLanguage);
            
            // Create a complete SEO-optimized HTML document with semantic structure and 2000+ word content
            const seoHtml = `<!doctype html>
<html lang="${userLanguage}">
<head>
    <base href="/"/>
    <meta name="google-site-verification" content="gfLr6FcoTJz5djitWvSO041iz7i2PLCnaR6tRgpy_eI"/>
    <meta name="google-adsense-account" content="ca-pub-9662854573261832">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-78N5C676M5"></script>
    <script>function gtag(){dataLayer.push(arguments)}window.dataLayer=window.dataLayer||[],gtag("js",new Date),gtag("config","G-78N5C676M5")</script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9662854573261832" crossorigin="anonymous"></script>
    <script type="text/javascript" src="https://resources.infolinks.com/js/infolinks_main.js"></script>
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
    ${releaseYear ? `<meta name="publish_date" content="${movieInfo.release_date}">` : ''}
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="googlebot" content="index, follow">
    
    <!-- Open Graph / Facebook / Social Sharing -->
    <meta property="og:type" content="video.movie"/>
    <meta property="og:title" content="${optimizedTitle}"/>
    <meta property="og:description" content="${optimizedDescription}"/>
    <meta property="og:image" content="${imageUrlLarge}"/>
    <meta property="og:image:width" content="1280"/>
    <meta property="og:image:height" content="720"/>
    <meta property="og:image:alt" content="${movieInfo.title || movieInfo.original_title} poster"/>
    <meta property="og:url" content="${contentUrl}"/>
    <meta property="og:site_name" content="Moviea.me"/>
    <meta property="og:locale" content="${userLanguage}_${userCountry || userLanguage.toUpperCase()}"/>
    ${releaseYear ? `<meta property="video:release_date" content="${movieInfo.release_date}">` : ''}
    ${movieDirector ? `<meta property="video:director" content="${movieDirector}">` : ''}
    ${movieCast ? `<meta property="video:actor" content="${movieCast}">` : ''}
    ${runtime ? `<meta property="video:duration" content="${movieInfo.runtime * 60}">` : ''}
    
    <!-- Twitter Card data -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${optimizedTitle}">
    <meta name="twitter:description" content="${optimizedDescription}">
    <meta name="twitter:image" content="${imageUrlLarge}">
    <meta name="twitter:image:alt" content="${movieInfo.title || movieInfo.original_title} poster">
    
    <!-- Article metadata -->
    <meta property="article:published_time" content="${movieInfo.release_date}"/>
    <meta property="article:modified_time" content="${new Date().toISOString()}"/>
    <meta property="article:section" content="Movies"/>
    ${genres ? `<meta property="article:tag" content="${genres}"/>` : ''}
    
    <!-- Enhanced Structured Data for SEO -->
    <script type="application/ld+json">${JSON.stringify(structuredData)}</script>
    
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
    
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; margin: 0; padding: 20px; background: #0a0a0a; color: #e0e0e0; line-height: 1.7; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { font-size: 2.8em; margin: 20px 0; color: #fff; font-weight: 700; line-height: 1.2; }
        h2 { font-size: 2em; margin: 40px 0 20px; color: #fff; border-bottom: 3px solid #e50914; padding-bottom: 12px; font-weight: 600; }
        h3 { font-size: 1.5em; margin: 30px 0 15px; color: #f0f0f0; font-weight: 600; }
        .breadcrumb { margin: 20px 0; color: #888; font-size: 0.9em; }
        .breadcrumb a { color: #e50914; text-decoration: none; }
        .breadcrumb a:hover { text-decoration: underline; }
        .movie-header { display: flex; gap: 40px; margin: 40px 0; flex-wrap: wrap; background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%); padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .movie-poster { width: 300px; height: 450px; object-fit: cover; border-radius: 12px; box-shadow: 0 8px 24px rgba(229,9,20,0.3); }
        .movie-info { flex: 1; min-width: 300px; }
        .movie-meta { display: flex; gap: 15px; margin: 20px 0; flex-wrap: wrap; }
        .movie-meta span { background: linear-gradient(135deg, #e50914 0%, #b20710 100%); padding: 8px 18px; border-radius: 20px; font-weight: 500; font-size: 0.95em; box-shadow: 0 4px 12px rgba(229,9,20,0.2); }
        .overview { line-height: 1.8; font-size: 1.15em; color: #d0d0d0; margin: 20px 0; }
        .content-section { margin: 50px 0; padding: 30px; background: #111; border-radius: 12px; border-left: 4px solid #e50914; }
        .content-section p { margin: 15px 0; line-height: 1.8; }
        .cast-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; margin: 20px 0; }
        .cast-member { text-align: center; background: #1a1a1a; padding: 15px; border-radius: 10px; transition: transform 0.3s; }
        .cast-member:hover { transform: translateY(-5px); box-shadow: 0 8px 24px rgba(229,9,20,0.3); }
        .cast-photo { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; border: 3px solid #e50914; }
        .cast-name { font-weight: 600; color: #fff; margin: 5px 0; }
        .cast-role { color: #999; font-size: 0.9em; }
        .production-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .production-item { background: #1a1a1a; padding: 20px; border-radius: 10px; }
        .production-label { color: #e50914; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; font-size: 0.85em; letter-spacing: 1px; }
        .production-value { color: #e0e0e0; font-size: 1.1em; }
        .trailer-container { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 12px; margin: 20px 0; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
        .trailer-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
        .related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 25px; margin: 20px 0; }
        .related-item { background: #1a1a1a; border-radius: 10px; overflow: hidden; transition: transform 0.3s; }
        .related-item:hover { transform: scale(1.05); box-shadow: 0 8px 24px rgba(229,9,20,0.4); }
        .related-poster { width: 100%; height: 300px; object-fit: cover; }
        .related-title { padding: 15px; font-weight: 600; color: #fff; text-align: center; }
        .rating { font-size: 1.8em; color: #ffd700; font-weight: bold; text-shadow: 0 2px 8px rgba(255,215,0,0.3); }
        .detail-paragraph { margin: 25px 0; line-height: 1.9; font-size: 1.1em; text-align: justify; }
        .highlight { color: #e50914; font-weight: 600; }
        ul.feature-list { list-style: none; padding: 0; }
        ul.feature-list li { padding: 12px 0; padding-left: 30px; position: relative; }
        ul.feature-list li:before { content: "▶"; position: absolute; left: 0; color: #e50914; font-size: 0.8em; }
    </style>
    
    <!-- CSS and JS -->
    <script defer="defer" src="./static/js/main.3867268b.js"></script>
    <link href="./static/css/main.291b9921.css" rel="stylesheet">
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root">
        <article class="container">
            ${breadcrumbs}
            
            <header>
                <h1>${movieInfo.title || movieInfo.original_title} (${releaseYear}) - Watch Full Movie Online | Moviea.me</h1>
            </header>
            
            <div class="movie-header">
                ${imageUrlLarge ? `<img src="${imageUrlLarge}" alt="${movieInfo.title} poster - Watch online on Moviea.me" class="movie-poster" width="300" height="450" loading="eager"/>` : ''}
                <div class="movie-info">
                    <div class="movie-meta">
                        ${releaseYear ? `<span>📅 ${releaseYear}</span>` : ''}
                        ${runtime ? `<span>⏱️ ${runtime}</span>` : ''}
                        ${rating !== 'N/A' ? `<span class="rating">⭐ ${rating}/10</span>` : ''}
                        ${movieInfo.vote_count ? `<span>👥 ${movieInfo.vote_count.toLocaleString()} votes</span>` : ''}
                    </div>
                    ${genres ? `<div class="movie-meta"><span>🎭 ${genres}</span></div>` : ''}
                    ${optimizedDescription ? `<p class="overview">${optimizedDescription}</p>` : ''}
                </div>
            </div>
            
            ${trailerSection}
            
            ${detailedPlot}
            
            ${castCrewSection}
            
            ${productionDetails}
            
            <section class="content-section">
                <h2>Watch ${movieInfo.title || movieInfo.original_title} Online</h2>
                <p class="detail-paragraph">Experience <span class="highlight">${movieInfo.title || movieInfo.original_title}</span> in stunning HD quality exclusively on Moviea.me. Our platform offers seamless streaming with multiple quality options to match your internet speed. Whether you're watching on your phone, tablet, or smart TV, enjoy this ${releaseYear} ${genres ? genres.toLowerCase() : 'movie'} with crystal-clear picture and immersive audio.</p>
                <p class="detail-paragraph">Moviea.me provides the ultimate viewing experience with no buffering, instant playback, and a user-friendly interface. Join millions of movie enthusiasts who trust Moviea.me for their entertainment needs. Watch ${movieInfo.title || movieInfo.original_title} now and discover why we're the #1 choice for online movie streaming.</p>
            </section>
            
            ${relatedMovies}
            
            ${userReviews}
            
            <section class="content-section">
                <h2>Why Watch on Moviea.me?</h2>
                <ul class="feature-list">
                    <li>🎬 Extensive library with thousands of movies and TV shows</li>
                    <li>📱 Watch on any device - mobile, tablet, desktop, or smart TV</li>
                    <li>🌐 Multi-language support including English and Arabic</li>
                    <li>⚡ Lightning-fast streaming with adaptive quality</li>
                    <li>🔔 Get notified about new releases and trending content</li>
                    <li>💯 Regular updates with the latest movies and episodes</li>
                    <li>🎯 Personalized recommendations based on your preferences</li>
                </ul>
            </section>
        </article>
    </div>
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
// /all-about/tv/:id - TV Show SEO route with comprehensive 2000+ word content
router.get(/^\/all-about\/tv\/(\d+)$/, async (req, res, next) => {
    try {
        // Check if the request is from a search engine crawler
        const isBot = isSearchEngineCrawler(req);
        
        // If the request is from a real user, let the React app handle it
        if (!isBot) {
            return next(); // Pass control to the client-side React app
        }
        
        const tvId = req.params[0]; // Get TV ID from regex match
        // Detect user's country & language from request
        const userCountry = await detectCountryFromRequest(req);
        const userLanguage = detectLanguage(userCountry);
        
        const API_KEY = process.env.API_KEY || '20108f1c4ed38f7457c479849a9999cc';
        
        // Fetch TV show details with additional data for enhanced SEO
        const response = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${API_KEY}&append_to_response=videos,credits,keywords,similar,content_ratings,external_ids,production_companies,production_countries,reviews&language=${userLanguage}`);
        let tvInfo = await safeJsonParse(response);
        
        // If we have the TV info and its original language, we can fetch it again with that language
        if (tvInfo && tvInfo.original_language && tvInfo.original_language !== userLanguage) {
            try {
                const detailsInOriginalLang = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${API_KEY}&append_to_response=videos,credits,keywords,similar,content_ratings,external_ids,production_companies,production_countries,reviews&language=${tvInfo.original_language}`);
                const originalLangData = await safeJsonParse(detailsInOriginalLang);
                
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
        fs.readFile(path.join(__dirname, '..', 'build', 'index.html'), 'utf-8', (err, data) => {
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
            const contentUrl = `https://moviea.me/all-about/tv/${tvId}`;
            const optimizedTitle = generateTitle(tvInfo, 'tv', userLanguage);
            const optimizedDescription = tvInfo.overview || `${getTranslation('watch_now', userLanguage)} ${tvInfo.name || tvInfo.original_name} ${getTranslation('online', userLanguage)}`;
            const optimizedKeywords = generateKeywords(tvInfo, 'tv', userLanguage);
            
            // Generate enhanced structured data with comprehensive schemas
            const structuredData = generateEnhancedStructuredData(tvInfo, 'tv', imageUrlOriginal, contentUrl, userLanguage);
            
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
            
            // Extract additional info for display
            const genres = tvInfo.genres ? tvInfo.genres.map(g => g.name).join(', ') : '';
            const firstAirYear = tvInfo.first_air_date ? new Date(tvInfo.first_air_date).getFullYear() : '';
            const rating = tvInfo.vote_average ? tvInfo.vote_average.toFixed(1) : 'N/A';
            const numberOfSeasons = tvInfo.number_of_seasons || 0;
            const numberOfEpisodes = tvInfo.number_of_episodes || 0;
            
            // Generate comprehensive SEO content sections
            const breadcrumbs = generateBreadcrumbs(tvInfo, 'tv', contentUrl, userLanguage);
            const trailerSection = generateTrailerSection(tvInfo, 'tv', userLanguage);
            const detailedPlot = generateDetailedPlot(tvInfo, 'tv', userLanguage);
            const productionDetails = generateProductionDetails(tvInfo, 'tv', userLanguage);
            const castCrewSection = generateCastCrewSection(tvInfo, 'tv', userLanguage);
            const relatedMovies = generateRelatedMovies(tvInfo, 'tv', userLanguage);
            const userReviews = generateUserReviews(tvInfo, 'tv', userLanguage);
            
            // Create a complete SEO-optimized HTML document with semantic structure and 2000+ word content
            const seoHtml = `<!doctype html>
<html lang="${userLanguage}">
<head>
    <base href="/"/>
    <meta name="google-site-verification" content="gfLr6FcoTJz5djitWvSO041iz7i2PLCnaR6tRgpy_eI"/>
    <meta name="google-adsense-account" content="ca-pub-9662854573261832">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-78N5C676M5"></script>
    <script>function gtag(){dataLayer.push(arguments)}window.dataLayer=window.dataLayer||[],gtag("js",new Date),gtag("config","G-78N5C676M5")</script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9662854573261832" crossorigin="anonymous"></script>
    <script type="text/javascript" src="https://resources.infolinks.com/js/infolinks_main.js"></script>
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
    ${firstAirYear ? `<meta name="publish_date" content="${tvInfo.first_air_date}">` : ''}
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="googlebot" content="index, follow">
    
    <!-- Open Graph / Facebook / Social Sharing -->
    <meta property="og:type" content="video.tv_show"/>
    <meta property="og:title" content="${optimizedTitle}"/>
    <meta property="og:description" content="${optimizedDescription}"/>
    <meta property="og:image" content="${imageUrlLarge}"/>
    <meta property="og:image:width" content="1280"/>
    <meta property="og:image:height" content="720"/>
    <meta property="og:image:alt" content="${tvInfo.name || tvInfo.original_name} poster"/>
    <meta property="og:url" content="${contentUrl}"/>
    <meta property="og:site_name" content="Moviea.me"/>
    <meta property="og:locale" content="${userLanguage}_${userCountry || userLanguage.toUpperCase()}"/>
    ${tvInfo.number_of_seasons ? `<meta property="video:series" content="true"/>` : ''}
    ${tvInfo.number_of_seasons ? `<meta property="video:release_date" content="${tvInfo.first_air_date}"/>` : ''}
    ${tvCreators ? `<meta property="video:director" content="${tvCreators}">` : ''}
    ${tvCast ? `<meta property="video:actor" content="${tvCast}">` : ''}
    
    <!-- Twitter Card data -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${optimizedTitle}">
    <meta name="twitter:description" content="${optimizedDescription}">
    <meta name="twitter:image" content="${imageUrlLarge}">
    <meta name="twitter:image:alt" content="${tvInfo.name || tvInfo.original_name} poster">
    
    <!-- Article metadata -->
    <meta property="article:published_time" content="${tvInfo.first_air_date}"/>
    <meta property="article:modified_time" content="${new Date().toISOString()}"/>
    <meta property="article:section" content="TV Shows"/>
    ${genres ? `<meta property="article:tag" content="${genres}"/>` : ''}
    
    <!-- Enhanced Structured Data for SEO -->
    <script type="application/ld+json">${JSON.stringify(structuredData)}</script>
    
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
    
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; margin: 0; padding: 20px; background: #0a0a0a; color: #e0e0e0; line-height: 1.7; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { font-size: 2.8em; margin: 20px 0; color: #fff; font-weight: 700; line-height: 1.2; }
        h2 { font-size: 2em; margin: 40px 0 20px; color: #fff; border-bottom: 3px solid #e50914; padding-bottom: 12px; font-weight: 600; }
        h3 { font-size: 1.5em; margin: 30px 0 15px; color: #f0f0f0; font-weight: 600; }
        .breadcrumb { margin: 20px 0; color: #888; font-size: 0.9em; }
        .breadcrumb a { color: #e50914; text-decoration: none; }
        .breadcrumb a:hover { text-decoration: underline; }
        .tv-header { display: flex; gap: 40px; margin: 40px 0; flex-wrap: wrap; background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%); padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .tv-poster { width: 300px; height: 450px; object-fit: cover; border-radius: 12px; box-shadow: 0 8px 24px rgba(229,9,20,0.3); }
        .tv-info { flex: 1; min-width: 300px; }
        .tv-meta { display: flex; gap: 15px; margin: 20px 0; flex-wrap: wrap; }
        .tv-meta span { background: linear-gradient(135deg, #e50914 0%, #b20710 100%); padding: 8px 18px; border-radius: 20px; font-weight: 500; font-size: 0.95em; box-shadow: 0 4px 12px rgba(229,9,20,0.2); }
        .overview { line-height: 1.8; font-size: 1.15em; color: #d0d0d0; margin: 20px 0; }
        .content-section { margin: 50px 0; padding: 30px; background: #111; border-radius: 12px; border-left: 4px solid #e50914; }
        .content-section p { margin: 15px 0; line-height: 1.8; }
        .cast-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; margin: 20px 0; }
        .cast-member { text-align: center; background: #1a1a1a; padding: 15px; border-radius: 10px; transition: transform 0.3s; }
        .cast-member:hover { transform: translateY(-5px); box-shadow: 0 8px 24px rgba(229,9,20,0.3); }
        .cast-photo { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; border: 3px solid #e50914; }
        .cast-name { font-weight: 600; color: #fff; margin: 5px 0; }
        .cast-role { color: #999; font-size: 0.9em; }
        .production-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .production-item { background: #1a1a1a; padding: 20px; border-radius: 10px; }
        .production-label { color: #e50914; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; font-size: 0.85em; letter-spacing: 1px; }
        .production-value { color: #e0e0e0; font-size: 1.1em; }
        .trailer-container { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 12px; margin: 20px 0; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
        .trailer-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
        .related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 25px; margin: 20px 0; }
        .related-item { background: #1a1a1a; border-radius: 10px; overflow: hidden; transition: transform 0.3s; }
        .related-item:hover { transform: scale(1.05); box-shadow: 0 8px 24px rgba(229,9,20,0.4); }
        .related-poster { width: 100%; height: 300px; object-fit: cover; }
        .related-title { padding: 15px; font-weight: 600; color: #fff; text-align: center; }
        .rating { font-size: 1.8em; color: #ffd700; font-weight: bold; text-shadow: 0 2px 8px rgba(255,215,0,0.3); }
        .detail-paragraph { margin: 25px 0; line-height: 1.9; font-size: 1.1em; text-align: justify; }
        .highlight { color: #e50914; font-weight: 600; }
        ul.feature-list { list-style: none; padding: 0; }
        ul.feature-list li { padding: 12px 0; padding-left: 30px; position: relative; }
        ul.feature-list li:before { content: "▶"; position: absolute; left: 0; color: #e50914; font-size: 0.8em; }
    </style>
    
    <!-- CSS and JS -->
    <script defer="defer" src="./static/js/main.3867268b.js"></script>
    <link href="./static/css/main.291b9921.css" rel="stylesheet">
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root">
        <article class="container">
            ${breadcrumbs}
            
            <header>
                <h1>${tvInfo.name || tvInfo.original_name} (${firstAirYear}) - Watch Full Series Online | Moviea.me</h1>
            </header>
            
            <div class="tv-header">
                ${imageUrlLarge ? `<img src="${imageUrlLarge}" alt="${tvInfo.name} poster - Watch online on Moviea.me" class="tv-poster" width="300" height="450" loading="eager"/>` : ''}
                <div class="tv-info">
                    <div class="tv-meta">
                        ${firstAirYear ? `<span>📅 ${firstAirYear}</span>` : ''}
                        ${numberOfSeasons ? `<span>📺 ${numberOfSeasons} Seasons</span>` : ''}
                        ${numberOfEpisodes ? `<span>🎬 ${numberOfEpisodes} Episodes</span>` : ''}
                        ${rating !== 'N/A' ? `<span class="rating">⭐ ${rating}/10</span>` : ''}
                        ${tvInfo.vote_count ? `<span>👥 ${tvInfo.vote_count.toLocaleString()} votes</span>` : ''}
                    </div>
                    ${genres ? `<div class="tv-meta"><span>🎭 ${genres}</span></div>` : ''}
                    ${contentRating ? `<div class="tv-meta"><span>🔞 ${contentRating}</span></div>` : ''}
                    ${optimizedDescription ? `<p class="overview">${optimizedDescription}</p>` : ''}
                </div>
            </div>
            
            ${trailerSection}
            
            ${detailedPlot}
            
            ${castCrewSection}
            
            ${productionDetails}
            
            <section class="content-section">
                <h2>Watch ${tvInfo.name || tvInfo.original_name} Online</h2>
                <p class="detail-paragraph">Experience all ${numberOfSeasons} seasons of <span class="highlight">${tvInfo.name || tvInfo.original_name}</span> in stunning HD quality exclusively on Moviea.me. Stream all ${numberOfEpisodes} episodes with seamless playback and multiple quality options to match your internet speed. Whether you're watching on your phone, tablet, or smart TV, enjoy this ${firstAirYear} ${genres ? genres.toLowerCase() : 'series'} with crystal-clear picture and immersive audio.</p>
                <p class="detail-paragraph">Moviea.me provides the ultimate binge-watching experience with no buffering, instant episode transitions, and a user-friendly interface. Join millions of TV enthusiasts who trust Moviea.me for their entertainment needs. Watch ${tvInfo.name || tvInfo.original_name} now and discover why we're the #1 choice for online TV show streaming.</p>
            </section>
            
            ${relatedMovies}
            
            ${userReviews}
            
            <section class="content-section">
                <h2>Why Watch on Moviea.me?</h2>
                <ul class="feature-list">
                    <li>🎬 Extensive library with thousands of movies and TV shows</li>
                    <li>📱 Watch on any device - mobile, tablet, desktop, or smart TV</li>
                    <li>🌐 Multi-language support including English and Arabic</li>
                    <li>⚡ Lightning-fast streaming with adaptive quality</li>
                    <li>🔔 Get notified about new releases and trending content</li>
                    <li>💯 Regular updates with the latest movies and episodes</li>
                    <li>🎯 Personalized recommendations based on your preferences</li>
                    <li>📺 Seamless episode auto-play for binge-watching</li>
                </ul>
            </section>
        </article>
    </div>
</body>
</html>`;
            
            // Send the enhanced SEO-optimized HTML with proper cache headers (24 hours)
            res.setHeader('Cache-Control', 'public, max-age=86400, immutable'); // Cache for 24 hours
            res.setHeader('Vary', 'Accept-Language, Accept-Encoding');
            res.send(seoHtml);
        });
    } catch (error) {
        console.error('Error in TV show route middleware:', error);
        next(); // Continue to next middleware if there's an error
    }
});
// /search-page - Search results page with SEO enhancements
router.get('/search-page', async (req, res, next) => {
    try {
        // Get search query from query parameters
        const query = req.query.q;
        const page = req.query.page || 1;
        const API_KEY = process.env.API_KEY || '20108f1c4ed38f7457c479849a9999cc';
        const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
        
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
        const searchResults = await safeJsonParse(response);
        
        if (!searchResults || searchResults.success === false) {
            // If search fails, continue to client-side rendering
            return next();
        }
        
        // Get user's country & language
        const userCountry = await detectCountryFromRequest(req);
        const userLanguage = detectLanguage(userCountry);
        
        // Read the index.html file
        fs.readFile(path.join(__dirname, '..', 'build', 'index.html'), 'utf-8', (err, data) => {
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
            const optimizedTitle = `Search results for "${query}" - Moviea.me`;
            const optimizedDescription = `Find movies, TV shows, and people matching "${query}" - Page ${page} of search results on Moviea.me.`;
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
                },
                'potentialAction': {
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
                    'name': 'Moviea.me',
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
    <script type="text/javascript" src="https://resources.infolinks.com/js/infolinks_main.js"></script>
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
    <meta property="og:site_name" content="Moviea.me"/>
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

module.exports = router;





