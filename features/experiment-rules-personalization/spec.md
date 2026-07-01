# Feature Spec — Experiment Rule for Personalizations

## Problem

Personalization rules are limited to one content per rule. Teams that want to compare multiple personalized contents under the same targeting and goals have no native option in the Personalizations pillar — they must either duplicate rules (manually splitting traffic with exposure %, which gives no learning loop) or move to Web Experiments (which lose the personalization rule queue and goal model).

---

## Insight

The personalization model is built around **deployment** (who sees what), not **learning** (which content wins). But the underlying primitives — rule queue, segment targeting, exposure logic, goals at personalization level — are exactly what a multi-content learning rule needs. The missing piece is a **rule type** that supports multiple contents and allocation logic, while inheriting everything else from the personalization.

Feature Experimentation already solved the rule-type abstraction in the Rollout Planner ([reference](https://help.kameleoon.com/experimentation/feature-experimentation/using-the-rollout-planner/add-a-new-rollout-rule)). Personalizations should adopt the same right-panel pattern.

---

## Solution

Introduce a new rule type in Personalizations: **Experiment rule**.

### Capabilities

- Multiple contents inside a single rule.
- Allocation type:
  - **Manual allocation** — fixed percentages per content (must sum to 100%).
  - **Multi-armed bandit** — algorithm reallocates traffic toward best-performing content based on the inherited primary goal.
  - **Contextual bandit** — same as MAB plus context attributes (segments, traits) used by the model.
- All standard rule features preserved: targeting, exposure %, schedule, status.

### What changes in the product

- `Add a rule` opens the right panel on a **rule-type selection step**, not directly on a configuration form.
- A new rule renderer in the rule queue: experiment rules show a content stack with allocation strip and an `EXPERIMENT` tag.
- A new schema for multi-content rules.

### What does NOT change

- Personalization goals stay at the personalization level.
- Rule queue semantics are preserved.
- Existing single-content rules continue to work without migration.

---

## UX Flow

### Entry point

User clicks **+ Add a rule** in a Personalization.

### Step 1 — Pick rule type (right panel)

Right panel shows two cards:
- **Targeting rule** — current single-content rule.
- **Experiment rule** — new multi-content rule with allocation logic.

Clicking a card commits the rule type and opens the matching configuration form. The rule type is not changed afterwards (changing it would invalidate the content list and allocation).

### Step 2a — Targeting rule (unchanged)

Existing form. Out of scope for this feature.

### Step 2b — Experiment rule

Form sections, top to bottom:

1. **Rule name + status**
2. **Inherited goals** — read-only context block:
   - Lists primary goal + secondary goals.
   - Caption: *Configured at the personalization level.*
   - Right-aligned link: *Edit goals →* (opens the personalization-level goals tab).
3. **Targeting & exposure** — same as existing rules. Exposure % defines who is eligible for the rule.
4. **Allocation type** — segmented control:
   - Manual allocation
   - Multi-armed bandit
   - Contextual bandit
5. **Contents** — list editor:
   - Each row: content name, content type icon, allocation field (manual mode only), edit/remove actions, drag handle.
   - `+ Add content` button.
   - Manual mode shows total allocation indicator (must equal 100%).
6. **Allocation-specific fields:**
   - **Manual:** percentage inputs per content; balance bar; auto-distribute action.
   - **Multi-armed bandit:** primary goal (one of the inherited goals, defaulted to personalization primary), exploration setting (Conservative / Balanced / Aggressive), warm-up traffic %, banner: *"Allocations are managed automatically. Manual percentages are disabled."*
   - **Contextual bandit:** all MAB fields + context attributes picker (multi-select from available visitor attributes).

### Rule queue rendering

- Standard rule: existing card layout.
- Experiment rule: card with `EXPERIMENT` tag, content count badge, allocation strip showing per-content split (or "Auto" for bandit modes), and stacked content rows.

---

## Product decisions

### 1. Rule queue behavior of an Experiment rule
The experiment rule occupies **one slot** in the personalization rule queue. Its targeting and exposure are evaluated like any other rule. Visitors who pass targeting AND fall within the exposure % are then bucketed deterministically across the rule's contents according to the allocation type. The bucketing is internal to the rule.

### 2. Targeted-but-not-exposed visitors
Consistent with the existing personalization model: visitors who match targeting but fall outside the exposure % **continue to the next rule**. This applies to experiment rules identically — the rule does not "absorb" non-exposed traffic. This must be visible in the prototype rule queue text.

### 3. Inherited goals — UI treatment
- Goals are rendered as a **read-only context block** at the top of the rule form.
- Each goal is shown as a chip with name and type (primary / secondary).
- A right-aligned `Edit goals →` link routes to the personalization-level goals tab.
- The block has a subtle background to signal "context, not configuration".
- The bandit modes reference the primary goal explicitly: *"Optimizing for: Add to cart (primary goal)"*.

### 4. Allocation-mode fields

| Field | Manual | Multi-armed bandit | Contextual bandit |
| --- | --- | --- | --- |
| Per-content % editable | ✅ | ❌ (read-only, "Auto") | ❌ (read-only, "Auto") |
| Total allocation indicator | ✅ (must = 100%) | ❌ | ❌ |
| Optimization goal selector | ❌ | ✅ (default: primary) | ✅ (default: primary) |
| Exploration setting | ❌ | ✅ | ✅ |
| Warm-up traffic % | ❌ | ✅ | ✅ |
| Context attributes picker | ❌ | ❌ | ✅ |

### 5. Visual distinction in the rule queue
- `EXPERIMENT` tag (purple, matches the Kameleoon experimentation accent).
- Allocation strip (segmented bar) showing per-content distribution; for bandit modes the strip is animated subtly and labelled "Auto".
- Content count badge: e.g. `3 contents`.
- Distinct icon: `science` (Material Icons) instead of `person` / `location_on`.

---

## UX Implications

- Rule creation now has a type-selection step. Acceptable cost — Rollout Planner already establishes this pattern.
- The right-panel form is taller for experiment rules. Use sticky section headers if vertical scroll becomes heavy.
- Inherited goals must never appear editable; treating them as input fields would break the personalization mental model.

---

## Business Impact

- **Adoption depth:** Customers can run learning loops without leaving Personalizations.
- **Pillar consolidation:** Reduces the awkward "do I run this as personalization or experiment" question for the multi-content + targeted case.
- **Bandit upsell:** Brings bandit value into the personalization buying motion, where it's more directly tied to revenue narratives (recommendations, promo logic).
- **Competitive parity / advantage:** Adobe Target and Dynamic Yield ship this; Optimizely and VWO do not. We can ship a cleaner, queue-native version.

---

## Risks / Open Questions

- **Bandit + small audiences.** Personalization rules are often segment-narrow. The bandit may not get enough signal. Mitigation: warm-up % and a "audience too small" warning when targeting estimates fall below a threshold.
- **Goal mismatch.** Personalization-level goals may not be the best metric for the bandit (e.g. session-level goals vs short-loop signals). Open question: do we allow the bandit to select from inherited secondary goals, or always pin to primary?
- **Content type heterogeneity.** Visual editor content vs custom code vs widget content — can they coexist as arms in one rule? Recommend yes, since the personalization model already mixes them; flag for engineering validation.
- **Reporting.** Out of scope for prototype, but must be addressed before GA — at minimum, per-content conversion and traffic share on the inherited primary goal.
- **Migration.** No migration needed since all existing rules become "Targeted delivery" implicitly.

---

## Acceptance Criteria

1. Clicking "+ Add a rule" in a Personalization opens the right panel on a rule-type selection step with two options.
2. Selecting **Experiment rule** opens an adaptive form distinct from the standard rule form.
3. The form supports adding/removing/reordering at least 2 contents.
4. The allocation-type segmented control switches between Manual, Multi-armed bandit, and Contextual bandit, and the form below adapts per the table above.
5. In Manual mode, percentages must sum to 100% — there is a visible total indicator and an "Auto-distribute" action.
6. Inherited goals are visible at the top of the form, read-only, with an "Edit goals" link that does not allow editing inside the rule.
7. The rule queue renders experiment rules with an `EXPERIMENT` tag, content count, and allocation strip.
8. Switching between Live and Draft inside the personalization preserves rule-type-specific configuration.
9. The "Targeted but not exposed → continue" behaviour is documented in the rule card detail line.

---

## Prototype Scope

The prototype must demonstrate, statically:

1. The Personalizations rule queue with at least one standard rule and one experiment rule already configured.
2. Adding a new rule → rule-type selector in the right panel.
3. Switching from standard form to experiment-rule form by selecting the rule type.
4. Multi-content list editing (add, remove, rename, reorder is optional).
5. Allocation-type segmented control switching between Manual / Multi-armed / Contextual.
6. Manual percentage editing with total indicator + auto-distribute.
7. Bandit-mode UI showing optimization goal, exploration setting, warm-up %, and (for contextual) context attributes picker.
8. Inherited goals shown as a read-only context block with an "Edit goals →" link.
9. Visual distinction of the experiment rule in the rule queue (tag, content count, allocation strip).

The prototype does NOT implement:
- Real bandit logic.
- Real backend persistence.
- Per-content reporting.
- Real targeting evaluation.

---

## Future Production Considerations

- SDK payload format (multi-content rule) — covered in `engineering-brief.md`.
- Reuse vs fork of bandit service (currently in Web Experiments).
- Reporting story per content arm.
- "Promote winner" flow when a bandit converges (out of scope for v1).