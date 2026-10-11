# Validation record

September 7, 2026; local Windows environment, Node.js v26.3.1.

- Financial calculation tests passed: zero-interest amortization, known-payment comparison, debt payoff, interest-only balloon, sources/uses balance, CFADS deductions, funding gap, earnings and rate stress, zero-debt behavior, invalid inputs, and SBA cap flag.
- Server adapter and workflow tests passed. AI responses were mocked for contract testing, not represented as real model output.
- Headless Chrome exercised all ten screens, 48 initial demo combinations, adding a business, invalid debt-share rejection, outreach draft generation, checklist persistence, CSV quoting, 15-phase initialization, and completion-gate rejection. No JavaScript errors occurred during the tested interactions.
- Live USAspending query for `HVAC` returned 25 award records through the implemented adapter. This confirms a point-in-time API request, not scheduled monitoring or acquisition lead qualification.
- No Ollama model, SAM API key, or Brave API key was configured. Live AI generation, SAM, and Brave searches have not been end-to-end validated with this user's credentials/model.

The browser test uses an isolated Chrome profile in `.browser-test`, not the user's normal browser profile. `tests/overview.png` captures the workbench. Unit tests run offline; the browser smoke test requires the server and a Chrome debugging session on port 9228.

This is a tested initial workbench, not a production deployment. No outreach, financing application, trade, or transaction was executed.


## September 8 discovery and matching update

Passed 18 Node tests and 15 financial assertions. Existing ten-screen browser smoke passed. New live browser test fetched 12 public Vested featured listings, evaluated eight scenarios per financially usable listing, verified deduplication, generated outreach drafts, required missing earnings definitions and cost inputs for pipeline promotion, verified ranking filters, and reloaded persisted inbox data. Live Brave search was not tested because no API key is configured. Automatic scheduling uses a 30-minute browser interval and has not been observed through a complete interval; browser sleep/throttling can delay it.


## September 8 sourcing campaigns update

25 Node tests and 15 financial assertions pass. Tested the four-lane Brave batch adapter with mocked responses, including page bounds, partial rate-limit failure, and result classification; no real Brave key is available, so live Brave activation is pending. Windows DPAPI encrypted/decrypted a synthetic test credential in a temporary directory that was removed afterward. HTTP tests verify private credential paths are not served and foreign-origin credential updates are rejected.

The isolated Chrome test passes on all eleven screens. It verified saved campaign criteria, missing-key messaging without consuming local batch allowance, queue deduplication, contact-source requirements, activity and funnel updates, do-not-contact suppression, and persistence across reload. One browser test exposed named form fields shadowing the form ID property; corrected handlers to read the ID attribute and reran successfully. Recurring schedules and provider billing limits are not live end-to-end tested.
