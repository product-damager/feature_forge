# Feature Preview Analysis & Product Brief

## STEP 1 — CONTEXT UNDERSTANDING
- **Product Purpose:** Provide an experimentation and feature management platform to enable product/engineering teams to control feature releases, run A/B tests, and target specific user segments safely.
- **Core Users:** Product Managers, Developers, QAs, and Marketers managing feature releases.
- **Main Use Cases:** Releasing features progressively, testing variations on specific audiences, setting up targeted delivery rules, and avoiding regressions in production.
- **Problem this Feature Solves:** When configuring complex targeting rules (e.g., custom attributes, segments, percentage rollouts, top-to-bottom rule evaluation), users lack confidence that the setup is correct. A misconfiguration can lead to unintended exposure or critical bugs affecting real users. "Feature Preview" solves this by letting them simulate user profiles against the ruleset to foresee the resulting variation before enabling the flag in production.
- **Constraints:**
  - *Technical:* Need to accurately simulate the backend/SDK bucketing and targeting logic in the UI without actually firing tracking events, altering live analytics, or affecting live traffic. Needs to handle the top-to-bottom queue evaluation correctly.
  - *UX:* The Rollout Planner interface is already dense (left list of rules, right configuration panel). Adding a testing/preview tool shouldn't add cognitive overload or obstruct the primary flow. It needs to intuitively show *which* rule in the queue matched the user.
  - *Business:* Must provide high confidence quickly to reduce time-to-market.

---

## STEP 2 — COMPETITIVE ANALYSIS (Statsig "Test Gate")
- **Key Patterns from Competitors:**
  - Built-in simulation directly within the flag management UI.
  - Ability to input raw user properties (like Email, User ID) and immediately see the gate check result.
  - Provide multiple avenues for debugging (Test Gate tool, external Test App, live Diagnostics stream).
- **Strengths:** 
  - Low friction: The "Test Gate" tool sits at the bottom of the Feature Gates page, always available.
  - Clear output: Provides a binary "PASS" or "FAIL".
- **Weaknesses:** 
  - The UI for testing feels somewhat disconnected from the complex rule setup if it's just a generic input at the bottom.
  - For complex rule queues, it might not clearly explain *why* it passed or failed (which specific rule in the fallback chain was triggered). 
- **Differentiation Opportunities:** 
  - Kameleoon uses a top-to-bottom queue of delivery/experiment rules with different variations (more complex than simple pass/fail). The output should explain the "evaluation path" (e.g., "Targeted by Rule #3 (New clients) -> Assigned Variation: On"). 
  - Contextual preview directly next to the rules, visually highlighting the matching rule block.

---

## STEP 3 — CURRENT UX ANALYSIS (FROM SCREENSHOTS)
- **Current User Flow:** The user sees the main "Rollout Planner" view with a list of rules evaluated top-to-bottom (1 through 9+). Clicking a rule opens the "Configure Rule" panel on the right.
- **Friction points:** 
  - No way to verify the entire queue's behavior from the UI without saving and testing in a live/staging environment with a real device/SDK.
  - High cognitive load in predicting overlaps or fallbacks between rules (e.g., predicting how traffic moves from an experiment rule to a delivery rule).
- **Cognitive overload:**
  - The left panel lists many rules with inline descriptions (e.g., "From 20/02/2026... Triggers..."). Mentally tracing a custom user's journey through 9 rules is nearly impossible for a human.
- **Missing affordances:** 
  - A "Simulate" or "Test" button is completely absent. The UI assumes the user trusts their configuration blindly.
- **Specific UI elements and why they are problematic:**
  - The "Targeting" section on the right side defines segments (e.g., "New clients for Perso and Builders"). The user cannot immediately check who falls into this segment from this screen.
  - The "Then, for everyone else in Production, serve: Off" dropdown at the bottom of the list is clear, but its relation to the rules above requires mental gymnastics if there are percentage exposures (e.g., 50% rollout leaving 50% to fall through depending on the rule type).

---

## STEP 4 — PROBLEM SYNTHESIS
- **Core User Problems (High Priority):**
  - **Lack of Validation:** Users cannot easily verify if their complex rollout queue works as intended for a specific user profile before pushing to production.
  - **Fear of Unintended Exposure:** High risk of showing unfinished features to the wrong audience because a rule condition was misconfigured or overridden by a rule higher in the queue.
