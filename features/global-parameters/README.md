# Global Parameters

A centralized, reusable layer of configuration values that any Feature Flag's rule or experiment can reference — so the same value doesn't have to be redefined and resynced across multiple flags.

Inspired by Statsig's Parameter Stores, but framed natively for Kameleoon: **flags turn code on/off, experiments compare variations, parameters carry the values**.

---

## Product directions

This feature is being explored in two prototype directions, both inside the **Settings** area (alongside *Approvals settings* and *Holdouts*) in the native Kameleoon shell:

- **Direction 1** *(built)* — a simple shared-value dashboard. Change a value once and every consuming flag follows; the parameter detail shows the **blast radius** (which flags use it).
- **Direction 2** *(built)* — the **parameter-first** variant: a minimal dashboard plus a detail editor whose **source** is either a *Static value* or a *Feature Flag variable* (project- and type-filtered flag→variable mapping).

The `/prototype` folder holds one self-contained static app per direction, with a landing page linking to each. See **Running the prototype** below.

---

## Problem

Today, reusable values (a discount rate, banner text, a numeric threshold, a JSON shape) live *inside* individual Feature Flag variations.

When the same value is needed across web, iOS, and Android — or across several flags — PMs duplicate it manually. Updating that value means hunting it down in every flag and editing each one. Missing one breaks consistency.

There is no:
- single source of truth for shared values,
- visible dependency graph (*who is using this value?*),
- safe way to change a shared value once and have it apply everywhere.

### Today vs. with Global Parameters

| | Today | With Global Parameters |
| --- | --- | --- |
| Define a shared value | Re-typed inside every flag / platform | Defined once, linked everywhere |
| Change it | Hunt through N flags, edit each | One edit, applies to all dependents |
| "Where is this used?" | Manual audit, no real answer | Visible dependency list on the value |
| A/B test it | Developer ships a new flag | Linked to an experiment (no-code, V2) |
| Consistency across web/iOS/Android | Drifts when one is missed | Single source of truth, can't drift |

---

## Why it matters

- **Removes duplication toil.** Define once, reuse anywhere.
- **Removes inconsistency risk.** A shared value can't drift across platforms.
- **Unlocks faster iteration.** Updating copy, thresholds, or promo values stops being a multi-flag, multi-platform chore.
- **Sets up parameter-native experimentation.** A clean parameter layer is the prerequisite for running experiments that don't require a developer to create a new flag.
- **Competitive parity with Statsig** on the *concept*, while differentiating on **traceability** and **integration with Kameleoon's existing mental model** (Feature Flags, Experiments, Mutually Exclusive Groups).

---

## Docs in this folder

- [opportunity-one-pager.md](opportunity-one-pager.md) — **start here for the Opportunity meeting.** Problem, who, solution, why now, differentiation, MVP, metrics — on one screen.
- [analysis.md](analysis.md) — problem synthesis, competitor analysis, mental models, architectural paths, recommendation.
- [spec.md](spec.md) — MVP scope, core concepts, flows, requirements, open questions.
- [ux-reference.md](ux-reference.md) — UX direction, framing, traceability surface, what to keep simple.
- [build-prompt.md](build-prompt.md) — reusable prompt to brief an AI coding agent for the first prototype.
- [engineering-brief.md](engineering-brief.md) — Path 1 vs Path 2 trade-offs, decisions to make, out-of-scope, coarse effort. Pairs with [dev_lead_discussion_notes.md](dev_lead_discussion_notes.md).
- [prototype/](prototype/) — static prototype output (built from `build-prompt.md`).

### Running the prototype

The prototype is organised into one subfolder per direction. Open [prototype/index.html](prototype/index.html) for a landing page that links to each, or open a direction directly. Static files, no build step, mock data only — a reload resets state to seed.

| Folder | Status | What it shows |
| --- | --- | --- |
| [prototype/direction-1/](prototype/direction-1/) | **Built** | Dashboard MVP inside **Settings** (alongside Approvals settings & Holdouts). A table of shared values; change a value once and every consuming flag receives the update. |
| [prototype/direction-2/](prototype/direction-2/) | **Built** | Parameter-first variant in **Settings**. Minimal dashboard (name, project, type, current value, source, updated) + per-row Edit/Delete; the detail editor's **source** is a *Static value* or a *Feature Flag variable* (flag list filtered to the parameter's project, variable list to its type), re-sourceable centrally with no code change. |

Both built directions keep the native Kameleoon shell (dark sidebar, `Features → Flags & Experiments → Settings` tab, secondary nav with Global Parameters alongside Approvals settings & Holdouts). Files per direction: `index.html`, `styles.css`, `app.js`.

**Direction 1 demo path:** open `direction-1/index.html` → click `discount_rate` (value 20, used in 4 flags) → see the **blast radius** ("Changing this value updates 4 flags", listed) → change the value → Save & update flags → the dashboard reflects the new value. The model is deliberately simple here: shared value + affected flags, no override hierarchy.

**Direction 2 demo path:** open `direction-2/index.html` → note the **Source** column → open `hero_bird_img` → switch its **source** between *Static value* and *Feature Flag variable* (flag list filtered to its project, variable list to its type) → **Save** → the dashboard's current value + source update. This is the parameter-first abstraction Direction 1's simple value model grows into.

---

## One-line framing

> **Feature Flags** turn code on/off. **Experiments** compare variations. **Global Parameters** are the reusable values both can read from and that experiments can temporarily take control of.
