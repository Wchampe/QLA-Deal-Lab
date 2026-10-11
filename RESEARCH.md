# Acquisition research and scenario map

Research baseline: September 7, 2026. US-focused, with international discovery sources labeled separately. This is broad initial coverage, not an exhaustive census of every site, program, or deal structure. The app's directory contains 34 source entries. Public sources cannot establish a seller's current availability, a buyer's intentions, or a lender's willingness to finance a particular borrower.

## How QLA informs this project

The project adapts industry focus, an experienced team, acquisition search, capital structuring, and operating follow-through into a reviewable workflow. It is not an official implementation or endorsement of QLA, and does not assume that aggressive leverage or no-cash acquisitions will work. Primary starting point: [Dan Pena's resources](https://www.danpena.co.uk/downloads/).

The team should cover industry judgment, operating execution, transaction law, financial diligence, capital sourcing, and integration. A board title is not evidence of competence. Record closed-deal experience, references, scope, fees, availability, and conflicts. [IBBA's directory](https://www.ibba.org/find-a-business-broker/) supports broker discovery; [ACG](https://www.acg.org/membership-tools/why-join) covers the middle-market transaction community. Neither establishes that a particular person will join your team.

## Sourcing routes

| Route | Sites / sources | How the app handles it |
|---|---|---|
| Local and Main Street acquisitions | BizBuySell, BizQuest, BusinessesForSale | Focused source searches and authorized CSV/JSON imports |
| Broker channels | Sunbelt, Transworld, Murphy Business | Directory research, original listing links, contact tracking |
| Digital businesses | Acquire.com, Flippa, Empire Flippers, FE International | Separate digital-business research; check customer, platform, IP and traffic dependence |
| Larger private transactions | Axial, ACG, Searchfunder | Membership/network research and authorized imports |
| Federal contract demand | SAM.gov | API-key-based notice searches, saved as signals |
| Government supplier targets | USAspending | No-key award searches; recipient/award evidence, not seller intent |
| Surplus and distress | GSA, Public Surplus, PACER | Asset/court research; separate from operating-business cash flow |
| Financing institutions | SBA lender and SBIC directories, CDFI Fund, Treasury SSBCI, USDA | Source leads; verify size, geography, mandate and underwriting |
| General web discovery | Optional Brave Search API | Returns source URLs and snippets for review; requires your account key |

[BizQuest](https://www.bizquest.com/AboutUs/) and BizBuySell can carry overlapping listings; the app deduplicates imported records by source URL or name/location, but syndicated listings with different names/URLs still require human review. [Axial](https://www.axial.net/) operates as a private network rather than an open public listing database. [Empire Flippers](https://support.empireflippers.com/hc/en-us/articles/202132306-How-do-I-buy-an-online-business-with-Empire-Flippers) requires verification to unlock details. These are reasons to support authorized imports instead of pretending every website is an open feed.

## Capital routes and deal magnitudes

Ranges below are planning buckets chosen for this workbench, not eligibility boundaries or lender quotes.

| Deal situation | Routes worth researching | Main decision / blocker | App coverage |
|---|---|---|---|
| Under $250K, owner-operated | Buyer cash, negotiated seller note, suitable local lender | Owner replacement pay can consume apparent SDE | Numerical templates |
| $250K–$2M, steady Main Street | SBA 7(a), conventional debt, seller note, equity | Verified cash generation, injection, guarantees and operator fit | Numerical templates |
| $2M–$5M, established operation | SBA if eligible, bank debt, seller note, partner equity | Total uses exceed price; leverage and concentration | Numerical templates |
| $5M–$10M | Conventional, sponsor equity, seller debt, eligible SBA component | Single 7(a) cap; other capital must be real and compatible | Numerical templates plus cap flag |
| $10M–$50M+ | Bank/private credit, SBIC, sponsor or family-office equity, strategic buyer | Institutional diligence, covenants, control and liquidity | Simplified debt/equity scenarios; negotiated structures need expansion |
| Rural manufacturing or distribution | USDA B&I lender, conventional, equity | Rural eligibility, collateral, job/operating and program conditions | Conditional rural template |
| Underserved/local economic development | Appropriate CDFI or local SSBCI program | Specific service area, mandate and eligible acquisition uses | Conditional lender template |
| Business plus real estate/equipment | Separate eligible asset financing and operating-business financing | Purchase-price allocation, collateral and loan coordination | Research checklist; dedicated multi-tranche 504 model not implemented |
| Seller succession | Amortizing note, transition services, equity | Seller willingness and legal/economic terms | Seller financing templates |
| Seller rollover / recapitalization | Buyer/sponsor equity, debt, retained seller equity | Control, guarantees, minority rights and valuation perimeter | Research workflow; cap-table waterfall not implemented |
| Earnout | Contingent payment based on defined results | Metric disputes, control, financing rules and payment capacity | Diligence prompts; earnout model not implemented |
| Distressed assets | Equity, asset lender, specialist financing | Liens, auction terms, restart cash and negative cash flow | Research and gates; do not use profitable-business assumptions |
| Government contractor | Acquisition funding plus appropriate operating liquidity | Contract transfer, certifications, backlog, concentration | API signals + diligence workflow; awards excluded from cash flow |
| Digital/SaaS | Equity, seller debt, suitable bank or private credit | Churn, IP, platform/customer dependence, owner labor | General model plus specialist review |
| Franchise resale | Eligible bank/SBA, buyer cash, permitted seller note | Franchisor approval, lease, transfer fees and lender conditions | Case-informed workflow |
| Management/family buyout | Seller note, lender debt, buyer equity | Independent valuation, succession and written terms | Seller-finance scenario + documented example |
| Roll-up/add-ons | Existing cash, acquisition facility, sponsor equity | Integration capacity, standalone costs, covenant headroom | Per-deal comparisons and growth gates; no assumed synergy uplift |
| Exit | Strategic buyer, searcher, sponsor, management, family office | Transferability, net proceeds, tax and financing certainty | Buyer research plus simplified exit proceeds |

## Program evidence

[SBA 7(a)](https://www.sba.gov/loans/7a-loans/) supports eligible ownership changes and has a published single-loan maximum of $5 million. The calculator flags larger modeled 7(a) principal. Its illustrative equity mix is not an eligibility determination. Ask the lender to confirm current SOP, borrower eligibility, injection, seller-note treatment, guarantees, fees, terms, and approval conditions.

[SBA 504](https://www.sba.gov/loans/504-loans/) concerns eligible fixed assets; working capital and inventory are excluded. Do not apply it as general goodwill funding. A [July 2026 SBA announcement](https://legacy.sba.gov/article/2026/07/07/small-businesses-now-eligible-10-million-sba-financing) describes expanded combined 7(a)/504 capacity; it does not turn 7(a) into a single $10 million loan. A lender/CDC must assess allocation and current implementation.

[Lender Match](https://www.sba.gov/loans/lender-match/) provides introductions, not a guarantee of a match or credit. [SBICs](https://www.sba.gov/loans/additional-funding-opportunities/investment-capital/) are privately managed investors with their own mandates. Check the [SBIC directory](https://www.sba.gov/funding-programs/investment-capital/sbic-directory) for active investment status, strategy, location and contacts, then verify directly.

[CDFI certification](https://www.cdfifund.gov/programs-training/certification/cdfi) identifies mission-driven financial institutions, not uniform acquisition-loan products. [SSBCI](https://home.treasury.gov/policy-issues/small-business-programs/state-small-business-credit-initiative-ssbci) supports jurisdiction-specific capital programs. It is not a generic direct acquisition grant. Use local program contacts for eligible uses and availability.

[USDA B&I's Texas program page](https://www.rd.usda.gov/programs-services/business-programs/business-industry-loan-guarantees-5) includes certain acquisitions maintaining operations and creating or saving jobs. It also lists collateral and use restrictions. Verify the target location and current requirements with the applicable state office and lender.

Outside investor equity needs an appropriate offering structure. [SEC offering pathways](https://www.sec.gov/resources-small-businesses/capital-raising-building-blocks/offering-pathways) explains registration and exemption routes. The app prepares exploratory drafts, not securities offerings or subscriptions.

## Researched listing examples

Four public listings are included in `research-leads.json` and the Deal Pipeline screen. They have reported figures and blank cost assumptions, so the user must complete inputs before modeling. Original listings were observed on the research date; no availability or financial verification was performed.

- [Small pallet business](https://murphybusiness.com/business-brokerage/detail/22239/distribution-wood-pallet-business/): reported $199K ask and $44,821 SDE. The amount remaining after an operator salary is a key unanswered question.
- [HVAC parts distributor](https://murphybusiness.com/business-brokerage/detail/23231/40-year-hvac-parts-distributor-strong-earnings/): reported $1.8M ask and $409,341 SDE. Inventory is reportedly included. A broker's financing claim is not approval for this buyer.
- [Larger pallet manufacturer](https://murphybusiness.com/business-brokerage/detail/22610/dist-mfg-recycled-lumber-wood-products-pallets/): reported $7.9M ask and $1,226,402 SDE, with unspecified seller-financing willingness. Additional capital and debt-capacity diligence are necessary.
- [Retail SaaS platform](https://murphybusiness.com/business-brokerage/detail/18794/absentee-saas-platform-for-retailers/): the $10M headline conflicts with narrative describing negotiated pricing and a recap. Resolve transaction scope and price before treating it as a purchase case.

These examples are investigation candidates, not recommended acquisitions. The six automatically modeled demo businesses are fictional and separate.

## Full workflow and documented cases

The Full Deal Workflow screen has 15 phases, 45 tasks and 30 evidence items. It covers thesis, team, sourcing, information access, underwriting, structure, LOI, confirmatory diligence, financing, contracts/consents, closing, first 30 days, days 31–100, ongoing ownership/add-ons, and exit.

Five published case lenses are embedded with original links, facts, limitations and workflow lessons in `workflow-data.js`. No single public case supplies every confidential document or step. The resulting workflow is a recommended synthesis, not a claim that any source used this exact sequence. See `WORKFLOW_GUIDE.md` for how the dependency and review gates operate.

## How to evolve the system

1. Start with one industry/geography and a documented buyer profile. Replace demo assumptions with actual evidence.
2. Record source-to-qualified-lead conversion, financial-data completeness, seller responses, lender objections, and diligence loss reasons.
3. Add licensed feeds or authorized broker exports with explicit field mappings, provenance, refresh dates and deduplication tests.
4. Add a secure document store, granular financial evidence, approval roles, and a shared database before multi-user use.
5. Extend modeling for separate real estate tranches, amortization versus maturity, standby/PIK notes, earnouts, preferred equity, taxes, and roll-up integration cash.
6. Only after measured reliability add scheduled collection and reviewed outbound integrations. Keep source terms, budgets, audit logs, and transaction approvals explicit.

## Integration documentation

- [SAM public API](https://open.gsa.gov/api/get-opportunities-public-api/): date-bounded notice searches; key required.
- [USAspending endpoints](https://api.usaspending.gov/docs/endpoints): award-search adapter.
- [Brave web search](https://api-dashboard.search.brave.com/app/documentation/web-search/get-started): optional query API; requires your key and account terms.
- [Ollama chat API](https://docs.ollama.com/api/chat): local agent reasoning; installed model required.
