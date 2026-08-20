// src/data.js
//
// IMPORTANT — do not add numbers here that weren't derived from a real
// source. per100g composition and defaultPrice are left `null` throughout
// this catalog on purpose: the old data had macros wrong by 30-40% because
// they were hand-typed per pack with no derivation. Real per-100g figures
// (from a food composition table) and real prices (from a market scrape)
// get filled in separately, item by item. Everything else in this file —
// pack geometry, shelf life, cook effort, meal slot, FODMAP class — is
// either a direct unit conversion of the existing label or well-established
// public reference data (USDA cold-storage guidance, Monash FODMAP
// classifications), not a guess, and is called out inline where the
// reasoning isn't obvious.
//
// edibleFraction defaults to 1.0 (pack weight = edible weight) everywhere.
// That's exactly right for boneless/fillet/canned/dry goods, but is a
// placeholder for whole produce with real waste (banana peel, apple core,
// citrus peel) — those need a real refuse-table value filled in alongside
// the macro re-entry, not guessed here. Flagged per item below.

import { emptyPer100g } from "./nutrition";

// Static app metadata — not user data, never edited in Settings. Exists so
// a config export is self-describing: paste it to an LLM or a dietitian
// with zero prior context and they can tell what they're looking at.
export const APP_INFO = {
  name: "Nourish",
  description:
    "A mobile-first grocery planner that keeps a shopping trip inside a budget while hitting nutrition targets. Local-first, single-user PWA — this export is the entire app's state; there is no account or server copy.",
  repo: "https://github.com/nourgaser/nourish",
  philosophy:
    "Decision support, not autopilot: the app enforces arithmetic (budget, macros, module minimums) and leaves food choice to the user. It would rather show '—' than a confident-looking wrong number — every nutrient/price is null until a real source backs it, and nulls propagate through all math instead of silently becoming zero. Bias is toward bulk, sustainable variety over precision-tracking a single day: modules set a *range* of acceptable picks (a floor/ceiling, a module minimum) rather than prescribing one 'optimal' basket, and staples are treated as a rough daily baseline rather than something to micromanage per trip.",
  customization:
    "Everything above — targets, personal context, module descriptions/notes, item data — is meant to be edited over time, including by handing the Backup tab's JSON export to an LLM or a dietitian and asking them to propose changes (new/removed modules, different targets, tag or FODMAP corrections), then pasting their revised JSON back in via Import. The `personal`, `dietNotes`, and per-module `description`/`notes` fields exist specifically to make that round trip possible without re-explaining context from scratch each time.",
};

// Biometric/context fields the app's own logic never reads — they exist so
// this profile is self-contained when handed to an LLM or a real dietitian
// for review: without them, "protein floor 130g" has no anchor to a real
// person and can't be sanity-checked or meaningfully revised. All null by
// default; only the user should ever fill these in. `activityLevel` and
// `goal` are free text by convention (e.g. "sedentary/light/moderate/very
// active", "lean bulk/maintenance/cut") rather than an enforced enum, since
// nothing in the app parses them.
export const DEFAULT_PERSONAL = {
  age: null,
  sex: null,
  heightCm: null,
  weightKg: null,
  activityLevel: null,
  goal: null,
};

export const DEFAULT_TARGETS = {
  kcal: { target: 2700, floor: 2500, ceiling: 2950 },
  protein: { floor: 130 },
  fat: { floor: 75, hardFloor: 55, ceiling: 95 },
  fiber: { floor: 30, ceiling: 40 },
  satFat: { ceiling: 30 },
  // Micronutrients: floor only, no ceiling — these are adequacy targets,
  // not something you can meaningfully "overshoot" from whole foods.
  calcium: { floor: 1000 },
  iron: { floor: 8 },
  zinc: { floor: 11 },
  magnesium: { floor: 400 },
  potassium: { floor: 3400 },
  folate: { floor: 400 },
  vitA: { floor: 900 },
  vitC: { floor: 90 },
  vitD: { floor: 15 },
  b12: { floor: 2.4 },
  omega3: { floor: 500 },
};

export const DEFAULT_PROFILE = {
  name: "",
  ibsMode: true,
  autoIncludeStaples: false,
  budgetLimit: 750,
  tripDurationDays: 3.5,
  targets: DEFAULT_TARGETS,
  personal: DEFAULT_PERSONAL,
  // Freeform narrative: why the targets/modules below are shaped the way
  // they are. Not read by any app logic — it's context for a human or LLM
  // asked to revise this config later, so a re-tune doesn't have to start
  // from a blank slate or guess at intent from numbers alone.
  dietNotes:
    "Lean-bulk shopping plan: ~2700 kcal/day, high protein (130g+ floor) to " +
    "support muscle gain, moderate fat with a hard floor (55g) preserved " +
    "for hormone and fat-soluble-vitamin health, fiber targeted at 30-40g. " +
    "Built around an IBS-sensitive baseline (ibsMode on by default) — " +
    "modules favor low/moderate-FODMAP picks where possible but deliberately " +
    "keep some high-FODMAP options (fruit, legumes, wheat porridge) for " +
    "variety rather than eliminating them outright, since personal FODMAP " +
    "tolerance varies and total elimination isn't the goal. Trip cadence is " +
    "roughly every 3-4 days.",
};

