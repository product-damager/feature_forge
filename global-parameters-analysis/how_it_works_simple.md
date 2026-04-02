# How It Works: Global Parameters (A Simple Guide)

## The Analogy: The Restaurant Promo

Imagine you run a restaurant chain and want to launch a "Summer Promo" where all desserts have a **20% discount**. You need this promo to appear on your Website, your iOS App, and your Android App.

---

### 🛑 How Kameleoon Does It Today (The Hard Way)

In Kameleoon, configuration variables (like the discount percentage) are locked **inside** individual Feature Flags.

1. You build a Feature Flag for the Website and type the variable: `discount = 20`.
2. You build another Feature Flag for iOS and type: `discount = 20`.
3. You build a third Feature Flag for Android and type: `discount = 20`.

**The Problem:** 
What if you decide to increase the discount to **25%**? 
You have to manually open 3 different flags, find the exact variable, and change it 3 times. If you forget to update the Android flag, those users only get 20% off. It requires too much memory and repetitive work.

---

### ✅ How Statsig Does It (The Smart Way)

Statsig solves this using something they call **"Parameter Stores."** Think of a Parameter Store as a central filing cabinet.

1. **Create the Store:** You create a central cabinet named `Promo_Configs`.
2. **Define the Value Once:** Inside, you create one variable: `discount = 20`.
3. **Connect the Code:** The Website, iOS, and Android apps are coded to just say, *"Hey Statsig, look inside `Promo_Configs` and tell me what the discount is."*

**The Magic:**
If you want to change the discount to 25%, you just change it **once** in the central cabinet. All three platforms instantly get the new value. You didn't have to touch any individual feature flags. 

*Bonus:* If Statsig users *do* want to run an A/B test (e.g., 20% vs 25% discount), they can tell that central variable to take its value from a specific Experiment. But the baseline is always that central cabinet.

---

### 🚀 How It Could Work in Kameleoon

To make Kameleoon even better than Statsig for PMs, we could build a **Global Parameter Hub**. Here is how you would use it:

1. **The Hub:** We give you a new tab in the dashboard called "Global Parameters" (your central cabinet).
2. **Create Once:** You go there and create a variable: `BlackFriday_Discount = 30%`.
3. **Link It Up:** Whenever you are building a Feature Flag, instead of manually typing a variable value from scratch, you click a new button called **"Link to Global Parameter"** and pick `BlackFriday_Discount`.
4. **Update Everywhere:** If you ever change the global value to 40% in the Hub, *every single feature flag* linked to it updates automatically.

**Why is this better for us?**
- **Zero Duplication:** You write it once, and reuse it everywhere.
- **Safety Guarantee:** You never have to worry about iOS and Web showing different prices by accident.
- **Kameleoon's Advantage:** Unlike Statsig (which can get confusing), Kameleoon could show you a list right next to the variable saying: *"Attention: Changing this to 40% will affect the iOS Promo Flag and the Web Promo Flag."* so you always know exactly what you are modifying.

---

### 🔬 How Does This Connect to Experiments?

A huge question for PMs is: *“If I use a Global Parameter, how do I track A/B test results?”*

**The Golden Rule: Parameters don’t run tests; Experiments do.** 

Here is how the connection works conceptually:
1. **The Setup:** You have a Global Parameter called `buy_button_color`. Its baseline value is `blue`.
2. **The Experiment:** You decide to test `blue` vs `red`. You create a new A/B Experiment in Kameleoon. 
3. **The Connection:** Inside that Experiment, you tell Kameleoon: *"For this test, take control of the Global Parameter `buy_button_color`."* You set Variation A to `blue`, and Variation B to `red`.

**What happens to the user?**
When the app asks the system for the `buy_button_color`, Kameleoon says: *"Wait, this user is in the active A/B Experiment!"* It assigns them to Variation B (`red`). 
Because the user got their value *through* the Experiment, Kameleoon automatically logs them as a participant in that specific A/B test. All your results, conversions, and revenue are tracked perfectly on the Experiment's reporting page.

**What if I reference a value from *another* experiment?** (e.g., Flag 1 tries to copy what's happening in Flag 2)
This is actually the **danger zone** of the old way of doing things. If a user just randomly sees the `red` button because a separate piece of code copied it, but they were never *officially enrolled* in the original `buy_button_color` A/B experiment, your data will be ruined. 
This is why Global Parameters are so powerful: they act as a neutral "baseline" or central source of truth. Features and Experiments can temporarily *take control* of that truth, ensuring attribution and analytics are always clean and tied directly to the formal experiment that triggered the change.

---

### 🤔 What does it *actually* mean to link a Parameter to an Experiment?

If you ran an A/B test on `discount_rate` (20% vs 30%), here is exactly what the "link" means in practice.

**1. During the Test (The Temporary Link):**
When Statsig says you "remap" or "link" a Parameter to an Experiment, you are telling the Global Parameter: *"Stop giving everyone the default 20%. Instead, act as a proxy for this A/B Experiment."* 
Now, when the Website asks for a discount, the Parameter routes that request to the Experiment, which decides if the user gets 20% or 30%, and tracks the analytics.

**2. After the Test (Rolling out the Winner):**
Let's say Variation B (30%) wins! Do you just leave the Experiment running forever? **No**. 
Leaving old experiments active forever is terrible for performance and generates technical debt.

Instead, doing it the *smart* way:
1. You disconnect the Parameter from the Experiment.
2. You go into your Global Parameter Hub and permanently change the base static value from **20%** to **30%**.
3. You archive the Experiment.

**The Result:** Now *everyone* gets the 30% winning discount across all platforms. You didn't have to rewrite any code, and you didn't have to clean up 15 different feature flags to execute the winner. You just updated the central cabinet value, and turned the test off. That's the ultimate superpower of Parameter Stores.
