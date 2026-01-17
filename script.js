// ===================================
// STREAMVERSE - ULTIMATE STREAMING SITE
// JavaScript Core Functionality
// ===================================

// ============ CONSTANTS & CONFIG ============
const API_KEY = 'a45420333457411e78d5ad35d6c51a2d';
const API_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

// Streaming sources configuration
const STREAMING_SOURCES = {
    vidsrc: (type, id, season, episode) => {
        if (type === 'tv' && season && episode) {
            return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`;
        }
        return `https://vidsrc.to/embed/${type}/${id}`;
    },
    vidsrc2: (type, id, season, episode) => {
        if (type === 'tv' && season && episode) {
            return `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`;
        }
        return `https://vidsrc.xyz/embed/${type}?tmdb=${id}`;
    },
    embed: (type, id, season, episode) => {
        if (type === 'tv' && season && episode) {
            return `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`;
        }
        return `https://www.2embed.cc/embed/${id}`;
    },
    smashystream: (type, id, season, episode) => {
        if (type === 'tv' && season && episode) {
            return `https://player.smashy.stream/tv/${id}?s=${season}&e=${episode}`;
        }
        return `https://player.smashy.stream/${type}/${id}`;
    },
    autoembed: (type, id, season, episode) => {
        if (type === 'tv' && season && episode) {
            return `https://autoembed.co/tv/tmdb/${id}-${season}-${episode}`;
        }
        return `https://autoembed.co/${type}/tmdb/${id}`;
    },
    '2embed': (type, id, season, episode) => {
        if (type === 'tv' && season && episode) {
            return `https://www.2embed.skin/embedtv/${id}&s=${season}&e=${episode}`;
        }
        return `https://www.2embed.skin/embed/${id}`;
    },
    nontonGo: (type, id, season, episode) => {
        if (type === 'tv' && season && episode) {
            return `https://www.NontonGo.win/embed/tv/${id}/${season}/${episode}`;
        }
        return `https://www.NontonGo.win/embed/${type}/${id}`;
    },
    multiembed: (type, id, season, episode) => {
        if (type === 'tv' && season && episode) {
            return `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;
        }
        return `https://multiembed.mov/?video_id=${id}&tmdb=1`;
    },
    vidsrcpro: (type, id, season, episode) => {
        if (type === 'tv' && season && episode) {
            return `https://vidsrc.pro/embed/tv/${id}/${season}/${episode}`;
        }
        return `https://vidsrc.pro/embed/${type}/${id}`;
    },
    moviesapi: (type, id, season, episode) => {
        if (type === 'tv' && season && episode) {
            return `https://moviesapi.club/tv/${id}-${season}-${episode}`;
        }
        return `https://moviesapi.club/${type}/${id}`;
    }
};

// ============ GLOBAL STATE ============
let currentUser = null;
let currentPage = 'home';
let currentMediaType = 'movie';
let currentMediaId = null;
let currentSeason = 1;
let currentEpisode = 1;
let heroInterval = null;
let heroIndex = 0;
let heroMovies = [];

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Show preloader
    showPreloader();

    // Check authentication
    checkAuth();

    // Initialize event listeners
    initializeEventListeners();

    // Load initial content
    await loadInitialContent();

    // Hide preloader
    setTimeout(hidePreloader, 1500);

    // Initialize navbar scroll effect
    initializeNavbarScroll();

    // Initialize scroll to top
    initializeScrollToTop();

    // Start hero carousel
    startHeroCarousel();
}

function showPreloader() {
    document.getElementById('preloader').classList.remove('hidden');
}

function hidePreloader() {
    document.getElementById('preloader').classList.add('hidden');
}

// ============ AUTHENTICATION ============
function checkAuth() {
    const user = localStorage.getItem('streamverse_user');
    if (user) {
        currentUser = JSON.parse(user);
        updateUserUI();
    } else {
        showLoginModal();
    }
}

function updateUserUI() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.username;
        document.getElementById('userEmail').textContent = currentUser.email;
        document.getElementById('settingsUsername').value = currentUser.username;
        document.getElementById('settingsEmail').value = currentUser.email;
    }
}

function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

function hideLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
}

function showSignupModal() {
    hideLoginModal();
    document.getElementById('signupModal').classList.add('active');
}

function hideSignupModal() {
    document.getElementById('signupModal').classList.remove('active');
}

