import {mkdir,writeFile,readdir,rm,rename,mkdtemp,copyFile} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
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
 return {recordId:row.id,title,type,themes,date:date?.start||"",endDate:date?.end||"",status:property("Status","select")?.name||"",description:text("Public description"),credits:text("Credits"),url,featured:property("Featured","checkbox"),now:property("Now","checkbox"),event:property("Public event","checkbox"),files:{cover:property("Cover","files"),games:property("Games image","files"),systems:property("Systems image","files"),verse:property("Verse image","files")}};
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
  const entries=[];
  for(const row of rows){
   const {recordId,files,...entry}=row,id=hash(recordId).slice(0,24);
   const cover=await download(files.cover[0],stage,id+"-cover"),images={};
   for(const word of ["games","systems","verse"])if(files[word][0])images[word]=await download(files[word][0],stage,id+"-"+word);
   entries.push({id,...entry,cover,images});
  }
  entries.sort((a,b)=>a.id.localeCompare(b.id));
  const output="// Generated from explicitly approved Creative Archive fields.\nwindow.creativeArchive = "+JSON.stringify(entries,null,2)+";\n";
  const folder=join(root,"images","archive");await mkdir(folder,{recursive:true});
  const names=await readdir(stage);for(const name of names)await copyFile(join(stage,name),join(folder,name));
  const temp=join(root,".archive-data.tmp");await writeFile(temp,output,"utf8");await rename(temp,join(root,"archive-data.js"));
  for(const name of await readdir(folder))if(/^[0-9a-f]{24}-(cover|games|systems|verse)-[0-9a-f]{16}\.(png|jpg|webp|gif|avif)$/.test(name)&&!names.includes(name))await rm(join(folder,name));
  console.log("Exported "+entries.length+" approved entries. Review the diff before publishing.");
 }finally{await rm(stage,{recursive:true,force:true})}
}
if(process.argv.includes("--test")){runTests();console.log("9 archive mapping tests passed");}
else sync().catch(error=>{console.error("Archive sync failed: "+(error.message||"unknown error"));process.exitCode=1});
