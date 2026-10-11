(function(root){
'use strict';
const version='seller-evidence-v1';
const signals=[
 {id:'intent',name:'Explicit interest in a sale or transition',points:30,question:'Would you consider a confidential acquisition discussion?',alternative:'An exploratory comment may never become a transaction.',pattern:/open to (?:selling|a sale)|seeking (?:a buyer|buyers)|considering (?:a sale|selling)|exploring strategic alternatives/i},
 {id:'succession',name:'Succession or owner transition',points:25,question:'Is there a succession plan, and what timing would work for you?',alternative:'A family member or management team may already be taking over.',pattern:/succession|seeking a successor|owner.{0,40}retir|founder.{0,40}step(?:s|ping)? down/i},
 {id:'divestiture',name:'Business asset disposal or divestiture',points:20,question:'Which assets or operations would you consider transferring?',alternative:'Disposing of surplus assets can be routine maintenance.',pattern:/divest(?:iture|ing|ment)|selling (?:its|their) (?:assets|division)|asset (?:disposal|sale)|equipment auction/i},
 {id:'operations',name:'Facility, lease, workforce, or operating change',points:8,question:'Are the operating changes affecting your long-term ownership plans?',alternative:'A move, lease change, or smaller workforce may improve operations.',pattern:/plant clos|facility clos|lease expir|layoff|laying off|consolidat(?:e|ing|ion)|relocat(?:e|ing|ion)/i},
 {id:'capital',name:'Company financing pressure or debt event',points:7,question:'Would additional capital or an ownership transition help the business?',alternative:'Refinancing and security filings are often normal financing activity.',pattern:/covenant breach|loan default|going concern|liquidity shortfall|debt maturit|refinanc/i},
 {id:'restructuring',name:'Business restructuring or receivership',points:10,question:'Who is authorized to discuss a transaction, and is there a sale process?',alternative:'Restructuring may preserve current ownership; transaction authority matters.',pattern:/receivership|appointed.{0,20}receiver|chapter 11|restructur/i},
 {id:'stability',name:'Counterevidence: expansion or new funding',points:-15,question:'Has the expansion or new financing resolved the earlier issue?',alternative:'Growth can also create new capital needs.',pattern:/new facility|expan(?:sion|ding)|secured.{0,25}financing|new contract|growth investment/i},
 {id:'successor',name:'Counterevidence: succession already arranged',points:-25,question:'Has the ownership transition already been completed?',alternative:'An arranged succession may still change.',pattern:/succession (?:complete|completed)|successor (?:appointed|named)|transferred.{0,25}(?:family|employees)/i},
 {id:'declined',name:'Counterevidence: owner says no sale',points:-35,question:'Respect the stated preference and any contact restrictions.',alternative:'Keep the date of the statement.',pattern:/not (?:for sale|interested in selling)|no plans to sell/i},
 {id:'neutral',name:'Background only / needs interpretation',points:0,question:'What current business event does this source actually establish?',alternative:'Company age, a UCC filing, or an insider trade alone does not establish seller interest.',pattern:null}
];
const outcomes=['No answer','Not interested','Maybe later','Interested','Financials received','Do not contact'];
const blockedDomains=['bizbuysell.com','bizquest.com','businessesforsale.com','vestedbb.com','tworld.com','sunbeltnetwork.com','murphybusiness.com','dealstream.com','flippa.com','acquire.com'];
const resources=[
 {name:'SEC company filings / financial statements',url:'https://www.sec.gov/search-filings',use:'Company financing, restructuring, asset disposals, and reported financials. Coverage is mostly reporting companies.'},
 {name:'Illinois WARN employer notices',url:'https://www.illinoisworknet.com/warndashboard',use:'Employer-reported layoffs and facility closures. Limited coverage; use the equivalent official source in your state.'},
 {name:'Illinois business UCC index',url:'https://apps.ilsos.gov/uccsearch/',use:'Business debtor identity and recorded secured financing. A routine financing statement receives zero intent points.'},
 {name:'Federal court records',url:'https://pacer.uscourts.gov/',use:'Business receiverships, restructuring, and sale proceedings. Account access may be needed.'},
 {name:'USAspending',url:'https://www.usaspending.gov/',use:'Match the legal recipient before comparing award history. Award amounts are not revenue or cash flow.'}
];
const text=(s,max=4000)=>String(s??'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,max);
const norm=s=>text(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function url(s){try{const u=new URL(s);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)return '';u.hash='';for(const k of [...u.searchParams.keys()])if(/^utm_|^(gclid|fbclid)$/i.test(k))u.searchParams.delete(k);u.searchParams.sort();return u.href.replace(/\/$/,'');}catch{return '';}}
function host(s){try{return new URL(s).hostname.toLowerCase().replace(/^www\./,'');}catch{return '';}}
function marketplace(s){const h=host(s);return blockedDomains.some(d=>h===d||h.endsWith('.'+d));}
function criteria(raw={}){const take=(k,max,fallback='')=>{const v=text(raw[k],max+1).replace(/["<>]/g,'');if(v.length>max)throw Error(k+' is too long.');return v||fallback;};return {industry:take('industry',65,'business services'),location:take('location',65,'United States'),company:take('company',120)};}
function queries(raw={}){
 const c=criteria(raw),base=c.company?'"'+c.company+'" '+c.location:c.industry+' '+c.location;
 const lanes=c.company?[
  ['Ownership and succession','(succession OR retirement OR "strategic alternatives")'],
  ['Operations and assets','(relocation OR "lease expiration" OR layoffs OR "asset sale")'],
  ['Company financing','(refinancing OR receivership OR "going concern")'],
  ['Counterevidence and current activity','(expansion OR "new financing" OR successor OR "not for sale")']
 ]:[
  ['Ownership and succession','company (succession OR "owner retiring" OR "seeking successor")'],
  ['Operations and assets','company ("plant closure" OR "lease expiration" OR "asset disposal")'],
  ['Company financing','company (restructuring OR receivership OR refinancing)'],
  ['Company profiles','("family owned" OR "founder owned") company contact']
 ];
 const exclude=' -site:bizbuysell.com -site:bizquest.com -site:businessesforsale.com';
 return lanes.map(([lane,terms])=>{const query=base+' '+terms+exclude;if(query.length>400||query.split(/\s+/).length>50)throw Error('Shorten the company, industry, or geography for this search.');return {lane,query};});
}
function suggestions(s){return signals.filter(x=>x.pattern?.test(s)).map(x=>x.id);}
function normalize(results,lane,query,at=new Date().toISOString()){
 return results.flatMap(r=>{const sourceURL=url(r.url);if(!sourceURL||marketplace(sourceURL))return [];const title=text(r.title,240),snippet=text(r.description??r.snippet);return [{url:sourceURL,title:title||host(sourceURL),snippet,lane,query,observedAt:at,suggestedSignals:suggestions(title+' '+snippet),provider:'brave',review:'Pending',quality:'Search excerpt',eventDate:''}];});
}
// Refreshes preserve the first observation and manual review; a changed excerpt requires a new review.
function mergeRecords(existing,incoming){const map=new Map(existing.map(r=>[url(r.url),{...r}]));for(const r of incoming){const key=url(r.url);if(!key)continue;const old=map.get(key);map.set(key,old?{...old,lastObservedAt:r.observedAt,...(old.snippet!==r.snippet?{latestSnippet:r.snippet,changed:true}:{}),queries:[...new Set([...(old.queries||[old.query]),r.query].filter(Boolean))]}:{...r,url:key});}return [...map.values()];}
function matchHint(entity,record){const body=norm(record.title+' '+record.snippet),name=norm(entity.name).replace(/\b(?:inc|llc|ltd|corp)\b/g,'').trim();const website=host(entity.website);if(website&&host(record.url)===website)return 'Company website matches; confirm the event concerns this business.';if(name.length>=4&&(' '+body+' ').includes(' '+name+' '))return 'Company name appears; confirm the location and legal entity.';return 'Identity needs checking; this may be a different business.';}
function newEntity(raw,id){const name=text(raw.name,120),location=text(raw.location,65);if(!name||!location)throw Error('Enter the company name and geography to keep similarly named businesses separate.');const website=url(raw.website);if(raw.website&&!website)throw Error('Use a valid company website or leave it blank.');return {id,name,location,industry:text(raw.industry,65),website,createdAt:new Date().toISOString(),history:[]};}
function entityKey(e){return norm(e.name)+'|'+norm(e.location);}
function attach(entity,record,id){return {...record,id,entityId:entity.id,review:'Pending',quality:'Search excerpt',signalType:'neutral',eventDate:'',eventKey:'',fact:'',matchHint:matchHint(entity,record)};}
function freshness(day,now){if(!day)return {factor:.25,label:'Event date unknown'};const stamp=Date.parse(day);if(!Number.isFinite(stamp)||stamp>now)return {factor:0,label:'Invalid or future event date'};const age=(now-stamp)/86400000;return {factor:age<=90?1:age<=365?.6:.2,label:age<=90?'Within 90 days':age<=365?'Within one year':'Older than one year'};}
function reviewEvidence(previous,raw,now=Date.now()){
 if(!signals.some(s=>s.id===raw.signalType))throw Error('Select an evidence category.');
 if(!['Pending','Confirmed same business','Unrelated'].includes(raw.review))throw Error('Invalid business match.');
 if(!['Search excerpt','Original source reviewed','Independent report reviewed'].includes(raw.quality))throw Error('Invalid source review.');
 if(raw.eventDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(raw.eventDate)||new Date(raw.eventDate).toISOString().slice(0,10)!==raw.eventDate||Date.parse(raw.eventDate)>now))throw Error('Use the actual past event date, or leave it unknown.');
 const fact=text(raw.fact);if(raw.review==='Confirmed same business'&&raw.quality!=='Search excerpt'&&!fact)throw Error('Confirm or correct the collected excerpt before counting this evidence.');
 return {...previous,snippet:previous.latestSnippet??previous.snippet,latestSnippet:undefined,review:raw.review,quality:raw.quality,signalType:raw.signalType,eventDate:raw.eventDate||'',fact,eventKey:text(raw.eventKey,180),changed:false,reviewedAt:new Date(now).toISOString()};
}
function assess(entity,records,now=Date.now()){
 const all=records.filter(r=>r.entityId===entity.id),eligible=all.filter(r=>r.review==='Confirmed same business'&&r.quality!=='Search excerpt'&&r.fact&&url(r.url)&&!r.changed);
 const parts=[],seen=new Set(),byCategory=new Map(),duplicateIds=[];
 // An event is one fact even when it is copied to many sites. Categories are also capped at one contribution.
 for(const e of eligible){const s=signals.find(x=>x.id===e.signalType)||signals.at(-1),fresh=freshness(e.eventDate,now),quality=e.quality==='Original source reviewed'?1:.8;
  const eventKey=norm(e.eventKey)||norm(e.fact),weight=s.points*fresh.factor*quality;
  const existing=byCategory.get(s.id);if(existing&&Math.abs(existing.raw)>=Math.abs(weight))continue;
  byCategory.set(s.id,{id:e.id,type:s.id,name:s.name,raw:weight,points:Math.round(weight),fact:e.fact,url:e.url,freshness:fresh.label,alternative:s.alternative,question:s.question,eventKey});
 }
 for(const part of [...byCategory.values()].sort((a,b)=>Math.abs(b.raw)-Math.abs(a.raw))){if(seen.has(part.eventKey)){duplicateIds.push(part.id);continue;}seen.add(part.eventKey);parts.push(part);}
 const positive=parts.filter(p=>p.points>0),counter=parts.filter(p=>p.points<0),score=Math.max(0,Math.min(100,Math.round(parts.reduce((sum,p)=>sum+p.raw,0))));
 const pending=all.filter(r=>r.review!=='Unrelated'&&(!eligible.includes(r))).length;
 const risk=eligible.some(r=>['capital','restructuring','operations'].includes(r.signalType));
 const history=entity.history||[],last=history.at(-1),suppressed=history.some(h=>h.kind==='Do not contact');
 const unanswered=last?.kind==='Not interested';
 const status=suppressed?'Do not contact':unanswered?'Owner declined':positive.length===0?'Needs evidence':score>=45&&positive.length>=2?'Priority research':score>=20?'Worth exploring':'Limited evidence';
 const missing=[];if(pending)missing.push(pending+' source(s) still need identity or evidence review.');if(!positive.length)missing.push('No current reviewed evidence supporting a transition.');
 if(!eligible.some(r=>r.signalType==='intent'))missing.push('Owner interest and timing are unconfirmed.');
 if(!entity.website)missing.push('Confirm the official business website and public contact.');
 if(eligible.some(r=>!r.eventDate))missing.push('Some event dates are unknown; retrieval dates do not refresh old events.');
 return {version,score,status,parts,positive,counter,pending,risk,suppressed,eligibleCount:eligible.length,sourceCount:new Set(eligible.map(r=>host(r.url))).size,missing,duplicateIds,
  summary:positive.length?positive.map(p=>p.name+' ('+p.points+' points)').join(' + ')+(counter.length?'; reduced by '+counter.map(p=>p.name).join(', '):''):'Collect and review business evidence before prioritizing this company.',
  probability:null};
}
function recordOutcome(entity,kind,note,evidence,now=Date.now()){
 if(!outcomes.includes(kind))throw Error('Invalid outcome.');if((entity.history||[]).some(h=>h.kind==='Do not contact'))throw Error('This business is marked Do not contact.');
 const result=assess(entity,evidence,now);return {...entity,history:[...(entity.history||[]),{kind,note:text(note),at:new Date(now).toISOString(),modelVersion:version,scoreBeforeOutcome:result.score,evidenceSnapshot:result.parts.map(p=>({id:p.id,type:p.type,points:p.points})),label:kind==='Interested'||kind==='Financials received'?1:kind==='Not interested'?0:null}]};
}
function callBrief(entity,records){const a=assess(entity,records);if(a.suppressed)throw Error('This business is marked Do not contact.');return `Hello, my name is [your name]. I am interested in acquiring and operating a ${entity.industry||'business'} in ${entity.location}. Are you the right person for a confidential ownership-transition discussion? Is a sale or transition something you have considered now or in the future? If not, thank you for your time.\n\nPrivate preparation for ${entity.name}:\n${a.summary}\n\nQuestions to explore:\n${[...new Set(a.positive.map(p=>p.question))].join('\n')||'Ask about long-term ownership plans.'}\n\nConfirm who owns the business, decision authority, timing, transition support, and financial information available after interest and the NDA process.`;}
function financeRange(raw){const n=(key,min=0)=>{if(raw[key]===''||raw[key]==null)throw Error('Enter '+key+' or wait for financial information.');const v=Number(raw[key]);if(!Number.isFinite(v)||v<min)throw Error('Invalid '+key);return v;};const revenueLow=n('revenueLow'),revenueHigh=n('revenueHigh'),marginLow=n('marginLow'),marginHigh=n('marginHigh'),multipleLow=n('multipleLow'),multipleHigh=n('multipleHigh'),netDebt=n('netDebt');
 if(revenueHigh<revenueLow||marginHigh<marginLow||multipleHigh<multipleLow||marginHigh>100||multipleHigh>30)throw Error('Check the low/high ranges, margin (0–100%), and multiple (0–30).');
 if(!text(raw.basis))throw Error('State where these financial assumptions came from.');
 const earningsLow=revenueLow*marginLow/100,earningsHigh=revenueHigh*marginHigh/100;
 return {revenueLow,revenueHigh,marginLow,marginHigh,multipleLow,multipleHigh,netDebt,basis:text(raw.basis),earningsLow,earningsHigh,enterpriseLow:earningsLow*multipleLow,enterpriseHigh:earningsHigh*multipleHigh,equityLow:earningsLow*multipleLow-netDebt,equityHigh:earningsHigh*multipleHigh-netDebt};
}
const api={version,signals,outcomes,resources,criteria,queries,url,host,marketplace,normalize,mergeRecords,matchHint,newEntity,entityKey,attach,reviewEvidence,assess,recordOutcome,callBrief,financeRange};root.QLAIntelligence=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
