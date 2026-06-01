# Thibaud Sync: "Global Parameters"

> **Status:** Sections 1–3 below are the **pre-sync agenda** (what we asked). Sections 4–5 are the **log of what was heard and what to follow up on** — fill them in right after the sync. The decision framing lives in [engineering-brief.md](engineering-brief.md); resolved open questions should be folded into [spec.md](spec.md)'s Open-questions table so there's one canonical place for the current truth.

**Goal of this sync:** Align on the engineering and architectural feasibility of adding centralized "Global Parameters" (or Parameter Stores) to decouple configuration variables from individual feature flags, and get your take on 3 potential UX directions.

---

## 1. The Problem We're Solving
Right now, configuration variables (like discount rates, banner texts, or UI thresholds) belong uniquely to specific feature flags.
- Reusing these parameters across multiple flags requires manual and repetitive manual duplication.
- Updating a shared promotional value simultaneously across several live experiments is cumbersome and highly prone to inconsistencies.
- **The Benchmark:** Competitors like Statsig offer centralized "Parameter Stores" where variables can be managed independently and then dynamically mapped to gates or experiments. We need a similar way to manage global state without redeploys or manual tracking of where variables live.

---

## 2. Three Proposed UX Directions
I've outlined 3 potential ways to introduce Global Parameters into the Kameleoon dashboard. I'd love your thoughts on the architectural impact and scale of each approach.

### Direction A: Global Parameter Hub (Flat List)
- **How it works:** We introduce a new "Parameters" tab next to the main dashboard tabs (Overview, Approvals, Health). It acts as a simple flat repository of reusable variables (Key, Type, Value). When configuring a specific feature flag's variation, users can select a "Link to Global Parameter" option instead of defining a static variable.
- **Why it solves the problem:** It's a single, simple source of truth that separates the concept of "reusable variables" entirely from the evaluation of "targeting rules".
- **Dev question:** How straightforward is it to update the flag evaluation engine to resolve variable references to this global list during runtime?

### Direction B: Parameter Stores (The Statsig Model)
- **How it works:** We create a dedicated "Parameter Stores" entity outside of the standard flag list. Users create a Store (e.g., `checkout_configs`), which acts as a JSON object containing multiple related parameters. These stores can have their own targeting rules independently.
- **Why it solves the problem:** Strongly namespaces variables and scales much better for enterprise clients with hundreds of parameters compared to a flat list.
- **Dev question:** Does this require building a completely parallel evaluation system and new SDK methods (like `Client.getParameterStore()`), or can we adapt our existing flag infrastructure?

### Direction C: "Promoted" Flag Variables (In-Context Reusability)
- **How it works:** Variables are still created organically inside feature flags. However, users can toggle a "Share Workspace-wide" switch on a variation variable. Once shared, they appear in a "Library" side-panel when editing other flags for quick insertion.
- **Why it solves the problem:** Extremely low friction. It fits our current mental model perfectly without requiring users to navigate to a new section to create a basic variable.
- **Dev question:** If a variable is "promoted" from Flag A, and then Flag A is deleted or archived, what happens to the state of that variable if it's currently linked in Flag B? Does this create cascading dependency issues?

---

## 3. Key Technical Questions I Have for You
Before we commit to a design direction, I need to understand the backend/SDK ramifications:
1. **SDK Fetching Mechanisms:** If we decouple parameters from flags entirely (Directions A & B), does the frontend SDK have to fetch all parameters on startup alongside flags? How much payload bloat does this introduce?
2. **Variable Resolution:** If a global parameter's default value is overridden by a specific experiment, does the backend handle that resolution before pushing down to the client, or does the client evaluate the override locally?
3. **Traceability Indexing:** Can our architecture efficiently query and display a dependency graph for the UI? E.g., if a user edits "black_friday_discount", we need to instantly list every active flag and rule that currently links to it. Can the backend provide this mapping cheaply?

*Let's discuss which direction aligns best with our current SDK state and backend constraints!*

---

## 4. What we heard (fill in after the sync)

> Capture the dev lead's answers here. Suggested structure — replace the placeholders with actual responses.

- **Payload approach:** _[same flag config file vs separate on-demand fetch — what was decided?]_
- **Variable resolution (server vs client):** _[where does the override resolve?]_
- **Dependency-graph queries:** _[can the backend cheaply provide the "where is this used?" mapping?]_
- **Preferred UX direction (A / B / C):** _[flat list vs Stores vs promoted variables — and why?]_
- **SDK appetite for `getGlobalParameter`:** _[is Path 2 feasible / wanted? rough cost?]_
- **Other constraints raised:** _[anything unexpected]_

## 5. Follow-ups

> Action items and any questions that stayed open. Open questions that affect the product should be moved into [spec.md](spec.md)'s Open-questions table (the canonical list) rather than living only here.

- [ ] _[owner]_ — _[action]_
- [ ] Fold resolved items into `spec.md` Open-questions table.
- [ ] Update `engineering-brief.md` §1b decisions with the outcomes.
