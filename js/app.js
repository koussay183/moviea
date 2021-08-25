// fetch discover 
var apiKey = '20108f1c4ed38f7457c479849a9999cc';
var posterApi = 'https://image.tmdb.org/t/p/original';
var pageNumber = 1;
var baseApi = 'https://api.themoviedb.org/3';
var starEmoji = '<i class="fa fa-star" style="color:yellow;margin:0 .2em"></i>';
var discoverApi = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&with_watch_monetization_types=flatrate`;
var trend = async () => {
    // selectors 
    const holder = document.querySelector('.res');
    const res = await fetch(discoverApi + `&page=${pageNumber}`);
    const data = await res.json();
    var output = '';
    data.results.forEach(film => {
        const poster = posterApi + film.poster_path;
        var avarage = undefined;
        if (film.vote_average == '0') {
            avarage = 'UV';
        } else {
            avarage = film.vote_average;
        }
        output += `
            <div class="film-card" data-title="${film.title}" >
                <img src=${poster} id="poster-img" data-movieid="${film.id}">
                <span id="film-card-vote-avarage">${avarage + starEmoji}</span>
            </div>
        `;
    })
    holder.innerHTML += output;
    pageNumber++;
    ;
    addEventlistennerToFilmCrad()
}
var forYou = async () => {
    const hol = document.querySelector('#foryou');
    const res = await fetch(discoverApi);
    const data = await res.json();
    const posterPath = posterApi + data.results[0].poster_path;
    const vote = data.results[0].vote_average;
    const id = data.results[0].id;
    const title = data.results[0].title;
    hol.innerHTML += `
        <div class="film-card" data-title="${title}" >
            <img src=${posterPath} id="poster-img" data-movieid="${id}">
            <span id="film-card-vote-avarage">${vote + starEmoji}</span>
        </div>
        `;
    addEventlistennerToFilmCrad()

};
// search function 
var search = async (query) => {
    const apiSearch = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`;
    const res = await fetch(apiSearch);
    const data = await res.json();
    var output = '';
    const holder = document.querySelector('#foryou');
    data.results.forEach(film => {
        const poster = posterApi + film.poster_path;
        var avarage = undefined;
        if (film.vote_average == '0') {
            avarage = 'UV';
        } else {
            avarage = film.vote_average;
        }
        if (film.poster_path == null) {
            console.log(null);
        } else {
            output += `
                <div class="film-card" data-title="${film.title}" >
                    <img src=${poster} id="poster-img" data-movieid="${film.id}">
                    <span id="film-card-vote-avarage">${avarage + starEmoji}</span>
                </div>
            `;
        }

    })
    holder.innerHTML = output;
    addEventlistennerToFilmCrad()

};
// get movie data
const getMovieData = async (movieid) => {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieid}?api_key=${apiKey}&language=en-US`);
    const data = await res.json();
}
// adiing event listener to search input 
$('#search-bar').keyup(() => {
    const query = $('#search-bar').val();
    search(query)
})
// on load
$(() => {
    forYou();
    trend();
    setTimeout(() => {
        $('.pre').hide();
        $('body').css('overflow', 'auto');
    }, 2000)
    $(".film-card").click(() => {
        console.log(123);
        window.location.href = "/res.html";
    });
    $('.all-movie-data-holder').hide();
});
// adding event listener to lode more button 
$('#lode-more-button').click(() => {
    $('.pre').show();
    trend();
    setTimeout(() => { $('.pre').hide(); }, 2000);
})
// nav hamborger
$('#hamborger').click(() => {
    $('.menu').toggleClass('on');
    $('#a1').toggleClass('rotate');
    $('#a3').toggleClass('rotate');
    $('#a2').toggleClass('hide');
});
// on scroll event
$(window).scroll(function () {
    var scrolled = $(window).scrollTop();
    if (scrolled >= 2000) {
        $('.gotop').css('display', 'flex')
    } else {
        $('.gotop').css('display', 'none')
    }
});
// add event listener to go top button
$('.gotop-icon-holder').click(() => {
    $(window).scrollTop(0);
});
const getTrailerUrl = async (filmId) => {

    const trailersApi = `${baseApi}/movie/${filmId}/videos?api_key=${apiKey}`;
    const res = await fetch(trailersApi);
    const data = await res.json();
    const trailerKey = data.results[0].key;
    const ytbBaseUrl = `//www.youtube.com/embed/${trailerKey}/`;
    console.log(ytbBaseUrl);
    return ytbBaseUrl;
}
// card onclick takes you to res page
const addEventlistennerToFilmCrad = () => {
    $(".film-card").click(async (event) => {
        $('.pre').show();
        $('.search-holder').hide();
        $('.foryou').hide();
        $('.res').hide();
        $('.more-loder-holder').hide();
        const filmid = $(event.target).attr('data-movieid');
        const filmDataApi = `https://api.themoviedb.org/3/movie/${filmid}?api_key=${apiKey}&language=en-US`;
        const res = await fetch(filmDataApi);
        const data = await res.json();
        $('.all-movie-data-holder').show();
        $('.all-movie-data-holder').css("background-image", `url(${posterApi + data.backdrop_path})`);
        $('#poster').attr('src', `${posterApi + data.poster_path}`);
        $('#title').text(data.title);
        $('#overview').text(data.overview);
        $('#date').text(data.release_date);
        $('#vote').text(data.vote_average);
        const trailerUrl = await getTrailerUrl(filmid);
        $('.ytb-palyer').attr('src', trailerUrl);
        document.querySelector('#vote').innerHTML += starEmoji;
        setTimeout(() => {
            $('.pre').hide();
        }, 2000);

    });
}