// ============ EVENT LISTENERS ============
function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Hamburger menu
    document.getElementById('hamburger').addEventListener('click', toggleMobileMenu);

    // Search
    document.getElementById('searchIcon').addEventListener('click', toggleSearch);
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 500));
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch(e);
    });

    // User dropdown
    document.getElementById('userAvatar').addEventListener('click', toggleUserDropdown);
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', handleDropdownAction);
    });

    // Notifications
    document.getElementById('notificationBtn').addEventListener('click', toggleNotifications);
    document.getElementById('clearNotifications').addEventListener('click', clearNotifications);

    // Login/Signup
    document.getElementById('closeLogin').addEventListener('click', hideLoginModal);
    document.getElementById('closeSignup').addEventListener('click', hideSignupModal);
    document.getElementById('showSignup').addEventListener('click', (e) => {
        e.preventDefault();
        showSignupModal();
    });
    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        hideSignupModal();
        showLoginModal();
    });
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);

    // Hero navigation
    document.getElementById('heroPrev').addEventListener('click', previousHero);
    document.getElementById('heroNext').addEventListener('click', nextHero);
    document.getElementById('heroPlayBtn').addEventListener('click', playHeroContent);
    document.getElementById('heroInfoBtn').addEventListener('click', showHeroInfo);
    document.getElementById('heroAddBtn').addEventListener('click', addHeroToList);
    document.getElementById('heroLikeBtn').addEventListener('click', likeHeroContent);

    // Player modal
    document.getElementById('closePlayer').addEventListener('click', closePlayer);
    document.getElementById('serverSelector').addEventListener('change', changeServer);
    document.getElementById('episodeSelector').addEventListener('change', changeEpisode);
    document.getElementById('toggleFullscreen').addEventListener('click', toggleFullscreen);

    // Info modal
    document.getElementById('closeInfo').addEventListener('click', closeInfoModal);
    document.getElementById('infoPlayBtn').addEventListener('click', playFromInfo);
    document.getElementById('infoAddBtn').addEventListener('click', addToListFromInfo);
    document.getElementById('infoLikeBtn').addEventListener('click', likeFromInfo);
    document.getElementById('infoShareBtn').addEventListener('click', shareContent);

    // Person modal
    document.getElementById('closePerson').addEventListener('click', closePersonModal);

    // Settings
    document.getElementById('saveAccount').addEventListener('click', saveAccountSettings);
    document.getElementById('clearHistory').addEventListener('click', clearWatchHistory);
    document.getElementById('clearAllData').addEventListener('click', clearAllData);
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', changeAccentColor);
    });
    document.getElementById('themeSelect').addEventListener('change', changeTheme);

    // Search tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleSearchTab);
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterChange);
    });

    // Movie filters
    document.getElementById('movieGenreFilter')?.addEventListener('change', filterMovies);
    document.getElementById('movieSortFilter')?.addEventListener('change', filterMovies);
    document.getElementById('movieYearFilter')?.addEventListener('change', filterMovies);

    // Series filters
    document.getElementById('seriesGenreFilter')?.addEventListener('change', filterSeries);
    document.getElementById('seriesSortFilter')?.addEventListener('change', filterSeries);

    // Scroll to top
    document.getElementById('scrollTop').addEventListener('click', scrollToTop);

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            document.getElementById('userDropdown').classList.remove('active');
        }
        if (!e.target.closest('.notifications') && !e.target.closest('.notification-panel')) {
            document.getElementById('notificationPanel').classList.remove('active');
        }
    });
}

// ============ NAVIGATION ============
function handleNavigation(e) {
    e.preventDefault();
    const page = e.target.dataset.page;
    navigateTo(page);
}

function navigateTo(page) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });

    // Update active page
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(`${page}Page`).classList.add('active');

    currentPage = page;

    // Close mobile menu
    document.getElementById('navMenu').classList.remove('active');
    document.getElementById('hamburger').classList.remove('active');

    // Load page content
    loadPageContent(page);
}

function toggleMobileMenu() {
    document.getElementById('navMenu').classList.toggle('active');
    document.getElementById('hamburger').classList.toggle('active');
}

// ============ SEARCH ============
function toggleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchContainer = document.querySelector('.search-container');
    searchContainer.classList.toggle('active');
    if (searchContainer.classList.contains('active')) {
        searchInput.focus();
    } else {
        searchInput.value = '';
    }
}

async function handleSearch(e) {
    const query = e.target.value.trim();
    if (query.length < 2) return;

    document.getElementById('searchQuery').textContent = query;
    navigateTo('search');

    try {
        // Search all
        const allResults = await fetchAPI(`/search/multi?query=${encodeURIComponent(query)}`);
        displaySearchResults(allResults.results, 'searchAllGrid');

        // Search movies
        const movieResults = await fetchAPI(`/search/movie?query=${encodeURIComponent(query)}`);
        displaySearchResults(movieResults.results, 'searchMoviesGrid');

        // Search TV
        const tvResults = await fetchAPI(`/search/tv?query=${encodeURIComponent(query)}`);
        displaySearchResults(tvResults.results, 'searchSeriesGrid');

        // Search people
        const peopleResults = await fetchAPI(`/search/person?query=${encodeURIComponent(query)}`);
        displayPeopleResults(peopleResults.results, 'searchPeopleGrid');
    } catch (error) {
        console.error('Search error:', error);
        showToast('Search failed. Please try again.', 'error');
    }
}

function handleSearchTab(e) {
    const tab = e.target.dataset.tab;
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');

    // Show corresponding content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`search${tab.charAt(0).toUpperCase() + tab.slice(1)}Tab`).classList.add('active');
}

// ============ USER DROPDOWN ============
function toggleUserDropdown(e) {
    e.stopPropagation();
    document.getElementById('userDropdown').classList.toggle('active');
}

function handleDropdownAction(e) {
    e.preventDefault();
    const action = e.currentTarget.dataset.action;

    switch (action) {
        case 'profile':
            showToast('Profile feature coming soon!', 'info');
            break;
        case 'settings':
            navigateTo('settings');
            break;
        case 'downloads':
            showToast('Downloads feature coming soon!', 'info');
            break;
        case 'logout':
            handleLogout();
            break;
    }

    document.getElementById('userDropdown').classList.remove('active');
}

