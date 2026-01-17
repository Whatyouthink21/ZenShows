// Constants
const API_KEY = 'a45420333457411e78d5ad35d6c51a2d';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p';
const VIDSRC_BASE = 'https://vidsrc.to/embed';

// State
let currentUser = null;
let currentPage = 'home';
let currentMediaType = null;
let currentMediaId = null;
let currentSeason = 1;
let currentEpisode = 1;
let moviesPage = 1;
let tvPage = 1;
let currentMovieFilter = 'popular';
let currentTVFilter = 'popular';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeApp();
    setupEventListeners();
});

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        currentUser = user;
        document.getElementById('username').textContent = user.username;
    } else {
        showLoginModal();
    }
}

function initializeApp() {
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
        if (currentUser) {
            loadHomePage();
        }
    }, 1500);
    
    loadSettings();
    updateNavbar();
}

function setupEventListeners() {
    // Auth forms
    document.getElementById('signinForm').addEventListener('submit', handleSignIn);
    document.getElementById('signupForm').addEventListener('submit', handleSignUp);
    
    // Search
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Navbar scroll
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Load more buttons
    document.getElementById('loadMoreMovies').addEventListener('click', loadMoreMovies);
    document.getElementById('loadMoreTV').addEventListener('click', loadMoreTV);
}

// Auth Functions
function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

function closeLoginModal() {
    if (currentUser) {
        document.getElementById('loginModal').classList.remove('active');
    }
}

function switchTab(tab) {
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'signin') {
        signinForm.style.display = 'flex';
        signupForm.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        signinForm.style.display = 'none';
        signupForm.style.display = 'flex';
        tabs[1].classList.add('active');
    }
}

function handleSignIn(e) {
    e.preventDefault();
    const username = document.getElementById('signinUsername').value;
    const password = document.getElementById('signinPassword').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        document.getElementById('username').textContent = user.username;
        closeLoginModal();
        loadHomePage();
        showNotification('Welcome back, ' + user.username + '!', 'success');
    } else {
        showNotification('Invalid credentials', 'error');
    }
}

function handleSignUp(e) {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find(u => u.username === username)) {
        showNotification('Username already exists', 'error');
        return;
    }
    
    const newUser = {
        username,
        email,
        password,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    document.getElementById('username').textContent = newUser.username;
    
    closeLoginModal();
    loadHomePage();
    showNotification('Account created successfully!', 'success');
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    document.getElementById('username').textContent = 'Guest';
    showLoginModal();
    showNotification('Logged out successfully', 'success');
}

// API Functions
async function fetchFromAPI(endpoint) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}`);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

function getImageURL(path, size = 'w500') {
    if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
    return `${IMG_BASE_URL}/${size}${path}`;
}

function getVideoURL(type, id, season = null, episode = null) {
    if (type === 'movie') {
        return `${VIDSRC_BASE}/movie/${id}`;
    } else {
        return `${VIDSRC_BASE}/tv/${id}/${season}/${episode}`;
    }
}

// Home Page
async function loadHomePage() {
    showPage('home');
    
    // Load hero
    const trendingData = await fetchFromAPI('/trending/all/day');
    if (trendingData && trendingData.results) {
        setupHero(trendingData.results[0]);
    }
    
    // Load content rows
    loadTrending();
    loadPopularMovies();
    loadTopRatedMovies();
    loadPopularTV();
    loadTopRatedTV();
    loadGenreMovies(28, 'actionRow'); // Action
    loadGenreMovies(35, 'comedyRow'); // Comedy
    loadGenreMovies(27, 'horrorRow'); // Horror
    loadGenreMovies(10749, 'romanceRow'); // Romance
    loadGenreMovies(878, 'scifiRow'); // Sci-Fi
}

function setupHero(media) {
    const heroSection = document.getElementById('heroSection');
    const type = media.media_type || 'movie';
    
    heroSection.style.backgroundImage = `url(${getImageURL(media.backdrop_path, 'original')})`;
    
    document.getElementById('heroTitle').textContent = media.title || media.name;
    document.getElementById('heroRating').textContent = media.vote_average.toFixed(1);
    document.getElementById('heroYear').textContent = (media.release_date || media.first_air_date || '').split('-')[0];
    document.getElementById('heroRuntime').textContent = type === 'movie' ? 'Movie' : 'TV Show';
    document.getElementById('heroOverview').textContent = media.overview;
    
    document.getElementById('heroPlayBtn').onclick = () => playMedia(type, media.id);
    document.getElementById('heroInfoBtn').onclick = () => showDetail(type, media.id);
    document.getElementById('heroListBtn').onclick = () => toggleMyList(type, media.id, media);
}

async function loadTrending() {
    const data = await fetchFromAPI('/trending/all/week');
    renderContentRow(data.results, 'trendingRow');
}

async function loadPopularMovies() {
    const data = await fetchFromAPI('/movie/popular');
    renderContentRow(data.results, 'popularMoviesRow', 'movie');
}

async function loadTopRatedMovies() {
    const data = await fetchFromAPI('/movie/top_rated');
    renderContentRow(data.results, 'topratedMoviesRow', 'movie');
}

async function loadPopularTV() {
    const data = await fetchFromAPI('/tv/popular');
    renderContentRow(data.results, 'popularTVRow', 'tv');
}

async function loadTopRatedTV() {
    const data = await fetchFromAPI('/tv/top_rated');
    renderContentRow(data.results, 'topratedTVRow', 'tv');
}

async function loadGenreMovies(genreId, containerId) {
    const data = await fetchFromAPI(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc`);
    renderContentRow(data.results, containerId, 'movie');
}

