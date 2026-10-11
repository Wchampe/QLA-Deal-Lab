'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const O=require('../outreach'),C=require('../filing-contacts'),F=require('../filings'),fx=require('./filings-fixtures');
const company={name:'Synthetic Manufacturing',industry:'Industrial machinery',location:'Test City, IL',website:'https://synthetic.example'};
const doc={url:F.filingURL(1,fx.a2,'event.htm'),form:'8-K',filed:'2026-09-12'};
const record={company,analysis:{target:'division_or_assets',status:'possible_unannounced',thesis:'Unconfirmed distress hypothesis',findings:[{kind:'strategic_review',specificity:'current_event',...doc}]}};
test('sale inquiry uses company, target and buyer facts without repeating distress hypotheses',()=>{
 const draft=O.draft(record,{senderName:'Taylor Buyer',recipientName:'Jordan Avery',asset:'equipment division',senderCompany:'Buyer Partners'});
 assert.match(draft.subject,/Synthetic Manufacturing/);assert.match(draft.body,/Hello Jordan Avery/);assert.match(draft.body,/Taylor Buyer with Buyer Partners/);
 assert.match(draft.body,/Industrial machinery in Test City, IL/);assert.match(draft.body,/equipment division within Synthetic Manufacturing/);assert.match(draft.body,/8-K filed on 2026-09-12/);
 assert.doesNotMatch(draft.body,/distress|forbearance|committed financing|guaranteed|ready to close/i);assert.match(draft.body,/may not be considering a sale/);
});
test('announced and completed processes ask about current availability without treating assets as for sale',()=>{
 const announced=O.draft({...record,analysis:{...record.analysis,status:'announced_process'}});assert.match(announced.body,/currently accepting acquisition inquiries/);
 const complete=O.draft({...record,analysis:{...record.analysis,status:'transaction_agreed_or_completed'}});assert.match(complete.body,/concluded or is already committed/);assert.match(complete.body,/other operations or assets/);
 assert.throws(()=>O.draft(record,{},true),/Do not contact/);
});
test('legacy private companies get owner guidance, editable introduction and no invented recipient',()=>{
 const legacy={name:'Synthetic Tools LLC',industry:'Tools',location:'Illinois'},draft=O.draft(legacy,{personalNote:'I am interested in your custom tooling work.',buyerIntro:'I have operated a small manufacturing business.'});
 assert.match(O.roles(legacy)[0].role,/Owner/);assert.match(draft.body,/^Hello,/);assert.match(draft.body,/\[Your name\]/);assert.match(draft.body,/custom tooling work/);assert.match(draft.body,/operated a small manufacturing business/);
 assert.equal(draft.reference,null);assert.equal(O.searchLinks({...legacy,website:'javascript:alert(1)'}).length,2);
});
test('QLA adaptations personalize buyer interest without inventing credentials or earlier contact',()=>{
 for(const templateId of ['qla_initial','qla_meeting']){
  const result=O.draft(record,{templateId,senderName:'Taylor Buyer',asset:'equipment division',buyerIntro:'I have experience running a machine shop.'});
  assert.equal(result.templateId,templateId);assert.match(result.body,/equipment division within Synthetic Manufacturing/);assert.match(result.body,/experience running a machine shop/);
  assert.doesNotMatch(result.body,/not a (?:business )?broker|funding secured|adequate capital|board of directors|as we discussed|enclosed|signed.{0,30}(?:NDA|agreement)|Dan Pe[ñn]a/i);
  const completed=O.draft({...record,analysis:{...record.analysis,status:'transaction_agreed_or_completed'}},{templateId});assert.match(completed.body,/concluded or is already committed/);
  assert.throws(()=>O.draft(record,{templateId},true),/Do not contact/);
 }
 assert.equal(O.draft(record,{templateId:'unrecognized-backup-template'}).templateId,'standard');
});
test('published contact blocks and issuer signatures preserve exact public details and provenance',()=>{
 const html='<h3>Investor Relations</h3><p>Jordan Avery, Chief Financial Officer</p><p><a href="mailto:ir@synthetic.example">Email our team</a></p><h3>Media Contact:</h3><p>Casey Harper</p><p>press@outside-agency.example</p><h2>SIGNATURES</h2><p>Synthetic Manufacturing</p><p>By: /s/ Morgan Lee</p><p>Chief Executive Officer</p>';
 const rows=C.extract(company,doc,html),ir=rows.find(x=>x.email==='ir@synthetic.example'),media=rows.find(x=>x.email==='press@outside-agency.example'),ceo=rows.find(x=>x.name==='Morgan Lee');
 assert.equal(ir.name,'Jordan Avery');assert.equal(ir.role,'Chief Financial Officer');assert.equal(ir.sourceURL,doc.url);assert.equal(ir.sourceDate,doc.filed);assert.match(ir.quote,/ir@synthetic.example/);
 assert.equal(media.name,'Casey Harper');assert.equal(media.kind,'media');assert.equal(ceo.role,'Chief Executive Officer');assert.equal(ceo.email,'');
});
test('contact extraction omits hidden addresses, unlabeled emails, and counterparty signatures',()=>{
 const html='<script>Investor Relations: hidden@synthetic.example</script><p>Email supplier@unrelated.example for supplies.</p><h2>SIGNATURES</h2><p>Unrelated Lender LLC</p><p>By: /s/ Other Person</p><p>Chief Executive Officer</p>';
 assert.deepEqual(C.extract(company,doc,html),[]);
 const own='<h2>SIGNATURES</h2><p>Synthetic Manufacturing</p><p>By: /s/ Morgan Lee</p><p>Chief Executive Officer</p>';
 assert.deepEqual(C.extract(company,{...doc,form:'8-K exhibit'},own),[]);
 assert.equal(O.email('owner@synthetic.example\nBcc:other@example.com'),'');
});
test('duplicate contacts use the most recent source and never construct an executive email',()=>{
 const html='<h3>Investor Relations</h3><p>Jordan Avery</p><p>ir@synthetic.example</p>';
 const rows=C.merge([...C.extract(company,{...doc,filed:'2025-01-01'},html),...C.extract(company,doc,html)]);
 assert.equal(rows.length,1);assert.equal(rows[0].sourceDate,'2026-09-12');assert.equal(rows[0].email,'ir@synthetic.example');
});
test('company names and ambiguous shared contact blocks are not assigned to a person',()=>{
 const generic=C.extract(company,doc,'<h3>Investor Relations</h3><p>Synthetic Manufacturing</p><p>ir@synthetic.example</p>');assert.equal(generic[0].name,'');
 const shared=C.extract(company,doc,'<h3>Investor Contacts:</h3><p>Jordan Avery</p><p>Morgan Lee</p><p>ir@synthetic.example</p>');assert.equal(shared[0].name,'');
 const nearest=C.extract(company,doc,'<h3>Investor Relations</h3><p>Jordan Avery</p><h3>Media Contact:</h3><p>Casey Harper</p><p>press@synthetic.example</p>');assert.equal(nearest[0].name,'Casey Harper');assert.equal(nearest[0].kind,'media');
});
test('contact-only refresh checks current SEC records without a model, financial-data lookup or arbitrary URL fetch',async()=>{
 const calls=[],service=F.createService({fetch:fx.fixtureFetch({calls}),now:()=>Date.parse('2026-09-18'),sleep:async()=>{}}),r=await service.contacts({cik:fx.company,url:'https://untrusted.example'});
 assert.equal(r.company.cik,fx.company);assert.equal(r.documentsChecked,2);assert.ok(r.contacts.some(x=>x.email==='ir@synthetic.example'));assert.equal(r.checkedAt,'2026-09-18T00:00:00.000Z');
 assert.ok(calls.every(x=>['data.sec.gov','www.sec.gov'].includes(new URL(x.url).hostname)));assert.ok(!calls.some(x=>/companyfacts|api\/chat/.test(x.url)));
 await assert.rejects(service.contacts({cik:'https://untrusted.example'}),/valid SEC CIK/);
});