function handleLogout() {
    localStorage.removeItem('streamverse_user');
    currentUser = null;
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        location.reload();
    }, 1000);
}

// ============ NOTIFICATIONS ============
function toggleNotifications(e) {
    e.stopPropagation();
    document.getElementById('notificationPanel').classList.toggle('active');
}

function clearNotifications() {
    document.getElementById('notificationList').innerHTML = `
        <div class="empty-state" style="padding: 40px 20px;">
            <i class="fas fa-bell-slash"></i>
            <p>No notifications</p>
        </div>
    `;
    document.querySelector('.notification-badge').style.display = 'none';
    showToast('Notifications cleared', 'success');
}

// ============ LOGIN/SIGNUP ============
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Get stored user
    const storedUser = localStorage.getItem('streamverse_user');
    
    if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.email === email && user.password === password) {
            currentUser = user;
            updateUserUI();
            hideLoginModal();
            showToast('Welcome back!', 'success');
            return;
        }
    }

    // Demo login - accept any credentials
    currentUser = {
        username: email.split('@')[0],
        email: email,
        password: password
    };
    
    localStorage.setItem('streamverse_user', JSON.stringify(currentUser));
    updateUserUI();
    hideLoginModal();
    showToast('Login successful!', 'success');
}

function handleSignup(e) {
    e.preventDefault();
    
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }

    currentUser = {
        username: username,
        email: email,
        password: password
    };

    localStorage.setItem('streamverse_user', JSON.stringify(currentUser));
    updateUserUI();
    hideSignupModal();
    showToast('Account created successfully!', 'success');
}

