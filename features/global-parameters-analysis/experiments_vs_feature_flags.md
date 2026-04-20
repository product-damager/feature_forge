# Architectural Crossroad: Experiments vs Feature Flags

You just hit the exact underlying architectural challenge that separates Kameleoon from Statsig today! Your intuition as a PM is spot on.

## The Current State of Kameleoon
In Kameleoon Feature Experimentation, **the Feature Flag is the center of the universe**. 
If you want to test anything, you *must* create a Feature Flag. A developer *must* implement that specific flag in code (`kameleoon.getVariation("my_flag")`). Variables only exist *captured inside* that specific flag.

## How Statsig Differs
In Statsig, **Feature Gates**, **Experiments**, and **Parameter Stores** are three entirely separate, equal entities. 
- A developer can choose to call a Feature Gate. 
- OR, they can call an Experiment directly.
- OR, they can call a Parameter Store directly. 
Because they are decoupled, a PM can attach a pure experiment to a Parameter Store, and the developer's code just dynamically works.

## How should Kameleoon deal with this?

If we introduce Global Parameters, we face a major architectural crossroad with two paths forward:

### Path 1: The "Dummy Flag" Workaround (Lower Backend Effort, High UX Friction)
We keep the Feature Flag as the center of the universe. 
- You create your Global Parameter (`global_discount = 20%`).
- To A/B test it, a PM must create a brand new Feature Flag (e.g., `test_discount_flag`).
- You configure a variable inside that flag and link it to the Global Parameter. You run your experiment *inside* the flag.
- **The fatal flaw:** The developer still has to write new code to call `kameleoon.getVariation("test_discount_flag")`. This completely kills the "no-code A/B test" magic that makes Statsig so attractive.

### Path 2: Introduce "Pure Experiments" (High Backend Effort, Gold Standard UX)
You guessed it exactly: we would need to introduce the concept of a **"Pure Experiment"** (or "Parameter Experiment") in the dashboard that exists *outside* of a Feature Flag.
- The Developer writes code once: `kameleoon.getGlobalParameter("global_discount")`.
- *In the UI*, the PM creates an Experiment and attaches it directly to the Global Parameter (no Feature Flags are involved!).
- When the app asks for the parameter, the Kameleoon engine evaluates the "Pure Experiment" under the hood, splits the traffic, tracks analytics, and returns the variation value (e.g., `30%`).

### Product Recommendation
If our strategic goal is to match Statsig and allow PMs to truly run configuration tests without bothering developers to push code, **Path 2 is mandatory**. 

We would need to evolve Kameleoon's mental model:
- **Feature Flags** = Turning large blocks of code ON or OFF.
- **Global Parameters** = Modifying text, colors, numbers, and configurations.
- **Experiments** = A tool that can be applied to *either* a Flag or a Parameter to test variations.
