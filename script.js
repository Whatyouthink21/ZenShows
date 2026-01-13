// Sample data - Movies will show immediately
const sampleMovies = [
    {
        id: 1,
        title: "Dune: Part Two",
        poster: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nx1S8.jpg",
        rating: 8.5,
        year: "2024",
        genre: "Sci-Fi, Adventure"
    },
    {
        id: 2,
        title: "Oppenheimer",
        poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n8ua.jpg",
        rating: 8.3,
        year: "2023",
        genre: "Biography, Drama"
    },
    {
        id: 3,
        title: "The Batman",
        poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
        rating: 7.8,
        year: "2022",
        genre: "Action, Crime"
    },
    {
        id: 4,
        title: "Spider-Man: No Way Home",
        poster: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
        rating: 8.0,
        year: "2021",
        genre: "Action, Adventure"
    },
    {
        id: 5,
        title: "Interstellar",
        poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        rating: 8.6,
        year: "2014",
        genre: "Adventure, Drama"
    },
    {
        id: 6,
        title: "Inception",
        poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
        rating: 8.8,
        year: "2010",
        genre: "Action, Sci-Fi"
    }
];

const sampleTVShows = [
    {
        id: 101,
        title: "Stranger Things",
        poster: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
        rating: 8.7,
        seasons: 4,
        genre: "Drama, Fantasy"
    },
    {
        id: 102,
        title: "The Last of Us",
        poster: "https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",
        rating: 8.8,
        seasons: 1,
        genre: "Action, Drama"
    },
    {
        id: 103,
        title: "Game of Thrones",
        poster: "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
        rating: 8.9,
        seasons: 8,
        genre: "Action, Adventure"
    },
    {
        id: 104,
        title: "Breaking Bad",
        poster: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
        rating: 9.5,
        seasons: 5,
        genre: "Crime, Drama"
    },
    {
        id: 105,
        title: "The Mandalorian",
        poster: "https://image.tmdb.org/t/p/w500/sWgBv7LV2PRoQgkxw0kdF8t4k4h.jpg",
        rating: 8.5,
        seasons: 3,
        genre: "Action, Adventure"
    },
    {
        id: 106,
        title: "Wednesday",
        poster: "https://image.tmdb.org/t/p/w500/jeGtaMwGxPmQN5xM4ClnwPQcNQz.jpg",
        rating: 8.5,
        seasons: 1,
        genre: "Comedy, Fantasy"
    }
];

// DOM Elements
const trendingGrid = document.getElementById('trendingGrid');
const moviesGrid = document.getElementById('moviesGrid');
const tvGrid = document.getElementById('tvGrid');
const searchInput = document.getElementById('searchInput');
const loginBtn = document.getElementById('loginBtn');
const userMenu = document.getElementById('userMenu');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const menuToggle = document.getElementById('menuToggle');
const toast = document.getElementById('toast');

// State
let currentUser = localStorage.getItem('zenUser');
let watchlist = JSON.parse(localStorage.getItem('zenWatchlist')) || [];

// Initialize - LOADS IMMEDIATELY
function init() {
    loadContent();
    updateUserUI();
    setupEventListeners();
    
    showToast('Welcome to Zen Shows!');
}

// Load all content
function loadContent() {
    // Load trending (mix of movies and shows)
    const trending = [...sampleMovies.slice(0, 3), ...sampleTVShows.slice(0, 3)];
    loadTrending(trending);
    
    // Load movies
    loadMovies();
    
    // Load TV shows
    loadTVShows();
}

function loadTrending(items) {
    trendingGrid.innerHTML = '';
    items.forEach(item => {
        const card = createCard(item, 'trending');
        trendingGrid.appendChild(card);
    });
}

function loadMovies() {
    moviesGrid.innerHTML = '';
    sampleMovies.forEach(movie => {
        const card = createCard(movie, 'movie');
        moviesGrid.appendChild(card);
    });
}

function loadTVShows() {
    tvGrid.innerHTML = '';
    sampleTVShows.forEach(show => {
        const card = createCard(show, 'tv');
        tvGrid.appendChild(card);
    });
}

