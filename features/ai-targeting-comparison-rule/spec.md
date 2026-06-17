# Feature Spec — AI Targeting Comparison Rule

## Problem

A user can turn AI Targeting on for a personalization rule, but cannot natively prove it targets better than the rule they would have written by hand. To compare, they clone rules — which fragments the goal, double-counts visitors who match both definitions, and yields no clean read. There is no rule type that holds the **content** and **goal** constant while letting two **targeting definitions** — one AI, one not — compete on the same incoming population.

---

## Insight

The Experiment Rule already solved the inverse problem: vary the **content**, hold the **targeting** constant, and split exposed visitors across content arms. The AI-vs-manual question is the mirror image — vary the **targeting**, hold the **content** constant, and split the population across two **targeting groups**. The editor scaffolding (rule-type selector, right-panel form, queue card, deterministic bucketing) transfers almost entirely. Three things are genuinely new: (1) **two targeting groups** under one rule, each using the familiar Segment + Trigger definition, (2) the "exactly one group uses AI" guardrail, and (3) **overlap handling** — what happens to visitors who match both definitions.

Crucially, the group definition stays close to today's setup: each group keeps the existing **Segment + Trigger** model rather than a new condition builder. **AI Targeting is expressed inside a segment** — a group is the AI group when its Specific segment contains an AI targeting condition. This keeps the rule a recognizable evolution of the current editor.

---

## Solution

Introduce a third Personalization rule type: **AI Targeting Comparison Rule**.

### Capabilities
- Exactly **2 targeting groups** under one rule.
- Each group is defined with the **familiar Segment + Trigger model** (the same radio-based definition used by standard rules today): a Segment definition (All visitors / Specific segment / Specific visitors) and a Trigger definition (When a web page is reached / When a specific trigger occurs / When a combination of triggers occurs).
- **AI Targeting lives inside a segment.** A group "includes AI Targeting" when its *Specific segment* is one that contains an AI targeting condition. Exactly **one** group must use such a segment; the other must not.
- Exactly **one shared content** for the rule.
- **No rule-level goal.** The conversion goal is configured once at the **personalization level** (a separate step), exactly like every other rule. AI Targeting learns on that personalization goal.
- **Overlap handling**: both groups are evaluated against the full incoming population; visitors matching both are assigned to exactly one group via deterministic per-visitor assignment.

