# Engineering Alignment Brief — Experiment Rule for Personalizations

## 1. Goal of the Sync

Decide:
1. Whether the Web Experiments bandit service can be reused as-is for an Experiment rule inside Personalizations, or whether a personalization-scoped bandit path is needed.
2. The SDK payload shape for a multi-content personalization rule, and the evaluation contract on the client.
3. Whether the personalization evaluation engine needs to change or only the rule data shape.

---

## 2. Problem Overview

Personalization rules today serve **one content per rule** with allocation-based exposure. The Experiment rule introduces **N contents per rule** with three allocation modes (manual / multi-armed bandit / contextual bandit). The personalization-level goals must remain the source of truth for optimization signals, and the rule queue semantics must not change.

This crosses three engineering surfaces:
- **Data model:** rule schema gains a `contents[]` array and `allocation` block.
- **Evaluation engine:** the rule must internally bucket exposed visitors across N contents.
- **SDK:** client receives a different payload for these rules and must select the right content arm.
- **Bandit service:** must be callable with a personalization-rule context, not just experiment-id context.

---

## 3. Proposed Directions

### Direction A — Reuse Web Experiments bandit service, extend rule schema only

- **Description:** Treat the Experiment rule as a thin wrapper around the existing bandit. Each rule registers a bandit instance keyed by `(personalizationId, ruleId)`. The bandit service receives goal events filtered by the personalization-level primary goal. Rule schema gains `contents[]` and `allocation`. Evaluation engine adds an "internal bucket" step after exposure.
- **Why it exists:** Fastest to ship. Reuses statistical infrastructure that's already battle-tested. Keeps the bandit knowledge in one place.
- **Engineering implications:**
  - Bandit service must accept a personalization-scoped key alongside the existing experiment-scoped key.
  - Goal pipeline must route personalization-level goal events to the rule-level bandit instance.
  - SDK payload must carry `contents[]` with arm IDs; current single-content shape stays for standard rules.
- **Risks:**
  - Bandit service was tuned for experiment cardinality (2-10 variations, large traffic). Personalization rules are often segment-narrow → small samples. Requires an explicit warm-up and "low-traffic" guard.
  - Coupling bandit lifecycle to rule lifecycle (rename/clone/move) requires careful key handling.

### Direction B — Personalization-scoped bandit path

- **Description:** Build a personalization-scoped bandit module that calls into the same statistical core but keeps its lifecycle and storage separate.
- **Why it exists:** Fully decouples experimentation and personalization pillars; enables personalization-specific tuning (segment-aware warm-up, hierarchical priors across rules in the same personalization).
- **Engineering implications:**
  - More work upfront. New service surface, new deployment.
  - Cleaner separation of concerns and roadmap freedom.
- **Risks:**
  - Two bandit code paths to maintain.
  - Risk of behavioral drift between experiment bandit and personalization bandit over time.

### Direction C — Manual allocation only in v1, bandit modes in v2

- **Description:** Ship Experiment rule with **Manual allocation only**. Validate the rule shape, SDK contract, queue rendering, and inherited-goals model. Add bandit modes in a follow-up.
- **Why it exists:** De-risks v1. Most of the new surface area (rule type, multi-content, queue rendering, inherited goals) is independent of the bandit decision.
- **Engineering implications:**
  - No bandit integration in v1.
  - Schema and SDK already shaped for future bandit modes (`allocation.mode = "manual"` initially).
- **Risks:**
  - Bandit modes are part of the differentiation story; shipping without them weakens the launch narrative.
  - Mitigation: announce v1 as "Experiment rule (manual)" with a clear roadmap to bandit modes.

---

## 4. Key Technical Questions

### SDK impact
- Single-content rule: `{ ruleId, content }`. Multi-content rule: `{ ruleId, contents: [{id, content, allocation}], mode, banditState? }`.
- Client-side bucketing for manual allocation can run on the SDK with the existing hash function; bandit modes need a server-evaluated arm assignment OR a periodically refreshed allocation snapshot.
- Open: does the SDK need a new method, or can the existing personalization evaluation method be extended?

### Architecture
- Where does the "internal bucket across contents" step live? Recommend: in the personalization evaluation engine, after the exposure check, before returning the rule output.
- Bandit state storage: per-rule, keyed by `(personalizationId, ruleId)`.

### Performance
- Manual allocation is constant-time; no hit.
- Bandit modes add a service call OR rely on a periodically updated allocation snapshot embedded in the SDK config. Recommend snapshot to keep evaluation latency unchanged.

### Scalability
- Allocation snapshots add config payload weight. Estimate +1-3KB per active experiment rule. For typical personalization counts (~10s of rules), acceptable.

### Goals pipeline
- Goal events are already attributed to the personalization. Routing them to the rule-level bandit is an event-bus filter change, not a new event source.

### Lifecycle edges
- Rule clone → new bandit instance, no state carried over.
- Allocation mode switch (Manual ↔ MAB) → reset bandit state, freeze allocations from current state to avoid traffic shock.
- Rule deletion → bandit instance archived for reporting, not deleted.

---

## 5. PM Recommendation

**Preferred option: Direction A + a phased rollout that mirrors Direction C.**

- Ship the **rule type, multi-content schema, SDK contract, queue rendering, and Manual allocation** as the first milestone. This validates the new surface area without touching the bandit.
- Land bandits as the second milestone, reusing the Web Experiments bandit service with the personalization-scoped key.

**Reasoning**
- The biggest UX risks (rule-type abstraction, inherited goals UI, queue rendering) are independent of the bandit work and benefit from being validated first.
- Reusing the existing bandit infra (Direction A) is materially cheaper than building a personalization-specific path (Direction B). The decoupling argument for B is real but not strong enough to justify the cost in v1.
- Phasing protects the launch narrative: each milestone is a shippable, demoable increment.

**What needs validation**
- Bandit service key model — confirm `(personalizationId, ruleId)` is a clean primary key without colliding with experiment IDs.
- Goal-event routing — confirm the existing event bus can filter goal events by personalization without a schema change.
- SDK payload size impact when many personalization rules ship allocation snapshots.
- Customer interviews on whether Manual-only v1 lands as "useful" or "incomplete" — informs whether the gap to v2 needs to be days or weeks.