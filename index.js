const express = require('express');
const { Worker } = require("worker_threads");
const path = require('path');
const app = express();

const port = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

const fs = require("fs")
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const { requests } = require("./requests");

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});



// Scraper for the arabic movies and tv shows
const createWorker = (workerPath, workerData, res) => {
  const worker = new Worker(workerPath, { workerData });
  let isResponseSent = false;

  worker.on("message", (data) => {
    if (!isResponseSent) {
      res.status(200).json(data);
      isResponseSent = true;
    }
  });

  worker.on("error", (error) => {
    if (!isResponseSent) {
      res.status(500).json({ error: error.message });
      isResponseSent = true;
    }
  });

  worker.on("exit", (code) => {
    if (!isResponseSent) {
      if (code !== 0) {
        res.status(500).json({ error: `Worker stopped with exit code ${code}` });
      } else {
        res.status(500).json({ error: "Unknown error" });
      }
      isResponseSent = true;
    }
  });

  return worker;
};

app.get("/movie-scraper/:movie_name", (req, res) => {
  const movie_name = req.params.movie_name;
  if (movie_name.length === 0) {
    return res.status(400).json({ error: "movie name needed" });
  }
  createWorker("./movieWorker.js", movie_name, res);
});

app.get("/tv-show/:tv_show_name/:season/:episode", (req, res) => {
  const { tv_show_name, season, episode } = req.params;
  if (!tv_show_name.trim() || episode <= 0 || season <= 0) {
    return res.status(400).json({ error: "name needed" });
  }
  createWorker("./tvShowWorker.js", { series_name: tv_show_name.trim(), episode, season }, res);
});

app.get("/tv/ramadan-scraper", (req, res) => {
  createWorker("./ramadanRow.js", null, res);
});

app.get("/tv/ramadan-scraper/watch/:id/:ep", (req, res) => {
  const { id, ep } = req.params;
  createWorker("./ramadanWatch.js", { id, ep }, res);
});







// APIS FOR THE MOVIE DB API --------------------------------------------------
const fetchAndReturn = async (url) => {
  const res = await fetch("https://api.themoviedb.org/3"+url);
  const data = await res.json();
  return data
}


app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});



app.get('/share/movie/:id',async(req,res)=>{
  
  fs.readFile(path.resolve("./index.html"),'utf-8',async(err,data)=>{
      if(err){
          console.log(err)
          return res.status(500).send("Some Error Happend")
      }
      const movieId = req.params.id;
      const result = await fetch("https://api.themoviedb.org/3/movie/"+movieId+"?api_key=20108f1c4ed38f7457c479849a9999cc")
      const info = await result.json();

      data = data.replace('Page Title',info?.title + " | On Moviea Now" || info?.original_title + " | On Moviea Now")
      data = data.replace('Page Title2',info?.title + " | On Moviea Now" || info?.original_title + " | On Moviea Now")
      data = data.replace('__DESCRIPTION__',info?.overview)
      data = data.replace('__DESCRIPTION__2',info?.overview)
      data = data.replace('__DESCRIPTION__3',info?.overview)
      data = data.replace('__FB_TITLE__',info?.title + " | On Moviea Now" || info?.original_title + " | On Moviea Now")      
      data = data.replace('__FB_DESCRIPTION__',info?.overview)
      data = data.replace('__POSTER__',"https://image.tmdb.org/t/p/original/"+info?.backdrop_path)
      data = data.replace('__POSTER__2',"https://image.tmdb.org/t/p/original/"+info?.poster_path)
      data = data.replace('__REDIRECT__',"https://moviea.tn/all-about/movie/"+movieId) 
      return res.send(data)
  })
})

app.get('/share/tn/:tvId',async(req,res)=>{
  
  fs.readFile(path.resolve("./index.html"),'utf-8',async(err,data)=>{
      if(err){
          console.log(err)
          return res.status(500).send("Some Error Happend")
      }
      const tvId = req.params.tvId;

      const result = await fetch(
          `https://content.shofha.com/api/mobile/contentFiles/${tvId}?subscriberId=8765592`,
          { headers: { "authorization": "Bearer c8ij8vntrhlreqv7g8shgqvecj" ,"platform":1} }
        )

      const info = await result.json();

      data = data.replace('Page Title',info?.name_ar + " | On Moviea Now")
      data = data.replace('Page Title2',info?.name_ar + " | On Moviea Now")
      data = data.replace('__DESCRIPTION__',info?.description_ar)
      data = data.replace('__DESCRIPTION__2',info?.description_ar)
      data = data.replace('__DESCRIPTION__3',info?.description_ar)
      data = data.replace('__FB_TITLE__',info?.name_ar + " | On Moviea Now")      
      data = data.replace('__FB_DESCRIPTION__',info?.description_ar)
      data = data.replace('__POSTER__',info?.previewImageUrl)
      data = data.replace('__POSTER__2',info?.previewImageUrl)
      data = data.replace('__REDIRECT__',"https://moviea.tn/tn/tv/"+tvId) 
      return res.send(data)
  })
})

