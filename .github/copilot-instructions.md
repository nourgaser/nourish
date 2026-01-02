# Instructions for AI Assistant (Project Handover)

## 1. User Context (The "Client")
* **Name:** Nour Gaser
* **Profile:** Software Engineer (Fullstack) & Teaching Assistant (CS) in Cairo, Egypt.
* **Interests:** Game Development (Unity, Pixel Art), Linux (Fedora), Open Source, Self-hosting.
* **Health Constraints:** * **IBS:** Avoids garlic/onion bulbs, needs low FODMAP options (e.g., Lactose-free milk/yogurt).
    * **Physical Goal:** Currently underweight (180cm/65kg). Needs ~2700 kcal/day + High Protein (140g+) to combat physical weakness.
* **Shopping Habits:** Shops twice a week at **Seoudi Market**. Budget is ~5,000–6,000 EGP/month (~750 EGP per trip).
* **Aesthetic Preference:** Clean, minimal, "productized" feel. Likely prefers Dark Mode (given Linux/Dev background).

## 2. Project Overview: `seoudi-planner`
This is a **mobile-first web application** built with **Vite + React**. 
It is a decision-making tool for grocery shopping, replacing a static list with a "Modular Slot Machine" approach.

### Core Logic (Already Implemented)
* **Modules:** The user picks 1 item from 4 categories (Protein, Breakfast, Produce, Gut Health).
* **Math:** The app calculates if the selection hits the **Macro Goals** (Calories/Protein) and stays within **Budget Limit**.
* **Staples Buffer:** It assumes the user has Rice/Oil/Honey at home and adds those calories to the daily average automatically.

## 3. Current Tech Stack
* **Framework:** React 18 (Vite)
* **Styling:** Tailwind CSS (clsx, tailwind-merge)
* **Icons:** Lucide React
* **State:** Local React State (currently ephemeral)

## 4. Immediate Goals (Your Task List)
The user wants to **polish, brand, and "productize"** this MVP.

### A. Branding & Identity
1.  **De-brand the Name:** Change the app title from "Seoudi Planner" to something personal but professional (e.g., **"Gaser's Kitchen"**, **"Nourish"**, or **"Pixel Pantry"**).
    * *Note:* Keep "Seoudi Market Prices" only as a subtle data source footnote.
2.  **Logo Creation:** Create a simple, geometric **SVG Logo** component. 
    * *Style Reference:* User mentioned `nourgaser.com`. Since he is a Game Dev/Engineer, think **Minimalist, Geometric, or 8-bit/Pixel Art** subtle touches.
    * *Idea:* A pixelated apple, or a code bracket `{ }` containing a leaf/fork.
3.  **Visual Polish:**
    * Implement a clean **Dark Mode** (Slate/Zinc palette).
    * Use a modern font stack (Inter or System UI).

### B. Functional Polish
1.  **Refine the UI:** Make the "Selected" state pop more (e.g., distinct borders or subtle glow).
2.  **Empty States:** Ensure the app looks good before any selection is made.
3.  **Responsive:** Ensure tap targets are large enough for mobile use while walking in the supermarket.

## 5. Files to Touch
* `src/data.js` -> Update the App Title configuration.
* `src/App.jsx` -> Apply the new design/layout and SVG Logo.
* `README.md` -> Update with new branding.

---
*End of Instructions*