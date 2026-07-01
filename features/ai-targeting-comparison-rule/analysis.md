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
A clean comparison requires holding everything constant except the segment (audience) definition:
- same content (so the experience is not a confound),
- same goal (so the success metric is identical),
- one shared trigger (so *when* the rule fires is not a confound),
- the same incoming population evaluated by both segment definitions.

A visitor who qualifies for both segments is attributed to both groups — this double-counting is accepted as intended behaviour, not a defect to resolve. None of this exists today; users improvise with cloned rules, which breaks the shared-content, shared-trigger, and shared-population conditions.

### Constraints

**Technical**
- Personalization rules evaluate top-to-bottom; the first matching rule wins. This is unchanged.
- AI Targeting learns on a single goal — the goal stays at the personalization level and both groups share it.
- When the shared trigger fires, both segments are evaluated against the full incoming population. A visitor may match one, both, or neither; matching both is allowed and attributes the visitor to both groups.

**UX**
- Dense, panel-based, editor-centric. Right panel is the configuration surface.
- The rule holds the **trigger** constant and varies the **segment**. So the panel keeps a Segment/Trigger model, but restructured: a **Segments to compare** area with two segment containers (Group 1 / Group 2), then **one shared Trigger** block below. Only the segment definition differs between the two sides.
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
- Where competitors offer comparison at all, it is **post-hoc "Compare Segments" slicing** of an already-shipped campaign — not a comparison designed up front.

### Differentiation opportunity
- Kameleoon's queue-native, condition-based targeting model lets us express, as a first-class rule type, **a single rule that compares an AI segment definition against a manual one on the same content under one shared trigger** — a designed, pre-registered comparison. Competitors only offer post-hoc "Compare Segments" slicing. We lean into "explicit logic": both segment definitions are visible side by side, the trigger is shared, and the double-counting of overlapping visitors is made explicit rather than hidden. (We do **not** claim to deduplicate or deterministically resolve overlap — we double-count by design, and say so.)

---

## 3. Current UX Analysis

### Current flow (today)
1. User opens a Personalization and adds a rule.
2. The right panel configures **Segments** (who) and **Triggers** (when) as separate blocks, then a single content and exposure %.
3. AI Targeting, where available, is one targeting option among others.

### Friction points
- **The panel can't express two segments under one shared trigger.** Today a rule has one segment and one trigger; there is no way to declare two competing *segment* definitions that share a single trigger and single content.
- **No place to compare an AI segment against a manual segment** on the same experience.
- **No native learning-state signal.** Nothing tells the user whether the AI segment has enough data to be worth comparing.

### Cognitive load issues
- Nested segment logic is already the densest part of the editor. Two segment definitions side by side risk becoming unscannable — each segment container must stay collapsible, summarized, and operator-explicit. Sharing one trigger keeps the *when* out of the comparison surface entirely.

### Missing affordances
- A **Segments to compare** area with two segment containers, above **one shared Trigger** block.
- A visible **AI Targeting** marker on exactly one group.
- An AI **learning-state badge** (Learning / No data / Weak / Moderate / Good) as the one editor-time reliability signal.

---

## 4. Comparison: the three personalization rule types

| Aspect | Targeting rule | Experiment rule | AI Targeting Comparison rule |
| --- | --- | --- | --- |
| What it answers | "Who sees this?" | "Which content wins?" | "Does AI targeting beat manual targeting?" |
| Content | one | many | **one (shared)** |
| Segment | one definition | one definition | **two definitions (groups)** |
| Trigger | one | one | **one (shared across both groups)** |
| AI | optional | n/a | **required in exactly one group (via an AI segment)** |
| Goal | personalization-level | personalization-level | **personalization-level (AI learns on it)** |
| Overlap logic | n/a | bucket across content arms | **overlap accepted — matched by both → counted in both** |
| Queue evaluation | top-to-bottom | top-to-bottom | **top-to-bottom (unchanged)** |

This rule is the Experiment rule's mirror image: the Experiment rule **varies content and holds targeting constant**; this rule **holds the trigger constant and varies the segment**.

---

## 5. Problem Synthesis

