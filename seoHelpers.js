/**
 * SEO Helper functions for Moviea.tn
 * Contains utilities for location detection, translation, and SEO optimization
 * Enhanced with more comprehensive language support and advanced structured data
 */

const iso3166CountryCodes = {
    'US': 'United States',
    'TN': 'Tunisia',
    'DZ': 'Algeria',
    'EG': 'Egypt',
    'MA': 'Morocco',
    'SA': 'Saudi Arabia',
    'FR': 'France',
    'GB': 'United Kingdom',
    'DE': 'Germany',
    'AE': 'United Arab Emirates',
    'KW': 'Kuwait',
    'QA': 'Qatar',
    'BH': 'Bahrain',
    'OM': 'Oman',
    'JO': 'Jordan',
    'PS': 'Palestine',
    'LB': 'Lebanon',
    'SY': 'Syria',
    'IQ': 'Iraq',
    'LY': 'Libya',
    'SD': 'Sudan',
    'CA': 'Canada',
    'AU': 'Australia',
    // More comprehensive country list
};

// Enhanced language mapping for more countries
const countryToLanguage = {
    // Arabic-speaking countries
    'TN': 'ar', 
    'DZ': 'ar',
    'EG': 'ar',
    'MA': 'ar',
    'SA': 'ar',
    'AE': 'ar',
    'KW': 'ar',
    'QA': 'ar',
    'BH': 'ar',
    'OM': 'ar',
    'JO': 'ar',
    'PS': 'ar',
    'LB': 'ar',
    'SY': 'ar',
    'IQ': 'ar',
    'LY': 'ar',
    'SD': 'ar',
    
    // English-speaking countries
    'US': 'en',
    'GB': 'en',
    'CA': 'en', // Default for Canada (could be fr for Quebec)
    'AU': 'en',
    'NZ': 'en',
    
    // French-speaking countries
    'FR': 'fr',
    'BE': 'fr', // Belgium (could be nl/de in some regions)
    'CH': 'fr', // Switzerland (could be de/it in some regions)
    'MC': 'fr', // Monaco
    
    // German-speaking countries
    'DE': 'de',
    'AT': 'de', // Austria
    'LI': 'de', // Liechtenstein
    
    // Default to English for unmapped countries
    'DEFAULT': 'en'
};

