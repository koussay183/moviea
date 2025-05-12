/**
 * TMDB Data Fetcher
 * 
 * Provides functions to fetch movie and TV show data from TMDB API
 * Used for generating video sitemaps and other features
 */

/**
 * Fetches popular movies from TMDB API
 * @param {string} apiKey - TMDB API key
 * @param {number} totalPages - Number of pages to fetch (max 500 movies at 20 per page)
 * @returns {Array} Array of movie objects
 */
async function fetchPopularMovies(apiKey, totalPages = 25) {
    const fetch = (await import('node-fetch')).default;
    const movies = [];

    try {
        console.log(`Fetching ${totalPages} pages of popular movies...`);
        
        for (let page = 1; page <= totalPages; page++) {
            const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&page=${page}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch movies page ${page}: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            movies.push(...data.results);
            
            console.log(`Fetched page ${page}/${totalPages}, got ${data.results.length} movies`);
            
            // Get full movie details for each movie
            for (let i = 0; i < data.results.length; i++) {
                const movieId = data.results[i].id;
                const detailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=videos`;
                const detailsResponse = await fetch(detailsUrl);
                
                if (detailsResponse.ok) {
                    const detailsData = await detailsResponse.json();
                    // Replace the basic movie info with the detailed one
                    movies[movies.length - data.results.length + i] = detailsData;
                }
            }
        }
        
        console.log(`Successfully fetched ${movies.length} movies with details`);
        return movies;
    } catch (error) {
        console.error('Error fetching popular movies:', error);
        return [];
    }
}

/**
 * Fetches popular TV shows from TMDB API
 * @param {string} apiKey - TMDB API key
 * @param {number} totalPages - Number of pages to fetch
 * @returns {Array} Array of TV show objects
 */
async function fetchPopularTVShows(apiKey, totalPages = 15) {
    const fetch = (await import('node-fetch')).default;
    const tvShows = [];

    try {
        console.log(`Fetching ${totalPages} pages of popular TV shows...`);
        
        for (let page = 1; page <= totalPages; page++) {
            const url = `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&page=${page}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch TV shows page ${page}: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            tvShows.push(...data.results);
            
            console.log(`Fetched page ${page}/${totalPages}, got ${data.results.length} TV shows`);
            
            // Get full TV show details for each show
            for (let i = 0; i < data.results.length; i++) {
                const tvId = data.results[i].id;
                const detailsUrl = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${apiKey}&append_to_response=videos`;
                const detailsResponse = await fetch(detailsUrl);
                
                if (detailsResponse.ok) {
                    const detailsData = await detailsResponse.json();
                    // Replace the basic TV show info with the detailed one
                    tvShows[tvShows.length - data.results.length + i] = detailsData;
                }
            }
        }
        
        console.log(`Successfully fetched ${tvShows.length} TV shows with details`);
        return tvShows;
    } catch (error) {
        console.error('Error fetching popular TV shows:', error);
        return [];
    }
}

module.exports = {
    fetchPopularMovies,
    fetchPopularTVShows
};