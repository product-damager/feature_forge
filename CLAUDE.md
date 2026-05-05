# Agent Instructions

This file is a lightweight execution guide for AI coding agents working in this repository.

## Source of truth

Always treat these files as authoritative, in this order:

1. `/AI_PRODUCT_SYSTEM.md`
2. files in `/docs/`
3. files in target feature folder under `/features/<feature-name>/`

Do not duplicate or override product rules from these files unless explicitly instructed.

## Repository purpose

This is a prototyping-first product discovery repository for Kameleoon.

The goal is to help transform product ideas into:
- structured product analysis
- implementation-oriented specs
- lightweight stakeholder-playable prototypes
- future developer handoff material

This repository is not a production application codebase.

## Working mode

Default to:
- frontend-first
- GitHub Pages-compatible outputs
- minimal architecture
- realistic product logic
- scoped changes inside the target feature folder

Prefer simple HTML/CSS/JS prototypes unless the task explicitly requires something else.

## Product and UX constraints

All work must align with Kameleoon's product model.

Try to preserve unless specified otherwise:
- dense and information-rich interfaces
- panel-based layouts
- explicit logic and visibility of behavior
- editor-centric and decision-centric workflows

Avoid:
- consumer-style UI
- marketing-style landing page design
- unnecessary animation
- chat-first UX as the primary interface
- invented backend complexity

## Feature folder contract

Every feature should follow:

`/features/<feature-name>/`
- `README.md`
- `analysis.md`
- `spec.md`
- `prototype/`

Only add `engineering-brief.md` when technical trade-offs or engineering alignment are genuinely needed.

## How to execute a task

When asked to work on a feature:

1. Read the source-of-truth files first.
2. Inspect the existing feature folder before proposing changes.
3. Reuse and improve strong existing material instead of rewriting everything.
4. Keep the scope minimal and practical.
5. Update documentation and prototype together when relevant.
6. State assumptions clearly when information is missing.
7. Keep outputs directly usable by PMs, stakeholders, and future developers.

## Default deliverables

Unless instructed otherwise, produce only the files that are actually needed from this list:
- updated `README.md`
- updated `analysis.md`
- updated `spec.md`
- updated prototype files inside `prototype/`
- optional `engineering-brief.md`

Do not create extra documents without a clear reason.

## Prototype rules

Prototype outputs should:
- run as static files
- work on GitHub Pages
- use mock data if needed
- include enough JS logic to make the concept believable
- optimize for stakeholder understanding, not technical completeness

## Spec rules

Specs should be concise, explicit, and implementation-oriented.

At minimum, include:
- problem
- insight
- proposed solution
- UX implications
- business impact
- risks or open questions
- acceptance criteria
- clear prototype scope

## Decision policy

If something is ambiguous:
- choose the simplest implementation that demonstrates the idea faithfully
- avoid adding backend or infrastructure by default
- prefer clarity over completeness
- preserve alignment with existing repo structure and Kameleoon mental models

## Response style

When completing a task, return:
1. a short plan
2. files changed
3. key decisions made
4. assumptions or open questions
