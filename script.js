// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCRwom-ZDQy_4AWX-8TknWzii_GVxw33hk",
  authDomain: "zenshows-c4255.firebaseapp.com",
  projectId: "zenshows-c4255",
  storageBucket: "zenshows-c4255.firebasestorage.app",
  messagingSenderId: "824547918366",
  appId: "1:824547918366:web:5b1ae5de7b083a2f77640f",
  measurementId: "G-268SWMN17W"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const storage = firebase.storage();
const db = firebase.firestore(); // For history if JSON in storage isn't enough

const TMDB_API_KEY = 'a45420333457411e78d5ad35d6c51a2d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const SOURCES = [
    'https://example-vidscr.com/embed/', // Example source 1 (replace with real)
    'https://embed1.example.com/', 
    'https://embed2.example.com/', 
    'https://embed3.example.com/', 
    'https://embed4.example.com/', 
    'https://embed5.example.com/'  // 6 sources for fallback
];
let currentSourceIndex = 0;
let userId = null;
let darkMode = false;
let watchlist = [];
let history = [];

// Auth Listeners
auth.onAuthStateChanged(user => {
    userId = user ? user.uid : null;
    document.getElementById('auth-link').style.display = user ? 'none' : 'block';
    document.getElementById('logout-link').style.display = user ? 'block' : 'none';
    if (user) loadUserData();
});

// Login/Register Functions
function showLogin() { document.getElementById('login-modal').style.display = 'block'; }
function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password).catch(err => console.error(err));
}
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password).catch(err => console.error(err));
}
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => console.error(err));
}
function logout() { auth.signOut(); }

// Load User Data from Firebase Storage/Firestore
async function loadUserData() {
    // Use Storage for JSON blobs
    const watchlistRef = storage.ref(`users/${userId}/watchlist.json`);
    watchlistRef.getDownloadURL().then(url => fetch(url).then(res => res.json()).then(data => watchlist = data)).catch(() => {});
    const historyRef = storage.ref(`users/${userId}/history.json`);
    historyRef.getDownloadURL().then(url => fetch(url).then(res => res.json()).then(data => history = data)).catch(() => {});
    populateContinueWatching();
    populateRecommendations();
}

// Save to Storage
async function saveWatchlist() {
    const blob = new Blob([JSON.stringify(watchlist)], {type: 'application/json'});
    storage.ref(`users/${userId}/watchlist.json`).put(blob);
}
async function saveHistory() {
    const blob = new Blob([JSON.stringify(history)], {type: 'application/json'});
    storage.ref(`users/${userId}/history.json`).put(blob);
}

// Hamburger Menu
function toggleMenu() {
    const menu = document.getElementById('nav-menu');
    menu.classList.toggle('menu-hidden');
}

// Dark Mode
function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
}
// Search with Autocomplete
async function searchContent() {
    const query = document.getElementById('search-input').value;
    if (query.length < 3) return;
    const results = await fetchTMDB(`/search/multi&query=${query}`);
    const dropdown = document.getElementById('search-results');
    dropdown.innerHTML = '';
    results.results.forEach(item => {
        if (item.media_type === 'movie' || item.media_type === 'tv') {
            const div = document.createElement('div');
            div.textContent = item.title || item.name;
            div.onclick = () => showContentDetail(item.id, item.media_type);
            dropdown.appendChild(div);
        }
    });
    dropdown.style.display = 'block';
}

