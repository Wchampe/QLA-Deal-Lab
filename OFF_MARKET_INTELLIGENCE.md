# Off-market seller intelligence

The objective is to identify a business worth approaching before an advertised sale, and explain the supporting evidence. The analytical discipline is seller-propensity modeling: entity resolution, event extraction, temporal features, ranking, and eventually calibrated prediction from actual outcomes.

The default Off-market intelligence page now performs direct filing collection and cross-document local-AI analysis. The earlier web-search/manual-scoring workflow is preserved behind **Earlier saved web research & manual evidence**. The Liquidity Signals form remains a separate note-taking feature.

## Progression notes — September 19, 2026

The user's longer-term vision is a research system that identifies which businesses or assets are worth approaching, with an evidence-backed reason for each. Potential progressions include linked company timelines, transaction-specific hypotheses, change alerts, buyer-fit screening and learning from actual seller conversations. A private sourcing assistant or a specialized research service are possible eventual outcomes; neither predictive performance nor commercial viability has been established.

The proposed operating loop is collect → resolve identity → extract events → compare timelines → propose and challenge a hypothesis → human-reviewed shortlist → approved conversations → measure outcomes. Keep seller interest, evidence strength, buyer fit and operating risk distinct.

The detailed [AI progression and workflow roadmap](INTELLIGENCE_ROADMAP.md) records the example, proposed roles, daily/weekly review practices, staged implementation gates, learning/evaluation design, and the handoff to the existing deal workflow. It explicitly distinguishes the implemented SEC module from future multi-source/private-company coverage. This September 19 update records plans only; it does not enable any new automation or data sources.

## Direct filing workflow — September 18, 2026

1. With the company field blank, search SEC EDGAR's full-text filing index for financing, strategic-review and disposal language. Optional industry words search filing text; an optional two-letter state filters headquarters. A name/ticker/CIK selects focused company research instead. No source URL or evidence text is required.
2. Resolve the company by its SEC CIK and verify it against the submissions response. Ambiguous multi-issuer search hits are skipped. Search hits are candidate locators, not evidence of intent.
3. Fetch up to six filings from the year preceding the selected date: the search match, newest filing, annual/quarterly reports and selected material-event reports. Retrieve up to one linked exhibit from each selected 8-K, restricted to the same accession directory. Latest reports are included so later counterevidence can be considered. This is a sample, not an exhaustive history.
4. Extract readable text, hash it, and select bounded passages around relevant business events. Round-robin passage selection retains coverage across documents. Only these excerpts, identity metadata and provenance are sent to the local model. The AI is instructed to distinguish real issuer events, boilerplate, repeated disclosures, completed deals, buyer-side acquisitions and counterevidence.
5. Validate output structure, match every accepted quote to its downloaded passage, and require separate accession numbers for every accepted cross-document connection. An early-lead classification additionally needs multiple current-event categories in multiple filings. Exhibits and parent filings do not count as separate corroboration. These checks verify citation plumbing, not the truth of the AI's interpretation.
6. Automatically save company dossiers to the browser shortlist. Each shows the inference, source timeline, connections, alternatives, missing evidence, coverage, and reported financial facts. Failed AI calls produce an **AI analysis incomplete** record, never a fabricated conclusion. Refresh preserves financial scenarios and outreach history; partial collection errors are visible and keep the discovery position available for retry.
7. Add a selected company to the existing call queue. Explicit outcomes preserve the assessment, model and document hashes that preceded the response. No-response attempts remain unlabeled. Opt-outs block further contact actions.

| Label | Meaning |
| --- | --- |
| Possible early lead | AI sees a supported cross-filing business-event hypothesis; sale intent remains unconfirmed |
| Process already disclosed | A relevant review/disposal process is public, so this is not an undisclosed early signal |
| Transaction agreed / completed | A relevant transaction is already signed or completed; inspect whether anything remains available |
| Insufficient evidence | The excerpts do not support a useful sale hypothesis, or validation rejected the proposed classification |
| AI analysis incomplete | Filings were collected but no completed AI assessment is available |

