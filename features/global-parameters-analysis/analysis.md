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
