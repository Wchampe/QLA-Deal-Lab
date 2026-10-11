# QLA Deal Lab

Independent acquisition research workbench inspired by QLA's industry focus, experienced team, acquisitions, and operating discipline. Not affiliated with Dan Pena. US/USD baseline researched September 7, 2026.

## Open

Double-click `index.html` for the offline application. For local AI agents and live government API searches, run `Start.cmd` (requires Node.js 22+) and open http://127.0.0.1:8765. No npm packages are needed. Node.js is already available on this computer.

Install Ollama separately and download a model suitable for your hardware. `Start.cmd` starts Ollama when needed and uses `E:\ollama-models` when that folder exists and `OLLAMA_MODELS` is not already set. Qwen (`qwen38-local:latest`) is the default; DeepSeek-R1 (`deepseek-r1:14b`) is an available reasoning alternative. Use **Local AI model** in Agent workspace, Data & setup, or Off-market intelligence to refresh installed models or save a different selection. One selected model powers new analyses; the other models do not need to be run. The model definitions copied from `AI - Model` are in [`ollama/`](ollama/README.md). AI uses only local Ollama at 127.0.0.1:11434. Optional `SAM_API_KEY` enables SAM.gov searches; `BRAVE_API_KEY` enables live web searches using your own Brave account; USAspending needs no key. Search calls transmit the search phrase. AI reasoning stays local.

On Windows, `Start.cmd` keeps one workbench terminal open. Ollama runs in a hidden console that its GPU probes and model helpers share, preventing repeated flashing command windows. Startup logs are in `private/ollama-stdout.log` and `private/ollama-stderr.log`; they are replaced when a new Ollama service starts. An already-running Ollama service is reused.

## Workflow

Open **Full Deal Workflow** to create a 15-phase plan with 45 tasks, 30 evidence items, named reviewers, target dates, dependencies, and decision history. Five published acquisition case studies provide reference lenses. Read [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) and the worksheets in `templates/`. The sequence and timing are recommended planning assumptions; the examples do not disclose complete transaction files.

Set buyer cash and screening DSCR. Explore source searches, enter deals or import JSON/CSV, compare financing, run specialist agents, track contacts, prepare outreach drafts, and record outcomes. Export backups regularly. Imported listings need source links and financial evidence. Directory entries are research starting points, not connected feeds or committed lenders. Fictional demo deals are clearly labeled.

Data persists in this browser's local storage. Clearing site data erases it. File mode and localhost mode have separate storage; move data using backup export/import. This is a single-user prototype without shared authentication, encrypted storage, document vault, scheduled crawling, or email sending. Restricted marketplaces require authorized manual imports; no login bypass.

The financial model uses monthly amortization, a seller interest-only option with balloon, acquisition costs, working capital, capex, cash taxes, replacement-owner compensation, downside stress, and exit debt payoff. All rates, terms, multiples, and equity percentages are editable illustrative assumptions, not quotes. DSCR uses estimated cash available for debt service; lender definitions differ. Seller notes are debt, not automatically equity injection. Investor ownership is negotiated; the simplified model excludes preferred returns, promote, and complex waterfalls. Exit proceeds exclude cash distributions and exit taxes. Avoid double-counting owner pay already deducted from EBITDA. Award values are not revenue, profit, recurring cash flow, or seller intent.

Run `node --test tests/server.test.js tests/workflow.test.js` and `node tests/finance.test.js`. Actual AI/API tests require a model, network, and credentials. See `RESEARCH.md`, `agents.json`, `finance.js`, and `server.js` to extend the project. Changes to underwriting rules and learning recommendations require deliberate review; the app never rewrites itself.

## Setting local options in PowerShell

From this project folder, set only the options you have configured, then run the server:

```powershell
$env:QLA_MODEL = 'YOUR_INSTALLED_OLLAMA_MODEL'
# Optional: set SAM_API_KEY and BRAVE_API_KEY in this terminal using your own credentials.
node server.js
```

