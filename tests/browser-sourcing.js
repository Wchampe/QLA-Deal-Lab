// Run Chrome headless with --remote-debugging-port=9228 and an isolated test profile first.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const targets=await (await fetch('http://127.0.0.1:9228/json')).json();const target=targets.find(t=>t.type==='page');if(!target)throw Error('No Chrome page');
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});let counter=0;const pending=new Map(),exceptions=[];
 ws.onmessage=e=>{const r=JSON.parse(e.data);if(r.id&&pending.has(r.id)){const {ok,no}=pending.get(r.id);pending.delete(r.id);r.error?no(Error(JSON.stringify(r.error))):ok(r.result);}if(r.method==='Runtime.exceptionThrown')exceptions.push(r.params.exceptionDetails);};
 const call=(method,params={})=>new Promise((ok,no)=>{const id=++counter;pending.set(id,{ok,no});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async(expression)=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await call('Runtime.enable');await call('Page.enable');await call('Page.navigate',{url:'http://127.0.0.1:8765'});
 for(let i=0;i<30;i++){if(await evaluate("typeof render === 'function'"))break;await new Promise(r=>setTimeout(r,100));}

 await evaluate("state=initial();save();goto('sourcing')");
 await evaluate('refreshSearchStatus()');assert.match(await evaluate("document.getElementById('view').textContent"),/Brave key needed/);
 await evaluate("document.querySelector('#campaignForm [name=industry]').value='HVAC';document.querySelector('#campaignForm [name=location]').value='Illinois';document.getElementById('campaignForm').requestSubmit()");assert.equal(await evaluate('state.sourcing.industry'),'HVAC');
 await evaluate('runSourceCampaign()');assert.match(await evaluate("document.getElementById('notice').textContent"),/Connect your Brave key/);assert.equal(await evaluate('state.sourcingUsage?.batches||0'),0);
 await evaluate("state.sourcingRecords=QLASourcing.normalize([{title:'Synthetic HVAC prospect',url:'https://example.com/hvac',description:'Business contact page'}],'Owner prospects','HVAC Illinois');render();document.querySelector('[data-queue-result]').click()");assert.equal(await evaluate('state.prospects.length'),1);
 await evaluate("document.querySelector('#prospectForm [name=phone]').value='555-0100';document.getElementById('prospectForm').requestSubmit()");assert.match(await evaluate("document.getElementById('notice').textContent"),/source URL/);
 await evaluate("document.querySelector('#prospectForm [name=contactSource]').value='https://example.com/contact';document.getElementById('prospectForm').requestSubmit()");assert.equal(await evaluate('state.prospects[0].phone'),'555-0100');
 await evaluate("document.getElementById('activityForm').requestSubmit();document.querySelector('#activityForm [name=kind]').value='Conversation';document.getElementById('activityForm').requestSubmit()");assert.equal(await evaluate('QLASourcing.funnel(state.prospects).conversations'),1);
 await evaluate("document.querySelector('#activityForm [name=kind]').value='Do not contact';document.getElementById('activityForm').requestSubmit()");assert.equal(await evaluate('state.prospects[0].status'),'Do not contact');assert.equal(await evaluate("document.querySelector('#activityForm button').disabled"),true);
 await evaluate("render();document.querySelector('[data-queue-result]').click()");assert.equal(await evaluate('state.prospects.length'),1);
 await call('Page.reload');for(let i=0;i<30;i++){if(await evaluate("typeof state!=='undefined'&&state.prospects?.length===1"))break;await new Promise(r=>setTimeout(r,100));}
 assert.equal(await evaluate('state.prospects[0].status'),'Do not contact');await evaluate("goto('sourcing')");assert.match(await evaluate("document.getElementById('view').textContent"),/Searchfunder/);
 for(const p of ['overview','deals','combinations','lab','sources','agents','team','workflow','process','settings','sourcing']){await evaluate(`goto('${p}')`);assert.ok((await evaluate("document.getElementById('view').textContent.length"))>100,p);}
 assert.equal(exceptions.length,0,JSON.stringify(exceptions));console.log('Browser passed: eleven screens, campaign settings, missing-key handling, no-key search links, queue deduplication, sourced contact details, funnel outcomes, do-not-contact handling and reload persistence.');
 await evaluate("state=initial();save();goto('sourcing')");
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('tests/sourcing.png',Buffer.from(shot.data,'base64'));
 await call('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1);});
