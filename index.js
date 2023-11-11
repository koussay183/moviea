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
app.get('*', async (req, res) => {
    var global = fs.readFileSync(path.join(__dirname,"build","index.html"),{encoding:"utf-8"});

    let final = global;

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

            final = final.replace("__DESCRIPTION__",info?.overview)
            final = final.replace("__FB_DESCRIPTION__",info?.overview)
            final = final.replace('__POSTER__',"https://image.tmdb.org/t/p/original/"+info?.backdrop_path)
            final = final.replace("__FB_TITLE__",info?.title + " | On Moviea Now")
            
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

    // if nothing changed !
    res.send(final)
});


app.listen(port, () => console.log(`Listening on port ${port}`));