// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRwom-ZDQy_4AWX-8TknWzii_GVxw33hk",
  authDomain: "zenshows-c4255.firebaseapp.com",
  projectId: "zenshows-c4255",
  storageBucket: "zenshows-c4255.firebasestorage.app",
  messagingSenderId: "824547918366",
  appId: "1:824547918366:web:5b1ae5de7b083a2f77640f",
  measurementId: "G-268SWMN17W"
};

// TMDB API Configuration
const TMDB_API_KEY = 'a45420333457411e78d5ad35d6c51a2d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/';

// Initialize Firebase
let app, auth, db, analytics, currentUser = null;

setTimeout(() => {
    const { initializeApp, getAuth, getFirestore, getAnalytics } = window.firebaseModules;
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    analytics = getAnalytics(app);
    initAuth();
}, 100);

// Global State
const state = {
    genres: [],
    currentMovie: null,
    currentPerson: null,
    watchHistory: [],
    continueWatching: [],
    watchlist: [],
    favorites: [],
    userRatings: {},
    settings: {
        autoplay: true,
        skipIntro: true,
        defaultQuality: 'auto',
        parentalControl: false,
        parentalPin: '',
        maxRating: 'R',
        notifications: { newReleases: true, watchlist: true }
    }
};

// DOM Elements
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const closeSidebar = document.getElementById('closeSidebar');
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const profileBtn = document.getElementById('profileBtn');
const profileMenu = document.getElementById('profileMenu');
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const settingsBtn = document.getElementById('settingsBtn');
const skeletonLoader = document.getElementById('skeletonLoader');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadTheme();
});

async function initializeApp() {
    try {
        skeletonLoader.style.display = 'block';
        await loadGenres();
        await loadMovies();
        loadLocalData();
        updateUI();
        skeletonLoader.style.display = 'none';
    } catch (error) {
        console.error('Initialization error:', error);
        skeletonLoader.style.display = 'none';
    }
}

// Auth Functions
function initAuth() {
    const { onAuthStateChanged } = window.firebaseModules;
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            document.getElementById('profileName').textContent = user.displayName || user.email.split('@')[0];
            document.getElementById('signedInMenu').style.display = 'block';
            document.getElementById('signedOutMenu').style.display = 'none';
            await loadUserData();
        } else {
            document.getElementById('profileName').textContent = 'Guest';
            document.getElementById('signedInMenu').style.display = 'none';
            document.getElementById('signedOutMenu').style.display = 'block';
        }
        updateUI();
    });
}

