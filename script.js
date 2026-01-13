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

// TMDB Config
const TMDB_KEY = 'a45420333457411e78d5ad35d6c51a2d';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/';

// Global Variables
let app, auth, db, currentUser = null;
const state = {
    genres: [],
    currentMovie: null,
    watchlist: [],
    favorites: [],
    history: [],
    continueWatching: [],
    settings: { autoplay: true, skipIntro: true, defaultQuality: 'auto', parental: false, pin: '' }
};

// Initialize Firebase
setTimeout(() => {
    const { initializeApp, getAuth, getFirestore, getAnalytics } = window.firebaseModules;
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    getAnalytics(app);
    initAuth();
}, 100);

// Init App
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadTheme();
    initApp();
});

async function initApp() {
    try {
        await loadGenres();
        await Promise.all([loadTrending(), loadTopRated(), loadRecent(), loadHero(), loadCalendar()]);
        loadLocalData();
        updateUI();
        hideLoading();
    } catch (error) {
        console.error('Init error:', error);
        hideLoading();
    }
}

function hideLoading() {
    const loader = document.getElementById('loadingScreen');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.style.display = 'none', 500);
    }
}

// Auth Functions
function initAuth() {
    const { onAuthStateChanged } = window.firebaseModules;
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            document.getElementById('profileName').textContent = user.displayName || user.email.split('@')[0];
            document.getElementById('profileImage').src = user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`;
            document.getElementById('menuProfileImage').src = user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`;
            document.getElementById('menuProfileName').textContent = user.displayName || 'User';
            document.getElementById('menuProfileEmail').textContent = user.email;
            document.getElementById('signedInMenu').style.display = 'block';
            document.getElementById('signedOutMenu').style.display = 'none';
            await loadUserData();
        } else {
            document.getElementById('profileName').textContent = 'Guest';
            document.getElementById('profileImage').src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest';
            document.getElementById('signedInMenu').style.display = 'none';
            document.getElementById('signedOutMenu').style.display = 'block';
        }
        updateUI();
    });
}

async function signInWithGoogle() {
    try {
        const { GoogleAuthProvider, signInWithPopup } = window.firebaseModules;
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        showNotification('Signed in successfully!', 'success');
    } catch (error) {
        console.error('Sign in error:', error);
        showNotification('Sign in failed: ' + error.message, 'error');
    }
}

async function signOutUser() {
    try {
        const { signOut } = window.firebaseModules;
        await signOut(auth);
        state.watchlist = [];
        state.favorites = [];
        state.history = [];
        state.continueWatching = [];
        updateUI();
        showNotification('Signed out successfully', 'success');
    } catch (error) {
        showNotification('Sign out failed', 'error');
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
            state.history = data.history || [];
            state.continueWatching = data.continueWatching || [];
            state.settings = { ...state.settings, ...data.settings };
        }
    } catch (error) {
        console.error('Load user data error:', error);
    }
}

async function saveUserData(field, value) {
    if (!currentUser) {
        saveLocalData();
        return;
    }
    try {
        const { updateDoc, doc, setDoc } = window.firebaseModules;
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { [field]: value }).catch(async () => {
            await setDoc(userRef, { [field]: value }, { merge: true });
        });
    } catch (error) {
        console.error('Save user data error:', error);
    }
}

function saveLocalData() {
    localStorage.setItem('watchlist', JSON.stringify(state.watchlist));
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
    localStorage.setItem('history', JSON.stringify(state.history));
    localStorage.setItem('continueWatching', JSON.stringify(state.continueWatching));
    localStorage.setItem('settings', JSON.stringify(state.settings));
}

function loadLocalData() {
    if (currentUser) return;
    state.watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    state.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    state.history = JSON.parse(localStorage.getItem('history') || '[]');
    state.continueWatching = JSON.parse(localStorage.getItem('continueWatching') || '[]');
    const saved = localStorage.getItem('settings');
    if (saved) state.settings = { ...state.settings, ...JSON.parse(saved) };
}

// TMDB API Functions
async function fetchTMDB(endpoint) {
    const url = `${TMDB_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_KEY}`;
    const response = await fetch(url);
    return response.json();
}

