# AI Product System – Kameleoon

## 1. Purpose

This repository is an AI-assisted product discovery and prototyping system for a PM (me mainly) from Kameleoon.

It is designed to:
- generate product ideas grounded in real UX and market constraints
- structure discovery work in a consistent format
- benchmark competitor approaches
- produce implementation-ready feature specs
- generate UI prototypes aligned with Kameleoon’s product model

This system is NOT a brainstorming tool.
It is a product-grade decision and design system.

---

## 2. Core Principles

### 2.1 Product truth over creativity
All outputs must be anchored in:
- real user workflows
- existing Kameleoon product structure
- competitor patterns
- implementation feasibility

### 2.2 Opinionated structure
Every output MUST follow structured thinking:
- problem
- insight
- solution
- UX impact
- business impact

No exceptions.

### 2.3 Kameleoon alignment
All ideas must align with:
- experiments-based mental model
- segmentation logic
- goals and tracking systems
- editor-centric workflows

---

## 3. AI Thinking Protocol

Before generating any output, the AI must:

1. Identify user intent (what is being improved?)
2. Identify product area (editor, targeting, reporting, goals, etc.)
3. Anchor in Kameleoon mental model
4. Identify UX constraints and risks
5. Benchmark relevant competitor patterns (if applicable)
6. Propose structured solution
7. Ensure implementation feasibility (≤2 sprints for prototype scope)

---

## 4. Output Rules

All outputs must include:

- User problem
- Insight (why this problem exists)
- Proposed solution
- UX implications (UI behavior, layout, flows)
- Expected business impact
- Open questions / risks

Vague ideas are forbidden.

---

## 5. Prototyping Rules

When UI is produced:
- must reflect Kameleoon UI density
- must use panel-based architecture
- must prioritize functional UI over visual design
- must avoid consumer-style interfaces
- must reflect real editor / dashboard patterns

Anti-patterns:
- Notion-style UI
- marketing-heavy visuals
- unnecessary animations
- chat-first interfaces as primary UX

---

## 6. Feature Structure Enforcement

Every feature MUST follow:

/features/<feature-name>/
  README.md
  analysis.md
  spec.md
  prototype/

No deviation allowed.

---

## 7. Decision Standard

A feature is considered valid only if:
- it improves a real workflow
- it fits Kameleoon’s mental model
- it is implementable within reasonable engineering effort

## 8. Discovery Standard

All feature analysis MUST follow the structure defined in:

/docs/discovery-template.md

Each feature analysis must:
- include all sections
- demonstrate structured reasoning
- include competitor benchmarking when relevant
- include explicit UX critique

The level of depth must match or exceed existing high-quality examples.

## 9. Engineering Alignment Layer

For features with architectural implications, an additional file is required:

engineering-brief.md

This document:
- prepares discussions with engineering leadership
- frames technical trade-offs
- proposes solution directions

It must follow:
/docs/engineering-brief-template.md

## 10. Feature Initialization Rule

All new features must be created from:

/features/_template/

No feature can be created without following this structure.