async function signIn(email, password) {
    try {
        const { signInWithEmailAndPassword } = window.firebaseModules;
        await signInWithEmailAndPassword(auth, email, password);
        closeModal('signInModal');
        showNotification('Welcome back!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function signUp(name, email, password) {
    try {
        const { createUserWithEmailAndPassword, updateProfile } = window.firebaseModules;
        const { setDoc, doc } = window.firebaseModules;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            name: name,
            email: email,
            createdAt: new Date(),
            watchlist: [],
            favorites: [],
            watchHistory: [],
            continueWatching: [],
            settings: state.settings
        });
        closeModal('signUpModal');
        showNotification('Account created successfully!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function signOutUser() {
    try {
        const { signOut } = window.firebaseModules;
        await signOut(auth);
        state.watchlist = [];
        state.favorites = [];
        state.watchHistory = [];
        state.continueWatching = [];
        updateUI();
        showNotification('Signed out successfully', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function loadUserData() {
    if (!currentUser) return;
    try {
        const { getDoc, doc } = window.firebaseModules;
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            state.watchlist = data.watchlist || [];
            state.favorites = data.favorites || [];
            state.watchHistory = data.watchHistory || [];
            state.continueWatching = data.continueWatching || [];
            state.settings = { ...state.settings, ...data.settings };
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function saveUserData(field, value) {
    if (!currentUser) {
        saveLocalData();
        return;
    }
    try {
        const { updateDoc, doc } = window.firebaseModules;
        await updateDoc(doc(db, 'users', currentUser.uid), { [field]: value });
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

function saveLocalData() {
    localStorage.setItem('zenshows_watchlist', JSON.stringify(state.watchlist));
    localStorage.setItem('zenshows_favorites', JSON.stringify(state.favorites));
    localStorage.setItem('zenshows_history', JSON.stringify(state.watchHistory));
    localStorage.setItem('zenshows_continue', JSON.stringify(state.continueWatching));
    localStorage.setItem('zenshows_settings', JSON.stringify(state.settings));
}

function loadLocalData() {
    if (currentUser) return;
    state.watchlist = JSON.parse(localStorage.getItem('zenshows_watchlist') || '[]');
    state.favorites = JSON.parse(localStorage.getItem('zenshows_favorites') || '[]');
    state.watchHistory = JSON.parse(localStorage.getItem('zenshows_history') || '[]');
    state.continueWatching = JSON.parse(localStorage.getItem('zenshows_continue') || '[]');
    const savedSettings = localStorage.getItem('zenshows_settings');
    if (savedSettings) {
        state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
    }
}

// TMDB API Functions
async function fetchTMDB(endpoint) {
    const response = await fetch(`${TMDB_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`);
    return response.json();
}

async function loadGenres() {
    const data = await fetchTMDB('/genre/movie/list');
    state.genres = data.genres;
    renderGenres();
}

async function loadMovies() {
    await Promise.all([
        loadTrending(),
        loadTopRated(),
        loadRecent(),
        loadHero(),
        loadUpcoming()
    ]);
}

async function loadTrending() {
    const data = await fetchTMDB('/trending/movie/week');
    renderCarousel('trendingCarousel', data.results);
}

async function loadTopRated() {
    const data = await fetchTMDB('/movie/top_rated');
    renderCarousel('topRatedCarousel', data.results);
}

async function loadRecent() {
    const data = await fetchTMDB('/movie/now_playing');
    renderCarousel('recentCarousel', data.results);
}

async function loadUpcoming() {
    const data = await fetchTMDB('/movie/upcoming');
    renderCalendar(data.results);
}

async function loadHero() {
    const data = await fetchTMDB('/movie/popular');
    if (data.results && data.results.length > 0) {
        const movie = data.results[0];
        displayHero(movie);
    }
}

async function searchMovies(query) {
    if (!query.trim()) {
        await loadMovies();
        return;
    }
    const data = await fetchTMDB(`/search/movie?query=${encodeURIComponent(query)}`);
    clearCarousels();
    if (data.results && data.results.length > 0) {
        renderCarousel('trendingCarousel', data.results);
        document.querySelector('#trendingCarousel').parentElement.querySelector('.section-title').textContent = `Search Results for "${query}"`;
    }
}

async function getMovieDetails(movieId) {
    const [movie, credits] = await Promise.all([
        fetchTMDB(`/movie/${movieId}?append_to_response=videos`),
        fetchTMDB(`/movie/${movieId}/credits`)
    ]);
    return { ...movie, credits };
}

async function getPersonDetails(personId) {
    const [person, credits] = await Promise.all([
        fetchTMDB(`/person/${personId}`),
        fetchTMDB(`/person/${personId}/movie_credits`)
    ]);
    return { ...person, credits };
}
// UI Rendering Functions
function displayHero(movie) {
    const heroSection = document.getElementById('heroSection');
    const backdropUrl = `${TMDB_IMG_BASE}original${movie.backdrop_path}`;
    heroSection.style.backgroundImage = `url(${backdropUrl})`;
    heroSection.querySelector('.hero-title').textContent = movie.title;
    heroSection.querySelector('.hero-overview').textContent = movie.overview;
    document.getElementById('heroRating').textContent = movie.vote_average.toFixed(1);
    document.getElementById('heroYear').textContent = movie.release_date?.split('-')[0] || 'N/A';
    
    const heroPlayBtn = document.getElementById('heroPlayBtn');
    heroPlayBtn.onclick = () => playMovie(movie.id);
    
    const heroWatchlistBtn = document.getElementById('heroWatchlistBtn');
    updateWatchlistButton(heroWatchlistBtn, movie.id);
    heroWatchlistBtn.onclick = () => toggleWatchlist(movie.id);
    
    const heroInfoBtn = document.getElementById('heroInfoBtn');
    heroInfoBtn.onclick = () => showMovieDetails(movie.id);
}

function renderGenres() {
    const genreList = document.getElementById('genreList');
    genreList.innerHTML = state.genres.map(genre => 
        `<a href="#genre-${genre.id}" class="sidebar-item genre-item" data-genre="${genre.id}">
            ${genre.name}
        </a>`
    ).join('');
    
    document.querySelectorAll('.genre-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const genreId = item.dataset.genre;
            await loadGenreMovies(genreId);
        });
    });
}

async function loadGenreMovies(genreId) {
    const data = await fetchTMDB(`/discover/movie?with_genres=${genreId}`);
    clearCarousels();
    const genre = state.genres.find(g => g.id == genreId);
    renderCarousel('trendingCarousel', data.results);
    document.querySelector('#trendingCarousel').parentElement.querySelector('.section-title').textContent = genre.name;
}

function renderCarousel(carouselId, movies) {
    const carousel = document.getElementById(carouselId);
    carousel.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
    addCardListeners(carousel);
}

function createMovieCard(movie) {
    const posterUrl = movie.poster_path 
        ? `${TMDB_IMG_BASE}w500${movie.poster_path}` 
        : 'https://via.placeholder.com/500x750?text=No+Image';
    
    const isFavorite = state.favorites.includes(movie.id);
    const isInWatchlist = state.watchlist.includes(movie.id);
    
    return `
        <div class="movie-card" data-movie-id="${movie.id}">
            <img src="${posterUrl}" alt="${movie.title}" class="movie-poster">
            <div class="movie-overlay">
                <h3 class="movie-card-title">${movie.title}</h3>
                <div class="movie-card-meta">
                    <span><i class="fas fa-star"></i> ${movie.vote_average.toFixed(1)}</span>
                    <span>${movie.release_date?.split('-')[0] || 'N/A'}</span>
                </div>
                <div class="movie-card-actions">
                    <button class="card-btn play-card-btn" title="Play">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="card-btn watchlist-card-btn ${isInWatchlist ? 'active' : ''}" title="Watchlist">
                        <i class="fas ${isInWatchlist ? 'fa-check' : 'fa-plus'}"></i>
                    </button>
                    <button class="card-btn favorite-card-btn ${isFavorite ? 'active' : ''}" title="Favorite">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="card-btn info-card-btn" title="More Info">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
            ${movie.progress ? `<div class="progress-bar"><div class="progress-fill" style="width: ${movie.progress}%"></div></div>` : ''}
        </div>
    `;
}

function addCardListeners(carousel) {
    carousel.querySelectorAll('.movie-card').forEach(card => {
        const movieId = parseInt(card.dataset.movieId);
        
        card.querySelector('.play-card-btn').onclick = (e) => {
            e.stopPropagation();
            playMovie(movieId);
        };
        
        card.querySelector('.watchlist-card-btn').onclick = (e) => {
            e.stopPropagation();
            toggleWatchlist(movieId);
        };
        
        card.querySelector('.favorite-card-btn').onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(movieId);
        };
        
        card.querySelector('.info-card-btn').onclick = (e) => {
            e.stopPropagation();
            showMovieDetails(movieId);
        };
    });
}

function renderCalendar(movies) {
    const calendarGrid = document.getElementById('calendarGrid');
    const grouped = {};
    
    movies.forEach(movie => {
        const date = movie.release_date;
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(movie);
    });
    
    calendarGrid.innerHTML = Object.entries(grouped).map(([date, movies]) => `
        <div class="calendar-day">
            <div class="calendar-date">${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            <div class="calendar-movies">
                ${movies.map(m => `
                    <div class="calendar-movie" data-movie-id="${m.id}">
                        <img src="${TMDB_IMG_BASE}w200${m.poster_path}" alt="${m.title}">
                        <span>${m.title}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    calendarGrid.querySelectorAll('.calendar-movie').forEach(el => {
        el.onclick = () => showMovieDetails(parseInt(el.dataset.movieId));
    });
}

async function showMovieDetails(movieId) {
    const movie = await getMovieDetails(movieId);
    state.currentMovie = movie;
    
    const modal = document.getElementById('movieModal');
    const backdropUrl = movie.backdrop_path ? `${TMDB_IMG_BASE}original${movie.backdrop_path}` : '';
    
    modal.querySelector('.movie-backdrop').style.backgroundImage = `url(${backdropUrl})`;
    modal.querySelector('.movie-title').textContent = movie.title;
    modal.querySelector('.rating-value').textContent = movie.vote_average.toFixed(1);
    modal.querySelector('.movie-year').textContent = movie.release_date?.split('-')[0] || 'N/A';
    modal.querySelector('.movie-runtime').textContent = `${movie.runtime} min`;
    modal.querySelector('.movie-lang').textContent = movie.original_language.toUpperCase();
    modal.querySelector('.movie-overview').textContent = movie.overview;
    
    const genresHtml = movie.genres.map(g => `<span class="genre-tag">${g.name}</span>`).join('');
    modal.querySelector('.movie-genres').innerHTML = genresHtml;
    
    const cast = movie.credits.cast.slice(0, 6);
    const castHtml = cast.map(person => `
        <div class="cast-member" data-person-id="${person.id}">
            <img src="${person.profile_path ? TMDB_IMG_BASE + 'w200' + person.profile_path : 'https://via.placeholder.com/200x300?text=No+Image'}" alt="${person.name}">
            <div>
                <div class="cast-name">${person.name}</div>
                <div class="cast-character">${person.character}</div>
            </div>
        </div>
    `).join('');
    modal.querySelector('.cast-list').innerHTML = castHtml;
    
    const crew = movie.credits.crew.filter(c => ['Director', 'Writer', 'Producer'].includes(c.job)).slice(0, 4);
    const crewHtml = crew.map(person => `
        <div class="crew-member" data-person-id="${person.id}">
            <img src="${person.profile_path ? TMDB_IMG_BASE + 'w200' + person.profile_path : 'https://via.placeholder.com/200x300?text=No+Image'}" alt="${person.name}">
            <div>
                <div class="crew-name">${person.name}</div>
                <div class="crew-job">${person.job}</div>
            </div>
        </div>
    `).join('');
    modal.querySelector('.crew-list').innerHTML = crewHtml;
    
    modal.querySelectorAll('.cast-member, .crew-member').forEach(el => {
        el.onclick = () => showPersonDetails(parseInt(el.dataset.personId));
    });
    
    const playBtn = modal.querySelector('.play-btn');
    playBtn.onclick = () => {
        closeModal('movieModal');
        playMovie(movieId);
    };
    
    updateModalButtons(modal, movieId);
    openModal('movieModal');
}

async function showPersonDetails(personId) {
    const person = await getPersonDetails(personId);
    state.currentPerson = person;
    
    const modal = document.getElementById('personModal');
    const imageUrl = person.profile_path ? `${TMDB_IMG_BASE}w500${person.profile_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
    
    modal.querySelector('.person-image').src = imageUrl;
    modal.querySelector('.person-name').textContent = person.name;
    modal.querySelector('.person-role').textContent = person.known_for_department;
    modal.querySelector('.person-bio').textContent = person.biography || 'No biography available.';
    modal.querySelector('.person-birthday').textContent = person.birthday || 'N/A';
    modal.querySelector('.person-birthplace').textContent = person.place_of_birth || 'N/A';
    
    const movies = person.credits.cast.slice(0, 8);
    const moviesHtml = movies.map(m => `
        <div class="person-movie" data-movie-id="${m.id}">
            <img src="${m.poster_path ? TMDB_IMG_BASE + 'w200' + m.poster_path : 'https://via.placeholder.com/200x300?text=No+Image'}" alt="${m.title}">
            <span>${m.title}</span>
        </div>
    `).join('');
    modal.querySelector('.person-movies').innerHTML = moviesHtml;
    
    modal.querySelectorAll('.person-movie').forEach(el => {
        el.onclick = () => {
            closeModal('personModal');
            showMovieDetails(parseInt(el.dataset.movieId));
        };
    });
    
    openModal('personModal');
}

function playMovie(movieId) {
    const modal = document.getElementById('playerModal');
    const iframe = document.getElementById('playerFrame');
    
    iframe.src = `https://vidsrc.xyz/embed/movie/${movieId}`;
    
    document.querySelectorAll('.source-btn').forEach((btn, idx) => {
        btn.onclick = () => {
            document.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const sources = [
                `https://vidsrc.xyz/embed/movie/${movieId}`,
                `https://www.2embed.cc/embed/${movieId}`,
                `https://vidsrc.me/embed/movie?tmdb=${movieId}`,
                `https://moviesapi.club/movie/${movieId}`,
                `https://vidsrc.pm/embed/movie/${movieId}`,
                `https://embed.su/embed/movie/${movieId}`
            ];
            iframe.src = sources[idx];
        };
    });
    
    addToWatchHistory(movieId);
    addToContinueWatching(movieId, 0);
    openModal('playerModal');
}

// List Management Functions
function toggleWatchlist(movieId) {
    const idx = state.watchlist.indexOf(movieId);
    if (idx > -1) {
        state.watchlist.splice(idx, 1);
    } else {
        state.watchlist.push(movieId);
    }
    saveUserData('watchlist', state.watchlist);
    updateUI();
    showNotification(idx > -1 ? 'Removed from watchlist' : 'Added to watchlist', 'success');
}

function toggleFavorite(movieId) {
    const idx = state.favorites.indexOf(movieId);
    if (idx > -1) {
        state.favorites.splice(idx, 1);
    } else {
        state.favorites.push(movieId);
    }
    saveUserData('favorites', state.favorites);
    updateUI();
    showNotification(idx > -1 ? 'Removed from favorites' : 'Added to favorites', 'success');
}

function addToWatchHistory(movieId) {
    const idx = state.watchHistory.indexOf(movieId);
    if (idx > -1) state.watchHistory.splice(idx, 1);
    state.watchHistory.unshift(movieId);
    if (state.watchHistory.length > 50) state.watchHistory = state.watchHistory.slice(0, 50);
    saveUserData('watchHistory', state.watchHistory);
}

function addToContinueWatching(movieId, progress) {
    const existing = state.continueWatching.find(item => item.id === movieId);
    if (existing) {
        existing.progress = progress;
        existing.lastWatched = new Date();
    } else {
        state.continueWatching.unshift({ id: movieId, progress, lastWatched: new Date() });
    }
    if (state.continueWatching.length > 20) state.continueWatching = state.continueWatching.slice(0, 20);
    saveUserData('continueWatching', state.continueWatching);
}

// Continue in next comment...