async function loadGenres() {
    const data = await fetchTMDB('/genre/movie/list');
    state.genres = data.genres || [];
    const genreList = document.getElementById('genreList');
    genreList.innerHTML = state.genres.map(g => 
        `<a href="#" class="sidebar-item" data-genre="${g.id}">${g.name}</a>`
    ).join('');
    
    document.querySelectorAll('[data-genre]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            loadGenreMovies(el.dataset.genre);
            closeSidebar();
        });
    });
}

async function loadGenreMovies(genreId) {
    const data = await fetchTMDB(`/discover/movie?with_genres=${genreId}`);
    const genre = state.genres.find(g => g.id == genreId);
    document.getElementById('trendingSection').querySelector('.section-title').innerHTML = 
        `<i class="fas fa-film"></i> ${genre ? genre.name : 'Movies'}`;
    renderCarousel('trendingCarousel', data.results || []);
    scrollToSection('trendingSection');
}

async function loadTrending() {
    const data = await fetchTMDB('/trending/movie/week');
    renderCarousel('trendingCarousel', data.results || []);
}

async function loadTopRated() {
    const data = await fetchTMDB('/movie/top_rated');
    renderCarousel('topRatedCarousel', data.results || []);
}

async function loadRecent() {
    const data = await fetchTMDB('/movie/now_playing');
    renderCarousel('recentCarousel', data.results || []);
}

async function loadHero() {
    const data = await fetchTMDB('/movie/popular');
    if (data.results && data.results.length > 0) {
        const movie = data.results[0];
        displayHero(movie);
    }
}

async function loadCalendar() {
    const data = await fetchTMDB('/movie/upcoming');
    renderCalendar(data.results || []);
}

function displayHero(movie) {
    const backdropUrl = movie.backdrop_path ? `${IMG_BASE}original${movie.backdrop_path}` : '';
    document.getElementById('heroBackdrop').style.backgroundImage = `url(${backdropUrl})`;
    document.getElementById('heroTitle').textContent = movie.title || 'Movie Title';
    document.getElementById('heroOverview').textContent = movie.overview || '';
    document.getElementById('heroRating').textContent = (movie.vote_average || 0).toFixed(1);
    document.getElementById('heroYear').textContent = movie.release_date ? movie.release_date.split('-')[0] : '2024';
    document.getElementById('heroRuntime').textContent = '120 min';
    
    document.getElementById('heroPlayBtn').onclick = () => playMovie(movie.id);
    document.getElementById('heroWatchlistBtn').onclick = () => toggleWatchlist(movie.id);
    document.getElementById('heroInfoBtn').onclick = () => showMovieDetails(movie.id);
}

async function searchMovies(query) {
    if (!query.trim()) {
        await initApp();
        return;
    }
    const data = await fetchTMDB(`/search/movie?query=${encodeURIComponent(query)}`);
    document.getElementById('trendingSection').querySelector('.section-title').innerHTML = 
        `<i class="fas fa-search"></i> Search Results: "${query}"`;
    renderCarousel('trendingCarousel', data.results || []);
    scrollToSection('trendingSection');
}
// UI Rendering
function renderCarousel(id, movies) {
    const carousel = document.getElementById(id);
    if (!carousel) return;
    carousel.innerHTML = movies.map(m => createMovieCard(m)).join('');
    addCardListeners(carousel);
}

