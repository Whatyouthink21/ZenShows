// ================= CONFIG =================
const TMDB_KEY = "60defb38119575da952b28d206871c1b";

// ======= FIREBASE (PASTE YOUR CONFIG HERE) =======
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ================= STATE =================
let currentMovie = null;

// ================= AUTH =================
const authBtn = document.getElementById("authBtn");
auth.onAuthStateChanged(user=>{
  authBtn.innerText = user ? user.displayName || "Logout" : "Sign In";
});
authBtn.onclick = () => {
  if(auth.currentUser) auth.signOut();
  else auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
};

// ================= FETCH =================
const trendingDiv = document.getElementById("trending");
const recDiv = document.getElementById("recommended");

fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`)
  .then(r=>r.json()).then(d=>render(d.results,trendingDiv));

function render(list, el){
  el.innerHTML="";
  list.forEach(m=>{
    if(!m.poster_path) return;
    const c=document.createElement("div");
    c.className="card";
    c.innerHTML=`<img src="https://image.tmdb.org/t/p/w500${m.poster_path}">`;
    c.onclick=()=>openDetails(m.id);
    el.appendChild(c);
  });
}

// ================= DETAILS =================
function openDetails(id){
  currentMovie=id;
  localStorage.setItem("last",id);

  fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`)
    .then(r=>r.json()).then(m=>{
      title.innerText=m.title;
      overview.innerText=m.overview;
    });

  fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${TMDB_KEY}`)
    .then(r=>r.json()).then(d=>{
      cast.innerHTML="";
      d.cast.slice(0,12).forEach(a=>{
        if(!a.profile_path) return;
        cast.innerHTML+=
          `<img src="https://image.tmdb.org/t/p/w185${a.profile_path}" title="${a.name}">`;
      });
    });

  document.getElementById("details").classList.remove("hidden");
}
function closeDetails(){
  document.getElementById("details").classList.add("hidden");
}

// ================= PLAYER (5 SOURCES) =================
const sources=[
  id=>`https://vidsrc.to/embed/movie/${id}`,
  id=>`https://vidsrc.me/embed/movie?tmdb=${id}`,
  id=>`https://bidsrc.com/embed/movie/${id}`,
  id=>`https://cinemaos.xyz/embed/movie/${id}`,
  id=>`https://multiembed.mov/?tmdb=${id}`
];

function play(i){
  frame.src=sources[i](currentMovie);
  player.classList.remove("hidden");
}
function closePlayer(){
  player.classList.add("hidden"); frame.src="";
}

// ================= SEARCH =================
function search(){
  const q=searchInput.value;
  fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${q}`)
    .then(r=>r.json()).then(d=>render(d.results.filter(x=>x.media_type==="movie"),trendingDiv));
}

// ================= AI PICKER =================
function aiSuggest(){
  fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&sort_by=vote_average.desc&vote_count.gte=500`)
    .then(r=>r.json()).then(d=>{
      const m=d.results[Math.floor(Math.random()*d.results.length)];
      openDetails(m.id);
    });
}

// ================= SHARE =================
function share(){
  const url=`https://wa.me/?text=Watch this on ZenShows: https://www.themoviedb.org/movie/${currentMovie}`;
  window.open(url,"_blank");
}

// ================= PERSONALIZED RECS =================
const last=localStorage.getItem("last");
if(last){
  fetch(`https://api.themoviedb.org/3/movie/${last}/recommendations?api_key=${TMDB_KEY}`)
    .then(r=>r.json()).then(d=>render(d.results,recDiv));
}