// ============ API FUNCTIONS ============
async function fetchAPI(endpoint) {
    const url = `${API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('API request failed');
    return await response.json();
}

function getImageUrl(path, size = 'w500') {
    if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
    return `${IMG_BASE}/${size}${path}`;
}
// ============ LOAD INITIAL CONTENT ============
async function loadInitialContent() {
    try {
        // Load hero movies
        const trending = await fetchAPI('/trending/all/day');
        heroMovies = trending.results.slice(0, 5);
        displayHeroSection();

        // Load continue watching
        loadContinueWatching();

        // Load content rows
        await Promise.all([
            loadTrendingNow(),
            loadPopularMovies(),
            loadTopRatedSeries(),
            loadActionMovies(),
            loadComedyMovies(),
            loadSciFiMovies(),
            loadHorrorMovies(),
            loadDocumentaries()
        ]);
    } catch (error) {
        console.error('Error loading content:', error);
        showToast('Failed to load content', 'error');
    }
}

// ============ HERO SECTION ============
function displayHeroSection() {
    if (heroMovies.length === 0) return;

    const hero = heroMovies[heroIndex];
    const mediaType = hero.media_type || 'movie';
    
    const heroSection = document.querySelector('.hero-background::before');
    document.querySelector('.hero-background').style.setProperty('--hero-bg', `url(${getImageUrl(hero.backdrop_path, 'original')})`);
    
    const style = document.createElement('style');
    style.textContent = `.hero-background::before { background-image: url(${getImageUrl(hero.backdrop_path, 'original')}); }`;
    document.head.appendChild(style);

    document.querySelector('.hero-title').textContent = hero.title || hero.name;
    document.querySelector('.hero-year').textContent = (hero.release_date || hero.first_air_date || '').split('-')[0];
    document.querySelector('.hero-runtime').textContent = mediaType === 'movie' ? '2h 15m' : 'TV Series';
    document.querySelector('.hero-overview').textContent = hero.overview;
    
    // Update rating
    const ratingElement = document.querySelector('.badge-rating');
    if (ratingElement) {
        ratingElement.innerHTML = `<i class="fas fa-star"></i> ${hero.vote_average.toFixed(1)}`;
    }

    // Store current hero data
    document.getElementById('heroPlayBtn').dataset.id = hero.id;
    document.getElementById('heroPlayBtn').dataset.type = mediaType;
    document.getElementById('heroInfoBtn').dataset.id = hero.id;
    document.getElementById('heroInfoBtn').dataset.type = mediaType;
    document.getElementById('heroAddBtn').dataset.id = hero.id;
    document.getElementById('heroAddBtn').dataset.type = mediaType;

    // Update indicators
    updateHeroIndicators();
}

function updateHeroIndicators() {
    const indicatorsContainer = document.getElementById('heroIndicators');
    indicatorsContainer.innerHTML = '';
    
    heroMovies.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.className = `hero-indicator ${index === heroIndex ? 'active' : ''}`;
        indicator.addEventListener('click', () => {
            heroIndex = index;
            displayHeroSection();
        });
        indicatorsContainer.appendChild(indicator);
    });
}

function startHeroCarousel() {
    heroInterval = setInterval(() => {
        nextHero();
    }, 8000);
}

function previousHero() {
    heroIndex = (heroIndex - 1 + heroMovies.length) % heroMovies.length;
    displayHeroSection();
    resetHeroInterval();
}

function nextHero() {
    heroIndex = (heroIndex + 1) % heroMovies.length;
    displayHeroSection();
    resetHeroInterval();
}

function resetHeroInterval() {
    clearInterval(heroInterval);
    startHeroCarousel();
}

function playHeroContent() {
    const btn = document.getElementById('heroPlayBtn');
    const id = btn.dataset.id;
    const type = btn.dataset.type;
    openPlayer(type, id);
}

function showHeroInfo() {
    const btn = document.getElementById('heroInfoBtn');
    const id = btn.dataset.id;
    const type = btn.dataset.type;
    showInfoModal(type, id);
}

function addHeroToList() {
    const btn = document.getElementById('heroAddBtn');
    const id = btn.dataset.id;
    const type = btn.dataset.type;
    addToMyList(type, id);
}

function likeHeroContent() {
    showToast('Added to favorites!', 'success');
    document.getElementById('heroLikeBtn').innerHTML = '<i class="fas fa-heart"></i>';
}

// ============ CONTENT LOADING ============
function loadContinueWatching() {
    const history = JSON.parse(localStorage.getItem('streamverse_history') || '[]');
    const container = document.getElementById('continueWatching');
    
    if (history.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); padding: 20px;">No watch history yet</p>';
        return;
    }

    container.innerHTML = history.slice(0, 10).map(item => createContentCard(item)).join('');
    attachCardEventListeners(container);
}

async function loadTrendingNow() {
    const data = await fetchAPI('/trending/all/day');
    displayContentRow(data.results, 'trendingNow');
}

async function loadPopularMovies() {
    const data = await fetchAPI('/movie/popular');
    displayContentRow(data.results, 'popularMovies');
}

async function loadTopRatedSeries() {
    const data = await fetchAPI('/tv/top_rated');
    displayContentRow(data.results, 'topRatedSeries');
}

async function loadActionMovies() {
    const data = await fetchAPI('/discover/movie?with_genres=28');
    displayContentRow(data.results, 'actionMovies');
}

async function loadComedyMovies() {
    const data = await fetchAPI('/discover/movie?with_genres=35');
    displayContentRow(data.results, 'comedyMovies');
}

async function loadSciFiMovies() {
    const data = await fetchAPI('/discover/movie?with_genres=878');
    displayContentRow(data.results, 'scifiMovies');
}

async function loadHorrorMovies() {
    const data = await fetchAPI('/discover/movie?with_genres=27');
    displayContentRow(data.results, 'horrorMovies');
}

async function loadDocumentaries() {
    const data = await fetchAPI('/discover/movie?with_genres=99');
    displayContentRow(data.results, 'documentaries');
}

function displayContentRow(items, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = items.map(item => createContentCard(item)).join('');
    attachCardEventListeners(container);
}

function createContentCard(item) {
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '').split('-')[0];
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    const progress = item.progress || 0;

    return `
        <div class="content-card" data-id="${item.id}" data-type="${mediaType}">
            <div class="card-image">
                <img src="${getImageUrl(item.poster_path)}" alt="${title}" loading="lazy">
                <div class="card-rating">
                    <i class="fas fa-star"></i> ${rating}
                </div>
                <div class="card-overlay">
                    <div class="card-actions">
                        <button class="card-btn play-btn" title="Play">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="card-btn add-btn" title="Add to List">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="card-btn info-btn" title="More Info">
                            <i class="fas fa-info"></i>
                        </button>
                    </div>
                </div>
                ${progress > 0 ? `
                    <div class="card-progress">
                        <div class="card-progress-bar" style="width: ${progress}%"></div>
                    </div>
                ` : ''}
            </div>
            <div class="card-info">
                <h3 class="card-title">${title}</h3>
                <div class="card-meta">
                    <span>${year}</span>
                    <span>${mediaType === 'movie' ? 'Movie' : 'TV'}</span>
                </div>
            </div>
        </div>
    `;
}

function attachCardEventListeners(container) {
    container.querySelectorAll('.content-card').forEach(card => {
        const id = card.dataset.id;
        const type = card.dataset.type;

        card.querySelector('.play-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            openPlayer(type, id);
        });

        card.querySelector('.add-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            addToMyList(type, id);
        });

        card.querySelector('.info-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            showInfoModal(type, id);
        });

        card.addEventListener('click', () => {
            showInfoModal(type, id);
        });
    });
}

// ============ PAGE CONTENT LOADING ============
async function loadPageContent(page) {
    switch (page) {
        case 'movies':
            await loadMoviesPage();
            break;
        case 'series':
            await loadSeriesPage();
            break;
        case 'trending':
            await loadTrendingPage();
            break;
        case 'mylist':
            loadMyListPage();
            break;
        case 'history':
            loadHistoryPage();
            break;
    }
}

async function loadMoviesPage(page = 1) {
    const genre = document.getElementById('movieGenreFilter')?.value || '';
    const sort = document.getElementById('movieSortFilter')?.value || 'popularity.desc';
    const year = document.getElementById('movieYearFilter')?.value || '';

    let endpoint = `/discover/movie?sort_by=${sort}&page=${page}`;
    if (genre) endpoint += `&with_genres=${genre}`;
    if (year) endpoint += `&primary_release_year=${year}`;

    const data = await fetchAPI(endpoint);
    displaySearchResults(data.results, 'moviesGrid');
    displayPagination(page, data.total_pages, 'moviesPagination', loadMoviesPage);
}

async function loadSeriesPage(page = 1) {
    const genre = document.getElementById('seriesGenreFilter')?.value || '';
    const sort = document.getElementById('seriesSortFilter')?.value || 'popularity.desc';

    let endpoint = `/discover/tv?sort_by=${sort}&page=${page}`;
    if (genre) endpoint += `&with_genres=${genre}`;

    const data = await fetchAPI(endpoint);
    displaySearchResults(data.results, 'seriesGrid');
    displayPagination(page, data.total_pages, 'seriesPagination', loadSeriesPage);
}

async function loadTrendingPage() {
    const timeWindow = document.querySelector('[data-trending].active')?.dataset.trending || 'day';
    const data = await fetchAPI(`/trending/all/${timeWindow}`);
    displaySearchResults(data.results, 'trendingGrid');
}

function loadMyListPage() {
    const myList = JSON.parse(localStorage.getItem('streamverse_mylist') || '[]');
    const container = document.getElementById('mylistGrid');
    
    if (myList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <h3>Your list is empty</h3>
                <p>Add movies and series to your list to watch them later</p>
            </div>
        `;
        return;
    }

    container.innerHTML = myList.map(item => createContentCard(item)).join('');
    attachCardEventListeners(container);
}

