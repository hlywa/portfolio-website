const legacyMap = {
  "0503daef6a39eb7f2773a02c": {
    "title": "in countless shadows",
    "slug": "in-countless-shadows"
  },
  "4315bb3a5abe9235f5ac5de1": {
    "title": "you are rhyme",
    "slug": "you-are-rhyme"
  },
  "44e63654b96e96b865c1d85f": {
    "title": "game poems"
  },
  "b5b4baf470532fde3aa7d110": {
    "title": "what are thinky games?"
  }
};
const marker = "<!-- Generated from approved Creative Archive content. -->";
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

function plain(items){if(!Array.isArray(items))throw Error("Missing public rich text");return items.map(x=>{if(x.type!=="text")throw Error("Unsupported public rich text; use text or an external link");return x.plain_text??x.text?.content??""}).join("")}

function safeLink(raw){let u;try{u=new URL(raw)}catch{throw Error("Invalid public link")};if(u.protocol!=="https:"||u.username||u.password||[...u.searchParams.keys()].some(k=>/^x-amz-|^signature$|^token$/i.test(k)))throw Error("Use a public HTTPS link without access tokens");return esc(u.href)}

function rich(items){plain(items);return items.map(x=>{let v=esc(x.plain_text??x.text?.content??"").replace(/\r?\n/g,"<br>");for(const [key,tag] of [["code","code"],["bold","strong"],["italic","em"],["underline","u"],["strikethrough","s"]])if(x.annotations?.[key])v=`<${tag}>${v}</${tag}>`;const href=x.href??x.text?.link?.url;return href?`<a href="${safeLink(href)}">${v}</a>`:v}).join("")}

function publicSection(blocks){const start=[],end=[];for(let i=0;i<blocks.length;i++){const b=blocks[i];if(!["heading_1","heading_2","heading_3"].includes(b.type))continue;const name=(b[b.type]?.rich_text??[]).map(t=>t.plain_text??t.text?.content??"").join("").trim().toLowerCase();if(name==="public content")start.push(i);if(name==="end public content")end.push(i)}if(start.length!==1||end.length!==1||start[0]>=end[0]||blocks[start[0]].has_children||blocks[end[0]].has_children)throw Error("Page needs one Public content heading and one End public content heading, in order");const content=blocks.slice(start[0]+1,end[0]);if(!content.length)throw Error("Public content section is empty");return content}

function pageSlug(id){if(!/^[a-f0-9]{24}$/.test(id))throw Error("Invalid public archive ID");return legacyMap[id]?.slug??"archive-"+id}

async function renderBlocks(blocks,io,depth=0){
 if(depth>8)throw Error("Public content nesting is too deep");let html="",list="";
 const close=()=>{if(list){html+=`</${list}>\n`;list=""}};
 for(const b of blocks){
  const t=b.type,v=b[t];if(!v||b.archived||b.in_trash)throw Error("Invalid public content block");
  const tag=t==="bulleted_list_item"?"ul":t==="numbered_list_item"?"ol":"";
  if(tag){if(list!==tag){close();list=tag;html+=`<${list}>\n`}html+=`<li>${rich(v.rich_text)}${b.has_children?await renderBlocks(await io.children(b.id),io,depth+1):""}</li>\n`;continue}
  close();if(b.has_children)throw Error("Unsupported nested public block: "+t);
  if(t==="paragraph")html+=`<p>${rich(v.rich_text)||"<br>"}</p>\n`;
  else if(["heading_1","heading_2","heading_3"].includes(t)){const h=t==="heading_3"?"h3":"h2";html+=`<${h}>${rich(v.rich_text)}</${h}>\n`}
  else if(t==="quote")html+=`<blockquote>${rich(v.rich_text)}</blockquote>\n`;
  else if(t==="code")html+=`<pre><code>${esc(plain(v.rich_text))}</code></pre>\n`;
  else if(t==="divider")html+="<hr>\n";
  else if(t==="image"){const path=await io.download(v);if(!/^\.\/images\/archive\/[a-z0-9.-]+$/.test(path))throw Error("Invalid generated image path");const caption=plain(v.caption??[]);html+=`<figure class="archive-media"><img src="../${esc(path.slice(2))}" alt="${esc(caption||"Project documentation")}" loading="lazy" decoding="async">${caption?`<figcaption>${rich(v.caption)}</figcaption>`:""}</figure>\n`}
  else if(["bookmark","embed","video","link_preview"].includes(t)){const url=t==="video"?(v.type==="external"?v.external?.url:null):v.url;if(!url)throw Error("Use a public external media link");html+=`<p><a href="${safeLink(url)}">${esc(plain(v.caption??[])||"Open linked media")}</a></p>\n`}
  else throw Error("Unsupported public content block: "+t);
 }
 close();return html;
}

