const axios = require('axios');

/**
 * Translate text to Arabic using Google Translate API (free method)
 * This uses the unofficial Google Translate endpoint
 */
async function translateToArabic(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    try {
        // Use Google Translate's public endpoint
        const url = 'https://translate.googleapis.com/translate_a/single';
        const params = {
            client: 'gtx',
            sl: 'en',  // Source language: English
            tl: 'ar',  // Target language: Arabic
            dt: 't',   // Return translation
            q: text
        };
        
        const response = await axios.get(url, { params });
        
        // Parse the response - Google returns a nested array structure
        if (response.data && response.data[0] && response.data[0][0] && response.data[0][0][0]) {
            return response.data[0][0][0];
        }
        
        // If parsing fails, return original text
        console.warn('Translation parsing failed, returning original text');
        return text;
        
    } catch (error) {
        console.error('Translation error:', error.message);
        // Return original text if translation fails
        return text;
    }
}

/**
 * Translate multiple texts to Arabic in batch
 * More efficient for translating multiple strings at once
 */
async function translateBatchToArabic(texts) {
    if (!Array.isArray(texts)) {
        return texts;
    }
    
    const translations = await Promise.all(
        texts.map(text => translateToArabic(text))
    );
    
    return translations;
}

/**
 * Alternative: Manual translation dictionary for common movie-related terms
 * Fallback if Google Translate is unavailable
 */
const movieTermsDictionary = {
    'Action': 'أكشن',
    'Adventure': 'مغامرة',
    'Animation': 'رسوم متحركة',
    'Comedy': 'كوميديا',
    'Crime': 'جريمة',
    'Documentary': 'وثائقي',
    'Drama': 'دراما',
    'Family': 'عائلي',
    'Fantasy': 'خيال',
    'History': 'تاريخي',
    'Horror': 'رعب',
    'Music': 'موسيقى',
    'Mystery': 'غموض',
    'Romance': 'رومانسية',
    'Science Fiction': 'خيال علمي',
    'TV Movie': 'فيلم تلفزيوني',
    'Thriller': 'إثارة',
    'War': 'حرب',
    'Western': 'غربي',
    'Release Year': 'سنة الإصدار',
    'Rating': 'التقييم',
    'Genre': 'النوع',
    'Cast': 'البطولة',
    'Story': 'القصة',
    'Watch now': 'شاهد الآن'
};

/**
 * Translate common movie terms using dictionary
 */
function translateMovieTerms(text) {
    if (!text) return text;
    
    let translatedText = text;
    
    // Replace each term with its Arabic equivalent
    Object.keys(movieTermsDictionary).forEach(term => {
        const regex = new RegExp(term, 'gi');
        translatedText = translatedText.replace(regex, movieTermsDictionary[term]);
    });
    
    return translatedText;
}

module.exports = {
    translateToArabic,
    translateBatchToArabic,
    translateMovieTerms,
    movieTermsDictionary
};