function loadHistoryPage() {
    const history = JSON.parse(localStorage.getItem('streamverse_history') || '[]');
    const container = document.getElementById('historyGrid');
    
    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <h3>No watch history</h3>
                <p>Your recently watched content will appear here</p>
            </div>
        `;
        return;
    }

    container.innerHTML = history.map(item => createContentCard(item)).join('');
    attachCardEventListeners(container);
}

function displaySearchResults(items, containerId) {
    const container = document.getElementById(containerId);
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No results found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(item => createContentCard(item)).join('');
    attachCardEventListeners(container);
}

function displayPeopleResults(people, containerId) {
    const container = document.getElementById(containerId);
    if (!people || people.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <h3>No people found</h3>
            </div>
        `;
        return;
    }

    container.innerHTML = people.map(person => `
        <div class="person-card" data-id="${person.id}">
            <img src="${getImageUrl(person.profile_path)}" alt="${person.name}" loading="lazy">
            <div class="person-card-info">
                <h3>${person.name}</h3>
                <p>${person.known_for_department || 'Actor'}</p>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.person-card').forEach(card => {
        card.addEventListener('click', () => {
            showPersonModal(card.dataset.id);
        });
    });
}

function displayPagination(currentPage, totalPages, containerId, loadFunction) {
    const container = document.getElementById(containerId);
    const maxPages = Math.min(totalPages, 500); // TMDB limit
    const maxButtons = 7;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(maxPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    let html = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="loadPage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    if (startPage > 1) {
        html += `<button onclick="loadPage(1)">1</button>`;
        if (startPage > 2) html += `<button disabled>...</button>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="loadPage(${i})">${i}</button>`;
    }

    if (endPage < maxPages) {
        if (endPage < maxPages - 1) html += `<button disabled>...</button>`;
        html += `<button onclick="loadPage(${maxPages})">${maxPages}</button>`;
    }

    html += `
        <button ${currentPage === maxPages ? 'disabled' : ''} onclick="loadPage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    container.innerHTML = html;

    // Store load function
    window.loadPage = loadFunction;
}

// ============ PLAYER ============
function openPlayer(type, id, season = 1, episode = 1) {
    currentMediaType = type;
    currentMediaId = id;
    currentSeason = season;
    currentEpisode = episode;

    // Fetch media details
    fetchAPI(`/${type}/${id}`).then(data => {
        document.getElementById('playerTitle').textContent = data.title || data.name;
        document.getElementById('playerYear').textContent = (data.release_date || data.first_air_date || '').split('-')[0];
        document.getElementById('playerRating').innerHTML = `<i class="fas fa-star"></i> ${data.vote_average.toFixed(1)}`;
        document.getElementById('playerGenres').textContent = data.genres?.map(g => g.name).join(', ') || '';
        document.getElementById('playerOverview').textContent = data.overview;

        // Load episodes for TV shows
        if (type === 'tv') {
            loadEpisodes(id, season);
            document.getElementById('episodeSelector').style.display = 'block';
        } else {
            document.getElementById('episodeSelector').style.display = 'none';
        }

        // Load player
        loadPlayer();

        // Show modal
        document.getElementById('playerModal').classList.add('active');

        // Add to history
        addToHistory(type, id, data);
    });
}

function loadPlayer() {
    const server = document.getElementById('serverSelector').value;
    const iframe = document.getElementById('playerIframe');
    const url = STREAMING_SOURCES[server](currentMediaType, currentMediaId, currentSeason, currentEpisode);
    
    iframe.src = url;
}

async function loadEpisodes(tvId, season) {
    const data = await fetchAPI(`/tv/${tvId}/season/${season}`);
    const selector = document.getElementById('episodeSelector');
    
    selector.innerHTML = data.episodes.map(ep => 
        `<option value="${ep.episode_number}">S${season}E${ep.episode_number} - ${ep.name}</option>`
    ).join('');
}

function changeServer() {
    loadPlayer();
}

function changeEpisode() {
    currentEpisode = parseInt(document.getElementById('episodeSelector').value);
    loadPlayer();
}

function closePlayer() {
    document.getElementById('playerModal').classList.remove('active');
    document.getElementById('playerIframe').src = '';
}

