const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const convertCase = (objectToBe) => {
  return {
    movieId: objectToBe.movie_id,
    directorId: objectToBe.director_id,
    movieName: objectToBe.movie_name,
    leadActor: objectToBe.lead_actor,
  };
};

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT movie_name
    FROM
    movie;
    `;
  const moviesList = await db.all(getMoviesQuery);
  response.send(moviesList.map((each) => convertCase(each)));
});

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `
    INSERT INTO
    movie (director_id,movie_name,lead_actor)
    VALUES
    (
        ${directorId},
        '${movieName}',
        '${leadActor}');
    `;
  const dbResponse = await db.run(addMovieQuery);
  const movieId = dbResponse.lastId;
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT 
        *
    FROM
        movie
    WHERE movie_id = ${movieId};
    `;
  const movie = await db.get(getMovieQuery);
  response.send(convertCase(movie));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovie = `
    UPDATE movie
    SET 
        director_id = ${directorId},
        movie_name = '${movieName}',
        lead_actor = '${leadActor}'
        WHERE movie_id = ${movieId};
    `;
  await db.run(updateMovie);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
  DELETE FROM
    movie
  WHERE movie_id = ${movieId};
  `;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

const convertCaseDirector = (dirObject) => {
  return {
    directorId: dirObject.director_id,
    directorName: dirObject.director_name,
  };
};

app.get("/directors/", async (request, response) => {
  const getDirectorQuery = `
    SELECT *
    FROM
    director;
    `;
  const directorList = await db.all(getDirectorQuery);
  response.send(directorList.map((each) => convertCaseDirector(each)));
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieQuery = `
    SELECT 
        movie_name
    FROM
        movie
    WHERE director_id = ${directorId};
    `;
  const movieList = await db.all(getMovieQuery);
  response.send(movieList.map((each) => convertCase(each)));
});

module.exports = app;