function renderContentRow(items, containerId, typeOverride = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = items.slice(0, 10).map(item => {
        const type = typeOverride || item.media_type || 'movie';
        return createContentCard(item, type);
    }).join('');
}

function createContentCard(item, type) {
    const title = item.title || item.name;
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    const year = (item.release_date || item.first_air_date || '').split('-')[0];
    
    return `
        <div class="content-card" onclick="showDetail('${type}', ${item.id})">
            <img src="${getImageURL(item.poster_path)}" alt="${title}" loading="lazy">
            <div class="card-overlay">
                <div class="card-title">${title}</div>
                <div class="card-info">
                    <span class="card-rating">★ ${rating}</span>
                    <span>${year}</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="card-action-btn" onclick="event.stopPropagation(); playMedia('${type}', ${item.id})">
                    <i class="fas fa-play"></i>
                </button>
                <button class="card-action-btn" onclick="event.stopPropagation(); toggleMyList('${type}', ${item.id}, ${JSON.stringify(item).replace(/"/g, '&quot;')})">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        </div>
    `;
}

// Movies Page
async function showMovies() {
    showPage('movies');
    moviesPage = 1;
    document.getElementById('moviesGrid').innerHTML = '';
    loadMoviesByFilter(currentMovieFilter);
}

function filterMovies(filter) {
    currentMovieFilter = filter;
    moviesPage = 1;
    document.getElementById('moviesGrid').innerHTML = '';
    
    const filterBtns = document.querySelectorAll('#moviesPage .filter-btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    loadMoviesByFilter(filter);
}

async function loadMoviesByFilter(filter) {
    let endpoint = '/movie/popular';
    
    switch(filter) {
        case 'toprated': endpoint = '/movie/top_rated'; break;
        case 'upcoming': endpoint = '/movie/upcoming'; break;
        case 'nowplaying': endpoint = '/movie/now_playing'; break;
    }
    
    const data = await fetchFromAPI(`${endpoint}?page=${moviesPage}`);
    const container = document.getElementById('moviesGrid');
    
    if (data && data.results) {
        container.innerHTML += data.results.map(item => createContentCard(item, 'movie')).join('');
    }
}

async function loadMoreMovies() {
    moviesPage++;
    loadMoviesByFilter(currentMovieFilter);
}

// TV Shows Page
async function showTVShows() {
    showPage('tvshows');
    tvPage = 1;
    document.getElementById('tvGrid').innerHTML = '';
    loadTVByFilter(currentTVFilter);
}

function filterTV(filter) {
    currentTVFilter = filter;
    tvPage = 1;
    document.getElementById('tvGrid').innerHTML = '';
    
    const filterBtns = document.querySelectorAll('#tvshowsPage .filter-btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    loadTVByFilter(filter);
}

async function loadTVByFilter(filter) {
    let endpoint = '/tv/popular';
    
    switch(filter) {
        case 'toprated': endpoint = '/tv/top_rated'; break;
        case 'airing': endpoint = '/tv/airing_today'; break;
        case 'onair': endpoint = '/tv/on_the_air'; break;
    }
    
    const data = await fetchFromAPI(`${endpoint}?page=${tvPage}`);
    const container = document.getElementById('tvGrid');
    
    if (data && data.results) {
        container.innerHTML += data.results.map(item => createContentCard(item, 'tv')).join('');
    }
}

async function loadMoreTV() {
    tvPage++;
    loadTVByFilter(currentTVFilter);
}

// Search
function toggleSearch() {
    const searchBar = document.getElementById('searchBar');
    const searchInput = document.getElementById('searchInput');
    
    searchBar.classList.toggle('active');
    
    if (searchBar.classList.contains('active')) {
        searchInput.focus();
    } else {
        searchInput.value = '';
    }
}

async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) return;
    
    showPage('search');
    document.getElementById('searchQuery').textContent = query;
    
    const moviesData = await fetchFromAPI(`/search/movie?query=${encodeURIComponent(query)}`);
    const tvData = await fetchFromAPI(`/search/tv?query=${encodeURIComponent(query)}`);
    
    const moviesContainer = document.getElementById('searchMoviesGrid');
    const tvContainer = document.getElementById('searchTVGrid');
    const noResults = document.getElementById('noResults');
    
    if (moviesData && moviesData.results && moviesData.results.length > 0) {
        moviesContainer.innerHTML = moviesData.results.map(item => createContentCard(item, 'movie')).join('');
        noResults.style.display = 'none';
    } else {
        moviesContainer.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--text-secondary);">No movies found</p>';
    }
    
    if (tvData && tvData.results && tvData.results.length > 0) {
        tvContainer.innerHTML = tvData.results.map(item => createContentCard(item, 'tv')).join('');
        noResults.style.display = 'none';
    } else {
        tvContainer.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--text-secondary);">No TV shows found</p>';
    }
    
    if ((!moviesData || !moviesData.results || moviesData.results.length === 0) && 
        (!tvData || !tvData.results || tvData.results.length === 0)) {
        noResults.style.display = 'block';
    }
    
    toggleSearch();
}