function toggleFullscreen() {
    const iframe = document.getElementById('playerIframe');
    if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
    } else if (iframe.webkitRequestFullscreen) {
        iframe.webkitRequestFullscreen();
    }
}
// ============ INFO MODAL ============
async function showInfoModal(type, id) {
    try {
        const data = await fetchAPI(`/${type}/${id}?append_to_response=credits,videos,similar`);
        
        // Set backdrop
        document.getElementById('infoBackdrop').src = getImageUrl(data.backdrop_path, 'original');
        
        // Set title and meta
        document.getElementById('infoTitle').textContent = data.title || data.name;
        document.getElementById('infoRating').textContent = data.vote_average.toFixed(1);
        document.getElementById('infoYear').textContent = (data.release_date || data.first_air_date || '').split('-')[0];
        document.getElementById('infoRuntime').textContent = data.runtime ? `${data.runtime} min` : data.number_of_seasons ? `${data.number_of_seasons} Seasons` : '';
        
        // Set overview
        document.getElementById('infoOverview').textContent = data.overview;
        
        // Set genres
        const genresContainer = document.getElementById('infoGenres');
        genresContainer.innerHTML = data.genres.map(g => `<span class="genre-tag">${g.name}</span>`).join('');
        
        // Set sidebar info
        document.getElementById('infoStatus').textContent = data.status || 'N/A';
        document.getElementById('infoLanguage').textContent = data.original_language?.toUpperCase() || 'N/A';
        document.getElementById('infoBudget').textContent = data.budget ? `$${(data.budget / 1000000).toFixed(1)}M` : 'N/A';
        document.getElementById('infoRevenue').textContent = data.revenue ? `$${(data.revenue / 1000000).toFixed(1)}M` : 'N/A';
        document.getElementById('infoProduction').textContent = data.production_companies?.map(c => c.name).join(', ') || 'N/A';
        
        // Set cast
        if (data.credits?.cast?.length > 0) {
            const castContainer = document.getElementById('infoCast');
            castContainer.innerHTML = data.credits.cast.slice(0, 10).map(person => `
                <div class="cast-card" data-id="${person.id}">
                    <img src="${getImageUrl(person.profile_path)}" alt="${person.name}" loading="lazy">
                    <div class="cast-card-info">
                        <h4>${person.name}</h4>
                        <p>${person.character}</p>
                    </div>
                </div>
            `).join('');
            
            castContainer.querySelectorAll('.cast-card').forEach(card => {
                card.addEventListener('click', () => showPersonModal(card.dataset.id));
            });
            
            document.getElementById('infoCastSection').style.display = 'block';
        } else {
            document.getElementById('infoCastSection').style.display = 'none';
        }
        
        // Set crew
        if (data.credits?.crew?.length > 0) {
            const crewContainer = document.getElementById('infoCrew');
            const importantCrew = data.credits.crew.filter(c => 
                ['Director', 'Producer', 'Screenplay', 'Writer'].includes(c.job)
            ).slice(0, 6);
            
            crewContainer.innerHTML = importantCrew.map(person => `
                <div class="crew-item">
                    <h4>${person.name}</h4>
                    <p>${person.job}</p>
                </div>
            `).join('');
            
            document.getElementById('infoCrewSection').style.display = importantCrew.length > 0 ? 'block' : 'none';
        } else {
            document.getElementById('infoCrewSection').style.display = 'none';
        }
        
        // Set seasons (TV only)
        if (type === 'tv' && data.seasons?.length > 0) {
            const seasonsContainer = document.getElementById('infoSeasons');
            seasonsContainer.innerHTML = data.seasons.map(season => `
                <div class="season-item" data-season="${season.season_number}">
                    <div class="season-poster">
                        <img src="${getImageUrl(season.poster_path)}" alt="${season.name}" loading="lazy">
                    </div>
                    <div class="season-info">
                        <h4>${season.name}</h4>
                        <p>${season.episode_count} Episodes • ${season.air_date?.split('-')[0] || 'TBA'}</p>
                        <p>${season.overview || 'No description available.'}</p>
                    </div>
                </div>
            `).join('');
            
            seasonsContainer.querySelectorAll('.season-item').forEach(item => {
                item.addEventListener('click', () => {
                    const season = parseInt(item.dataset.season);
                    openPlayer(type, id, season, 1);
                });
            });
            
            document.getElementById('infoSeasonsSection').style.display = 'block';
        } else {
            document.getElementById('infoSeasonsSection').style.display = 'none';
        }
        
        // Set videos
        if (data.videos?.results?.length > 0) {
            const videosContainer = document.getElementById('infoVideos');
            videosContainer.innerHTML = data.videos.results.slice(0, 5).map(video => `
                <div class="video-card" data-key="${video.key}">
                    <div class="video-thumbnail">
                        <img src="https://img.youtube.com/vi/${video.key}/mqdefault.jpg" alt="${video.name}" loading="lazy">
                        <div class="video-play-icon">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                    <div class="video-card-info">
                        <h4>${video.name}</h4>
                        <p>${video.type}</p>
                    </div>
                </div>
            `).join('');
            
            videosContainer.querySelectorAll('.video-card').forEach(card => {
                card.addEventListener('click', () => {
                    window.open(`https://www.youtube.com/watch?v=${card.dataset.key}`, '_blank');
                });
            });
            
            document.getElementById('infoVideosSection').style.display = 'block';
        } else {
            document.getElementById('infoVideosSection').style.display = 'none';
        }
        
        // Set similar content
        if (data.similar?.results?.length > 0) {
            displayContentRow(data.similar.results.slice(0, 10), 'infoSimilar');
            document.getElementById('infoSimilarSection').style.display = 'block';
        } else {
            document.getElementById('infoSimilarSection').style.display = 'none';
        }
        
        // Store current media info
        document.getElementById('infoPlayBtn').dataset.id = id;
        document.getElementById('infoPlayBtn').dataset.type = type;
        document.getElementById('infoAddBtn').dataset.id = id;
        document.getElementById('infoAddBtn').dataset.type = type;
        
        // Show modal
        document.getElementById('infoModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading info:', error);
        showToast('Failed to load information', 'error');
    }
}

