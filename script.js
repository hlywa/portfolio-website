const pages=["home","about","work","contact","project-in-countless-shadows","project-you-are-rhyme"];
const homeGallery=document.getElementById("home-gallery");
const writingsSection=document.getElementById("writings");
const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
function scrollToSection(section){
  if(!section)return;
  const jump=()=>section.scrollIntoView({behavior:reducedMotion.matches?"auto":"smooth",block:"start"});
  if(location.hash && location.hash!=="#home"){
    location.hash="home";
    requestAnimationFrame(()=>requestAnimationFrame(jump));
  } else jump();
}
function scrollToWork(){scrollToSection(homeGallery);}
function scrollToWritings(){scrollToSection(writingsSection);}
function navigate(){
  const target=location.hash.slice(1)||"home";
  const current=pages.includes(target)?target:"home";
  for(const page of pages)document.getElementById(page).hidden=page!==current;
  homeGallery.hidden=current!=="home";
  document.title=current==="home"?"Rachel Heleva":current.startsWith("project-")?"Work · Rachel Heleva":current+" · Rachel Heleva";
  window.scrollTo(0,0);
}
window.addEventListener("hashchange",navigate);
navigate();
document.querySelectorAll(".charm").forEach(button=>{
  button.addEventListener("click",()=>{
    if(button.dataset.target==="work"){scrollToWork();return;}
    if(button.dataset.target==="writings"){scrollToWritings();return;}
    location.hash=button.dataset.target;
  });
});
document.querySelector("[data-scroll-work]")?.addEventListener("click",scrollToWork);
document.querySelector("[data-scroll-top]")?.addEventListener("click",event=>{
  event.preventDefault();
  window.scrollTo({top:0,behavior:reducedMotion.matches?"instant":"smooth"});
  if(location.hash!=="#home")history.replaceState(null,"",location.pathname+location.search+"#home");
});

/*
 * Writings: a dedicated fourth orbit. Its position is independent of the
 * p5 canvas's initialization and its parent has a full scene-sized box.
 * This prevents the new glyph from collapsing onto the centered title.
 */
(function animateWritingsOrbit(){
  const scene=document.getElementById("home");
  const ring=scene?.querySelector(".ring-four");
  const charm=ring?.querySelector(".charm");
  if(!scene||!ring||!charm)return;
  const started=performance.now();
  ring.classList.add("writings-orbit-ready");

  function tick(now){
    const width=scene.clientWidth;
    const height=scene.clientHeight;
    const cx=width/2,cy=height/2;
    const rx=Math.min(width*.35,300)*1.10;
    const ry=Math.min(height*.32,265)*1.03;
    const elapsed=reducedMotion.matches?0:(now-started)/1000;
    const phase=2.27-(2*Math.PI*elapsed/61);
    const x=cx+Math.cos(phase)*rx;
    const y=cy+Math.sin(phase)*ry;
    charm.style.left=x+"px";
    charm.style.top=y+"px";
    if(!reducedMotion.matches && !scene.hidden)requestAnimationFrame(tick);
    else if(!reducedMotion.matches)setTimeout(()=>requestAnimationFrame(tick),500);
  }
  requestAnimationFrame(tick);
})();
