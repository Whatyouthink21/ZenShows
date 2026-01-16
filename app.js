// TMDB API Configuration
const TMDB_API_KEY = 'a45420333457411e78d5ad35d6c51a2d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Video Sources
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initEventListeners();
    loadNotifications();
    if (currentUser) loadHomePage();
});

// Auth
function checkAuth() {
    const user = localStorage.getItem('zenshows_user');
    if (user) {
        currentUser = JSON.parse(user);
        updateUIForUser();
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

function updateUIForUser() {
    if (currentUser) {
        document.querySelector('.user-avatar').src = currentUser.avatar || 'https://i.pravatar.cc/150?img=68';
    }
}

// Event Listeners
function initEventListeners() {
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToPage(e.target.dataset.page);
        });
    });

    document.getElementById('searchBtn').addEventListener('click', openSearch);
    document.getElementById('closeSearch').addEventListener('click', closeSearch);
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 500));

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            handleSearch();
        });
    });

    document.getElementById('notifBtn').addEventListener('click', toggleNotifications);
    document.getElementById('closeNotif').addEventListener('click', toggleNotifications);

    document.getElementById('settingsLink').addEventListener('click', showSettings);
    document.getElementById('historyLink').addEventListener('click', showHistory);
    document.getElementById('logoutBtn').addEventListener('click', logout);

    document.getElementById('mobileMenuBtn').addEventListener('click', toggleMobileMenu);
    document.getElementById('closeMobileMenu').addEventListener('click', toggleMobileMenu);
    document.getElementById('mobileSettings').addEventListener('click', showSettings);
    document.getElementById('mobileHistory').addEventListener('click', showHistory);
    document.getElementById('mobileLogout').addEventListener('click', logout);

    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
    document.getElementById('showRegister').addEventListener('click', showRegisterForm);
    document.getElementById('showLogin').addEventListener('click', showLoginForm);
    document.getElementById('closeAuth').addEventListener('click', () => { if (currentUser) hideAuthModal(); });

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

    document.getElementById('closePlayer').addEventListener('click', closePlayer);
    document.getElementById('sourceBtn').addEventListener('click', toggleSourceSelector);
    document.getElementById('episodesBtn').addEventListener('click', toggleEpisodesPanel);
    document.getElementById('closeDetails').addEventListener('click', closeDetailsModal);
    document.getElementById('closeSettings').addEventListener('click', closeSettings);
}

// Navigation
function navigateToPage(page) {
    currentPage = page;
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });

    switch(page) {
        case 'home': loadHomePage(); break;
        case 'movies': loadMoviesPage(); break;
        case 'series': loadSeriesPage(); break;
        case 'mylist': loadMyListPage(); break;
    }
}

