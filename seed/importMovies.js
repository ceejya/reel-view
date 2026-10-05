const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("./serviceAccountKey.json");

// Make sure TMDB token exists
if (!process.env.TMDB_ACCESS_TOKEN) {
  throw new Error("TMDB_ACCESS_TOKEN is missing from your .env file");
}

// Connect to Firebase
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const headers = {
  Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
  accept: "application/json",
};


// ------------------------------------
// Get TMDB movie genres
// ------------------------------------
async function getGenres() {
  const response = await fetch(
    `${TMDB_BASE_URL}/genre/movie/list?language=en`,
    {
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch genres: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  // Convert:
  // [{ id: 28, name: "Action" }]
  //
  // Into:
  // { 28: "Action" }

  return Object.fromEntries(
    data.genres.map((genre) => [genre.id, genre.name])
  );
}


// ------------------------------------
// Get movies from TMDB
// ------------------------------------
async function getMovies(page = 1) {
  const url =
    `${TMDB_BASE_URL}/discover/movie` +
    `?include_adult=false` +
    `&include_video=false` +
    `&language=en-US` +
    `&page=${page}` +
    `&sort_by=popularity.desc`;

  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch movies: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}


// ------------------------------------
// Import movies into Firestore
// ------------------------------------
async function importMovies() {
  try {
    console.log("🎬 Starting movie import...");

    // 1. Get genre mapping
    const genres = await getGenres();

    console.log("✅ Genres loaded");


    // 2. Get page 1 of movies
    const movieResponse = await getMovies(1);

    const movies = movieResponse.results;

    console.log(`📦 TMDB returned ${movies.length} movies`);


    // 3. Create a Firestore batch
    const batch = db.batch();


    // 4. Process every movie
    for (const movie of movies) {

      // Convert genre IDs to genre names
      const genreNames = movie.genre_ids
        .map((genreId) => genres[genreId])
        .filter(Boolean);


      // Our ReelView movie schema
      const movieData = {
        tmdbId: movie.id,

        title: movie.title,

        description: movie.overview || "",

        releaseDate: movie.release_date || null,

        rating: movie.vote_average || 0,

        popularity: movie.popularity || 0,

        voteCount: movie.vote_count || 0,

        language: movie.original_language || "",

        genres: genreNames,

        posterUrl: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : null,

        backdropUrl: movie.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
          : null,
      };


      // Use TMDB ID as Firestore document ID
      const movieRef = db
        .collection("movies")
        .doc(String(movie.id));

      batch.set(movieRef, movieData);
    }


    // 5. Save all movies
    await batch.commit();

    console.log(`✅ Successfully imported ${movies.length} movies!`);

  } catch (error) {
    console.error("❌ Movie import failed:");
    console.error(error);
  }
}


// Run importer
importMovies();