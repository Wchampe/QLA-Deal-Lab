(function(root){
'use strict';
function canonical(value){try{const u=new URL(value);if(!['http:','https:'].includes(u.protocol))return '';u.hash='';for(const k of [...u.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/i.test(k))u.searchParams.delete(k);u.searchParams.sort();return u.href.replace(/\/$/,'');}catch{return '';}}
function plain(s){return String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();}
function parseVested(html,at=new Date().toISOString()){
 const records=[],seen=new Set();
 for(const block of html.split(/<div\s+class="product-box[^"\n]*"/i).slice(1)){
  const name=block.match(/<div class="name">\s*<a href="([^"]+)">([\s\S]*?)<\/a>/i),loc=block.match(/<div class="location">([\s\S]*?)<\/div>/i);
  if(!name)continue;const url=canonical(name[1]);if(!url||new URL(url).hostname!=='www.vestedbb.com'||!url.includes('-listing-id-')||seen.has(url))continue;
  const amount=label=>{const m=block.match(new RegExp(label+':\\s*\\$([\\d,]+(?:\\.\\d+)?)','i'));return m?Number(m[1].replace(/,/g,'')):null;};
  seen.add(url);records.push({title:plain(name[2]),url,location:plain(loc?.[1]),price:amount('Asking Price'),reportedRevenue:amount('(?:Gross )?Revenue'),reportedCashFlow:amount('Cash Flow'),downPayment:amount('Down Payment'),sellerFinancing:/class="own_fin"/.test(block),kind:'Public broker listing',observedAt:at,provider:'vested',snippet:'Broker-reported revenue and cash flow; earnings definition and current availability require confirmation.'});
 }
 if(!records.length)throw Error('Broker page returned no recognizable listing cards. The source may have changed; no results were invented.');
 return records;
}
function merge(existing,incoming){const rows=existing.map(x=>({...x})),index=new Map(rows.map((x,i)=>[canonical(x.url),i]));let added=0;for(const r of incoming){const key=canonical(r.url);if(!key)continue;const i=index.get(key);if(i===undefined){index.set(key,rows.length);rows.push({...r,url:key});added++;}else rows[i]={...rows[i],...r,url:key};}return {rows,added};}
function match(records,buyer,assumptions,F){
 const a={fees:.04,workingCapital:.05,ownerPay:75000,capex:.05,taxes:.20,wcAnnual:.03,...assumptions};
 for(const k of ['fees','workingCapital','capex','taxes','wcAnnual'])if(!Number.isFinite(a[k])||a[k]<0||a[k]>1)throw Error('Invalid matching assumption: '+k);
 if(!Number.isFinite(a.ownerPay)||a.ownerPay<0)throw Error('Invalid operator pay');
 return records.map(r=>{
  if(!(r.price>0)||!(r.reportedRevenue>0)||!(r.reportedCashFlow>0))return {r,ready:false,reason:'Positive asking price, revenue, and cash flow are required; missing or zero values are excluded from scoring.'};
  const d={name:r.title,price:r.price,revenue:r.reportedRevenue,earnings:r.reportedCashFlow,fees:r.price*a.fees,workingCapital:r.price*a.workingCapital,ownerPay:a.ownerPay,capex:r.reportedCashFlow*a.capex,taxes:r.reportedCashFlow*a.taxes,wcAnnual:r.reportedCashFlow*a.wcAnnual,metric:'Unconfirmed broker cash flow',evidence:'Seller reported',sourceURL:r.url,sourceDate:r.observedAt?.slice(0,10),rural:'Unknown',demo:false};
  const cases=F.templates.map(t=>{const m=F.analyze(d,t,buyer),down=F.analyze(d,t,buyer,{stress:.2,rateShock:2});return {t,m,down,rank:F.rank(d,t,m,down,buyer)};}).sort((a,b)=>a.rank.blocked-b.rank.blocked||b.rank.score-a.rank.score||a.t.id.localeCompare(b.t.id));
  return {r,d,ready:true,cases,best:cases[0],assumptions:a};
 }).sort((a,b)=>Number(b.ready)-Number(a.ready)||(a.ready&&b.ready?(a.best.rank.blocked-b.best.rank.blocked||b.best.rank.score-a.best.rank.score):0));
}
const api={canonical,parseVested,merge,match};root.QLADiscovery=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