// Staples (pantry basics you eat most days, not something you decide on a
// per-trip basis) are modeled as a daily consumption rate, deliberately
// decoupled from the "am I restocking this trip" cost toggle — see
// nutrition.js `staplesDailyNutrients` for why. `gramsPerDay` is a personal
// planning input (like tripDurationDays), not a nutrition fact, so it's fine
// for it to ship with a placeholder; per100g still stays null.
export const DEFAULT_STAPLES = {
  items: [
    {
      id: "staple_rice",
      name: "Rice",
      gramsPerDay: null,
      packGrams: null, // restock pack size — for a future "days of supply" read
      defaultPrice: null,
      per100g: emptyPer100g(),
    },
    {
      id: "staple_oil",
      name: "Cooking Oil",
      gramsPerDay: null,
      packGrams: null,
      defaultPrice: null,
      per100g: emptyPer100g(),
    },
    {
      id: "staple_honey",
      name: "Honey",
      gramsPerDay: null,
      packGrams: null,
      defaultPrice: null,
      per100g: emptyPer100g(),
    },
    {
      id: "staple_spices",
      name: "Spices / Seasoning",
      gramsPerDay: null,
      packGrams: null,
      defaultPrice: null,
      per100g: emptyPer100g(),
    },
  ],
};

export const DEFAULT_CATEGORIES = [
  {
    id: "protein",
    title: "Protein Base",
    description:
      "Primary protein source for the trip — drives muscle protein synthesis " +
      "during a bulk and anchors lunch/dinner. Kept mostly lean/low-FODMAP; " +
      "the omega-3 constraint exists because none of the red-meat/poultry " +
      "options here carry meaningful omega-3 on their own.",
    notes:
      "Tuna's FODMAP rating reflects the mayo/corn prep, not the fish itself " +
      "— swap the prep to drop it back to low if that's the trigger.",
    minSelection: 2,
    instruction: "Pick 2 protein packs for your {days}-day trip",
    constraints: [
      {
        type: "requireTag",
        tag: "omega-3",
        min: 1,
        message: "Add an omega-3 source — the rest of this module is lean meat with none.",
      },
    ],
    items: [
      {
        id: "chicken_breast",
        name: "Chicken Breast",
        brand: null,
        shoppingItem: "Chicken Breast Fillet (1kg)",
        qty: "1 kg",
        packGrams: 1000, // "1 kg" — direct unit conversion, not a guess
        edibleFraction: 1.0, // boneless fillet, no waste
        divisible: true, // sold loose by weight
        defaultPrice: null,
        shelfLifeDays: 2, // raw poultry, refrigerated — USDA guidance
        effort: 2,
        slots: ["lunch", "dinner"],
        fodmap: "low", // plain meat carries no FODMAPs
        tags: ["lean", "safe"],
        prep: "Pan-sear batches. Keep bland for bad IBS days.",
        per100g: emptyPer100g(),
      },
      {
        id: "minced_beef",
        name: "Lean Minced Beef",
        brand: null,
        shoppingItem: "Mafroom (Low Fat) - 750g",
        qty: "750g",
        packGrams: 750,
        edibleFraction: 1.0,
        divisible: true,
        defaultPrice: null,
        shelfLifeDays: 1, // ground meat spoils faster than whole cuts
        effort: 2,
        slots: ["lunch", "dinner"],
        fodmap: "low",
        tags: ["iron", "energy"],
        prep: "Cook with cumin/salt. Drain fat well.",
        per100g: emptyPer100g(),
      },
      {
        id: "thighs",
        name: "Chicken Thighs",
        brand: null,
        shoppingItem: "Boneless Thighs (1kg)",
        qty: "1 kg",
        packGrams: 1000,
        edibleFraction: 1.0, // boneless
        divisible: true,
        defaultPrice: null,
        shelfLifeDays: 2,
        effort: 2,
        slots: ["lunch", "dinner"],
        fodmap: "low",
        tags: ["tasty", "bulking"],
        prep: "Oven roast. High calorie density.",
        per100g: emptyPer100g(),
      },
      {
        id: "tuna_mix",
        name: "Tuna Pack",
        brand: null,
        shoppingItem: "Rio Mare Tuna (3)",
        qty: "3 Cans",
        packGrams: null, // canned product — exact drained/total weight needs the real label, not a guess
        edibleFraction: 1.0,
        divisible: false, // sealed cans, sold as a fixed 3-pack
        defaultPrice: null,
        shelfLifeDays: 365, // shelf-stable canned good
        effort: 1,
        slots: ["lunch", "dinner"],
        // Prepared with mayo + corn per the prep note; mayo/corn additions
        // push this from "plain canned fish" (low) to moderate for typical
        // FODMAP-sensitive portions. Worth the user's own verification.
        fodmap: "moderate",
        tags: ["no-cook", "omega-3"],
        prep: "Mix with corn & mayo. Zero effort.",
        per100g: emptyPer100g(),
      },
    ],
  },
  {
    id: "breakfast",
    title: "Breakfast & Carbs",
    description:
      "Carbohydrate + breakfast-protein base. Mixes fast/no-cook options " +
      "(belila, foul) with a slower complex-carb option (oats) so mornings " +
      "don't default to the highest-FODMAP items purely out of convenience.",
    notes:
      "Belila and foul are both high-FODMAP (wheat fructans / fava GOS " +
      "respectively) — if symptoms flare, lean on eggs + oats and treat the " +
      "canned options as occasional rather than daily.",
    minSelection: 2,
    instruction: "Pick at least 2 breakfast/carb sources for {days} days",
    items: [
      {
        id: "eggs_pack",
        name: "Eggs (10)",
        brand: null,
        shoppingItem: "Red/White Eggs (10 Pack)",
        qty: "1 Pack",
        packGrams: null, // egg size varies by grade/brand — needs a real weigh-in, not an assumed average
        edibleFraction: 1.0, // shell not included in purchased/edible weight once cracked for cooking
        divisible: false, // bought as a fixed 10-pack
        defaultPrice: null,
        shelfLifeDays: 21, // refrigerated shell eggs, USDA guidance ~3-5 weeks
        effort: 2,
        slots: ["breakfast", "snack"],
        fodmap: "low",
        tags: ["essential", "gold"],
        prep: "Boil 10 at a time.",
        per100g: emptyPer100g(),
      },
      {
        id: "oats_bundle",
        name: "Oats & LF Milk",
        brand: null,
        shoppingItem: "Milkman Lactose-Free + Oats",
        qty: "Bundle",
        // A genuine two-food bundle deal (one SKU/price, two different
        // foods) — modeled as `parts` instead of a single per100g so nobody
        // is tempted to hand-blend a fake combined composition. Component
        // pack sizes still need the real split once known.
        divisible: false,
        defaultPrice: null,
        shelfLifeDays: 7, // bundle shelf life is governed by the milk, not the shelf-stable oats
        effort: 1,
        slots: ["breakfast"],
        fodmap: "moderate", // oats portion + lactose-free milk; verify at your usual serving size
        tags: ["fiber", "heart"],
        prep: "Overnight oats. Add your pantry Honey.",
        parts: [
          { label: "Oats", packGrams: null, edibleFraction: 1.0, per100g: emptyPer100g() },
          { label: "Lactose-Free Milk", packGrams: null, edibleFraction: 1.0, per100g: emptyPer100g() },
        ],
      },
      {
        id: "belila_bundle",
        name: "Belila Warm-Up",
        brand: null,
        shoppingItem: "Harvest Belila (2 cans)",
        qty: "2 Cans",
        packGrams: null,
        edibleFraction: 1.0,
        divisible: false,
        defaultPrice: null,
        shelfLifeDays: 365,
        effort: 1,
        slots: ["breakfast"],
        // Wheat-based porridge — wheat fructans are a well-documented
        // high-FODMAP trigger at a typical bowl-sized serving.
        fodmap: "high",
        tags: ["comfort", "fast"],
        prep: "Heat in microwave.",
        per100g: emptyPer100g(),
      },
      {
        id: "foul_cans",
        name: "Foul Medames",
        brand: null,
        shoppingItem: "Harvest Foul (2)",
        qty: "2 Cans",
        packGrams: null,
        edibleFraction: 1.0,
        divisible: false,
        defaultPrice: null,
        shelfLifeDays: 365,
        effort: 1,
        slots: ["breakfast"],
        // Fava beans are a classic high-FODMAP legume (GOS); rinsing (per
        // the prep note) reduces but doesn't eliminate this.
        fodmap: "high",
        tags: ["slow-carb"],
        prep: "Rinse well (IBS).",
        per100g: emptyPer100g(),
      },
    ],
  },
  {
    id: "produce",
    title: "Fresh & Vitality",
    description:
      "Fiber, micronutrients, and hydration. Deliberately excludes onion/" +
      "garlic bulbs (classic high-FODMAP triggers) and keeps a mix of low- " +
      "and higher-FODMAP fruit so the module isn't only 'safe' foods with " +
      "no variety.",
    notes:
      "Apples are high-FODMAP — included for fiber/variety but portion-" +
      "sensitive; bananas' FODMAP load depends heavily on ripeness.",
    minSelection: 2,
    instruction: "Pick 2 types of fresh produce for {days} days",
    items: [
      {
        id: "apples",
        name: "Apples",
        brand: null,
        shoppingItem: "Apples (1kg)",
        qty: "1 kg",
        packGrams: 1000,
        // Placeholder — apple core/stem waste is real (~5-10%) but needs a
        // proper refuse-table value, not a guess. Review alongside macros.
        edibleFraction: 1.0,
        divisible: true,
        defaultPrice: null,
        shelfLifeDays: 7,
        effort: 1,
        slots: ["snack"],
        // Classic high-FODMAP fruit (excess fructose + sorbitol).
        fodmap: "high",
        tags: ["fiber"],
        prep: "Peel skin if bloated. Keep on counter.",
        per100g: emptyPer100g(),
      },
      {
        id: "bananas_kg",
        name: "Bananas",
        brand: null,
        shoppingItem: "Bananas (1kg)",
        qty: "1 kg",
        packGrams: 1000,
        // Placeholder — sold/weighed with peel on; peel is ~30-35% of mass
        // and inedible. Needs a real refuse-table value, not a guess here.
        edibleFraction: 1.0,
        divisible: true,
        defaultPrice: null,
        shelfLifeDays: 5,
        effort: 1,
        slots: ["snack"],
        // Ripe, small portions are low; ripeness and portion size move this
        // quickly — flagged moderate so the user checks their usual serving.
        fodmap: "moderate",
        tags: ["potassium"],
        prep: "Counter top visibility.",
        per100g: emptyPer100g(),
      },
      {
        id: "citrus_kg",
        name: "Tangerines",
        brand: null,
        shoppingItem: "Tangerines (1kg)",
        qty: "1 kg",
        packGrams: 1000,
        // Placeholder — peel discarded; needs a real refuse-table value.
        edibleFraction: 1.0,
        divisible: true,
        defaultPrice: null,
        shelfLifeDays: 10,
        effort: 1,
        slots: ["snack"],
        fodmap: "low",
        tags: ["vit-c"],
        prep: "Snack with Iron sources.",
        per100g: emptyPer100g(),
      },
      {
        id: "veg_mix",
        name: "Veg Salad Base",
        brand: null,
        shoppingItem: "Cucumber + Peppers + Tomatoes",
        qty: "2 kg mix",
        // Unlike oats_bundle, this isn't a fixed-ratio retail SKU — it's
        // loose produce bought by total weight where the mix ratio varies
        // trip to trip. A single per100g (once entered) should reflect your
        // typical blend rather than forcing an assumed 3-way split.
        packGrams: 2000,
        edibleFraction: 1.0,
        divisible: true,
        defaultPrice: null,
        shelfLifeDays: 5,
        effort: 1,
        slots: ["lunch", "dinner", "snack"],
        // Cucumber, pepper, tomato are all low-FODMAP; onion bulbs already
        // excluded per the prep note (green tops only).
        fodmap: "low",
        tags: ["hydration"],
        prep: "Wash immediately. Use green onion tops only.",
        per100g: emptyPer100g(),
      },
    ],
  },
  {
    id: "gut",
    title: "Gut Shield",
    description:
      "Probiotic / digestive-support module, sized at just 1 pick since " +
      "it's a supplement to digestion rather than a calorie source.",
    notes:
      "Rayeb is not lactose-free — if lactose is a confirmed personal " +
      "trigger, prefer yogurt (explicitly LF) as the default pick.",
    minSelection: 1,
    instruction: "Essential for IBS — pick at least 1 for {days} days",
    items: [
      {
        id: "rayeb",
        name: "Rayeb",
        brand: null,
        shoppingItem: "Juhayna Rayeb (3)",
        qty: "3 Bottles",
        packGrams: null, // bottle size needs the real label
        edibleFraction: 1.0,
        divisible: false,
        defaultPrice: null,
        shelfLifeDays: 14,
        effort: 1,
        slots: ["snack", "breakfast"],
        // Fermented but not lactose-free — moderate lactose load remains.
        fodmap: "moderate",
        tags: ["probiotic"],
        prep: "Digestive aid.",
        per100g: emptyPer100g(),
      },
      {
        id: "yogurt",
        name: "Yogurt LF",
        brand: null,
        shoppingItem: "Lactose-Free Yogurt (4)",
        qty: "4 Cups",
        packGrams: null,
        edibleFraction: 1.0,
        divisible: false,
        defaultPrice: null,
        shelfLifeDays: 14,
        effort: 1,
        slots: ["snack"],
        fodmap: "low", // explicitly lactose-free
        tags: ["light"],
        prep: "Snack.",
        per100g: emptyPer100g(),
      },
    ],
  },
];
