# Feature Spec — Rollout Preview (Rule Simulator)

## Problem

Users configuring Feature Flags in the Rollout Planner lack confidence in their setup.

- The rule system is complex (top-to-bottom evaluation, multiple rule types, fallbacks)
- Users cannot easily predict which variation a specific user will receive
- Misconfigurations can lead to:
  - unintended feature exposure
  - production bugs
  - loss of trust in the system

Today, validation requires:
- manual staging tests
- developer involvement
- trial-and-error workflows

This creates friction and slows down feature releases.

---

## Insight

The core issue is not just validation — it is **lack of visibility into rule evaluation logic**.

Users struggle with:
- understanding how rules interact
- predicting fallback behavior
- verifying edge cases

Competitors solve this partially:
- Statsig → quick pass/fail validation
- LaunchDarkly → technical simulation via JSON

However, they do not fully address:
- multi-rule evaluation clarity
- visual traceability of decision paths

Kameleoon’s strength (complex rule system) becomes a weakness without proper tooling.

---

## Solution

Introduce a **Rollout Preview Panel** integrated into the Rollout Planner.

### Core Concept

Allow users to simulate a user profile and:

- evaluate the rule chain (top-to-bottom)
- identify the matched rule
- understand why it matched (targeting vs bucketing)
- visualize deterministic bucketing (Bucket Ruler)
- see the resulting variation
- compare Draft vs Live outcomes

---

### Selected Direction

**Rule Simulator Panel (Side-by-Side Context)**

Chosen because it:
- aligns with Kameleoon’s panel-based UI
- provides full transparency of evaluation logic
- scales to complex rule setups
- differentiates from competitors

---

## UX Flow

### Entry Point

- Add a **Preview Rollout** button in the Rollout Planner header (near “Add rule”)

---

### Step 1 — Open Simulator

- Clicking "Preview Rollout" replaces the right configuration panel
- A dedicated **Preview Panel** appears

---

### Step 2 — Define User Profile

User inputs:

- Attribute Registry:
  - auto-populated from attributes used in the flag
  - supports structured key/value inputs

- Optional JSON input (advanced users)

- Profile Presets:
  - save and reuse test profiles

- Visitor ID:
  - required for deterministic bucketing

---

### Step 3 — Run Simulation

System:

- executes evaluation using SDK-equivalent logic
- does NOT trigger tracking or analytics
- produces deterministic results

---

### Step 4 — Visual Feedback

#### Left Panel (Rules List)

Visual-only feedback:

- non-matching rules → dimmed
- evaluated rules → default state
- matching rule → highlighted with "WINNER"

Constraints:

- no textual explanations in rule cards
- no duplication of reasoning from the right panel

---

#### Right Panel (Simulator Output)

##### 1. Result (Primary Information)

Always visible without scrolling:

- variation served
- matched rule (name + type)
- flag state / variable values

---

##### 2. Draft vs Live Comparison

Always displayed in Draft mode:

- if different → warning message
- if identical → confirmation message

Never silent.

---

##### 3. Evaluation Trace

Detailed rule-by-rule explanation:

Each rule includes:

- **Skipped**
  - targeting mismatch
  - explicit reason (e.g., `country != UK`)

- **Fall-through**
  - targeting matched
  - failed bucketing
  - includes Bucket Ruler:
    - user score
    - exposure threshold

- **Matched**
  - full qualification

---

##### 4. Evaluation Boundary

Clear termination message:

"Evaluation stopped at rule X — Y rules not reached"

Prevents ambiguity about remaining rules.

---

## Information Hierarchy

The simulator must prioritize outcome clarity over trace detail.

Order:

1. Result
2. Draft vs Live comparison
3. Evaluation trace

The user must understand the outcome immediately without scrolling.

---

## Determinism & Input Rules

Simulation must be deterministic.

- Visitor ID is required
- If empty:
  - system generates one
  - and writes it back into the input field

Running the same simulation twice must produce identical results.

---

## Evaluation Visibility Rules

- Rules are evaluated sequentially (top-to-bottom)
- Evaluation stops at the first matching rule
- Only evaluated rules are shown in the trace
- A termination message indicates non-evaluated rules

---

## Left Panel Feedback Rules

- Rule cards provide visual feedback only
- No textual explanations
- No duplication of trace information

---

## Draft Mode Behavior

Draft mode represents unsaved configuration.

The UI must communicate:

- "Draft = unsaved configuration"

Behavior:

- simulation compares Draft vs Live
- always displays comparison result:
  - difference → warning
  - match → confirmation

---

## Expected Impact

### User Impact

- Increased confidence in rule configuration
- Reduced reliance on staging/testing environments
- Faster iteration on rollout strategies

---

### Business Impact

- Reduced risk of production issues
- Faster time-to-market
- Increased adoption of Feature Flags

---

### Product Impact

Strengthens Kameleoon positioning on:

- complex rule systems
- transparency
- control

---

## Open Questions

### Technical

- Can SDK evaluation logic be reused directly?
- Where should simulation run:
  - frontend (fast, limited)
  - backend (accurate, heavier)?
- How to ensure hashing consistency across environments?

---

### UX

- Handling large rule sets (20+ rules)
  - current direction: scrollable list with "scroll to winner"

- Shared presets across team members
