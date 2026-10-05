// js/tmdb.js
const API_KEY = "5f1b775294487c7365cc00040a2550ae";
const BASE_URL = "https://api.themoviedb.org/3";
export const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Fetch trending movies
export async function getTrendingMovies() {
  try {
    const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
    const data = await res.json();
    console.log(data);
    
    return data.results;
  } catch (err) {
    console.error("Error fetching movies:", err);
    return [];
  }
}