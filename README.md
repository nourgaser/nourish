# 🛒 Seoudi Planner

A minimalist, mobile-first web application designed to optimize weekly grocery runs at Seoudi Market (Cairo).

It replaces mental math and rigid meal plans with a **modular decision-making framework**. The app ensures you hit your caloric/protein targets (for weight gain) and stay within budget (EGP), while accommodating specific dietary restrictions (IBS-friendly, Lactose-free).

---

## 🎯 Goals & Logic

This tool solves the specific constraints of a busy Software Engineer/TA in Cairo:

1. **Budget Control:** Tracks a ~750 EGP bi-weekly limit (approx. 6,000 EGP/month total).
2. **Nutritional Targeting:** Calculates daily averages to ensure a surplus (~2,700 kcal) and high protein (~140g) for muscle recovery.
3. **IBS Guardrails:** Flags or filters items based on digestion sensitivity (e.g., Lactose-free options, peeling alerts).
4. **Modular Logic:** "Slot machine" style selection prevents menu fatigue by allowing safe swapping of proteins and carbs without breaking the macro/budget bank.

## 🛠 Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (via standard utility classes)
- **Icons:** Lucide React
- **Deployment:** Static (GitHub Pages / Vercel / Self-hosted Nginx)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/seoudi-planner.git
cd seoudi-planner

```

2. Install dependencies:

```bash
npm install
# Required libs: lucide-react clsx tailwind-merge

```

3. Run the development server:

```bash
npm run dev

```

4. Open `http://localhost:5173` on your phone or desktop.

## ⚙️ Configuration (`src/data.js`)

The core logic lives in `src/data.js`. This is where you adjust prices and nutritional data.

### 1. Global Settings

Adjust your macro targets and spending limits here.

```javascript
export const APP_CONFIG = {
  budgetLimit: 750, // EGP per trip (Twice a week)
  targetDailyCalories: 2700,
  targetDailyProtein: 140, // Grams
  tripDurationDays: 3.5, // Calculations based on half-week cycles
};
```

### 2. Pantry Staples

Items bought monthly (Rice, Oil, Honey) are defined here. Their _cost_ is excluded from the daily trip calculator, but their _calories_ are added to the daily average to give a realistic nutritional picture.

### 3. Categories & Items

To update the price of Chicken or add a new meal option, add an object to the `CATEGORIES` array:

```javascript
{
  id: "new_item",
  name: "New Item Name",
  price: 150,       // Current price in EGP
  calories: 500,    // Total calories for the PURCHASED UNIT
  protein: 30,      // Total protein for the PURCHASED UNIT
  ibsNote: "Warning or Safe note",
  mealIdea: "Quick cooking instruction"
}

```

## 📱 Usage Workflow

1. **Open the App:** Access the app on your phone while entering Seoudi.
2. **Select Modules:** Tap one item from each category (Protein, Breakfast, Produce, Gut Health).
3. **Check Stats:**

- **Green:** You are within budget and hitting nutritional goals.
- **Amber/Red:** You are under-eating (calories/protein) or over-spending.

4. **Checkout:** The "Meal Plan" section at the bottom tells you exactly how to prep these specific items for the next 3 days.

## 📝 Roadmap

- [ ] Add a "Staples Low" toggle to include Rice/Oil cost in the current trip if running out.
- [ ] Dark mode support.
- [ ] Persist selections to `localStorage`.

## 📄 License

Unlicensed / Personal Use.
_Prices and availability based on Seoudi Market, Cairo (Jan 2026)._
