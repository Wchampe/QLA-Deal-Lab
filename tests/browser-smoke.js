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
 assert.equal(await evaluate('state.deals.length'),6);assert.equal(await evaluate('combos().length'),48);exceptions.length=0;
 for(const p of ['overview','deals','combinations','lab','sources','agents','team','workflow','process','settings']){await evaluate(`goto('${p}')`);assert.ok((await evaluate("document.getElementById('view').textContent.length"))>100,p);}
 await evaluate("goto('agents'); screen()");assert.match(await evaluate("document.getElementById('agentOutput').textContent"),/RULE-BASED SCREEN/);
 await evaluate("goto('deals'); editor(); document.querySelector('[name=name]').value='Browser test business'; document.querySelector('[name=industry]').value='Services'; document.querySelector('[name=location]').value='IL'; document.querySelector('[name=price]').value='100000'; document.querySelector('[name=earnings]').value='60000'; document.querySelector('[name=sourceURL]').value='https://example.com/browser-test'; document.getElementById('dealForm').requestSubmit()");
 assert.equal(await evaluate('state.deals.length'),7);
 await evaluate("goto('lab'); document.querySelector('[name=senior]').value='95'; document.querySelector('[name=seller]').value='30'; document.getElementById('scenarioForm').requestSubmit()");
 assert.match(await evaluate("document.getElementById('notice').textContent"),/exceed/);
 await evaluate("goto('team'); document.getElementById('draftForm').requestSubmit()");assert.match(await evaluate("document.getElementById('draftText').value"),/Browser test business/);
 assert.equal(await evaluate("parseCSV('name,notes\\r\\nA,\"hello, world\"')[0].notes"),'hello, world');
 await evaluate("goto('process');document.querySelector('[data-task=\"0\"]').click()");assert.equal(await evaluate('selected().checks.includes(0)'),true);
 await evaluate("goto('workflow'); document.getElementById('workflowInit').click()");assert.equal(await evaluate('Object.keys(selected().workflow.phases).length'),15);
 await evaluate("document.querySelector('#phaseForm [name=status]').value='Complete';document.getElementById('phaseForm').requestSubmit()");assert.match(await evaluate("document.getElementById('notice').textContent"),/Complete all phase tasks/);
 await evaluate("document.querySelector('#phaseForm [name=status]').value='In progress';document.querySelector('#phaseForm [name=notes]').value='Browser workflow test';document.getElementById('phaseForm').requestSubmit()");assert.equal(await evaluate('selected().workflow.phases.thesis.status'),'In progress');
 await evaluate("state=initial();save();goto('overview')");
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('tests/overview.png',Buffer.from(shot.data,'base64'));
 assert.equal(exceptions.length,0,JSON.stringify(exceptions));console.log('Browser smoke passed: ten screens, 48 combinations, deal form, validation, draft, checklist, CSV parsing, 15-phase workflow, and no JS exceptions.');ws.close();
})().catch(e=>{console.error(e);process.exit(1);});