### What changes in the product
- `+ Add a rule` rule-type selector gains a third card: **AI Targeting Comparison**.
- The two groups reuse the existing **Segment + Trigger** definition UI, presented as two group cards inside one **Targeting** section. (No new condition-builder language and no nested-group builder — this is deliberately an evolution of today's rule setup.)
- AI segments are flagged with an **AI badge** in the segment picker; selecting one in a group marks that group as the AI group.
- New rule-queue card renderer: a distinct `compare_arrows` type icon and a summary line built from the two **group names** and the **shared content** (e.g. *Group 1 vs Group 2 → tested on Content 1*). No standalone "AI COMPARISON" badge — the icon plus summary carry the type.

### What does NOT change
- Top-to-bottom rule ordering and "first matching rule wins" queue semantics.
- The Segment + Trigger definition model itself — groups use the same controls standard rules already use.
- Goals stay at the personalization level; no per-rule goal.
- Existing Targeting and Experiment rules are untouched; no migration.
- Deterministic per-visitor bucketing reuses the existing mechanism.

---

## UX Flow

### Entry point
User clicks **+ Add a rule** → rule-type selector (Step 1 of 2) shows three cards: **Targeting rule**, **Experiment rule**, **AI Targeting Comparison**. Selecting the third opens its configuration form.

### Right-panel IA (top to bottom)
1. **Rule type / rule name** — header with status pill, rule id, and an `AI COMPARISON` type pill; rule-name input.
2. **Validation banner** — appears only when the rule cannot be saved; lists blocking reasons.
3. **Targeting** *(expanded by default)*
   - Intro helper.
   - **Group 1** — Segment + Trigger definition + AI capability chip.
   - **Group 2** — Segment + Trigger definition + AI capability chip.
   - **Overlap note** — short sentence + expandable helper + diagnostic indicator.
4. **Content** — exactly one content selector + helper.
5. **Scheduling** *(optional, collapsed)*
6. **Display settings** *(optional, collapsed)*
7. **Rollback conditions** *(optional, collapsed)*

> There is **no Goal section** in this rule. Goals are configured at the personalization level, like every other rule.

### The Targeting block (two Segment + Trigger groups)

One section titled **Targeting** holding exactly two collapsible group cards. Each card reuses today's rule-definition controls so the rule feels like an evolution, not a new product.

Each **group card** has:
- A header: neutral group name (**Group 1** / **Group 2**, editable), a **capability chip** (purple **`AI Targeting`** when the group's segment includes an AI condition; neutral gray **`No AI targeting`** otherwise — a statement of fact, not a warning), a one-line summary, and a collapse toggle.
- A **Segments** sub-block (radio buttons, mirroring the current UI):
  - **All Visitors**
  - **Specific segment** → on select, a segment picker appears, populated with the user's segments. Segments that contain an AI targeting condition show an **`AI` badge** to the right of their name. Choosing one makes this the AI group.
  - **Specific visitors** *(present but inactive — it is a quick builder with its own logic)*.
- A **Triggers** sub-block (radio buttons, mirroring the current UI):
  - **When a web page is reached** → its own hierarchy: *A specific page* (reveals a URL input) / *The URLs containing a specific fragment* (reveals a fragment input, same treatment as the URL field) / *The entire site* (a `?` help icon whose tooltip reads "Caution: This will target all pages within the project scope.").
  - **When a specific trigger occurs** → on select, a trigger picker appears, populated with the user's triggers (no AI badges).
  - **When a combination of triggers occurs** *(present but inactive — quick builder with its own logic)*.

The AI-vs-non-AI contrast is carried entirely by **which segment a group selects** plus the group's capability chip — not by a separate condition type. The non-AI group is configured exactly like a normal targeting rule.

### Content
A single content selector with helper. No add-content affordance — the single-content restriction is intentional and explained, not an arbitrary cap.

> **No Goal section.** Goals remain a personalization-level setting configured on a separate step. AI Targeting learns on that personalization goal; nothing about the goal is set on this rule.

---

## Product decisions (authoritative)

1. **Distinct rule type.** `type: 'ai-comparison'`, sibling to `targeting` and `experiment`.
2. **Exactly 2 groups.** No add/remove group affordance. The count is fixed by the rule type.
3. **At least one group must include AI Targeting** — i.e. select a segment that contains an AI targeting condition.
4. **Both groups cannot include AI Targeting.** AI segments are disabled in a group's segment picker once the other group already uses one (with an inline explanation).
5. **Non-AI group accepts any standard targeting logic** the current model supports — it is configured exactly like a normal targeting rule.
6. **Neutral group naming.** No control/test semantics in setup. Default labels Group 1 / Group 2 (editable).
7. **Familiar Segment + Trigger definition per group** (radio-based), not a new condition-builder. The "specific visitors" and "combination of triggers" quick-builders are present but inactive in this scope.
8. **Segment and Trigger remain the existing definition model.** AI Targeting is expressed *inside a segment*, not as a separate top-level condition type.
9. **One shared content.** No multi-content exposure.
10. **No rule-level goal.** Goals are configured at the personalization level (separate step); AI Targeting learns on that goal.
11. **Top-to-bottom rule ordering unchanged.**
12. This rule is *often* the first/only active rule in practice — guidance, not a new evaluation model.

---

## Overlap handling (required behavior)

This is core feature behavior, not an implementation detail.

- Evaluate **both groups against the full incoming population.**
- Measure overlap explicitly as a **diagnostic indicator** (how many qualify for both).
- A visitor matching **only one** group → assigned to that group.
- A visitor matching **both** groups → assigned to **exactly one** group via **deterministic randomization** (stable, user-level, hash-based 50/50). The same visitor always lands in the same group.
- **Never count the same visitor in both groups.**
- **Do not** resolve overlap by static priority of one group over the other.
- **Do not** randomize the entire incoming audience up front — random assignment is used *only* to resolve the overlap subset.

### Overlap copy (in product)
- **Short note (always visible):** "Visitors who match both groups are assigned to one group automatically for a clean comparison."
- **Expanded helper:** "If a visitor qualifies for both targeting groups, they are assigned to exactly one group using stable random assignment so they are not counted twice."
- **Diagnostic indicator:** a row such as `Estimated overlap: ~18% of matched visitors → split evenly between groups`. If overlap cannot be estimated, it degrades to `Overlap possible → resolved by stable assignment`.

---

## Validation & guardrails

The Save / Publish action is blocked while any blocking rule fails; the validation banner lists every failing reason.

| Rule | Severity | Message |
| --- | --- | --- |
| Exactly 2 groups exist | structural (enforced by UI; not user-breakable) | — |
| At least one group includes AI Targeting | **blocking** | "One group must use a segment that includes an AI Targeting condition." |
| Not both groups include AI Targeting | **blocking** (also prevented in the picker) | "Only one group can include AI Targeting. Change the segment in one group." |
| Exactly one content selected | structural (single selector, always satisfied) | — |
| Each group has a Segment + Trigger definition | structural (always satisfied — both default to All visitors / web-page) | — |
| Overlap possible/detected | **info** (never blocks) | overlap note + diagnostic shown |

Interaction-level guardrail: in a group's segment picker, segments that contain an AI targeting condition are **disabled** (with an inline note) once the other group already uses an AI segment — so both groups can never include AI.

> Goal validation is intentionally gone — there is no rule-level goal. "Group needs ≥1 condition" is also gone — a group's Segment + Trigger definition always has a value (defaults to *All visitors* / *web page reached*).

---

## Suggested in-product copy

- **Short overlap note:** "Visitors who match both groups are assigned to one group automatically for a clean comparison."
- **Expanded overlap helper:** "If a visitor qualifies for both targeting groups, they are assigned to exactly one group using stable random assignment so they are not counted twice."
- **Content helper:** "Select the content to display to your visitors."
- **Segment-picker AI badge:** an `AI` badge on segments that contain an AI targeting condition.
- **AI chip tooltip:** "This group uses AI Targeting to decide who qualifies."
- **No-AI chip tooltip:** "This group uses standard targeting conditions. That's expected — it's the comparison baseline."
- **AI segment disabled note (other group):** "AI segments are disabled here — the other group already includes AI Targeting."
- **"The entire site" tooltip:** "Caution: This will target all pages within the project scope."

> There is no longer a static intro paragraph above Targeting — it was removed to reduce clutter. The behaviour is conveyed by the structure (two groups, the AI capability chip) and the overlap note.

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

- Both groups keep the **familiar Segment + Trigger definition**, so the rule reads as an evolution of today's setup rather than a new builder. What's new is two groups under one Targeting section and the AI capability chip.
- Two full Segment + Trigger definitions stacked vertically is the main scannability risk. Mitigations: per-group collapse and a one-line group summary in the header.
- AI presence is shown as a neutral capability chip and an `AI` badge in the segment picker — never as a "winner/loser" or validity signal on the other group.
- There is no rule-level goal; goals stay at the personalization level, consistent with every other rule.

---

## Business Impact

- **AI Targeting adoption & retention:** users who can prove lift keep AI on and expand it; this rule is the proof surface.
- **Trust:** "explicit logic" — both definitions and the overlap rule are visible, addressing the #1 reason users distrust AI targeting (opacity).
- **Pillar consolidation:** the AI-vs-manual question is answered inside Personalizations, not by exporting to Web Experiments.

---

## Risks / Open questions

- **Overlap measurement feasibility.** Can overlap be estimated at configure time for the diagnostic, and can deterministic assignment be scoped to the overlap subset only (not the whole audience)? (Engineering — see engineering-brief.md.)
- **Narrow groups → weak signal.** Carry over the Experiment-rule small-audience concern; warn, don't block.
- **AI inside a segment.** AI presence is detected via the selected segment. Confirm "is this segment AI-driven?" is a reliable, queryable property of a segment (needed for the capability chip, the picker badge, and the both-groups guardrail).
- **Queue order.** A broad rule above can capture these visitors first; ordering is unchanged. Decide whether a soft hint is warranted (not built — would clutter the dense panel).
- **Reporting (out of scope here).** Before GA, results must show per-group conversion on the personalization goal and the realized overlap rate. Not built in this prototype.

---

## Acceptance criteria

1. The rule-type selector offers **AI Targeting Comparison** as a third option.
2. Selecting it opens a form with a single **Targeting** block containing exactly **two** groups — no separate top-level Segments/Triggers sections, no add/remove-group control.
3. Each group is defined with the familiar **Segment + Trigger** radio model (All visitors / Specific segment / Specific visitors; web-page / specific trigger / combination), with the web-page hierarchy and inactive quick-builders present.
4. AI Targeting is selected via a **Specific segment** flagged with an `AI` badge; exactly one group can use an AI segment — AI segments are disabled in the other group's picker with an explanation.
5. Save is blocked (with a banner listing reasons) when no group uses an AI segment, or both do.
6. Exactly one content selector exists; there is no way to add a second content; the restriction is explained.
7. There is **no goal selector** on the rule.
8. The overlap note (short sentence) and an expandable helper are visible in the Targeting block, plus a diagnostic overlap indicator.
9. The rule queue renders the rule with the `compare_arrows` icon and a summary built from the two group names and the shared content (no "AI COMPARISON" badge); the AI group's name carries the purple accent; top-to-bottom ordering is preserved.
10. Changing which group uses the AI segment updates both group chips and re-validates.

---

## Prototype scope

The prototype demonstrates, statically:
1. The rule queue with a standard Targeting rule and a configured AI Targeting Comparison rule (showing the summary pattern).
2. Adding a rule → three-card rule-type selector.
3. The AI Targeting Comparison form with the two-group Targeting block, each group using the Segment + Trigger definition.
4. Per-group Segment + Trigger radios (only the selected radio's label is emphasized): All visitors / Specific segment (with a badged segment picker) / Specific visitors (inactive); web-page hierarchy — *A specific page* reveals a URL input, *URLs containing a fragment* reveals a fragment input, *The entire site* shows its caution as a help-icon tooltip — / specific trigger (picker) / combination (inactive). Per-group collapse + summary.
5. The one-group-only AI guardrail (AI segments disabled + inline message in the other group's picker).
6. Single shared content selector ("Select the content to display to your visitors").
7. No goal selector (goal is personalization-level).
8. Overlap note, expandable helper, and a mock diagnostic indicator.
9. Validation banner + Save button gating on the blocking rules.
10. Rule-queue card rendering for the new type: `compare_arrows` icon + "Group 1 vs Group 2 → tested on {Content}" summary, no badge.
11. Layout: fixed 270px sidebar; the main rule list and the configuration panel split the remaining width 50/50 and reflow responsively.

The prototype does NOT implement: real targeting evaluation, real overlap computation, real AI learning, a results dashboard, or backend persistence.

---

## Future production considerations

- Overlap measurement service and the deterministic-assignment contract (engineering-brief.md).
- Results view: per-group conversion on the shared goal + realized overlap rate.
- Whether the diagnostic overlap estimate uses audience-estimation infrastructure already used for targeting size estimates.
- "Promote the winning targeting definition" flow once a comparison concludes (out of scope for v1).
