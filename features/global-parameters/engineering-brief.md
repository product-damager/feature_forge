# Engineering Alignment Brief

## 1. Goal of the Sync
We need to align on the technical implementation of **Global Parameters** in Kameleoon. Specifically, we must decide between delivering parameters under the hood through the existing Feature Flag engine (Path 1) versus introducing a first-class Parameter evaluation logic and a new method in the SDK (Path 2). 

We propose a hybrid **sequencing strategy**: ship Path 1 visually in the MVP to validate user demand, while designing the UI and mental model to align with Path 2 to prevent a breaking migration later.

> Pre-sync questions and their answers are logged in [dev_lead_discussion_notes.md](dev_lead_discussion_notes.md). This brief frames the decisions; the notes capture what was asked and heard.

---

## 1b. Decisions we want from this sync

Concrete yes/no or choice calls we'd like to leave the sync with:

1. **Do we agree the MVP ships as Path 1 only, with the UI aligned to Path 2 language?** (yes / no)
2. **Do we agree NOT to ship `getGlobalParameter` in the SDKs for the MVP?** (yes / no)
3. **Do we agree the prototype is flat-list only — no Stores, no namespacing — for validation?** (yes / no)
4. **Do we agree to enforce parameter-experiment exclusivity via existing Mutually Exclusive Groups rather than a new "Layer" concept?** (yes / no)
5. **For Path 2 payload: same flag configuration file, or a separate on-demand fetch?** (pick one — needed to scope V2, not the prototype)

---

## 2. Problem Overview
Currently, configuration variables (such as banners, discount rates, feature list lengths) are trapped *inside* individual feature flag variations or targeting rules. This architectural constraint creates four major issues:
- **Duplication & Toil:** Standardized parameters (e.g., a "global discount rate" used across mobile, web, and email) must be manually defined and duplicated across multiple flags/platforms.
- **Inconsistency Risk:** Updating a shared parameter requires manual sync across all active flags. Failing to update one creates a fractured, buggy user experience.
- **No Traceability:** Teams have no visual or technical way to answer: *"where is this value used?"* without tedious manual auditing of all flags.
- **High Experimentation Friction:** PMs cannot easily run an A/B test or rollout on a shared parameter without a developer writing and deploying new flag code.

---

## 3. Proposed Directions

### Direction A — Path 1: Feature Flags stay the center of the universe (UI convenience)
- **Description:** Global Parameters exist as a dashboard UI convenience. Under the hood, they are delivered through the existing Feature Flag evaluation mechanism.
- **Why it exists:** Minimal backend effort and zero changes required in the SDKs. It reuses the existing, battle-tested evaluation engine.
- **Engineering implications:** No changes to SDK schemas. The dashboard UI handles mapping global parameter values to individual flag variables.
- **Risks:** PMs still cannot run parameter A/B tests without code changes. It leaves our primary competitive differentiator vs Statsig (no-code parameter-native experimentation) on the table and runs the risk of locking us into "flags forever".

### Direction B — Path 2: Parameter as a first-class evaluation entity
- **Description:** Introduce a brand new, first-class parameter resolution path in the backend and SDKs. Developers query parameters directly in code (e.g., `kameleoonClient.getGlobalParameter("key")`).
- **Why it exists:** Unlocks true parameter-native experimentation. PMs can swap a parameter from a static value to an experiment override remotely without involving developers.
- **Engineering implications:** Requires a new API method in all SDKs, changes to the evaluation engine, new database schemas to track parameters separately from flags, and updates to the payload distribution system.
- **Risks:** Significant backend and SDK engineering overhead, delayed time-to-market, and a higher surface area of potential bugs in SDK runtime.

---

## 4. Key Technical Questions
- **SDK Impact:** Should we introduce `kameleoonClient.getGlobalParameter("key")` immediately? How will it interact with local evaluation, cache, and payload synchronization?
- **Architecture & Payload:** How does introducing global parameters affect payload size? Should we distribute parameters in the same flag configuration file, or fetch them via a separate, on-demand query?
- **Performance:** What is the latency impact of adding another SDK lookup? How do we ensure sub-millisecond local evaluation for server-side and client-side applications?
- **Scalability:** Should we support grouped namespaces (e.g., "Parameter Stores" like Statsig) from Day 1 to handle enterprise customers with 100+ parameters, or is a flat list sufficient for validation?
- **Conflict Semantics:** What is the evaluation logic when two active experiments override the same global parameter for a user? (We propose preventing this at configuration time via Mutually Exclusive Groups).

---

## 5. PM Recommendation
- **Preferred Option:** **Sequencing Strategy (Hybrid Path)**
  - **MVP (Phase 1):** Build the **Flat Hub** in the UI. Deliver the parameters under the hood through Path 1 (via Feature Flag variables). Use Path 2 terminology ("default value", "effective value", "override source") in the UI so the conceptual shift is seamless.
  - **V2 (Phase 2):** Commit to Path 2 engineering. Build the direct parameter resolution path in the SDKs and backend once the concept is validated by early adopters.
- **Reasoning:** This minimizes engineering risk and accelerates time-to-market. We can validate user demand for visual traceability and parameter editing before committing to a costly rewrite of all Kameleoon SDKs.
- **What needs validation:**
  - **Developer Validation:** Ask developers if they actually prefer calling `kameleoonClient.getGlobalParameter("discount")` or if they just want a better UI for sharing variables between existing flags.
  - **Product Validation:** Show PMs mockups of a flat parameter hub vs grouped Parameter Stores. Determine if they anticipate managing 10-20 parameters (flat list is fine) or 100+ parameters (stores are required).

---

## 6. Out of scope for the MVP / prototype

So engineering doesn't worry about these in this phase — they are explicitly *not* part of MVP:

- **No SDK changes.** No `getGlobalParameter` method; MVP delivers values through the existing flag variable resolution path.
- **No Parameter Stores / namespacing / grouping.** Flat list only.
- **No "Layer" abstraction.** Reuse Mutually Exclusive Groups.
- **No new evaluation engine or parameter-resolution path.** That's Path 2 / V2.
- **No governance, approvals, or permission workflows.**
- **No audit history surface** beyond an "Updated" timestamp.
- **No live backend.** The prototype is static mock data.

For the current cycle, the only deliverable is a **static prototype** in `/features/global-parameters/prototype/`. As built: **Direction 1** (simple shared-value dashboard + blast radius) and **Direction 2** (parameter-first, with a *Static value / Feature Flag variable* source selector). The prototype exercises the UI and mental model only; all architectural decisions (Path 1 vs Path 2, SDK payload, etc.) remain intentionally out of scope, and the override-hierarchy / experiment-control model is **not** in the prototype — it is the Path 2 direction this leads toward.

---

## 7. Coarse effort (cost vs benefit signal, not a plan)

Rough order-of-magnitude only, to help Opportunity reviewers weigh the sequencing — **to be confirmed with engineering, not committed:**

| Phase | Scope | Rough effort |
| --- | --- | --- |
| Prototype | Static mock demo (this feature folder) | Days |
| MVP (Path 1) | Flat Hub UI + dependency indexing + "Link to Global Parameter" in flag editor; reuse existing evaluation engine | A few sprints, mostly front-end + dependency-graph queries |
| V2 (Path 2) | New parameter-resolution path + `getGlobalParameter` across **all SDKs** + payload/distribution changes + new schemas | Substantially larger — multiple SDKs × backend; the dominant cost, and why we gate it on validated demand |

The point of the sequencing strategy is to spend the *days* and *few sprints* to validate demand **before** committing to the large multi-SDK V2 investment.