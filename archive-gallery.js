"use strict";
const LEGACY=[
  {
    "id": "legacy-ics",
    "title": "In Countless Shadows",
    "type": "Game",
    "themes": [
      "games",
      "systems",
      "verse"
    ],
    "status": "In progress",
    "cover": "./images/work-in-countless-shadows.svg",
    "url": "#project-in-countless-shadows",
    "featured": true,
    "now": true,
    "description": "Recomposing Shakespeare's sonnets through play."
  },
  {
    "id": "legacy-rhyme",
    "title": "you are rhyme",
    "type": "Collaboration",
    "themes": [
      "games",
      "systems",
      "verse"
    ],
    "status": "In progress",
    "cover": "./images/work-you-are-rhyme.svg",
    "url": "#project-you-are-rhyme",
    "featured": true,
    "now": true,
    "description": "Transforming spoken Shakespeare into tactical action."
  },
  {
    "id": "legacy-game-poems",
    "title": "Game Poems",
    "type": "Gathering",
    "themes": [
      "games",
      "verse"
    ],
    "date": "2026",
    "url": "https://luma.com/gamepoems",
    "description": "Computational Poetry Reading Group, tiat"
  },
  {
    "id": "legacy-thinky",
    "title": "What Are Thinky Games?",
    "type": "Talk",
    "themes": [
      "games",
      "systems"
    ],
    "date": "2024",
    "url": "https://www.youtube.com/watch?v=h-gnrK2r5rQ",
    "description": "Hyper Talks, A MAZE. / Berlin"
  },
  {
    "id": "legacy-pitch",
    "title": "Pitching Your Thinky Game",
    "type": "Talk",
    "themes": [
      "games"
    ],
    "date": "2024",
    "url": "https://www.youtube.com/watch?v=a5OWJbeilXY",
    "description": "ThinkyCon, Thinky Games"
  }
];
function publicCategory(entry){
 if(entry.id==="legacy-rhyme"||entry.title.trim().toLowerCase()==="you are rhyme")return "Games";
 const map={Game:"Games",Games:"Games",Tinkering:"Experiments",Experiment:"Experiments",Experiments:"Experiments",Research:"Experiments",Gathering:"Gatherings",Gatherings:"Gatherings",Exhibition:"Curation",Curation:"Curation",Talk:"Talks",Talks:"Talks",Teaching:"Talks",Writing:"Writing",Press:"Press",Recognition:"Recognition",Collaboration:"Projects"};
 return map[entry.type]||"Projects";
}
function starFrames(){
 const chars=Array.from("｡･:*˚:✧｡"),star=chars.splice(6,1)[0];
 const positions=[6,5,4,3,2,3,4,5,6];
 return positions.map((position,index)=>{const frame=[...chars];frame.splice(position,0,index%2===0?star:"✦");return frame.join("")});
}
function animateStar(button){
 const frames=starFrames(),motion=window.matchMedia("(prefers-reduced-motion: reduce)");
 let timer=null,index=0;
 const stop=()=>{if(timer!==null){clearInterval(timer);timer=null}button.textContent=frames[0];index=0};
 const start=()=>{if(motion.matches||document.hidden||button.matches(":hover")||document.activeElement===button)return; if(timer!==null)return;timer=setInterval(()=>{index=(index+1)%frames.length;button.textContent=frames[index]},800)};
 const update=()=>{stop();start()};
 button.addEventListener("pointerenter",stop);
 button.addEventListener("pointerleave",start);
 button.addEventListener("focus",stop);
 button.addEventListener("blur",start);
 document.addEventListener("visibilitychange",update);
 if(motion.addEventListener)motion.addEventListener("change",update);else motion.addListener(update);
 update();
}
function selectWorks(entries,order,active,type) {
 const selected=order.filter(x=>active.includes(x));
 return entries.filter(e=>(type==="all"||publicCategory(e)===type)&&(selected.length===3||e.themes.some(x=>selected.includes(x)))).sort((a,b)=>{
 for(const word of selected){const d=Number(b.themes.includes(word))-Number(a.themes.includes(word));if(d)return d;}
 return (b.date||"").localeCompare(a.date||"");
 });
}
function chosenImage(entry,order,active) {
 const leading=order.find(word=>active.includes(word)&&entry.themes.includes(word));
 if(leading&&entry.images?.[leading])return entry.images[leading];
 return entry.cover||"";
}
function mergeWorks(legacy, imported) {
 const byTitle=new Map(legacy.map(e=>[e.title.trim().toLowerCase(),e]));
 for(const e of imported){const key=e.title.trim().toLowerCase();const base=byTitle.get(key);byTitle.set(key,{...base,...e,cover:e.cover||base?.cover,url:base?.url?.startsWith("#")?base.url:e.url||base?.url});}
 return [...byTitle.values()];
}
function startGallery() {
 const initial=["games","systems","verse"];
 let order=[...initial],active=[...initial];
 const entries=mergeWorks(LEGACY,Array.isArray(window.creativeArchive)?window.creativeArchive:[]);
 const $=id=>document.getElementById(id);
 const category=$("category"),gallery=$("gallery"),lenses=$("lenses");
 const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node};
 const safeURL=(url)=>{if(typeof url!=="string")return "";if(/^#[-\w]+$/.test(url)||/^\.\/images\/[\w./-]+$/.test(url)&&!url.includes(".."))return url;try{const parsed=new URL(url);return parsed.protocol==="https:"?parsed.href:""}catch{return ""}};
 const link=(title,url)=>{const href=safeURL(url);if(!href)return el("span",title);const node=el("a",title);node.href=href;return node};
 function redrawLenses(focus) {
  lenses.replaceChildren();
  for(const word of order){
   const group=el("span",undefined,"lens");group.dataset.first=String(word===order[0]);
   const btn=el("button",word);btn.type="button";btn.id="theme-"+word;btn.setAttribute("aria-pressed",String(active.includes(word)));btn.title="Toggle "+word;
   btn.addEventListener("click",()=>{active=active.includes(word)?active.filter(x=>x!==word):[...active,word];redrawLenses(btn.id);render()});
   const up=el("button","↑","priority");up.type="button";up.id="priority-"+word;up.setAttribute("aria-label","Prioritize "+word);up.title="Move "+word+" to first";
   up.addEventListener("click",()=>{order=[word,...order.filter(x=>x!==word)];if(!active.includes(word))active.push(word);redrawLenses(up.id);render()});
   group.append(btn,up);lenses.append(group);
  }
  if(focus)$(focus)?.focus();
 }
 function render(){
  const visible=selectWorks(entries,order,active,category.value);
  gallery.replaceChildren();
  for(const entry of visible){
   const card=el("article",undefined,"work-card");
   const src=safeURL(chosenImage(entry,order,active));
   if(src){const img=el("img");img.src=src;img.alt=entry.title+" — "+(entry.imageAlt||"project documentation");img.loading="lazy";img.decoding="async";const href=safeURL(entry.url);if(href){const a=el("a");a.href=href;a.append(img);card.append(a)}else card.append(img)}
   const h=el("h3");h.append(link(entry.title,entry.url));card.append(h,el("p",[publicCategory(entry),entry.date?.slice(0,4)].filter(Boolean).join(" · "),"meta"));
   if(entry.credits)card.append(el("p",entry.credits,"meta"));
   if(entry.description)card.append(el("p",entry.description,"meta"));
   gallery.append(card);
  }
  $("gallery-status").textContent=visible.length?`${visible.length} / ${entries.length}`:"No entries match this selection.";
 }
 const preferred=["Games","Experiments","Gatherings","Curation","Talks","Writing","Press","Recognition","Projects"];
 const available=new Set(entries.map(publicCategory));
 for(const type of preferred.filter(x=>available.has(x))){const opt=el("option",type);opt.value=type;category.append(opt)}
 category.addEventListener("change",render);
 $("reset").addEventListener("click",()=>{order=[...initial];active=[...initial];category.value="all";redrawLenses();render()});
 // Now is authored directly in index.html: preserve prose and inline links.
 const upcoming=$("upcoming-list");
 const date=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const today=["year","month","day"].map(t=>date.find(x=>x.type===t).value).join("-");
 // Curated events are the fallback until the Notion export is connected.
 // A curated month-only entry remains visible through that month.
 const curated=[...upcoming.querySelectorAll("li[data-start]")];
 const key=u=>String(u||"").replace(/\/$/,"").toLowerCase();
 const curatedLinks=new Set(curated.map(li=>key(li.querySelector("a")?.href)));
 const curatedTitles=new Set(curated.map(li=>li.querySelector("a")?.textContent.trim().toLowerCase()));
 const visibleEvents=curated.filter(li=>li.dataset.end>=today);
 for(const e of entries.filter(e=>e.event&&/^\d{4}-\d{2}-\d{2}/.test(e.date||"")&&(e.endDate||e.date).slice(0,10)>=today)){
  if(curatedLinks.has(key(e.url))||curatedTitles.has(e.title.trim().toLowerCase()))continue;
  const item=el("li");item.dataset.start=e.date.slice(0,10);
  const label=new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",timeZone:"UTC"}).format(new Date(e.date.slice(0,10)+"T12:00:00Z"));
  item.append(el("span",label+" · "),link(e.title,e.url));visibleEvents.push(item);
 }
 upcoming.replaceChildren(...visibleEvents.sort((a,b)=>a.dataset.start.localeCompare(b.dataset.start)));
 if(!upcoming.children.length)upcoming.append(el("li","No public events listed."));
 function openHash(){const id=location.hash.slice(1);const target=$(id);if(target?.tagName==="DETAILS"){target.open=true;target.scrollIntoView()}}
 window.addEventListener("hashchange",openHash);openHash();redrawLenses();render();animateStar($("reset"));
}
startGallery();