function switchSearchTab(tab) {
    const movieGrid = document.getElementById('searchMoviesGrid');
    const tvGrid = document.getElementById('searchTVGrid');
    const tabs = document.querySelectorAll('.search-tab');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'movies') {
        movieGrid.style.display = 'grid';
        tvGrid.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        movieGrid.style.display = 'none';
        tvGrid.style.display = 'grid';
        tabs[1].classList.add('active');
    }
}
// Detail Page
async function showDetail(type, id) {
    showPage('detail');
    currentMediaType = type;
    currentMediaId = id;
    
    const data = await fetchFromAPI(`/${type}/${id}?append_to_response=credits,reviews,similar`);
    
    if (!data) return;
    
    // Set backdrop
    const backdrop = document.querySelector('.detail-backdrop');
    backdrop.style.backgroundImage = `url(${getImageURL(data.backdrop_path, 'original')})`;
    
    // Set title and meta
    document.getElementById('detailTitle').textContent = data.title || data.name;
    document.getElementById('detailRating').textContent = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
    document.getElementById('detailYear').textContent = (data.release_date || data.first_air_date || '').split('-')[0];
    
    if (type === 'movie') {
        document.getElementById('detailRuntime').textContent = data.runtime ? `${data.runtime} min` : '';
    } else {
        document.getElementById('detailRuntime').textContent = data.number_of_seasons ? `${data.number_of_seasons} Seasons` : '';
    }
    
    document.getElementById('detailGenres').textContent = data.genres ? data.genres.map(g => g.name).join(', ') : '';
    document.getElementById('detailOverview').textContent = data.overview || 'No overview available.';
    
    // Buttons
    document.getElementById('detailPlayBtn').onclick = () => playMedia(type, id);
    
    const listBtn = document.getElementById('detailListBtn');
    updateListButton(listBtn, type, id);
    listBtn.onclick = () => {
        toggleMyList(type, id, data);
        updateListButton(listBtn, type, id);
    };
    
    // Details
    document.getElementById('detailStatus').textContent = data.status || 'N/A';
    document.getElementById('detailLanguage').textContent = data.original_language ? data.original_language.toUpperCase() : 'N/A';
    document.getElementById('detailBudget').textContent = data.budget ? `$${data.budget.toLocaleString()}` : 'N/A';
    document.getElementById('detailRevenue').textContent = data.revenue ? `$${data.revenue.toLocaleString()}` : 'N/A';
    
    // Episodes for TV shows
    if (type === 'tv' && data.number_of_seasons) {
        document.getElementById('episodeSelector').style.display = 'block';
        setupSeasonSelector(data.number_of_seasons);
        loadEpisodes();
    } else {
        document.getElementById('episodeSelector').style.display = 'none';
    }
    
    // Cast
    renderCast(data.credits);
    
    // Similar content
    renderSimilar(data.similar, type);
    
    // Reviews
    renderReviews(data.reviews);
}

