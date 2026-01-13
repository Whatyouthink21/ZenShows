/* 
    ZENSHOWS - COMPLETE SCRIPT
    Integrates: TMDB API, Firebase Firestore, UI Logic, Player Sources
*/

// ================= CONFIGURATION =================
const TMDB_KEY = 'a45420333457411e78d5ad35d6c51a2d';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';

// Streaming Sources (6 Sources)
const SOURCES = {
    vidsrc: (id, type, s, e) => `https://vidsrc.xyz/embed/${type}/${id}${type==='tv'?`/${s}/${e}`:''}`,
    vidsrcTo: (id, type, s, e) => `https://vidsrc.to/embed/${type}/${id}${type==='tv'?`/${s}/${e}`:''}`,
    vidsrcMe: (id, type, s, e) => `https://vidsrc.me/embed/${type}?tmdb=${id}${type==='tv'?`&season=${s}&episode=${e}`:''}`,
    autoEmbed: (id, type, s, e) => `https://autoembed.cc/tv/tmdb/${type}/${id}${type==='tv'?`-${s}-${e}`:''}`,
    twoEmbed: (id, type, s, e) => `https://www.2embed.cc/embed${type==='tv'?`/tv`:''}/${id}${type==='tv'?`&s=${s}&e=${e}`:''}`,
    superEmbed: (id, type, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1${type==='tv'?`&s=${s}&e=${e}`:''}`
};

// ================= STATE & UTILITIES =================
let currentMedia = null; 
let deviceId = localStorage.getItem('zenshows_device_id');

// Generate Device ID if not exists
if (!deviceId) {
    deviceId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('zenshows_device_id', deviceId);
}

// Format Date Helper
const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.getFullYear();
};

// Format Runtime Helper
const runtime = (mins) => {
    if(!mins) return 'N/A';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
};

// Toast Notification
const showToast = (msg, type = 'info') => {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `show ${type}`;
    setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
};

// Wait for Firebase to load from index.html module
const initFirebase = () => {
    return new Promise((resolve) => {
        const check = setInterval(() => {
            if (window.db && window.firebaseFuncs) {
                clearInterval(check);
                resolve({ db: window.db, funcs: window.firebaseFuncs });
            }
        }, 100);
    });
};

// ================= FIREBASE LOGIC =================
const { doc, setDoc, getDoc, updateDoc, arrayUnion, collection, getDocs } = window.firebaseFuncs || {};
let db = window.db;

// Add to History
const addToHistory = async (media) => {
    if (!db) return;
    try {
        const ref = doc(db, "users", deviceId);
        const historyItem = {
            id: media.id,
            title: media.title || media.name,
            poster: media.poster_path,
            type: media.media_type || (media.title ? 'movie' : 'tv'),
            timestamp: new Date().toISOString()
        };
        
        const snap = await getDoc(ref);
        let currentHistory = snap.exists() ? (snap.data().history || []) : [];
        
        // Remove duplicate, add to top, limit to 10
        currentHistory = currentHistory.filter(item => item.id !== media.id);
        currentHistory.unshift(historyItem);
        if(currentHistory.length > 10) currentHistory.pop();

        await setDoc(ref, { history: currentHistory }, { merge: true });
        renderHistory(currentHistory);
    } catch (error) {
        console.error("History Error:", error);
    }
};

// Toggle Watchlist
const toggleWatchlist = async (media, btnElement) => {
    if (!db) return;
    try {
        const ref = doc(db, "users", deviceId);
        const snap = await getDoc(ref);
        let currentList = snap.exists() ? (snap.data().watchlist || []) : [];
        
        const index = currentList.findIndex(item => item.id === media.id);
        
        if (index > -1) {
            // Remove
            currentList.splice(index, 1);
            showToast("Removed from Watchlist");
            if(btnElement) btnElement.innerHTML = '<i class="far fa-heart"></i>';
        } else {
            // Add
            currentList.push({
                id: media.id,
                title: media.title || media.name,
                poster: media.poster_path,
                type: media.media_type || (media.title ? 'movie' : 'tv')
            });
            showToast("Added to Watchlist");
            if(btnElement) btnElement.innerHTML = '<i class="fas fa-heart"></i>';
        }
        
        await updateDoc(ref, { watchlist: currentList });
        renderWatchlist(currentList);
    } catch (error) {
        console.error("Watchlist Error:", error);
    }
};

// Check if item exists in watchlist (for UI state)
const isInWatchlist = async (id) => {
    if (!db) return false;
    try {
        const ref = doc(db, "users", deviceId);
        const snap = await getDoc(ref);
        if(snap.exists() && snap.data().watchlist) {
            return snap.data().watchlist.some(item => item.id === id);
        }
        return false;
    } catch (e) { return false; }
};

// Fetch User Data on Load
const fetchUserData = async () => {
    if (!db) return;
    try {
        const ref = doc(db, "users", deviceId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const data = snap.data();
            if(data.history) renderHistory(data.history);
            if(data.watchlist) renderWatchlist(data.watchlist);
        }
    } catch (e) { console.log("No user data yet"); }
};

// Render Lists
const renderHistory = (list) => {
    const wrapper = document.getElementById('history-wrapper');
    const section = document.getElementById('history-section');
    if(list && list.length > 0) section.style.display = 'block';
    else section.style.display = 'none';
    if(!list) list = [];
    wrapper.innerHTML = list.map(item => createCard(item)).join('');
    initSwiper('historySwiper');
};

const renderWatchlist = (list) => {
    const wrapper = document.getElementById('watchlist-wrapper');
    const section = document.getElementById('watchlist-section');
    if(list && list.length > 0) section.style.display = 'block';
    else section.style.display = 'none';
    if(!list) list = [];
    wrapper.innerHTML = list.map(item => createCard(item)).join('');
    initSwiper('watchlistSwiper');
};

// ================= TMDB API =================

const fetchData = async (endpoint) => {
    const res = await fetch(`${TMDB_BASE}${endpoint}?api_key=${TMDB_KEY}`);
    return await res.json();
};

// Load Genres for Dropdowns
const loadGenres = async () => {
    const genres = await fetchData('/genre/movie/list');
    const select = document.getElementById('genre-filter');
    if(select) {
        genres.genres.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.textContent = g.name;
            select.appendChild(opt);
        });
    }
};

// Search Function (Multi)
const searchContent = async (query) => {
    if (query.length < 3) {
        document.getElementById('search-results').style.display = 'none';
        return;
    }
    const res = await fetchData(`/search/multi&query=${encodeURIComponent(query)}`);
    const results = res.results.filter(r => r.media_type !== 'person' && r.poster_path);
    
    const resultsContainer = document.getElementById('search-results');
    if (results.length > 0) {
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = results.slice(0, 5).map(item => `
            <div class="search-item" onclick="openDetails(${item.id}, '${item.media_type}')">
                <img src="${IMG_BASE}${item.poster_path}" alt="">
                <div class="search-info">
                    <h4>${item.title || item.name}</h4>
                    <span>${formatDate(item.release_date || item.first_air_date)} • ${item.media_type.toUpperCase()}</span>
                </div>
            </div>
        `).join('');
    } else {
        resultsContainer.style.display = 'none';
    }
};

// Person Details (Cast/Crew Page Logic)
const loadPersonDetails = async (personId) => {
    // Close other modals
    document.getElementById('details-modal').style.display = 'none';
    document.getElementById('search-results').style.display = 'none';
    
    const details = await fetchData(`/person/${personId}`);
    const credits = await fetchData(`/person/${personId}/combined_credits`);
    
    const modal = document.getElementById('person-modal');
    const content = document.getElementById('person-content');
    
    // Filter and sort known movies
    const knownFor = credits.cast.sort((a,b) => b.vote_count - a.vote_count).slice(0, 10);
    
    content.innerHTML = `
        <div class="person-header">
            <img src="${details.profile_path ? IMG_BASE + details.profile_path : 'https://picsum.photos/200'}" class="person-img">
            <div class="person-meta">
                <h2>${details.name}</h2>
                <p class="born">Born: ${formatDate(details.birthday)} <br> ${details.place_of_birth || ''}</p>
                <p class="biography">${details.biography ? details.biography.substring(0, 600) + '...' : 'No biography available.'}</p>
            </div>
        </div>
        <div class="person-filmography">
            <h3>Known For</h3>
            <div class="filmography-grid">
                ${knownFor.map(m => createCard(m)).join('')}
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
};

// ================= UI COMPONENTS =================

const createCard = (item) => {
    const title = item.title || item.name;
    const date = item.release_date || item.first_air_date;
    const type = item.media_type || (item.title ? 'movie' : 'tv');
    const poster = item.poster_path ? IMG_BASE + item.poster_path : 'https://picsum.photos/seed/movie/300/450';
    
    return `
        <div class="movie-card" onclick="openDetails(${item.id}, '${type}')">
            <div class="poster-wrapper">
                <img src="${poster}" loading="lazy" alt="${title}">
                <div class="card-overlay">
                    <button class="btn-play"><i class="fas fa-play"></i></button>
                </div>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${title}</h3>
                <div class="movie-meta">
                    <span>${formatDate(date)}</span>
                    <span class="rating"><i class="fas fa-star"></i> ${item.vote_average?.toFixed(1)}</span>
                </div>
            </div>
        </div>
    `;
};

// ================= DETAILS & PLAYER LOGIC =================

const openDetails = async (id, type) => {
    // Close Search
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('search-input').value = '';
    
    const data = await fetchData(`/${type}/${id}`);
    const credits = await fetchData(`/${type}/${id}/credits`);
    const similar = await fetchData(`/${type}/${id}/similar`);
    
    currentMedia = { ...data, media_type: type };
    
    // Extract Director
    const director = credits.crew.find(c => c.job === 'Director');
    const castList = credits.cast.slice(0, 6);
    
    const modal = document.getElementById('details-modal');
    const content = document.getElementById('modal-content');
    
    content.innerHTML = `
        <div class="details-hero" style="background-image: url('${IMG_ORIGINAL}${data.backdrop_path}')">
            <div class="details-content">
                <h1>${data.title || data.name}</h1>
                <div class="tags">
                    <span class="tag">${formatDate(data.release_date || data.first_air_date)}</span>
                    <span class="tag">${runtime(data.runtime || data.episode_run_time?.[0])}</span>
                    <span class="tag rating">${data.vote_average.toFixed(1)} <i class="fas fa-star"></i></span>
                </div>
                <p class="overview">${data.overview}</p>
                <div class="details-actions">
                    <button class="btn-primary" onclick="openPlayer('${type}', ${id})"><i class="fas fa-play"></i> Watch Now</button>
                    <button class="btn-secondary" id="modal-wl-btn"><i class="far fa-heart"></i></button>
                </div>
                ${director ? `<p class="director"><strong>Director:</strong> <span class="clickable-name" onclick="loadPersonDetails(${director.id})">${director.name}</span></p>` : ''}
            </div>
        </div>
        
        <div class="details-body">
            <section class="details-section">
                <h3>Cast</h3>
                <div class="cast-list">
                    ${castList.map(c => `
                        <div class="cast-item" onclick="loadPersonDetails(${c.id})">
                            <img src="${c.profile_path ? IMG_BASE + c.profile_path : 'https://picsum.photos/50'}" alt="${c.name}">
                            <div>
                                <p class="actor-name">${c.name}</p>
                                <p class="char-name">${c.character}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
            
            <section class="details-section">
                <h3>You May Also Like</h3>
                <div class="similar-grid">
                    ${similar.results.slice(0,6).map(m => createCard(m)).join('')}
                </div>
            </section>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Check Watchlist State
    const btn = document.getElementById('modal-wl-btn');
    isInWatchlist(id).then(isIn => {
        if(isIn) btn.innerHTML = '<i class="fas fa-heart"></i>';
    });
    btn.onclick = (e) => {
        e.stopPropagation();
        toggleWatchlist(currentMedia, btn);
    };
};

// Player Logic
const openPlayer = (type, id, s = 1, e = 1) => {
    const modal = document.getElementById('player-modal');
    const iframe = document.getElementById('video-frame');
    const tvControls = document.getElementById('tv-controls');
    const serverSelect = document.getElementById('server-select');
    
    // Save to History
    addToHistory(currentMedia);

    // Handle TV Show Controls
    if (type === 'tv') {
        tvControls.style.display = 'flex';
        loadSeasonsEpisodes(id); 
    } else {
        tvControls.style.display = 'none';
    }

    // Load initial source
    updateSource(id, type, s, e, serverSelect.value);
    
    // Set Title
    document.getElementById('playing-title').innerText = currentMedia.title || currentMedia.name;
    
    modal.style.display = 'flex';
};

const updateSource = (id, type, s, e, serverKey) => {
    const iframe = document.getElementById('video-frame');
    const urlFunc = SOURCES[serverKey];
    if (urlFunc) {
        iframe.src = urlFunc(id, type, s, e);
    }
};

// Load Seasons and Episodes for Player
const loadSeasonsEpisodes = async (id) => {
    const details = await fetchData(`/tv/${id}`);
    const sSelect = document.getElementById('season-select');
    const eSelect = document.getElementById('episode-select');
    
    // Populate Seasons
    sSelect.innerHTML = details.seasons.filter(s => s.season_number > 0).map(s => 
        `<option value="${s.season_number}">Season ${s.season_number}</option>`
    ).join('');
    
    // On Season Change -> Fetch Episodes
    sSelect.onchange = async () => {
        const sNum = sSelect.value;
        const seasonData = await fetchData(`/tv/${id}/season/${sNum}`);
        eSelect.innerHTML = seasonData.episodes.map(ep => 
            `<option value="${ep.episode_number}">Ep ${ep.episode_number}: ${ep.name.substring(0, 20)}...</option>`
        ).join('');
        updatePlayerURL();
    };

    // On Episode Change -> Update URL
    eSelect.onchange = updatePlayerURL;

    // Trigger Season 1 Load
    sSelect.dispatchEvent(new Event('change'));
};

const updatePlayerURL = () => {
    const id = currentMedia.id;
    const type = 'tv';
    const s = document.getElementById('season-select').value;
    const e = document.getElementById('episode-select').value;
    const server = document.getElementById('server-select').value;
    updateSource(id, type, s, e, server);
};

// Server Change Event
document.getElementById('server-select').addEventListener('change', () => {
    const id = currentMedia.id;
    const type = currentMedia.media_type;
    const s = type === 'tv' ? document.getElementById('season-select').value : 1;
    const e = type === 'tv' ? document.getElementById('episode-select').value : 1;
    updateSource(id, type, s, e, document.getElementById('server-select').value);
});

// ================= INITIALIZATION =================

const initSwiper = (className) => {
    if (window[className]) window[className].destroy();
    window[className] = new Swiper(`.${className}`, {
        slidesPerView: 2,
        spaceBetween: 10,
        breakpoints: {
            640: { slidesPerView: 3, spaceBetween: 20 },
            768: { slidesPerView: 4, spaceBetween: 20 },
            1024: { slidesPerView: 5, spaceBetween: 20 },
            1400: { slidesPerView: 6, spaceBetween: 20 }
        },
        scrollbar: { el: '.swiper-scrollbar', hide: false },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
    });
};

const renderHero = async () => {
    const data = await fetchData('/trending/all/day');
    const wrapper = document.getElementById('hero-wrapper');
    
    wrapper.innerHTML = data.results.slice(0, 5).map(item => `
        <div class="swiper-slide">
            <div class="hero-item" style="background-image: url('${IMG_ORIGINAL}${item.backdrop_path}')">
                <div class="hero-content">
                    <span class="hero-tag">${item.media_type.toUpperCase()}</span>
                    <h1 class="hero-title">${item.title || item.name}</h1>
                    <p class="hero-desc">${item.overview.substring(0, 150)}...</p>
                    <button class="btn-hero" onclick="openDetails(${item.id}, '${item.media_type}')"><i class="fas fa-play"></i> Watch Now</button>
                </div>
                <div class="hero-fade"></div>
            </div>
        </div>
    `).join('');
    
    new Swiper('.mySwiper', {
        loop: true,
        effect: 'fade',
        autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
    });
};

const loadContent = async () => {
    // Init Firebase wait
    await initFirebase();

    // Remove Preloader
    setTimeout(() => {
        document.getElementById('preloader').style.opacity = '0';
        setTimeout(() => document.getElementById('preloader').remove(), 500);
    }, 1000);

    // Render Sections
    renderHero();
    loadGenres();
    fetchUserData();
    
    const [trending, movies, tv] = await Promise.all([
        fetchData('/trending/all/day'),
        fetchData('/movie/popular'),
        fetchData('/tv/popular')
    ]);
    
    document.getElementById('trending-wrapper').innerHTML = trending.results.map(createCard).join('');
    document.getElementById('movies-wrapper').innerHTML = movies.results.map(createCard).join('');
    document.getElementById('tv-wrapper').innerHTML = tv.results.map(createCard).join('');
    
    initSwiper('trendingSwiper');
    initSwiper('moviesSwiper');
    initSwiper('tvSwiper');
};

// Filters Logic
const applyFilters = async () => {
    const genre = document.getElementById('genre-filter').value;
    const sort = document.getElementById('sort-filter').value;
    const type = document.getElementById('type-filter').value;
    
    // Simple logic: if all selected, fetch trending, else discover
    const endpoint = type === 'tv' ? '/discover/tv' : (type === 'movie' ? '/discover/movie' : '/discover/movie');
    const data = await fetchData(`${endpoint}&with_genres=${genre}&sort_by=${sort}`);
    
    // Update Movies Section for demo
    const wrapper = document.getElementById('movies-wrapper');
    wrapper.innerHTML = data.results.map(createCard).join('');
    
    // Re-init swiper
    wrapper.closest('.swiper').swiper.update();
    showToast('Filters Updated');
};

// ================= GLOBAL EVENT LISTENERS =================

document.addEventListener('DOMContentLoaded', loadContent);

// Search Debounce
document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => searchContent(e.target.value), 500);
});

// Close Modals
document.querySelectorAll('.close-modal, .close-player').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
        document.getElementById('video-frame').src = ''; // Stop video playback
    });
});

// Click Outside Modal
window.onclick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
        document.getElementById('video-frame').src = '';
    }
};

// Filter Changes
document.getElementById('genre-filter').addEventListener('change', applyFilters);
document.getElementById('sort-filter').addEventListener('change', applyFilters);
document.getElementById('type-filter').addEventListener('change', applyFilters);

// Random Button
document.querySelector('.random-btn').addEventListener('click', async () => {
    const randomPage = Math.floor(Math.random() * 50) + 1;
    const data = await fetchData(`/discover/movie?page=${randomPage}`);
    const randomMovie = data.results[Math.floor(Math.random() * data.results.length)];
    openDetails(randomMovie.id, 'movie');
});

// Theme Toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
});

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
});

// Cinema Mode
document.getElementById('btn-cinema').addEventListener('click', () => {
    document.body.classList.toggle('cinema-mode');
});
