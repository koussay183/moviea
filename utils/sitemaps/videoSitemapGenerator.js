/**
 * Video Sitemap Generator for Moviea.tn
 * Generates specialized XML video sitemaps with detailed metadata
 * Auto-pings search engines when new content is added
 * 
 * Following Google guidelines for video sitemap:
 * https://developers.google.com/search/docs/advanced/sitemaps/video-sitemaps
 */

const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

// Maximum URLs per sitemap file (Google's limit is 50,000)
const MAX_URLS_PER_SITEMAP = 40000;

/**
 * Generate video sitemap XML content
 * @param {Array} videos - Array of video objects with metadata
 * @returns {string} XML sitemap content
 */
function generateVideoSitemapXML(videos) {
    // XML header and namespaces
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n\n';
    
    // Add each video entry
    videos.forEach(video => {
        xml += '  <url>\n';
        xml += `    <loc>${video.pageUrl}</loc>\n`;
        xml += '    <video:video>\n';
        // Only include thumbnail_loc if a valid URL exists
        if (video.thumbnailUrl && video.thumbnailUrl !== 'undefined') {
            xml += `      <video:thumbnail_loc>${video.thumbnailUrl}</video:thumbnail_loc>\n`;
        }
        xml += `      <video:title>${escapeXml(video.title)}</video:title>\n`;
        xml += `      <video:description>${escapeXml(video.description)}</video:description>\n`;
        
        // Add content location (embed URL)
        if (video.contentLoc) {
            xml += `      <video:content_loc>${video.contentLoc}</video:content_loc>\n`;
        }
        
        // Add player location (embed URL if available)
        if (video.playerLoc) {
            xml += `      <video:player_loc>${video.playerLoc}</video:player_loc>\n`;
        }
        
        // Add duration in seconds
        if (video.duration) {
            xml += `      <video:duration>${video.duration}</video:duration>\n`;
        }
          // Add publication date only if it's valid
        if (video.publishDate) {
            // Check if already in ISO format with time components
            if (video.publishDate.includes('T')) {
                // Already has time components, ensure it uses +00:00 instead of Z
                const formattedDate = video.publishDate.replace('Z', '+00:00');
                xml += `      <video:publication_date>${formattedDate}</video:publication_date>\n`;
            } else {
                // Handle basic YYYY-MM-DD format
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (dateRegex.test(video.publishDate)) {
                    // Check for obviously invalid dates that might pass regex but be invalid
                    // (like 2023-99-99)
                    const parts = video.publishDate.split('-');
                    const year = parseInt(parts[0]);
                    const month = parseInt(parts[1]);
                    const day = parseInt(parts[2]);
                    
                    // Basic date validation (rough check for valid month/day ranges)
                    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                        // Format with explicit timezone (+00:00) for Google Search Console compliance
                        const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
                        const formattedDate = date.toISOString().replace('Z', '+00:00');
                        xml += `      <video:publication_date>${formattedDate}</video:publication_date>\n`;
                    }
                }
            }
        }
        
        // Add family friendly tag
        xml += `      <video:family_friendly>${video.familyFriendly ? 'yes' : 'no'}</video:family_friendly>\n`;
        
        // Add tags for categories/keywords
        if (video.tags && video.tags.length > 0) {
            video.tags.slice(0, 32).forEach(tag => { // Max 32 tags allowed
                xml += `      <video:tag>${escapeXml(tag)}</video:tag>\n`;
            });
        }
        
        // Add rating if available
        if (video.rating) {
            xml += `      <video:rating>${video.rating}</video:rating>\n`;
        }
        
        // Add view count if available
        if (video.viewCount) {
            xml += `      <video:view_count>${video.viewCount}</video:view_count>\n`;
        }
        
        xml += '    </video:video>\n';
        xml += '  </url>\n\n';
    });
    
    xml += '</urlset>';
    return xml;
}

/**
 * Escape XML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeXml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Create a sitemap index file that references all individual sitemaps
 * @param {Array} sitemapFiles - Array of sitemap filenames
 * @param {string} baseUrl - Base URL for the website
 * @returns {string} XML sitemap index content
 */
function generateSitemapIndex(sitemapFiles, baseUrl) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    sitemapFiles.forEach(file => {
        const lastMod = new Date().toISOString();
        xml += '  <sitemap>\n';
        xml += `    <loc>${baseUrl}/${file}</loc>\n`;
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
        xml += '  </sitemap>\n';
    });
    
    xml += '</sitemapindex>';
    return xml;
}

/**
 * Convert TMDB movie data to video sitemap format
 * @param {Object} movie - Movie data from TMDB
 * @param {string} baseUrl - Base URL for the website
 * @returns {Object} Video object for sitemap
 */