function updateListButton(btn, type, id) {
    const myList = JSON.parse(localStorage.getItem('myList') || '[]');
    const inList = myList.some(item => item.id === id && item.type === type);
    
    if (inList) {
        btn.innerHTML = '<i class="fas fa-check"></i> In My List';
    } else {
        btn.innerHTML = '<i class="fas fa-plus"></i> Add to List';
    }
}

function setupSeasonSelector(numSeasons) {
    const select = document.getElementById('seasonSelect');
    select.innerHTML = '';
    
    for (let i = 1; i <= numSeasons; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Season ${i}`;
        select.appendChild(option);
    }
    
    currentSeason = 1;
}

async function loadEpisodes() {
    const season = document.getElementById('seasonSelect').value;
    currentSeason = parseInt(season);
    
    const data = await fetchFromAPI(`/tv/${currentMediaId}/season/${season}`);
    
    if (!data || !data.episodes) return;
    
    const container = document.getElementById('episodesGrid');
    container.innerHTML = data.episodes.map((ep, idx) => `
        <div class="episode-card" onclick="playEpisode(${ep.episode_number})">
            <div class="episode-thumb" style="background-image: url(${getImageURL(ep.still_path, 'w300')})">
                <div class="episode-number">E${ep.episode_number}</div>
            </div>
            <div class="episode-info">
                <div class="episode-title">${ep.name}</div>
                <div class="episode-overview">${ep.overview || 'No description available.'}</div>
            </div>
        </div>
    `).join('');
}

function playEpisode(episodeNumber) {
    currentEpisode = episodeNumber;
    playMedia('tv', currentMediaId, currentSeason, episodeNumber);
}

function renderCast(credits) {
    if (!credits || !credits.cast) return;
    
    const container = document.getElementById('castGrid');
    container.innerHTML = credits.cast.slice(0, 10).map(person => `
        <div class="cast-card" onclick="showPerson(${person.id})">
            <img src="${getImageURL(person.profile_path, 'w185')}" alt="${person.name}" class="cast-image">
            <div class="cast-name">${person.name}</div>
            <div class="cast-character">${person.character || person.job || ''}</div>
        </div>
    `).join('');
}

function renderSimilar(similar, type) {
    if (!similar || !similar.results) return;
    
    const container = document.getElementById('similarGrid');
    container.innerHTML = similar.results.slice(0, 10).map(item => createContentCard(item, type)).join('');
}

function renderReviews(reviews) {
    if (!reviews || !reviews.results || reviews.results.length === 0) {
        document.getElementById('reviewsContainer').innerHTML = '<p style="color: var(--text-secondary);">No reviews available.</p>';
        return;
    }
    
    const container = document.getElementById('reviewsContainer');
    container.innerHTML = reviews.results.slice(0, 5).map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-author">${review.author}</div>
                ${review.author_details && review.author_details.rating ? `<div class="review-rating">★ ${review.author_details.rating}</div>` : ''}
            </div>
            <div class="review-content">${review.content}</div>
            <div class="review-date">${new Date(review.created_at).toLocaleDateString()}</div>
        </div>
    `).join('');
}