// Enhanced translations for improved SEO
const translations = {
    'en': {
        'watch_free': 'Watch Free',
        'online': 'Online',
        'high_quality': 'High Quality',
        'full_movie': 'Full Movie',
        'full_episodes': 'Full Episodes',
        'stream': 'Stream',
        'download': 'Download',
        'watch_now': 'Watch Now',
        'free': 'Free',
        // Added translations
        'trending': 'Trending',
        'popular': 'Popular',
        'latest': 'Latest',
        'cast': 'Cast',
        'director': 'Director',
        'season': 'Season',
        'episode': 'Episode',
        'release_year': 'Release Year',
        'genres': 'Genres',
        'similar_movies': 'Similar Movies',
        'similar_shows': 'Similar Shows',
        'on_moviea': 'on Moviea',
        'arabic': 'Arabic',
        'subtitle': 'with subtitles',
        'related': 'Related',
        'hd': 'HD',
        '4k': '4K',
        'trailer': 'Trailer',
        'reviews': 'Reviews',
        'rating': 'Rating',
        'minutes': 'minutes',
        'movies_like': 'Movies like',
        'shows_like': 'Shows like'
    },
    'ar': {
        'watch_free': 'شاهد مجانا',
        'online': 'أونلاين',
        'high_quality': 'جودة عالية',
        'full_movie': 'فيلم كامل',
        'full_episodes': 'حلقات كاملة',
        'stream': 'بث مباشر',
        'download': 'تحميل',
        'watch_now': 'شاهد الآن',
        'free': 'مجاني',
        // Added translations
        'trending': 'الأكثر رواجا',
        'popular': 'الأكثر شعبية',
        'latest': 'أحدث',
        'cast': 'طاقم التمثيل',
        'director': 'المخرج',
        'season': 'موسم',
        'episode': 'حلقة',
        'release_year': 'سنة الإصدار',
        'genres': 'الأنواع',
        'similar_movies': 'أفلام مشابهة',
        'similar_shows': 'مسلسلات مشابهة',
        'on_moviea': 'على موفيا',
        'arabic': 'عربي',
        'subtitle': 'مترجم',
        'related': 'ذات صلة',
        'hd': 'دقة عالية',
        '4k': '4K',
        'trailer': 'إعلان',
        'reviews': 'المراجعات',
        'rating': 'التقييم',
        'minutes': 'دقائق',
        'movies_like': 'أفلام مثل',
        'shows_like': 'مسلسلات مثل'
    },
    'fr': {
        'watch_free': 'Regarder Gratuitement',
        'online': 'En Ligne',
        'high_quality': 'Haute Qualité',
        'full_movie': 'Film Complet',
        'full_episodes': 'Épisodes Complets',
        'stream': 'Diffuser',
        'download': 'Télécharger',
        'watch_now': 'Regarder Maintenant',
        'free': 'Gratuit',
        // Added translations
        'trending': 'Tendance',
        'popular': 'Populaire',
        'latest': 'Dernier',
        'cast': 'Distribution',
        'director': 'Réalisateur',
        'season': 'Saison',
        'episode': 'Épisode',
        'release_year': 'Année de sortie',
        'genres': 'Genres',
        'similar_movies': 'Films similaires',
        'similar_shows': 'Séries similaires',
        'on_moviea': 'sur Moviea',
        'arabic': 'arabe',
        'subtitle': 'avec sous-titres',
        'related': 'Connexe',
        'hd': 'HD',
        '4k': '4K',
        'trailer': 'Bande-annonce',
        'reviews': 'Critiques',
        'rating': 'Évaluation',
        'minutes': 'minutes',
        'movies_like': 'Films comme',
        'shows_like': 'Séries comme'
    },
    'de': {
        'watch_free': 'Kostenlos Ansehen',
        'online': 'Online',
        'high_quality': 'Hohe Qualität',
        'full_movie': 'Ganzer Film',
        'full_episodes': 'Komplette Folgen',
        'stream': 'Streamen',
        'download': 'Herunterladen',
        'watch_now': 'Jetzt Ansehen',
        'free': 'Kostenlos',
        'trending': 'Im Trend',
        'popular': 'Beliebt',
        'latest': 'Neueste',
        'cast': 'Besetzung',
        'director': 'Regisseur',
        'season': 'Staffel',
        'episode': 'Folge',
        'release_year': 'Erscheinungsjahr',
        'genres': 'Genres',
        'similar_movies': 'Ähnliche Filme',
        'similar_shows': 'Ähnliche Serien',
        'on_moviea': 'auf Moviea',
        'arabic': 'arabisch',
        'subtitle': 'mit Untertiteln',
        'related': 'Verwandt',
        'hd': 'HD',
        '4k': '4K',
        'trailer': 'Trailer',
        'reviews': 'Bewertungen',
        'rating': 'Bewertung',
        'minutes': 'Minuten',
        'movies_like': 'Filme wie',
        'shows_like': 'Serien wie'
    }
};

/**
 * Detect language based on country from IP
 * @param {string} countryCode - ISO country code (from request headers or IP)
 * @returns {string} Language code (en, ar, fr, etc.)
 */
function detectLanguage(countryCode) {
    if (!countryCode) return 'en';
    return countryToLanguage[countryCode] || countryToLanguage.DEFAULT;
}

/**
 * Get translated term
 * @param {string} term - Term to translate
 * @param {string} language - Language code
 * @returns {string} Translated term
 */
function getTranslation(term, language) {
    if (!language || !translations[language]) {
        language = 'en';
    }
    
    return translations[language][term] || translations['en'][term] || term;
}

