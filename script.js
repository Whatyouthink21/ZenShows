// TMDB API Configuration
const TMDB_API_KEY = 'a45420333457411e78d5ad35d6c51a2d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Video Sources Configuration
const VIDEO_SOURCES = [
    { name: 'VidSrc', url: 'https://vidsrc.to/embed' },
    { name: 'VidSrc PRO', url: 'https://vidsrc.pro/embed' },
    { name: 'VidSrc XYZ', url: 'https://vidsrc.xyz/embed' },
    { name: '2Embed', url: 'https://www.2embed.cc/embed' },
    { name: 'SuperEmbed', url: 'https://multiembed.mov/directstream.php' },
    { name: 'Embed.su', url: 'https://embed.su/embed' },
    { name: 'NontonGo', url: 'https://www.NontonGo.win/embed' },
    { name: 'VidLink', url: 'https://vidlink.pro/embed' },
    { name: 'MovieAPI', url: 'https://moviesapi.club' },
    { name: 'SmashyStream', url: 'https://player.smashy.stream' },
    { name: 'AutoEmbed', url: 'https://autoembed.cc/embed/player.php' }
];

// App State
let currentUser = null;
let currentPage = 'home';
let currentMediaType = null;
let currentMediaId = null;
let currentSource = 0;
let currentSeason = 1;
let currentEpisode = 1;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeEventListeners();
    loadNotifications();
    
    if (currentUser) {
        loadHomePage();
    }
});

// Authentication Functions
function checkAuth() {
    const user = localStorage.getItem('zenshows_user');
    if (user) {
        currentUser = JSON.parse(user);
        updateUIForLoggedInUser();
    } else {
        showAuthModal();
    }
}

function showAuthModal() {
    document.getElementById('authModal').classList.add('active');
}

function hideAuthModal() {
    document.getElementById('authModal').classList.remove('active');
}

function updateUIForLoggedInUser() {
    if (currentUser) {
        document.querySelector('.user-avatar').src = currentUser.avatar || 'https://i.pravatar.cc/150?img=68';
    }
}

// Event Listeners
function initializeEventListeners() {
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.dataset.page;
            navigateToPage(page);
        });
    });

    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', openSearch);
    document.getElementById('closeSearch').addEventListener('click', closeSearch);
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 500));

    // Search filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            handleSearch();
        });
    });

    // Notifications
    document.getElementById('notifBtn').addEventListener('click', toggleNotifications);
    document.getElementById('closeNotif').addEventListener('click', toggleNotifications);

    // User dropdown
    document.getElementById('profileLink').addEventListener('click', showProfile);
    document.getElementById('settingsLink').addEventListener('click', showSettings);
    document.getElementById('historyLink').addEventListener('click', showHistory);
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Mobile menu
    document.getElementById('mobileMenuBtn').addEventListener('click', toggleMobileMenu);
    document.getElementById('closeMobileMenu').addEventListener('click', toggleMobileMenu);

    // Mobile menu links
    document.getElementById('mobileProfile').addEventListener('click', showProfile);
    document.getElementById('mobileSettings').addEventListener('click', showSettings);
    document.getElementById('mobileHistory').addEventListener('click', showHistory);
    document.getElementById('mobileLogout').addEventListener('click', logout);

    // Auth forms
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
    document.getElementById('showRegister').addEventListener('click', showRegisterForm);
    document.getElementById('showLogin').addEventListener('click', showLoginForm);
    document.getElementById('closeAuth').addEventListener('click', () => {
        if (currentUser) hideAuthModal();
    });

    // Password toggles
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = e.target.closest('.form-group').querySelector('input');
            const icon = e.target.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

    // Player controls
    document.getElementById('closePlayer').addEventListener('click', closePlayer);
    document.getElementById('sourceBtn').addEventListener('click', toggleSourceSelector);
    document.getElementById('episodesBtn').addEventListener('click', toggleEpisodesPanel);
    document.getElementById('closeDetails').addEventListener('click', closeDetailsModal);
    document.getElementById('closeSettings').addEventListener('click', closeSettings);

    // Trending filters
    document.querySelectorAll('[data-trending]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-trending]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const timeWindow = e.target.dataset.trending;
            loadTrending(timeWindow);
        });
    });
}

// Navigation
function navigateToPage(page) {
    currentPage = page;
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });

    switch(page) {
        case 'home':
            loadHomePage();
            break;
        case 'movies':
            loadMoviesPage();
            break;
        case 'series':
            loadSeriesPage();
            break;
        case 'trending':
            loadTrendingPage();
            break;
        case 'mylist':
            loadMyListPage();
            break;
    }
}

