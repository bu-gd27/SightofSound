// Replace each placeholder entry with final group details. Use image for PNG/JPG,
// video for an optional MP4 (it takes precedence over image), and audio for a WAV file.
const groups = [
  {name:'We Were Never Meant to Live This Way', artists:'Yu, Kitty, Hannah', morse:'.-- . / .-- . .-. . / -. . ...- . .-. / -- . .- -. - / - --- / .-.. .. ...- . / - .... .. ... / .-- .- -.--', image:'assets/we-were-never-meant-to-live-this-way.png', video:'', audio:'assets/we-were-never-meant-to-live-this-way.wav'},
  {name:'John and Peter', artists:'Siyu, Sami', morse:'.--- --- .... -. / .- -. -.. / .--. . - . .-.', image:'assets/john-and-peter.png', video:'', audio:'assets/john-and-peter.wav'},
  {name:'Still There', artists:'Emma, Georgia, Clara', morse:'... - .. .-.. .-.. / - .... . .-. .', image:'assets/still-there.png', video:'', audio:'assets/still-there.wav'},
  {name:'Hard', artists:'Estelle, Cam', morse:'.... .- .-. -..', image:'assets/hard.png', video:'', audio:'assets/hard.wav'},
  {name:'Like Nobody’s Watching', artists:'AJ, Nabiha', morse:'.-.. .. -.- . / -. --- -... --- -.. -.-- .----. ... / .-- .- - -.-. .... .. -. --.', image:'assets/like-nobodys-watching.png', video:'', audio:'assets/like-nobodys-watching.wav'},
  {name:'Design Bebop', artists:'Haelin, Peggy, Riana, Syma', morse:'-.. . ... .. --. -. / -... . -... --- .--.', image:'assets/design-bebop.png', video:'', audio:'assets/design-bebop.wav'},
  {name:'Fallen Angels', artists:'Aerim, Lucy', morse:'..-. .- .-.. .-.. . -. / .- -. --. . .-.. ...', image:'assets/fallen-angels.png', video:'', audio:'assets/fallen-angels.wav'},
  {name:'Mementos of Love', artists:'Anna, Paige, Jocelyn', morse:'-- . -- . -. - --- ... / --- ..-. / .-.. --- ...- .', image:'assets/mementos-of-love.png', video:'', audio:'assets/mementos-of-love.wav'},
  {name:'Wishing', artists:'Katie, Niki', morse:'.-- .. ... .... .. -. --.', image:'assets/wishing.png', video:'', audio:'assets/wishing.wav'},
  {name:'Reflections of Home', artists:'Azaria, Min', morse:'.-. . ..-. .-.. . -.-. - .. --- -. ... / --- ..-. / .... --- -- .', image:'assets/reflections-of-home.png', video:'', audio:'assets/reflections-of-home.wav'}
];
const $ = (selector, root=document) => root.querySelector(selector);
const stage = $('.exhibition-stage');
const rail = $('.cards-rail');
const cylinder = $('.carousel-cylinder');
let faces = [];
let active = 0;
let rotation = 0;
let navigating = false;
let playingAudio = null;
let touchStart = 0;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const transitionDuration = reducedMotion ? 0 : 900;
const stepDegrees = 36;

