import {mkdir,writeFile,readdir,rm,rename,mkdtemp,copyFile} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
function esc(s){return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}
function publicLink(s){return typeof s==="string"&&/^https:\/\/[a-z0-9.-]+(?::\d+)?(?:[/?#][^\s]*)?$/i.test(s)&&!/^https:\/\/(?:[^/]+\.)?(?:notion\.so|notion\.site|notion\.com)(?:[/:?#]|$)/i.test(s)}
function rich(parts){return (parts||[]).map(t=>{
 if(t.type!=="text")throw Error("Unsupported rich text or mention in public content");
 let s=esc(t.plain_text??t.text?.content??"").replaceAll("\n","<br>");
 for(const [k,tag] of [["code","code"],["bold","strong"],["italic","em"],["strikethrough","s"],["underline","u"]])if(t.annotations?.[k])s=`<${tag}>${s}</${tag}>`;
 const href=t.href||t.text?.link?.url;if(href){if(!publicLink(href))throw Error("Unsupported or private link in public content");s=`<a href="${esc(href)}">${s}</a>`}return s;
 }).join("")}
function publicToggle(blocks){const m=blocks.filter(b=>b.type==="toggle"&&!b.archived&&!b.in_trash&&b.toggle?.rich_text?.map(x=>x.plain_text??x.text?.content??"").join("").trim()==="Public content");if(m.length!==1||!m[0].has_children)throw Error("Page requires exactly one nonempty top-level Public content toggle");return m[0].id}
async function renderBlocks(blocks,children,image,depth=0){
 if(depth>12)throw Error("Public content too deeply nested");
 let out="",list="";const close=()=>{if(list){out+=`</${list}>`;list=""}};
 for(const b of blocks){if(b.archived||b.in_trash)continue;const t=b.type,v=b[t]||{},content=()=>rich(v.rich_text),nested=async()=>b.has_children?renderBlocks(await children(b.id),children,image,depth+1):"";
 if(t==="bulleted_list_item"||t==="numbered_list_item"){const tag=t==="bulleted_list_item"?"ul":"ol";if(list!==tag){close();out+=`<${tag}>`;list=tag}out+=`<li>${content()}${await nested()}</li>`;continue}
 close();if(b.has_children&&!["paragraph","quote","toggle"].includes(t))throw Error("Unsupported nested public block: "+t);
 if(t==="paragraph")out+=(content()?`<p>${content()}</p>`:"")+await nested();
 else if(/^heading_[123]$/.test(t)){const h=Number(t.slice(-1))+1;out+=`<h${h}>${content()}</h${h}>`}
 else if(t==="quote")out+=`<blockquote>${content()}${await nested()}</blockquote>`;
 else if(t==="divider")out+="<hr>";
 else if(t==="code")out+=`<pre><code>${esc((v.rich_text||[]).map(x=>x.plain_text??x.text?.content??"").join(""))}</code></pre>`;
 else if(t==="toggle")out+=`<details><summary>${content()}</summary>${await nested()}</details>`;
 else if(t==="image"){const path=await image(v,b.id),caption=rich(v.caption||[]),alt=(v.caption||[]).map(x=>x.plain_text??x.text?.content??"").join("");out+=`<figure><img loading="lazy" src="${esc(path)}" alt="${esc(alt)}">${caption?`<figcaption>${caption}</figcaption>`:""}</figure>`}
 else if(["bookmark","link_preview","embed","video"].includes(t)){const url=v.url||v.external?.url;if(!publicLink(url))throw Error("Unsupported public media link");out+=`<p><a href="${esc(url)}">${rich(v.caption||[])||esc(url)}</a></p>`}
 else throw Error("Unsupported public block: "+t);
 }close();return out;
}
function pageHTML(e,body){return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#000000"><title>${esc(e.title)} · Rachel Heleva</title><link rel="icon" type="image/svg+xml" href="../doorway-transparent.svg"><link rel="stylesheet" href="../archive.css"><meta name="description" content="${esc(e.description)}"></head>
<body><main class="reading-page"><header class="reading-nav"><a href="../#work">← archive</a><a href="../">｡･:*˚:✧｡</a></header><article class="reading-article"><h1>${esc(e.title)}</h1>${e.date?`<p class="meta"><time datetime="${esc(e.date)}">${esc(e.date.slice(0,10))}</time></p>`:""}${e.description?`<p class="shadows-deck">${esc(e.description)}</p>`:""}${body}${e.credits?`<p class="meta">${esc(e.credits)}</p>`:""}${e.url&&publicLink(e.url)?`<p><a href="${esc(e.url)}">Related link ↗</a></p>`:""}</article><footer><a href="../#work">← archive</a></footer></main></body></html>\n`}
async function pageTests(){
 const assert=(x,m)=>{if(!x)throw Error("Page test: "+m)},rt=s=>[{type:"text",plain_text:s,text:{content:s}}],p=s=>({type:"paragraph",paragraph:{rich_text:rt(s)}}),toggle={id:"public",type:"toggle",has_children:true,toggle:{rich_text:rt("Public content")}};
 assert(publicToggle([p("PRIVATE"),toggle])==="public","boundary");
 for(const a of [[p("PRIVATE")],[toggle,toggle],[{...toggle,has_children:false}]]){let fail=false;try{publicToggle(a)}catch{fail=true}assert(fail,"ambiguous or missing boundary")}
 const b=await renderBlocks([p("<script> & poem\nline two"),{type:"heading_2",heading_2:{rich_text:rt("Heading")}},{type:"bulleted_list_item",bulleted_list_item:{rich_text:rt("one")}},{type:"bulleted_list_item",bulleted_list_item:{rich_text:rt("two")}},{type:"image",image:{caption:rt("Caption")}}],async()=>{throw Error("Unexpected recursion")},async()=>"../images/archive/example.png");
 assert(b.includes("&lt;script&gt; &amp;")&&!b.includes("<script>"),"escaping");assert(b.includes("<br>line two")&&b.includes("<h3>Heading</h3>"),"formatting");assert(b.includes("<ul><li>one</li><li>two</li></ul>"),"lists");assert(b.includes('alt="Caption"')&&b.includes("<figcaption>Caption</figcaption>"),"images");assert(!b.includes("PRIVATE"),"no private sibling");
 const page=pageHTML({title:"Essay <title>",description:"A & B",date:"2026-11-27"},b);assert(page.includes("Essay &lt;title&gt;")&&page.includes('href="../#work"'),"page");
 for(const block of [{type:"child_page",child_page:{}},{type:"paragraph",paragraph:{rich_text:[{type:"mention",plain_text:"private"}]}},{type:"paragraph",paragraph:{rich_text:[{type:"text",plain_text:"x",href:"javascript:alert(1)"}]}},{type:"paragraph",paragraph:{rich_text:[{type:"text",plain_text:"x",href:"https://www.notion.so/private"}]}}]){let fail=false;try{await renderBlocks([block],async()=>[],async()=> "")}catch{fail=true}assert(fail,"reject unsafe block")}
}
function normalizePage(row){
 if(row.object!=="page"||row.archived||row.in_trash)return null;
 const p=row.properties||{};
 if(p.Publish?.type!=="checkbox")throw Error("Publish checkbox missing");
 if(p.Publish.checkbox!==true)return null;
 const property=(name,type)=>{const prop=p[name];if(prop?.type!==type)throw Error("Missing or incorrect archive property: "+name);return prop[type]};
 const text=(name,type="rich_text")=>property(name,type).map(t=>t.plain_text??t.text?.content??"").join("").trim();
 const title=text("Title","title"),type=property("Type","select")?.name;
 if(!title||!type)throw Error("An approved entry needs Title and Type");
 const themes=property("Themes","multi_select").map(t=>t.name);
 if(themes.some(t=>!["games","systems","verse"].includes(t)))throw Error("Unknown theme");
 const date=property("Date","date"),url=property("Link","url")||"";
 if(url&&!/^https:\/\/[a-z0-9.-]+(?::\d+)?(?:[/?#][^\s]*)?$/i.test(url))throw Error("Invalid public HTTPS link");
 if(!/^[0-9a-f-]{36}$/i.test(row.id))throw Error("Invalid record identifier");
 const openAs=p["Open as"]?property("Open as","select")?.name||"":"";
 if(!["","Page","External link","Gallery card"].includes(openAs))throw Error("Unknown Open as selection");
 if(openAs==="External link"&&!publicLink(url))throw Error("External link requires public HTTPS Link");
 return {recordId:row.id,openAs,title,type,themes,date:date?.start||"",endDate:date?.end||"",status:property("Status","select")?.name||"",description:text("Public description"),credits:text("Credits"),url,featured:property("Featured","checkbox"),now:property("Now","checkbox"),event:property("Public event","checkbox"),files:{cover:property("Cover","files"),games:property("Games image","files"),systems:property("Systems image","files"),verse:property("Verse image","files")}};
}
function runTests(){
 const check=(ok,msg)=>{if(!ok)throw Error("Test failed: "+msg)},prop=(type,value)=>({type,[type]:value});
 const r={object:"page",id:"00000000-0000-4000-8000-000000000001",properties:{
 Publish:prop("checkbox",true),Title:prop("title",[{plain_text:"A work"}]),Type:prop("select",{name:"Game"}),Themes:prop("multi_select",[{name:"games"}]),Date:prop("date",{start:"2027-01-02",end:null}),Status:prop("select",{name:"In progress"}),"Public description":prop("rich_text",[{plain_text:"Public text"}]),Credits:prop("rich_text",[]),Link:prop("url","https://example.com/work"),Featured:prop("checkbox",true),Now:prop("checkbox",false),"Public event":prop("checkbox",true),Cover:prop("files",[]),"Games image":prop("files",[]),"Systems image":prop("files",[]),"Verse image":prop("files",[]),"Private notes":prop("rich_text",[{plain_text:"DO NOT EXPORT"}])}};
 const x=normalizePage(r);
 check(x.title==="A work"&&x.event&&x.featured&&x.date==="2027-01-02","mapping");
 check(!JSON.stringify(x).includes("DO NOT EXPORT"),"private fields");
 check(normalizePage({...r,archived:true})===null,"archived");
 check(normalizePage({...r,in_trash:true})===null,"trash");
 check(normalizePage({...r,properties:{...r.properties,Publish:prop("checkbox",false)}})===null,"unchecked");
 for(const [name,value] of [["Publish",undefined],["Link",prop("url","javascript:alert(1)")],["Themes",prop("multi_select",[{name:"unknown"}])]]){let failed=false;try{normalizePage({...r,properties:{...r.properties,[name]:value}})}catch{failed=true}check(failed,"reject "+name)}
 check(normalizePage({...r,properties:{...r.properties,Themes:prop("multi_select",[])}}).themes.length===0,"untagged allowed");
}
const root=fileURLToPath(new URL("../",import.meta.url));
const hash=v=>createHash("sha256").update(v).digest("hex");
const mediaTypes={"image/png":"png","image/jpeg":"jpg","image/webp":"webp","image/gif":"gif","image/avif":"avif"};
async function getRows(){
 const token=process.env.NOTION_TOKEN,id=process.env.NOTION_DATA_SOURCE_ID;
 if(!token||!id||!/^[-0-9a-f]{32,36}$/i.test(id))throw Error("Set NOTION_TOKEN and NOTION_DATA_SOURCE_ID");
 let cursor;const records=[];
 do{
  const response=await fetch("https://api.notion.com/v1/data_sources/"+id+"/query",{method:"POST",headers:{Authorization:"Bearer "+token,"Notion-Version":"2025-09-03","Content-Type":"application/json"},body:JSON.stringify({page_size:100,filter:{property:"Publish",checkbox:{equals:true}},...(cursor?{start_cursor:cursor}:{})}),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error("Notion query failed (HTTP "+response.status+"). Check integration access and schema.");
  const result=await response.json();if(!Array.isArray(result.results))throw Error("Invalid Notion response");
  records.push(...result.results);
  if(result.has_more&&!result.next_cursor)throw Error("Incomplete Notion pagination");
  cursor=result.has_more?result.next_cursor:null;
 }while(cursor);
 return records;
}
async function getChildren(id){
 if(!/^[0-9a-f-]{36}$/i.test(id))throw Error("Invalid block identifier");
 let cursor;const blocks=[];
 do{
  const response=await fetch("https://api.notion.com/v1/blocks/"+id+"/children?page_size=100"+(cursor?"&start_cursor="+encodeURIComponent(cursor):""),{headers:{Authorization:"Bearer "+process.env.NOTION_TOKEN,"Notion-Version":"2025-09-03"},signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error("Unable to read approved blocks (HTTP "+response.status+")");
  const result=await response.json();if(!Array.isArray(result.results))throw Error("Invalid block response");blocks.push(...result.results);
  if(result.has_more&&!result.next_cursor)throw Error("Incomplete block pagination");cursor=result.has_more?result.next_cursor:null;
 }while(cursor);return blocks;
}
async function download(file,stage,key){
 if(!file)return "";
 const raw=file.type==="file"?file.file?.url:file.type==="external"?file.external?.url:null;
 let u;try{u=new URL(raw);if(u.protocol!=="https:"||u.username||u.password)throw Error()}catch{throw Error("Unsupported approved image; use a Notion-hosted or HTTPS raster image")}
 const res=await fetch(u,{redirect:"error",signal:AbortSignal.timeout(30000)}).catch(()=>{throw Error("Approved image download failed")});
 if(!res.ok)throw Error("Approved image download failed (HTTP "+res.status+")");
 const type=(res.headers.get("content-type")||"").split(";")[0].trim().toLowerCase(),ext=mediaTypes[type];
 if(!ext)throw Error("Unsupported image type; use PNG, JPEG, WebP, GIF or AVIF");
 const max=10*1024*1024;if(Number(res.headers.get("content-length")||0)>max)throw Error("An approved image exceeds 10 MB");
 const chunks=[];let count=0;for await(const chunk of res.body){count+=chunk.length;if(count>max)throw Error("An approved image exceeds 10 MB");chunks.push(chunk)}
 if(!count)throw Error("An approved image is empty");
 const data=Buffer.concat(chunks),name=key+"-"+hash(data).slice(0,16)+"."+ext;
 await writeFile(join(stage,name),data);
 return "./images/archive/"+name;
}
async function sync(){
 const rows=(await getRows()).map(normalizePage).filter(Boolean);
 const stage=await mkdtemp(join(tmpdir(),"creative-archive-"));
 try{
  const entries=[],pageNames=[];
  const pageStage=join(stage,"pages");await mkdir(pageStage);
  for(const row of rows){
   const {recordId,files,openAs,...entry}=row,id=hash(recordId).slice(0,24);
   const cover=await download(files.cover[0],stage,id+"-cover"),images={};
   for(const word of ["games","systems","verse"])if(files[word][0])images[word]=await download(files[word][0],stage,id+"-"+word);
   if(openAs==="Page"){
    const top=await getChildren(recordId),publicId=publicToggle(top);
    const body=await renderBlocks(await getChildren(publicId),getChildren,async(file,blockId)=>{
     const path=await download(file,stage,id+"-body-"+hash(blockId).slice(0,12));
     if(!path)throw Error("Public body image has no file");return "../"+path.slice(2);
    });
    if(!body.trim())throw Error("Approved Page has no renderable content");
    const name="archive-"+id+".html";await writeFile(join(pageStage,name),pageHTML(entry,body),"utf8");pageNames.push(name);entry.url="./works/"+name;
   }else if(openAs==="Gallery card")entry.url="";
   entries.push({id,...entry,cover,images,openAs});
  }
  entries.sort((a,b)=>a.id.localeCompare(b.id));
  const output="// Generated from explicitly approved Creative Archive fields.\nwindow.creativeArchive = "+JSON.stringify(entries,null,2)+";\n";
  const folder=join(root,"images","archive");await mkdir(folder,{recursive:true});
  const names=(await readdir(stage)).filter(name=>name!=="pages");for(const name of names)await copyFile(join(stage,name),join(folder,name));
  const works=join(root,"works");await mkdir(works,{recursive:true});for(const name of pageNames)await copyFile(join(pageStage,name),join(works,name));
  for(const name of await readdir(works))if(/^archive-[0-9a-f]{24}\.html$/.test(name)&&!pageNames.includes(name))await rm(join(works,name));
  const temp=join(root,".archive-data.tmp");await writeFile(temp,output,"utf8");await rename(temp,join(root,"archive-data.js"));
  for(const name of await readdir(folder))if(/^[0-9a-f]{24}-(cover|games|systems|verse|body-[0-9a-f]{12})-[0-9a-f]{16}\.(png|jpg|webp|gif|avif)$/.test(name)&&!names.includes(name))await rm(join(folder,name));
  console.log("Exported "+entries.length+" approved entries. Review the diff before publishing.");
 }finally{await rm(stage,{recursive:true,force:true})}
}
async function checkConnection(){
 const token=process.env.NOTION_TOKEN,id=process.env.NOTION_DATA_SOURCE_ID;
 if(!token||!id||!/^[-0-9a-f]{32,36}$/i.test(id))throw Error("Missing or invalid Notion secret/variable");
 const response=await fetch("https://api.notion.com/v1/data_sources/"+id,{headers:{Authorization:"Bearer "+token,"Notion-Version":"2025-09-03"},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error("Notion data source read failed (HTTP "+response.status+"). Check token, ID and database connection.");
 const schema=await response.json();
 const expected={Title:"title",Type:"select",Themes:"multi_select",Date:"date",Status:"select","Public description":"rich_text",Credits:"rich_text",Link:"url",Featured:"checkbox",Now:"checkbox","Public event":"checkbox",Publish:"checkbox",Cover:"files","Games image":"files","Systems image":"files","Verse image":"files","Open as":"select"};
 for(const [name,type] of Object.entries(expected))if(schema.properties?.[name]?.type!==type)throw Error("Archive schema mismatch: "+name);
 const rows=await getRows();
 if(rows.some(row=>row.properties?.Publish?.checkbox!==true))throw Error("Notion returned an unapproved entry");
 const approved=rows.map(normalizePage).filter(Boolean);
 console.log("Notion authentication, archive schema and approved-only query verified. "+approved.length+" approved entries. No content or images exported.");
}
if(process.argv.includes("--test")){runTests();await pageTests();console.log("Archive mapping and page rendering/privacy tests passed");}
else if(process.argv.includes("--check-connection"))checkConnection().catch(error=>{console.error("Connection check failed: "+error.message);process.exitCode=1});
else sync().catch(error=>{console.error("Archive sync failed: "+(error.message||"unknown error"));process.exitCode=1});