// Load Home Page
async function loadHomePage() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <section class="hero" id="heroSection">
            <div class="hero-bg" id="heroBg"></div>
            <div class="hero-content">
                <div class="hero-badge">
                    <i class="fas fa-crown"></i> Featured
                </div>
                <h1 class="hero-title" id="heroTitle"></h1>
                <div class="hero-meta" id="heroMeta"></div>
                <p class="hero-description" id="heroDescription"></p>
                <div class="hero-buttons">
                    <button class="btn-primary" id="heroPlayBtn">
                        <i class="fas fa-play"></i> Play Now
                    </button>
                    <button class="btn-secondary" id="heroInfoBtn">
                        <i class="fas fa-info-circle"></i> More Info
                    </button>
                    <button class="btn-icon" id="heroAddBtn" title="Add to My List">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn-icon" id="heroShareBtn" title="Share">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
                <div class="hero-stats" id="heroStats"></div>
            </div>
            <div class="hero-overlay"></div>
        </section>

        <section class="content-section" id="continueWatchingSection" style="display:none;">
            <div class="section-header">
                <h2><i class="fas fa-history"></i> Continue Watching</h2>
            </div>
            <div class="content-slider" id="continueWatchingSlider"></div>
        </section>

        <section class="content-section">
            <div class="section-header">
                <h2><i class="fas fa-fire"></i> Trending Now</h2>
                <div class="section-filters">
                    <button class="filter-chip active" data-trending="day">Today</button>
                    <button class="filter-chip" data-trending="week">This Week</button>
                </div>
            </div>
            <div class="content-slider" id="trendingSlider"></div>
        </section>

        <section class="content-section">
            <div class="section-header">
                <h2><i class="fas fa-film"></i> Popular Movies</h2>
            </div>
            <div class="content-slider" id="popularMoviesSlider"></div>
        </section>

        <section class="content-section">
            <div class="section-header">
                <h2><i class="fas fa-tv"></i> Top Rated TV Series</h2>
            </div>
            <div class="content-slider" id="topSeriesSlider"></div>
        </section>

        <section class="content-section">
            <div class="section-header">
                <h2><i class="fas fa-calendar-alt"></i> Coming Soon</h2>
            </div>
            <div class="content-slider" id="upcomingSlider"></div>
        </section>

        <section class="content-section">
            <div class="section-header">
                <h2><i class="fas fa-th"></i> Browse by Genre</h2>
            </div>
            <div class="genre-grid" id="genreGrid"></div>
        </section>
    `;

    // Re-attach event listeners for dynamic content
    attachDynamicEventListeners();

    // Load content
    await loadHeroSection();
    await loadContinueWatching();
    await loadTrending('day');
    await loadPopularMovies();
    await loadTopRatedSeries();
    await loadUpcoming();
    await loadGenres();
}

// Attach event listeners for dynamically created elements
function attachDynamicEventListeners() {
    // Trending filters
    document.querySelectorAll('[data-trending]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-trending]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const timeWindow = e.target.dataset.trending;
            loadTrending(timeWindow);
        });
    });
}

// Load Hero Section
async function loadHeroSection() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        const featured = data.results[0];

        document.getElementById('heroBg').style.backgroundImage = 
            `url(${TMDB_IMAGE_BASE}/original${featured.backdrop_path})`;
        document.getElementById('heroTitle').textContent = featured.title || featured.name;
        
        const year = (featured.release_date || featured.first_air_date || '').split('-')[0];
        const rating = featured.vote_average.toFixed(1);
        const type = featured.media_type === 'movie' ? 'Movie' : 'TV Series';
        
        document.getElementById('heroMeta').innerHTML = `
            <span><i class="fas fa-calendar"></i> ${year}</span>
            <span><i class="fas fa-star" style="color: var(--warning)"></i> ${rating}</span>
            <span><i class="fas fa-film"></i> ${type}</span>
        `;
        
        document.getElementById('heroDescription').textContent = 
            featured.overview.length > 200 ? featured.overview.substring(0, 200) + '...' : featured.overview;
        
        document.getElementById('heroStats').innerHTML = `
            <div>
                <span>Rating</span>
                <span>${rating}/10</span>
            </div>
            <div>
                <span>Votes</span>
                <span>${formatNumber(featured.vote_count)}</span>
            </div>
            <div>
                <span>Popularity</span>
                <span>${formatNumber(featured.popularity)}</span>
            </div>
        `;

        // Hero button events
        document.getElementById('heroPlayBtn').addEventListener('click', () => {
            playMedia(featured.media_type, featured.id);
        });
        
        document.getElementById('heroInfoBtn').addEventListener('click', () => {
            showDetails(featured.media_type, featured.id);
        });
        
        document.getElementById('heroAddBtn').addEventListener('click', () => {
            addToMyList(featured);
            showToast('Added to My List', 'success');
        });
        
        document.getElementById('heroShareBtn').addEventListener('click', () => {
            shareContent(featured);
        });

    } catch (error) {
        console.error('Error loading hero section:', error);
    }
}

// Load Continue Watching
function loadContinueWatching() {
    const history = getWatchHistory();
    if (history.length > 0) {
        document.getElementById('continueWatchingSection').style.display = 'block';
        const slider = document.getElementById('continueWatchingSlider');
        slider.innerHTML = history.map(item => createContentCard(item, true)).join('');
        addCardEventListeners();
    }
}

// Load Trending
async function loadTrending(timeWindow = 'day') {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/trending/all/${timeWindow}?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        const slider = document.getElementById('trendingSlider');
        slider.innerHTML = data.results.map(item => createContentCard(item)).join('');
        addCardEventListeners();
    } catch (error) {
        console.error('Error loading trending:', error);
    }
}

// Load Popular Movies
async function loadPopularMovies() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        const slider = document.getElementById('popularMoviesSlider');
        slider.innerHTML = data.results.map(item => createContentCard({...item, media_type: 'movie'})).join('');
        addCardEventListeners();
    } catch (error) {
        console.error('Error loading popular movies:', error);
    }
}

// Load Top Rated Series
async function loadTopRatedSeries() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/tv/top_rated?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        const slider = document.getElementById('topSeriesSlider');
        slider.innerHTML = data.results.map(item => createContentCard({...item, media_type: 'tv'})).join('');
        addCardEventListeners();
    } catch (error) {
        console.error('Error loading top rated series:', error);
    }
}

// Load Upcoming
async function loadUpcoming() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        const slider = document.getElementById('upcomingSlider');
        slider.innerHTML = data.results.map(item => createContentCard({...item, media_type: 'movie'})).join('');
        addCardEventListeners();
    } catch (error) {
        console.error('Error loading upcoming:', error);
    }
}

// Load Genres
async function loadGenres() {
    try {
        const [movieGenres, tvGenres] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/genre/tv/list?api_key=${TMDB_API_KEY}`).then(r => r.json())
        ]);
        
        const allGenres = [...new Map([...movieGenres.genres, ...tvGenres.genres].map(g => [g.id, g])).values()];
        const grid = document.getElementById('genreGrid');
        grid.innerHTML = allGenres.map(genre => `
            <div class="genre-card" data-genre-id="${genre.id}">
                <span>${genre.name}</span>
            </div>
        `).join('');
        
        document.querySelectorAll('.genre-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const genreId = e.currentTarget.dataset.genreId;
                loadByGenre(genreId);
            });
        });
    } catch (error) {
        console.error('Error loading genres:', error);
    }
}

