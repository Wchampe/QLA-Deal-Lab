(function(root){
const cases=[
  {
    "id": "metal",
    "name": "Metal Shorts — SBA-financed succession",
    "type": "SBA-published owner story",
    "url": "https://legacy.sba.gov/success-story/sba-funding-helped-seattle-business-transfer-ownership-continue-grow",
    "facts": "Debbie Kepl knew the business through prior employment. A retiring owner suggested the acquisition. Initial lenders declined; a local SBA lender supported the 2010 purchase using 7(a). Later owner training and a growth plan supported development.",
    "unknown": "Price, leverage, seller note, diligence, closing calendar, and loan terms are not disclosed. Historical credit eligibility does not establish current eligibility.",
    "lesson": "Document operator experience and seller motivation; research suitable lenders after a decline; carry the plan into post-close operations.",
    "phases": [
      "thesis",
      "source",
      "financing",
      "growth"
    ]
  },
  {
    "id": "butcherine",
    "name": "Butcherine’s Distributor — family seller financing",
    "type": "University SBDC account · Jan 26, 2022",
    "url": "https://www.entrepreneur.pitt.edu/sbdc-success-story-butcherines-distributor/",
    "facts": "Natalie and Adam Clark sought SBDC assistance in July 2021. Advisers reviewed their business/marketing plan and projections. The buyers chose seller financing for a purchase from Natalie’s parents.",
    "unknown": "Loan economics, purchase price, signed closing documents, and a complete timeline are not published.",
    "lesson": "Compare financing paths against a supported operating plan. Family familiarity does not replace written terms and evidence.",
    "phases": [
      "team",
      "structure",
      "financing",
      "day100"
    ]
  },
  {
    "id": "funeral",
    "name": "New Hyde Park Funeral Home — lender cash-flow review",
    "type": "Lender-published acquisition spotlight",
    "url": "https://www.liveoak.bank/business-loans/funeral-home-cemetery/",
    "facts": "Mike McBride found an acquisition opportunity after experience in funeral services. Live Oak describes an early visit and working with the seller on cash flow and sustainable debt.",
    "unknown": "Purchase price, rates, leverage, full underwriting file, and closing date are not disclosed. This is a lender marketing account.",
    "lesson": "Involve an industry-experienced lender early and reconcile seller expectations with debt capacity.",
    "phases": [
      "team",
      "screen",
      "structure",
      "financing"
    ]
  },
  {
    "id": "franchise",
    "name": "Mall-based franchise — coordinated closing consents",
    "type": "Transaction counsel account · Feb 2, 2026",
    "url": "https://www.lavellelaw.com/success-story-smooth-acquisition-of-fast-food-franchise-assets",
    "facts": "Lavelle Law reports an asset acquisition involving a seller, franchisor, mall leasing agency, and bank. Counsel coordinated franchise approvals, lease obligations, transfer terms, and lender conditions; the firm reports a completed closing.",
    "unknown": "Business name, purchase price, financing economics, consent documents, and duration are not published.",
    "lesson": "Track third-party consents as closing dependencies with responsible people and evidence.",
    "phases": [
      "diligence",
      "contracts",
      "closing",
      "day1"
    ]
  },
  {
    "id": "medical",
    "name": "Medical transport add-on — earnings normalization",
    "type": "Diligence adviser account · Feb 12, 2026",
    "url": "https://weaver.com/resources/success-story-supporting-strategic-growth-in-emergency-services/",
    "facts": "Weaver describes add-on diligence involving three entities and related-party activity. Work included cash-to-accrual adjustments, collections, standalone costs, and working capital to inform price and financing.",
    "unknown": "Buyer/target identities, price, debt structure, realized returns, and a full closing record are not disclosed.",
    "lesson": "A negotiated EBITDA multiple is insufficient until the earnings base, standalone costs, and working capital are reconciled.",
    "phases": [
      "screen",
      "diligence",
      "financing",
      "day100"
    ]
  }
];
const phases=[
  {
    "id": "thesis",
    "name": "Acquisition thesis",
    "owner": "Buyer / industry adviser",
    "deps": [],
    "days": 7,
    "gate": "Approve a target profile and supportable capital budget.",
    "tasks": [
      "Choose industry, geography and size bands",
      "Define operating role, cash and outside-equity assumptions",
      "Record walk-away conditions and downside floor"
    ],
    "docs": [
      "Acquisition thesis",
      "Buyer capital and experience summary"
    ]
  },
  {
    "id": "team",
    "name": "Dream team and mandates",
    "owner": "Buyer",
    "deps": [
      "thesis"
    ],
    "days": 14,
    "gate": "Assign accountable advisers and an operating lead.",
    "tasks": [
      "Identify chair/industry adviser and operator",
      "Engage transaction counsel and diligence accountant",
      "Record scopes, conflicts, references and decision authority"
    ],
    "docs": [
      "Team roles and engagement scopes",
      "Conflicts and credentials review"
    ]
  },
  {
    "id": "source",
    "name": "Sourcing and qualification",
    "owner": "Marketplace Scout / buyer",
    "deps": [
      "thesis"
    ],
    "days": 21,
    "gate": "Retain a traceable target and plausible seller.",
    "tasks": [
      "Search marketplaces, brokers and industry referrals",
      "Deduplicate and record source/date and seller mandate",
      "Classify company sale versus asset or government signal"
    ],
    "docs": [
      "Source record and seller mandate",
      "Initial target fit note"
    ]
  },
  {
    "id": "nda",
    "name": "Contact and information access",
    "owner": "Buyer / counsel",
    "deps": [
      "source"
    ],
    "days": 28,
    "gate": "Establish authorized access and screening evidence.",
    "tasks": [
      "Prepare and review initial inquiry",
      "Agree confidentiality and adviser access",
      "Request financials, ownership, assets and seller objectives"
    ],
    "docs": [
      "Confidentiality agreement or counsel-approved alternative",
      "Initial information package"
    ]
  },
  {
    "id": "screen",
    "name": "Preliminary underwriting",
    "owner": "Financial Underwriter / CPA",
    "deps": [
      "nda"
    ],
    "days": 35,
    "gate": "Decide whether standalone economics justify further work.",
    "tasks": [
      "Normalize SDE/EBITDA and owner replacement costs",
      "Model uses, capex, taxes and working capital",
      "Stress earnings, rates and concentration; record missing data"
    ],
    "docs": [
      "Preliminary financial model",
      "Earnings adjustments and evidence log"
    ]
  },
  {
    "id": "structure",
    "name": "Capital structure and valuation",
    "owner": "Funding Matchmaker / buyer",
    "deps": [
      "screen",
      "team"
    ],
    "days": 42,
    "gate": "Select conditional financing and maximum supportable price.",
    "tasks": [
      "Compare debt, seller financing and equity",
      "Separate business, fixed-asset and working-capital uses",
      "Record guarantee, balloon, covenant and dilution questions"
    ],
    "docs": [
      "Sources and uses schedule",
      "Financing route and valuation memo"
    ]
  },
  {
    "id": "loi",
    "name": "Indication of interest / LOI",
    "owner": "Buyer / counsel",
    "deps": [
      "structure"
    ],
    "days": 49,
    "gate": "Agree the basis for diligence and conditional transaction terms.",
    "tasks": [
      "Define perimeter, price mechanism and working-capital basis",
      "Negotiate exclusivity, deposits, access and financing conditions",
      "Review binding and nonbinding provisions with counsel"
    ],
    "docs": [
      "Counsel-reviewed LOI or alternative offer structure",
      "Diligence scope and timetable"
    ]
  },
  {
    "id": "diligence",
    "name": "Confirmatory diligence",
    "owner": "CPA / counsel / operator",
    "deps": [
      "loi"
    ],
    "days": 77,
    "gate": "Resolve material financial, operating and legal issues.",
    "tasks": [
      "Reconcile bank, tax, accrual and related-party records",
      "Review customers, permits, staff, leases, cyber, claims and liens",
      "Quantify red flags, remediation, price changes and integration costs"
    ],
    "docs": [
      "Quality of earnings and working-capital analysis",
      "Legal and operational diligence issue register"
    ]
  },
  {
    "id": "financing",
    "name": "Underwriting and commitments",
    "owner": "Lender / capital specialist",
    "deps": [
      "structure"
    ],
    "days": 84,
    "gate": "Document funding and all remaining conditions.",
    "tasks": [
      "Provide application, buyer evidence and lender package",
      "Compare written debt/equity terms and verify eligibility",
      "Resolve equity evidence, seller-note treatment and conditions"
    ],
    "docs": [
      "Written debt and equity commitments",
      "Lender conditions and equity evidence tracker"
    ]
  },
  {
    "id": "contracts",
    "name": "Definitive agreements and consents",
    "owner": "Transaction counsel",
    "deps": [
      "loi",
      "diligence"
    ],
    "days": 91,
    "gate": "Have reviewed agreements and a complete consent plan.",
    "tasks": [
      "Negotiate purchase agreement, disclosures and indemnities",
      "Secure landlord, franchisor, customer and regulatory consents as applicable",
      "Finalize transition, employment, seller-note and escrow terms"
    ],
    "docs": [
      "Definitive agreement and disclosure schedules",
      "Third-party consent and transfer checklist"
    ]
  },
  {
    "id": "closing",
    "name": "Closing readiness and completion",
    "owner": "Counsel / lender / buyer",
    "deps": [
      "financing",
      "contracts"
    ],
    "days": 98,
    "gate": "Close after accountable professionals confirm conditions.",
    "tasks": [
      "Reconcile final uses, adjustments, payoff and lien releases",
      "Independently verify payment instructions with known counterparties",
      "Record signed documents, receipts and transfer completion"
    ],
    "docs": [
      "Final closing statement and funds-flow approval",
      "Executed closing set and transfer confirmations"
    ]
  },
  {
    "id": "day1",
    "name": "Day 1–30 stabilization",
    "owner": "Acquisition operator",
    "deps": [
      "closing"
    ],
    "days": 128,
    "gate": "Keep cash, customers, people and operating access stable.",
    "tasks": [
      "Transfer banking controls, insurance, payroll and systems access",
      "Introduce ownership to staff and key customers",
      "Run weekly cash review and confirm seller handover"
    ],
    "docs": [
      "Day-one readiness and access checklist",
      "30-day cash and customer retention review"
    ]
  },
  {
    "id": "day100",
    "name": "Day 31–100 integration",
    "owner": "Operator / integration lead",
    "deps": [
      "day1"
    ],
    "days": 198,
    "gate": "Measure results against underwriting and settle adjustments.",
    "tasks": [
      "Compare actual margins, cash, churn and capex with forecasts",
      "Complete working-capital true-up and integration milestones",
      "Close operational gaps and assign improvement experiments"
    ],
    "docs": [
      "100-day operating scorecard",
      "Post-close adjustment and integration register"
    ]
  },
  {
    "id": "growth",
    "name": "Ownership, improvement and add-ons",
    "owner": "Operator / board",
    "deps": [
      "day100"
    ],
    "days": 365,
    "gate": "Demonstrate repeatable operations before expanding leverage.",
    "tasks": [
      "Review covenants, cash runway and leadership capacity",
      "Validate improvements with actual results",
      "Screen add-ons for standalone economics and integration capacity"
    ],
    "docs": [
      "Quarterly board and lender reporting",
      "Add-on thesis or organic growth plan"
    ]
  },
  {
    "id": "exit",
    "name": "Exit preparation and sale",
    "owner": "Owner / M&A adviser / counsel",
    "deps": [
      "growth"
    ],
    "days": 730,
    "gate": "Prepare a supportable exit and reconcile post-sale obligations.",
    "tasks": [
      "Build buyer universe, normalized earnings and transferable management",
      "Run controlled buyer diligence and compare offers",
      "Model debt payoff, costs, tax advice and post-sale obligations"
    ],
    "docs": [
      "Exit readiness and buyer comparison",
      "Exit agreement and final proceeds reconciliation"
    ]
  }
];
function init(start,caseId='metal') {return {version:1,start,caseId,phases:Object.fromEntries(phases.map(p=>{const d=new Date(start+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+p.days);return [p.id,{status:'Not started',owner:p.owner,due:d.toISOString().slice(0,10),tasks:[],documents:p.docs.map(name=>({name,status:'Needed',reference:''})),reviewer:'',notes:''}];})),audit:[]};}
function gateErrors(w,id,r){const p=phases.find(p=>p.id===id);if(!p)throw Error('Unknown phase');const e=[];for(const dep of p.deps)if(w.phases[dep]?.status!=='Complete')e.push('Dependency incomplete: '+phases.find(x=>x.id===dep).name);if(p.tasks.some((_,i)=>!r.tasks.includes(i)))e.push('Complete all phase tasks');if(r.documents.length!==p.docs.length||r.documents.some(d=>!['Received','Waived by reviewer'].includes(d.status)||!d.reference.trim()))e.push('Document evidence or an explicit waiver reason is required for every document');if(!r.owner.trim())e.push('Assign an owner');if(!r.reviewer.trim())e.push('Name the gate reviewer');if(!r.notes.trim())e.push('Record review decision and evidence');return e;}
function update(w,id,r,at){if(!phases.some(p=>p.id===id))throw Error('Unknown phase');if(r.status==='Complete'){const e=gateErrors(w,id,r);if(e.length)throw Error(e.join('; '));}const old=w.phases[id];w.phases[id]=r;w.audit.push({at,phase:id,from:old.status,to:r.status,reviewer:r.reviewer,notes:r.notes});if(old.status==='Complete'&&r.status!=='Complete'){const affected=new Set([id]);let changed=true;while(changed){changed=false;for(const p of phases)if(!affected.has(p.id)&&p.deps.some(x=>affected.has(x))){affected.add(p.id);changed=true;}}for(const dep of affected)if(dep!==id&&w.phases[dep].status==='Complete'){w.phases[dep].status='Needs re-review';w.audit.push({at,phase:dep,from:'Complete',to:'Needs re-review',reviewer:r.reviewer,notes:'Upstream phase reopened: '+id});}}return w;}
const api={cases,phases,init,gateErrors,update};root.QLAWorkflow=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