function codeMarkup(code){
  const words=code.trim().split(/\s*\/\s*/);
  return words.map((word,index)=>{
    const letters=word.trim().split(/\s+/).filter(Boolean);
    const letterMarkup=letters.map(token=>'<span class="morse-unit" aria-hidden="true">'+[...token].map(symbol=>'<i class="morse-symbol '+(symbol==='-'?'dash':'dot')+'"></i>').join('')+'</span>').join('');
    const separator=index<words.length-1?'<span class="morse-word-separator" aria-hidden="true">/</span>':'';
    return '<span class="morse-word">'+letterMarkup+separator+'</span>';
  }).join('');
}
function makeFace(group,index){
  const face=document.createElement('article');
  face.className='carousel-face';face.dataset.index=String(index);face.setAttribute('aria-hidden','true');
  const image=document.createElement('img');image.className='face-image';image.alt='';image.src=group.image||'assets/placeholder.png';
  const video=document.createElement('video');video.className='face-video';video.muted=true;video.loop=true;video.playsInline=true;video.preload='metadata';video.hidden=true;
  const tint=document.createElement('span');tint.className='face-tint';tint.setAttribute('aria-hidden','true');
  const panel=document.createElement('div');panel.className='info-panel card-info';
  const identity=document.createElement('div');identity.className='group-identity';
  const morse=document.createElement('div');morse.className='morse-display';morse.innerHTML=codeMarkup(group.morse);morse.setAttribute('aria-label',`Morse code: ${group.morse}`);
  const name=document.createElement('h1');name.className='group-name';name.textContent=group.name;
  const artists=document.createElement('p');artists.className='artist-line';artists.textContent=group.artists;
  const meta=document.createElement('div');meta.className='group-meta';meta.append(name,artists);
  identity.append(morse,meta);
  const audio=document.createElement('button');audio.className='audio-button';audio.type='button';audio.setAttribute('aria-label',`Play Morse code audio for ${group.name}`);audio.title=`Play Morse code audio for ${group.name}`;
  audio.innerHTML='<svg class="sound-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 12v8h6l8 6V6l-8 6H4Z"/><path d="M22 11a7 7 0 0 1 0 10m3-14a12 12 0 0 1 0 18"/></svg>';
  audio.addEventListener('click',()=>playAudio(index));
  panel.append(identity,audio);
  face.append(image,video,tint,panel);
  return face;
}
function buildFaces(){
  cylinder.replaceChildren(...groups.map(makeFace));
  faces=[...cylinder.querySelectorAll('.carousel-face')];
}
function fitMorseDisplays(){
  const layouts=faces.map(face=>({
    display:face.querySelector('.morse-display'),
    meta:face.querySelector('.group-meta'),
    identity:face.querySelector('.group-identity')
  }));
  const items=layouts.map(({display})=>[...display.querySelectorAll('.morse-word')]);
  let scale=.1;
  const applyScale=()=>layouts.forEach(({display})=>display.style.setProperty('--morse-scale',String(scale)));
  const fits=()=>layouts.every(({display,meta,identity},index)=>
    new Set(items[index].map(item=>Math.round(item.offsetTop))).size<=4 &&
    display.scrollHeight<=display.clientHeight &&
    display.scrollWidth<=display.clientWidth &&
    meta.offsetHeight<=identity.clientHeight-display.clientHeight
  );
  let low=.1,high=4;
  for(let iteration=0;iteration<12;iteration++){
    scale=(low+high)/2;
    applyScale();
    if(fits())low=scale;
    else high=scale;
  }
  scale=low;
  applyScale();
}
function layoutCylinder(){
  if(!faces.length)return;
  const height=rail.clientHeight;
  // Keep card spacing proportional to the phone layout at every breakpoint.
  const perspective=height*1500/212;
  const projectedCenter=height*200/212;
  const angle=stepDegrees*Math.PI/180;
  const radius=projectedCenter*perspective/(perspective*Math.sin(angle)+projectedCenter*Math.cos(angle));
  const frontScale=(perspective-radius)/perspective;
  rail.style.perspective=`${perspective}px`;
  faces.forEach((face,index)=>{
    const phi=index*angle;
    const y=radius*Math.sin(phi);
    const z=radius*Math.cos(phi);
    face.style.transform=`translateY(${y}px) translateZ(${z}px) rotateX(${-index*stepDegrees}deg) scale(${frontScale})`;
  });
  cylinder.style.setProperty('--rotation-angle',`${rotation}deg`);
}
function stopAudio(){
  if(playingAudio){playingAudio.pause();playingAudio.currentTime=0;playingAudio=null;}
  faces.forEach(face=>face.querySelector('.audio-button')?.classList.remove('is-playing'));
}
function playAudio(index){
  if(navigating||index!==active)return;
  const path=groups[index].audio;if(!path)return;
  if(playingAudio){stopAudio();return;}
  const button=faces[index].querySelector('.audio-button');
  playingAudio=new Audio(path);button.classList.add('is-playing');
  playingAudio.addEventListener('ended',()=>{button.classList.remove('is-playing');playingAudio=null;},{once:true});
  playingAudio.play().catch(()=>{button.classList.remove('is-playing');playingAudio=null;});
}
function updateRoles(){
  const total=faces.length;
  faces.forEach((face,index)=>{
    face.className='carousel-face';
    const offset=(index-active+total)%total;
    if(offset===0){face.classList.add('is-front');face.setAttribute('aria-hidden','false');}
    else if(offset===1){face.classList.add('is-next');face.setAttribute('aria-hidden','true');}
    else if(offset===total-1){face.classList.add('is-previous');face.setAttribute('aria-hidden','true');}
    else if(offset===total-2){face.classList.add('is-far-previous');face.setAttribute('aria-hidden','true');}
    else if(offset===2){face.classList.add('is-far-next');face.setAttribute('aria-hidden','true');}
    else {face.classList.add('is-back');face.setAttribute('aria-hidden','true');}
  });
}
function activateCurrentMedia(){
  faces.forEach((face,index)=>{
    const image=face.querySelector('.face-image'),video=face.querySelector('.face-video');
    if(index!==active){video.pause();video.hidden=true;video.removeAttribute('src');video.load();image.hidden=false;return;}
    const group=groups[index];
    if(group.video){image.hidden=false;video.hidden=false;video.src=group.video;video.load();video.play().catch(()=>{});}
    else {video.pause();video.hidden=true;video.removeAttribute('src');video.load();image.src=group.image||'assets/placeholder.png';image.hidden=false;}
  });
}
function navigate(direction){
  if(navigating)return;
  navigating=true;stopAudio();
  const target=(active+direction+groups.length)%groups.length;
  const oldFace=faces[active],nextFace=faces[target];
  oldFace.classList.remove('is-front');oldFace.classList.add(direction>0?'is-previous':'is-next','is-leaving');
  nextFace.classList.add('is-entering');
  stage.classList.add('is-rotating');
  rotation+=direction*stepDegrees;
  cylinder.style.setProperty('--rotation-angle',`${rotation}deg`);
  if(transitionDuration===0){
    active=target;updateRoles();activateCurrentMedia();stage.classList.remove('is-rotating');navigating=false;return;
  }
  window.setTimeout(()=>{
    active=target;updateRoles();activateCurrentMedia();stage.classList.remove('is-rotating');navigating=false;
  },transitionDuration);
}
function toggleTheme(){
  const dark=document.documentElement.dataset.theme!=='dark';
  document.documentElement.dataset.theme=dark?'dark':'light';
  $('.theme-toggle').setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');
  document.querySelector('meta[name="theme-color"]').content=dark?'#000000':'#ffffff';
  try{localStorage.setItem('sight-of-sound-theme',dark?'dark':'light')}catch{}
}
$('.theme-toggle').addEventListener('click',toggleTheme);
try{const saved=localStorage.getItem('sight-of-sound-theme');if(saved){document.documentElement.dataset.theme=saved;$('.theme-toggle').setAttribute('aria-label',saved==='dark'?'Switch to light mode':'Switch to dark mode');}}catch{}
stage.addEventListener('wheel',event=>{if(Math.abs(event.deltaY)<20)return;event.preventDefault();navigate(event.deltaY>0?1:-1);},{passive:false});
stage.addEventListener('touchstart',event=>{touchStart=event.touches[0].clientY},{passive:true});
stage.addEventListener('touchend',event=>{const delta=touchStart-event.changedTouches[0].clientY;if(Math.abs(delta)>55)navigate(delta>0?1:-1);},{passive:true});
stage.addEventListener('keydown',event=>{if(event.key==='ArrowDown'||event.key==='ArrowRight'){event.preventDefault();navigate(1);}if(event.key==='ArrowUp'||event.key==='ArrowLeft'){event.preventDefault();navigate(-1);}});
buildFaces();fitMorseDisplays();layoutCylinder();updateRoles();activateCurrentMedia();
window.addEventListener('resize',()=>{fitMorseDisplays();layoutCylinder();});