app.get('/share/tv/:id',async(req,res)=>{
  
  fs.readFile(path.resolve("./index.html"),'utf-8',async(err,data)=>{
      if(err){
          console.log(err)
          return res.status(500).send("Some Error Happend")
      }
      const movieId = req.params.id;
      const result = await fetch("https://api.themoviedb.org/3/tv/"+movieId+"?api_key=20108f1c4ed38f7457c479849a9999cc")
      const info = await result.json();

      data = data.replace('Page Title',info?.name + " | On Moviea Now")
      data = data.replace('Page Title2',info?.name + " | On Moviea Now")
      data = data.replace('__DESCRIPTION__',info?.overview)
      data = data.replace('__DESCRIPTION__2',info?.overview)
      data = data.replace('__DESCRIPTION__3',info?.overview)
      data = data.replace('__FB_TITLE__',info?.name + " | On Moviea Now")      
      data = data.replace('__FB_DESCRIPTION__',info?.overview)
      data = data.replace('__POSTER__',"https://image.tmdb.org/t/p/original/"+info?.backdrop_path)
      data = data.replace('__POSTER__2',"https://image.tmdb.org/t/p/original/"+info?.poster_path)
      data = data.replace('__REDIRECT__',"https://moviea.tn/all-about/tv/"+movieId) 
      return res.send(data)
  })
})





// TMDB ROUTES -------------------------------------------------------------------------------------
var API_KEY = "20108f1c4ed38f7457c479849a9999cc";

app.get('/genres/movie',async(req,res)=>{
  res.send(await fetchAndReturn(requests.fetchGenreMovie))
})

app.get('/genres/tv',async(req,res)=>{
  res.send(await fetchAndReturn(requests.fetchGenreTv))
})

app.get('/trending/:page?',async(req,res)=>{
  res.send(await fetchAndReturn(requests.fetchTrending+`&page=${req.params.page || 1}`))
})

app.get('/discover/netflix/:page?',async(req,res)=>{
  res.send(await fetchAndReturn(requests.fetchNetflixOriginals+`&page=${req.params.page || 1}`))
})

app.get('/discover/movie/:genre/:page?',async(req,res)=>{
  res.send(await fetchAndReturn(`/discover/movie?api_key=${API_KEY}&with_genres=`+req.params.genre+`&page=${req.params.page || 1}`))
})

app.get('/discover/tv/:genre/:page?',async(req,res)=>{
  res.send(await fetchAndReturn(`/discover/tv?api_key=${API_KEY}&with_genres=`+req.params.genre+`&page=${req.params.page || 1}`))
})

app.get("/similar/movie/:id/:page?",async(req,res)=>{
  const id = req.params.id
  const response = await fetch(`https://api.themoviedb.org/3/movie/${req.params.id}/similar?api_key=20108f1c4ed38f7457c479849a9999cc`+`&page=${req.params.page || 1}`);
  const data = await response.json();

  res.send(data)
})

app.get("/similar/tv/:id/:page?",async(req,res)=>{
  const id = req.params.id
  const response = await fetch(`https://api.themoviedb.org/3/tv/${req.params.id}/similar?api_key=20108f1c4ed38f7457c479849a9999cc`+`&page=${req.params.page || 1}`);
  const data = await response.json();

  res.send(data)
})

app.get("/movie/:id",async(req,res)=>{
  const id = req.params.id
  const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=20108f1c4ed38f7457c479849a9999cc&append_to_response=videos`);
  const data = await response.json();

  res.send(data)
})

app.get("/tv/:id",async(req,res)=>{
  const id = req.params.id
  const response = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=20108f1c4ed38f7457c479849a9999cc&append_to_response=videos`);
  const data = await response.json();

  res.send(data)
})

app.get("/tv/season/:id/:s",async(req,res)=>{
  const {id,s} = req.params
  const response = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${s}?api_key=20108f1c4ed38f7457c479849a9999cc`);
  const data = await response.json();

  res.send(data)
})

app.get("/tv/files/:name/:s/:e",async(req,res)=>{
  const {name,s,e} = req.params
  const response = await fetch(`${BASE_URL}/tv-show/${name}/${s}/${e}`);
  const data = await response.json();

  res.send(data)
})

app.get("/movie/files/:name",async(req,res)=>{
  const name = req.params.name
  const response = await fetch(`${BASE_URL}/movie-scraper/${name}`);
  const data = await response.json();
  
  res.send(data)
})

app.get("/movie/credits/:id",async(req,res)=>{
  const id = req.params.id
  const response = await fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=20108f1c4ed38f7457c479849a9999cc`);
  const data = await response.json();

  res.send(data)
})

app.get("/movie/collection/:id",async(req,res)=>{
  const id = req.params.id
  const response = await fetch(`https://api.themoviedb.org/3/collection/${id}?api_key=${API_KEY}`);
  const data = await response.json();

  res.send(data)
})

