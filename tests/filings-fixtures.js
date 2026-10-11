'use strict';
// Fictional issuers and filings; never inserted in the user's browser workspace.
const company='0000000001',a1='0000000001-26-000001',a2='0000000001-26-000002';
const sentences={debt:'On August 1, 2026, Synthetic Manufacturing entered a forbearance agreement following a financial covenant breach.',sale:'On September 12, 2026, the board began a strategic alternatives review for its equipment division, including a possible sale.'};
const submissions={cik:company,name:'Synthetic Manufacturing',entityType:'operating',sic:'3500',sicDescription:'Industrial machinery',tickers:['SYNTHETIC'],addresses:{business:{city:'Test City',stateOrCountry:'IL'}},filings:{recent:{accessionNumber:[a2,a1],form:['8-K','10-Q'],filingDate:['2026-09-12','2026-08-01'],primaryDocument:['event.htm','quarter.htm'],items:['1.01,8.01','']}}};
const facts={cik:1,facts:{'us-gaap':{Revenues:{units:{USD:[{start:'2025-01-01',end:'2025-12-31',filed:'2026-02-14',form:'10-K',accn:a1,val:12000000},{start:'2026-04-01',end:'2026-06-30',filed:'2026-08-01',form:'10-Q',accn:a1,val:2500000}]}},CashAndCashEquivalentsAtCarryingValue:{units:{USD:[{end:'2026-06-30',filed:'2026-08-01',form:'10-Q',accn:a1,val:850000}]}}}}};
function aiReply(context){const p1=context.passages.find(p=>p.text.includes(sentences.debt)),p2=context.passages.find(p=>p.text.includes(sentences.sale));return {status:'announced_process',target:'division_or_assets',thesis:'A disclosed division review and a separate financing event warrant research; the process is already announced.',findings:[{passageId:p1.id,quote:sentences.debt,fact:'The issuer entered forbearance after a covenant breach.',kind:'debt',specificity:'current_event'},{passageId:p2.id,quote:sentences.sale,fact:'The board started a possible division-sale review.',kind:'strategic_review',specificity:'current_event'}],connections:[{explanation:'A debt forbearance precedes the division review. A disposal might raise cash, but the filings do not establish that this is the reason for the review.',passageIds:[p1.id,p2.id]}],alternatives:['Management could refinance or retain the division.'],questions:['Is the equipment division accepting buyer inquiries?']};}
function fixtureFetch({calls=[],offline=false,secStatus=0,badIdentity=false,badQuote=false}={}){return async(url,opts={})=>{
 const u=new URL(url);calls.push({url:String(url),opts});const respond=x=>new Response(JSON.stringify(x),{headers:{'Content-Type':'application/json'}});
 if(u.hostname==='127.0.0.1'){
  if(offline)throw Error('Connection refused');if(u.pathname==='/api/tags')return respond({models:[{name:'fixture-model'}]});
  const request=JSON.parse(opts.body),text=request.messages[1].content,context=JSON.parse(text.slice(text.indexOf('{'))),reply=aiReply(context);if(badQuote)reply.findings[1].quote='This sentence was not present in the filing and must be discarded.';return respond({message:{content:JSON.stringify(reply)}});
 }
 if(secStatus)return new Response('Blocked',{status:secStatus});
 if(u.hostname==='efts.sec.gov')return respond({hits:{total:{value:3},hits:[{_source:{ciks:[company],adsh:a2,biz_states:['IL']}},{_source:{ciks:[company],adsh:a1,biz_states:['IL']}},{_source:{ciks:['0000000002','0000000003'],adsh:a1,biz_states:['IL']}}]}});
 if(u.pathname==='/files/company_tickers.json')return respond({0:{cik_str:1,ticker:'SYNTHETIC',title:submissions.name}});
 if(u.pathname.startsWith('/submissions/'))return respond({...submissions,cik:badIdentity?'0000000002':company});
 if(u.pathname.includes('/companyfacts/'))return respond(facts);
 if(u.pathname.endsWith('/quarter.htm'))return new Response('<html><script>Not filing evidence</script><p>'+sentences.debt+' The agreement expires on December 31. No sale has been agreed.</p></html>');
 if(u.pathname.endsWith('/event.htm'))return new Response('<html><p>'+sentences.sale+' No definitive transaction has been agreed. The process may not result in a transaction.</p><h3>Investor Relations</h3><p>Jordan Avery, Chief Financial Officer</p><p>ir@synthetic.example</p><h2>SIGNATURES</h2><p>Synthetic Manufacturing</p><p>By: /s/ Morgan Lee</p><p>Chief Executive Officer</p></html>');
 throw Error('Unexpected fixture request '+url);
 };}
module.exports={company,a1,a2,sentences,submissions,facts,aiReply,fixtureFetch};
