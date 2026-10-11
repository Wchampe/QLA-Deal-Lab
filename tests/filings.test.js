'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),F=require('../filings'),A=require('../filing-analysis'),fx=require('./filings-fixtures');
const now=()=>Date.parse('2026-09-18T12:00:00Z'),sleep=async()=>{};
async function finished(service,id){for(let n=0;n<100;n++){const job=service.getJob(id);if(job.status!=='running')return job;await new Promise(r=>setImmediate(r));}throw Error('Fixture job did not finish');}
function context(){return A.contextFor({cik:fx.company,name:'Synthetic'},[A.document({id:'d1',accession:fx.a1,filed:'2026-08-01',form:'10-Q',url:F.filingURL(fx.company,fx.a1,'quarter.htm')},'<p>'+fx.sentences.debt+' The arrangement expires on December 31.</p>'),A.document({id:'d2',accession:fx.a2,filed:'2026-09-12',form:'8-K',url:F.filingURL(fx.company,fx.a2,'event.htm')},'<p>'+fx.sentences.sale+'</p>')]);}
test('blank company discovers filings; inputs and document paths are bounded',()=>{
 assert.equal(F.criteria({},now()).company,'');for(const body of [{limit:100},{offset:-1},{days:360},{asOf:'2026-02-30'},{asOf:'2027-01-01'},{state:'Illinois'},{focus:'constructor'}])assert.throws(()=>F.criteria(body,now()));
 for(const u of ['https://example.com/file','http://data.sec.gov/submissions/CIK0000000001.json','https://www.sec.gov/private','https://data.sec.gov:444/submissions/CIK0000000001.json'])assert.throws(()=>F.officialURL(u));
 for(const name of ['../secret.htm','https://evil.example/file.htm','a.htm?redirect=x'])assert.throws(()=>F.filingURL(1,fx.a1,name));
 assert.match(F.filingURL(1,fx.a1,'quarter.htm'),/\/data\/1\/000000000126000001\/quarter.htm$/);
});
test('primary text extraction removes hidden instructions and keeps readable facts',()=>{
 const text=A.textFromHTML('<script>bad()</script><style>bad</style><ix:hidden>hidden</ix:hidden><p>Cash&nbsp;&amp; debt &#36;10</p><div>Next sentence.</div>');assert.equal(text,'Cash & debt $10 Next sentence.');
 const c=context();assert.equal(new Set(c.passages.map(p=>p.accession)).size,2);assert.match(c.documents[0].sha256,/^[a-f0-9]{64}$/);assert.match(A.prompt(c)[0].content,/untrusted data/);
});
test('passage selection favors issuer disclosures over early generic risk text',()=>{const d={id:'d1',text:'Forward-looking statements about going concern may adversely affect us. '+'Unrelated text. '.repeat(100)+'We have concluded there is substantial doubt about our ability to continue as a going concern. Our cash and cash equivalents are $10 million.'};const p=A.passages(d);assert.match(p[0].text,/cash and cash equivalents/);});
test('filing selection includes latest counterevidence and source match without future filings',()=>{
 const rows=[...F.recentRows(fx.submissions),{accession:'0000000001-26-000009',form:'8-K',filed:'2026-10-01',filename:'future.htm'},{accession:'0000000001-26-000008',form:'8-K',filed:'2026-09-17',filename:'latest.htm'}];
 const selected=F.selectFilings(rows,[fx.a1],'2026-09-18');assert.ok(selected.some(x=>x.filename==='latest.htm'));assert.ok(selected.some(x=>x.accession===fx.a1));assert.ok(!selected.some(x=>x.filename==='future.htm'));
});
test('financial facts retain period and provenance, never substitute quarterly revenue for annual',()=>{
 const facts=A.financials(fx.facts,fx.company,'2026-09-18');assert.equal(facts.find(x=>x.label==='Annual revenue').value,12000000);assert.equal(facts.find(x=>x.label==='Cash and cash equivalents').end,'2026-06-30');assert.ok(facts.every(x=>x.url.startsWith('https://www.sec.gov/Archives/')));
 assert.deepEqual(A.financials(fx.facts,fx.company,'2025-12-31'),[]);assert.equal(A.financials({},fx.company,'2026-09-18').length,0);
});
test('analysis checks exact quotes and cross-accession links, does not report sale probabilities',()=>{
 const c=context(),raw=fx.aiReply(c),a=A.validateAnalysis(raw,c,'fixture');assert.equal(a.status,'announced_process');assert.equal(a.connections.length,1);assert.equal(a.probability,null);
 raw.findings[1].quote='Fabricated wording absent from the actual downloaded filing.';const bad=A.validateAnalysis(raw,c,'fixture');assert.equal(bad.status,'insufficient_evidence');assert.equal(bad.connections.length,0);assert.ok(bad.warnings.length);
});
test('one filing plus its exhibit and boilerplate cannot produce an early lead',()=>{
 const c=context(),raw=fx.aiReply(c);raw.status='possible_unannounced';const good=A.validateAnalysis(raw,c,'fixture');assert.equal(good.status,'possible_unannounced');
 c.passages.forEach(p=>p.accession=fx.a1);assert.equal(A.validateAnalysis(raw,c,'fixture').status,'insufficient_evidence');
 const fresh=context(),r=fx.aiReply(fresh);r.status='possible_unannounced';r.findings[0].specificity='boilerplate';assert.equal(A.validateAnalysis(r,fresh,'fixture').status,'insufficient_evidence');
});
test('end-to-end collector fetches actual document bodies and company financials before AI',async()=>{
 const calls=[],service=F.createService({fetch:fx.fixtureFetch({calls}),model:'fixture-model',now,sleep}),start=service.start({limit:3});assert.throws(()=>service.start({}),/already running/);const job=await finished(service,start.id);
 assert.equal(job.status,'complete');assert.equal(job.results.length,1);const r=job.results[0];assert.equal(r.company.cik,fx.company);assert.equal(r.coverage.downloadedFilings,2);assert.equal(r.analysis.connections.length,1);assert.equal(r.analysis.engine,'local-ai');assert.equal(r.financials.length,2);assert.equal(job.discovery.ambiguous,1);
 const search=calls.find(x=>x.url.includes('efts.sec.gov')),q=new URL(search.url).searchParams.get('q');assert.ok(!q.includes('('));assert.ok(!calls.some(x=>/brave|bizbuysell/.test(x.url)));
 const ai=calls.find(x=>x.url.endsWith('/api/chat')),request=JSON.parse(ai.opts.body);assert.deepEqual(request.format,A.schema);assert.ok(request.messages[1].content.includes(fx.sentences.debt));assert.equal(request.think,false);
 const again=service.start({company:'SYNTHETIC',ai:false});const refreshed=await finished(service,again.id);assert.equal(refreshed.results[0].analysis.engine,'extraction-only');assert.equal(calls.filter(x=>x.url.endsWith('/quarter.htm')).length,1,'cached documents should not be re-downloaded');
});
test('discovery cursor does not skip unseen companies when a batch fills',async()=>{
 const hits=[1,1,2,3].map(i=>({_source:{ciks:[String(i)],adsh:fx.a1,biz_states:['IL']}})),fetch=async()=>new Response(JSON.stringify({hits:{total:{value:4},hits}})),s=F.createService({fetch,now,sleep});
 const r=await s.discover(F.criteria({limit:1},now()));assert.equal(r.candidates.length,1);assert.equal(r.nextOffset,2);assert.equal(r.candidates[0].seeds.length,2);
});
test('AI failure preserves documents but never fabricates a seller finding',async()=>{
 const service=F.createService({fetch:fx.fixtureFetch({offline:true}),model:'fixture-model',now,sleep}),job=await finished(service,service.start({limit:1}).id);assert.equal(job.results.length,1);assert.equal(job.results[0].analysis.status,'unreviewed');assert.ok(job.results[0].passages.length);assert.equal((await service.status()).aiReady,false);
});
test('mismatched company identifiers cannot be joined',async()=>{
 const service=F.createService({fetch:fx.fixtureFetch({badIdentity:true}),model:'fixture-model',now,sleep}),job=await finished(service,service.start({}).id);assert.equal(job.results.length,0);assert.equal(job.status,'partial');assert.match(job.errors[0].error,/identifier mismatch/);assert.equal(job.nextOffset,0);
});
test('SEC blocks stop collection and trigger cooldown without retries or alternate hosts',async()=>{
 const calls=[],service=F.createService({fetch:fx.fixtureFetch({secStatus:403,calls}),model:'fixture-model',now,sleep});const first=await finished(service,service.start({}).id);assert.equal(first.status,'failed');assert.match(first.stage,/HTTP 403/);assert.equal(calls.length,1);
 const next=await finished(service,service.start({}).id);assert.equal(next.status,'failed');assert.match(next.stage,/cooldown/);assert.equal(calls.length,1);
});
test('streamed local AI output is reconstructed and validated with visible progress',async()=>{
 const base=fx.fixtureFetch(),progress=[],fetch=async(url,opts)=>{const r=await base(url,opts);if(!url.endsWith('/api/chat'))return r;const raw=await r.json(),output=raw.message.content;return new Response(JSON.stringify({message:{content:output.slice(0,100)},done:false})+'\n'+JSON.stringify({message:{content:output.slice(100)},done:true})+'\n',{headers:{'Content-Type':'application/x-ndjson'}});};
 const service=F.createService({fetch,model:'fixture-model',now,sleep}),analysis=await service.analyze(context(),n=>progress.push(n));assert.equal(analysis.engine,'local-ai');assert.equal(analysis.connections.length,1);assert.equal(progress.length,2);assert.ok(progress[1]>progress[0]);
});