Never paste credentials into deal notes, source URLs, shared backups, or committed files. Use `ollama list` to see your installed model names. This project does not include an AI model or paid API subscription.

## Listing discovery and matching agent

In Sources & discovery, use **Search & run possibilities** to pull the current Vested Business Brokers featured listings and evaluate eight provisional financing scenarios per listing. Only listings with positive reported revenue and positive reported cash flow are returned; missing or zero values are excluded from the qualified results. This adapter needs no API key and covers a changing featured homepage sample, not the full broker inventory. Broader Brave searches require BRAVE_API_KEY and remain research leads until revenue and cash-flow fields are supplied. Source URLs deduplicate refreshed records into a persistent discovery inbox.

**Start automatic searches** repeats the broker fetch every 30 minutes while this browser app is open; background tab throttling or sleep can delay runs. Stop with the same button. It is a deterministic matching agent, not an LLM, and sends no outreach. It can prepare editable email and call notes.

Provisional matching assumes 4% closing costs, 5% initial working capital (both of asking price), $75,000 operator pay, and 5% capex, 20% cash taxes, 3% annual working capital (of reported cash flow). Edit these in the agent. Broker cash flow is unconfirmed, not automatically SDE or EBITDA. Missing price/cash flow prevents scoring; unknown cost assumptions remain explicit. Review earnings definitions and costs before promoting a listing into the pipeline.

Deal & financing ranks scores completed pipeline models out of 100: funding fit 25, full-term downside resilience 30, annual cash yield relative to acquisition uses 20, evidence 15, source recency 10. Failed coverage, funding gaps and unresolved program fit sort after unblocked scenarios. Weights are screening preferences, not calibrated predictions. Compare best scenario per business or all scenarios; filter and export ranked CSV. Financing templates are hypothetical, not actual quotes or commitments.

## Broader sourcing and cold-call workflow

For company evidence and prospects before a broker listing, open **12 Off-market intelligence**. This is separate from the manually saved Liquidity Signals notes. See [OFF_MARKET_INTELLIGENCE.md](OFF_MARKET_INTELLIGENCE.md) for the research design, source coverage, scoring rules, and how the outcome history can support a trained model later.

Open a company dossier and use **Sale inquiry email & company contacts** to prepare a company-specific sale inquiry. **Find public contacts** checks recent SEC filings and filed exhibits for published business emails and named executives, with source links, excerpts and dates. New scans collect these candidates automatically. No email address is guessed; when the filings have none, use the company/leadership search links or enter a public contact with its source. The contact lookup needs the local server, but no Brave key or local AI model.

Choose **Use contact**, enter your name under **Your introduction & company-specific details**, select the whole company or a division/assets, then **Generate / refresh draft**. Edit the subject and message, **Copy email** or **Download email**, and optionally **Save contact to call queue**. Drafts and your recipient details save locally, survive research refreshes and appear in backups. The earlier manual evidence files include the same editor with owner/contact research links. Opt-outs block these outreach actions. The app does not send email.

The **Email template** selector also offers **QLA-inspired: initial owner approach** and **QLA-inspired: request a meeting**. These are original app adaptations with references to *Your First 100 Million*, Appendix M, and links to Dan Peña's official resources. Choose an approach, then generate the draft; changing the selector preserves existing text until you regenerate. See [QLA template sources](templates/qla-outreach-sources.md) for provenance.

The September 19 [intelligence roadmap and workflow notes](INTELLIGENCE_ROADMAP.md) capture the longer-term vision, proposed operating loop, AI roles, multi-source pilot, watchlists, outcome-based evaluation and development gates. These are planning notes, not additional implemented capabilities.

The default workflow now collects **actual SEC filings directly**. Leave company, industry, and state blank for a broad scan, choose a signal focus, then select **Collect filings & analyze companies**. The server discovers matching filings, joins them to the issuer's SEC CIK, downloads up to six related filings and selected exhibits, retrieves reported financial facts, and uses your local Ollama model to connect evidence across documents. Dossiers and source quotations appear in the company shortlist automatically. No broker/news search or Brave key is involved in this collector.

