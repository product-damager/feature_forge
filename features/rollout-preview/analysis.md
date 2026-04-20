# Feature Preview Prototype Analysis

## 1. Executive Summary
The `prototype_1` provides a functional foundation for the **Rule Simulator**, successfully implementing basic top-to-bottom evaluation and visitor bucketing. However, it fails to meet the **Kameleoon UX Philosophy** of "Explicit logic over implicit behavior" and suffers from significant **scalability bottlenecks** in its current attribute management and result visualization.

---

## 2. Misalignment with Kameleoon UX Patterns
*   **Implicit vs. Explicit Evaluation**: The simulation happens "instantly" on click. Kameleoon patterns emphasize *transparency*. The "brief highlight during evaluation" mentioned in the spec is missing, masking the sequential nature of the decision tree.
*   **Panel Context**: While the Right Panel usage is correct, the transition from **Configuration** to **Simulator** is jarring. There is no clear "Back to Config" or persistent state preservation if a user wants to tweak a rule and re-test.
*   **Visual Decoration**: The prototype introduces several "badges" (WINNER, DRAFT LOGIC) that feel slightly inconsistent with the "minimal visual decoration" principle. Information should be conveyed through structure rather than labels.
*   **Mode Selector (Live/Draft)**: This is currently a floating toggle. In a professional platform, "Draft" vs "Live" is usually a global environment state or a clearly demarcated revision history, not a local "preview-only" toggle that changes underlying rules invisibly.

---

## 3. Missing Behaviors vs. Spec
| Feature | Status | Gap |
| :--- | :--- | :--- |
| **Evaluation Path** | Partial | Spec requires "Rule X -> not matched (reason)". Prototype adds annotations to the left list but the right panel summary is overly simplified ("Targeted: Rule #3"). |
| **Brief Highlight** | Missing | No visual "flow" or sequence is shown. The UI "jumps" to the result. |
| **Matched Rule Details**| Missing | Spec asks for "rule type (targeted / rollout / experiment)". Prototype only shows the rule index/name. |
| **Structured Form** | Partial | Spec asks for a structured form for attributes. Prototype uses hardcoded toggles (`loyal`, `new`, `birds`) which doesn't allow for real-world user data (e.g., custom JSON or varied keys). |

---

## 4. UX Inconsistencies
*   **Terminology**: The result shows `Rule #3` but the list uses names like `Targeted Delivery`. Users identify rules by names/labels, not indices.
*   **Fall-through Clarity**: The "hashing" failure (matching targeting but failing bucketing) is a major pain point. In the prototype, this is shown as "missed 50% exposure", but it doesn't clearly explain *why* the score was X (e.g., "Visitor ID 'abc' maps to Bucket 62").
*   **Scroll Management**: When "Run Simulation" is clicked, if the winning rule is off-screen, the user loses context. While there is a `scrollIntoView` call in JS, the "Path" summary in the right panel doesn't provide a compact bird's-eye view of the chain.

---

## 5. Scalability Issues
1.  **Attribute Sprawl**: The hardcoded input form will break if a flag has 10+ custom attributes.
2.  **Long Rule Sets**: For flags with 20+ rules, the current "annotations on everything" approach will create a messy, cluttered UI.
3.  **Complex Nesting**: The prototype assumes flat rules. It does not account for complex "And/Or" groups or nested conditions within a single rule's targeting.
4.  **Shared Profiles**: There is no way to save or reuse "Persona" profiles (e.g., "The Power User", "The New Guest"), requiring repetitive manual input.

---

## 6. Strategic Improvements
*   **Interactive Trace**: Allow users to click a "skipped" rule to see exactly which condition failed (e.g., "User is in US, but rule requires UK").
*   **Bucket Visualizer**: Show a 0-100% bar for each rule with a marker for the current visitor's score. This makes "Fall-through" intuitive.
*   **Comparison View**: Instead of a toggle, show Live and Draft results side-by-side if they differ. 
*   **"Step-Through" Mode**: Add a manual stepper to walk through the rules one by one for complex debugging.

---

## 7. Proposed Spec Improvements
I recommend updating `spec.md` to address these gaps before building the next iteration.

### Key Additions to `spec.md`:
*   **Section 2.5: Traceability**: Define "Reason for failure" logic (Boolean mismatch vs. Bucketing mismatch).
*   **Section 3.2: Dynamic Inputs**: Move from "structured form" to "Dynamic Attribute List" with support for key-value pairs and JSON snippets.
*   **Section 4.1: The Bucket Ruler**: Standardize the visualization of the `0-100` deterministic score.
*   **Section 8.0: State Persistence**: Clarify how the simulator state is saved when switching between rules.