// Person Page
async function showPerson(personId) {
    showPage('person');
    
    const data = await fetchFromAPI(`/person/${personId}?append_to_response=combined_credits`);
    
    if (!data) return;
    
    document.getElementById('personImage').src = getImageURL(data.profile_path, 'w300');
    document.getElementById('personName').textContent = data.name;
    document.getElementById('personBirthday').textContent = data.birthday ? `Born: ${new Date(data.birthday).toLocaleDateString()}` : '';
    document.getElementById('personBirthplace').textContent = data.place_of_birth ? `From: ${data.place_of_birth}` : '';
    document.getElementById('personKnownFor').textContent = data.known_for_department ? `Known for: ${data.known_for_department}` : '';
    document.getElementById('personBiography').textContent = data.biography || 'No biography available.';
    
    // Credits
    if (data.combined_credits && data.combined_credits.cast) {
        const sortedCredits = data.combined_credits.cast
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 12);
        
        const container = document.getElementById('personCredits');
        container.innerHTML = sortedCredits.map(item => {
            const type = item.media_type;
            return createContentCard(item, type);
        }).join('');
    }
}

// Player
function playMedia(type, id, season = null, episode = null) {
    showPage('player');
    
    const videoURL = getVideoURL(type, id, season, episode);
    
    if (type === 'movie') {
        fetchFromAPI(`/movie/${id}`).then(data => {
            document.getElementById('playerTitle').textContent = data.title || 'Movie';
            document.getElementById('playerMeta').textContent = `${(data.release_date || '').split('-')[0]} • ${data.runtime ? data.runtime + ' min' : ''}`;
        });
    } else {
        fetchFromAPI(`/tv/${id}`).then(data => {
            document.getElementById('playerTitle').textContent = data.name || 'TV Show';
            document.getElementById('playerMeta').textContent = `Season ${season} • Episode ${episode}`;
            
            // Show next episode button if not last episode
            fetchFromAPI(`/tv/${id}/season/${season}`).then(seasonData => {
                if (seasonData && seasonData.episodes && episode < seasonData.episodes.length) {
                    document.getElementById('nextEpisodeBtn').style.display = 'flex';
                } else {
                    document.getElementById('nextEpisodeBtn').style.display = 'none';
                }
            });
        });
    }
    
    const player = document.getElementById('videoPlayer');
    player.innerHTML = `<iframe src="${videoURL}" allowfullscreen></iframe>`;
    
    // Add to history
    addToHistory(type, id, season, episode);
}

function playNextEpisode() {
    currentEpisode++;
    playMedia('tv', currentMediaId, currentSeason, currentEpisode);
}

function closePlayer() {
    goBack();
    document.getElementById('videoPlayer').innerHTML = '';
}

// My List
function toggleMyList(type, id, mediaData) {
    const myList = JSON.parse(localStorage.getItem('myList') || '[]');
    const index = myList.findIndex(item => item.id === id && item.type === type);
    
    if (index > -1) {
        myList.splice(index, 1);
        showNotification('Removed from My List', 'success');
    } else {
        myList.push({
            type,
            id,
            title: mediaData.title || mediaData.name,
            poster_path: mediaData.poster_path,
            vote_average: mediaData.vote_average,
            release_date: mediaData.release_date || mediaData.first_air_date,
            addedAt: new Date().toISOString()
        });
        showNotification('Added to My List', 'success');
    }
    
    localStorage.setItem('myList', JSON.stringify(myList));
}

function showMyList() {
    showPage('mylist');
    
    const myList = JSON.parse(localStorage.getItem('myList') || '[]');
    const container = document.getElementById('mylistGrid');
    const emptyState = document.getElementById('emptyList');
    
    if (myList.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        container.innerHTML = myList.map(item => createContentCard(item, item.type)).join('');
    }
}

// History
function addToHistory(type, id, season = null, episode = null) {
    const history = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    
    // Remove if already exists
    const filtered = history.filter(item => !(item.id === id && item.type === type && item.season === season && item.episode === episode));
    
    // Add to beginning
    filtered.unshift({
        type,
        id,
        season,
        episode,
        watchedAt: new Date().toISOString()
    });
    
    // Keep only last 50
    const trimmed = filtered.slice(0, 50);
    
    localStorage.setItem('watchHistory', JSON.stringify(trimmed));
}

