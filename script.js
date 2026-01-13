// Sample data for demonstration
const sampleMovies = [
    {
        id: 1,
        title: "Dune: Part Two",
        poster: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nx1S8.jpg",
        rating: 8.5,
        year: "2024",
        duration: "2h 46m",
        genre: "Sci-Fi, Adventure"
    },
    {
        id: 2,
        title: "Oppenheimer",
        poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n8ua.jpg",
        rating: 8.3,
        year: "2023",
        duration: "3h 0m",
        genre: "Biography, Drama"
    },
    {
        id: 3,
        title: "The Batman",
        poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
        rating: 7.8,
        year: "2022",
        duration: "2h 56m",
        genre: "Action, Crime"
    },
    {
        id: 4,
        title: "Spider-Man: No Way Home",
        poster: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
        rating: 8.0,
        year: "2021",
        duration: "2h 28m",
        genre: "Action, Adventure"
    },
    {
        id: 5,
        title: "Interstellar",
        poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        rating: 8.6,
        year: "2014",
        duration: "2h 49m",
        genre: "Adventure, Drama"
    },
    {
        id: 6,
        title: "Inception",
        poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
        rating: 8.8,
        year: "2010",
        duration: "2h 28m",
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
        episodes: 34,
        genre: "Drama, Fantasy"
    },
    {
        id: 102,
        title: "The Last of Us",
        poster: "https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",
        rating: 8.8,
        seasons: 1,
        episodes: 9,
        genre: "Action, Drama"
    },
    {
        id: 103,
        title: "Game of Thrones",
        poster: "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
        rating: 8.9,
        seasons: 8,
        episodes: 73,
        genre: "Action, Adventure"
    },
    {
        id: 104,
        title: "Breaking Bad",
        poster: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
        rating: 9.5,
        seasons: 5,
        episodes: 62,
        genre: "Crime, Drama"
    },
    {
        id: 105,
        title: "The Mandalorian",
        poster: "https://image.tmdb.org/t/p/w500/sWgBv7LV2PRoQgkxw0kdF8t4k4h.jpg",
        rating: 8.5,
        seasons: 3,
        episodes: 24,
        genre: "Action, Adventure"
    },
    {
        id: 106,
        title: "Wednesday",
        poster: "https://image.tmdb.org/t/p/w500/jeGtaMwGxPmQN5xM4ClnwPQcNQz.jpg",
        rating: 8.5,
        seasons: 1,
        episodes: 8,
        genre: "Comedy, Fantasy"
    }
];

// DOM Elements
const trendingContainer = document.getElementById('trendingContainer');
const moviesGrid = document.getElementById('moviesGrid');
const tvGrid = document.getElementById('tvGrid');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const videoModal = document.getElementById('videoModal');
const loginModal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const closeModal = document.getElementById('closeModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const guestLoginBtn = document.getElementById('guestLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userMenu = document.getElementById('userMenu');
const userName = document.getElementById('userName');
const navToggle = document.getElementById('navToggle');
const mobileSidebar = document.getElementById('mobileSidebar');
const closeSidebar = document.getElementById('closeSidebar');
const loadingOverlay = document.getElementById('loadingOverlay');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// State Management
let currentUser = null;
let watchlist = JSON.parse(localStorage.getItem('zenShowsWatchlist')) || [];
let history = JSON.parse(localStorage.getItem('zenShowsHistory')) || [];

// Show loading overlay
function showLoading() {
    loadingOverlay.classList.add('show');
}

// Hide loading overlay - FIXED
function hideLoading() {
    loadingOverlay.classList.remove('show');
}

// Show toast notification
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Load trending content
function loadTrending() {
    trendingContainer.innerHTML = '';
    
    // Combine movies and TV shows for trending
    const trendingContent = [...sampleMovies.slice(0, 4), ...sampleTVShows.slice(0, 2)];
    
    trendingContent.forEach(item => {
        const card = document.createElement('div');
        card.className = 'trending-card glass-effect';
        
        card.innerHTML = `
            <img src="${item.poster}" alt="${item.title}" class="trending-image">
            <div class="trending-overlay">
                <h3>${item.title}</h3>
                <div class="trending-info">
                    <span>${item.year || `${item.seasons} Seasons`}</span>
                    <div class="trending-rating">
                        <i class="fas fa-star"></i>
                        <span>${item.rating}</span>
                    </div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => openVideoModal(item));
        trendingContainer.appendChild(card);
    });
}

// Load movies
function loadMovies() {
    moviesGrid.innerHTML = '';
    
    sampleMovies.forEach(movie => {
        const card = createMediaCard(movie, 'movie');
        moviesGrid.appendChild(card);
    });
}

// Load TV shows
function loadTVShows() {
    tvGrid.innerHTML = '';
    
    sampleTVShows.forEach(show => {
        const card = createMediaCard(show, 'tv');
        tvGrid.appendChild(card);
    });
}

// Create media card
function createMediaCard(item, type) {
    const card = document.createElement('div');
    card.className = type === 'movie' ? 'movie-card glass-effect' : 'tv-card glass-effect';
    
    const isInWatchlist = watchlist.some(w => w.id === item.id);
    
    card.innerHTML = `
        <img src="${item.poster}" alt="${item.title}" class="${type}-poster">
        <button class="watch-btn" title="Add to Watchlist">
            <i class="${isInWatchlist ? 'fas fa-bookmark' : 'far fa-bookmark'}"></i>
        </button>
        <div class="${type}-info">
            <h3>${item.title}</h3>
            <div class="${type}-details">
                <span>${type === 'movie' ? item.year : `${item.seasons} Seasons`}</span>
                <div class="rating">
                    <i class="fas fa-star"></i>
                    <span>${item.rating}</span>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    const watchBtn = card.querySelector('.watch-btn');
    watchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWatchlist(item);
        watchBtn.innerHTML = `<i class="${watchlist.some(w => w.id === item.id) ? 'fas' : 'far'} fa-bookmark"></i>`;
        showToast(watchlist.some(w => w.id === item.id) ? 'Added to watchlist' : 'Removed from watchlist');
    });
    
    card.addEventListener('click', () => openVideoModal(item));
    
    return card;
}

// Toggle watchlist
function toggleWatchlist(item) {
    const index = watchlist.findIndex(w => w.id === item.id);
    
    if (index === -1) {
        watchlist.push(item);
    } else {
        watchlist.splice(index, 1);
    }
    
    localStorage.setItem('zenShowsWatchlist', JSON.stringify(watchlist));
}

// Open video modal
function openVideoModal(item) {
    document.getElementById('modalTitle').textContent = item.title;
    videoModal.style.display = 'flex';
    
    // Add to history
    addToHistory(item);
}

// Add to history
function addToHistory(item) {
    // Remove if already exists
    history = history.filter(h => h.id !== item.id);
    
    // Add to beginning
    history.unshift({
        ...item,
        watchedAt: new Date().toISOString()
    });
    
    // Keep only last 50 items
    history = history.slice(0, 50);
    
    localStorage.setItem('zenShowsHistory', JSON.stringify(history));
}

// Close video modal
function closeVideoModal() {
    videoModal.style.display = 'none';
}

// Open login modal
function openLoginModal() {
    loginModal.style.display = 'flex';
}

// Close login modal
function closeLoginModal() {
    loginModal.style.display = 'none';
}

// Handle Google login
function handleGoogleLogin() {
    showLoading();
    
    // Simulate login
    setTimeout(() => {
        currentUser = {
            name: 'John Doe',
            email: 'john@example.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
        };
        
        localStorage.setItem('zenShowsUser', JSON.stringify(currentUser));
        updateUserUI();
        closeLoginModal();
        hideLoading();
        showToast('Successfully signed in with Google');
    }, 1500);
}

// Handle guest login
function handleGuestLogin() {
    currentUser = {
        name: 'Guest User',
        email: 'guest@example.com',
        isGuest: true
    };
    
    localStorage.setItem('zenShowsUser', JSON.stringify(currentUser));
    updateUserUI();
    closeLoginModal();
    showToast('Signed in as guest');
}

// Handle logout
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('zenShowsUser');
    updateUserUI();
    userMenu.classList.add('hidden');
    showToast('Successfully logged out');
}

