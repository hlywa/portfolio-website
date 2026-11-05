const pages=["home","about","work","contact","project-in-countless-shadows","project-you-are-rhyme"];
function navigate(){
  const target=location.hash.slice(1)||"home";
  const current=pages.includes(target)?target:"home";
  for(const page of pages)document.getElementById(page).hidden=page!==current;
  document.title=current==="home"?"Rachel Heleva":current.startsWith("project-")?"Work · Rachel Heleva":current+" · Rachel Heleva";
  window.scrollTo(0,0);
}
window.addEventListener("hashchange",navigate);
navigate();
document.querySelectorAll(".charm").forEach(button=>{
  button.addEventListener("click",()=>{location.hash=button.dataset.target});
});