app.get("/tv/credits/:id",async(req,res)=>{
  const id = req.params.id
  const response = await fetch(`https://api.themoviedb.org/3/tv/${id}/credits?api_key=20108f1c4ed38f7457c479849a9999cc`);
  const data = await response.json();

  res.send(data)
})

app.get("/person/:id",async(req,res)=>{
  const id = req.params.id
  const response = await fetch(`https://api.themoviedb.org/3/person/${id}?api_key=20108f1c4ed38f7457c479849a9999cc`);
  const data = await response.json();

  res.send(data)
})

app.get("/credit/:id",async(req,res)=>{
  const id = req.params.id
  const response = await fetch(`https://api.themoviedb.org/3/credit/${id}?api_key=20108f1c4ed38f7457c479849a9999cc`);
  const data = await response.json();

  res.send(data)
})

app.get("/person/combined/:id",async(req,res)=>{
  const id = req.params.id
  const response = await fetch(`https://api.themoviedb.org/3/person/${id}/combined_credits?api_key=20108f1c4ed38f7457c479849a9999cc`);
  const data = await response.json();

  res.send(data)
})

app.get('/search/:q/:page?',async(req,res)=>{
  res.send(await fetchAndReturn(requests.multiFetch+`&query=${req.params.q}&page=${req.params.page || 1}`))
})

// ARABIC ROUTES ------------------------------------------------------------------------------------

app.get("/arabic/categories/:id",async(req,res)=>{
  const id = req.params.id
  const response = await fetch(`https://content.shofha.com/api/categories/${id}?subscriberId=16640329&opCode=60502`,{ headers: { authorization: "Bearer c8ij8vntrhlreqv7g8shgqvecj" ,platform:1} });
  const data = await response.json();

  res.send(data)
})

app.get("/arabic/files/:id",async(req,res)=>{
  const id = req.params.id
  const response = await fetch(`https://content.shofha.com/api/mobile/contentFiles/${id}?subscriberId=8765592`,{ headers: { authorization: "Bearer c8ij8vntrhlreqv7g8shgqvecj" ,platform:1} });
  const data = await response.json();
  if(data?.contentFilesEpisodesDTOs?.length == 0){
      const ress = await fetch(`https://content.shofha.com/api/mobile/contentPlaylist/${data?.fileId}`, {
          "headers": {
            "accept": "application/json, text/plain, */*",
            "authorization": "Bearer c8ij8vntrhlreqv7g8shgqvecj",
            "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "Referer": "https://shofha.com/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
          },
          "body": null,
          "method": "GET"
        });
      const d = await ress.json();
      const newOne = {...data, contentFilesEpisodesDTOs : d}
      res.send(newOne)
  }else {
      res.send(data)
  }
  
})

app.get("/reels/:page",async(req,res)=>{
  const page = req.params.page
  const response = await fetch(`https://content.shofha.com/api/mobile/ReelsPerGeoV2?size=10&page=${page}&opCode=60502`,{ headers: { authorization: "Bearer c8ij8vntrhlreqv7g8shgqvecj" ,platform:1} });
  const data = await response.json();

  res.send(data)
})

app.get("/ramadan/tv",async (req,res)=>{
  

  const response = await fetch(`${BASE_URL}/tv/ramadan-scraper`);
  const data = await response.json();

  res.send(data)
})

app.get("/tv/ramadan/watch/:id", async (req,res)=>{
  
  const response = await fetch(`${BASE_URL}/tv/ramadan-scraper/watch/${req.params.id}`);
  const data = await response.json();

  res.send(data)
})

// Assuming you have a function to generate a unique version or timestamp
function generateVersion() {
  return Date.now(); // Example: Using current timestamp
}

// Example in Express route serving your JavaScript file
app.get('/bundle.js', (req, res) => {
  const version = generateVersion();
  res.sendFile(path.join(__dirname, 'path/to/your/bundle.js') + `?v=${version}`);
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
            final = final.replace('content="https://moviea.tn"',`content="https://moviea.tn${req.path}"`)

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
            final = final.replace('content="https://moviea.tn"',`content="https://moviea.tn${req.path}"`)
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

            SEOdesc = info?.contentSEO?.descriptionArSEO?.replace("شوفها","Moviea")
            SEOtitle = info?.contentSEO?.titleArSEO?.replace("شوفها","Moviea")

            final = final.replace(mainTags.desc,SEOdesc)
            final = final.replace(mainTags.desc,SEOdesc)

            final = final.replace(mainTags.poster,info?.previewImageUrl)

            final = final.replace('href="https://moviea.tn"',`href="https://moviea.tn${req.path}"`)
            final = final.replace('content="https://moviea.tn"',`content="https://moviea.tn${req.path}"`)

            final = final.replace(mainTags.title,SEOtitle)
            final = final.replace(mainTags.siteTitle,SEOtitle)
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