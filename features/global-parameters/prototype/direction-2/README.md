# Direction 2 — parameter-first Global Parameters (built)

Settings-side Global Parameters, in the same place and shell as Direction 1 (alongside *Approvals settings* and *Holdouts*), expressing the **parameter-first** model with a minimal dashboard and a focused source editor:

- The **parameter is the primary object** the app reads (e.g. `hero_bird_img`, `promo.discount_rate`).
- A parameter's value comes from a **source**: a **Static value**, or a **Feature Flag variable**.
- For a flag-variable source you pick a flag in the parameter's **project**, then a variable of the **same type** as the parameter; the parameter resolves to that variable's value — decoupled from code, re-sourceable centrally.

## Open it
Open `index.html` directly, or from the prototypes landing at `../index.html`. Static files, no build step, mock data only — a reload resets state.

## Demo path
1. Open the minimal dashboard — Name · Project · Type · Current value · Source · Updated; hover a row for **Edit / Delete**.
2. Open `hero_bird_img` → source type is **Feature Flag variable**, mapped to a variable on a flag in its project.
3. Switch the source between **Static value** and **Feature Flag variable**. For the flag source, note the flag list is **project-filtered** and the variable list is **type-filtered**; the effective value preview updates live. **Save** → the dashboard's current value + source update.

Files: `index.html`, `styles.css`, `app.js`.
