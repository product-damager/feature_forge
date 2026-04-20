# Statsig Layers and Referencing Explained

## 1. Why even reference the experiment? 

You asked a great question: *If the parameter already has a value, why bother referencing an experiment at all? Is it just for "taking control" and vision?*

**Yes, but it solves a massive engineering bottleneck.**

Imagine you want to test the `hero_text` on your homepage. 

**Without Parameter Stores:** A developer has to write custom code for your A/B test: *"If user is in Variation A, show text X. If Variation B, show text Y".* Creating the test requires coding. This is slow and frustrating for both sides.

**With Parameter Stores:** The developer writes code **once**: *"Always show whatever text the `hero_text` Parameter tells you to show."*
When you want to run an A/B test on that text, you don't need a developer anymore. You just go into the Statsig UI, build your experiment, and **reference** it to the `hero_text` parameter. 
- You instantly **take control** of that text.
- The parameter dynamically splits traffic between your variations.
- Your analytics dashboard perfectly tracks everyone who saw the text change.

It is literally the key to **starting an A/B test without writing a line of code.** The referencing is what transforms a static filing cabinet into a dynamic A/B testing engine without the developers having to lift a finger.

---

## 2. What is a "Layer" and how does it work?

### The Problem it solves:
Imagine you have two parameters on the homepage: `buy_button_color` and `buy_button_size`. 
You want to run an A/B test on the color (Red vs Blue) and *another* A/B test on the size (Big vs Small).
If an end-user randomly falls into the `Red` test AND the `Big` test simultaneously, the button might look terribly broken and your analytics data for the Color test will be polluted by the Size test's impact. 

**You need the experiments to be Mutually Exclusive.** (A user can only be in one experiment at a time).

### How Statsig does it:
Statsig invented **"Layers"**. 
A Layer is simply a mathematically protected "grouping" of parameters.
1. You create a Layer called `Homepage_Button_Tests`.
2. You place `buy_button_color` and `buy_button_size` *inside* this Layer.
3. You assign your experiments to the **Layer**, not the parameter directly.
The Layer mathematically guarantees that if 50% of your audience goes into the Color test, the *other* 50% of your audience goes to the Size test. They will never overlap. It's essentially a grouping mechanism for tests that touch the same code.

### How can we do it in Kameleoon?
Remember that feeling when Statsig documentation uses a fancy word for something simple?
Kameleoon already has a powerful built-in feature to solve this exact problem: **Mutually Exclusive Groups**. 

We don't necessarily need to invent a brand new "Layer" concept that confuses users. We can just leverage what Kameleoon already does well:
- If a PM wants to run two tests on the same Global Parameter (or related parameters), they simply add both experiments to the same **Mutually Exclusive group** in Kameleoon's existing dashboard!
- Kameleoon's engine handles the math, ensuring traffic is partitioned perfectly.

This gives us the exact same mathematical protection as Statsig's Layers, but uses a workflow and mental model our PMs already understand perfectly!
