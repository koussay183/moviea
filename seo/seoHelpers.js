/**
 * SEO Helpers for Moviea.tn
 * 
 * Utility functions for improving search engine optimization,
 * including title generation, meta tag creation, and structured data.
 */

/**
 * Generate SEO-friendly title based on content type and data
 * @param {Object} data - Content data (movie, TV show, etc.)
 * @param {string} type - Content type ('movie', 'tv', etc.)
 * @returns {string} SEO optimized title
 */
function generateTitle(data, type) {
    if (!data) return 'Moviea.tn - Watch Movies & TV Shows Online';
    
    let title = '';
    
    switch (type) {
        case 'movie':
            const year = data.release_date ? new Date(data.release_date).getFullYear() : '';
            title = `${data.title || data.original_title} (${year}) - Watch Online on Moviea.tn`;
            break;
        case 'tv':
            title = `${data.name || data.original_name} - Watch TV Series Online on Moviea.tn`;
            break;
        case 'season':
            title = `${data.name || data.original_name} Season ${data.season_number} - Watch Episodes Online`;
            break;
        case 'episode':
            title = `${data.name || data.original_name} S${data.season_number}E${data.episode_number} - ${data.episode_name}`;
            break;
        case 'person':
            title = `${data.name} - Movies & TV Shows on Moviea.tn`;
            break;
        default:
            title = 'Moviea.tn - Watch Movies & TV Shows Online';
    }
    
    return title;
}

/**
 * Generate SEO-friendly meta keywords based on content
 * @param {Object} data - Content data (movie, TV show, etc.)
 * @param {string} type - Content type ('movie', 'tv', etc.)
 * @returns {string} Comma-separated keywords
 */
function generateKeywords(data, type) {
    if (!data) return 'watch movies online, free movies, tv shows, streaming';
    
    const keywords = ['watch online', 'streaming', 'free', 'hd'];
    
    switch (type) {
        case 'movie':
            keywords.push('movie', 'film', 'watch movies online');
            if (data.title) keywords.push(data.title);
            if (data.original_title && data.original_title !== data.title) {
                keywords.push(data.original_title);
            }
            if (data.genres && data.genres.length > 0) {
                data.genres.forEach(genre => keywords.push(genre.name.toLowerCase()));
            }
            if (data.release_date) {
                const year = new Date(data.release_date).getFullYear();
                keywords.push(`${year} movie`, `movie ${year}`);
            }
            break;
        case 'tv':
            keywords.push('tv show', 'series', 'watch tv online');
            if (data.name) keywords.push(data.name);
            if (data.original_name && data.original_name !== data.name) {
                keywords.push(data.original_name);
            }
            if (data.genres && data.genres.length > 0) {
                data.genres.forEach(genre => keywords.push(genre.name.toLowerCase()));
            }
            if (data.first_air_date) {
                const year = new Date(data.first_air_date).getFullYear();
                keywords.push(`${year} tv show`, `series ${year}`);
            }
            break;
        case 'person':
            keywords.push('actor', 'actress', 'director', 'cast');
            if (data.name) keywords.push(data.name);
            if (data.known_for_department) {
                keywords.push(data.known_for_department.toLowerCase());
            }
            break;
    }
    
    // Deduplicate keywords
    return [...new Set(keywords)].join(', ');
}

/**
 * Generate structured data JSON-LD for SEO
 * @param {Object} data - Content data
 * @param {string} type - Content type
 * @param {string} url - Current page URL
 * @returns {Object} Structured data object
 */
function generateStructuredData(data, type, url) {
    if (!data) return null;
    
    switch (type) {
        case 'movie':
            return {
                '@context': 'https://schema.org',
                '@type': 'Movie',
                name: data.title || data.original_title,
                description: data.overview,
                image: data.poster_path ? 
                    `https://image.tmdb.org/t/p/w500${data.poster_path}` : 
                    undefined,
                datePublished: data.release_date,
                aggregateRating: data.vote_average ? {
                    '@type': 'AggregateRating',
                    ratingValue: data.vote_average,
                    bestRating: '10',
                    worstRating: '0',
                    ratingCount: data.vote_count
                } : undefined,
                director: data.director ? {
                    '@type': 'Person',
                    name: data.director
                } : undefined,
                duration: data.runtime ? `PT${data.runtime}M` : undefined,
                genre: data.genres ? data.genres.map(g => g.name) : undefined,
                url: url
            };
        case 'tv':
            return {
                '@context': 'https://schema.org',
                '@type': 'TVSeries',
                name: data.name || data.original_name,
                description: data.overview,
                image: data.poster_path ? 
                    `https://image.tmdb.org/t/p/w500${data.poster_path}` : 
                    undefined,
                datePublished: data.first_air_date,
                aggregateRating: data.vote_average ? {
                    '@type': 'AggregateRating',
                    ratingValue: data.vote_average,
                    bestRating: '10',
                    worstRating: '0',
                    ratingCount: data.vote_count
                } : undefined,
                numberOfSeasons: data.number_of_seasons,
                genre: data.genres ? data.genres.map(g => g.name) : undefined,
                url: url
            };
        default:
            return null;
    }
}

/**
 * Detect user country from request headers
 * @param {Object} req - Express request object
 * @returns {string} Country code or null
 */
function detectCountryFromRequest(req) {
    // Check for CF-IPCountry header (Cloudflare)
    if (req.headers['cf-ipcountry']) {
        return req.headers['cf-ipcountry'];
    }
    
    // Check for x-forwarded-for header
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        // Here you would implement IP geolocation logic
        // For now we return null as this is just a stub
    }
    
    return null;
}

/**
 * Determines appropriate language code based on country code
 * @param {string} countryCode - ISO country code (e.g., 'US', 'FR', etc.)
 * @returns {string} ISO language code (e.g., 'en-US', 'fr-FR', etc.)
 */
function detectLanguage(countryCode) {
    // Map of country codes to language codes
    const countryToLanguage = {
        // English-speaking countries
        'US': 'en-US',
        'GB': 'en-GB',
        'CA': 'en-CA',
        'AU': 'en-AU',
        'NZ': 'en-NZ',
        
        // French-speaking countries
        'FR': 'fr-FR',
        'BE': 'fr-BE',
        'CH': 'fr-CH',
        'CA-FR': 'fr-CA',
        
        // Spanish-speaking countries
        'ES': 'es-ES',
        'MX': 'es-MX',
        'AR': 'es-AR',
        'CO': 'es-CO',
        
        // German-speaking countries
        'DE': 'de-DE',
        'AT': 'de-AT',
        'CH-DE': 'de-CH',
        
        // Arabic-speaking countries
        'TN': 'ar-TN',
        'SA': 'ar-SA',
        'EG': 'ar-EG',
        'MA': 'ar-MA',
        'DZ': 'ar-DZ',
        
        // Other major languages
        'JP': 'ja-JP',
        'CN': 'zh-CN',
        'TW': 'zh-TW',
        'IT': 'it-IT',
        'RU': 'ru-RU',
        'KR': 'ko-KR',
        'PT': 'pt-PT',
        'BR': 'pt-BR'
    };
    
    // Return language code if found, otherwise default to English
    return countryToLanguage[countryCode] || 'en-US';
}

/**
 * Get translation for given key based on language
 * @param {string} key - Translation key
 * @param {string} language - Language code
 * @returns {string} Translated text
 */
function getTranslation(key, language = 'en-US') {
    // Implementation would go here, currently returns the key as fallback
    return key;
}

module.exports = {
    generateTitle,
    generateKeywords,
    generateStructuredData,
    detectCountryFromRequest,
    detectLanguage,
    getTranslation
};