/***********************
  🔑 CONFIG
************************/
const TMDB_KEY = "a45420333457411e78d5ad35d6c51a2d";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/original";

/***********************
  🔥 FIREBASE INIT
************************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCRwom-ZDQy_4AWX-8TknWzii_GVxw33hk",
  authDomain: "zenshows-c4255.firebaseapp.com",
  projectId: "zenshows-c4255",
  storageBucket: "zenshows-c4255.firebasestorage.app",
  messagingSenderId: "824547918366",
  appId: "1:824547918366:web:5b1ae5de7b083a2f77640f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const USER_ID = "guest_user"; // anonymous for now, chill

/***********************
  🧠 STATE
************************/
let currentItem = null;
let currentType = "movie";

/***********************
  🌐 HELPERS
************************/
async function fetchTMDB(url) {
  const res = await fetch(url);
  return res.json();
}

function createCard(item, type) {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <img src="${IMG + item.poster_path}" />
  `;
  div.onclick = () => openDetails(item.id, type);
  return div;
}

/***********************
  🎬 HERO
************************/
async function loadHero() {
  const data = await fetchTMDB(`${TMDB_BASE}/trending/all/day?api_key=${TMDB_KEY}`);
  const item = data.results[0];

  document.getElementById("hero").style.backgroundImage =
    `url(${IMG + item.backdrop_path})`;

  document.getElementById("heroTitle").textContent =
    item.title || item.name;

  document.getElementById("heroRating").textContent =
    "⭐ " + item.vote_average.toFixed(1);

  document.getElementById("heroYear").textContent =
    (item.release_date || item.first_air_date || "").slice(0, 4);

  document.getElementById("heroOverview").textContent = item.overview;
}

/***********************
  🔥 TRENDING
************************/
async function loadTrending() {
  const row = document.getElementById("trendingRow");
  row.innerHTML = "";

  const data = await fetchTMDB(`${TMDB_BASE}/trending/all/week?api_key=${TMDB_KEY}`);

  data.results.forEach(item => {
    if (!item.poster_path) return;
    row.appendChild(createCard(item, item.media_type));
  });
}

/***********************
  🔍 SEARCH
************************/
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", async () => {
  const q = searchInput.value.trim();
  if (!q) return;

  const section = document.getElementById("searchSection");
  const row = document.getElementById("searchResults");

  section.classList.remove("hidden");
  row.innerHTML = "";

  const data = await fetchTMDB(
    `${TMDB_BASE}/search/multi?api_key=${TMDB_KEY}&query=${q}`
  );

  data.results.forEach(item => {
    if (!item.poster_path || item.media_type === "person") return;
    row.appendChild(createCard(item, item.media_type));
  });
});

/***********************
  📖 DETAILS MODAL
************************/
async function openDetails(id, type) {
  currentType = type;
  currentItem = id;

  const modal = document.getElementById("detailsModal");
  modal.classList.remove("hidden");

  const data = await fetchTMDB(
    `${TMDB_BASE}/${type}/${id}?api_key=${TMDB_KEY}`
  );

  document.getElementById("detailPoster").src =
    IMG + data.poster_path;
  document.getElementById("detailTitle").textContent =
    data.title || data.name;
  document.getElementById("detailOverview").textContent =
    data.overview;
  document.getElementById("detailMeta").textContent =
    `⭐ ${data.vote_average.toFixed(1)} • ${(data.release_date || data.first_air_date || "").slice(0, 4)}`;

  loadCredits(id, type);
  loadSimilar(id, type);

  if (type === "tv") {
    loadTVControls(data);
  } else {
    document.getElementById("tvControls").classList.add("hidden");
  }

  saveHistory(id, type);
}

document.getElementById("closeModal").onclick = () => {
  document.getElementById("detailsModal").classList.add("hidden");
};

/***********************
  👥 CAST & CREW
************************/
async function loadCredits(id, type) {
  const castRow = document.getElementById("castRow");
  const crewRow = document.getElementById("crewRow");

  castRow.innerHTML = "";
  crewRow.innerHTML = "";

  const data = await fetchTMDB(
    `${TMDB_BASE}/${type}/${id}/credits?api_key=${TMDB_KEY}`
  );

  data.cast.slice(0, 10).forEach(c => {
    if (!c.profile_path) return;
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<img src="${IMG + c.profile_path}" />`;
    castRow.appendChild(div);
  });

  data.crew
    .filter(c => c.job === "Director")
    .forEach(d => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `<img src="${IMG + d.profile_path}" />`;
      crewRow.appendChild(div);
    });
}

/***********************
  🔁 SIMILAR
************************/
async function loadSimilar(id, type) {
  const row = document.getElementById("similarRow");
  row.innerHTML = "";

  const data = await fetchTMDB(
    `${TMDB_BASE}/${type}/${id}/similar?api_key=${TMDB_KEY}`
  );

  data.results.forEach(item => {
    if (!item.poster_path) return;
    row.appendChild(createCard(item, type));
  });
}

/***********************
  📺 TV CONTROLS
************************/
function loadTVControls(data) {
  const controls = document.getElementById("tvControls");
  const seasonDD = document.getElementById("seasonDropdown");
  const episodeDD = document.getElementById("episodeDropdown");

  controls.classList.remove("hidden");
  seasonDD.innerHTML = "";
  episodeDD.innerHTML = "";

  data.seasons.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.season_number;
    opt.textContent = `Season ${s.season_number}`;
    seasonDD.appendChild(opt);
  });

  seasonDD.onchange = async () => {
    episodeDD.innerHTML = "";
    const season = seasonDD.value;

    const sData = await fetchTMDB(
      `${TMDB_BASE}/tv/${currentItem}/season/${season}?api_key=${TMDB_KEY}`
    );

    sData.episodes.forEach(e => {
      const opt = document.createElement("option");
      opt.value = e.episode_number;
      opt.textContent = `Episode ${e.episode_number}`;
      episodeDD.appendChild(opt);
    });
  };
}

/***********************
  ❤️ WATCHLIST & HISTORY
************************/
async function saveHistory(id, type) {
  const ref = doc(db, "history", USER_ID);
  const snap = await getDoc(ref);

  const history = snap.exists() ? snap.data().items : [];
  history.unshift({ id, type, time: Date.now() });

  await setDoc(ref, { items: history.slice(0, 50) });
}

document.getElementById("addWatchlist").onclick = async () => {
  const ref = doc(db, "watchlist", USER_ID);
  const snap = await getDoc(ref);

  const list = snap.exists() ? snap.data().items : [];
  list.push({ id: currentItem, type: currentType });

  await setDoc(ref, { items: list });
  alert("Added to watchlist 😎");
};

/***********************
  ▶ PLAYER
************************/
document.querySelectorAll(".sources button").forEach(btn => {
  btn.onclick = () => {
    document.getElementById("playerSection").classList.remove("hidden");
    document.getElementById("videoPlayer").src =
      `https://example.com/player/${btn.dataset.source}?id=${currentItem}`;
  };
});

/***********************
  🚀 INIT
************************/
loadHero();
loadTrending();
