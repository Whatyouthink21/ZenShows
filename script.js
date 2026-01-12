const API_KEY = '60defb38119575da952b28d206871c1b';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

let currentMovieId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchMovies('/trending/movie/week', 'trendingGrid');
    fetchMovies('/movie/top_rated', 'recommendationGrid');
    loadHero();
});

async function fetchMovies(endpoint, elementId) {
    const res = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}`);
    const data = await res.json();
    displayMovies(data.results, elementId);
}

function displayMovies(movies, elementId) {
    const grid = document.getElementById(elementId);
    grid.innerHTML = movies.map(movie => `
        <div class="movie-card" onclick="openPlayer(${movie.id})">
            <img src="${IMG_URL + movie.poster_path}" alt="${movie.title}">
            <div class="movie-info">
                <h4>${movie.title || movie.name}</h4>
                <span>${movie.release_date ? movie.release_date.split('-')[0] : ''}</span>
            </div>
        </div>
    `).join('');
}

async function openPlayer(id) {
    currentMovieId = id;
    const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=credits,similar`);
    const movie = await res.json();

    document.getElementById('playerModal').style.display = 'block';
    switchServer('vidsrc'); // Default server
    
    // Details & Share logic
    const shareUrl = window.location.href;
    document.getElementById('whatsappShare').onclick = () => {
        window.open(`https://api.whatsapp.com/send?text=Watching ${movie.title} on ZenShows! ${shareUrl}`, '_blank');
    };

    // Cast and Crew
    document.getElementById('movieDetails').innerHTML = `
        <h1>${movie.title}</h1>
        <p>${movie.overview}</p>
        <div class="cast">
            <h3>Cast:</h3>
            ${movie.credits.cast.slice(0, 5).map(c => `<span class="actor-link" onclick="fetchPerson(${c.id})">${c.name}</span>`).join(', ')}
        </div>
    `;
}

function switchServer(provider) {
    const container = document.getElementById('playerContainer');
    let url = '';
    
    if(provider === 'vidsrc') url = `https://vidsrc.me/embed/movie?tmdb=${currentMovieId}`;
    if(provider === 'bidsrc') url = `https://vidsrc.cc/v2/embed/movie/${currentMovieId}`;
    if(provider === 'cinema') url = `https://multiembed.mov/directstream.php?video_id=${currentMovieId}&tmdb=1`;

    container.innerHTML = `<iframe src="${url}" allowfullscreen></iframe>`;
}

// AI Suggestion Logic (Content-based filtering sim)
async function getAISuggestion() {
    const query = document.getElementById('aiInput').value;
    const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`);
    const data = await res.json();
    displayMovies(data.results, 'aiResults');
}

// Filmography for Actors/Directors
async function fetchPerson(personId) {
    const res = await fetch(`${BASE_URL}/person/${personId}/movie_credits?api_key=${API_KEY}`);
    const data = await res.json();
    document.getElementById('playerModal').style.display = 'none';
    document.getElementById('mainContent').innerHTML = `
        <div class="container">
            <h2>Filmography</h2>
            <div class="movie-grid">${data.cast.map(m => `<div class="movie-card" onclick="openPlayer(${m.id})"><img src="${IMG_URL + m.poster_path}"><h4>${m.title}</h4></div>`).join('')}</div>
        </div>
    `;
}

function closePlayer() { document.getElementById('playerModal').style.display = 'none'; }
function showAIBox() { document.getElementById('aiModal').style.display = 'block'; }

