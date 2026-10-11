'use strict';
// Self-contained browser integration: isolated profile, isolated HTTP origin, synthetic search responses.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),{createServer}=require('../server'),I=require('../intelligence');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let n=0;n<80;n++){if(await fn())return;await pause(100);}throw Error('Browser check timed out');}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qla-intelligence-browser-')),server=createServer(),serve=server.listeners('request')[0];let chrome,ws,debugPort,port,sequence=0,batches=0,connected=true;const pending=new Map(),exceptions=[];
 const fixtures=I.normalize([{title:'Synthetic Tools succession announcement',url:'https://synthetic-tools.example/about',description:'Synthetic Tools LLC is seeking a successor in Illinois.'},{title:'Synthetic Tools facility update',url:'https://synthetic-news.example/news',description:'Synthetic Tools LLC announced an asset disposal in Illinois.'}],'Ownership and succession','Synthetic fixture');
 server.removeAllListeners('request');server.on('request',async(req,res)=>{
  const send=data=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
  if(req.url==='/api/health')return send({brave_configured:connected,intelligence_available:true});
  if(req.url==='/api/intelligence'){let body='';for await(const chunk of req)body+=chunk;const c=JSON.parse(body);batches++;return send({records:fixtures,runs:I.queries(c).map(q=>({...q,ok:true,count:2})),nextOffset:c.offset<9?c.offset+1:null});}
  req.headers.host='127.0.0.1:8765';if(req.headers.origin===`http://127.0.0.1:${port}`)req.headers.origin='http://127.0.0.1:8765';serve(req,res);
 });
 const call=(method,params={})=>new Promise((ok,no)=>{const id=++sequence;pending.set(id,{ok,no});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));port=server.address().port;
  const executable=process.env.QLA_TEST_BROWSER||['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(p=>fs.existsSync(p));if(!executable)throw Error('Chrome or Edge is needed for this browser test.');
  chrome=spawn(executable,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});chrome.on('error',e=>exceptions.push(e.message));
  await until(()=>{try{debugPort=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0].trim();return /^\d+$/.test(debugPort);}catch{return false;}});
  const targets=await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json(),target=targets.find(t=>t.type==='page');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});
  ws.onmessage=event=>{const r=JSON.parse(event.data);if(r.id&&pending.has(r.id)){const {ok,no}=pending.get(r.id);pending.delete(r.id);r.error?no(Error(JSON.stringify(r.error))):ok(r.result);}if(r.method==='Runtime.exceptionThrown')exceptions.push(r.params.exceptionDetails);};
  await call('Runtime.enable');await call('Page.enable');await call('Page.navigate',{url:`http://127.0.0.1:${port}`});await until(()=>evaluate("typeof render==='function'"));
  await evaluate("filingsLegacy=true;goto('intelligence')");assert.match(await evaluate("document.getElementById('view').textContent"),/Off-market intelligence/);
  assert.equal(await evaluate("document.querySelector('#intelligenceSearch [name=company]').required"),false);assert.equal(await evaluate("document.querySelector('#intelligenceSearch [name=sourceURL]')===null"),true);
  await evaluate("document.querySelector('#intelligenceSearch [name=industry]').value='Manufacturing';document.querySelector('#intelligenceSearch [name=location]').value='Illinois';document.getElementById('intelligenceSearch').requestSubmit()");await until(()=>evaluate('!intelligenceBusy'));
  assert.equal(batches,1);assert.equal(await evaluate('intelligenceResults().length'),2);assert.equal(await evaluate('intelligenceStore().entities.length'),0);
  await evaluate("document.querySelector('[data-intelligence-track]').click();document.querySelector('#intelligenceTrackForm [name=name]').value='Synthetic Tools LLC';document.getElementById('intelligenceTrackForm').requestSubmit()");assert.equal(await evaluate('intelligenceStore().entities.length'),1);assert.equal(await evaluate('intelligenceStore().evidence.length'),1);
  await evaluate("document.querySelector('[data-intelligence-collect]').click()");await until(()=>evaluate('!intelligenceBusy'));assert.equal(batches,2);assert.equal(await evaluate('intelligenceStore().evidence.length'),2);
  assert.equal(await evaluate('QLAIntelligence.assess(intelligenceEntity(),intelligenceStore().evidence).score'),0);
  for(const [index,type] of [[0,'succession'],[1,'divestiture']]){
   await evaluate(`{const form=document.querySelectorAll('[data-intelligence-evidence-form]')[${index}];form.elements.review.value='Confirmed same business';form.elements.quality.value='Original source reviewed';form.elements.signalType.value='${type}';form.elements.eventDate.value=date();form.requestSubmit();}`);
  }
  assert.equal(await evaluate('QLAIntelligence.assess(intelligenceEntity(),intelligenceStore().evidence).score'),45);
  assert.match(await evaluate("document.querySelector('.outreachPanel').textContent"),/Owner \/ founder/);
  await evaluate("{const f=document.querySelector('[data-outreach-form]');for(const [k,v] of Object.entries({senderName:'Taylor Buyer',recipientName:'Jordan Owner',recipientEmail:'owner@synthetic-tools.example',recipientSource:'https://synthetic-tools.example/about',personalNote:'I am interested in your custom tooling work.'}))f.elements[k].value=v;document.querySelector('[data-outreach-action=generate]').click();}");
  assert.match(await evaluate('intelligenceEntity().outreach.body'),/Hello Jordan Owner/);assert.match(await evaluate('intelligenceEntity().outreach.body'),/custom tooling work/);
  await evaluate("document.querySelector('[data-outreach-form]').elements.templateId.value='qla_meeting';document.querySelector('[data-outreach-action=generate]').click()");assert.match(await evaluate('intelligenceEntity().outreach.body'),/schedule a meeting/);
  await evaluate("{const f=document.getElementById('intelligenceFinanceForm');for(const [k,v] of Object.entries({revenueLow:1000000,revenueHigh:2000000,marginLow:10,marginHigh:20,multipleLow:3,multipleHigh:4,netDebt:100000,basis:'Synthetic scenario'}))f.elements[k].value=v;f.requestSubmit();}");assert.equal(await evaluate('intelligenceEntity().finance.equityLow'),200000);
  await evaluate("document.querySelector('[data-intelligence-collect]').click()");await until(()=>evaluate('!intelligenceBusy'));assert.equal(await evaluate('intelligenceStore().evidence.length'),2);assert.equal(await evaluate('QLAIntelligence.assess(intelligenceEntity(),intelligenceStore().evidence).score'),45);
  await evaluate("document.querySelector('[data-intelligence-queue]').click()");assert.equal(await evaluate('state.prospects.length'),1);assert.equal(await evaluate('page'),'sourcing');
  await evaluate("document.querySelector('#activityForm [name=kind]').value='Interested';document.getElementById('activityForm').requestSubmit();goto('intelligence')");assert.equal(await evaluate('intelligenceEntity().history[0].label'),1);assert.equal(await evaluate('state.prospects[0].status'),'Interested');
  await call('Page.reload');await until(()=>evaluate("typeof state!=='undefined'&&state.intelligence?.entities?.length===1"));await evaluate("filingsLegacy=true;goto('intelligence');document.querySelector('[data-intelligence-open]').click()");assert.equal(await evaluate('intelligenceEntity().finance.equityLow'),200000);
  assert.match(await evaluate('intelligenceEntity().outreach.body'),/custom tooling work/);assert.equal(await evaluate("document.querySelector('[data-outreach-form]').elements.recipientEmail.value"),'owner@synthetic-tools.example');
  assert.equal(await evaluate("document.querySelector('[data-outreach-form]').elements.templateId.value"),'qla_meeting');
  await evaluate("document.querySelector('[data-intelligence-queue]').click()");assert.equal(await evaluate('state.prospects.length'),1);
  await evaluate("goto('intelligence');document.querySelector('#intelligenceOutcomeForm [name=kind]').value='Do not contact';document.getElementById('intelligenceOutcomeForm').requestSubmit()");assert.equal(await evaluate('state.prospects[0].status'),'Do not contact');assert.equal(await evaluate("document.querySelector('[data-intelligence-queue]').disabled"),true);
  assert.equal(await evaluate("document.querySelector('[data-outreach-form] fieldset').disabled"),true);
  connected=false;await evaluate("runIntelligenceSearch({industry:'Services',location:'Illinois'}).catch(e=>notify(e.message))");assert.equal(batches,3);assert.match(await evaluate("document.getElementById('notice').textContent"),/Connect Brave/);
  await evaluate("state.sourcingUsage={day:date(),batches:campaignConfig().dailyLimit};runIntelligenceSearch({industry:'Services',location:'Illinois'}).catch(e=>notify(e.message))");assert.equal(batches,3);assert.match(await evaluate("document.getElementById('notice').textContent"),/daily search limit/);
  await evaluate("{const s=intelligenceStore();s.pages[JSON.stringify(QLAIntelligence.criteria(intelligenceConfig()))]=null;render();}");assert.match(await evaluate("document.getElementById('view').textContent"),/Next saved page: Finished/);
  assert.equal(await evaluate('JSON.parse(JSON.stringify(state)).intelligence.entities[0].history.length'),2);
  for(const p of ['overview','deals','combinations','lab','sources','agents','team','workflow','process','settings','sourcing','intelligence']){await evaluate(`goto('${p}')`);assert.ok((await evaluate("document.getElementById('view').textContent.length"))>100,p);}
  assert.deepEqual(exceptions,[]);await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'intelligence.png'),Buffer.from(shot.data,'base64'));
  console.log('Browser passed: broad discovery, focused collection, evidence review, 45-point synthesis, finance scenario, queue deduplication, outcome snapshots, opt-outs, persistence, limits, and all 12 screens. Synthetic results; no paid search requests.');
 }finally{
  if(ws?.readyState===1){await call('Browser.close').catch(()=>{});ws.close();}if(chrome&&chrome.exitCode===null){await pause(400);if(chrome.exitCode===null)chrome.kill();}
  await new Promise(r=>server.close(r));const resolved=path.resolve(profile),tmp=path.resolve(os.tmpdir());if(path.dirname(resolved)===tmp&&path.basename(resolved).startsWith('qla-intelligence-browser-')){try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch{console.log('Isolated browser profile retained at '+resolved);}}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
