'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),I=require('../intelligence'),Server=require('../server');
const now=Date.parse('2026-09-17T12:00:00Z'),entity={id:'business-a',name:'Example Tools LLC',location:'Illinois',industry:'Manufacturing',website:'https://example-tools.test',history:[]};
const evidence=(id,type,overrides={})=>({id,entityId:entity.id,url:`https://${id}.test/story`,title:'Example Tools LLC event',snippet:'Collected snippet',fact:`Business fact ${id}`,review:'Confirmed same business',quality:'Original source reviewed',eventDate:'2026-09-01',signalType:type,...overrides});

test('broad discovery needs no company or URL and target searches investigate counterevidence',()=>{
 const broad=I.queries({industry:'HVAC',location:'Illinois'});assert.equal(broad.length,4);assert.ok(broad.every(q=>q.query.includes('HVAC Illinois')&&q.query.includes('-site:bizbuysell.com')));
 const targeted=I.queries({company:entity.name,location:entity.location});assert.match(targeted[3].query,/expansion/);assert.match(targeted[0].query,/"Example Tools LLC"/);assert.throws(()=>I.queries({company:'a'.repeat(121)}));
});
test('normalization excludes known broker sites and unsafe URLs without guessing intent',()=>{
 const records=I.normalize([{url:'javascript:alert(1)'},{url:'https://bizbuysell.com/listing'},{url:'https://user:secret@example.test/private'},{title:'New UCC financing statement',description:'Recorded loan',url:'https://example.test/file?utm_source=email#x'}],'Company financing','query');
 assert.equal(records.length,1);assert.equal(records[0].url,'https://example.test/file');assert.equal(records[0].review,'Pending');assert.deepEqual(records[0].suggestedSignals,[]);assert.equal(records[0].eventDate,'');
 assert.equal(I.marketplace('https://bizbuysell.com.evil.test'),false);
});
test('business identity needs geography, same name does not auto-confirm a source',()=>{
 assert.throws(()=>I.newEntity({name:'Example'},'new'));assert.notEqual(I.entityKey(entity),I.entityKey({...entity,location:'Wisconsin'}));
 const record=I.attach(entity,{url:'https://local.test/story',title:'Example Tools LLC',snippet:'Illinois'},'ev1');assert.equal(record.review,'Pending');assert.equal(record.signalType,'neutral');assert.match(record.matchHint,/confirm/);
});
test('unreviewed, mismatched and changed snippets cannot contribute score',()=>{
 const rows=[evidence('a','succession',{review:'Pending'}),evidence('b','intent',{review:'Unrelated'}),evidence('c','divestiture',{quality:'Search excerpt'}),evidence('d','capital',{changed:true}),evidence('e','intent',{entityId:'other'})];
 const a=I.assess(entity,rows,now);assert.equal(a.score,0);assert.equal(a.probability,null);assert.equal(a.pending,3);
});
test('combines reviewed categories, caps repetition and discounts old or unknown event dates',()=>{
 const base=[evidence('a','succession'),evidence('b','divestiture')];const a=I.assess(entity,base,now);assert.equal(a.score,45);assert.equal(a.status,'Priority research');
 const many=[...base,...Array.from({length:30},(_,i)=>evidence('copy'+i,'succession'))];assert.equal(I.assess(entity,many,now).score,45);
 assert.equal(I.assess(entity,[evidence('old','succession',{eventDate:'2024-01-01',observedAt:'2026-09-17'})],now).score,5);
 assert.equal(I.assess(entity,[evidence('undated','succession',{eventDate:''})],now).score,6);
 assert.equal(I.assess(entity,[evidence('future','intent',{eventDate:'2099-01-01'})],now).score,0);
});
test('copies of the same event do not accumulate across categories or hosts',()=>{
 const rows=[evidence('a','succession',{eventKey:'press-release-1'}),evidence('b','divestiture',{eventKey:'press-release-1'})];assert.equal(I.assess(entity,rows,now).score,25);
 assert.equal(I.assess(entity,[evidence('a','succession',{fact:'Same copied fact.'}),evidence('b','intent',{fact:'Same copied fact!'})],now).score,30);
});
test('counterevidence lowers priority and routine filings never stand in for seller interest',()=>{
 assert.equal(I.assess(entity,[evidence('a','succession'),evidence('b','stability')],now).score,10);
 assert.equal(I.assess(entity,[evidence('a','neutral',{fact:'UCC-1 filed'}),evidence('b','neutral',{fact:'Form 144 proposed share sale'})],now).score,0);
 const a=I.assess(entity,[evidence('a','restructuring')],now);assert.equal(a.risk,true);assert.equal(a.status,'Limited evidence');
});
test('refresh preserves manual facts and history, changed source requests a review',()=>{
 const old=evidence('a','succession',{observedAt:'2025-01-01'}),rows=I.mergeRecords([old],[{url:old.url+'?utm_campaign=z',snippet:'New snippet',observedAt:'2026-09-17',review:'Pending'}]);assert.equal(rows.length,1);assert.equal(rows[0].fact,old.fact);assert.equal(rows[0].observedAt,'2025-01-01');assert.equal(rows[0].changed,true);
 const reviewed=I.reviewEvidence(rows[0],{...old,fact:'Updated actual fact'},now);assert.equal(reviewed.changed,false);assert.equal(I.mergeRecords([reviewed],[{url:old.url,snippet:'New snippet',observedAt:'2026-09-18'}])[0].changed,false);assert.throws(()=>I.reviewEvidence(old,{...old,eventDate:'2026-02-30'},now));
});
test('outcomes preserve pre-response features, nonresponses stay unlabeled and opt-outs block follow-up',()=>{
 const rows=[evidence('a','succession')],a=I.recordOutcome(entity,'No answer','',rows,now);assert.equal(a.history[0].label,null);assert.equal(a.history[0].scoreBeforeOutcome,25);
 const b=I.recordOutcome(a,'Interested','Owner response',rows,now);assert.equal(b.history[1].label,1);assert.deepEqual(b.history[1].evidenceSnapshot,[{id:'a',type:'succession',points:25}]);
 const stopped=I.recordOutcome(b,'Do not contact','',rows,now);assert.equal(I.assess(stopped,rows,now).suppressed,true);assert.throws(()=>I.callBrief(stopped,rows),/Do not contact/);assert.throws(()=>I.recordOutcome(stopped,'Interested','',rows,now),/Do not contact/);
});
test('financial scenarios require explicit assumptions and do not invent private earnings',()=>{
 const input={revenueLow:1000000,revenueHigh:2000000,marginLow:10,marginHigh:20,multipleLow:3,multipleHigh:4,netDebt:100000,basis:'Synthetic analyst scenario'},f=I.financeRange(input);assert.equal(f.earningsLow,100000);assert.equal(f.earningsHigh,400000);assert.equal(f.equityLow,200000);assert.equal(f.equityHigh,1500000);
 assert.throws(()=>I.financeRange({...input,revenueLow:''}));assert.throws(()=>I.financeRange({...input,basis:''}));assert.throws(()=>I.financeRange({...input,marginHigh:101}));
});
test('evidence collector makes four bounded searches, filters marketplaces and retains partial success',async()=>{
 const original=global.fetch,key=process.env.BRAVE_API_KEY;process.env.BRAVE_API_KEY='TEST_INTELLIGENCE_KEY';let calls=0;
 global.fetch=async value=>{const u=new URL(value);assert.equal(u.hostname,'api.search.brave.com');assert.equal(u.searchParams.get('offset'),'1');assert.equal(u.searchParams.get('count'),'20');assert.match(u.searchParams.get('q'),/-site:bizbuysell/);calls++;if(calls===2)return new Response('',{status:429});return new Response(JSON.stringify({web:{results:[{title:'Fixture',url:'https://local.test/article',description:'Fixture'},{url:'https://bizquest.com/listing'}]}}));};
 try{const r=await Server.sourceBatch({company:entity.name,location:entity.location,offset:1},true);assert.equal(calls,4);assert.equal(r.records.length,3);assert.equal(r.runs.filter(x=>!x.ok).length,1);assert.ok(r.records.every(x=>x.review==='Pending'));}finally{global.fetch=original;if(key)process.env.BRAVE_API_KEY=key;else delete process.env.BRAVE_API_KEY;}
});
