// SEO and bot-detection routes: /tn/movie/:id, /tn/tv/:id, /all-about/movie/:id, /all-about/tv/:id, /search-page
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const { isSearchEngineCrawler, detectCountryFromRequest, detectLanguage, safeJsonParse } = require('../utils/helpers');
const { generateTitle, generateKeywords, generateStructuredData, getTranslation } = require('../seo/seoHelpers');

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
            const contentUrl = `https://moviea.tn/tn/movie/${movieId}`;
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
    <meta property="og:type" content="video.movie"/>
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
// /all-about/movie/:id - Movie SEO route
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
        
        // Attempt to fetch additional movie details like credits for enhanced SEO
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=videos,credits,similar&language=${userLanguage}`);
        let movieInfo = await safeJsonParse(response);
        
        // If we have the movie info and its original language, we can fetch it again with that language
        if (movieInfo && movieInfo.original_language && movieInfo.original_language !== userLanguage) {
            try {
                const detailsInOriginalLang = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=videos,credits,similar&language=${movieInfo.original_language}`);
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
// /all-about/tv/:id - TV Show SEO route
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
        const response = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${API_KEY}&append_to_response=videos,credits,keywords,similar,content_ratings,external_ids&language=${userLanguage}`);
        let tvInfo = await safeJsonParse(response);
        
        // If we have the TV info and its original language, we can fetch it again with that language
        if (tvInfo && tvInfo.original_language && tvInfo.original_language !== userLanguage) {
            try {
                const detailsInOriginalLang = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${API_KEY}&append_to_response=videos,credits,keywords,similar,content_ratings,external_ids&language=${tvInfo.original_language}`);
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

module.exports = router;
