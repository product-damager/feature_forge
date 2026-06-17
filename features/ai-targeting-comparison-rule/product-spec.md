# **Feature Spec — AI Targeting Audience test Rule**

## **Overview**

Introduce a new rule type in Personalizations: AI Targeting Audience test rule.

This rule type allows teams to compare AI-driven targeting against non-AI targeting inside a single personalization rule, on the same content, while preserving the existing Personalizations model, including rule queue behavior, personalization-level goals, and standard rule capabilities.

The feature is intended to close the current gap where teams cannot natively tell whether AI Targeting performs better than the targeting they would build by hand. Today they improvise by cloning rules, which double-counts visitors who match both definitions and produces no clean read.

## **Problem**

Today, AI Targeting can be switched on for a personalization rule, but there is no way to prove it targets better than a hand-built definition under equal or similar conditions.

In the current model, users have two imperfect options:

* Duplicate rules — one with AI Targeting, one without — and compare them manually, which either double-counts visitors who qualify for both or skews the exposure to the 1st defined rule and gives no clean, single read.
* Move the use case to Web Experiments or different Personalizations, which also creates exposure and result issues.

As a result, users cannot answer a simple question — "is AI targeting actually better than my manual targeting for this experience?" — without leaving the rule editor or building a flawed comparison.

## **Goal**

Allow users to compare AI and non-AI targeting directly inside Personalizations, holding the content, without changing the current personalization engine behavior outside the scope of the new rule type.

## **Solution**

Add AI Targeting Comparison rule as a new rule type available from the + Add a rule entry point in a Personalization.

An AI Targeting Comparison rule groups exactly two targeting definitions under a single rule. One definition includes AI Targeting and the other does not, both point to the same content, and visitors who qualify for both are assigned to exactly one of them so the comparison stays clean.

## **Capabilities**

An AI Targeting Comparison rule supports:

* Exactly two targeting groups inside one rule.
* Each group defined with the familiar Segment + Trigger model already used by Targeting rules:
  * Segment — All Visitors, Specific segment, or Specific visitors.
  * Trigger — When a web page is reached, When a specific trigger occurs, or When a combination of triggers occurs.
* AI Targeting expressed inside a segment. A group includes AI Targeting when its Specific segment contains an AI targeting condition or there is a condition in the Specific visitors. Exactly one group must include AI Targeting; the other must not.
* AI learning-state visibility. AI segments surface their training state as a read-only badge — Learning, No data, Weak, Moderate, or Good — so the user can see whether the AI group already has reliable data before relying on the comparison. The state comes from AI Predictive targeting; this rule only displays it.
* One shared content for the whole rule, with an exposure percentage.
* Standard rule behaviors already available for Targeting rules in Personalizations:
  * Scheduling
  * Display settings
  * Rollback conditions
  * Status
* Overlap handling — visitors who qualify for both groups are assigned to exactly one group by deterministic per-visitor assignment.

## **Out of Scope**

The following are not changed by this feature:

* Rule queue evaluation and top-to-bottom ordering remain unchanged.
* Existing single-content targeting rules and experiment rules continue to work as they do today.
* Save and launch behavior follows the existing Targeting rules behavior.
* Empty states and edge states follow the existing Targeting rules behavior.

## **Entry Point**

The user clicks + Add a rule from the Targeting rules view inside a Personalization.

Instead of opening a rule configuration form directly, the right panel opens on a rule-type selection step.

## **Rule Type Selection**

The first step of the panel presents the available rule types:

* Targeting rule — serves one content to a defined audience.
* Experiment rule — compares multiple contents under the same targeting.
* AI Targeting Comparison — compares AI targeting against non-AI targeting on the same content.

Selecting a rule type commits the type and opens the corresponding configuration form.

Rule type is not intended to be changed after selection, because changing it would invalidate the structure of the configured rule, especially its two-group targeting structure.

## **UX Flow**

### Step 1 — Pick rule type

When the panel opens, the user sees the rule-type selection step and chooses one of the available rule types.

### Step 2a — Targeting rule / Experiment rule