/**
 * Generate SEO keywords based on content type and language
 * @param {object} content - Content object (movie/show details)
 * @param {string} contentType - Type of content (movie, tv, arabic)
 * @param {string} language - Language code
 * @returns {string} SEO optimized keywords
 */
function generateKeywords(content, contentType, language) {
    const baseKeywords = [];
    
    // Add translated common keywords
    baseKeywords.push(getTranslation('watch_free', language));
    baseKeywords.push(getTranslation('high_quality', language));
    baseKeywords.push(getTranslation('online', language));
    
    if (contentType === 'movie') {
        const title = content.title || content.original_title || '';
        const year = content.release_date ? new Date(content.release_date).getFullYear() : '';
        const genres = content.genres ? content.genres.map(g => g.name).join(', ') : '';
        
        baseKeywords.push(title);
        if (year) baseKeywords.push(year.toString());
        if (genres) baseKeywords.push(genres);
        baseKeywords.push(getTranslation('full_movie', language));
        
        // Add cast if available
        if (content.credits && content.credits.cast) {
            const actors = content.credits.cast.slice(0, 3).map(a => a.name).join(', ');
            if (actors) baseKeywords.push(actors);
        }
    } 
    else if (contentType === 'tv') {
        const title = content.name || '';
        const year = content.first_air_date ? new Date(content.first_air_date).getFullYear() : '';
        const genres = content.genres ? content.genres.map(g => g.name).join(', ') : '';
        
        baseKeywords.push(title);
        if (year) baseKeywords.push(year.toString());
        if (genres) baseKeywords.push(genres);
        baseKeywords.push(getTranslation('full_episodes', language));
    } 
    else if (contentType === 'arabic') {
        const title = content.name_ar || content.name_en || '';
        const categories = content.categoryDTOs ? content.categoryDTOs.map(c => c.name_ar || c.name_en).join(', ') : '';
        
        baseKeywords.push(title);
        if (categories) baseKeywords.push(categories);
        
        // Arabic-specific keywords
        if (language === 'ar') {
            baseKeywords.push('مسلسلات عربية');
            baseKeywords.push('أفلام عربية');
            baseKeywords.push('دراما عربية');
            baseKeywords.push('بث مباشر');
        }
    }
    
    // Add universal keywords
    baseKeywords.push('moviea');
    baseKeywords.push('moviea.tn');
    baseKeywords.push(getTranslation('stream', language));
    baseKeywords.push(getTranslation('download', language));
    
    return baseKeywords.filter(k => k).join(', ');
}

/**
 * Generate an optimized title based on content and language
 * @param {object} content - Content object
 * @param {string} contentType - Type of content
 * @param {string} language - Language code
 * @returns {string} SEO optimized title
 */
function generateTitle(content, contentType, language) {
    let title = '';
    
    if (contentType === 'movie') {
        title = content.title || content.original_title || '';
        const year = content.release_date ? ` (${new Date(content.release_date).getFullYear()})` : '';
        title = `${title}${year} | ${getTranslation('watch_free', language)} - Moviea.tn`;
    } 
    else if (contentType === 'tv') {
        title = content.name || '';
        const year = content.first_air_date ? ` (${new Date(content.first_air_date).getFullYear()})` : '';
        title = `${title}${year} | ${getTranslation('watch_free', language)} - Moviea.tn`;
    } 
    else if (contentType === 'arabic') {
        title = content.name_ar || content.name_en || '';
        title = `${title} | ${getTranslation('watch_free', language)} - Moviea.tn`;
    }
    
    return title;
}

/**
 * Generate structured data for content
 * @param {object} content - Content object
 * @param {string} contentType - Type of content
 * @param {string} imageUrl - URL to image
 * @param {string} contentUrl - URL to content page
 * @param {string} language - Language code
 * @returns {string} JSON-LD structured data
 */
