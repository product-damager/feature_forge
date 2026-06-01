# Global Parameters — Analysis

> For the one-screen version used to anchor the Opportunity meeting, see [opportunity-one-pager.md](opportunity-one-pager.md). This document is the full argument behind it.

## Executive summary

- **Problem.** Reusable config values are trapped *inside* individual Feature Flags. That causes duplication, inconsistency across platforms, zero traceability, and forces a developer into every shared-value A/B test.
- **Competitor insight.** Statsig already solves this with Parameter Stores, but at the cost of a heavy mental model (Stores vs Dynamic Configs vs Gates vs Layers) and weak traceability.
- **PM mental model.** Keep it to three primitives: **Feature Flags** turn code on/off, **Experiments** compare variations, **Global Parameters** carry reusable values both can read — and that experiments can temporarily take control of.
- **Recommendation.** Ship **Option A (Flat Hub)** on **Path 1** sequencing, with the UI and language already aligned to **Path 2** (`default value`, `current effective value`, `override source`).
- **Sequencing.** MVP delivers values through the existing flag path (low engineering risk); V2 adds a first-class parameter-resolution path in the SDK to unlock no-code, parameter-native experiments — but only after PM/dev demand is validated.

> **Differentiation in one line:** simpler mental model + a visible dependency graph + reuse of **Mutually Exclusive Groups** instead of inventing Statsig's "Layer" concept. See [§7](#7-where-kameleoon-can-differentiate-from-statsig) for the full list.

---

## 1. Problem

Configuration values in Kameleoon Feature Experimentation today are captured *inside* a specific Feature Flag's variation or targeting rule. There is no first-class concept of a reusable value.

This creates four concrete pains:

- **Duplication.** A single value (`discount_rate = 20`) is re-typed inside every flag and platform that needs it.
- **Inconsistency risk.** Updating it requires editing every flag manually. Missing one fractures the user experience across web/iOS/Android.
- **No traceability.** There is no answer to *"where is this value used?"* without manual auditing.
- **No safe reuse.** Teams that try to fake reuse with a "config flag" still have to wire each consumer manually and lose dependency visibility.

The same friction blocks a strategic capability: **parameter-native experimentation**, where a PM can A/B test a shared value without a developer creating a new flag and shipping new code.

---

## 2. Competitor insight — Statsig

Statsig solves this with two related concepts. Both are relevant; the distinction matters.

### Parameter Stores
A flat-named **parameter** is what application code reads:
```
store.get("discount_rate", 20)
```
Each parameter has a default value but can be **remapped remotely** to be backed by a Gate, an Experiment, a Dynamic Config, or a Layer — without code changes. The whole point is **decoupling code from a specific entity**.

### Dynamic Config
A structured **JSON blob** delivered to the client, with optional targeting rules. Closer to "remote config." Often used as a backing source for parameters, or directly when a related set of values needs to ship as one structured object.

### What Statsig does well
- **Decoupling.** One SDK call (`getParameterStore`) serves any backing source. PMs can swap a static value → experiment → static winner without involving engineering.
- **Logical grouping** through Stores prevents an unmanageable flat list at scale.
- **Layers** mathematically guarantee mutual exclusivity between experiments touching related parameters.

### Where Statsig is weak
- **Mental model overhead.** "Parameter Store vs Dynamic Config vs Feature Gate vs Layer" creates real cognitive load for new users.
- **Traceability.** It is hard to see, at a glance, what is currently overriding a given parameter and which surfaces consume it.

### What Kameleoon should not copy
- A separate "Layer" abstraction. Kameleoon already has **Mutually Exclusive Groups** that solve the same math and live inside a familiar workflow.
- A parallel-but-equal "Dynamic Config" entity *as a user-facing concept*. Treat Dynamic Config as a **possible implementation pattern** (a structured JSON-shaped parameter), not a separate top-level surface that PMs have to learn.

### Wider market landscape
Statsig is the sharpest comparable, but the pattern is broader and worth naming so reviewers see we know the field:
- **LaunchDarkly** exposes typed flag variables and "AI Config" but keeps values bound to flags — same coupling pain we're solving, no centralized reusable layer.
- **Split / Optimizely** lean on flag-scoped config and audience targeting; reuse across flags is again manual.
- **Remote-config tools (Firebase Remote Config, AWS AppConfig)** centralize values well but have no native experiment-attribution story — changing a value and *measuring* it are separate worlds.