function movieToVideoEntry(movie, baseUrl) {
    // Format the duration in seconds
    const durationInSeconds = movie.runtime ? movie.runtime * 60 : undefined;
    
    // Format and validate publication date (release date)
    let publishDate;
    if (movie.release_date) {
        // Check if the date format is valid (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        
        if (dateRegex.test(movie.release_date)) {
            const releaseDate = new Date(movie.release_date);
            
            // Set a reasonable cutoff date for movies (e.g., not more than 6 months in future)
            const maxFutureDate = new Date();
            maxFutureDate.setMonth(maxFutureDate.getMonth() + 6);
              // Check if date is valid and not unreasonably in the future
            if (!isNaN(releaseDate.getTime()) && releaseDate <= maxFutureDate) {
                // Format as ISO 8601 with explicit timezone (+00:00) for Google compliance
                const utcDate = new Date(Date.UTC(
                    releaseDate.getFullYear(),
                    releaseDate.getMonth(),
                    releaseDate.getDate()
                ));
                publishDate = utcDate.toISOString().replace('Z', '+00:00');
            }
        }
    }
    
    // Prepare tags from genres
    const tags = movie.genres ? movie.genres.map(g => g.name) : [];
    
    // Add movie title as a tag
    if (movie.title) {
        tags.push(movie.title);
    }
    
    // Add year as a tag if available
    if (movie.release_date) {
        const year = new Date(movie.release_date).getFullYear();
        if (!isNaN(year)) {
            tags.push(year.toString());
        }
    }
    
    // Calculate family friendly based on adult flag
    const familyFriendly = !movie.adult;
    
    // Format the rating (out of 5 stars, from TMDB's 10-point scale)
    const rating = movie.vote_average ? (movie.vote_average / 2).toFixed(1) : undefined;
    
    return {
        pageUrl: `${baseUrl}/all-about/movie/${movie.id}`,
        title: movie.title || movie.original_title,
        description: movie.overview || `Watch ${movie.title || movie.original_title} online on Moviea.tn`,        
        thumbnailUrl: movie.backdrop_path ? 
            `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : 
            (movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : null),
        contentLoc: `https://vidsrc.to/embed/movie/${movie.id}`,
        playerLoc: `https://vidsrc.to/embed/movie/${movie.id}`,
        duration: durationInSeconds,
        publishDate: publishDate,
        familyFriendly: familyFriendly,
        tags: tags,
        rating: rating,
        viewCount: movie.popularity ? Math.round(movie.popularity * 100) : undefined
    };
}

/**
 * Convert TMDB TV show data to video sitemap format
 * @param {Object} tvShow - TV show data from TMDB
 * @param {string} baseUrl - Base URL for the website
 * @returns {Object} Video object for sitemap
 */
function tvShowToVideoEntry(tvShow, baseUrl) {    
    // Format and validate publication date (first air date)
    let publishDate;
    if (tvShow.first_air_date) {
        // Check if the date format is valid (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        
        if (dateRegex.test(tvShow.first_air_date)) {
            const firstAirDate = new Date(tvShow.first_air_date);
            
            // Set a reasonable cutoff date for TV shows (e.g., not more than 6 months in future)
            const maxFutureDate = new Date();
            maxFutureDate.setMonth(maxFutureDate.getMonth() + 6);
              // Check if date is valid and not unreasonably in the future
            if (!isNaN(firstAirDate.getTime()) && firstAirDate <= maxFutureDate) {
                // Format as ISO 8601 with explicit timezone (+00:00) for Google compliance
                const utcDate = new Date(Date.UTC(
                    firstAirDate.getFullYear(),
                    firstAirDate.getMonth(),
                    firstAirDate.getDate()
                ));
                publishDate = utcDate.toISOString().replace('Z', '+00:00');
            }
        }
    }
    
    // Prepare tags from genres
    const tags = tvShow.genres ? tvShow.genres.map(g => g.name) : [];
    
    // Add show title as a tag
    if (tvShow.name) {
        tags.push(tvShow.name);
    }
    
    // Add year as a tag if available
    if (tvShow.first_air_date) {
        const year = new Date(tvShow.first_air_date).getFullYear();
        if (!isNaN(year)) {
            tags.push(year.toString());
        }
    }
    
    // Calculate family friendly based on adult flag or content rating
    const familyFriendly = !tvShow.adult;
    
    // Format the rating (out of 5 stars, from TMDB's 10-point scale)
    const rating = tvShow.vote_average ? (tvShow.vote_average / 2).toFixed(1) : undefined;
    
    return {
        pageUrl: `${baseUrl}/all-about/tv/${tvShow.id}`,
        title: tvShow.name || tvShow.original_name,
        description: tvShow.overview || `Watch ${tvShow.name || tvShow.original_name} online on Moviea.tn`,        
        thumbnailUrl: tvShow.backdrop_path ? 
            `https://image.tmdb.org/t/p/w1280${tvShow.backdrop_path}` : 
            (tvShow.poster_path ? `https://image.tmdb.org/t/p/w780${tvShow.poster_path}` : null),
        contentLoc: `https://vidsrc.to/embed/tv/${tvShow.id}`,
        playerLoc: `https://vidsrc.to/embed/tv/${tvShow.id}`,
        // No fixed duration for TV shows
        publishDate: publishDate,
        familyFriendly: familyFriendly,
        tags: tags,
        rating: rating,
        viewCount: tvShow.popularity ? Math.round(tvShow.popularity * 100) : undefined
    };
}