// Create Content Card
function createContentCard(item, showProgress = false) {
    const title = item.title || item.name;
    const poster = item.poster_path ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    const year = (item.release_date || item.first_air_date || '').split('-')[0];
    const type = item.media_type === 'movie' ? 'Movie' : item.media_type === 'tv' ? 'TV' : 'Media';
    
    const progress = showProgress && item.progress ? `<div class="progress-bar" style="width: ${item.progress}%"></div>` : '';
    
    return `
        <div class="content-card" data-id="${item.id}" data-type="${item.media_type || 'movie'}">
            <img src="${poster}" alt="${title}" class="content-card-poster">
            ${progress}
            ${item.new ? '<div class="badge">NEW</div>' : ''}
            <div class="content-card-overlay">
                <div class="content-card-title">${title}</div>
                <div class="content-card-meta">
                    <span class="rating"><i class="fas fa-star"></i> ${rating}</span>
                    <span>${year}</span>
                    <span>${type}</span>
                </div>
                <div class="content-card-actions">
                    <button class="action-btn play-btn" title="Play">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="action-btn info-btn" title="More Info">
                        <i class="fas fa-info"></i>
                    </button>
                    <button class="action-btn add-btn" title="Add to List">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Add event listeners to cards
function addCardEventListeners() {
    document.querySelectorAll('.content-card').forEach(card => {
        const id = card.dataset.id;
        const type = card.dataset.type;
        
        card.querySelector('.play-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            playMedia(type, id);
        });
        
        card.querySelector('.info-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            showDetails(type, id);
        });
        
        card.querySelector('.add-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            addToMyList({ id, media_type: type });
            showToast('Added to My List', 'success');
        });
        
        card.addEventListener('click', () => {
            showDetails(type, id);
        });
    });
}

// Play Media
async function playMedia(type, id, season = 1, episode = 1) {
    currentMediaType = type;
    currentMediaId = id;
    currentSeason = season;
    currentEpisode = episode;
    
    try {
        const response = await fetch(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        
        const title = data.title || data.name;
        document.getElementById('playerTitle').textContent = title;
        
        if (type === 'tv') {
            document.getElementById('episodesBtn').style.display = 'flex';
            await loadSeasons(id);
        } else {
            document.getElementById('episodesBtn').style.display = 'none';
        }
        
        loadVideoSource(0);
        document.getElementById('playerModal').classList.add('active');
        
        // Add to watch history
        addToHistory({ ...data, media_type: type });
        
    } catch (error) {
        console.error('Error playing media:', error);
        showToast('Error loading video', 'error');
    }
}

// Load Video Source
function loadVideoSource(sourceIndex) {
    currentSource = sourceIndex;
    const source = VIDEO_SOURCES[sourceIndex];
    const frame = document.getElementById('playerFrame');
    const loading = document.getElementById('playerLoading');
    
    loading.style.display = 'flex';
    
    let url;
    if (currentMediaType === 'movie') {
        url = `${source.url}/movie/${currentMediaId}`;
    } else {
        url = `${source.url}/tv/${currentMediaId}/${currentSeason}/${currentEpisode}`;
    }
    
    frame.src = url;
    
    frame.onload = () => {
        loading.style.display = 'none';
    };
    
    // Update source list
    updateSourceList();
}

// Toggle Source Selector
function toggleSourceSelector() {
    const selector = document.getElementById('sourceSelector');
    const episodesPanel = document.getElementById('episodesPanel');
    
    episodesPanel.classList.remove('active');
    selector.classList.toggle('active');
    
    if (selector.classList.contains('active')) {
        loadSources();
    }
}

// Load Sources
function loadSources() {
    const sourceList = document.getElementById('sourceList');
    sourceList.innerHTML = VIDEO_SOURCES.map((source, index) => `
        <div class="source-item ${index === currentSource ? 'active' : ''}" data-index="${index}">
            ${source.name}
        </div>
    `).join('');
    
    document.querySelectorAll('.source-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            loadVideoSource(index);
        });
    });
}

// Update Source List
function updateSourceList() {
    document.querySelectorAll('.source-item').forEach((item, index) => {
        if (index === currentSource) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Toggle Episodes Panel
function toggleEpisodesPanel() {
    const episodesPanel = document.getElementById('episodesPanel');
    const selector = document.getElementById('sourceSelector');
    
    selector.classList.remove('active');
    episodesPanel.classList.toggle('active');
}

// Load Seasons
async function loadSeasons(tvId) {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        
        const seasonsSelector = document.getElementById('seasonsSelector');
        seasonsSelector.innerHTML = data.seasons.filter(s => s.season_number > 0).map(season => `
            <button class="season-btn ${season.season_number === currentSeason ? 'active' : ''}" 
                    data-season="${season.season_number}">
                Season ${season.season_number}
            </button>
        `).join('');
        
        document.querySelectorAll('.season-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const season = parseInt(e.target.dataset.season);
                loadEpisodes(tvId, season);
            });
        });
        
        loadEpisodes(tvId, currentSeason);
    } catch (error) {
        console.error('Error loading seasons:', error);
    }
}

// Load Episodes
async function loadEpisodes(tvId, season) {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/season/${season}?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        
        const episodesList = document.getElementById('episodesList');
        episodesList.innerHTML = data.episodes.map(episode => `
            <div class="episode-item" data-episode="${episode.episode_number}">
                <div class="episode-number">Episode ${episode.episode_number}</div>
                <div class="episode-title">${episode.name}</div>
                <div class="episode-meta">${episode.air_date || 'TBA'} • ${episode.runtime || '--'} min</div>
            </div>
        `).join('');
        
        document.querySelectorAll('.episode-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const episode = parseInt(e.currentTarget.dataset.episode);
                currentSeason = season;
                currentEpisode = episode;
                loadVideoSource(currentSource);
                document.getElementById('episodesPanel').classList.remove('active');
            });
        });
    } catch (error) {
        console.error('Error loading episodes:', error);
    }
}

// Close Player
function closePlayer() {
    document.getElementById('playerModal').classList.remove('active');
    document.getElementById('playerFrame').src = '';
    document.getElementById('sourceSelector').classList.remove('active');
    document.getElementById('episodesPanel').classList.remove('active');
}

// Show Details
async function showDetails(type, id) {
    try {
        const [details, credits, videos, reviews, similar] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/${type}/${id}/credits?api_key=${TMDB_API_KEY}`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/${type}/${id}/videos?api_key=${TMDB_API_KEY}`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/${type}/${id}/reviews?api_key=${TMDB_API_KEY}`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/${type}/${id}/similar?api_key=${TMDB_API_KEY}`).then(r => r.json())
        ]);
        
        const title = details.title || details.name;
        const backdrop = details.backdrop_path ? `${TMDB_IMAGE_BASE}/original${details.backdrop_path}` : '';
        const poster = details.poster_path ? `${TMDB_IMAGE_BASE}/w500${details.poster_path}` : '';
        const rating = details.vote_average.toFixed(1);
        const year = (details.release_date || details.first_air_date || '').split('-')[0];
        const runtime = type === 'movie' ? `${details.runtime} min` : `${details.number_of_seasons} Seasons`;
        const genres = details.genres.map(g => g.name).join(', ');
        
        const detailsContent = document.getElementById('detailsContent');
        detailsContent.innerHTML = `
            <div class="details-hero">
                <img src="${backdrop}" alt="${title}" class="details-hero-bg">
                <div class="details-hero-overlay">
                    <h1>${title}</h1>
                    <div class="hero-meta">
                        <span><i class="fas fa-star" style="color: var(--warning)"></i> ${rating}</span>
                        <span>${year}</span>
                        <span>${runtime}</span>
                    </div>
                    <div class="hero-buttons">
                        <button class="btn-primary" onclick="playMedia('${type}', ${id})">
                            <i class="fas fa-play"></i> Play Now
                        </button>
                        <button class="btn-secondary" onclick="addToMyList({id: ${id}, media_type: '${type}', title: '${title.replace(/'/g, "\\'")}', poster_path: '${details.poster_path}'})">
                            <i class="fas fa-plus"></i> My List
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="details-info">
                <p>${details.overview}</p>
                <p style="margin-top: 1rem;"><strong>Genres:</strong> ${genres}</p>
                ${details.production_companies?.length ? `<p><strong>Studios:</strong> ${details.production_companies.map(c => c.name).join(', ')}</p>` : ''}
            </div>
            
            <div class="details-tabs">
                <button class="tab-btn active" data-tab="cast">Cast & Crew</button>
                <button class="tab-btn" data-tab="videos">Videos</button>
                <button class="tab-btn" data-tab="reviews">Reviews</button>
                <button class="tab-btn" data-tab="similar">Similar</button>
            </div>
            
            <div class="tab-content active" id="castTab">
                <div class="cast-grid">
                    ${credits.cast.slice(0, 12).map(person => `
                        <div class="cast-card">
                            <img src="${person.profile_path ? TMDB_IMAGE_BASE + '/w500' + person.profile_path : 'https://via.placeholder.com/500x750?text=No+Image'}" 
                                 alt="${person.name}" class="cast-photo">
                            <div class="cast-name">${person.name}</div>
                            <div class="cast-character">${person.character || person.job}</div>
                        </div>
                    `).join('')}8:47 PM            </div>
        </div>
        
        <div class="tab-content" id="videosTab">
            <div class="videos-grid">
                ${videos.results.slice(0, 6).map(video => `
                    <div class="video-card" onclick="window.open('https://www.youtube.com/watch?v=${video.key}', '_blank')">
                        <img src="https://img.youtube.com/vi/${video.key}/hqdefault.jpg" alt="${video.name}" class="video-thumbnail">
                        <div class="video-play-icon"><i class="fas fa-play"></i></div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="tab-content" id="reviewsTab">
            <div class="reviews-list">
                ${reviews.results.length ? reviews.results.slice(0, 5).map(review => `
                    <div class="review-card">
                        <div class="review-header">
                            <div class="review-author">
                                <img src="${review.author_details.avatar_path ? (review.author_details.avatar_path.startsWith('/https') ? review.author_details.avatar_path.substring(1) : TMDB_IMAGE_BASE + '/w200' + review.author_details.avatar_path) : 'https://via.placeholder.com/100'}" 
                                     alt="${review.author}" class="review-avatar">
                                <div>
                                    <div style="font-weight: 600;">${review.author}</div>
                                    <div style="font-size: 0.85rem; color: var(--text-dim);">${new Date(review.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>
                            ${review.author_details.rating ? `
                                <div class="review-rating">
                                    <i class="fas fa-star"></i> ${review.author_details.rating}
                                </div>
                            ` : ''}
                        </div>
                        <div class="review-content">${review.content.substring(0, 300)}${review.content.length > 300 ? '...' : ''}</div>
                    </div>
                `).join('') : '<p>No reviews available yet.</p>'}
            </div>
        </div>
        
        <div class="tab-content" id="similarTab">
            <div class="content-slider">
                ${similar.results.slice(0, 10).map(item => createContentCard({...item, media_type: type})).join('')}
            </div>
        </div>
    `;
    
    // Add tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.tab + 'Tab').classList.add('active');
        });
    });
    
    addCardEventListeners();
    document.getElementById('detailsModal').classList.add('active');
    
} catch (error) {
    console.error('Error loading details:', error);
    showToast('Error loading details', 'error');
}
}
// Close Details Modal
function closeDetailsModal() {
document.getElementById('detailsModal').classList.remove('active');
}
// Search Functions
function openSearch() {
document.getElementById('searchOverlay').classList.add('active');
document.getElementById('searchInput').focus();
}
function closeSearch() {
document.getElementById('searchOverlay').classList.remove('active');
document.getElementById('searchInput').value = '';
document.getElementById('searchResults').innerHTML = '';
}
async function handleSearch() {
const query = document.getElementById('searchInput').value.trim();
const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
if (query.length < 2) {
    document.getElementById('searchResults').innerHTML = '';
    return;
}

try {
    let url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    
    if (activeFilter !== 'all') {
        url = `${TMDB_BASE_URL}/search/${activeFilter}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    const results = document.getElementById('searchResults');
    results.innerHTML = data.results.map(item => createContentCard(item)).join('');
    addCardEventListeners();
    
} catch (error) {
    console.error('Error searching:', error);
}
}
// Notifications
function toggleNotifications() {
document.getElementById('notificationsPanel').classList.toggle('active');
}
function loadNotifications() {
const notifications = getNotifications();
const notifList = document.getElementById('notifList');
if (notifications.length === 0) {
    notifList.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-dim);">No notifications</p>';
    return;
}

notifList.innerHTML = notifications.map(notif => `
    <div class="notif-item ${notif.read ? '' : 'unread'}">
        <div class="notif-title">${notif.title}</div>
        <div class="notif-text">${notif.text}</div>
        <div class="notif-time">${notif.time}</div>
    </div>
`).join('');
}
function getNotifications() {
const notifications = localStorage.getItem('zenshows_notifications');
return notifications ? JSON.parse(notifications) : [
{ title: 'Welcome to ZenShows!', text: 'Enjoy unlimited streaming', time: 'Just now', read: false },
{ title: 'New Feature', text: 'Check out our improved player', time: '1 hour ago', read: false },
{ title: 'Recommendation', text: 'New movies added to your list', time: '2 hours ago', read: true }
];
}
// Mobile Menu
function toggleMobileMenu() {
document.getElementById('mobileMenu').classList.toggle('active');
}
// Profile & Settings
function showProfile() {
showToast('Profile feature coming soon!', 'info');
}
function showSettings() {
const settings = getSettings();
const settingsContent = document.getElementById('settingsContent');
settingsContent.innerHTML = `
    <div class="settings-group">
        <h3>Playback</h3>
        <div class="setting-item">
            <div class="setting-label">
                <span>Auto-play next episode</span>
                <span>Automatically play the next episode</span>
            </div>
            <label class="toggle-switch">
                <input type="checkbox" id="autoplay" ${settings.autoplay ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
        <div class="setting-item">
            <div class="setting-label">
                <span>Skip intro</span>
                <span>Skip opening credits when available</span>
            </div>
            <label class="toggle-switch">
                <input type="checkbox" id="skipIntro" ${settings.skipIntro ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
        <div class="setting-item">
            <div class="setting-label">
                <span>Default video quality</span>
            </div>
            <select class="setting-select" id="quality">
                <option value="auto" ${settings.quality === 'auto' ? 'selected' : ''}>Auto</option>
                <option value="1080p" ${settings.quality === '1080p' ? 'selected' : ''}>1080p</option>
                <option value="720p" ${settings.quality === '720p' ? 'selected' : ''}>720p</option>
                <option value="480p" ${settings.quality === '480p' ? 'selected' : ''}>480p</option>
            </select>
        </div>
    </div>
    
    <div class="settings-group">
        <h3>Appearance</h3>
        <div class="setting-item">
            <div class="setting-label">
                <span>Theme</span>
            </div>
            <select class="setting-select" id="theme">
                <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
            </select>
        </div>
    </div>
    
    <div class="settings-group">
        <h3>Notifications</h3>
        <div class="setting-item">
            <div class="setting-label">
                <span>New releases</span>
                <span>Get notified about new content</span>
            </div>
            <label class="toggle-switch">
                <input type="checkbox" id="notifications" ${settings.notifications ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
    </div>
    
    <div class="settings-group">
        <h3>Data</h3>
        <button class="btn-auth" onclick="clearAllData()" style="background: var(--accent);">
            Clear All Data
        </button>
    </div>
`;

// Save settings on change
settingsContent.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('change', saveSettings);
});

document.getElementById('settingsModal').classList.add('active');
}
function closeSettings() {
document.getElementById('settingsModal').classList.remove('active');
}
function getSettings() {
const settings = localStorage.getItem('zenshows_settings');
return settings ? JSON.parse(settings) : {
autoplay: true,
skipIntro: true,
quality: 'auto',
theme: 'dark',
notifications: true
};
}
function saveSettings() {
const settings = {
autoplay: document.getElementById('autoplay')?.checked || false,
skipIntro: document.getElementById('skipIntro')?.checked || false,
quality: document.getElementById('quality')?.value || 'auto',
theme: document.getElementById('theme')?.value || 'dark',
notifications: document.getElementById('notifications')?.checked || false
};
localStorage.setItem('zenshows_settings', JSON.stringify(settings));
showToast('Settings saved', 'success');
}
function clearAllData() {
if (confirm('Are you sure you want to clear all data? This will remove your watch history, list, and settings.')) {
localStorage.removeItem('zenshows_history');
localStorage.removeItem('zenshows_mylist');
localStorage.removeItem('zenshows_settings');
showToast('All data cleared', 'success');
closeSettings();
}
}
// Watch History
function showHistory() {
const history = getWatchHistory();
const mainContent = document.getElementById('mainContent');
mainContent.innerHTML = `
    <div style="max-width: 1400px; margin: 100px auto 0; padding: 2rem;">
        <h1 style="margin-bottom: 2rem;">
            <i class="fas fa-history"></i> Watch History
        </h1>
        <div class="content-slider" style="flex-wrap: wrap;">
            ${history.length ? history.map(item => createContentCard(item)).join('') : '<p>No watch history yet</p>'}
        </div>
    </div>
`;

addCardEventListeners();
}
function addToHistory(item) {
let history = getWatchHistory();
// Remove if already exists
history = history.filter(h => h.id !== item.id);

// Add to beginning
history.unshift({
    ...item,
    watchedAt: new Date().toISOString()
});

// Keep only last 50
history = history.slice(0, 50);

localStorage.setItem('zenshows_history', JSON.stringify(history));
}
function getWatchHistory() {
const history = localStorage.getItem('zenshows_history');
return history ? JSON.parse(history) : [];
}
// My List
function loadMyListPage() {
const myList = getMyList();
const mainContent = document.getElementById('mainContent');
mainContent.innerHTML = `
    <div style="max-width: 1400px; margin: 100px auto 0; padding: 2rem;">
        <h1 style="margin-bottom: 2rem;">
            <i class="fas fa-heart"></i> My List
        </h1>
        <div class="content-slider" style="flex-wrap: wrap;">
            ${myList.length ? myList.map(item => createContentCard(item)).join('') : '<p>Your list is empty. Add some content!</p>'}
        </div>
    </div>
`;

addCardEventListeners();
}
function addToMyList(item) {
let myList = getMyList();
// Check if already in list
if (myList.some(i => i.id === item.id)) {
    showToast('Already in your list', 'warning');
    return;
}

myList.push(item);
localStorage.setItem('zenshows_mylist', JSON.stringify(myList));
}
function getMyList() {
const myList = localStorage.getItem('zenshows_mylist');
return myList ? JSON.parse(myList) : [];
}
// Movies Page
async function loadMoviesPage() {
const mainContent = document.getElementById('mainContent');
mainContent.innerHTML = `
<div style="max-width: 1400px; margin: 100px auto 0; padding: 2rem;">
<h1 style="margin-bottom: 2rem;"><i class="fas fa-film"></i> Movies</h1>
        <div class="section-header">
            <h2>Popular</h2>
        </div>
        <div class="content-slider" id="moviesPopular"></div>
        
        <div class="section-header" style="margin-top: 3rem;">
            <h2>Top Rated</h2>
        </div>
        <div class="content-slider" id="moviesTopRated"></div>
        
        <div class="section-header" style="margin-top: 3rem;">
            <h2>Now Playing</h2>
        </div>
        <div class="content-slider" id="moviesNowPlaying"></div>
    </div>
`;

const [popular, topRated, nowPlaying] = await Promise.all([
    fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`).then(r => r.json()),
    fetch(`${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}`).then(r => r.json()),
    fetch(`${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}`).then(r => r.json())
]);

document.getElementById('moviesPopular').innerHTML = popular.results.map(item => createContentCard({...item, media_type: 'movie'})).join('');
document.getElementById('moviesTopRated').innerHTML = topRated.results.map(item => createContentCard({...item, media_type: 'movie'})).join('');
document.getElementById('moviesNowPlaying').innerHTML = nowPlaying.results.map(item => createContentCard({...item, media_type: 'movie'})).join('');

addCardEventListeners();
}
// Series Page
async function loadSeriesPage() {
const mainContent = document.getElementById('mainContent');
mainContent.innerHTML = `
<div style="max-width: 1400px; margin: 100px auto 0; padding: 2rem;">
<h1 style="margin-bottom: 2rem;"><i class="fas fa-tv"></i> TV Series</h1>
        <div class="section-header">
            <h2>Popular</h2>
        </div>
        <div class="content-slider" id="seriesPopular"></div>
        
        <div class="section-header" style="margin-top: 3rem;">
            <h2>Top Rated</h2>
        </div>
        <div class="content-slider" id="seriesTopRated"></div>
        
        <div class="section-header" style="margin-top: 3rem;">
            <h2>On The Air</h2>
        </div>
        <div class="content-slider" id="seriesOnAir"></div>
    </div>
`;

const [popular, topRated, onAir] = await Promise.all([
    fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}`).then(r => r.json()),
    fetch(`${TMDB_BASE_URL}/tv/top_rated?api_key=${TMDB_API_KEY}`).then(r => r.json()),
    fetch(`${TMDB_BASE_URL}/tv/on_the_air?api_key=${TMDB_API_KEY}`).then(r => r.json())
]);

document.getElementById('seriesPopular').innerHTML = popular.results.map(item => createContentCard({...item, media_type: 'tv'})).join('');
document.getElementById('seriesTopRated').innerHTML = topRated.results.map(item => createContentCard({...item, media_type: 'tv'})).join('');
document.getElementById('seriesOnAir').innerHTML = onAir.results.map(item => createContentCard({...item, media_type: 'tv'})).join('');

addCardEventListeners();
}
// Trending Page
async function loadTrendingPage() {
const mainContent = document.getElementById('mainContent');
mainContent.innerHTML = `
<div style="max-width: 1400px; margin: 100px auto 0; padding: 2rem;">
<h1 style="margin-bottom: 2rem;"><i class="fas fa-fire"></i> Trending</h1>
        <div class="section-header">
            <h2>Today</h2>
        </div>
        <div class="content-slider" id="trendingToday"></div>
        
        <div class="section-header" style="margin-top: 3rem;">
            <h2>This Week</h2>
        </div>
        <div class="content-slider" id="trendingWeek"></div>
    </div>
`;

const [today, week] = await Promise.all([
    fetch(`${TMDB_BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}`).then(r => r.json()),
    fetch(`${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}`).then(r => r.json())
]);

document.getElementById('trendingToday').innerHTML = today.results.map(item => createContentCard(item)).join('');
document.getElementById('trendingWeek').innerHTML = week.results.map(item => createContentCard(item)).join('');

addCardEventListeners();
}
// Load by Genre
async function loadByGenre(genreId) {
try {
const [movies, tv] = await Promise.all([
fetch(${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}).then(r => r.json()),
fetch(${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${genreId}).then(r => r.json())
]);
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div style="max-width: 1400px; margin: 100px auto 0; padding: 2rem;">
            <h1 style="margin-bottom: 2rem;"><i class="fas fa-th"></i> Genre Content</h1>
            
            <div class="section-header">
                <h2>Movies</h2>
            </div>
            <div class="content-slider" id="genreMovies"></div>
            
            <div class="section-header" style="margin-top: 3rem;">
                <h2>TV Series</h2>
            </div>
            <div class="content-slider" id="genreSeries"></div>
        </div>
    `;
    
    document.getElementById('genreMovies').innerHTML = movies.results.map(item => createContentCard({...item, media_type: 'movie'})).join('');
    document.getElementById('genreSeries').innerHTML = tv.results.map(item => createContentCard({...item, media_type: 'tv'})).join('');
    
    addCardEventListeners();
} catch (error) {
    console.error('Error loading genre:', error);
}
}
// Authentication
function handleLogin(e) {
e.preventDefault();
const email = document.getElementById('loginEmail').value;
const password = document.getElementById('loginPassword').value;
// Dummy login - accept any credentials
const user = {
    email,
    name: email.split('@')[0],
    avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70)
};

localStorage.setItem('zenshows_user', JSON.stringify(user));
currentUser = user;

hideAuthModal();
updateUIForLoggedInUser();
loadHomePage();
showToast('Welcome to ZenShows!', 'success');
}
function handleRegister(e) {
e.preventDefault();
const name = document.getElementById('registerName').value;
const email = document.getElementById('registerEmail').value;
const password = document.getElementById('registerPassword').value;
const confirmPassword = document.getElementById('registerConfirmPassword').value;
if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
}

const user = {
    name,
    email,
    avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70)
};