If the user selects Targeting rule or Experiment rule, the existing configuration flow for that type opens. These flows are unchanged and are out of scope for this feature.

### Step 2b — AI Targeting Comparison rule

If the user selects the AI Targeting Comparison rule, the comparison configuration form opens.

The form contains the following sections, in order:

1. Rule name + status
2. Targeting (Group 1, Group 2, overlap note)
3. Exposure (content selector + exposure)
4. Scheduling
5. Display settings
6. Rollback conditions

## **AI Targeting Comparison Rule Form**

### 1. Rule name + status

The panel starts with the rule name field and the current rule status, following the same structure as other rules in Personalizations.

### 2. Targeting

This section is the main feature-specific part of the form.

It replaces the separate top-level Segments and Triggers blocks with a single Targeting section that contains exactly two group containers.

Each group is a framed container with:

* An editable group name (defaulting to Group 1 / Group 2).
* A capability badge — a purple "AI Targeting" badge when the group's segment includes an AI targeting condition, or a neutral "No AI targeting" chip otherwise. The chip is a statement of fact, not a warning; the non-AI group is the comparison baseline. When the group is the AI group, its AI learning-state badge (Learning / No data / Weak / Moderate / Good) is shown next to it.
* The familiar Segment + Trigger definition, presented as two nested sub-sections inside the group:

Segment

* All Visitors
* Specific segment — opens a segment picker populated with the user's segments. Segments that contain an AI targeting condition show their AI learning-state badge (Learning / No data / Weak / Moderate / Good), so the user can pick an AI segment that already has reliable data. Choosing one makes this the AI group.
* Specific visitors — present as a quick builder.

Trigger

* When a web page is reached — with its own hierarchy: a specific page (URL input), the URLs containing a specific fragment (fragment input), or the entire site (with a caution tooltip).
* When a specific trigger occurs — opens a trigger picker populated with the user's triggers.
* When a combination of triggers occurs — present as a quick builder.

AI guardrail

Exactly one group can include AI Targeting. Once one group uses an AI segment, AI segments are disabled in the other group's segment picker, with an inline explanation. If no group includes AI Targeting, or both do, the rule cannot be saved.

AI learning-state reliability note

When the AI group's segment is still Learning (or has No data / Weak data), the group shows an inline note that its targeting — and therefore the comparison — may not be reliable yet, and becomes more trustworthy as the segment reaches Moderate or Good.

Overlap note

The section includes an overlap explanation: a short always-visible sentence, an expandable helper describing the deterministic assignment, and a diagnostic overlap indicator.

The overlap indicator can also be a discriminating-power signal, not just an FYI. Because overlapping visitors are split evenly between the groups, the difference between the groups is driven by the parts where the two groups' definitions disagree. A high overlap therefore means a small differentiating population and a comparison that may be inconclusive.

### 3. Content

This section combines:

* A single content selector — the one content shown to qualifying visitors in both groups. Only one content can be selected; differences in the comparison come from targeting, not from the experience shown.
* An exposure percentage — what percentage of targeted visitors are eligible to enter the rule, shown as a slider and a numeric input, identical to standard Targeting rules.

### 4. Scheduling

The Scheduling section behaves the same as in existing targeting rules.

### 5. Display settings

The Display settings section behaves the same as in existing targeting rules.

### 6. Rollback conditions

The Rollback conditions section behaves the same as in existing targeting rules.

## **Rule Evaluation Behavior**

An AI Targeting Comparison rule occupies a single slot in the personalization rule evaluation logic. It is evaluated like any other rule in the queue, and top-to-bottom ordering is unchanged.

The engine behavior is as follows:

1. Both targeting groups are evaluated against the full incoming population.
2. If the visitor matches neither group, the rule does not apply and the visitor continues to the next rule in the personalization evaluation.
3. If the visitor matches exactly one group, the visitor is assigned to that group.
4. If the visitor matches both groups, the visitor is assigned to exactly one group using deterministic, stable per-visitor assignment (a hash-based 50/50 split). The same visitor always lands in the same group. The visitor is never counted in both groups, overlap is not resolved by static priority of one group over the other, and only the overlapping subset is randomized — the rest of the audience is assigned by targeting alone.
5. The exposure percentage is then applied to determine whether an eligible visitor enters the rule. A visitor that matches but falls outside the exposure percentage continues to the next rule, identical to the existing personalization model.

