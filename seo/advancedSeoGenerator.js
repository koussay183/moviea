/**
 * Advanced SEO Content Generator for Movie Pages
 * Generates comprehensive content to achieve top rankings
 */

/**
 * Generate detailed plot sections (2000+ words for top ranking)
 */
function generateDetailedPlot(movieInfo, language = 'en') {
    const overview = movieInfo.overview || '';
    if (!overview) return '';
    
    // Split overview into chapters if long enough
    const sentences = overview.match(/[^.!?]+[.!?]+/g) || [overview];
    
    return `
        <section class="plot-detailed">
            <h2>Detailed Plot Summary</h2>
            <div class="plot-content">
                ${overview}
            </div>
            ${sentences.length > 3 ? `
            <div class="plot-analysis">
                <h3>Story Analysis</h3>
                <p>This ${movieInfo.runtime ? movieInfo.runtime + '-minute' : ''} ${movieInfo.genres ? movieInfo.genres.map(g => g.name).join('/') : 'film'} takes viewers on an immersive journey through its narrative. The plot development showcases exceptional storytelling with carefully crafted character arcs and thematic depth.</p>
            </div>
            ` : ''}
        </section>
    `;
}

/**
 * Generate production details section
 */
function generateProductionDetails(movieInfo, credits, language = 'en') {
    const releaseDate = movieInfo.release_date || movieInfo.first_air_date;
    const budget = movieInfo.budget;
    const revenue = movieInfo.revenue;
    const productionCompanies = movieInfo.production_companies || [];
    const productionCountries = movieInfo.production_countries || [];
    
    return `
        <section class="production-details">
            <h2>Production Information</h2>
            <div class="production-grid">
                ${releaseDate ? `<div class="detail-item"><strong>Release Date:</strong> ${new Date(releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>` : ''}
                ${budget && budget > 0 ? `<div class="detail-item"><strong>Budget:</strong> $${(budget / 1000000).toFixed(1)} million</div>` : ''}
                ${revenue && revenue > 0 ? `<div class="detail-item"><strong>Box Office:</strong> $${(revenue / 1000000).toFixed(1)} million</div>` : ''}
                ${movieInfo.runtime ? `<div class="detail-item"><strong>Runtime:</strong> ${movieInfo.runtime} minutes</div>` : ''}
                ${movieInfo.original_language ? `<div class="detail-item"><strong>Original Language:</strong> ${movieInfo.original_language.toUpperCase()}</div>` : ''}
                ${productionCompanies.length > 0 ? `<div class="detail-item"><strong>Production Companies:</strong> ${productionCompanies.map(c => c.name).join(', ')}</div>` : ''}
                ${productionCountries.length > 0 ? `<div class="detail-item"><strong>Filming Locations:</strong> ${productionCountries.map(c => c.name).join(', ')}</div>` : ''}
            </div>
        </section>
    `;
}

/**
 * Generate cast and crew section with detailed info
 */
function generateCastCrewSection(credits, language = 'en') {
    if (!credits) return '';
    
    const cast = credits.cast ? credits.cast.slice(0, 15) : [];
    const directors = credits.crew ? credits.crew.filter(p => p.job === 'Director') : [];
    const writers = credits.crew ? credits.crew.filter(p => p.job === 'Writer' || p.job === 'Screenplay') : [];
    const producers = credits.crew ? credits.crew.filter(p => p.job === 'Producer' || p.job === 'Executive Producer').slice(0, 5) : [];
    
    return `
        <section class="cast-crew-detailed">
            ${directors.length > 0 ? `
            <div class="crew-section">
                <h2>Director${directors.length > 1 ? 's' : ''}</h2>
                <div class="crew-list">
                    ${directors.map(d => `<div class="person-card"><strong>${d.name}</strong></div>`).join('')}
                </div>
            </div>
            ` : ''}
            
            ${cast.length > 0 ? `
            <div class="cast-section">
                <h2>Main Cast</h2>
                <div class="cast-grid">
                    ${cast.map(actor => `
                    <div class="cast-card">
                        ${actor.profile_path ? `<img src="https://image.tmdb.org/t/p/w185${actor.profile_path}" alt="${actor.name}" loading="lazy" width="185" height="278">` : ''}
                        <div class="cast-info">
                            <strong>${actor.name}</strong>
                            ${actor.character ? `<span class="character">as ${actor.character}</span>` : ''}
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            ${writers.length > 0 ? `
            <div class="crew-section">
                <h3>Writers</h3>
                <p>${writers.map(w => w.name).join(', ')}</p>
            </div>
            ` : ''}
            
            ${producers.length > 0 ? `
            <div class="crew-section">
                <h3>Producers</h3>
                <p>${producers.map(p => p.name).join(', ')}</p>
            </div>
            ` : ''}
        </section>
    `;
}

/**
 * Generate trailer section
 */
function generateTrailerSection(videos, movieTitle) {
    if (!videos || !videos.results || videos.results.length === 0) return '';
    
    const trailer = videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.results[0];
    if (!trailer) return '';
    
    return `
        <section class="trailer-section">
            <h2>${movieTitle} Official Trailer</h2>
            <div class="video-container">
                <iframe 
                    src="https://www.youtube.com/embed/${trailer.key}" 
                    title="${movieTitle} Official Trailer"
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowfullscreen
                    loading="lazy"
                    width="560"
                    height="315">
                </iframe>
            </div>
        </section>
    `;
}

/**
 * Generate related/similar movies section
 */
function generateRelatedMovies(similar, type = 'movie') {
    if (!similar || !similar.results || similar.results.length === 0) return '';
    
    const movies = similar.results.slice(0, 10);
    
    return `
        <section class="related-movies">
            <h2>Related ${type === 'movie' ? 'Movies' : 'TV Shows'} You Might Like</h2>
            <div class="related-grid">
                ${movies.map(movie => `
                <a href="/all-about/${type}/${movie.id}" class="related-card" title="${movie.title || movie.name}">
                    ${movie.poster_path ? `<img src="https://image.tmdb.org/t/p/w342${movie.poster_path}" alt="${movie.title || movie.name}" loading="lazy" width="342" height="513">` : ''}
                    <div class="related-info">
                        <strong>${movie.title || movie.name}</strong>
                        ${movie.vote_average ? `<span class="rating">⭐ ${movie.vote_average.toFixed(1)}</span>` : ''}
                    </div>
                </a>
                `).join('')}
            </div>
        </section>
    `;
}

/**
 * Generate breadcrumb navigation
 */
function generateBreadcrumbs(movieInfo, type = 'movie', movieId) {
    const title = movieInfo.title || movieInfo.name || movieInfo.original_title || movieInfo.original_name;
    const mainGenre = movieInfo.genres && movieInfo.genres.length > 0 ? movieInfo.genres[0].name.toLowerCase().replace(' ', '-') : type;
    
    return `
        <nav aria-label="Breadcrumb" class="breadcrumb">
            <ol itemscope itemtype="https://schema.org/BreadcrumbList">
                <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                    <a itemprop="item" href="/" title="Home"><span itemprop="name">Home</span></a>
                    <meta itemprop="position" content="1" />
                </li>
                <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                    <a itemprop="item" href="/${type === 'movie' ? 'all-movies' : 'discover'}" title="${type === 'movie' ? 'Movies' : 'TV Shows'}">
                        <span itemprop="name">${type === 'movie' ? 'Movies' : 'TV Shows'}</span>
                    </a>
                    <meta itemprop="position" content="2" />
                </li>
                ${movieInfo.genres && movieInfo.genres.length > 0 ? `
                <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                    <a itemprop="item" href="/discover?genre=${movieInfo.genres[0].id}" title="${movieInfo.genres[0].name} ${type === 'movie' ? 'Movies' : 'Shows'}">
                        <span itemprop="name">${movieInfo.genres[0].name}</span>
                    </a>
                    <meta itemprop="position" content="3" />
                </li>
                ` : ''}
                <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                    <span itemprop="name">${title}</span>
                    <meta itemprop="position" content="4" />
                </li>
            </ol>
        </nav>
    `;
}

/**
 * Generate enhanced structured data with multiple schemas
 */
function generateEnhancedStructuredData(movieInfo, type, imageUrl, contentUrl, videos, similar) {
    const title = movieInfo.title || movieInfo.name || movieInfo.original_title || movieInfo.original_name;
    const description = movieInfo.overview || `Watch ${title} online in HD quality.`;
    const releaseDate = movieInfo.release_date || movieInfo.first_air_date;
    const trailer = videos && videos.results && videos.results.length > 0 
        ? videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.results[0]
        : null;
    
    const schemas = {
        "@context": "https://schema.org",
        "@graph": []
    };
    
    // Main Movie/TVSeries schema
    const mainSchema = {
        "@type": type === 'movie' ? "Movie" : "TVSeries",
        "name": title,
        "description": description,
        "image": imageUrl,
        "url": contentUrl
    };
    
    if (releaseDate) mainSchema.datePublished = releaseDate;
    if (movieInfo.vote_average) {
        mainSchema.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": movieInfo.vote_average,
            "bestRating": "10",
            "worstRating": "0",
            "ratingCount": movieInfo.vote_count || 1
        };
    }
    if (movieInfo.runtime) mainSchema.duration = `PT${movieInfo.runtime}M`;
    if (movieInfo.genres) mainSchema.genre = movieInfo.genres.map(g => g.name);
    
    // Add cast
    if (movieInfo.credits && movieInfo.credits.cast) {
        mainSchema.actor = movieInfo.credits.cast.slice(0, 10).map(actor => ({
            "@type": "Person",
            "name": actor.name
        }));
    }
    
    // Add director
    if (movieInfo.credits && movieInfo.credits.crew) {
        const directors = movieInfo.credits.crew.filter(p => p.job === 'Director');
        if (directors.length > 0) {
            mainSchema.director = directors.map(d => ({
                "@type": "Person",
                "name": d.name
            }));
        }
    }
    
    // Add trailer
    if (trailer) {
        mainSchema.trailer = {
            "@type": "VideoObject",
            "name": `${title} Official Trailer`,
            "description": `Official trailer for ${title}`,
            "thumbnailUrl": `https://i.ytimg.com/vi/${trailer.key}/hqdefault.jpg`,
            "uploadDate": trailer.published_at || releaseDate,
            "contentUrl": `https://www.youtube.com/watch?v=${trailer.key}`,
            "embedUrl": `https://www.youtube.com/embed/${trailer.key}`
        };
    }
    
    schemas["@graph"].push(mainSchema);
    
    // Breadcrumb schema
    schemas["@graph"].push({
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://moviea.me/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": type === 'movie' ? "Movies" : "TV Shows",
                "item": `https://moviea.me/${type === 'movie' ? 'all-movies' : 'discover'}`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": title,
                "item": contentUrl
            }
        ]
    });
    
    // WebPage schema
    schemas["@graph"].push({
        "@type": "WebPage",
        "name": `${title} - Watch Online on Moviea.me`,
        "description": description,
        "url": contentUrl,
        "primaryImageOfPage": imageUrl,
        "lastReviewed": new Date().toISOString().split('T')[0],
        "reviewedBy": {
            "@type": "Organization",
            "name": "Moviea.me"
        }
    });
    
    return JSON.stringify(schemas, null, 2);
}

module.exports = {
    generateDetailedPlot,
    generateProductionDetails,
    generateCastCrewSection,
    generateTrailerSection,
    generateRelatedMovies,
    generateBreadcrumbs,
    generateEnhancedStructuredData
};
