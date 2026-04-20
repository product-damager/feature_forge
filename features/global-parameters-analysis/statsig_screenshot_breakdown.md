# Breakdown of Statsig Screenshots

Based on the screenshots you shared from Statsig, here is exactly how their UI works under the hood for a PM.

## 1. "What does it mean that I reference it to the experiment?"

Look at **Screenshot 3** (The Modal). Here, you are editing a single Global Parameter called `hero_bird_img`. 

By changing the **Reference Type** to `Experiment`, you are telling this parameter:
> *"Stop using a basic, static string. Instead, wait until the user opens the app, go ask the specific Experiment (chosen in the drop-down) what the value should be, and return that."*

## 2. "Is the value from the experiment used as the value of the parameter? Or vice versa? Which variation?"

Yes, **the value from the experiment** is used as the value of the parameter.

Here is the exact flow:
1. First, inside Statsig's **Experiment** tab, you create an A/B test (e.g., `Bird Image Test`).
2. Inside that experiment, you create a variable called `bird_file` for Variation A (`blue_bird.jpg`) and Variation B (`red_bird.jpg`).
3. Now, you go to your **Parameter Store** (Screenshot 3). 
   - Under **Experiment ID**, you select `Bird Image Test`.
   - Under **Parameter**, you select the `bird_file` variable you created inside the experiment. *(In your screenshot, it says "This experiment has no parameters of type string" because the experiment you selected hasn't had any string variables defined inside it yet!)*

**Which variation?**
It depends entirely on the end-user! When a user opens the app, the Statsig SDK determines if they belong in Variation A or Variation B of that experiment. It then grabs the correct image URL and spits it out through the `hero_bird_img` parameter.

## 3. "Can I reference 2 experiments at the same time?"

For a single parameter row inside a Store, **No, not directly.** 

If `hero_bird_img` is mapped to Experiment 1 (testing a blue bird), it cannot *simultaneously* be mapped to Experiment 2 (testing a red bird vs a green bird). 

Why? Because if a single user mathematically fell into *both* experiments at the same time, the system would crash trying to figure out which bird image they should actually see!

**How do they run multiple experiments on the same component then?**
If Statsig users want to run multiple, complex, back-to-back experiments touching the exact same parameters, they use a different **Reference Type** called a **"Layer"**. A Layer guarantees that experiments are mutually exclusive (a user can only be in one experiment at a time touching that specific parameter), preventing dangerous overlaps. 

Alternatively, the easiest approach is:
1. Map parameter to Experiment 1.
2. Run test.
3. Find winner.
4. Update the Parameter's static default value to the winner.
5. Disconnect Experiment 1.
6. Create Experiment 2 and map the parameter to *it* now.