// Load Home Page
async function loadHomePage() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <section class="hero" id="heroSection">
            <div class="hero-bg" id="heroBg"></div>
            <div class="hero-content">
                <div class="hero-badge"><i class="fas fa-crown"></i> Featured</div>
                <h1 class="hero-title" id="heroTitle"></h1>
                <div class="hero-meta" id="heroMeta"></div>
                <p class="hero-description" id="heroDescription"></p>
                <div class="hero-buttons">
                    <button class="btn-primary" id="heroPlayBtn"><i class="fas fa-play"></i> Play Now</button>
                    <button class="btn-secondary" id="heroInfoBtn"><i class="fas fa-info-circle"></i> More Info</button>
                    <button class="btn-icon" id="heroAddBtn"><i class="fas fa-plus"></i></button>
                </div>
                <div class="hero-stats" id="heroStats"></div>
            </div>
            <div class="hero-overlay"></div>
        </section>

        <section class="content-section" id="continueWatchingSection" style="display:none;">
            <div class="section-header"><h2><i class="fas fa-history"></i> Continue Watching</h2></div>
            <div class="content-slider" id="continueWatchingSlider"></div>
        </section>

        <section class="content-section">
            <div class="section-header">
                <h2><i class="fas fa-fire"></i> Trending Now</h2>
                <div class="section-filters">
                    <button class="filter-chip active" data-trending="day">Today</button>
                    <button class="filter-chip" data-trending="week">Week</button>
                </div>
            </div>
            <div class="content-slider" id="trendingSlider"></div>
        </section>

        <section class="content-section">
            <div class="section-header"><h2><i class="fas fa-film"></i> Popular Movies</h2></div>
            <div class="content-slider" id="popularMoviesSlider"></div>
        </section>

        <section class="content-section">
            <div class="section-header"><h2><i class="fas fa-tv"></i> Top Rated Series</h2></div>
            <div class="content-slider" id="topSeriesSlider"></div>
        </section>

        <section class="content-section">
            <div class="section-header"><h2><i class="fas fa-calendar-alt"></i> Coming Soon</h2></div>
            <div class="content-slider" id="upcomingSlider"></div>
        </section>

        <section class="content-section">
            <div class="section-header"><h2><i class="fas fa-th"></i> Browse by Genre</h2></div>
            <div class="genre-grid" id="genreGrid"></div>
        </section>
    `;

    attachDynamicListeners();
    await loadHeroSection();
    await loadContinueWatching();
    await loadTrending('day');
    await loadPopularMovies();
    await loadTopRatedSeries();
    await loadUpcoming();
    await loadGenres();
}

function attachDynamicListeners() {
    document.querySelectorAll('[data-trending]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-trending]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            loadTrending(e.target.dataset.trending);
        });
    });
}

// Load Hero
async function loadHeroSection() {
    try {
        const res = await fetch(`${TMDB_BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        const featured = data.results[0];

        document.getElementById('heroBg').style.backgroundImage = `url(${TMDB_IMAGE_BASE}/original${featured.backdrop_path})`;
        document.getElementById('heroTitle').textContent = featured.title || featured.name;
        
        const year = (featured.release_date || featured.first_air_date || '').split('-')[0];
        const rating = featured.vote_average.toFixed(1);
        const type = featured.media_type === 'movie' ? 'Movie' : 'TV Series';
        
        document.getElementById('heroMeta').innerHTML = `
            <span><i class="fas fa-calendar"></i> ${year}</span>
            <span><i class="fas fa-star" style="color: var(--warning)"></i> ${rating}</span>
            <span><i class="fas fa-film"></i> ${type}</span>
        `;
        
        document.getElementById('heroDescription').textContent = featured.overview.substring(0, 200) + '...';
        
        document.getElementById('heroStats').innerHTML = `
            <div><span>Rating</span><span>${rating}/10</span></div>
            <div><span>Votes</span><span>${formatNumber(featured.vote_count)}</span></div>
        `;

        document.getElementById('heroPlayBtn').onclick = () => playMedia(featured.media_type, featured.id);
        document.getElementById('heroInfoBtn').onclick = () => showDetails(featured.media_type, featured.id);
        document.getElementById('heroAddBtn').onclick = () => { addToMyList(featured); showToast('Added to My List', 'success'); };
    } catch (error) {
        console.error('Error:', error);
    }
}

// Load Continue Watching
function loadContinueWatching() {
    const history = getWatchHistory();
    if (history.length > 0) {
        document.getElementById('continueWatchingSection').style.display = 'block';
        document.getElementById('continueWatchingSlider').innerHTML = history.map(item => createContentCard(item, true)).join('');
        addCardListeners();
    }
}