- **Secondary UX Issues (Medium Priority):**
  - **Opaque Evaluation Logic:** It's hard to visualize the routing of traffic through the top-to-bottom queue.
  - **Context Switching:** Users have to use a separate testing environment or developer tools to verify targeting, breaking their workflow in the planner.

---

## STEP 5 — SOLUTION PROPOSALS

### Solution 1: "Rule Simulator Panel" (Side-by-Side Context)
- **Description:** A toggleable full-height panel (replaces the "Configure Rule" panel when triggered) where users can input custom user attributes (device type, email, custom variables, visitor ID). It displays the resulting variation and visually highlights the matching rule on the left.
- **What problem it solves:** Directly addresses the lack of validation by providing an immediate, in-context testing ground that visually explains the routing.
- **Key UX changes:** Add a "Simulate" button near the top right of the Delivery rules list (next to "+ Add a rule"). Clicking it opens the simulator panel. The left panel (rule list) visually updates (e.g., grays out skipped rules, highlights the matched rule).
- **Why it’s better:** Integrates seamlessly into the existing Layout. By visually highlighting the matching rule in the left list, it explains the *why* (traceability) and not just the *what*, going beyond Statsig's basic implementation.
- **Trade-offs:** Competing for screen real estate. Users can't easily tweak a rule and simulate simultaneously without switching panel contexts.

### Solution 2: "Quick Test Bar" (Micro-interaction)
- **Description:** A dedicated, persistent floating bar at the bottom of the rules list (similar to Statsig's layout).
- **What problem it solves:** Quick, low-friction validation without opening heavy panels.
- **Key UX changes:** A persistent floating action bar at the bottom: "Test a user profile". Expanding it shows simple inputs (key/value pairs for attributes) and an immediate output display (Matched Rule + Variation).
- **Why it’s better:** It's always accessible and doesn't hide the rules list or the configuration panel. Extremely fast for power users executing rapid checks while editing rules.
- **Trade-offs:** Limited space for complex user profile definitions (multiple custom attributes might be hard to fit nicely). Suboptimal for detailed visual path tracing.

### Solution 3: "Visual Flow Evaluator" (Advanced Debugging Mode)
- **Description:** A dedicated "Debug Mode" toggle in the Rollout Planner header. When active, users input a profile in a top sticky bar, and the UI visually draws flow lines or animates the path through the top-to-bottom queue, showing exactly where the user got bucketed.
- **What problem it solves:** Completely removes the opaque evaluation logic. It educates the user on how the queue works (e.g., experiment rule vs delivery rule fall-through behavior).
- **Key UX changes:** A toggle "Preview Mode" at the top. The rules list transforms slightly to accommodate visual flow indicators.
- **Why it’s better:** Provides the highest confidence for complex setups. Incredible for onboarding new users to the concept of top-to-bottom evaluation.
- **Trade-offs:** High engineering effort to build the visual trace UI. Overkill for simple flags with only 1-2 rules.

---

## STEP 6 — CRITICAL THINKING
- **What might fail?** 
  - The simulation might not perfectly match the actual SDK bucketing if there are complex hashing algorithms for sticky bucketing (e.g., assigning a user to a variation based on a persistent numeric Visitor ID). We need to ensure the simulation engine uses the exact same hashing logic as the SDKs.
  - If users have 50+ rules, the UI might become too slow or difficult to navigate/scroll during simulation highlighting.
- **What assumptions are risky?**
  - We assume users know the exact attributes of the profiles they want to test. If they use complex dynamic segments (e.g., "Active buyers in the last 30 days" which relies on backend historical data), the simulation UI might struggle to mock that state easily without fetching real user data.
  - Assuming the UI layer can cleanly execute a "dry run" of the evaluation engine without a heavy backend request.
- **What would you validate first?**
  - **Technical feasibility:** Can the frontend or API execute a dry run of the evaluation engine using mocked user attributes rapidly? How do we handle hashing?
  - **User behavior:** Do users actually struggle with rule queue logic, or do they mostly struggle with defining the targeting conditions within a single rule? I would run a quick usability test on the current UI to see where errors happen most, which will help decide between Solution 1 (deep visibility) and Solution 2 (quick checks).