The gap is consistent across the market: either values are reusable *or* they are experiment-attributable, rarely both with visible traceability. That intersection — reusable, traceable, experiment-controllable — is the opening Global Parameters targets.

---

## 3. PM mental model (proposed for Kameleoon)

Three primitives, each with a clear job:

| Primitive | Job | Output |
| --- | --- | --- |
| **Feature Flag** | Turn blocks of code or rules on/off, gate exposure | Boolean / variation key |
| **Experiment** | Compare variations and attribute results | Variation assignment + analytics |
| **Global Parameter** | Hold a reusable value | Typed value (string / number / boolean / JSON) |

**Golden rule:** Parameters don't run tests; Experiments do. A Global Parameter has a **default (effective) value**. An Experiment can **temporarily take control** of that value. When the experiment ends, the parameter returns to its default — or the PM updates the default to the winner.

This rule keeps attribution clean: any user who saw a non-default value did so *because* an experiment officially routed them there, not because some unrelated code copied a value.

---

## 4. Global Parameters vs neighboring concepts

| | Feature Flag | Experiment | Dynamic Config (Statsig term) | **Global Parameter** |
| --- | --- | --- | --- | --- |
| Primary purpose | On/off & rollout | Compare variations | Ship structured JSON | Reuse a value |
| Has variations? | Yes | Yes | No (single shape) | No (single value, possibly overridden) |
| Tracks analytics? | Indirectly | Yes | No | Inherits from the experiment that controls it |
| PM creates one to… | Release a feature | Learn what wins | Push a config blob | Centralize a value used in many places |
| Code reads via | `getVariation(flag)` | (via flag, today) | `getConfig(name)` | `getGlobalParameter(name)` *(proposed)* |

**Dynamic Config is not a separate user-facing concept in our framing.** A "JSON-typed Global Parameter" covers the same ground without forcing PMs to learn another entity.

---

## 5. Solution options

### Option A — Flat Parameter Hub (recommended starting point)
A new tab/section: **Global Parameters**. Flat list. Each parameter has a key, type, default value, description, and a dependency view.
- **Pros:** Simplest mental model. Lowest engineering scope. Ships value immediately.
- **Cons:** A flat list can get long at enterprise scale.
- **Mitigation:** Tags / search / folders later if signal supports it.

### Option B — Parameter Stores (grouped, Statsig parity)
Group parameters into named Stores (`Checkout`, `Promo_Configs`). Stores can have their own targeting.
- **Pros:** Scales to hundreds of parameters. Strong namespacing.
- **Cons:** Adds a second concept (Store + Parameter) and a second SDK convention. High engineering cost.
- **Verdict:** Defer until the flat list is shown to scale-fail.

### Option C — "Promoted" flag variables
Variables stay inside flags but can be toggled "shared workspace-wide."
- **Pros:** Lowest friction creation; fits today's mental model.
- **Cons:** Ownership is messy. If the originating flag is archived, what happens to dependents? Traceability becomes worse, not better.
- **Verdict:** Reject. The whole point of this feature is to **decouple** values from flags, not to add another way to couple them.

---

## 6. The architectural crossroad

Even after picking Option A for the UI, there is a deeper decision about how the parameter actually flows to the SDK.

### Path 1 — Feature Flags stay the center of the universe
Global Parameters exist as a UI convenience. Under the hood, every parameter is delivered through a Feature Flag mechanism. To run an experiment on a parameter, a developer must still create and call a flag.

- **Pro:** Minimal backend change. Reuses existing evaluation engine.
- **Con (fatal for the strategic vision):** PMs cannot run a parameter A/B test without a developer shipping new code. This is the *exact* friction Statsig removes. Most of the strategic upside is left on the table.

### Path 2 — Parameter as a first-class evaluation entity
Introduce a parameter evaluation path independent of flags. Eventually allow an experiment to attach directly to a parameter ("Pure Experiment" or "Parameter Experiment"), so the developer's `getGlobalParameter("x")` call is enough — the engine resolves traffic split + attribution on the server.

- **Pro:** Unlocks no-code parameter experimentation. Long-term competitive position vs Statsig.
- **Con:** Significant backend and SDK work. New evaluation path. Requires a new SDK method.

### Recommended path
**Ship Path 1 visually now; commit to Path 2 architecturally later.**

