# Analysis — Experiment Rule for Personalizations

Follows `/docs/discovery-template.md`.

---

## 1. Context Understanding

### Product purpose
Personalizations deliver targeted experiences to defined segments. The pillar is optimized for **deployment** (deciding what to show whom), not for **learning** (comparing contents).

### Core users
- **Primary:** CRO managers, marketing PMs, growth teams running 1:1 or segment-based personalization.
- **Secondary:** Developers maintaining custom-code personalizations and widget injections.

### Main use cases
- Serve a banner or layout variant to a specific segment.
- Sequence multiple personalization rules in a single personalization (e.g. loyal users → bird fans → everyone else).
- Track success against goals defined once, at the personalization level.

### Problem space
Personalizations support **one content per rule** with allocation-based exposure. There is no native way to:
- declare multiple competing contents inside a single rule
- bucket exposed visitors across these contents
- let an algorithm (bandit) reallocate traffic based on a goal that already exists at the personalization level

### Constraints

**Technical**
- Personalization evaluation is not strictly sequential (unlike feature flags). Multiple rules can interact.
- Goals are stored at the personalization level and inherited.
- Bandit infrastructure exists in Web Experiments; reuse, not reinvention, is expected.

**UX**
- Dense, panel-based, editor-centric UI.
- Right panel is the configuration surface; rule-type selection happens there first.
- Goals must remain a single source of truth — duplicating them at rule level would break the model.

**Business**
- Cannot fragment the personalization mental model (one personalization = one objective).
- Must not require customers to leave Personalizations to run an A/B/n.

---

## 2. Competitive Analysis

### Competitors analyzed
- **Adobe Target** — Activities support both Experiences (personalization) and Experiences with reporting/winner selection. Allocation modes include manual, auto-allocate (bandit), and auto-target (contextual). Their model treats personalization and experimentation as configuration of the same activity object.
- **Optimizely Personalization** — Each "Experience" has a single content but supports holdout groups. No native bandit inside a personalization rule; bandits live in Stats Accelerator, configured separately.
- **Dynamic Yield** — Campaigns can run "Predictive Targeting" or A/B inside a single experience and switch between them; the modes are first-class configuration.
- **VWO Personalization** — Single content per campaign, no native multi-arm option.

### Key patterns
- **Adobe Target** and **Dynamic Yield** treat allocation type as a **mode of the same rule** rather than a separate product surface — this is the strongest validated pattern for what we want.
- All competitors keep success metrics (goals) at the activity/campaign level; none expose per-rule goals.
- Bandit modes always require explicit naming ("Auto-Allocate" / "Predictive") so the user understands learning is happening.

### Differentiation opportunities
- Kameleoon already ships dense, queueable rules — none of the competitors have a true rule queue inside personalization. Adding an Experiment rule **as one rule type among many** is more flexible than activity-level mode switching.
- Pair with Kameleoon's existing bandit logic from Web Experiments to ship faster and consistently.
- Lean into "explicit logic": show inherited goals as context, show allocation mode as a first-class label on the rule card.

---

## 3. Current UX Analysis

### Current flow (today)
1. User opens a Personalization.
2. User adds a rule via "Add a rule" — opens the right panel directly into a rule configuration form.
3. User configures targeting, exposure %, and selects ONE content.
4. Goals come from the parent personalization, set in a separate tab.

### Friction points
- **No rule-type concept.** Personalization rules are typed implicitly by their content. There is no precedent for switching forms based on rule type.
- **No multi-content slot.** The data model assumes 1 rule → 1 content. Marketers wanting an A/B fall back to Web Experiments and lose the personalization rule queue, the personalization-level goals, and the segment targeting layer.
- **Exposure % vs allocation %.** Today exposure controls who sees the rule at all. There is no language for "of those exposed, how do we split between contents?" — adding it without confusion is a UX risk.

### Cognitive load issues
- Mixing exposure logic with allocation logic in the same form would confuse users who already struggle with the difference.

### Missing affordances
- A rule-type selector at rule creation time (the Rollout Planner has this; Personalizations do not).
- Visual distinction between standard rules and experiment-style rules in the rule queue.

### Problematic UI elements
- The current right-panel rule form is monolithic — it assumes one content slot. Refactoring it to support N contents requires a structural change, not just adding fields.

---