### Core problems (high priority)
1. There is no native, clean way to compare AI targeting vs non-AI targeting for the same experience, trigger, and goal.
2. The panel cannot represent two competing *segment* definitions sharing one trigger; it must offer two segment containers above a single shared Trigger block.
3. Users have no editor-time signal for whether the AI segment has learned enough to make the comparison worth running.

### Secondary issues
- AI presence must read as "this group uses AI" without making the other group look invalid.
- Two dense segment definitions side by side need collapse + summary affordances.
- Overlap is real and accepted: a visitor matching both segments counts in both groups. This is by design and must not be presented as an error to fix in the editor.

---

## 6. Solution Exploration

### Solution A — New rule type with two segments to compare under one shared trigger (selected)
- **Description:** Add **AI Targeting Comparison Rule** as a third rule type in the existing rule-type selector. The right panel offers a **Segments to compare** area with exactly two segment containers (Group 1 / Group 2), then **one shared Trigger** block below, then one shared content. Exactly one group's segment carries an AI Targeting condition. The trigger is held constant for both sides; only the segment varies. Overlap is accepted (a visitor matching both segments counts in both groups); it is not split, deduplicated, or resolved. No overlap note is shown in the editor.
- **Why it's better:** Reuses the Experiment-rule editor scaffold; expresses the comparison as first-class structure; keeps Kameleoon's "explicit logic" principle (both segment definitions visible, one shared trigger, double-counting made explicit by design).
- **Trade-offs:** Restructures the Segment/Trigger layout for this rule type only (two segments, one shared trigger). Justified — the comparison is the whole point and holding the trigger constant is what makes the segment the only variable.

### Solution B — A toggle on a standard rule ("also evaluate without AI")
- **Description:** Add a checkbox to a normal AI-targeting rule that silently spins up a shadow non-AI group.
- **Trade-offs:** Hides the second definition, gives the user no control over the manual baseline, and hides the AI-vs-manual framing. Rejected — opaque, violates explicit-logic.

### Solution C — Two separate rules + a comparison view
- **Description:** Keep cloned rules but add a reporting overlay that pairs them.
- **Trade-offs:** Two queue slots means two triggers and two populations, so the trigger is no longer shared and the comparison is confounded by *when* each rule fires. Rejected — the comparison must live in one rule with one shared trigger and one incoming population.

---

## 7. Critical Thinking

### What might fail?
- Users may read the two groups as "control vs test" and infer one is the "real" one. Mitigation: neutral naming (Group 1 / Group 2), AI marker as a neutral capability chip, no winner language in setup.
- Users may expect a results dashboard here. Mitigation: this is explicitly the setup experience; a one-line placeholder points to where results will live, no dashboard built.
- A user places this rule below a broad active rule that captures the same visitors first. Mitigation: surface a queue-order hint ("rules above may capture visitors before this one"); ordering itself is unchanged.

### Risky assumptions
- The AI segment's learning state is legible enough to gate the comparison in the editor. This is the one editor-time reliability signal, so the badge (Learning / No data / Weak / Moderate / Good) must be trustworthy.
- One goal is enough to both measure conversion and train AI Targeting. This is true by construction of AI Targeting (it learns on one goal), but the UI must make the shared meaning explicit.
- Overlap cannot be reliably measured at configure time — so we do **not** attempt a configure-time estimate or diagnostic. Overlap surfaces only later, in the results view, as an interpretation aid.

### Statistical interpretation (see `methodology-and-research.md`)
- Overlap is accepted, not resolved: a visitor who matches both segments is attributed to both groups. High overlap does **not** invalidate the comparison — it simply means the manual definition largely matches the AI's selection, and the two groups' results will look similar. Low overlap means the definitions disagree and the comparison is more discriminating.
- Overlap is therefore a **results-time interpretation signal** (how much the two definitions agree), never a configuration-time control or validity gate.

### Validation priorities
1. UX: do users understand the AI learning-state badge and treat it as the go/no-go signal for running the comparison?
2. Product: is holding the trigger constant while varying only the segment the right framing for users (vs expecting to vary the trigger too)?
3. Results (later scope): is overlap presented clearly as an agreement signal rather than an error, so high overlap is read as "definitions agree," not "comparison broken"?

---

## 8. Carried over from the Experiment Rule

