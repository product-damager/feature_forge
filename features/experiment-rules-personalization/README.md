# Experiment Rule for Personalizations

## Problem

Personalization rules today are designed around a single content and exposure logic. Teams that want to test multiple personalized experiences against each other have to fall back to Web Experiments — which sit in a different pillar, use a different mental model, and cannot be queued alongside other personalization rules in the same experience.

- **Who is impacted?** Marketers, CRO managers and PMs running personalization programs that need to learn what works, not just deploy what is already decided.
- **What is failing today?** No native way inside a Personalization to compare multiple contents, run a bandit, or learn from real-time signals while keeping the personalization-level targeting and goals.
- **In which workflow?** While editing a Personalization in the rule queue — the user has no rule type that supports multiple contents, only single-content rules with exposure %.

---

## Context

- **Where does this feature live?** Inside the Personalizations pillar, in the rule configuration right panel of an existing Personalization.
- **What existing systems are involved?**
  - Personalization rule queue (allocation-based exposure, non-strictly-sequential evaluation).
  - Goals system (configured at personalization level — must remain inherited).
  - Bandit infrastructure already used in Web Experiments (multi-armed and contextual).
  - Right-panel rule-type selector pattern from the Rollout Planner ([Add a new rollout rule](https://help.kameleoon.com/experimentation/feature-experimentation/using-the-rollout-planner/add-a-new-rollout-rule)).
- **Constraints already known:**
  - Personalization goals must NOT be configured per rule.
  - Rules must remain composable in a queue — an experiment rule cannot break the personalization rule model.
  - Output must stay GitHub Pages-compatible for prototyping.

---

## Why it matters

- **User impact:** Marketers stop having to choose between "personalize" and "test" — they can do both inside one Personalization, with one targeting model and one goals setup.
- **Business impact:** Increases adoption depth of Personalizations, opens a path to bandit-driven personalization (a clear competitive differentiator), and reduces fragmentation between Personalization and Experimentation pillars.
- **Risk of not solving it:** Customers spin up parallel Web Experiments to do what should be a personalization rule, fragmenting goals/targeting and weakening the personalization mental model.