function createMovieCard(movie) {
    const poster = movie.poster_path ? `${IMG_BASE}w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
    const isFav = state.favorites.includes(movie.id);
    const isWatch = state.watchlist.includes(movie.id);
    const cont = state.continueWatching.find(c => c.id === movie.id);
    const progress = cont ? cont.progress : 0;
    
    return `
        <div class="movie-card" data-id="${movie.id}">
            <img src="${poster}" alt="${movie.title}" class="movie-poster">
            <div class="movie-overlay">
                <h3 class="movie-card-title">${movie.title}</h3>
                <div class="movie-card-meta">
                    <span><i class="fas fa-star"></i> ${(movie.vote_average || 0).toFixed(1)}</span>
                    <span>${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                </div>
                <div class="movie-card-actions">
                    <button class="card-btn play-btn" title="Play"><i class="fas fa-play"></i></button>
                    <button class="card-btn watchlist-btn ${isWatch ? 'active' : ''}" title="Watchlist"><i class="fas ${isWatch ? 'fa-check' : 'fa-plus'}"></i></button>
                    <button class="card-btn favorite-btn ${isFav ? 'active' : ''}" title="Favorite"><i class="fas fa-heart"></i></button>
                    <button class="card-btn info-btn" title="Info"><i class="fas fa-info-circle"></i></button>
                </div>
            </div>
            ${progress > 0 ? `<div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>` : ''}
        </div>
    `;
}

function addCardListeners(carousel) {
    carousel.querySelectorAll('.movie-card').forEach(card => {
        const id = parseInt(card.dataset.id);
        card.querySelector('.play-btn').onclick = (e) => { e.stopPropagation(); playMovie(id); };
        card.querySelector('.watchlist-btn').onclick = (e) => { e.stopPropagation(); toggleWatchlist(id); };
        card.querySelector('.favorite-btn').onclick = (e) => { e.stopPropagation(); toggleFavorite(id); };
        card.querySelector('.info-btn').onclick = (e) => { e.stopPropagation(); showMovieDetails(id); };
    });
}

function renderCalendar(movies) {
    const grid = document.getElementById('calendarGrid');
    const grouped = {};
    movies.forEach(m => {
        const date = m.release_date || '2024-01-01';
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(m);
    });
    grid.innerHTML = Object.entries(grouped).slice(0, 10).map(([date, mvs]) => `
        <div class="calendar-day">
            <div class="calendar-date">${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            <div class="calendar-movies">
                ${mvs.map(m => `
                    <div class="calendar-movie" data-id="${m.id}">
                        <img src="${m.poster_path ? IMG_BASE + 'w200' + m.poster_path : 'https://via.placeholder.com/200x300'}" alt="${m.title}">
                        <span>${m.title}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    grid.querySelectorAll('.calendar-movie').forEach(el => {
        el.onclick = () => showMovieDetails(parseInt(el.dataset.id));
    });
}

async function showMovieDetails(movieId) {
    const [movie, credits] = await Promise.all([
        fetchTMDB(`/movie/${movieId}`),
        fetchTMDB(`/movie/${movieId}/credits`)
    ]);
    
    const backdrop = movie.backdrop_path ? `${IMG_BASE}original${movie.backdrop_path}` : '';
    document.getElementById('movieBackdrop').style.backgroundImage = `url(${backdrop})`;
    document.getElementById('movieTitle').textContent = movie.title;
    document.getElementById('movieRating').textContent = (movie.vote_average || 0).toFixed(1);
    document.getElementById('movieYear').textContent = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    document.getElementById('movieRuntime').textContent = `${movie.runtime || 0} min`;
    document.getElementById('movieOverview').textContent = movie.overview || 'No overview available.';
    
    document.getElementById('movieGenres').innerHTML = (movie.genres || []).map(g => 
        `<span class="genre-tag">${g.name}</span>`
    ).join('');
    
    const cast = (credits.cast || []).slice(0, 6);
    document.getElementById('castList').innerHTML = cast.map(p => `
        <div class="cast-member" data-id="${p.id}">
            <img src="${p.profile_path ? IMG_BASE + 'w200' + p.profile_path : 'https://via.placeholder.com/200x300'}" alt="${p.name}">
            <div class="cast-name">${p.name}</div>
            <div class="cast-character">${p.character}</div>
        </div>
    `).join('');
    
    const crew = (credits.crew || []).filter(c => ['Director', 'Writer', 'Producer'].includes(c.job)).slice(0, 4);
    document.getElementById('crewList').innerHTML = crew.map(p => `
        <div class="crew-member" data-id="${p.id}">
            <img src="${p.profile_path ? IMG_BASE + 'w200' + p.profile_path : 'https://via.placeholder.com/200x300'}" alt="${p.name}">
            <div class="crew-name">${p.name}</div>
            <div class="crew-job">${p.job}</div>
        </div>
    `).join('');
    
    document.querySelectorAll('.cast-member, .crew-member').forEach(el => {
        el.onclick = () => showPersonDetails(parseInt(el.dataset.id));
    });
    
    document.getElementById('modalPlayBtn').onclick = () => { closeModal('movieModal'); playMovie(movieId); };
    document.getElementById('modalWatchlistBtn').onclick = () => toggleWatchlist(movieId);
    document.getElementById('modalFavoriteBtn').onclick = () => toggleFavorite(movieId);
    
    updateModalButtons(movieId);
    openModal('movieModal');
}

async function showPersonDetails(personId) {
    const [person, credits] = await Promise.all([
        fetchTMDB(`/person/${personId}`),
        fetchTMDB(`/person/${personId}/movie_credits`)
    ]);
    
    document.getElementById('personImage').src = person.profile_path ? `${IMG_BASE}w500${person.profile_path}` : 'https://via.placeholder.com/500x750';
    document.getElementById('personName').textContent = person.name;
    document.getElementById('personRole').textContent = person.known_for_department || 'Actor';
    document.getElementById('personBio').textContent = person.biography || 'No biography available.';
    document.getElementById('personBirthday').textContent = person.birthday || 'N/A';
    document.getElementById('personBirthplace').textContent = person.place_of_birth || 'N/A';
    
    const movies = (credits.cast || []).slice(0, 8);
    document.getElementById('personMovies').innerHTML = movies.map(m => `
        <div class="person-movie" data-id="${m.id}">
            <img src="${m.poster_path ? IMG_BASE + 'w200' + m.poster_path : 'https://via.placeholder.com/200x300'}" alt="${m.title}">
            <span>${m.title}</span>
        </div>
    `).join('');
    
    document.querySelectorAll('.person-movie').forEach(el => {
        el.onclick = () => { closeModal('personModal'); showMovieDetails(parseInt(el.dataset.id)); };
    });
    
    openModal('personModal');
}

function playMovie(movieId) {
    const sources = [
        `https://vidsrc.xyz/embed/movie/${movieId}`,
        `https://www.2embed.cc/embed/${movieId}`,
        `https://vidsrc.me/embed/movie?tmdb=${movieId}`,
        `https://moviesapi.club/movie/${movieId}`,
        `https://vidsrc.pm/embed/movie/${movieId}`,
        `https://embed.su/embed/movie/${movieId}`
    ];
    
    document.getElementById('playerFrame').src = sources[0];
    
    document.querySelectorAll('.source-btn').forEach((btn, idx) => {
        btn.onclick = () => {
            document.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('playerFrame').src = sources[idx];
        };
    });
    
    addToHistory(movieId);
    addToContinue(movieId, 10);
    openModal('playerModal');
}

function toggleWatchlist(id) {
    const idx = state.watchlist.indexOf(id);
    if (idx > -1) state.watchlist.splice(idx, 1);
    else state.watchlist.push(id);
    saveUserData('watchlist', state.watchlist);
    updateUI();
    showNotification(idx > -1 ? 'Removed from watchlist' : 'Added to watchlist', 'success');
}

function toggleFavorite(id) {
    const idx = state.favorites.indexOf(id);
    if (idx > -1) state.favorites.splice(idx, 1);
    else state.favorites.push(id);
    saveUserData('favorites', state.favorites);
    updateUI();
    showNotification(idx > -1 ? 'Removed from favorites' : 'Added to favorites', 'success');
}

function addToHistory(id) {
    const idx = state.history.indexOf(id);
    if (idx > -1) state.history.splice(idx, 1);
    state.history.unshift(id);
    if (state.history.length > 50) state.history = state.history.slice(0, 50);
    saveUserData('history', state.history);
}

function addToContinue(id, progress) {
    const existing = state.continueWatching.find(c => c.id === id);
    if (existing) existing.progress = progress;
    else state.continueWatching.unshift({ id, progress });
    if (state.continueWatching.length > 20) state.continueWatching = state.continueWatching.slice(0, 20);
    saveUserData('continueWatching', state.continueWatching);
}

async function updateUI() {
    if (state.continueWatching.length > 0) {
        document.getElementById('continueWatchingSection').style.display = 'block';
        const movies = await Promise.all(state.continueWatching.map(c => fetchTMDB(`/movie/${c.id}`).then(m => ({ ...m, progress: c.progress }))));
        renderCarousel('continueWatchingCarousel', movies);
    }
    if (state.watchlist.length > 0) {
        document.getElementById('watchlistSection').style.display = 'block';
        const movies = await Promise.all(state.watchlist.map(id => fetchTMDB(`/movie/${id}`)));
        renderCarousel('watchlistCarousel', movies);
    }
    if (state.favorites.length > 0) {
        document.getElementById('favoritesSection').style.display = 'block';
        const movies = await Promise.all(state.favorites.map(id => fetchTMDB(`/movie/${id}`)));
        renderCarousel('favoritesCarousel', movies);
    }
    if (state.history.length > 0) {
        document.getElementById('historySection').style.display = 'block';
        const movies = await Promise.all(state.history.slice(0, 20).map(id => fetchTMDB(`/movie/${id}`)));
        renderCarousel('historyCarousel', movies);
    }
}

function updateModalButtons(movieId) {
    const watchBtn = document.getElementById('modalWatchlistBtn');
    const favBtn = document.getElementById('modalFavoriteBtn');
    watchBtn.innerHTML = `<i class="fas ${state.watchlist.includes(movieId) ? 'fa-check' : 'fa-plus'}"></i> List`;
    favBtn.innerHTML = `<i class="fas fa-heart"></i> ${state.favorites.includes(movieId) ? 'Favorited' : 'Favorite'}`;
    if (state.watchlist.includes(movieId)) watchBtn.classList.add('active');
    else watchBtn.classList.remove('active');
    if (state.favorites.includes(movieId)) favBtn.classList.add('active');
    else favBtn.classList.remove('active');
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('hamburgerBtn').onclick = openSidebar;
    document.getElementById('closeSidebar').onclick = closeSidebar;
    document.getElementById('overlay').onclick = () => { closeSidebar(); closeProfileMenu(); };
    document.getElementById('themeToggle').onclick = toggleTheme;
    document.getElementById('profileBtn').onclick = (e) => { e.stopPropagation(); toggleProfileMenu(); };
    document.getElementById('signInBtn').onclick = signInWithGoogle;
    document.getElementById('signOutBtn').onclick = signOutUser;
    document.getElementById('settingsBtn').onclick = () => { closeProfileMenu(); openSettings(); };
    document.getElementById('surpriseBtn').onclick = async () => {
        const data = await fetchTMDB('/movie/popular');
        const movie = data.results[Math.floor(Math.random() * data.results.length)];
        showMovieDetails(movie.id);
    };
    
    let searchTimeout;
    document.getElementById('searchInput').oninput = (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchMovies(e.target.value), 500);
    };
    
    document.querySelectorAll('.sidebar-item[data-section]').forEach(item => {
        item.onclick = (e) => {
            e.preventDefault();
            scrollToSection(item.dataset.section + 'Section');
            closeSidebar();
        };
    });
    
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.onclick = () => closeModal(btn.dataset.modal);
    });
    
    document.getElementById('saveSettings').onclick = saveSettings;
    document.getElementById('parentalToggle').onchange = (e) => {
        document.getElementById('pinGroup').style.display = e.target.checked ? 'block' : 'none';
    };
    
    window.addEventListener('scroll', () => {
        document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
    });
}

