const TMDB_KEY = 'a45420333457411e78d5ad35d6c51a2d';
const IMG_PATH = 'https://image.tmdb.org/t/p/original';
let currentMovieId = '';

// 1. Initial Load & Dynamic Navbar
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 50) nav.classList.add('nav-scrolled');
    else nav.classList.remove('nav-scrolled');
});

// 2. Fetch Movies from TMDB (Feature 47: API Integration)
async function fetchMovies() {
    const res = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`);
    const data = await res.json();
    renderHero(data.results[0]);
    renderRow(data.results, 'trending-container');
    
    const topRes = await fetch(`https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_KEY}`);
    const topData = await topRes.json();
    renderRow(topData.results, 'toprated-container');
}

// 3. Render Hero Section (Feature 11: Auto-update UI)
function renderHero(movie) {
    document.getElementById('hero-bg').style.backgroundImage = `url(${IMG_PATH + movie.backdrop_path})`;
    document.getElementById('hero-title').innerText = movie.title;
    document.getElementById('hero-desc').innerText = movie.overview;
    currentMovieId = movie.id;
}

// 4. Render Horizontal Rows (Feature 16: Dynamic Grid)
function renderRow(movies, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = movies.map(movie => `
        <div class="movie-card relative group cursor-pointer" onclick="openPlayer('${movie.id}')">
            <img src="${IMG_PATH + movie.poster_path}" class="rounded-lg object-cover w-full h-80">
            <div class="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                <p class="text-sm font-bold text-cyan-400">Rating: ${movie.vote_average}</p>
                <h4 class="text-white font-bold">${movie.title}</h4>
            </div>
        </div>
    `).join('');
}

// 5. Player Controls (Feature 21: Multi-Source Engine)
function openPlayer(id) {
    if(id) currentMovieId = id;
    const modal = document.getElementById('player-modal');
    modal.classList.remove('hidden');
    changeSource(); // Set default source
}

function closePlayer() {
    document.getElementById('player-modal').classList.add('hidden');
    document.getElementById('main-player').src = '';
}

function changeSource() {
    const source = document.getElementById('source-selector').value;
    const player = document.getElementById('main-player');
    
    // Feature 22: Multi-Source Logic (Expanding to 10 sources is easy here)
    const sources = {
        vidsrc: `https://vidsrc.me/embed/movie?tmdb=${currentMovieId}`,
        cinemaos: `https://player.smashy.stream/movie/${currentMovieId}`,
        vidsrc_icu: `https://vidsrc.icu/embed/movie/${currentMovieId}`
    };
    
    player.src = sources[source] || sources.vidsrc;
}

// 6. Global Search Logic (Feature 13)
document.getElementById('searchInput').addEventListener('keyup', async (e) => {
    if(e.target.value.length > 2) {
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${e.target.value}`);
        const data = await res.json();
        renderRow(data.results, 'trending-container'); // Overwrite trending row with search results
    }
});

fetchMovies();
