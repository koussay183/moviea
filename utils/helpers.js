// Utility functions for the application

// Function to safely parse JSON from fetch responses
async function safeJsonParse(response) {
    try {
        if (!response) return { error: 'No response received', status: 500 };
        
        if (typeof response.json !== 'function') {
            return { error: 'Invalid response type', status: 500 };
        }
        
        // Check if the response was not OK (status outside 200-299 range)
        if (!response.ok) {
            return { 
                error: `API Error: ${response.status} ${response.statusText}`, 
                status: response.status,
                upstream: true
            };
        }
        
        return await response.json();
    } catch (e) {
        return { 
            error: `Failed to parse JSON: ${e.message}`, 
            status: 502,
            upstream: true
        };
    }
}

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

// Function to detect country from request headers
async function detectCountryFromRequest(req) {
    // Try to get country from Cloudflare headers first
    if (req.headers['cf-ipcountry']) {
        return req.headers['cf-ipcountry'].toLowerCase();
    }
    
    // Then try X-Forwarded-For header chain
    const forwardedIps = req.headers['x-forwarded-for'];
    if (forwardedIps) {
        // If we had a way to do IP geolocation, we would use it here
        // For now, default to empty as we can't directly determine country from IP
    }
    
    // Fallback to empty - would need a proper IP geolocation service
    return '';
}

// Function to detect language based on country code
function detectLanguage(countryCode) {
    if (!countryCode) return 'en'; // Default to English
    
    // Map countries to languages - expand as needed
    const arabicCountries = ['eg', 'sa', 'ae', 'kw', 'bh', 'om', 'qa', 'jo', 'lb', 'sy', 'iq', 'ye', 'sd', 'tn', 'dz', 'ma', 'ly'];
    
    if (arabicCountries.includes(countryCode.toLowerCase())) {
        return 'ar';
    }
    
    // Add other language mappings here
    // For example: const frenchCountries = ['fr', 'be', 'ca', ...];
    
    return 'en'; // Default to English
}

module.exports = {
    safeJsonParse,
    isSearchEngineCrawler,
    detectCountryFromRequest,
    detectLanguage
};
