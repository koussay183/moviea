const API_KEY = "20108f1c4ed38f7457c479849a9999cc";

exports.requests = {

  fetchTrending: `/trending/all/day?api_key=${API_KEY}&language=en-us`,

  fetchNetflixOriginals: `/discover/tv?api_key=${API_KEY}&with_networks=213`,

  fetchTopRated: `/movie/top_rated?api_key=${API_KEY}&language=en-US`,
  fetchActionMovies: `/discover/movie?api_key=${API_KEY}&with_genres=28`,
  fetchComedyMovies: `/discover/movie?api_key=${API_KEY}&with_genres=35`,
  fetchHorrorMovies: `/discover/movie?api_key=${API_KEY}&with_genres=27`,
  fetchRomanceMovies: `/discover/movie?api_key=${API_KEY}&with_genres=10749`,
  fetchDocumentaries: `/discover/movie?api_key=${API_KEY}&with_genres=99`,
  fetchAnimatedMovies: `/discover/movie?api_key=${API_KEY}&with_genres=16`,
  fetchDramaMovies: `/discover/movie?api_key=${API_KEY}&with_genres=18`,
  fetchFamilyMovies: `/discover/movie?api_key=${API_KEY}&with_genres=10751`,
  fetchFantasyMovies: `/discover/movie?api_key=${API_KEY}&with_genres=14`,
  fetchHistoryMovies: `/discover/movie?api_key=${API_KEY}&with_genres=36`,
  fetchGenreMovie : `/genre/movie/list?api_key=${API_KEY}&language=en-US`,
  fetchGenreTv : `/genre/tv/list?api_key=${API_KEY}&language=en-US`,
  multiFetch: `/search/multi?api_key=${API_KEY}&language=en-US`,
  apiKey: "20108f1c4ed38f7457c479849a9999cc",
};

