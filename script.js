// ============================================
// ZEN SHOWS - COMPLETE JAVASCRIPT - PART 1
// Core Configuration, State Management, and API Functions
// ============================================

// === CONFIGURATION ===

const API_KEY = 'a45420333457411e78d5ad35d6c51a2d';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

// Streaming Sources (10 sources as requested)
const SOURCES = [
    { name: 'VidSrc', url: 'https://vidsrc.xyz/embed', movie: '/movie/', tv: '/tv/' },
    { name: 'VidSrc PRO', url: 'https://vidsrc.pro/embed', movie: '/movie/', tv: '/tv/' },
    { name: 'VidSrc 2', url: 'https://vidsrc.me/embed', movie: '/movie/', tv: '/tv/' },
    { name: 'SuperEmbed', url: 'https://multiembed.mov', movie: '/?video_id=', tv: '/?video_id=' },
    { name: 'Embed.su', url: 'https://embed.su/embed', movie: '/movie/', tv: '/tv/' },
    { name: 'VidLink', url: 'https://vidlink.pro', movie: '/movie/', tv: '/tv/' },
    { name: 'MoviesAPI', url: 'https://moviesapi.club', movie: '/movie/', tv: '/tv/' },
    { name: 'AutoEmbed', url: 'https://autoembed.co', movie: '/movie/tmdb/', tv: '/tv/tmdb/' },
    { name: 'NontonGo', url: 'https://www.NontonGo.win/embed', movie: '/movie/', tv: '/tv/' },
    { name: 'SmashyStream', url: 'https://embed.smashystream.com/playere.php', movie: '?tmdb=', tv: '?tmdb=' }
];

// === GLOBAL STATE ===

let currentPage = 'home';
let currentContent = null;
let currentHeroContent = null;
let currentSeason = 1;
let currentEpisode = 1;
let watchHistory = [];
let myList = [];
let settings = {
    autoplay: false,
    skipIntro: false,
    hd: true,
    adult: false,
    animations: true,
    autoSwitch: true,
    spoilers: true,
    defaultSource: 0,
    itemsPerPage: 20
};
let genres = [];
let heroInterval;
let searchTimeout;

// === INITIALIZATION ===

document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    loadGenres();
    initializeEventListeners();
    initializeSettings();
    loadHomePage();
    startHeroRotation();
    initScrollToTop();
});

// === STORAGE MANAGEMENT ===

function loadFromStorage() {
    try {
        const historyData = localStorage.getItem('watchHistory');
        const listData = localStorage.getItem('myList');
        const settingsData = localStorage.getItem('settings');
        
        if (historyData) watchHistory = JSON.parse(historyData);
        if (listData) myList = JSON.parse(listData);
        if (settingsData) settings = { ...settings, ...JSON.parse(settingsData) };
    } catch (error) {
        console.error('Error loading from storage:', error);
    }
}

function saveToStorage() {
    try {
        localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
        localStorage.setItem('myList', JSON.stringify(myList));
        localStorage.setItem('settings', JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving to storage:', error);
    }
}

// === EVENT LISTENERS ===

function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.page);
        });
    });

    // Search
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(liveSearch, 300);
    });
    
    searchInput.addEventListener('focus', () => {
        if (searchInput.value) liveSearch();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Click outside search to close
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            document.getElementById('searchResults').classList.remove('active');
        }
    });

    // Scroll header effect
    window.addEventListener('scroll', handleScroll);

    // Handle window resize
    window.addEventListener('resize', handleResize);
}

function handleScroll() {
    const header = document.getElementById('header');
    const scrollTop = document.getElementById('scrollTop');
    
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    if (window.scrollY > 300) {
        scrollTop.classList.add('show');
    } else {
        scrollTop.classList.remove('show');
    }
}

function handleResize() {
    if (window.innerWidth > 768) {
        document.getElementById('mobileMenu').classList.remove('active');
        document.getElementById('mobileMenuOverlay').classList.remove('active');
    }
}

// === SETTINGS ===

function initializeSettings() {
    Object.keys(settings).forEach(key => {
        const toggle = document.getElementById(key + 'Toggle');
        if (toggle) {
            if (settings[key]) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        }
    });

    const defaultSourceSelect = document.getElementById('defaultSource');
    if (defaultSourceSelect) {
        defaultSourceSelect.value = settings.defaultSource;
    }

    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.value = settings.itemsPerPage;
    }
}

function toggleSetting(setting) {
    settings[setting] = !settings[setting];
    saveToStorage();
    const toggle = document.getElementById(setting + 'Toggle');
    if (toggle) {
        toggle.classList.toggle('active');
    }
    showToast(`${setting} ${settings[setting] ? 'enabled' : 'disabled'}`);
}

function saveDefaultSource() {
    const select = document.getElementById('defaultSource');
    settings.defaultSource = parseInt(select.value);
    saveToStorage();
    showToast('Default source updated');
}

function saveItemsPerPage() {
    const select = document.getElementById('itemsPerPage');
    settings.itemsPerPage = parseInt(select.value);
    saveToStorage();
    showToast('Items per page updated');
}

function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// === API FUNCTIONS ===

