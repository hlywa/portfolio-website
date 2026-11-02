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
  if(current==="home")window.dispatchEvent(new Event("galaxy:route-visible"));
  document.title=current==="home"?"Rachel Heleva":current.startsWith("project-")?"Work · Rachel Heleva":current+" · Rachel Heleva";
  window.scrollTo(0,0);
}
window.addEventListener("hashchange",navigate);
navigate();
document.querySelectorAll(".charm").forEach(button=>{
  button.addEventListener("click",()=>{
    // A short blue click flash remains visible before the route changes.
    button.classList.add("is-pressed");
    const target=button.dataset.target;
    window.setTimeout(()=>{
      button.classList.remove("is-pressed");
      if(target==="work"){scrollToWork();return;}
      if(target==="writings"){scrollToWritings();return;}
      location.hash=target;
    },170);
  });
});
document.querySelector("[data-scroll-work]")?.addEventListener("click",scrollToWork);
document.querySelector("[data-scroll-top]")?.addEventListener("click",event=>{
  event.preventDefault();
  window.scrollTo({top:0,behavior:reducedMotion.matches?"instant":"smooth"});
  if(location.hash!=="#home")history.replaceState(null,"",location.pathname+location.search+"#home");
});

