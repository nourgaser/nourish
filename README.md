# Nourish

Nourish is a mobile-first grocery planning assistant that keeps short grocery runs on budget while meeting calorie and protein targets. It is local-first, offline-capable, and built for quick decision making on the go.

---

## Features

- Budget and macro guardrails with a live advisor for cost, daily calories, and protein.
- Modular selection across Protein Base, Breakfast & Carbs, Fresh & Vitality, and Gut Shield categories with minimums per category.
- Configurable defaults via Settings for budget, macro targets, trip length, staples buffer, and per-item price overrides.
- Local-first persistence: profile, cart, staples, categories, prices, and theme are stored in `localStorage` and can be reset to defaults at any time.
- PWA-ready with light/dark themes for a friendly, installable offline experience.

## Tech Stack

- React 18 + Vite
- Tailwind CSS utility-first styling
- lucide-react icon set
- Vite PWA plugin with Workbox runtime caching

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/nourgaser/nourish.git
cd nourish
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. For a production-like test, build and preview:

```bash
npm run build && npm run preview
```

## Usage

- Complete onboarding to set budget, macro targets, trip duration, and whether staples are auto-included.
- Select items across categories; the stats cards and advisor banner keep you inside budget and macro guardrails.
- Toggle staples when you need to restock pantry basics.
- Open Settings (top right) to update budget/targets, trip length, staples, price overrides, and categories; you can reset to defaults at any time.
- Data is stored under `nourish_profile`, `nourish_prices`, `nourish_staples_v1`, `nourish_categories_v1`, `nourish_cart_v3`, and `nourish_theme`. Use **Reset to Nourish defaults** to clear local state.

For code-first defaults, edit [src/data.js](src/data.js) (`DEFAULT_CONFIG`, `STAPLES`, `DEFAULT_CATEGORIES`).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — create a production build
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

## PWA & Offline

- Install by opening the app over HTTPS and using your browser's install prompt or "Add to Home Screen." The manifest and icons are bundled.
- The service worker caches pages, scripts, styles, and images so the planner loads offline; data stays local in `localStorage`.
- Updates are picked up automatically; refresh to apply the latest service worker.

## Roadmap

- Import/export of Settings JSON
- Additional presets for markets and dietary profiles
- Spend vs macro summaries over time

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting a pull request.

## License

MIT. Add or update the LICENSE file if you plan to distribute under a different license.

## Disclaimer

This project was created by Nour Gaser while trying various generative AI tools; 99% of the code is AI generated and I take no credit for it. It is provided as-is without warranty. Always verify nutritional and pricing information independently before making purchasing decisions.
