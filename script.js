// Little worlds. The charms are real text, so they stay crisp and accessible.
const routes=['home','about','work','contact','hidden-room'];
const $=s=>document.querySelector(s);
function showRoute(){
 const name=decodeURIComponent(location.hash.slice(1))||'home';
 const active=routes.includes(name)?name:'home';
 for(const id of routes)document.getElementById(id).hidden=id!==active;
 document.title=(active==='home'?'little worlds':active)+' · Rachel Heleva';
 window.scrollTo(0,0);
}
window.addEventListener('hashchange',showRoute);showRoute();
for(const charm of document.querySelectorAll('.sigil')){
 const button=charm.querySelector('button');const route=charm.dataset.route;
 let start=null;let suppressClick=false;
 button.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  const r=charm.getBoundingClientRect();
  start={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left+r.width/2,top:r.top+r.height/2,moved:false};
  button.setPointerCapture(e.pointerId);
 });
 button.addEventListener('pointermove',e=>{
  if(!start||start.id!==e.pointerId)return;
  const dx=e.clientX-start.x,dy=e.clientY-start.y;
  if(Math.hypot(dx,dy)>7)start.moved=true;
  if(!start.moved)return;
  charm.classList.add('dragging');
  const bounds=$('.galaxy').getBoundingClientRect();
  const x=Math.max(charm.offsetWidth/2,Math.min(bounds.width-charm.offsetWidth/2,start.left+dx-bounds.left));
  const y=Math.max(charm.offsetHeight/2,Math.min(bounds.height-charm.offsetHeight/2,start.top+dy-bounds.top));
  charm.style.left=x+'px';charm.style.top=y+'px';
  if(route==='mystery'&&Math.hypot(dx,dy)>65)reveal();
 });
 button.addEventListener('pointerup',()=>{if(!start)return;suppressClick=start.moved;start=null;charm.classList.remove('dragging')});
 button.addEventListener('pointercancel',()=>{start=null;charm.classList.remove('dragging')});
 button.addEventListener('click',e=>{
  if(suppressClick){e.preventDefault();suppressClick=false;return}
  if(route==='mystery')reveal();else location.hash=route;
 });
}
function reveal(){
 $('#secret').hidden=false;
 $('#hint').textContent='✧ you found something hidden ✧';
}
$('#secret').addEventListener('click',()=>location.hash='hidden-room');
