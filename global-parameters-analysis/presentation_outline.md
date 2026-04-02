# Opportunity Meeting Presentation Outline: Global Parameters

This document contains presentation-ready copy and visual directions for your Opportunity Meeting. It summarizes the findings from our analysis on Parameter Stores into a concise, storytelling format.

---

### Slide 1 — Problem Statement

**Key message**
- Managing shared configuration variables across multiple feature flags is repetitive, inefficient, and highly prone to state inconsistencies.

**Content (max 5 bullets)**
- Configuration variables are currently locked uniquely within specific flags
- Same values (like localized banners or promotional discounts) must be duplicated manually
- Updating a single shared value requires finding and editing every linked flag
- Increases the risk of broken or mismatched user experiences across touchpoints
- Frustrating and time-consuming for PMs running multi-faceted campaigns

**Visual (VERY IMPORTANT)**
- **Screenshot to show:** `screenshots/current_variable_setup.png` (The current Kameleoon interface showing variables defined within a specific rule/variation)
- **Area to highlight:** The standalone variable configuration section.
- **Annotation to add:** *"Locked inside the flag: No way to reuse this variable anywhere else."*

**Verbatims**
- "Every time we run a global sale, I have to manually update the discount variable inside 5 different active feature flags. If I miss one, a subset of users gets the wrong price."

**Links (if relevant)**
- Kameleoon Docs: [Variables in feature flags]

---

### Slide 2 — Why it should be addressed?

**Key message**
- Centralizing parameters eliminates repetitive operational toil, ensuring consistency and accelerating multi-platform campaign rollouts.

**Content (max 5 bullets)**
- Provides a Single Source of Truth for shared configuration values
- Dramatically reduces the manual effort required to manage global campaigns
- Eliminates "sync errors" when updating values across multiple experiments
- Enables dynamic, UI-driven configuration changes without code redeploys
- Standardizes parameter naming conventions across large teams

**Visual (VERY IMPORTANT)**
- **Screenshot to show:** A simple diagram showing a "Global Discount Rate" node updating three different platforms (Web, iOS, Android) simultaneously.
- **Area to highlight:** The Hub-and-Spoke model of one parameter feeding multiple flags.
- **Annotation to add:** *"Update once. Deploy everywhere."*

**Verbatims**
- "We need to treat configuration values like a mini-CMS. It's too dangerous to rely on human memory to keep 10 flags in sync."

**Links (if relevant)**
- N/A

---

### Slide 3 — Competition Benchmark (Statsig)

**Key message**
- Our strongest competitors have already decoupled parameters from flags, establishing a market expectation for modern configuration management.

**Content (max 5 bullets)**
- Statsig offers dedicated "Parameter Stores" to hold related variables
- Users can decouple parameters from the app code entirely
- Starts with static values that can dynamically map to gates or experiments
- Proves that enterprise customers require scalable variable grouping
- Lacks visual traceability (hard to see which experiments affect a parameter)

**Visual (VERY IMPORTANT)**
- **Screenshot to show:** `screenshots/statsig_parameter_store.png` (Statsig's Parameter Store UI)
- **Area to highlight:** A list of variables (e.g., `tagline`, `hero_image`) grouped inside a `www_homepage` store.
- **Annotation to add:** *"Decoupled configuration cleanly mapped to experiments."*

**Verbatims**
- "Statsig Parameter Stores let us decouple our entire app config from releases. It's much cleaner than treating everything like a boolean feature flag."

**Links (if relevant)**
- [Statsig Parameter Stores Documentation](https://docs.statsig.com/client/concepts/parameter-stores#what-is-a-parameter-store)

---

### Slide 4 — Solution 1: "Global Parameter Hub" (Flat List)

**Key message**
- A simple, straightforward repository for global variables that natively integrates with our existing flag configuration flow.

**Content (max 5 bullets)**
- New top-level "Parameters" tab next to the Dashboard Overview
- A centralized flat list managing Keys, Types, and Values
- Inside any flag variation, users simply click "Link to Global Parameter"
- Extremely easy mental model separating "Variables" from "Rules"
- Cleanest solution for teams managing up to 50 shared parameters

**Visual (VERY IMPORTANT)**
- **Screenshot to show:** `screenshots/solution1_hub_wireframe.png` (Mockup of a new "Parameters" tab in the Kameleoon dashboard)
- **Area to highlight:** The top navigation bar and the "Link" button inside the flag settings.
- **Annotation to add:** *"A Single Source of Truth for workspace variables."*

**Verbatims**
- "I just want a simple list where I can define my standard branding strings and reference them in any experiment."

**Links (if relevant)**
- N/A

---

### Slide 5 — Solution 2: "Parameter Stores" (The Statsig Model)

**Key message**
- A highly scalable, namespace-protected architecture designed for complex enterprise teams managing hundreds of configurations.

**Content (max 5 bullets)**
- Introduces discrete "Stores" (e.g., `checkout_configs`, `homepage_ui`)
- Groups related configuration variables into nested JSON objects
- Prevents clutter and namespacing collisions (e.g., `checkout.color` vs `banner.color`)
- Requires developers to fetch stores specifically via the SDK
- Future-proofs the platform for massive enterprise scaling

**Visual (VERY IMPORTANT)**
- **Screenshot to show:** `screenshots/solution2_stores_wireframe.png` (Mockup of nested Parameter Stores in a left-hand navigation bar)
- **Area to highlight:** The hierarchy grouping multiple variables under one store.
- **Annotation to add:** *"Structured grouping for unlimited scalability."*

**Verbatims**
- "Our app has 300 different configurable values. A flat list would be a nightmare; we need to group them logically by product area."

**Links (if relevant)**
- N/A

---

### Slide 6 — Solution 3: "Promoted Flag Variables" (In-Context Sharing)

**Key message**
- The lowest friction solution: promoting organic, organically created variables into a shared workspace library.

**Content (max 5 bullets)**
- Variables are still generated directly inside Feature Flags
- Users toggle a "Share Workspace-wide" switch to add it to a Library
- When editing other flags, a side-panel allows "Insert from Library"
- Solves the problem immediately without needing a dedicated new Dashboard section
- Risks dependency issues if the "parent" flag is ever archived

**Visual (VERY IMPORTANT)**
- **Screenshot to show:** `screenshots/solution3_promoted_wireframe.png` (Mockup showing a "Make Global" toggle next to a flag variable)
- **Area to highlight:** The toggle switch and the slide-out Library panel.
- **Annotation to add:** *"Create locally, share globally. Zero context-switching."*

**Verbatims**
- "I usually realize I need a variable to be global *while* I'm building a flag. I don't want to leave the page to set it up."

**Links (if relevant)**
- N/A
