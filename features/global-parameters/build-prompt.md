# Build Prompt — Global Parameters Prototype (v1)

A reusable prompt to brief an AI coding agent for the first prototype. Paste the section below as the agent's task. Keep the framing intact.

---

## Status — what was actually built

This brief has been reconciled with the delivered prototypes. The current state under `prototype/`:

- **`direction-1/` — built.** A minimal Settings dashboard of shared values; opening a value shows its consuming flags (**blast radius**) and a type-aware editor; changing the value propagates to all consuming flags. Simple model: value + affected flags, **no** override hierarchy / effective-value resolution / experiment control.
- **`direction-2/` — built.** The **parameter-first** variant in the same Settings location. Minimal dashboard (name, project, type, current value, source, updated) + per-row Edit/Delete. Detail page has a **source-type** selector — *Static value* or *Feature Flag variable* — where a flag-variable source picks a flag in the parameter's **project** then a variable of the **same type**.

Both directions sit **inside Settings** (alongside *Approvals settings* and *Holdouts*) using the native Kameleoon shell, and are organised as **one subfolder per direction**, each a self-contained `index.html` + `styles.css` + `app.js`. The sections below describe the original v1 intent; where they mention a single hash-routed app, the override hierarchy, or experiment-override seeding, treat the Status notes here and in [spec.md](spec.md) as authoritative for what exists today.

---

## Repository context (brief the agent first)

You are working in a **prototyping-first** repository for **Kameleoon**. This is not a production application. Your goal is to produce a stakeholder-playable static prototype that fits the existing repo conventions.

Authoritative context lives in:

1. `/AI_PRODUCT_SYSTEM.md`
2. `/docs/kameleoon-context.md`
3. `/features/global-parameters/` (this feature folder)

Read those before writing code. In particular, read:
- `features/global-parameters/README.md`
- `features/global-parameters/analysis.md`
- `features/global-parameters/spec.md`
- `features/global-parameters/ux-reference.md`

Existing prototypes (e.g. `features/experiment-rules-personalization/prototype/`, `features/rollout-preview/`) show the expected style: dense, panel-based, Kameleoon-native, GitHub Pages-compatible static files, mock data baked into JS.

---

## Feature goal

Build a static prototype for **Global Parameters**: a centralized, reusable layer of configuration values that Feature Flags can reference. As built, the prototype communicates, to a non-technical stakeholder, three things:

1. Parameters are reusable values defined once and consumed by many flags.
2. A parameter's value is **decoupled from code**: it can be a static literal or sourced from a Feature Flag variable (Direction 2), and re-sourced ("remapped") centrally without a code change.
3. Traceability / **blast radius**: for any parameter you can see exactly which flags consume it, so a change's impact is explicit.

(The override hierarchy `default → flag → experiment` and experiment control are the **Path 2 direction** this leads toward — not part of the current build.)

The framing is **inspired by Statsig's Parameter Stores but native to Kameleoon**. Do not replicate Statsig's full hierarchy. No "Stores," no "Layers," no separate "Dynamic Config" surface.

### Prototype directions (as built)

Two related directions, each in its own subfolder under `prototype/`, both inside the **Settings** area next to Approvals settings and Holdouts:

- **Direction 1** (`direction-1/`, built) — a simple shared-value dashboard. Change a value once; every consuming flag follows. Blast radius shown on the detail page.
- **Direction 2** (`direction-2/`, built) — the parameter-first variant: minimal dashboard + a detail editor with a *Static value / Feature Flag variable* source selector (project- and type-filtered flag→variable mapping).

Each direction is a separate, self-contained static app so it can be demonstrated independently; a root `prototype/index.html` links to both.

---

## Prototype scope

### Must include (as built)

1. **Settings view** with a **Global Parameters** surface present alongside *Approvals settings* and *Holdouts* (other items visual-only), in the native Kameleoon shell — for both Direction 1 and Direction 2.
2. **Dashboard table** —
   - Direction 1: key, type, current value, used-in (consuming flags), updated; with search.
   - Direction 2: name, project, type, current value, source, updated; per-row hover Edit/Delete; with search. `+ New parameter` is a stub action.
