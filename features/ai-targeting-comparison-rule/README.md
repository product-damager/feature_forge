# AI Targeting Comparison Rule

## Problem

AI Targeting decides *who* to expose using a learned model of conversion intent. Today a user can turn AI Targeting on for a rule, but they cannot natively answer the question that always follows: **"Is the AI actually targeting better than the targeting I would have written by hand?"**

- **Who is impacted?** CRO managers, marketing PMs and growth teams who are evaluating whether to trust AI Targeting for a given personalization and goal.
- **What is failing today?** There is no rule type that compares AI-driven targeting against non-AI targeting while holding the experience (content) and the goal constant. Users improvise it by cloning rules, which fragments goals, double-counts visitors who match both definitions, and produces no clean read.
- **In which workflow?** Inside a Personalization, in the targeting-rule right panel — the same surface where the [Experiment Rule](../experiment-rules-personalization/README.md) already lives.

---

## Context

- **Where does this feature live?** Personalizations pillar, rule configuration right panel of an existing Personalization. It is a sibling rule type to the standard Targeting rule and the Experiment rule.
- **What existing systems are involved?**
  - Personalization rule queue (allocation-based exposure, top-to-bottom rule ordering).
  - Existing targeting model — segment conditions and trigger conditions.
  - AI Targeting (model that learns on a selected goal).
  - Goals system — the goal stays at the **personalization level** (separate step), as for every rule; AI Targeting learns on that goal.
  - Deterministic per-visitor bucketing already used for experiment traffic splits.
- **Constraints already known:**
  - Exactly **2** targeting groups, no more, no less.
  - Exactly **one** content for the whole rule — differences must come from targeting, not the experience.
  - **One and only one** group includes AI Targeting.
  - Existing top-to-bottom rule ordering is unchanged.
  - Output must stay GitHub Pages-compatible for prototyping.

---

## Why it matters

- **User impact:** Users get a trustworthy, apples-to-apples read on whether AI Targeting earns its place for this personalization, without leaving the rule editor or hand-rolling a flawed comparison.
- **Business impact:** Directly supports AI Targeting adoption — a user who can *prove* the lift is a user who keeps it on and expands it. Reduces the "I tried AI targeting once and couldn't tell if it helped" churn risk.
- **Risk of not solving it:** Users cobble together cloned rules to compare AI vs non-AI, get double-counted overlapping visitors and no clean signal, conclude "AI targeting doesn't work," and turn it off.

---

## Relationship to the Experiment Rule

This rule reuses the Experiment Rule's editor scaffolding almost entirely (rule-type selector, right-panel form, rule-queue card, chip vocabulary, dirty/save model). The genuinely new parts are all consequences of *comparing AI vs non-AI targeting inside one rule*:

| Concept | Experiment Rule | AI Targeting Comparison Rule |
| --- | --- | --- |
| What varies | the **content** (multiple contents) | the **targeting** (two targeting definitions) |
| What is held constant | targeting | **content** (exactly one) |
| Split unit | content arms | two targeting groups (each a Segment + Trigger definition) |
| Goal | inherited from personalization | inherited from personalization (AI learns on it) |
| Split logic | bucket exposed visitors across arms | assign **overlapping** visitors to one group |

See `analysis.md` for the full carry-over of questions and patterns, and `spec.md` for the configuration model.
