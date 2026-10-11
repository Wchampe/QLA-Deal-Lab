'use strict';
// Real app/server/collector in an isolated browser. Only SEC and model responses are synthetic.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {createServer}=require('../server'),{createService}=require('../filings'),fx=require('./filings-fixtures');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let n=0;n<120;n++){if(await fn())return;await pause(100);}throw Error('Browser check timed out');}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qla-filings-browser-')),calls=[],baseFetch=fx.fixtureFetch({calls});let releaseAI,holdAI=false,modelWaiting=false;
 const service=createService({model:'fixture-model',sleep:async()=>{},fetch:async(url,opts)=>{if(holdAI&&String(url).endsWith('/api/chat')){modelWaiting=true;await new Promise(r=>{releaseAI=r;});modelWaiting=false;}return baseFetch(url,opts);}});
 const server=createServer({filings:service}),serve=server.listeners('request')[0];let chrome,ws,port,seq=0;const pending=new Map(),exceptions=[];
 server.removeAllListeners('request');server.on('request',(req,res)=>{req.headers.host='127.0.0.1:8765';if(req.headers.origin===`http://127.0.0.1:${port}`)req.headers.origin='http://127.0.0.1:8765';serve(req,res);});
 const call=(method,params={})=>new Promise((ok,no)=>{const id=++seq;pending.set(id,{ok,no});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));port=server.address().port;
  const binary=process.env.QLA_TEST_BROWSER||['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(x=>fs.existsSync(x));if(!binary)throw Error('Chrome or Edge required.');
  chrome=spawn(binary,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});chrome.on('error',e=>exceptions.push(e.message));
  let debugPort;await until(()=>{try{debugPort=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0].trim();return /^\d+$/.test(debugPort);}catch{return false;}});
  const targets=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});
  ws.onmessage=event=>{const r=JSON.parse(event.data);if(r.id&&pending.has(r.id)){const {ok,no}=pending.get(r.id);pending.delete(r.id);r.error?no(Error(JSON.stringify(r.error))):ok(r.result);}if(r.method==='Runtime.exceptionThrown')exceptions.push(r.params.exceptionDetails);};
  await call('Runtime.enable');await call('Page.enable');await call('Page.navigate',{url:`http://127.0.0.1:${port}`});await until(()=>evaluate("typeof render==='function'"));
  await evaluate("goto('intelligence')");assert.match(await evaluate("$('view').textContent"),/Off-market filing intelligence/);assert.equal(await evaluate("document.querySelector('#intelligenceSearch')===null"),true);
  assert.equal(await evaluate("$('filingsScan').elements.company.required"),false);assert.equal(await evaluate("$('filingsScan').elements.sourceURL===undefined"),true);
  await evaluate("$('filingsCheck').click()");await until(()=>evaluate('filingsConnection?.aiReady===true'));
  await evaluate("$('filingsScan').requestSubmit()");await until(()=>evaluate('filingsStore().companies.length===1&&!filingsStore().activeJob'));
  assert.equal(await evaluate('filingCompany().analysis.status'),'announced_process');assert.equal(await evaluate('filingCompany().analysis.connections.length'),1);assert.equal(await evaluate('filingCompany().documents.length'),2);assert.match(await evaluate("$('filingsDossier').textContent"),/forbearance/);
  assert.equal(await evaluate("JSON.parse(localStorage.getItem(KEY)).filings.companies.length"),1);assert.equal(calls.filter(x=>x.url.includes('efts.sec.gov')).length,1);
  // Contact lookup and editable outreach work without a separate AI call or email service.
  assert.equal(await evaluate("filingCompany().contacts.find(c=>c.email==='ir@synthetic.example').name"),'Jordan Avery');
  await evaluate("document.querySelector('[data-outreach-action=contacts]').click()");await until(()=>evaluate('!!filingCompany().contactResearch'));
  await evaluate("document.querySelector('[data-outreach-action=choose][data-contact-index=\"0\"]').click()");
  await evaluate("{const f=document.querySelector('[data-outreach-form]');f.elements.senderName.value='Taylor Buyer';f.elements.asset.value='equipment division';document.querySelector('[data-outreach-action=generate]').click();}");
  assert.match(await evaluate('filingCompany().outreach.body'),/Hello Jordan Avery/);assert.match(await evaluate('filingCompany().outreach.body'),/equipment division within Synthetic Manufacturing/);
  assert.match(await evaluate('filingCompany().outreach.body'),/currently accepting acquisition inquiries/);
  const standardEmail=await evaluate('filingCompany().outreach.body');
  await evaluate("{const f=document.querySelector('[data-outreach-form]');f.elements.templateId.value='qla_initial';f.elements.templateId.dispatchEvent(new Event('input',{bubbles:true}));}");
  assert.equal(await evaluate('filingCompany().outreach.body'),standardEmail,'selecting a template must preserve edited text until generation');assert.match(await evaluate("document.querySelector('[data-outreach-template-note]').textContent"),/third-party book scan/);
  await evaluate("document.querySelector('[data-outreach-action=generate]').click()");assert.match(await evaluate('filingCompany().outreach.body'),/contacting you about a possible acquisition/);assert.match(await evaluate('filingCompany().outreach.body'),/currently accepting acquisition inquiries/);
  await evaluate("{const f=document.querySelector('[data-outreach-form]');f.elements.body.value+='\\n\\nMy own closing line.';f.elements.body.dispatchEvent(new Event('input',{bubbles:true}));}");
  assert.match(await evaluate('JSON.parse(localStorage.getItem(KEY)).filings.companies[0].outreach.body'),/My own closing line/);
  await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedOutreach=text;}}});document.querySelector('[data-outreach-action=copy]').click()");
  await until(()=>evaluate('!!window.copiedOutreach'));assert.match(await evaluate('window.copiedOutreach'),/To: ir@synthetic.example/);assert.match(await evaluate('window.copiedOutreach'),/Subject: Acquisition inquiry/);
  await evaluate("document.querySelector('[data-outreach-action=queue]').click()");assert.equal(await evaluate('state.prospects[0].email'),'ir@synthetic.example');assert.equal(await evaluate('state.prospects[0].contactName'),'Jordan Avery');
  await evaluate("{const f=$('filingsFinance');for(const [k,v] of Object.entries({revenueLow:1000000,revenueHigh:2000000,marginLow:10,marginHigh:20,multipleLow:3,multipleHigh:4,netDebt:100000,basis:'Synthetic browser scenario'}))f.elements[k].value=v;f.requestSubmit();}");assert.equal(await evaluate('filingCompany().scenario.equityLow'),200000);
  await evaluate("document.querySelector('[data-filings-queue]').click()");assert.equal(await evaluate('page'),'sourcing');assert.equal(await evaluate('state.prospects.length'),1);
  await evaluate("$('activityForm').elements.kind.value='Interested';$('activityForm').requestSubmit();goto('intelligence')");assert.equal(await evaluate('filingCompany().outcomes[0].label'),1);assert.equal(await evaluate('filingCompany().outcomes[0].statusBefore'),'announced_process');
  // A running job must survive reload without losing the saved scenario or call history.
  holdAI=true;await evaluate("document.querySelector('[data-filings-refresh]').click()");await until(()=>modelWaiting);assert.equal(await evaluate('!!filingsStore().activeJob'),true);await until(()=>evaluate('filingCompany().analysisPending===true'));assert.equal(await evaluate('filingCompany().analysis.status'),'analyzing');assert.equal(await evaluate('JSON.parse(localStorage.getItem(KEY)).filings.companies[0].documents.length'),2);
  await call('Page.reload');await until(()=>evaluate("typeof render==='function'"));await evaluate("goto('intelligence')");holdAI=false;releaseAI();await until(()=>evaluate('!filingsStore().activeJob'));
  await evaluate("document.querySelector('[data-filings-open]').click()");assert.equal(await evaluate('filingCompany().scenario.equityLow'),200000);assert.equal(await evaluate('filingCompany().outcomes.length'),1);assert.equal(await evaluate('filingsStore().companies.length'),1);
  assert.match(await evaluate('filingCompany().outreach.body'),/My own closing line/);assert.equal(await evaluate('filingCompany().contactResearch.documentsChecked'),2);assert.equal(await evaluate('state.outreachProfile.senderName'),'Taylor Buyer');
  assert.equal(await evaluate("document.querySelector('[data-outreach-form]').elements.recipientEmail.value"),'ir@synthetic.example');
  assert.equal(await evaluate("document.querySelector('[data-outreach-form]').elements.templateId.value"),'qla_initial');
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await evaluate("document.querySelector('.outreachPanel').scrollIntoView()");const outreachShot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'outreach.png'),Buffer.from(outreachShot.data,'base64'));
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.ok(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),'outreach layout should fit mobile');
  await evaluate("document.querySelector('[data-filings-queue]').click()");assert.equal(await evaluate('state.prospects.length'),1);await evaluate("$('activityForm').elements.kind.value='Do not contact';$('activityForm').requestSubmit();goto('intelligence')");assert.equal(await evaluate("document.querySelector('[data-filings-queue]').disabled"),true);assert.equal(await evaluate('filingCompany().outcomes[1].label'),null);
  assert.equal(await evaluate("document.querySelector('[data-outreach-form] fieldset').disabled"),true);assert.equal(await evaluate("document.querySelector('[data-outreach-form]').elements.body.value"),'');
  assert.equal(await evaluate("(()=>{try{outreachCapture(document.querySelector('.outreachPanel'));return false;}catch(e){return /Do not contact/.test(e.message);}})()"),true);
  await evaluate("$('filingsLegacy').click()");assert.equal(await evaluate('filingsLegacy'),true);assert.ok(await evaluate("!!$('intelligenceSearch')"));await evaluate("$('filingsReturn').click()");
  for(const p of ['overview','deals','combinations','lab','sources','agents','team','workflow','process','settings','sourcing','intelligence']){await evaluate(`goto('${p}')`);assert.ok(await evaluate("$('view').textContent.length>100"),p);}
  assert.deepEqual(exceptions,[]);await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await evaluate('window.scrollTo(0,0)');const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'filings.png'),Buffer.from(shot.data,'base64'));
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.ok(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),'mobile layout should not overflow');
  console.log('Filing browser passed: collector → AI dossier, public contact lookup, tailored email, recipient selection, autosave, copy, queue contact transfer, refresh/reload persistence, opt-out, scenarios, outcome snapshots, legacy views, all screens and mobile layout. Synthetic data; no paid requests or email sending.');
 }finally{
  if(releaseAI)releaseAI();if(ws?.readyState===1){await call('Browser.close').catch(()=>{});ws.close();}if(chrome&&chrome.exitCode===null){await pause(400);if(chrome.exitCode===null)chrome.kill();}
  await new Promise(r=>server.close(r));const resolved=path.resolve(profile),tmp=path.resolve(os.tmpdir());if(path.dirname(resolved)===tmp&&path.basename(resolved).startsWith('qla-filings-browser-')){try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch{console.log('Isolated browser profile retained at '+resolved);}}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