localStorage.setItem('zenshows_user', JSON.stringify(user));
currentUser = user;

hideAuthModal();
updateUIForLoggedInUser();
loadHomePage();
showToast('Account created successfully!', 'success');
}
function showRegisterForm() {
document.getElementById('loginForm').style.display = 'none';
document.getElementById('registerForm').style.display = 'block';
}
function showLoginForm() {
document.getElementById('registerForm').style.display = 'none';
document.getElementById('loginForm').style.display = 'block';
}
function logout() {
localStorage.removeItem('zenshows_user');
currentUser = null;
showAuthModal();
showToast('Logged out successfully', 'success');
}
// Share Content
function shareContent(item) {
const title = item.title || item.name;
const text = Check out ${title} on ZenShows!;
if (navigator.share) {
    navigator.share({ title, text }).catch(() => {});
} else {
    // Fallback - copy to clipboard
    navigator.clipboard.writeText(text);
    showToast('Link copied to clipboard', 'success');
}
}
// Toast Notification
function showToast(message, type = 'info') {
const container = document.getElementById('toastContainer');
const toast = document.createElement('div');
toast.className = toast ${type};
const icon = type === 'success' ? 'check-circle' : 
             type === 'error' ? 'exclamation-circle' : 
             type === 'warning' ? 'exclamation-triangle' : 'info-circle';

toast.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
`;

container.appendChild(toast);

setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
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
function formatNumber(num) {
if (num >= 1000000) {
return (num / 1000000).toFixed(1) + 'M';
}
if (num >= 1000) {
return (num / 1000).toFixed(1) + 'K';
}
return num.toString();
}