function closeInfoModal() {
    document.getElementById('infoModal').classList.remove('active');
}

function playFromInfo() {
    const btn = document.getElementById('infoPlayBtn');
    closeInfoModal();
    openPlayer(btn.dataset.type, btn.dataset.id);
}

function addToListFromInfo() {
    const btn = document.getElementById('infoAddBtn');
    addToMyList(btn.dataset.type, btn.dataset.id);
}

function likeFromInfo() {
    showToast('Added to favorites!', 'success');
    document.getElementById('infoLikeBtn').innerHTML = '<i class="fas fa-heart"></i>';
}

function shareContent() {
    const title = document.getElementById('infoTitle').textContent;
    if (navigator.share) {
        navigator.share({
            title: title,
            text: `Check out ${title} on StreamVerse!`,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!', 'success');
    }
}

// ============ PERSON MODAL ============
async function showPersonModal(personId) {
    try {
        const data = await fetchAPI(`/person/${personId}?append_to_response=combined_credits`);
        
        document.getElementById('personImage').src = getImageUrl(data.profile_path, 'w500');
        document.getElementById('personName').textContent = data.name;
        document.getElementById('personKnownFor').textContent = data.known_for_department;
        document.getElementById('personBirthday').textContent = data.birthday || 'N/A';
        document.getElementById('personBirthplace').textContent = data.place_of_birth || 'N/A';
        document.getElementById('personBio').textContent = data.biography || 'No biography available.';
        
        // Display credits
        if (data.combined_credits?.cast?.length > 0) {
            const sortedCredits = data.combined_credits.cast
                .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
                .slice(0, 12);
            
            displayContentRow(sortedCredits, 'personCredits');
        }
        
        document.getElementById('personModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading person:', error);
        showToast('Failed to load person info', 'error');
    }
}

function closePersonModal() {
    document.getElementById('personModal').classList.remove('active');
}

// ============ MY LIST ============
function addToMyList(type, id) {
    fetchAPI(`/${type}/${id}`).then(data => {
        let myList = JSON.parse(localStorage.getItem('streamverse_mylist') || '[]');
        
        const exists = myList.some(item => item.id === parseInt(id) && item.media_type === type);
        
        if (exists) {
            myList = myList.filter(item => !(item.id === parseInt(id) && item.media_type === type));
            showToast('Removed from My List', 'info');
        } else {
            myList.unshift({
                id: data.id,
                title: data.title || data.name,
                name: data.name || data.title,
                poster_path: data.poster_path,
                backdrop_path: data.backdrop_path,
                vote_average: data.vote_average,
                release_date: data.release_date || data.first_air_date,
                first_air_date: data.first_air_date || data.release_date,
                overview: data.overview,
                media_type: type
            });
            showToast('Added to My List', 'success');
        }
        
        localStorage.setItem('streamverse_mylist', JSON.stringify(myList));
        
        if (currentPage === 'mylist') {
            loadMyListPage();
        }
    });
}

// ============ WATCH HISTORY ============
function addToHistory(type, id, data) {
    let history = JSON.parse(localStorage.getItem('streamverse_history') || '[]');
    
    // Remove if already exists
    history = history.filter(item => !(item.id === parseInt(id) && item.media_type === type));
    
    // Add to beginning
    history.unshift({
        id: data.id,
        title: data.title || data.name,
        name: data.name || data.title,
        poster_path: data.poster_path,
        backdrop_path: data.backdrop_path,
        vote_average: data.vote_average,
        release_date: data.release_date || data.first_air_date,
        first_air_date: data.first_air_date || data.release_date,
        overview: data.overview,
        media_type: type,
        progress: Math.floor(Math.random() * 100), // Random progress for demo
        watched_at: new Date().toISOString()
    });
    
    // Keep only last 50
    history = history.slice(0, 50);
    
    localStorage.setItem('streamverse_history', JSON.stringify(history));
}

function clearWatchHistory() {
    if (confirm('Are you sure you want to clear your watch history?')) {
        localStorage.removeItem('streamverse_history');
        loadHistoryPage();
        showToast('Watch history cleared', 'success');
    }
}

// ============ SETTINGS ============
function saveAccountSettings() {
    const username = document.getElementById('settingsUsername').value;
    const email = document.getElementById('settingsEmail').value;
    
    if (currentUser) {
        currentUser.username = username;
        currentUser.email = email;
        localStorage.setItem('streamverse_user', JSON.stringify(currentUser));
        updateUserUI();
        showToast('Settings saved successfully', 'success');
    }
}

function changeAccentColor(e) {
    const color = e.target.dataset.color;
    document.documentElement.style.setProperty('--primary-color', color);
    
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('active');
    });
    e.target.classList.add('active');
    
    localStorage.setItem('streamverse_accent_color', color);
    showToast('Accent color changed', 'success');
}

