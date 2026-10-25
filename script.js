const pages=["home","about","work","contact","secret"];
function navigate(){const target=location.hash.slice(1)||"home";const current=pages.includes(target)?target:"home";for(const p of pages)document.getElementById(p).hidden=p!==current;document.title=(current==="home"?"Rachel Heleva":current+" · Rachel Heleva");}
window.addEventListener("hashchange",navigate);navigate();
document.querySelectorAll(".charm").forEach(btn=>btn.addEventListener("click",()=>location.hash=btn.dataset.target));
const mystery=document.getElementById("mystery"),door=document.getElementById("secret-door"),button=mystery.querySelector("button");
let drag=null;button.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"&&e.button!==0)return;const rect=mystery.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:rect.left,top:rect.top};button.setPointerCapture(e.pointerId)});
button.addEventListener("pointermove",e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)<5)return;mystery.style.left=(drag.left+dx)+"px";mystery.style.top=(drag.top+dy)+"px";if(Math.hypot(dx,dy)>55)door.hidden=false});
const finish=()=>{drag=null};button.addEventListener("pointerup",finish);button.addEventListener("pointercancel",finish);door.addEventListener("click",()=>location.hash="secret");