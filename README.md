# 🛒 Nourish

A minimalist, mobile-first grocery planner tuned for Seoudi Market (Cairo). It keeps you inside budget while hitting calorie/protein targets, and it is IBS-friendly by default.

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

## ⚙️ Settings-first configuration

You no longer have to edit source files to update prices or targets. Open **Settings** (top right) to change:

- Budget per trip, trip length (days), daily calorie and protein targets.
- Staples buffer (cost, calories, protein) that always gets added into the math, plus an "auto-include staples" toggle.
- Market price overrides per item.

Profiles persist under `nourish_profile`, price overrides under `nourish_prices`, staples under `nourish_staples_v1`, and the cart under `nourish_cart_v3`.

If you prefer code-first defaults, edit `src/data.js` (`DEFAULT_CONFIG`, `STAPLES`, `CATEGORIES`) and hit **Reset to Nourish defaults** inside Settings to re-seed the UI.

## 📱 Usage Workflow

1. **Open the App:** Access the app on your phone while entering Seoudi.
2. **Select Modules:** Tap one item from each category (Protein, Breakfast, Produce, Gut Health).
3. **Check Stats:**

- **Green:** You are within budget and hitting nutritional goals.
- **Amber/Red:** You are under-eating (calories/protein) or over-spending.

4. **Checkout:** The "Meal Plan" section at the bottom tells you exactly how to prep these specific items for the next 3 days.

## 📝 Roadmap

- [ ] Quick import/export of Settings JSON.
- [ ] Offline-first install (PWA) polish.
- [ ] Basic analytics of spend vs macros over time.

## 📄 License

Unlicensed / Personal Use.
_Prices and availability based on Seoudi Market, Cairo (Jan 2026)._