async function showHistory() {
    showPage('history');
    
    const history = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    const container = document.getElementById('historyGrid');
    const emptyState = document.getElementById('emptyHistory');
    
    if (history.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        
        // Fetch details for each history item
        const promises = history.map(async item => {
            const data = await fetchFromAPI(`/${item.type}/${item.id}`);
            if (data) {
                return createContentCard(data, item.type);
            }
            return '';
        });
        
        const cards = await Promise.all(promises);
        container.innerHTML = cards.join('');
    }
}

function clearHistory() {
    if (confirm('Are you sure you want to clear your watch history?')) {
        localStorage.setItem('watchHistory', '[]');
        showHistory();
        showNotification('History cleared', 'success');
    }
}
// Profile
function showProfile() {
    showPage('profile');
    
    if (!currentUser) return;
    
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    
    // Calculate stats
    const history = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    const myList = JSON.parse(localStorage.getItem('myList') || '[]');
    
    document.getElementById('statWatched').textContent = history.length;
    document.getElementById('statList').textContent = myList.length;
    document.getElementById('statHours').textContent = Math.floor(history.length * 1.5); // Estimate
}

// Settings
function showSettings() {
    showPage('settings');
    loadSettings();
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    
    document.getElementById('autoplayToggle').checked = settings.autoplay !== false;
    document.getElementById('qualitySelect').value = settings.quality || 'auto';
    document.getElementById('darkModeToggle').checked = settings.darkMode !== false;
    document.getElementById('matureToggle').checked = settings.mature === true;
    document.getElementById('releasesToggle').checked = settings.releases !== false;
}

function saveSetting(key, value) {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    settings[key] = value;
    localStorage.setItem('settings', JSON.stringify(settings));
    showNotification('Setting saved', 'success');
}

function clearAllData() {
    if (confirm('This will delete all your data including watch history, my list, and settings. Are you sure?')) {
        localStorage.removeItem('watchHistory');
        localStorage.removeItem('myList');
        localStorage.removeItem('settings');
        showNotification('All data cleared', 'success');
        showSettings();
    }
}

// Navigation
function showPage(pageName) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    currentPage = pageName;
    updateNavbar();
    window.scrollTo(0, 0);
}

function updateNavbar() {
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Update active nav based on current page
    if (currentPage === 'home') {
        navLinks[0]?.classList.add('active');
    } else if (currentPage === 'movies') {
        navLinks[1]?.classList.add('active');
    } else if (currentPage === 'tvshows') {
        navLinks[2]?.classList.add('active');
    } else if (currentPage === 'mylist') {
        navLinks[3]?.classList.add('active');
    } else if (currentPage === 'history') {
        navLinks[4]?.classList.add('active');
    }
}

function showHome() {
    loadHomePage();
}

function goBack() {
    if (currentPage === 'detail' || currentPage === 'person' || currentPage === 'player') {
        showHome();
    } else {
        window.history.back();
    }
}

function viewAll(category) {
    // This would navigate to a filtered view
    if (category.includes('movie')) {
        showMovies();
    } else if (category.includes('tv')) {
        showTVShows();
    } else {
        showMovies();
    }
}

// UI Functions
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('active');
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('active');
}

function shareContent() {
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: document.getElementById('detailTitle').textContent,
            text: 'Check out this on StreamVerse!',
            url: url
        }).catch(err => console.log('Share failed:', err));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy link', 'error');
        });
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        document.getElementById('userDropdown').classList.remove('active');
    }
});

// Utility Functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatCurrency(amount) {
    if (!amount || amount === 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
    }).format(amount);
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Local Storage Management
function getMyList() {
    return JSON.parse(localStorage.getItem('myList') || '[]');
}

function getWatchHistory() {
    return JSON.parse(localStorage.getItem('watchHistory') || '[]');
}

function getSettings() {
    return JSON.parse(localStorage.getItem('settings') || '{}');
}

function isInMyList(type, id) {
    const myList = getMyList();
    return myList.some(item => item.id === id && item.type === type);
}

// Error Handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

