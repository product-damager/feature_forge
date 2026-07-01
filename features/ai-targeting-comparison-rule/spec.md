# Feature Spec — AI Targeting Comparison Rule

## Problem

A user can turn AI Targeting on for a personalization rule, but cannot natively prove it targets better than the rule they would have written by hand. To compare, they clone rules into the queue — and because the queue matches top-to-bottom, the first rule captures every visitor who qualifies for both definitions while the second sees only the remainder. The exposure is skewed and there is no clean, single read. There is no rule type that holds the **content**, **trigger**, and **goal** constant while letting two **targeting definitions** — one AI, one not — compete on the same incoming population.

---

## Insight

The Experiment Rule already solved the inverse problem: vary the **content**, hold the **targeting** constant, and split exposed visitors across content arms. The AI-vs-manual question is the mirror image — vary the **segment**, hold the **content** and **trigger** constant, and read the two segments head-to-head. The editor scaffolding (rule-type selector, right-panel form, queue card) transfers almost entirely. Three things are genuinely new: (1) **two segments to compare** under one rule with **one shared trigger**, (2) the "exactly one segment uses AI" guardrail, and (3) **accepted overlap** — visitors who match both definitions are counted in both groups, and results are read as a comparison of two definitions, not as mutually exclusive populations.

Crucially, the definition stays close to today's setup: each group keeps the existing **Segment** model rather than a new condition builder, and a single shared **Trigger** — identical to the standard trigger block — governs when both segments are evaluated. **AI Targeting is expressed inside a segment** — a group is the AI group when its Specific segment contains an AI targeting condition. This keeps the rule a recognizable evolution of the current editor.

---

## Solution

Introduce a third Personalization rule type: **AI Targeting Comparison Rule**.

### Capabilities
- Exactly **2 segments to compare** under one rule, evaluated under **one shared trigger**.
- The two segments use the **familiar Segment model** (the same radio-based definition used by standard rules today): All visitors / Specific segment / Specific visitors.
- **One shared Trigger** for the whole rule (When a web page is reached / When a specific trigger occurs / When a combination of triggers occurs), identical to standard rules. The trigger is the same for both sides, so the only variable in the comparison is the segment definition.
- **AI Targeting lives inside a segment.** A group "includes AI Targeting" when its *Specific segment* contains an AI targeting condition. Exactly **one** segment must be such a segment; the other must not.
- Exactly **one shared content** for the rule.
- **No rule-level goal.** The conversion goal is configured once at the **personalization level** (a separate step), exactly like every other rule. AI Targeting learns on that personalization goal.
- **Accepted overlap.** Visitors matching both segments are counted in **both** groups (double-counting accepted as intended behaviour); the rule does not split, deduplicate, reassign, or prioritize overlapping visitors, and the editor shows no overlap note or indicator.

