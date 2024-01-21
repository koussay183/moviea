const express = require('express');
const path = require('path');
const fs = require("fs");
const app = express();
const port = process.env.PORT || 5000;

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

app.use(express.static(path.join(__dirname, 'build')));
// Handle React routing, return all requests to React app
app.get("*",async (req, res) => {
    var global = fs.readFileSync(path.join(__dirname,"build","index.html"),{encoding:"utf-8"});

    let final = global;

    const mainTags = {
      title : "Watch Movies | Tv-Shows Online Free",
      siteTitle : "Moviea | Watch Free",
      desc : "With moviea.tn you can watch free movies online anytime, on any device. It's never been easier to stream movies so get started. | movies | tv shows | movie | free movies | watch free | film complete | film | stream",
      poster : "https://assets.nflxext.com/ffe/siteui/vlv3/b85863b0-0609-4dba-8fe8-d0370b25b9ee/e7e23acb-d3f4-4c16-87da-22b5e0289506/TN-en-20230731-popsignuptwoweeks-perspective_alpha_website_large.jpg"
    }
    
    const routeHandlers = [
        {
          regex: /^\/all-about\/movie\/\d+$/,
          handler: async (req, res) => {
            // getting the id of the movie
            const match = req.path.match(/\d+$/);
            const movieId = match ? match[0] : null;
            // fetch tmdb api
            const result = await fetch("https://api.themoviedb.org/3/movie/"+movieId+"?api_key=20108f1c4ed38f7457c479849a9999cc")
            const info = await result.json();
            const template = `<main>
              <article>
                  <h1>${info?.title+ " | On Moviea Now"}</h1>
                  <p>${info?.overview}</p>
                  <img width="500" height="250" src="${"https://image.tmdb.org/t/p/original/"+info?.backdrop_path}" alt=${info?.title}></img>
                  <a href="https://moviea.tn/all-about/tv/${movieId}">Watch ${info?.title} Free</a>
              </article>
            </main>`
            final = final.replace(mainTags.desc,info?.overview)
            final = final.replace(mainTags.desc,info?.overview)
            final = final.replace('href="https://moviea.tn"',`href="https://moviea.tn${req.path}"`)
            final = final.replace(mainTags.poster,"https://image.tmdb.org/t/p/original/"+info?.backdrop_path)
            final = final.replace(mainTags.title,info?.title + " | On Moviea Now")
            final = final.replace(mainTags.siteTitle,info?.title + " | On Moviea Now")
            final = final.replace("__HTML__",template)
            res.send(final);
          }
        },
        {
          regex: /^\/all-about\/tv\/\d+$/,
          handler: async (req, res) => {
            // getting the id of the movie
            const match = req.path.match(/\d+$/);
            const movieId = match ? match[0] : null;
            // fetch tmdb api
            const result = await fetch("https://api.themoviedb.org/3/tv/"+movieId+"?api_key=20108f1c4ed38f7457c479849a9999cc")
            const info = await result.json();
            const template = `<main>
              <article>
                  <h1>${info?.name+ " | On Moviea Now"}</h1>
                  <p>${info?.overview}</p>
                  <img width="500" height="250" src="${"https://image.tmdb.org/t/p/original/"+info?.backdrop_path}" alt=${info?.title}></img>
                  <a href="https://moviea.tn/all-about/tv/${movieId}">Watch ${info?.name} Free</a>
                  </article>
            </main>`
            final = final.replace(mainTags.desc,info?.overview)
            final = final.replace(mainTags.desc,info?.overview)
            final = final.replace('href="https://moviea.tn"',`href="https://moviea.tn${req.path}"`)
            final = final.replace(mainTags.poster,"https://image.tmdb.org/t/p/original/"+info?.backdrop_path)
            final = final.replace(mainTags.title,info?.name + " | On Moviea Now")
            final = final.replace(mainTags.siteTitle,info?.name + " | On Moviea Now")
            final = final.replace("__HTML__",template)
            res.send(final);
          }
        },
        {
          regex: /^\/tn\/tv\/\d+$/,
          handler: async (req, res) => {
            // getting the id of the movie
            const match = req.path.match(/\d+$/);
            const tvId = match ? match[0] : null;
            // fetch tmdb api
            const result = await fetch(
              `https://content.shofha.com/api/mobile/contentFiles/${tvId}?subscriberId=8765592`,
              { headers: { "authorization": "Bearer c8ij8vntrhlreqv7g8shgqvecj" ,"platform":1} }
            )
  
            const info = await result.json();
            const template = `<main>
              <article>
                  <h1>${info?.name_ar?.replaceAll('"',"'") + " | On Moviea Now"}</h1>
                  <p>${info?.description_ar?.replaceAll('"',"'")}</p>
                  <img width="500" height="250" src="${info?.previewImageUrl}" alt=${info?.name_ar?.replaceAll('"',"'")}></img>
                  <a href="https://moviea.tn/tn/tv/${tvId}">Watch ${info?.name_ar?.replaceAll('"',"'").replaceAll('"',"'")} Free</a>
                  <video controls="" width="100%" height="400px" class="hslPlayer" id="hlsPlayer" style="border-radius: 10px;" src="${info?.contentFilesEpisodesDTOs[0]?.contentUrl}"></video>
              </article>
            </main>`  
            final = final.replace(mainTags.desc,info?.description_ar?.replaceAll('"',"'"))
            final = final.replace(mainTags.desc,info?.description_ar?.replaceAll('"',"'"))
            final = final.replace(mainTags.poster,info?.previewImageUrl)
            final = final.replace('href="https://moviea.tn"',`href="https://moviea.tn${req.path}"`)
            final = final.replace(mainTags.title,info?.name_ar?.replaceAll('"',"'") + " | On Moviea Now")
            final = final.replace(mainTags.siteTitle,info?.name_ar?.replaceAll('"',"'") + " | On Moviea Now")
            final = final.replace("__HTML__",template)
            res.send(final);
          }
        },
        {
          regex: /\/search-page\/.+/,
          handler: async (req, res) => {
            // getting the id of the movie
            const regexPattern = /\/search-page\/(.+)/
            const searchString = req.path;

            // Use exec method to get the captured movie name
            const matchResult = regexPattern.exec(searchString);
            const movieName = matchResult[1];

            // fetch tmdb api
            const result = await fetch("https://moviea-share.vercel.app/search/"+movieName)
  
            const info = await result.json();

            var templateGlobale = `<main>`

            for (let index = 0; index < info?.results?.length; index++) {
              const element = info?.results[index];
              const templateCard = `
                <article>
                    <h1>${ element?.name || element?.title + " | On Moviea Now"}</h1>
                    <p>${element?.overview}</p>
                    <img width="500" height="250" src="${"https://image.tmdb.org/t/p/original/"+element?.poster_path}" alt=${element?.name || element?.title}></img>
                    <a href="https://moviea.tn/all-about/${element?.media_type}/${element?.id}">Watch ${element?.name || element?.title} Free</a>
                </article>`
              templateGlobale+=templateCard
            }
            templateGlobale+="</main>"
            final = final.replace(mainTags.desc,info?.results[0]?.overview)
            final = final.replace(mainTags.poster,"https://image.tmdb.org/t/p/original/"+info?.results[0]?.poster_path)
            final = final.replace(mainTags.title, movieName + " | On Moviea Now")
            final = final.replace(mainTags.siteTitle, movieName + " | On Moviea Now")
            final = final.replace("__HTML__",templateGlobale)
            res.send(final);
          }
        }
    ];

    for (const routeHandler of routeHandlers) {
        if (routeHandler.regex.test(req.path)) {
            routeHandler.handler(req, res);
            return; // Stop checking further regexes once a match is found
        }
    }

    
    res.send(final)
});



app.listen(port, () => console.log(`Listening on port ${port}`));