Each dossier distinguishes a possible early lead, an already-disclosed process, a signed/completed transaction, insufficient evidence, and incomplete AI analysis. Cross-filing connections require citations from separate accessions; quotation text is checked against downloaded passages. Interpretation is still an AI inference. The financial table preserves reported USD amounts, periods and source links. A separate worksheet saves your explicit revenue, EBITDA margin, multiple and net-debt assumptions. Outcomes in the linked call queue preserve the pre-response assessment. The app has no calibrated sale-probability model.

Coverage is currently reporting companies and potential divisions/assets they own, not all privately held businesses. Only topic-selected passages from a bounded filing sample are analyzed. State/court/UCC feeds are not connected. The earlier Brave/manual-evidence workflow and all its saved records remain under **Earlier saved web research & manual evidence**.

Choose Qwen or DeepSeek in the **Local AI model** panel. The selected model is shared with the agent workspace and saved in `private/ollama.json`. An explicit `QLA_MODEL` environment variable overrides the saved selection at startup. The filing agent uses automatic GPU/RAM allocation, an 8,192-token context, bounded excerpt input and streamed progress; large models can take several minutes per company. DeepSeek-R1 has an additional reasoning token allowance, and its reasoning contributes to the progress counter while only its final answer is stored. AI failures retain collected records without a seller conclusion. Optional `QLA_SEC_USER_AGENT` identifies your organization/contact in SEC requests. SEC traffic is limited to about 1.5 requests/second, uses an in-memory cache, and pauses for 15 minutes after HTTP 403/429. No SEC API key is required. Full-text search uses the SEC website's search endpoint; its undocumented response shape may change.

Restart the local `Start.cmd` server after updating these files, then refresh the browser. The new collector requires the updated server. Run the full suite with `npm.cmd test`; `npm.cmd run test:filings-browser` exercises the filing collector and UI using isolated browser storage and synthetic SEC/model responses. `node tests/browser-intelligence.js` checks the preserved legacy workflow. No paid API requests are used by these tests.

Open **11 Sourcing campaigns**. The Brave connection can be completed there: create/activate your own Brave Search API account, generate a key, enter it in the password field, and choose **Verify & save key**. Verification makes one live search request. Keys are encrypted using Windows DPAPI in `private/brave-key.dpapi`; the server alone reads that file. It is not served as a static file, copied to browser storage, or included in workspace exports. `BRAVE_API_KEY` and `BRAVE_SEARCH_API_KEY` environment variables are also supported. No paid account or API key was created during development.

A campaign searches four lanes: possible listings, owner prospects, community discussions, and financing research. Each batch requests one page of up to 20 results per lane (four API requests). Subsequent batches page through offsets 0-9; canonical source URLs deduplicate records within each lane. Failures are displayed per lane; partial results are retained and a failed batch does not advance the page. Search snippets are not normalized financial statements or evidence that a company is for sale.

The default campaign is business services in the United States, with a four-batch daily limit in this browser. Edit industry and geography before scaling. Paid automatic web search is initially off. Enable the campaign checkbox and start automatic matching under Sources & discovery to include web batches every 30 minutes while the browser app is open. The local limit includes attempted manual and automatic batches; clearing storage, using other browsers or making API calls outside the app is not covered. This is not a provider billing cap.

Add selected results to the call queue. Enter public business phone/email details with their source URL, schedule follow-up dates, prepare call notes, and record completed calls/emails and their outcomes. Do-not-contact records remain stored for deduplication and block additional outreach drafts/activity. No calls or messages are sent. Channel statistics count recorded attempts and unique prospects reaching conversations, interest and receipt of financials.

Communities and referral research: Searchfunder (https://searchfunder.com/), r/buyingabusiness (https://www.reddit.com/r/buyingabusiness/), r/businessbroker (https://www.reddit.com/r/businessbroker/), and IBBA's broker directory (https://www.ibba.org/find-a-business-broker/). Discussion claims are anecdotal; member-only content requires your own access.
