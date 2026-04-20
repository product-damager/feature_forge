# Rollout Preview (Rule Simulator)

## Problem

Users configuring Feature Flags in the Rollout Planner lack confidence in their complex setups.

- **Who is impacted?** Product Managers and Developers configuring release strategies.
- **What is failing today?** Lack of visibility into rule evaluation logic. Users cannot easily predict which variation a specific visitor will receive without manual, high-friction staging tests.
- **In which workflow?** During the configuration of delivery rules, progressive rollouts, and feature experiments in the Rollout Planner.

---

## Context

- **Where does this feature live?** It is integrated as a side panel within the **Rollout Planner** (Feature Flags pillar).
- **What existing systems are involved?** It utilizes the SDK evaluation logic (deterministic bucketing and sequential rule matching) to simulate the decision tree.
- **Any constraints already known?** Must support high-density Kameleoon UI patterns, scale to 20+ rules, and handle dynamic custom attributes.

---

## Why it matters

- **User impact:** Increased confidence in configuration, reduced fear of unintended exposure, and faster iteration cycles.
- **Business impact:** Reduced risk of production bugs, faster time-to-market for new features, and higher adoption of Feature Flagging.
- **Risk of not solving it:** Loss of trust in the system, slower release velocities, and continued reliance on expensive developer-led validation workflows.
