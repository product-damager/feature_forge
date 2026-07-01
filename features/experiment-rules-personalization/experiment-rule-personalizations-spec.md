# Feature Spec — Experiment Rule for Personalizations

## Overview

Introduce a new rule type in Personalizations: **Experiment rule**.

This rule type allows teams to compare multiple contents inside a single personalization rule while preserving the existing Personalizations model, including rule queue behavior, personalization-level goals, and standard rule capabilities.

The feature is intended to close the current gap where teams must either duplicate targeting rules manually to compare content variants or move to Web Experiments and lose the Personalizations rule queue and goal model.

## Problem

Today, personalization rules support only one content per rule. This creates a product gap for teams that want to compare several personalized contents under the same targeting, exposure, and goals.

In the current model, users have two imperfect options:

- Duplicate several rules and manually split traffic with exposure percentages, which does not create a meaningful learning loop.
- Move the use case to Web Experiments, which supports comparison logic but does not preserve the Personalizations rule queue or goal structure.

As a result, users must choose between keeping the right targeting model and getting the right experimentation model.

## Goal

Allow users to run multi-content comparisons directly inside Personalizations without changing the current personalization engine behavior outside the scope of the new rule type.

## Solution

Add **Experiment rule** as a new rule type available from the `+ Add a rule` entry point in a Personalization.

An experiment rule allows multiple contents to be grouped under a single rule and distributed according to a selected allocation method.

## Capabilities

An experiment rule supports:

- Multiple contents inside one rule.
- Multiple allocation methods:
  - **Manual allocation** — fixed percentages per content.
  - **Multi-armed bandit** — traffic is automatically reallocated toward the best-performing content based on the inherited primary goal.
  - **Contextual bandit** — same principle as multi-armed bandit, with additional context attributes such as segments or traits used by the model.
- Standard rule features already available in Personalizations:
  - Segments
  - Exposure percentage
  - Triggers
  - Scheduling
  - Display settings
  - Rollback conditions
  - Status

## Out of Scope

The following are not changed by this feature:

- Personalization goals remain defined at the personalization level.
- Rule queue semantics remain unchanged.
- Existing single-content targeting rules continue to work as they do today.
- Save and publish behavior follows the existing Targeting rules behavior.
- Empty states and edge states follow the existing Targeting rules behavior.
- Validation limits beyond the current discussed scope are not introduced as part of this specification.

## Entry Point

The user clicks **+ Add a rule** from the Targeting rules view inside a Personalization.

Instead of opening a rule configuration form directly, the right panel opens on a rule-type selection step.

## Rule Type Selection

The first step of the panel presents two rule types:

- **Targeting rule** — serves one content to a defined audience.
- **Experiment rule** — compares multiple contents under the same targeting.

Selecting a rule type commits the type and opens the corresponding configuration form.

Rule type is not intended to be changed after selection, because changing it would invalidate the structure of the configured rule, especially its content list and allocation logic.

## UX Flow

### Step 1 — Pick rule type

When the panel opens, the user sees the rule-type selection step.

The user chooses one of the two available rule types.

### Step 2a — Targeting rule

If the user selects **Targeting rule**, the existing targeting-rule configuration flow opens.

This flow is unchanged and is out of scope for this feature.

### Step 2b — Experiment rule

If the user selects **Experiment rule**, the experiment-rule configuration form opens.

The form contains the following sections, in order:

1. **Rule name + status**
2. **Segments**
3. **Exposure & Allocation type**
4. **Triggers**
5. **Scheduling**
6. **Display settings**
7. **Rollback conditions**

## Experiment Rule Form

### 1. Rule name + status

The panel starts with the rule name field and the current rule status, following the same structure as other rules in Personalizations.

### 2. Segments

The Segments section behaves the same as in existing targeting rules.

It defines which visitors are eligible for this rule.

### 3. Exposure & Allocation type

This section is the main feature-specific part of the form.

It combines:

- **Exposure percentage**, which defines what percentage of targeted visitors are eligible to enter the rule.
- **Allocation method**, which defines how exposed visitors are distributed across the contents contained in the experiment rule.

The allocation method can be one of the following:

- **Manual allocation**
- **Multi-armed bandit**
- **Contextual bandit**

### Contents list editor

Below the allocation selector, the form shows a contents list editor.

Each row in the list represents one content included in the experiment rule.

Each row contains:

- Content name
- Content type icon
- Allocation field when manual allocation is selected
- Edit action
- Remove action
- Drag handle

The list also includes a **+ Add content** action.

### Manual allocation mode

When **Manual allocation** is selected:

