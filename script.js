const firebaseConfig = {
    apiKey: "AIzaSyCRwom-ZDQy_4AWX-8TknWzii_GVxw33hk",
    authDomain: "zenshows-c4255.firebaseapp.com",
    projectId: "zenshows-c4255",
    storageBucket: "zenshows-c4255.firebasestorage.app",
    messagingSenderId: "824547918366",
    appId: "1:824547918366:web:5b1ae5de7b083a2f77640f",
    measurementId: "G-268SWMN17W"
};

firebase.initializeApp(firebaseConfig);
const TMDB_KEY = "a45420333457411e78d5ad35d6c51a2d";

// UI Toggles
document.getElementById('hamburger').onclick = () => document.getElementById('sideMenu').classList.add('active');
document.getElementById('closeMenu').onclick = () => document.getElementById('sideMenu').classList.remove('active');

async function loadHome() {
    const res = await fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_KEY}`);
    const data = await res.json();
    const items = data.results;

    // Hero
    const h = items[0];
    document.getElementById('hero').style.backgroundImage = `url(https://image.tmdb.org/t/p/original${h.backdrop_path})`;
    document.getElementById('heroTitle').innerText = h.title || h.name;
    document.getElementById('heroDesc').innerText = h.overview.slice(0, 120) + "...";
    document.getElementById('heroPlay').onclick = () => openPlayer(h.id, h.media_type);

    // Horizontal Row
    const row = document.getElementById('trendingRow');
    row.innerHTML = items.map(m => `
        <div class="movie-item" onclick="openPlayer('${m.id}', '${m.media_type || 'movie'}')">
            <img src="https://image.tmdb.org/t/p/w500${m.poster_path}">
            <p style="font-size:12px; margin-top:5px; text-align:center">${(m.title || m.name).slice(0,20)}</p>
        </div>
    `).join('');
}

// Global Player Function
window.openPlayer = (id, type) => {
    const modal = document.getElementById('playerModal');
    const frame = document.getElementById('mainFrame');
    const t = type === 'tv' ? 'tv' : 'movie';
    frame.src = `https://vidsrc.me/embed/${t}?tmdb=${id}`;
    modal.style.display = 'flex';
};

document.getElementById('closePlayer').onclick = () => {
    document.getElementById('playerModal').style.display = 'none';
    document.getElementById('mainFrame').src = '';
};

loadHome();
