// TMDB Configuration
const TMDB_API_KEY = 'a45420333457411e78d5ad35d6c51a2d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Video Sources Configuration (6 example sources)
const VIDEO_SOURCES = {
    1: 'https://vidsrc.xyz/embed/movie/{tmdb_id}',
    2: 'https://vidsrc.to/embed/movie/{tmdb_id}',
    3: 'https://www.2embed.cc/embed/{tmdb_id}',
    4: 'https://multiembed.mov/?video_id={tmdb_id}&tmdb=1',
    5: 'https://embed.su/embed/tmdb/movie?id={tmdb_id}',
    6: 'https://autoembed.co/tmdb/movie/{tmdb_id}'
};

// App State
let appState = {
    currentUser: null,
    watchlist: [],
    watchHistory: [],
    settings: {
        theme: 'dark',
        defaultQuality: 'auto',
        defaultSource: 1,
        autoplay: true,
        animationLevel: 'medium',
        hoverEffects: true
    },
    currentPage: 1,
    isLoading: false
};

// DOM Elements
const elements = {
    // Navigation
    hamburger: document.getElementById('hamburger'),
    sideMenu: document.getElementById('sideMenu'),
    menuOverlay: document.getElementById('menuOverlay'),
    closeMenu: document.getElementById('closeMenu'),
    themeToggle: document.getElementById('themeToggle'),
    menuThemeToggle: document.getElementById('menuThemeToggle'),
    
    // Search
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    
    // Buttons
    randomBtn: document.getElementById('randomBtn'),
    watchlistBtn: document.getElementById('watchlistBtn'),
    historyBtn: document.getElementById('historyBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    
    // Modals
    playerModal: document.getElementById('playerModal'),
    closePlayer: document.getElementById('closePlayer'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettings: document.getElementById('closeSettings'),
    detailsModal: document.getElementById('detailsModal'),
    
    // Video Player
    mainVideo: document.getElementById('mainVideo'),
    videoSource: document.getElementById('videoSource'),
    playerTitle: document.getElementById('playerTitle'),
    qualitySelector: document.getElementById('qualitySelector'),
    sourceSelector: document.getElementById('sourceSelector'),
    
    // Sections
    heroSlides: document.getElementById('heroSlides'),
    continueGrid: document.getElementById('continueGrid'),
    recommendedGrid: document.getElementById('recommendedGrid'),
    trendingGrid: document.getElementById('trendingGrid'),
    moviesGrid: document.getElementById('moviesGrid'),
    calendar: document.getElementById('calendar'),
    
    // Filters
    genreFilter: document.getElementById('genreFilter'),
    yearFilter: document.getElementById('yearFilter'),
    sortFilter: document.getElementById('sortFilter'),
    trendingFilter: document.getElementById('trendingFilter'),
    
    // Calendar
    currentMonth: document.getElementById('currentMonth'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    
    // Settings
    defaultQuality: document.getElementById('defaultQuality'),
    defaultSource: document.getElementById('defaultSource'),
    autoplayToggle: document.getElementById('autoplayToggle'),
    animationLevel: document.getElementById('animationLevel'),
    hoverEffectsToggle: document.getElementById('hoverEffectsToggle'),
    saveSettings: document.getElementById('saveSettings'),
    resetSettings: document.getElementById('resetSettings'),
    clearHistory: document.getElementById('clearHistory'),
    
    // Loading
    loadingScreen: document.querySelector('.loading-screen')
};

// Initialize Swiper for Hero Banner
let heroSwiper = null;

// Initialize the application
async function initApp() {
    // Initialize Firebase Auth
    await initFirebaseAuth();
    
    // Load user data
    await loadUserData();
    
    // Initialize UI
    initUI();
    
    // Load initial data
    loadInitialData();
    
    // Hide loading screen
    setTimeout(() => {
        elements.loadingScreen.style.opacity = '0';
        setTimeout(() => {
            elements.loadingScreen.style.display = 'none';
            animateOnScroll();
        }, 800);
    }, 1500);
}

// Firebase Authentication
async function initFirebaseAuth() {
    try {
        await signInAnonymously(window.firebaseAuth);
        onAuthStateChanged(window.firebaseAuth, (user) => {
            if (user) {
                appState.currentUser = user;
                console.log('User signed in anonymously:', user.uid);
            } else {
                console.log('No user signed in');
            }
        });
    } catch (error) {
        console.error('Firebase auth error:', error);
    }
}

// Load user data from Firestore
async function loadUserData() {
    if (!appState.currentUser) return;
    
    try {
        const userDoc = await getDoc(doc(window.firebaseDb, 'users', appState.currentUser.uid));
        
        if (userDoc.exists()) {
            const data = userDoc.data();
            appState.watchlist = data.watchlist || [];
            appState.watchHistory = data.watchHistory || [];
            appState.settings = { ...appState.settings, ...data.settings };
            
            // Update watchlist count
            updateWatchlistCount();
        } else {
            // Create new user document
            await setDoc(doc(window.firebaseDb, 'users', appState.currentUser.uid), {
                watchlist: [],
                watchHistory: [],
                settings: appState.settings,
                createdAt: new Date()
            });
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Save user data to Firestore
async function saveUserData() {
    if (!appState.currentUser) return;
    
    try {
        await setDoc(doc(window.firebaseDb, 'users', appState.currentUser.uid), {
            watchlist: appState.watchlist,
            watchHistory: appState.watchHistory,
            settings: appState.settings,
            updatedAt: new Date()
        }, { merge: true });
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

// Initialize UI Event Listeners
function initUI() {
    // Hamburger Menu
    elements.hamburger.addEventListener('click', toggleSideMenu);
    elements.closeMenu.addEventListener('click', toggleSideMenu);
    elements.menuOverlay.addEventListener('click', toggleSideMenu);
    
    // Theme Toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.menuThemeToggle.addEventListener('change', toggleTheme);
    
    // Search Functionality
    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    elements.searchInput.addEventListener('focus', showSearchResults);
    
    // Modal Controls
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.closeSettings.addEventListener('click', closeSettings);
    elements.closePlayer.addEventListener('click', closePlayer);
    
    // Video Player Controls
    elements.mainVideo.addEventListener('timeupdate', updateWatchHistory);
    elements.mainVideo.addEventListener('ended', handleVideoEnded);
    
    // Settings
    elements.saveSettings.addEventListener('click', saveSettings);
    elements.resetSettings.addEventListener('click', resetSettings);
    elements.clearHistory.addEventListener('click', clearHistory);
    
    // Random Movie Button
    elements.randomBtn.addEventListener('click', getRandomMovie);
    
    // Calendar Navigation
    elements.prevMonth.addEventListener('click', navigateCalendarMonth);
    elements.nextMonth.addEventListener('click', navigateCalendarMonth);
    
    // Filter Changes
    elements.genreFilter.addEventListener('change', filterMovies);
    elements.yearFilter.addEventListener('change', filterMovies);
    elements.sortFilter.addEventListener('change', filterMovies);
    elements.trendingFilter.addEventListener('change', filterTrending);
    
    // Load More Movies
    document.getElementById('loadMoreMovies').addEventListener('click', loadMoreMovies);
    
    // Close modals on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePlayer();
            closeSettings();
            closeDetails();
        }
    });
    
    // Initialize theme
    applyTheme(appState.settings.theme);
    
    // Initialize animations
    applyAnimationSettings();
}

// Load initial data
async function loadInitialData() {
    try {
        // Load hero banners
        const trending = await fetchTMDB('trending/movie/week');
        createHeroSlides(trending.results.slice(0, 5));
        
        // Initialize Swiper
        initSwiper();
        
        // Load continue watching
        updateContinueWatching();
        
        // Load recommendations
        loadRecommendations();
        
        // Load trending
        loadTrending('day');
        
        // Load movies
        loadMovies();
        
        // Load genres
        loadGenres();
        
        // Load years
        populateYearFilter();
        
        // Load calendar
        loadCalendar(new Date());
        
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// TMDB API Helper
async function fetchTMDB(endpoint, params = {}) {
    const url = new URL(`${TMDB_BASE_URL}/${endpoint}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    url.searchParams.append('language', 'en-US');
    
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
    return await response.json();
}

// Create Hero Slides
function createHeroSlides(movies) {
    elements.heroSlides.innerHTML = '';
    
    movies.forEach((movie, index) => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide hero-slide';
        slide.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${TMDB_IMAGE_BASE}/original${movie.backdrop_path}')`;
        
        slide.innerHTML = `
            <div class="hero-content">
                <h1 class="hero-title">${movie.title}</h1>
                <div class="hero-meta">
                    <span class="hero-rating">★ ${movie.vote_average.toFixed(1)}</span>
                    <span class="hero-year">${movie.release_date?.split('-')[0] || 'N/A'}</span>
                    <span class="hero-genres">${getGenreNames(movie.genre_ids).slice(0, 3).join(', ')}</span>
                </div>
                <p class="hero-description">${movie.overview?.substring(0, 150)}...</p>
                <div class="hero-actions">
                    <button class="play-btn" data-id="${movie.id}" data-type="movie">
                        <i class="fas fa-play"></i> Watch Now
                    </button>
                    <button class="info-btn" data-id="${movie.id}" data-type="movie">
                        <i class="fas fa-info-circle"></i> More Info
                    </button>
                </div>
            </div>
        `;
        
        elements.heroSlides.appendChild(slide);
        animateElement(slide, 'fadeInUp');
    });
    
    // Add event listeners to buttons
    setTimeout(() => {
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.play-btn').dataset.id;
                const type = e.target.closest('.play-btn').dataset.type;
                playContent(id, type);
            });
        });
        
        document.querySelectorAll('.info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.info-btn').dataset.id;
                const type = e.target.closest('.info-btn').dataset.type;
                showDetails(id, type);
            });
        });
    }, 100);
}

