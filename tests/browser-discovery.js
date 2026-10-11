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

 await evaluate("state=initial();save();goto('sources')");
 await evaluate('runMatchingAgent()');
 assert.ok(await evaluate('state.inbox.length>0'));
 assert.ok(await evaluate('matchingRows().some(x=>x.ready&&x.cases.length===8)'));
 const count=await evaluate('state.inbox.length');
 await evaluate('state.inbox=QLADiscovery.merge(state.inbox,state.inbox).rows');assert.equal(await evaluate('state.inbox.length'),count);
 await evaluate("render();document.querySelector('[data-match-draft]').click()");assert.match(await evaluate("document.getElementById('matchingDraft').value"),/PRIVATE CALL PREPARATION/);
 await evaluate("document.querySelector('[data-inbox]').click()");assert.equal(await evaluate("document.querySelector('#dealForm [name=earnings]').value"),'');assert.equal(await evaluate("document.querySelector('#dealForm [name=metric]').value"),'');
 await evaluate("document.querySelector('#dealForm [name=industry]').value='Services';document.querySelector('#dealForm [name=location]').value='IL';for(const k of numericFields)document.querySelector('#dealForm [name='+k+']').value=k==='price'?'200000':k==='earnings'?'150000':'0';document.querySelector('#dealForm [name=metric]').value='SDE';document.getElementById('dealForm').requestSubmit();goto('combinations')");
 assert.equal(await evaluate('rankedCombos().length'),1);assert.ok(await evaluate('rankedCombos()[0].rank.score>=0'));
 await evaluate("rankMode='All financing scenarios';render()");assert.equal(await evaluate('rankedCombos().length'),8);
 await evaluate("rankQuery='no-such-listing';render()");assert.equal(await evaluate('rankedCombos().length'),0);
 await evaluate("rankQuery='';goto('sources');document.querySelector('#matcherForm [name=ownerPay]').value='90000';document.getElementById('matcherForm').requestSubmit()");assert.equal(await evaluate('state.matcherAssumptions.ownerPay'),90000);
 await call('Page.reload');for(let i=0;i<30;i++){if(await evaluate("typeof state!=='undefined'&&state.inbox?.length>0"))break;await new Promise(r=>setTimeout(r,100));}
 assert.equal(await evaluate('state.inbox.length'),count);
 assert.equal(exceptions.length,0,JSON.stringify(exceptions));console.log('Live browser passed: fetched '+count+' actual listings, eight scenarios, deduplication, outreach draft, missing-field review, pipeline scoring, filters and persisted inbox.');
 await call('Browser.close');
 ws.close();
})().catch(e=>{console.error(e);process.exit(1);});
