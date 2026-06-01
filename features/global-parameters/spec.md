# Global Parameters — Spec

> This spec covers both the **product requirement** and the **prototype**. Where they differ, the prototype scope below and the per-flow "Prototype behavior" notes are authoritative for what the demo will concretely contain.

## Prototype scope (read this first)

The prototype is a static, mock-data demo, organised into **one subfolder per direction** under `prototype/`. All directions live inside the **Settings** area of the native Kameleoon shell, as a Global Parameters surface alongside **Approvals settings** and **Holdouts** (reached via *Features → Flags & Experiments → Settings*). Each direction is a self-contained `index.html` + `styles.css` + `app.js`; nothing persists — reloading resets to seed data; no SDK, no backend.

1. **Direction 1 (`direction-1/`) — built.** A deliberately simple Settings dashboard: a table of shared values (key, type, current value, used-in flags, updated). Opening a value shows its **blast radius** — the flags that consume it — and a type-aware editor; editing the value propagates it to all consuming flags. No override hierarchy, no effective-value resolution, no experiment control: just *"change a shared value once, every consuming flag follows."*
2. **Direction 2 (`direction-2/`) — built.** The **parameter-first** variant in the same Settings location. A minimal dashboard (name, project, type, current value, source, updated) with per-row hover Edit/Delete. The richer setup is in the detail page: a **source-type** selector — *Static value* or *Feature Flag variable*. For a flag-variable source you pick a flag in the parameter's **project**, then a variable of the **same type** as the parameter; the parameter resolves to that variable's value. This is the "decoupled from code, remap the source centrally" idea made concrete.

The rest of this spec now leads with the **implemented model** (Core concepts, flows, requirements reflect what the prototypes actually do). The richer override/experiment model that earlier drafts treated as core has moved to a clearly-labelled **Future direction (Path 2)** section — it is the north star the current build leads toward, not part of it.

---

## Problem

Reusable configuration values are trapped inside individual Feature Flag variations. There is no centralized definition, no traceability of where a value is used, and no safe way to update a shared value once and have it propagate. PMs end up duplicating values across flags and platforms, with high inconsistency risk.

---

## Users

- **Product Managers** — own the meaning of shared values (promo rates, thresholds, copy). Need a safe, traceable way to update them without engineering for each change.
- **Developers** — implement the consumer code once and want it to keep working as PMs change the underlying source.
- **QA / release managers** — need to see what is currently overriding a value before approving a change.

---

## User goals

- Define a reusable value once and reference it from many flags / rules / experiments.
- See, for any given value, exactly which flags / experiments / rules consume it today.
- Update a shared value safely with explicit awareness of the surfaces it affects.
- Run an experiment on a value without re-typing it inside a new flag's variables.

---

## Core concepts

> These describe the model **as implemented in the prototypes**. The override-hierarchy / experiment model that earlier drafts treated as core is captured under *Future direction (Path 2)* below — it is not part of the current build.

### Global Parameter
A named, typed, reusable value.

- **Key** — workspace-scoped identifier (e.g. `discount_rate`, `homepage.hero_text`, `hero_bird_img`).
- **Type** — `string` | `number` | `boolean` | `json`.
- **Value** — the value the parameter currently carries (shown as "current value" on the dashboard).
- **Project** *(Direction 2)* — the project a parameter belongs to; scopes which flags it can read a value from.
- **Description** — short explanation for PMs.
- **Consumers** — the flags that use the parameter. Changing the value propagates to all of them.

### Source — where the value comes from *(Direction 2)*
A parameter's value is supplied by one **source**:
- **Static value** — a literal typed on the parameter itself.
- **Feature Flag variable** — a reference to a variable on a flag in the **same project**, constrained to the **same type** as the parameter; the parameter resolves to that variable's value. Switching the source ("remap") is a no-code action — consuming code keeps reading the same key.

**Direction 1** is simpler still: a parameter is just a value plus the flags that consume it, with no source abstraction.

### Blast radius (traceability)
For any parameter, the flags that consume it are shown so a change's impact is explicit — *"changing this value updates N flags."* This is the implemented, minimal form of "Where is this used?".

---