// Populate Sections
async function populateGenres() {
    const genres = await fetchTMDB('/genre/movie/list');
    const container = document.querySelector('.genre-carousels');
    genres.genres.forEach(async genre => {
        const h3 = document.createElement('h3');
        h3.textContent = genre.name;
        container.appendChild(h3);
        const carousel = document.createElement('div');
        carousel.classList.add('carousel');
        const movies = await fetchTMDB(`/discover/movie&with_genres=${genre.id}`);
        movies.results.forEach(movie => {
            const img = document.createElement('img');
            img.src = `https://image.tmdb.org/t/p/w200${movie.poster_path}`;
            img.onclick = () => showContentDetail(movie.id, 'movie');
            carousel.appendChild(img);
        });
        container.appendChild(carousel);
    });
}
async function populateTrending() {
    const trending = await fetchTMDB('/trending/all/week');
    const carousel = document.querySelector('.trending-carousel');
    trending.results.forEach(item => {
        const img = document.createElement('img');
        img.src = `https://image.tmdb.org/t/p/w200${item.poster_path}`;
        img.onclick = () => showContentDetail(item.id, item.media_type);
        carousel.appendChild(img);
    });
}
async function populateNew() {
    const newReleases = await fetchTMDB('/movie/now_playing');
    const carousel = document.querySelector('.new-carousel');
    newReleases.results.forEach(movie => {
        const img = document.createElement('img');
        img.src = `https://image.tmdb.org/t/p/w200${movie.poster_path}`;
        img.onclick = () => showContentDetail(movie.id, 'movie');
        carousel.appendChild(img);
    });
}

// Content Detail
async function showContentDetail(id, type) {
    const detail = await fetchTMDB(`/${type}/${id}`);
    document.getElementById('detail-title').textContent = detail.title || detail.name;
    document.getElementById('detail-overview').textContent = detail.overview;
    document.getElementById('detail-poster').innerHTML = `<img src="https://image.tmdb.org/t/p/w500${detail.poster_path}">`;
    // Cast/Actors
    const credits = await fetchTMDB(`/${type}/${id}/credits`);
    const castDiv = document.getElementById('detail-cast');
    castDiv.innerHTML = '';
    credits.cast.slice(0,5).forEach(actor => {
        const span = document.createElement('span');
        span.textContent = actor.name;
        span.onclick = () => showActorDetail(actor.id);
        castDiv.appendChild(span);
    });
    // Player with multi-source
    const video = document.getElementById('video-player');
    video.src = SOURCES[currentSourceIndex] + id; // Mock embed, replace with real logic
    document.getElementById('content-detail').style.display = 'block';
    // Add to history
    history.push({id, type, timestamp: Date.now()});
    saveHistory();
}

function switchSource() {
    currentSourceIndex = (currentSourceIndex + 1) % SOURCES.length;
    document.getElementById('video-player').src = SOURCES[currentSourceIndex] + 'current-id'; // Update
}

// Actor Detail
async function showActorDetail(id) {
    const actor = await fetchTMDB(`/person/${id}`);
    document.getElementById('actor-name').textContent = actor.name;
    document.getElementById('actor-bio').textContent = actor.biography;
    const filmography = await fetchTMDB(`/person/${id}/movie_credits`);
    const carousel = document.getElementById('actor-filmography');
    carousel.innerHTML = '';
    filmography.cast.forEach(movie => {
        const img = document.createElement('img');
        img.src = `https://image.tmdb.org/t/p/w200${movie.poster_path}`;
        img.onclick = () => showContentDetail(movie.id, 'movie');
        carousel.appendChild(img);
    });
    document.getElementById('actor-detail').style.display = 'block';
}

// Watchlist
function addToWatchlist() {
    const currentItem = {id: 'current-id', type: 'movie'}; // From detail
    watchlist.push(currentItem);
    saveWatchlist();
}

// Continue Watching & Recs (simple history-based)
function populateContinueWatching() {
    const carousel = document.getElementById('continue-watching');
    history.slice(-5).forEach(item => {
        // Fetch and add img
    });
}
function populateRecommendations() {
    // Simple: based on last history genre
    // Fetch similar
}

// Social Shares
function shareOnX() { window.open('https://twitter.com/intent/tweet?text=Watching on ZenShows'); }
function shareOnFB() { window.open('https://www.facebook.com/sharer/sharer.php?u=' + location.href); }

// Init
populateGenres();
populateTrending();
populateNew();
// TMDB Fetch Helper
async function fetchTMDB(endpoint) {
    const res = await fetch(`${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}`);
    return res.json();
}
