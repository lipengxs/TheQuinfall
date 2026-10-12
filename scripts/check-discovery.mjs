import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export async function auditDiscovery(base,expectIndex=true){
 const data=JSON.parse(await fs.readFile('content/related-games.json','utf8'));
 const errors=[];const check=(ok,message)=>{if(!ok)errors.push(message);};
 const decode=s=>s.replaceAll('&amp;','&').replaceAll('&#x27;',"'").replaceAll('&quot;','"');
 const attr=(tag,name)=>decode(tag.match(new RegExp('\\b'+name+'=["\']([^"\']*)["\']','i'))?.[1]||'');
 const links=html=>[...html.matchAll(/<a\b[^>]*>/gi)].map(m=>attr(m[0],'href'));
 const get=async path=>{const response=await fetch(new URL(path,base),{redirect:'manual',signal:AbortSignal.timeout(20000)});check(response.status===200,path+' HTTP '+response.status);return {response,html:await response.text()};};
 const paths=['/related-games',...data.articles.map(a=>a.path)];
 check(new Set(data.entries.map(e=>e.url)).size===data.entries.length,'Repeated directory target');
 for(const entry of data.entries){check(entry.url.startsWith('https://')&&new URL(entry.url).origin!==data.origin,'Invalid or self directory target '+entry.url);check(entry.name&&entry.category&&entry.reason&&entry.difference,'Incomplete editorial entry');}
 for(const path of paths){
  const {html,response}=await get(path);const as=links(html);const metas=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
  const canonicals=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]).filter(t=>attr(t,'rel')==='canonical');
  check(canonicals.length===1&&attr(canonicals[0],'href')===data.origin+path,path+' canonical mismatch');
  check((html.match(/<h1\b/gi)||[]).length===1,path+' needs one H1');
  check(/<title>[^<]+<\/title>/i.test(html),path+' title missing');
  check(metas.some(t=>attr(t,'name')==='description'&&attr(t,'content').length>20),path+' description missing');
  const robots=metas.filter(t=>attr(t,'name')==='robots').map(t=>attr(t,'content')).join(',')+','+(response.headers.get('x-robots-tag')||'');
  check(expectIndex?!robots.includes('noindex'):robots.includes('noindex'),path+' indexing policy mismatch');
  let schemas=[];for(const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const s=JSON.parse(m[1]);schemas.push(...(s['@graph']||[s]));}catch{check(false,path+' invalid JSON-LD');}}
  check(schemas.some(s=>s['@type']===(path==='/related-games'?'CollectionPage':'Article')),path+' schema missing');
  const targets=path==='/related-games'?data.entries.map(e=>e.url):(JSON.parse(await fs.readFile('content/game-comparison.json','utf8'))).links.map(l=>l[1]);
  for(const target of targets)check(as.includes(target),path+' missing initial-HTML link '+target);
  check(as.includes('/related-games'),path+' missing directory navigation');
 }
 for(const group of data.guideRecommendations){const {html}=await get(group.path);const as=links(html);for(const e of group.entries)check(as.includes(e.url),group.path+' missing recommendation '+e.url);}
 const {html:home}=await get('/');check(/class=["'][^"']*gd-home/.test(home)&&links(home).includes('/related-games'),'Homepage directory entry missing');
 const {html:xml}=await get('/sitemap.xml');for(const path of paths)check(expectIndex?xml.includes(data.origin+path):!xml.includes(data.origin+path),'Sitemap policy mismatch '+path);
 return errors;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const i=process.argv.indexOf('--base-url');assert(i>=0,'Pass --base-url');const errors=await auditDiscovery(new URL(process.argv[i+1]),!process.argv.includes('--expect-noindex'));if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('PASS: discovery routes, initial HTML links, metadata, guide cards and sitemap');}