// Update user UI
function updateUserUI() {
    if (currentUser) {
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${currentUser.name.split(' ')[0]}`;
        userName.textContent = currentUser.name;
        userMenu.classList.remove('hidden');
    } else {
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        userName.textContent = 'Guest User';
        userMenu.classList.add('hidden');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Modal close buttons
    closeModal.addEventListener('click', closeVideoModal);
    closeLoginModal.addEventListener('click', closeLoginModal);
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === videoModal) closeVideoModal();
        if (e.target === loginModal) closeLoginModal();
    });
    
    // Login buttons
    loginBtn.addEventListener('click', openLoginModal);
    googleLoginBtn.addEventListener('click', handleGoogleLogin);
    guestLoginBtn.addEventListener('click', handleGuestLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Toggle user menu
    loginBtn.addEventListener('click', (e) => {
        if (currentUser) {
            e.stopPropagation();
            userMenu.classList.toggle('hidden');
        }
    });
    
    // Close user menu on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-user')) {
            userMenu.classList.add('hidden');
        }
    });
    
    // Mobile navigation
    navToggle.addEventListener('click', () => {
        mobileSidebar.classList.add('show');
    });
    
    closeSidebar.addEventListener('click', () => {
        mobileSidebar.classList.remove('show');
    });
    
    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    
    // Source buttons in video modal
    document.querySelectorAll('.source-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            showToast(`Switched to ${this.textContent.trim()} source`);
        });
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeVideoModal();
            closeLoginModal();
            mobileSidebar.classList.remove('show');
        }
    });
}

// Handle search
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (!query) {
        searchResults.style.display = 'none';
        return;
    }
    
    // Combine movies and TV shows for search
    const allContent = [...sampleMovies, ...sampleTVShows];
    const results = allContent.filter(item =>
        item.title.toLowerCase().includes(query)
    );
    
    if (results.length > 0) {
        displaySearchResults(results);
        searchResults.style.display = 'block';
    } else {
        searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
        searchResults.style.display = 'block';
    }
}

// Display search results
function displaySearchResults(results) {
    searchResults.innerHTML = '';
    
    results.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        
        resultItem.innerHTML = `
            <img src="${item.poster}" alt="${item.title}">
            <div class="search-result-info">
                <h4>${item.title}</h4>
                <p>${item.year || `${item.seasons} Seasons`} • ⭐ ${item.rating}</p>
            </div>
        `;
        
        resultItem.addEventListener('click', () => {
            openVideoModal(item);
            searchInput.value = '';
            searchResults.style.display = 'none';
        });
        
        searchResults.appendChild(resultItem);
    });
}

// Hide search results on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        searchResults.style.display = 'none';
    }
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Show loading initially
    showLoading();
    
    // Load content quickly
    setTimeout(() => {
        loadTrending();
        loadMovies();
        loadTVShows();
        
        // Check for saved user
        const savedUser = localStorage.getItem('zenShowsUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            updateUserUI();
        }
        
        setupEventListeners();
        
        // Hide loading after 1 second
        setTimeout(hideLoading, 1000);
    }, 500);
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-background');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});
