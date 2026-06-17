# Analysis — AI Targeting Comparison Rule

Follows `/docs/discovery-template.md`. Builds directly on `../experiment-rules-personalization/analysis.md`.

---

## 1. Context Understanding

### Product purpose
Personalizations deliver targeted experiences. AI Targeting is an option that replaces hand-written targeting logic with a model that learns *who is likely to convert on a goal*. The pillar can **deploy** AI Targeting today, but it cannot **evaluate** it — there is no native way to ask "did the AI target better than my manual rule?"

### Core users
- **Primary:** CRO managers and marketing PMs deciding whether to trust AI Targeting for a given personalization/goal.
- **Secondary:** Growth teams reporting on AI value internally; developers maintaining the personalization.

### Main use cases
- Validate AI Targeting against a known, hand-built segment+trigger definition before committing to it.
- Compare "AI intent targeting" against "returning visitors who hit the pricing page" for the same banner.
- Build internal confidence/evidence that AI Targeting earns its keep on a specific goal.

### Problem space
A clean comparison requires holding everything constant except the targeting:
- same content (so the experience is not a confound),
- same goal (so the success metric is identical),
- same incoming population evaluated by both definitions,
- and a rule that does not double-count visitors who satisfy both definitions.

None of this exists today. Users improvise with cloned rules, which breaks all four conditions.

### Constraints

**Technical**
- Personalization rules evaluate top-to-bottom; the first matching rule wins. This is unchanged.
- AI Targeting learns on a single goal — so the goal must be selectable and required on this rule.
- Deterministic per-visitor bucketing already exists (used for experiment traffic splits) and is the right tool for overlap resolution.

**UX**
- Dense, panel-based, editor-centric. Right panel is the configuration surface.
- Today the panel splits **Segments** and **Triggers** into separate blocks. For this rule that split is wrong: both are just *targeting conditions*, and forcing the AI/non-AI comparison into two separate segment+trigger pairs would be unreadable. The two definitions must each be a single nestable logical builder.
- AI presence must be obvious without implying the non-AI group is "lesser."

**Business**
- Must not fragment the personalization mental model — one rule, one content, one goal.
- Must not introduce a results dashboard or statistical engine in this scope; this is the *setup* experience.

---

## 2. Competitive Analysis

### Competitors analyzed
- **Adobe Target — Auto-Target & Auto-Allocate vs manual:** Target lets a model allocate experiences and reports model vs control, but the comparison is content/experience allocation, not *targeting definition* vs *targeting definition*. There is no "AI audience vs hand-built audience, same experience" primitive.
- **Optimizely (Stats Accelerator / Holdouts):** Holdout groups measure incremental lift of personalization as a whole, not AI-targeting vs manual-targeting head to head.
- **Dynamic Yield — Predictive Targeting:** Can switch a campaign between predictive and rule-based targeting, but switching is sequential/modal, not a simultaneous in-rule comparison on the same population.
- **VWO:** No predictive-vs-manual targeting comparison primitive.

### Key patterns
- Every mature tool that ships an "AI/auto" mode pairs it with **an explicit way to see it beat a baseline** — otherwise adoption stalls on distrust. Our gap is exactly the missing baseline-comparison primitive for *targeting*.
- All of them keep the **experience constant** when isolating an algorithm's contribution — validating our one-content constraint.
- Deterministic per-user assignment is universal for clean splits; none resolve overlap by static priority.

### Differentiation opportunity
- Kameleoon's queue-native, condition-based targeting model lets us express "two full targeting definitions, one AI, in one rule" as a first-class rule type — something the activity/campaign-mode competitors cannot cleanly do. We lean into "explicit logic": both definitions are visible side by side, and the overlap-handling rule is stated in the UI rather than hidden.

---

## 3. Current UX Analysis

### Current flow (today)
1. User opens a Personalization and adds a rule.
2. The right panel configures **Segments** (who) and **Triggers** (when) as separate blocks, then a single content and exposure %.
3. AI Targeting, where available, is one targeting option among others.