/**
 * Ping search engines with the new sitemap URL
 * @param {string} sitemapUrl - Full URL to the sitemap
 * @returns {Promise<Array>} Results of ping attempts
 */
async function pingSiteMap(sitemapUrl) {
    const pingUrls = [
        `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    ];
    
    console.log(`Pinging search engines with sitemap: ${sitemapUrl}`);
    
    const pingResults = await Promise.allSettled(pingUrls.map(async (url) => {
        try {
            const response = await fetch(url);
            return {
                url: url,
                status: response.status,
                success: response.ok
            };
        } catch (error) {
            return {
                url: url,
                status: 0,
                success: false,
                error: error.message
            };
        }
    }));
    
    return pingResults;
}

/**
 * Generate and save video sitemaps for movies and TV shows
 * @param {Array} movies - Array of movie objects from TMDB
 * @param {Array} tvShows - Array of TV show objects from TMDB
 * @param {string} baseUrl - Base URL for the website
 * @param {string} outputDir - Directory to save the sitemaps
 * @returns {Promise<Object>} Results of sitemap generation and pinging
 */
async function generateAndSaveVideoSitemaps(movies, tvShows, baseUrl, outputDir) {
    try {
        // Ensure output directory exists
        try {
            await fs.mkdir(outputDir, { recursive: true });
        } catch (err) {
            if (err.code !== 'EEXIST') throw err;
        }
        
        // Convert movies and TV shows to video entries
        const movieEntries = movies.map(movie => movieToVideoEntry(movie, baseUrl));
        const tvShowEntries = tvShows.map(tvShow => tvShowToVideoEntry(tvShow, baseUrl));
        
        // Combine all video entries
        const allVideos = [...movieEntries, ...tvShowEntries];
        
        // Split into chunks to respect the URL limit per sitemap
        const videoChunks = [];
        for (let i = 0; i < allVideos.length; i += MAX_URLS_PER_SITEMAP) {
            videoChunks.push(allVideos.slice(i, i + MAX_URLS_PER_SITEMAP));
        }
        
        // Generate individual sitemaps
        const sitemapFiles = [];
        for (let i = 0; i < videoChunks.length; i++) {
            const filename = `video-sitemap${i > 0 ? `-${i}` : ''}.xml`;
            const xml = generateVideoSitemapXML(videoChunks[i]);
            
            await fs.writeFile(path.join(outputDir, filename), xml);
            sitemapFiles.push(filename);
            
            console.log(`Generated video sitemap: ${filename} with ${videoChunks[i].length} videos`);
        }
        
        // Generate sitemap index if we have multiple sitemaps
        if (sitemapFiles.length > 1) {
            const indexXml = generateSitemapIndex(sitemapFiles, baseUrl);
            await fs.writeFile(path.join(outputDir, 'video-sitemap-index.xml'), indexXml);
            console.log(`Generated video sitemap index with ${sitemapFiles.length} sitemaps`);
        }
        
        // Ping search engines with the sitemap URL
        let pingResults = [];
        if (sitemapFiles.length > 0) {
            // Use the index if we have multiple sitemaps, otherwise use the single sitemap
            const sitemapUrl = sitemapFiles.length > 1 
                ? `${baseUrl}/video-sitemap-index.xml` 
                : `${baseUrl}/${sitemapFiles[0]}`;
                
            pingResults = await pingSiteMap(sitemapUrl);
            
            console.log('Search engine ping results:');
            pingResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    console.log(`- ${result.value.url}: ${result.value.success ? 'Success' : 'Failed'} (${result.value.status})`);
                } else {
                    console.error(`- Ping failed: ${result.reason}`);
                }
            });
        }
        
        return {
            sitemapFiles,
            videosProcessed: allVideos.length,
            pingResults
        };
    } catch (error) {
        console.error('Error generating video sitemaps:', error);
        throw error;
    }
}

module.exports = {
    generateAndSaveVideoSitemaps,
    generateVideoSitemapXML,
    pingSiteMap,
    movieToVideoEntry,
    tvShowToVideoEntry
};