test('DeepSeek reasoning advances progress while only the final answer becomes a dossier',async()=>{
 const base=fx.fixtureFetch(),progress=[];let outputLength=0;
 const fetch=async(url,opts)=>{
  if(url.endsWith('/api/tags'))return Response.json({models:[{name:'deepseek-r1:14b'}]});
  const request=JSON.parse(opts.body);assert.equal(request.model,'deepseek-r1:14b');assert.ok(request.options.num_predict>=4096,'reasoning needs room before the answer');
  const raw=await(await base(url,opts)).json(),output=raw.message.content;outputLength=output.length;
  return new Response(JSON.stringify({message:{thinking:'Fixture reasoning'},done:false})+'\n'+JSON.stringify({message:{content:output},done:true})+'\n',{headers:{'Content-Type':'application/x-ndjson'}});
 };
 const service=F.createService({fetch,model:'deepseek-r1:14b',now,sleep}),analysis=await service.analyze(context(),n=>progress.push(n));
 assert.equal(analysis.model,'deepseek-r1:14b');assert.equal(analysis.engine,'local-ai');assert.equal(analysis.connections.length,1);assert.ok(progress[0]>0);assert.ok(progress.at(-1)>outputLength);assert.ok(!JSON.stringify(analysis).includes('Fixture reasoning'));
});
test('financial concept changes prefer the newest annual period rather than an obsolete tag',()=>{const data=structuredClone(fx.facts);data.facts['us-gaap'].RevenueFromContractWithCustomerExcludingAssessedTax={units:{USD:[{start:'2023-01-01',end:'2023-12-31',filed:'2024-02-14',form:'10-K',accn:fx.a1,val:1}]}};const value=A.financials(data,fx.company,'2026-09-18').find(x=>x.label==='Annual revenue');assert.equal(value.end,'2025-12-31');assert.equal(value.value,12000000);});
