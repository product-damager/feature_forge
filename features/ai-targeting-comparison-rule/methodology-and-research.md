# Methodology & Competitive Research — AI Targeting Comparison Rule

This is a background document. It does not redefine the feature — it records *why* the design is sound, where it is methodologically stronger or weaker than the alternatives, and which assumptions must hold for the results to be trustworthy. The authoritative product definition lives in `product-spec.md` and `spec.md`; this file informs the open decisions called out there.

---

## 1. Is the underlying question even valid?

The question the rule answers — "does AI-driven targeting select better-converting visitors than a hand-built definition, for the same content?" — is a form of **segment-based / targeted experimentation**. This is a recognized, valid pattern in the discipline, with one important condition: the segments and the hypothesis must be **defined up front**, with enough sample per segment. Slicing one broad test into many segments *after the fact* is legitimate for exploration but is weaker evidence than a comparison designed around the segments from the start (Optimizely explicitly frames result segmentation as exploration, not decision-making).

Where this rule sits: it **predefines exactly two audiences and holds the content constant**, so it is on the strong side of that bar — a designed comparison, not post-hoc slicing. That is the core reason the design is defensible.

---

## 2. Competitive landscape — how rivals handle "audiences vs one content"

No major platform exposes "two targeting definitions, one content, head-to-head" as a first-class setup. They approach the adjacent need two ways: **segment targeting** (who sees it) plus **segment comparison in reporting** (how each segment reacted), and **AI/automation applied to content selection** measured against a control.

| Vendor | What they offer that is adjacent | What they do **not** offer |
| --- | --- | --- |
| **Optimizely** | AI-surfaced audiences; automatic **Holdback** (default ~5% see the original) and **global holdouts**; "Segment your results" for post-hoc slicing. | A single rule comparing an AI targeting definition vs a manual one on the same content. Holdback compares *personalization vs no personalization*, not *targeting method vs targeting method*. |
| **VWO** | ML personalization; **Holdback** control group; **Compare Multiple Segments** in reporting. | Same gap — comparison of segments is post-hoc in the report (and overlapping visitors are counted in both segments). |
| **AB Tasty** | **EmotionsAI** psychographic AI segments; multi-experience personalization (one experience per segment). | A deduplicated, single-rule AI-vs-manual comparison — you would run separate experiences/campaigns and reconcile in analytics. |
| **Adobe Target** | **Auto-Target / Automated Personalization** always measured against a **control group**; reporting compares the model vs random-serve. | Compares the model's *experience selection* to a control — not an *AI audience definition* vs a *manual audience definition* on a fixed experience. Closest analog, but a different axis. |

**Two takeaways:**
1. The differentiator is **not "we let you validate AI"** — competitors validate AI against a control/holdback. It is the **specific primitive**: two predefined targeting definitions, one content, overlap deterministically resolved, in one queue-native rule.
2. The competitor norm — **"Compare Segments" in the results page — double-counts visitors who fall in both segments**, which contaminates the contrast. Our deterministic overlap resolution assigns each visitor once, which is the cleaner statistic. This is a real methodological edge, not a cosmetic one.

---

## 3. What the comparison actually measures

This is the most important interpretation caveat and must be reflected in copy and in the (future) results view.

Let `A` = visitors the AI group qualifies, `M` = visitors the manual group qualifies, `O = A ∩ M` (the overlap). Because overlap is split 50/50 by a stable hash:

- **Group AI** = `(A \ M)` + half of `O`
- **Group Manual** = `(M \ A)` + half of `O`

Consequences:

- **The difference between the groups is driven by the exclusive populations** — the visitors where AI and manual *disagree*. The overlap (where both methods agree) is split randomly, so it contributes equally to both sides in expectation and cannot, by construction, distinguish the two methods. This is actually the *right* question: "when the two targeting methods disagree about whom to target, which one is right?"
- **A group's conversion rate is *not* the pure segment's conversion rate.** It is diluted toward the overlap's rate. Results copy must present this as a **comparison between two groups**, never as "the AI segment's true conversion rate."
- **Statistical power depends on the size of the exclusive populations, not on total matched traffic.** If overlap is high, the exclusive groups are small and the test has little power to detect a difference *even with heavy traffic*.

**Design implications:**
- The overlap indicator is not a passing "FYI" — it is effectively a **discriminating-power signal**. High overlap → warn that the comparison may be inconclusive.
- The results view should surface the **exclusive-population sizes**, and ideally offer an **exclusive-only contrast** (`A \ M` vs `M \ A`) for the purest read.