### Friction points
- **Segment/Trigger split blocks the comparison.** Two targeting definitions each need their own self-contained logical builder. Keeping the global Segments and Triggers blocks would force four sub-blocks and make the AI-vs-non-AI contrast invisible.
- **No place to declare two competing targeting definitions** under one content.
- **Goal is at personalization level**, but AI Targeting learns on a specific goal — there is no rule-level required goal today.
- **No overlap concept.** Cloned-rule workarounds silently double-count visitors who match both definitions.

### Cognitive load issues
- Nested targeting logic is already the densest part of the editor. Two groups of it side by side risks becoming unscannable — the builder must keep each group collapsible, summarized, and operator-explicit.

### Missing affordances
- A unified **Targeting** block (conditions, not segments-vs-triggers).
- A visible **AI Targeting** marker on exactly one group.
- An explicit, always-visible **overlap-handling** explanation.
- A **required goal** selector that doubles as the AI learning signal.

---

## 4. Comparison: the three personalization rule types

| Aspect | Targeting rule | Experiment rule | AI Targeting Comparison rule |
| --- | --- | --- | --- |
| What it answers | "Who sees this?" | "Which content wins?" | "Does AI targeting beat manual targeting?" |
| Content | one | many | **one (shared)** |
| Targeting | one definition | one definition | **two definitions (groups)** |
| AI | optional | n/a | **required in exactly one group (via an AI segment)** |
| Goal | personalization-level | personalization-level | **personalization-level (AI learns on it)** |
| Split logic | exposure % | bucket across content arms | **assign overlap to one group** |
| Queue evaluation | top-to-bottom | top-to-bottom | **top-to-bottom (unchanged)** |

This rule is the Experiment rule's mirror image: the Experiment rule **varies content and holds targeting constant**; this rule **varies targeting and holds content constant**.

---

## 5. Problem Synthesis

### Core problems (high priority)
1. There is no native, clean way to compare AI targeting vs non-AI targeting for the same experience and goal.
2. The Segment/Trigger split in the panel cannot represent two competing targeting definitions; targeting must become one unified condition builder per group.
3. Visitors who match both definitions are double-counted in every workaround, poisoning the comparison.

### Secondary issues
- AI presence must read as "this group uses AI" without making the other group look invalid.
- Dense nested logic across two groups needs collapse + summary affordances.
- The goal is doing double duty (success metric + AI signal) and must be required and explained as such.

---

## 6. Solution Exploration

### Solution A — New rule type with a unified two-group Targeting block (selected)
- **Description:** Add **AI Targeting Comparison Rule** as a third rule type in the existing rule-type selector. The right panel replaces the Segments/Triggers split with a single **Targeting** block containing exactly two groups, each a full nestable condition builder. Exactly one group carries an AI Targeting condition. One shared content. One required goal. Overlap resolved by deterministic per-visitor assignment, explained inline.
- **Why it's better:** Reuses the entire Experiment-rule editor scaffold; expresses the comparison as first-class structure; keeps Kameleoon's "explicit logic" principle (both definitions visible, overlap rule stated).
- **Trade-offs:** Diverges from the global Segments/Triggers panel layout for this rule type only. Justified — the comparison is the whole point and the split would obscure it.

### Solution B — A toggle on a standard rule ("also evaluate without AI")
- **Description:** Add a checkbox to a normal AI-targeting rule that silently spins up a shadow non-AI group.
- **Trade-offs:** Hides the second definition, gives the user no control over the manual baseline, and buries overlap handling. Rejected — opaque, violates explicit-logic.

### Solution C — Two separate rules + a comparison view
- **Description:** Keep cloned rules but add a reporting overlay that pairs them.
- **Trade-offs:** Does not fix double-counting (two queue slots, two populations, overlap matched by neither or both depending on order). Rejected — the comparison must live in one rule with one population.

---

## 7. Critical Thinking

### What might fail?
- Users may read the two groups as "control vs test" and infer one is the "real" one. Mitigation: neutral naming (Group 1 / Group 2), AI marker as a neutral capability chip, no winner language in setup.
- Users may expect a results dashboard here. Mitigation: this is explicitly the setup experience; a one-line placeholder points to where results will live, no dashboard built.
- A user places this rule below a broad active rule that captures the same visitors first. Mitigation: surface a queue-order hint ("rules above may capture visitors before this one"); ordering itself is unchanged.