function generateStructuredData(content, contentType, imageUrl, contentUrl, language) {
    let structData = {};
    
    // Extract base image URL and path for different image sizes
    let baseImageUrl, imagePath;
    if (imageUrl && imageUrl.includes('tmdb.org/t/p/')) {
        [baseImageUrl, imagePath] = imageUrl.split('/t/p/');
        baseImageUrl = baseImageUrl + '/t/p';
        imagePath = imagePath.split('/').slice(1).join('/');
    }
    
    // Common organization data for movies/tv shows
    const organizationData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Moviea.tn",
        "url": "https://moviea.tn",
        "logo": {
            "@type": "ImageObject",
            "url": "https://moviea.tn/logo192.png",
            "width": "192",
            "height": "192"
        },
        "sameAs": [
            "https://www.facebook.com/movieatn",
            "https://twitter.com/movieatn",
            "https://www.instagram.com/movieatn/"
        ]
    };
    
    // Common website data
    const websiteData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "url": "https://moviea.tn",
        "name": "Moviea.tn",
        "description": "Watch movies and TV shows online for free in HD quality",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://moviea.tn/search?query={search_term_string}"
            },
            "query-input": "required name=search_term_string"
        }
    };
    
    if (contentType === 'movie') {
        // Enhanced movie structured data
        structData = {
            "@context": "https://schema.org",
            "@type": "Movie",
            "name": content.title || content.original_title,
            "alternateName": content.original_title !== content.title ? content.original_title : undefined,
            "description": content.overview || `${getTranslation('watch_now', language)} ${content.title || content.original_title} ${getTranslation('online', language)} ${getTranslation('on_moviea', language)}`,
            "image": [
                imageUrl,
                // Additional image sizes for structured data
                baseImageUrl && imagePath ? `${baseImageUrl}/w500/${imagePath}` : undefined,
                content.poster_path ? `https://image.tmdb.org/t/p/w500${content.poster_path}` : undefined
            ].filter(Boolean), // Remove undefined values
            "url": contentUrl,
            "contentUrl": contentUrl,
            "inLanguage": content.original_language,
            "potentialAction": {
                "@type": "WatchAction",
                "target": contentUrl
            },
            "productionCompany": content.production_companies?.map(company => ({
                "@type": "Organization",
                "name": company.name,
                "url": company.homepage || undefined
            })) || undefined
        };
        
        // Add release date if available
        if (content.release_date) {
            structData.datePublished = content.release_date;
        }
        
        // Add rating if available
        if (content.vote_average && content.vote_count) {
            structData.aggregateRating = {
                "@type": "AggregateRating",
                "ratingValue": content.vote_average.toString(),
                "reviewCount": content.vote_count.toString(),
                "bestRating": "10",
                "worstRating": "0"
            };
        }
        
        // Add genre if available
        if (content.genres && content.genres.length > 0) {
            structData.genre = content.genres.map(g => g.name);
        }
        
        // Add duration if available
        if (content.runtime) {
            structData.duration = `PT${content.runtime}M`;
        }
        
        // Add content rating if available
        if (content.adult !== undefined) {
            structData.contentRating = content.adult ? 'Adult' : 'General';
        }
        
        // Add trailer if available
        if (content.videos && content.videos.results && content.videos.results.length > 0) {
            const trailer = content.videos.results.find(video => 
                (video.type === 'Trailer' || video.type === 'Teaser') && video.site === 'YouTube'
            );
            
            if (trailer) {
                structData.trailer = {
                    "@type": "VideoObject",
                    "name": `${content.title || content.original_title} ${getTranslation('trailer', language)}`,
                    "description": trailer.name,
                    "thumbnailUrl": `https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`,
                    "uploadDate": trailer.published_at || content.release_date,
                    "embedUrl": `https://www.youtube.com/embed/${trailer.key}`,
                    "contentUrl": `https://www.youtube.com/watch?v=${trailer.key}`
                };
            }
        }
        
        // Add cast and crew if available
        if (content.credits) {
            // Add actors
            if (content.credits.cast && content.credits.cast.length > 0) {
                structData.actor = content.credits.cast.slice(0, 10).map(actor => ({
                    "@type": "Person",
                    "name": actor.name,
                    "url": actor.profile_path ? 
                        `https://moviea.tn/person/${actor.id}` : undefined,
                    "image": actor.profile_path ? 
                        `https://image.tmdb.org/t/p/w300${actor.profile_path}` : undefined
                }));
            }
            
            // Add director
            if (content.credits.crew) {
                const directors = content.credits.crew.filter(person => person.job === 'Director');
                if (directors.length > 0) {
                    structData.director = directors.map(director => ({
                        "@type": "Person",
                        "name": director.name,
                        "url": director.profile_path ? 
                            `https://moviea.tn/person/${director.id}` : undefined,
                        "image": director.profile_path ? 
                            `https://image.tmdb.org/t/p/w300${director.profile_path}` : undefined
                    }));
                }
            }
        }

        // Add keywords from combined data
        if (content.keywords && content.keywords.keywords) {
            structData.keywords = content.keywords.keywords.map(k => k.name).join(',');
        }        // Add VideoObject schema with chapters if runtime is available
        if (content.runtime && content.id) {
            const videoObject = {
                "@type": "VideoObject",
                "name": content.title || content.original_title,
                "description": content.overview || `${getTranslation('watch_now', language)} ${content.title || content.original_title} ${getTranslation('online', language)}`,
                "thumbnailUrl": content.backdrop_path ? 
                    `https://image.tmdb.org/t/p/w1280${content.backdrop_path}` : 
                    (content.poster_path ? `https://image.tmdb.org/t/p/w780${content.poster_path}` : undefined),
                "uploadDate": content.release_date,
                "contentUrl": contentUrl,
                "embedUrl": `https://vidsrc.to/embed/movie/${content.id}`,
                "duration": `PT${content.runtime}M`,
                "accessMode": "visual",
                "accessibilityFeature": ["captions", "subtitles"],
                "inLanguage": content.original_language,
                "datePublished": content.release_date,
                "copyrightHolder": {
                    "@type": "Organization",
                    "name": content.production_companies?.[0]?.name || "Content Copyright Holder"
                },
                // Add genre information if available for better classification
                "genre": content.genres?.map(g => g.name) || undefined,
                // Generate dynamic chapters based on movie runtime and screenplay structure
                "hasPart": generateMovieChapters(content.runtime, content.title || content.original_title, language),
                // Add a potentialAction for watching the video
                "potentialAction": {
                    "@type": "WatchAction",
                    "target": contentUrl
                }
            };
            
            // Add actor and director references from the main movie schema
            if (structData.actor) {
                videoObject.actor = structData.actor;
            }
            
            if (structData.director) {
                videoObject.director = structData.director;
            }
            
            structData.subjectOf = videoObject;
        }
    } 
    else if (contentType === 'tv') {
        // Enhanced TV Series structured data
        structData = {
            "@context": "https://schema.org",
            "@type": "TVSeries",
            "name": content.name || content.original_name,
            "alternateName": content.original_name !== content.name ? content.original_name : undefined,
            "description": content.overview || `${getTranslation('watch_now', language)} ${content.name || content.original_name} ${getTranslation('online', language)} ${getTranslation('on_moviea', language)}`,
            "image": [
                imageUrl,
                // Additional image sizes for structured data
                baseImageUrl && imagePath ? `${baseImageUrl}/w500/${imagePath}` : undefined,
                content.poster_path ? `https://image.tmdb.org/t/p/w500${content.poster_path}` : undefined
            ].filter(Boolean), // Remove undefined values
            "url": contentUrl,
            "contentUrl": contentUrl,
            "inLanguage": content.original_language,
            "potentialAction": {
                "@type": "WatchAction",
                "target": contentUrl
            }
        };
        
        // Add first air date if available
        if (content.first_air_date) {
            structData.datePublished = content.first_air_date;
        }
        
        // Add rating if available
        if (content.vote_average && content.vote_count) {
            structData.aggregateRating = {
                "@type": "AggregateRating",
                "ratingValue": content.vote_average.toString(),
                "reviewCount": content.vote_count.toString(),
                "bestRating": "10",
                "worstRating": "0"
            };
        }
        
        // Add production companies if available
        if (content.networks && content.networks.length > 0) {
            structData.productionCompany = content.networks.map(network => ({
                "@type": "Organization",
                "name": network.name,
                "url": network.homepage || undefined,
                "logo": network.logo_path ? {
                    "@type": "ImageObject",
                    "url": `https://image.tmdb.org/t/p/w300${network.logo_path}`
                } : undefined
            }));
        }
        
        // Add number of seasons/episodes if available
        if (content.number_of_seasons) {
            structData.numberOfSeasons = content.number_of_seasons.toString();
        }
        
        if (content.number_of_episodes) {
            structData.numberOfEpisodes = content.number_of_episodes.toString();
        }
        
        // Add genre if available
        if (content.genres && content.genres.length > 0) {
            structData.genre = content.genres.map(g => g.name);
        }
        
        // Add content rating if available
        if (content.adult !== undefined) {
            structData.contentRating = content.adult ? 'Adult' : 'General';
        }
        
        // Add trailer if available
        if (content.videos && content.videos.results && content.videos.results.length > 0) {
            const trailer = content.videos.results.find(video => 
                (video.type === 'Trailer' || video.type === 'Teaser') && video.site === 'YouTube'
            );
            
            if (trailer) {
                structData.trailer = {
                    "@type": "VideoObject",
                    "name": `${content.name || content.original_name} ${getTranslation('trailer', language)}`,
                    "description": trailer.name,
                    "thumbnailUrl": `https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`,
                    "uploadDate": trailer.published_at || content.first_air_date,
                    "embedUrl": `https://www.youtube.com/embed/${trailer.key}`,
                    "contentUrl": `https://www.youtube.com/watch?v=${trailer.key}`
                };
            }
        }
        
        // Add cast and crew if available
        if (content.credits) {
            // Add actors
            if (content.credits.cast && content.credits.cast.length > 0) {
                structData.actor = content.credits.cast.slice(0, 10).map(actor => ({
                    "@type": "Person",
                    "name": actor.name,
                    "url": actor.profile_path ? 
                        `https://moviea.tn/person/${actor.id}` : undefined,
                    "image": actor.profile_path ? 
                        `https://image.tmdb.org/t/p/w300${actor.profile_path}` : undefined
                }));
            }
            
            // Add creator/directors
            if (content.created_by && content.created_by.length > 0) {
                structData.director = content.created_by.map(creator => ({
                    "@type": "Person",
                    "name": creator.name,
                    "url": creator.profile_path ? 
                        `https://moviea.tn/person/${creator.id}` : undefined,
                    "image": creator.profile_path ? 
                        `https://image.tmdb.org/t/p/w300${creator.profile_path}` : undefined
                }));
            }
        }
        
        // Add keywords from combined data
        if (content.keywords && content.keywords.results) {
            structData.keywords = content.keywords.results.map(k => k.name).join(',');
        }

        // Add VideoObject schema for TV show if there's season information
        if (content.id && content.seasons && content.seasons.length > 0) {
            // Create a VideoObject for each season
            structData.containsSeason = content.seasons.map(season => {
                const seasonNumber = season.season_number;
                const episodeCount = season.episode_count || 0;
                
                return {
                    "@type": "TVSeason",
                    "seasonNumber": seasonNumber.toString(),
                    "name": `${content.name || content.original_name} - ${season.name}`,
                    "numberOfEpisodes": episodeCount.toString(),
                    "datePublished": season.air_date || content.first_air_date,
                    "image": season.poster_path ? 
                        `https://image.tmdb.org/t/p/w500${season.poster_path}` : undefined
                };
            });
        }
    }
    else if (contentType === 'person') {
        // Person structured data
        structData = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": content.name,
            "image": [
                imageUrl,
                // Additional image sizes for structured data
                baseImageUrl && imagePath ? `${baseImageUrl}/w500/${imagePath}` : undefined
            ].filter(Boolean), // Remove undefined values
            "url": contentUrl,
            "description": content.biography || `${content.name} ${getTranslation('filmography', language)} ${getTranslation('on_moviea', language)}`,
            "birthDate": content.birthday || undefined,
            "deathDate": content.deathday || undefined,
            "gender": content.gender === 1 ? "Female" : (content.gender === 2 ? "Male" : undefined),
            "birthPlace": content.place_of_birth || undefined
        };
        
        // Add known for movies/shows if available
        if (content.known_for && content.known_for.length > 0) {
            structData.performerIn = content.known_for.map(work => {
                const workType = work.media_type === 'movie' ? 'Movie' : 'TVSeries';
                const name = work.media_type === 'movie' ? (work.title || work.original_title) : (work.name || work.original_name);
                
                return {
                    "@type": workType,
                    "name": name,
                    "url": `https://moviea.tn/all-about/${work.media_type}/${work.id}`
                };
            });
        }
    }
    
    return JSON.stringify([structData, organizationData, websiteData]);
}