That means:
1. **MVP (Path 1-shaped):** Flat Hub. Parameters can be referenced from Feature Flag variables and from Experiment variations. Experiments still flow through a flag. The UI already speaks the Path 2 language ("default value", "current effective value", "override source") so users develop the right mental model.
2. **V2 (Path 2):** Add a parameter-resolution path in the SDK and allow an Experiment to attach directly to a parameter without a wrapping flag.

This sequencing avoids two failure modes at once:
- Shipping a beautiful Path 2 the org can't deliver in one cycle.
- Shipping a Path 1 with PM language that locks us into "flags forever" and makes Path 2 a confusing migration.

---

## 7. Where Kameleoon can differentiate from Statsig

- **Visible dependency graph.** A "Where is this used?" panel on every parameter, showing every flag, rule, and experiment currently referencing or overriding it. Statsig users routinely lose this visibility. We make it the headline of the parameter detail page.
- **No new "Layer" concept — reuse what exists.** Statsig invented "Layers" purely to keep experiments that touch related parameters mutually exclusive. Kameleoon already ships **Mutually Exclusive Groups**, which deliver the identical mathematical guarantee inside a workflow PMs already understand. So where Statsig adds a concept, we *reuse leverage we already own* — exclusivity between experiments controlling the same parameter is enforced via Mutually Exclusive Groups, not a new abstraction. This is a differentiator, not a missing feature.
- **Native integration over parallel sprawl.** Parameters appear *inside* the existing flag variable picker as a "Link to Global Parameter" option, not only as a separate workflow. PMs encounter them in the moment of need.
- **Honest override hierarchy.** The detail page makes the resolution order explicit (**default → flag override → experiment override**) instead of hiding it.

---

## 8. Recommendation

**Build Option A (Flat Hub) on Path 1 sequencing, with the UI and language already aligned to Path 2.**