Reported financials come from the [SEC XBRL company-facts API](https://www.sec.gov/search-filings/edgar-application-programming-interfaces). The implemented fields are annual revenue, annual operating income, annual net income, cash, assets and liabilities where supported US-GAAP USD facts exist. Values retain their original period and filing link; filings after the chosen date are excluded. Annual income metrics are not annualized from a quarter. Issuer financials are not division financials, and net income is not EBITDA. The possible-financials worksheet uses the user's own explicit assumptions.

The collector uses [SEC full-text filings](https://www.sec.gov/edgar/search/) and official submissions/archive endpoints, not broker websites, articles or Brave. Full-text search's website endpoint is not a versioned API contract; schema changes can interrupt discovery. Source connections are server-side, allowlisted, bounded by response size, serialized at about 1.5 requests/second and cached in memory (up to 64 MB). HTTP 403/429 triggers a 15-minute cooldown without alternate-host retries. Set `QLA_SEC_USER_AGENT` to your organization/contact when deploying; see [SEC developer resources](https://www.sec.gov/about/developer-resources).

The local AI uses [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs), automatic GPU/RAM allocation, an 8,192-token context, at most 13,000 excerpt characters, and bounded output. Generation streams progress into the job; the per-company model deadline is 15 minutes. Large partly CPU-resident models can be slow. Scans run server-side and can be resumed from the same browser workspace after navigation/reload, but pending jobs/cache are lost on server restart. Completed browser dossiers and exported backups remain.

Current connected coverage is **SEC reporting companies and potential divisions/assets they own**. Most small privately held companies, state business registries, property, UCC, WARN and court-case feeds remain outside this collector. Separate filings are not independent witnesses. No claim is made that a company has no broker, wants to sell, or will sell within a time window. The app does not yet have a trained/calibrated probability model.

## Company-specific email and public contacts

Each dossier has a **Sale inquiry email & company contacts** panel. Templates use the company name, industry, location, selected acquisition scope and the buyer's own introduction. A relevant dated filing can supply a neutral reference; an internal financial-pressure hypothesis is not stated as the reason the company must sell. Disclosed-process inquiries ask whether buyer inquiries are still being accepted; agreed/completed transactions ask about any other opportunities. All text is editable, with no assumed buyer credentials or financing commitments.

The filing collector extracts explicit investor/company/media contact blocks and named executives in the issuer's signature section from the downloaded documents. **Find public contacts** checks the latest available sample separately, without rerunning AI or financial analysis. Candidates include their original source, filing date and excerpt. These are published candidates, not verified current employees or deliverable mailboxes; investor-relations and media representatives may be external. Emails are never assembled from name/domain patterns. Missing contacts produce role suggestions and company/leadership research links. The legacy manual-research view uses these links and sourced manual contact entry.

Selecting a contact fills the recipient fields. Refreshing the draft updates its greeting and replaces the current email text. Direct edits save as you type; the sender introduction is reused for new drafts. Email drafts, recipients and separately collected contacts survive dossier refreshes and standard workspace backups. Copy/download never sends email or records a completed attempt. Saving a contact to the call queue preserves its source and leaves actual sending/outcome recording to the user. Existing do-not-contact records block draft and contact actions.

## What useful evidence looks like

| Public business fact | Hypothesis to explore | Alternative explanation / what to verify |
| --- | --- | --- |
| Owner publicly discusses succession | There may be a transition conversation to have | A successor may already be arranged; ask about timing |
| Company announces a division or asset disposal | A specific asset or operation may be available | An entire operating company may not be for sale |
| Expiring business lease plus a documented facility change | A transaction could help resolve an operating decision | The company may have a signed replacement lease |
| Business refinancing, covenant breach, or restructuring | New capital or an ownership change may be relevant | Ordinary financing, and legal authority to sell must be established |
| Layoff or closure notice | A business change merits investigation | It may be a relocation, temporary response, or partial operation |
| New investment, expansion, or appointed successor | Earlier transition/pressure hypothesis may be weaker | Check whether the event actually resolves the original issue |

Company age, owner age, personal life events, consumer tracking, routine UCC filings, and stock sales are not inputs that automatically establish seller interest. This workflow evaluates public company events and actual conversations. Operating risk also affects what a buyer should pay; it should not be confused with an attractive acquisition.

An illustrative example, not a real prospect: a manufacturer has a recent owner-succession announcement and a separate disposal of a non-core operation. After matching both to the same business and reviewing the original sources, the current rules give 25 + 20 = 45 evidence points. A new independent growth-investment announcement reduces that to 30. Ten copies of the succession announcement do not increase its 25-point contribution. The output is an explained reason for research, with remaining questions about ownership, financials, and willingness to talk.

## Broader source roadmap and preserved legacy research

- Company websites, trade publications, chamber announcements, and local reporting: source dated ownership, facility, and capital events. The connected web-search collector looks for these across four queries and excludes known business marketplaces. The query alone does not prove relevance.
- [SEC company submissions and financial-statement APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces): connected in the direct filing workflow described above. These generally do not expose a small private company's financial statements.
- [Illinois WARN reporting](https://www.illinoisworknet.com/warndashboard): employer-reported layoff/closure activity and monthly reports. The state cautions that these notices do not capture all layoffs and may not reflect final action. Equivalent sources differ by state. A notice is an operating event, not a sale instruction.
- [Illinois UCC business index](https://apps.ilsos.gov/uccsearch/): supports business-debtor matching and research on recorded security filings. Many original images are not available online. A secured financing statement gets zero intent points on its own; investigate any actual default or disposal separately.
- [PACER](https://pacer.uscourts.gov/): federal business-case and sale-process research; authenticated or fee-based access may be required. Public results are potential sources to review, not an automatic feed in this release.
- [USAspending](https://www.usaspending.gov/): public contracting context. The existing app has an award-search adapter. A future analytics connector should compare time windows and recipient identity; award face value is not revenue, realized cash, or seller intent.

Broader private-company coverage requires choosing a sector and geography, then adding jurisdiction-specific business registries, licensing, court, property, and permit feeds. Access, field definitions, and update schedules differ. Track the legal business ID, jurisdiction, website, and name changes where available; shared names or registered agents alone are weak identity matches.

## Preserved legacy web-research workflow

1. Search an industry and area without needing a company name, URL, or evidence text.
2. Review public-source discoveries. Identify a company actually named in the source; the app does not silently treat an article title as a company.
3. Collect related evidence for that company. Four targeted searches cover succession, operations/assets, company financing, and counterevidence/current activity.
4. Review the company match and collected fact. An exact company website or name gives an identity hint, not automatic confirmation. Excerpts and URLs are captured; event dates remain unknown until checked.
5. Recalculate the evidence file. Read supporting facts, source links, alternative explanations, and unanswered questions. Add the business to the call queue when appropriate.
6. Record actual outcomes. Explicit yes/no responses become labels; unanswered calls and ambiguous timing remain unlabeled. Opt-outs block new drafts and activity in the linked workflow.
7. If useful, enter a financial range with its basis. Revenue × EBITDA margin yields assumed EBITDA; EBITDA × multiple yields enterprise value; net debt is subtracted for a rough equity range. Working capital, costs, financing, and a diligence-backed offer require the existing underwriting tools and actual documents.

Records persist in browser storage and the standard workspace backup. No automatic messaging or calling occurs. Searches use the existing Brave key and shared browser daily usage counter. Each batch makes four requests and retains partial results. Failed batches keep the same page for retry. Repeated URLs deduplicate. Source refreshes retain the original observation date and manual facts; a changed excerpt must be reviewed again before contributing points.

## Legacy manual-evidence scoring

`evidence points = clamp(sum(strongest reviewed contribution in each category), 0, 100)`

Category weights: expressed intent 30, succession 25, divestiture 20, operating changes 8, financing events 7, restructuring 10; counterevidence of growth/funding −15, an arranged succession −25, an explicit no-sale statement −35. Background facts are zero.

Only records confirmed as the same business with a reviewed original source or independent report and a recorded fact contribute. Original sources use full weight; independently reported sources use 0.8. Event age multipliers: up to 90 days 1.0, up to one year 0.6, older 0.2, unknown date 0.25, invalid/future date zero. Retrieval dates are not event dates. Identical facts or a user-assigned shared event ID are counted once across categories; within a category only the strongest contribution counts. Domain count is displayed as coverage, not added as independent proof. Differently worded syndicated stories require the shared event ID to be recognized across categories.

These weights and priority bands are design choices, not learned statistics. The application deliberately exposes a null probability. A point score of 45 does not mean a 45% sale probability. The database may contain partial or outdated coverage, and no listing found does not establish that a business is off-market.

## Turning it into a predictive system

Define the outcome before training: for example, a qualified owner agrees to an acquisition conversation within 90 days of first contact. That is a more observable initial target than whether a purchase eventually closes. Keep separate outcomes for interest, financial-package receipt, LOI, and closing.

Save the feature snapshot as it existed before outreach: event dates, first-observed dates, evidence category, confidence, identity match, business sector/size, fit to buyer criteria, contradictions, channel, and follow-up window. The current app records pre-response score/category snapshots and a model version with actual outcomes. Later connectors should preserve full source versions and stable business identifiers as well.

Start with a regularized logistic baseline; compare it with a tree model only when there are enough representative outcomes. Survival analysis can later estimate time to a conversation while accounting for prospects whose follow-up period has not finished. Missing responses are not negative sale-interest labels. Post-response notes, later broker listings, and later financial packages must not leak into earlier predictions.

Evaluate on later time periods with company-level separation; keep all copied reports and all observations of a company together. Report precision among the top calls, lift over a random or ordinary-directory sample, sector/geography coverage, and false positives. Reserve a small randomized exploration group so learning is not confined to whichever companies the first score selected.

For percentages, use held-out calibration curves alongside Brier/log-loss and discrimination metrics. [Scikit-learn's calibration documentation](https://scikit-learn.org/1.8/modules/calibration.html) explains why a classifier's numeric output is not automatically a trustworthy probability, and why Brier score alone does not isolate calibration. Report sample sizes, outcome windows, and uncertainty. This release has no trained or calibrated model and makes no performance claims.

## Verification

Unit tests exercise official-host/path restrictions, input bounds, SEC pagination, issuer identity, latest/source filing selection, exact-quote checks, accession-level corroboration, financial periods, failed AI calls, caching, partial failure and access cooldowns. The isolated filing-browser test covers direct collection → automatic dossier → financial scenario → call queue → outcome snapshots → opt-out → reload during analysis, plus preserved legacy views. The earlier search/evidence and underwriting suites remain. Synthetic tests establish behavior, not predictive accuracy or acquisition profitability.
