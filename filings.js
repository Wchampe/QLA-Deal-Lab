'use strict';
const crypto=require('node:crypto'),A=require('./filing-analysis'),Contacts=require('./filing-contacts'),Outreach=require('./outreach');
const DAY=86400000,FORMS=['8-K','10-Q','10-K','8-K/A','10-Q/A','10-K/A'];
const FOCUS={combined:'"strategic alternatives" OR "forbearance agreement" OR "held for sale" OR "substantial doubt"',early:'"forbearance" OR "covenant waiver" OR "liquidity constraints" OR "substantial doubt"',assets:'"held for sale" OR "divestiture" OR "non-core assets" OR "exit or disposal"'};
const iso=ms=>new Date(ms).toISOString().slice(0,10);
function cik(value){const s=String(value??'');if(!/^\d{1,10}$/.test(s)||Number(s)<1)throw Error('Use a valid SEC CIK number.');return s.padStart(10,'0');}
function criteria(body={},now=Date.now()){
 const end=String(body.asOf||iso(now));if(!/^\d{4}-\d{2}-\d{2}$/.test(end)||!Number.isFinite(Date.parse(end))||iso(Date.parse(end))!==end||end>iso(now))throw Error('Use a valid past or current filing date.');
 const limit=Number(body.limit??3),days=Number(body.days??90),offset=Number(body.offset??0);
 if(!Number.isInteger(limit)||limit<1||limit>10||![30,90,180].includes(days)||!Number.isInteger(offset)||offset<0||offset>9900)throw Error('Invalid filing scan size, period, or page.');
 const company=String(body.company||'').trim(),industry=String(body.industry||'').trim(),state=String(body.state||'').trim().toUpperCase(),focus=body.focus||'combined';
 if(company.length>100||industry.length>60||/[\x00-\x1f<>]/.test(company+industry)||!Object.hasOwn(FOCUS,focus)||state&&!/^[A-Z]{2}$/.test(state))throw Error('Check company, industry, state, or signal filters.');
 const excluded=[...new Set((Array.isArray(body.exclude)?body.exclude:[]).slice(0,500).map(cik))];
 return {company,industry,state,focus,limit,days,offset,asOf:end,start:iso(Date.parse(end)-(days-1)*DAY),ai:body.ai!==false,exclude:excluded};
}
function officialURL(value){
 const u=new URL(value);if(u.protocol!=='https:'||u.port||u.username||u.password||!['www.sec.gov','data.sec.gov','efts.sec.gov'].includes(u.hostname))throw Error('Only official SEC endpoints can be collected.');
 if(!(u.hostname==='efts.sec.gov'&&u.pathname==='/LATEST/search-index'||u.hostname==='data.sec.gov'&&/^\/(?:submissions\/CIK\d{10}\.json|api\/xbrl\/companyfacts\/CIK\d{10}\.json)$/.test(u.pathname)||u.hostname==='www.sec.gov'&&(/^\/Archives\/edgar\/data\/\d+\/\d{18}\/[A-Za-z0-9_.-]+$/.test(u.pathname)||u.pathname==='/files/company_tickers.json')))throw Error('Unsupported SEC record path.');
 return u.href;
}
function filingURL(company,accession,filename){if(!/^\d{10}-\d{2}-\d{6}$/.test(accession)||!/^[A-Za-z0-9_-][A-Za-z0-9_.-]*\.(?:htm|html|txt)$/i.test(filename))throw Error('Invalid official filing document identifier.');return officialURL(`https://www.sec.gov/Archives/edgar/data/${Number(cik(company))}/${accession.replaceAll('-','')}/${filename}`);}
function recentRows(raw){const f=raw.filings?.recent||{};return (f.accessionNumber||[]).map((accession,i)=>({accession,form:f.form?.[i],filed:f.filingDate?.[i],filename:f.primaryDocument?.[i],items:f.items?.[i]||''})).filter(x=>FORMS.includes(x.form)&&x.filed&&x.filename);}
function selectFilings(rows,seeds,asOf){
 const valid=rows.filter(r=>r.filed<=asOf&&r.filed>=iso(Date.parse(asOf)-365*DAY)).sort((a,b)=>b.filed.localeCompare(a.filed)),selected=[];
 const add=r=>{if(r&&!selected.some(x=>x.accession===r.accession))selected.push(r);};
 add(valid[0]);for(const id of seeds.slice(0,2))add(valid.find(r=>r.accession===id));
 add(valid.find(r=>/^10-Q/.test(r.form)));add(valid.find(r=>/^10-K/.test(r.form)));
 for(const r of valid.filter(r=>/1\.03|2\.04|2\.05|2\.01|1\.01/.test(r.items)))if(selected.length<6)add(r);
 for(const r of valid)if(selected.length<6)add(r);
 return selected.slice(0,6).sort((a,b)=>a.filed.localeCompare(b.filed));
}
function safeError(error){if(error?.secStatus)return `SEC returned HTTP ${error.secStatus}. ${[403,429].includes(error.secStatus)?'Access/rate limit: collection stopped; retry later and configure QLA_SEC_USER_AGENT with your organization/contact.':'The record could not be downloaded.'}`;return /abort|timeout/i.test(error?.name+' '+error?.message)?'Request timed out. Retry the collection later.':String(error?.message||'Collection failed').replace(/https?:\/\/\S+/g,'[upstream]').slice(0,400);}
function createService(deps={}){
 const getFetch=()=>deps.fetch||globalThis.fetch,now=deps.now||Date.now,sleep=deps.sleep||(ms=>new Promise(r=>setTimeout(r,ms)));
 const Ollama=require('./ollama-client'),ollama=deps.ollama||(deps.fetch||deps.model!==undefined?Ollama.createClient({fetch:deps.fetch,model:deps.model}):Ollama.client);
 const cache=new Map(),jobs=new Map();let cacheBytes=0,lastRequest=0,queue=Promise.resolve(),active=null,cooldownUntil=0;
 async function request(url,max=16000000,ttl=60*60000){
  url=officialURL(url);const hit=cache.get(url);if(hit&&now()-hit.at<ttl)return hit.text;
  const run=queue.then(async()=>{
   if(now()<cooldownUntil)throw Error('SEC access cooldown is active after a 403 or 429. Wait 15 minutes before retrying.');
   await sleep(Math.max(0,650-(now()-lastRequest)));lastRequest=now();
   let response;try{response=await getFetch()(url,{headers:{'User-Agent':process.env.QLA_SEC_USER_AGENT||'QLA-Deal-Lab/1.0 public filing research','Accept-Encoding':'gzip, deflate'},redirect:'error',signal:AbortSignal.timeout(30000)});}catch{throw Error('Official filing connection failed. Check network access.');}
   if(!response.ok){const e=Error('Official record unavailable');e.secStatus=response.status;if([403,429].includes(response.status))cooldownUntil=now()+15*60000;throw e;}
   const reader=response.body.getReader(),chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Error('Official document exceeds the collector size limit; open it manually.');}chunks.push(Buffer.from(value));}
   const text=Buffer.concat(chunks).toString('utf8');if(cache.has(url)){cacheBytes-=cache.get(url).bytes;cache.delete(url);}cache.set(url,{text,at:now(),bytes:size});cacheBytes+=size;
   while(cacheBytes>64000000||cache.size>120){const key=cache.keys().next().value;cacheBytes-=cache.get(key).bytes;cache.delete(key);}return text;
  });queue=run.catch(()=>{});return run;
 }
 const json=async(url,max,ttl)=>JSON.parse(await request(url,max,ttl));
 async function status(){const ai=await ollama.status();
  return {available:true,model:ai.model,aiReady:ai.ready,aiError:ai.error,contactConfigured:!!process.env.QLA_SEC_USER_AGENT,activeJob:active,cooldownUntil:cooldownUntil>now()?new Date(cooldownUntil).toISOString():null};
 }
 async function resolveCompany(value){if(/^\d{1,10}$/.test(value))return cik(value);
  const rows=Object.values(await json('https://www.sec.gov/files/company_tickers.json',6000000,DAY));const exact=rows.filter(r=>String(r.ticker).toLowerCase()===value.toLowerCase()||String(r.title).toLowerCase()===value.toLowerCase());
  const matches=exact.length?exact:rows.filter(r=>String(r.title).toLowerCase().includes(value.toLowerCase()));
  if(matches.length!==1)throw Error(matches.length?'Company name is ambiguous. Use its exact ticker or CIK.':'No SEC ticker/name match. Try a CIK. Most private businesses do not file these reports.');return cik(matches[0].cik_str);
 }
 async function discover(c){
  if(c.company)return {candidates:[{cik:await resolveCompany(c.company),seeds:[]}],nextOffset:null,hits:1,total:1,ambiguous:0,url:'https://www.sec.gov/edgar/search/'};
  // SEC full-text treats parentheses as search text. Repeat the optional phrase per OR clause.
  const q=FOCUS[c.focus].split(' OR ').map(term=>c.industry?JSON.stringify(c.industry)+' '+term:term).join(' OR '),params=new URLSearchParams({q,forms:'8-K,10-K,10-Q',dateRange:'custom',startdt:c.start,enddt:c.asOf,from:String(c.offset),size:'100'});
  const url='https://efts.sec.gov/LATEST/search-index?'+params,raw=await json(url,6000000,10*60000),hits=raw.hits?.hits;
  if(!Array.isArray(hits))throw Error('SEC filing-search format changed. No search results were treated as documents.');
  const total=Number(raw.hits.total?.value??hits.length),candidates=[],seen=new Set(c.exclude);let used=0,ambiguous=0;
  for(const hit of hits){const src=hit._source||{},ids=[...new Set(src.ciks||[])];
   if(ids.length!==1){ambiguous++;used++;continue;}let id;try{id=cik(ids[0]);}catch{used++;continue;}
   if(c.state&&!(src.biz_states||[]).includes(c.state)){used++;continue;}
   const existing=candidates.find(x=>x.cik===id);if(existing){existing.seeds.push(src.adsh);used++;continue;}
   if(seen.has(id)){used++;continue;}if(candidates.length>=c.limit)break;
   seen.add(id);candidates.push({cik:id,seeds:[src.adsh]});used++;
  }
  return {candidates,nextOffset:used&&c.offset+used<Math.min(total,10000)?c.offset+used:null,hits:hits.length,total,ambiguous,url};
 }
 async function collect(candidate,c,progress,{includeFinancials=true}={}){
  const raw=await json(`https://data.sec.gov/submissions/CIK${candidate.cik}.json`,6000000,15*60000);if(cik(raw.cik)!==candidate.cik)throw Error('SEC company identifier mismatch; records were not joined.');
  const company={cik:candidate.cik,name:String(raw.name||candidate.cik),tickers:raw.tickers||[],industry:String(raw.sicDescription||''),sic:String(raw.sic||''),location:[raw.addresses?.business?.city,raw.addresses?.business?.stateOrCountry].filter(Boolean).join(', '),website:Outreach.url(raw.website),investorWebsite:Outreach.url(raw.investorWebsite),phone:String(raw.phone||''),identityURL:`https://data.sec.gov/submissions/CIK${candidate.cik}.json`};
  if(raw.entityType&&raw.entityType!=='operating')return {skipped:true,company,reason:'Not identified as an operating issuer.'};
  const selected=selectFilings(recentRows(raw),candidate.seeds,c.asOf),docs=[],warnings=[],contacts=[];
  for(const row of selected){progress('Downloading '+company.name+' — '+row.form+' '+row.filed);try{
   const url=filingURL(candidate.cik,row.accession,row.filename),html=await request(url),doc=A.document({...row,id:'d'+(docs.length+1),url},html);docs.push(doc);contacts.push(...Contacts.extract(company,doc,html));
   // Actual filed exhibits, same issuer/accession only. No external links are followed.
   if(/^8-K/.test(row.form)){
    const base=new URL(url),links=[...html.matchAll(/href\s*=\s*["']([^"'#]+)["']/gi)].flatMap(m=>{try{const u=new URL(m[1],base);if(u.origin!==base.origin||u.pathname.slice(0,u.pathname.lastIndexOf('/'))!==base.pathname.slice(0,base.pathname.lastIndexOf('/')))return [];const file=u.pathname.split('/').at(-1);return /(?:ex(?:hibit)?[-_]?99|ex99|99[12]|press)/i.test(file)&&/\.html?$/i.test(file)?[u.href]:[];}catch{return [];}});
    for(const exhibit of [...new Set(links)].slice(0,1)){try{const html=await request(exhibit),doc=A.document({...row,id:'d'+(docs.length+1),form:row.form+' exhibit',url:exhibit},html);docs.push(doc);contacts.push(...Contacts.extract(company,doc,html));}catch(e){if([403,429].includes(e.secStatus))throw e;warnings.push('Exhibit: '+safeError(e));}}
   }
  }catch(e){if([403,429].includes(e.secStatus))throw e;warnings.push(row.form+' '+row.filed+': '+safeError(e));}}
  if(!docs.length)throw Error('No readable 8-K, 10-Q, or 10-K documents were collected in the one-year window. '+warnings.join(' '));
  let finance=[];if(includeFinancials)try{progress('Collecting reported financials for '+company.name);const facts=await json(`https://data.sec.gov/api/xbrl/companyfacts/CIK${candidate.cik}.json`,24000000);if(cik(facts.cik)!==candidate.cik)throw Error('Financial-data company identifier mismatch.');finance=A.financials(facts,candidate.cik,c.asOf);}catch(e){if([403,429].includes(e.secStatus))throw e;warnings.push('Financial facts: '+safeError(e));}
  const context=A.contextFor(company,docs);
  return {company,context,contacts:Contacts.merge(contacts),financials:finance,warnings,coverage:{asOf:c.asOf,lookbackStart:iso(Date.parse(c.asOf)-365*DAY),selectedFilings:selected.length,downloadedFilings:new Set(docs.map(x=>x.accession)).size,downloadedDocuments:docs.length,analyzedPassages:context.passages.length,method:'Up to six recent filings, including the discovery match, latest report, annual/quarterly reports and material-event filings; up to one relevant linked exhibit per 8-K. Topic-selected excerpts go to AI. This is not a complete filing history.'}};
 }
 async function contacts(body){
  const id=cik(body.cik),c=criteria({company:id,ai:false,asOf:iso(now())},now());
  const result=await collect({cik:id,seeds:[]},c,()=>{},{includeFinancials:false});
  if(result.skipped)throw Error(result.reason);
  return {company:result.company,contacts:result.contacts,checkedAt:new Date(now()).toISOString(),warnings:result.warnings,documentsChecked:result.coverage.downloadedDocuments};
 }
 async function analyze(context,progress=()=>{}){const selectedModel=await ollama.requireModel();
  let r;try{r=await getFetch()('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:selectedModel,stream:true,think:false,keep_alive:'10m',format:A.schema,options:{num_ctx:8192,num_predict:Ollama.predictionLimit(selectedModel,1800),num_gpu:-1,temperature:0},messages:A.prompt(context)}),signal:AbortSignal.timeout(900000)});}catch{throw Error('Local AI was unreachable or timed out. Start Ollama with the configured model, then reanalyze.');}
  if(!r.ok)throw Error('Local AI returned HTTP '+r.status+'. Check the configured model and available memory.');
  let output='';if(r.headers.get('content-type')?.includes('ndjson')){
   const decoder=new TextDecoder();let pending='',done=false,bytes=0,generated=0;const accept=line=>{if(!line.trim())return;const item=JSON.parse(line);if(item.error)throw Error('Local AI generation failed. Collected documents are retained.');output+=item.message?.content||'';generated+=(item.message?.content||'').length+(item.message?.thinking||'').length;if(item.done)done=true;progress(generated);};
   for await(const chunk of r.body){bytes+=chunk.length;if(bytes>2000000)throw Error('Local AI response exceeded its limit.');pending+=decoder.decode(chunk,{stream:true});const lines=pending.split('\n');pending=lines.pop();for(const line of lines)accept(line);}
   pending+=decoder.decode();if(pending.trim())accept(pending);if(!done)throw Error('Local AI stream ended before analysis finished. Collected documents are retained.');
  }else{const raw=await r.json();output=raw.message?.content||'';}
  let parsed;try{parsed=JSON.parse(output);}catch{throw Error('Local AI did not return complete structured JSON. Collected documents are retained.');}
  return A.validateAnalysis(parsed,context,selectedModel,new Date(now()).toISOString());
 }
 function getJob(id){const job=jobs.get(id);if(!job)throw Error('Filing job expired or server restarted. Start a new scan; saved browser dossiers remain.');const {criteria:ignored,...publicJob}=job;return structuredClone(publicJob);}
 function start(body){if(active)throw Error('A filing scan is already running. Open its progress before starting another.');const c=criteria(body,now()),id=crypto.randomUUID(),job={id,criteria:c,status:'running',stage:'Finding matching SEC filings',startedAt:new Date(now()).toISOString(),results:[],errors:[],processed:0,totalCompanies:0,nextOffset:c.offset,discovery:null};
  while(jobs.size>=5)jobs.delete(jobs.keys().next().value);jobs.set(id,job);active=id;
  // Background job survives navigation. Results become available one company at a time.
  Promise.resolve().then(async()=>{try{
   const found=await discover(c);job.discovery={...found,candidates:undefined};job.nextOffset=found.nextOffset;job.totalCompanies=found.candidates.length;
   for(const candidate of found.candidates){try{
    const result=await collect(candidate,c,stage=>{job.stage=stage;});
    if(result.skipped){job.errors.push({cik:candidate.cik,error:result.reason});continue;}
    job.stage='Connecting '+result.company.name+' filings with local AI';
    const dossier={id:'sec-'+candidate.cik,company:result.company,contacts:result.contacts,documents:result.context.documents,passages:result.context.passages,analysis:{...A.unavailable(c.ai?'Local AI is analyzing these collected filings.':'AI analysis was switched off for this scan.'),status:c.ai?'analyzing':'unreviewed'},analysisPending:c.ai,revision:1,financials:result.financials,coverage:result.coverage,warnings:result.warnings,collectedAt:new Date(now()).toISOString()};
    job.results.push(dossier); // Publish documents immediately, before a potentially slow local-model call.
    if(c.ai){try{dossier.analysis=await analyze(result.context,count=>{job.stage='Analyzing '+result.company.name+' — '+count.toLocaleString()+' response characters generated';});}catch(e){dossier.analysis=A.unavailable(safeError(e));}finally{dossier.analysisPending=false;dossier.revision++;}}
   }catch(e){job.errors.push({cik:candidate.cik,error:safeError(e)});if([403,429].includes(e.secStatus))throw e;}finally{job.processed++;}}
   job.status=job.errors.length?'partial':'complete';if(job.errors.length)job.nextOffset=c.offset;job.stage=job.results.length?'Filing collection finished':'No company dossiers collected in this page; inspect coverage and errors.';
  }catch(e){job.status='failed';job.stage=safeError(e);job.nextOffset=c.offset;}finally{job.finishedAt=new Date(now()).toISOString();active=null;}});
  return {id,status:job.status};
 }
 return {start,getJob,status,discover,collect,analyze,request,contacts};
}
module.exports={createService,criteria,officialURL,filingURL,recentRows,selectFilings,cik};
