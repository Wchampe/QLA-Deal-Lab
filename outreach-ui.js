'use strict';
const outreachBusy=new Set();
function outreachRecord(kind,id){return kind==='filing'?state.filings?.companies.find(x=>x.id===id):state.intelligence?.entities.find(x=>x.id===id);}
function outreachProspect(record,kind){
 const source=kind==='filing'?'https://www.sec.gov/edgar/browse/?CIK='+Number(record.company.cik):record.website;
 const matches=(state.prospects||[]).filter(p=>kind==='filing'?p.filingsId===record.id||QLADiscovery.canonical(p.url)===QLADiscovery.canonical(source):p.intelligenceId===record.id||p.id===record.prospectId||source&&QLADiscovery.canonical(p.url)===QLADiscovery.canonical(source));
 return matches.find(p=>p.status==='Do not contact')||matches[0];
}
function outreachBlocked(record,kind){return outreachProspect(record,kind)?.status==='Do not contact'||kind==='manual'&&QLAIntelligence.assess(record,intelligenceStore().evidence).suppressed;}
function outreachContacts(record){
 const seen=new Set();return [...(record.contactResearch?.contacts||[]),...(record.contacts||[])].sort((a,b)=>String(b.sourceDate).localeCompare(String(a.sourceDate))).filter(c=>{
  const key=String(c.email||c.name+'|'+c.role).toLowerCase();if(seen.has(key))return false;seen.add(key);return true;
 }).slice(0,24);
}
function outreachValues(record,kind){
 const p=outreachProspect(record,kind),saved=record.outreach||{};
 const values={...state.outreachProfile,templateId:'standard',recipientName:p?.contactName||'',recipientRole:'',recipientEmail:p?.email||'',recipientSource:p?.contactSource||'',scope:record.analysis?.target==='division_or_assets'?'division_or_assets':kind==='filing'?'exploratory':'company',asset:'',personalNote:'',...saved};
 values.templateId=QLAOutreach.template(values.templateId).id;
 if(!outreachBlocked(record,kind)){const generated=QLAOutreach.draft(record,values);values.subject??=generated.subject;values.body??=generated.body;}
 return values;
}
function outreachTemplateNote(id){
 const t=QLAOutreach.template(id);
 return `${esc(t.description)}${t.sourceURL?` QLA-inspired adaptation; original wording for this app. Reference: ${link(t.sourceURL,t.sourceTitle+' (third-party book scan)')}. ${link('https://www.danpena.co.uk/downloads/','Dan Peña’s official downloads')}. Not an official or endorsed template.`:''}`;
}
function outreachPanel(record,kind){
 const O=QLAOutreach,blocked=outreachBlocked(record,kind),contacts=outreachContacts(record),v=outreachValues(record,kind),busy=outreachBusy.has(kind+':'+record.id),roles=O.roles(record),ref=O.reference(record);
 return `<section class="outreachPanel" data-outreach-kind="${kind}" data-outreach-id="${esc(record.id)}">
 <h3>Sale inquiry email & company contacts</h3>
 ${blocked?'<p class="notice">This business is marked Do not contact. Email drafting, copying and contact actions are disabled.</p>':'<p>Start a conversation about a possible sale. Review the recipient and edit the draft before using it.</p>'}
 <h4>Who to email</h4><p><strong>${esc(roles[0].role)}</strong> — ${esc(roles[0].reason)}</p>
 ${contacts.length?table(['Contact / role','Published email','Source','Choose'],contacts.map((c,i)=>[`${esc(c.name||c.role)}<small>${esc(c.name?c.role:c.kind==='media'?'Media routing only':'Routing contact; may be an external representative')}</small>`,c.email?esc(c.email):'<span class="sub">No email published in this source</span>',`${link(c.sourceURL,(c.sourceLabel||'Source')+' · '+(c.sourceDate||'Date unknown'))}<details><summary>Contact excerpt</summary><p class="sub">${esc(c.quote)}</p></details>`,`<button type="button" class="secondary" data-outreach-action="choose" data-contact-index="${i}" ${blocked?'disabled':''}>Use contact</button>`])):'<p class="sub">No named contact or public email found in the saved sources. Look up contacts or use the company links below, then enter a contact and its source.</p>'}
 <div class="actions">${kind==='filing'?`<button type="button" data-outreach-action="contacts" class="secondary" ${busy||blocked?'disabled':''}>${busy?'Checking recent filings…':'Find public contacts'}</button>`:''}${O.searchLinks(record).map(x=>link(x.url,x.label)).join(' · ')}</div>
 <p class="sub">${record.contactResearch?`Last contact check: ${esc(record.contactResearch.checkedAt)} · ${Number(record.contactResearch.documentsChecked)||0} documents. `:''}Contact names and emails come from published source text. Confirm the current role and affiliation; a listed adviser or investor-relations representative may be outside the company. An absent email is never guessed.</p>
 ${(record.contactResearch?.warnings||[]).map(w=>`<p class="sub">${esc(w)}</p>`).join('')}
 <details><summary>Other people who can route the inquiry</summary>${roles.slice(1).map(x=>`<p><strong>${esc(x.role)}</strong> — ${esc(x.reason)}</p>`).join('')}</details>
 <form data-outreach-form><fieldset ${blocked?'disabled':''}>
 <label>Email template<select name="templateId">${options(O.templates,v.templateId)}</select></label>
 <p class="sub" data-outreach-template-note>${outreachTemplateNote(v.templateId)}</p>
 <div class="fieldgrid">
 <label>Recipient name<input name="recipientName" maxlength="120" value="${esc(v.recipientName)}" placeholder="Name from the company source"></label>
 <label>Recipient role<input name="recipientRole" maxlength="160" value="${esc(v.recipientRole)}" placeholder="Owner, CFO, corporate development, investor relations"></label>
 <label>Public business email<input name="recipientEmail" type="email" maxlength="254" value="${esc(v.recipientEmail)}" placeholder="Leave blank if not published"></label>
 <label>Contact source URL<input name="recipientSource" type="url" maxlength="2000" value="${esc(v.recipientSource)}" placeholder="Company page or filing with this contact"></label>
 <label>What you want to acquire<select name="scope">${options([{id:'exploratory',name:'Explore the company or part of it'},{id:'company',name:'Whole company / ownership'},{id:'division_or_assets',name:'A division or specific assets'}],v.scope)}</select></label>
 <label>Division / assets of interest (optional)<input name="asset" maxlength="200" value="${esc(v.asset)}" placeholder="Equipment division, a facility, etc."></label>
 </div>
 <details><summary>Your introduction & company-specific details</summary><div class="fieldgrid">
 <label>Your name<input name="senderName" maxlength="120" value="${esc(v.senderName)}" placeholder="Your name"></label>
 <label>Your company (optional)<input name="senderCompany" maxlength="160" value="${esc(v.senderCompany)}"></label>
 <label class="full">Your acquisition introduction (optional)<textarea name="buyerIntro" rows="2" maxlength="800" placeholder="Your background and what you are looking to acquire">${esc(v.buyerIntro)}</textarea></label>
 <label class="full">Why this company interests you (optional)<textarea name="personalNote" rows="2" maxlength="1200" placeholder="A specific product, service, location, or reason for your interest">${esc(v.personalNote)}</textarea></label>
 <label class="full">Signature details (optional)<textarea name="signature" rows="2" maxlength="800" placeholder="Your phone, website, or other contact information">${esc(v.signature)}</textarea></label>
 </div></details>
 <div class="actions"><button type="button" data-outreach-action="generate">Generate / refresh draft</button><button type="button" data-outreach-action="queue" class="secondary">Save contact to call queue</button></div>
 <p class="sub">Refreshing replaces the draft below with your current introduction and company details. ${ref?`Company reference: ${link(ref.url,ref.form+' · '+ref.filed)}. `:''}Drafts use company details and your inputs; seller interest remains a question.</p>
 <label>Email subject<input name="subject" maxlength="500" value="${blocked?'':esc(v.subject)}"></label>
 <label>Editable email draft<textarea name="body" rows="15" maxlength="16000" placeholder="Generate a draft to begin.">${blocked?'':esc(v.body)}</textarea></label>
 <div class="actions"><button type="button" data-outreach-action="copy" class="secondary">Copy email</button><button type="button" data-outreach-action="download" class="secondary">Download email</button><button type="submit" class="secondary">Save draft</button></div>
 </fieldset><p class="sub" data-outreach-status aria-live="polite">${v.updatedAt?'Saved draft · '+esc(v.updatedAt):'Edits save in this browser and are included in workspace backups.'} No email is sent from this app.</p></form></section>`;
}
function outreachCapture(panel,validate=false){
 const kind=panel.dataset.outreachKind,record=outreachRecord(kind,panel.dataset.outreachId);
 if(!record)throw Error('This company is no longer in the workspace.');
 if(outreachBlocked(record,kind))throw Error('This business is marked Do not contact.');
 const raw=Object.fromEntries(new FormData(panel.querySelector('[data-outreach-form]')));
 if(validate){
  if(raw.recipientEmail&&!QLAOutreach.email(raw.recipientEmail))throw Error('Enter a valid published business email or leave it blank.');
  if(raw.recipientSource&&!QLAOutreach.url(raw.recipientSource))throw Error('Use an HTTP or HTTPS contact source URL.');
  if(raw.recipientEmail&&!QLAOutreach.url(raw.recipientSource))throw Error('Add the source URL for the recipient email.');
 }
 record.outreach={...raw,updatedAt:new Date().toISOString()};
 state.outreachProfile=Object.fromEntries(['senderName','senderCompany','buyerIntro','signature'].map(k=>[k,raw[k]||'']));
 if(!save())throw Error('The draft could not be saved. Export your workspace before continuing.');
 panel.querySelector('[data-outreach-status]').textContent='Saved in this browser. No email has been sent.';
 return {record,kind,raw};
}
function outreachSaveQueue(record,kind,raw){
 if(outreachBlocked(record,kind))throw Error('This business is marked Do not contact.');
 if(!raw.recipientName&&!raw.recipientEmail)throw Error('Choose or enter a public contact first.');
 if(!QLAOutreach.url(raw.recipientSource))throw Error('Add the source URL for this contact.');
 let p=outreachProspect(record,kind);
 if(!p){
  const c=QLAOutreach.identity(record),source=kind==='filing'?'https://www.sec.gov/edgar/browse/?CIK='+Number(c.cik):c.website||raw.recipientSource;
  const merged=QLASourcing.queueMerge(state.prospects||[],{title:c.name,url:source,lane:kind==='filing'?'Filing intelligence':'Off-market intelligence'});
  const candidate=merged.rows.find(x=>x.id===merged.id);
  if(candidate.status==='Do not contact')throw Error('This business is marked Do not contact.');
  if(candidate.filingsId&&candidate.filingsId!==record.id||candidate.intelligenceId&&candidate.intelligenceId!==record.id)throw Error('This source is already linked to another company. Use this company’s official website.');
  state.prospects=merged.rows;p=candidate;
 }
 if(kind==='filing')p.filingsId=record.id;else{p.intelligenceId=record.id;record.prospectId=p.id;}
 Object.assign(p,{contactName:raw.recipientName||raw.recipientRole,email:raw.recipientEmail,contactSource:raw.recipientSource,contactRole:raw.recipientRole});
 if(save())notify('Contact saved to the call queue. Record any actual response there.',true);
}
document.addEventListener('input',event=>{
 const panel=event.target.closest('[data-outreach-kind]');if(!panel||!event.target.closest('[data-outreach-form]'))return;
 try{outreachCapture(panel);if(event.target.name==='templateId')panel.querySelector('[data-outreach-template-note]').innerHTML=outreachTemplateNote(event.target.value);}catch(e){notify(e.message);}
});
document.addEventListener('submit',event=>{
 if(!event.target.matches('[data-outreach-form]'))return;event.preventDefault();
 try{outreachCapture(event.target.closest('[data-outreach-kind]'),true);notify('Email draft saved.',true);}catch(e){notify(e.message);}
});
document.addEventListener('click',async event=>{
 const b=event.target.closest('[data-outreach-action]');if(!b)return;
 const panel=b.closest('[data-outreach-kind]'),action=b.dataset.outreachAction;
 try{
  const {record,kind,raw}=outreachCapture(panel,!['contacts','choose'].includes(action));
  if(action==='choose'){
   const c=outreachContacts(record)[Number(b.dataset.contactIndex)];if(!c)throw Error('Contact no longer available.');
   const form=panel.querySelector('form');for(const [k,v] of Object.entries({recipientName:c.name||'',recipientRole:c.role||'',recipientEmail:c.email||'',recipientSource:c.sourceURL||''}))form.elements[k].value=v;
   outreachCapture(panel);notify('Recipient selected. Refresh the draft to update its greeting.',true);
  }
  if(action==='generate'){
   const generated=QLAOutreach.draft(record,raw),form=panel.querySelector('form');form.elements.subject.value=generated.subject;form.elements.body.value=generated.body;outreachCapture(panel,true);notify('Company-specific email draft saved.',true);
  }
  if(action==='queue')outreachSaveQueue(record,kind,raw);
  if(action==='copy'||action==='download'){
   if(!raw.subject.trim()||!raw.body.trim())throw Error('Add an email subject and message first.');
   const message=(raw.recipientEmail?'To: '+raw.recipientEmail+'\n':'')+'Subject: '+raw.subject+'\n\n'+raw.body;
   if(action==='download')download('sale-inquiry-'+record.id+'-'+date()+'.txt',message,'text/plain');
   else{try{await navigator.clipboard.writeText(message);notify('Email copied. Review it in your email app before sending.',true);}catch{throw Error('Clipboard unavailable. Use Download email or select and copy the draft text.');}}
  }
  if(action==='contacts'){
   const key=kind+':'+record.id;if(outreachBusy.has(key))return;const workspace=state;outreachBusy.add(key);b.disabled=true;b.textContent='Checking recent filings…';
   try{
    const result=await api('/api/filings/contacts',{cik:record.company.cik});
    if(state!==workspace)throw Error('Workspace changed. Run the contact lookup again in the current workspace.');
    const current=outreachRecord(kind,record.id);if(!current)throw Error('This company was removed while contacts were collected.');
    current.contactResearch=result;current.company={...current.company,website:result.company.website,investorWebsite:result.company.investorWebsite,phone:result.company.phone};
    if(save())notify(result.contacts.length?`${result.contacts.length} public contact candidates found. Review their source and current role.`:'No contacts found in the checked filings. Use the company links to find a public contact.',true);
   }finally{outreachBusy.delete(key);if(state===workspace&&page==='intelligence')render();}
  }
 }catch(e){notify(e.message);}
});
