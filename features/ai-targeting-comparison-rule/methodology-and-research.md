# **Methodology & Competitive Research — AI Targeting Comparison Rule**

## **Purpose**

Background document for the AI Targeting Comparison rule. It records the thoughts about methodological basis for the design, the competitive context, and the assumptions that must hold for results to be trustworthy.

## **Scope**

* Validity of the question the rule answers.  
* How competing platforms address the adjacent needs.  
* What the comparison measures, and how results must be interpreted.  
* The decision-time availability requirement for AI scoring.  
* Implications carried back into the main spec doc.

## **1\. Validity of the comparison**

The rule answers a major question: does AI-driven targeting select better-converting visitors than a hand-built definition, given the same content?  
The segment-based experimentation, an established pattern in SEO and other marketing branches, is valid under condition — segments and hypotheses are defined before the test runs, with sufficient sample per segment. \[[hcl report](https://help.hcl-software.com/commerce/9.1.0/management-center/tasks/tsbexctsegment.html)\] 

Slicing a broad test into segments after the fact is acceptable for exploration but is weaker evidence than a comparison designed around the segments from the start. (Some vendors frame result segmentation as exploration, not decision-making.) 

The new rule predefines exactly two audiences and holds content constant. It is a designed comparison, not post-hoc slicing, which is the basis for treating its output as decision-grade.

## **2\. Competitive landscape**

No major platform exposes "two targeting definitions, one content, head-to-head" as a first-class setup. Competitors address the adjacent need in two ways: segment targeting (who sees it) plus segment comparison in reporting (how each segment reacted), and AI applied to content selection measured against a control.

| Vendor | Adjacent capability | Gap |
| ----- | ----- | ----- |
| Optimizely | AI-surfaced audiences; automatic Holdback (default \~5% see the original) and global holdouts; "Segment your results" for post-hoc slicing. | No single rule comparing an AI targeting definition against a manual one on the same content. Holdback compares personalization vs no personalization, not targeting method vs targeting method. |
| VWO | ML personalization; Holdback control group; Compare Multiple Segments in reporting. | Same gap. Segment comparison is post-hoc slicing in the report, not a designed, pre-registered comparison over one fixed content. |
| AB Tasty | EmotionsAI psychographic AI segments; multi-experience personalization (one experience per segment). | No deduplicated, single-rule AI-vs-manual comparison. Separate experiences are run and reconciled in analytics. |
| Adobe Target | Auto-Target / Automated Personalization measured against a control group; reporting compares the model vs random-serve. | Compares the model's experience selection to a control, not an AI audience definition against a manual one on a fixed experience. Possibly they can compare segments (no interface found, but they talk about it). https://experienceleague.adobe.com/en/docs/target/using/reports/personalization-reports/reports-ap |

Two conclusions:

1. Competitors already validate AI against a control or holdback, as we can as well. Our rule serves a specific case they do not: two predefined targeting definitions, one content, one shared trigger, in a single queue-native rule.  
2. The competitors' norm is post-hoc "Compare Segments" in the results page — slicing a broad test after the fact. Our edge is that the two segments are pre-registered as a designed comparison over a fixed content and trigger, not discovered afterward. Like those tools, visitors in the overlap are counted in both segments (accepted double-counting); the difference is that our comparison is designed up front and the overlap is made explicit for interpretation rather than hidden.

## **3\. What should we measure**

Results interpretation must be reflected in the future results view.

Definitions: A = visitors the AI group qualifies; M = visitors the manual group qualifies; O = A ∩ M (the overlap).

Visitors in the overlap (O) are counted in **both** groups. This means a visitor who qualifies for both AI and manual targeting contributes to both group's conversion metrics. Double-counting is accepted as the intended behaviour.

Consequences:

* A group's conversion rate reflects all visitors that targeting definition qualifies — including those who also qualified for the other group. Results should be presented as a comparison between two targeting definitions, not as mutually exclusive populations.  
* The overlap inflates both groups' sample sizes and may introduce correlation between the groups' metrics. Results must make clear that groups are not independent when overlap is significant.  
* Statistical power and interpretation are influenced by how much the two groups share. A large overlap means both definitions are largely selecting the same visitors, making the comparison less informative — but the results remain valid as a head-to-head metric comparison, just showing that the manual selection is good enough to match AI targeting.

Design implications:

* The overlap indicator remains a useful signal for interpreting results. High overlap means the two targeting definitions largely agree on who to target; the measured difference in conversion rates reflects how those shared visitors responded to each path, not which visitors each method uniquely selected.  
* The results view should display group sizes (with overlap noted if possible) so readers understand the composition of each group.

## **4\. AI learner availability at decision time**

Primary risk is that AI-based segments are often evolved after the fact from accumulated signals (new AI learner data, evolving impressions, new visitor events or params). The AI verdict must exist at evaluation time for a visitor to count toward the AI group, which raises the question: what changes if the AI evolves, and does a visitor's group membership move with it?

Open questions for engineering:

* **Unscored visitor**. If the AI verdict is unavailable on a visit, the visitor does not match the AI segment (and still counts toward the manual group if that segment matches). Confirm this is acceptable and does not silently starve the AI group as the AI evolves.  
* **Late scoring vs stable attribution**. If the AI verdict arrives on a later visit and would change membership, re-attributing breaks a stable read, but never updating biases the AI group toward already-warm visitors. Possible route: membership is fixed at first qualifying evaluation; a visitor who only later becomes AI-eligible counts toward the AI group from that point, and reporting notes the cohort effect.  
* **Cold-start cohort bias**. First-time visitors may be under-represented in the AI group. Flag for results methodology so it is not misread as "AI converts worse", it is partially solved by design, displaying tags about learner readiness (Learning / No data / Weak badges)

If the AI condition cannot be evaluated reliably at decision time, group attribution weakens. Validate this assumption first.

One editor-time reliability gate, one results-time signal. These answer different questions and must not be collapsed into one:

* Learning state (editor-time gate) — does the AI side have enough data to trust (is the model trained, does the segment have signal)? The rule surfaces this from the AI Targeting visibility work (US 38057\) as a read-only badge, and it is the gate the user acts on before relying on the comparison.  
* Overlap (results-time signal) — how much do the two definitions agree on who to target? This is an interpretation aid in the results view, not a configuration-time validity gate: a high overlap does not invalidate the comparison, it means the manual definition largely matches the AI's selection. It is not shown in the editor, where measuring it reliably is not assumed feasible.

The comparison is most trustworthy when the learning state is "Good"; overlap then colours how the head-to-head result should be read rather than whether it is valid.