Overlap is measured explicitly as a diagnostic indicator so the user can see how many visitors qualify for both groups.

## **Rule cards display**

The card display continues to support targeting rules, experiment rules, and the new AI Targeting Comparison rules.

### Standard targeting and experiment rules

These rules keep their current renderers and behavior.

### AI Targeting Comparison rule

AI Targeting Comparison rules use a dedicated renderer in the card. The card shows a distinct comparison icon and a summary built from the two group names and the shared content, for example: "Group 1 vs Group 2 → tested on Content 1". The group whose segment is an AI segment has its name rendered in the accent color so the AI side is identifiable at a glance; there is no separate badge. If the rule is incomplete, the summary is replaced by a short "Incomplete" message naming the first blocking reason. The renderer keeps the same overall queue structure and engine behavior as standard rules.

## **Data Model Impact**

The feature introduces a new rule type and a new schema for two-group comparison rules.

At a conceptual level, the new rule type requires:

* Rule type identification
* Two targeting groups, each holding a Segment + Trigger conditions
* An indicator of what conditions belong to the AI group (derived from the selected segment)
* One shared content and an exposure percentage
* The same common rule fields already used by targeting rules (scheduling, display, rollback, status)

## **Business Impact**

This feature is expected to create value in several areas:

* AI Targeting adoption and retention — users who can prove the lift keep AI Targeting on and expand it. This premise is industry-validated: every major platform pairs AI with a control or holdback precisely because demonstrable lift sustains adoption.
* Trust — both targeting definitions and the overlap-handling rule are visible and explicit, a contrast to competitors whose AI targeting is delivered as comparatively black-box audiences (e.g. AB Tasty EmotionsAI, Optimizely AI-surfaced audiences).
* Pillar consolidation — the AI-vs-manual targeting question is answered inside Personalizations, without exporting it to Web Experiments.
* Differentiated primitive (not parity). Optimizely, VWO and Adobe Target validate AI by comparing personalization, or a model's experience selection, against a control or holdback — none compare an AI targeting definition against a manual one on the same content, with overlap deterministically resolved so visitors are not double-counted. Adobe Target's Auto-Target is the nearest analog, but it compares model-driven experience selection to a control, not two targeting definitions on a fixed experience. Kameleoon's queue-native rule model expresses this as a single rule, which activity/campaign-mode tools cannot do cleanly.

## **Acceptance Criteria**

1. Clicking + Add a rule in a Personalization opens the right panel on a rule-type selection step.
2. The selection step presents AI Targeting Comparison as an available rule type alongside Targeting rule and Experiment rule.
3. Selecting AI Targeting Comparison opens an adaptive form with a single Targeting section containing exactly two groups — no separate top-level Segments and Triggers blocks, and no add/remove-group control.
4. Each group is configured with the familiar Segment + Trigger definition, including the web-page hierarchy and the segment/trigger pickers.
5. AI Targeting is selected via a Specific segment flagged with an AI learning-state badge; exactly one group can include AI Targeting, and AI segments are disabled in the other group's picker.
6. The rule cannot be saved when no group includes AI Targeting or when both groups do, and the blocking reason is shown.
7. The Content section contains exactly one content selector and an exposure percentage control; there is no way to add a second content.
8. The overlap behavior is explained in the Targeting section (short note, expandable helper, and a diagnostic indicator), and overlapping visitors are assigned to exactly one group by deterministic per-visitor assignment.
9. AI Targeting Comparison rules are distinguishable in the card display, with a summary built from the group names and the shared content.
10. Rule evaluation is performed correctly, top-to-bottom ordering is preserved, and no visitor is counted in both groups.
11. Visitor data is attributed correctly to the rule and to the assigned group, with results presented on the Results page (out of scope for this spec).