function createCard(item, type) {
    const card = document.createElement('div');
    card.className = type + '-card';
    
    const isInWatchlist = watchlist.some(w => w.id === item.id);
    
    card.innerHTML = `
        <img src="${item.poster}" alt="${item.title}" loading="lazy">
        <button class="watch-btn" onclick="toggleWatchlist(event, ${item.id})">
            <i class="${isInWatchlist ? 'fas' : 'far'} fa-bookmark"></i>
        </button>
        <div class="card-info">
            <h3>${item.title}</h3>
            <div class="card-details">
                <span>${type === 'movie' ? item.year : item.seasons + ' Seasons'}</span>
                <div class="rating">
                    <i class="fas fa-star"></i>
                    <span>${item.rating}</span>
                </div>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => playItem(item));
    
    return card;
}

// Player Functions
function playItem(item) {
    document.getElementById('playerTitle').textContent = item.title;
    document.getElementById('playerModal').style.display = 'flex';
    showToast(`Playing: ${item.title}`);
}

function playSample() {
    playItem(sampleMovies[0]);
}

function closePlayer() {
    document.getElementById('playerModal').style.display = 'none';
}

function selectSource(source) {
    document.querySelectorAll('.source-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    showToast(`Switched to ${source} source`);
}

// User Functions
function signInWithGoogle() {
    currentUser = {
        name: 'John Doe',
        email: 'john@example.com'
    };
    localStorage.setItem('zenUser', JSON.stringify(currentUser));
    updateUserUI();
    closeLogin();
    showToast('Signed in with Google!');
}

function signInAsGuest() {
    currentUser = {
        name: 'Guest User',
        isGuest: true
    };
    localStorage.setItem('zenUser', JSON.stringify(currentUser));
    updateUserUI();
    closeLogin();
    showToast('Signed in as Guest!');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('zenUser');
    updateUserUI();
    showToast('Logged out successfully');
}

function updateUserUI() {
    if (currentUser) {
        const user = JSON.parse(currentUser);
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${user.name.split(' ')[0]}`;
        userName.textContent = user.name;
        userMenu.classList.remove('hidden');
    } else {
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        userName.textContent = 'Guest User';
        userMenu.classList.add('hidden');
    }
}

function openLogin() {
    document.getElementById('loginModal').style.display = 'flex';
}

function closeLogin() {
    document.getElementById('loginModal').style.display = 'none';
}

// Watchlist Functions
function toggleWatchlist(event, itemId) {
    event.stopPropagation();
    
    const allItems = [...sampleMovies, ...sampleTVShows];
    const item = allItems.find(i => i.id === itemId);
    
    const index = watchlist.findIndex(w => w.id === itemId);
    if (index === -1) {
        watchlist.push(item);
        showToast('Added to watchlist');
        event.target.innerHTML = '<i class="fas fa-bookmark"></i>';
    } else {
        watchlist.splice(index, 1);
        showToast('Removed from watchlist');
        event.target.innerHTML = '<i class="far fa-bookmark"></i>';
    }
    
    localStorage.setItem('zenWatchlist', JSON.stringify(watchlist));
}

// Toast Function
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Search Function
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length > 2) {
        const allItems = [...sampleMovies, ...sampleTVShows];
        const results = allItems.filter(item => 
            item.title.toLowerCase().includes(query)
        );
        
        // You can implement search results display here
        if (results.length > 0) {
            showToast(`Found ${results.length} results for "${query}"`);
        }
    }
});

// Event Listeners
function setupEventListeners() {
    loginBtn.addEventListener('click', (e) => {
        if (currentUser) {
            e.stopPropagation();
            userMenu.classList.toggle('hidden');
        } else {
            openLogin();
        }
    });
    
    logoutBtn.addEventListener('click', logout);
    
    // Close user menu on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-actions')) {
            userMenu.classList.add('hidden');
        }
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Mobile menu toggle
    menuToggle.addEventListener('click', () => {
        document.querySelector('.nav-menu').classList.toggle('hidden');
    });
}

// Initialize the app when page loads
window.onload = init;
