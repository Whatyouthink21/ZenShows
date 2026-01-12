// ================== CONFIG ==================
const TMDB = "60defb38119575da952b28d206871c1b";

// ================== FIREBASE ==================
firebase.initializeApp({
  apiKey:"YOUR_KEY",
  authDomain:"YOUR_DOMAIN",
  projectId:"YOUR_ID"
});
const auth=firebase.auth();
auth.onAuthStateChanged(u=>{
  authBtn.innerText=u?"Logout":"Sign In";
});
authBtn.onclick=()=>{
  auth.currentUser
   ? auth.signOut()
   : auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
};

// ================== STATE ==================
let current={id:null,type:null};
const watchlist=JSON.parse(localStorage.getItem("watchlist")||"[]");

// ================== SOURCES ==================
const sources=[
 {name:"VidSrc",url:(t,id)=>`https://vidsrc.to/embed/${t}/${id}`},
 {name:"VidSrc.me",url:(t,id)=>`https://vidsrc.me/embed/${t}?tmdb=${id}`},
 {name:"BidSrc",url:(t,id)=>`https://bidsrc.com/embed/${t}/${id}`},
 {name:"CinemaOS",url:(t,id)=>`https://cinemaos.xyz/embed/${t}/${id}`},
 {name:"MultiEmbed",url:(t,id)=>`https://multiembed.mov/?tmdb=${id}`}
];

// ================== FETCH ==================
fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB}`)
.then(r=>r.json()).then(d=>render(d.results,"movie",movies));

fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB}`)
.then(r=>r.json()).then(d=>render(d.results,"tv",shows));

render(watchlist.map(w=>w.data),"movie",watchlistEl);

// ================== RENDER ==================
function render(list,type,el){
  el.innerHTML="";
  list.forEach(i=>{
    if(!i.poster_path) return;
    const c=document.createElement("div");
    c.className="card";
    c.innerHTML=`<img src="https://image.tmdb.org/t/p/w500${i.poster_path}">`;
    c.onclick=()=>openDetails(i.id,type);
    el.appendChild(c);
  });
}

// ================== DETAILS ==================
function openDetails(id,type){
  current={id,type};
  sourceSelect.innerHTML="";
  sources.forEach((s,i)=>{
    sourceSelect.innerHTML+=`<option value="${i}">${s.name}</option>`;
  });

  fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB}`)
   .then(r=>r.json()).then(d=>{
     title.innerText=d.title||d.name;
     overview.innerText=d.overview;
   });

  fetch(`https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${TMDB}`)
   .then(r=>r.json()).then(d=>{
     cast.innerHTML="";
     d.cast.slice(0,12).forEach(a=>{
       if(a.profile_path)
       cast.innerHTML+=`<img src="https://image.tmdb.org/t/p/w185${a.profile_path}">`;
     });
   });

  details.classList.remove("hidden");
}
function closeDetails(){details.classList.add("hidden")}

// ================== PLAYER ==================
function play(){
  const s=sources[sourceSelect.value];
  frame.src=s.url(current.type,current.id);
  player.classList.remove("hidden");
}
function closePlayer(){player.classList.add("hidden");frame.src=""}

// ================== WATCHLIST ==================
function toggleWatchlist(){
  if(watchlist.find(w=>w.id===current.id)) return;
  fetch(`https://api.themoviedb.org/3/${current.type}/${current.id}?api_key=${TMDB}`)
   .then(r=>r.json()).then(d=>{
     watchlist.push({id:current.id,data:d});
     localStorage.setItem("watchlist",JSON.stringify(watchlist));
     render(watchlist.map(w=>w.data),"movie",watchlistEl);
   });
}

// ================== SEARCH ==================
function search(){
  const q=searchInput.value;
  fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB}&query=${q}`)
   .then(r=>r.json()).then(d=>{
     render(d.results.filter(x=>x.media_type==="movie"),"movie",movies);
     render(d.results.filter(x=>x.media_type==="tv"),"tv",shows);
   });
}

// ================== SHARE ==================
function share(){
  window.open(`https://wa.me/?text=Watch on ZenShows 🔮 https://www.themoviedb.org/${current.type}/${current.id}`);
}
