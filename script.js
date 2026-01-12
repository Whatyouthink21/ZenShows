// ---- CONFIG ----
const TMDB_KEY = "60defb38119575da952b28d206871c1b";

// ---- FIREBASE ----
firebase.initializeApp({
  apiKey:"YOUR_FIREBASE_API_KEY",
  authDomain:"YOUR_FIREBASE_AUTH_DOMAIN",
  projectId:"YOUR_FIREBASE_PROJECT_ID",
});
const auth=firebase.auth();
auth.onAuthStateChanged(u=>{
  authBtn.innerText=u?"Logout":"Sign In";
});
authBtn.onclick=()=>auth.currentUser?auth.signOut():auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());

// ---- STATE ----
let current={ id:null, type:null };

// ---- SOURCES ----
const sources=[
 {name:"VidSrc",url:(t,id)=>`https://vidsrc.to/embed/${t}/${id}`},
 {name:"VidSrc.me",url:(t,id)=>`https://vidsrc.me/embed/${t}?tmdb=${id}`},
 {name:"BidSrc",url:(t,id)=>`https://bidsrc.com/embed/${t}/${id}`},
 {name:"CinemaOS",url:(t,id)=>`https://cinemaos.xyz/embed/${t}/${id}`},
 {name:"MultiEmbed",url:(t,id)=>`https://multiembed.mov/?tmdb=${id}`}
];

// ---- FETCH & RENDER ----
function fetchTrending(){
  fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`)
    .then(r=>r.json()).then(d=>display(d.results,"movie","movieRow"));

  fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}`)
    .then(r=>r.json()).then(d=>display(d.results,"tv","showRow"));
}

function display(items,type,rowId){
  const row = document.getElementById(rowId);
  row.innerHTML="";
  items.forEach(i=>{
    if(!i.poster_path) return;
    const card=document.createElement("div");
    card.className="card";
    card.innerHTML=`<img src="https://image.tmdb.org/t/p/w500${i.poster_path}">`;
    card.onclick=()=>openDetails(i.id,type);
    row.appendChild(card);
  });
}

// ---- DETAILS ----
function openDetails(id,type){
  current={id,type};

  fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_KEY}`)
    .then(r=>r.json()).then(m=>{
      detailTitle.innerText = m.title||m.name;
      detailOverview.innerText = m.overview;
      heroTitle.innerText = m.title||m.name;
    });

  fetch(`https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${TMDB_KEY}`)
    .then(r=>r.json()).then(d=>{
      castRow.innerHTML="";
      d.cast.slice(0,12).forEach(a=>{
        if(a.profile_path)
          castRow.innerHTML += `<img src="https://image.tmdb.org/t/p/w185${a.profile_path}" title="${a.name}">`;
      });
    });

  sourceSelect.innerHTML="";
  sources.forEach((s,i)=>sourceSelect.innerHTML += `<option value="${i}">${s.name}</option>`);

  detailsModal.classList.remove("hidden");
}

// ---- PLAYER ----
function play(){
  const s = sources[sourceSelect.value];
  streamFrame.src = s.url(current.type,current.id);
  playerModal.classList.remove("hidden");
}
function closePlayer(){
  streamFrame.src="";
  playerModal.classList.add("hidden");
}

// ---- SEARCH ----
function search(){
  let q=searchInput.value;
  if(!q) return;
  fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${q}`)
    .then(r=>r.json()).then(d=>{
      display(d.results.filter(x=>x.media_type==="movie"),"movie","movieRow");
      display(d.results.filter(x=>x.media_type==="tv"),"tv","showRow");
      showSection("movies");
    });
}

// ---- WATCHLIST ----
let watchlist = JSON.parse(localStorage.getItem("watchlist")||"[]");
function toggleWatchlist(){
  if(watchlist.find(w=>w.id===current.id)) return;
  fetch(`https://api.themoviedb.org/3/${current.type}/${current.id}?api_key=${TMDB_KEY}`)
    .then(r=>r.json()).then(d=>{
      watchlist.push({id:current.id, data:d});
      localStorage.setItem("watchlist",JSON.stringify(watchlist));
      showSection("watchlist");
    });
}

function showSection(sec){
  document.getElementById("movies").classList.add("hidden");
  document.getElementById("shows").classList.add("hidden");
  document.getElementById("watchlist").classList.add("hidden");
  document.getElementById(sec).classList.remove("hidden");

  if(sec==="watchlist")
    display(watchlist.map(w=>w.data),"movie","watchlistRow");
}

function share(){
  window.open(`https://wa.me/?text=Watch this on ZenShows ➤ https://www.themoviedb.org/${current.type}/${current.id}`);
}

// ---- INIT ----
fetchTrending();