### Reused as-is
- Rule-type selector pattern in the right panel (Rollout Planner lineage).
- Right-panel form architecture: header (status pill + rule id + type pill), collapsible config sections, dirty-state tracking, save button with unsaved count.
- Rule-queue card with type icon, status pill, unsaved pill, and a one-line summary with linked tokens.
- Chip / accent vocabulary: purple for the AI/experimentation accent, success-green totals, amber unsaved, neutral gray for secondary chips.
- "Targeted-but-not-matched visitors continue down the queue" semantics and top-to-bottom evaluation. Here: when the shared trigger fires, both segments are evaluated against the full incoming population; if neither matches the rule does not apply and the visitor continues down the queue. If one or both match, exposure % is applied and an eligible visitor is shown the single shared content once — while being attributed to every group whose segment they matched.

### Open questions / improvements carried over (adapted)
- **Small audiences** (Experiment rule: "bandit + segment-narrow"). Here: if a group is very narrow, the comparison has little signal. Carry over a "this group looks narrow" hint.
- **Goal alignment** (Experiment rule: "is one inherited goal enough for the bandit?"). Here: the goal stays at the personalization level and both groups share it; it is *both* the conversion metric and the AI learning signal — stated explicitly in copy.
- **Queue-order interaction** (Experiment rule: "targeted-but-not-exposed continues"). Here: a rule above can capture this rule's visitors first; surface the hint, keep ordering unchanged.
- **Reporting is out of scope but must exist before GA** — same caveat; here it needs per-group conversion on the shared goal, with a visitor attributed to every group whose segment they matched (both, if overlap), plus the realized overlap rate as an agreement signal.
- **No migration needed** — new rule type, existing rules untouched.

### New only because this rule compares AI vs non-AI in one rule
- **Two segment definitions to compare**, each a Segment definition per group, plus **one shared Trigger** for the rule.
- **AI Targeting expressed inside a segment** — a group is the AI group when its Specific segment contains an AI condition (flagged with an `AI` badge in the picker).
- **Exactly one group includes AI Targeting** guardrail (≥1 and ≤1), enforced by disabling AI segments in the other group's picker.
- **One shared content** (vs the Experiment rule's many) — variation comes from the segment, not the experience or the trigger.
- **Overlap accepted, not handled**: a visitor matching both segments counts in both groups. No editor-time overlap note, estimate, or diagnostic; overlap is interpreted only in the future results view.
- **AI learning-state badge** as the single editor-time reliability gate.

> **Revision note.** An earlier draft proposed resolving overlap — a deterministic/stable-hash per-visitor assignment that put each overlapping visitor in exactly one group (a 50/50 split of the overlap subset), plus a configure-time overlap estimate/diagnostic in the editor. Both are dropped. Overlap is now **accepted**: a visitor who matches both segments is **counted in both groups** (double-counting by design). There is **no** deduplication, bucketing, prioritization, or overlap note in the editor, and no attempt to measure overlap at configure time. Overlap surfaces **only in the future results view** as an interpretation aid (how much the two segment definitions agree), never as a configuration-time control or validity gate. The one editor-time reliability signal is the AI segment's **learning-state badge**. The sections above have been updated to reflect this; the decisions here and in `spec.md` are authoritative.

---

## 9. Proposed solution direction

Adopt **Solution A** (as revised):
- New rule type **AI Targeting Comparison Rule** in the existing rule-type selector.
- Right panel: Rule name → **Targeting** (two segments to compare + one shared trigger) → **Content** (one) → optional Scheduling / Display / Rollback. **No Goal section.**
- Each group carries a **Segment definition**; both groups share **one Trigger** for the rule. AI Targeting is a Specific segment flagged with an `AI` badge.
- Exactly two groups; exactly one uses an AI segment; one shared trigger; one shared content; goal stays at the personalization level.
- **Overlap accepted:** a visitor matching both segments counts in both groups. No overlap note, estimate, or diagnostic in the editor; overlap is interpreted only in the future results view.
- **AI learning-state badge** (Learning / No data / Weak / Moderate / Good) is the one editor-time reliability signal.
- Rule queue renders the rule with a `compare_arrows` icon and a compact "{Group 1} vs {Group 2} → tested on {Content}" summary built from the group names (no "AI COMPARISON" badge; the AI group's name carries the purple accent).
