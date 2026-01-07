// Quick test of the advanced SEO generator functions
const {
    generateDetailedPlot,
    generateProductionDetails,
    generateCastCrewSection,
    generateTrailerSection,
    generateRelatedMovies,
    generateBreadcrumbs,
    generateEnhancedStructuredData,
    generateUserReviews
} = require('./seo/advancedSeoGenerator');

// Mock movie data
const mockMovie = {
    title: "Fight Club",
    overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression.",
    runtime: 139,
    genres: [{ id: 18, name: "Drama" }, { id: 53, name: "Thriller" }],
    budget: 63000000,
    revenue: 100853753,
    release_date: "1999-10-15",
    original_language: "en",
    production_companies: [{ name: "Fox 2000 Pictures" }, { name: "Regency Enterprises" }],
    production_countries: [{ name: "United States of America" }],
    credits: {
        cast: [
            { name: "Brad Pitt", character: "Tyler Durden", profile_path: "/path.jpg" },
            { name: "Edward Norton", character: "The Narrator", profile_path: "/path2.jpg" }
        ],
        crew: [
            { name: "David Fincher", job: "Director" }
        ]
    },
    videos: {
        results: [
            { key: "BdJKm16Co6M", type: "Trailer", site: "YouTube" }
        ]
    },
    similar: {
        results: [
            { id: 550, title: "Similar Movie", poster_path: "/poster.jpg", vote_average: 8.5 }
        ]
    },
    reviews: {
        results: [
            {
                author: "John Doe",
                author_details: { rating: 9 },
                content: "Amazing movie! One of the best I've ever seen.",
                created_at: "2023-01-15T10:30:00.000Z"
            }
        ]
    }
};

console.log("🧪 Testing SEO Generator Functions\n");
console.log("="
.repeat(70));

try {
    console.log("\n1️⃣ Testing generateDetailedPlot...");
    const plot = generateDetailedPlot(mockMovie, 'movie', 'en');
    console.log(plot ? `✅ Generated ${plot.length} characters` : "❌ Empty result");

    console.log("\n2️⃣ Testing generateProductionDetails...");
    const production = generateProductionDetails(mockMovie, 'movie', 'en');
    console.log(production ? `✅ Generated ${production.length} characters` : "❌ Empty result");

    console.log("\n3️⃣ Testing generateCastCrewSection...");
    const cast = generateCastCrewSection(mockMovie, 'movie', 'en');
    console.log(cast ? `✅ Generated ${cast.length} characters` : "❌ Empty result");

    console.log("\n4️⃣ Testing generateTrailerSection...");
    const trailer = generateTrailerSection(mockMovie, 'movie', 'en');
    console.log(trailer ? `✅ Generated ${trailer.length} characters` : "❌ Empty result");
    console.log(trailer.includes('youtube.com/embed') ? "   ✅ Contains YouTube embed" : "   ❌ Missing YouTube embed");

    console.log("\n5️⃣ Testing generateRelatedMovies...");
    const related = generateRelatedMovies(mockMovie, 'movie', 'en');
    console.log(related ? `✅ Generated ${related.length} characters` : "❌ Empty result");

    console.log("\n6️⃣ Testing generateBreadcrumbs...");
    const breadcrumbs = generateBreadcrumbs(mockMovie, 'movie', 'https://moviea.me/all-about/movie/550', 'en');
    console.log(breadcrumbs ? `✅ Generated ${breadcrumbs.length} characters` : "❌ Empty result");
    console.log(breadcrumbs.includes('schema.org/BreadcrumbList') ? "   ✅ Contains schema" : "   ❌ Missing schema");

    console.log("\n7️⃣ Testing generateUserReviews...");
    const reviews = generateUserReviews(mockMovie, 'movie', 'en');
    console.log(reviews ? `✅ Generated ${reviews.length} characters` : "❌ Empty result");
    console.log(reviews.includes('user-reviews') ? "   ✅ Contains review section" : "   ❌ Missing review section");
    console.log(reviews.includes('John Doe') ? "   ✅ Contains author name" : "   ❌ Missing author");

    console.log("\n8️⃣ Testing generateEnhancedStructuredData...");
    const structured = generateEnhancedStructuredData(mockMovie, 'movie', 'https://image.url', 'https://moviea.me/all-about/movie/550', 'en');
    console.log(structured ? `✅ Generated ${structured.length} characters` : "❌ Empty result");
    const parsed = JSON.parse(structured);
    console.log(parsed['@graph'] ? `   ✅ Contains @graph with ${parsed['@graph'].length} schemas` : "   ❌ Missing @graph");

    console.log("\n" + "=".repeat(70));
    console.log("✅ All functions executed successfully!\n");

} catch (error) {
    console.log("\n❌ Error during testing:");
    console.error(error);
}
