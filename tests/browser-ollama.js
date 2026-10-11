'use strict';
// Isolated browser and saved model preference; no model generation or user data changes.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {createServer}=require('../server'),{createClient}=require('../ollama-client');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let n=0;n<150;n++){if(await fn())return;await pause(100);}throw Error('Browser check timed out');}
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'qla-ollama-browser-')),profile=path.join(root,'chrome'),configFile=path.join(root,'ollama.json');
 let offline=false,names=['qwen38-local:latest','deepseek-r1:14b'];
 const ollama=createClient({model:'',configFile,fetch:async()=>{if(offline)throw Error('Connection refused');return Response.json({models:names.map(name=>({name}))});}});
 const server=createServer({ollama}),serve=server.listeners('request')[0];let chrome,ws,port,seq=0;const pending=new Map(),exceptions=[];
 server.removeAllListeners('request');server.on('request',(req,res)=>{req.headers.host='127.0.0.1:8765';if(req.headers.origin===`http://127.0.0.1:${port}`)req.headers.origin='http://127.0.0.1:8765';serve(req,res);});
 const call=(method,params={})=>new Promise((ok,no)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);no(Error('Browser command timed out: '+method));},10000);pending.set(id,{ok:value=>{clearTimeout(timer);ok(value);},no:error=>{clearTimeout(timer);no(error);}});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const ready=()=>until(()=>evaluate('ollamaState?.ready&&!ollamaBusy'));
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));port=server.address().port;
  const binary=process.env.QLA_TEST_BROWSER||['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(x=>fs.existsSync(x));if(!binary)throw Error('Chrome or Edge required.');
  chrome=spawn(binary,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});chrome.on('error',e=>exceptions.push(e.message));
  await until(()=>fs.existsSync(path.join(profile,'DevToolsActivePort')));const debugPort=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
  const targets=await(await fetch(`http://127.0.0.1:${debugPort}/json`,{signal:AbortSignal.timeout(5000)})).json();ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Error('Browser connection timed out')),10000);ws.onopen=()=>{clearTimeout(timer);ok();};ws.onerror=error=>{clearTimeout(timer);no(error);};});
  ws.onmessage=event=>{const r=JSON.parse(event.data);if(r.id&&pending.has(r.id)){const {ok,no}=pending.get(r.id);pending.delete(r.id);r.error?no(Error(JSON.stringify(r.error))):ok(r.result);}if(r.method==='Runtime.exceptionThrown')exceptions.push(r.params.exceptionDetails);};
  await call('Runtime.enable');await call('Page.enable');await call('Page.navigate',{url:`http://127.0.0.1:${port}`});await until(()=>evaluate("typeof render==='function'"));await ready();
  await evaluate("state.deals[0].notes='Keep this workspace note';save();goto('agents')");await ready();
  assert.match(await evaluate("$('ollamaStatus').textContent"),/Ready: qwen38-local:latest/);
  assert.equal(await evaluate("$('ollamaModel').options.length"),2);
  await evaluate("$('ollamaPanel').querySelector('details').open=true;$('ollamaModel').value='deepseek-r1:14b';$('useOllamaModel').click()");
  await until(()=>evaluate("ollamaState.model==='deepseek-r1:14b'&&!ollamaBusy"));
  assert.equal(JSON.parse(fs.readFileSync(configFile,'utf8')).model,'deepseek-r1:14b');
  assert.match(await evaluate("$('connection').textContent"),/deepseek-r1:14b/);
  await evaluate("goto('intelligence')");await ready();
  assert.equal(await evaluate("api('/api/filings/status').then(result=>result.model)"),'deepseek-r1:14b');
  await evaluate("$('filingsScan').elements.industry.value='Unsaved industry';$('refreshOllama').click()");await ready();
  assert.equal(await evaluate("$('filingsScan').elements.industry.value"),'Unsaved industry');
  offline=true;await evaluate("$('refreshOllama').click()");await until(()=>evaluate('!ollamaBusy&&!ollamaState.ready'));
  assert.match(await evaluate("$('ollamaStatus').textContent"),/Cannot reach Ollama/);assert.equal(await evaluate("$('useOllamaModel').disabled"),true);
  offline=false;names=['deepseek-r1:14b'];await evaluate("$('refreshOllama').click()");await ready();
  assert.equal(await evaluate("$('ollamaModel').options.length"),1);
  names=[];await evaluate("$('refreshOllama').click()");await until(()=>evaluate('!ollamaBusy&&!ollamaState.ready'));
  assert.match(await evaluate("$('ollamaStatus').textContent"),/no installed models/);
  names=['qwen38-local:latest','deepseek-r1:14b'];await call('Page.reload');await until(()=>evaluate("typeof render==='function'"));await ready();
  assert.equal(await evaluate('state.deals[0].notes'),'Keep this workspace note');assert.equal(await evaluate('ollamaState.model'),'deepseek-r1:14b');
  await evaluate("goto('settings')");await ready();assert.match(await evaluate("$('ollamaStatus').textContent"),/deepseek-r1:14b/);
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'ollama.png'),Buffer.from(shot.data,'base64'));
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.ok(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),'mobile layout should not overflow');
  assert.deepEqual(exceptions,[]);
  console.log('Ollama browser passed: live list, model selection, shared filing model, saved preference, offline/empty recovery, workspace preservation, and mobile layout.');
 }finally{
  if(ws?.readyState===1){await call('Browser.close').catch(()=>{});ws.close();}if(chrome&&chrome.exitCode===null){await pause(400);if(chrome.exitCode===null)chrome.kill();}
  await new Promise(r=>server.close(r));const resolved=path.resolve(root),tmp=path.resolve(os.tmpdir());if(path.dirname(resolved)===tmp&&path.basename(resolved).startsWith('qla-ollama-browser-')){try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch{console.log('Isolated browser profile retained at '+resolved);}}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
