// src/data.js

export const DEFAULT_CONFIG = {
  budgetLimit: 750, 
  targetDailyCalories: 2700,
  targetDailyProtein: 140, 
  tripDurationDays: 3.5, 
  ibsMode: true, // Default to strict
};

export const STAPLES = {
  cost: 250,
  calories: 1100,
  protein: 12
};

export const DEFAULT_CATEGORIES = [
  {
    id: "protein",
    title: "Protein Base",
    minSelection: 2, 
    instruction: "Pick 2 packs for 3.5 days",
    items: [
      {
        id: "chicken_breast",
        name: "Chicken Breast",
        qty: "1 kg",
        defaultPrice: 265, // Changed from 'price' to 'defaultPrice'
        calories: 1650, 
        protein: 310,   
        tags: ["Lean", "Safe"],
        shoppingItem: "Chicken Breast Fillet (1kg)",
        prep: "Pan-sear batches. Keep bland for bad IBS days."
      },
      {
        id: "minced_beef",
        name: "Lean Minced Beef",
        qty: "750g",
        defaultPrice: 240, 
        calories: 1875,
        protein: 190,
        tags: ["Iron", "Energy"],
        shoppingItem: "Mafroom (Low Fat) - 750g",
        prep: "Cook with cumin/salt. Drain fat well."
      },
      {
        id: "thighs",
        name: "Chicken Thighs",
        qty: "1 kg",
        defaultPrice: 250, 
        calories: 2090,
        protein: 260,
        tags: ["Tasty", "Bulking"],
        shoppingItem: "Boneless Thighs (1kg)",
        prep: "Oven roast. High calorie density."
      },
      {
        id: "tuna_mix",
        name: "Tuna Pack",
        qty: "3 Cans",
        defaultPrice: 180, 
        calories: 600,
        protein: 90,
        tags: ["No Cook", "Omega-3"],
        shoppingItem: "Rio Mare Tuna (3)",
        prep: "Mix with corn & mayo. Zero effort."
      },
    ],
  },
  {
    id: "breakfast",
    title: "Breakfast & Carbs",
    minSelection: 2,
    instruction: "Pick at least 1 Breakfast source",
    items: [
      {
        id: "eggs_pack",
        name: "Eggs (10)",
        qty: "1 Pack",
        defaultPrice: 65, 
        calories: 700,
        protein: 60,
        tags: ["Essential", "Gold"],
        shoppingItem: "Red/White Eggs (10 Pack)",
        prep: "Boil 10 at a time."
      },
      {
        id: "oats_bundle",
        name: "Oats & LF Milk",
        qty: "Bundle",
        defaultPrice: 130,
        calories: 1400, 
        protein: 60,
        tags: ["Fiber", "Heart"],
        shoppingItem: "Milkman Lactose-Free + Oats",
        prep: "Overnight oats. Add your pantry Honey."
      },
      {
        id: "belila_bundle",
        name: "Belila Warm-Up",
        qty: "2 Cans",
        defaultPrice: 50,
        calories: 400, 
        protein: 15,
        tags: ["Comfort", "Fast"],
        shoppingItem: "Harvest Belila (2 cans)",
        prep: "Heat in microwave."
      },
      {
        id: "foul_cans",
        name: "Foul Medames",
        qty: "2 Cans",
        defaultPrice: 50,
        calories: 350,
        protein: 24,
        tags: ["Slow Carb"],
        shoppingItem: "Harvest Foul (2)",
        prep: "Rinse well (IBS)."
      }
    ],
  },
  {
    id: "produce",
    title: "Fresh & Vitality",
    minSelection: 2,
    instruction: "Pick 2 types of fresh food",
    items: [
      {
        id: "apples",
        name: "Apples",
        qty: "1 kg",
        defaultPrice: 110,
        calories: 520,
        protein: 3,
        tags: ["Fiber"],
        shoppingItem: "Apples (1kg)",
        prep: "Peel skin if bloated. Keep on counter."
      },
      {
        id: "bananas_kg",
        name: "Bananas",
        qty: "1 kg",
        defaultPrice: 45,
        calories: 900,
        protein: 10,
        tags: ["Potassium"],
        shoppingItem: "Bananas (1kg)",
        prep: "Counter top visibility."
      },
      {
        id: "citrus_kg",
        name: "Tangerines",
        qty: "1 kg",
        defaultPrice: 30,
        calories: 500,
        protein: 8,
        tags: ["Vit C"],
        shoppingItem: "Tangerines (1kg)",
        prep: "Snack with Iron sources."
      },
      {
        id: "veg_mix",
        name: "Veg Salad Base",
        qty: "2 kg mix",
        defaultPrice: 75,
        calories: 100,
        protein: 5,
        tags: ["Hydration"],
        shoppingItem: "Cucumber + Peppers + Tomatoes",
        prep: "Wash immediately. Use green onion tops only."
      },
    ],
  },
  {
    id: "gut",
    title: "Gut Shield",
    minSelection: 1,
    instruction: "Essential for IBS",
    items: [
      {
        id: "rayeb",
        name: "Rayeb",
        qty: "3 Bottles",
        defaultPrice: 90,
        calories: 510,
        protein: 27,
        tags: ["Probiotic"],
        shoppingItem: "Juhayna Rayeb (3)",
        prep: "Digestive aid."
      },
      {
        id: "yogurt",
        name: "Yogurt LF",
        qty: "4 Cups",
        defaultPrice: 80, 
        calories: 400,
        protein: 20,
        tags: ["Light"],
        shoppingItem: "Lactose-Free Yogurt (4)",
        prep: "Snack."
      },
    ],
  },
];