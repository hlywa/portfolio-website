/* Published essays appear in the unified archive.
 * Keep this empty until an essay is published. Example:
 * {title:"Title", date:"2026-11-27", summary:"Short description", url:"./essays/title.html", themes:["systems"]}
 */
const writings = [];
window.publishedWriting = writings.map((entry,index)=>({
 id:"writing-"+index,
 title:entry.title,
 type:"Writing",
 themes:entry.themes||[],
 date:entry.date,
 description:entry.summary,
 url:entry.url,
 cover:entry.cover||""
}));
