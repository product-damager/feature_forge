# Thibaud Sync: "Feature Preview"

**Goal of this sync:** Align on the engineering feasibility of adding a rule validation/simulation tool to the Rollout Planner, and get your take on 3 potential UX directions.

---

## 1. The Problem We're Solving
Right now, configuring complex targeting rules (segments, custom attributes, percentage rollouts) in a top-to-bottom queue is opaque for our users.
- Users can't easily verify if a specific user profile will hit the right variation before going live.
- It causes a lot of anxiety and forces teams to test heavily in staging environments just to verify basic targeting.
- **The Benchmark:** Competitors like Statsig have a built-in "Test Gate" tool on the flag config page that lets users type an email and instantly see a PASS/FAIL result. We need something similar, but tailored to our multi-rule queue.

---

## 2. Three Proposed UX Directions
I've discovered 3 ways we could integrate this into the Rollout Planner.

### Direction A: Rule Simulator Panel (Side-by-Side Context)
- **How it works:** We add a "Simulate" button near the Delivery rules list. It opens a right-hand panel where users define mock attributes. Once submitted, the left-hand rules list dynamically highlights exactly which rule caught the user.
- **Why users will like it:** It visually explains the *routing* (why a user fell through rule 2, but hit rule 3).
- **Dev question:** How difficult is it to pass mock data through our evaluation engine on the fly and map the result back to specific UI components (the rule cards)?

### Direction B: Quick Test Bar (Fast & Frictionless)
- **How it works:** A persistent, floating bar at the bottom of the screen (similar to Statsig). You expand it, type a key/value pair, and it instantly returns text: "Matched Rule X -> Variation Y". 
- **Why users will like it:** It's super fast, always accessible, and doesn't hide the "Configure Rule" panel.
- **Dev question:** Would this be significantly cheaper/faster to build than Direction A since we aren't manipulating the existing rule cards visually?

### Direction C: Visual Flow Evaluator (Advanced Debugging)
- **How it works:** A "Preview Mode" toggle that completely transforms the rules list into a flow chart. As users input mock data, it animates the traffic dropping past grayed-out rules until it lands on the matched rule.
- **Why users will like it:** Ultimate clarity for onboarding and complex rule setups. 
- **Dev question:** This is probably High Effort, but from a frontend canvas/DOM perspective, how complex is building this mapping animation?

---

## 3. Key Technical Decisions (from Dev Sync)
Following the dev sync with Thibaud, he agrees with the approach and we are aligned on moving forward with **Direction A: "Rule Simulator Panel"** for prototyping.

Key technical resolutions:
1. **Stateless Evaluation:** *Manageable.* We can execute a dry run of the evaluation engine using mocked user attributes without affecting live traffic or firing false analytics.
2. **Sticky Bucketing (Hashing):** *Manageable.* We can accurately simulate local hashing in the UI for persistent Visitor IDs to provide a deterministic preview.
3. **Dynamic Backend Segments:** *Manageable but dependent on tech constraints.* Similar to Statsig, we'll allow users to provide the necessary raw properties to the simulator to resolve segments that usually rely on backend history telemetry.