/**
 * Generate dynamic movie chapters based on movie runtime
 * Follows standard screenplay structure for scene division
 * Used for Rich VideoObject + Chapter Schema (JSON-LD)
 * 
 * @param {number} runtime - Movie runtime in minutes
 * @param {string} title - Movie title
 * @param {string} language - Language code
 * @returns {Array} Array of chapter objects with startOffset and endOffset in seconds
 */
function generateMovieChapters(runtime, title, language) {
    // If runtime is not available, return empty array
    if (!runtime || typeof runtime !== 'number') {
        return [];
    }
    
    // Convert runtime from minutes to seconds
    const totalSeconds = runtime * 60;
    
    // Define standard chapter names based on screenplay structure
    const defaultChapters = [
        { name: 'Opening Scene', percentStart: 0, percentEnd: 0.05 },
        { name: 'Introduction', percentStart: 0.05, percentEnd: 0.1 },
        { name: 'Inciting Incident', percentStart: 0.1, percentEnd: 0.17 },
        { name: 'First Plot Point', percentStart: 0.17, percentEnd: 0.27 },
        { name: 'First Pinch Point', percentStart: 0.27, percentEnd: 0.375 },
        { name: 'Midpoint', percentStart: 0.375, percentEnd: 0.5 },
        { name: 'Second Pinch Point', percentStart: 0.5, percentEnd: 0.625 },
        { name: 'Crisis', percentStart: 0.625, percentEnd: 0.75 },
        { name: 'Climax', percentStart: 0.75, percentEnd: 0.9 },
        { name: 'Resolution', percentStart: 0.9, percentEnd: 1.0 }
    ];
    
    // Chapter translations for different languages
    const chapterTranslations = {
        'ar': {
            'Opening Scene': 'المشهد الافتتاحي',
            'Introduction': 'المقدمة',
            'Inciting Incident': 'الحدث المحفز',
            'First Plot Point': 'نقطة الحبكة الأولى',
            'First Pinch Point': 'نقطة الضغط الأولى',
            'Midpoint': 'منتصف الفيلم',
            'Second Pinch Point': 'نقطة الضغط الثانية',
            'Crisis': 'الأزمة',
            'Climax': 'الذروة',
            'Resolution': 'الحل'
        },
        'fr': {
            'Opening Scene': 'Scène d\'ouverture',
            'Introduction': 'Introduction',
            'Inciting Incident': 'Incident déclencheur',
            'First Plot Point': 'Premier point d\'intrigue',
            'First Pinch Point': 'Premier point de pression',
            'Midpoint': 'Point central',
            'Second Pinch Point': 'Second point de pression',
            'Crisis': 'Crise',
            'Climax': 'Apogée',
            'Resolution': 'Résolution'
        },
        'de': {
            'Opening Scene': 'Eröffnungsszene',
            'Introduction': 'Einführung',
            'Inciting Incident': 'Auslösendes Ereignis',
            'First Plot Point': 'Erster Handlungspunkt',
            'First Pinch Point': 'Erster Druckpunkt',
            'Midpoint': 'Mittelpunkt',
            'Second Pinch Point': 'Zweiter Druckpunkt',
            'Crisis': 'Krise',
            'Climax': 'Höhepunkt',
            'Resolution': 'Auflösung'
        }
    };
    
    // Get translated chapter names or fallback to English
    const getChapterName = (name) => {
        if (!language || !chapterTranslations[language]) {
            return name;
        }
        return chapterTranslations[language][name] || name;
    };
    
    // Calculate chapters with actual timestamps
    return defaultChapters.map(chapter => {
        const startOffset = Math.round(totalSeconds * chapter.percentStart);
        const endOffset = Math.round(totalSeconds * chapter.percentEnd);
        
        return {            "@type": "Clip",
            "name": `${title} - ${getChapterName(chapter.name)}`,
            "startOffset": startOffset,
            "endOffset": endOffset,
            // Additional properties for better SEO visibility
            "timeRequired": `PT${Math.floor((endOffset - startOffset) / 60)}M${(endOffset - startOffset) % 60}S`
        };
    });
}