- Each content row shows an editable percentage field.
- A visible total allocation indicator is shown.
- An **Auto-distribute** action is available.
- The user can manually define how exposed visitors are split across the listed contents.

### Multi-armed bandit mode

When **Multi-armed bandit** is selected:

- Traffic is automatically allocated across contents.
- The optimization logic uses the inherited primary goal from the personalization.
- Manual percentage allocation is not available.
- The form displays allocation-specific settings:
  - Primary goal, defaulted from the personalization primary goal
  - Exploration setting: **Conservative**, **Balanced**, or **Aggressive**
  - Warm-up traffic percentage
- The UI includes helper messaging explaining that allocations are managed automatically.

### Contextual bandit mode

When **Contextual bandit** is selected:

- Traffic is automatically allocated across contents.
- The optimization logic uses the inherited primary goal from the personalization.
- Context attributes such as segments or traits are used by the model.
- Manual percentage allocation is not available.
- The form includes the same allocation-specific settings as Multi-armed bandit.

### 4. Triggers

The Triggers section behaves the same as in existing targeting rules.

### 5. Scheduling

The Scheduling section behaves the same as in existing targeting rules.

### 6. Display settings

The Display settings section behaves the same as in existing targeting rules.

### 7. Rollback conditions

The Rollback conditions section behaves the same as in existing targeting rules.

## Rule Queue Behavior

An experiment rule occupies a single slot in the personalization rule queue.

It is evaluated like any other rule in the queue.

The engine behavior is as follows:

1. The visitor is evaluated against the rule targeting.
2. If the visitor matches the targeting, the exposure percentage is evaluated.
3. If the visitor is within the exposure percentage, the visitor is distributed across the rule contents according to the selected allocation method.
4. If the visitor matches the targeting but falls outside the exposure percentage, the visitor continues to the next rule in the personalization queue.

This behavior is identical to the existing personalization model and preserves queue semantics.

## Rule Queue Rendering

The queue continues to support both existing targeting rules and the new experiment rules.

### Standard targeting rule

Standard targeting rules keep the current renderer and behavior.

### Experiment rule

Experiment rules use a dedicated renderer in the queue.

This renderer should visually distinguish the rule as an experiment-oriented rule while keeping the same overall queue structure and engine behavior as standard rules.

The experiment rule renderer includes:

- An `EXPERIMENT` tag
- A content count
- An allocation summary strip
- A rule summary based on the same queue semantics as existing targeting rules

## Data Model Impact

The feature introduces a new schema for multi-content rules.

At a conceptual level, the new rule type requires:

- Rule type identification
- A list of contents associated with the rule
- Allocation type
- Allocation-related settings depending on the chosen mode
- The same common rule fields already used by targeting rules

Existing targeting-rule schemas remain unchanged.

## Product Decisions

### Personalization goals

Goals remain defined at the personalization level.

Experiment rules inherit and use the existing goal model rather than introducing rule-level goals.

### Rule queue semantics

Experiment rules do not introduce a new queue model.

They are evaluated within the same rule queue as targeting rules.

### Existing rules

Existing single-content targeting rules continue to function without migration.

No migration is required for the first version of this feature.

## Business Impact

This feature is expected to create value in several areas:

- **Adoption depth** — users can run learning loops directly inside Personalizations.
- **Pillar consolidation** — users no longer need to choose between Personalizations and Web Experiments for the specific case of targeted multi-content comparison.
- **Bandit upsell** — bandit capabilities become available in a use case that is closer to revenue-driving personalization scenarios.
- **Competitive parity or advantage** — the product closes a gap with competitors that already support comparable personalization experimentation patterns.

## Acceptance Criteria

1. Clicking `+ Add a rule` in a Personalization opens the right panel on a rule-type selection step.
2. The selection step presents two options: **Targeting rule** and **Experiment rule**.
3. Selecting **Experiment rule** opens an adaptive form distinct from the standard targeting-rule form.
4. The experiment-rule form supports adding and removing multiple contents.
5. The allocation method control supports switching between **Manual allocation**, **Multi-armed bandit**, and **Contextual bandit**.
6. In Manual allocation mode, the form shows editable percentage inputs, a visible total indicator, and an **Auto-distribute** action.
7. In automated allocation modes, the form disables manual percentage editing and displays allocation-specific settings.
8. Experiment rules occupy one slot in the rule queue and preserve existing queue evaluation behavior.
9. Targeted visitors who fall outside the exposure percentage continue to the next rule in the queue.
10. The rule queue renders experiment rules with experiment-specific visual treatment while preserving the existing rule queue model.
