// Stage only tracked public site files; validate the generated archive before deployment.
import {execFileSync} from "node:child_process";
import {mkdir,readFile,copyFile,lstat} from "node:fs/promises";
import {resolve,dirname,sep} from "node:path";

const root=resolve(process.cwd());
const dest=resolve(process.argv[2]||".");
if(dest===root||dest.startsWith(root+sep))throw Error("Choose a staging directory outside the repository");
const tracked=execFileSync("git",["ls-files","-z"],{encoding:"utf8"}).split("\0").filter(Boolean);
const rootFiles=new Set(["index.html","archive-data.js","archive-gallery.js","archive.css","writings.js","script.js","style.css","galaxy.js","doorway-transparent.svg","favicon.svg","CNAME",".nojekyll"]);
const publicFile=p=>rootFiles.has(p)||/^(images|works|essays)\/(?:[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\/)*[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(html|css|js|mjs|json|svg|png|jpg|jpeg|webp|gif|avif|ico|pdf|woff2?|ttf|otf|mp4|webm|mp3|ogg|wav)$/i.test(p);
const files=new Set(tracked.filter(publicFile));
function check(ok,msg){if(!ok)throw Error(msg)}
for(const p of ["index.html","archive-data.js","archive-gallery.js","archive.css","writings.js","CNAME"])check(files.has(p),"Missing required site file: "+p);
const read=p=>readFile(resolve(root,p),"utf8");
const source=await read("archive-data.js");
const parsed=source.match(/^\/\/[^\n]*\nwindow\.creativeArchive = (\[[\s\S]*?\]);\nwindow\.creativeArchiveManaged = (\[[\s\S]*?\]);\s*$/);
check(parsed,"Invalid generated archive structure");
const entries=JSON.parse(parsed[1]),managed=JSON.parse(parsed[2]),ids=new Set();
check(Array.isArray(entries)&&Array.isArray(managed),"Invalid archive arrays");
function media(p){
 check(typeof p==="string"&&/^\.\/images\/archive\/[a-f0-9]{24}-(cover|games|systems|verse|body-\d+)-[a-f0-9]{16}\.(png|jpg|webp|gif|avif)$/.test(p),"Invalid generated media reference");
 check(files.has(p.slice(2)),"Missing archive image");
}
function publicLink(p){
 const u=new URL(p);
 check(u.protocol==="https:"&&!u.username&&!u.password&&!/(^|\b)(notion\.so|notion\.site)$/i.test(u.hostname)&&!Array.from(u.searchParams.keys()).some(k=>/^(x-amz-|signature$|token$|access_token$)/i.test(k)),"Invalid or private public link");
}
for(const e of entries){
 check(/^[a-f0-9]{24}$/.test(e.id)&&!ids.has(e.id),"Invalid or duplicate archive identifier");
 ids.add(e.id);
 if(e.cover)media(e.cover);
 for(const p of Object.values(e.images||{}))media(p);
 if(e.externalUrl)publicLink(e.externalUrl);
 if(e.openAs==="Page"){
  check(/^\.\/works\/(?:archive-[a-f0-9]{24}|in-countless-shadows|you-are-rhyme)\.html$/.test(e.url),"Invalid generated page path");
  const p=e.url.slice(2);check(files.has(p),"Missing generated work page");
  const html=await read(p);
  check(html.startsWith("<!doctype html>\n<!-- Generated from approved Creative Archive content. -->"),"Page not generated from approved content");
  for(const m of html.matchAll(/<img[^>]*\bsrc="([^"]+)"/g)){check(m[1].startsWith("../"),"Unexpected image URL in generated page");media("./"+m[1].slice(3))}
  for(const m of html.matchAll(/<a[^>]*\bhref="(https:[^"]+)"/g))publicLink(m[1].replace(/&amp;/g,"&"));
 }else if(e.openAs==="External link")publicLink(e.url);
 else check(e.openAs==="Gallery card"&&!e.url,"Invalid archive entry destination");
}
for(const p of files){
 const src=resolve(root,p);
 check((await lstat(src)).isFile(),"Public site path is not a regular file: "+p);
 const target=resolve(dest,p);await mkdir(dirname(target),{recursive:true});await copyFile(src,target);
}
console.log("Validated "+entries.length+" approved archive entries and staged "+files.size+" public files.");
