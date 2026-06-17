# Engineering Alignment Brief — AI Targeting Comparison Rule

## 1. Goal of the sync

Decide:
1. Whether **overlap** between two targeting groups can be measured (a) as a configure-time *estimate* for the diagnostic indicator and (b) at runtime for reporting.
2. The runtime contract for **deterministic assignment of the overlap subset** to exactly one group — without randomizing the whole audience.
3. Whether the personalization evaluation engine needs changes beyond a new rule data shape.

---

## 2. Problem overview

A standard rule resolves to one content for visitors who match its targeting. This rule must, for the **same incoming population**, evaluate **two** targeting definitions, assign each matched visitor to exactly one group, and never double-count overlap — while keeping the experience (content) and goal constant.

Surfaces touched:
- **Data model:** rule schema gains `groups[2]` (each a Segment + Trigger definition, the existing shape), a single `content`, and a derived `aiGroupId`. No rule-level goal — goals stay at the personalization level. A group is the AI group when its Specific segment contains an AI targeting condition.
- **Evaluation engine:** after the rule is reached in the queue, evaluate both group definitions, then resolve assignment.
- **Assignment:** deterministic per-visitor bucketing of the **overlap subset only**.
- **Measurement:** overlap rate as a diagnostic (configure-time estimate) and as a reported metric (runtime).

---

## 3. Proposed directions

### Direction A — Evaluate both definitions at runtime, hash-resolve overlap (selected)
- **Description:** When the queue reaches this rule, evaluate `group1` and `group2` definitions against the visitor.
  - matches neither → rule does not apply; visitor continues down the queue (consistent with existing semantics).
  - matches exactly one → assign to that group, serve the shared content, attribute to that group.
  - matches both → compute `h = stableHash(visitorId, ruleId)`; `h < 0.5` → group1 else group2. Serve the shared content, attribute to the assigned group only.
- **Why:** Reuses the existing deterministic bucketing function already used for experiment splits. The hash is computed *only for the overlap subset*, so the rest of the audience is assigned by pure targeting — satisfying "do not randomize the whole audience up front."
- **Implications:** AI Targeting evaluation must be callable inside a group definition as one condition among others (it already produces a per-visitor qualify/not decision on the learning goal). The engine adds an "evaluate two definitions + resolve" step for this rule type.
- **Risks:** AI Targeting is a model call/scored attribute — ensure it is evaluable in the same path as standard conditions with acceptable latency; cache the per-visitor AI decision for the request.

### Direction B — Pre-bucket the whole audience, then filter
- **Description:** Assign every incoming visitor a group bucket first, then apply that group's targeting.
- **Rejected:** Explicitly violates the required behavior (no up-front randomization of the whole audience) and biases each group's reachable population.

### Direction C — Two queue slots + post-hoc dedupe
- **Description:** Keep two rules, dedupe overlap in reporting.
- **Rejected:** Two slots interact with queue ordering and the "first match wins" rule; overlap is resolved by order, not by stable assignment. Does not meet the spec.

---

## 4. Key technical questions

### Overlap measurement
- **Configure-time estimate:** can the existing audience-size estimator evaluate `group1`, `group2`, and `group1 ∧ group2` to produce an overlap %? If AI Targeting cannot be estimated pre-traffic, degrade the indicator to "overlap possible" and compute the real rate at runtime.
- **Runtime metric:** count `matchedBoth` alongside per-group assignment so reporting can show the realized overlap rate.

### Assignment contract
- Reuse the deterministic split hash. Key recommendation: `stableHash(visitorId, ruleId)` so a visitor is stable across sessions and independent of other rules. Confirm the hash domain is uniform enough for a 50/50 split at low volumes.
- Assignment must be computed **only when both groups match** — single-match visitors bypass the hash entirely.

### Evaluation engine
- Add a rule-type branch: evaluate two group definitions, resolve assignment, serve the single content. No change to queue ordering or "first match wins."
- AI Targeting lives inside a segment: confirm "is this segment AI-driven?" is a queryable segment property (drives the capability chip, the picker badge, and the both-groups guardrail), and that the segment evaluator already invokes the AI model on the personalization goal.

### SDK / payload
- Payload gains `groups[2]` (Segment + Trigger definitions), `content`, `aiGroupId`. Standard-rule payloads are unchanged.
- Overlap resolution is a client-side hash (constant time) — no extra service call on the hot path.

### Goal pipeline
- The conversion/AI-learning goal is the personalization-level goal (no rule-level goal). Confirm goal events can be attributed per assigned group (group1 vs group2) for this rule, reusing the existing goal-attribution bus with a group dimension.

---

## 5. PM recommendation

**Direction A**, phased:
- **Milestone 1:** rule type, two-group schema (Segment + Trigger per group), Targeting UI, single content, runtime two-definition evaluation + hash overlap resolution, runtime overlap metric. This is the whole setup + correct assignment.
- **Milestone 2:** configure-time overlap *estimate* (diagnostic indicator) if the estimator can support `group1 ∧ group2`; otherwise ship the runtime-only overlap rate first.

**Reasoning:** assignment correctness (never double-count, stable, overlap-scoped) is the load-bearing requirement and is fully in Direction A. The configure-time estimate is a nice-to-have diagnostic that depends on estimator capability and can follow.

**Needs validation**
- Audience estimator can evaluate `group1 ∧ group2` (and whether AI Targeting is estimable pre-traffic).
- Deterministic hash uniformity at low volume for a fair 50/50 overlap split.
- AI Targeting evaluable as an in-segment condition with acceptable latency and goal binding.
- Goal-event attribution can carry an assigned-group dimension for this rule.