### What changes in the product
- `+ Add a rule` rule-type selector gains a third card: **AI Targeting Comparison**.
- The two segments reuse the existing **Segment** definition UI, presented as two group cards inside a **Segments to compare** area; one shared **Trigger** block sits below them. (No new condition-builder language and no nested-group builder — this is deliberately an evolution of today's rule setup.)
- AI segments are flagged with an **AI learning-state badge** in the segment picker; selecting one in a group marks that group as the AI group.
- New rule-queue card renderer: a distinct `compare_arrows` type icon and a summary line built from the two **group names** and the **shared content** (e.g. *Group 1 vs Group 2 → tested on Content 1*). No standalone "AI COMPARISON" badge — the icon plus summary carry the type.

### What does NOT change
- Top-to-bottom rule ordering and "first matching rule wins" queue semantics.
- The Segment and Trigger definition model itself — the rule uses the same controls standard rules already use.
- Goals stay at the personalization level; no per-rule goal.
- Existing Targeting and Experiment rules are untouched; no migration.

---

## UX Flow

### Entry point
User clicks **+ Add a rule** → rule-type selector (Step 1 of 2) shows three cards: **Targeting rule**, **Experiment rule**, **AI Targeting Comparison**. Selecting the third opens its configuration form.

### Right-panel IA (top to bottom)
1. **Rule type / rule name** — header with status pill, rule id, and an `AI Comparison` type pill; rule-name input.
2. **Validation banner** — appears only when the rule cannot be saved; lists blocking reasons.
3. **Targeting** *(expanded by default)*
   - **Segments to compare**
     - **Group 1** — Segment definition + AI capability chip.
     - **Group 2** — Segment definition + AI capability chip.
   - **Trigger (shared)** — one trigger definition governing when both segments are evaluated.
4. **Content** — exactly one content selector + helper.
5. **Scheduling** *(optional, collapsed)*
6. **Display settings** *(optional, collapsed)*
7. **Rollback conditions** *(optional, collapsed)*

> There is **no Goal section** in this rule. Goals are configured at the personalization level, like every other rule. There is **no overlap note** — overlap is accepted (see below), not resolved, and not surfaced in the editor.

### The Targeting block (two segments + one shared trigger)

One section titled **Targeting**, built from two parts. This mirrors how the two definitions differ only by segment — the trigger is held constant, the same way an Experiment rule holds targeting constant and varies the content.

**Segments to compare** — exactly two collapsible group cards. Each card reuses today's segment controls so the rule feels like an evolution, not a new product. Each **group card** has:
- A header: neutral group name (**Group 1** / **Group 2**, editable), a **capability chip** (purple **`AI Targeting`** when the group's segment includes an AI condition; neutral gray **`No AI targeting`** otherwise — a statement of fact, not a warning), a one-line summary, and a collapse toggle. When the group is the AI group, its AI learning-state badge (Learning / No data / Weak / Moderate / Good) shows next to the chip.
- A **Segment** sub-block (radio buttons, mirroring the current UI):
  - **All Visitors**
  - **Specific segment** → on select, a segment picker appears, populated with the user's segments. Segments that contain an AI targeting condition show an **AI learning-state badge** to the right of their name. Choosing one makes this the AI group.
  - **Specific visitors** *(present but inactive — it is a quick builder with its own logic)*.

**Trigger (shared)** — one Trigger sub-block for the whole rule, placed below the two segments and identical to the current UI:
- **When a web page is reached** → its own hierarchy: *A specific page* (reveals a URL input) / *The URLs containing a specific fragment* (reveals a fragment input) / *The entire site* (a `?` help icon whose tooltip reads "Caution: This will target all pages within the project scope.").
- **When a specific trigger occurs** → on select, a trigger picker appears, populated with the user's triggers.
- **When a combination of triggers occurs** *(present but inactive — quick builder with its own logic)*.

The AI-vs-non-AI contrast is carried entirely by **which segment a group selects** plus the group's capability chip. The trigger and content are shared, so the segment is the only variable. The non-AI group is configured exactly like a normal targeting segment.

### Content
A single content selector with helper. No add-content affordance — the single-content restriction is intentional and explained, not an arbitrary cap.

> **No Goal section.** Goals remain a personalization-level setting configured on a separate step. AI Targeting learns on that personalization goal; nothing about the goal is set on this rule.

---

## Product decisions (authoritative)

1. **Distinct rule type.** `type: 'ai-comparison'`, sibling to `targeting` and `experiment`.
2. **Exactly 2 segments.** No add/remove group affordance. The count is fixed by the rule type.
3. **At least one segment must include AI Targeting** — i.e. select a segment that contains an AI targeting condition.
4. **Both segments cannot include AI Targeting.** AI segments are disabled in a group's segment picker once the other group already uses one (with an inline explanation).
5. **Non-AI group accepts any standard segment logic** the current model supports — it is the comparison baseline.
6. **Neutral group naming.** No control/test semantics in setup. Default labels Group 1 / Group 2 (editable).
7. **One shared Trigger for the rule** (radio-based), not one per group. The "combination of triggers" quick-builder is present but inactive in this scope.
8. **Segment and Trigger remain the existing definition model.** AI Targeting is expressed *inside a segment*, not as a separate top-level condition type.
9. **One shared content.** No multi-content exposure.
10. **No rule-level goal.** Goals are configured at the personalization level (separate step); AI Targeting learns on that goal.
11. **Top-to-bottom rule ordering unchanged.**
12. **Overlap is accepted, not resolved.** Visitors matching both segments are counted in both groups; the editor shows no overlap control.

---

## Overlap handling (required behavior)

This is core feature behavior, not an implementation detail.

- Evaluate **both segments against the full incoming population** under the shared trigger.
- A visitor matching **only one** segment → counted in that group.
- A visitor matching **both** segments → **counted in both groups.** Double-counting is accepted as intended behaviour.
- **Do not** split, deduplicate, hash-bucket, reassign, or resolve overlap by priority. The rule assigns nothing — it attributes each visitor to every group whose segment they matched.
- **Do not** display an overlap note, helper, estimate, or diagnostic indicator in the editor. Measuring overlap reliably at configure time is not assumed feasible.
- Results are read as a **head-to-head comparison of two targeting definitions** over the same content and trigger, not as a comparison of mutually exclusive populations. Where overlap can be computed at all, it is surfaced **only in the results view** as an interpretation aid (how much the two definitions agree), never as a configuration-time control or validity gate.

---

## Validation & guardrails

The Save / Publish action is blocked while any blocking rule fails; the validation banner lists every failing reason.

| Rule | Severity | Message |
| --- | --- | --- |
| Exactly 2 segments exist | structural (enforced by UI; not user-breakable) | — |
| At least one segment includes AI Targeting | **blocking** | "One group must use a segment that includes an AI Targeting condition." |
| Not both segments include AI Targeting | **blocking** (also prevented in the picker) | "Only one group can include AI Targeting. Change the segment in one group." |
| Exactly one content selected | structural (single selector, always satisfied) | — |
| Each group has a Segment definition + the rule has a shared Trigger | structural (always satisfied — segments default to All visitors, trigger to web-page) | — |

Interaction-level guardrail: in a group's segment picker, segments that contain an AI targeting condition are **disabled** (with an inline note) once the other group already uses an AI segment — so both groups can never include AI.

> Goal validation is intentionally gone — there is no rule-level goal. "Group needs ≥1 condition" is also gone — a group's Segment definition always has a value (defaults to *All visitors*), and the shared trigger defaults to *web page reached*. There is no overlap validation — overlap never blocks and is not shown in the editor.

---

## Suggested in-product copy

- **Content helper:** "Select the content to display to your visitors."
- **Segments-to-compare hint:** "The only thing that differs between the two groups."
- **Shared-trigger hint:** "Shared — when both segments are evaluated and the content is shown."
- **Segment-picker AI badge:** an AI learning-state badge (Learning / No data / Weak / Moderate / Good) on segments that contain an AI targeting condition.
- **AI chip tooltip:** "This group uses AI Targeting to decide who qualifies."
- **No-AI chip tooltip:** "This group uses standard targeting conditions. That's expected — it's the comparison baseline."
- **AI segment disabled note (other group):** "AI segments are disabled here — the other group already includes AI Targeting."
- **"The entire site" tooltip:** "Caution: This will target all pages within the project scope."

> There is no static intro paragraph above Targeting and no overlap note — the behaviour is conveyed by the structure (two segments, one shared trigger, the AI capability chip). Overlap is accepted and only interpreted in results.

---

## Rule-list summary pattern

A compact one-liner so a reviewer understands the rule at a glance. It conveys the two **group names** and the **shared content** they are tested on.

**Pattern:**
`{Group 1 name} vs {Group 2 name} → tested on {Content}`

**Examples:**
- `Group 1 vs Group 2 → tested on Content 1`
- `AI intent vs Returning visitors → tested on Hero banner`  *(after renaming the groups)*

Rendering details: a distinct `compare_arrows` type icon on the card; the group whose segment is an AI segment has its **name rendered in the purple AI accent** so the AI side stays identifiable at a glance — but there is **no separate "AI COMPARISON" badge**. The shared content is a linked token. Groups are shown in their natural order (Group 1, then Group 2), not AI-first, so the line tracks the user's own labels. If the rule is invalid, the whole summary is replaced by an amber `Incomplete — {first blocking reason}`.

---

## UX Implications

- The rule keeps the **familiar Segment and Trigger definitions**, so it reads as an evolution of today's setup rather than a new builder. What's new is two segments under one Targeting section, a single shared trigger, and the AI capability chip.
- Two segment cards plus one shared trigger is more compact than two full Segment+Trigger definitions would be, which keeps the panel scannable. Mitigations remain: per-group collapse and a one-line group summary in the header.
- AI presence is shown as a neutral capability chip and a learning-state badge in the segment picker — never as a "winner/loser" or validity signal on the other group.
- There is no rule-level goal; goals stay at the personalization level, consistent with every other rule.
- There is no overlap control in the editor — overlap is accepted and interpreted only in results, so the editor stays focused on the two definitions.

---

## Business Impact

- **AI Targeting adoption & retention:** users who can prove lift keep AI on and expand it; this rule is the proof surface.
- **Trust:** "explicit logic" — both targeting definitions are visible and explicit, addressing the #1 reason users distrust AI targeting (opacity).
- **Pillar consolidation:** the AI-vs-manual question is answered inside Personalizations, not by exporting to Web Experiments.
- **Differentiated primitive:** a single queue-native rule that compares an AI targeting definition against a manual one on the same content under one shared trigger, as a designed, pre-registered comparison — where competitors offer only post-hoc "Compare Segments" slicing.

---

## Risks / Open questions

- **AI decision at evaluation time.** AI-group membership must be known when the rule fires; AI segments are often reconstructed after the fact. Confirm the AI verdict is evaluable in-line at decision time. (Engineering — see engineering-brief.md §4.)
- **Narrow segments → weak signal.** Carry over the Experiment-rule small-audience concern; warn, don't block.
- **AI inside a segment.** AI presence is detected via the selected segment. Confirm "is this segment AI-driven?" is a reliable, queryable property of a segment (needed for the capability chip, the picker badge, and the both-groups guardrail).
- **Queue order.** A broad rule above can capture these visitors first; ordering is unchanged. Decide whether a soft hint is warranted (not built — would clutter the dense panel).
- **Overlap interpretation in results.** Double-counting is accepted; results must make clear the two groups are not independent when overlap is large. A results-only overlap-agreement signal is optional. (Reporting is out of scope here — see methodology-and-research.md §3.)

---

## Acceptance criteria

1. The rule-type selector offers **AI Targeting Comparison** as a third option.
2. Selecting it opens a form with a single **Targeting** block containing exactly **two segments to compare** and **one shared trigger** — no separate top-level Segments/Triggers sections, no per-group trigger, no add/remove-group control.
3. Each group is defined with the familiar **Segment** radio model (All visitors / Specific segment / Specific visitors), and a single shared **Trigger** (web-page / specific trigger / combination, with the web-page hierarchy and inactive quick-builders present) governs when both segments are evaluated.
4. AI Targeting is selected via a **Specific segment** flagged with an AI learning-state badge; exactly one group can use an AI segment — AI segments are disabled in the other group's picker with an explanation.
5. Save is blocked (with a banner listing reasons) when no group uses an AI segment, or both do.
6. Exactly one content selector exists; there is no way to add a second content; the restriction is explained.
7. There is **no goal selector** on the rule.
8. The editor displays **no overlap note, helper, estimate, or diagnostic indicator**. Visitors who match both segments are counted in both groups (accepted double-counting); the rule does not split, deduplicate, or reassign them.
9. The rule queue renders the rule with the `compare_arrows` icon and a summary built from the two group names and the shared content (no "AI COMPARISON" badge); the AI group's name carries the purple accent; top-to-bottom ordering is preserved.
10. Changing which group uses the AI segment updates both group chips and re-validates.

---

## Prototype scope

The prototype demonstrates, statically:
1. The rule queue with a standard Targeting rule and a configured AI Targeting Comparison rule (showing the summary pattern).
2. Adding a rule → three-card rule-type selector.
3. The AI Targeting Comparison form: a **Segments to compare** area with two group cards, plus one shared **Trigger** block below them.
4. Per-group Segment radios (only the selected radio's label is emphasized): All visitors / Specific segment (with a badged segment picker) / Specific visitors (inactive). One shared trigger: web-page hierarchy — *A specific page* reveals a URL input, *URLs containing a fragment* reveals a fragment input, *The entire site* shows its caution as a help-icon tooltip — / specific trigger (picker) / combination (inactive). Per-group collapse + summary.
5. The one-group-only AI guardrail (AI segments disabled + inline message in the other group's picker).
6. Single shared content selector ("Select the content to display to your visitors").
7. No goal selector (goal is personalization-level).
8. No overlap note or diagnostic — overlap is accepted and not shown in the editor.
9. Validation banner + Save button gating on the blocking rules.
10. Rule-queue card rendering for the new type: `compare_arrows` icon + "Group 1 vs Group 2 → tested on {Content}" summary, no badge.
11. Layout: fixed 270px sidebar; the main rule list and the configuration panel split the remaining width 50/50 and reflow responsively.

The prototype does NOT implement: real targeting evaluation, real overlap computation, real AI learning, a results dashboard, or backend persistence.

---

## Future production considerations

- Per-group goal-event attribution on the shared personalization goal, including attributing one overlap visitor to both groups (engineering-brief.md).
- Results view: per-group conversion on the shared goal, with the two groups presented as a head-to-head comparison of two definitions (not exclusive populations).
- Optional results-only overlap-agreement signal (how much the two definitions overlap), if cheap to compute — never a configure-time control.
- "Promote the winning targeting definition" flow once a comparison concludes (out of scope for v1).
