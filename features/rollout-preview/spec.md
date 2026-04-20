# Feature Spec — Feature Preview (Rule Simulator)

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
- evaluate the full rule chain (top-to-bottom)
- identify the matched rule
- understand why it matched (Targeting check vs. Bucketing check)
- visualize the deterministic hash (Bucket Ruler)
- see the resulting variation
- compare "Draft" vs "Live" outcomes

---

### Selected Direction

**Direction A — Rollout Preview Panel (Side-by-Side Context)**

This is chosen because:
- aligns with Kameleoon’s panel-based UI
- provides full transparency of evaluation logic
- scales to complex rule setups
- differentiates from competitors

---

## UX Flow

### Entry Point

- Add a **Preview Rollout** in the Rollout Planner header (near “Add rule”)

---

### Step 1 — Open Simulator

- Clicking "Preview Rollout" replaces the right configuration panel
- A new **Preview Rollout** panel appears

---

### Step 2 — Define User Profile

User inputs:
- Dynamic Attribute Registry: auto-populated based on attributes used in the current flag configuration.
- Support for key/value pairs and raw JSON snippets.
- Profile Presets: allow users to save and load test user profiles (e.g., "UK VIP Guest").
- Visitor ID: used for deterministic bucketing.

---

### Step 3 — Run Simulation

On submit:

System:
- runs evaluation using the same logic as SDK
- does NOT trigger tracking or analytics

---

### Step 4 — Visual Feedback

#### Left Panel (Rules List)

- Non-matching rules → dimmed with explicit "reason for skip" labels
- Evaluated rules → sequential highlighting following the SDK's evaluation speed (optional "Step-Through" mode)
- Matching rule → clearly highlighted with a "WINNER" badge
- Fall-through rules → marked with "Missed exposure" if targeting matched but bucketing failed

---

#### Right Panel (Simulator Output)

Displays:

- Matched Rule:
  - rule name (as defined in UI)
  - rule type (Targeted / Rollout / Experiment)

- Result:
  - variation served
  - flag state / variable values

- Evaluation Path (The Trace):
  - Rule-by-rule verdict:
    - **Skipped**: Attribute mismatch (e.g., `device != 'mobile'`)
    - **Fall-through**: Targeted but missed bucketing (Show **Bucket Ruler**: `Score 72` vs `Exposure 50%`)
    - **Matched**: Full qualification

- Draft Comparison:
  - Immediate visual alert if "Draft" simulation differs from "Live" variation.

---

## Expected Impact

### User Impact

- Increased confidence in rule configuration
- Reduced reliance on staging/testing environments
- Faster iteration on rollout strategies

---

### Business Impact

- Reduced risk of production issues
- Faster time-to-market for features
- Higher adoption of Feature Flags

---

### Product Impact

- Strengthens Kameleoon’s differentiation on:
  - complex rule systems
  - transparency
  - control

---

## Open Questions

### Technical

- Can we reuse the exact SDK evaluation logic for simulation?
- How do we handle:
  - hashing / bucketing consistency?
  - environment differences?
- Should simulation be:
  - frontend-driven
  - or API-based?

---

### UX

- How do we handle very large rule sets (20+ rules)? (Resolved: Use compact list view with scroll-to-winner)
- Support for simulation of unsaved rollout configuration (Draft Mode).
- Should we support a switch between parameters and raw JSON input? (Resolved: Include both in Attribute Registry)
- Shared test profiles across team members.

---

### Scope Decisions

- Do we include Quick Test Bar as a secondary feature later?
- Do we extend this to:
  - personalizations
  - experiments