function changeTheme(e) {
    const theme = e.target.value;
    // Theme switching would go here
    showToast(`Theme changed to ${theme}`, 'info');
}

function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localStorage.removeItem('streamverse_mylist');
        localStorage.removeItem('streamverse_history');
        showToast('All data cleared', 'success');
        setTimeout(() => location.reload(), 1000);
    }
}

// ============ FILTERS ============
function handleFilterChange(e) {
    const filter = e.target.dataset.filter || e.target.dataset.trending;
    
    // Update active button
    e.target.parentElement.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Reload content based on filter
    if (currentPage === 'trending') {
        loadTrendingPage();
    }
}

async function filterMovies() {
    await loadMoviesPage(1);
}

async function filterSeries() {
    await loadSeriesPage(1);
}

// ============ UTILITIES ============
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

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    }[type];
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    document.getElementById('toastContainer').appendChild(toast);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============ NAVBAR SCROLL ============
function initializeNavbarScroll() {
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        const navbar = document.getElementById('navbar');
        
        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

// ============ SCROLL TO TOP ============
function initializeScrollToTop() {
    const scrollBtn = document.getElementById('scrollTop');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// ============ LOAD SETTINGS ON INIT ============
function loadUserSettings() {
    // Load accent color
    const savedColor = localStorage.getItem('streamverse_accent_color');
    if (savedColor) {
        document.documentElement.style.setProperty('--primary-color', savedColor);
        document.querySelector(`[data-color="${savedColor}"]`)?.classList.add('active');
    }
    
    // Load other settings from localStorage
    const autoplayNext = localStorage.getItem('streamverse_autoplay_next');
    if (autoplayNext !== null) {
        document.getElementById('autoplayNext').checked = autoplayNext === 'true';
    }
    
    const autoplayPreviews = localStorage.getItem('streamverse_autoplay_previews');
    if (autoplayPreviews !== null) {
        document.getElementById('autoplayPreviews').checked = autoplayPreviews === 'true';
    }
    
    const videoQuality = localStorage.getItem('streamverse_video_quality');
    if (videoQuality) {
        document.getElementById('videoQuality').value = videoQuality;
    }
    
    const saveHistory = localStorage.getItem('streamverse_save_history');
    if (saveHistory !== null) {
        document.getElementById('saveHistory').checked = saveHistory === 'true';
    }
}

// ============ SAVE SETTINGS ============
document.getElementById('autoplayNext')?.addEventListener('change', (e) => {
    localStorage.setItem('streamverse_autoplay_next', e.target.checked);
});

document.getElementById('autoplayPreviews')?.addEventListener('change', (e) => {
    localStorage.setItem('streamverse_autoplay_previews', e.target.checked);
});

document.getElementById('videoQuality')?.addEventListener('change', (e) => {
    localStorage.setItem('streamverse_video_quality', e.target.value);
});

document.getElementById('saveHistory')?.addEventListener('change', (e) => {
    localStorage.setItem('streamverse_save_history', e.target.checked);
});

document.getElementById('notifyReleases')?.addEventListener('change', (e) => {
    localStorage.setItem('streamverse_notify_releases', e.target.checked);
});

document.getElementById('notifyRecommendations')?.addEventListener('change', (e) => {
    localStorage.setItem('streamverse_notify_recommendations', e.target.checked);
});

document.getElementById('personalizedRecs')?.addEventListener('change', (e) => {
    localStorage.setItem('streamverse_personalized_recs', e.target.checked);
});

document.getElementById('reduceAnimations')?.addEventListener('change', (e) => {
    localStorage.setItem('streamverse_reduce_animations', e.target.checked);
    if (e.target.checked) {
        document.body.style.setProperty('--transition-fast', '0.05s');
        document.body.style.setProperty('--transition-normal', '0.05s');
        document.body.style.setProperty('--transition-slow', '0.05s');
    } else {
        document.body.style.removeProperty('--transition-fast');
        document.body.style.removeProperty('--transition-normal');
        document.body.style.removeProperty('--transition-slow');
    }
});

// Load settings on init
setTimeout(loadUserSettings, 100);

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    // ESC to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.getElementById('userDropdown').classList.remove('active');
        document.getElementById('notificationPanel').classList.remove('active');
    }
    
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
    }
});

// ============ ONLINE/OFFLINE DETECTION ============
window.addEventListener('online', () => {
    showToast('Back online!', 'success');
});

window.addEventListener('offline', () => {
    showToast('You are offline', 'warning');
});

// ============ SERVICE WORKER (Optional) ============
if ('serviceWorker' in navigator) {
    // Service worker registration would go here for PWA support
}

console.log('%c🎬 StreamVerse Loaded Successfully!', 'color: #e50914; font-size: 20px; font-weight: bold;');
console.log('%cEnjoy unlimited streaming!', 'color: #fff; font-size: 14px;');