// Load Trending
async function loadTrending(timeWindow = 'day') {
    try {
        const res = await fetch(`${TMDB_BASE_URL}/trending/all/${timeWindow}?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        document.getElementById('trendingSlider').innerHTML = data.results.map(item => createContentCard(item)).join('');
        addCardListeners();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Load Popular Movies
async function loadPopularMovies() {
    try {
        const res = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        document.getElementById('popularMoviesSlider').innerHTML = data.results.map(item => createContentCard({...item, media_type: 'movie'})).join('');
        addCardListeners();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Load Top Rated Series
async function loadTopRatedSeries() {
    try {
        const res = await fetch(`${TMDB_BASE_URL}/tv/top_rated?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        document.getElementById('topSeriesSlider').innerHTML = data.results.map(item => createContentCard({...item, media_type: 'tv'})).join('');
        addCardListeners();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Load Upcoming
async function loadUpcoming() {
    try {
        const res = await fetch(`${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        document.getElementById('upcomingSlider').innerHTML = data.results.map(item => createContentCard({...item, media_type: 'movie'})).join('');
        addCardListeners();
    } catch (error) {
        console.error('Error:', error);
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
        document.getElementById('genreGrid').innerHTML = allGenres.map(genre => `
            <div class="genre-card" onclick="loadByGenre(${genre.id})">
                <span>${genre.name}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
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
            <div class="content-card-overlay">
                <div class="content-card-title">${title}</div>
                <div class="content-card-meta">
                    <span class="rating"><i class="fas fa-star"></i> ${rating}</span>
                    <span>${year}</span>
                    <span>${type}</span>
                </div>
                <div class="content-card-actions">
                    <button class="action-btn play-btn"><i class="fas fa-play"></i></button>
                    <button class="action-btn info-btn"><i class="fas fa-info"></i></button>
                    <button class="action-btn add-btn"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        </div>
    `;
}

// Add Card Listeners
function addCardListeners() {
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
        
        card.addEventListener('click', () => showDetails(type, id));
    });
}

// Play Media
async function playMedia(type, id, season = 1, episode = 1) {
    currentMediaType = type;
    currentMediaId = id;
    currentSeason = season;
    currentEpisode = episode;
    
    try {
        const res = await fetch(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        
        document.getElementById('playerTitle').textContent = data.title || data.name;
        
        if (type === 'tv') {
            document.getElementById('episodesBtn').style.display = 'flex';
            await loadSeasons(id);
        } else {
            document.getElementById('episodesBtn').style.display = 'none';
        }
        
        loadVideoSource(0);
        document.getElementById('playerModal').classList.add('active');
        addToHistory({ ...data, media_type: type });
    } catch (error) {
        console.error('Error:', error);
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
    frame.onload = () => loading.style.display = 'none';
    updateSourceList();
}

// Toggle Source Selector
function toggleSourceSelector() {
    const selector = document.getElementById('sourceSelector');
    const episodesPanel = document.getElementById('episodesPanel');
    
    episodesPanel.classList.remove('active');
    selector.classList.toggle('active');
    
    if (selector.classList.contains('active')) loadSources();
}

// Load Sources
function loadSources() {
    document.getElementById('sourceList').innerHTML = VIDEO_SOURCES.map((source, index) => `
        <div class="source-item ${index === currentSource ? 'active' : ''}" onclick="loadVideoSource(${index})">
            ${source.name}
        </div>
    `).join('');
}

function updateSourceList() {
    document.querySelectorAll('.source-item').forEach((item, index) => {
        item.classList.toggle('active', index === currentSource);
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
        const res = await fetch(`${TMDB_BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        
        document.getElementById('seasonsSelector').innerHTML = data.seasons.filter(s => s.season_number > 0).map(season => `
            <button class="season-btn ${season.season_number === currentSeason ? 'active' : ''}" 
                    onclick="loadEpisodes(${tvId}, ${season.season_number})">
                Season ${season.season_number}
            </button>
        `).join('');
        
        loadEpisodes(tvId, currentSeason);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Load Episodes
async function loadEpisodes(tvId, season) {
    try {
        const res = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/season/${season}?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        
        document.querySelectorAll('.season-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.season-btn').forEach(btn => {
            if (btn.textContent.includes(season)) btn.classList.add('active');
        });
        
        document.getElementById('episodesList').innerHTML = data.episodes.map(episode => `
            <div class="episode-item" onclick="playEpisode(${season}, ${episode.episode_number})">
                <div class="episode-number">Episode ${episode.episode_number}</div>
                <div class="episode-title">${episode.name}</div>
                <div class="episode-meta">${episode.air_date || 'TBA'}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
    }
}

function playEpisode(season, episode) {
    currentSeason = season;
    currentEpisode = episode;
    loadVideoSource(currentSource);
    document.getElementById('episodesPanel').classList.remove('active');
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
        const [details, credits, videos, similar] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/${type}/${id}/credits?api_key=${TMDB_API_KEY}`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/${type}/${id}/videos?api_key=${TMDB_API_KEY}`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/${type}/${id}/similar?api_key=${TMDB_API_KEY}`).then(r => r.json())
        ]);
        
        const title = details.title || details.name;
        const backdrop = details.backdrop_path ? `${TMDB_IMAGE_BASE}/original${details.backdrop_path}` : '';
        const rating = details.vote_average.toFixed(1);
        const year = (details.release_date || details.first_air_date || '').split('-')[0];
        const runtime = type === 'movie' ? `${details.runtime} min` : `${details.number_of_seasons} Seasons`;
        const genres = details.genres.map(g => g.name).join(', ');
        
        document.getElementById('detailsContent').innerHTML = `
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
                        <button class="btn-secondary" onclick="addToMyList({id: ${id}, media_type: '${type}'})">
                            <i class="fas fa-plus"></i> My List
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="details-info">
                <p>${details.overview}</p>
                <p style="margin-top: 1rem;"><strong>Genres:</strong> ${genres}</p>
            </div>
            
            <div class="details-tabs">
                <button class="tab-btn active" data-tab="cast">Cast & Crew</button>
                <button class="tab-btn" data-tab="videos">Videos</button>
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
                    `).join('')}
                </div>
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
            
            <div class="tab-content" id="similarTab">
                <div class="content-slider">
                    ${similar.results.slice(0, 10).map(item => createContentCard({...item, media_type: type})).join('')}
                </div>
            </div>
        `;
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(e.target.dataset.tab + 'Tab').classList.add('active');
            });
        });
        
        addCardListeners();
        document.getElementById('detailsModal').classList.add('active');
    } catch (error) {
        console.error('Error:', error);
        showToast('Error loading details', 'error');
    }
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.remove('active');
}

// Search
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
        
        const res = await fetch(url);
        const data = await res.json();
        document.getElementById('searchResults').innerHTML = data.results.map(item => createContentCard(item)).join('');
        addCardListeners();
    } catch (error) {
        console.error('Error:', error);
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
        { title: 'Recommendation', text: 'New movies added', time: '2 hours ago', read: true }
    ];
}

// Mobile Menu
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('active');
}

// Settings
function showSettings() {
    const settings = getSettings();
    document.getElementById('settingsContent').innerHTML = `
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
                    <span>Default video quality</span>
                </div>
                <select class="setting-select" id="quality">
                    <option value="auto" ${settings.quality === 'auto' ? 'selected' : ''}>Auto</option>
                    <option value="1080p" ${settings.quality === '1080p' ? 'selected' : ''}>1080p</option>
                    <option value="720p" ${settings.quality === '720p' ? 'selected' : ''}>720p</option>
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
    
    document.getElementById('settingsContent').querySelectorAll('input, select').forEach(input => {
        input.addEventListener('change', saveSettings);
    });
    
    document.getElementById('settingsModal').classList.add('active');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

function getSettings() {
    const settings = localStorage.getItem('zenshows_settings');
    return settings ? JSON.parse(settings) : { autoplay: true, quality: 'auto', notifications: true };
}

function saveSettings() {
    const settings = {
        autoplay: document.getElementById('autoplay')?.checked || false,
        quality: document.getElementById('quality')?.value || 'auto',
        notifications: document.getElementById('notifications')?.checked || false
    };
    localStorage.setItem('zenshows_settings', JSON.stringify(settings));
    showToast('Settings saved', 'success');
}

function clearAllData() {
    if (confirm('Clear all data? This will remove history, list, and settings.')) {
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
    document.getElementById('mainContent').innerHTML = `
        <div style="max-width: 1400px; margin: 100px auto 0; padding: 2rem;">
            <h1 style="margin-bottom: 2rem;"><i class="fas fa-history"></i> Watch History</h1>
            <div class="content-slider" style="flex-wrap: wrap;">
                ${history.length ? history.map(item => createContentCard(item)).join('') : '<p>No watch history yet</p>'}
            </div>
        </div>
    `;
    addCardListeners();
}

function addToHistory(item) {
    let history = getWatchHistory();
    history = history.filter(h => h.id !== item.id);
    history.unshift({ ...item, watchedAt: new Date().toISOString() });
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
    document.getElementById('mainContent').innerHTML = `
        <div style="max-width: 1400px; margin: 100px auto 0; padding: 2rem;">
            <h1 style="margin-bottom: 2rem;"><i class="fas fa-heart"></i> My List</h1>
            <div class="content-slider" style="flex-wrap: wrap;">
                ${myList.length ? myList.map(item => createContentCard(item)).join('') : '<p>Your list is empty</p>'}
            </div>
        </div>
    `;
    addCardListeners();
}

function addToMyList(item) {
    let myList = getMyList();
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
    document.getElementById('mainContent').innerHTML = `
        <div style="max-width: 1400px; margin: 100px auto 0; padding: 2rem;">
            <h1 style="margin-bottom: 2rem;"><i class="fas fa-film"></i> Movies</h1>
            <div class="section-header"><h2>Popular</h2></div>
            <div class="content-slider" id="moviesPopular"></div>
            <div class="section-header" style="margin-top: 3rem;"><h2>Top Rated</h2></div>
            <div class="content-slider" id="moviesTopRated"></div>
        </div>
    `;
    
    const [popular, topRated] = await Promise.all([
        fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`).then(r => r.json()),
        fetch(`${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}`).then(r => r.json())
    ]);
    
    document.getElementById('moviesPopular').innerHTML = popular.results.map(item => createContentCard({...item, media_type: 'movie'})).join('');
    document.getElementById('moviesTopRated').innerHTML = topRated.results.map(item => createContentCard({...item, media_type: 'movie'})).join('');
    addCardListeners();
}

// Series Page
async function loadSeriesPage() {
    document.getElementById('mainContent').innerHTML = `
        <div style="max-width: 1400px; margin: 100px auto 0; padding: 2rem;">
            <h1 style="margin-bottom: 2rem;"><i class="fas fa-tv"></i> TV Series</h1>
            <div class="section-header"><h2>Popular</h2></div>
            <div class="content-slider" id="seriesPopular"></div>
            <div class="section-header" style="margin-top: 3rem;"><h2>Top Rated</h2></div>
            <div class="content-slider" id="seriesTopRated"></div>
        </div>
    `;
    
    const [popular, topRated] = await Promise.all([
        fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}`).then(r => r.json()),
        fetch(`${TMDB_BASE_URL}/tv/top_rated?api_key=${TMDB_API_KEY}`).then(r => r.json())
    ]);
    
    document.getElementById('seriesPopular').innerHTML = popular.results.map(item => createContentCard({...item, media_type: 'tv'})).join('');
    document.getElementById('seriesTopRated').innerHTML = topRated.results.map(item => createContentCard({...item, media_type: 'tv'})).join('');
    addCardListeners();
}

// Load by Genre
async function loadByGenre(genreId) {
    try {
        const [movies, tv] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${genreId}`).then(r => r.json())
        ]);
        
        document.getElementById('mainContent').innerHTML = `
            <div style="max-width: 1400px; margin: 100px auto 0; padding: 2rem;">
                <h1 style="margin-bottom: 2rem;"><i class="fas fa-th"></i> Genre Content</h1>
                <div class="section-header"><h2>Movies</h2></div>
                <div class="content-slider" id="genreMovies"></div>
                <div class="section-header" style="margin-top: 3rem;"><h2>TV Series</h2></div>
                <div class="content-slider" id="genreSeries"></div>
            </div>
        `;
        
        document.getElementById('genreMovies').innerHTML = movies.results.map(item => createContentCard({...item, media_type: 'movie'})).join('');
        document.getElementById('genreSeries').innerHTML = tv.results.map(item => createContentCard({...item, media_type: 'tv'})).join('');
        addCardListeners();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Authentication
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const user = {
        email,
        name: email.split('@')[0],
        avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70)
    };
    localStorage.setItem('zenshows_user', JSON.stringify(user));
    currentUser = user;
    hideAuthModal();
    updateUIForUser();
    loadHomePage();
    showToast('Welcome to ZenShows!', 'success');
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const user = {
        name,
        email,
        avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70)
    };
    localStorage.setItem('zenshows_user', JSON.stringify(user));
    currentUser = user;
    hideAuthModal();
    updateUIForUser();
    loadHomePage();
    showToast('Account created!', 'success');
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
    showToast('Logged out', 'success');
}

// Toast
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Utilities
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}
