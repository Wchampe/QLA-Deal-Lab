(function(root){
'use strict';
const templates = [
 {id:'cash',name:'Cash + equity partner',senior:0,seller:0,rate:0,years:10,sellerRate:0,sellerYears:5,io:false,route:'Equity',notes:'No debt; outside equity dilutes ownership. Investor terms require negotiation.'},
 {id:'seller',name:'Seller-financed transition',senior:0,seller:0.6,rate:0,years:10,sellerRate:7,sellerYears:7,io:false,route:'Seller',notes:'Seller willingness, security, subordination, and transition terms are unknown.'},
 {id:'sba',name:'SBA 7(a) research case',senior:0.8,seller:0.1,rate:10.5,years:10,sellerRate:7,sellerYears:10,io:false,route:'SBA',notes:'Illustrative structure only. Confirm borrower eligibility, equity injection, seller-note treatment, fees, guarantees, and current SOP with lender. Single 7(a) loan capped at $5M.'},
 {id:'bank',name:'Conventional bank + seller',senior:0.55,seller:0.15,rate:9,years:7,sellerRate:7,sellerYears:7,io:false,route:'Bank',notes:'Bank appetite, collateral, covenants, guarantees, and cash-flow history determine terms.'},
 {id:'rural',name:'Rural lender research case',senior:0.65,seller:0.1,rate:9,years:10,sellerRate:7,sellerYears:10,io:false,route:'USDA',notes:'USDA route requires eligible rural location, lender and agency review, collateral, equity, and job/operating requirements.'},
 {id:'cdfi',name:'CDFI / state-supported lender',senior:0.5,seller:0.2,rate:9.5,years:7,sellerRate:7,sellerYears:7,io:false,route:'CDFI',notes:'CDFI mandate and local SSBCI participating-program rules vary. These are funding leads, not grants or program eligibility determinations.'},
 {id:'sponsor',name:'Sponsor equity + private credit',senior:0.5,seller:0.1,rate:12,years:7,sellerRate:8,sellerYears:5,io:true,route:'Private credit',notes:'Negotiate fees, warrants, covenants, preferred returns, and sponsor carry separately. Seller principal balloons in year 5.'},
 {id:'levered',name:'Higher leverage stress case',senior:0.7,seller:0.15,rate:13,years:5,sellerRate:9,sellerYears:5,io:true,route:'Private credit',notes:'High debt service and seller balloon. This template tests fragility, not lender availability.'}
];
function finite(n,label,min=0,max=Number.MAX_SAFE_INTEGER){if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw Error('Invalid '+label);return n;}
function loan(principal,rate,years,io=false){
 finite(principal,'principal');finite(rate,'rate',0,100);finite(years,'term',1,30);
 if(!Number.isInteger(years))throw Error('Term must be whole years');
 const r=rate/1200,n=years*12,pmt=principal===0?0:io?principal*r:r?principal*r/(1-Math.pow(1+r,-n)):principal/n;
 let balance=principal; const schedule=[];
 for(let y=1;y<=years;y++){let interest=0,paid=0,balloon=0;
  for(let m=0;m<12;m++){const i=balance*r;const p=io?0:Math.min(balance,Math.max(0,pmt-i));balance-=p;interest+=i;paid+=p+i;}
  if(io&&y===years){balloon=balance;paid+=balloon;balance=0;}
  if(balance<1e-6)balance=0;
  schedule.push({year:y,payment:paid,interest,balance,balloon});
 }
 return {monthly:pmt,schedule};
}
function analyze(d,t,b={cash:250000,external:0,minDscr:1.25},opts={}){
 ['price','fees','workingCapital','earnings','ownerPay','capex','taxes','wcAnnual'].forEach(k=>finite(d[k],k,k==='earnings'?-1e12:0));
 if(d.price<=0)throw Error('Asking price must be above zero');
 finite(b.cash,'buyer cash');finite(b.external,'external equity');finite(b.minDscr,'DSCR threshold',1,5);
 finite(t.senior,'senior share',0,1);finite(t.seller,'seller share',0,1);
 if(t.senior+t.seller>1+1e-9)throw Error('Debt shares exceed 100%');
 const stress=opts.stress??0,rateShock=opts.rateShock??0,hold=opts.hold??5,growth=opts.growth??0,exitMultiple=opts.exitMultiple??4,exitFee=opts.exitFee??0.04;
 finite(stress,'earnings stress',0,1);finite(rateShock,'rate shock',0,20);finite(hold,'hold',1,10);finite(growth,'growth',-0.5,0.5);finite(exitMultiple,'exit multiple',0,30);finite(exitFee,'exit fee',0,0.5);
 if(!Number.isInteger(hold))throw Error('Hold must be whole years');
 const uses=d.price+d.fees+d.workingCapital,senior=uses*t.senior,seller=uses*t.seller,equity=Math.max(0,uses-senior-seller);
 const buyer=Math.min(b.cash,equity),outsideNeeded=Math.max(0,equity-buyer),gap=Math.max(0,outsideNeeded-b.external);
 const seniorLoan=loan(senior,t.rate+rateShock,t.years),sellerLoan=loan(seller,t.sellerRate,t.sellerYears,t.io);
 const cfads=d.earnings*(1-stress)-d.ownerPay-d.capex-d.taxes-d.wcAnnual;
 const horizon=Math.max(t.years,t.sellerYears,hold),schedule=[];
 for(let y=1;y<=horizon;y++){
  const a=seniorLoan.schedule[y-1]||{payment:0,interest:0,balance:0,balloon:0};
  const s=sellerLoan.schedule[y-1]||{payment:0,interest:0,balance:0,balloon:0};
  const cash=d.earnings*(1-stress)*Math.pow(1+growth,y-1)-d.ownerPay-d.capex-d.taxes-d.wcAnnual;
  const debtService=a.payment+s.payment;
  schedule.push({year:y,cfads:cash,debtService,cashAfterDebt:cash-debtService,dscr:debtService?cash/debtService:null,balance:a.balance+s.balance,balloon:a.balloon+s.balloon,interest:a.interest+s.interest});
 }
 const first=schedule[0],worst=schedule.filter(x=>x.debtService>0).reduce((a,x)=>Math.min(a,x.dscr),Infinity);
 const warnings=[];
 if(d.demo)warnings.push('Fictional demo; no seller or verified financials.');
 if(d.evidence!=='Verified')warnings.push('Financial evidence is not independently verified.');
 if(d.metric==='SDE'&&d.ownerPay===0)warnings.push('SDE with no replacement-owner pay deduction; review owner dependence.');
 if(t.id==='sba'&&senior>5000000)warnings.push('Single 7(a) principal exceeds the published $5M cap.');
 if(t.route==='USDA'&&d.rural!=='Yes')warnings.push('Rural eligibility is unknown or not met.');
 if(cfads<=0)warnings.push('Operating cash does not cover the modeled deductions.');
 if(gap>0)warnings.push('Unfunded equity gap.');
 if(worst<b.minDscr)warnings.push('Debt coverage falls below your screening threshold in at least one year.');
 if(t.io&&seller>0)warnings.push('Seller principal balloons at maturity; refinance is not assumed.');
 const exitYear=schedule[hold-1],exitEarnings=d.earnings*(1-stress)*Math.pow(1+growth,hold);
 const ev=Math.max(0,exitEarnings*exitMultiple),saleNet=ev*(1-exitFee)-exitYear.balance;
 const ownership=equity>0?buyer/equity:0;
 return {uses,senior,seller,equity,buyer,outsideNeeded,gap,cfads,annualDebt:first.debtService,dscr:first.dscr,worstDscr:worst===Infinity?null:worst,
  cashAfterDebt:first.cashAfterDebt,cashOnCash:equity>0?first.cashAfterDebt/equity:null,ownership,
  status:gap>0?'Funding gap':(t.id==='sba'&&senior>5000000)?'Program mismatch':cfads<=0||worst<b.minDscr?'Cash-flow concern':'Screen only — verify terms',
  warnings,schedule,exit:{year:hold,ev,debt:exitYear.balance,netEquity:saleNet,buyerProceeds:Math.max(0,saleNet)*ownership,shortfall:Math.max(0,-saleNet),multiple:equity>0?Math.max(0,saleNet)/equity:null}};
}
function rank(d,t,m,down,b,now=Date.now()){
 const clamp=x=>Math.max(0,Math.min(1,x)),covered=x=>x.worstDscr===null?x.cfads>0:x.worstDscr>=b.minDscr;
 const age=(now-Date.parse(d.sourceDate))/86400000;
 const parts={funding:Math.round(25*(m.equity?clamp(1-m.gap/m.equity):1)),resilience:Math.round(30*(down.worstDscr===null?(down.cfads>0?1:0):clamp(down.worstDscr/b.minDscr))),yield:Math.round(20*clamp(m.cashAfterDebt/m.uses/.2)),evidence:d.demo?0:d.evidence==='Verified'?15:d.evidence==='Seller reported'?5:0,recency:!d.demo&&/^https?:\/\//i.test(d.sourceURL||'')&&age>=0?(age<=30?10:age<=90?5:0):0};
 const flags=[];if(m.gap>.01)flags.push('Funding gap');if(m.cfads<=0||!covered(m))flags.push('Base cash-flow concern');if(!covered(down))flags.push('Downside cash-flow concern');if(t.id==='sba'&&m.senior>5000000)flags.push('Program amount mismatch');if(t.route==='USDA'&&d.rural!=='Yes')flags.push('Rural program fit unresolved');const blocked=flags.length>0;
 if(d.demo)flags.push('Fictional demo');else if(d.evidence!=='Verified')flags.push('Financials unverified');if(m.outsideNeeded>0)flags.push('Outside equity assumed');
 return {score:Object.values(parts).reduce((a,b)=>a+b,0),parts,flags,blocked};
}
const api={loan,analyze,templates,rank};root.QLAFinance=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