3. **Parameter detail page** —
   - Direction 1: key, type, description, a type-aware **value editor**, and a **blast radius** panel (the consuming flags).
   - Direction 2: key, project, type, description, and a **source-type** selector — *Static value* (type-aware input) or *Feature Flag variable* (flag dropdown filtered to the parameter's project → variable dropdown filtered to its type), with a live effective-value preview.
4. **Mock data** seeded per direction with ≥4 parameters of mixed types (string, number, boolean, json) and varied states (Direction 1: unused / single-flag / multi-flag; Direction 2: static-source and flag-variable-source across ≥2 projects).

### Must not include

- Real backend, real SDK, real evaluation; persistence.
- Authentication, governance, approvals.
- Parameter Stores / namespacing (Direction 2's lightweight **project** is the only grouping).
- Layers. If exclusivity comes up, a one-line mention of "Mutually Exclusive Groups" is enough — do not build the UI for it.
- Override hierarchy / current-effective-value / experiment-control UI — that's the Path 2 direction, out of scope for the current build.
- Reporting / analytics charts on parameters.
- Animations beyond standard hover/focus (e.g. revealing per-row Edit/Delete on hover).

---

## Required views

| View | Purpose |
| --- | --- |
| Dashboard (per direction) | Parameters table (D1: value + consuming flags · D2: value + source + project) |
| Parameter detail | D1: value editor + blast radius · D2: source-type selector (Static / Feature Flag variable) |

### Navigation model (as built)

Rather than one hash-routed app, the prototype is **one subfolder per direction**, each a self-contained static app with light internal hash routing:

| Path | View |
| --- | --- |
| `prototype/index.html` | Landing page linking to both directions |
| `direction-1/index.html` (`#/`, `#/p/:key`) | Direction 1 dashboard + parameter detail |
| `direction-2/index.html` (`#/`, `#/p/:key`) | Direction 2 dashboard + source-editor detail |

Each app works when opened directly (`file://`) or on GitHub Pages, with no server-side routing and no build step. Vanilla HTML/CSS/JS.

---

## Design constraints

- **Native Kameleoon UI feel:** dense, panel-based, monospace for keys, small typography for metadata. Match the existing prototypes' density, not consumer-app whitespace.
- **No hero / marketing layout.** This is an editor-centric tool.
- **Information density over decoration.** A reviewer should be able to read the whole index without scrolling past padding.
- **Clear chips** for type and source (Static / Feature Flag variable). Reuse a single chip vocabulary; don't invent multiple shapes.
- **Change impact must be explicit** — Direction 1 names the consuming flags; Direction 2 shows the resolved value and its source.

---

## Mock data (as built — seeded per direction)

Each direction seeds its **own** in-memory mock data; nothing is shared and a reload resets to seed. The original single canonical array (with `overrideSource` / `controlledBy` / experiment states) is **not** what shipped — the built directions use simpler shapes:

**Direction 1** — shared value + the flags that consume it:

```js
// { key, type, value, description, usedIn: [{ name, status }], updatedAt }
{ key: "discount_rate", type: "number", value: 20,
  usedIn: [ { name: "promo_web", status: "live" }, { name: "promo_ios", status: "live" },
            { name: "promo_android", status: "live" }, { name: "promo_email", status: "draft" } ] }
```
Seeds cover string / number / boolean / json and the dependency states (multi-flag, single-flag, unused).

**Direction 2** — parameter-first, with a source that is either a static value or a flag variable:

```js
// flags: [{ id, name, project, variables: [{ name, type, value }] }]
// param: { key, project, type, description, sourceType: "static"|"flag",
//          value, reference: { flagId, variableName }|null, updatedAt }
{ key: "hero_bird_img", project: "Birdwatching", type: "string",
  sourceType: "flag", reference: { flagId: "f_home", variableName: "crow_image" } }
```
Seeds include ≥1 static-source and ≥1 flag-variable-source parameter, across two projects, with flags whose variables have matching and non-matching types (so the type filter is demonstrable).

---

## In-product copy (what appears on screen vs stays in docs)

Copy that appears **in the UI** of the built directions (it teaches the concept where the user needs it):

- **Blast-radius framing** (Direction 1) on the detail page: *"Changing this value updates N flags"*, with the consuming flags listed.
- **Decoupled-from-code framing** (Direction 2): the value's source is shown as *Static* or *Feature Flag variable*, with a live preview of the resolved value; switching the source is presented as a no-code remap.
- **Empty / unused state** copy: *"Not used"* (Direction 1) — a parameter no flag consumes yet.

Keep in docs only (do **not** put on screen): the restaurant analogy, the Statsig comparison, Path 1 vs Path 2 reasoning, and any "how Statsig does it" framing. The override-hierarchy / experiment-attribution copy that earlier drafts placed on the detail page belongs to the **Path 2** direction and is not shown in the current build.

---

## How dependencies / mappings behave (as built)

- **Direction 1.** A parameter's detail lists the flags in its `usedIn` array (the **blast radius**). Editing the value and saving updates the displayed value and reports that all consuming flags now receive it. In-memory only; reload resets.
- **Direction 2.** A parameter's value comes from its **source**. For a *Feature Flag variable* source, choosing a flag (filtered to the parameter's project) then a variable (filtered to the parameter's type) sets `reference = { flagId, variableName }`; the current value resolves from that variable. Switching back to *Static value* stores a literal. Saving reflects on the dashboard. In-memory only; reload resets.
- No persistence, no SDK, no backend in any direction.

---

## Demo scripts (the click paths to support)

**Direction 1** (`direction-1/index.html`)
1. See the dashboard with the seeded parameters.
2. Click `discount_rate` → detail shows value `20` and its **4 consuming flags** (blast radius).
3. Edit the value → **Save & update flags** → dashboard shows the new value; toast reports how many flags now receive it.

**Direction 2** (`direction-2/index.html`)
1. See the minimal dashboard (name · project · type · current value · source · updated); hover a row for **Edit/Delete**.
2. Open `hero_bird_img` → source type is **Feature Flag variable**, mapped to a flag variable in its project.
3. Switch a parameter's source between **Static value** and **Feature Flag variable**; for the flag source, note the flag list is project-filtered and the variable list is type-filtered. **Save** → the dashboard's current value + source update.

---

## Deliverables (as built)

Prototype files live in `/features/global-parameters/prototype/`, one subfolder per direction:

- `prototype/index.html` — landing page linking to both directions.
- `prototype/direction-1/` — `index.html` + `styles.css` + `app.js` (shared-value dashboard, built).
- `prototype/direction-2/` — `index.html` + `styles.css` + `app.js` (parameter-first source editor, built).

Each app runs by opening its `index.html` directly or via GitHub Pages; mock data is inline; a reload resets state. Keep `/features/global-parameters/README.md` in sync when the structure changes.

---

## Definition of done (per built direction)

- **Direction 1.** A reviewer opens `direction-1/index.html`, sees the dashboard, clicks a parameter, sees its consuming flags (blast radius) and a type-aware editor, edits the value, and sees the dashboard reflect it.
- **Direction 2.** A reviewer opens `direction-2/index.html`, sees the minimal dashboard with hover Edit/Delete, opens a parameter, switches its source between *Static value* and *Feature Flag variable* (flag list project-filtered, variable list type-filtered), and saves.
- Both sit inside the native Kameleoon Settings shell, run as static files (GitHub Pages, no build step, no backend), and match the density/style of the repo's prototypes.

---

## What to flag back to the human reviewer

When you finish, return:

1. A short plan of what you built.
2. List of files created.
3. Key UX decisions you made (e.g. routing approach, JSON editor handling, how you visualized the blast radius / source mapping).
4. Any open questions or assumptions you had to make.
5. Anything intentionally left out and why.

---

## Build checklist (per built direction, mirrors spec ACs)

Confirm before declaring a direction done — each maps to an AC in `spec.md`:

**Direction 1** *(AC 1–4, 8)*
- [ ] Global Parameters surface lives **inside Settings**, alongside Approvals settings & Holdouts, in the native shell.
- [ ] Dashboard lists ≥4 seed parameters with key, type, current value, used-in (consuming flags), updated.
- [ ] Detail shows the consuming flags (blast radius) + a type-aware editor (string/number/boolean/JSON with validation).
- [ ] Editing the value and saving updates the displayed value and states the consuming flags now receive it.

**Direction 2** *(AC 5–7, 8)*
- [ ] Minimal dashboard (name, project, type, current value, source, updated) with per-row hover Edit/Delete.
- [ ] Detail has a source-type selector: **Static value** / **Feature Flag variable**.
- [ ] Flag list filtered to the parameter's **project**; variable list filtered to the parameter's **type**; current value resolves from the chosen variable; saving reflects on the dashboard.

**All built directions** *(AC 8)*
- [ ] JSON values edit as a monospace text area with valid/invalid feedback (no schema editor).
- [ ] Runs as static files on GitHub Pages, no build step, mock data only; reload resets to seed.