async function fetchAPI(endpoint, params = {}) {
    try {
        const queryString = new URLSearchParams({
            api_key: API_KEY,
            ...params
        }).toString();
        
        const response = await fetch(`${BASE_URL}${endpoint}?${queryString}`);
        if (!response.ok) throw new Error('API request failed');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

async function loadGenres() {
    try {
        const [movieGenres, tvGenres] = await Promise.all([
            fetchAPI('/genre/movie/list'),
            fetchAPI('/genre/tv/list')
        ]);
        
        if (movieGenres && tvGenres) {
            const allGenres = [...movieGenres.genres, ...tvGenres.genres];
            genres = allGenres.filter((g, i, arr) => 
                arr.findIndex(x => x.id === g.id) === i
            );
        }
    } catch (error) {
        console.error('Error loading genres:', error);
    }
}

function getGenreNames(genreIds) {
    if (!genreIds || !Array.isArray(genreIds)) return [];
    return genreIds.map(id => {
        const genre = genres.find(g => g.id === id);
        return genre ? genre.name : null;
    }).filter(Boolean);
}

function getImageUrl(path, size = 'original') {
    if (!path) return 'https://via.placeholder.com/500x750/1a1a2e/6366f1?text=No+Image';
    return `${IMG_BASE}/${size}${path}`;
}

// === NAVIGATION ===

function navigateTo(page) {
    currentPage = page;
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });

    // Close mobile menu
    toggleMobileMenu(false);

    // Load page content
    switch(page) {
        case 'home':
            loadHomePage();
            break;
        case 'movies':
            loadMoviesPage();
            break;
        case 'shows':
            loadShowsPage();
            break;
        case 'trending':
            loadTrendingPage();
            break;
        case 'mylist':
            loadMyListPage();
            break;
        case 'genres':
            loadGenresPage();
            break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goHome() {
    navigateTo('home');
}

function toggleMobileMenu(force) {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileMenuOverlay');
    
    if (force === false) {
        menu.classList.remove('active');
        overlay.classList.remove('active');
    } else {
        menu.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

// === HERO SECTION ===

async function startHeroRotation() {
    try {
        const trending = await fetchAPI('/trending/all/week');
        if (trending && trending.results && trending.results.length > 0) {
            const heroItems = trending.results.slice(0, 10);
            let currentIndex = 0;

            function updateHero() {
                const item = heroItems[currentIndex];
                currentHeroContent = item;
                
                const title = item.title || item.name;
                const backdrop = getImageUrl(item.backdrop_path);
                const overview = item.overview || 'No description available.';
                const mediaType = item.media_type || 'movie';
                const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
                const year = (item.release_date || item.first_air_date || '').split('-')[0];

                document.getElementById('heroBg').src = backdrop;
                document.getElementById('heroBg').classList.add('active');
                document.getElementById('heroTitle').textContent = title;
                document.getElementById('heroDescription').textContent = overview.length > 200 
                    ? overview.substring(0, 200) + '...' 
                    : overview;
                
                const badge = mediaType === 'movie' ? '🎬 Movie' : '📺 TV Show';
                document.getElementById('heroBadge').textContent = badge;

                const metaHTML = `
                    <div class="hero-meta-item">
                        <i class="fas fa-star"></i>
                        <span>${rating}</span>
                    </div>
                    <div class="hero-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${year || 'N/A'}</span>
                    </div>
                    <div class="hero-meta-item">
                        <i class="fas fa-fire"></i>
                        <span>Trending</span>
                    </div>
                `;
                document.getElementById('heroMeta').innerHTML = metaHTML;

                currentIndex = (currentIndex + 1) % heroItems.length;
            }

            updateHero();
            heroInterval = setInterval(updateHero, 8000);
        }
    } catch (error) {
        console.error('Error loading hero content:', error);
    }
}

function playHeroContent() {
    if (currentHeroContent) {
        showContentDetail(currentHeroContent);
    }
}

function showHeroDetails() {
    if (currentHeroContent) {
        showContentDetail(currentHeroContent);
    }
}

function addHeroToList() {
    if (currentHeroContent) {
        addToMyList(currentHeroContent);
    }
}

// === PAGE LOADERS ===

async function loadHomePage() {
    showLoading();
    const main = document.getElementById('mainContent');
    
    try {
        const [trending, popularMovies, popularShows, topRated, upcoming] = await Promise.all([
            fetchAPI('/trending/all/week'),
            fetchAPI('/movie/popular'),
            fetchAPI('/tv/popular'),
            fetchAPI('/movie/top_rated'),
            fetchAPI('/movie/upcoming')
        ]);

        let html = '';

        // Continue Watching
        if (watchHistory.length > 0) {
            html += createSection('Continue Watching', watchHistory.slice(0, 10).reverse(), 'continue', true);
        }

        // My List
        if (myList.length > 0) {
            html += createSection('My List', myList.slice(0, 10).reverse(), 'mylist', true);
        }

        // Trending
        if (trending?.results) {
            html += createSection('Trending Now', trending.results.slice(0, settings.itemsPerPage), 'trending', true);
        }

        // Popular Movies
        if (popularMovies?.results) {
            html += createSection('Popular Movies', popularMovies.results.slice(0, settings.itemsPerPage), 'popular-movies');
        }

        // Popular Shows
        if (popularShows?.results) {
            html += createSection('Popular TV Shows', popularShows.results.slice(0, settings.itemsPerPage), 'popular-shows');
        }

        // Top Rated
        if (topRated?.results) {
            html += createSection('Top Rated', topRated.results.slice(0, settings.itemsPerPage), 'top-rated');
        }

        // Upcoming
        if (upcoming?.results) {
            html += createSection('Coming Soon', upcoming.results.slice(0, settings.itemsPerPage), 'upcoming');
        }

        // Genre Sections
        const actionMovies = await fetchAPI('/discover/movie', { with_genres: 28, sort_by: 'popularity.desc' });
        if (actionMovies?.results) {
            html += createSection('Action Movies', actionMovies.results.slice(0, settings.itemsPerPage), 'action');
        }

        const comedy = await fetchAPI('/discover/movie', { with_genres: 35, sort_by: 'popularity.desc' });
        if (comedy?.results) {
            html += createSection('Comedy', comedy.results.slice(0, settings.itemsPerPage), 'comedy');
        }

        const horror = await fetchAPI('/discover/movie', { with_genres: 27, sort_by: 'popularity.desc' });
        if (horror?.results) {
            html += createSection('Horror', horror.results.slice(0, settings.itemsPerPage), 'horror');
        }

        main.innerHTML = html;
    } catch (error) {
        console.error('Error loading home page:', error);
        main.innerHTML = '<div class="no-results"><i class="fas fa-exclamation-circle"></i><h2>Error loading content</h2><p>Please try again later.</p></div>';
    }
    
    hideLoading();
}

async function loadMoviesPage() {
    showLoading();
    const main = document.getElementById('mainContent');
    
    try {
        const [popular, topRated, upcoming, nowPlaying] = await Promise.all([
            fetchAPI('/movie/popular'),
            fetchAPI('/movie/top_rated'),
            fetchAPI('/movie/upcoming'),
            fetchAPI('/movie/now_playing')
        ]);

        let html = '<div class="filters">';
        const filterGenres = [
            { id: 28, name: 'Action', icon: 'fist-raised' },
            { id: 35, name: 'Comedy', icon: 'laugh' },
            { id: 18, name: 'Drama', icon: 'theater-masks' },
            { id: 27, name: 'Horror', icon: 'ghost' },
            { id: 878, name: 'Sci-Fi', icon: 'robot' },
            { id: 53, name: 'Thriller', icon: 'user-secret' },
            { id: 10749, name: 'Romance', icon: 'heart' },
            { id: 16, name: 'Animation', icon: 'palette' }
        ];
        
        filterGenres.forEach(genre => {
            html += `<button class="filter-btn" onclick="filterByGenre(${genre.id}, 'movie')">
                <i class="fas fa-${genre.icon}"></i> ${genre.name}
            </button>`;
        });
        html += '</div>';

        if (popular?.results) {
            html += createSection('Popular Movies', popular.results.slice(0, settings.itemsPerPage), 'popular-movies');
        }

        if (topRated?.results) {
            html += createSection('Top Rated', topRated.results.slice(0, settings.itemsPerPage), 'top-rated-movies');
        }

        if (nowPlaying?.results) {
            html += createSection('Now Playing', nowPlaying.results.slice(0, settings.itemsPerPage), 'now-playing');
        }

        if (upcoming?.results) {
            html += createSection('Upcoming Movies', upcoming.results.slice(0, settings.itemsPerPage), 'upcoming-movies');
        }

        main.innerHTML = html;
    } catch (error) {
        console.error('Error loading movies page:', error);
        main.innerHTML = '<div class="no-results"><i class="fas fa-exclamation-circle"></i><h2>Error loading movies</h2></div>';
    }
    
    hideLoading();
}

async function loadShowsPage() {
    showLoading();
    const main = document.getElementById('mainContent');
    
    try {
        const [popular, topRated, airingToday, onAir] = await Promise.all([
            fetchAPI('/tv/popular'),
            fetchAPI('/tv/top_rated'),
            fetchAPI('/tv/airing_today'),
            fetchAPI('/tv/on_the_air')
        ]);

        let html = '<div class="filters">';
        const filterGenres = [
            { id: 10759, name: 'Action & Adventure', icon: 'dragon' },
            { id: 35, name: 'Comedy', icon: 'laugh' },
            { id: 18, name: 'Drama', icon: 'theater-masks' },
            { id: 10765, name: 'Sci-Fi & Fantasy', icon: 'hat-wizard' },
            { id: 80, name: 'Crime', icon: 'gavel' },
            { id: 9648, name: 'Mystery', icon: 'search' },
            { id: 16, name: 'Animation', icon: 'palette' },
            { id: 10751, name: 'Family', icon: 'users' }
        ];
        
        filterGenres.forEach(genre => {
            html += `<button class="filter-btn" onclick="filterByGenre(${genre.id}, 'tv')">
                <i class="fas fa-${genre.icon}"></i> ${genre.name}
            </button>`;
        });
        html += '</div>';

        if (popular?.results) {
            html += createSection('Popular TV Shows', popular.results.slice(0, settings.itemsPerPage), 'popular-shows');
        }

        if (topRated?.results) {
            html += createSection('Top Rated', topRated.results.slice(0, settings.itemsPerPage), 'top-rated-shows');
        }

        if (airingToday?.results) {
            html += createSection('Airing Today', airingToday.results.slice(0, settings.itemsPerPage), 'airing-today');
        }

        if (onAir?.results) {
            html += createSection('On Air', onAir.results.slice(0, settings.itemsPerPage), 'on-air');
        }

        main.innerHTML = html;
    } catch (error) {
        console.error('Error loading shows page:', error);
        main.innerHTML = '<div class="no-results"><i class="fas fa-exclamation-circle"></i><h2>Error loading TV shows</h2></div>';
    }
    
    hideLoading();
}

async function loadTrendingPage() {
    showLoading();
    const main = document.getElementById('mainContent');
    
    try {
        const [trendingDay, trendingWeek, trendingMovies, trendingShows] = await Promise.all([
            fetchAPI('/trending/all/day'),
            fetchAPI('/trending/all/week'),
            fetchAPI('/trending/movie/week'),
            fetchAPI('/trending/tv/week')
        ]);

        let html = '';

        if (trendingDay?.results) {
            html += createSection('Trending Today', trendingDay.results.slice(0, settings.itemsPerPage), 'trending-today');
        }

        if (trendingWeek?.results) {
            html += createSection('Trending This Week', trendingWeek.results.slice(0, settings.itemsPerPage), 'trending-week');
        }

        if (trendingMovies?.results) {
            html += createSection('Trending Movies', trendingMovies.results.slice(0, settings.itemsPerPage), 'trending-movies');
        }

        if (trendingShows?.results) {
            html += createSection('Trending TV Shows', trendingShows.results.slice(0, settings.itemsPerPage), 'trending-shows');
        }

        main.innerHTML = html;
    } catch (error) {
        console.error('Error loading trending page:', error);
        main.innerHTML = '<div class="no-results"><i class="fas fa-exclamation-circle"></i><h2>Error loading trending content</h2></div>';
    }
    
    hideLoading();
}

function loadMyListPage() {
    const main = document.getElementById('mainContent');
    
    if (myList.length === 0) {
        main.innerHTML = `
            <div class="no-results">
                <i class="fas fa-bookmark"></i>
                <h2>Your list is empty</h2>
                <p>Add movies and shows to your list to watch them later</p>
                <button class="btn btn-primary" onclick="navigateTo('home')" style="margin-top: 2rem;">
                    <i class="fas fa-home"></i> Browse Content
                </button>
            </div>
        `;
        return;
    }

    let html = createSection('My List', myList.slice().reverse(), 'mylist-page');
    main.innerHTML = html;
}

async function loadGenresPage() {
    showLoading();
    const main = document.getElementById('mainContent');
    
    try {
        let html = '<div class="section"><div class="section-header"><h2 class="section-title"><i class="fas fa-list"></i> Browse by Genre</h2></div>';
        
        html += '<div class="cards-grid">';
        
        const popularGenres = [
            { id: 28, name: 'Action', icon: 'fist-raised', type: 'movie' },
            { id: 35, name: 'Comedy', icon: 'laugh', type: 'movie' },
            { id: 18, name: 'Drama', icon: 'theater-masks', type: 'movie' },
            { id: 27, name: 'Horror', icon: 'ghost', type: 'movie' },
            { id: 878, name: 'Sci-Fi', icon: 'robot', type: 'movie' },
            { id: 53, name: 'Thriller', icon: 'user-secret', type: 'movie' },
            { id: 10749, name: 'Romance', icon: 'heart', type: 'movie' },
            { id: 16, name: 'Animation', icon: 'palette', type: 'movie' },
            { id: 10759, name: 'Action & Adventure', icon: 'dragon', type: 'tv' },
            { id: 80, name: 'Crime', icon: 'gavel', type: 'movie' },
            { id: 99, name: 'Documentary', icon: 'file-video', type: 'movie' },
            { id: 10751, name: 'Family', icon: 'users', type: 'movie' }
        ];

        for (const genre of popularGenres) {
            const data = await fetchAPI(`/discover/${genre.type}`, { 
                with_genres: genre.id, 
                sort_by: 'popularity.desc' 
            });
            
            if (data?.results && data.results[0]) {
                const poster = getImageUrl(data.results[0].poster_path, 'w500');
                html += `
                    <div class="card" onclick="filterByGenre(${genre.id}, '${genre.type}')" style="cursor: pointer;">
                        <div class="card-poster-container">
                            <img src="${poster}" alt="${genre.name}" class="card-poster">
                            <div class="card-overlay">
                                <h3 class="card-title" style="font-size: 1.5rem;">
                                    <i class="fas fa-${genre.icon}"></i> ${genre.name}
                                </h3>
                                <p style="color: var(--text-dim);">Explore ${genre.name} ${genre.type === 'movie' ? 'movies' : 'shows'}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
        html += '</div></div>';
        main.innerHTML = html;
    } catch (error) {
        console.error('Error loading genres page:', error);
    }
    
    hideLoading();
}

async function filterByGenre(genreId, type = 'movie') {
    showLoading();
    const main = document.getElementById('mainContent');
    
    try {
        const genreName = genres.find(g => g.id === genreId)?.name || 'Genre';
        const data = await fetchAPI(`/discover/${type}`, { 
            with_genres: genreId, 
            sort_by: 'popularity.desc' 
        });
        
        let html = `
            <button class="btn btn-secondary" onclick="navigateTo('${type === 'movie' ? 'movies' : 'shows'}')" style="margin-bottom: 2rem;">
                <i class="fas fa-arrow-left"></i> Back
            </button>
        `;
        
        if (data?.results) {
            html += createSection(`${genreName} ${type === 'movie' ? 'Movies' : 'TV Shows'}`, data.results, `genre-${genreId}`);
        } else {
            html += '<div class="no-results"><i class="fas fa-film"></i><h2>No content found</h2></div>';
        }

        main.innerHTML = html;
    } catch (error) {
        console.error('Error filtering by genre:', error);
    }
    
    hideLoading();
}

// === UTILITY FUNCTIONS ===

function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function initScrollToTop() {
    const scrollBtn = document.getElementById('scrollTop');
    if (scrollBtn) {
        scrollBtn.addEventListener('click', scrollToTop);
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === DATA MANAGEMENT ===

function clearHistory() {
    if (confirm('Are you sure you want to clear your watch history?')) {
        watchHistory = [];
        saveToStorage();
        showToast('Watch history cleared');
        if (currentPage === 'home') loadHomePage();
    }
}

function clearMyList() {
    if (confirm('Are you sure you want to clear your list?')) {
        myList = [];
        saveToStorage();
        showToast('My list cleared');
        if (currentPage === 'mylist') loadMyListPage();
        else if (currentPage === 'home') loadHomePage();
    }
}

function exportData() {
    const data = {
        watchHistory,
        myList,
        settings,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zen-shows-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.watchHistory) watchHistory = data.watchHistory;
            if (data.myList) myList = data.myList;
            if (data.settings) settings = { ...settings, ...data.settings };
            
            saveToStorage();
            initializeSettings();
            showToast('Data imported successfully');
            loadHomePage();
        } catch (error) {
            console.error('Error importing data:', error);
            showToast('Error importing data');
        }
    };
    reader.readAsText(file);
}

// === RANDOM PICK ===

async function randomPick() {
    showLoading();
    try {
        const page = Math.floor(Math.random() * 10) + 1;
        const mediaType = Math.random() > 0.5 ? 'movie' : 'tv';
        const data = await fetchAPI(`/discover/${mediaType}`, { 
            sort_by: 'popularity.desc',
            page 
        });
        
        if (data?.results && data.results.length > 0) {
               const randomItem = data.results[Math.floor(Math.random() * data.results.length)];
        randomItem.media_type = mediaType;
        hideLoading();
        showContentDetail(randomItem);
    }
} catch (error) {
    console.error('Error picking random content:', error);
    hideLoading();
    showToast('Error picking random content');
}
    }
// === NEWSLETTER & FOOTER FUNCTIONS ===
function subscribeNewsletter() {
const email = document.getElementById('newsletterEmail').value;
if (email && email.includes('@')) {
showToast('Thank you for subscribing!');
document.getElementById('newsletterEmail').value = '';
} else {
showToast('Please enter a valid email');
}
}
function showPrivacyPolicy() {
alert('Privacy Policy:\n\nZen Shows respects your privacy. All data is stored locally on your device. We do not collect or share any personal information.');
}
function showTerms() {
alert('Terms of Service:\n\nBy using Zen Shows, you agree to use the service for personal entertainment only. Content is provided via third-party sources.');
}
function showDMCA() {
alert('DMCA:\n\nZen Shows does not host any content. All content is provided by third-party embedding services. If you believe any content violates copyright, please contact the respective streaming source.');
}
function showContact() {
alert('Contact Us:\n\nFor questions or feedback, please use the GitHub repository or social media links in the footer.');
}
## SCRIPT.JS - PART 2
```javascript
// ============================================
// ZEN SHOWS - COMPLETE JAVASCRIPT - PART 2
// Search, Cards, Modal, and Content Display Functions
// ============================================

// === SEARCH FUNCTIONS ===

async function liveSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    const searchResults = document.getElementById('searchResults');

    if (!query) {
        searchResults.classList.remove('active');
        return;
    }

    try {
        const data = await fetchAPI('/search/multi', { query });
        
        if (data?.results && data.results.length > 0) {
            let html = '';
            data.results.slice(0, 8).forEach(item => {
                if (item.media_type === 'person') return;
                
                const title = item.title || item.name;
                const poster = getImageUrl(item.poster_path, 'w200');
                const year = (item.release_date || item.first_air_date || '').split('-')[0];
                const mediaType = item.media_type === 'movie' ? 'Movie' : 'TV Show';
                const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

                html += `
                    <div class="search-result-item" onclick='showContentDetail(${JSON.stringify(item).replace(/'/g, "&apos;")})'>
                        <img src="${poster}" alt="${title}" class="search-result-poster">
                        <div class="search-result-info">
                            <div class="search-result-title">${title}</div>
                            <div class="search-result-meta">
                                <span>${mediaType}</span>
                                <span>${year || 'N/A'}</span>
                                <span class="search-result-rating">
                                    <i class="fas fa-star"></i> ${rating}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            searchResults.innerHTML = html;
            searchResults.classList.add('active');
        } else {
            searchResults.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-dim);">No results found</div>';
            searchResults.classList.add('active');
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

async function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (!query) return;
    
    showLoading();
    const main = document.getElementById('mainContent');
    
    try {
        const data = await fetchAPI('/search/multi', { query });
        
        document.getElementById('searchResults').classList.remove('active');
        
        if (data?.results && data.results.length > 0) {
            const filteredResults = data.results.filter(item => item.media_type !== 'person');
            let html = `
                <div class="section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <i class="fas fa-search"></i> Search Results for "${query}"
                        </h2>
                        <button class="btn btn-secondary" onclick="navigateTo('home')">
                            <i class="fas fa-times"></i> Clear Search
                        </button>
                    </div>
                    <div class="cards-grid">
            `;
            
            filteredResults.forEach(item => {
                html += createCard(item);
            });
            
            html += '</div></div>';
            main.innerHTML = html;
        } else {
            main.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h2>No results found for "${query}"</h2>
                    <p>Try different keywords or browse our collection</p>
                    <button class="btn btn-primary" onclick="navigateTo('home')" style="margin-top: 2rem;">
                        <i class="fas fa-home"></i> Browse Content
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Search error:', error);
    }
    
    hideLoading();
}

// === SECTION & CARD CREATION ===

function createSection(title, items, id, horizontal = false) {
    if (!items || items.length === 0) return '';
    
    const containerClass = horizontal ? 'horizontal-scroll' : 'cards-grid';
    
    let html = `
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">
                    <i class="fas fa-${getSectionIcon(id)}"></i> ${title}
                </h2>
            </div>
            <div class="${containerClass}">
    `;
    
    items.forEach(item => {
        html += createCard(item);
    });
    
    html += '</div></div>';
    return html;
}

function getSectionIcon(id) {
    const icons = {
        'continue': 'play-circle',
        'mylist': 'bookmark',
        'trending': 'fire',
        'popular-movies': 'film',
        'popular-shows': 'tv',
        'top-rated': 'star',
        'upcoming': 'calendar',
        'action': 'fist-raised',
        'comedy': 'laugh',
        'horror': 'ghost'
    };
    return icons[id] || 'film';
}

function createCard(item) {
    const title = item.title || item.name;
    const poster = getImageUrl(item.poster_path, 'w500');
    const year = (item.release_date || item.first_air_date || '').split('-')[0];
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
    const isInList = myList.some(listItem => listItem.id === item.id);
    const genreNames = getGenreNames(item.genre_ids || []);
    
    // Check if in watch history
    const historyItem = watchHistory.find(h => h.id === item.id);
    const progress = historyItem ? historyItem.progress || 0 : 0;
    
    const itemData = JSON.stringify(item).replace(/'/g, "&apos;");
    
    let html = `
        <div class="card" onclick='showContentDetail(${itemData})'>
            <div class="card-poster-container">
                <img src="${poster}" alt="${title}" class="card-poster" loading="lazy">
                ${rating > 8 ? '<div class="trending-badge"><i class="fas fa-fire"></i> Hot</div>' : ''}
                ${item.vote_average ? '<div class="quality-badge">HD</div>' : ''}
                ${progress > 0 ? `<div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>` : ''}
                <div class="card-overlay">
                    <h3 class="card-title">${title}</h3>
                    ${genreNames.length > 0 ? `<div class="genre-pills">${genreNames.slice(0, 3).map(g => `<span class="genre-pill">${g}</span>`).join('')}</div>` : ''}
                    <div class="card-info">
                        <span class="card-year">${year || 'N/A'}</span>
                        <span class="card-rating">
                            <i class="fas fa-star"></i> ${rating}
                        </span>
                    </div>
                </div>
                <div class="card-actions" onclick="event.stopPropagation()">
                    <button class="card-action-btn ${isInList ? 'active' : ''}" onclick='toggleMyList(${itemData})' title="${isInList ? 'Remove from list' : 'Add to list'}">
                        <i class="fas fa-${isInList ? 'check' : 'plus'}"></i>
                    </button>
                    <button class="card-action-btn" onclick='shareContent(${itemData})' title="Share">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return html;
}

// === MY LIST FUNCTIONS ===

function toggleMyList(item) {
    const index = myList.findIndex(listItem => listItem.id === item.id);
    
    if (index > -1) {
        myList.splice(index, 1);
        showToast('Removed from My List');
    } else {
        item.addedAt = Date.now();
        myList.push(item);
        showToast('Added to My List');
    }
    
    saveToStorage();
    
    // Refresh page if on mylist page
    if (currentPage === 'mylist') {
        loadMyListPage();
    } else if (currentPage === 'home') {
        loadHomePage();
    }
}

function addToMyList(item) {
    const index = myList.findIndex(listItem => listItem.id === item.id);
    
    if (index === -1) {
        item.addedAt = Date.now();
        myList.push(item);
        showToast('Added to My List');
        saveToStorage();
    } else {
        showToast('Already in your list');
    }
}

function shareContent(item) {
    const title = item.title || item.name;
    const text = `Check out ${title} on Zen Shows!`;
    
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(`${text} ${window.location.href}`).then(() => {
            showToast('Link copied to clipboard!');
        });
    }
}

// === CONTENT DETAIL MODAL ===

async function showContentDetail(item) {
    currentContent = item;
    const modal = document.getElementById('detailModal');
    const modalContent = document.getElementById('modalContent');
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    showLoading();
    
    try {
        const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
        const id = item.id;
        
        // Fetch detailed information
        const [details, credits, similar] = await Promise.all([
            fetchAPI(`/${mediaType}/${id}`),
            fetchAPI(`/${mediaType}/${id}/credits`),
            fetchAPI(`/${mediaType}/${id}/similar`)
        ]);
        
        if (!details) {
            hideLoading();
            return;
        }
        
        const title = details.title || details.name;
        const backdrop = getImageUrl(details.backdrop_path);
        const poster = getImageUrl(details.poster_path, 'w500');
        const overview = details.overview || 'No description available.';
        const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
        const year = (details.release_date || details.first_air_date || '').split('-')[0];
        const runtime = details.runtime || details.episode_run_time?.[0] || 'N/A';
        const genres = details.genres?.map(g => g.name).join(', ') || 'N/A';
        const status = details.status || 'N/A';
        
        const isInList = myList.some(listItem => listItem.id === id);
        
        let html = `
            <div class="modal-backdrop">
                <img src="${backdrop}" alt="${title}" class="modal-backdrop-img">
                <div class="modal-backdrop-overlay"></div>
            </div>
            <div class="modal-info">
                <h2 class="modal-title">${title}</h2>
                <div class="modal-meta">
                    <div class="meta-item">
                        <i class="fas fa-star"></i>
                        <strong>${rating}</strong> Rating
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <strong>${year}</strong>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <strong>${runtime}</strong> ${mediaType === 'movie' ? 'min' : 'min/ep'}
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-film"></i>
                        <strong>${mediaType === 'movie' ? 'Movie' : 'TV Show'}</strong>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-tag"></i>
                        <strong>${genres}</strong>
                    </div>
                </div>
                <p class="modal-overview">${overview}</p>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="playContent()">
                        <i class="fas fa-play"></i> Play Now
                    </button>
                    <button class="btn btn-secondary" onclick="toggleMyList(${JSON.stringify(item).replace(/'/g, "&apos;")})">
                        <i class="fas fa-${isInList ? 'check' : 'plus'}"></i> ${isInList ? 'In My List' : 'Add to List'}
                    </button>
                    <button class="btn btn-secondary" onclick="shareContent(${JSON.stringify(item).replace(/'/g, "&apos;")})">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                    <button class="btn btn-secondary" onclick="downloadInfo()">
                        <i class="fas fa-download"></i> Download Info
                    </button>
                </div>
                
                <div class="source-selector">
                    <label><i class="fas fa-server"></i> Select Streaming Source</label>
                    <select id="sourceSelect" onchange="updateVideoSource()">
                        ${SOURCES.map((source, index) => `
                            <option value="${index}" ${index === settings.defaultSource ? 'selected' : ''}>
                                ${source.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="video-container" id="videoContainer"></div>
        `;
        
        // Add TV Show seasons/episodes
        if (mediaType === 'tv' && details.number_of_seasons) {
            html += await createSeasonsSection(id, details.number_of_seasons);
        }
        
        // Add cast and crew
        if (credits?.cast && credits.cast.length > 0) {
            html += `
                <div class="cast-crew">
                    <h3><i class="fas fa-users"></i> Cast</h3>
                    <div class="cast-scroll">
            `;
            
            credits.cast.slice(0, 10).forEach(person => {
                const profilePic = person.profile_path 
                    ? getImageUrl(person.profile_path, 'w200')
                    : 'https://via.placeholder.com/200x200/1a1a2e/6366f1?text=No+Image';
                    
                html += `
                    <div class="person-card">
                        <img src="${profilePic}" alt="${person.name}" class="person-img">
                        <div class="person-name">${person.name}</div>
                        <div class="person-role">${person.character || 'Unknown'}</div>
                    </div>
                `;
            });
            
            html += '</div></div>';
        }
        
        // Add similar content
        if (similar?.results && similar.results.length > 0) {
            html += createSection('Similar Content', similar.results.slice(0, 10), 'similar', true);
        }
        
        html += '</div>';
        
        modalContent.innerHTML = html;
        hideLoading();
        
        // Load video player
        updateVideoSource();
        
        // Add to watch history
        addToWatchHistory(item);
        
    } catch (error) {
        console.error('Error showing content detail:', error);
        hideLoading();
        modalContent.innerHTML = '<div class="no-results"><i class="fas fa-exclamation-circle"></i><h2>Error loading content details</h2></div>';
    }
}

async function createSeasonsSection(tvId, numberOfSeasons) {
    currentSeason = 1;
    currentEpisode = 1;
    
    let html = `
        <div class="seasons-episodes">
            <h3><i class="fas fa-list-ol"></i> Seasons & Episodes</h3>
            <div class="season-selector">
    `;
    
    for (let i = 1; i <= numberOfSeasons; i++) {
        html += `
            <button class="season-btn ${i === 1 ? 'active' : ''}" onclick="loadSeason(${tvId}, ${i})">
                Season ${i}
            </button>
        `;
    }
    
    html += `
            </div>
            <div class="episodes-grid" id="episodesContainer">
                <div class="loading"><div class="spinner"></div></div>
            </div>
        </div>
    `;
    
    // Load first season episodes
    setTimeout(() => loadSeason(tvId, 1), 100);
    
    return html;
}

async function loadSeason(tvId, seasonNumber) {
    currentSeason = seasonNumber;
    
    // Update active season button
    document.querySelectorAll('.season-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const container = document.getElementById('episodesContainer');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const seasonData = await fetchAPI(`/tv/${tvId}/season/${seasonNumber}`);
        
        if (seasonData?.episodes && seasonData.episodes.length > 0) {
            let html = '';
            seasonData.episodes.forEach((episode, index) => {
                html += `
                    <div class="episode-card ${index === 0 ? 'active' : ''}" onclick="selectEpisode(${tvId}, ${seasonNumber}, ${episode.episode_number})">
                        <div class="episode-number">Episode ${episode.episode_number}</div>
                        <div class="episode-title">${episode.name || `Episode ${episode.episode_number}`}</div>
                        ${settings.spoilers && episode.overview ? `<div class="episode-overview">${episode.overview}</div>` : ''}
                        ${episode.runtime ? `<div class="episode-runtime"><i class="fas fa-clock"></i> ${episode.runtime} min</div>` : ''}
                    </div>
                `;
            });
            container.innerHTML = html;
            
            // Auto-select first episode
            if (seasonData.episodes[0]) {
                currentEpisode = seasonData.episodes[0].episode_number;
                updateVideoSource();
            }
        } else {
            container.innerHTML = '<div class="no-results"><i class="fas fa-tv"></i><h3>No episodes found</h3></div>';
        }
    } catch (error) {
        console.error('Error loading season:', error);
        container.innerHTML = '<div class="no-results"><i class="fas fa-exclamation-circle"></i><h3>Error loading episodes</h3></div>';
    }
}

function selectEpisode(tvId, seasonNumber, episodeNumber) {
    currentSeason = seasonNumber;
    currentEpisode = episodeNumber;
    
    // Update active episode
    document.querySelectorAll('.episode-card').forEach(card => {
        card.classList.remove('active');
    });
    event.target.closest('.episode-card').classList.add('active');
    
    updateVideoSource();
}

function playContent() {
    const videoContainer = document.getElementById('videoContainer');
    if (videoContainer) {
        videoContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function updateVideoSource() {
    if (!currentContent) return;
    
    const sourceSelect = document.getElementById('sourceSelect');
    const sourceIndex = sourceSelect ? parseInt(sourceSelect.value) : settings.defaultSource;
    const source = SOURCES[sourceIndex];
    
    const mediaType = currentContent.media_type || (currentContent.title ? 'movie' : 'tv');
    const id = currentContent.id;
    
    let embedUrl = '';
    
    if (mediaType === 'movie') {
        embedUrl = source.url + source.movie + id;
    } else {
        embedUrl = source.url + source.tv + id;
        if (currentSeason && currentEpisode) {
            embedUrl += `/${currentSeason}/${currentEpisode}`;
        }
    }
    
    const videoContainer = document.getElementById('videoContainer');
    if (videoContainer) {
        videoContainer.innerHTML = `<iframe src="${embedUrl}" allowfullscreen></iframe>`;
    }
}

function closeModal() {
    document.getElementById('detailModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    currentContent = null;
}

function addToWatchHistory(item) {
    // Remove if already exists
    const index = watchHistory.findIndex(h => h.id === item.id);
    if (index > -1) {
        watchHistory.splice(index, 1);
    }
    
    // Add to beginning with timestamp
    item.watchedAt = Date.now();
    item.progress = 0; // Can be updated with actual progress
    watchHistory.unshift(item);
    
    // Keep only last 50 items
    if (watchHistory.length > 50) {
        watchHistory = watchHistory.slice(0, 50);
    }
    
    saveToStorage();
}

function downloadInfo() {
    if (!currentContent) return;
    
    const title = currentContent.title || currentContent.name;
    const info = {
        title: title,
        overview: currentContent.overview,
        rating: currentContent.vote_average,
        releaseDate: currentContent.release_date || currentContent.first_air_date,
        genres: getGenreNames(currentContent.genre_ids || []),
        type: currentContent.media_type || (currentContent.title ? 'movie' : 'tv')
    };
    
    const blob = new Blob([JSON.stringify(info, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_info.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Info downloaded');
}
```

