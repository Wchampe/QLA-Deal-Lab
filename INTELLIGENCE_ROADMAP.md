# Acquisition intelligence: vision, processes, and AI progression

Planning notes saved September 19, 2026, at the user's request. This is a proposed roadmap, not a statement that the future capabilities are implemented. This update does not enable new feeds, scheduled jobs, outreach, model training, or paid services.

## Intended outcome

Answer: **Which businesses or assets are worth approaching this week, and what evidence supports that?**

The potential advantage is joining scattered business records, noticing meaningful changes, and reducing the work needed to reach qualified conversations. It is not certainty about someone's willingness to sell. A record of financial pressure is neither proof of seller interest nor proof of an attractive acquisition.

Possible progressions discussed:

- Company timelines connecting filings, financing disclosures, facility/property records, and corporate changes to the correct business.
- More specific opportunities: an entire company, a division, equipment, a facility, commercial real estate, or a need for capital. These are different hypotheses and conversations.
- Watchlists that alert when new evidence strengthens, weakens, or resolves an earlier hypothesis.
- Buyer-fit screening using geography, industry, operating requirements, acquisition capacity, and supported financial information.
- Outcome-based learning: test whether the research actually produces more qualified conversations than a basic industry/location target list.
- Eventually, either a private sourcing tool for this buyer or a specialized research service for other buyers. A shared product would additionally need reliable coverage, data permissions, access controls, secure storage, and demonstrated usefulness.

## What exists today

The inspected implementation collects SEC filings, matches the issuer by CIK, retrieves a bounded sample of related documents and reported financials, and produces local-AI dossiers with checked quotations. It saves browser dossiers, separate financial assumptions, call-queue links, and pre-response assessment/document-hash snapshots with outreach outcomes.

It does not yet provide a durable full-document archive, persistent scheduled filing watchlists, cross-registry private-company matching, trained seller probabilities, or automatic outreach. Job state and download cache are in server memory; completed dossiers persist in browser storage. The current quote checks verify that words appeared in supplied passages, not that every interpretation follows from those words. See [current implementation and coverage](OFF_MARKET_INTELLIGENCE.md).

## Operating workflow

```text
Buyer criteria + permitted sources
  -> collect and retain dated documents
  -> resolve business and asset identities
  -> extract sourced business events
  -> compare the timeline with its previous state
  -> propose and challenge transaction hypotheses
  -> human-reviewed, buyer-fit shortlist
  -> approved conversations and information requests
  -> record outcomes and evaluate the research
  -> revise a tested model/rule version
```

Collection failures, uncertain identity, missing dates, and contradictory evidence should remain visible states. They should not silently become negative evidence or an asserted seller.

| Step | Proposed process and output | Gate before proceeding |
| --- | --- | --- |
| 1. Define the search | Choose industry, geography, company/asset type, buyer constraints, review capacity, and collection budget | Scope and exclusions agreed by the buyer |
| 2. Collect | Use official records or authorized exports; retain retrieval status, source identifier, publication date, observed time, document version and hash | Access permitted; original record available; failures reported |
| 3. Match identities | Prefer registry/issuer IDs; corroborate names, addresses and documented relationships | Ambiguous matches await review; shared registered agents or addresses alone do not establish common ownership |
| 4. Extract events | Record actor, action, object, relevant amount/period, event date, and supporting passage | Distinguish actual events from boilerplate, hypotheticals and historical repeats |
| 5. Update timelines | Mark an event as new, repeated, changed, contradicted or resolved | Multiple reports of one event are grouped; a later filing date does not make an old event new |
| 6. Form hypotheses | Explain a possible transaction, the supporting chain, alternatives, and the next evidence needed | Require source support; separate announced processes from possible early signals |
| 7. Prioritize | Display evidence strength, buyer fit, operating/financial risk, data freshness and missing information separately | A strong pressure signal cannot override poor fit or inadequate evidence |
| 8. Review and contact | Verify the correct business contact, review the hypothesis and prepare a respectful inquiry | Human approval; respect opt-outs; do not assert unconfirmed distress or sale intent |
| 9. Learn | Preserve the pre-contact research, actual response, dates, channel and follow-up window | Human-observed outcomes; no self-generated success labels |

