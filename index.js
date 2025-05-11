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
    try {
        const movieId = req.params[0]; // Get movie ID from regex match
        
        // Fetch movie details similar to the logic in /movie/:id route
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=videos`);
        const movieInfo = await response.json();
        
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
            
            // SEO enhancements - prepare metadata
            const title = `${movieInfo.title || movieInfo.original_title} | Watch on Moviea.tn`;
            const fullTitle = `${movieInfo.title || movieInfo.original_title} - Watch Free on Moviea Now`;
            const description = movieInfo.overview || 'Watch this movie on Moviea now';
            const imageUrl = movieInfo.backdrop_path ? 
                `https://image.tmdb.org/t/p/original/${movieInfo.backdrop_path}` : 
                (movieInfo.poster_path ? `https://image.tmdb.org/t/p/original/${movieInfo.poster_path}` : '');
                
            // Generate release year and genre keywords for SEO
            const releaseYear = movieInfo.release_date ? new Date(movieInfo.release_date).getFullYear() : '';
            const genres = movieInfo.genres ? movieInfo.genres.map(g => g.name).join(', ') : '';
            const keywords = `${movieInfo.title}, ${genres}, ${releaseYear}, watch online, free movie, moviea.tn, stream, download, full movie, high quality`;
            
            // Create a complete SEO-optimized HTML document
            const seoHtml = `<!doctype html>
<html lang="en">
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
    
    <!-- SEO Meta Tags -->
    <title>${fullTitle}</title>
    <meta name="description" content="${description}"/>
    <meta name="keywords" content="${keywords}">
    
    <!-- Open Graph / Facebook / Social Sharing -->
    <meta property="og:type" content="video.movie"/>
    <meta property="og:title" content="${title}"/>
    <meta property="og:description" content="${description}"/>
    <meta property="og:image" content="${imageUrl}"/>
    <meta property="og:url" content="https://moviea.tn/all-about/movie/${movieId}"/>
    <meta property="og:site_name" content="Moviea.tn"/>
    
    <!-- Twitter Card data -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">
    
    <!-- Structured Data for SEO -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Movie",
      "name": "${movieInfo.title || movieInfo.original_title}",
      "description": "${description}",
      "image": "${imageUrl}",
      ${releaseYear ? `"datePublished": "${movieInfo.release_date}",` : ''}
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "${movieInfo.vote_average || 0}",
        "reviewCount": "${movieInfo.vote_count || 0}"
      }
    }
    </script>
    
    <link rel="canonical" href="https://moviea.tn/all-about/movie/${movieId}"/>
    <link rel="apple-touch-icon" href="./logo192.png"/>
    <link rel="manifest" href="./manifest.json"/>
    
    <!-- Inspectlet Tracking -->
    <script type="text/javascript">!function(){window.__insp=window.__insp||[],__insp.push(["wid",489353811]);setTimeout((function(){if(void 0===window.__inspld){window.__inspld=1;var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.id="inspsync",t.src=("https:"==document.location.protocol?"https":"http")+"://cdn.inspectlet.com/inspectlet.js?wid=489353811&r="+Math.floor((new Date).getTime()/36e5);var e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(t,e)}}),0)}()</script>
    
    <script defer="defer" src="./static/js/main.3867268b.js"></script>
    <link href="./static/css/main.291b9921.css" rel="stylesheet">
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
</body>
</html>`;
            
            // Send the SEO-optimized HTML
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
        
        // Fetch TV details
        const response = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${API_KEY}&append_to_response=videos`);
        const tvInfo = await response.json();
        
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
            
            // SEO enhancements - prepare metadata
            const title = `${tvInfo.name} | Watch on Moviea.tn`;
            const fullTitle = `${tvInfo.name} - Watch Free on Moviea Now`;
            const description = tvInfo.overview || 'Watch this TV show on Moviea now';
            const imageUrl = tvInfo.backdrop_path ? 
                `https://image.tmdb.org/t/p/original/${tvInfo.backdrop_path}` : 
                (tvInfo.poster_path ? `https://image.tmdb.org/t/p/original/${tvInfo.poster_path}` : '');
                
            // Generate first air date and genre keywords for SEO
            const firstAirYear = tvInfo.first_air_date ? new Date(tvInfo.first_air_date).getFullYear() : '';
            const genres = tvInfo.genres ? tvInfo.genres.map(g => g.name).join(', ') : '';
            const keywords = `${tvInfo.name}, ${genres}, ${firstAirYear}, watch online, free TV show, moviea.tn, stream, download, full episodes, series, high quality`;
            
            // Create a complete SEO-optimized HTML document
            const seoHtml = `<!doctype html>
<html lang="en">
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
    
    <!-- SEO Meta Tags -->
    <title>${fullTitle}</title>
    <meta name="description" content="${description}"/>
    <meta name="keywords" content="${keywords}">
    
    <!-- Open Graph / Facebook / Social Sharing -->
    <meta property="og:type" content="video.tv_show"/>
    <meta property="og:title" content="${title}"/>
    <meta property="og:description" content="${description}"/>
    <meta property="og:image" content="${imageUrl}"/>
    <meta property="og:url" content="https://moviea.tn/all-about/tv/${tvId}"/>
    <meta property="og:site_name" content="Moviea.tn"/>
    
    <!-- Twitter Card data -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">
    
    <!-- Structured Data for SEO -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "TVSeries",
      "name": "${tvInfo.name}",
      "description": "${description}",
      "image": "${imageUrl}",
      ${firstAirYear ? `"datePublished": "${tvInfo.first_air_date}",` : ''}
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "${tvInfo.vote_average || 0}",
        "reviewCount": "${tvInfo.vote_count || 0}"
      }
    }
    </script>
    
    <link rel="canonical" href="https://moviea.tn/all-about/tv/${tvId}"/>
    <link rel="apple-touch-icon" href="./logo192.png"/>
    <link rel="manifest" href="./manifest.json"/>
    
    <!-- Inspectlet Tracking -->
    <script type="text/javascript">!function(){window.__insp=window.__insp||[],__insp.push(["wid",489353811]);setTimeout((function(){if(void 0===window.__inspld){window.__inspld=1;var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.id="inspsync",t.src=("https:"==document.location.protocol?"https":"http")+"://cdn.inspectlet.com/inspectlet.js?wid=489353811&r="+Math.floor((new Date).getTime()/36e5);var e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(t,e)}}),0)}()</script>
    
    <script defer="defer" src="./static/js/main.3867268b.js"></script>
    <link href="./static/css/main.291b9921.css" rel="stylesheet">
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
</body>
</html>`;
            
            // Send the SEO-optimized HTML
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
            
            // SEO enhancements - prepare metadata
            const title = `${tvInfo.name_ar || tvInfo.name_en} | Watch on Moviea.tn`;
            const fullTitle = `${tvInfo.name_ar || tvInfo.name_en} - Watch Free on Moviea Now`;
            const description = tvInfo.description_ar || tvInfo.description_en || 'Watch this Arabic TV show on Moviea now';
            const imageUrl = tvInfo.previewImageUrl || '';
            
            // Generate keywords for SEO
            const year = tvInfo.publishDate ? new Date(tvInfo.publishDate).getFullYear() : '';
            const categories = tvInfo.categoryDTOs ? tvInfo.categoryDTOs.map(c => c.name_ar || c.name_en).join(', ') : '';
            const keywords = `${tvInfo.name_ar || tvInfo.name_en}, ${categories}, ${year}, مسلسلات عربية, عربي, مشاهدة مجانية, أفلام عربية, مسلسلات, دراما عربية, moviea.tn, stream, download, full episodes, arabic series, high quality`;
            
            // Create a complete SEO-optimized HTML document
            const seoHtml = `<!doctype html>
<html lang="ar">
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
    
    <!-- SEO Meta Tags -->
    <title>${fullTitle}</title>
    <meta name="description" content="${description}"/>
    <meta name="keywords" content="${keywords}">
    
    <!-- Open Graph / Facebook / Social Sharing -->
    <meta property="og:type" content="video.tv_show"/>
    <meta property="og:title" content="${title}"/>
    <meta property="og:description" content="${description}"/>
    <meta property="og:image" content="${imageUrl}"/>
    <meta property="og:url" content="https://moviea.tn/tn/tv/${tvId}"/>
    <meta property="og:site_name" content="Moviea.tn"/>
    
    <!-- Twitter Card data -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">
    
    <!-- Structured Data for SEO -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "TVSeries",
      "name": "${tvInfo.name_ar || tvInfo.name_en}",
      "description": "${description}",
      "image": "${imageUrl}",
      ${year ? `"datePublished": "${tvInfo.publishDate}",` : ''}
      "inLanguage": "ar"
    }
    </script>
    
    <link rel="canonical" href="https://moviea.tn/tn/tv/${tvId}"/>
    <link rel="apple-touch-icon" href="./logo192.png"/>
    <link rel="manifest" href="./manifest.json"/>
    
    <!-- Inspectlet Tracking -->
    <script type="text/javascript">!function(){window.__insp=window.__insp||[],__insp.push(["wid",489353811]);setTimeout((function(){if(void 0===window.__inspld){window.__inspld=1;var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.id="inspsync",t.src=("https:"==document.location.protocol?"https":"http")+"://cdn.inspectlet.com/inspectlet.js?wid=489353811&r="+Math.floor((new Date).getTime()/36e5);var e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(t,e)}}),0)}()</script>
    
    <script defer="defer" src="./static/js/main.3867268b.js"></script>
    <link href="./static/css/main.291b9921.css" rel="stylesheet">
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
</body>
</html>`;
            
            // Send the SEO-optimized HTML
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
const movieWorkerPool = new WorkerPool(2, './movieWorker.js');
const tvShowWorkerPool = new WorkerPool(2, './tvShowWorker.js');

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

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

const server = app.listen(port, () => console.log(`Server running on port ${port}`));