// Lazy Loading Images
function setupLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

// Initialize lazy loading after content loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupLazyLoading, 1000);
});

// Infinite Scroll Helper
function setupInfiniteScroll(callback) {
    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            callback();
        }
    });
}

// Performance optimization: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Search with debounce
const debouncedSearch = debounce(() => {
    performSearch();
}, 500);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // ESC key closes modals and menus
    if (e.key === 'Escape') {
        document.getElementById('userDropdown').classList.remove('active');
        document.getElementById('mobileMenu').classList.remove('active');
        
        if (document.getElementById('searchBar').classList.contains('active')) {
            toggleSearch();
        }
    }
    
    // Ctrl/Cmd + K opens search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
    }
});

// Prevent right-click on video player (optional anti-piracy measure)
document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.video-player')) {
        e.preventDefault();
    }
});

// Responsive video player
function adjustPlayerSize() {
    const player = document.querySelector('.video-player');
    if (player) {
        const width = player.offsetWidth;
        const height = (width * 9) / 16;
        player.style.height = height + 'px';
    }
}

window.addEventListener('resize', debounce(adjustPlayerSize, 250));

// App initialization check
console.log('%cStreamVerse', 'color: #e50914; font-size: 24px; font-weight: bold;');
console.log('%cYour Ultimate Streaming Destination', 'color: #b3b3b3; font-size: 14px;');
console.log('%c⚠ Warning: Do not paste anything here unless you know what you are doing!', 'color: #ff6b6b; font-size: 16px; font-weight: bold;');

// Service Worker Registration (for future PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment when you add a service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(reg => console.log('Service Worker registered'))
        //     .catch(err => console.log('Service Worker registration failed'));
    });
}

// Network status monitoring
window.addEventListener('online', () => {
    showNotification('You are back online!', 'success');
});

window.addEventListener('offline', () => {
    showNotification('You are offline. Some features may not work.', 'error');
});

// Auto-save scroll position
let scrollTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        sessionStorage.setItem('scrollPos', window.scrollY);
    }, 100);
});

// Restore scroll position
window.addEventListener('load', () => {
    const scrollPos = sessionStorage.getItem('scrollPos');
    if (scrollPos && currentPage === 'home') {
        window.scrollTo(0, parseInt(scrollPos));
    }
});

// Theme toggle helper (if dark mode toggle is used)
function applyTheme() {
    const settings = getSettings();
    if (settings.darkMode === false) {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
}

// Video quality selector integration with player
function setVideoQuality(quality) {
    const settings = getSettings();
    settings.quality = quality;
    localStorage.setItem('settings', JSON.stringify(settings));
    
    // If video is currently playing, you might want to reload with new quality
    if (currentPage === 'player') {
        showNotification(`Quality set to ${quality}`, 'success');
    }
}

// Analytics placeholder (integrate your analytics here)
function trackEvent(eventName, eventData) {
    console.log('Event tracked:', eventName, eventData);
    // Add your analytics code here (Google Analytics, etc.)
}

// Track page views
function trackPageView(pageName) {
    trackEvent('page_view', { page: pageName });
}

// Track media plays
function trackMediaPlay(type, id, title) {
    trackEvent('media_play', { type, id, title });
}

// Enhanced playMedia with tracking
const originalPlayMedia = playMedia;
playMedia = function(type, id, season = null, episode = null) {
    trackMediaPlay(type, id, document.getElementById('detailTitle')?.textContent || 'Unknown');
    return originalPlayMedia(type, id, season, episode);
};

// Random content selector (for "I'm feeling lucky" feature)
async function getRandomContent() {
    const page = Math.floor(Math.random() * 10) + 1;
    const data = await fetchFromAPI(`/movie/popular?page=${page}`);
    
    if (data && data.results && data.results.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.results.length);
        const randomMovie = data.results[randomIndex];
        showDetail('movie', randomMovie.id);
    }
}

// Export functions for potential use in browser console or future modules
window.StreamVerse = {
    showHome,
    showMovies,
    showTVShows,
    showDetail,
    showPerson,
    playMedia,
    toggleMyList,
    getRandomContent,
    showNotification
};

console.log('StreamVerse initialized successfully! 🎬');
