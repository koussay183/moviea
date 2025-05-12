# Moviea.tn Server Structure Documentation

This document outlines the structure of the Moviea.tn server codebase, explaining the purpose of each directory and key file.

## Directory Structure

### Root Directory
- `index.js`: The main application entry point
- `server.js`: Server configuration and setup
- `requests.js`: API request URLs and configurations
- `package.json`: Node.js dependencies and scripts
- `vercel.json`: Vercel deployment configuration
- `web.config`: IIS configuration for Windows hosting

### Controllers
- `controllers/sitemapController.js`: Handles routes and logic for generating and serving sitemaps

### Workers
- `workers/tmdbDataFetcher.js`: Worker script for fetching data from TMDB API
- `workers/movieWorker.js`: Worker thread for scraping movie streaming sources
- `workers/tvShowWorker.js`: Worker thread for scraping TV show streaming sources

### SEO
- `seo/seoHelpers.js`: Utilities for SEO optimization including title generation, meta tags, and structured data

### Utils
- `utils/sitemaps/videoSitemapGenerator.js`: Generator for video sitemaps following Google guidelines

### Public
- `public/sitemaps/`: Directory for storing generated sitemap files
- `public/sitemaps/video-sitemap.xml`: Generated video sitemap for improved search indexing

### Build
- `build/`: Contains the compiled frontend React application
- `build/static/`: Static assets for the frontend
- `build/static/css/`: Compiled CSS files
- `build/static/js/`: Compiled JavaScript files
- `build/static/media/`: Media assets

## Key Features

### Video Sitemap Generation
The server generates video sitemaps that follow Google guidelines to improve search indexing for the streaming content. The implementation:

1. Fetches movie and TV show data from TMDB API
2. Validates and formats dates properly
3. Generates XML sitemaps with proper video tags
4. Pings search engines when updated

### Worker Thread System
Background tasks like scraping run in worker threads to avoid blocking the main thread. These workers:

1. Process movie and TV show searches
2. Extract streaming sources
3. Handle scraping with error handling and retries

### SEO Optimization
The server includes comprehensive SEO helpers for:

1. Generating optimized page titles
2. Creating meta descriptions and keywords
3. Implementing structured data (JSON-LD)
4. Country detection for localization