Where unique IDs are absent, probabilistic record linkage is an established approach to proposing matches across datasets. It still needs an evaluated match policy for this project. [Splink's documentation](https://moj-analytical-services.github.io/splink/index.html) provides an implementation reference; adopting that library is not required or implemented here.

### Example: reasoning that should change as evidence changes

Hypothetical manufacturer, not an actual prospect:

1. A financing disclosure identifies a near-term refinancing deadline.
2. A plant-closure notice names one of its operating locations.
3. A separate company filing describes consolidating production elsewhere.
4. A verified identity/asset link ties the records to the same manufacturer and facility.

Possible output: the facility or equipment may become available; an entire-company sale is unconfirmed. Alternatives include routine consolidation or moving the equipment to another site. The closure notice and consolidation filing may describe the same event, so they must not be treated as two independent signs of pressure.

Next research question: does a later filing disclose refinancing, a replacement tenant, equipment transfer, an existing buyer, or a canceled closure? A successful refinancing could weaken the liquidity hypothesis while leaving a facility-disposal hypothesis open. This is why the system needs separate hypotheses with histories, not one permanent "motivated seller" label.

### Proposed cadence

- **Each collection cycle:** check source health; process new/changed documents; update timelines; surface material changes and unresolved identity questions. Frequency should follow actual source updates and approved resource limits.
- **Each review session:** examine a manageable shortlist, challenge the evidence, verify public business contacts, and choose the next action. The buyer decides which conversations are appropriate.
- **Weekly:** reconcile contact outcomes, investigate false positives, review missed opportunities and stale records, and compare results with the baseline list.
- **At model releases:** run a fixed evaluation set, test on later observations, inspect failures, and approve or reject the candidate version. Keep the previous version available for rollback.

These are proposed operating practices, not running schedules.

## How AI could advance the work

### 1. Read documents more completely and consistently

Proposed additions: PDF/OCR support with page references; section-aware retrieval; extraction of tables, amendments and negation; recognition of whether the issuer is buying or selling; and comparison of changed wording across filings.

Extract structured events before writing the narrative. Every event should retain its source location and uncertainty. A JSON schema can enforce output shape, as supported by [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs); factual and interpretation checks still need separate evaluation.

### 2. Build a business-and-asset relationship map

Represent companies, subsidiaries, documented facilities, parcels, filings and business events as linked records. This could reveal that a potential asset belongs to a subsidiary rather than the named public parent. Every relationship needs provenance, a relevant date and a reviewed matching basis. An embedding or similar name can suggest a candidate relationship, not prove ownership.

Initially this can use ordinary database tables; a dedicated graph database is an optional later implementation choice. The useful capability is traceable relationships, not a particular database product.

### 3. Investigate the most important missing evidence

A research-planning step could ask which available document would most change the conclusion. For a refinancing-pressure hypothesis, a recent amendment resolving the deadline may matter more than additional old reports describing the same problem.

The planner would propose a bounded retrieval task from approved sources, explain why it matters, and stop if access is unavailable or evidence remains insufficient. It should also actively seek evidence against its preferred explanation.

### 4. Use separate analysis roles with shared evidence

Proposed logical roles, which may share one model and run sequentially:

- **Extractor:** produces dated, source-linked events.
- **Identity reviewer:** checks company and asset relationships.
- **Timeline analyst:** identifies developments and whether an earlier condition is resolved.
- **Hypothesis analyst:** proposes the transaction type, evidence chain and timing questions.
- **Skeptical reviewer:** looks for buyer/seller confusion, stale events, missing context, duplicate evidence and alternative explanations.
- **Brief writer:** prepares the reviewed dossier and unanswered questions for the buyer.

Agreement between AI roles is not independent corroboration. Contradictions should remain visible; deterministic quote/date/identifier checks and human-reviewed test cases remain necessary.

### 5. Learn which signals help, once there are useful labels

Keep separate targets for willingness to have a qualified conversation, availability of an information package, an actual sale process, an LOI and a completed acquisition. A model trained on conversations cannot honestly call its output a probability of a completed sale.

Choose an outcome definition and observation window before testing. Preserve an as-known-at-the-time feature snapshot, including buyer fit, source coverage, model version and outreach effort. No answer remains unknown. A rejection is a dated response, not proof that the business will never sell.

Begin with a simple, explainable ranking baseline. Test more complex models only if they improve results on unseen companies and later periods. Historical replays must exclude later filings, later contact notes and knowledge of subsequent transactions. These controls address [data leakage](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage). As an additional project precaution, historical LLM tests should be followed by prospective testing because a model may already know well-publicized later outcomes.

Reserve a small, approved baseline sample of otherwise eligible prospects so learning is not limited to the first model's preferred companies. Record contact attempts and follow-up consistently; different outreach effort can otherwise masquerade as a better prediction.

Only introduce percentages after measuring calibration on held-out outcomes. Compare predicted frequencies with observed outcomes and report sample size, coverage and uncertainty. [Scikit-learn's calibration guide](https://scikit-learn.org/stable/modules/calibration.html) explains why classifier scores are not automatically reliable probabilities. There is no predetermined number of records that guarantees a useful model.

### 6. Improve speed without assuming a smaller or larger model is better

Potential experiments: cache verified extraction by document hash, process changed sections only, use a smaller local model for extraction and a larger model for selected synthesis, and batch comparable tasks. Measure evidence quality as well as latency and memory use before changing the default.

Use code for financial arithmetic and period alignment. Keep source-reported amounts, modeled assumptions, and seller-provided confidential financials separate. AI can identify missing inputs and suggest questions; it should not fill unknown revenue, EBITDA, debt or asking price with invented numbers.

## Development sequence and acceptance gates

| Milestone | Proposed deliverable | Evidence required before expanding |
| --- | --- | --- |
| A. Durable evidence and evaluation | Versioned document/event store, restart-resumable jobs, reviewed example dossiers, consistent identity/date/quote checks | Reproduce an earlier dossier from its exact inputs; restore a backup; inspect failures |
| B. Focused multi-source pilot | One chosen industry/geography and a small set of accessible complementary record sources | Source access and costs checked; useful real records; reviewed identity matches; coverage gaps documented |
| C. Change monitoring | Persistent watchlists, event deduplication, change/resolution alerts and source-health reporting | Repeated documents do not cause repeat alerts; amended/resolving evidence updates the correct hypothesis |
| D. Buyer-reviewed prospect workflow | Separate fit/risk/evidence views, research tasks, contact review, outreach snapshots and outcome definitions | Trace a prospect from source to conversation without invented facts or unauthorized actions |
| E. Measured ranking improvement | Baseline comparison, later-period testing and a candidate model running alongside the current version without controlling outreach | Improvement in qualified conversations relative to review/contact effort, with uncertainty and false positives reported |
| F. Optional research product | Reliable service, permissions review, user access controls, secure storage, support and exports | Buyers find it repeatedly useful; data rights and operating costs support the proposed use |

The narrow pilot is a development proposal, not a selected market. Before implementing it, choose the sector, geography, business-versus-asset focus, approximate size range, accessible sources, data budget and human review capacity. Broader coverage should follow evidence that one complete source-to-conversation workflow is useful.

## Measures of progress

Track distinct layers so persuasive writing cannot conceal poor research:

- **Data:** retrieval success, freshness, usable coverage, duplicate rate and retention completeness.
- **Identity:** incorrect joins and missed matches in a human-reviewed sample; unresolved matches reported separately.
- **Evidence:** supported factual interpretations, important events missed, boilerplate mistakes, and correction rate. Exact-quote success alone is insufficient.
- **Operations:** analyst time per reviewed prospect, model time per dossier, cost per useful record and alert noise.
- **Commercial usefulness:** qualified conversations per fixed review/contact effort, information packages received, viable diligence opportunities, and ultimately acquisition outcomes. Do not combine these into one success label.
- **Ranking quality:** useful prospects among the top reviewed results, improvement over the agreed baseline, and performance by sector/geography. Report small samples and uneven source coverage.
- **Lead time:** time between a captured, reviewable signal and a later documented outcome, where both are observable. Never invent an earlier detection date or call missing listing coverage proof of an off-market opportunity.

## Handoff to the existing deal workflow

The research shortlist feeds **Sourcing and qualification**, then **Contact and information access** in [the Full Deal Workflow](WORKFLOW_GUIDE.md). Verified information and human decisions feed preliminary underwriting, transaction structuring and subsequent gates. A high research rank must not automatically create a seller mandate, approve financing, submit an offer or complete a diligence task.

The scope stays on documented business circumstances and voluntarily supplied business information. Public availability does not establish unrestricted collection or reuse rights. Review access permissions and minimize unnecessary data; do not build private-life hardship profiles. Calls, messages, subscriptions, new data purchases and model deployment changes remain separately authorized actions.

The desired evolution is a versioned, testable research process: better evidence, better questions, better qualification, and measured improvements from real outcomes.
