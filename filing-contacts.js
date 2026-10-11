'use strict';
// Extract explicit public contact blocks and issuer signatures. Never infer email patterns.
const A=require('./filing-analysis'),O=require('./outreach');
const rolePattern=/\b(?:chief (?:executive|financial|operating) officer|(?:executive |senior )?vice president[^.;|\n]{0,60}|president(?: and chief [a-z ]+ officer)?|head of corporate development|director of (?:investor relations|corporate development)|investor relations|corporate development|CEO|CFO)\b/i;
const headingPattern=/\b(?:investor (?:relations|contacts?)|company contacts?|corporate contacts?|transaction contacts?|acquisition inquiries|media contacts?|press contacts?|contacts?\s*:)/i;
function linesFromHTML(html){
 return String(html).replace(/<!--[^]*?-->/g,' ').replace(/<(script|style|ix:hidden|ix:header|head)\b[^>]*>[^]*?<\/\1\s*>/gi,' ')
 .replace(/<a\b[^>]*href\s*=\s*["']mailto:([^"'?]+)(?:\?[^"']*)?["'][^>]*>/gi,(all,value)=>'<a>'+A.textFromHTML(value)+' ')
 .replace(/<\/(?:p|div|tr|li|h[1-6])\s*>|<br\b[^>]*>/gi,'\n').split(/\r?\n/).map(A.textFromHTML).filter(Boolean);
}
function person(value){
 const s=String(value).replace(/^(?:By\s*:\s*)?(?:\/s\/\s*|Name\s*:\s*)/i,'').split(/\s*[,|()]\s*|\s+Title\s*:/i)[0].trim();
 if(/\b(?:contact|relations|investor|media|company|corporation|inc|llc|limited|group|chief|officer|president|counsel|signature|email|phone|tel|by|name|title|corporate|development)\b/i.test(s))return '';
 return /^[\p{Lu}][\p{L}.'’\-]+(?:\s+(?:[\p{Lu}][\p{L}.'’\-]*|van|von|de|del)){1,4}$/u.test(s)?s:'';
}
function companyMatch(text,name){const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');const needle=norm(name);return needle.length>=4&&norm(text).includes(needle);}
function extract(company,doc,html){
 const lines=linesFromHTML(html),found=[],source={sourceURL:doc.url,sourceDate:doc.filed,sourceLabel:doc.form};
 for(let i=0;i<lines.length;i++){
  const line=lines[i];
  // A signature is usable only in the issuer's own signature section, not in a contract exhibit.
  if(!/exhibit/i.test(doc.form)&&/(?:\/s\/|^Name\s*:)/i.test(line)){
   const before=lines.slice(Math.max(0,i-10),i+1).join(' '),tail=lines.slice(i,i+4).join(' '),name=person(line.replace(/^.*?\/s\/\s*/i,'')),role=tail.match(rolePattern)?.[0];
   if(name&&role&&companyMatch(before,company.name)&&/signatures?/i.test(lines.slice(Math.max(0,i-18),i+1).join(' ')))found.push({...source,name,role,email:'',kind:'executive',quote:tail.slice(0,700)});
  }
  const emails=[...line.matchAll(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,}/gi)].map(m=>O.email(m[0])).filter(Boolean);
  if(!emails.length)continue;
  // Stop at a preceding email so adjacent investor/media contacts do not share a name.
  let start=i;while(start>0&&i-start<5&&!/@/.test(lines[start-1]))start--;
  const block=lines.slice(start,i+1),joined=block.join('\n'),heading=[...joined.matchAll(new RegExp(headingPattern.source,'gi'))].at(-1);
  if(!heading||joined.length>1400)continue;
  const contactText=joined.slice(heading.index),media=/^(?:media|press)\b/i.test(heading[0]);
  const names=[...new Set(contactText.split('\n').flatMap(candidate=>{if(companyMatch(candidate,company.name))return [];const parsed=person(candidate.replace(headingPattern,'').replace(/^\s*[:\-]\s*/,''));return parsed?[parsed]:[];}))];
  const name=names.length===1?names[0]:'';
  const role=contactText.slice(heading[0].length).match(rolePattern)?.[0]||(media?'Media contact':/investor/i.test(heading[0])?'Investor relations contact':'Published business contact');
  const ambiguous=new Set(emails).size>1||names.length>1;
  for(const email of emails){if(/^(?:no[-_.]?reply|unsubscribe|privacy|abuse)@/i.test(email))continue;found.push({...source,name:ambiguous?'':name,role:ambiguous?'Published contact — check role in excerpt':role,email,kind:media?'media':'published_email',quote:contactText});}
 }
 return merge(found);
}
function merge(contacts){
 const rows=[],seen=new Set();
 for(const c of contacts.slice().sort((a,b)=>String(b.sourceDate).localeCompare(String(a.sourceDate)))){
  const key=c.email?'email:'+c.email.toLowerCase():'person:'+c.name.toLowerCase()+'|'+c.role.toLowerCase();
  if(seen.has(key))continue;seen.add(key);rows.push(c);
 }
 return rows.sort((a,b)=>(a.kind==='media'?2:a.email?0:1)-(b.kind==='media'?2:b.email?0:1)).slice(0,24);
}
module.exports={extract,merge,linesFromHTML};