function openSidebar() { document.getElementById('sidebar').classList.add('active'); document.getElementById('overlay').classList.add('active'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('active'); document.getElementById('overlay').classList.remove('active'); }
function toggleProfileMenu() { document.getElementById('profileMenu').classList.toggle('active'); }
function closeProfileMenu() { document.getElementById('profileMenu').classList.remove('active'); }
function openModal(id) { document.getElementById(id).classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('active'); document.body.style.overflow = ''; }
function scrollToSection(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); }

function openSettings() {
    document.getElementById('settingsName').value = currentUser?.displayName || '';
    document.getElementById('settingsEmail').value = currentUser?.email || '';
    document.getElementById('autoplayToggle').checked = state.settings.autoplay;
    document.getElementById('skipIntroToggle').checked = state.settings.skipIntro;
    document.getElementById('defaultQuality').value = state.settings.defaultQuality;
    document.getElementById('parentalToggle').checked = state.settings.parental;
    openModal('settingsModal');
}

function saveSettings() {
    state.settings.autoplay = document.getElementById('autoplayToggle').checked;
    state.settings.skipIntro = document.getElementById('skipIntroToggle').checked;
    state.settings.defaultQuality = document.getElementById('defaultQuality').value;
    state.settings.parental = document.getElementById('parentalToggle').checked;
    state.settings.pin = document.getElementById('parentalPin').value;
    saveUserData('settings', state.settings);
    closeModal('settingsModal');
    showNotification('Settings saved', 'success');
}

function loadTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('#themeToggle i').className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.querySelector('#themeToggle i').className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function showNotification(message, type) {
    const container = document.getElementById('notificationContainer');
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    container.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}