## Future direction (Path 2) — not in the current build

Captured so the simpler implemented model isn't mistaken for the ceiling. **None of this is built yet:**

- **Override hierarchy** — `default value → flag override → experiment override`, surfaced as a "current effective value" plus an override source on the detail page.
- **Experiment control** — an experiment temporarily takes control of a parameter; assigned users receive their variation's value *through* the experiment, with attribution tracked there. Exclusivity between experiments on the same parameter reuses Kameleoon's existing **Mutually Exclusive Groups**, not a new "Layer" concept (see [layers_and_referencing_explained.md](layers_and_referencing_explained.md)).
- **`getGlobalParameter` SDK path** — a first-class parameter-resolution path independent of flags (see [engineering-brief.md](engineering-brief.md) and [analysis.md](analysis.md) §6).

---

## Primary flows

### F1 — Create a parameter
1. User opens **Settings → Global Parameters** and clicks **+ New parameter**.
2. Fills key, type, value (or source), optional description / project.
3. Saves → the parameter appears in the dashboard.

*Prototype behavior:* `+ New parameter` is a stub (toast only) in both built directions — creation itself isn't wired. Direction 2 supports **Delete** (removes the row from in-memory state). Everything resets on reload.

### F2 — Set or change a parameter's value
1. User opens the parameter.
2. **Direction 1:** edits the value with a type-aware editor.
3. **Direction 2:** chooses the **source** — a *Static value*, or a *Feature Flag variable* (pick a flag in the parameter's project, then a same-type variable).
4. On save, the dashboard shows the new value and every consuming flag receives it.

*Prototype behavior:* fully built in both directions; number/JSON inputs validate before save. "Delivery to consumers" is illustrative — no real propagation, SDK, or evaluation.

### F3 — See a parameter's impact (blast radius)
1. User opens the parameter.
2. **Direction 1** lists the consuming flags so the impact of a change is explicit (*"changing this updates N flags"*).
3. **Direction 2** shows each parameter's current value and source on the dashboard; the full grouped dependency list was intentionally trimmed for minimalism.

*Prototype behavior:* renders from mock data; links are inert.

### F4 — Run an experiment on a parameter — *future (Path 2)*
Not in the current prototypes. An experiment temporarily takes control of a parameter's value, with attribution on the experiment. See *Future direction (Path 2)* above.

> A Features-side **"Link to Global Parameter"** entry point — initiating the flag→parameter link from inside the flag editor (the inverse of Direction 2's flag-variable source) — is a possible future addition, not currently planned as a separate prototype.

---

## Requirements

### Built (current prototypes)

Each maps to an acceptance criterion below.

- Settings-side **Global Parameters** surface (Directions 1 and 2), alongside *Approvals settings* and *Holdouts*, in the native shell, with search. **(→ AC 1, 2, 5)**
- Dashboard table — Direction 1: key, type, current value, consuming flags, updated · Direction 2: name, project, type, current value, source, updated, with per-row hover Edit/Delete. **(→ AC 2, 5)**
- Type-aware value editor — string / number / boolean / JSON, with number/JSON validation gating save. **(→ AC 3)**
- Direction 1: parameter **blast radius** (the consuming flags) on the detail page. **(→ AC 3)**
- Direction 2: **source-type** selector (*Static value* / *Feature Flag variable*) with the flag list filtered to the parameter's **project** and the variable list to its **type**; current value resolves from the chosen variable. **(→ AC 6, 7)**

### Next
- Real parameter creation (currently a stub).
- Tag / project filtering on the index; inline diff on change; audit history; schema validation for JSON.
- *(Possible future)* a Features-side **"Link to Global Parameter"** entry point initiated from inside the flag editor.

### Future (Path 2 / vision — not this phase)
- Override hierarchy with **current effective value** + override source on the detail page.
- **Experiment control** of a parameter with attribution; exclusivity via **Mutually Exclusive Groups** (not a "Layer").
- `getGlobalParameter` SDK resolution path independent of flags.

### Won't have (this phase)
- Parameter Stores (grouped namespacing). Direction 2 introduces only a lightweight **project** dimension; full Stores stay deferred.
- Governance / approval workflows.
- Live backend, SDK, or real evaluation — static prototype only.

---

## Non-goals

- Replicating Statsig's full hierarchy (Stores + Configs + Gates + Layers).
- Becoming a generic remote-config product.
- Building a full SDK story before the user-facing concept is validated.
- Inventing a parallel evaluation engine in the prototype.

---

## Open questions

This is the single canonical place for open issues. "Status" marks whether a question blocks the prototype or can be resolved after it — so engineers aren't blocked on questions that don't affect the demo.

| # | Question | Current lean | Status |
| --- | --- | --- | --- |
| 1 | **Naming** — "Global Parameters" vs "Parameters" vs "Shared Variables"? | `Global Parameters` (signals workspace scope). Used consistently across all user-facing docs. | Validate with PMs · *not blocking — after prototype* |
| 2 | **Flat vs grouped at scale** — 10–20 parameters (flat fine) or 100+ (Stores needed)? | Flat list; Direction 2 adds a lightweight **project** dimension as the first grouping; full Stores deferred. | Validate before V2 · *not blocking* |
| 7 | **Which model is canonical?** — Direction 1's plain value-+-consumers, or Direction 2's parameter-first **source** (Static value / Feature Flag variable)? | Lean 2 (source-first) as the direction MVP converges on; Direction 1 is the simplest framing for stakeholders. | Decide before MVP · *not blocking prototype* |
| 8 | **Source types** — beyond Static value and Feature Flag variable, do we add Experiment / Dynamic config as sources, and when? | Static + Flag variable now; Experiment source is the Path 2 step (it was trialled then removed from 2 for minimalism). | Tie to Path 2 decision · *not blocking* |
| 3 | **SDK ergonomics** — `getGlobalParameter(...)` vs keep flag variable resolution? | Flag resolution for MVP (Path 1). | Validate with ≥3 dev customers · *blocks Path 2, not prototype* |
| 4 | **Conflict semantics** — two non-mutually-exclusive experiments controlling one parameter? | Prevent at config time via Mutually Exclusive Groups. | Confirm with eng · *not blocking prototype* |
| 5 | **JSON parameters** — schema in MVP to prevent shape drift, or free JSON? | Free JSON / plain text area for prototype. | To validate before build · *resolved for prototype: free JSON* |
| 6 | **Archive semantics** — parameter with dependents: soft-delete with tombstone or block deletion? | Lean: block deletion while dependents exist. | To validate before build · *not blocking prototype* |

> Resolved discussion items from the engineering sync should be folded into this table (see [dev_lead_discussion_notes.md](dev_lead_discussion_notes.md)) so there is one source of truth for open issues.

---

## MVP scope (summary)

The **Settings-side Global Parameters surface** is built in two directions — **Direction 1** (simple shared-value dashboard + blast radius) and **Direction 2** (parameter-first, with a *Static value / Feature Flag variable* source selector). Path 1 sequencing holds: experiments still flow through flags, and the broader vision (override hierarchy, experiment control) is the next step the current prototypes lead toward rather than fully implement.

---

## Acceptance criteria (prototype)

Split by direction, matching what each built prototype actually demonstrates.

**Direction 1 (built)**
1. A **Global Parameters** surface exists **inside Settings**, alongside Approvals settings and Holdouts, in the native Kameleoon shell.
2. The dashboard lists ≥4 mock parameters with key, type, current value, used-in (consuming flags), and updated.
3. Opening a parameter shows its consuming flags (the **blast radius**) and a type-aware value editor (string / number / boolean / JSON with validation).
4. Editing the value and saving updates the displayed value and states that all consuming flags now receive it. In-memory only.

**Direction 2 (built)**
5. A minimal dashboard (name, project, type, current value, source, updated) with per-row hover **Edit/Delete**, in the same Settings location.
6. The detail page offers a **source-type** selector: *Static value* or *Feature Flag variable*.
7. For a Feature Flag variable source, the flag list is filtered to the parameter's **project** and the variable list to the parameter's **type**; the current value resolves from the chosen variable, and saving reflects on the dashboard.

**All built directions**
8. Run as static files (GitHub Pages compatible), mock data only; a reload resets to seed.
