(function(root){
'use strict';
const clean=(value,max=1000)=>String(value??'').replace(/[\r\n\t]+/g,' ').trim().slice(0,max);
const bookScan='https://fliphtml5.com/zsqml/wjzm/Your_First_100_Million_(2nd_Edition)_-_Daniel_S._Pe%C3%B1a/';
const templates=[
 {id:'standard',name:'Standard company inquiry',description:'A general introduction using the company research and your acquisition interests.'},
 {id:'qla_initial',name:'QLA-inspired: initial owner approach',description:'Direct acquisition interest, room for continued owner involvement, and a short call.',sourceTitle:'Sample Acquisition Letter — Appendix M',sourceURL:bookScan+'260/'},
 {id:'qla_meeting',name:'QLA-inspired: request a meeting',description:'Explore the seller’s objectives and arrange the next conversation.',sourceTitle:'Acquisition Target Letter — Appendix M',sourceURL:bookScan+'261/'}
];
function template(id){return templates.find(x=>x.id===id)||templates[0];}
function url(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}}
function email(value){const s=String(value||'').trim();return s.length<=254&&/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,}$/i.test(s)?s:'';}
function identity(record){return record.company||{name:record.name,industry:record.industry,location:record.location,website:record.website};}
function roles(record){
 if(!record.company)return [
  {role:'Owner / founder / president',reason:'Start with the person who can discuss an ownership transition.'},
  {role:'General manager or company office',reason:'Ask to be directed to the owner if no public owner email is listed.'}
 ];
 const rows=record.analysis?.target==='division_or_assets'?
  [{role:'Head of corporate development / M&A',reason:'Ask who handles potential divestitures of the division or assets.'},{role:'CFO',reason:'Can route an acquisition inquiry to the appropriate decision maker.'}]:
  [{role:'CEO / CFO',reason:'Ask whether an ownership discussion would be appropriate and who should handle it.'},{role:'Head of corporate development',reason:'Can route a strategic acquisition inquiry internally.'}];
 if(record.analysis?.status==='announced_process')rows.unshift({role:'Contact named for the transaction process',reason:'Check the announcement for the designated company contact or adviser and the inquiry procedure.'});
 rows.push({role:'Investor relations',reason:'Use the published business mailbox to request an introduction; this is a routing contact.'});
 return rows;
}
function reference(record){
 const findings=(record.analysis?.findings||[]).filter(f=>f.specificity==='current_event'&&['strategic_review','asset_disposal'].includes(f.kind)&&url(f.url));
 return findings.sort((a,b)=>String(b.filed).localeCompare(String(a.filed)))[0]||null;
}
function draft(record,input={},blocked=false){
 if(blocked)throw Error('This business is marked Do not contact.');
 const c=identity(record),name=clean(c.name,160),selectedTemplate=template(input.templateId),scope=['company','division_or_assets','exploratory'].includes(input.scope)?input.scope:record.analysis?.target==='division_or_assets'?'division_or_assets':record.company?'exploratory':'company';
 const asset=clean(input.asset,200),recipient=clean(input.recipientName,120),sender=clean(input.senderName,120)||'[Your name]',organization=clean(input.senderCompany,160);
 const intro=clean(input.buyerIntro,800)||"I'm exploring a potential acquisition and wanted to introduce myself.";
 const context=clean(input.personalNote,1200)||(c.industry?`I came across ${name}'s work in ${clean(c.industry,160)}${c.location?' in '+clean(c.location,100):''}.`:`I came across ${name}${c.location?' in '+clean(c.location,100):''} and would like to learn more about the business.`);
 const ref=reference(record),filing=ref?` I read your ${clean(ref.form,30)} filed on ${clean(ref.filed,10)} and wanted to ask about your current plans.`:'';
 const target=scope==='division_or_assets'?(asset?`${asset} within ${name}`:`a division or selected assets of ${name}`):scope==='company'?name:`${name} or part of its business`;
 let ask=`Would you be open to a brief, confidential conversation about a potential sale of ${target}? I realize you may not be considering a sale, and I would be happy to work around your timing.`;
 if(selectedTemplate.id==='qla_initial')ask='Would an ownership discussion be timely? Continued involvement by the current owner or management team is something we could explore.';
 if(selectedTemplate.id==='qla_meeting')ask='Could we schedule a meeting to explore a potential sale? I would like to understand your objectives, timing, and what a workable transition would look like.';
 if(record.analysis?.status==='announced_process')ask=`Are you currently accepting acquisition inquiries concerning ${target}? If so, I would appreciate learning who is managing the process and the appropriate next step.`;
 if(record.analysis?.status==='transaction_agreed_or_completed')ask=`If the previously disclosed transaction has concluded or is already committed, are there any other operations or assets at ${name} you would consider discussing? I would appreciate being directed to the appropriate person if so.`;
 let subject=scope==='division_or_assets'?`Acquisition inquiry — ${name}${asset?' / '+asset:''}`:`Confidential acquisition inquiry — ${name}`;
 if(selectedTemplate.id==='qla_meeting')subject=`Acquisition discussion — ${name}${asset&&scope==='division_or_assets'?' / '+asset:''}`;
 const introduction=selectedTemplate.id==='standard'?`My name is ${sender}${organization?' with '+organization:''}. ${intro}`:`I'm ${sender}${organization?' with '+organization:''}. I'm contacting you about a possible acquisition of ${target}.${input.buyerIntro?' '+clean(input.buyerIntro,800):''}`;
 const closing=selectedTemplate.id==='standard'?'If someone else handles these conversations, could you point me in the right direction? Would a short introductory call be convenient?':'We can start with a private conversation, without exchanging sensitive information. Please suggest a convenient time or the right person to contact.';
 const body=[recipient?`Hello ${recipient},`:'Hello,',introduction,context+filing,ask,closing,'Thank you,\n'+sender+(organization?'\n'+organization:'')+(input.signature?'\n'+String(input.signature).trim().slice(0,800):'')].join('\n\n');
 return {subject,body,scope,templateId:selectedTemplate.id,reference:ref?{url:ref.url,filed:ref.filed,form:ref.form}:null};
}
function searchLinks(record){const c=identity(record),name='"'+clean(c.name,160)+'"';return [
 ...(url(c.website)?[{label:'Company website',url:url(c.website)}]:[]),
 ...(url(c.investorWebsite)?[{label:'Investor relations website',url:url(c.investorWebsite)}]:[]),
 {label:'Find company leadership',url:'https://www.google.com/search?q='+encodeURIComponent(name+' '+(record.company?'leadership CFO corporate development':'owner founder president'))},
 {label:'Find public business email',url:'https://www.google.com/search?q='+encodeURIComponent(name+' '+(record.company?'investor relations contact email':'contact email'))}
 ];}
const api={url,email,identity,roles,reference,draft,searchLinks,templates,template};
if(typeof module==='object'&&module.exports)module.exports=api;else root.QLAOutreach=api;
})(typeof window!=='undefined'?window:globalThis);