**Why 50/50 and not another rule for overlap:**
- *Static priority* (always give overlap to one group) — rejected: biases the comparison.
- *Exclude overlap entirely* (compare only exclusives) — purest contrast, but the personalization then does not run for a chunk of matched visitors; wasteful and surprising.
- *50/50 stable split* — keeps the experience running for everyone matched, keeps each visitor counted once, and leaves the contrast unbiased. It is the pragmatic choice; the exclusive-only view above can still be offered analytically.

---

## 4. Retro-matching / AI availability at decision time

The sharpest practical risk. AI-based segments are often **reconstructed after the fact** from accumulated signal (cold start, first impression, locally stored events). Deterministic overlap resolution requires knowing **both** group memberships **at the moment the rule fires** — so the AI verdict must exist at decision time, or the design degrades.

This must be promoted from a latency footnote to a **named design decision**. Open questions for engineering:

- **Unscored visitor:** if the AI verdict is not yet available on an impression, the visitor simply does **not** match the AI group that impression (and flows to the manual group, if matched, or to the next rule). Confirm this is acceptable and that it does not silently starve the AI group.
- **Late scoring vs stable assignment:** if the AI verdict arrives on a later visit and would change membership, re-bucketing breaks the stable-assignment guarantee, but never updating biases the AI group toward already-warm visitors. Pick and document the rule (recommended: assignment is fixed at first qualifying evaluation; a visitor who only later becomes AI-eligible enters the AI group from that point, and reporting notes the cohort effect).
- **Cold-start cohort bias:** first-time visitors may be systematically under-represented in the AI group. Flag for the results methodology so it is not misread as "AI converts worse."

If the AI condition cannot be evaluated reliably at decision time, the whole deterministic-overlap model weakens — this is the assumption to validate **first**.

**Two independent reliability gates.** The rule surfaces the AI segment's **learning state** (Learning / No data / Weak / Moderate / Good) from the AI Predictive visibility work (project #38057) as a read-only badge. These answer different questions and should not be conflated:
- **Learning state** = does the AI side have *enough data to trust* (is the model trained / does the segment have signal)?
- **Overlap** (§3) = do the two groups differ *enough to measure* (is there discriminating power)?
A comparison is only dependable when both gates are green: an AI segment at "Good" with low overlap. The UI warns on each independently.

---

## 5. Implications carried into the spec

- `product-spec.md` — overlap indicator reframed as a **power signal** (warn at high overlap); the comparison is described as isolating **disagreement**, not pure-segment rates; AI-decision-availability added as an explicit evaluation requirement; Business Impact competitive claim tightened from "parity" to a precise differentiator.
- `engineering-brief.md` — "AI decision availability at evaluation time + stable-assignment fallback on late scoring" promoted to a first-class open decision.
- `analysis.md` — competitive section and a short statistical-interpretation note kept consistent with this file.

---

## Sources

- Optimizely — [Holdback: Measure overall impact in Personalization](https://support.optimizely.com/hc/en-us/articles/27733899001741-Holdback-Measure-overall-impact-in-Personalization); [Segment your results](https://support.optimizely.com/hc/en-us/articles/4410289536653-Segment-your-results); [Personalization buyer's guide](https://www.optimizely.com/insights/latest-personalization-buyers-guide/)
- VWO — [Compare Multiple Segments](https://help.vwo.com/hc/en-us/articles/900002164826-Compare-Multiple-Segments-in-VWO); [Interpreting VWO Personalize Campaign Reports](https://help.vwo.com/hc/en-us/articles/7231108188185-Interpreting-VWO-Personalize-Campaign-Reports); [VWO Personalize](https://vwo.com/personalization/)
- AB Tasty — [EmotionsAI functioning](https://docs.abtasty.com/emotions-ai/first-steps-with-emotionsai/emotionsai-functioning); [EmotionsAI segments](https://www.abtasty.com/resources/emotions-ai-segments/); [Creating and managing segments](https://docs.abtasty.com/assets-library/creating-and-managing-segments)
- Adobe Target — [What is an Automated Personalization activity](https://experienceleague.adobe.com/en/docs/target/using/activities/automated-personalization/automated-personalization); [Automated Personalization summary reports (control vs targeted)](https://experienceleague.adobe.com/en/docs/target/using/reports/personalization-reports/reports-ap)
- Dynamic Yield — [A/B testing without segmentation](https://www.dynamicyield.com/lesson/ab-testing-without-segmentation/)
