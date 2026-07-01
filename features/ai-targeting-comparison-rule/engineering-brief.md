# Engineering Alignment Brief — AI Targeting Comparison Rule

## 1. Goal of the sync

Decide:
1. Whether the personalization evaluation engine can, for the same incoming population, evaluate **two segments under one shared trigger** and attribute a matched visitor to **every group they match** (overlap counted in both — accepted double-counting).
2. Whether **AI Targeting can be evaluated reliably at decision time** as an in-segment condition, so a visitor's AI-group membership is known when the rule fires.
3. Whether the engine needs changes beyond a new rule data shape, and how goal events are attributed per group — including a visitor counted in both.

---

## 2. Problem overview

A standard rule resolves to one content for visitors who match its targeting. This rule must, for the **same incoming population**, evaluate **two segments** — one AI, one not — under **one shared trigger**, show the single shared content once to any eligible visitor, and attribute the visitor to **each** group whose segment matched.

Overlap is **accepted, not resolved.** A visitor who matches both segments is counted in both groups. There is no bucketing, no dedupe, no priority, and no hash split.

Surfaces touched:
- **Data model:** rule schema gains `segments[2]` (each a Segment definition, the existing shape), one shared `trigger`, a single `content`, and a derived `aiGroupId`. No rule-level goal — goals stay at the personalization level. A segment is the AI group when it contains an AI targeting condition.
- **Evaluation engine:** once the shared trigger fires and the queue reaches this rule, evaluate both segment definitions against the visitor, apply exposure, and attribute per matched group.
- **Measurement:** per-group attribution on the shared goal. Overlap is **not** resolved and **not** computed at configure time. Where feasible it is reported only in the results view as an interpretation signal.

---

## 3. Proposed directions

### Direction A — Evaluate both segments under the shared trigger, attribute to each match (selected)
- **Description:** When the shared trigger fires and the queue reaches this rule, evaluate `segment1` and `segment2` against the visitor.
  - matches neither → rule does not apply; visitor continues down the queue (consistent with existing semantics).
  - matches one or both → apply the exposure %; if eligible, serve the shared content once and attribute the visitor to **each** group whose segment matched.
- **Why:** No overlap resolution means no bucketing/hash on the hot path. Each group's metrics reflect its full targeting definition, and results read as a head-to-head comparison of two definitions — matching the methodology (double-counting accepted).
- **Implications:** AI Targeting evaluation must be callable inside a segment as one condition among others (it already produces a per-visitor qualify/not decision on the learning goal). The engine adds an "evaluate two segments + attribute per match" step for this rule type. A visitor in the overlap is counted twice by design; reporting must carry a per-group dimension and may also expose a `matchedBoth` count as an interpretation aid.
- **Risks:** AI Targeting is a model call/scored attribute — ensure it is evaluable in the same path as standard conditions with acceptable latency; cache the per-visitor AI decision for the request. Double-counting must be represented clearly in results so the two groups are not treated as independent when overlap is large.

### Direction B — Resolve overlap by bucketing / priority (rejected)
- **Description:** Assign overlapping visitors to exactly one group (hash split or static priority).
- **Rejected:** The product model now **accepts** double-counting. Resolving overlap discards the "both definitions evaluated on the full population" property and reintroduces the exclusive-population framing the methodology explicitly dropped, while adding hot-path complexity for no analytical benefit.

### Direction C — Two queue slots + post-hoc dedupe (rejected)
- **Description:** Keep two rules, reconcile overlap in reporting.
- **Rejected:** Two slots interact with queue ordering and "first match wins" — the first rule captures every overlapping visitor and starves the second, skewing exposure. A single rule with a shared trigger evaluates both segments on the same population.

---

## 4. Key technical questions

### Attribution
- The engine must attribute a matched visitor to every group whose segment matched, on the shared personalization goal. Confirm the goal-attribution bus can carry a per-group dimension and can attribute a single visitor to **both** groups when they are in the overlap.
- No per-visitor bucketing or hash is needed. Single-match and both-match visitors are handled the same way: attribute to each matched group.

### Overlap (no editor measurement)
- Overlap is **not** resolved and **not** estimated at configure time — the editor shows no overlap indicator. Do not build a configure-time overlap estimator for this rule.
- Optional, results-only: a `matchedBoth` count MAY be reported as an interpretation aid (how much the two definitions agree). This is a reporting nicety, not a load-bearing requirement, and can follow.

### Evaluation engine
- Add a rule-type branch: on the shared trigger, evaluate two segment definitions, apply exposure, serve the single content, attribute per matched group. No change to queue ordering or "first match wins."
- AI Targeting lives inside a segment: confirm "is this segment AI-driven?" is a queryable segment property (drives the capability chip, the picker badge, and the both-groups guardrail), and that the segment evaluator already invokes the AI model on the personalization goal.

### AI decision availability at evaluation time (first-class open decision)
A visitor counts toward the AI group only if the AI verdict exists when the rule fires. AI-based segments are often reconstructed after the fact (cold start, first impression, locally stored signal), so the verdict may not exist at decision time. If it cannot be evaluated reliably in-line, AI-group attribution weakens — **validate this first.** Decisions to make:
- **Unscored visitor:** if no AI verdict yet, the visitor does not match the AI segment on that impression (still counts toward the manual group if that segment matched, else continues to the next rule). Confirm this does not silently starve the AI group.
- **Late scoring vs stable attribution:** if the verdict arrives on a later visit and would change membership, re-attributing breaks a stable read; never updating biases the AI group toward already-warm visitors. Recommended: fix membership at the first qualifying evaluation; a visitor who only later becomes AI-eligible counts toward the AI group from that point, and reporting notes the cohort effect.
- **Cold-start cohort bias:** first-time visitors may be under-represented in the AI group; flag for the results methodology so it is not misread as "AI converts worse." See `methodology-and-research.md` §4.

### SDK / payload
- Payload gains `segments[2]` (Segment definitions), a shared `trigger`, `content`, `aiGroupId`. Standard-rule payloads are unchanged.
- No overlap resolution on the client — no hash, no extra service call on the hot path.

### Goal pipeline
- The conversion/AI-learning goal is the personalization-level goal (no rule-level goal). Confirm goal events can be attributed per matched group (segment1 vs segment2) for this rule — including attributing one overlap visitor to both — reusing the existing goal-attribution bus with a group dimension.

---

## 5. PM recommendation

**Direction A**, phased:
- **Milestone 1:** rule type, two-segment + shared-trigger schema, Targeting UI, single content, runtime two-segment evaluation + per-group attribution (overlap counted in both). This is the whole setup + correct attribution.
- **Milestone 2:** optional results-only `matchedBoth` overlap signal, if cheap to compute; otherwise ship per-group results first.

**Reasoning:** attribution correctness (each visitor counted toward every group they match, on the shared goal) is the load-bearing requirement and is fully in Direction A. There is no overlap-resolution contract to build. The overlap-agreement signal is a results-view nicety and can follow.

**Needs validation**
- AI Targeting evaluable as an in-segment condition with acceptable latency and goal binding, so AI-group membership is known at decision time.
- Goal-event attribution can carry a per-group dimension and attribute one overlap visitor to both groups.
- "Is this segment AI-driven?" is a reliable, queryable segment property.