function renderPage(entry,body){const title=esc(entry.title),desc=esc(entry.description),meta=[entry.type,...entry.themes,entry.date?.slice(0,4)].filter(Boolean).map(esc).join(" · ");const cover=entry.cover&&!body.includes('class="archive-media"')?`<figure class="archive-media"><img src="../${esc(entry.cover.slice(2))}" alt="${title} documentation"></figure>\n`:"";return `<!doctype html>\n${marker}\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#000000"><meta name="description" content="${desc}"><title>${title} · Rachel Heleva</title><link rel="icon" type="image/svg+xml" href="../doorway-transparent.svg"><link rel="stylesheet" href="../archive.css"></head>\n<body><main class="reading-page"><header class="reading-nav"><a href="../#work">← archive</a><a href="../">｡･:*˚:✧｡</a></header><article class="reading-article"><h1>${title}</h1><p class="meta">${meta}</p>\n${cover}<div class="archive-body">\n${body}</div>${entry.credits?`<p class="meta">${esc(entry.credits)}</p>`:""}</article><footer><a href="../#work">← archive</a></footer></main></body></html>\n`}

async function runPageTests(){
 let n=0;const check=(x,msg)=>{if(!x)throw Error("Page test failed: "+msg);n++};const txt=(s,href)=>[{type:"text",plain_text:s,...(href?{href}:{})}],b=(type,s)=>({type,[type]:{rich_text:txt(s)}});
 const fixture=[b("paragraph","PRIVATE BEFORE"),b("heading_2","Public content"),b("paragraph","A <poem> & line\nsecond"),{type:"paragraph",paragraph:{rich_text:txt("Game Poems","https://luma.com/gamepoems")}},b("heading_2","A real heading"),{type:"image",image:{type:"external",external:{url:"https://example.com/image.png"},caption:txt("A screenshot")}},b("heading_2","End public content"),{type:"child_page",child_page:{title:"PRIVATE AFTER"},has_children:true}];
 let downloads=0,children=0;const io={download:async()=>{downloads++;return "./images/archive/test.png"},children:async()=>{children++;throw Error("Private child read")}};
 const body=await renderBlocks(publicSection(fixture),io);
 check(!body.includes("PRIVATE")&&children===0,"private blocks excluded");check(body.includes("&lt;poem&gt; &amp; line<br>second"),"escaped text and line breaks");check(body.includes('href="https://luma.com/gamepoems"'),"links");check(body.includes("<h2>A real heading</h2>"),"headings");check(downloads===1&&body.includes("../images/archive/test.png")&&body.includes("A screenshot"),"local media");check(pageSlug("0503daef6a39eb7f2773a02c")==="in-countless-shadows","legacy URL");check(pageSlug("aaaaaaaaaaaaaaaaaaaaaaaa")==="archive-aaaaaaaaaaaaaaaaaaaaaaaa","stable new URL");
 const html=renderPage({title:"A <work>",description:'A "description"',type:"Game",themes:["verse"],date:"",cover:"./images/archive/cover.png"},body);check(html.includes(marker)&&html.includes("A &lt;work&gt;")&&!html.includes("cover.png"),"page and no duplicate cover");check(!html.includes("PRIVATE"),"private content not rendered");
 for(const bad of [fixture.slice(0,-2),[fixture[6],...fixture],[fixture[1],fixture[6]]]){let rejected=false;try{publicSection(bad)}catch{rejected=true}check(rejected,"invalid delimiters rejected")}
 for(const bad of [{type:"paragraph",paragraph:{rich_text:txt("unsafe","javascript:alert(1)")}},{type:"child_page",child_page:{title:"private"},has_children:true},{type:"paragraph",paragraph:{rich_text:[{type:"mention",plain_text:"private"}]}}]){let rejected=false;try{await renderBlocks([bad],io)}catch{rejected=true}check(rejected,"unsafe or unsupported content rejected")}
 const li=await renderBlocks([b("bulleted_list_item","one"),b("bulleted_list_item","two"),b("code","<script>")],io);check(li.includes("<ul>\n<li>one</li>\n<li>two</li>\n</ul>")&&li.includes("&lt;script&gt;"),"lists and code");return n;
}
export {legacyMap,marker,publicSection,pageSlug,renderBlocks,renderPage,runPageTests};
