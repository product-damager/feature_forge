# Global Parameters — UX Reference

This document describes the intended UX direction for the first prototype. It is opinionated and meant to constrain the prototype, not to spec a final design.

> **Reconciliation with what was built (read first).** The delivered prototypes implement a simpler slice of the UX below, all **inside Settings** (alongside *Approvals settings* and *Holdouts*) in the native Kameleoon shell, organised as one subfolder per direction:
> - **Direction 1 (built)** — a shared-value dashboard. The "Where is this used?" idea ships as a **blast-radius** view (the flags that consume a value); editing the value propagates to them. No override-hierarchy / effective-value / experiment-attribution UI.
> - **Direction 2 (built)** — parameter-first: a minimal dashboard (name, project, type, current value, source, updated) + a detail editor with a **Static value / Feature Flag variable** source selector (project- and type-filtered flag→variable mapping). The full grouped dependency list was intentionally trimmed for minimalism.
>
> The override hierarchy (default → flag → experiment), the full "Where is this used?" grouped list, and experiment-attribution copy below remain the **broader vision** the prototypes lead toward, not what they fully implement today. Treat this note (and [spec.md](spec.md)'s Prototype-scope section) as authoritative for current behaviour.

---

## Product framing on screen

Two ideas must come through in copy and structure, even before any pixels:

1. **Parameters carry values; flags use them.** Everywhere a parameter is shown, its relationship to its consumers should be visible — never hidden behind a separate "advanced" tab. (Direction 1 shows the consuming flags as a blast radius; Direction 2 shows the value's source.)
2. **Decoupled from code.** A parameter's value can be a static literal or sourced from a Feature Flag variable (Direction 2), and re-sourced centrally without a code change. *(The fuller `default → flag → experiment` override hierarchy is the Path 2 direction — not shown in the current build.)*

Avoid the Statsig framing of "parameters live in stores that live next to dynamic configs that live next to gates." Parameters are simply **a workspace-level layer of named, typed values** that other Kameleoon entities can read.

---

## Where this lives in the product

For the current prototypes, **Directions 1 and 2 (Settings-side)** both place Global Parameters inside **Settings**, alongside **Approvals settings** and **Holdouts** — the management surface where PMs define and inspect parameters.

Conceptually, Global Parameters are a workspace-level layer of named, typed values, expressed through the Settings surface rather than a brand-new top-level nav item.

---

## Demo narrative (how a reviewer moves through it)

Two built directions, each with its own short walkthrough.

**Direction 1 — shared-value dashboard**
1. Open the dashboard — keys, types, current values, the consuming-flag count, updated.
2. Click `discount_rate` — see its value and the flags that consume it (the **blast radius**).
3. Edit the value → **Save & update flags** → the dashboard reflects it; a toast states how many flags now receive it.

**Direction 2 — parameter-first**
1. Open the minimal dashboard (name · project · type · current value · source · updated); hover a row for **Edit / Delete**.
2. Open a parameter (e.g. `hero_bird_img`) — its **source** is a *Feature Flag variable*, mapped to a variable on a flag in its project.
3. Switch the source between *Static value* and *Feature Flag variable*; for the flag source the flag list is project-filtered and the variable list type-filtered. Save → the dashboard's value + source update.

---

## Two core views

### A. Dashboard — *Global Parameters*

A dense, scannable table. Kameleoon-native, panel-based, no marketing-style hero. Columns differ slightly by direction:

- **Direction 1:** Key · Type · Current value · Used in (consuming flags) · Updated.
- **Direction 2:** Name · Project · Type · Current value · **Source** (Static / Feature Flag variable) · Updated, with per-row hover **Edit / Delete**.

Above the table: search and a **+ New parameter** primary action (a stub in the prototype). Keys are lowercase, dot-namespaced where a surface is implied (`homepage.hero_text`, `checkout.threshold`) and flat where global (`discount_rate`).

**Example rows** (Direction 2 density + naming):

| Name | Project | Type | Current value | Source |
| --- | --- | --- | --- | --- |
| `hero_bird_img` | Birdwatching | string | `/img/crow.png` | Feature Flag variable (`homepage_hero · crow_image`) |
| `hero_text` | Birdwatching | string | `"Your online guide…"` | Static |
| `promo.discount_rate` | Marketing | number | `20` | Feature Flag variable (`promo_campaign · rate`) |
| `checkout.threshold` | Marketing | number | `50` | Static |

### B. Detail — *Parameter detail page*

**Direction 1 — value + impact:**
- Key, type, description; a type-aware **value editor** (text / number / toggle / JSON with valid-invalid checking — *not* schema-aware; schema validation stays out of scope).
- A **blast radius** panel listing the consuming flags, framed as *"changing this value updates N flags."*
- Save updates the value and reports the affected-flag count.

**Direction 2 — parameter-first source editor:**
- Key, project, type, description.
- A **source-type** selector: *Static value* (type-aware input) or *Feature Flag variable* — a flag dropdown filtered to the parameter's **project**, then a variable dropdown filtered to its **type**. The parameter resolves to the chosen variable's value, with a live effective-value preview.
- Save reflects the new value + source on the dashboard.

> **Future (Path 2), not built:** a "current effective value" panel with the override hierarchy (default → flag → experiment), an experiment-attribution note (*"currently controlled by Experiment X"*), and a full grouped "Where is this used?" list with active-override badges. Earlier drafts of this doc specced these as the detail view; they are the direction, not the current build.

---

## States & edge cases (these matter in a live demo)

The prototype should show, or at least gracefully handle, the states that tend to surface during a stakeholder walkthrough:

*Built today:*
- **Empty / unused** — a parameter with no consuming flags (Direction 1 shows "Not used"; the used-in count is `0`).
- **Invalid value** — invalid JSON, or an empty/non-numeric number, shows an inline hint and disables save.
- **Type-constrained source (Direction 2)** — the flag-variable picker only offers variables of the parameter's type; a flag with no matching-type variable shows a clear "no matching variable" state and disables save.

*Future (Path 2), not built — degraded references shown as muted rows with a warning chip rather than errors:*
- Parameter whose **controlling experiment has ended** → source falls back to its default, with a "last controlled by … (ended)" note.
- Parameter **referencing a flag/variable that was archived or removed** → the row is greyed with an "archived" tag, not silently dropped (traceability must survive archival).

---

## Responsive behavior

The prototype is **desktop-only by design** — Kameleoon's dashboard is a dense, editor-centric desktop tool, and the demo is run on a laptop/projector. State this explicitly so reviewers don't assume a mobile layout is missing. No responsive breakpoints below typical laptop widths are required; tables may scroll horizontally rather than reflow.

---

## What the UI should emphasize

- **Blast radius / traceability first.** From a parameter, the flags that consume it are the loudest secondary information — the change-impact is the differentiator (Direction 1 shows the full consuming-flag list).
- **Current value is always visible.** The user should never wonder "what does this return right now?" In Direction 2 the value's **source** (Static / Feature Flag variable) sits alongside it.
- **No-code remap.** Direction 2 makes it obvious a value can be re-sourced (static ↔ flag variable) without a code change.
- **One-click navigation** between a parameter and its consumers.
- *Future (Path 2):* the override hierarchy stated in words (default → flag → experiment) on the detail page.

---

## What the UI should keep simple (MVP)

- No grouping into Stores. Flat list.
- No governance, approvals, or permission UI.
- No audit log surface (just an "Updated" timestamp).
- No SDK/integration tab. Save that for the real engineering brief.
- No reporting / analytics view on the parameter (analytics live on the experiment that controls it — which is correct).
- No bulk operations. One parameter at a time.
- No "Layer" UI. If exclusivity needs a story, point to **Mutually Exclusive Groups**.

---

## Style and density notes

- Match the existing Kameleoon UI: panel-based, dense tables, monospace for keys, small typography for metadata, no hero illustrations.
- Type chips and override-source chips use the same shape vocabulary as elsewhere in the app — don't invent a new chip family for this feature.
- No animation beyond standard hover/focus and small, subtle hints (e.g. revealing the per-row Edit/Delete actions on hover).

---

## Where dependency traceability appears (summary)

| Surface | What it shows |
| --- | --- |
| Dashboard → Used-in / Source column | Direction 1: consuming-flag count · Direction 2: the value's source (Static / Feature Flag variable) |
| Parameter detail — Direction 1 | **Blast radius**: the flags that consume the value |
| Parameter detail — Direction 2 | The value's source and resolved value |
| *Future (Path 2), not built* | Full grouped "Where is this used?" with active-override badges; a linked-variable chip in the flag editor; an experiment-control attribution note |

The pattern: today the dependency is shown from the parameter looking outward (Direction 1's blast radius; Direction 2's source). Showing it from the flag looking inward — a "Link to Global Parameter" in the flag editor — is a possible future addition.
