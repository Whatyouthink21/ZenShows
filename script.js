import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyCRwom-ZDQy_4AWX-8TknWzii_GVxw33hk",
    authDomain: "zenshows-c4255.firebaseapp.com",
    projectId: "zenshows-c4255",
    storageBucket: "zenshows-c4255.firebasestorage.app",
    messagingSenderId: "824547918366",
    appId: "1:824547918366:web:5b1ae5de7b083a2f77640f",
    measurementId: "G-268SWMN17W"
};

const TMDB_KEY = 'a45420333457411e78d5ad35d6c51a2d';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const HERO_URL = 'https://image.tmdb.org/t/p/original';

// --- INITIALIZE FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// --- STATE MANAGEMENT ---
let currentUser = null;
const sources = [
    "https://vidsrc.me/embed/movie?tmdb=",
    "https://vidsrc.to/embed/movie/",
    "https://embed.smashystream.com/playere.php?tmdb=",
    "https://2embed.org/e.php?tmdb=",
    "https://autoembed.to/movie/tmdb/",
    "https://multiembed.mov/directstream.php?video_id="
];

// --- DOM ELEMENTS ---
const trendingGrid = document.getElementById('trendingGrid');
const heroBg = document.getElementById('heroBg');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// --- 1. TMDB DATA FETCHING ---
async function fetchMovies(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}?api_key=${TMDB_KEY}`);
    const data = await res.json();
    return data.results;
}

// --- 2. RENDER CONTENT ---
async function initHome() {
    const trending = await fetchMovies('/trending/all/day');
    renderGrid(trending, trendingGrid);
    setupHero(trending[0]);
}

function renderGrid(movies, container) {
    container.innerHTML = movies.map(movie => `
        <div class="movie-card" onclick="openPlayer('${movie.id}', '${movie.media_type || 'movie'}')">
            <img src="${IMG_URL + movie.poster_path}" alt="${movie.title || movie.name}">
            <div class="card-overlay">
                <p>${movie.release_date ? movie.release_date.split('-')[0] : 'TV'}</p>
                <span>★ ${movie.vote_average.toFixed(1)}</span>
            </div>
        </div>
    `).join('');
}

function setupHero(movie) {
    heroBg.style.backgroundImage = `url(${HERO_URL + movie.backdrop_path})`;
    document.getElementById('heroTitle').innerText = movie.title || movie.name;
    document.getElementById('heroDesc').innerText = movie.overview.substring(0, 150) + "...";
    document.getElementById('heroPlayBtn').onclick = () => openPlayer(movie.id, 'movie');
}

// --- 3. VIDEO PLAYER & SOURCES ---
window.openPlayer = (id, type) => {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('videoIframe');
    const selector = document.getElementById('sourceSelect');
    
    modal.style.display = 'flex';
    
    const updateSource = (srcIndex) => {
        const baseUrl = sources[srcIndex];
        iframe.src = `${baseUrl}${id}`;
    };

    updateSource(0); // Default to Source 1
    selector.onchange = (e) => updateSource(e.target.value - 1);
    
    // Save to History in Firebase
    if(currentUser) saveToFirebase('history', id);
};

// --- 4. AUTHENTICATION ---
document.getElementById('loginBtn').onclick = () => {
    signInWithPopup(auth, provider).then((result) => {
        console.log("Logged in:", result.user);
    });
};

document.getElementById('logoutBtn').onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');
    if (user) {
        currentUser = user;
        loginBtn.classList.add('hidden');
        userProfile.classList.remove('hidden');
        document.getElementById('userAvatar').src = user.photoURL;
        document.getElementById('userName').innerText = user.displayName;
    } else {
        currentUser = null;
        loginBtn.classList.remove('hidden');
        userProfile.classList.add('hidden');
    }
});

// --- 5. FIREBASE STORAGE (Watchlist/History) ---
async function saveToFirebase(collectionName, id) {
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
        [collectionName]: arrayUnion(id)
    });
}

// --- 6. SEARCH LOGIC (Feature 4) ---
searchInput.oninput = async (e) => {
    const query = e.target.value;
    if (query.length < 3) {
        searchResults.classList.add('hidden');
        return;
    }
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${TMDB_KEY}&query=${query}`);
    const data = await res.json();
    
    searchResults.innerHTML = data.results.slice(0, 5).map(item => `
        <div class="search-item" onclick="openPlayer('${item.id}', '${item.media_type}')">
            <img src="${IMG_URL + item.poster_path}" width="40">
            <p>${item.title || item.name}</p>
        </div>
    `).join('');
    searchResults.classList.remove('hidden');
};

// --- 7. UI INTERACTIVITY ---
document.getElementById('hamburger').onclick = () => {
    document.getElementById('navLinks').classList.toggle('mobile-active');
};

document.getElementById('closePlayer').onclick = () => {
    document.getElementById('videoModal').style.display = 'none';
    document.getElementById('videoIframe').src = ''; // Stop playback
};

document.getElementById('openSettings').onclick = (e) => {
    e.preventDefault();
    document.getElementById('settingsModal').style.display = 'flex';
};

// Randomizer (Feature 35)
document.getElementById('randomBtn').onclick = async () => {
    const movies = await fetchMovies('/movie/popular');
    const random = movies[Math.floor(Math.random() * movies.length)];
    openPlayer(random.id, 'movie');
};

// Initialize
initHome();
