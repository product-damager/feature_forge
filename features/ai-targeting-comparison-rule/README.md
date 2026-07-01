# AI Targeting Comparison Rule

## Problem

AI Targeting decides *who* to expose using a learned model of conversion intent. Today a user can turn AI Targeting on for a rule, but they cannot natively answer the question that always follows: **"Is the AI actually targeting better than the targeting I would have written by hand?"**

- **Who is impacted?** CRO managers, marketing PMs and growth teams who are evaluating whether to trust AI Targeting for a given personalization and goal.
- **What is failing today?** There is no rule type that compares AI-driven targeting against non-AI targeting while holding the trigger, the experience (content) and the goal constant. Users improvise it by cloning rules, which fragments goals, varies the trigger uncontrollably, and produces no clean, designed read.
- **In which workflow?** Inside a Personalization, in the targeting-rule right panel — the same surface where the [Experiment Rule](../experiment-rules-personalization/README.md) already lives.

---

## Context

- **Where does this feature live?** Personalizations pillar, rule configuration right panel of an existing Personalization. It is a sibling rule type to the standard Targeting rule and the Experiment rule.
- **What existing systems are involved?**
  - Personalization rule queue (allocation-based exposure, top-to-bottom rule ordering).
  - Existing targeting model — segment conditions and trigger conditions.
  - AI Targeting (model that learns on a selected goal).
  - Goals system — the goal stays at the **personalization level** (separate step), as for every rule; AI Targeting learns on that goal.
- **Constraints already known:**
  - Exactly **2** segments to compare, no more, no less.
  - Exactly **one shared trigger** for the whole rule — the trigger is held constant; only the segment/audience definition varies.
  - Exactly **one** content for the whole rule — differences must come from the segment, not the experience.
  - **One and only one** segment is defined by AI Targeting.
  - Visitors matching both segments are counted in **both** groups (overlap is accepted, not resolved).
  - Existing top-to-bottom rule ordering is unchanged.
  - Output must stay GitHub Pages-compatible for prototyping.

---

## Why it matters

- **User impact:** Users get a trustworthy, apples-to-apples read on whether AI Targeting earns its place for this personalization, without leaving the rule editor or hand-rolling a flawed comparison.
- **Business impact:** Directly supports AI Targeting adoption — a user who can *prove* the lift is a user who keeps it on and expands it. Reduces the "I tried AI targeting once and couldn't tell if it helped" churn risk.
- **Risk of not solving it:** Users cobble together cloned rules to compare AI vs non-AI, vary the trigger uncontrollably, get no clean signal, conclude "AI targeting doesn't work," and turn it off. The differentiator here is a single, queue-native, *designed* comparison of an AI vs a manual targeting definition on the same content under one shared trigger — instead of post-hoc segment slicing.

---

## Relationship to the Experiment Rule

This rule reuses the Experiment Rule's editor scaffolding almost entirely (rule-type selector, right-panel form, rule-queue card, chip vocabulary, dirty/save model). The genuinely new parts are all consequences of *comparing AI vs non-AI targeting inside one rule*. The mirror image of the Experiment rule: an Experiment rule holds targeting constant and varies content; this rule holds the **trigger** constant and varies the **segment**.

| Concept | Experiment Rule | AI Targeting Comparison Rule |
| --- | --- | --- |
| What varies | the **content** (multiple contents) | the **segment** (two segment definitions) |
| What is held constant | targeting | the **trigger** (one shared) and the **content** (exactly one) |
| Split unit | content arms | two segments compared (one shared trigger, one content) |
| Goal | inherited from personalization | inherited from personalization (AI learns on it) |
| Split logic | bucket exposed visitors across arms | both segments evaluated against the full population; a visitor is attributed to each group they match (overlap counted in both) |

See `analysis.md` for the full carry-over of questions and patterns, and `spec.md` for the configuration model.
