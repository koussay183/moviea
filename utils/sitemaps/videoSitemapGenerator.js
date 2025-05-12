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
 * Check if a date is valid (i.e., not auto-corrected by JavaScript)
 * @param {number} year - Full year (e.g., 2025)
 * @param {number} month - Month (1-12)
 * @param {number} day - Day of month (1-31, depending on month)
 * @returns {boolean} Whether the date is valid
 */
function isValidDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

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
            try {
                let validDate = null;
                
                // Handle different date formats
                if (typeof video.publishDate === 'string') {
                    if (video.publishDate.includes('T')) {
                        // Handle ISO 8601 format (with time components)
                        const parsedDate = new Date(video.publishDate);
                        if (!isNaN(parsedDate.getTime())) {
                            validDate = parsedDate;
                        }
                    } else {
                        // Handle basic YYYY-MM-DD format
                        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                        if (dateRegex.test(video.publishDate)) {
                            const parts = video.publishDate.split('-');
                            const year = parseInt(parts[0]);
                            const month = parseInt(parts[1]); // Keep 1-indexed for validation
                            const day = parseInt(parts[2]);
                            
                            // Strict date validation using helper function
                            if (year >= 1900 && year <= 2100 && 
                                month >= 1 && month <= 12 && 
                                day >= 1 && day <= 31 && 
                                isValidDate(year, month, day)) {
                                // Convert to 0-indexed for JavaScript Date
                                validDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
                            } else {
                                console.warn(`Invalid date excluded: ${video.publishDate} - fails validation check`);
                            }
                        }
                    }
                } else if (video.publishDate instanceof Date && !isNaN(video.publishDate.getTime())) {
                    validDate = video.publishDate;
                }
                
                // If we have a valid date, format it properly
                if (validDate && !isNaN(validDate.getTime())) {
                    // Format the date as YYYY-MM-DDThh:mm:ss+00:00 (ISO 8601 with explicit timezone)
                    // Google requires explicit +00:00 format instead of Z notation
                    const year = validDate.getUTCFullYear();
                    const month = String(validDate.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(validDate.getUTCDate()).padStart(2, '0');
                    const hours = String(validDate.getUTCHours()).padStart(2, '0');
                    const minutes = String(validDate.getUTCMinutes()).padStart(2, '0');
                    const seconds = String(validDate.getUTCSeconds()).padStart(2, '0');
                    
                    // Create the formatted date and ensure it uses +00:00 instead of Z
                    let formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+00:00`;
                    formattedDate = formattedDate.replace(/Z$/, '+00:00'); // Force +00:00 and prevent Z
                    xml += `      <video:publication_date>${formattedDate}</video:publication_date>\n`;
                } else {
                    // Invalid date - log and skip
                    console.warn(`Invalid date excluded: ${video.publishDate} - fails date object creation`);
                }
            } catch (error) {
                // Skip adding publication_date if there's any error in date parsing/formatting
                console.warn(`Skipping invalid publication date: ${video.publishDate} - ${error.message}`);
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
        // Format current date with explicit timezone (+00:00) instead of Z notation
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        const seconds = String(now.getUTCSeconds()).padStart(2, '0');
        
        const lastMod = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+00:00`;
        
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
            const parts = movie.release_date.split('-');
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);
            
            // Validate date using helper function
            if (isValidDate(year, month, day)) {
                const releaseDate = new Date(Date.UTC(year, month - 1, day));
                
                // Set a reasonable cutoff date for movies (e.g., not more than 6 months in future)
                const maxFutureDate = new Date();
                maxFutureDate.setMonth(maxFutureDate.getMonth() + 6);
                
                // Check if date is valid and not unreasonably in the future
                if (!isNaN(releaseDate.getTime()) && releaseDate <= maxFutureDate) {
                    try {
                        // Format as ISO 8601 with explicit timezone (+00:00) for Google compliance
                        const year = releaseDate.getUTCFullYear();
                        const month = String(releaseDate.getUTCMonth() + 1).padStart(2, '0');
                        const day = String(releaseDate.getUTCDate()).padStart(2, '0');
                        const hours = '00';
                        const minutes = '00';
                        const seconds = '00';
                        
                        // Explicitly use +00:00 format (not Z) for Google Search Console compliance
                        publishDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+00:00`;
                    } catch (error) {
                        console.warn(`Failed to format movie date: ${movie.release_date}`, error);
                        // Don't set publishDate if formatting fails
                    }
                } else {
                    console.warn(`Movie date excluded - invalid or too far in future: ${movie.release_date}`);
                }
            } else {
                console.warn(`Movie date excluded - fails validation check: ${movie.release_date}`);
            }
        } else {
            console.warn(`Movie date excluded - invalid format: ${movie.release_date}`);
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
            const parts = tvShow.first_air_date.split('-');
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);
            
            // Validate date using helper function
            if (isValidDate(year, month, day)) {
                const firstAirDate = new Date(Date.UTC(year, month - 1, day));
                
                // Set a reasonable cutoff date for TV shows (e.g., not more than 6 months in future)
                const maxFutureDate = new Date();
                maxFutureDate.setMonth(maxFutureDate.getMonth() + 6);
                
                // Check if date is valid and not unreasonably in the future
                if (!isNaN(firstAirDate.getTime()) && firstAirDate <= maxFutureDate) {
                    try {
                        // Format as ISO 8601 with explicit timezone (+00:00) for Google compliance
                        const year = firstAirDate.getUTCFullYear();
                        const month = String(firstAirDate.getUTCMonth() + 1).padStart(2, '0');
                        const day = String(firstAirDate.getUTCDate()).padStart(2, '0');
                        const hours = '00';
                        const minutes = '00';
                        const seconds = '00';
                        
                        // Explicitly use +00:00 format (not Z) for Google Search Console compliance
                        publishDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+00:00`;
                    } catch (error) {
                        console.warn(`Failed to format TV show date: ${tvShow.first_air_date}`, error);
                        // Don't set publishDate if formatting fails
                    }
                } else {
                    console.warn(`TV show date excluded - invalid or too far in future: ${tvShow.first_air_date}`);
                }
            } else {
                console.warn(`TV show date excluded - fails validation check: ${tvShow.first_air_date}`);
            }
        } else {
            console.warn(`TV show date excluded - invalid format: ${tvShow.first_air_date}`);
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