### Risky assumptions
- Deterministic per-visitor bucketing can be applied at the *overlap subset* rather than the whole audience. Needs engineering confirmation (see engineering-brief.md).
- One goal is enough to both measure conversion and train AI Targeting. This is true by construction of AI Targeting (it learns on one goal), but the UI must make the shared meaning explicit.
- Overlap can be *estimated* at configure time for a diagnostic indicator. If not, the indicator degrades gracefully to "overlap possible" rather than a number.

### Validation priorities
1. Engineering: can overlap be measured as a diagnostic, and can deterministic assignment be scoped to the overlap subset only (not the whole population)?
2. UX: do users understand that overlapping visitors land in exactly one group and are not double-counted?
3. Product: is the rule-level required goal acceptable given goals are otherwise personalization-level?

---

## 8. Carried over from the Experiment Rule

### Reused as-is
- Rule-type selector pattern in the right panel (Rollout Planner lineage).
- Right-panel form architecture: header (status pill + rule id + type pill), collapsible config sections, dirty-state tracking, save button with unsaved count.
- Rule-queue card with type icon, status pill, unsaved pill, and a one-line summary with linked tokens.
- Chip / accent vocabulary: purple for the AI/experimentation accent, success-green totals, amber unsaved, neutral gray for secondary chips.
- "Targeted-but-not-matched visitors continue down the queue" semantics and top-to-bottom evaluation.

### Open questions / improvements carried over (adapted)
- **Small audiences** (Experiment rule: "bandit + segment-narrow"). Here: if a group is very narrow, the comparison has little signal. Carry over a "this group looks narrow" hint.
- **Goal alignment** (Experiment rule: "is one inherited goal enough for the bandit?"). Here it sharpens: the goal is required and is *both* the conversion metric and the AI learning signal — stated explicitly in copy.
- **Queue-order interaction** (Experiment rule: "targeted-but-not-exposed continues"). Here: a rule above can capture this rule's visitors first; surface the hint, keep ordering unchanged.
- **Reporting is out of scope but must exist before GA** — same caveat; here it needs per-group conversion on the shared goal plus the realized overlap rate.
- **No migration needed** — new rule type, existing rules untouched.

### New only because this rule compares AI vs non-AI in one rule
- **Two targeting groups under one rule**, each using the familiar Segment + Trigger definition.
- **AI Targeting expressed inside a segment** — a group is the AI group when its Specific segment contains an AI condition (flagged with an `AI` badge in the picker).
- **Exactly one group includes AI Targeting** guardrail (≥1 and ≤1), enforced by disabling AI segments in the other group's picker.
- **One shared content** (vs the Experiment rule's many) — variation comes from targeting, not experience.
- **Overlap handling**: explicit diagnostic + deterministic per-visitor assignment of the overlap subset to exactly one group.

> **Revision note.** An earlier draft proposed a single free-form condition builder per group (merging Segments and Triggers into one nestable list) and a required rule-level goal. On stakeholder review both were dropped: groups keep the **existing Segment + Trigger model** (so the rule reads as an evolution of today's setup), AI lives **inside a segment**, and there is **no rule-level goal** (goals stay personalization-level). The sections above retain the original discovery reasoning; the decisions here and in `spec.md` are authoritative.

---

## 9. Proposed solution direction

Adopt **Solution A** (as revised):
- New rule type **AI Targeting Comparison Rule** in the existing rule-type selector.
- Right panel: Rule name → **Targeting** (Group 1, Group 2, overlap note) → **Content** (one) → optional Scheduling / Display / Rollback. **No Goal section.**
- Each group uses the familiar **Segment + Trigger** definition; AI Targeting is a Specific segment flagged with an `AI` badge.
- Exactly two groups; exactly one uses an AI segment; one shared content; goal stays at the personalization level.
- Overlap resolved by stable hash-based per-visitor assignment of the overlap subset only; explained inline.
- Rule queue renders the rule with a `compare_arrows` icon and a compact "{Group 1} vs {Group 2} → tested on {Content}" summary built from the group names (no "AI COMPARISON" badge; the AI group's name carries the purple accent).
