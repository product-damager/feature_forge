# Global Parameters — Opportunity One-Pager

> The single anchor for the Opportunity meeting. Everything below fits on one screen.
> Deeper reasoning lives in [analysis.md](analysis.md); scope in [spec.md](spec.md); UX in [ux-reference.md](ux-reference.md); engineering trade-offs in [engineering-brief.md](engineering-brief.md).

---

## Problem

- **Duplication.** A single value (`discount_rate = 20`) is re-typed inside every flag and platform that needs it.
- **Inconsistency.** Updating it means editing every flag by hand; miss one and web/iOS/Android drift apart.
- **No traceability.** There is no answer to *"where is this value used?"* without manual auditing.
- **Experimentation friction.** A PM can't A/B test a shared value without a developer creating a flag and shipping code.

## Who feels the pain

- **Product Managers** — own the meaning of shared values and pay the duplication tax every time one changes.
- **Developers** — get pulled in for config changes that shouldn't need code, and re-wire each consumer by hand.
- **QA / release managers** — can't see what is currently overriding a value before approving a change.

## Solution

**Feature Flags turn code on/off, Experiments compare variations, Global Parameters carry the reusable values both read.** Define a value once and, from the value itself, see every flag that consumes it — change it in one place and they all follow. A parameter's value can be a **static literal** or **sourced from a Feature Flag variable** (Direction 2), so it stays decoupled from code and can be remapped centrally. The fuller override hierarchy (**default → flag → experiment**) and experiment control are the direction this leads toward (Path 2), not yet built.

## Why now

- **Competition.** Statsig already ships this concept (Parameter Stores). We need parity on the idea, with a cleaner mental model.
- **Internal strategy.** A clean parameter layer is the prerequisite for *parameter-native experiments* — no-code config testing — which is where we want to be next.

## Differentiation vs Statsig

- **Simpler mental model.** Three primitives (Flag / Experiment / Parameter), no "Stores vs Dynamic Configs vs Gates vs Layers" overhead.
- **Visible dependency graph.** A "Where is this used?" panel on every parameter — the thing Statsig users wish they had.
- **Reuse, not reinvention.** Mutual exclusivity uses our existing **Mutually Exclusive Groups**, not a new "Layer" concept.

## MVP (what the prototype actually ships)

The Global Parameters surface lives **inside Settings**, alongside *Approvals settings* and *Holdouts*, in the native Kameleoon shell. It's prototyped in two built directions:

- **Direction 1** — a simple shared-value dashboard. Open a value to see the flags that consume it (its **blast radius**); change the value once and every consuming flag follows.
- **Direction 2** — the **parameter-first** variant: a minimal dashboard, and a detail editor whose **source** is either a *Static value* or a *Feature Flag variable* (pick a flag in the parameter's project, then a same-type variable). This is the "decoupled from code, remap the source centrally" idea.

Path 1 sequencing holds: experiments still flow through flags. The fuller vision — override hierarchy and experiment control — is what these directions lead toward, not what they fully implement yet.

## Metrics & success criteria

| Outcome | Why it matters | Target signal |
| --- | --- | --- |
| % of new flags/experiments that link a Global Parameter | Adoption of the shared layer over hardcoded values | Rising quarter-over-quarter in pilot workspaces |
| Reduction in duplicated values across flags/platforms | Direct measure of the duplication pain removed | Fewer identical values defined in separate flags |
| Time to update a cross-channel value | The promo-discount pain, quantified | One edit vs N flags |
| % of parameters with ≥1 active dependency | Are parameters actually being used, not just created | Majority of created parameters are referenced |
| PM/dev demand signal for `getGlobalParameter` (Path 2) | Gate for committing V2 engineering | Qualitative validation from ≥3 dev customers |
