// CONFIGURATION
const API_KEY = '60defb38119575da952b28d206871c1b';
const firebaseConfig = { /* PASTE YOUR FIREBASE CONFIG HERE */ };
// firebase.initializeApp(firebaseConfig);
// const db = firebase.firestore();

let currentID = null;
let currentType = 'movie';

// INITIAL LOAD
window.onload = () => {
    fetchCategory('trending');
    populateFilters();
    checkWatchlist();
};

async function fetchCategory(type) {
    let url = `${BASE()}/trending/all/week?api_key=${API_KEY}`;
    if(type === 'top_rated') url = `${BASE()}/movie/top_rated?api_key=${API_KEY}`;
    if(type === 'upcoming') url = `${BASE()}/movie/upcoming?api_key=${API_KEY}`;
    
    const res = await fetch(url);
    const data = await res.json();
    renderGrid(data.results, 'movieGrid');
}

function renderGrid(movies, target) {
    const grid = document.getElementById(target);
    grid.innerHTML = movies.map(m => `
        <div class="movie-card" onclick="openDetails(${m.id}, '${m.media_type || 'movie'}')">
            <img src="https://image.tmdb.org/t/p/w500${m.poster_path}" alt="${m.title}">
            <div class="progress-container"><div class="progress-fill" style="width:${getProgress(m.id)}%"></div></div>
            <div class="card-overlay">
                <h3>${m.title || m.name}</h3>
                <span>${m.vote_average.toFixed(1)}</span>
            </div>
        </div>
    `).join('');
}

async function openDetails(id, type) {
    currentID = id;
    currentType = type;
    document.getElementById('playerModal').style.display = 'flex';
    
    const res = await fetch(`${BASE()}/${type}/${id}?api_key=${API_KEY}&append_to_response=videos,credits,similar`);
    const data = await res.json();
    
    document.getElementById('mTitle').innerText = data.title || data.name;
    document.getElementById('mTmdb').innerHTML = `<i class="fas fa-star"></i> ${Math.round(data.vote_average * 10)}%`;
    
    showDetailTab('overview', data);
    switchServer('vidsrc');
    saveProgress(id, 10); // Example: Started watching
}

function switchServer(src) {
    const container = document.getElementById('videoContainer');
    const urls = {
        vidsrc: `https://vidsrc.me/embed/${currentType}?tmdb=${currentID}`,
        bidsrc: `https://vidsrc.cc/v2/embed/${currentType}/${currentID}`,
        cinema: `https://multiembed.mov/directstream.php?video_id=${currentID}&tmdb=1`
    };
    container.innerHTML = `<iframe src="${urls[src]}" allowfullscreen></iframe>`;
}

// PERSON/FILMOGRAPHY LOGIC
async function viewActor(personId) {
    const res = await fetch(`${BASE()}/person/${personId}/combined_credits?api_key=${API_KEY}`);
    const data = await res.json();
    renderGrid(data.cast.slice(0, 20), 'movieGrid');
    closeModal();
}

function toggleTheme() {
    const root = document.documentElement;
    const isDark = root.getAttribute('data-theme') === 'dark';
    root.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.getElementById('themeToggle').innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function BASE() { return 'https://api.themoviedb.org/3'; }
function getProgress(id) { return localStorage.getItem(`prog_${id}`) || 0; }
function saveProgress(id, val) { localStorage.setItem(`prog_${id}`, val); }
function closeModal() { document.getElementById('playerModal').style.display = 'none'; }