## 4. Comparison: Personalization rule vs Feature Experimentation rule

| Aspect | Personalization rule (today) | Feature Experiment rule (Rollout Planner) |
| --- | --- | --- |
| Rule-type selector | None — single rule type | First step in right panel: pick a rule type |
| Output | One content | Multiple variations |
| Distribution | Exposure % only | Variation allocation % (or bandit) |
| Goals | At personalization level | At experiment level |
| Evaluation | Allocation-based, multi-rule interaction | Strict top-to-bottom |
| Mental model | "Who sees this?" | "How do we split visitors and learn?" |

The Experiment rule is essentially **importing the experiment data shape into the personalization rule queue** — multiple contents and allocation logic — while **preserving the personalization-level goals and queue semantics**.

---

## 5. Problem Synthesis

### Core problems (high priority)
1. Personalization has no native way to compare multiple contents under a single rule.
2. There is no rule-type abstraction in Personalizations, so any new behavior risks breaking the existing form.

### Secondary issues
- Bandit modes (multi-armed, contextual) need clear, opinionated UI that matches Kameleoon's "explicit logic" principle — users should know when an algorithm is reallocating traffic.
- Visual differentiation in the rule queue is needed so a glance distinguishes a standard rule from an experiment rule with N contents.

---

## 6. Solution Exploration

### Solution A — Rule-type selector in the right panel (selected)

- **Description:** Adopt the Rollout Planner pattern. Clicking "Add a rule" opens the right panel on a rule-type selection step. The user picks "Targeted delivery" (current behavior) or "Experiment rule". The form adapts.
- **Problem solved:** Introduces multi-content + allocation without polluting the existing single-content form. Establishes a future-extensible rule-type concept in Personalizations.
- **UX changes:** Two-step rule creation; allocation-mode picker inside the experiment rule form; multi-content list editor; inherited-goals context block.
- **Why it's better:** Mirrors a pattern users already see in Feature Experimentation, reuses the existing right-panel architecture, and isolates the new behavior to one rule type.
- **Trade-offs:** Adds a step to rule creation. Justified because the rule-type is a meaningful decision and prevents mode-confusion later.

### Solution B — Mode toggle on existing rule form

- **Description:** Add a "Multi-content" toggle to the standard rule form. When on, reveal allocation + N contents.
- **Problem solved:** Same multi-content capability with one less step.
- **Trade-offs:** Conflates two distinct rule shapes inside one form. Worse for discovery, worse for queue rendering, worse for documentation. Rejected.

### Solution C — Activity-level mode (Adobe Target style)

- **Description:** Switch the entire personalization to "experiment mode", changing all rules.
- **Trade-offs:** Breaks the rule-queue model that is core to Kameleoon Personalizations. Rejected.

---

## 7. Critical Thinking

### What might fail?
- Users may misread the experiment rule as a Web Experiment and expect full experimentation reporting; the experiment rule is scoped to personalization goals, not to the full statistical reporting suite of an experiment.
- The "exposed but not allocated" path is rare in practice (allocation is total within the rule) — but the team must decide whether `total allocation = 100%` is enforced or not.

### Risky assumptions
- Reusing the Web Experiments bandit infrastructure inside Personalizations is feasible without a major SDK change. Needs engineering validation.
- Personalization-level goals are a sufficient signal for bandit optimization. If goals are too broad (e.g. session-level), the bandit may converge slowly or unstably — needs validation.

### Validation priorities
1. Engineering: bandit reuse path, evaluation-engine impact, SDK message format change for multi-content rules.
2. UX: that users understand "of those exposed by targeting, the experiment rule splits across contents" without confusing it with personalization-level allocation.
3. Goal alignment: that a single inherited goal is enough for bandit optimization, or whether the rule needs to pick one of N inherited goals as primary.

---

## 8. Proposed solution direction

Adopt **Solution A**:

- New rule type **Experiment rule** in Personalizations.
- Right-panel two-step creation: rule-type pick → adaptive configuration form.
- Form supports multi-content list, allocation type (Manual / Multi-armed bandit / Contextual bandit), and inherited goals shown as read-only context.
- Rule queue renders the experiment rule visually distinct: a "EXPERIMENT" tag, an allocation strip showing content split, and a stacked content count.
- Targeted-but-not-exposed visitors continue down the rule queue (consistent with the existing personalization model).