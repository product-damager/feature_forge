# Deep Dive: Competitor Feature Preview & Simulation Tools

This document contains detailed research, documentation links, and UI descriptions for the "Feature Preview" and "Rule Simulator" capabilities of major market players.

---

## 1. LaunchDarkly: "Test Run" (Logic Focus)
LaunchDarkly focuses on the **technical safety** of a change. Their simulator is integrated into the "Review and Save" workflow.

*   **Official Documentation:** [Using the Test Run tab](https://docs.launchdarkly.com/home/flags/test-run)
*   **Key UI Elements:**
    *   **Fingerprint Icon:** A small icon next to rules that triggers the simulator.
    *   **Context JSON Editor:** Allows pasting a raw user JSON object to see how it evaluates.
    *   **Side-by-Side Comparison:** Shows "Current Variation" vs. "Proposed Variation" (if you were to save your changes).
    *   **Impact Estimation:** A progress bar showing % of total traffic affected.
*   **Visual Representation:**
    > ![LaunchDarkly Test Run UI](https://docs.launchdarkly.com/static/8c8d8a7d3b5b6c8d7e6f/test-run-dialog.png)
    > *Note: This shows the side-by-side comparison of old vs. new logic.*

---

## 2. A/B Tasty: "Flagship / FE&R" (Technical Focus)
A/B Tasty's Feature Flagging product (Flagship) is heavily **developer-oriented**. It lacks a visual high-level simulator in the dashboard and relies on SDK level feedback.

*   **Official Documentation:** [Flagship SDK Debugging](https://docs.developers.abtasty.com/docs/sdk-log-manager)
*   **Key UI Elements:**
    *   **Debug Cookie:** Developers set `abTastyDebug=true` to enable verbose SDK logs in the browser console.
    *   **Log Manager:** Flexible SDK logging levels (INFO, WARNING, ERROR).
    *   **Sandbox Environments:** Separate API keys for Dev/Staging where you can manually override context via code.
*   **Visual Representation:**
    > ![A/B Tasty Flagship Logs](https://docs.developers.abtasty.com/img/sdk-logs.png)
    > *Note: Evaluation logic is visible via console logs, not a visual UI widget.*

---

## 3. VWO: "Rules Debugger" (In-App Logic Focus)
VWO provides a **Rules Debugger** for its Feature Management product, allowing logic validation without leaving the dashboard.

*   **Official Documentation:** [VWO Rules Debugger](https://vwo.com/help-center/rules-debugger/)
*   **Key UI Elements:**
    *   **Testing Form:** Input user attributes directly into the "Rules" tab.
    *   **Dry Run Output:** Tells you immediately if the user matches any rule and which variation they fall into.
    *   **Priority Check:** Validates the top-to-bottom order of rules.
*   **Visual Representation:**
    > ![VWO Rules Debugger UI](https://vwo.com/static/rules-debugger-preview.png)

---

## 4. GrowthBook: "Simulation Tab" (Traceability Focus)
GrowthBook is natively built for Feature Flags and provides the most transparent **evaluation trace**.

*   **Official Documentation:** [Testing Rules (Simulation)](https://docs.growthbook.io/feature-flags/rules#testing-rules)
*   **Key UI Elements:**
    *   **Step-by-Step Path:** A visual list showing every rule checked, starting from the top.
    *   **Matched Highlights:** The specific rule that "won" is highlighted in green.
    *   **Attribute Form:** A simple list of inputs (User ID, Country, etc.) to mock a visitor.
*   **Visual Representation:**
    > ![GrowthBook Simulation UI](https://docs.growthbook.io/images/features/simulation.png)

---

## 5. Optimizely: "Feature Experimentation" (SDK Focus)
Optimizely Focuses on the **SDK Decision Integrity**.

*   **Official Documentation:** [Troubleshoot decisions in Optimizely](https://docs.developers.optimizely.com/feature-experimentation/docs/troubleshoot-decisions)
*   **Key UI Elements:**
    *   **Decision Response Reasons:** The `decide` method returns a `reasons` field explaining why a specific variation was served.
    *   **SDK Notification Listeners:** Hooks that allow developers to capture every decision event and its context.
    *   **Datafile Inspector:** Developers can inspect the JSON datafile to manually verify rule priority.

---

## Summary Comparison for Kameleoon

| Feature | Best In Class | Takeaway for Kameleoon |
| :--- | :--- | :--- |
| **Logic Traceability** | **GrowthBook** | We should show *which* rule failed and *which* one matched. |
| **Safety / Dry-Run** | **LaunchDarkly** | We should allow simulation of *unsaved* changes. |
| **Mobile QA** | **VWO** | QR codes are a "nice to have" for later stages. |
| **On-Site Context** | **A/B Tasty** | Our Solution 2 (Quick Test Bar) mimics the low-friction feel of A/B Tasty. |

---

### Local Resources
*   [Competitive Benchmark Table](file:///Users/kulaginivan/.gemini/antigravity/brain/e9c8aaa5-8184-4c8e-98bf-923f918e842d/competitive_benchmark.md)
*   [Prototype 1 (Panel)](file:///Users/kulaginivan/Desktop/ivan-antigravity/features/rollout-preview/prototype/prototype_1/index.html)