Specifically for the first prototype:
- A flat Global Parameters surface — **placed inside Settings** (alongside *Approvals settings* and *Holdouts*) rather than as a top-level tab, per the built prototypes.
- A parameter detail page. *(As built, the prototypes show a simpler slice of this: Direction 1 = value + the flags that consume it (blast radius); Direction 2 = a parameter-first source editor where a parameter's value comes from a Static value or a Feature Flag variable. The full default → flag → experiment override hierarchy and effective-value framing remain the broader vision, not yet fully prototyped.)*
- A way to source a parameter's value from a Feature Flag variable. *(As built in Direction 2: the parameter references a flag variable, project- and type-matched. A Features-side "Link to Global Parameter" entry point — the inverse, initiated from the flag editor — is a possible future addition, not built.)*
- Visible explanation of how an experiment temporarily takes control of a parameter. *(Vision / Path 2 — not in the current prototypes.)*
- No Stores, no Layers, no governance UI, no live SDK.

Validate with PMs (do they want flat or grouped?) and developers (would they prefer `getGlobalParameter(...)` or just better variable sharing?) before committing to Path 2 engineering.

---

## 9. Before / after customer stories

Three concrete scenarios that turn the abstract pains into something an Opportunity reviewer can picture. Impact is qualitative for now; the KPIs in §10 are how we'd make it quantitative.

### Story 1 — Cross-platform promo discount
- **Today.** A Black Friday discount lives as `discount_rate` inside N flags across web, iOS, and Android. Changing it means opening every flag, finding the variable, editing each one — and hoping none were missed.
- **With Global Parameters.** The PM changes one value and can preview every affected surface from the parameter's "Where is this used?" panel.
- **Target impact.** One edit instead of N; fewer manual QA passes; no platform price drift.

### Story 2 — Shared copy across experiments
- **Today.** The same hero text is copy-pasted across several experiments. Edits drift, and the coupling between them is invisible — nobody can see that test B silently depends on test A's copy.
- **With Global Parameters.** Experiments take control of a single source of truth, with attribution preserved on the controlling experiment. The coupling is now explicit and traceable.
- **Target impact.** Eliminated copy-paste errors; visible coupling; clean attribution.

### Story 3 — Complex JSON config
- **Today.** A structured config (feature list, layout rules) is edited inline inside flags — dangerous, scattered, and untraceable.
- **With Global Parameters.** A JSON-typed parameter centralizes the config; every consumer is listed, and changes flow from one place.
- **Target impact.** Centralized, traceable structured config; lower blast radius on a bad edit.

---

## 10. Opportunity sizing & leading KPIs

**Rough sizing (to validate).** A meaningful share of flags in large customers are effectively *config flags* — flags that exist only to carry a value, not to gate code. Global Parameters would centralize these and, on Path 2, unlock parameter-native tests on them without new flag code. Confirming this ratio in a few enterprise workspaces is the first sizing exercise.

**Leading KPIs for the MVP:**
- **Number of Global Parameters created** per active workspace.
- **% of new experiments / flags that link a Global Parameter** instead of a hardcoded variable.
- **Number of parameters with at least one active dependency** (created *and* used, not just created).
- **Reduction in duplicated values** across flags and platforms.
- **Time to update a cross-channel value** (one edit vs N flags).

These give the Opportunity committee a path from prototype → measurable impact. The headline subset is mirrored in [opportunity-one-pager.md](opportunity-one-pager.md).

---

## 11. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Flat hub doesn't scale for enterprise customers with 100+ parameters. | Tags + search in MVP; evaluate signal from early adopters before building grouped Stores (Option B). |
| SDK cost of Path 2 is high (new method, new evaluation path, all SDKs). | Validate adoption and PM demand on Path 1 first; run a small architecture spike during/after prototype eval before committing. |
| Confusion around override semantics (which value wins, and why). | Strong UX copy, a consistent **default → flag override → experiment override** hierarchy everywhere, and an explicit "current effective value" panel in the UI. |
| Mental-model overlap with "config flags" PMs already fake today. | Position Global Parameters as the *decoupling* answer; show the dependency graph the config-flag hack can't provide. |
| Path 1 language locks us into "flags forever," making Path 2 a confusing migration. | Speak Path 2 language (`default`/`effective value`/`override source`) from day one so the upgrade is conceptual, not re-education. |

---

# Feature Discovery - Global Parameters

## Step 1 — Context Understanding

**Product Purpose & Core Users**
Kameleoon Feature Experimentation enables product teams, developers, and QAs to manage, test, and safely roll out new features using feature flags, decoupling deployment from release.

**The Problem**
Currently, configuration variables (such as banners, discount rates, feature list lengths) are often hardcoded or duplicated across multiple feature flags and experiments. When an app needs a standardized parameter (e.g., a Black Friday "global discount rate" used across mobile, web, and email), updating it dynamically without redeploying code or manually syncing 5 different feature flags is difficult and can lead to errors. 

**Constraints**
- **UX:** The feature must feel like a native extension of the Kameleoon dashboard. It needs to fit logically among existing tabs (Overview, Approvals, Health, Settings) or main navigation without cluttering the flag list.
- **Technical/Business:** The SDK needs to fetch these parameters efficiently. If parameters are fetched independently of flags, it dictates a new SDK method (`getGlobalParameter` or `getParameterStore`), which is a significant architectural decision.

---

## Step 2 — Competitive Analysis

**Competitor:** Statsig ("Parameter Stores")
**Pattern:** Statsig groups related configuration variables into "Stores" (e.g., a `www_homepage` store containing `tagline`, `hero_image`, `discount`).

**Strengths:**
- **Decoupling from Flags:** Parameters start with a simple static value and can later be dynamically remapped to connect with Feature Gates, Experiments, or Layers without changing the code.
- **Logical Grouping:** Parameter Stores prevent a massive, unmanageable flat list of global variables.

**Weaknesses / Friction:**
- **Traceability:** It can become difficult to visualize what underlying experiments or gates are actively overriding a parameter at any given time.
- **Complexity:** Navigating between "Parameter Stores", "Dynamic Configs", and "Feature Gates" creates mental overhead for new users.

**Differentiation Opportunities for Kameleoon:**
- **Visual Traceability:** Provide a unified "Where is this used?" view that clearly illustrates which flags or targeting rules are actively referencing or overriding a global parameter.
- **Seamless Integration:** Rather than creating an entirely new distinct concept, integrate global parameters cleanly with existing variable management inside flag rules.

---

## Step 3 — Current UX Analysis

**Current User Flow:**
Currently, users define variables uniquely *inside* a specific feature flag's variation or targeting rule. (e.g., adding a JSON/String variable to an "On" variation).

**Friction Points & Cognitive Overload:**
- **Duplication Toil:** Reusing a string or JSON configuration across multiple flags requires repetitive manual entry.
- **State Inconsistency Risk:** If a PM wants to update a shared "promo_banner_text", they have to track down every active flag using it. Missing one leads to inconsistent user experiences.

**Missing Affordances & Inconsistencies:**
- There is no centralized "Library" or "Variable Hub."
- The dashboard groups flags in the "Overview" tab. Adding standalone variables into this list would be confusing because parameters do not inherently have "Rules" or "Targeting" out-of-the-box (unless mapped to an experiment).

---

## Step 4 — Problem Synthesis

**Core User Problems:**
1. **Inefficient Parameter Management:** Users lack a systematic way to create, store, and manage standardized values used across multiple features or variations.
2. **High Risk of Inconsistency:** Updating shared values across ongoing experiments requires manual sync, risking fractured user experiences.

**Secondary UX Issues:**
- Lack of traceability: Even if users try to mock a global parameter using a dedicated "Config Flag", it's hard to see which other features depend on it.

**Prioritization (By Impact):**
1. **Centralized Hub (CRUD):** The ability to create independent global parameters (or grouped stores).
2. **Flag Linking / Overrides:** The ability to reference a global parameter inside a flag's evaluation logic.
3. **Dependency Mapping:** Showing the relationship between parameters and flags.

---

## Step 5 — Solution Proposals

### Solution Direction 1: The "Global Parameter Hub" (Flat List)
- **Concept Name:** Parameter Library
- **Description:** A new tab next to 'Overview', 'Approvals', 'Health', etc., called "Parameters". It serves as a flat repository of global variables (Key, Type, Default Value). 
- **What it solves:** Provides a single source of truth for all decoupled variables.
- **Key UX Changes:** Inside any feature flag's variation configuration, users can choose "Link to Global Parameter" instead of defining a custom static variable.
- **Why it's better:** Simple mental model. Easy to understand that these are just variables available to use anywhere.
- **Trade-offs:** A flat list can become overwhelming if a large organization creates hundreds of parameters.

### Solution Direction 2: Groupped "Parameter Stores" (The Statsig Model)
- **Concept Name:** Parameter Stores
- **Description:** A dedicated entity in the left-hand navigation. Users create a "Store" (e.g., `Checkout Configs`) and populate it with multiple variables.
- **What it solves:** Provides logical grouping and namespace protection (`CheckoutConfigs.ButtonColor`).
- **Key UX Changes:** SDK adoption of fetching entire "Stores" as JSON objects. The UI gets a dedicated section for "Stores" that can have their own targeting rules independently of Feature Flags.
- **Why it's better:** Highly scalable for enterprise teams. Prevents list clutter.
- **Trade-offs:** Adds conceptual bulk. Requires developers to integrate a new SDK convention rather than just reusing existing flag evaluation paths.

### Solution Direction 3: "Promoted" Flag Variables
- **Concept Name:** Shared Variables
- **Description:** Variables are still created inside Feature Flags. However, users can toggle a variable to be "Shared Workspace-wide." Once shared, it appears in a quick-insert side panel when editing other flags.
- **What it solves:** Allows organic creation of reusable parameters without forcing users into a separate "Global" section initially.
- **Key UX Changes:** A "Make Global" toggle on variation variables, and an "Insert from Library" side panel.
- **Why it's better:** Best in-context creation experience. Very low friction.
- **Trade-offs:** Ownership becomes messy. If Flag A created a shared variable, and Flag A is archived/deleted, what happens to the shared variable used in Flag B? 

---

## Step 6 — Critical Thinking & Validation

**What might fail?**
- **SDK Compatibility:** The biggest failure point is how the backend/SDK delivers these parameters. If parameters are delivered independently of flags, it might drastically increase payload size or require developers to rewrite integration logic.
- **Mental Model Overlap:** Users might get confused about when to use a "Global Parameter" vs a "Dynamic Config Flag" vs a "Feature Flag with variables". 

**Risky Assumptions:**
- We assume teams want to manage parameters *outside* of flags. Some teams might prefer utilizing a dedicated flag (e.g., `config_site_wide`) and fetching its variables, circumventing the need for a new architectural entity.

**What to validate first?**
1. **Developer validation:** Ask developers if they prefer calling `kameleoonClient.getGlobalParameter("discount")` or if they just want a better UI for sharing variables between existing flags.
2. **Product validation:** Show PMs mockups of "Solution 1" (Flat List) vs "Solution 2" (Stores). Determine if they anticipate managing 10-20 parameters (Flat list is fine) or 100+ parameters (Stores are required).
