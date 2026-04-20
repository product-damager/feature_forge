# Kameleoon Product Context (Extended Scope)

## 1. Product Scope

Kameleoon is a unified decisioning platform enabling:

- Web Personalization
- Web Experimentation (A/B testing)
- Code-based Experiments
- Feature Flags & Progressive Delivery
- Code-based Widgets (Assets)

These systems share infrastructure but differ in:
- evaluation logic
- output types
- user workflows

The platform’s purpose is to control what users experience, safely, dynamically, and at scale.

---

## 2. Core Mental Model

Kameleoon operates as a decision engine where users define:

- WHO → targeting (segments, attributes)
- WHEN → triggering conditions (URL, events, context)
- WHAT → output (varies by feature type)
- DISTRIBUTION → how users are allocated or exposed

These dimensions are not implemented uniformly across all product pillars.

---

## 3. Product Pillars

### 3.1 Personalizations

Goal: Deliver targeted experiences using visual and/or code-based approaches.

#### Key Characteristics

- A single personalization can include:
  - visual editor changes
  - custom code
  - widget injections
- Multiple rules can exist within one personalization
- Each rule can serve different content types
- Content is not tied to a single editor

#### Variation Creation (PBX)

- PBX (AI-based builder) can generate variations
- Works across visual and code contexts
- Accelerates creation but does not affect evaluation logic

#### Evaluation Model

- Rules are evaluated based on targeting conditions
- Exposure follows an allocation model
- Multiple rules may apply depending on configuration
- Evaluation is not strictly sequential

Important:
- Evaluation is more flexible than feature flags
- Requires clarity on exposure and interaction between rules

---

### 3.2 Web Experiments

Goal: Measure the impact of variations.

#### Key Characteristics

- Variations can be:
  - visual (editor-based)
  - code-based
- Users are bucketed into variations
- Results are statistically analyzed

#### Variation Creation (PBX)

- PBX can generate experiment variations
- Reduces time to create and iterate on variations
- Does not affect traffic allocation or statistical evaluation

#### Evaluation Model

- Traffic is split between variations
- Deterministic bucketing per user
- One variation per user per experiment

---

### 3.3 Code-based Experiments

Goal: Provide full developer control over variation logic.

#### Key Characteristics

- Variations are defined entirely in code
- No visual abstraction layer
- Integrated with the experimentation engine

---

### 3.4 Feature Flags and Rollout Planner

Goal: Control feature release and exposure in production environments.

#### Key Characteristics

- Variables define feature configuration
- Variations define feature states
- Evaluated via SDKs
- Supports multiple environments (development, staging, production)

#### Evaluation Model

- Strict top-to-bottom rule evaluation
- The first matching rule is applied
- If no rule matches, a fallback is used

#### Rule Types

- Targeted delivery
- Progressive rollout
- Feature experiments

Mental model:
A deterministic decision tree.

---

### 3.5 Code-based Widgets (Assets)

Goal: Provide reusable UI and logic components across experiences.

#### Core Model

Widgets are composed of two layers:

##### 1. Code to Run (Template Layer)

- Implemented in JavaScript, CSS, and HTML
- Defines:
  - UI structure
  - behavior and logic
  - configurable variables

This layer acts as the source template.

##### 2. Configuration Form (Instance Layer)

- Implemented in HTML and CSS
- Used when adding the widget to an experience
- Allows customization of:
  - text
  - size
  - styling
  - dynamic values

This layer acts as runtime configuration.

#### Key Characteristics

- Widgets are reusable across:
  - personalizations
  - experiments
- Clear separation between:
  - developer-defined logic
  - user-defined configuration

#### Mental Model

Widget = Template + Configurable Instance

#### Constraints

- Configuration must map to predefined variables
- No arbitrary runtime logic from the UI layer
- Must remain predictable when injected into experiences

---

## 4. Output Model (WHAT)

The output depends on the feature type:

### Personalizations
- UI changes (visual editor)
- custom code execution
- widget injection

### Experiments
- variation assignment (visual or code)

### Feature Flags
- flag state (on/off)
- variable values

### Widgets
- reusable UI or logic instances (template + configuration)

There is no single unified output type across the platform.

---

## 5. Distribution and Exposure Models

### Personalizations
- Allocation-based exposure
- Multiple rules can interact
- Evaluation is not strictly sequential

### Experiments
- Percentage-based traffic split
- Deterministic bucketing

### Feature Flags
- Rule-based distribution
- Strict sequential evaluation

---

## 6. UI Architecture Principles

- Dense and information-rich interfaces
- Structured and deterministic layouts
- Panel-based interactions
- Minimal visual decoration
- Evaluation logic must remain visible and understandable

---

## 7. Core Layout Patterns

### Main View
- Overview of rules, experiments, or variations

### Right Panel
- Configuration of the selected item

### Modal
- Used for quick edits only

---

### Editors

#### Visual Editor
- DOM-based manipulation
- Used in personalizations and experiments

#### Code Editor
- Used for:
  - code-based experiments
  - widgets
  - advanced personalization logic

---

## 8. Key Interaction Model

- Selection defines context
- Context defines configuration
- Configuration defines decision logic

---

## 9. UX Constraints

- Must support both marketers and developers
- Must handle complex rule systems
- Must clearly communicate evaluation logic
- Must not hide critical behavior
- Must scale from simple to advanced use cases

---

## 10. Anti-Patterns

Avoid:

- Oversimplifying evaluation logic
- Treating all features as purely identical systems
- Hiding differences between:
  - personalizations
  - experiments
  - feature flags

- Consumer-style UI patterns (e.g., Notion or Airtable-like abstractions)
- Chat-first interfaces as the primary UX
- Abstract dashboards without actionable structure

---

## 11. Design Philosophy

Kameleoon prioritizes:

- Explicit logic over implicit behavior
- Control over automation
- Transparency over abstraction
- Flexibility for advanced use cases