/**
 * Detect country from request headers or IP address using external APIs
 * @param {object} req - Express request object
 * @returns {Promise<string>} Country code or null
 */
async function detectCountryFromRequest(req) {
    // Try to get country from CloudFlare header first (fastest method)
    const cfCountry = req.headers['cf-ipcountry'];
    if (cfCountry) {
        return cfCountry;
    }
    
    try {
        // Try to extract IP address from various headers or connection info
        let ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                        req.headers['x-real-ip'] || 
                        req.connection?.remoteAddress;
                        
        // Clean up IP address if it includes IPv6 prefix
        if (ipAddress && ipAddress.includes('::ffff:')) {
            ipAddress = ipAddress.split('::ffff:')[1];
        }
        
        // Check if it's a valid public IP
        const isLocalIP = !ipAddress || 
                          ipAddress === '127.0.0.1' || 
                          ipAddress === 'localhost' ||
                          ipAddress.startsWith('192.168.') || 
                          ipAddress.startsWith('10.') || 
                          ipAddress.startsWith('172.16.');
        
        // If we can't determine the IP or it's a local IP, get IP from ipify
        if (isLocalIP) {
            try {
                // Create a fetch request with timeout
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000); // 3 second timeout
                
                const ipifyResponse = await fetch('https://api.ipify.org?format=json', {
                    signal: controller.signal
                });
                
                clearTimeout(timeout);
                
                if (ipifyResponse.ok) {
                    const ipifyData = await ipifyResponse.json();
                    ipAddress = ipifyData.ip;
                }
            } catch (ipifyError) {
                // If timeout or network error, just continue with what we have
                console.error('Error fetching IP from ipify:', ipifyError.name === 'AbortError' ? 'Request timeout' : ipifyError.message);
            }
        }
        
        // Use ip-api.com to get geolocation data from the IP
        if (ipAddress && !isLocalIP) {
            try {
                // Create a fetch request with timeout
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000); // 3 second timeout
                
                const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,message,countryCode,country`, {
                    signal: controller.signal
                });
                
                clearTimeout(timeout);
                
                if (geoResponse.ok) {
                    const geoData = await geoResponse.json();
                    
                    // Check if the response is successful and has country code
                    if (geoData && geoData.status === 'success' && geoData.countryCode) {
                        // Cache this result if possible
                        return geoData.countryCode;
                    }
                }
            } catch (geoError) {
                // If timeout or network error, just log and continue
                console.error('Error fetching geolocation data:', geoError.name === 'AbortError' ? 'Request timeout' : geoError.message);
            }
        }
    } catch (error) {
        console.error('Error detecting country from request:', error);
    }
    
    // Default to null if all methods fail - server will use English
    return null;
}

module.exports = {
    detectLanguage,
    getTranslation,
    generateKeywords,
    generateTitle,
    generateStructuredData,
    generateMovieChapters,
    detectCountryFromRequest
};