// Initialize Swiper
function initSwiper() {
    heroSwiper = new Swiper('.hero-swiper', {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        effect: 'fade',
        fadeEffect: {
            crossFade: true
        },
        speed: 1000
    });
}

// Update Continue Watching
function updateContinueWatching() {
    if (appState.watchHistory.length === 0) {
        elements.continueGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-film"></i>
                <p>No content in progress. Start watching something!</p>
            </div>
        `;
        return;
    }
    
    elements.continueGrid.innerHTML = '';
    
    // Show last 6 items
    const recentItems = appState.watchHistory
        .sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched))
        .slice(0, 6);
    
    recentItems.forEach(item => {
        const movieCard = createMovieCard(item, true);
        elements.continueGrid.appendChild(movieCard);
    });
}

// Create Movie Card
function createMovieCard(item, isContinue = false) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.id = item.id;
    card.dataset.type = item.type || 'movie';
    
    const progress = isContinue && item.progress ? 
        `<div class="progress-bar" style="width: ${item.progress}%"></div>` : '';
    
    card.innerHTML = `
        <div class="card-image">
            <img src="${TMDB_IMAGE_BASE}/w342${item.poster_path}" 
                 alt="${item.title}" 
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/342x513?text=No+Image'">
            ${progress}
            <div class="card-overlay">
                <button class="play-btn-card" title="Play">
                    <i class="fas fa-play"></i>
                </button>
                <button class="bookmark-btn-card" title="${appState.watchlist.some(w => w.id === item.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}">
                    <i class="${appState.watchlist.some(w => w.id === item.id) ? 'fas' : 'far'} fa-bookmark"></i>
                </button>
                <button class="info-btn-card" title="More Info">
                    <i class="fas fa-info-circle"></i>
                </button>
            </div>
        </div>
        <div class="card-content">
            <h3 class="card-title">${item.title || item.name}</h3>
            <div class="card-meta">
                <span class="card-rating">★ ${item.vote_average?.toFixed(1) || 'N/A'}</span>
                <span class="card-year">${(item.release_date || item.first_air_date)?.split('-')[0] || 'N/A'}</span>
            </div>
        </div>
    `;
    
    // Add hover animation
    if (appState.settings.hoverEffects) {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.05)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    }
    
    // Add event listeners
    const playBtn = card.querySelector('.play-btn-card');
    const bookmarkBtn = card.querySelector('.bookmark-btn-card');
    const infoBtn = card.querySelector('.info-btn-card');
    
    playBtn.addEventListener('click', () => playContent(item.id, item.type || 'movie'));
    bookmarkBtn.addEventListener('click', () => toggleWatchlist(item));
    infoBtn.addEventListener('click', () => showDetails(item.id, item.type || 'movie'));
    
    // Add click listener to entire card
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.card-overlay')) {
            showDetails(item.id, item.type || 'movie');
        }
    });
    
    animateElement(card, 'fadeIn');
    return card;
}
// Search Functionality
async function handleSearch() {
    const query = elements.searchInput.value.trim();
    if (query.length < 2) {
        elements.searchResults.innerHTML = '';
        elements.searchResults.classList.remove('active');
        return;
    }
    
    try {
        const [movies, tv] = await Promise.all([
            fetchTMDB('search/movie', { query }),
            fetchTMDB('search/tv', { query })
        ]);
        
        displaySearchResults([...movies.results, ...tv.results]);
    } catch (error) {
        console.error('Search error:', error);
    }
}

// Display Search Results
function displaySearchResults(results) {
    elements.searchResults.innerHTML = '';
    
    if (results.length === 0) {
        elements.searchResults.innerHTML = '<div class="no-results">No results found</div>';
        elements.searchResults.classList.add('active');
        return;
    }
    
    // Sort by popularity and take top 8
    results.sort((a, b) => b.popularity - a.popularity);
    results = results.slice(0, 8);
    
    results.forEach(item => {
        const result = document.createElement('div');
        result.className = 'search-result-item';
        result.dataset.id = item.id;
        result.dataset.type = item.media_type || (item.title ? 'movie' : 'tv');
        
        result.innerHTML = `
            <img src="${TMDB_IMAGE_BASE}/w92${item.poster_path}" 
                 alt="${item.title || item.name}"
                 onerror="this.src='https://via.placeholder.com/92x138?text=No+Image'">
            <div class="search-result-info">
                <h4>${item.title || item.name}</h4>
                <div class="search-result-meta">
                    <span>${item.media_type || (item.title ? 'Movie' : 'TV')}</span>
                    <span>★ ${item.vote_average?.toFixed(1) || 'N/A'}</span>
                    <span>${(item.release_date || item.first_air_date)?.split('-')[0] || 'N/A'}</span>
                </div>
            </div>
        `;
        
        result.addEventListener('click', () => {
            elements.searchInput.value = '';
            elements.searchResults.classList.remove('active');
            showDetails(item.id, result.dataset.type);
        });
        
        elements.searchResults.appendChild(result);
    });
    
    elements.searchResults.classList.add('active');
}

// Show/Hide Search Results
function showSearchResults() {
    if (elements.searchInput.value.trim().length >= 2) {
        elements.searchResults.classList.add('active');
    }
}

// Close Search Results
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        elements.searchResults.classList.remove('active');
    }
});

// Play Content
async function playContent(id, type = 'movie') {
    try {
        // Fetch content details
        const details = await fetchTMDB(`${type}/${id}`);
        
        // Update player UI
        elements.playerTitle.textContent = details.title || details.name;
        document.getElementById('playerYear').textContent = 
            (details.release_date || details.first_air_date)?.split('-')[0] || 'N/A';
        document.getElementById('playerRating').textContent = 
            `★ ${details.vote_average?.toFixed(1) || 'N/A'}`;
        document.getElementById('playerRuntime').textContent = 
            formatRuntime(details.runtime || details.episode_run_time?.[0] || 0);
        document.getElementById('playerDescription').textContent = 
            details.overview || 'No description available.';
        
        // Get video sources
        const videoUrl = await getVideoSource(id, type);
        
        // Set video source
        elements.videoSource.src = videoUrl;
        elements.mainVideo.load();
        
        // Update watchlist button
        const isInWatchlist = appState.watchlist.some(item => item.id === id);
        const watchlistBtn = document.getElementById('addToWatchlist');
        watchlistBtn.innerHTML = isInWatchlist ? 
            '<i class="fas fa-bookmark"></i><span>In Watchlist</span>' :
            '<i class="far fa-bookmark"></i><span>Add to Watchlist</span>';
        
        // Show player modal with animation
        elements.playerModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Auto-play if setting is enabled
        if (appState.settings.autoplay) {
            setTimeout(() => elements.mainVideo.play(), 500);
        }
        
        // Add to history if not already there
        addToHistory({
            id,
            type,
            title: details.title || details.name,
            poster_path: details.poster_path,
            backdrop_path: details.backdrop_path,
            vote_average: details.vote_average,
            release_date: details.release_date || details.first_air_date,
            progress: 0,
            lastWatched: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error playing content:', error);
        alert('Unable to load video. Please try another source.');
    }
}

// Get Video Source from 6 sources
async function getVideoSource(id, type = 'movie') {
    // Try sources in order until one works
    const sourceNum = appState.settings.defaultSource;
    const sourceTemplate = VIDEO_SOURCES[sourceNum];
    const videoUrl = sourceTemplate.replace('{tmdb_id}', id);
    
    // For demo purposes, using sample videos
    // In production, you would check each source's availability
    const sampleVideos = [
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
    ];
    
    return sampleVideos[sourceNum - 1] || sampleVideos[0];
}

// Close Player
function closePlayer() {
    elements.playerModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    elements.mainVideo.pause();
    
    // Save current playback position
    if (elements.mainVideo.currentTime > 0) {
        const id = parseInt(elements.playerTitle.dataset.id);
        updateHistoryProgress(id, elements.mainVideo.currentTime / elements.mainVideo.duration * 100);
    }
}

// Update Watch History
function updateWatchHistory() {
    const video = elements.mainVideo;
    if (video.duration && video.currentTime > 0) {
        const progress = (video.currentTime / video.duration) * 100;
        
        // Update progress every 10 seconds
        if (progress % 10 < 1) {
            const id = parseInt(elements.playerTitle.dataset.id);
            updateHistoryProgress(id, progress);
        }
    }
}

// Handle Video Ended
function handleVideoEnded() {
    if (appState.settings.autoplay) {
        // Logic for next episode or similar content
        showNotification('Playback completed!', 'success');
    }
}

// Add to History
function addToHistory(item) {
    const existingIndex = appState.watchHistory.findIndex(h => h.id === item.id);
    
    if (existingIndex > -1) {
        appState.watchHistory[existingIndex] = {
            ...appState.watchHistory[existingIndex],
            lastWatched: new Date().toISOString()
        };
    } else {
        appState.watchHistory.push(item);
    }
    
    updateContinueWatching();
    saveUserData();
}

// Update History Progress
function updateHistoryProgress(id, progress) {
    const item = appState.watchHistory.find(h => h.id === id);
    if (item) {
        item.progress = Math.min(progress, 95); // Don't mark as 100% unless actually finished
        item.lastWatched = new Date().toISOString();
        saveUserData();
    }
}

// Toggle Watchlist
function toggleWatchlist(item) {
    const index = appState.watchlist.findIndex(w => w.id === item.id);
    
    if (index > -1) {
        // Remove from watchlist
        appState.watchlist.splice(index, 1);
        showNotification('Removed from watchlist', 'info');
    } else {
        // Add to watchlist
        appState.watchlist.push({
            id: item.id,
            type: item.type || 'movie',
            title: item.title || item.name,
            poster_path: item.poster_path,
            vote_average: item.vote_average,
            release_date: item.release_date || item.first_air_date,
            addedAt: new Date().toISOString()
        });
        showNotification('Added to watchlist!', 'success');
    }
    
    updateWatchlistCount();
    saveUserData();
    
    // Update bookmark button UI
    const bookmarkBtns = document.querySelectorAll(`.movie-card[data-id="${item.id}"] .bookmark-btn-card`);
    bookmarkBtns.forEach(btn => {
        const icon = btn.querySelector('i');
        if (appState.watchlist.some(w => w.id === item.id)) {
            icon.className = 'fas fa-bookmark';
            btn.title = 'Remove from Watchlist';
        } else {
            icon.className = 'far fa-bookmark';
            btn.title = 'Add to Watchlist';
        }
    });
}

// Update Watchlist Count
function updateWatchlistCount() {
    const countElement = document.getElementById('watchlistCount');
    if (countElement) {
        countElement.textContent = appState.watchlist.length;
        animateElement(countElement, 'pulse');
    }
}

// Show Details Modal
async function showDetails(id, type = 'movie') {
    try {
        const details = await fetchTMDB(`${type}/${id}`);
        const credits = await fetchTMDB(`${type}/${id}/credits`);
        const similar = await fetchTMDB(`${type}/${id}/similar`);
        
        elements.detailsModal.innerHTML = `
            <div class="details-container">
                <button class="close-details" id="closeDetails">
                    <i class="fas fa-times"></i>
                </button>
                <div class="details-header" style="background-image: linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url('${TMDB_IMAGE_BASE}/original${details.backdrop_path}')">
                    <div class="details-poster">
                        <img src="${TMDB_IMAGE_BASE}/w342${details.poster_path}" 
                             alt="${details.title || details.name}"
                             onerror="this.src='https://via.placeholder.com/342x513?text=No+Image'">
                    </div>
                    <div class="details-info">
                        <h2>${details.title || details.name}</h2>
                        <div class="details-meta">
                            <span>${(details.release_date || details.first_air_date)?.split('-')[0] || 'N/A'}</span>
                            <span>★ ${details.vote_average?.toFixed(1)}</span>
                            <span>${formatRuntime(details.runtime || details.episode_run_time?.[0] || 0)}</span>
                            <span>${details.genres?.map(g => g.name).join(', ')}</span>
                        </div>
                        <div class="details-actions">
                            <button class="play-btn-details" data-id="${id}" data-type="${type}">
                                <i class="fas fa-play"></i> Play Now
                            </button>
                            <button class="watchlist-btn-details" data-id="${id}">
                                <i class="${appState.watchlist.some(w => w.id === id) ? 'fas' : 'far'} fa-bookmark"></i>
                                ${appState.watchlist.some(w => w.id === id) ? 'In Watchlist' : 'Add to Watchlist'}
                            </button>
                        </div>
                        <p class="details-overview">${details.overview}</p>
                    </div>
                </div>
                
                <div class="details-content">
                    <div class="details-section">
                        <h3><i class="fas fa-users"></i> Cast</h3>
                        <div class="cast-grid">
                            ${credits.cast.slice(0, 10).map(person => `
                                <div class="cast-member">
                                    <img src="${TMDB_IMAGE_BASE}/w185${person.profile_path}" 
                                         alt="${person.name}"
                                         onerror="this.src='https://via.placeholder.com/185x278?text=No+Image'">
                                    <div class="cast-info">
                                        <strong>${person.name}</strong>
                                        <span>${person.character}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h3><i class="fas fa-film"></i> Similar Content</h3>
                        <div class="similar-grid">
                            ${similar.results.slice(0, 6).map(item => `
                                <div class="similar-item" data-id="${item.id}" data-type="${type}">
                                    <img src="${TMDB_IMAGE_BASE}/w154${item.poster_path}" 
                                         alt="${item.title || item.name}"
                                         onerror="this.src='https://via.placeholder.com/154x231?text=No+Image'">
                                    <div class="similar-info">
                                        <h4>${item.title || item.name}</h4>
                                        <span>★ ${item.vote_average?.toFixed(1)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        elements.detailsModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Add event listeners
        document.getElementById('closeDetails').addEventListener('click', closeDetails);
        document.querySelector('.play-btn-details').addEventListener('click', () => {
            closeDetails();
            playContent(id, type);
        });
        document.querySelector('.watchlist-btn-details').addEventListener('click', () => {
            toggleWatchlist(details);
            closeDetails();
        });
        
        // Add click listeners to similar items
        document.querySelectorAll('.similar-item').forEach(item => {
            item.addEventListener('click', () => {
                closeDetails();
                showDetails(item.dataset.id, item.dataset.type);
            });
        });
        
    } catch (error) {
        console.error('Error loading details:', error);
    }
}

// Close Details Modal
function closeDetails() {
    elements.detailsModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Get Random Movie
async function getRandomMovie() {
    try {
        // Get random page (1-500)
        const randomPage = Math.floor(Math.random() * 500) + 1;
        const data = await fetchTMDB('discover/movie', {
            page: randomPage,
            sort_by: 'popularity.desc'
        });
        
        // Get random movie from page
        const randomIndex = Math.floor(Math.random() * data.results.length);
        const randomMovie = data.results[randomIndex];
        
        // Show details
        showDetails(randomMovie.id, 'movie');
    } catch (error) {
        console.error('Error getting random movie:', error);
    }
}

// Load Recommendations
async function loadRecommendations() {
    try {
        const [movies, tv] = await Promise.all([
            fetchTMDB('movie/popular'),
            fetchTMDB('tv/popular')
        ]);
        
        // Combine and shuffle
        const allContent = [...movies.results, ...tv.results];
        shuffleArray(allContent);
        
        // Display first 12
        elements.recommendedGrid.innerHTML = '';
        allContent.slice(0, 12).forEach(item => {
            const card = createMovieCard({
                ...item,
                type: item.title ? 'movie' : 'tv'
            });
            elements.recommendedGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading recommendations:', error);
    }
}

// Load Trending
async function loadTrending(timeWindow = 'day') {
    try {
        const data = await fetchTMDB(`trending/all/${timeWindow}`);
        elements.trendingGrid.innerHTML = '';
        
        data.results.slice(0, 12).forEach(item => {
            const card = createMovieCard({
                ...item,
                type: item.media_type
            });
            elements.trendingGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading trending:', error);
    }
}

// Filter Trending
function filterTrending() {
    const timeWindow = elements.trendingFilter.value;
    loadTrending(timeWindow);
}

// Load Movies
async function loadMovies(page = 1) {
    try {
        const genre = elements.genreFilter.value;
        const year = elements.yearFilter.value;
        const sort = elements.sortFilter.value;
        
        let sortBy = 'popularity.desc';
        if (sort === 'rating') sortBy = 'vote_average.desc';
        if (sort === 'newest') sortBy = 'primary_release_date.desc';
        
        const params = {
            page,
            sort_by: sortBy,
            'vote_count.gte': 100
        };
        
        if (genre) params.with_genres = genre;
        if (year) params.primary_release_year = year;
        
        const data = await fetchTMDB('discover/movie', params);
        
        if (page === 1) {
            elements.moviesGrid.innerHTML = '';
        }
        
        data.results.forEach(movie => {
            const card = createMovieCard(movie);
            elements.moviesGrid.appendChild(card);
        });
        
        appState.currentPage = page;
        
    } catch (error) {
        console.error('Error loading movies:', error);
    }
}

// Load More Movies
function loadMoreMovies() {
    loadMovies(appState.currentPage + 1);
}

// Filter Movies
function filterMovies() {
    loadMovies(1);
}

// Load Genres
async function loadGenres() {
    try {
        const data = await fetchTMDB('genre/movie/list');
        elements.genreFilter.innerHTML = '<option value="">All Genres</option>';
        
        data.genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            elements.genreFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading genres:', error);
    }
}

// Populate Year Filter
function populateYearFilter() {
    const currentYear = new Date().getFullYear();
    elements.yearFilter.innerHTML = '<option value="">All Years</option>';
    
    for (let year = currentYear; year >= 1970; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        elements.yearFilter.appendChild(option);
    }
}

// Load Calendar
function loadCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    elements.currentMonth.textContent = `${monthNames[month]} ${year}`;
    
    // Generate calendar
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let calendarHTML = '<div class="calendar-weekdays">';
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        calendarHTML += `<div class="weekday">${day}</div>`;
    });
    calendarHTML += '</div><div class="calendar-days">';
    
    // Empty cells for days before first day
    for (let i = 0; i < firstDay.getDay(); i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        calendarHTML += `
            <div class="calendar-day" data-date="${dateStr}">
                <span class="day-number">${day}</span>
                <div class="day-movies">
                    <!-- New releases for this day would go here -->
                </div>
            </div>
        `;
    }
    
    calendarHTML += '</div>';
    elements.calendar.innerHTML = calendarHTML;
    
    // Add click listeners to days
    document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
        day.addEventListener('click', () => {
            const date = day.dataset.date;
            showNewReleasesForDate(date);
        });
    });
}

// Navigate Calendar Month
function navigateCalendarMonth(e) {
    const currentDate = new Date(elements.currentMonth.textContent);
    const newDate = new Date(currentDate);
    
    if (e.target.closest('#prevMonth')) {
        newDate.setMonth(newDate.getMonth() - 1);
    } else {
        newDate.setMonth(newDate.getMonth() + 1);
    }
    
    loadCalendar(newDate);
}

// Show New Releases for Date
async function showNewReleasesForDate(date) {
    try {
        const data = await fetchTMDB('discover/movie', {
            'primary_release_date.gte': date,
            'primary_release_date.lte': date,
            sort_by: 'popularity.desc'
        });
        
        if (data.results.length > 0) {
            showDetails(data.results[0].id, 'movie');
        } else {
            showNotification('No new releases found for this date', 'info');
        }
    } catch (error) {
        console.error('Error loading new releases:', error);
    }
}

// Settings Functions
function openSettings() {
    // Load current settings into UI
    elements.defaultQuality.value = appState.settings.defaultQuality;
    elements.defaultSource.value = appState.settings.defaultSource;
    elements.autoplayToggle.checked = appState.settings.autoplay;
    elements.animationLevel.value = appState.settings.animationLevel;
    elements.hoverEffectsToggle.checked = appState.settings.hoverEffects;
    document.getElementById('profileName').value = 'Anonymous User';
    
    elements.settingsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSettings() {
    elements.settingsModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function saveSettings() {
    appState.settings = {
        theme: appState.settings.theme, // Keep current theme
        defaultQuality: elements.defaultQuality.value,
        defaultSource: parseInt(elements.defaultSource.value),
        autoplay: elements.autoplayToggle.checked,
        animationLevel: elements.animationLevel.value,
        hoverEffects: elements.hoverEffectsToggle.checked
    };
    
    saveUserData();
    applyAnimationSettings();
    showNotification('Settings saved successfully!', 'success');
    closeSettings();
}

function resetSettings() {
    appState.settings = {
        theme: 'dark',
        defaultQuality: 'auto',
        defaultSource: 1,
        autoplay: true,
        animationLevel: 'medium',
        hoverEffects: true
    };
    
    saveUserData();
    applyAnimationSettings();
    applyTheme('dark');
    showNotification('Settings reset to defaults', 'info');
    closeSettings();
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all watch history?')) {
        appState.watchHistory = [];
        updateContinueWatching();
        saveUserData();
        showNotification('Watch history cleared', 'info');
    }
}

// Theme Functions
function toggleTheme() {
    const newTheme = appState.settings.theme === 'dark' ? 'light' : 'dark';
    appState.settings.theme = newTheme;
    applyTheme(newTheme);
    saveUserData();
}

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    elements.menuThemeToggle.checked = theme === 'dark';
    
    const icon = elements.themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

// Animation Functions
function applyAnimationSettings() {
    const level = appState.settings.animationLevel;
    document.body.classList.remove('animations-low', 'animations-medium', 'animations-high', 'animations-none');
    document.body.classList.add(`animations-${level}`);
}

function animateElement(element, animation) {
    if (appState.settings.animationLevel === 'none') return;
    
    element.classList.add('animate__animated', `animate__${animation}`);
    setTimeout(() => {
        element.classList.remove('animate__animated', `animate__${animation}`);
    }, 1000);
}

function animateOnScroll() {
    if (appState.settings.animationLevel === 'none') return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate__animated', 'animate__fadeInUp');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.movie-card, .content-section').forEach(el => {
        observer.observe(el);
    });
}

// Toggle Side Menu
function toggleSideMenu() {
    elements.sideMenu.classList.toggle('active');
    elements.menuOverlay.classList.toggle('active');
    document.body.style.overflow = elements.sideMenu.classList.contains('active') ? 'hidden' : 'auto';
}

// Show Notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Utility Functions
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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function formatRuntime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function getGenreNames(genreIds) {
    const genreMap = {
        28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
        80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
        14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
        9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
        10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
    };
    return genreIds.map(id => genreMap[id] || '').filter(Boolean);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
