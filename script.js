const API_KEY = 'a45420333457411e78d5ad35d6c51a2d';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let state = {
    currentId: null,
    history: JSON.parse(localStorage.getItem('flix_history')) || [],
    watchlist: JSON.parse(localStorage.getItem('flix_watchlist')) || [],
    theme: 'cyan'
};

// Feature 1-10: Initialization & Global Listeners
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    window.addEventListener('scroll', handleScroll);
});

async function initApp() {
    await fetchHero();
    await fetchRow('/trending/all/week', 'row-trending');
    await fetchRow('/movie/popular', 'row-popular');
    renderHistory();
}

function handleScroll() {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 100) nav.classList.add('nav-scrolled');
    else nav.classList.remove('nav-scrolled');
}

// Feature 11-20: Data Engine
async function fetchHero() {
    const res = await fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}`);
    const data = await res.json();
    const movie = data.results[0];
    
    state.currentId = movie.id;
    document.getElementById('hero-img').style.backgroundImage = `url(${IMG_URL + movie.backdrop_path})`;
    document.getElementById('hero-title').innerText = movie.title || movie.name;
    document.getElementById('hero-desc').innerText = movie.overview;
    
    const tags = [movie.release_date?.split('-')[0], `★ ${movie.vote_average.toFixed(1)}`, "HD"];
    document.getElementById('hero-tag').innerHTML = tags.map(t => `<span class="bg-white/10 px-2 py-1 rounded text-xs">${t}</span>`).join('');
}

async function fetchRow(endpoint, containerId) {
    const res = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}`);
    const data = await res.json();
    const container = document.getElementById(containerId);
    
    container.innerHTML = data.results.map(movie => `
        <div class="movie-card group" onclick="openPlayer(${movie.id}, '${(movie.title || movie.name).replace(/'/g, "")}')">
            <img src="${IMG_URL + movie.poster_path}" loading="lazy">
            <div class="card-overlay">
                <p class="text-cyan-500 font-bold text-xs">98% Match</p>
                <h4 class="font-bold text-sm">${movie.title || movie.name}</h4>
                <div class="flex gap-2 mt-2">
                    <button class="w-8 h-8 rounded-full bg-white text-black text-xs flex items-center justify-center"><i class="fa-solid fa-play"></i></button>
                    <button onclick="event.stopPropagation(); toggleWatchlist(${movie.id})" class="w-8 h-8 rounded-full bg-zinc-800 text-xs flex items-center justify-center"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

// Feature 21-35: Player & Multi-Source Engine
function openPlayer(id, title) {
    state.currentId = id;
    addToHistory(id, title);
    document.getElementById('playing-title').innerText = title;
    document.getElementById('player-overlay').classList.remove('hidden');
    switchSource();
}

function switchSource() {
    const source = document.getElementById('source-select').value;
    const iframe = document.getElementById('iframe-player');
    const sources = {
        vidsrc: `https://vidsrc.me/embed/movie?tmdb=${state.currentId}`,
        cinemaos: `https://player.smashy.stream/movie/${state.currentId}`,
        vidsrc_icu: `https://vidsrc.icu/embed/movie/${state.currentId}`,
        superembed: `https://multiembed.mov/directstream.php?video_id=${state.currentId}&tmdb=1`
    };
    iframe.src = sources[source];
}

function closePlayer() {
    document.getElementById('player-overlay').classList.add('hidden');
    document.getElementById('iframe-player').src = '';
}

// Feature 36-50: History, Settings, Themes
function addToHistory(id, title) {
    if (!state.history.find(m => m.id === id)) {
        state.history.unshift({id, title});
        if(state.history.length > 10) state.history.pop();
        localStorage.setItem('flix_history', JSON.stringify(state.history));
        renderHistory();
    }
}

function renderHistory() {
    const histSection = document.getElementById('history-section');
    if (state.history.length > 0) {
        histSection.classList.remove('hidden');
        document.getElementById('row-history').innerHTML = state.history.map(m => `
            <div class="h-20 min-w-[200px] bg-zinc-900 rounded-lg flex items-center p-4 gap-4 cursor-pointer hover:bg-zinc-800 border border-white/5" onclick="openPlayer(${m.id}, '${m.title}')">
                <i class="fa-solid fa-play text-cyan-500"></i>
                <span class="text-sm font-medium truncate">${m.title}</span>
            </div>
        `).join('');
    }
}

function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('translate-x-full');
}

function setTheme(color) {
    document.documentElement.setAttribute('data-theme', color);
    state.theme = color;
}

// Instant Search Feature
document.getElementById('searchBar').addEventListener('input', async (e) => {
    const query = e.target.value;
    const resDiv = document.getElementById('searchResults');
    if (query.length < 3) return resDiv.classList.add('hidden');
    
    const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`);
    const data = await res.json();
    resDiv.classList.remove('hidden');
    resDiv.innerHTML = data.results.slice(0, 5).map(m => `
        <div class="flex items-center gap-4 p-3 hover:bg-white/5 cursor-pointer" onclick="openPlayer(${m.id}, '${m.title}')">
            <img src="${IMG_URL + m.poster_path}" class="w-10 h-14 object-cover rounded">
            <span class="text-sm font-bold">${m.title}</span>
        </div>
    `).join('');
});
